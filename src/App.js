import React, { useState, useEffect, useCallback } from 'react';
import PocketBase from 'pocketbase';
import * as XLSX from 'xlsx';

const pb = new PocketBase('https://upperbank-production-c0b5.up.railway.app');

// Rack: D/E/F/H/I masing-masing 6
const RACK_LETTERS = ['D', 'E', 'F', 'H', 'I'];
const DAFTAR_RAK = RACK_LETTERS.flatMap((l) =>
  Array.from({ length: 6 }, (_, i) => `${l}-${String(i + 1).padStart(2, '0')}`)
);

// Urutan kolom TV: I, H, F, E, D
const TV_COLUMN_ORDER = ['I', 'H', 'F', 'E', 'D'];

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
    spk_number: '',
    style_name: '',
    size: '',
    qty: 0,
    target_qty: 0,
    xfd_date: '',
    type: 'IN',
    source_dest: '',
    rack: '',
    operator: ''
  });

  // ============================
  // LOGIN / LOGOUT
  // ============================
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
      alert('⚠️ LOGIN GAGAL: Periksa kembali email dan password!');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    pb.authStore.clear();
    setIsLoggedIn(false);
  };

  // ============================
  // FETCH DATA
  // ============================
  const fetchData = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      // ambil lebih banyak utk sparkline lebih smooth (masih aman)
      const res = await pb.collection('upper_stock').getList(1, 300, {
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
            spk: curr.spk_number,
            style: curr.style_name,
            size: curr.size,
            rack: curr.rack_location,
            stock: 0,
            target: 0,
            xfd: '',
            last_from: '',
            last_to: '',
            last_move: '',
            last_created: '',
            last_out_created: ''
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

        if (qtyIn > 0 && curr.source_from) acc[key].last_from = curr.source_from;

        if (qtyOut > 0 && curr.destination) {
          if (!acc[key].last_out_created || created > acc[key].last_out_created) {
            acc[key].last_out_created = created;
            acc[key].last_to = curr.destination;
          }
        }

        return acc;
      }, {});

      setInventory(Object.values(summary).filter((i) => i.stock > 0));
    } catch (error) {
      console.error('Gagal Sinkronisasi:', error);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
      const unsubscribe = pb.collection('upper_stock').subscribe('*', () => fetchData());
      return () => unsubscribe.then((unsub) => unsub());
    }
  }, [fetchData, isLoggedIn]);

  // ============================
  // SUBMIT
  // ============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const sekarang = new Date();
    const waktuLokal =
      `${sekarang.toLocaleDateString('id-ID').replace(/\//g, '-')}` +
      ` ${sekarang.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;

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

      alert('✅ Data Berhasil Disimpan!');
      setFormData({
        ...formData,
        spk_number: '',
        style_name: '',
        size: '',
        qty: 0,
        target_qty: 0,
        xfd_date: '',
        source_dest: ''
      });
    } catch (err) {
      alert('❌ Gagal Simpan!');
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

  // ============================
  // EXPORT XLSX
  // ============================
  const exportToXlsx = (rows, sheetName, fileName) => {
    if (!rows || rows.length === 0) {
      alert('⚠️ Tidak ada data untuk diexport.');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, fileName);
  };

  const handleExportInventoryXlsx = () => {
    const rows = inventory.map((it) => ({
      SPK: it.spk,
      STYLE: it.style,
      SIZE: it.size,
      RAK: it.rack,
      STOCK: it.stock,
      TARGET: it.target,
      XFD: it.xfd,
      TO_TERAKHIR: it.last_to || '',
      FROM_TERAKHIR: it.last_from || '',
      LAST_MOVE: it.last_move || ''
    }));

    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    exportToXlsx(rows, 'Inventory_Summary', `Inventory_Summary_${stamp}.xlsx`);
  };

  const handleExportRawXlsx = () => {
    const rows = rawRecords.map((r) => ({
      CREATED: r.created,
      WAKTU_INPUT: r.waktu_input,
      OPERATOR: r.operator,
      SPK: r.spk_number,
      STYLE: r.style_name,
      SIZE: r.size,
      RAK: r.rack_location,
      QTY_IN: Number(r.qty_in || 0),
      QTY_OUT: Number(r.qty_out || 0),
      SOURCE_FROM: r.source_from,
      DESTINATION: r.destination,
      TARGET_QTY: Number(r.target_qty || 0),
      XFD: r.xfd_date
    }));

    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    exportToXlsx(rows, 'Raw_Transactions', `Raw_Transactions_${stamp}.xlsx`);
  };

  // ============================
  // Helper: total stock per rack (current)
  // ============================
  const getCurrentRackTotal = (rack) => {
    return inventory
      .filter((i) => i.rack === rack)
      .reduce((sum, it) => sum + Number(it.stock || 0), 0);
  };

  // ============================
  // TV Mode UI (per rack, target, stock, xfd)
  // ============================
  if (viewMode === 'TV') {
    const rackGroups = TV_COLUMN_ORDER.map((letter) =>
      DAFTAR_RAK.filter((rk) => rk.startsWith(`${letter}-`))
    );

    return (
      <div style={{ background: '#050714', minHeight: '100vh', padding: '15px', paddingBottom: '90px', color: 'white', fontFamily: 'sans-serif', overflow: 'hidden' }}>
        <style>{`
          @keyframes pulse-glow { 0% { box-shadow: 0 0 5px rgba(52, 152, 219, 0.2); } 50% { box-shadow: 0 0 20px rgba(52, 152, 219, 0.5); } 100% { box-shadow: 0 0 5px rgba(52, 152, 219, 0.2); } }
          @keyframes blink-red { 0% { opacity: 1; color: #ff3d00; } 50% { opacity: 0.3; color: #fff; } 100% { opacity: 1; color: #ff3d00; } }
          .glass-card { background: rgba(22, 27, 34, 0.8); backdrop-filter: blur(10px); border: 1px solid rgba(48, 54, 61, 0.8); border-radius: 12px; }
          .active-rack { animation: pulse-glow 2s infinite; border: 1px solid #3498db !important; }
          .blink-urgent { animation: blink-red 1s infinite; font-weight: 900 !important; }
          .ticker-container::-webkit-scrollbar { width: 6px; }
          .ticker-container::-webkit-scrollbar-thumb { background: #3498db; border-radius: 10px; }
          .progress-bg { background: #111; height: 10px; border-radius: 6px; margin: 6px 0; overflow: hidden; border: 1px solid #333; }
          .progress-fill { height: 100%; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1); }

          /* TV ticker bawah (market tape) */
          .tv-ticker { position: fixed; left: 15px; right: 15px; bottom: 15px; height: 60px; display: flex; align-items: center; gap: 12px; padding: 0 16px; }
          .tv-ticker-label { font-weight: 900; color: #3498db; white-space: nowrap; letter-spacing: 1px; }
          .tv-ticker-track { flex: 1; overflow: hidden; }
          .tv-ticker-content { display: flex; width: max-content; animation-name: tvTickerScroll; animation-timing-function: linear; animation-iteration-count: infinite; }
          .tv-ticker-text { white-space: nowrap; padding-right: 60px; color: #ddd; font-weight: 800; font-size: 13px; }
          @keyframes tvTickerScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        `}</style>

        <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 30px', marginBottom: '15px', borderBottom: '4px solid #3498db' }}>
          <div>
            <h1 style={{ fontSize: '32px', margin: 0, color: '#3498db', letterSpacing: '2px' }}>
              <img src="/logo.png" alt="Logo" style={{ height: '40px', marginRight: '10px' }} />
              PRODUCTION STOCK MONITOR
            </h1>
            <p style={{ margin: 0, color: '#888', fontSize: '14px', fontWeight: 'bold' }}>SINKRONISASI AKTIF: {new Date().toLocaleTimeString()}</p>
          </div>
          <button onClick={() => setViewMode('ADMIN')} style={{ ...s.btn, background: '#e74c3c' }}>EXIT</button>
        </div>

        {/* Kolom I / H / F / E / D, tiap kolom turun 6 rack */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${rackGroups.length}, 1fr)`, gap: '12px', height: '80vh', overflow: 'hidden' }}>
          {rackGroups.map((group, colIdx) => {
            const letter = TV_COLUMN_ORDER[colIdx];
            return (
              <div key={letter} style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
                <div className="glass-card" style={{ padding: '10px 12px', borderLeft: '5px solid #3498db' }}>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#3498db', letterSpacing: '2px' }}>AREA {letter}</div>
                  <div style={{ fontSize: '12px', color: '#aaa', fontWeight: 800 }}>Rack {letter}-01 s/d {letter}-06</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>
                  {group.map((rack) => {
                    const items = inventory.filter((i) => i.rack === rack);

                    const totalStock = items.reduce((a, b) => a + Number(b.stock || 0), 0);

                    const totalShortfall = items.reduce((sum, it) => {
                      const t = Number(it.target || 0);
                      const s = Number(it.stock || 0);
                      if (t > 0 && s < t) return sum + (t - s);
                      return sum;
                    }, 0);

                    const notMetCount = items.filter((it) => Number(it.target || 0) > 0 && Number(it.stock || 0) < Number(it.target || 0)).length;

                    return (
                      <div
                        key={rack}
                        className={`glass-card ${totalStock > 0 ? 'active-rack' : ''}`}
                        style={{ padding: '10px', display: 'flex', flexDirection: 'column', height: 'calc((80vh - 80px) / 6)' }}
                      >
                        {/* Header rack: total + shortfall */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', borderBottom: '1px solid #333', paddingBottom: '6px', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: '90px' }}>
                            <span style={{ fontSize: '18px', color: '#3498db', fontWeight: 900 }}>{rack}</span>
                            <span style={{ fontSize: '11px', color: '#aaa', fontWeight: 800 }}>SPK aktif: {items.length}</span>
                            <span style={{ fontSize: '11px', fontWeight: 900, color: totalShortfall > 0 ? '#f1c40f' : '#2ecc71' }}>
                              Short: {totalShortfall} {notMetCount > 0 ? `(SPK<target: ${notMetCount})` : '(OK)'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <div style={{ fontSize: '16px', fontWeight: 900, color: '#fff' }}>
                              Total: <span style={{ color: '#3498db' }}>{totalStock}</span>
                            </div>

                            {/* Δ perubahan terakhir */}
                            <div style={{ fontSize: '12px', fontWeight: 900, color: '#888' }}>
                              Δ 0
                            </div>
                          </div>
                        </div>

                        {/* List SPK di rack */}
                        <div style={{ flex: 1, overflowY: 'auto' }} className="ticker-container">
                          {items.map((it, idx) => (
                            <div key={idx} style={{ padding: '6px 0', borderBottom: '1px solid #222' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <strong style={{ color: '#fff', fontSize: '12px' }}>{it.spk}</strong>
                                  <span style={{ color: '#e67e22', fontSize: '10px', fontWeight: 'bold' }}>XFD: {it.xfd || '-'}</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#3498db' }}>
                                    {it.stock}<span style={{ fontSize: '10px', color: '#666' }}>/{it.target}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ============================
  // ADMIN MODE UI
  // ============================
  return (
    <div style={{ background: '#f4f7f6', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <nav style={{ background: '#1a237e', color: 'white', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>
          <img src="/logo.png" alt="Logo" style={{ height: '30px', marginRight: '10px' }} />
          SUPERMARKET STOCK ADMIN
        </h2>
        <div>
          <button onClick={() => setViewMode('TV')} style={{ ...s.btn, background: '#8e44ad', marginRight: '10px' }}>DASHBOARD TV</button>

          <button onClick={() => setShowExportModal(true)} style={{ ...s.btn, background: '#16a085', marginRight: '10px' }}>
            EXPORT XLSX
          </button>

          <button onClick={handleLogout} style={{ ...s.btn, background: '#e74c3c' }}>LOGOUT</button>
        </div>
      </nav>

      {/* MODAL EXPORT XLSX */}
      {showExportModal && (
        <div style={s.modalOverlay}>
          <div style={{ ...s.modalContent, minWidth: '420px' }}>
            <h3 style={{ marginTop: 0 }}>EXPORT DATA (XLSX)</h3>
            <p style={{ color: '#666', marginTop: 0 }}>Pilih jenis data yang ingin diexport.</p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => { handleExportInventoryXlsx(); setShowExportModal(false); }} style={{ ...s.btn, background: '#1a237e' }}>
                Export Inventory Summary
              </button>
              <button onClick={() => { handleExportRawXlsx(); setShowExportModal(false); }} style={{ ...s.btn, background: '#8e44ad' }}>
                Export Raw Transaksi
              </button>
              <button onClick={() => setShowExportModal(false)} style={{ ...s.btn, background: '#e74c3c' }}>
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: '1' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Input Transaksi</h3>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
              <button type="button" onClick={() => setFormData({ ...formData, type: 'IN' })} style={{ flex: 1, padding: '12px', background: formData.type === 'IN' ? '#2ecc71' : '#eee', color: formData.type === 'IN' ? 'white' : '#666', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>IN (Masuk)</button>
              <button type="button" onClick={() => setFormData({ ...formData, type: 'OUT' })} style={{ flex: 1, padding: '12px', background: formData.type === 'OUT' ? '#e74c3c' : '#eee', color: formData.type === 'OUT' ? 'white' : '#666', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>OUT (Keluar)</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input style={s.input} placeholder="Nomor SPK" value={formData.spk_number} onChange={(e) => setFormData({ ...formData, spk_number: e.target.value.toUpperCase() })} required />
              <input style={s.input} placeholder="Style/Artikel" value={formData.style_name} onChange={(e) => setFormData({ ...formData, style_name: e.target.value.toUpperCase() })} required />

              <div style={{ display: 'flex', gap: '8px' }}>
                <input style={{ ...s.input, flex: 1 }} placeholder="Size" value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} required />
                <input style={{ ...s.input, flex: 1 }} placeholder="Target Qty" type="number" value={formData.target_qty || ''} onChange={(e) => setFormData({ ...formData, target_qty: e.target.value })} />
              </div>

              <input style={{ ...s.input, borderColor: '#e67e22' }} placeholder="XFD" value={formData.xfd_date} onChange={(e) => setFormData({ ...formData, xfd_date: e.target.value })} />

              <input type="number" style={{ ...s.input, border: '2px solid #1a237e' }} placeholder="Jumlah Pasang" value={formData.qty || ''} onChange={(e) => setFormData({ ...formData, qty: e.target.value })} required />

              <select style={s.input} value={formData.rack} onChange={(e) => setFormData({ ...formData, rack: e.target.value })} required>
                <option value="">-- Pilih Rak --</option>
                {DAFTAR_RAK.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>

              <input style={s.input} placeholder={formData.type === 'IN' ? 'Asal' : 'Tujuan Area'} value={formData.source_dest} onChange={(e) => setFormData({ ...formData, source_dest: e.target.value })} required />
              <input style={s.input} placeholder="Operator" value={formData.operator} onChange={(e) => setFormData({ ...formData, operator: e.target.value })} required />

              <button type="submit" disabled={isSubmitting} style={{ ...s.btn, background: isSubmitting ? '#95a5a6' : '#1a237e', padding: '18px', fontSize: '16px' }}>
                {isSubmitting ? 'MENYIMPAN...' : 'SIMPAN TRANSAKSI'}
              </button>
            </form>
          </div>
        </div>

        <div style={{ flex: '2', background: 'white', padding: '20px', borderRadius: '12px' }}>
          <input
            style={{ width: '100%', padding: '15px', marginBottom: '15px', borderRadius: '10px', border: '2px solid #1a237e', boxSizing: 'border-box' }}
            placeholder="Cari SPK / XFD"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
            {DAFTAR_RAK.map((rack) => {
              const matchRack = rack.includes(searchTerm);
              const items = inventory.filter((i) =>
                i.rack === rack &&
                (matchRack || i.spk.includes(searchTerm) || (i.xfd || '').includes(searchTerm))
              );

              const total = items.reduce((a, b) => a + b.stock, 0);

              return (
                <div key={rack} style={{ border: '1px solid #eee', padding: '10px', borderRadius: '10px', borderTop: `5px solid ${total > 0 ? '#3498db' : '#ddd'}` }}>
                  <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '8px' }}>{rack} ({total})</div>
                  {items.map((it, idx) => (
                    <div key={idx} onClick={() => handlePickFromRack(it)} style={{ fontSize: '11px', marginBottom: '5px', padding: '5px', background: '#f8f9fa', borderRadius: '4px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>{it.spk}</strong>
                        <span style={{ color: '#e67e22' }}>{it.xfd}</span>
                      </div>
                      <div>Stok: {it.stock}/{it.target} | Size: {it.size}</div>
                      <div style={{ color: '#3498db' }}>To: {it.last_to || '-'}</div>
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
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px', outline: 'none' },
  btn: { padding: '10px 15px', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999, background: 'rgba(0,0,0,0.35)' },
  modalContent: { background: 'white', padding: '30px', borderRadius: '20px', textAlign: 'center', minWidth: '350px' }
};

export default App;
