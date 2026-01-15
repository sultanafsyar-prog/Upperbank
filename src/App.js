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
    spk_number: '', style_name: '', size: '', qty: 0,
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
            stock: 0
          };
        }
        acc[key].stock += (Number(curr.qty_in || 0) - Number(curr.qty_out || 0));
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
      type: 'OUT'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const sekarang = new Date();
    const waktuLokal = `${sekarang.toLocaleDateString('id-ID').replace(/\//g, '-')} ${sekarang.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;

    // VALIDASI STOK (FITUR KEMBALI)
    if (formData.type === 'OUT') {
      const match = inventory.find(i =>
        i.spk === formData.spk_number.toUpperCase() &&
        i.rack === formData.rack &&
        i.size === formData.size
      );
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
        source_from: formData.type === 'IN' ? formData.source_dest : '',
        destination: formData.type === 'OUT' ? formData.source_dest : '',
        rack_location: formData.rack,
        operator: formData.operator,
        waktu_input: waktuLokal
      });
      alert("✅ Tersimpan!");
      setFormData({ ...formData, spk_number: '', style_name: '', size: '', qty: 0 });
    } catch (err) {
      alert("Gagal Simpan!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeExport = (filterType) => {
    let data = rawRecords;
    if (filterType === 'HARI_INI') {
      const today = new Date().toLocaleDateString('id-ID').replace(/\//g, '-');
      data = rawRecords.filter(r => r.waktu_input?.startsWith(today));
    }
    const worksheet = XLSX.utils.json_to_sheet(data.map(r => ({
      "Waktu": r.waktu_input, "Operator": r.operator, "Tipe": r.qty_in > 0 ? "MASUK" : "KELUAR",
      "SPK": r.spk_number, "Style": r.style_name, "Size": r.size, "Qty": r.qty_in || r.qty_out, "Rak": r.rack_location
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
    XLSX.writeFile(workbook, `Laporan.xlsx`);
    setShowExportModal(false);
  };

  const filteredHistory = rawRecords.filter(r =>
    r.spk_number?.includes(searchTerm) ||
    r.style_name?.includes(searchTerm) ||
    r.rack_location?.includes(searchTerm)
  );

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
          <button type="submit" disabled={loading} style={{ ...s.btn, background: '#1a237e' }}>
            {loading ? "MENGECEK..." : "MASUK"}
          </button>
        </form>
      </div>
    </div>
  );

  // --- VIEW: TV DASHBOARD (STOCK MARKET THEME) ---
  if (viewMode === 'TV') return (
    <div style={{ background: '#050714', minHeight: '100vh', padding: '20px', color: 'white', fontFamily: 'monospace', overflow: 'hidden' }}>
       <style>{`
        @keyframes pulse-glow { 0% { box-shadow: 0 0 5px rgba(52, 152, 219, 0.2); } 50% { box-shadow: 0 0 20px rgba(52, 152, 219, 0.5); } 100% { box-shadow: 0 0 5px rgba(52, 152, 219, 0.2); } }
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
        .glass-card { background: rgba(22, 27, 34, 0.8); backdrop-filter: blur(10px); border: 1px solid rgba(48, 54, 61, 0.8); border-radius: 12px; }
        .active-rack { animation: pulse-glow 2s infinite; border: 1px solid #3498db !important; }
        .ticker-container::-webkit-scrollbar { width: 4px; }
        .ticker-container::-webkit-scrollbar-thumb { background: #3498db; }
      `}</style>

      {/* HEADER GAYA SAHAM */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', marginBottom: '20px', borderBottom: '3px solid #3498db' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: 0, color: '#3498db' }}><img src="/logo.png" alt="Stock" width="30" height="30" /> REAL-TIME STOCK TICKER</h1>
          <p style={{ margin: 0, color: '#888', fontSize: '12px' }}>LAST UPDATE: {new Date().toLocaleTimeString()}</p>
        </div>
        
        <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#2ecc71' }}>IN TODAY</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2ecc71', animation: 'blink 2s infinite' }}>▲ {inToday}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#e74c3c' }}>OUT TODAY</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#e74c3c', animation: 'blink 2s infinite' }}>▼ {outToday}</div>
          </div>
          <button onClick={() => setViewMode('ADMIN')} style={{ ...s.btn, background: '#e74c3c' }}>EXIT</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', height: '75vh' }}>
        {/* GRID RAK DENGAN DETAIL */}
        <div style={{ flex: 3, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
          {DAFTAR_RAK.map(rack => {
            const items = inventory.filter(i => i.rack === rack);
            const total = items.reduce((a, b) => a + b.stock, 0);
            return (
              <div key={rack} className={`glass-card ${total > 0 ? 'active-rack' : ''}`} style={{ padding: '15px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '20px', color: '#3498db', fontWeight: 'bold' }}>{rack}</span>
                  <span style={{ fontSize: '16px', background: '#1a237e', padding: '2px 8px', borderRadius: '4px' }}>{total} prs</span>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto' }} className="ticker-container">
                  {items.map((it, idx) => (
                    <div key={idx} style={{ padding: '8px 0', borderBottom: '1px solid #222', fontSize: '11px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3498db' }}>
                        <strong>{it.spk}</strong>
                        <strong style={{color: '#fff'}}>{it.stock}</strong>
                      </div>
                      <div style={{ color: '#888' }}>{it.style} | SZ: {it.size}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* LOG AKTIVITAS */}
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #1a237e' }}>
          <div style={{ padding: '15px', background: '#1a237e', fontWeight: 'bold' }}>LIVE TRANSACTION FEED</div>
          <div className="ticker-container" style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            {rawRecords.map((log, i) => (
              <div key={i} style={{ padding: '10px', background: '#161b33', borderRadius: '5px', marginBottom: '10px', borderLeft: `5px solid ${log.qty_in > 0 ? '#2ecc71' : '#e74c3c'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888' }}>
                  <span>{log.waktu_input}</span>
                  <span style={{color: log.qty_in > 0 ? '#2ecc71' : '#e74c3c'}}>{log.qty_in > 0 ? '▲ IN' : '▼ OUT'}</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', margin: '4px 0' }}>{log.spk_number}</div>
                <div style={{ fontSize: '12px' }}>QTY: {log.qty_in || log.qty_out} | RAK: {log.rack_location}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', background: '#1a237e', padding: '5px' }}>
        <marquee style={{ fontSize: '14px', fontWeight: 'bold' }}> TOTAL UNIT TERSEDIA: {inventory.reduce((a,b)=>a+b.stock, 0)} PRS | MONITORING AKTIF | HARAP INPUT DATA DENGAN TELITI </marquee>
      </div>
    </div>
  );

  // --- VIEW: ADMIN MODE (ORIGINAL + ALL FEATURES) ---
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
        <h2 style={{ margin: 0 }}><img src="/logo.png" alt="Logo" width="30" height="30" /> SUPERTMARKET CONTROL</h2>
        <div>
          <button onClick={() => setViewMode('TV')} style={{ ...s.btn, background: '#8e44ad', marginRight: '10px' }}>DASHBOARD VIEW</button>
          <button onClick={() => setShowExportModal(true)} style={{ ...s.btn, background: '#27ae60', marginRight: '10px' }}>EXPORT EXCEL</button>
          <button onClick={handleLogout} style={{ ...s.btn, background: '#e74c3c' }}>KELUAR</button>
        </div>
      </nav>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* FORM INPUT */}
        <div style={{ flex: '1' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h3>Input / Pengambilan</h3>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
              <button onClick={() => setFormData({ ...formData, type: 'IN' })} style={{ flex: 1, padding: '10px', background: formData.type === 'IN' ? '#2ecc71' : '#ddd', color: 'white', border: 'none', borderRadius: '5px' }}>MASUK</button>
              <button onClick={() => setFormData({ ...formData, type: 'OUT' })} style={{ flex: 1, padding: '10px', background: formData.type === 'OUT' ? '#e74c3c' : '#ddd', color: 'white', border: 'none', borderRadius: '5px' }}>KELUAR</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input style={s.input} placeholder="Nomor SPK" value={formData.spk_number} onChange={e => setFormData({ ...formData, spk_number: e.target.value.toUpperCase() })} required />
              <input style={s.input} placeholder="Style/Artikel" value={formData.style_name} onChange={e => setFormData({ ...formData, style_name: e.target.value.toUpperCase() })} required />
              <input style={s.input} placeholder="Size" value={formData.size} onChange={e => setFormData({ ...formData, size: e.target.value })} required />
              <input type="number" style={s.input} placeholder="Qty" value={formData.qty || ''} onChange={e => setFormData({ ...formData, qty: e.target.value })} required />
              <select style={s.input} value={formData.rack} onChange={e => setFormData({ ...formData, rack: e.target.value })} required>
                <option value="">-- Pilih Rak --</option>
                {DAFTAR_RAK.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <input style={s.input} placeholder="Asal/Tujuan" value={formData.source_dest} onChange={e => setFormData({ ...formData, source_dest: e.target.value })} required />
              <input style={s.input} placeholder="Operator" value={formData.operator} onChange={e => setFormData({ ...formData, operator: e.target.value })} required />
              <button type="submit" disabled={isSubmitting} style={{ ...s.btn, background: isSubmitting ? '#95a5a6' : '#1a237e', padding: '15px' }}>
                {isSubmitting ? "SEDANG MENYIMPAN..." : "SIMPAN"}
              </button>
            </form>
          </div>
        </div>

        {/* DISPLAY STOK RAK */}
        <div style={{ flex: '2.5', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <input
              style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #1a237e', boxSizing: 'border-box' }}
              placeholder=" CARI NOMOR SPK / STYLE / RAK..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value.toUpperCase())}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {DAFTAR_RAK.map(rack => {
                const items = inventory.filter(i => i.rack === rack && i.spk.includes(searchTerm));
                const total = items.reduce((a, b) => a + b.stock, 0);
                return (
                  <div key={rack} style={{ border: '1px solid #eee', padding: '10px', borderRadius: '8px', borderTop: `4px solid ${total > 0 ? '#3498db' : '#ddd'}` }}>
                    <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '10px' }}>{rack} ({total} prs)</div>
                    {items.map((it, idx) => (
                      <div key={idx} onClick={() => handlePickFromRack(it)} style={{ fontSize: '11px', marginBottom: '8px', padding: '5px', background: '#f9f9f9', borderRadius: '4px', cursor: 'pointer' }}>
                        <strong>{it.spk}</strong><br />
                        {it.style} | <span style={{ color: '#1a237e' }}>Sz: {it.size}</span>
                        <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#e74c3c' }}>Qty: {it.stock}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* TABEL LOG */}
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0 }}>Log Transaksi (Tersaring)</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa' }}>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                    <th style={s.th}>Waktu</th>
                    <th style={s.th}>Op</th>
                    <th style={s.th}>SPK / Style</th>
                    <th style={s.th}>Sz</th>
                    <th style={s.th}>Qty</th>
                    <th style={s.th}>Rak</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={s.td}>{r.waktu_input}</td>
                      <td style={s.td}>{r.operator}</td>
                      <td style={s.td}><strong>{r.spk_number}</strong><br />{r.style_name}</td>
                      <td style={s.td}>{r.size}</td>
                      <td style={{ ...s.td, color: r.qty_in > 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                        {r.qty_in > 0 ? `+${r.qty_in}` : `-${r.qty_out}`}
                      </td>
                      <td style={s.td}>{r.rack_location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  input: { padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' },
  btn: { padding: '10px 15px', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' },
  th: { padding: '10px' },
  td: { padding: '10px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  modalContent: { background: 'white', padding: '30px', borderRadius: '15px', textAlign: 'center', minWidth: '300px' }
};

export default App;