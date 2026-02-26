import React, { useState, useEffect, useCallback } from 'react';
import PocketBase from 'pocketbase';
import * as XLSX from 'xlsx';

const pb = new PocketBase('https://upperbank-production-c0b5.up.railway.app');

// ======================
// TRANSLATIONS
// ======================
const translations = {
  en: {
    LOGIN: 'LOGIN',
    THIRD_AXIS: 'THIRD AXIS CENTER',
    EMAIL: 'Email',
    PASSWORD: 'Password',
    LOGIN_FAILED: 'LOGIN FAILED!',
    PROCESSING: 'PROCESSING...',
    SPK_NUMBER: 'SPK Number',
    STYLE_ARTICLE: 'Style / Article',
    ORDER_QTY: 'Order Qty',
    STOCK: 'Stock',
    RACK_LOCATION: 'Rack Location',
    FROM_STOCKFIT: 'FROM (Stockfit/Supplier)',
    TO_DESTINATION: 'TO (Destination)',
    INPUT_TIME: 'Input/Output Time',
    SAVE_DATA: 'SAVE DATA',
    FAILED: 'Failed!',
    MODE_ADMIN: 'ADMIN MODE',
    MODE_TV: 'TV MODE',
    SWITCH_MODE: 'SWITCH',
    DATA_EXPORT: 'EXPORT',
    LOGOUT: 'LOGOUT',
    INPUT_TRANSACTION: 'Input Transaction',
    IN_ENTRY: 'IN / ENTRY',
    OUT_EXIT: 'OUT / EXIT',
    SEARCH_SPK: 'Search SPK...',
    SEARCH_DISPLAY: 'Search SPK / Style / XFD',
    BUILDING: 'Building',
    ENTRY_TODAY: 'ENTRY TODAY',
    EXIT_TODAY: 'EXIT TODAY',
    GLOBAL_STOCK: 'GLOBAL STOCK',
    PIECE: 'Piece',
    ACTIVITY_LOG: 'ACTIVITY LOG',
    DOWNLOAD_DATA: 'DOWNLOAD DATA',
    EXPORT_SUMMARY: 'Export Summary',
    EXPORT_LOG: 'Export Log',
    CANCEL: 'Cancel',
    BALANCE_ZERO: 'Balance is 0, cannot add more.',
    QTY_EXCEED: 'Qty cannot exceed remaining balance',
    QTY_EXCEED_ORDER: 'QTY INPUT cannot exceed ORDER QTY',
    TOTAL_EXCEED_ORDER: 'TOTAL INPUT cannot exceed ORDER QTY',
    INSUFFICIENT_STOCK: 'INSUFFICIENT STOCK!',
    AVAILABLE_STACK: 'Available at rack',
    YOUR_INPUT: 'Your input',
    XFD_PASSED: 'XFD has passed!',
    XFD_DAYS_LEFT: 'XFD expires in',
    DAYS: 'days',
    SUPERMARKET_SYSTEM: 'SUPERMARKET DIGITAL SYSTEM',
    PT_DIAMOND: 'PT DIAMOND INTERNATIONAL INDONESIA',
    CHOOSE_STOCKFIT: 'Choose Stockfit Line/Supplier',
    LANGUAGE: 'Language',
    THEME: 'Theme',
    DARK: 'Dark',
    LIGHT: 'Light',
    TOTAL: 'TOTAL',
    SPK: 'SPK',
    STYLE: 'Style',
    RAK: 'Rack',
    ORDER: 'Order Qty',
    TOTAL_IN: 'Input Total',
    TOTAL_OUT: 'Output Total',
    BALANCE: 'Balance',
    XFD: 'XFD',
    SOURCE: 'Source',
    DESTINATION: 'Destination',
    OPERATOR: 'Operator',
    FROM: 'From',
    TO: 'To',
    PIECES: 'Pieces',
    OP: 'Op',
  },
  id: {
    LOGIN: 'LOGIN',
    THIRD_AXIS: 'THIRD AXIS CENTER',
    EMAIL: 'Email',
    PASSWORD: 'Password',
    LOGIN_FAILED: 'LOGIN GAGAL!',
    PROCESSING: 'PROSES...',
    SPK_NUMBER: 'Nomor SPK',
    STYLE_ARTICLE: 'Style / Artikel',
    ORDER_QTY: 'Qty Order',
    STOCK: 'Stock',
    RACK_LOCATION: 'Lokasi RAK',
    FROM_STOCKFIT: 'DARI (Stockfit/Supplayer)',
    TO_DESTINATION: 'KE (Tujuan)',
    INPUT_TIME: 'Waktu Input/Output',
    SAVE_DATA: 'SIMPAN DATA',
    FAILED: 'Gagal!',
    MODE_ADMIN: 'MODE ADMIN',
    MODE_TV: 'MODE TV',
    SWITCH_MODE: 'UBAH',
    DATA_EXPORT: 'DATA',
    LOGOUT: 'LOGOUT',
    INPUT_TRANSACTION: 'Input Transaksi',
    IN_ENTRY: 'IN / MASUK',
    OUT_EXIT: 'OUT / KELUAR',
    SEARCH_SPK: 'Cari SPK...',
    SEARCH_DISPLAY: 'Cari SPK / Style / XFD',
    BUILDING: 'Building',
    ENTRY_TODAY: 'MASUK HARI INI',
    EXIT_TODAY: 'KELUAR HARI INI',
    GLOBAL_STOCK: 'GLOBAL STOCK',
    PIECE: 'Pasang',
    ACTIVITY_LOG: 'LOG AKTIVITAS',
    DOWNLOAD_DATA: 'DOWNLOAD DATA',
    EXPORT_SUMMARY: 'Export Summary',
    EXPORT_LOG: 'Export Log',
    CANCEL: 'Batal',
    BALANCE_ZERO: 'Balance sudah 0, tidak bisa ditambah.',
    QTY_EXCEED: 'Qty tidak boleh melebihi sisa balance',
    QTY_EXCEED_ORDER: 'QTY INPUT tidak boleh lebih dari ORDER QTY',
    TOTAL_EXCEED_ORDER: 'TOTAL INPUT tidak boleh lebih dari ORDER QTY',
    INSUFFICIENT_STOCK: 'STOK TIDAK CUKUP!',
    AVAILABLE_STACK: 'Sisa di rak',
    YOUR_INPUT: 'Input Anda',
    XFD_PASSED: 'XFD sudah lewat!',
    XFD_DAYS_LEFT: 'XFD tinggal',
    DAYS: 'hari',
    SUPERMARKET_SYSTEM: 'SUPERMARKET DIGITAL SYSTEM',
    PT_DIAMOND: 'PT DIAMOND INTERNATIONAL INDONESIA',
    CHOOSE_STOCKFIT: 'Pilih Stockfit Line/Supplayer',
    LANGUAGE: 'Bahasa',
    THEME: 'Tema',
    DARK: 'Gelap',
    LIGHT: 'Terang',
    TOTAL: 'TOTAL',
    SPK: 'SPK',
    STYLE: 'Style',
    RAK: 'Rak',
    ORDER: 'Order Qty',
    TOTAL_IN: 'Total Masuk',
    TOTAL_OUT: 'Total Keluar',
    BALANCE: 'Balance',
    XFD: 'XFD',
    SOURCE: 'Source',
    DESTINATION: 'Destination',
    OPERATOR: 'Operator',
    FROM: 'Dari',
    TO: 'Ke',
    PIECES: 'Pasang',
    OP: 'Op',
  },
  'zh-TW': {
    LOGIN: '登入',
    THIRD_AXIS: '第三軸心中心',
    EMAIL: '電子郵件',
    PASSWORD: '密碼',
    LOGIN_FAILED: '登入失敗!',
    PROCESSING: '處理中...',
    SPK_NUMBER: 'SPK編號',
    STYLE_ARTICLE: '樣式 / 條目',
    ORDER_QTY: '訂單數量',
    STOCK: '庫存',
    RACK_LOCATION: '架位位置',
    FROM_STOCKFIT: '來自 (庫存/供應商)',
    TO_DESTINATION: '至 (目的地)',
    INPUT_TIME: '輸入/輸出時間',
    SAVE_DATA: '保存資料',
    FAILED: '失敗!',
    MODE_ADMIN: '管理員模式',
    MODE_TV: 'TV模式',
    SWITCH_MODE: '切換',
    DATA_EXPORT: '資料',
    LOGOUT: '登出',
    INPUT_TRANSACTION: '輸入交易',
    IN_ENTRY: '進 / 入庫',
    OUT_EXIT: '出 / 出庫',
    SEARCH_SPK: '搜尋 SPK...',
    SEARCH_DISPLAY: '搜尋 SPK / 樣式 / XFD',
    BUILDING: '棟',
    ENTRY_TODAY: '今日進貨',
    EXIT_TODAY: '今日出貨',
    GLOBAL_STOCK: '全球庫存',
    PIECE: '件',
    ACTIVITY_LOG: '活動日誌',
    DOWNLOAD_DATA: '下載資料',
    EXPORT_SUMMARY: '匯出摘要',
    EXPORT_LOG: '匯出日誌',
    CANCEL: '取消',
    BALANCE_ZERO: '餘額已為0，無法新增。',
    QTY_EXCEED: '數量不能超過剩餘餘額',
    QTY_EXCEED_ORDER: '輸入數量不能超過訂單數量',
    TOTAL_EXCEED_ORDER: '總輸入量不能超過訂單數量',
    INSUFFICIENT_STOCK: '庫存不足!',
    AVAILABLE_STACK: '架上剩餘',
    YOUR_INPUT: '您的輸入',
    XFD_PASSED: 'XFD已過期!',
    XFD_DAYS_LEFT: 'XFD剩餘',
    DAYS: '天',
    SUPERMARKET_SYSTEM: '超市數位系統',
    PT_DIAMOND: 'PT 鑽石國際印尼公司',
    CHOOSE_STOCKFIT: '選擇庫存線/供應商',
    LANGUAGE: '語言',
    THEME: '主題',
    DARK: '深色',
    LIGHT: '淺色',
    TOTAL: '總計',
    SPK: 'SPK',
    STYLE: '樣式',
    RAK: '架',
    ORDER: '訂單數量',
    TOTAL_IN: '總進貨',
    TOTAL_OUT: '總出貨',
    BALANCE: '餘額',
    XFD: 'XFD',
    SOURCE: '來源',
    DESTINATION: '目的地',
    OPERATOR: '操作員',
    FROM: '來自',
    TO: '至',
    PIECES: '件',
    OP: '操作',
  },
  vi: {
    LOGIN: 'ĐĂNG NHẬP',
    THIRD_AXIS: 'TRUNG TÂM TRỤC THỨ BA',
    EMAIL: 'Email',
    PASSWORD: 'Mật khẩu',
    LOGIN_FAILED: 'ĐĂNG NHẬP THẤT BẠI!',
    PROCESSING: 'ĐANG XỬ LÝ...',
    SPK_NUMBER: 'Số SPK',
    STYLE_ARTICLE: 'Kiểu dáng / Bài viết',
    ORDER_QTY: 'Số lượng đặt hàng',
    STOCK: 'Kho',
    RACK_LOCATION: 'Vị trí kệ',
    FROM_STOCKFIT: 'TỪ (Stockfit/Nhà cung cấp)',
    TO_DESTINATION: 'ĐẾN (Đích đến)',
    INPUT_TIME: 'Thời gian nhập/xuất',
    SAVE_DATA: 'LƯU DỮ LIỆU',
    FAILED: 'Thất bại!',
    MODE_ADMIN: 'CHẾ ĐỘ QUẢN TRỊ',
    MODE_TV: 'CHẾ ĐỘ TV',
    SWITCH_MODE: 'CHUYỂN',
    DATA_EXPORT: 'DỮ LIỆU',
    LOGOUT: 'ĐĂNG XUẤT',
    INPUT_TRANSACTION: 'Ghi nhập giao dịch',
    IN_ENTRY: 'VÀO / NHẬP KHO',
    OUT_EXIT: 'RA / XUẤT KHO',
    SEARCH_SPK: 'Tìm kiếm SPK...',
    SEARCH_DISPLAY: 'Tìm kiếm SPK / Kiểu / XFD',
    BUILDING: 'Tòa nhà',
    ENTRY_TODAY: 'NHẬP KHO HÔM NAY',
    EXIT_TODAY: 'XUẤT KHO HÔM NAY',
    GLOBAL_STOCK: 'KHO TOÀN CẦU',
    PIECE: 'Chiếc',
    ACTIVITY_LOG: 'NHẬT KÝ HOẠT ĐỘNG',
    DOWNLOAD_DATA: 'TẢI DỮ LIỆU',
    EXPORT_SUMMARY: 'Xuất bản tóm tắt',
    EXPORT_LOG: 'Xuất bản nhật ký',
    CANCEL: 'Hủy bỏ',
    BALANCE_ZERO: 'Số dư là 0, không thể thêm.',
    QTY_EXCEED: 'Số lượng không được vượt quá số dư còn lại',
    QTY_EXCEED_ORDER: 'SỐ LƯỢNG NHẬP không được vượt quá SỐ LƯỢNG ĐẶT HÀNG',
    TOTAL_EXCEED_ORDER: 'TỔNG SỐ NHẬP không được vượt quá SỐ LƯỢNG ĐẶT HÀNG',
    INSUFFICIENT_STOCK: 'KHO KHÔNG ĐỦ!',
    AVAILABLE_STACK: 'Còn lại tại kệ',
    YOUR_INPUT: 'Đầu vào của bạn',
    XFD_PASSED: 'XFD đã qua!',
    XFD_DAYS_LEFT: 'XFD còn lại',
    DAYS: 'ngày',
    SUPERMARKET_SYSTEM: 'HỆ THỐNG SIÊU THỊ KỸ THUẬT SỐ',
    PT_DIAMOND: 'CÔNG TY CỔ PHẦN KIM CƯƠNG QUỐC TẾ INDONESIA',
    CHOOSE_STOCKFIT: 'Chọn Dòng Stockfit / Nhà cung cấp',
    LANGUAGE: 'Ngôn ngữ',
    THEME: 'Chủ đề',
    DARK: 'Tối',
    LIGHT: 'Sáng',
    TOTAL: 'TỔNG CỘNG',
    SPK: 'SPK',
    STYLE: 'Kiểu dáng',
    RAK: 'Kệ',
    ORDER: 'Số lượng đặt hàng',
    TOTAL_IN: 'Tổng nhập',
    TOTAL_OUT: 'Tổng xuất',
    BALANCE: 'Số dư',
    XFD: 'XFD',
    SOURCE: 'Nguồn',
    DESTINATION: 'Đích đến',
    OPERATOR: 'Nhà điều hành',
    FROM: 'Từ',
    TO: 'Đến',
    PIECES: 'Chiếc',
    OP: 'NV',
  },
  km: {
    LOGIN: 'ចូល',
    THIRD_AXIS: 'មជ្ឈមណ្ឌលអ័ក្សទីបី',
    EMAIL: 'អ៊ីមែល',
    PASSWORD: 'ពាក្យសម្ងាត់',
    LOGIN_FAILED: 'ការចូលបរាជ័យ!',
    PROCESSING: 'កំពុងដំណើរការ...',
    SPK_NUMBER: 'លេខ SPK',
    STYLE_ARTICLE: 'រចនាប័ទ្ម / អត្ថបទ',
    ORDER_QTY: 'បរិមាណលម្អិតផ្ទាល់ខ្លួន',
    STOCK: 'ស្តុក',
    RACK_LOCATION: 'ទីតាំងលាម',
    FROM_STOCKFIT: 'ពី (Stockfit/អ្នកផ្គត់ផ្គង់)',
    TO_DESTINATION: 'ឆ្ពោះទៅ (គោលដៅ)',
    INPUT_TIME: 'ពេលវេលាបញ្ចូល/ទិន្នផល',
    SAVE_DATA: 'រក្សាទុកលម្អិត',
    FAILED: 'បរាជ័យ!',
    MODE_ADMIN: 'របៀបរដ្ឋបាល',
    MODE_TV: 'របៀប TV',
    SWITCH_MODE: 'បង្វិល',
    DATA_EXPORT: 'ឯកសារ',
    LOGOUT: 'ចាកចេញ',
    INPUT_TRANSACTION: 'ដាក់បញ្ចូលប្រតិបត្តិការ',
    IN_ENTRY: 'ចូល / ដាក់ចូល',
    OUT_EXIT: 'ចេញ / ក្រឡេក',
    SEARCH_SPK: 'ស្វាងរក SPK...',
    SEARCH_DISPLAY: 'ស្វាងរក SPK / រចនាប័ទ្ម / XFD',
    BUILDING: 'អគារ',
    ENTRY_TODAY: 'ដាក់ចូលថ្ងៃនេះ',
    EXIT_TODAY: 'ក្រឡេកថ្ងៃនេះ',
    GLOBAL_STOCK: 'ស្តុកពិភពលោក',
    PIECE: 'ធាតុ',
    ACTIVITY_LOG: 'កំណត់ហេតុសកម្មភាព',
    DOWNLOAD_DATA: 'ទាញយកឯកសារ',
    EXPORT_SUMMARY: 'នាំចេញលម្អិត',
    EXPORT_LOG: 'នាំចេញកំណត់ហេតុ',
    CANCEL: 'បោះបង់ចោល',
    BALANCE_ZERO: 'សមតុល្យ 0 ហើយ មិនអាចបន្ថែម។',
    QTY_EXCEED: 'បរិមាណមិនអាចលើសពីសមតុល្យដែលនៅសល់',
    QTY_EXCEED_ORDER: 'បរិមាណបញ្ចូលមិនអាចលើសពីបរិមាណលម្អិត',
    TOTAL_EXCEED_ORDER: 'ចំនួនបញ្ចូលសរុបមិនអាចលើសពីបរិមាណលម្អិត',
    INSUFFICIENT_STOCK: 'ស្តុកមិនគ្រប់គ្រាន់!',
    AVAILABLE_STACK: 'នៅសល់នៅលាម',
    YOUR_INPUT: 'ការបញ្ចូលរបស់អ្នក',
    XFD_PASSED: 'XFD បានឆ្លងកាត់!',
    XFD_DAYS_LEFT: 'XFD នៅសល់',
    DAYS: 'ថ្ងៃ',
    SUPERMARKET_SYSTEM: 'ប្រព័ន្ធលើកទីលាផតឌីជីថល',
    PT_DIAMOND: 'ក្រុមហ៊ុនដ្ឋាន័ក មូលនិធិអន្តរជាតិឥណ្ឌូនេស៊ី',
    CHOOSE_STOCKFIT: 'ជ្រើសរើស Stockfit Line / អ្នកផ្គត់ផ្គង់',
    LANGUAGE: 'ភាសា',
    THEME: 'ប្រធានបទ',
    DARK: 'ងងឹត',
    LIGHT: 'ភ្លឺ',
    TOTAL: 'សរុប',
    SPK: 'SPK',
    STYLE: 'រចនាប័ទ្ម',
    RAK: 'លាម',
    ORDER: 'បរិមាណលម្អិត',
    TOTAL_IN: 'សរុបបញ្ចូល',
    TOTAL_OUT: 'សរុបលទ្ធផល',
    BALANCE: 'សមតុល្យ',
    XFD: 'XFD',
    SOURCE: 'ប្រភព',
    DESTINATION: 'គោលដៅ',
    OPERATOR: 'ប្រតិបត្តិការ',
    FROM: 'ពី',
    TO: 'ឆ្ពោះទៅ',
    PIECES: 'ធាតុ',
    OP: 'NV',
  },
  th: {
    LOGIN: 'เข้าสู่ระบบ',
    THIRD_AXIS: 'ศูนย์แกนที่สาม',
    EMAIL: 'อีเมล',
    PASSWORD: 'รหัสผ่าน',
    LOGIN_FAILED: 'เข้าสู่ระบบล้มเหลว!',
    PROCESSING: 'กำลังดำเนินการ...',
    SPK_NUMBER: 'หมายเลข SPK',
    STYLE_ARTICLE: 'สไตล์ / สินค้า',
    ORDER_QTY: 'ปริมาณสั่งซื้อ',
    STOCK: 'สินค้าคงคลัง',
    RACK_LOCATION: 'ตำแหน่งชั้น',
    FROM_STOCKFIT: 'จาก (Stockfit/ผู้จัดส่ง)',
    TO_DESTINATION: 'ไป (ปลายทาง)',
    INPUT_TIME: 'เวลาป้อนข้อมูล/ผลลัพธ์',
    SAVE_DATA: 'บันทึกข้อมูล',
    FAILED: 'ล้มเหลว!',
    MODE_ADMIN: 'โหมดผู้ดูแลระบบ',
    MODE_TV: 'โหมด TV',
    SWITCH_MODE: 'สลับ',
    DATA_EXPORT: 'ข้อมูล',
    LOGOUT: 'ออกจากระบบ',
    INPUT_TRANSACTION: 'บันทึกธุรกรรม',
    IN_ENTRY: 'เข้า / นำเข้า',
    OUT_EXIT: 'ออก / ส่งออก',
    SEARCH_SPK: 'ค้นหา SPK...',
    SEARCH_DISPLAY: 'ค้นหา SPK / สไตล์ / XFD',
    BUILDING: 'อาคาร',
    ENTRY_TODAY: 'นำเข้าวันนี้',
    EXIT_TODAY: 'ส่งออกวันนี้',
    GLOBAL_STOCK: 'สินค้าคงคลังทั่วโลก',
    PIECE: 'ชิ้น',
    ACTIVITY_LOG: 'บันทึกกิจกรรม',
    DOWNLOAD_DATA: 'ดาวน์โหลดข้อมูล',
    EXPORT_SUMMARY: 'ส่งออกสรุป',
    EXPORT_LOG: 'ส่งออกบันทึก',
    CANCEL: 'ยกเลิก',
    BALANCE_ZERO: 'ยอดคงเหลือเป็น 0 ไม่สามารถเพิ่มได้',
    QTY_EXCEED: 'ปริมาณไม่สามารถเกินยอดคงเหลือ',
    QTY_EXCEED_ORDER: 'ปริมาณป้อนไม่สามารถเกินปริมาณสั่งซื้อ',
    TOTAL_EXCEED_ORDER: 'ปริมาณรวมไม่สามารถเกินปริมาณสั่งซื้อ',
    INSUFFICIENT_STOCK: 'สินค้าคงคลังไม่เพียงพอ!',
    AVAILABLE_STACK: 'คงเหลือที่ชั้น',
    YOUR_INPUT: 'ปริมาณที่ป้อน',
    XFD_PASSED: 'XFD หมดอายุแล้ว!',
    XFD_DAYS_LEFT: 'XFD เหลือ',
    DAYS: 'วัน',
    SUPERMARKET_SYSTEM: 'ระบบสーเปอร์มาร์เก็ตดิจิทัล',
    PT_DIAMOND: 'บริษัท เพชรนานาชาติ อินโดนีเซีย',
    CHOOSE_STOCKFIT: 'เลือก Stockfit Line / ผู้จัดส่ง',
    LANGUAGE: 'ภาษา',
    THEME: 'ธีม',
    DARK: 'มืด',
    LIGHT: 'สว่าง',
    TOTAL: 'รวมทั้งสิ้น',
    SPK: 'SPK',
    STYLE: 'สไตล์',
    RAK: 'ชั้น',
    ORDER: 'ปริมาณสั่งซื้อ',
    TOTAL_IN: 'รวมนำเข้า',
    TOTAL_OUT: 'รวมส่งออก',
    BALANCE: 'ยอดคงเหลือ',
    XFD: 'XFD',
    SOURCE: 'แหล่งที่มา',
    DESTINATION: 'ปลายทาง',
    OPERATOR: 'ผู้ดำเนินการ',
    FROM: 'จาก',
    TO: 'ไป',
    PIECES: 'ชิ้น',
    OP: 'ผู้ป้อน',
  }
};

// ======================
// THEMES
// ======================
const themes = {
  dark: {
    bg: '#0d1117',
    bgSecondary: '#161b22',
    bgTertiary: '#1c2128',
    border: '#30363d',
    text: '#c9d1d9',
    textMuted: '#8b949e',
    primary: '#58a6ff',
    success: '#3fb950',
    danger: '#f85149',
    warning: '#ffb829',
    blue: '#1f6feb',
    purple: '#6818fb',
  },
  light: {
    bg: '#ffffff',
    bgSecondary: '#f6f8fa',
    bgTertiary: '#eaeef2',
    border: '#d0d7de',
    text: '#24292f',
    textMuted: '#57606a',
    primary: '#0969da',
    success: '#1a7f0f',
    danger: '#cf222e',
    warning: '#9e6a03',
    blue: '#0969da',
    purple: '#8250df',
  }
};

const RAK_CONFIG = {
  "C": ["01"],
  "D": ["01", "02", "03", "04", "05", "06"],
  "E": ["01", "02", "03", "04", "05", "06"],
  "F": ["01", "02", "03", "04", "05"],
  "H": ["01", "02", "03", "04", "05"],
  "I": ["01", "02", "03", "04", "05"]
};
const HURUF_RAK = Object.keys(RAK_CONFIG);
const DAFTAR_RAK_FULL = HURUF_RAK.flatMap(h => RAK_CONFIG[h].map(n => `${h}-${n}`));
const formatRakDisplay = (rak) => {
  const [huruf, nomor] = rak.split('-');
  return `Rak ${huruf}${parseInt(nomor)}`;
};
const DAFTAR_STOCKFIT = ["BUFFING", "PT WENCHUANG", "PT GLOBAL", "STOCKFIT 1", "STOCKFIT 2", "STOCKFIT 3", "STOCKFIT 4", "STOCKFIT 5", "STOCKFIT 6", "STOCKFIT 7"];

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
  const [tvSearch, setTvSearch] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'id');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Helper function to get translation
  const t = (key) => translations[language]?.[key] || key;

  // Get current theme colors
  const colors = themes[theme];

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

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
            spk: curr.spk_number,
            style: curr.style_name || '-',
            rack: curr.rack_location,
            total_input: 0,
            total_output: 0,
            stock: 0,
            target: 0,
            xfd: curr.xfd_date,
            source: curr.source_from,
            destination: curr.destination
          };
        }
        acc[key].total_input += Number(curr.qty_in || 0);
        acc[key].total_output += Number(curr.qty_out || 0);
        acc[key].stock = acc[key].total_input - acc[key].total_output;
        if (Number(curr.target_qty) > 0) acc[key].target = Number(curr.target_qty);
        return acc;
      }, {});

      // Compute balance as: order_qty - total_input, but never negative
      const inventoryWithBalance = Object.values(summary).map(item => ({
        ...item,
        // balance = ORDER QTY - TOTAL INPUT
        balance: Math.max(0, (Number(item.target) || 0) - (Number(item.total_input) || 0))
      })).filter(i => i.stock > 0);

      setInventory(inventoryWithBalance);
    } catch (error) { console.error("Sync Error"); }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
      const unsub = pb.collection('upper_stock').subscribe('*', () => fetchData());
      // `subscribe` returns an unsubscribe function (not a promise)
      return () => { if (typeof unsub === 'function') unsub(); };
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
    // business rule: once balance reaches zero we shouldn't add more input
    if (formData.type === 'IN') {
      // try to find existing inventory entry for this spk/rack
      const existing = inventory.find(i => i.spk === formData.spk_number && i.rack === formData.rack);
      const qtyWanted = Number(formData.qty) || 0;
      // determine the relevant target (new one if provided, otherwise existing)
      const newTarget = Number(formData.target_qty) > 0 ? Number(formData.target_qty) : (existing ? existing.target : 0);
      if (existing) {
        const projectedTotalInput = (existing.total_input || 0) + qtyWanted;
        const projectedBalance = newTarget - projectedTotalInput;
        if (existing.balance <= 0 && newTarget === existing.target) {
          alert(t('BALANCE_ZERO'));
          return;
        }
        if (projectedBalance < 0) {
          alert(`${t('QTY_EXCEED')} (${existing.balance}).`);
          return;
        }
      }
    }

    // VALIDASI: Qty single entry tidak boleh melebihi order
    if (formData.target_qty && Number(formData.qty) > Number(formData.target_qty)) {
      alert(`${t('QTY_EXCEED_ORDER')} (${formData.target_qty})`);
      return;
    }
    // VALIDASI: Total cumulative input untuk SPK+rack tidak boleh melebihi order
    if (formData.type === 'IN' && formData.target_qty) {
      // hitung input sebelumnya dari catatan mentah
      const prevInput = rawRecords
        .filter(r => r.spk_number === formData.spk_number && r.rack_location === formData.rack)
        .reduce((sum, r) => sum + (Number(r.qty_in) || 0), 0);
      if (prevInput + Number(formData.qty) > Number(formData.target_qty)) {
        alert(`${t('TOTAL_EXCEED_ORDER')} (${prevInput + Number(formData.qty)}) ${t('ORDER').toLowerCase()} (${formData.target_qty})`);
        return;
      }
    }

    // VALIDASI: Cek sisa stok sebelum OUT
    if (formData.type === 'OUT') {
      const currentItem = inventory.find(i => i.spk === formData.spk_number && i.rack === formData.rack);
      const stockTersedia = currentItem ? currentItem.stock : 0;
      if (Number(formData.qty) > stockTersedia) {
        alert(`${t('INSUFFICIENT_STOCK')}\n${t('AVAILABLE_STACK')}: ${stockTersedia} ${t('PIECES')}.\n${t('YOUR_INPUT')}: ${formData.qty} ${t('PIECES')}.`);
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
        waktu_input: waktu,
        operator: pb.authStore.model.username
      });
      // refresh so UI updates (items with stock <= 0 are filtered out)
      await fetchData();
      // silently clear the form
      setFormData({ ...formData, spk_number: '', style_name: '', qty: 0, target_qty: 0, xfd_date: '', source_from: '', destination: '' });
    } catch (err) { alert(t('FAILED')); } finally { setIsSubmitting(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await pb.collection('users').authWithPassword(loginEmail, loginPassword);
      setIsLoggedIn(true);
    } catch (err) { alert(t('LOGIN_FAILED')); } finally { setLoading(false); }
  };

  const handleLogout = () => { pb.authStore.clear(); setIsLoggedIn(false); };

  const exportToXlsx = (rows, fileName) => {
    if (fileName === 'Summary_Stok') {
      // rows are inventory summary entries; map to friendly headers
      const mapped = rows.map(r => ({
        [t('SPK')]: r.spk || '',
        [t('STYLE')]: r.style || '',
        [t('RAK')]: r.rack || '',
        [t('ORDER')]: r.target || r.order_qty || 0,
        [t('TOTAL_IN')]: r.total_input || 0,
        [t('TOTAL_OUT')]: r.total_output || 0,
        [t('STOCK')]: r.stock || 0,
        [t('BALANCE')]: r.balance !== undefined ? Math.max(0, r.balance) : Math.max(0, ((r.target || 0) - (r.total_input || 0))),
        [t('XFD')]: r.xfd || '',
        [t('SOURCE')]: r.source || '',
        [t('DESTINATION')]: r.destination || '',
        [t('OPERATOR')]: r.operator || pb.authStore.model.username
      }));
      const ws = XLSX.utils.json_to_sheet(mapped);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Summary');
      XLSX.writeFile(wb, `${fileName}.xlsx`);
      return;
    }

    // default: Log_Transaksi or raw rows
    const processedRows = rows.map(row => ({
      Tanggal: row.waktu_input ? row.waktu_input.split(' ')[0] : '',
      Waktu: row.waktu_input ? row.waktu_input.split(' ')[1] : '',
      ...row,
      operator: row.operator || pb.authStore.model.username
    }));
    const filteredRows = processedRows.map(row => {
      const { collectionId, collectionName, waktu_input, ...rest } = row;
      if (rest.target_qty !== undefined) {
        rest.order_qty = rest.target_qty;
        delete rest.target_qty;
      }
      return rest;
    });
    const ws = XLSX.utils.json_to_sheet(filteredRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  if (!isLoggedIn) return (
    <div style={{...s.overlay(colors), background: colors.bg}}>
      <div style={{...s.card(colors), width: '350px', border: `1px solid ${colors.border}`}}>
        <h2 style={{color: colors.primary, marginBottom: '5px'}}>{t('LOGIN')}</h2>
        <div style={{fontSize: '10px', color: colors.textMuted, marginBottom: '20px'}}>{t('THIRD_AXIS')}</div>
        <form onSubmit={handleLogin} style={{display:'flex', flexDirection:'column', gap:15}}>
          <input style={s.darkInput(colors)} type="email" placeholder={t('EMAIL')} onChange={e => setLoginEmail(e.target.value)} required />
          <input style={s.darkInput(colors)} type="password" placeholder={t('PASSWORD')} onChange={e => setLoginPassword(e.target.value)} required />
          <button type="submit" style={{...s.btn(colors), background: colors.success}}>{loading ? t('PROCESSING') : t('LOGIN')}</button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={{ background: colors.bg, minHeight: '100vh', padding: '20px', color: colors.text, fontFamily: 'sans-serif', position: 'relative' }}>
      
      {/* WATERMARK NEON */}
      <div style={{ 
        position: 'fixed', bottom: '20px', left: '20px', fontSize: '11px', fontWeight: 'bold', 
        color: colors.primary, letterSpacing: '3px', pointerEvents: 'none', zIndex: 9999, 
        textTransform: 'uppercase', textShadow: `0 0 5px ${colors.primary}, 0 0 10px ${colors.primary}`, opacity: 0.8 
      }}>
        Third Axis Center
      </div>

      <nav style={{ background: colors.bgSecondary, border: `1px solid ${colors.border}`, padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: 0, color: colors.primary, fontSize: '22px' }}><img src="/logo.png" alt="Supermarket Icon" style={{ width: '24px', height: '24px', marginRight: '8px' }} />{t('SUPERMARKET_SYSTEM')}</h2>
          <div style={{fontSize: '9px', color: colors.textMuted, letterSpacing:'1px'}}>{t('PT_DIAMOND')}</div>
        </div>
        <div style={{display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap'}}>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{...s.darkInput(colors), padding: '8px 10px', fontSize: '12px'}}>
            <option value="id">🇮🇩 {t('LANGUAGE')}</option>
            <option value="en">🇬🇧 English</option>
            <option value="zh-TW">🇹🇼 繁體中文</option>
            <option value="vi">🇻🇳 Tiếng Việt</option>
            <option value="km">🇰🇭 ខ្មែរ</option>
            <option value="th">🇹🇭 ไทย</option>
          </select>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{...s.btn(colors), background: colors.blue, padding: '8px 15px', fontSize: '12px'}}>
            {theme === 'dark' ? '☀️ ' : '🌙 '}{t('THEME')}
          </button>
          <button onClick={() => setViewMode(viewMode === 'ADMIN' ? 'TV' : 'ADMIN')} style={{ ...s.btn(colors), background: colors.purple, marginRight: 0 }}>{t('SWITCH_MODE')} {viewMode}</button>
          <button onClick={() => setShowExportModal(true)} style={{ ...s.btn(colors), background: colors.success }}><img src="./Excell.png" alt="Export" width="15" height="15" style={{marginRight: '5px'}} />{t('DATA_EXPORT')}</button>
          <button onClick={handleLogout} style={{ ...s.btn(colors), background: colors.danger }}>{t('LOGOUT')}</button>
        </div>
      </nav>

      {viewMode === 'ADMIN' ? (
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1, background: colors.bgSecondary, padding: '20px', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
            <h3 style={{color: colors.primary, marginTop: 0}}>{t('INPUT_TRANSACTION')}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{display:'flex', gap:5}}>
                <button type="button" onClick={() => setFormData({...formData, type:'IN'})} style={{flex:1, padding:10, background:formData.type==='IN'?colors.success:colors.bgTertiary, color:'white', border:'none', borderRadius:5, fontWeight:'bold'}}>{t('IN_ENTRY')}</button>
                <button type="button" onClick={() => setFormData({...formData, type:'OUT'})} style={{flex:1, padding:10, background:formData.type==='OUT'?colors.danger:colors.bgTertiary, color:'white', border:'none', borderRadius:5, fontWeight:'bold'}}>{t('OUT_EXIT')}</button>
              </div>
              <input style={s.darkInput(colors)} placeholder={t('SPK_NUMBER')} value={formData.spk_number} onChange={e => setFormData({ ...formData, spk_number: e.target.value.toUpperCase() })} required />
              <input style={s.darkInput(colors)} placeholder={t('STYLE_ARTICLE')} value={formData.style_name} onChange={e => setFormData({ ...formData, style_name: e.target.value.toUpperCase() })} />
              <div style={{display:'flex', gap:5}}>
                 <input style={{...s.darkInput(colors), flex:1}} placeholder={t('ORDER_QTY')} type="number" value={formData.target_qty || ''} onChange={e => setFormData({ ...formData, target_qty: e.target.value })} />
                 <div style={{flex:1, position:'relative'}}>
                   <input
                     style={{...s.darkInput(colors), width:'93%', color: colors.text}}
                     type="date"
                     value={formData.xfd_date}
                     onChange={e => setFormData({ ...formData, xfd_date: e.target.value })}
                   />
                   {/* XFD warning message */}
                   {formData.xfd_date && (() => {
                     const now = new Date();
                     const xfd = new Date(formData.xfd_date);
                     const diff = Math.ceil((xfd - now) / (1000 * 60 * 60 * 24));
                     if (diff < 0) {
                       return <div style={{position:'absolute', top:'100%', left:0, fontSize:12, color:colors.danger}}>⚠️ {t('XFD_PASSED')}</div>;
                     }
                     if (diff <= 3) {
                       return <div style={{position:'absolute', top:'100%', left:0, fontSize:12, color:colors.warning}}>⚠️ {t('XFD_DAYS_LEFT')} {diff} {t('DAYS')}</div>;
                     }
                     return null;
                   })()}
                 </div>
              </div>
              <input
                style={{...s.darkInput(colors), border: formData.type==='OUT'?`1px solid ${colors.danger}`:`1px solid ${colors.border}`}}
                placeholder={t('STOCK')}
                type="number"
                value={formData.qty || ''}
                onChange={e => setFormData({ ...formData, qty: e.target.value })}
                max={formData.target_qty || undefined}
                required
              />
              <select style={s.darkInput(colors)} value={formData.rack} onChange={e => setFormData({ ...formData, rack: e.target.value })} required>
                <option value="">-- {t('RACK_LOCATION')} --</option>
                {DAFTAR_RAK_FULL.map(r => <option key={r} value={r}>{formatRakDisplay(r)}</option>)}
              </select>
              <div style={{padding: '12px', background: colors.bgTertiary, borderRadius: '8px', border: `1px solid ${colors.border}`}}>
                <label style={{fontSize: '11px', color: colors.textMuted}}>{t('FROM_STOCKFIT')}</label>
                <select style={{...s.darkInput(colors), width: '100%', marginTop:5}} value={formData.source_from} onChange={e => setFormData({ ...formData, source_from: e.target.value })}>
                  <option value="">-- {t('CHOOSE_STOCKFIT')} --</option>
                  {DAFTAR_STOCKFIT.map(sf => <option key={sf} value={sf}>{sf}</option>)}
                </select>
                <label style={{fontSize: '11px', color: colors.textMuted, display:'block', marginTop:10}}>{t('TO_DESTINATION')}</label>
                <input style={{...s.darkInput(colors), width: '94%', marginTop:5, opacity: 0.8}} value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} />
              </div>
              <div style={{ padding: '10px', background: colors.bgTertiary, borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '12px', color: colors.textMuted, textAlign: 'center' }}>
                {t('INPUT_TIME')}: {currentTime.toLocaleString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <button type="submit" style={{ ...s.btn(colors), background: colors.blue, padding: 15 }}>{isSubmitting ? t('PROCESSING') : t('SAVE_DATA')}</button>
            </form>
          </div>
          <div style={{ flex: 2.5, background: colors.bgSecondary, padding: '20px', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
            <input style={{ ...s.darkInput(colors), width: '100%', marginBottom: '15px' }} placeholder={t('SEARCH_SPK')} onChange={e => setSearchTerm(e.target.value.toUpperCase())} />
            {/* unified parent container for building cards */}
            <div style={{ display: 'grid', gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gridAutoFlow: 'row', gap: '10px', maxHeight: '500px', overflowY: 'auto', alignItems: 'start', boxSizing: 'border-box' }}>
              {HURUF_RAK.map(h => (
                <div key={h} style={{ width: '100%' }}>
                  <div style={{ textAlign: 'center', background: colors.border, color:colors.primary, padding: '5px', fontWeight: 'bold', borderRadius: '4px', fontSize: 12 }}>{t('BUILDING')} {h}</div>
                  {RAK_CONFIG[h].map(n => {
                    const r = `${h}-${n}`;
                    const items = inventory.filter(i => i.rack === r && i.spk.includes(searchTerm));
                    const total = items.reduce((a, b) => a + b.stock, 0);
                    // hide rack entirely when total stock is 0
                    if (total === 0) return null;
                    return (
                      <div key={r} style={{ padding: '8px', border: `1px solid ${colors.border}`, marginTop: '5px', background: colors.bgTertiary, borderRadius: 4 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '11px', color: colors.primary }}>{formatRakDisplay(r)} ({total})</div>
                        {items.map((it, idx) => {
                          // show percentage of completion (0 balance => 100%) and clamp
                          let balancePersen = it.target > 0 ? Math.round(((it.target - it.balance) / it.target) * 100) : 0;
                          balancePersen = Math.max(0, Math.min(balancePersen, 100));
                          let balanceColor = (balancePersen >= 100) ? colors.success : (balancePersen < 30 ? colors.danger : colors.primary);
                          return (
                            <div key={idx} onClick={() => handleItemClick(it)} style={{ fontSize: '9px', marginTop: 4, borderTop: `1px solid ${colors.border}`, paddingTop: 2, color: colors.textMuted, cursor: 'pointer' }}>
                              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 2}}>
                                <b>{it.spk}</b> <span style={{fontSize: '8px', color: balanceColor, fontWeight: 'bold'}}>{balancePersen}%</span>
                              </div>
                              <div style={{fontSize:'9px', color: colors.textMuted, fontStyle:'italic'}}>{it.style}</div>
                              <div style={{fontSize:'8px', color: colors.textMuted}}>XFD: {it.xfd}</div>
                              <div style={{textAlign:'right', color: colors.primary, fontSize:'11px'}}>{it.stock} {t('PIECES')} | {t('BALANCE')}: {it.balance}</div>
                              <div style={{textAlign:'right', color: colors.warning, fontSize:'9px'}}>→ {it.destination}</div>
                            </div>
                          );
                        })}
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
          <div style={{ textAlign: 'center', color: colors.primary, fontSize: '25px', fontWeight: 'bold', marginBottom: '10px' }}>
            {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
             <div style={s.modernStatCard(colors)}>
                <div style={s.watermark}>IN</div>
                <div style={s.statLabel(colors)}>{t('ENTRY_TODAY')}</div>
                <div style={{...s.statFlex, color: colors.success}}>
                   <div style={s.statBigVal}>{rawRecords.filter(r => r.qty_in > 0 && r.waktu_input.includes(todayStr)).reduce((a, b) => a + Number(b.qty_in), 0)}</div>
                   <div style={s.unit}>{t('PIECE')}</div>
                </div>
             </div>
             <div style={s.modernStatCard(colors)}>
                <div style={{...s.watermark, color:'rgba(248,81,73,0.05)'}}>OUT</div>
                <div style={s.statLabel(colors)}>{t('EXIT_TODAY')}</div>
                <div style={{...s.statFlex, color: colors.danger}}>
                   <div style={s.statBigVal}>{rawRecords.filter(r => r.qty_out > 0 && r.waktu_input.includes(todayStr)).reduce((a, b) => a + Number(b.qty_out), 0)}</div>
                   <div style={s.unit}>{t('PIECE')}</div>
                </div>
             </div>
             <div style={{...s.modernStatCard(colors), background: `linear-gradient(135deg, ${colors.blue} 0%, ${colors.bgSecondary} 100%)`, border: `1px solid ${colors.primary}`}}>
                <div style={{...s.watermark, color:'rgba(255,255,255,0.07)'}}>MARKET</div>
                <div style={{...s.statLabel(colors), color:'rgba(255,255,255,0.7)'}}>{t('GLOBAL_STOCK')}</div>
                <div style={{...s.statFlex, color: '#ffffff'}}>
                   <div style={s.statBigVal}>{inventory.reduce((a, b) => a + b.stock, 0)}</div>
                   <div style={s.unit}>{t('PIECE')}</div>
                </div>
             </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <input
              style={{ ...s.darkInput(colors), width: '40%', textAlign: 'center' }}
              placeholder={t('SEARCH_DISPLAY')}
              value={tvSearch}
              onChange={e => setTvSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            {/* unified parent container for building cards in TV mode */}
            <div style={{ flex: 4, display: 'grid', gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gridAutoFlow: 'row', gap: '10px', maxHeight: '500px', overflowY: 'auto', alignItems: 'start', boxSizing: 'border-box' }}>
              {HURUF_RAK.map(h => {
                const totalHuruf = inventory.filter(i => i.rack.startsWith(h)).reduce((a, b) => a + b.stock, 0);
                return (
                  <div key={h}>
                    <div style={{background: colors.primary, color: colors.bg, textAlign:'center', fontWeight:'bold', padding:5, borderRadius:4, marginBottom:8, fontSize:12}}>
                       {t('BUILDING')} {h} <br/> <span style={{fontSize: 9}}>{t('TOTAL')}: {totalHuruf}</span>
                    </div>
                    {RAK_CONFIG[h].map(n => {
                      const r = `${h}-${n}`;
                      const itms = inventory.filter(i => {
                        if (i.rack !== r) return false;
                        if (!tvSearch) return true;
                        const q = tvSearch.toString().toUpperCase();
                        const spk = (i.spk || '').toString().toUpperCase();
                        const style = (i.style || '').toString().toUpperCase();
                        const xfd = (i.xfd || '').toString();
                        return spk.includes(q) || style.includes(q) || xfd.includes(tvSearch.toString());
                      });
                      const ttl = itms.reduce((a,b) => a + b.stock, 0);
                      // hide rack card when ttl is zero
                      if (ttl === 0) return null;
                      return (
                        <div key={r} style={{background: colors.bgSecondary, padding:8, borderRadius:8, marginBottom:8, border: `1px solid ${colors.primary}`, minHeight:105}}>
                          <div style={{display:'flex', justifyContent:'space-between', borderBottom:`1px solid ${colors.border}`, fontSize:13, marginBottom:4, paddingBottom:2}}>
                            <b style={{color: colors.primary}}>{formatRakDisplay(r)}</b> <b>{ttl}</b>
                          </div>
                          {itms.map((it, idx) => {
                            // Calculate balance percentage: (order_qty - balance) / order_qty
                            let balancePersen = it.target > 0 ? Math.round(((it.target - it.balance) / it.target) * 100) : 0;
                            balancePersen = Math.max(0, Math.min(balancePersen, 100));
                            let color = (balancePersen >= 100) ? colors.success : (balancePersen < 30 ? colors.danger : colors.primary);
                            // Calculate XFD color based on deadline
                            let xfdColor = colors.warning;
                            if (it.xfd) {
                              const now = new Date();
                              const xfdDate = new Date(it.xfd);
                              const daysLeft = Math.ceil((xfdDate - now) / (1000 * 60 * 60 * 24));
                              if (daysLeft < 0) xfdColor = colors.danger; // date passed, red
                              else if (daysLeft <= 3) xfdColor = colors.warning; // within 3 days, yellow
                              else xfdColor = colors.success; // more than 3 days, green
                            }
                            return (
                              <div key={idx} style={{fontSize:10, marginTop:8, background: colors.bgTertiary, padding: 6, borderRadius: 6, border: `1px solid ${colors.border}`, position: 'relative'}}>
                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3}}>
                                  <b style={{color: colors.text}}>{it.spk}</b>
                                  <b style={{color: color}}>{balancePersen}%</b>
                                </div>
                                <div style={{fontSize:'8px', color: xfdColor}}>XFD: {it.xfd}</div>
                                <div style={{fontSize:'9px', color: colors.textMuted, fontStyle:'italic'}}>{it.style}</div>
                                <div style={{width:'100%', height:3, background: colors.border, borderRadius:2, marginBottom:4}}>
                                  <div style={{width:`${Math.min(balancePersen, 100)}%`, height:'100%', background: color, borderRadius:2}}></div>
                                </div>
                                <div style={{display:'flex', justifyContent:'space-between', fontSize:9}}>
                                  <span>{it.stock}/{it.target}</span>
                                  <span style={{color: it.balance >= 0 ? colors.success : colors.danger}}>{t('BALANCE')}: {it.balance}</span>
                                </div>
                                <div style={{fontSize:'8px', color: colors.warning, marginTop:2}}>{t('FROM')}: {it.source} → {it.destination}</div>
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
          </div>

          {/* log activity moved below building row */}
          <div style={{ flex: 1.2, background: colors.bgSecondary, padding: 15, borderRadius: 12, borderLeft: `4px solid ${colors.primary}`, height: 'fit-content', marginTop: '20px' }}>
            <h4 style={{textAlign:'center', color: colors.primary, marginTop:0, borderBottom:`1px solid ${colors.border}`, paddingBottom:10, fontSize:'12px'}}>{t('ACTIVITY_LOG')}</h4>
            <div style={{maxHeight:'75vh', overflowY:'auto'}}>
              {rawRecords.map((log, i) => {
                  const isIn = log.qty_in > 0;
                  return (
                    <div key={i} style={{ padding: 10, marginBottom: 8, background: colors.bgTertiary, borderRadius: 8, border: `1px solid ${colors.border}`, position:'relative' }}>
                      <div style={{ position:'absolute', top:8, right:8, fontSize:8, padding:'1px 5px', borderRadius:10, background: isIn? colors.success: colors.danger, color:'white', fontWeight:'bold' }}>
                        {isIn ? t('IN_ENTRY').split('/')[0] : t('OUT_EXIT').split('/')[0]}
                      </div>
                      <div style={{fontSize:11, fontWeight:'bold', color: colors.primary}}>{log.spk_number}</div>
                      <div style={{display:'flex', alignItems:'center', gap:4, fontSize:9, marginTop:5}}>
                        <span style={{color: isIn? colors.success: colors.textMuted}}>{log.source_from || 'SF'}</span>
                        <span>➜</span>
                        <span style={{color: colors.danger, fontWeight:'bold'}}>{log.destination}</span>
                      </div>
                      <div style={{display:'flex', justifyContent:'space-between', marginTop:5, fontSize:9, color: colors.textMuted}}>
                        <div>
                          <b>{log.qty_in || log.qty_out} {t('PIECES')}</b>
                          <div style={{fontSize:8, color: colors.textMuted}}>{t('OP')}: {log.operator}</div>
                        </div>
                        <span style={{fontSize: '8px'}}>{log.waktu_input}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div style={s.overlay(colors)}>
          <div style={s.card(colors)}>
            <h3 style={{color: colors.primary}}>{t('DOWNLOAD_DATA')}</h3>
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
               <button onClick={() => exportToXlsx(inventory, 'Summary_Stok')} style={{...s.btn(colors), background: colors.blue}}>{t('EXPORT_SUMMARY')}</button>
               <button onClick={() => exportToXlsx(rawRecords, 'Log_Transaksi')} style={{...s.btn(colors), background: colors.purple}}>{t('EXPORT_LOG')}</button>
               <button onClick={() => setShowExportModal(false)} style={{...s.btn(colors), background: colors.border}}>{t('CANCEL')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  darkInput: (colors) => ({ padding: '10px', borderRadius: '6px', border: `1px solid ${colors.border}`, background: colors.bgTertiary, color: colors.text, fontSize: '13px', outline: 'none' }),
  btn: (colors) => ({ padding: '10px 15px', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }),
  overlay: (colors) => ({ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }),
  card: (colors) => ({ background: colors.bgSecondary, padding: '30px', borderRadius: '12px', textAlign: 'center', border: `1px solid ${colors.border}` }),
  modernStatCard: (colors) => ({ 
    flex: 1, background: `linear-gradient(135deg, ${colors.bgSecondary} 0%, ${colors.bg} 100%)`, padding: '20px', 
    borderRadius: '16px', border: `1px solid ${colors.border}`, position: 'relative', overflow: 'hidden'
  }),
  watermark: { position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '60px', color: 'rgba(63,185,80,0.05)', fontWeight: '900' },
  statLabel: (colors) => ({ fontSize: '11px', color: colors.textMuted, fontWeight: 'bold', letterSpacing: '1px' }),
  statFlex: { display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '10px' },
  statBigVal: { fontSize: '38px', fontWeight: '900' },
  unit: { fontSize: '14px', opacity: 0.7 }
};

export default App;