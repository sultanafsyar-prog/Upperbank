import React, { useState, useEffect, useCallback } from 'react';
import PocketBase from 'pocketbase';
import * as XLSX from 'xlsx';

const pb = new PocketBase('https://upperbank-production-c0b5.up.railway.app');

const HURUF_RAK = ["I", "H", "F", "E", "D"];
const NOMOR_RAK = ["01", "02", "03", "04", "05", "06"];
const DAFTAR_RAK_FULL = HURUF_RAK.flatMap(h => NOMOR_RAK.map(n => `${h}-${n}`));
const DAFTAR_STOCKFIT = ["PT WENCHUANG", "PT GLOBAL", "STOCKFIT 1", "STOCKFIT 2", "STOCKFIT 3", "STOCKFIT 4", "STOCKFIT 5", "STOCKFIT 6", "STOCKFIT 7"];

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

  const [currentTime, setCurrentTime] = useState(new Date());

  const [formData, setFormData] = useState({
    spk_number: '', style_name: '', qty: 0, target_qty: 0,
    xfd_date: '', type: 'IN', source_from: '', destination: '', rack: ''
  });

  // Ambil tanggal hari ini dalam format DD-MM-YYYY untuk filter statistik
  const todayStr = new Date().toLocaleDateString('id-ID').replace(/\//g, '-');

  const fetchData = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await pb.collection('upper_stock').getList(1, 50, { sort: '-created', requestKey: null });
      setRawRecords(res.items);
      const allRecords = await pb.collection('upper_stock').getFullList({ sort: 'created', requestKey: null });
      
      const summary = allRecords.reduce((acc, curr) => {
        const key = `${curr.spk_number}-${curr.rack_location}`;
        if (!acc[key]) {
          acc[key] = {
            spk: curr.spk_number, style: curr.style_name || '-',
            rack: curr.rack_location, stock: 0, target: 0, 
            xfd: curr.xfd_date, source: curr.source_from, destination: curr.destination 
          };
        }
        acc[key].stock += (Number(curr.qty_in || 0) - Number(curr.qty_out || 0));
        if (Number(curr.target_qty) > 0) acc[key].target = Number(curr.target_qty);
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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleItemClick = (item) => {
    if (viewMode !== 'ADMIN') return;
    setFormData({
      ...formData,
      type: 'OUT',
      spk_number: item.spk,
      style_name: item.style,
      target_qty: item.target,
      xfd_date: item.xfd,
      source_from: item.source,
      destination: item.destination,
      rack: item.rack,
      qty: item.stock 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // VALIDASI: Cek sisa stok sebelum OUT
    if (formData.type === 'OUT') {
      const currentItem = inventory.find(i => i.spk === formData.spk_number && i.rack === formData.rack);
      const stockTersedia = currentItem ? currentItem.stock : 0;
      if (Number(formData.qty) > stockTersedia) {
        alert(`❌ STOK TIDAK CUKUP!\nSisa di rak: ${stockTersedia} ps.\nInput Anda: ${formData.qty} ps.`);
        return;
      }
    }

    setIsSubmitting(true);
    const waktu = `${todayStr} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    try {
      await pb.collection('upper_stock').create({
        ...formData,
        spk_number: formData.spk_number.toUpperCase(),
        style_name: formData.style_name.toUpperCase(),
        qty_in: formData.type === 'IN' ? Number(formData.qty) : 0,
        qty_out: formData.type === 'OUT' ? Number(formData.qty) : 0,
        target_qty: Number(formData.target_qty),
        source_from: formData.source_from,
        destination: formData.destination,
        rack_location: formData.rack,
        waktu_input: waktu
      });
      alert("✅ Tersimpan!");
      setFormData({ ...formData, spk_number: '', style_name: '', qty: 0, target_qty: 0, xfd_date: '', source_from: '', destination: '' });
    } catch (err) { alert("❌ Gagal!"); } finally { setIsSubmitting(false); }
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

  const exportToXlsx = (rows, fileName) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  if (!isLoggedIn) return (
    <div style={{...s.overlay, background: '#0d1117'}}>
      <div style={{...s.card, width: '350px', border: '1px solid #30363d'}}>
        <h2 style={{color: '#58a6ff', marginBottom: '5px'}}>SYSTEM LOGIN</h2>
        <div style={{fontSize: '10px', color: '#8b949e', marginBottom: '20px'}}>THIRD AXIS CENTER</div>
        <form onSubmit={handleLogin} style={{display:'flex', flexDirection:'column', gap:15}}>
          <input style={s.darkInput} type="email" placeholder="Email" onChange={e => setLoginEmail(e.target.value)} required />
          <input style={s.darkInput} type="password" placeholder="Password" onChange={e => setLoginPassword(e.target.value)} required />
          <button type="submit" style={{...s.btn, background:'#238636'}}>{loading ? 'PROSES...' : 'LOGIN'}</button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#0d1117', minHeight: '100vh', padding: '20px', color: '#c9d1d9', fontFamily: 'sans-serif', position: 'relative' }}>
      
      {/* WATERMARK NEON */}
      <div style={{ 
        position: 'fixed', bottom: '20px', left: '20px', fontSize: '11px', fontWeight: 'bold', 
        color: '#58a6ff', letterSpacing: '3px', pointerEvents: 'none', zIndex: 9999, 
        textTransform: 'uppercase', textShadow: '0 0 5px #58a6ff, 0 0 10px #58a6ff', opacity: 0.8 
      }}>
        Third Axis Center
      </div>

      <nav style={{ background: '#161b22', border: '1px solid #30363d', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, color: '#58a6ff', fontSize: '22px' }}><img src="/logo.png" alt="Supermarket Icon" style={{ width: '24px', height: '24px', marginRight: '8px' }} />SUPERMARKET DIGITAL SYSTEM</h2>
          <div style={{fontSize: '9px', color: '#8b949e', letterSpacing:'1px'}}>PT DIAMOND INTERNATIONAL INDONESIA</div>
        </div>
        <div>
          <button onClick={() => setViewMode(viewMode === 'ADMIN' ? 'TV' : 'ADMIN')} style={{ ...s.btn, background: '#6818fb', marginRight: 10 }}>MODE {viewMode === 'ADMIN' ? 'TV' : 'ADMIN'}</button>
          <button onClick={() => setShowExportModal(true)} style={{ ...s.btn, background: '#238636', marginRight: 10 }}>DATA</button>
          <button onClick={handleLogout} style={{ ...s.btn, background: '#da3633' }}>LOGOUT</button>
        </div>
      </nav>

      {viewMode === 'ADMIN' ? (
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1, background: '#161b22', padding: '20px', borderRadius: '12px', border: '1px solid #30363d' }}>
            <h3 style={{color: '#58a6ff', marginTop: 0}}>Input Transaksi</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{display:'flex', gap:5}}>
                <button type="button" onClick={() => setFormData({...formData, type:'IN'})} style={{flex:1, padding:10, background:formData.type==='IN'?'#238636':'#21262d', color:'white', border:'none', borderRadius:5, fontWeight:'bold'}}>IN / MASUK</button>
                <button type="button" onClick={() => setFormData({...formData, type:'OUT'})} style={{flex:1, padding:10, background:formData.type==='OUT'?'#da3633':'#21262d', color:'white', border:'none', borderRadius:5, fontWeight:'bold'}}>OUT / KELUAR</button>
              </div>
              <input style={s.darkInput} placeholder="Nomor SPK" value={formData.spk_number} onChange={e => setFormData({ ...formData, spk_number: e.target.value.toUpperCase() })} required />
              <input style={s.darkInput} placeholder="Style / Artikel" value={formData.style_name} onChange={e => setFormData({ ...formData, style_name: e.target.value.toUpperCase() })} />
              <div style={{display:'flex', gap:5}}>
                 <input style={{...s.darkInput, flex:1}} placeholder="Qty Order" type="number" value={formData.target_qty || ''} onChange={e => setFormData({ ...formData, target_qty: e.target.value })} />
                 <input style={{...s.darkInput, flex:1}} type="date" value={formData.xfd_date} onChange={e => setFormData({ ...formData, xfd_date: e.target.value })} />
              </div>
              <input style={{...s.darkInput, border: formData.type==='OUT'?'1px solid #da3633':'1px solid #30363d'}} placeholder="Stock" type="number" value={formData.qty || ''} onChange={e => setFormData({ ...formData, qty: e.target.value })} required />
              <select style={s.darkInput} value={formData.rack} onChange={e => setFormData({ ...formData, rack: e.target.value })} required>
                <option value="">-- Lokasi Rak --</option>
                {DAFTAR_RAK_FULL.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <div style={{padding: '12px', background: '#0d1117', borderRadius: '8px', border: '1px solid #30363d'}}>
                <label style={{fontSize: '11px', color: '#8b949e'}}>DARI (Stockfit/supplayer)</label>
                <select style={{...s.darkInput, width: '100%', marginTop:5}} value={formData.source_from} onChange={e => setFormData({ ...formData, source_from: e.target.value })}>
                  <option value="">-- Pilih Stockfit/Supplayer --</option>
                  {DAFTAR_STOCKFIT.map(sf => <option key={sf} value={sf}>{sf}</option>)}
                </select>
                <label style={{fontSize: '11px', color: '#8b949e', display:'block', marginTop:10}}>KE (Tujuan)</label>
                <input style={{...s.darkInput, width: '94%', marginTop:5, opacity: 0.8}} value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} />
              </div>
              <button type="submit" style={{ ...s.btn, background: '#1f6feb', padding: 15 }}>{isSubmitting ? 'PROSES...' : 'SIMPAN DATA'}</button>
            </form>
          </div>
          <div style={{ flex: 2.5, background: '#161b22', padding: '20px', borderRadius: '12px', border: '1px solid #30363d' }}>
            <input style={{ ...s.darkInput, width: '100%', marginBottom: '15px' }} placeholder="Cari SPK..." onChange={e => setSearchTerm(e.target.value.toUpperCase())} />
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
              {HURUF_RAK.map(h => (
                <div key={h} style={{ flex: 1, minWidth: '160px' }}>
                  <div style={{ textAlign: 'center', background: '#30363d', color:'#58a6ff', padding: '5px', fontWeight: 'bold', borderRadius: '4px', fontSize: 12 }}>RAK {h}</div>
                  {NOMOR_RAK.map(n => {
                    const r = `${h}-${n}`;
                    const items = inventory.filter(i => i.rack === r && i.spk.includes(searchTerm));
                    const total = items.reduce((a, b) => a + b.stock, 0);
                    return (
                      <div key={r} style={{ padding: '8px', border: '1px solid #30363d', marginTop: '5px', background: total > 0 ? '#1c2128' : 'transparent', borderRadius: 4 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '11px', color: total > 0 ? '#58a6ff' : '#484f58' }}>{r} ({total})</div>
                        {items.map((it, idx) => (
                          <div key={idx} onClick={() => handleItemClick(it)} style={{ fontSize: '9px', marginTop: 4, borderTop: '1px solid #30363d', paddingTop: 2, color: '#8b949e', cursor: 'pointer' }}>
                            <b>{it.spk}</b> <br/>
                            <div style={{fontSize:'9px', color:'#8b949e', fontStyle:'italic'}}>{it.style}</div>
                            <div style={{fontSize:'8px', color:'#8b949e'}}>XFD: {it.xfd}</div>
                            <div style={{textAlign:'right', color:'#58a6ff', fontSize:'11px'}}>{it.stock} ps</div>
                            <div style={{textAlign:'right', color:'#f0883e', fontSize:'9px'}}>→ {it.destination}</div>
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
        /* TV MODE DASHBOARD */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ textAlign: 'center', color: '#58a6ff', fontSize: '25px', fontWeight: 'bold', marginBottom: '10px' }}>
            {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
             <div style={s.modernStatCard}>
                <div style={s.watermark}>IN</div>
                <div style={s.statLabel}>MASUK HARI INI (RESET)</div>
                <div style={{...s.statFlex, color: '#3fb950'}}>
                   <div style={s.statBigVal}>{rawRecords.filter(r => r.qty_in > 0 && r.waktu_input.includes(todayStr)).reduce((a, b) => a + Number(b.qty_in), 0)}</div>
                   <div style={s.unit}>Pasang</div>
                </div>
             </div>
             <div style={s.modernStatCard}>
                <div style={{...s.watermark, color:'rgba(248,81,73,0.05)'}}>OUT</div>
                <div style={s.statLabel}>KELUAR HARI INI (RESET)</div>
                <div style={{...s.statFlex, color: '#f85149'}}>
                   <div style={s.statBigVal}>{rawRecords.filter(r => r.qty_out > 0 && r.waktu_input.includes(todayStr)).reduce((a, b) => a + Number(b.qty_out), 0)}</div>
                   <div style={s.unit}>Pasang</div>
                </div>
             </div>
             <div style={{...s.modernStatCard, background: 'linear-gradient(135deg, #1f6feb 0%, #161b22 100%)', border: '1px solid #58a6ff'}}>
                <div style={{...s.watermark, color:'rgba(255,255,255,0.07)'}}>MARKET</div>
                <div style={{...s.statLabel, color:'rgba(255,255,255,0.7)'}}>GLOBAL STOCK (AKTIF)</div>
                <div style={{...s.statFlex, color: '#ffffff'}}>
                   <div style={s.statBigVal}>{inventory.reduce((a, b) => a + b.stock, 0)}</div>
                   <div style={s.unit}>Pasang</div>
                </div>
             </div>
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 4, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
              {HURUF_RAK.map(h => {
                const totalHuruf = inventory.filter(i => i.rack.startsWith(h)).reduce((a, b) => a + b.stock, 0);
                return (
                  <div key={h}>
                    <div style={{background:'#58a6ff', color:'#0d1117', textAlign:'center', fontWeight:'bold', padding:5, borderRadius:4, marginBottom:8, fontSize:12}}>
                       RAK {h} <br/> <span style={{fontSize: 9}}>TOTAL: {totalHuruf}</span>
                    </div>
                    {NOMOR_RAK.map(n => {
                      const r = `${h}-${n}`;
                      const itms = inventory.filter(i => i.rack === r);
                      const ttl = itms.reduce((a,b) => a + b.stock, 0);
                      return (
                        <div key={r} style={{background:'#161b22', padding:8, borderRadius:8, marginBottom:8, border: ttl > 0 ? '1px solid #58a6ff' : '1px solid #30363d', minHeight:105}}>
                          <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid #30363d', fontSize:13, marginBottom:4, paddingBottom:2}}>
                            <b style={{color:'#58a6ff'}}>{r}</b> <b>{ttl}</b>
                          </div>
                          {itms.map((it, idx) => {
                            const persen = it.target > 0 ? Math.round((it.stock / it.target) * 100) : 0;
                            let color = (persen >= 100) ? '#3fb950' : (persen < 30 ? '#f85149' : '#58a6ff');
                            return (
                              <div key={idx} style={{fontSize:10, marginTop:8, background: 'rgba(255,255,255,0.02)', padding: 6, borderRadius: 6, border: '1px solid #21262d'}}>
                                <div style={{display:'flex', justifyContent:'space-between', marginBottom:3}}>
                                  <b style={{color:'#ffffff'}}>{it.spk}</b>
                                  <b style={{color: color}}>{persen}%</b>
                                </div>
                                <div style={{fontSize:'8px', color:'#ffb829'}}>XFD: {it.xfd}</div>
                                <div style={{fontSize:'9px', color:'#8b949e', fontStyle:'italic'}}>{it.style}</div>
                                <div style={{width:'100%', height:3, background:'#30363d', borderRadius:2, marginBottom:4}}>
                                  <div style={{width:`${Math.min(persen, 100)}%`, height:'100%', background: color, borderRadius:2}}></div>
                                </div>
                                <div style={{display:'flex', justifyContent:'space-between', fontSize:9}}>
                                  <span>{it.stock}/{it.target}</span>
                                </div>
                                <div style={{fontSize:'8px', color:'#ffb829', marginTop:2}}>Dari: {it.source} → {it.destination}</div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>

            <div style={{ flex: 1.2, background: '#161b22', padding: 15, borderRadius: 12, borderLeft: '4px solid #58a6ff', height: 'fit-content' }}>
              <h4 style={{textAlign:'center', color:'#58a6ff', marginTop:0, borderBottom:'1px solid #30363d', paddingBottom:10, fontSize:'12px'}}>LOG AKTIVITAS</h4>
              <div style={{maxHeight:'75vh', overflowY:'auto'}}>
                {rawRecords.map((log, i) => {
                  const isIn = log.qty_in > 0;
                  return (
                    <div key={i} style={{ padding: 10, marginBottom: 8, background: '#0d1117', borderRadius: 8, border: '1px solid #30363d', position:'relative' }}>
                      <div style={{ position:'absolute', top:8, right:8, fontSize:8, padding:'1px 5px', borderRadius:10, background: isIn?'#238636':'#da3633', color:'white', fontWeight:'bold' }}>
                        {isIn ? 'IN' : 'OUT'}
                      </div>
                      <div style={{fontSize:11, fontWeight:'bold', color:'#58a6ff'}}>{log.spk_number}</div>
                      <div style={{display:'flex', alignItems:'center', gap:4, fontSize:9, marginTop:5}}>
                        <span style={{color: isIn?'#3fb950':'#8b949e'}}>{log.source_from || 'SF'}</span>
                        <span>➜</span>
                        <span style={{color: '#f85149', fontWeight:'bold'}}>{log.destination}</span>
                      </div>
                      <div style={{display:'flex', justifyContent:'space-between', marginTop:5, fontSize:9, color:'#484f58'}}>
                        <b>{log.qty_in || log.qty_out} Pasang</b>
                        <span>{log.waktu_input.split(' ')[1]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div style={s.overlay}>
          <div style={s.card}>
            <h3 style={{color: '#58a6ff'}}>DOWNLOAD DATA</h3>
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
               <button onClick={() => exportToXlsx(inventory, 'Summary_Stok')} style={{...s.btn, background:'#1f6feb'}}>Export Summary</button>
               <button onClick={() => exportToXlsx(rawRecords, 'Log_Transaksi')} style={{...s.btn, background:'#8957e5'}}>Export Log</button>
               <button onClick={() => setShowExportModal(false)} style={{...s.btn, background:'#30363d'}}>Batal</button>
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
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 },
  card: { background: '#161b22', padding: '30px', borderRadius: '12px', textAlign: 'center', border: '1px solid #30363d' },
  modernStatCard: { 
    flex: 1, background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)', padding: '20px', 
    borderRadius: '16px', border: '1px solid #30363d', position: 'relative', overflow: 'hidden'
  },
  watermark: { position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '60px', color: 'rgba(63,185,80,0.05)', fontWeight: '900' },
  statLabel: { fontSize: '11px', color: '#8b949e', fontWeight: 'bold', letterSpacing: '1px' },
  statFlex: { display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '10px' },
  statBigVal: { fontSize: '38px', fontWeight: '900' },
  unit: { fontSize: '14px', opacity: 0.7 }
};

export default App;