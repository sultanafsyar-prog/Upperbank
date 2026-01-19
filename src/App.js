import React, { useState, useEffect, useCallback } from 'react';
import PocketBase from 'pocketbase';
import * as XLSX from 'xlsx';

const pb = new PocketBase('https://upperbank-production-c0b5.up.railway.app');

const DAFTAR_RAK = ["A-01", "A-02", "A-03", "A-04", "B-01", "B-02", "B-03", "B-04", "C-01", "C-02", "C-03", "C-04"];

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(pb.authStore.isValid);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [inventory, setInventory] = useState([]);
  const [rawRecords, setRawRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  
  const [formData, setFormData] = useState({
    spk_number: '', style_name: '', size: '', qty: 0, target_qty: 0,
    xfd_date: '', type: 'IN', source_dest: '', rack: '', operator: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await pb.collection('users').authWithPassword(loginEmail, loginPassword);
      setIsLoggedIn(true);
      fetchData();
    } catch (err) {
      alert("⚠️ LOGIN GAGAL!");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const allRecords = await pb.collection('upper_stock').getFullList({ sort: 'created', requestKey: null });
      setRawRecords(allRecords);
      
      const summary = allRecords.reduce((acc, curr) => {
        const key = `${curr.spk_number}-${curr.size}-${curr.rack_location}`;

        if (!acc[key]) {
          acc[key] = {
            spk: curr.spk_number, style: curr.style_name, size: curr.size,
            rack: curr.rack_location, stock: 0, target: 0, xfd: '',
            last_to: '', last_out_created: ''
          };
        }

        const qIn = Number(curr.qty_in || 0);
        const qOut = Number(curr.qty_out || 0);
        acc[key].stock += (qIn - qOut);
        
        if (Number(curr.target_qty) > 0) acc[key].target = Number(curr.target_qty);
        if (curr.xfd_date) acc[key].xfd = curr.xfd_date;

        if (qOut > 0 && curr.destination) {
          if (!acc[key].last_out_created || curr.created > acc[key].last_out_created) {
            acc[key].last_out_created = curr.created;
            acc[key].last_to = curr.destination;
          }
        }
        return acc;
      }, {});

      setInventory(Object.values(summary).filter(i => i.stock > 0));
    } catch (error) { console.error(error); }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
      const unsub = pb.collection('upper_stock').subscribe('*', () => fetchData());
      return () => { unsub.then(f => f()); };
    }
  }, [fetchData, isLoggedIn]);

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        setLoading(true);
        const waktuLokal = `${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
        
        for (const row of data) {
          await pb.collection('upper_stock').create({
            spk_number: String(row.SPK || '').toUpperCase(),
            style_name: String(row.STYLE || '').toUpperCase(),
            size: String(row.SIZE || ''),
            qty_in: Number(row.QTY_IN || 0),
            qty_out: Number(row.QTY_OUT || 0),
            target_qty: Number(row.TARGET || 0),
            xfd_date: String(row.XFD || ''),
            rack_location: String(row.RACK || ''),
            source_from: String(row.SOURCE || ''),
            destination: String(row.DESTINATION || ''),
            operator: String(row.OPERATOR || 'IMPORT'),
            waktu_input: waktuLokal
          });
        }
        alert("✅ Import Berhasil!");
        fetchData();
      } catch (err) { alert("❌ Gagal Import!"); } finally { setLoading(false); e.target.value = null; }
    };
    reader.readAsBinaryString(file);
  };

  const executeExport = (type) => {
    let data = rawRecords;
    if (type === 'HARI_INI') {
      const todayStr = new Date().toLocaleDateString('id-ID').replace(/\//g, '-');
      data = rawRecords.filter(r => r.waktu_input?.startsWith(todayStr));
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, "Laporan_Stok.xlsx");
    setShowExportModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const waktuLokal = `${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    try {
      await pb.collection('upper_stock').create({
        ...formData,
        spk_number: formData.spk_number.toUpperCase(),
        qty_in: formData.type === 'IN' ? Number(formData.qty) : 0,
        qty_out: formData.type === 'OUT' ? Number(formData.qty) : 0,
        source_from: formData.type === 'IN' ? formData.source_dest : '',
        destination: formData.type === 'OUT' ? formData.source_dest : '',
        rack_location: formData.rack,
        waktu_input: waktuLokal
      });
      alert("✅ Berhasil!");
      setFormData({ ...formData, spk_number: '', style_name: '', qty: 0, target_qty: 0, xfd_date: '' });
    } catch (err) { alert("❌ Gagal!"); } finally { setIsSubmitting(false); }
  };

  if (!isLoggedIn) return (
    <div style={s.modalOverlay}><div style={s.modalContent}>
      <h2>LOGIN SYSTEM</h2>
      <form onSubmit={handleLogin} style={{display:'flex', flexDirection:'column', gap:10}}>
        <input style={s.input} type="email" placeholder="Email" onChange={e => setLoginEmail(e.target.value)} required />
        <input style={s.input} type="password" placeholder="Password" onChange={e => setLoginPassword(e.target.value)} required />
        <button type="submit" style={{...s.btn, background:'#1a237e'}}>MASUK</button>
      </form>
    </div></div>
  );

  return (
    <div style={{ background: '#f4f7f6', minHeight: '100vh', padding: '20px' }}>
      {showExportModal && (
        <div style={s.modalOverlay}><div style={s.modalContent}>
          <h3>Export Excel</h3>
          <button onClick={() => executeExport('HARI_INI')} style={s.btn}>HARI INI</button>
          <button onClick={() => executeExport('SEMUA')} style={{...s.btn, background:'#2ecc71', marginLeft:10}}>SEMUA</button>
          <button onClick={() => setShowExportModal(false)} style={{...s.btn, background:'#666', marginLeft:10}}>BATAL</button>
        </div></div>
      )}

      <nav style={{ background: '#1a237e', color: 'white', padding: 15, borderRadius: 10, display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2>STOCK ADMIN</h2>
        <div>
          <label style={{ ...s.btn, background: '#27ae60', cursor: 'pointer', marginRight: 10 }}>
            {loading ? "PROSES..." : "IMPORT"}
            <input type="file" hidden onChange={handleImportExcel} />
          </label>
          <button onClick={() => setShowExportModal(true)} style={{...s.btn, background:'#3498db'}}>EXPORT</button>
        </div>
      </nav>

      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: '1', background: 'white', padding: 20, borderRadius: 12 }}>
          <h3>Input Transaksi</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{display:'flex', gap:5}}>
              <button type="button" onClick={() => setFormData({...formData, type:'IN'})} style={{flex:1, background:formData.type==='IN'?'#2ecc71':'#eee'}}>IN</button>
              <button type="button" onClick={() => setFormData({...formData, type:'OUT'})} style={{flex:1, background:formData.type==='OUT'?'#e74c3c':'#eee'}}>OUT</button>
            </div>
            <input style={s.input} placeholder="Nomor SPK" value={formData.spk_number} onChange={e => setFormData({ ...formData, spk_number: e.target.value })} required />
            <input style={s.input} placeholder="Target Qty" type="number" value={formData.target_qty} onChange={e => setFormData({ ...formData, target_qty: e.target.value })} />
            <input style={s.input} placeholder="XFD Date (e.g. 25 Jan)" value={formData.xfd_date} onChange={e => setFormData({ ...formData, xfd_date: e.target.value })} />
            <input style={s.input} placeholder="Jumlah Pasang" type="number" value={formData.qty} onChange={e => setFormData({ ...formData, qty: e.target.value })} required />
            <select style={s.input} value={formData.rack} onChange={e => setFormData({ ...formData, rack: e.target.value })} required>
              <option value="">-- Pilih Rak --</option>
              {DAFTAR_RAK.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <input style={s.input} placeholder="Asal/Tujuan" value={formData.source_dest} onChange={e => setFormData({ ...formData, source_dest: e.target.value })} required />
            <input style={s.input} placeholder="Operator" value={formData.operator} onChange={e => setFormData({ ...formData, operator: e.target.value })} required />
            <button type="submit" style={{ ...s.btn, background: '#1a237e' }}>SIMPAN</button>
          </form>
        </div>

        <div style={{ flex: '2', background: 'white', padding: 20, borderRadius: 12 }}>
          <input style={{ width: '100%', padding: 10, marginBottom: 15 }} placeholder="Cari SPK/Rak..." onChange={e => setSearchTerm(e.target.value.toUpperCase())} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 15 }}>
            {DAFTAR_RAK.map(rack => {
              const items = inventory.filter(i => i.rack === rack && (i.spk.includes(searchTerm) || rack.includes(searchTerm)));
              if (items.length === 0) return null;
              return (
                <div key={rack} style={{ border: '1px solid #eee', padding: 10, borderRadius: 10, background: '#fcfcfc' }}>
                  <h4 style={{ margin: '0 0 10px 0', borderBottom: '2px solid #3498db' }}>{rack}</h4>
                  {items.map((it, idx) => (
                    <div key={idx} style={{ fontSize: 12, marginBottom: 8, padding: 5, background: 'white', borderRadius: 5, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                      <strong>{it.spk}</strong> <br/>
                      Stok: {it.stock}/{it.target} | <span style={{color:'#e67e22'}}>{it.xfd}</span><br/>
                      <small style={{color:'#3498db'}}>To: {it.last_to || '-'}</small>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  input: { padding: '10px', borderRadius: '5px', border: '1px solid #ccc' },
  btn: { padding: '10px 20px', border: 'none', borderRadius: '5px', color: 'white', fontWeight: 'bold', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { background: 'white', padding: '40px', borderRadius: '15px', textAlign: 'center' }
};

export default App;