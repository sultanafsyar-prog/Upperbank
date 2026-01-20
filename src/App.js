import React, { useState, useEffect, useCallback } from 'react';
import PocketBase from 'pocketbase';
import * as XLSX from 'xlsx';

const pb = new PocketBase('https://upperbank-production-c0b5.up.railway.app');

// Konfigurasi Rak Baru Vertikal
const HURUF_RAK = ["I", "H", "F", "E", "D"];
const NOMOR_RAK = ["01", "02", "03", "04", "05", "06"];
const DAFTAR_RAK = HURUF_RAK.flatMap(h => NOMOR_RAK.map(n => `${h}-${n}`));

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(pb.authStore.isValid);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState('ADMIN');

  const [inventory, setInventory] = useState([]);
  const [rawRecords, setRawRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);

  const [formData, setFormData] = useState({
    spk_number: '', style_name: '', size: '', qty: 0, target_qty: 0,
    xfd_date: '', type: 'IN', source_dest: '', rack: '', operator: ''
  });

  const fetchData = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await pb.collection('upper_stock').getList(1, 50, { sort: '-created', requestKey: null });
      setRawRecords(res.items);

      const allRecords = await pb.collection('upper_stock').getFullList({ sort: 'created', requestKey: null });
      const summary = allRecords.reduce((acc, curr) => {
        const key = `${curr.spk_number}-${curr.size}-${curr.rack_location}`;
        if (!acc[key]) {
          acc[key] = {
            spk: curr.spk_number, style: curr.style_name, size: curr.size,
            rack: curr.rack_location, stock: 0, target: 0, xfd: '', last_to: ''
          };
        }
        const qIn = Number(curr.qty_in || 0);
        const qOut = Number(curr.qty_out || 0);
        acc[key].stock += (qIn - qOut);
        if (Number(curr.target_qty) > 0) acc[key].target = Number(curr.target_qty);
        if (curr.xfd_date) acc[key].xfd = curr.xfd_date;
        if (qOut > 0 && curr.destination) acc[key].last_to = curr.destination;
        return acc;
      }, {});
      setInventory(Object.values(summary).filter(i => i.stock > 0));
    } catch (error) { console.error("Sync Error:", error); }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
      const unsub = pb.collection('upper_stock').subscribe('*', () => fetchData());
      return () => { unsub.then(f => f()); };
    }
  }, [fetchData, isLoggedIn]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await pb.collection('users').authWithPassword(loginEmail, loginPassword);
      setIsLoggedIn(true);
    } catch (err) { alert("⚠️ LOGIN GAGAL!"); } finally { setLoading(false); }
  };

  const handleResetDatabase = async () => {
    const pass = window.prompt("Ketik 'KONFIRMASI' untuk menghapus SEMUA data:");
    if (pass !== "KONFIRMASI") return alert("Dibatalkan.");
    setLoading(true);
    try {
      const records = await pb.collection('upper_stock').getFullList({ fields: 'id' });
      await Promise.all(records.map(r => pb.collection('upper_stock').delete(r.id)));
      alert("✅ Database Bersih!");
      fetchData();
    } catch (err) { alert("Gagal Reset."); } finally { setLoading(false); }
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
      setFormData({ ...formData, spk_number: '', style_name: '', qty: 0, target_qty: 0, xfd_date: '', source_dest: '' });
      alert("✅ Berhasil!");
    } catch (err) { alert("❌ Gagal!"); } finally { setIsSubmitting(false); }
  };

  const exportToXLSX = (data, name) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${name}.xlsx`);
  };

  if (!isLoggedIn) return (
    <div style={s.modalOverlay}><div style={s.modalContent}>
      <h2>LOGIN SYSTEM</h2>
      <form onSubmit={handleLogin} style={{display:'flex', flexDirection:'column', gap:10}}>
        <input style={s.input} type="email" placeholder="Email" onChange={e => setLoginEmail(e.target.value)} required />
        <input style={s.input} type="password" placeholder="Password" onChange={e => setLoginPassword(e.target.value)} required />
        <button type="submit" style={{...s.btn, background:'#1a237e'}} disabled={loading}>{loading ? 'LOADING...' : 'MASUK'}</button>
      </form>
    </div></div>
  );

  if (viewMode === 'TV') return (
    <div style={{ background: '#050714', minHeight: '100vh', padding: '15px', color: 'white', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #3498db', paddingBottom: '10px' }}>
        <h1 style={{ margin: 0, color: '#3498db', letterSpacing: '2px' }}>STOCK MONITOR (RAK I-D)</h1>
        <button onClick={() => setViewMode('ADMIN')} style={{ ...s.btn, background: '#e74c3c' }}>EXIT</button>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
        <div style={{ flex: 4, display: 'grid', gridTemplateColumns: `repeat(5, 1fr)`, gap: '10px' }}>
          {HURUF_RAK.map(h => (
            <div key={h} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ background: '#3498db', color: 'black', textAlign: 'center', fontWeight: 'bold', padding: '5px', borderRadius: '4px' }}>RAK {h}</div>
              {NOMOR_RAK.map(n => {
                const r = `${h}-${n}`;
                const items = inventory.filter(i => i.rack === r);
                const total = items.reduce((a, b) => a + b.stock, 0);
                return (
                  <div key={r} style={{ background: '#161b22', padding: '10px', borderRadius: '8px', border: total > 0 ? '1px solid #3498db' : '1px solid #333', minHeight: '100px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333' }}>
                      <span style={{ color: '#3498db', fontWeight: 'bold' }}>{r}</span>
                      <span>{total}</span>
                    </div>
                    {items.map((it, idx) => (
                      <div key={idx} style={{ fontSize: '10px', marginTop: '4px' }}>
                        {it.spk} ({it.stock}) <br/> <span style={{color:'#e67e22'}}>XFD: {it.xfd}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ flex: 1, background: '#161b22', padding: '10px', borderRadius: '8px', height: '85vh', overflowY: 'auto' }}>
          <h4 style={{ textAlign: 'center', color: '#3498db', marginTop: 0 }}>LIVE ACTIVITY</h4>
          {rawRecords.map((log, i) => (
            <div key={i} style={{ fontSize: '10px', padding: '5px', borderBottom: '1px solid #333' }}>
              <b style={{ color: log.qty_in > 0 ? '#2ecc71' : '#e74c3c' }}>{log.qty_in > 0 ? 'IN' : 'OUT'}</b> | {log.spk_number} | {log.rack_location}
              <div style={{ color: '#666' }}>{log.waktu_input}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#f4f7f6', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <nav style={{ background: '#1a237e', color: 'white', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{margin:0}}>SUPERMARKET STOCK</h2>
        <div>
          <button onClick={() => setViewMode('TV')} style={{ ...s.btn, background: '#8e44ad', marginRight: 10 }}>DASHBOARD TV</button>
          <button onClick={() => setShowExportModal(true)} style={{ ...s.btn, background: '#16a085' }}>MENU DATA</button>
          <button onClick={() => { pb.authStore.clear(); setIsLoggedIn(false); }} style={{ ...s.btn, background: '#e74c3c', marginLeft: 10 }}>LOGOUT</button>
        </div>
      </nav>

      {showExportModal && (
        <div style={s.modalOverlay}>
          <div style={s.modalContent}>
            <h3>PENGATURAN DATA</h3>
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
              <button onClick={() => exportToXLSX(inventory, 'Inventory_Summary')} style={{...s.btn, background:'#1a237e'}}>Export Summary</button>
              <button onClick={() => exportToXLSX(rawRecords, 'Raw_Transaction')} style={{...s.btn, background:'#8e44ad'}}>Export History</button>
              <hr/>
              <button onClick={handleResetDatabase} style={{...s.btn, background:'#c0392b'}}>⚠️ RESET DATABASE</button>
              <button onClick={() => setShowExportModal(false)} style={{...s.btn, background:'#95a5a6'}}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1, background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
          <h3>Input Transaksi</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{display:'flex', gap:5}}>
              <button type="button" onClick={() => setFormData({...formData, type:'IN'})} style={{flex:1, padding:10, background:formData.type==='IN'?'#2ecc71':'#eee', borderRadius:5, border:'none', color:formData.type==='IN'?'white':'black'}}>IN</button>
              <button type="button" onClick={() => setFormData({...formData, type:'OUT'})} style={{flex:1, padding:10, background:formData.type==='OUT'?'#e74c3c':'#eee', borderRadius:5, border:'none', color:formData.type==='OUT'?'white':'black'}}>OUT</button>
            </div>
            <input style={s.input} placeholder="Nomor SPK" value={formData.spk_number} onChange={e => setFormData({ ...formData, spk_number: e.target.value.toUpperCase() })} required />
            <div style={{display:'flex', gap:5}}>
              <input style={{...s.input, flex:1}} placeholder="Target" type="number" value={formData.target_qty || ''} onChange={e => setFormData({...formData, target_qty: e.target.value})} />
              <input style={{...s.input, flex:1}} type="date" value={formData.xfd_date} onChange={e => setFormData({...formData, xfd_date: e.target.value})} />
            </div>
            <input style={s.input} placeholder="Qty Transaksi" type="number" value={formData.qty || ''} onChange={e => setFormData({ ...formData, qty: e.target.value })} required />
            <select style={s.input} value={formData.rack} onChange={e => setFormData({ ...formData, rack: e.target.value })} required>
              <option value="">Pilih Rak</option>
              {DAFTAR_RAK.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <input style={s.input} placeholder="Operator" value={formData.operator} onChange={e => setFormData({ ...formData, operator: e.target.value })} required />
            <button type="submit" style={{ ...s.btn, background: '#1a237e', padding: 15 }}>{isSubmitting ? 'MENYIMPAN...' : 'SIMPAN DATA'}</button>
          </form>
        </div>

        <div style={{ flex: 2.5 }}>
          <input style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ccc' }} placeholder="Cari SPK di rak..." onChange={e => setSearchTerm(e.target.value.toUpperCase())} />
          <div style={{ display: 'flex', gap: '10px' }}>
            {HURUF_RAK.map(h => (
              <div key={h} style={{ flex: 1 }}>
                <div style={{ textAlign: 'center', background: '#f8f9fa', padding: '5px', fontWeight: 'bold', border: '1px solid #ddd' }}>{h}</div>
                {NOMOR_RAK.map(n => {
                  const r = `${h}-${n}`;
                  const items = inventory.filter(it => it.rack === r && it.spk.includes(searchTerm));
                  const total = items.reduce((a, b) => a + b.stock, 0);
                  return (
                    <div key={r} style={{ padding: '8px', border: '1px solid #eee', marginTop: '5px', background: total > 0 ? '#e3f2fd' : 'white', borderRadius: '4px', fontSize:'11px' }}>
                      <b>{r} ({total})</b>
                      {items.map((it, idx) => <div key={idx}>• {it.spk} ({it.stock})</div>)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  input: { padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '13px' },
  btn: { padding: '10px 15px', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { background: 'white', padding: '30px', borderRadius: '15px', textAlign: 'center', minWidth:300 }
};

export default App;