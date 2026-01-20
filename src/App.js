import React, { useState, useEffect, useCallback } from 'react';
import PocketBase from 'pocketbase';
import * as XLSX from 'xlsx';

const pb = new PocketBase('https://upperbank-production-c0b5.up.railway.app');

const HURUF_RAK = ["I", "H", "F", "E", "D"];
const NOMOR_RAK = ["01", "02", "03", "04", "05", "06"];
const DAFTAR_RAK_FULL = HURUF_RAK.flatMap(h => NOMOR_RAK.map(n => `${h}-${n}`));

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
            spk: curr.spk_number, style: curr.style_name || '-', size: curr.size || '-',
            rack: curr.rack_location, stock: 0, target: 0, xfd: '', last_to: '' 
          };
        }
        const qIn = Number(curr.qty_in || 0);
        const qOut = Number(curr.qty_out || 0);
        acc[key].stock += (qIn - qOut);
        if (Number(curr.target_qty) > 0) acc[key].target = Number(curr.target_qty);
        if (curr.xfd_date) acc[key].xfd = curr.xfd_date;
        if (qOut > 0) acc[key].last_to = curr.destination;
        return acc;
      }, {});
      setInventory(Object.values(summary).filter(i => i.stock > 0));
    } catch (error) { console.error("Sync Error"); }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
      const unsub = pb.collection('upper_stock').subscribe('*', () => fetchData());
      return () => { unsub.then(f => f()); };
    }
  }, [fetchData, isLoggedIn]);

  // FITUR KLIK OTOMATIS
  const handleItemClick = (item) => {
    if (viewMode !== 'ADMIN') return;
    setFormData({
      ...formData,
      type: 'OUT',
      spk_number: item.spk,
      style_name: item.style,
      size: item.size,
      rack: item.rack,
      target_qty: item.target,
      qty: item.stock // Default qty disamakan dengan sisa stok
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await pb.collection('users').authWithPassword(loginEmail, loginPassword);
      setIsLoggedIn(true);
    } catch (err) { alert("⚠️ LOGIN GAGAL!"); } finally { setLoading(false); }
  };

  const handleLogout = () => { pb.authStore.clear(); setIsLoggedIn(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const waktu = `${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    try {
      await pb.collection('upper_stock').create({
        ...formData,
        spk_number: formData.spk_number.toUpperCase(),
        style_name: formData.style_name.toUpperCase(),
        qty_in: formData.type === 'IN' ? Number(formData.qty) : 0,
        qty_out: formData.type === 'OUT' ? Number(formData.qty) : 0,
        target_qty: Number(formData.target_qty),
        source_from: formData.type === 'IN' ? formData.source_dest : '',
        destination: formData.type === 'OUT' ? formData.source_dest : '',
        rack_location: formData.rack,
        waktu_input: waktu
      });
      alert("✅ Tersimpan!");
      setFormData({ ...formData, spk_number: '', style_name: '', size: '', qty: 0, target_qty: 0, xfd_date: '', source_dest: '' });
    } catch (err) { alert("❌ Gagal!"); } finally { setIsSubmitting(false); }
  };

  const exportToXlsx = (rows, fileName) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  if (!isLoggedIn) return (
    <div style={{...s.overlay, background: '#0d1117'}}>
      <div style={{...s.card, width: '350px', border: '1px solid #30363d'}}>
        <h2 style={{color: '#58a6ff', marginBottom: '20px'}}>SYSTEM LOGIN</h2>
        <h4 style={{marginBottom: '10px'}}>PT DIAMOND INTERNATIONAL INDONESIA</h4>
        <form onSubmit={handleLogin} style={{display:'flex', flexDirection:'column', gap:15}}>
          <input style={s.darkInput} type="email" placeholder="Email" onChange={e => setLoginEmail(e.target.value)} required />
          <input style={s.darkInput} type="password" placeholder="Password" onChange={e => setLoginPassword(e.target.value)} required />
          <button type="submit" style={{...s.btn, background:'#238636'}}>{loading ? 'PROSES...' : 'LOGIN'}</button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#0d1117', minHeight: '100vh', padding: '20px', color: '#c9d1d9', fontFamily: 'sans-serif' }}>
      <nav style={{ background: '#161b22', border: '1px solid #30363d', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: '#58a6ff' }}><img src="/logo.png" alt="Logo" style={{ width: '30px', height: '30px', marginRight: '10px' }} />SUPERMARKET TRANSACTION CONTROL</h2>
        <div>
          <button onClick={() => setViewMode(viewMode === 'ADMIN' ? 'TV' : 'ADMIN')} style={{ ...s.btn, background: '#8957e5', marginRight: 10 }}>MODE {viewMode === 'ADMIN' ? 'TV' : 'ADMIN'}</button>
          <button onClick={() => setShowExportModal(true)} style={{ ...s.btn, background: '#238636', marginRight: 10 }}>MENU DATA</button>
          <button onClick={handleLogout} style={{ ...s.btn, background: '#da3633' }}>LOGOUT</button>
        </div>
      </nav>

      {viewMode === 'ADMIN' ? (
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1, background: '#161b22', padding: '20px', borderRadius: '12px', border: '1px solid #30363d' }}>
            <h3 style={{color: '#58a6ff'}}>Input Transaksi</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{display:'flex', gap:5}}>
                <button type="button" onClick={() => setFormData({...formData, type:'IN'})} style={{flex:1, padding:10, background:formData.type==='IN'?'#238636':'#21262d', color:'white', border:'none', borderRadius:5}}>IN</button>
                <button type="button" onClick={() => setFormData({...formData, type:'OUT'})} style={{flex:1, padding:10, background:formData.type==='OUT'?'#da3633':'#21262d', color:'white', border:'none', borderRadius:5}}>OUT</button>
              </div>
              <input style={s.darkInput} placeholder="Nomor SPK" value={formData.spk_number} onChange={e => setFormData({ ...formData, spk_number: e.target.value.toUpperCase() })} required />
              <input style={s.darkInput} placeholder="Style / Artikel" value={formData.style_name} onChange={e => setFormData({ ...formData, style_name: e.target.value.toUpperCase() })} />
              <div style={{display:'flex', gap:5}}>
                <input style={{...s.darkInput, flex:1}} placeholder="Size" value={formData.size} onChange={e => setFormData({ ...formData, size: e.target.value })} required />
                <input style={{...s.darkInput, flex:1}} placeholder="Target" type="number" value={formData.target_qty || ''} onChange={e => setFormData({ ...formData, target_qty: e.target.value })} />
              </div>
              <input style={s.darkInput} type="date" value={formData.xfd_date} onChange={e => setFormData({ ...formData, xfd_date: e.target.value })} />
              <input style={s.darkInput} placeholder="Qty" type="number" value={formData.qty || ''} onChange={e => setFormData({ ...formData, qty: e.target.value })} required />
              <select style={s.darkInput} value={formData.rack} onChange={e => setFormData({ ...formData, rack: e.target.value })} required>
                <option value="">Pilih Rak</option>
                {DAFTAR_RAK_FULL.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <input style={s.darkInput} placeholder="Ke Mana / Dari Mana?" value={formData.source_dest} onChange={e => setFormData({ ...formData, source_dest: e.target.value })} required />
              <input style={s.darkInput} placeholder="Operator" value={formData.operator} onChange={e => setFormData({ ...formData, operator: e.target.value })} required />
              <button type="submit" style={{ ...s.btn, background: '#1f6feb', padding: 15 }}>{isSubmitting ? 'SAVING...' : 'SIMPAN'}</button>
            </form>
          </div>

          <div style={{ flex: 2.5, background: '#161b22', padding: '20px', borderRadius: '12px', border: '1px solid #30363d' }}>
            <input style={{ ...s.darkInput, width: '100%', marginBottom: '15px' }} placeholder="Cari SPK..." onChange={e => setSearchTerm(e.target.value.toUpperCase())} />
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
              {HURUF_RAK.map(h => (
                <div key={h} style={{ flex: 1, minWidth: '160px' }}>
                  <div style={{ textAlign: 'center', background: '#30363d', color:'#58a6ff', padding: '5px', fontWeight: 'bold', borderRadius: '4px' }}>RAK {h}</div>
                  {NOMOR_RAK.map(n => {
                    const r = `${h}-${n}`;
                    const items = inventory.filter(i => i.rack === r && i.spk.includes(searchTerm));
                    const total = items.reduce((a, b) => a + b.stock, 0);
                    return (
                      <div key={r} style={{ padding: '8px', border: '1px solid #30363d', marginTop: '5px', background: total > 0 ? '#1c2128' : 'transparent', borderRadius: 4 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '11px', color: total > 0 ? '#58a6ff' : '#484f58' }}>{r} ({total})</div>
                        {items.map((it, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => handleItemClick(it)}
                            style={{ fontSize: '9px', marginTop: 4, borderTop: '1px solid #30363d', paddingTop: 2, color: '#8b949e', cursor: 'pointer' }}
                            title="Klik untuk proses OUT"
                          >
                            <b>{it.spk}</b> (Sz:{it.size}) <br/>
                            {it.stock}/{it.target} | <span style={{color:'#f0883e'}}>To: {it.last_to || '-'}</span>
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
        /* DASHBOARD TV MODE */
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ flex: 4, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
            {HURUF_RAK.map(h => (
              <div key={h}>
                <div style={{background:'#58a6ff', color:'#0d1117', textAlign:'center', fontWeight:'bold', padding:5, borderRadius:4, marginBottom:8}}>RAK {h}</div>
                {NOMOR_RAK.map(n => {
                  const r = `${h}-${n}`;
                  const itms = inventory.filter(i => i.rack === r);
                  const ttl = itms.reduce((a,b) => a + b.stock, 0);
                  return (
                    <div key={r} style={{background:'#161b22', padding:8, borderRadius:8, marginBottom:8, border: ttl > 0 ? '1px solid #58a6ff' : '1px solid #30363d', minHeight:115}}>
                      <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid #30363d', fontSize:14, marginBottom:5}}>
                        <b style={{color:'#58a6ff'}}>{r}</b> <b>{ttl}</b>
                      </div>
                      {itms.map((it, idx) => (
                        <div key={idx} style={{fontSize:10, marginTop:4, background: 'rgba(255,255,255,0.03)', padding: 5, borderRadius: 4}}>
                          <b>{it.spk}</b> | {it.style} <br/>
                          Size: {it.size} | <b>{it.stock}/{it.target}</b> <br/>
                          <span style={{color:'#f0883e'}}>To: {it.last_to || '-'}</span> <br/>
                          <span style={{color:'#d29922', fontSize:9}}>XFD: {it.xfd}</span>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
          <div style={{ flex: 1, background: '#161b22', padding: 15, borderRadius: 12, borderLeft: '4px solid #58a6ff' }}>
            <h4 style={{textAlign:'center', color:'#58a6ff', marginTop:0}}>LIVE ACTIVITY</h4>
            <div style={{maxHeight:'80vh', overflowY:'auto'}}>
              {rawRecords.map((log, i) => (
                <div key={i} style={{fontSize:10, padding:'8px 0', borderBottom:'1px solid #30363d'}}>
                  <b style={{color: log.qty_in > 0 ? '#3fb950' : '#f85149'}}>{log.qty_in > 0 ? 'IN' : 'OUT'}</b> | {log.spk_number}
                  <div style={{color:'#8b949e'}}>Ke/Dari: {log.destination || log.source_from || '-'}</div>
                  <div style={{color:'#507fbc', fontSize:9}}>{log.waktu_input}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div style={s.overlay}>
          <div style={{...s.card, background: '#161b22', border: '1px solid #30363d'}}>
            <h3 style={{color: '#58a6ff'}}>EXPORT DATA</h3>
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
               <button onClick={() => exportToXlsx(inventory, 'Summary')} style={{...s.btn, background:'#1f6feb'}}>Summary (XLSX)</button>
               <button onClick={() => exportToXlsx(rawRecords, 'Log')} style={{...s.btn, background:'#8957e5'}}>History (XLSX)</button>
               <button onClick={() => setShowExportModal(false)} style={{...s.btn, background:'#30363d'}}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  darkInput: { padding: '10px', borderRadius: '6px', border: '1px solid #30363d', background: '#0d1117', color: '#c9d1d9', fontSize: '13px', outline: 'none' },
  btn: { padding: '10px 15px', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 'bold', cursor: 'pointer' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  card: { background: '#161b22', padding: '30px', borderRadius: '12px', textAlign: 'center' }
};

export default App;