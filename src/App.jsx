import React, { useState, useEffect, useMemo, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  onSnapshot,
  deleteDoc,
  writeBatch,
  updateDoc,
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
  LogOut,
  ArrowUpCircle,
  RefreshCw,
  Info,
  ChevronRight,
  Gavel,
  BarChart3,
  ListFilter,
  Edit3,
  Type
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
  JURI: { id: "JURI", name: "Juri Lomba", access: ["penilaian"] },
  ADMIN_KEC: { id: "ADMIN_KEC", name: "Admin Kecamatan", access: ["beranda", "pendaftaran", "admin", "hasil", "penilaian"] },
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
    { id: "tpq_menggambar", name: "Menggambar", type: "single", criteria: ["Kesesuaian Tema", "Artistik", "Kelengkapan Imajinasi", "Pemilihan Warna", "Kekayaan Imajinasi", "Kebersihan & Kehalusan"], max: [10, 30, 20, 15, 15, 10] },
  ],
  TQA: [
    { id: "tqa_tilawah", name: "Tilawah Al-Qur'an", type: "single", criteria: ["Tajwid", "Lagu", "Fashahah"], max: [45, 35, 20] },
    { id: "tqa_tahfidz", name: "Tahfidz Juz 'Amma", type: "single", criteria: ["Tahfidz", "Tajwid", "Adab"], max: [50, 30, 20] },
    { id: "tqa_ccq", name: "Cerdas Cermat Al-Qur'an (CCQ)", type: "group", criteria: ["Skor Akhir"], max: [1000] },
    { id: "tqa_kaligrafi", name: "Kaligrafi", type: "single", criteria: ["Kaidah", "Kebersihan", "Warna"], max: [50, 30, 20] },
    { id: "tqa_ceramah", name: "Ceramah Bhs. Indonesia", type: "single", criteria: ["Isi", "Dalil", "Retorika"], max: [40, 25, 35] },
    { id: "tqa_kisah", name: "Kisah Islami", type: "single", criteria: ["Isi Kisah", "Pengembangan Imajinasi", "Retorika"], max: [40, 35, 25] },
  ],
};

const ALL_BRANCHES = [...BRANCH_DATA.TKQ, ...BRANCH_DATA.TPQ, ...BRANCH_DATA.TQA];

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
  const { years, months, days } = age;
  const isLessOrEqual = (yLimit) => {
    if (years < yLimit) return true;
    if (years === yLimit && months === 0 && days === 0) return true;
    return false;
  };
  const categories = [];
  if (isLessOrEqual(7)) categories.push("TKQ");
  if (isLessOrEqual(12)) categories.push("TPQ");
  if (isLessOrEqual(15)) categories.push("TQA");
  return categories.length === 0 ? ["Melebihi Batas"] : categories;
};

const IDCard = ({ p }) => (
  <div style={{ width: "6.5cm", height: "10.2cm" }} className="relative bg-white border-2 border-emerald-600 flex flex-col p-2 box-border mx-auto shadow-sm break-inside-avoid">
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
        <div className="text-[5px] text-slate-400 mb-1 leading-none">NAMA PESERTA</div>
        <div className="font-black text-[10px] text-emerald-700 truncate w-full leading-none">{String(p.name)}</div>
      </div>
      <div className="w-full">
        <div className="text-[5px] text-slate-400 mb-1 leading-none">CABANG LOMBA</div>
        <div className="font-bold text-[8px] leading-tight">{String(p.branchName)} ({String(p.category)})</div>
      </div>
      <div className="w-full">
        <div className="text-[5px] text-slate-400 mb-1 leading-none">LEMBAGA</div>
        <div className="truncate w-full text-[8px] leading-none">{String(p.institution)}</div>
        <div className="text-[6px] text-slate-500 mt-1 uppercase leading-none">Kec. {String(p.district)}</div>
      </div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 bg-emerald-600 py-1.5 text-center flex flex-col items-center">
      <p className="text-[5px] text-emerald-100 uppercase mb-0.5">ID PESERTA</p>
      <p className="text-[8px] text-white font-black tracking-[0.2em]">{String(p.id)}</p>
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [scores, setScores] = useState({});
  const [passwords, setPasswords] = useState({});

  const [activeTab, setActiveTab] = useState("beranda");
  const [notification, setNotification] = useState(null);
  const [selectedForPrint, setSelectedForPrint] = useState(null);
  const [currentRole, setCurrentRole] = useState(ROLES.PUBLIK);
  const [userDistrict, setUserDistrict] = useState(null); 
  const [userBranch, setUserBranch] = useState(null);
  const [authModal, setAuthModal] = useState(null);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [isBulkPrint, setIsBulkPrint] = useState(false);
  
  const [regType, setRegType] = useState("single");
  const [regMembers, setRegMembers] = useState([{ name: "", birthDate: "", gender: "PA", age: null }]);
  const [regCategory, setRegCategory] = useState("");
  const [allowedCategories, setAllowedCategories] = useState([]);
  
  const [filterCategory, setFilterCategory] = useState("TKQ");
  const [filterDistrictGlobal, setFilterDistrictGlobal] = useState("Semua");
  const [scoringFilterKec, setScoringFilterKec] = useState("Semua");
  const [scoringFilterLomba, setScoringFilterLomba] = useState("Semua");
  const [activeLevel, setActiveLevel] = useState("kecamatan");

  // Filter khusus untuk Beranda (Public Monitoring)
  const [berandaFilterKec, setBerandaFilterKec] = useState("Semua");
  const [berandaFilterCat, setBerandaFilterCat] = useState("Semua");
  const [berandaFilterBranch, setBerandaFilterBranch] = useState("Semua");

  // State untuk Mode Penilaian (Rinci atau Total)
  const [scoringMode, setScoringMode] = useState("rinci"); // "rinci" atau "total"

  useEffect(() => {
    // Logika Sinkronisasi State Berdasarkan Role agar Santri muncul
    if (currentRole.id === "ADMIN_KEC") {
      setScoringFilterKec(userDistrict);
      setFilterDistrictGlobal(userDistrict);
      setBerandaFilterKec(userDistrict);
      setActiveLevel("kecamatan");
    } else if (currentRole.id === "JURI") {
      setScoringFilterKec(userDistrict);
      setScoringFilterLomba(userBranch);
      setActiveLevel("kecamatan");
      
      const foundCat = Object.keys(BRANCH_DATA).find(cat => 
        BRANCH_DATA[cat].some(b => b.id === userBranch)
      );
      if (foundCat) setFilterCategory(foundCat);
      
    } else if (currentRole.id === "ADMIN_KAB") {
      setActiveLevel("kabupaten");
    }
  }, [currentRole, userDistrict, userBranch]);

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
      if (d.exists()) setPasswords(d.data());
    }, () => {});
    return () => { unsubP(); unsubS(); unsubC(); };
  }, [user]);

  // Data terfilter untuk monitoring beranda
  const monitoredParticipants = useMemo(() => {
    return participants.filter(p => {
      const matchLevel = (p.level || "kecamatan") === activeLevel;
      const matchKec = berandaFilterKec === "Semua" || p.district === berandaFilterKec;
      const matchCat = berandaFilterCat === "Semua" || p.category === berandaFilterCat;
      const matchBranch = berandaFilterBranch === "Semua" || p.branchId === berandaFilterBranch;
      return matchLevel && matchKec && matchCat && matchBranch;
    });
  }, [participants, berandaFilterKec, berandaFilterCat, berandaFilterBranch, activeLevel]);

  // Ringkasan jumlah peserta per cabang untuk memudahkan pendaftar
  const branchSummary = useMemo(() => {
    const counts = {};
    participants.filter(p => (p.level || "kecamatan") === activeLevel && (berandaFilterKec === "Semua" || p.district === berandaFilterKec))
      .forEach(p => {
        counts[p.branchId] = (counts[p.branchId] || 0) + 1;
      });
    return counts;
  }, [participants, activeLevel, berandaFilterKec]);

  const scoringParticipants = useMemo(() => {
    return participants.filter(p => {
      const pLevel = p.level || "kecamatan";
      const matchLevel = pLevel === activeLevel;
      const matchKec = scoringFilterKec === "Semua" || p.district === scoringFilterKec;
      const matchLomba = scoringFilterLomba === "Semua" || p.branchId === scoringFilterLomba;
      const matchTab = p.category === filterCategory;
      return matchLevel && matchKec && matchLomba && matchTab;
    });
  }, [participants, scoringFilterKec, scoringFilterLomba, filterCategory, activeLevel]);

  const resultsData = useMemo(() => {
    const branchGroups = {};
    const relevantParticipants = participants.filter(p => {
      const matchLevel = (p.level || "kecamatan") === activeLevel;
      const matchKec = filterDistrictGlobal === "Semua" || p.district === filterDistrictGlobal;
      return matchLevel && matchKec;
    });

    relevantParticipants.forEach((p) => {
      const pScores = scores[p.id] || [];
      const total = pScores.reduce((a, b) => a + (Number(b) || 0), 0);
      const hasScore = pScores.some((s) => Number(s) > 0);
      if (!branchGroups[p.branchId]) branchGroups[p.branchId] = { PA: [], PI: [], Group: [] };
      if (p.type === "group") branchGroups[p.branchId].Group.push({ ...p, total, hasScore });
      else branchGroups[p.branchId][p.gender]?.push({ ...p, total, hasScore });
    });
    return branchGroups;
  }, [participants, scores, filterDistrictGlobal, activeLevel]);

  const notify = (msg, type = "success") => {
    setNotification({ msg: String(msg), type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handlePromoteWinners = async () => {
    if (!confirm("Tarik seluruh Juara 1 tingkat kecamatan ke kabupaten? Nilai lama akan dihapus.")) return;
    setLoading(true);
    const batch = writeBatch(db);
    let promotedCount = 0;

    KECAMATAN_LIST.forEach(kec => {
      ALL_BRANCHES.forEach(branch => {
        ["PA", "PI", "Group"].forEach(genderKey => {
          const competitors = participants.filter(p => 
            p.district === kec && 
            p.branchId === branch.id && 
            (genderKey === "Group" ? p.type === "group" : (p.gender === genderKey && p.type === "single")) &&
            (p.level || "kecamatan") === "kecamatan"
          ).map(p => ({ ...p, total: (scores[p.id] || []).reduce((a,b)=>a+b, 0) }));

          if (competitors.length > 0) {
            competitors.sort((a, b) => b.total - a.total);
            const winner = competitors[0];
            if (winner.total > 0) {
              batch.update(doc(db, "artifacts", appId, "public", "data", "participants", winner.id), { level: "kabupaten" });
              batch.delete(doc(db, "artifacts", appId, "public", "data", "scores", winner.id));
              promotedCount++;
            }
          }
        });
      });
    });
    await batch.commit();
    notify(`Berhasil menarik ${promotedCount} Juara 1 ke Kabupaten.`);
    setActiveLevel("kabupaten");
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const branchId = fd.get("branchId");
    const district = fd.get("district") || userDistrict;
    const institution = fd.get("institution");

    if (!branchId || !regCategory || !district) return notify("Lengkapi form!", "error");
    const branchInfo = ALL_BRANCHES.find(b => b.id === branchId);
    const activeMembers = regMembers.filter(m => m.name.trim() !== "");
    const pId = `FASI-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const newP = {
      name: regType === "single" ? activeMembers[0].name : `Regu ${institution}`,
      members: activeMembers.map(m => m.name),
      institution, district, gender: regType === "single" ? activeMembers[0].gender : "Group",
      category: regCategory, branchId, branchName: branchInfo.name, type: regType, createdAt: Date.now(),
      level: "kecamatan"
    };

    try {
      await setDoc(doc(db, "artifacts", appId, "public", "data", "participants", pId), newP);
      notify("Berhasil Terdaftar!");
      setSelectedForPrint({ id: pId, ...newP });
      setActiveTab("beranda");
    } catch (err) { notify("Gagal simpan", "error"); }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-28 font-sans">
      <style>{`@media print { .no-print { display: none !important; } .print-grid { display: grid !important; grid-template-columns: repeat(3, 1fr); gap: 10px; } } .no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      
      {notification && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-8 py-3 rounded-full text-white font-black text-[10px] uppercase shadow-2xl transition-all ${notification.type === "error" ? "bg-red-500" : "bg-emerald-600"}`}>
          {String(notification.msg)}
        </div>
      )}

      {!isBulkPrint && !selectedForPrint && (
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 p-5 shadow-sm">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-600 p-2.5 rounded-2xl shadow-lg shadow-emerald-200/50"><ShieldCheck className="text-white" size={24} /></div>
              <div>
                <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">FASI IX BATANG</h1>
                <div className="flex items-center gap-2 mt-1">
                   <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-widest">{currentRole.name}</span>
                   {userDistrict && <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">• {userDistrict}</span>}
                </div>
              </div>
            </div>
            <button onClick={() => setShowRoleSwitcher(true)} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-emerald-600 transition-all shadow-sm"><UserCircle size={24} /></button>
          </div>
        </header>
      )}

      {!isBulkPrint && !selectedForPrint && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-slate-200 p-2 flex gap-1 rounded-[32px] shadow-2xl z-50">
          {[
            { id: "beranda", label: "Beranda", icon: LayoutDashboard },
            { id: "pendaftaran", label: "Daftar", icon: UserPlus },
            { id: "hasil", label: "Hasil", icon: Trophy },
            { id: "penilaian", label: "Nilai", icon: ClipboardCheck },
            { id: "admin", label: "Admin", icon: Settings },
          ].filter(i => currentRole.id === "PUBLIK" ? i.id === "beranda" : currentRole.access.includes(i.id))
          .map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center px-6 md:px-8 py-2.5 rounded-[24px] transition-all ${activeTab === t.id ? "text-emerald-600 bg-emerald-50 shadow-inner" : "text-slate-300"}`}>
              <t.icon size={20} />
              <div className="text-[8px] font-black uppercase mt-1.5">{t.label}</div>
            </button>
          ))}
        </nav>
      )}

      <main className="max-w-4xl mx-auto p-5 md:p-8 space-y-12 no-print">
        {activeTab === "beranda" && (
          <div className="space-y-16 animate-in fade-in duration-700">
            <section className="bg-emerald-900 rounded-[60px] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl border border-emerald-800">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <Award size={64} className="mx-auto text-amber-400 mb-8 drop-shadow-lg" />
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic mb-4 leading-none">FESTIVAL ANAK SHOLEH INDONESIA</h2>
              <p className="text-emerald-100 max-w-lg mx-auto mb-10 text-sm md:text-base leading-relaxed opacity-80 italic">Cetak Generasi Qur'ani Menyongsong Indonesia Emas.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => setActiveTab("pendaftaran")} className="bg-white text-emerald-900 px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Daftar Sekarang</button>
                <button onClick={() => setActiveTab("hasil")} className="bg-emerald-800 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest border border-emerald-700 hover:bg-emerald-700 transition-all">Lihat Hasil</button>
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase text-slate-400">Total Santri</div>
                    <div className="text-3xl font-black text-slate-800 tracking-tighter">{participants.length}</div>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600"><Users size={24}/></div>
                </div>
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase text-slate-400">Finalis Kab.</div>
                    <div className="text-3xl font-black text-emerald-600 tracking-tighter">{participants.filter(p => p.level === "kabupaten").length}</div>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600"><Award size={24}/></div>
                </div>
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase text-slate-400">Unit LPQ</div>
                    <div className="text-3xl font-black text-slate-800 tracking-tighter">{new Set(participants.map(p => p.institution)).size}</div>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600"><Users2 size={24}/></div>
                </div>
            </section>

            {/* SEKSI MONITORING PENDAFTAR DENGAN FILTER TINGKAT USIA */}
            <section className="space-y-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200 shadow-inner"><BarChart3 size={24} className="text-slate-600"/></div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-800 leading-none italic">Monitoring Pendaftar</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Status Real-time Per Wilayah & Kategori</p>
                  </div>
                </div>
                
                <div className="flex bg-white p-2 rounded-3xl border border-slate-200 shadow-sm">
                  <select className="bg-transparent text-slate-800 px-6 py-3 rounded-2xl border-none outline-none font-black text-[10px] uppercase cursor-pointer" value={activeLevel} onChange={(e) => setActiveLevel(e.target.value)}>
                    <option value="kecamatan">Seleksi Kec.</option>
                    <option value="kabupaten">Final Kab.</option>
                  </select>
                </div>
              </div>

              {/* FILTER ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-6 rounded-[40px] border border-slate-200 shadow-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 ml-2 text-slate-400">
                    <MapPin size={12}/>
                    <p className="text-[9px] font-black uppercase tracking-widest">Wilayah Kecamatan</p>
                  </div>
                  <select className="w-full p-4 bg-slate-50 rounded-2xl font-black text-[11px] uppercase border-none outline-none focus:ring-4 focus:ring-emerald-100 shadow-inner transition-all" value={berandaFilterKec} onChange={(e) => setBerandaFilterKec(e.target.value)}>
                    <option value="Semua">Seluruh Kecamatan</option>
                    {KECAMATAN_LIST.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 ml-2 text-slate-400">
                    <ListFilter size={12}/>
                    <p className="text-[9px] font-black uppercase tracking-widest">Tingkat Usia</p>
                  </div>
                  <select className="w-full p-4 bg-slate-50 rounded-2xl font-black text-[11px] uppercase border-none outline-none focus:ring-4 focus:ring-emerald-100 shadow-inner transition-all" value={berandaFilterCat} onChange={(e) => {
                    setBerandaFilterCat(e.target.value);
                    setBerandaFilterBranch("Semua");
                  }}>
                    <option value="Semua">Semua Kategori</option>
                    <option value="TKQ">TKQ (Taman Kanak-kanak Al-Qur'an)</option>
                    <option value="TPQ">TPQ (Taman Pendidikan Al-Qur'an)</option>
                    <option value="TQA">TQA (Ta'limul Qur'an Lil Aulad)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 ml-2 text-slate-400">
                    <Medal size={12}/>
                    <p className="text-[9px] font-black uppercase tracking-widest">Cabang Lomba</p>
                  </div>
                  <select className="w-full p-4 bg-slate-50 rounded-2xl font-black text-[11px] uppercase border-none outline-none focus:ring-4 focus:ring-emerald-100 shadow-inner transition-all" value={berandaFilterBranch} onChange={(e) => setBerandaFilterBranch(e.target.value)}>
                    <option value="Semua">Semua Cabang Lomba</option>
                    {berandaFilterCat !== "Semua" ? 
                      BRANCH_DATA[berandaFilterCat].map(b => <option key={b.id} value={b.id}>{b.name}</option>) : 
                      ALL_BRANCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)
                    }
                  </select>
                </div>
              </div>

              {/* DASHBOARD RINGKASAN KUOTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(berandaFilterCat === "Semua" ? ["TKQ", "TPQ", "TQA"] : [berandaFilterCat]).map(cat => (
                  <div key={cat} className="space-y-4">
                    <div className="bg-slate-900 text-white px-6 py-2 rounded-full font-black text-[9px] uppercase tracking-[0.2em] inline-block shadow-lg italic">{cat}</div>
                    <div className="space-y-3">
                      {BRANCH_DATA[cat].filter(b => berandaFilterBranch === "Semua" || b.id === berandaFilterBranch).map(b => (
                        <div key={b.id} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center justify-between hover:scale-[1.02] transition-transform">
                          <div className="min-w-0 pr-4">
                            <p className="font-black text-[11px] uppercase text-slate-800 leading-none mb-2 truncate">{b.name}</p>
                            <div className="flex gap-2">
                              <span className="text-[8px] font-bold text-slate-400 uppercase leading-none">Pendaftar</span>
                            </div>
                          </div>
                          <div className="bg-emerald-50 text-emerald-700 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner italic border border-emerald-100">
                            {branchSummary[b.id] || 0}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* TABLE MONITORING */}
              <div className="bg-white rounded-[48px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
                <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <h4 className="font-black text-xs uppercase text-slate-800 leading-none">Daftar Santri Terdaftar ({monitoredParticipants.length})</h4>
                  <div className="text-[9px] font-bold text-slate-400 uppercase italic">Filter: {berandaFilterKec} • {berandaFilterCat}</div>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left">
                    <thead className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="p-8">Nama Santri</th>
                        <th className="p-8">Unit Lembaga</th>
                        <th className="p-8">Cabang Lomba</th>
                        <th className="p-8">Gender</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {monitoredParticipants.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-20 text-center text-slate-300">
                            <Info size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="font-black text-[10px] uppercase tracking-widest">Belum ada data pendaftar yang sesuai</p>
                          </td>
                        </tr>
                      ) : monitoredParticipants.slice(0, 50).map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="p-8">
                            <div className="font-black text-base text-slate-800 uppercase leading-none mb-2 group-hover:text-emerald-700 transition-colors">{p.name}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase italic leading-none">Kec. {p.district}</div>
                          </td>
                          <td className="p-8 font-black text-[11px] uppercase text-slate-500 italic">{p.institution}</td>
                          <td className="p-8">
                            <div className="font-bold text-[11px] text-slate-600 uppercase mb-1 leading-none">{p.branchName}</div>
                            <span className="text-[8px] font-black text-white bg-emerald-600 px-2 py-0.5 rounded uppercase leading-none">{p.category}</span>
                          </td>
                          <td className="p-8">
                             <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase leading-none ${p.gender === 'PA' ? 'bg-blue-50 text-blue-600' : p.gender === 'PI' ? 'bg-pink-50 text-pink-600' : 'bg-slate-100 text-slate-400'}`}>
                               {p.gender === 'PA' ? 'Putra' : p.gender === 'PI' ? 'Putri' : 'Regu'}
                             </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "pendaftaran" && (
          <div className="bg-white p-10 rounded-[60px] shadow-sm border border-slate-200 animate-in slide-in-from-right duration-500">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-10 flex items-center gap-4 text-slate-800">
               <div className="bg-emerald-100 p-3 rounded-2xl"><UserPlus className="text-emerald-600" /></div> Pendaftaran Santri Baru
            </h2>
            <form onSubmit={handleRegister} className="space-y-8 max-w-2xl mx-auto">
              <div className="grid grid-cols-2 gap-3 p-2 bg-slate-100 rounded-[32px]">
                <button type="button" onClick={() => { setRegType("single"); setRegMembers([{ name: "", birthDate: "", gender: "PA", age: null }]); setRegCategory(""); }} className={`p-4 rounded-[26px] font-black text-[10px] uppercase transition-all ${regType === "single" ? "bg-white text-emerald-600 shadow-md" : "text-slate-400"}`}>PESERTA TUNGGAL</button>
                <button type="button" onClick={() => { setRegType("group"); setRegMembers(Array.from({ length: 3 }, () => ({ name: "", birthDate: "", gender: "PA", age: null }))); setRegCategory(""); }} className={`p-4 rounded-[26px] font-black text-[10px] uppercase transition-all ${regType === "group" ? "bg-white text-emerald-600 shadow-md" : "text-slate-400"}`}>PESERTA REGU</button>
              </div>

              {regMembers.map((m, i) => (
                <div key={i} className="p-8 bg-slate-50 rounded-[40px] border border-slate-200 space-y-6 shadow-inner animate-in fade-in duration-300">
                  <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 leading-none">Data Santri {regType === "group" && i+1}</div>
                  <input placeholder="Nama Lengkap Santri" className="w-full p-5 rounded-2xl border-none font-black text-sm outline-none shadow-sm focus:ring-4 focus:ring-emerald-100" value={m.name} onChange={(e) => { const n = [...regMembers]; n[i].name = e.target.value; setRegMembers(n); }} required={i === 0 || (regType === "group" && i < 2)} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input type="date" className="p-5 rounded-2xl border-none text-[11px] font-black bg-white shadow-sm outline-none" value={m.birthDate} onChange={(e) => {
                      const d = e.target.value;
                      const a = calculateAgeAtRef(d);
                      const n = [...regMembers]; n[i].birthDate = d; n[i].age = a; setRegMembers(n);
                      const valid = n.filter(x => x.birthDate);
                      if (valid.length > 0) setAllowedCategories(checkCategoryEligibility(valid.sort((a,b)=>b.age?.totalDays - a.age?.totalDays)[0].age));
                    }} required={i === 0 || (regType === "group" && i < 2)} />
                    <select className="p-5 rounded-2xl border-none text-[11px] font-black bg-white shadow-sm outline-none" value={m.gender} onChange={(e) => { const n = [...regMembers]; n[i].gender = e.target.value; setRegMembers(n); }}>
                      <option value="PA">Putra (PA)</option>
                      <option value="PI">Putri (PI)</option>
                    </select>
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-2 gap-4">
                <select name="district" className="p-5 bg-slate-100 rounded-2xl font-black text-xs border-none outline-none appearance-none cursor-pointer" defaultValue={userDistrict || ""}>
                  <option value="" disabled>Pilih Kecamatan</option>
                  {KECAMATAN_LIST.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
                <input name="institution" placeholder="Unit Lembaga LPQ" className="p-5 bg-slate-100 rounded-2xl font-black text-sm border-none outline-none shadow-sm" required />
              </div>

              {allowedCategories.length > 0 && (
                <div className="space-y-6 pt-6 border-t border-slate-100">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {allowedCategories[0] === "Melebihi Batas" ? (
                        <div className="bg-red-50 text-red-500 p-6 rounded-3xl font-black text-[11px] uppercase border border-red-100 flex items-center gap-3">
                            <ShieldAlert size={18}/> Usia santri melebihi batas ketentuan FASI (Max 15 Tahun)
                        </div>
                    ) : (
                        allowedCategories.map(c => <button key={c} type="button" onClick={() => setRegCategory(c)} className={`px-10 py-3 rounded-2xl text-[10px] font-black shadow-sm border-2 transition-all ${regCategory === c ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-400 border-slate-100"}`}>{c}</button>)
                    )}
                  </div>
                  {regCategory && regCategory !== "Melebihi Batas" && (
                    <select name="branchId" className="w-full p-6 bg-emerald-50 text-emerald-900 rounded-[32px] font-black text-xs border-none outline-none uppercase shadow-inner cursor-pointer" required>
                      <option value="">Pilih Cabang Lomba</option>
                      {BRANCH_DATA[regCategory]?.filter(b => b.type === regType).map(b => <option key={b.id} value={b.id}>{b.name}</option>) || []}
                    </select>
                  )}
                </div>
              )}
              <button className="w-full bg-emerald-600 text-white font-black py-6 rounded-[40px] shadow-2xl uppercase text-xs tracking-widest hover:scale-[1.02] transition-all"><Save size={18} className="inline mr-2"/> Simpan Pendaftaran</button>
            </form>
          </div>
        )}

        {activeTab === "penilaian" && (
          <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
             {/* Banner Lock untuk Admin */}
             {currentRole.id !== "JURI" && (
               <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-[40px] flex items-center gap-4 text-amber-800 shadow-sm animate-in fade-in">
                 <div className="bg-amber-500 text-white p-3 rounded-2xl"><Lock size={20}/></div>
                 <div>
                    <p className="font-black text-xs uppercase italic tracking-widest leading-none">Mode Baca-Saja (Terkunci)</p>
                    <p className="text-[10px] font-bold mt-1 opacity-70">Hanya Juri yang memiliki akses untuk memberikan atau mengubah nilai.</p>
                 </div>
               </div>
             )}

             <div className="bg-white p-8 rounded-[48px] border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-600 text-white p-3 rounded-2xl shadow-lg shadow-emerald-200"><ClipboardCheck size={28}/></div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter leading-none italic">Lembar Penilaian</h2>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none italic">
                        {currentRole.id === "JURI" ? `Kec. ${userDistrict} • ${ALL_BRANCHES.find(b => b.id === userBranch)?.name || 'Juri'}` : `Admin Panel • ${currentRole.name}`}
                        </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {/* Toggle Mode Penilaian */}
                  <div className="bg-slate-100 p-1.5 rounded-[24px] flex items-center shadow-inner">
                    <button onClick={() => setScoringMode("rinci")} className={`px-6 py-2 rounded-[18px] font-black text-[9px] uppercase transition-all flex items-center gap-2 ${scoringMode === 'rinci' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>
                      <BarChart3 size={14}/> Rinci
                    </button>
                    <button onClick={() => setScoringMode("total")} className={`px-6 py-2 rounded-[18px] font-black text-[9px] uppercase transition-all flex items-center gap-2 ${scoringMode === 'total' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>
                      <Type size={14}/> Total
                    </button>
                  </div>
                  
                  <div className="flex bg-slate-100 p-1.5 rounded-[24px]">
                      {["TKQ", "TPQ", "TQA"].map(cat => (
                          <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-8 py-2.5 rounded-[18px] font-black text-[10px] uppercase transition-all ${filterCategory === cat ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>{cat}</button>
                      ))}
                  </div>
                </div>
             </div>

             <div className="space-y-6">
               {ALL_BRANCHES.filter(b => currentRole.id === "JURI" ? b.id === userBranch : scoringFilterLomba === "Semua" || b.id === scoringFilterLomba).map(branch => {
                 const list = scoringParticipants.filter(p => p.branchId === branch.id);
                 if (list.length === 0 && currentRole.id !== "JURI") return null;

                 return (
                   <div key={branch.id} className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm animate-in fade-in duration-500">
                     <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <div className="font-black text-xs uppercase text-slate-800 leading-none italic">{branch.name}</div>
                        <div className="text-[10px] font-black text-emerald-600 uppercase leading-none italic">{list.length} Santri • Mode: {scoringMode === 'rinci' ? 'Per Kriteria' : 'Skor Akhir'}</div>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                            <tr>
                              <th className="p-8">Nama Santri</th>
                              {scoringMode === 'rinci' ? (
                                branch.criteria.map(c => <th key={c} className="p-6 text-center">{c}</th>)
                              ) : (
                                <th className="p-6 text-center">Masukkan Nilai Akhir</th>
                              )}
                              <th className="p-8 text-center text-emerald-600 font-black italic">Skor Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {list.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="p-20 text-center text-slate-300">
                                        <div className="flex flex-col items-center gap-4">
                                            <Search size={48} />
                                            <p className="font-black text-xs uppercase tracking-widest italic">Santri belum terdaftar di cabang ini</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : list.map(p => {
                              const pScores = scores[p.id] || Array(branch.criteria.length).fill(0);
                              const total = pScores.reduce((a,b)=>a+b, 0);
                              
                              return (
                                <tr key={p.id} className="hover:bg-emerald-50/50 transition-colors">
                                  <td className="p-8">
                                    <div className="font-black text-sm text-slate-800 uppercase leading-none mb-2">{p.name}</div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded text-white ${p.gender === 'PA' ? 'bg-blue-500' : p.gender === 'PI' ? 'bg-pink-500' : 'bg-slate-400'}`}>{p.gender}</span>
                                        <div className="text-[9px] font-bold text-slate-400 uppercase leading-none truncate max-w-[120px] italic">{p.institution}</div>
                                    </div>
                                  </td>
                                  
                                  {scoringMode === 'rinci' ? (
                                    branch.criteria.map((c, idx) => (
                                      <td key={idx} className="p-6 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                          <input 
                                            type="number" 
                                            disabled={currentRole.id !== "JURI"}
                                            className={`w-16 p-3 rounded-xl text-center font-black text-sm outline-none shadow-sm transition-all ${currentRole.id === "JURI" ? "bg-white border border-slate-200 focus:ring-4 focus:ring-emerald-100" : "bg-slate-100 border-transparent text-slate-400 cursor-not-allowed"}`}
                                            value={pScores[idx] || ""} 
                                            onChange={async (e) => {
                                              const v = Math.min(branch.max[idx], Math.max(0, parseInt(e.target.value) || 0));
                                              const n = [...pScores]; n[idx] = v;
                                              await setDoc(doc(db, "artifacts", appId, "public", "data", "scores", p.id), { values: n });
                                            }} 
                                          />
                                          <span className="text-[8px] font-black text-slate-300 uppercase">Max {branch.max[idx]}</span>
                                        </div>
                                      </td>
                                    ))
                                  ) : (
                                    <td className="p-6 text-center">
                                      <div className="flex flex-col items-center gap-1">
                                        <input 
                                          type="number" 
                                          disabled={currentRole.id !== "JURI"}
                                          className={`w-24 p-4 rounded-2xl text-center font-black text-xl outline-none shadow-sm transition-all ${currentRole.id === "JURI" ? "bg-emerald-50 border-2 border-emerald-100 focus:ring-4 focus:ring-emerald-200" : "bg-slate-100 border-transparent text-slate-400 cursor-not-allowed"}`}
                                          placeholder="0"
                                          value={total || ""} 
                                          onChange={async (e) => {
                                            const v = Math.max(0, parseInt(e.target.value) || 0);
                                            const n = Array(branch.criteria.length).fill(0);
                                            n[0] = v;
                                            await setDoc(doc(db, "artifacts", appId, "public", "data", "scores", p.id), { values: n });
                                          }} 
                                        />
                                        <span className="text-[9px] font-bold text-emerald-400 uppercase italic">Input Langsung</span>
                                      </div>
                                    </td>
                                  )}
                                  
                                  <td className="p-8 text-center font-black text-emerald-700 text-3xl tracking-tighter leading-none italic">{total}</td>
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

        {activeTab === "hasil" && (
          <div className="space-y-12 animate-in slide-in-from-left duration-500 pb-20">
             <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="bg-amber-100 text-amber-600 p-3 rounded-2xl shadow-inner border border-white"><Trophy size={28}/></div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter leading-none text-slate-800 italic">Rekapitulasi Juara</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Klasemen FASI IX Kabupaten Batang 2026</p>
                  </div>
                </div>
                
                {/* FILTER BOX UNIT */}
                <div className="flex flex-wrap gap-3">
                    <div className="bg-white p-2 rounded-3xl flex items-center gap-2 shadow-sm border border-slate-200">
                        <MapPin size={16} className="text-emerald-600 ml-3" />
                        <select 
                            className="bg-transparent text-slate-800 px-4 py-3 rounded-2xl border-none outline-none font-black text-[10px] uppercase cursor-pointer min-w-[160px]" 
                            value={filterDistrictGlobal} 
                            onChange={(e) => setFilterDistrictGlobal(e.target.value)}
                        >
                            <option value="Semua">Seluruh Wilayah</option>
                            {KECAMATAN_LIST.map(k => <option key={k} value={k}>Kec. {k}</option>)}
                        </select>
                    </div>

                    <div className="bg-slate-900 p-2 rounded-3xl flex items-center gap-2 shadow-xl border border-slate-700">
                        <select className="bg-transparent text-white px-6 py-3 rounded-2xl border-none outline-none font-black text-[10px] uppercase cursor-pointer" value={activeLevel} onChange={(e) => setActiveLevel(e.target.value)}>
                        <option value="kecamatan">🚩 Seleksi Kec.</option>
                        <option value="kabupaten">🏆 Final Kab.</option>
                        </select>
                    </div>
                </div>
             </div>

             <div className="space-y-16">
                {Object.keys(BRANCH_DATA).map(cat => {
                   // Cek apakah ada data untuk kategori ini
                   const hasDataInCategory = BRANCH_DATA[cat].some(branch => {
                     const w = resultsData[branch.id];
                     return w && ["PA", "PI", "Group"].some(g => w[g]?.length > 0);
                   });

                   if (!hasDataInCategory) return null;

                   return (
                    <div key={cat} className="space-y-8">
                       <div className="flex items-center gap-4">
                          <span className="h-px flex-1 bg-slate-200"></span>
                          <div className="bg-slate-900 text-white px-10 py-2 rounded-full font-black text-[11px] uppercase tracking-widest leading-none italic">{cat}</div>
                          <span className="h-px flex-1 bg-slate-200"></span>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {BRANCH_DATA[cat].map(branch => {
                            const w = resultsData[branch.id];
                            if (!w) return null;
                            const has = ["PA", "PI", "Group"].some(g => w[g]?.length > 0);
                            if (!has) return null;
                            return (
                              <div key={branch.id} className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-all">
                                <div className="p-8 bg-slate-50 border-b border-slate-100 font-black text-sm uppercase text-slate-800 italic leading-none">{branch.name}</div>
                                <div className="p-8 space-y-6">
                                   {["PA", "PI", "Group"].map(g => w[g]?.length > 0 && (
                                     <div key={g} className="space-y-3">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none italic">Kategori {g}</p>
                                        {w[g].sort((a,b)=>b.total - a.total).slice(0, 3).map((win, i) => (
                                          <div key={win.id} className={`flex items-center gap-4 p-4 rounded-3xl border-2 transition-all ${i === 0 ? 'bg-emerald-50 border-emerald-100 shadow-sm' : 'bg-slate-50 border-transparent opacity-80'}`}>
                                             <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-amber-400 text-white shadow-md' : 'bg-slate-200 text-slate-500'}`}>{i+1}</div>
                                             <div className="flex-1 min-w-0">
                                                <p className="font-black text-xs uppercase truncate text-slate-800 leading-none mb-1">{win.name}</p>
                                                <p className="text-[9px] font-bold text-emerald-600 uppercase truncate leading-none">Kec. {win.district} • {win.institution}</p>
                                             </div>
                                             <p className="font-black text-lg text-emerald-700 tracking-tighter leading-none italic">{win.total}</p>
                                          </div>
                                        ))}
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

                {/* Empty State untuk Hasil */}
                {Object.keys(resultsData).length === 0 && (
                  <div className="p-20 text-center bg-white rounded-[48px] border border-dashed border-slate-200">
                    <Trophy size={64} className="mx-auto text-slate-200 mb-6" />
                    <p className="font-black text-xs uppercase text-slate-400 tracking-widest italic leading-none">Belum ada skor yang masuk untuk kriteria ini</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {activeTab === "admin" && (
          <div className="space-y-12 animate-in slide-in-from-bottom duration-500 pb-10">
            {currentRole.id === "ADMIN_KAB" && (
              <div className="bg-amber-50 p-10 rounded-[48px] border-2 border-amber-200 shadow-sm space-y-8 animate-in zoom-in duration-500">
                <div className="flex items-center gap-6">
                   <div className="bg-amber-500 text-white p-4 rounded-3xl shadow-lg shadow-amber-200"><ArrowUpCircle size={32}/></div>
                   <div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter text-amber-900 leading-none italic">Tarik Finalis Kabupaten</h3>
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1 italic">Proses Juara 1 Setiap Kecamatan ke Final</p>
                   </div>
                </div>
                <button onClick={handlePromoteWinners} className="bg-amber-600 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all"><RefreshCw size={18}/> Jalankan Proses Sinkronisasi Finalis</button>
              </div>
            )}

            <div className="bg-white rounded-[48px] border border-slate-200 overflow-hidden shadow-sm">
               <div className="p-10 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <h3 className="font-black text-2xl uppercase tracking-tighter text-slate-800 leading-none italic">Database Santri</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">{activeLevel === 'kabupaten' ? '🏆 Finalis Tingkat Kabupaten' : '🚩 Peserta Seleksi Kecamatan'}</p>
                  </div>
                  <div className="flex gap-4">
                     <button onClick={() => setIsBulkPrint(true)} className="bg-emerald-600 text-white px-8 py-4 rounded-full font-black text-[10px] uppercase shadow-lg shadow-emerald-200 flex items-center gap-2 hover:bg-emerald-700 transition-all"><Printer size={16}/> Cetak Masal</button>
                  </div>
               </div>
               <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <tr><th className="p-8">Profil Santri</th><th className="p-8">Unit Lembaga</th><th className="p-8 text-center">Aksi</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {participants.filter(p => (!userDistrict || p.district === userDistrict) && (p.level || "kecamatan") === activeLevel).map(p => (
                         <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                           <td className="p-8">
                              <div className="font-black text-lg text-slate-800 uppercase leading-none mb-3 group-hover:text-emerald-700 transition-all italic">{p.name}</div>
                              <div className="flex gap-2">
                                <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full uppercase leading-none italic">{p.category}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase leading-none self-center italic">{p.branchName}</span>
                              </div>
                           </td>
                           <td className="p-8"><span className="text-[10px] font-black text-slate-500 uppercase leading-none italic">{p.institution}</span></td>
                           <td className="p-8">
                              <div className="flex justify-center gap-3">
                                 <button onClick={() => setSelectedForPrint(p)} className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><Printer size={18}/></button>
                                 <button onClick={async () => { if(confirm(`Hapus data ${p.name}?`)) { await deleteDoc(doc(db, "artifacts", appId, "public", "data", "participants", p.id)); notify("Data Dihapus"); } }} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={18}/></button>
                              </div>
                           </td>
                         </tr>
                       ))}
                    </tbody>
                  </table>
               </div>
            </div>

            {(currentRole.id === "ADMIN_KEC" || currentRole.id === "ADMIN_KAB") && (
              <div className="bg-white rounded-[48px] border border-slate-200 overflow-hidden shadow-2xl animate-in zoom-in duration-500">
                 <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter italic italic">Pengaturan Password Juri Lomba</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Wilayah Kecamatan: {userDistrict || "Seluruh Kabupaten"}</p>
                    </div>
                    <KeyRound size={32} className="opacity-30" />
                 </div>
                 <div className="p-10 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {ALL_BRANCHES.map(branch => {
                         const pwdKey = `JURI_PWD_${userDistrict || 'KAB'}_${branch.id}`;
                         return (
                           <div key={branch.id} className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 space-y-3 hover:bg-white transition-colors">
                              <div className="text-[9px] font-black text-slate-400 uppercase leading-none truncate italic">{branch.name}</div>
                              <div className="relative">
                                <input 
                                  type="text" 
                                  placeholder="Sandi"
                                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black text-xs outline-none focus:ring-4 focus:ring-emerald-100 shadow-sm italic"
                                  value={passwords[pwdKey] || ""}
                                  onChange={(e) => {
                                    const next = { ...passwords };
                                    next[pwdKey] = e.target.value;
                                    setPasswords(next);
                                  }}
                                />
                                <button 
                                  onClick={async () => {
                                    await setDoc(doc(db, "artifacts", appId, "public", "data", "config", "security"), passwords);
                                    notify(`Sandi juri disimpan!`);
                                  }}
                                  className="absolute right-2 top-2 p-2 bg-emerald-600 text-white rounded-xl shadow-md hover:bg-emerald-700 active:scale-90 transition-all"
                                >
                                  <Save size={14}/>
                                </button>
                              </div>
                           </div>
                         );
                       })}
                    </div>
                 </div>
              </div>
            )}
          </div>
        )}
      </main>

      {showRoleSwitcher && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[60px] p-12 shadow-2xl animate-in zoom-in duration-300 relative border border-white/20">
             {currentRole.id !== "PUBLIK" && (
               <button onClick={() => { setCurrentRole(ROLES.PUBLIK); setUserDistrict(null); setUserBranch(null); setShowRoleSwitcher(false); setActiveTab("beranda"); }} className="absolute top-8 right-8 text-red-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 italic"><LogOut size={16}/> Keluar</button>
             )}
             <h3 className="font-black text-base uppercase text-slate-400 tracking-[0.2em] mb-10 text-center italic leading-none">Otoritas Akses Sistem</h3>
             <div className="space-y-4">
                <button onClick={() => { setCurrentRole(ROLES.PUBLIK); setUserDistrict(null); setShowRoleSwitcher(false); setActiveTab("beranda"); }} className="w-full p-8 rounded-[40px] bg-slate-50 border-4 border-transparent hover:border-emerald-500 hover:bg-emerald-50 text-left transition-all flex justify-between items-center group shadow-sm">
                   <div><div className="font-black text-xl uppercase group-hover:text-emerald-700 italic">Publik / Umum</div></div>
                   <Unlock size={24} className="text-emerald-500" />
                </button>
                <button onClick={() => setAuthModal({ id: "ADMIN_KEC", step: 1 })} className="w-full p-8 rounded-[40px] bg-slate-50 border-4 border-transparent hover:border-emerald-500 hover:bg-emerald-50 text-left transition-all flex justify-between items-center group shadow-sm">
                   <div><div className="font-black text-xl uppercase group-hover:text-emerald-700 italic">Admin Kecamatan</div></div>
                   <Lock size={24} className="text-slate-300" />
                </button>
                <button onClick={() => setAuthModal({ id: "JURI", step: 1 })} className="w-full p-8 rounded-[40px] bg-white border-4 border-slate-200 hover:border-emerald-500 text-left transition-all flex justify-between items-center group shadow-sm">
                   <div><div className="font-black text-xl uppercase group-hover:text-emerald-700 italic">Juri Per Lomba</div></div>
                   <Gavel size={24} className="text-slate-300" />
                </button>
                <button onClick={() => setAuthModal({ id: "ADMIN_KAB", step: 2 })} className="w-full p-8 rounded-[40px] bg-slate-900 border-4 border-transparent hover:border-emerald-500 text-left transition-all flex justify-between items-center group shadow-sm">
                   <div><div className="font-black text-xl uppercase text-white italic">Admin Kabupaten</div></div>
                   <ShieldCheck size={24} className="text-emerald-500" />
                </button>
             </div>
             <button onClick={() => setShowRoleSwitcher(false)} className="w-full mt-10 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-colors italic leading-none">Tutup Menu</button>
          </div>
        </div>
      )}

      {authModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[110] flex items-center justify-center p-6">
          <div className="bg-white p-12 rounded-[64px] w-full max-w-sm text-center shadow-2xl border border-slate-100">
             {authModal.step === 1 ? (
               <>
                 <h3 className="font-black text-2xl uppercase tracking-tighter mb-8 text-slate-800 leading-none italic">Pilih Kecamatan</h3>
                 <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2 no-scrollbar mb-8">
                   {KECAMATAN_LIST.map(k => (
                     <button key={k} onClick={() => setAuthModal({...authModal, step: authModal.id === "JURI" ? 1.5 : 2, district: k})} className="p-4 bg-slate-50 rounded-2xl font-black text-[10px] uppercase hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-slate-100">{k}</button>
                   ))}
                 </div>
                 <button onClick={() => setAuthModal(null)} className="text-slate-400 font-black text-xs uppercase tracking-widest leading-none italic">Batalkan</button>
               </>
             ) : authModal.step === 1.5 ? (
               <>
                 <h3 className="font-black text-2xl uppercase tracking-tighter mb-8 text-slate-800 italic leading-none italic">Cabang Lomba</h3>
                 <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2 no-scrollbar mb-8">
                   {ALL_BRANCHES.map(b => (
                     <button key={b.id} onClick={() => setAuthModal({...authModal, step: 2, branch: b.id})} className="p-4 bg-slate-50 rounded-2xl font-black text-[10px] uppercase hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-slate-100 italic">{b.name}</button>
                   ))}
                 </div>
                 <button onClick={() => setAuthModal({...authModal, step: 1})} className="text-slate-400 font-black text-[9px] uppercase tracking-widest leading-none underline italic">Kembali Pilih Kecamatan</button>
               </>
             ) : (
               <>
                 <div className="bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"><KeyRound className="text-emerald-600" size={32} /></div>
                 <h3 className="font-black text-xl uppercase tracking-tighter mb-2 text-slate-800 leading-none italic italic">Verifikasi Sandi</h3>
                 <p className="text-[9px] font-black text-slate-400 uppercase mb-8 leading-none italic italic">
                     Kec. {authModal.district} {authModal.branch && `• ${ALL_BRANCHES.find(b => b.id === authModal.branch)?.name}`}
                 </p>
                 <input type="password" autoFocus className="w-full p-6 bg-slate-100 rounded-[36px] font-black text-center text-3xl mb-8 outline-none focus:ring-8 focus:ring-emerald-100 shadow-inner border border-slate-200" value={authModal.input || ""} onChange={(e) => setAuthModal({ ...authModal, input: e.target.value })} />
                 <div className="flex gap-4">
                    <button onClick={() => { 
                      let match = false;
                      if (authModal.id === "ADMIN_KAB") match = (authModal.input === (passwords.ADMIN_KAB_PWD || "admin123"));
                      else if (authModal.id === "ADMIN_KEC") match = (authModal.input === (passwords[`DIST_PWD_${authModal.district}`] || "kecamatan123"));
                      else if (authModal.id === "JURI") match = (authModal.input === (passwords[`JURI_PWD_${authModal.district}_${authModal.branch}`] || "juri123"));
                      
                      if (match) {
                        setCurrentRole(ROLES[authModal.id]);
                        setUserDistrict(authModal.district || null);
                        setUserBranch(authModal.branch || null);
                        setAuthModal(null);
                        setShowRoleSwitcher(false);
                        setActiveTab(authModal.id === "JURI" ? "penilaian" : "beranda");
                        notify("Akses Berhasil!");
                      } else notify("Sandi Salah!", "error");
                    }} className="flex-1 bg-emerald-600 text-white font-black py-6 rounded-[32px] text-xs shadow-2xl hover:bg-emerald-700 transition-all active:scale-95 leading-none italic">MASUK</button>
                    <button onClick={() => setAuthModal(null)} className="flex-1 bg-slate-100 text-slate-400 font-black py-6 rounded-[32px] text-xs leading-none italic">BATAL</button>
                 </div>
               </>
             )}
          </div>
        </div>
      )}

      {selectedForPrint && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-[120] flex items-center justify-center p-6 print:bg-white print:p-0 overflow-y-auto">
          <div className="bg-white p-10 rounded-[60px] max-w-sm w-full text-center shadow-2xl print:hidden animate-in zoom-in border border-white/20 my-auto">
            <h4 className="text-xl font-black text-slate-800 uppercase mb-8 italic tracking-tighter leading-none italic">Preview Kartu Santri</h4>
            <div className="flex flex-col gap-8 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar mb-8">
               {selectedForPrint.members && selectedForPrint.members.length > 0 ? (
                 selectedForPrint.members.map((m, idx) => <IDCard key={idx} p={{...selectedForPrint, name: m, id: `${selectedForPrint.id}-${idx+1}`}} />)
               ) : <IDCard p={selectedForPrint} />}
            </div>
            <div className="flex gap-4">
               <button onClick={() => window.print()} className="flex-1 bg-emerald-600 text-white font-black py-5 rounded-[32px] text-xs shadow-xl active:scale-95 shadow-emerald-200/50 transition-all italic">PRINT SEKARANG</button>
               <button onClick={() => setSelectedForPrint(null)} className="flex-1 bg-slate-100 text-slate-400 font-black py-5 rounded-[32px] italic">TUTUP</button>
            </div>
          </div>
          <div className="hidden print:block print:w-full">
            <div className="flex flex-col gap-10">
               {selectedForPrint.members && selectedForPrint.members.length > 0 ? (
                 selectedForPrint.members.map((m, idx) => <IDCard key={idx} p={{...selectedForPrint, name: m, id: `${selectedForPrint.id}-${idx+1}`}} />)
               ) : <IDCard p={selectedForPrint} />}
            </div>
          </div>
        </div>
      )}

      {isBulkPrint && (
        <div className="absolute top-0 left-0 right-0 min-h-screen bg-white z-[200] p-12 print:p-0">
          <div className="flex justify-between items-center mb-12 no-print bg-slate-900 text-white p-10 rounded-[60px] shadow-2xl border border-slate-800">
            <div>
              <h2 className="text-4xl font-black uppercase tracking-tighter leading-none italic italic italic">Cetak Kartu Masal</h2>
              <p className="text-[10px] font-black uppercase text-emerald-400 mt-3 tracking-widest italic leading-none italic">Kecamatan: {userDistrict || 'Seluruh Kabupaten'}</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => window.print()} className="bg-emerald-600 text-white px-12 py-5 rounded-full font-black shadow-lg shadow-emerald-200/50 hover:bg-emerald-700 active:scale-95 transition-all italic">KONFIRMASI PRINT</button>
              <button onClick={() => setIsBulkPrint(false)} className="bg-white/10 text-white px-12 py-5 rounded-full font-black hover:bg-white/20 transition-all italic">BATAL</button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid-cols-3 print:gap-4">
            {participants
              .filter(p => (!userDistrict || p.district === userDistrict) && (p.level || "kecamatan") === activeLevel)
              .flatMap((p) => {
                if (p.members && p.members.length > 0) {
                  return p.members.map((m, idx) => ({ ...p, name: m, id: `${p.id}-${idx+1}` }));
                }
                return [p];
              })
              .map((dp, i) => <IDCard key={i} p={dp} />)}
          </div>
        </div>
      )}
    </div>
  );
}
