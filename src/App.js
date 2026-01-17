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
  const [viewMode, setViewMode] = useState('ADMIN'); 

  const [inventory, setInventory] = useState([]);
  const [rawRecords, setRawRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  
  const [formData, setFormData] = useState({
    spk_number: '', style_name: '', size: '', qty: 0, target_qty: 0,
    xfd_date: '', 
    type: 'IN', source_dest: '', rack: '', operator: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await pb.collection('users').authWithPassword(loginEmail, loginPassword);
      setIsLoggedIn(true);
      fetchData();
    } catch (err) {
      pb.authStore.clear();
      setIsLoggedIn(false);
      alert("⚠️ LOGIN GAGAL: Email atau Password salah!");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    pb.authStore.clear();
    setIsLoggedIn(false);
  };

  const fetchData = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await pb.collection('upper_stock').getList(1, 100, {
        sort: '-created',
        requestKey: null
      });
      setRawRecords(res.items);

      const allRecords = await pb.collection('upper_stock').getFullList({ requestKey: null });
      const summary = allRecords.reduce((acc, curr) => {
        const key = `${curr.spk_number}-${curr.size}-${curr.rack_location}`;
        if (!acc[key]) {
          acc[key] = {
            spk: curr.spk_number,
            style: curr.style_name,
            size: curr.size,
            rack: curr.rack_location,
            stock: 0,
            target: 0,
            xfd: '',
            last_area: '' 
          };
        }
        acc[key].stock += (Number(curr.qty_in || 0) - Number(curr.qty_out || 0));
        if (curr.target_qty > 0) acc[key].target = curr.target_qty;
        if (curr.xfd_date) acc[key].xfd = curr.xfd_date; 
        const area = curr.destination || curr.source_from;
        if (area) acc[key].last_area = area;
        return acc;
      }, {});
      setInventory(Object.values(summary).filter(i => i.stock !== 0));
    } catch (error) {
      console.error("Gagal Sinkronisasi:", error);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
      const unsubscribe = pb.collection('upper_stock').subscribe('*', () => fetchData());
      return () => { unsubscribe.then(unsub => unsub()); };
    }
  }, [fetchData, isLoggedIn]);

  const handlePickFromRack = (item) => {
    setFormData({
      ...formData,
      spk_number: item.spk,
      style_name: item.style,
      size: item.size,
      rack: item.rack,
      target_qty: item.target,
      xfd_date: item.xfd,
      type: 'OUT'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const sekarang = new Date();
    const waktuLokal = `${sekarang.toLocaleDateString('id-ID').replace(/\//g, '-')} ${sekarang.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    if (formData.type === 'OUT') {
      const match = inventory.find(i => i.spk === formData.spk_number.toUpperCase() && i.rack === formData.rack && i.size === formData.size);
      if (Number(formData.qty) > (match?.stock || 0)) {
        alert(`⚠️ STOK TIDAK CUKUP! (Tersedia: ${match?.stock || 0})`);
        setIsSubmitting(false);
        return;
      }
    }
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
        waktu_input: waktuLokal
      });
      alert("✅ Tersimpan!");
      setFormData({ ...formData, spk_number: '', style_name: '', size: '', qty: 0, target_qty: 0, xfd_date: '' });
    } catch (err) { alert("Gagal Simpan!"); } finally { setIsSubmitting(false); }
  };

  const executeExport = (filterType) => {
    let data = rawRecords;
    if (filterType === 'HARI_INI') {
      const today = new Date().toLocaleDateString('id-ID').replace(/\//g, '-');
      data = rawRecords.filter(r => r.waktu_input?.startsWith(today));
    }
    const worksheet = XLSX.utils.json_to_sheet(data.map(r => ({
      "Waktu": r.waktu_input, "Operator": r.operator, "Tipe": r.qty_in > 0 ? "MASUK" : "KELUAR",
      "SPK": r.spk_number, "Style": r.style_name, "Size": r.size, "Qty": r.qty_in || r.qty_out, "Target": r.target_qty, "XFD": r.xfd_date, "Rak": r.rack_location, "Area": r.destination || r.source_from
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
    XLSX.writeFile(workbook, `Laporan.xlsx`);
    setShowExportModal(false);
  };

  const filteredHistory = rawRecords.filter(r => r.spk_number?.includes(searchTerm) || r.style_name?.includes(searchTerm) || r.rack_location?.includes(searchTerm));
  const tglHariIni = new Date().toLocaleDateString('id-ID').replace(/\//g, '-');
  const logsHariIni = rawRecords.filter(r => r.waktu_input?.startsWith(tglHariIni));
  const inToday = logsHariIni.reduce((acc, curr) => acc + (Number(curr.qty_in) || 0), 0);
  const outToday = logsHariIni.reduce((acc, curr) => acc + (Number(curr.qty_out) || 0), 0);

  if (!isLoggedIn) return (
    <div style={{ ...s.modalOverlay, background: '#1a237e' }}>
      <div style={s.modalContent}>
        <h2>LOGIN SYSTEM</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input style={s.input} type="email" placeholder="Email" onChange={e => setLoginEmail(e.target.value)} required />
          <input style={s.input} type="password" placeholder="Password" onChange={e => setLoginPassword(e.target.value)} required />
          <button type="submit" disabled={loading} style={{ ...s.btn, background: '#1a237e' }}> {loading ? "MENGECEK..." : "MASUK"} </button>
        </form>
      </div>
    </div>
  );

  if (viewMode === 'TV') return (
    <div style={{ background: '#050714', minHeight: '100vh', padding: '15px', color: 'white', fontFamily: 'sans-serif', overflow: 'hidden' }}>
       <style>{`
        @keyframes pulse-glow { 0% { box-shadow: 0 0 5px rgba(52, 152, 219, 0.2); } 50% { box-shadow: 0 0 20px rgba(52, 152, 219, 0.5); } 100% { box-shadow: 0 0 5px rgba(52, 152, 219, 0.2); } }
        .glass-card { background: rgba(22, 27, 34, 0.8); backdrop-filter: blur(10px); border: 1px solid rgba(48, 54, 61, 0.8); border-radius: 12px; }
        .active-rack { animation: pulse-glow 2s infinite; border: 1px solid #3498db !important; }
        .ticker-container::-webkit-scrollbar { width: 6px; }
        .ticker-container::-webkit-scrollbar-thumb { background: #3498db; border-radius: 10px; }
        .progress-bg { background: #111; height: 12px; border-radius: 6px; margin: 8px 0; overflow: hidden; border: 1px solid #333; }
        .progress-fill { height: 100%; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
      `}</style>

      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 30px', marginBottom: '15px', borderBottom: '4px solid #3498db' }}>
        <div>
          <h1 style={{ fontSize: '32px', margin: 0, color: '#3498db', letterSpacing: '2px' }}><img src="/logo.png" alt="Logo" style={{ height: '40px', marginRight: '10px' }} />PRODUCTION STOCK MONITOR</h1>
          <p style={{ margin: 0, color: '#888', fontSize: '14px', fontWeight: 'bold' }}>SINKRONISASI AKTIF: {new Date().toLocaleTimeString()}</p>
        </div>
        <div style={{ display: 'flex', gap: '30px' }}>
          <div style={{ textAlign: 'center', background: 'rgba(46, 204, 113, 0.1)', padding: '5px 20px', borderRadius: '10px', border: '1px solid #2ecc71' }}>
            <div style={{ fontSize: '12px', color: '#2ecc71' }}>TOTAL IN</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2ecc71' }}>{inToday}</div>
          </div>
          <div style={{ textAlign: 'center', background: 'rgba(231, 76, 60, 0.1)', padding: '5px 20px', borderRadius: '10px', border: '1px solid #e74c3c' }}>
            <div style={{ fontSize: '12px', color: '#e74c3c' }}>TOTAL OUT</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#e74c3c' }}>{outToday}</div>
          </div>
          <button onClick={() => setViewMode('ADMIN')} style={{ ...s.btn, background: '#e74c3c', alignSelf: 'center', height: '40px' }}>EXIT</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '15px', height: '78vh' }}>
        <div style={{ flex: 3, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {DAFTAR_RAK.map(rack => {
            const items = inventory.filter(i => i.rack === rack);
            const total = items.reduce((a, b) => a + b.stock, 0);
            return (
              <div key={rack} className={`glass-card ${total > 0 ? 'active-rack' : ''}`} style={{ padding: '12px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #333', paddingBottom: '5px' }}>
                  <span style={{ fontSize: '24px', color: '#3498db', fontWeight: '900' }}>{rack}</span>
                  <span style={{ fontSize: '18px', background: '#3498db', color: '#000', padding: '2px 10px', borderRadius: '20px', fontWeight: 'bold' }}>{total}</span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }} className="ticker-container">
                  {items.map((it, idx) => {
                    const percent = it.target > 0 ? (it.stock / it.target) * 100 : 0;
                    const barColor = percent >= 100 ? '#2ecc71' : (percent >= 50 ? '#3498db' : '#f1c40f');
                    return (
                      <div key={idx} style={{ padding: '12px 0', borderBottom: '1px solid #222' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong style={{ color: '#fff', fontSize: '16px' }}>{it.spk}</strong>
                            <span style={{ color: '#e67e22', fontSize: '12px', fontWeight: 'bold' }}>📅 XFD: {it.xfd || '-'}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: barColor }}>{it.stock}<span style={{fontSize:'12px', color:'#666'}}>/{it.target}</span></div>
                          </div>
                        </div>
                        <div className="progress-bg">
                           <div className="progress-fill" style={{ width: `${Math.min(percent, 100)}%`, background: barColor, boxShadow: percent >= 100 ? '0 0 10px #2ecc71' : 'none' }}></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold' }}>
                          <span style={{ color: '#aaa' }}>SZ: {it.size} | {it.style.substring(0,10)}</span>
                          <span style={{ color: '#3498db' }}>TO: {it.last_area || '-'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="glass-card" style={{ flex: 0.8, display: 'flex', flexDirection: 'column', border: '1px solid #1a237e' }}>
          <div style={{ padding: '15px', background: '#1a237e', fontWeight: 'bold', textAlign: 'center', fontSize: '18px' }}>LIVE FEED</div>
          <div className="ticker-container" style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            {rawRecords.slice(0, 15).map((log, i) => (
              <div key={i} style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '8px', borderLeft: `6px solid ${log.qty_in > 0 ? '#2ecc71' : '#e74c3c'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#888' }}>
                  <span>{log.waktu_input.split(' ')[1]}</span>
                  <span style={{color: log.qty_in > 0 ? '#2ecc71' : '#e74c3c', fontWeight:'bold'}}>{log.qty_in > 0 ? 'IN' : 'OUT'}</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', margin: '2px 0' }}>{log.spk_number}</div>
                <div style={{ fontSize: '12px', color: '#3498db' }}>{log.qty_in || log.qty_out} PRS → {log.rack_location}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', background: '#3498db', color: '#000', padding: '4px' }}>
        <marquee style={{ fontSize: '16px', fontWeight: '900' }}> STATUS BAR: KUNING (CRITICAL / BELOW 50%) | BIRU (PROCESSING) | HIJAU (READY TO SHIP / 100%) | HARAP PERIKSA TANGGAL XFD UNTUK PRIORITAS KIRIM </marquee>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#f4f7f6', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      {showExportModal && (
        <div style={s.modalOverlay}>
          <div style={s.modalContent}>
            <h3>Ekspor ke Excel</h3>
            <button onClick={() => executeExport('HARI_INI')} style={{ ...s.btn, background: '#3498db', margin: '5px' }}>HARI INI</button>
            <button onClick={() => executeExport('SEMUA')} style={{ ...s.btn, background: '#27ae60', margin: '5px' }}>SEMUA DATA</button>
            <button onClick={() => setShowExportModal(false)} style={{ ...s.btn, background: '#95a5a6', margin: '5px' }}>BATAL</button>
          </div>
        </div>
      )}

      <nav style={{ background: '#1a237e', color: 'white', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}><img src="/logo.png" alt="Logo" style={{ height: '40px', marginRight: '10px' }} />SUPERMARKET CONTROL PANEL</h2>
        <div>
          <button onClick={() => setViewMode('TV')} style={{ ...s.btn, background: '#8e44ad', marginRight: '10px' }}>DASHBOARD VIEW</button>
          <button onClick={() => setShowExportModal(true)} style={{ ...s.btn, background: '#27ae60', marginRight: '10px' }}>EXPORT EXCEL</button>
          <button onClick={handleLogout} style={{ ...s.btn, background: '#e74c3c' }}>KELUAR</button>
        </div>
      </nav>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: '1' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Input Transaksi</h3>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
              <button onClick={() => setFormData({ ...formData, type: 'IN' })} style={{ flex: 1, padding: '12px', background: formData.type === 'IN' ? '#2ecc71' : '#eee', color: formData.type === 'IN' ? 'white' : '#666', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>MASUK (IN)</button>
              <button onClick={() => setFormData({ ...formData, type: 'OUT' })} style={{ flex: 1, padding: '12px', background: formData.type === 'OUT' ? '#e74c3c' : '#eee', color: formData.type === 'OUT' ? 'white' : '#666', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>KELUAR (OUT)</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input style={s.input} placeholder="Nomor SPK" value={formData.spk_number} onChange={e => setFormData({ ...formData, spk_number: e.target.value.toUpperCase() })} required />
              <input style={s.input} placeholder="Style/Artikel" value={formData.style_name} onChange={e => setFormData({ ...formData, style_name: e.target.value.toUpperCase() })} required />
              <div style={{ display: 'flex', gap: '8px' }}>
                <input style={{...s.input, flex: 1}} placeholder="Size" value={formData.size} onChange={e => setFormData({ ...formData, size: e.target.value })} required />
                <input style={{...s.input, flex: 1}} placeholder="Target Qty" type="number" value={formData.target_qty || ''} onChange={e => setFormData({ ...formData, target_qty: e.target.value })} />
              </div>
              <input style={s.input} placeholder="XFD (Contoh: 25 Jan)" value={formData.xfd_date} onChange={e => setFormData({ ...formData, xfd_date: e.target.value })} />
              <input type="number" style={{...s.input, border: '2px solid #1a237e'}} placeholder="Jumlah Pasang (Actual Qty)" value={formData.qty || ''} onChange={e => setFormData({ ...formData, qty: e.target.value })} required />
              <select style={s.input} value={formData.rack} onChange={e => setFormData({ ...formData, rack: e.target.value })} required>
                <option value="">-- Pilih Rak --</option>
                {DAFTAR_RAK.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <input style={s.input} placeholder="Asal/Tujuan Area" value={formData.source_dest} onChange={e => setFormData({ ...formData, source_dest: e.target.value })} required />
              <input style={s.input} placeholder="Operator" value={formData.operator} onChange={e => setFormData({ ...formData, operator: e.target.value })} required />
              <button type="submit" disabled={isSubmitting} style={{ ...s.btn, background: isSubmitting ? '#95a5a6' : '#1a237e', padding: '18px', fontSize: '16px' }}>
                {isSubmitting ? "MENYIMPAN..." : "KONFIRMASI SIMPAN"}
              </button>
            </form>
          </div>
        </div>

        <div style={{ flex: '2.5', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <input style={{ width: '100%', padding: '15px', marginBottom: '15px', borderRadius: '10px', border: '2px solid #1a237e', boxSizing: 'border-box', fontSize: '16px' }} placeholder="🔍 CARI SPK, STYLE, ATAU RAK..." value={searchTerm} onChange={e => setSearchTerm(e.target.value.toUpperCase())} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
              {DAFTAR_RAK.map(rack => {
                const items = inventory.filter(i => i.rack === rack && i.spk.includes(searchTerm));
                const total = items.reduce((a, b) => a + b.stock, 0);
                return (
                  <div key={rack} style={{ border: '1px solid #eee', padding: '12px', borderRadius: '10px', background: total > 0 ? '#fff' : '#fafafa', borderTop: `5px solid ${total > 0 ? '#3498db' : '#ddd'}` }}>
                    <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '10px', fontSize: '18px', color: '#1a237e' }}>{rack} <span style={{fontSize:'14px', color:'#666'}}>({total})</span></div>
                    {items.map((it, idx) => (
                      <div key={idx} onClick={() => handlePickFromRack(it)} style={{ fontSize: '12px', marginBottom: '8px', padding: '8px', background: '#f8f9fa', borderRadius: '6px', cursor: 'pointer', border: '1px solid #eee' }}>
                        <div style={{display:'flex', justifyContent:'space-between'}}><strong>{it.spk}</strong> <span style={{color:'#e67e22'}}>{it.xfd}</span></div>
                        <div style={{marginTop:'4px'}}>Stok: <strong>{it.stock}</strong>/{it.target} | Sz: {it.size}</div>
                        <div style={{ color: '#3498db', fontSize: '10px', marginTop:'2px' }}>Tujuan: {it.last_area}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px', outline: 'none' },
  btn: { padding: '10px 15px', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' },
  th: { padding: '12px', background: '#f8f9fa' },
  td: { padding: '12px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  modalContent: { background: 'white', padding: '30px', borderRadius: '20px', textAlign: 'center', minWidth: '350px' }
};

export default App;