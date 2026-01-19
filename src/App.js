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
  // TV MODE UI
  // ============================
  if (viewMode === 'TV') {
    const rackGroups = TV_COLUMN_ORDER.map((letter) =>
      DAFTAR_RAK.filter((rk) => rk.startsWith(`${letter}-`))
    );

    return (
      <div style={{ background: '#050714', minHeight: '100vh', padding: '15px', color: 'white', fontFamily: 'sans-serif', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${rackGroups.length}, 1fr)`, gap: '12px', height: '80vh' }}>
          {rackGroups.map((group, colIdx) => {
            const letter = TV_COLUMN_ORDER[colIdx];
            return (
              <div key={letter} style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
                <div className="glass-card" style={{ padding: '10px 12px', borderLeft: '5px solid #3498db' }}>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#3498db', letterSpacing: '2px' }}>AREA {letter}</div>
                  <div style={{ fontSize: '12px', color: '#aaa', fontWeight: 800 }}>Rack {letter}-01 s/d {letter}-06</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {group.map((rack) => {
                    const items = inventory.filter((i) => i.rack === rack);

                    return (
                      <div key={rack} className="glass-card" style={{ padding: '10px', display: 'flex', flexDirection: 'column', height: 'calc((80vh - 80px) / 6)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          {items.map((it, idx) => (
                            <div key={idx} style={{ paddingBottom: '8px', borderBottom: '1px solid #333' }}>
                              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                                <strong>{it.spk}</strong> - {it.style}
                              </div>
                              <div style={{ fontSize: '12px', color: '#aaa' }}>
                                Size: {it.size} | Qty: {it.stock} | Target: {it.target} | XFD: {it.xfd}
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
