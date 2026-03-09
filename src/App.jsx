import React, { useState, useEffect, useMemo, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";
import {
  Users,
  Trophy,
  ClipboardCheck,
  LayoutDashboard,
  UserPlus,
  Printer,
  Trash2,
  UserCircle,
  Settings,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Loader2,
  Award,
  Filter,
  Save,
  ShieldAlert,
  Search,
  Users2,
  MapPin,
  Medal,
  ChevronRight,
  LogOut
} from "lucide-react";

// --- 1. KONFIGURASI FIREBASE ---
const getEnv = (key, fallback) => {
  try {
    return import.meta.env[key] || fallback;
  } catch (e) {
    return fallback;
  }
};

const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY", "AIzaSyCHdwhrtWUgS46KL0IS1UB8cHGEEye-TCw"),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN", "fasi-ix-82267.firebaseapp.com"),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID", "fasi-ix-82267"),
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET", "fasi-ix-82267.firebasestorage.app"),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID", "1078063708798"),
  appId: getEnv("VITE_FIREBASE_APP_ID", "1:1078063708798:web:7180f28c1224ea5965362f"),
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "fasi-batang-2026";

// --- 2. DATA MASTER ---
const KECAMATAN_LIST = [
  "Batang", "Warungasem", "Wonotunggal", "Bandar", "Blado", "Reban", 
  "Tulis", "Kandeman", "Subah", "Pecalungan", "Banyuputih", "Limpung", 
  "Gringsing", "Tersono", "Bawang"
];

const ROLES = {
  PUBLIK: { id: "PUBLIK", name: "Publik", access: ["beranda", "pendaftaran", "hasil"] },
  JURI: { id: "JURI", name: "Juri", access: ["penilaian"] },
  ADMIN_KEC: { id: "ADMIN_KEC", name: "Admin Kecamatan", access: ["beranda", "pendaftaran", "admin", "hasil"] },
  ADMIN_KAB: { id: "ADMIN_KAB", name: "Admin Kabupaten", access: ["beranda", "pendaftaran", "penilaian", "hasil", "admin"] },
};

const BRANCH_DATA = {
  TKQ: [
    { id: "tkq_tartil", name: "Tartil Al-Qur'an", type: "single", criteria: ["Tajwid", "Fashahah", "Suara/Irama"], max: [45, 35, 20] },
    { id: "tkq_adzan", name: "Adzan & Iqomah", type: "single", gender: "PA", criteria: ["Tajwid/Fashahah", "Lagu/Suara", "Adab"], max: [45, 35, 20] },
    { id: "tkq_sholat", name: "Peragaan Sholat", type: "single", criteria: ["Qouliyah", "Fi'liyah", "Pakaian"], max: [40, 40, 20] },
    { id: "tkq_mewarnai", name: "Mewarnai Gambar", type: "single", criteria: ["Warna", "Imajinasi", "Kebersihan"], max: [45, 40, 15] },
    { id: "tkq_puitisasi", name: "Puitisasi Terjemah Al-Qur'an", type: "group", criteria: ["Vokal", "Penghayatan", "Kekompakan"], max: [40, 30, 30] },
  ],
  TPQ: [
    { id: "tpq_tartil", name: "Tartil Al-Qur'an", type: "single", criteria: ["Tajwid", "Fashahah", "Suara/Irama"], max: [45, 35, 20] },
    { id: "tpq_adzan", name: "Adzan & Iqomah", type: "single", gender: "PA", criteria: ["Tajwid/Fashahah", "Lagu/Suara", "Adab"], max: [45, 35, 20] },
    { id: "tpq_nasyid", name: "Nasyid Islami", type: "group", criteria: ["Vokal", "Nada", "Ekspresi"], max: [40, 30, 30] },
    { id: "tpq_ccq", name: "Cerdas Cermat Al-Qur'an (CCQ)", type: "group", criteria: ["Skor Akhir"], max: [1000] },
    { id: "tpq_puitisasi", name: "Puitisasi Terjemah Al-Qur'an", type: "group", criteria: ["Vokal", "Penghayatan", "Kekompakan"], max: [40, 30, 30] },
    { id: "tpq_ceramah", name: "Ceramah Bhs. Indonesia", type: "single", criteria: ["Isi", "Dalil", "Retorika"], max: [40, 25, 35] },
  ],
  TQA: [
    { id: "tqa_tilawah", name: "Tilawah Al-Qur'an", type: "single", criteria: ["Tajwid", "Lagu", "Fashahah"], max: [45, 35, 20] },
    { id: "tqa_tahfidz", name: "Tahfidz Juz 'Amma", type: "single", criteria: ["Tahfidz", "Tajwid", "Adab"], max: [50, 30, 20] },
    { id: "tqa_ccq", name: "Cerdas Cermat Al-Qur'an (CCQ)", type: "group", criteria: ["Skor Akhir"], max: [1000] },
    { id: "tqa_kaligrafi", name: "Kaligrafi", type: "single", criteria: ["Kaidah", "Kebersihan", "Warna"], max: [50, 30, 20] },
    { id: "tqa_ceramah", name: "Ceramah Bhs. Indonesia", type: "single", criteria: ["Isi", "Dalil", "Retorika"], max: [40, 25, 35] },
  ],
};

const calculateAgeAtRef = (birthDateStr) => {
  if (!birthDateStr) return null;
  const birth = new Date(birthDateStr);
  const ref = new Date("2027-07-01");
  let years = ref.getFullYear() - birth.getFullYear();
  let months = ref.getMonth() - birth.getMonth();
  let days = ref.getDate() - birth.getDate();
  if (days < 0) { months -= 1; days += new Date(ref.getFullYear(), ref.getMonth(), 0).getDate(); }
  if (months < 0) { years -= 1; months += 12; }
  return { years, months, days, totalDays: Math.floor((ref - birth) / (1000 * 60 * 60 * 24)) };
};

const checkCategoryEligibility = (age) => {
  if (!age) return [];
  const { years } = age;
  if (years < 7) return ["TKQ", "TPQ", "TQA"];
  if (years < 12) return ["TPQ", "TQA"];
  if (years < 15) return ["TQA"];
  return ["Melebihi Batas"];
};

const IDCard = ({ p }) => (
  <div style={{ width: "6.5cm", height: "10.2cm" }} className="relative bg-white border-2 border-emerald-600 flex flex-col p-2 box-border mx-auto shadow-sm">
    <div className="flex justify-between items-center mb-1 pb-1">
      <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Kementerian_Agama_new_logo.png" alt="K" className="h-5 w-5 object-contain" />
      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_BKPRMI.png/600px-Logo_BKPRMI.png" alt="F" className="h-5 w-5 object-contain mx-1" />
    </div>
    <div className="text-center px-1 mb-1 border-b border-emerald-600 pb-1">
      <div className="text-[6px] font-black uppercase text-emerald-800 leading-tight">FESTIVAL ANAK SHOLEH INDONESIA (FASI) IX</div>
      <div className="text-[5px] font-bold uppercase text-slate-600 tracking-widest mt-0.5">KABUPATEN BATANG 2026</div>
    </div>
    <div className="w-[2.2cm] h-[2.8cm] mx-auto border-2 border-emerald-100 bg-slate-50 flex items-center justify-center shrink-0 mt-0.5 mb-1.5 rounded-md overflow-hidden shadow-inner">
      <UserCircle className="text-slate-300" size={36} />
    </div>
    <div className="flex-1 flex flex-col items-center text-center space-y-1.5 text-[7px] uppercase font-bold text-slate-800 px-1">
      <div className="w-full">
        <div className="text-[5px] text-slate-400 mb-1">NAMA PESERTA</div>
        <div className="font-black text-[10px] text-emerald-700 truncate w-full">{String(p.name)}</div>
      </div>
      <div className="w-full">
        <div className="text-[5px] text-slate-400 mb-1">CABANG LOMBA</div>
        <div className="font-bold text-[8px]">{String(p.branchName)} ({String(p.category)})</div>
      </div>
      <div className="w-full">
        <div className="text-[5px] text-slate-400 mb-1">LEMBAGA</div>
        <div className="truncate w-full text-[8px]">{String(p.institution)}</div>
        <div className="text-[6px] text-slate-500 mt-1">Kec. {String(p.district)}</div>
      </div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 bg-emerald-600 py-1.5 text-center flex flex-col items-center">
      <div className="text-[5px] text-emerald-100 uppercase mb-0.5">ID PESERTA</div>
      <div className="text-[8px] text-white font-black tracking-[0.2em]">{String(p.id)}</div>
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [scores, setScores] = useState({});
  
  const initialKecPasswords = {};
  KECAMATAN_LIST.forEach(k => initialKecPasswords[`DIST_${k}`] = "kecamatan123");
  const [passwords, setPasswords] = useState({ JURI: "juri123", ADMIN_KAB: "admin123", ...initialKecPasswords });

  const [activeTab, setActiveTab] = useState("beranda");
  const [notification, setNotification] = useState(null);
  const [selectedForPrint, setSelectedForPrint] = useState(null);
  const [currentRole, setCurrentRole] = useState(ROLES.PUBLIK);
  const [userDistrict, setUserDistrict] = useState(null); 
  const [authModal, setAuthModal] = useState(null);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [isBulkPrint, setIsBulkPrint] = useState(false);
  const [regType, setRegType] = useState("single");
  const [regMembers, setRegMembers] = useState([{ name: "", birthDate: "", age: null, gender: "PA" }]);
  const [regCategory, setRegCategory] = useState("");
  const [allowedCategories, setAllowedCategories] = useState([]);
  
  const [filterCategory, setFilterCategory] = useState("TKQ");
  const [filterDistrictGlobal, setFilterDistrictGlobal] = useState("Semua");
  const [scoringFilterKec, setScoringFilterKec] = useState("Semua");
  const [scoringFilterLomba, setScoringFilterLomba] = useState("Semua");
  const [scoringFilterGender, setScoringFilterGender] = useState("Semua");

  // --- LOGIKA OTOMATISASI FILTER ADMIN KECAMATAN ---
  useEffect(() => {
    if (currentRole.id === "ADMIN_KEC" && userDistrict) {
      setScoringFilterKec(userDistrict);
      setFilterDistrictGlobal(userDistrict);
    } else {
      setScoringFilterKec("Semua");
      setFilterDistrictGlobal("Semua");
    }
  }, [currentRole, userDistrict]);

  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch (e) { setLoading(false); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => { if (u) { setUser(u); setLoading(false); } });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const pRef = collection(db, "artifacts", appId, "public", "data", "participants");
    const sRef = collection(db, "artifacts", appId, "public", "data", "scores");
    const cRef = doc(db, "artifacts", appId, "public", "data", "config", "security");

    const unsubP = onSnapshot(pRef, (snap) => setParticipants(snap.docs.map(d => ({ id: d.id, ...d.data() }))), () => {});
    const unsubS = onSnapshot(sRef, (snap) => {
      const s = {}; snap.forEach(d => s[d.id] = d.data().values); setScores(s);
    }, () => {});
    const unsubC = onSnapshot(cRef, (d) => {
      if (d.exists()) setPasswords(prev => ({ ...prev, ...d.data() }));
    }, () => {});
    return () => { unsubP(); unsubS(); unsubC(); };
  }, [user]);

  const filteredParticipants = useMemo(() => {
    let list = participants;
    if (currentRole.id === "ADMIN_KEC" && userDistrict) {
      list = list.filter(p => p.district === userDistrict);
    } 
    return list;
  }, [participants, currentRole, userDistrict]);

  const scoringParticipants = useMemo(() => {
    return participants.filter(p => {
      const matchKec = scoringFilterKec === "Semua" || p.district === scoringFilterKec;
      const matchLomba = scoringFilterLomba === "Semua" || p.branchId === scoringFilterLomba;
      const matchGender = scoringFilterGender === "Semua" || p.gender === scoringFilterGender;
      const matchTab = p.category === filterCategory;
      return matchKec && matchLomba && matchGender && matchTab;
    });
  }, [participants, scoringFilterKec, scoringFilterLomba, scoringFilterGender, filterCategory]);

  const resultsData = useMemo(() => {
    const branchGroups = {};
    const relevantParticipants = filterDistrictGlobal === "Semua" 
      ? participants 
      : participants.filter(p => p.district === filterDistrictGlobal);

    relevantParticipants.forEach((p) => {
      const pScores = scores[p.id] || [];
      const total = pScores.reduce((a, b) => a + (Number(b) || 0), 0);
      const hasScore = pScores.some((s) => Number(s) > 0);
      if (!branchGroups[p.branchId]) branchGroups[p.branchId] = { PA: [], PI: [], Group: [] };
      if (p.type === "group") branchGroups[p.branchId].Group.push({ ...p, total, hasScore });
      else branchGroups[p.branchId][p.gender]?.push({ ...p, total, hasScore });
    });
    return branchGroups;
  }, [participants, scores, filterDistrictGlobal]);

  const notify = (msg, type = "success") => {
    setNotification({ msg: String(msg), type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const branchId = fd.get("branchId");
    const district = fd.get("district") || userDistrict;
    const institution = fd.get("institution");

    if (!branchId || !regCategory || !district) return notify("Lengkapi seluruh form", "error");
    const branchInfo = Object.values(BRANCH_DATA).flat().find(b => b.id === branchId);
    const activeMembers = regMembers.filter(m => m.name.trim() !== "");
    const pId = `FASI-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const newParticipant = {
      name: regType === "single" ? activeMembers[0].name : `Regu ${institution}`,
      institution, district, gender: regType === "single" ? activeMembers[0].gender : "Group",
      category: regCategory, branchId, branchName: branchInfo.name, type: regType, createdAt: Date.now(),
    };

    try {
      await setDoc(doc(db, "artifacts", appId, "public", "data", "participants", pId), newParticipant);
      notify("Pendaftaran Berhasil!");
      setSelectedForPrint({ id: pId, ...newParticipant });
      e.target.reset();
      setRegMembers([{ name: "", birthDate: "", age: null, gender: "PA" }]);
      setRegCategory("");
      setAllowedCategories([]);
      setActiveTab("beranda");
    } catch (err) { notify("Gagal simpan data", "error"); }
  };

  const handleUpdatePasswords = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newPassObj = { ...passwords };
    newPassObj.JURI = fd.get("JURI");
    newPassObj.ADMIN_KAB = fd.get("ADMIN_KAB");
    KECAMATAN_LIST.forEach(k => { newPassObj[`DIST_${k}`] = fd.get(`DIST_${k}`); });
    try {
      await setDoc(doc(db, "artifacts", appId, "public", "data", "config", "security"), newPassObj);
      notify("Sandi Sistem Diperbarui!");
    } catch (err) { notify("Gagal update sandi", "error"); }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-emerald-900 text-white font-black uppercase tracking-tighter">
      <Loader2 className="animate-spin mr-2"/> Sinkronisasi Sistem FASI...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-28 font-sans selection:bg-emerald-100">
      <style>{`@media print { .no-print { display: none !important; } .print-grid { display: grid !important; grid-template-columns: repeat(3, 1fr); gap: 10px; } }`}</style>
      
      {notification && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-8 py-3 rounded-full text-white font-black text-[10px] uppercase shadow-2xl ${notification.type === "error" ? "bg-red-500" : "bg-emerald-600"}`}>
          {String(notification.msg)}
        </div>
      )}

      <div className={isBulkPrint || selectedForPrint ? "no-print hidden" : ""}>
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 p-5 shadow-sm">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-600 p-2.5 rounded-2xl shadow-lg shadow-emerald-200/50"><ShieldCheck className="text-white" size={24} /></div>
              <div>
                <div className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">FASI IX BATANG</div>
                <div className="flex items-center gap-2 mt-1">
                   <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-widest">{String(currentRole.name)}</span>
                   {userDistrict && <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">• {userDistrict}</span>}
                </div>
              </div>
            </div>
            <button onClick={() => setShowRoleSwitcher(true)} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-emerald-600 transition-all hover:bg-white shadow-sm hover:shadow-md border border-transparent hover:border-emerald-100"><UserCircle size={24} /></button>
          </div>
        </header>

        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-slate-200 p-2 flex gap-1 rounded-[32px] shadow-2xl z-50">
          {[
            { id: "beranda", label: "Beranda", icon: LayoutDashboard },
            { id: "pendaftaran", label: "Daftar", icon: UserPlus },
            { id: "hasil", label: "Juara", icon: Trophy },
            { id: "penilaian", label: "Nilai", icon: ClipboardCheck },
            { id: "admin", label: "Admin", icon: Settings },
          ].filter((item) => {
            // HANYA TAMPILKAN BERANDA DI NAV BAR UNTUK ROLE PUBLIK
            if (currentRole.id === "PUBLIK") {
              return item.id === "beranda";
            }
            return currentRole.access.includes(item.id);
          }).map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center px-6 md:px-8 py-2.5 rounded-[24px] transition-all ${activeTab === t.id ? "text-emerald-600 bg-emerald-50 shadow-inner" : "text-slate-300"}`}>
              <t.icon size={20} />
              <div className="text-[8px] font-black uppercase mt-1.5">{String(t.label)}</div>
            </button>
          ))}
        </nav>

        <main className="max-w-4xl mx-auto p-5 md:p-8 space-y-12">
          
          {/* --- VIEW BERANDA --- */}
          {activeTab === "beranda" && (
            <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              <section className="flex flex-col items-center justify-center pt-10">
                <div className="bg-[#E2E8F0] w-full max-w-2xl rounded-[60px] p-12 md:p-20 flex flex-col items-center text-center shadow-lg border border-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                  
                  <div className="bg-white p-6 rounded-full mb-8 shadow-md border border-emerald-50">
                    <Award size={48} className="text-[#059669]" />
                  </div>
                  
                  <h2 className="text-[30px] md:text-[40px] font-black text-[#1E293B] uppercase italic tracking-tighter leading-tight mb-4 text-center">
                    SELAMAT DATANG DI FASI IX
                  </h2>
                  
                  <p className="text-slate-500 font-medium text-sm md:text-base max-w-lg mb-10 leading-relaxed px-4 text-center">
                    Pusat Informasi, Pendaftaran Santri, dan Pengumuman Hasil Kejuaraan FASI IX Tingkat Kabupaten Batang.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center px-4">
                    <button 
                      onClick={() => setActiveTab("pendaftaran")}
                      className="bg-[#059669] text-white px-10 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-200/50 hover:scale-105 transition-all w-full sm:w-auto flex items-center justify-center gap-2"
                    >
                      <UserPlus size={16}/> DAFTAR SEKARANG
                    </button>
                    <button 
                      onClick={() => setActiveTab("hasil")}
                      className="bg-white text-[#1E293B] px-10 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-md hover:bg-slate-50 transition-all w-full sm:w-auto border border-slate-200 flex items-center justify-center gap-2"
                    >
                      <Trophy size={16}/> LIHAT HASIL
                    </button>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase text-slate-400">Total Santri</div>
                    <div className="text-3xl font-black text-slate-800 tracking-tighter">
                      {currentRole.id === "ADMIN_KEC" ? filteredParticipants.length : participants.length}
                    </div>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600"><Users size={24}/></div>
                </div>
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase text-slate-400">Unit Lembaga</div>
                    <div className="text-3xl font-black text-slate-800 tracking-tighter">
                      {new Set((currentRole.id === "ADMIN_KEC" ? filteredParticipants : participants).map(p => p.institution)).size}
                    </div>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600"><Users2 size={24}/></div>
                </div>
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase text-slate-400">Wilayah</div>
                    <div className="text-3xl font-black text-slate-800 tracking-tighter">
                      {currentRole.id === "ADMIN_KEC" ? userDistrict : "15 Kec."}
                    </div>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600"><MapPin size={24}/></div>
                </div>
              </section>

              <section className="space-y-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-[#E2E8F0] p-3 rounded-2xl shadow-inner border border-white"><Search size={24} className="text-[#64748B]"/></div>
                    <div>
                       <div className="text-2xl font-black uppercase tracking-tighter text-[#1E293B]">Monitoring Pendaftar</div>
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none mt-1">
                         {currentRole.id === "ADMIN_KEC" ? `Data Wilayah Kecamatan ${userDistrict}` : "Cek Status Data Santri per Wilayah"}
                       </div>
                    </div>
                  </div>
                  
                  {/* FILTER DROPDOWN: HANYA MUNCUL UNTUK PUBLIK & ADMIN KAB */}
                  {currentRole.id !== "ADMIN_KEC" && (
                    <div className="bg-white p-2 rounded-3xl flex items-center gap-3 shadow-md w-full md:w-auto border border-slate-200">
                      <div className="pl-4 text-emerald-500"><Filter size={18}/></div>
                      <select 
                        className="bg-transparent text-[#1E293B] px-4 py-3 rounded-2xl border-none outline-none font-black text-[11px] uppercase cursor-pointer flex-1 md:min-w-[220px]"
                        value={scoringFilterKec}
                        onChange={(e) => setScoringFilterKec(e.target.value)}
                      >
                        <option value="Semua">Tampilkan Seluruh Kecamatan</option>
                        {KECAMATAN_LIST.map(k => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-[48px] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#F8FAFC] text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="p-8">Profil Santri</th>
                        <th className="p-8">Kecamatan</th>
                        <th className="p-8">Bidang Lomba</th>
                        <th className="p-8">Lembaga LPQ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {participants
                        .filter(p => scoringFilterKec === "Semua" || p.district === scoringFilterKec)
                        .slice(0, 15)
                        .map((p) => (
                        <tr key={p.id} className="hover:bg-emerald-50/30 transition-colors group">
                          <td className="p-8">
                            <div className="font-black text-base text-slate-800 uppercase leading-none group-hover:text-emerald-700 transition-colors">{p.name}</div>
                            <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-none">REG NO: {p.id}</div>
                          </td>
                          <td className="p-8 font-black text-[11px] uppercase text-emerald-600">{p.district}</td>
                          <td className="p-8 font-bold text-xs text-slate-600">{p.branchName} <span className="text-[9px] font-black text-white bg-emerald-500 px-2 py-0.5 rounded ml-1 uppercase">{p.category}</span></td>
                          <td className="p-8 font-medium text-xs text-slate-500">{p.institution}</td>
                        </tr>
                      ))}
                      {(currentRole.id === "ADMIN_KEC" ? filteredParticipants : participants).length === 0 && (
                        <tr><td colSpan="4" className="p-20 text-center font-black text-slate-300 uppercase italic">Belum Ada Data Santri Terdaftar</td></tr>
                      )}
                    </tbody>
                  </table>
                  <div className="p-6 bg-slate-50/50 flex items-center justify-center gap-3">
                     <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sistem Database Terintegrasi FASI IX</div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* --- VIEW PENDAFTARAN --- */}
          {activeTab === "pendaftaran" && (
            <div className="animate-in slide-in-from-right-4 duration-500">
              <section className="bg-white p-10 rounded-[60px] shadow-sm border border-slate-200 space-y-10">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="bg-emerald-100 text-emerald-600 p-4 rounded-3xl shadow-inner"><UserPlus size={32}/></div>
                  <div className="text-2xl font-black uppercase tracking-tighter text-[#1E293B]">Pendaftaran Santri</div>
                  <div className="text-xs font-medium text-slate-400 max-w-sm">Pastikan data santri sesuai dengan identitas asli (Akte Kelahiran).</div>
                </div>

                <form onSubmit={handleRegister} className="space-y-8 max-w-2xl mx-auto">
                  <div className="grid grid-cols-2 gap-3 p-2 bg-[#F1F5F9] rounded-[32px]">
                    <button type="button" onClick={() => { setRegType("single"); setRegMembers([{ name: "", birthDate: "", age: null, gender: "PA" }]); setRegCategory(""); }} className={`p-4 rounded-[26px] font-black text-[10px] uppercase transition-all ${regType === "single" ? "bg-white text-emerald-600 shadow-md" : "text-slate-400"}`}>PESERTA TUNGGAL</button>
                    <button type="button" onClick={() => { setRegType("group"); setRegMembers(Array.from({ length: 3 }, () => ({ name: "", birthDate: "", age: null, gender: "PA" }))); setRegCategory(""); }} className={`p-4 rounded-[26px] font-black text-[10px] uppercase transition-all ${regType === "group" ? "bg-white text-emerald-600 shadow-md" : "text-slate-400"}`}>PESERTA REGU</button>
                  </div>

                  {regMembers.map((m, i) => (
                    <div key={i} className="p-8 bg-slate-50 rounded-[40px] border border-slate-200/50 space-y-6 shadow-inner">
                      <div className="space-y-2">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nama Santri {regType === "group" && i+1}</div>
                        <input placeholder="Ketik nama lengkap..." className="w-full p-5 rounded-2xl border-none text-sm font-black outline-none shadow-sm focus:ring-4 focus:ring-emerald-100" value={m.name} onChange={(e) => { const next = [...regMembers]; next[i].name = e.target.value; setRegMembers(next); }} required={i === 0 || (regType === "group" && i < 2)} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tanggal Lahir</div>
                          <input type="date" className="w-full p-5 rounded-2xl border-none text-[11px] font-black bg-white shadow-sm outline-none" value={m.birthDate || ""} onChange={(e) => {
                            const date = e.target.value;
                            const ageCalc = calculateAgeAtRef(date);
                            const next = [...regMembers];
                            next[i].birthDate = date;
                            next[i].age = ageCalc;
                            setRegMembers(next);
                            const validAges = next.filter(x => x.birthDate);
                            if (validAges.length > 0) {
                              const oldest = validAges.reduce((prev, curr) => (prev.age?.totalDays || 0) > (curr.age?.totalDays || 0) ? prev : curr);
                              if (oldest.age) setAllowedCategories(checkCategoryEligibility(oldest.age));
                            }
                          }} required={i === 0 || (regType === "group" && i < 2)} />
                        </div>
                        <div className="space-y-2">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Jenis Kelamin</div>
                          <select className="w-full p-5 rounded-2xl border-none text-[11px] font-black bg-white shadow-sm outline-none cursor-pointer" value={m.gender} onChange={(e) => { const next = [...regMembers]; next[i].gender = e.target.value; setRegMembers(next); }} required>
                            <option value="PA">Putra (PA)</option>
                            <option value="PI">Putri (PI)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Kecamatan Asal</div>
                      <select name="district" className="w-full p-5 bg-[#F1F5F9] rounded-2xl font-black text-xs border-none outline-none appearance-none cursor-pointer shadow-sm" defaultValue={userDistrict || ""}>
                        <option value="" disabled>-- Pilih Kecamatan --</option>
                        {KECAMATAN_LIST.map((k) => <option key={k} value={k}>{String(k)}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Unit LPQ / TPQ</div>
                      <input name="institution" placeholder="Ketik nama unit lembaga..." className="w-full p-5 bg-[#F1F5F9] rounded-2xl font-black text-sm border-none outline-none shadow-sm" required />
                    </div>
                  </div>

                  {allowedCategories.length > 0 && (
                    <div className="space-y-8 pt-8 border-t border-slate-100 animate-in slide-in-from-top-4">
                      <div className="space-y-4 text-center">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none">Kategori Lomba yang Tersedia:</div>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {allowedCategories[0] === "Melebihi Batas" ? (
                            <div className="p-6 bg-red-50 text-red-500 rounded-3xl text-[11px] font-black uppercase text-center w-full border border-red-100 flex items-center justify-center gap-3">
                              <ShieldAlert size={18} /> Usia Melebihi Batas Maksimal FASI IX (15 Tahun)
                            </div>
                          ) : (
                            allowedCategories.map((c) => (
                              <button key={c} type="button" onClick={() => setRegCategory(c)} className={`px-10 py-3 rounded-2xl text-[10px] font-black transition-all shadow-sm border-2 ${regCategory === c ? "bg-[#059669] text-white border-[#059669]" : "bg-white text-slate-400 border-slate-100 hover:border-emerald-200"}`}>{String(c)}</button>
                            ))
                          )}
                        </div>
                      </div>
                      
                      {regCategory && regCategory !== "Melebihi Batas" && (
                        <div className="space-y-2 animate-in zoom-in duration-300">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Pilih Cabang Lomba</div>
                          <select name="branchId" className="w-full p-6 bg-[#C1EBD7]/40 text-emerald-900 rounded-[32px] font-black text-xs border-none outline-none uppercase shadow-inner cursor-pointer" required>
                            <option value="">-- DAFTAR LOMBA KATEGORI {regCategory} --</option>
                            {BRANCH_DATA[regCategory]?.filter((b) => b.type === regType).map((b) => <option key={b.id} value={b.id}>{String(b.name)}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                  <button className="w-full bg-[#059669] text-white font-black py-6 rounded-[40px] shadow-2xl shadow-emerald-200/50 uppercase text-xs tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-3 active:scale-95">
                    <Save size={18}/> SIMPAN PENDAFTARAN
                  </button>
                  <button type="button" onClick={() => setActiveTab("beranda")} className="w-full text-slate-400 font-black text-[10px] uppercase tracking-widest py-2 flex items-center justify-center gap-2">Kembali ke Beranda</button>
                </form>
              </section>
            </div>
          )}

          {/* --- VIEW HASIL JUARA --- */}
          {activeTab === "hasil" && (
            <div className="space-y-12 animate-in slide-in-from-left-4 duration-500 pb-20">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="bg-amber-100 text-amber-600 p-3 rounded-2xl shadow-inner border border-white"><Trophy size={28}/></div>
                  <div>
                     <div className="text-2xl font-black uppercase tracking-tighter text-[#1E293B]">Rekapitulasi Juara</div>
                     <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none mt-1">
                       {currentRole.id === "ADMIN_KEC" ? `Peringkat Kecamatan ${userDistrict}` : "Update Real-time dari Dewan Juri"}
                     </div>
                  </div>
                </div>
                
                {/* FILTER DROPDOWN: HANYA MUNCUL UNTUK PUBLIK & ADMIN KAB */}
                {currentRole.id !== "ADMIN_KEC" && (
                  <div className="bg-slate-900 p-2 rounded-3xl flex items-center gap-3 shadow-xl w-full md:w-auto">
                    <div className="pl-4 text-emerald-400"><Filter size={16}/></div>
                    <select 
                      className="bg-transparent text-white px-6 py-3 rounded-2xl border-none outline-none font-black text-[10px] uppercase cursor-pointer flex-1"
                      value={filterDistrictGlobal}
                      onChange={(e) => setFilterDistrictGlobal(e.target.value)}
                    >
                      <option value="Semua" className="text-slate-900">🏆 Peringkat Kabupaten</option>
                      {KECAMATAN_LIST.map(k => <option key={k} value={k} className="text-slate-900">📍 Kec. {k}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-16">
                {Object.keys(BRANCH_DATA).map(catKey => (
                  <div key={catKey} className="space-y-8">
                     <div className="flex items-center gap-4">
                        <span className="h-px flex-1 bg-slate-200"></span>
                        <div className="bg-[#1E293B] text-white px-10 py-2 rounded-full font-black text-xs uppercase shadow-sm tracking-[0.2em]">{catKey}</div>
                        <span className="h-px flex-1 bg-slate-200"></span>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {BRANCH_DATA[catKey].map(branch => {
                          const winners = resultsData[branch.id];
                          if (!winners) return null;
                          const hasAnyWinner = ["PA", "PI", "Group"].some(g => winners[g] && winners[g].length > 0);
                          if (!hasAnyWinner) return null;

                          return (
                            <div key={branch.id} className="bg-white rounded-[48px] border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-all border-b-4 border-b-emerald-100">
                              <div className="p-8 bg-[#F8FAFC] border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="bg-[#059669] text-white p-2 rounded-xl shadow-sm"><Award size={18}/></div>
                                  <div className="font-black text-sm uppercase text-[#1E293B] italic tracking-tight leading-none">{branch.name}</div>
                                </div>
                              </div>
                              <div className="p-8 space-y-8">
                                 {["PA", "PI", "Group"].map(gKey => (
                                   winners[gKey] && winners[gKey].length > 0 && (
                                     <div key={gKey} className="space-y-4">
                                        <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm"></div> Kategori {gKey}
                                        </div>
                                        <div className="space-y-3">
                                          {winners[gKey].sort((a,b) => b.total - a.total).slice(0,3).map((w, i) => (
                                            <div key={i} className={`flex items-center gap-4 p-5 rounded-[32px] border-2 transition-all ${i === 0 ? 'bg-emerald-50 border-emerald-100 shadow-sm scale-[1.02]' : 'bg-slate-50 border-transparent opacity-80'}`}>
                                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-amber-400 text-white shadow-md' : 'bg-[#E2E8F0] text-slate-500'}`}>{i+1}</div>
                                              <div className="flex-1 min-w-0">
                                                <div className="font-black text-[13px] uppercase truncate text-[#1E293B] leading-none mb-1">{w.name}</div>
                                                <div className="text-[10px] font-bold text-emerald-600 uppercase truncate">Kec. {w.district} • {w.institution}</div>
                                              </div>
                                              <div className="text-right">
                                                 <span className="font-black text-xl text-[#059669] tracking-tighter">{w.total}</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                     </div>
                                   )
                                 ))}
                              </div>
                            </div>
                          );
                        })}
                     </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- VIEW PENILAIAN --- */}
          {activeTab === "penilaian" && (
            <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500 pb-10">
               <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-8 rounded-[48px] border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-600 text-white p-3 rounded-2xl shadow-lg"><ClipboardCheck size={28}/></div>
                    <div>
                      <div className="text-2xl font-black uppercase tracking-tighter leading-none">Lembar Penilaian</div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Input Nilai Santri FASI IX</div>
                    </div>
                  </div>
                  
                  <div className="flex bg-[#F1F5F9] p-1.5 rounded-[24px]">
                    {["TKQ", "TPQ", "TQA"].map(cat => (
                      <button 
                        key={cat} 
                        onClick={() => setFilterCategory(cat)}
                        className={`px-8 py-2.5 rounded-[18px] font-black text-[10px] uppercase transition-all ${filterCategory === cat ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-2 shadow-sm">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><MapPin size={10}/> Kecamatan</div>
                    <select className="w-full bg-[#F1F5F9] p-3 rounded-xl border-none outline-none font-black text-xs uppercase cursor-pointer" value={scoringFilterKec} onChange={(e) => setScoringFilterKec(e.target.value)}>
                      <option value="Semua">Semua Kecamatan</option>
                      {KECAMATAN_LIST.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-2 shadow-sm">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Search size={10}/> Cabang Lomba</div>
                    <select className="w-full bg-[#F1F5F9] p-3 rounded-xl border-none outline-none font-black text-xs uppercase cursor-pointer" value={scoringFilterLomba} onChange={(e) => setScoringFilterLomba(e.target.value)}>
                      <option value="Semua">Semua Lomba</option>
                      {BRANCH_DATA[filterCategory].map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-2 shadow-sm">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Users size={10}/> Bidang/Gender</div>
                    <select className="w-full bg-[#F1F5F9] p-3 rounded-xl border-none outline-none font-black text-xs uppercase cursor-pointer" value={scoringFilterGender} onChange={(e) => setScoringFilterGender(e.target.value)}>
                      <option value="Semua">Semua Bidang</option>
                      <option value="PA">Putra (PA)</option>
                      <option value="PI">Putri (PI)</option>
                      <option value="Group">Regu / Kelompok</option>
                    </select>
                  </div>
               </div>

               <div className="space-y-6">
                  {BRANCH_DATA[filterCategory].filter(b => scoringFilterLomba === "Semua" || b.id === scoringFilterLomba).map(branch => {
                    const list = scoringParticipants.filter(p => p.branchId === branch.id);
                    if (list.length === 0) return null;

                    return (
                      <div key={branch.id} className="bg-white rounded-[48px] border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-8 bg-[#F8FAFC] border-b border-slate-100">
                          <div className="font-black text-xs uppercase text-[#1E293B] tracking-tight leading-none">{branch.name} <span className="text-[9px] text-emerald-500 ml-2">({list.length} Peserta)</span></div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="bg-[#F1F5F9] text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              <tr>
                                <th className="p-8">Nama Peserta</th>
                                {branch.criteria.map((c, idx) => <th key={idx} className="p-6 text-center">{c} <br/><span className="text-[8px] text-slate-300">(Max {branch.max[idx]})</span></th>)}
                                <th className="p-8 text-center text-emerald-600 font-black">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {list.map(p => {
                                const pScores = scores[p.id] || Array(branch.criteria.length).fill(0);
                                const total = pScores.reduce((a, b) => a + (Number(b) || 0), 0);
                                return (
                                  <tr key={p.id} className="hover:bg-emerald-50 transition-colors">
                                    <td className="p-8">
                                      <div className="font-black text-sm text-slate-800 uppercase leading-none mb-1">{p.name}</div>
                                      <div className="text-[9px] font-bold text-slate-400 uppercase leading-none">Kec. {p.district} • {p.institution}</div>
                                    </td>
                                    {branch.criteria.map((c, idx) => (
                                      <td key={idx} className="p-6 text-center">
                                        <input 
                                          type="number" 
                                          className="w-16 p-3 bg-white border border-slate-200 rounded-xl text-center font-black text-sm outline-none focus:ring-4 focus:ring-emerald-100 shadow-sm" 
                                          value={pScores[idx] || ""} 
                                          onChange={async (e) => {
                                            const val = Math.min(branch.max[idx], Math.max(0, parseInt(e.target.value) || 0));
                                            const next = [...pScores]; next[idx] = val;
                                            await setDoc(doc(db, "artifacts", appId, "public", "data", "scores", p.id), { values: next });
                                          }} 
                                        />
                                      </td>
                                    ))}
                                    <td className="p-8 text-center font-black text-emerald-700 text-2xl tracking-tighter">{total}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          )}

          {/* --- VIEW ADMIN --- */}
          {activeTab === "admin" && (
            <div className="space-y-12 animate-in slide-in-from-bottom-6 duration-500 pb-10">
              <div className="bg-white rounded-[48px] border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-10 border-b border-slate-100 bg-[#F8FAFC] flex flex-col md:flex-row justify-between items-center gap-6">
                   <div>
                     <div className="font-black text-2xl uppercase tracking-tighter text-[#1E293B]">Database Peserta</div>
                     <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic leading-none">
                       {userDistrict ? `Admin Kecamatan ${userDistrict}` : 'Tingkat Kabupaten'}
                     </div>
                   </div>
                   <button onClick={() => setIsBulkPrint(true)} className="bg-emerald-600 text-white px-10 py-4 rounded-full font-black text-[11px] uppercase shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-2 active:scale-95 shadow-emerald-200/50">
                     <Printer size={18}/> Cetak Kartu Masal
                   </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#F1F5F9] text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <tr>
                        <th className="p-8">Profil Santri</th>
                        {!userDistrict && <th className="p-8">Kecamatan</th>}
                        <th className="p-8 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredParticipants.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="p-8">
                            <div className="font-black text-lg text-slate-800 uppercase leading-none mb-2 group-hover:text-emerald-700 transition-colors">{p.name}</div>
                            <div className="flex gap-2">
                              <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full uppercase leading-none">{p.category}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase self-center leading-none">{p.branchName}</span>
                            </div>
                          </td>
                          {!userDistrict && <td className="p-8"><span className="text-[10px] font-black uppercase text-slate-500">{p.district}</span></td>}
                          <td className="p-8">
                            <div className="flex justify-center gap-3">
                              <button onClick={() => setSelectedForPrint(p)} className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><Printer size={18} /></button>
                              <button onClick={() => { if (confirm(`Hapus data ${p.name}?`)) { deleteDoc(doc(db, "artifacts", appId, "public", "data", "participants", p.id)); notify("Data Dihapus!"); } }} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={18} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {currentRole.id === "ADMIN_KAB" && (
                <div className="bg-white rounded-[48px] border border-slate-200 overflow-hidden shadow-2xl">
                  <div className="p-10 bg-[#1E293B] text-white flex justify-between items-center">
                    <div className="text-2xl font-black uppercase tracking-tighter italic">Manajemen Keamanan</div>
                    <KeyRound size={32} className="opacity-30" />
                  </div>
                  <form onSubmit={handleUpdatePasswords} className="p-10 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 leading-none">Sandi Juri Utama</div>
                        <input name="JURI" type="text" defaultValue={passwords.JURI} className="w-full p-5 bg-[#F8FAFC] border-2 border-slate-100 rounded-[28px] font-black text-sm outline-none focus:border-emerald-500" required />
                      </div>
                      <div className="space-y-3">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 leading-none">Sandi Admin Kabupaten</div>
                        <input name="ADMIN_KAB" type="text" defaultValue={passwords.ADMIN_KAB} className="w-full p-5 bg-[#F8FAFC] border-2 border-slate-100 rounded-[28px] font-black text-sm outline-none focus:border-emerald-500" required />
                      </div>
                    </div>
                    <div className="pt-6 border-t border-slate-100 space-y-8">
                       <div className="text-xs font-black uppercase text-[#1E293B] flex items-center gap-2"><ShieldAlert size={16} className="text-amber-500"/> Sandi Admin Tiap Kecamatan</div>
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                         {KECAMATAN_LIST.map(k => (
                           <div key={k} className="bg-[#F8FAFC] p-6 rounded-[32px] border border-slate-100 space-y-3 hover:bg-white transition-colors group">
                             <div className="text-[9px] font-black text-slate-400 uppercase group-hover:text-emerald-600 transition-colors leading-none">Kec. {k}</div>
                             <input name={`DIST_${k}`} type="text" defaultValue={passwords[`DIST_${k}`] || "kecamatan123"} className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black text-xs outline-none focus:ring-4 focus:ring-emerald-100 shadow-sm" required />
                           </div>
                         ))}
                       </div>
                    </div>
                    <button type="submit" className="w-full bg-[#1E293B] text-white font-black py-6 rounded-[36px] uppercase text-xs shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 shadow-emerald-900/20">
                      <Save size={18} /> Simpan Seluruh Perubahan Sandi
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* --- MODAL LOGIN / ROLE SWITCHER --- */}
      {showRoleSwitcher && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[60px] p-12 shadow-2xl animate-in zoom-in duration-300 border border-white/20 relative">
            
            {/* LOGOUT BUTTON IF LOGGED IN */}
            {currentRole.id !== "PUBLIK" && (
               <button 
                onClick={() => { setCurrentRole(ROLES.PUBLIK); setUserDistrict(null); setShowRoleSwitcher(false); setActiveTab("beranda"); }}
                className="absolute top-8 right-8 text-red-500 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"
               >
                 <LogOut size={16}/> Keluar Akun
               </button>
            )}

            <div className="font-black text-base uppercase text-slate-400 tracking-[0.2em] mb-10 text-center">Otoritas Akses</div>
            <div className="space-y-4">
              <button onClick={() => { setCurrentRole(ROLES.PUBLIK); setUserDistrict(null); setShowRoleSwitcher(false); setActiveTab("beranda"); }} className="w-full p-8 rounded-[40px] bg-slate-50 border-4 border-transparent hover:border-emerald-500 hover:bg-emerald-50 text-left transition-all flex justify-between items-center group shadow-sm">
                <div><div className="font-black text-xl uppercase group-hover:text-emerald-700 transition-colors">Publik / Umum</div><div className="text-[9px] font-black text-slate-400 uppercase mt-1">Akses Info, Daftar & Hasil</div></div>
                <Unlock size={24} className="text-emerald-500" />
              </button>
              <button onClick={() => setAuthModal({ id: "ADMIN_KEC", input: "", step: 1 })} className="w-full p-8 rounded-[40px] bg-slate-50 border-4 border-transparent hover:border-emerald-500 hover:bg-emerald-50 text-left transition-all flex justify-between items-center group shadow-sm">
                <div><div className="font-black text-xl uppercase group-hover:text-emerald-700 transition-colors">Admin Kecamatan</div><div className="text-[9px] font-black text-slate-400 uppercase mt-1">Kelola data wilayah</div></div>
                <Lock size={24} className="text-slate-300" />
              </button>
              <button onClick={() => setAuthModal({ id: "ADMIN_KAB", input: "", step: 2 })} className="w-full p-8 rounded-[40px] bg-[#1E293B] border-4 border-transparent hover:border-emerald-500 text-left transition-all flex justify-between items-center group shadow-sm">
                <div><div className="font-black text-xl uppercase text-white group-hover:text-emerald-400 transition-colors">Admin Kabupaten</div><div className="text-[9px] font-black text-slate-500 uppercase mt-1">Otoritas penuh sistem</div></div>
                <ShieldCheck size={24} className="text-emerald-500" />
              </button>
              <button onClick={() => setAuthModal({ id: "JURI", input: "", step: 2 })} className="w-full p-6 rounded-[30px] bg-white border-2 border-slate-200 text-left transition-all flex justify-between items-center hover:bg-slate-50 shadow-sm">
                <div><div className="font-black text-lg uppercase text-slate-700">Dewan Juri Penilai</div></div>
                <ClipboardCheck size={20} className="text-slate-400" />
              </button>
            </div>
            <button onClick={() => setShowRoleSwitcher(false)} className="w-full mt-10 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-colors flex items-center justify-center gap-2 leading-none">Tutup Menu</button>
          </div>
        </div>
      )}

      {/* --- MODAL VERIFIKASI SANDI --- */}
      {authModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[110] flex items-center justify-center p-6">
          <div className="bg-white p-12 rounded-[64px] w-full max-w-sm text-center shadow-2xl border border-slate-100">
            {authModal.id === "ADMIN_KEC" && authModal.step === 1 ? (
              <>
                <div className="font-black text-2xl uppercase tracking-tighter mb-8 text-[#1E293B]">Pilih Kecamatan</div>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2 no-scrollbar mb-8">
                   {KECAMATAN_LIST.map(k => (
                     <button key={k} onClick={() => setAuthModal({...authModal, step: 2, district: k})} className="p-4 bg-slate-50 rounded-2xl font-black text-[10px] uppercase hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-slate-100">{k}</button>
                   ))}
                </div>
                <button onClick={() => setAuthModal(null)} className="text-slate-400 font-black text-xs uppercase tracking-widest">Batalkan</button>
              </>
            ) : (
              <>
                <KeyRound className="mx-auto text-emerald-600 mb-6" size={48} />
                <div className="font-black text-xl uppercase tracking-tighter mb-2 text-[#1E293B]">Verifikasi Sandi</div>
                <div className="text-[10px] font-black text-slate-400 uppercase mb-8 leading-none">Role: {authModal.district ? `Admin Kec. ${authModal.district}` : authModal.id.replace('_', ' ')}</div>
                <input type="password" autoFocus className="w-full p-6 bg-[#F1F5F9] rounded-[36px] font-black text-center text-3xl mb-8 outline-none focus:ring-8 focus:ring-emerald-100 shadow-inner border border-slate-200" value={authModal.input} onChange={(e) => setAuthModal({ ...authModal, input: e.target.value })} />
                <div className="flex gap-4">
                  <button onClick={() => { 
                    const passToMatch = authModal.district ? passwords[`DIST_${authModal.district}`] || "kecamatan123" : passwords[authModal.id];
                    if (authModal.input === passToMatch) { 
                      setCurrentRole(ROLES[authModal.id]); 
                      setUserDistrict(authModal.district || null);
                      setAuthModal(null); 
                      setShowRoleSwitcher(false); 
                      setActiveTab("beranda"); 
                      notify(`Otentikasi Berhasil!`); 
                    } else notify("Sandi Salah!", "error"); 
                  }} className="flex-1 bg-emerald-600 text-white font-black py-6 rounded-[32px] text-xs shadow-2xl hover:bg-emerald-700 transition-all active:scale-95 shadow-emerald-200/50">MASUK</button>
                  <button onClick={() => setAuthModal(null)} className="flex-1 bg-slate-100 text-slate-400 font-black py-6 rounded-[32px] text-xs">BATAL</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL PRINT --- */}
      {selectedForPrint && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-[120] flex items-center justify-center p-6 print:bg-white print:p-0">
          <div className="bg-white p-10 rounded-[60px] max-w-sm w-full text-center shadow-2xl print:hidden animate-in zoom-in border border-white/20">
            <div className="text-xl font-black text-[#1E293B] uppercase mb-8 italic tracking-tighter">Preview Kartu Santri</div>
            <div className="flex justify-center mb-8"><IDCard p={selectedForPrint} /></div>
            <div className="flex gap-4">
              <button onClick={() => window.print()} className="flex-1 bg-[#059669] text-white font-black py-5 rounded-[32px] text-xs shadow-xl active:scale-95 transition-all shadow-emerald-200/50">PRINT SEKARANG</button>
              <button onClick={() => setSelectedForPrint(null)} className="flex-1 bg-[#F1F5F9] text-slate-400 font-black py-5 rounded-[32px]">TUTUP</button>
            </div>
          </div>
          <div className="hidden print:block print:w-full"><IDCard p={selectedForPrint} /></div>
        </div>
      )}

      {/* --- VIEW CETAK MASAL --- */}
      {isBulkPrint && (
        <div className="absolute top-0 left-0 right-0 min-h-screen bg-white z-[200] p-12 print:p-0">
          <div className="flex justify-between items-center mb-12 no-print bg-[#1E293B] text-white p-10 rounded-[60px] shadow-2xl">
            <div>
              <div className="text-4xl font-black uppercase tracking-tighter leading-none italic">Cetak Kartu Peserta</div>
              <div className="text-[10px] font-black uppercase text-emerald-400 mt-2 tracking-widest italic leading-none">Wilayah: {userDistrict || 'Seluruh Kabupaten'}</div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => window.print()} className="bg-[#059669] text-white px-12 py-5 rounded-full font-black shadow-lg hover:bg-emerald-700 transition-all active:scale-95 shadow-emerald-200/50">KONFIRMASI PRINT</button>
              <button onClick={() => setIsBulkPrint(false)} className="bg-white/10 text-white px-12 py-5 rounded-full font-black hover:bg-white/20 transition-all">BATAL</button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid-cols-3 print:gap-4">
            {filteredParticipants.map((p) => <IDCard key={p.id} p={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
