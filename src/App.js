import React, { useState, useEffect, useCallback } from 'react';
import PocketBase from 'pocketbase';
import * as XLSX from 'xlsx';

const pb = new PocketBase('https://upperbank-production-c0b5.up.railway.app');

// Konfigurasi Rak I-D (01-06)
const HURUF_RAK = ["I", "H", "F", "E", "D"];
const NOMOR_RAK = ["01", "02", "03", "04", "05", "06"];
const DAFTAR_RAK_FULL = HURUF_RAK.flatMap(h => NOMOR_RAK.map(n => `${h}-${n}`));

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(pb.authStore.isValid);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loading, setLoading] = useState(false); // Digunakan di tombol Login
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
            spk: curr.spk_number, 
            style: curr.style_name || '-', 
            size: curr.size || '-',
            rack: curr.rack_location, 
            stock: 0, 
            target: 0, 
            xfd: '', 
            last_to: '' 
          };
        }
        
        const qIn = Number(curr.qty_in || 0);
        const qOut = Number(curr.qty_out || 0);
        acc[key].stock += (qIn - qOut);
        
        if (Number(curr.target_qty) > 0) acc[key].target = Number(curr.target_qty);
        if (curr.xfd_date) acc[key].xfd = curr.xfd_date;
        if (qOut > 0) acc[key].last_to = curr.destination; // Ambil tujuan terakhir
        
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const waktu = `${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    try {
      await pb.collection('upper_stock').create({
        spk_number: formData.spk_number.toUpperCase(),
        style_name: formData.style_name.toUpperCase(),
        size: formData.size,
        qty_in: formData.type === 'IN' ? Number(formData.qty) : 0,
        qty_out: formData.type === 'OUT' ? Number(formData.qty) : 0,
        target_qty: Number(formData.target_qty),
        xfd_date: formData.xfd_date,
        source_from: formData.type === 'IN' ? formData.source_dest : '',
        destination: formData.type === 'OUT' ? formData.source_dest : '',
        rack_location: formData.rack,
        operator: formData.operator,
        waktu_input: waktu
      });
      alert("✅ Berhasil!");
      setFormData({ ...formData, spk_number: '', style_name: '', size: '', qty: 0, target_qty: 0, xfd_date: '', source_dest: '' });
    } catch (err) { alert("❌ Gagal Simpan!"); } finally { setIsSubmitting(false); }
  };

  const exportToXlsx = (rows, fileName) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  if (!isLoggedIn) return (
    <div style={s.modalOverlay}><div style={s.modalContent}>
      <h2>LOGIN SYSTEM</h2>
      <h4>PT DIAMOND INTERNATIONAL INDONESIA</h4>
      <form onSubmit={handleLogin} style={{display:'flex', flexDirection:'column', gap:10}}>
        <input style={s.input} type="email" placeholder="Email" onChange={e => setLoginEmail(e.target.value)} required />
        <input style={s.input} type="password" placeholder="Password" onChange={e => setLoginPassword(e.target.value)} required />
        <button type="submit" style={{...s.btn, background:'#1a237e'}}>
          {loading ? 'SABAR...' : 'MASUK'} 
        </button>
      </form>
    </div></div>
  );

  return (
    <div style={{ background: '#f4f7f6', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <nav style={{ background: '#1a237e', color: 'white', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}><img src="/logo.png" alt="Supermarket Icon" style={{ width: 30, height: 30, marginRight: 10 }} /> SUPERMARKET CONTROL TRANSACTION</h2>
        <div>
          <button onClick={() => setViewMode(viewMode === 'ADMIN' ? 'TV' : 'ADMIN')} style={{ ...s.btn, background: '#8e44ad', marginRight: 10 }}>MODE {viewMode === 'ADMIN' ? 'TV' : 'ADMIN'}</button>
          <button onClick={() => setShowExportModal(true)} style={{ ...s.btn, background: '#16a085' }}>EXPORT XLSX</button>
        </div>
      </nav>

      {viewMode === 'ADMIN' ? (
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1, background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
            <h3>Input Transaksi</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{display:'flex', gap:5}}>
                <button type="button" onClick={() => setFormData({...formData, type:'IN'})} style={{flex:1, padding:10, background:formData.type==='IN'?'#2ecc71':'#eee', color:formData.type==='IN'?'white':'black', border:'none', borderRadius:5}}>IN</button>
                <button type="button" onClick={() => setFormData({...formData, type:'OUT'})} style={{flex:1, padding:10, background:formData.type==='OUT'?'#e74c3c':'#eee', color:formData.type==='OUT'?'white':'black', border:'none', borderRadius:5}}>OUT</button>
              </div>
              <input style={s.input} placeholder="Nomor SPK" value={formData.spk_number} onChange={e => setFormData({ ...formData, spk_number: e.target.value.toUpperCase() })} required />
              <input style={s.input} placeholder="Style / Artikel" value={formData.style_name} onChange={e => setFormData({ ...formData, style_name: e.target.value.toUpperCase() })} />
              <div style={{display:'flex', gap:5}}>
                <input style={{...s.input, flex:1}} placeholder="Size" value={formData.size} onChange={e => setFormData({ ...formData, size: e.target.value })} required />
                <input style={{...s.input, flex:1}} placeholder="Target" type="number" value={formData.target_qty || ''} onChange={e => setFormData({ ...formData, target_qty: e.target.value })} />
              </div>
              <input style={s.input} type="date" value={formData.xfd_date} onChange={e => setFormData({ ...formData, xfd_date: e.target.value })} />
              <input style={s.input} placeholder="Qty" type="number" value={formData.qty || ''} onChange={e => setFormData({ ...formData, qty: e.target.value })} required />
              <select style={s.input} value={formData.rack} onChange={e => setFormData({ ...formData, rack: e.target.value })} required>
                <option value="">Pilih Rak</option>
                {DAFTAR_RAK_FULL.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <input style={s.input} placeholder="Tujuan / Asal" value={formData.source_dest} onChange={e => setFormData({ ...formData, source_dest: e.target.value })} required />
              <input style={s.input} placeholder="Operator" value={formData.operator} onChange={e => setFormData({ ...formData, operator: e.target.value })} required />
              <button type="submit" style={{ ...s.btn, background: '#1a237e', padding: 15 }}>{isSubmitting ? 'MENYIMPAN...' : 'SIMPAN'}</button>
            </form>
          </div>

          <div style={{ flex: 2.5, background: 'white', padding: '20px', borderRadius: '12px' }}>
            <input style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ccc' }} placeholder="Cari SPK..." onChange={e => setSearchTerm(e.target.value.toUpperCase())} />
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
              {HURUF_RAK.map(h => (
                <div key={h} style={{ flex: 1, minWidth: '160px' }}>
                  <div style={{ textAlign: 'center', background: '#1a237e', color:'white', padding: '5px', fontWeight: 'bold' }}>RAK {h}</div>
                  {NOMOR_RAK.map(n => {
                    const r = `${h}-${n}`;
                    const items = inventory.filter(i => i.rack === r && i.spk.includes(searchTerm));
                    const total = items.reduce((a, b) => a + b.stock, 0);
                    return (
                      <div key={r} style={{ padding: '8px', border: '1px solid #eee', marginTop: '5px', background: total > 0 ? '#e3f2fd' : 'white', borderRadius: 4 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{r} ({total})</div>
                        {items.map((it, idx) => (
                          <div key={idx} style={{ fontSize: '9px', marginTop: 4, borderTop: '1px solid #f0f0f0', paddingTop: 2 }}>
                            <b>{it.spk}</b> (Size:{it.size}) <br/>
                            {it.stock}/{it.target} | <b>To: {it.last_to || '-'}</b>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ flex: 4, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
            {HURUF_RAK.map(h => (
              <div key={h}>
                <div style={{background:'#3498db', color:'black', textAlign:'center', fontWeight:'bold', padding:5, borderRadius:4, marginBottom:8}}>RAK {h}</div>
                {NOMOR_RAK.map(n => {
                  const r = `${h}-${n}`;
                  const itms = inventory.filter(i => i.rack === r);
                  const ttl = itms.reduce((a,b) => a + b.stock, 0);
                  return (
                    <div key={r} style={{background:'#161b22', padding:8, borderRadius:8, marginBottom:8, border: ttl > 0 ? '1px solid #3498db' : '1px solid #333', minHeight:115, color:'white'}}>
                      <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid #333', fontSize:14, marginBottom:5}}>
                        <b style={{color:'#3498db'}}>{r}</b> <b>{ttl}</b>
                      </div>
                      {itms.map((it, idx) => (
                        <div key={idx} style={{fontSize:10, marginTop:4, background: 'rgba(255,255,255,0.05)', padding: 5, borderRadius: 4}}>
                          <b>{it.spk}</b> | {it.style} <br/>
                          Size: {it.size} | <b>{it.stock}/{it.target}</b> <br/>
                          <span style={{color:'#3498db'}}>To: {it.last_to || '-'}</span> <br/>
                          <span style={{color:'#e67e22', fontSize:9}}>XFD: {it.xfd}</span>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
          <div style={{ flex: 1, background: '#161b22', padding: 15, borderRadius: 12, borderLeft: '4px solid #3498db', color:'white' }}>
            <h4 style={{textAlign:'center', color:'#3498db', marginTop:0}}>LIVE ACTIVITY</h4>
            <div style={{maxHeight:'80vh', overflowY:'auto'}}>
              {rawRecords.map((log, i) => (
                <div key={i} style={{fontSize:10, padding:'8px 0', borderBottom:'1px solid #222'}}>
                  <b style={{color: log.qty_in > 0 ? '#2ecc71' : '#e74c3c'}}>{log.qty_in > 0 ? 'IN' : 'OUT'}</b> | {log.spk_number} | Sz: {log.size}
                  <div style={{color:'#aaa'}}>Ket: {log.destination || log.source_from || '-'}</div>
                  <div style={{color:'#666', fontSize:9}}>{log.waktu_input}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div style={s.modalOverlay}>
          <div style={s.modalContent}>
            <h3>EXPORT DATA</h3>
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
               <button onClick={() => exportToXlsx(inventory, 'Summary_Stock')} style={{...s.btn, background:'#1a237e'}}>Export Summary (XLSX)</button>
               <button onClick={() => exportToXlsx(rawRecords, 'Log_Transaksi')} style={{...s.btn, background:'#8e44ad'}}>Export Log (XLSX)</button>
               <button onClick={() => setShowExportModal(false)} style={{...s.btn, background:'#e74c3c'}}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  input: { padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '13px' },
  btn: { padding: '10px 15px', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { background: 'white', padding: '30px', borderRadius: '20px', textAlign: 'center' }
};

export default App;