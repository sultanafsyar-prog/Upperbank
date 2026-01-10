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
    } catch (err) {
      alert("Login Gagal! Periksa Email & Password Anda.");
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
      // Ambil 200 data terbaru untuk History
      const records = await pb.collection('upper_stock').getList(1, 200, { 
        sort: '-created', 
        requestKey: null 
      });
      setRawRecords(records.items);
      
      // Ambil semua data untuk hitung Stok Akurat di Rak
      const allRecords = await pb.collection('upper_stock').getFullList({ requestKey: null });
      const summary = allRecords.reduce((acc, curr) => {
        const inQty = Number(curr.qty_in || 0);
        const outQty = Number(curr.qty_out || 0);
        const rackLoc = curr.rack_location || "Tanpa Rak";
        const spk = curr.spk_number || "Tanpa SPK";
        const size = curr.size || "No Size";
        const style = curr.style_name || "";
        const key = `${spk}-${size}-${rackLoc}`;
        
        if (!acc[key]) {
          acc[key] = { spk, style, size, rack: rackLoc, stock: 0 };
        }
        acc[key].stock += (inQty - outQty);
        return acc;
      }, {});

      setInventory(Object.values(summary).filter(i => i.stock !== 0));
    } catch (error) { console.error("Gagal sinkronisasi:", error); }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
      const unsubscribe = pb.collection('upper_stock').subscribe('*', () => fetchData());
      return () => { unsubscribe.then(unsub => unsub()); };
    }
  }, [fetchData, isLoggedIn]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const sekarang = new Date();
    const tgl = sekarang.toLocaleDateString('id-ID').replace(/\//g, '-');
    const jam = sekarang.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const waktuLokal = `${tgl} ${jam}`;

    if (formData.type === 'OUT') {
      const matchItem = inventory.find(i => 
        i.spk === formData.spk_number.toUpperCase() && 
        i.rack === formData.rack && 
        i.size === formData.size
      );
      const availableStock = matchItem ? matchItem.stock : 0;
      if (Number(formData.qty) > availableStock) {
        alert(`⚠️ STOK TIDAK CUKUP!\nRak: ${formData.rack}\nSize: ${formData.size}\nStok Tersedia: ${availableStock} prs`);
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
      alert("✅ Transaksi Berhasil!");
      setFormData({ ...formData, spk_number: '', style_name: '', size: '', qty: 0 });
    } catch (err) { alert("Gagal Simpan!"); }
  };

  const executeExport = (filterType) => {
    let dataToExport = rawRecords;
    if (filterType === 'HARI_INI') {
      const today = new Date().toLocaleDateString('id-ID').replace(/\//g, '-');
      dataToExport = rawRecords.filter(r => r.waktu_input && r.waktu_input.startsWith(today));
    }
    const dataLaporan = dataToExport.map((r) => ({
      "Waktu": r.waktu_input || "-",
      "Operator": r.operator,
      "Tipe": r.qty_in > 0 ? "MASUK" : "KELUAR",
      "No SPK": r.spk_number, "Style": r.style_name, "Size": r.size,
      "Qty": r.qty_in > 0 ? r.qty_in : r.qty_out, "Rak": r.rack_location,
      "Asal/Tujuan": r.qty_in > 0 ? r.source_from : r.destination
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataLaporan);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Stok");
    XLSX.writeFile(workbook, `Laporan_Stok.xlsx`);
    setShowExportModal(false);
  };

  if (!isLoggedIn) {
    return (
      <div style={{ ...s.modalOverlay, backgroundColor: '#1a237e' }}>
        <div style={{ ...s.modalContent, width: '400px', padding: '40px' }}>
          <h2 style={{ color: '#1a237e' }}>LOGIN SYSTEM</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input style={s.input} type="email" placeholder="Email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
            <input style={s.input} type="password" placeholder="Password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
            <button type="submit" disabled={loading} style={{ ...s.btn, background: '#1a237e' }}>{loading ? '...' : 'MASUK'}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      {showExportModal && (
        <div style={s.modalOverlay}>
          <div style={s.modalContent}>
            <h3><img src="/Excell.png" alt="Pilih Laporan" style={{ width: '20px', height: '20px', marginRight: '10px' }} />Pilih Laporan</h3>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center' }}>
              <button onClick={() => executeExport('HARI_INI')} style={{ ...s.btn, background: '#3498db' }}>HARI INI</button>
              <button onClick={() => executeExport('SEMUA_DATA')} style={{ ...s.btn, background: '#27ae60' }}>SEMUA DATA</button>
              <button onClick={() => setShowExportModal(false)} style={{ ...s.btn, background: '#95a5a6' }}>BATAL</button>
            </div>
          </div>
        </div>
      )}

      <nav style={{ background: '#1a237e', color: 'white', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{margin:0}}><img src="/logo.png" alt="Logo" style={{ width: '30px', height: '30px', marginRight: '10px' }} />UPPER BANK CONTROL</h2>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <button onClick={() => setShowExportModal(true)} style={{ background: '#27ae60', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>EXPORT EXCEL</button>
            <button onClick={handleLogout} style={{ background: '#e74c3c', border: 'none', color: 'white', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer' }}>Keluar 🚪</button>
        </div>
      </nav>

      <div style={{ display: 'flex', gap: '20px', padding: '20px' }}>
        {/* FORM INPUT */}
        <div style={{ flex: '1', height: 'fit-content' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3>Input / Pengambilan</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <button onClick={() => setFormData({...formData, type:'IN'})} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: formData.type === 'IN' ? '#2ecc71' : '#ddd', color: 'white' }}>MASUK</button>
              <button onClick={() => setFormData({...formData, type:'OUT'})} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: formData.type === 'OUT' ? '#e74c3c' : '#ddd', color: 'white' }}>KELUAR</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input style={s.input} placeholder="Nomor SPK" value={formData.spk_number} onChange={e => setFormData({...formData, spk_number: e.target.value.toUpperCase()})} required />
              <input style={s.input} placeholder="Style/Artikel" value={formData.style_name} onChange={e => setFormData({...formData, style_name: e.target.value.toUpperCase()})} required />
              <input style={s.input} placeholder="Size" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} required />
              <input type="number" style={s.input} placeholder="Qty" value={formData.qty || ''} onChange={e => setFormData({...formData, qty: e.target.value})} required />
              <select style={s.input} value={formData.rack} onChange={e => setFormData({...formData, rack: e.target.value})} required>
                <option value="">-- Pilih Rak --</option>
                {DAFTAR_RAK.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <input style={s.input} placeholder={formData.type === 'IN' ? 'Asal Barang' : 'Tujuan'} value={formData.source_dest} onChange={e => setFormData({...formData, source_dest: e.target.value})} required />
              <input style={s.input} placeholder="Operator" value={formData.operator} onChange={e => setFormData({...formData, operator: e.target.value})} required />
              <button type="submit" style={{ padding: '12px', borderRadius: '8px', border: 'none', background: '#1a237e', color: 'white', fontWeight: 'bold' }}>SIMPAN</button>
            </form>
          </div>
        </div>

        {/* RAK & HISTORY */}
        <div style={{ flex: '2.5' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <input style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd' }} placeholder="🔍 Cari SPK di Rak..." onChange={e => setSearchTerm(e.target.value.toUpperCase())} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {DAFTAR_RAK.map(rack => {
                const items = inventory.filter(i => i.rack === rack && i.spk.includes(searchTerm));
                const total = items.reduce((a, b) => a + b.stock, 0);
                return (
                  <div key={rack} style={{ ...s.card, borderTop: `5px solid ${total > 0 ? '#3498db' : '#ddd'}` }}>
                    <center style={{marginBottom:'10px'}}><strong>{rack}</strong> <span style={{fontSize:'12px', color:'#7f8c8d'}}>({total} prs)</span></center>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {items.map((it, idx) => (
                        <div key={idx} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: '11px', lineHeight: '1.2' }}>
                            <strong style={{color:'#2c3e50'}}>{it.spk}</strong><br/>
                            <span style={{color:'#7f8c8d'}}>{it.style}</span><br/>
                            <span style={{color:'#1a237e', fontWeight:'bold'}}>Size: {it.size}</span>
                          </div>
                          <button onClick={() => setFormData({...formData, type: 'OUT', spk_number: it.spk, style_name: it.style, size: it.size, rack: it.rack, qty: it.stock})} style={{border:'none', background:'#e74c3c', color:'white', borderRadius:'4px', padding:'4px 8px', fontSize:'11px', cursor:'pointer'}}>
                             {it.stock}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginTop: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h4 style={{marginTop: 0}}>Log Transaksi (200 Terbaru)</h4>
            <div style={{ maxHeight: '450px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 10 }}>
                  <tr style={{ textAlign: 'left' }}>
                    <th style={s.th}>Waktu</th>
                    <th style={s.th}>Op</th>
                    <th style={s.th}>SPK / Style</th>
                    <th style={s.th}>Sz</th>
                    <th style={s.th}>Qty</th>
                    <th style={s.th}>Rak</th>
                  </tr>
                </thead>
                <tbody>
                  {rawRecords.map((r, i) => (
                    <tr key={r.id || i} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={s.td}>{r.waktu_input || '-'}</td>
                      <td style={s.td}>{r.operator}</td>
                      <td style={s.td}><strong>{r.spk_number}</strong><br/><small>{r.style_name}</small></td>
                      <td style={s.td}>{r.size}</td>
                      <td style={{ ...s.td, color: r.qty_in > 0 ? '#27ae60' : '#e74c3c', fontWeight: 'bold' }}>
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
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' },
  card: { background: '#fff', padding: '12px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', minHeight: '100px' },
  th: { padding: '10px', borderBottom: '1px solid #ddd', background: '#f8f9fa' },
  td: { padding: '10px', borderBottom: '1px solid #eee' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { background: 'white', padding: '30px', borderRadius: '15px', textAlign: 'center', width: '380px' },
  btn: { padding: '12px 20px', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }
};

export default App;