import React, { useState, useEffect, useCallback } from 'react';
import PocketBase from 'pocketbase';
import * as XLSX from 'xlsx';

const pb = new PocketBase('https://upperbank-production-c0b5.up.railway.app');

// --- UPDATE: Daftar Rak Sesuai Permintaan (I-D, 01-06) ---
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
      const res = await pb.collection('upper_stock').getList(1, 100, {
        sort: '-created',
        requestKey: null
      });
      setRawRecords(res.items);

      const allRecords = await pb.collection('upper_stock').getFullList({
        sort: 'created',
        requestKey: null
      });

      const summary = allRecords.reduce((acc, curr) => {
        const key = `${curr.spk_number}-${curr.size}-${curr.rack_location}`;
        if (!acc[key]) {
          acc[key] = {
            spk: curr.spk_number, style: curr.style_name, size: curr.size,
            rack: curr.rack_location, stock: 0, target: 0, xfd: '',
            last_to: '', last_move: '', last_created: '', last_out_created: ''
          };
        }

        const qtyIn = Number(curr.qty_in || 0);
        const qtyOut = Number(curr.qty_out || 0);
        acc[key].stock += (qtyIn - qtyOut);

        if (Number(curr.target_qty) > 0) acc[key].target = Number(curr.target_qty);
        if (curr.xfd_date) acc[key].xfd = curr.xfd_date;

        const created = curr.created || '';
        if (!acc[key].last_created || created > acc[key].last_created) {
          acc[key].last_created = created;
          acc[key].last_move = qtyOut > 0 ? 'OUT' : (qtyIn > 0 ? 'IN' : acc[key].last_move);
        }

        if (qtyOut > 0 && curr.destination) {
          if (!acc[key].last_out_created || created > acc[key].last_out_created) {
            acc[key].last_out_created = created;
            acc[key].last_to = curr.destination;
          }
        }
        return acc;
      }, {});

      setInventory(Object.values(summary).filter(i => i.stock > 0));
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await pb.collection('users').authWithPassword(loginEmail, loginPassword);
      setIsLoggedIn(true);
    } catch (err) {
      alert("⚠️ LOGIN GAGAL!");
    } finally {
      setLoading(false);
    }
  };

  // --- FITUR BARU: Reset Database ---
  const handleResetDatabase = async () => {
    const confirm = window.prompt("Ketik 'HAPUS' untuk menghapus SEMUA data transaksi:");
    if (confirm !== 'HAPUS') return;
    
    setLoading(true);
    try {
      const records = await pb.collection('upper_stock').getFullList({ fields: 'id' });
      await Promise.all(records.map(rec => pb.collection('upper_stock').delete(rec.id)));
      alert("✅ Database berhasil dibersihkan!");
      fetchData();
    } catch (err) {
      alert("❌ Gagal reset database!");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const sekarang = new Date();
    const waktuLokal = `${sekarang.toLocaleDateString('id-ID').replace(/\//g, '-')} ${sekarang.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;

    try {
      await pb.collection('upper_stock').create({
        ...formData,
        spk_number: formData.spk_number.toUpperCase(),
        style_name: formData.style_name.toUpperCase(),
        qty_in: formData.type === 'IN' ? Number(formData.qty) : 0,
        qty_out: formData.type === 'OUT' ? Number(formData.qty) : 0,
        rack_location: formData.rack,
        source_from: formData.type === 'IN' ? formData.source_dest : '',
        destination: formData.type === 'OUT' ? formData.source_dest : '',
        waktu_input: waktuLokal
      });

      alert("✅ Tersimpan!");
      setFormData({ ...formData, spk_number: '', style_name: '', size: '', qty: 0, target_qty: 0, xfd_date: '', source_dest: '' });
    } catch (err) {
      alert("❌ Gagal Simpan!");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const exportToXlsx = (rows, fileName) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  if (!isLoggedIn) return (
    <div style={{ ...s.modalOverlay, background: '#1a237e' }}>
      <div style={s.modalContent}>
        <h2>LOGIN SYSTEM</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input style={s.input} type="email" placeholder="Email" onChange={e => setLoginEmail(e.target.value)} required />
          <input style={s.input} type="password" placeholder="Password" onChange={e => setLoginPassword(e.target.value)} required />
          <button type="submit" disabled={loading} style={{ ...s.btn, background: '#1a237e' }}> {loading ? "PROSES..." : "MASUK"} </button>
        </form>
      </div>
    </div>
  );

  if (viewMode === 'TV') return (
    <div style={{ background: '#050714', minHeight: '100vh', padding: '15px', color: 'white', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 30px', marginBottom: '15px', borderBottom: '4px solid #3498db', background: 'rgba(22, 27, 34, 0.8)', borderRadius: '12px' }}>
        <h1 style={{ fontSize: '28px', margin: 0, color: '#3498db' }}>PRODUCTION MONITOR (RAK I-D)</h1>
        <button onClick={() => setViewMode('ADMIN')} style={{ ...s.btn, background: '#e74c3c' }}>EXIT</button>
      </div>

      <div style={{ display: 'flex', gap: '20px', height: '82vh' }}>
        {/* Kolom Rak (Kiri) */}
        <div style={{ flex: 4, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', overflowY: 'auto' }}>
          {HURUF_RAK.map(huruf => (
            <div key={huruf} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: '#3498db', color: 'black', textAlign: 'center', fontWeight: 'bold', padding: '5px', borderRadius: '4px' }}>RAK {huruf}</div>
              {NOMOR_RAK.map(nomor => {
                const rack = `${huruf}-${nomor}`;
                const items = inventory.filter(i => i.rack === rack);
                const total = items.reduce((a, b) => a + b.stock, 0);
                return (
                  <div key={rack} style={{ background: 'rgba(22, 27, 34, 0.8)', padding: '10px', borderRadius: '8px', border: total > 0 ? '1px solid #3498db' : '1px solid #333' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '5px', marginBottom: '5px' }}>
                      <span style={{ color: '#3498db', fontWeight: 'bold' }}>{rack}</span>
                      <span style={{ color: '#fff' }}>{total}</span>
                    </div>
                    {items.slice(0, 3).map((it, idx) => (
                      <div key={idx} style={{ fontSize: '11px', marginBottom: '4px' }}>
                        {it.spk} ({it.stock}) <br/>
                        <span style={{ color: '#e67e22' }}>XFD: {it.xfd || '-'}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Live Activity Feed (Kanan) */}
        <div style={{ flex: 1, background: 'rgba(22, 27, 34, 0.8)', borderRadius: '12px', padding: '15px', border: '1px solid #333', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 15px 0', textAlign: 'center', color: '#3498db', borderBottom: '2px solid #333' }}>LIVE ACTIVITY</h3>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {rawRecords.map((log, i) => (
              <div key={i} style={{ padding: '8px', borderBottom: '1px solid #222', fontSize: '11px' }}>
                <b style={{ color: log.qty_in > 0 ? '#2ecc71' : '#e74c3c' }}>{log.qty_in > 0 ? 'IN' : 'OUT'}</b> | {log.spk_number} <br/>
                <span style={{ color: '#aaa' }}>{log.rack_location} | {log.waktu_input}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#f4f7f6', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <nav style={{ background: '#1a237e', color: 'white', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>SUPERMARKET ADMIN</h2>
        <div>
          <button onClick={() => setViewMode('TV')} style={{ ...s.btn, background: '#8e44ad', marginRight: '10px' }}>DASHBOARD TV</button>
          <button onClick={() => setShowExportModal(true)} style={{ ...s.btn, background: '#16a085', marginRight: '10px' }}>DATA MENU</button>
          <button onClick={() => { pb.authStore.clear(); setIsLoggedIn(false); }} style={{ ...s.btn, background: '#e74c3c' }}>LOGOUT</button>
        </div>
      </nav>

      {showExportModal && (
        <div style={s.modalOverlay}>
          <div style={s.modalContent}>
            <h3>MANAGEMENT DATA</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => exportToXlsx(inventory, 'Summary_Stock')} style={{ ...s.btn, background: '#1a237e' }}>Export Summary (XLSX)</button>
              <button onClick={() => exportToXlsx(rawRecords, 'History_Log')} style={{ ...s.btn, background: '#8e44ad' }}>Export History (XLSX)</button>
              <hr/>
              <button onClick={handleResetDatabase} style={{ ...s.btn, background: '#c0392b' }}>⚠️ RESET DATABASE</button>
              <button onClick={() => setShowExportModal(false)} style={{ ...s.btn, background: '#95a5a6' }}>TUTUP</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Form Input (Tetap Sama) */}
        <div style={{ flex: '1', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <h3>Input Transaksi</h3>
          <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
            <button type="button" onClick={() => setFormData({ ...formData, type: 'IN' })} style={{ flex: 1, padding: '12px', background: formData.type === 'IN' ? '#2ecc71' : '#eee', color: formData.type === 'IN' ? 'white' : '#666', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>IN (Masuk)</button>
            <button type="button" onClick={() => setFormData({ ...formData, type: 'OUT' })} style={{ flex: 1, padding: '12px', background: formData.type === 'OUT' ? '#e74c3c' : '#eee', color: formData.type === 'OUT' ? 'white' : '#666', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>OUT (Keluar)</button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input style={s.input} placeholder="Nomor SPK" value={formData.spk_number} onChange={e => setFormData({ ...formData, spk_number: e.target.value.toUpperCase() })} required />
            <input style={s.input} placeholder="Style/Artikel" value={formData.style_name} onChange={e => setFormData({ ...formData, style_name: e.target.value.toUpperCase() })} required />
            <div style={{ display: 'flex', gap: '8px' }}>
              <input style={{ ...s.input, flex: 1 }} placeholder="Size" value={formData.size} onChange={e => setFormData({ ...formData, size: e.target.value })} required />
              <input style={{ ...s.input, flex: 1 }} placeholder="Target Qty" type="number" value={formData.target_qty || ''} onChange={e => setFormData({ ...formData, target_qty: e.target.value })} />
            </div>
            <input style={s.input} placeholder="XFD Date" type="date" value={formData.xfd_date} onChange={e => setFormData({ ...formData, xfd_date: e.target.value })} />
            <input type="number" style={s.input} placeholder="Jumlah" value={formData.qty || ''} onChange={e => setFormData({ ...formData, qty: e.target.value })} required />
            <select style={s.input} value={formData.rack} onChange={e => setFormData({ ...formData, rack: e.target.value })} required>
              <option value="">-- Pilih Rak --</option>
              {DAFTAR_RAK.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <input style={s.input} placeholder="Keterangan / Tujuan" value={formData.source_dest} onChange={e => setFormData({ ...formData, source_dest: e.target.value })} required />
            <input style={s.input} placeholder="Operator" value={formData.operator} onChange={e => setFormData({ ...formData, operator: e.target.value })} required />
            <button type="submit" disabled={isSubmitting} style={{ ...s.btn, background: '#1a237e', padding: '15px' }}>SIMPAN</button>
          </form>
        </div>

        {/* Area Rak Admin (Visual Vertikal) */}
        <div style={{ flex: '2.5', background: 'white', padding: '20px', borderRadius: '12px' }}>
          <input style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ccc' }} placeholder="Cari SPK..." onChange={e => setSearchTerm(e.target.value.toUpperCase())} />
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
            {HURUF_RAK.map(h => (
              <div key={h} style={{ flex: 1, minWidth: '130px' }}>
                <div style={{ textAlign: 'center', background: '#f8f9fa', padding: '5px', fontWeight: 'bold', border: '1px solid #ddd' }}>RAK {h}</div>
                {NOMOR_RAK.map(n => {
                  const r = `${h}-${n}`;
                  const items = inventory.filter(i => i.rack === r && i.spk.includes(searchTerm));
                  const total = items.reduce((a, b) => a + b.stock, 0);
                  return (
                    <div key={r} onClick={() => items[0] && handlePickFromRack(items[0])} style={{ padding: '8px', border: '1px solid #eee', marginTop: '5px', background: total > 0 ? '#e3f2fd' : 'white', cursor: 'pointer', borderRadius: '4px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{r} ({total})</div>
                      {items.map((it, idx) => <div key={idx} style={{ fontSize: '9px', color: '#666' }}>• {it.spk}</div>)}
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
  input: { padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px' },
  btn: { padding: '10px 15px', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, background: 'rgba(0,0,0,0.5)' },
  modalContent: { background: 'white', padding: '25px', borderRadius: '15px', textAlign: 'center', minWidth: '350px' }
};

export default App;