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
  const [recentLogs, setRecentLogs] = useState([]);
  const [dailyStats, setDailyStats] = useState({ in: 0, out: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  
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
      alert("⚠️ LOGIN GAGAL!");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const allRecords = await pb.collection('upper_stock').getFullList({ 
        sort: 'created', 
        requestKey: null 
      });

      // 1. Ticker & Logs Logics
      const today = new Date().toISOString().split('T')[0];
      const stats = { in: 0, out: 0 };
      const reversedLogs = [...allRecords].reverse().slice(0, 15);
      setRecentLogs(reversedLogs);

      // 2. Summary Logic with "Last Destination"
      const summary = allRecords.reduce((acc, curr) => {
        const key = `${curr.spk_number}-${curr.size}-${curr.rack_location}`;
        const recordDate = curr.created.split('T')[0];

        if (recordDate === today) {
          stats.in += Number(curr.qty_in || 0);
          stats.out += Number(curr.qty_out || 0);
        }

        if (!acc[key]) {
          acc[key] = {
            spk: curr.spk_number,
            style: curr.style_name,
            size: curr.size,
            rack: curr.rack_location,
            stock: 0,
            target: 0,
            xfd: '',
            last_to: '',
            last_out_time: ''
          };
        }

        const qtyIn = Number(curr.qty_in || 0);
        const qtyOut = Number(curr.qty_out || 0);
        acc[key].stock += (qtyIn - qtyOut);

        if (Number(curr.target_qty) > 0) acc[key].target = Number(curr.target_qty);
        if (curr.xfd_date) acc[key].xfd = curr.xfd_date;

        // Logika penentuan Tujuan (TO:)
        if (qtyOut > 0 && curr.destination) {
          if (!acc[key].last_out_time || curr.created > acc[key].last_out_time) {
            acc[key].last_out_time = curr.created;
            acc[key].last_to = curr.destination;
          }
        }

        return acc;
      }, {});

      setDailyStats(stats);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const sekarang = new Date();
    const waktuLokal = `${sekarang.toLocaleDateString('id-ID').replace(/\//g, '-')} ${sekarang.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    
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
      setFormData({ ...formData, spk_number: '', style_name: '', size: '', qty: 0, target_qty: 0, xfd_date: '', source_dest: '' });
      alert("✅ Tersimpan!");
    } catch (err) { alert("❌ Gagal!"); } finally { setIsSubmitting(false); }
  };

  if (viewMode === 'TV') return (
    <div style={{ background: '#050714', minHeight: '100vh', padding: '15px', color: 'white', fontFamily: 'sans-serif' }}>
       <style>{`
        @keyframes blink-red { 0% { background: rgba(231, 76, 60, 0.8); } 50% { background: rgba(231, 76, 60, 0.2); } 100% { background: rgba(231, 76, 60, 0.8); } }
        .glass-card { background: rgba(22, 27, 34, 0.8); border: 1px solid rgba(48, 54, 61, 0.8); border-radius: 12px; }
        .ticker-container::-webkit-scrollbar { width: 4px; }
        .ticker-container::-webkit-scrollbar-thumb { background: #3498db; }
        .log-item { background: rgba(255,255,255,0.03); padding: 8px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid #444; }
        .blink-urgent { animation: blink-red 1s infinite; }
      `}</style>

      {/* HEADER WITH DAILY TICKER */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', marginBottom: '15px', borderBottom: '3px solid #3498db' }}>
        <div>
          <h2 style={{ margin: 0, color: '#3498db' }}><img src="/logo.png" alt="Logo" style={{ width: '30px', height: '30px', marginRight: '10px' }} />PRODUCTION MONITOR</h2>
          <span style={{ fontSize: '12px', color: '#666' }}>SYNC: {new Date().toLocaleTimeString()}</span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}><div style={{ color: '#2ecc71', fontSize: '10px' }}>IN TODAY</div><div style={{ fontSize: '20px', fontWeight: 'bold' }}>{dailyStats.in}</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ color: '#e74c3c', fontSize: '10px' }}>OUT TODAY</div><div style={{ fontSize: '20px', fontWeight: 'bold' }}>{dailyStats.out}</div></div>
          <button onClick={() => setViewMode('ADMIN')} style={{ background: '#e74c3c', border: 'none', color: 'white', borderRadius: '5px', padding: '0 15px', cursor: 'pointer' }}>EXIT</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '15px', height: '80vh' }}>
        {/* GRID RAK */}
        <div style={{ flex: 3, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', overflowY: 'auto' }} className="ticker-container">
          {DAFTAR_RAK.map(rack => {
            const items = inventory.filter(i => i.rack === rack);
            return (
              <div key={rack} className="glass-card" style={{ padding: '10px' }}>
                <div style={{ color: '#3498db', fontWeight: 'bold', borderBottom: '1px solid #333', marginBottom: '8px' }}>{rack}</div>
                {items.map((it, idx) => {
                  const percent = it.target > 0 ? (it.stock / it.target) * 100 : 0;
                  return (
                    <div key={idx} style={{ marginBottom: '12px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>{it.spk}</strong>
                        <span style={{ color: percent >= 100 ? '#2ecc71' : '#f1c40f' }}>{it.stock}/{it.target}</span>
                      </div>
                      <div style={{ color: '#e67e22', fontSize: '10px' }}>XFD: {it.xfd} | SZ: {it.size}</div>
                      <div style={{ height: '6px', background: '#111', borderRadius: '3px', margin: '4px 0' }}>
                        <div style={{ height: '100%', width: `${Math.min(percent, 100)}%`, background: percent >= 100 ? '#2ecc71' : '#3498db', borderRadius: '3px' }}></div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <span className={percent >= 100 ? 'blink-urgent' : ''} style={{ fontSize: '10px', background: '#1a237e', padding: '1px 5px', borderRadius: '3px', border: '1px solid #3498db' }}>
                          TO: {it.last_to || 'WAITING'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* FEED TRANSAKSI TERBARU */}
        <div className="glass-card" style={{ flex: 1, padding: '15px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #333' }}>LIVE FEED</h4>
          <div style={{ flex: 1, overflowY: 'auto' }} className="ticker-container">
            {recentLogs.map((log, idx) => (
              <div key={idx} className="log-item" style={{ borderLeftColor: log.qty_in > 0 ? '#2ecc71' : '#e74c3c' }}>
                <div style={{ fontSize: '9px', color: '#888', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{log.waktu_input}</span>
                  <span style={{ color: log.qty_in > 0 ? '#2ecc71' : '#e74c3c' }}>{log.qty_in > 0 ? 'IN' : 'OUT'}</span>
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{log.spk_number}</div>
                <div style={{ fontSize: '10px' }}>Qty: {log.qty_in || log.qty_out} | Rack: {log.rack_location}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#f4f7f6', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      {/* BAGIAN ADMIN (DARI FILE ASLI ANDA) */}
      <nav style={{ background: '#1a237e', color: 'white', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}><img src="/logo.png" alt="Logo" style={{ width: '30px', height: '30px', marginRight: '10px' }} />SUPERMARKET ADMIN</h2>
        <button onClick={() => setViewMode('TV')} style={{ background: '#8e44ad', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>BUKA MONITOR TV</button>
      </nav>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1, background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
          <h3>Input Transaksi</h3>
          <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
            <button onClick={() => setFormData({ ...formData, type: 'IN' })} style={{ flex: 1, padding: '10px', background: formData.type === 'IN' ? '#2ecc71' : '#eee', border: 'none', borderRadius: '5px' }}>IN</button>
            <button onClick={() => setFormData({ ...formData, type: 'OUT' })} style={{ flex: 1, padding: '10px', background: formData.type === 'OUT' ? '#e74c3c' : '#eee', border: 'none', borderRadius: '5px' }}>OUT</button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input style={s.input} placeholder="SPK" value={formData.spk_number} onChange={e => setFormData({ ...formData, spk_number: e.target.value })} required />
            <input style={s.input} placeholder="Style" value={formData.style_name} onChange={e => setFormData({ ...formData, style_name: e.target.value })} required />
            <div style={{ display: 'flex', gap: '10px' }}>
              <input style={s.input} placeholder="Size" value={formData.size} onChange={e => setFormData({ ...formData, size: e.target.value })} required />
              <input style={s.input} placeholder="Target" type="number" value={formData.target_qty} onChange={e => setFormData({ ...formData, target_qty: e.target.value })} />
            </div>
            <input style={s.input} placeholder="XFD" value={formData.xfd_date} onChange={e => setFormData({ ...formData, xfd_date: e.target.value })} />
            <input style={s.input} placeholder="Qty" type="number" value={formData.qty} onChange={e => setFormData({ ...formData, qty: e.target.value })} required />
            <select style={s.input} value={formData.rack} onChange={e => setFormData({ ...formData, rack: e.target.value })} required>
              <option value="">Pilih Rak</option>
              {DAFTAR_RAK.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <input style={s.input} placeholder={formData.type === 'IN' ? "Asal" : "Tujuan"} value={formData.source_dest} onChange={e => setFormData({ ...formData, source_dest: e.target.value })} required />
            <input style={s.input} placeholder="Operator" value={formData.operator} onChange={e => setFormData({ ...formData, operator: e.target.value })} required />
            <button type="submit" style={{ padding: '15px', background: '#1a237e', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}>SIMPAN DATA</button>
          </form>
        </div>

        <div style={{ flex: 2, background: 'white', padding: '20px', borderRadius: '12px' }}>
          <input style={{ width: '100%', padding: '10px', marginBottom: '10px' }} placeholder="Cari SPK..." onChange={e => setSearchTerm(e.target.value.toUpperCase())} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {DAFTAR_RAK.map(rack => {
              const items = inventory.filter(i => i.rack === rack && i.spk.includes(searchTerm));
              return (
                <div key={rack} style={{ border: '1px solid #eee', padding: '8px', borderRadius: '5px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{rack}</div>
                  {items.map((it, idx) => (
                    <div key={idx} style={{ fontSize: '10px', background: '#f9f9f9', padding: '4px', marginTop: '4px' }}>
                      {it.spk} - {it.stock} prs
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
  input: { padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }
};

export default App;