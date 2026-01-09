import React, { useState, useEffect, useCallback } from 'react';
import PocketBase from 'pocketbase';
import * as XLSX from 'xlsx';

// Sesuaikan IP server jika berpindah jaringan
const pb = new PocketBase('http://192.168.95.115:8090'); 

const DAFTAR_RAK = ["A-01", "A-02", "A-03", "A-04", "B-01", "B-02", "B-03", "B-04", "C-01", "C-02", "C-03", "C-04"];

function App() {
  const [inventory, setInventory] = useState([]);
  const [rawRecords, setRawRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [formData, setFormData] = useState({
    spk_number: '', style_name: '', size: '', qty: 0, 
    type: 'IN', source_dest: '', rack: '', operator: ''
  });

  // FUNGSI TAMPILKAN WAKTU
  const formatTanggalTabel = (record) => {
    // 1. Cek field custom waktu_input (Hasil Input Baru)
    if (record.waktu_input) return record.waktu_input;
    
    // 2. Fallback ke field sistem created (Data Lama)
    if (!record.created) return "-";
    try {
      const date = new Date(record.created.replace(' ', 'T'));
      if (isNaN(date.getTime())) return "-";
      
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const y = date.getFullYear();
      const jam = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      return `${d}-${m}-${y} ${jam}:${min}`;
    } catch (e) {
      return "-";
    }
  };

  const executeExport = (filterType) => {
    let dataToExport = rawRecords;
    if (filterType === 'HARI_INI') {
      const today = new Date().toLocaleDateString('id-ID').replace(/\//g, '-');
      dataToExport = rawRecords.filter(r => r.waktu_input && r.waktu_input.startsWith(today));
      
      if (dataToExport.length === 0) {
        alert("Tidak ada transaksi untuk hari ini.");
        setShowExportModal(false);
        return;
      }
    }

    const dataLaporan = dataToExport.map((r) => ({
      "Waktu": formatTanggalTabel(r),
      "Operator": r.operator,
      "Tipe": r.qty_in > 0 ? "MASUK" : "KELUAR",
      "No SPK": r.spk_number,
      "Style": r.style_name,
      "Size": r.size,
      "Qty": r.qty_in > 0 ? r.qty_in : r.qty_out,
      "Rak": r.rack_location,
      "Asal/Tujuan": r.qty_in > 0 ? r.source_from : r.destination
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataLaporan);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Stok");
    XLSX.writeFile(workbook, `Laporan_${filterType}_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.xlsx`);
    setShowExportModal(false);
  };

  const fetchData = useCallback(async () => {
    try {
      // Menggunakan sort -id agar lebih stabil jika created bermasalah
      const records = await pb.collection('upper_stock').getFullList({ 
        sort: '-id', 
        requestKey: null 
      });
      setRawRecords(records);
      
      const summary = records.reduce((acc, curr) => {
        const inQty = Number(curr.qty_in || 0);
        const outQty = Number(curr.qty_out || 0);
        const rackLoc = curr.rack_location || "Tanpa Rak";
        const spk = curr.spk_number || "Tanpa SPK";
        const key = `${spk}-${curr.size}-${rackLoc}`;

        if (!acc[key]) {
          acc[key] = { spk, style: curr.style_name || "", size: curr.size || "", rack: rackLoc, stock: 0 };
        }
        acc[key].stock += (inQty - outQty);
        return acc;
      }, {});
      setInventory(Object.values(summary).filter(i => i.stock !== 0));
    } catch (error) { 
        console.error("Gagal sinkronisasi:", error); 
    }
  }, []);

  useEffect(() => {
    fetchData();
    const unsubscribe = pb.collection('upper_stock').subscribe('*', () => fetchData());
    return () => {
      unsubscribe.then(unsub => unsub());
    };
  }, [fetchData]);

  const handleQuickPick = (item) => {
    setFormData({
      ...formData, type: 'OUT', spk_number: item.spk, style_name: item.style,
      size: item.size, rack: item.rack, qty: item.stock
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Format Waktu Realtime: "22-05-2024 14:30"
    const sekarang = new Date();
    const tgl = sekarang.toLocaleDateString('id-ID').replace(/\//g, '-');
    const jam = sekarang.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const waktuLokal = `${tgl} ${jam}`;

    if (formData.type === 'OUT') {
      const currentStock = inventory.filter(i => i.rack === formData.rack && i.spk === formData.spk_number.toUpperCase()).reduce((a, b) => a + b.stock, 0);
      if (Number(formData.qty) > currentStock) {
        alert(`⚠️ STOK KURANG! Stok di Rak ${formData.rack} hanya ${currentStock} prs.`);
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
    } catch (err) { 
        alert("Gagal Simpan! Pastikan field 'waktu_input' (Plain Text) sudah ada di PocketBase."); 
    }
  };

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      
      {showExportModal && (
        <div style={s.modalOverlay}>
          <div style={s.modalContent}>
            <h3 style={{marginTop: 0}}>Pilih Laporan</h3>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center' }}>
              <button onClick={() => executeExport('HARI_INI')} style={{ ...s.btn, background: '#3498db' }}>HARI INI</button>
              <button onClick={() => executeExport('SEMUA_DATA')} style={{ ...s.btn, background: '#27ae60' }}>SEMUA DATA</button>
              <button onClick={() => setShowExportModal(false)} style={{ ...s.btn, background: '#95a5a6' }}>BATAL</button>
            </div>
          </div>
        </div>
      )}

      <nav style={{ background: '#1a237e', color: 'white', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{margin:0}}><img src="/logo.png" alt="Logo" style={{ height: '40px', verticalAlign: 'middle' }} /> UPPER BANK CONTROL</h2>
        <button onClick={() => setShowExportModal(true)} style={{ background: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}><img src="/Excell.png" alt="Export" style={{ height: '20px', verticalAlign: 'middle' }} /> EXPORT EXCEL</button>
      </nav>

      <div style={{ display: 'flex', gap: '20px', padding: '20px' }}>
        <div style={{ flex: '1', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h3>Input / Pengambilan</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button onClick={() => setFormData({...formData, type:'IN'})} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: formData.type === 'IN' ? '#2ecc71' : '#ddd', color: 'white', cursor:'pointer' }}>MASUK</button>
            <button onClick={() => setFormData({...formData, type:'OUT'})} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: formData.type === 'OUT' ? '#e74c3c' : '#ddd', color: 'white', cursor:'pointer' }}>KELUAR</button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input style={s.input} placeholder="Nomor SPK" value={formData.spk_number} onChange={e => setFormData({...formData, spk_number: e.target.value})} required />
            <input style={s.input} placeholder="Style/Artikel" value={formData.style_name} onChange={e => setFormData({...formData, style_name: e.target.value})} required />
            <input style={s.input} placeholder="Size" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} required />
            <input type="number" style={s.input} placeholder="Qty" value={formData.qty || ''} onChange={e => setFormData({...formData, qty: e.target.value})} required />
            <select style={s.input} value={formData.rack} onChange={e => setFormData({...formData, rack: e.target.value})} required>
              <option value="">-- Pilih Rak --</option>
              {DAFTAR_RAK.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <input style={s.input} placeholder={formData.type === 'IN' ? 'Asal Barang' : 'Tujuan (Input Kemana)'} value={formData.source_dest} onChange={e => setFormData({...formData, source_dest: e.target.value})} required />
            <input style={s.input} placeholder="Nama Operator" value={formData.operator} onChange={e => setFormData({...formData, operator: e.target.value})} required />
            <button type="submit" style={{ padding: '12px', borderRadius: '8px', border: 'none', background: '#1a237e', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>SIMPAN</button>
          </form>
        </div>

        <div style={{ flex: '2' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px' }}>
            <input style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd' }} placeholder="🔍 Cari SPK..." onChange={e => setSearchTerm(e.target.value.toUpperCase())} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
              {DAFTAR_RAK.map(rack => {
                const items = inventory.filter(i => i.rack === rack && i.spk.includes(searchTerm));
                const total = items.reduce((a, b) => a + b.stock, 0);
                return (
                  <div key={rack} style={{ ...s.card, borderTop: `5px solid ${total > 0 ? '#3498db' : '#ddd'}` }}>
                    <center><strong>{rack}</strong> ({total} prs)</center>
                    <div style={{ marginTop: '8px', fontSize: '11px' }}>
                      {items.map((it, idx) => (
                        <div key={idx} style={{ borderBottom: '1px solid #eee', padding: '3px 0', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{it.spk}<br/><small style={{color:'#7f8c8d'}}>{it.style}</small></span>
                          <button onClick={() => handleQuickPick(it)} style={{border:'none', background:'#e74c3c', color:'white', borderRadius:'3px', cursor:'pointer', padding:'0 5px'}}>📦 {it.stock}</button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginTop: '15px' }}>
            <h4 style={{marginTop: 0}}>Log Transaksi</h4>
            <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>
                  <tr style={{ textAlign: 'left' }}>
                    <th style={s.th}>Waktu</th>
                    <th style={s.th}>Operator</th>
                    <th style={s.th}>SPK</th>
                    <th style={s.th}>Qty</th>
                    <th style={s.th}>Rak</th>
                    <th style={s.th}>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {rawRecords.map((r, i) => (
                    <tr key={r.id || i} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={s.td}>{formatTanggalTabel(r)}</td>
                      <td style={s.td}><strong>{r.operator}</strong></td>
                      <td style={s.td}>{r.spk_number}</td>
                      <td style={{ ...s.td, color: r.qty_in > 0 ? '#27ae60' : '#e74c3c', fontWeight: 'bold' }}>
                        {r.qty_in > 0 ? `+${r.qty_in}` : `-${r.qty_out}`}
                      </td>
                      <td style={s.td}>{r.rack_location}</td>
                      <td style={s.td}><small>{r.qty_in > 0 ? `Asal: ${r.source_from}` : `Tujuan: ${r.destination}`}</small></td>
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
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #ddd' },
  card: { background: '#fff', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  th: { padding: '10px', borderBottom: '1px solid #ddd' },
  td: { padding: '10px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { background: 'white', padding: '30px', borderRadius: '15px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', width: '350px' },
  btn: { padding: '10px 15px', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }
};

export default App;