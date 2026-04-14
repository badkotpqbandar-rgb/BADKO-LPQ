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
  ChevronDown,
  Gavel,
  BarChart3,
  ListFilter,
  Edit3,
  Type,
  Maximize,
  Minimize,
  Power,
  PowerOff,
  UploadCloud,
  Image as ImageIcon
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

// --- KOMPONEN ID CARD (Desain NATIVE SCALED untuk 6.5cm x 10.2cm) ---
// Ukuran inner diperbesar 2x lipat (491px x 771px) untuk menghindari limit font kecil browser
export const IDCard = ({ p, memberName, memberId, logo }) => {
  const nama = String(memberName || p?.name || "NAMA PESERTA");
  const lembaga = String(p?.institution || "ASAL LEMBAGA");
  const cabangLomba = String(p?.branchName || "CABANG LOMBA");
  const tingkatUsia = String(p?.category || "TPQ/TKQ/TQA");
  const idPeserta = String(memberId || p?.id || "0000");
  const kecamatan = String(p?.district || "Bandar"); 
  const level = String(p?.level || "kecamatan");

  const isKabupaten = level === "kabupaten";
  const instansiWilayah = isKabupaten ? "Kabupaten Batang" : `Kecamatan ${kecamatan}`;

  return (
    <div className="w-[491px] h-[771px] rounded-3xl overflow-hidden shadow-2xl bg-[#0a4d33] border-[6px] border-[#0a4d33] font-sans flex text-gray-800 shrink-0 relative">
      
      {/* Latar Belakang Corak Watermark (Pola Islami) */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="islamic-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M40 0 L80 40 L40 80 L0 40 Z" fill="none" stroke="#d4af37" strokeWidth="2" opacity="0.5"/>
              <circle cx="40" cy="40" r="25" fill="none" stroke="#d4af37" strokeWidth="2" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#islamic-pattern)" />
        </svg>
      </div>

      {/* PANEL KIRI (Logos) - KUNING NEON (CFFF04) */}
      <div className="w-[140px] h-full flex flex-col items-center py-10 px-2 border-r-[6px] border-[#0a4d33] bg-[#CFFF04] z-10 relative">
        {/* Lubang/Gantungan - Hijau Emerald */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-12 bg-[#0a4d33] rounded-b-lg border-x-4 border-b-4 border-[#083a27] shadow-xl flex items-center justify-center">
            <div className="w-4 h-4 bg-gray-300 rounded-full border-2 border-gray-500 shadow-inner"></div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-start mt-8 gap-8">
          <div className="flex flex-col items-center drop-shadow-md">
            <div className="w-[80px] h-[80px] relative flex items-center justify-center">
              <img src="https://lh3.googleusercontent.com/d/1iWK2Q855dKPSlITO4Wr2LZ8hdlPk4x49" alt="Kemenag" className="w-full h-full object-contain" />
            </div>
            <p className="text-[10px] text-[#0a4d33] text-center font-bold mt-2 uppercase leading-tight">Kementerian Agama<br/>Republik Indonesia</p>
          </div>
          <div className="flex flex-col items-center drop-shadow-md mt-2">
            <div className="w-[95px] h-[95px] relative flex items-center justify-center overflow-hidden">
              <img 
                src={logo || "https://lh3.googleusercontent.com/d/1IFOugVQJksGBT7YY2KdXo1i4gJp7meym"} 
                alt="Badko" 
                className="w-full h-full object-contain" 
                style={{ mixBlendMode: "multiply" }} 
              />
            </div>
            <p className="text-[11px] text-[#0a4d33] text-center font-bold mt-2 uppercase leading-tight">Badko LPQ<br/>{instansiWilayah}</p>
          </div>
          <div className="flex flex-col items-center drop-shadow-md mt-8">
            <div className="w-[125px] flex justify-center">
              <img src="https://lh3.googleusercontent.com/d/1D5vY95V0cO775xSScKjc9XA_jFP6S6zK" alt="FASI" className="w-full h-auto object-contain drop-shadow-lg" />
            </div>
            <p className="text-[10px] text-[#0a4d33] text-center font-black uppercase leading-tight mt-2">Festival Anak Sholeh<br/>Indonesia</p>
          </div>
        </div>
      </div>

      {/* PANEL KANAN (Data) */}
      <div className="flex-1 flex flex-col relative z-10 bg-[#fefdf9]">
        
        {/* WATERMARK LOGO DINAMIS: Mengikuti prop 'logo' */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.08] pointer-events-none p-12">
            <img 
                src={logo || "https://lh3.googleusercontent.com/d/1IFOugVQJksGBT7YY2KdXo1i4gJp7meym"} 
                alt="Watermark Badko" 
                className="w-full h-auto object-contain"
                style={{ mixBlendMode: "multiply" }}
            />
        </div>

        {/* Header Panel Kanan - Hijau Emerald */}
        <div className="bg-[#0a4d33] py-6 px-4 shadow-md z-20">
          <h2 className="text-white font-black text-3xl text-center tracking-wide drop-shadow-md">ID CARD PESERTA</h2>
          <p className="text-white font-bold text-[13px] text-center uppercase tracking-wider drop-shadow-md mt-1">FASI {instansiWilayah} 2026</p>
        </div>

        <div className="flex-1 relative p-6 pt-5 flex flex-col justify-start z-10">
          <div className="relative">
            <div className="flex flex-col items-center justify-center mb-6 text-center">
              <h1 className="text-[#0f2c59] text-[75px] font-black font-serif tracking-widest drop-shadow-md leading-none">FASI</h1>
              <h2 className="text-[#d4af37] text-[15px] font-bold font-sans uppercase tracking-[0.2em] mt-2 drop-shadow-sm">Festival Anak Sholeh Indonesia</h2>
            </div>

            <div className="space-y-6 mt-4">
              <div className="flex flex-col">
                <span className="text-[#0f2c59] font-black text-[16px] mb-1">NAMA:</span>
                <span className="font-bold text-[24px] border-b-[4px] border-gray-800 leading-tight pb-1.5 truncate uppercase">{nama}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#0f2c59] font-black text-[16px] mb-1">LEMBAGA:</span>
                <span className="font-bold text-[24px] border-b-[4px] border-gray-800 leading-tight pb-1.5 truncate uppercase">{lembaga}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#0f2c59] font-black text-[16px] mb-1">CABANG LOMBA:</span>
                <span className="font-bold text-[24px] border-b-[4px] border-gray-800 leading-tight pb-1.5 truncate uppercase">{cabangLomba}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#0f2c59] font-black text-[16px] mb-1">TINGKAT USIA:</span>
                <span className="font-bold text-[24px] border-b-[4px] border-gray-800 leading-tight pb-1.5 truncate uppercase">{tingkatUsia}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-0 w-full flex justify-center z-20">
            <div className="text-white bg-[#0a4d33] font-black text-[22px] tracking-[0.15em] px-8 py-2 rounded-xl shadow-lg border-[3px] border-[#0a4d33]">
              ID: {idPeserta}
            </div>
        </div>
      </div>
    </div>
  );
};

// --- WRAPPER FISIK CETAK ---
export const IDCardPrintBox = ({ p, memberName, memberId, logo }) => (
  <div style={{ width: '245.5px', height: '385.5px' }} className="relative print:break-inside-avoid shrink-0 bg-white mx-auto shadow-xl print:shadow-none overflow-hidden rounded-xl border border-gray-200 print:border-none">
    <div style={{ width: '491px', height: '771px', transform: 'scale(0.5)', transformOrigin: 'top left' }} className="absolute top-0 left-0">
      <IDCard p={p} memberName={memberName} memberId={memberId} logo={logo} />
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [scores, setScores] = useState({});
  const [passwords, setPasswords] = useState({});
  const [generalConfig, setGeneralConfig] = useState({ registrationOpen: {}, logos: {} });

  const [activeTab, setActiveTab] = useState("beranda");
  const [notification, setNotification] = useState(null);
  const [selectedForPrint, setSelectedForPrint] = useState(null);
  const [currentRole, setCurrentRole] = useState(ROLES.PUBLIK);
  const [userDistrict, setUserDistrict] = useState(null); 
  const [userBranch, setUserBranch] = useState(null);
  const [authModal, setAuthModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [isBulkPrint, setIsBulkPrint] = useState(false);
  
  const [regType, setRegType] = useState("single");
  const [regMembers, setRegMembers] = useState([{ name: "", birthDate: "", gender: "PA", age: null }]);
  const [regCategory, setRegCategory] = useState("");
  const [allowedCategories, setAllowedCategories] = useState([]);
  const [regDistrict, setRegDistrict] = useState("");
  
  const [filterCategory, setFilterCategory] = useState("TKQ");
  const [filterDistrictGlobal, setFilterDistrictGlobal] = useState("Semua");
  const [scoringFilterKec, setScoringFilterKec] = useState("Semua");
  const [scoringFilterLomba, setScoringFilterLomba] = useState("Semua");
  const [activeLevel, setActiveLevel] = useState("kecamatan");

  const [berandaFilterKec, setBerandaFilterKec] = useState("Semua");
  const [berandaFilterCat, setBerandaFilterCat] = useState("Semua");
  const [berandaFilterBranch, setBerandaFilterBranch] = useState("Semua");

  const [expandedDashCats, setExpandedDashCats] = useState({ TKQ: true, TPQ: false, TQA: false });
  const toggleDashCat = (cat) => setExpandedDashCats(prev => ({ ...prev, [cat]: !prev[cat] }));

  const [adminAcc, setAdminAcc] = useState({ kec: false, juri: false });
  const [scoringMode, setScoringMode] = useState("rinci");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // --- CEK STATUS PENDAFTARAN ---
  const isGlobalRegistrationOpen = generalConfig.registrationOpen?.kabupaten ?? true;
  const isMyDistrictRegistrationOpen = userDistrict ? (generalConfig.registrationOpen?.[userDistrict] ?? true) : true;
  const isSelectedDistrictRegistrationOpen = regDistrict ? (generalConfig.registrationOpen?.[regDistrict] ?? true) : true;

  // --- LOGIKA AUTO FULLSCREEN PADA KLIK PERTAMA ---
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    const handleFirstClick = () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(err => console.log(err));
      document.removeEventListener('click', handleFirstClick);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('click', handleFirstClick);
    return () => { document.removeEventListener('fullscreenchange', handleFullscreenChange); document.removeEventListener('click', handleFirstClick); };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(err => console.log(err));
    else document.exitFullscreen();
  };

  useEffect(() => {
    if (currentRole.id === "ADMIN_KEC") {
      setScoringFilterKec(userDistrict);
      setFilterDistrictGlobal(userDistrict);
      setBerandaFilterKec(userDistrict);
      setActiveLevel("kecamatan");
      setRegDistrict(userDistrict);
    } else if (currentRole.id === "JURI") {
      setScoringFilterKec(userDistrict);
      setScoringFilterLomba(userBranch);
      setActiveLevel("kecamatan");
      const foundCat = Object.keys(BRANCH_DATA).find(cat => BRANCH_DATA[cat].some(b => b.id === userBranch));
      if (foundCat) setFilterCategory(foundCat);
    } else if (currentRole.id === "ADMIN_KAB") {
      setActiveLevel("kabupaten");
    } else if (currentRole.id === "PUBLIK") {
      setRegDistrict("");
    }
  }, [currentRole, userDistrict, userBranch]);

  useEffect(() => {
    const initAuth = async () => { try { await signInAnonymously(auth); } catch (e) { setLoading(false); } };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => { if (u) { setUser(u); setLoading(false); } });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const pRef = collection(db, "artifacts", appId, "public", "data", "participants");
    const sRef = collection(db, "artifacts", appId, "public", "data", "scores");
    const cRef = doc(db, "artifacts", appId, "public", "data", "config", "security");
    const gRef = doc(db, "artifacts", appId, "public", "data", "config", "general");

    const unsubP = onSnapshot(pRef, (snap) => setParticipants(snap.docs.map(d => ({ id: d.id, ...d.data() }))), () => {});
    const unsubS = onSnapshot(sRef, (snap) => {
      const s = {}; snap.forEach(d => s[d.id] = d.data().values); setScores(s);
    }, () => {});
    const unsubC = onSnapshot(cRef, (d) => { if (d.exists()) setPasswords(d.data()); }, () => {});
    const unsubG = onSnapshot(gRef, (d) => { if (d.exists()) setGeneralConfig(d.data()); }, () => {});
    
    return () => { unsubP(); unsubS(); unsubC(); unsubG(); };
  }, [user]);

  const monitoredParticipants = useMemo(() => {
    return participants.filter(p => {
      const matchLevel = (p.level || "kecamatan") === activeLevel;
      const matchKec = berandaFilterKec === "Semua" || p.district === berandaFilterKec;
      const matchCat = berandaFilterCat === "Semua" || p.category === berandaFilterCat;
      const matchBranch = berandaFilterBranch === "Semua" || p.branchId === berandaFilterBranch;
      return matchLevel && matchKec && matchCat && matchBranch;
    });
  }, [participants, berandaFilterKec, berandaFilterCat, berandaFilterBranch, activeLevel]);

  const branchSummary = useMemo(() => {
    const counts = {};
    participants.filter(p => (p.level || "kecamatan") === activeLevel && (berandaFilterKec === "Semua" || p.district === berandaFilterKec))
      .forEach(p => { counts[p.branchId] = (counts[p.branchId] || 0) + 1; });
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

  const toggleRegistrationSetting = async (level, currentValue) => {
    const newStatus = !currentValue;
    const newConfig = { ...generalConfig };
    if (!newConfig.registrationOpen) newConfig.registrationOpen = {};
    newConfig.registrationOpen[level] = newStatus;
    try {
        await setDoc(doc(db, "artifacts", appId, "public", "data", "config", "general"), newConfig, { merge: true });
        notify(`Pendaftaran ${level === 'kabupaten' ? 'Tingkat Kabupaten' : 'Kec. ' + level} ${newStatus ? 'Dibuka' : 'Ditutup'}`);
    } catch (e) {
        notify("Gagal mengubah status pendaftaran", "error");
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) return notify("Maksimal ukuran file 1MB!", "error"); // Batas 1MB agar ringan
    
    const reader = new FileReader();
    reader.onloadend = async () => {
        const base64String = reader.result;
        const newConfig = { ...generalConfig };
        if (!newConfig.logos) newConfig.logos = {};
        newConfig.logos[userDistrict] = base64String;
        try {
            await setDoc(doc(db, "artifacts", appId, "public", "data", "config", "general"), newConfig, { merge: true });
            notify("Logo BADKO LPQ berhasil diperbarui!");
        } catch (err) {
            notify("Gagal mengunggah logo", "error");
        }
    };
    reader.readAsDataURL(file);
  };

  const handleKabupatenLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) return notify("Maksimal ukuran file 1MB!", "error");

    const reader = new FileReader();
    reader.onloadend = async () => {
        const base64String = reader.result;
        const newConfig = { ...generalConfig };
        if (!newConfig.logos) newConfig.logos = {};
        newConfig.logos['kabupaten'] = base64String;
        try {
            await setDoc(doc(db, "artifacts", appId, "public", "data", "config", "general"), newConfig, { merge: true });
            notify("Logo BADKO Kabupaten berhasil diperbarui!");
        } catch (err) {
            notify("Gagal mengunggah logo Kabupaten", "error");
        }
    };
    reader.readAsDataURL(file);
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
            p.district === kec && p.branchId === branch.id && 
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
    const institution = fd.get("institution");

    if (!branchId || !regCategory || !regDistrict) return notify("Lengkapi form!", "error");
    if (!isSelectedDistrictRegistrationOpen) return notify("Pendaftaran di kecamatan ini ditutup!", "error");

    const branchInfo = ALL_BRANCHES.find(b => b.id === branchId);
    const activeMembers = regMembers.filter(m => m.name.trim() !== "");
    const pId = `FASI-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const newP = {
      name: regType === "single" ? activeMembers[0].name : `Regu ${institution}`,
      members: activeMembers.map(m => m.name),
      institution, district: regDistrict, gender: regType === "single" ? activeMembers[0].gender : "Group",
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

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editModal) return;
    
    const fd = new FormData(e.target);
    const data = { institution: fd.get("institution"), district: fd.get("district") };
    
    if (editModal.type === "single") {
      data.name = fd.get("name");
      data.members = [fd.get("name")];
    } else {
      const members = [];
      for(let i=0; i<editModal.members.length; i++) {
        const val = fd.get(`member_${i}`);
        if(val) members.push(val);
      }
      data.name = `Regu ${data.institution}`;
      data.members = members;
    }

    try {
      await updateDoc(doc(db, "artifacts", appId, "public", "data", "participants", editModal.id), data);
      notify("Data peserta berhasil diperbarui!");
      setEditModal(null);
    } catch (err) {
      notify("Gagal memperbarui data peserta", "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-28 font-sans">
      <style>{`@media print { * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .no-print { display: none !important; } .print-grid { display: grid !important; grid-template-columns: repeat(3, 1fr); gap: 10px; } } .no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      
      {notification && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-8 py-3 rounded-full text-white font-black text-[10px] uppercase shadow-2xl transition-all ${notification.type === "error" ? "bg-red-500" : "bg-emerald-600"}`}>
          {String(notification.msg)}
        </div>
      )}

      {/* OVERLAY TAMPILAN CETAK ID CARD */}
      {(selectedForPrint || isBulkPrint) && (
        <div className="fixed inset-0 bg-slate-800/80 z-[150] overflow-y-auto backdrop-blur-sm print:bg-white print:p-0">
          <div className="no-print p-4 bg-white shadow-sm flex justify-center gap-4 sticky top-0 z-50 border-b border-slate-200">
            <button onClick={() => window.print()} className="bg-emerald-600 text-white px-6 py-2.5 rounded-full font-bold flex items-center gap-2 shadow-md hover:bg-emerald-700 active:scale-95 transition-all"><Printer size={18}/> Cetak ID Card (A4)</button>
            <button onClick={() => { setSelectedForPrint(null); setIsBulkPrint(false); }} className="bg-rose-500 text-white px-6 py-2.5 rounded-full font-bold flex items-center gap-2 hover:bg-rose-600 shadow-md active:scale-95 transition-all"><LogOut size={18}/> Tutup</button>
          </div>
          
          <div className="p-8 print:p-0 flex flex-wrap justify-center print:justify-start gap-4 print:gap-[5mm] items-start max-w-5xl mx-auto mt-4 print:mt-0">
            {selectedForPrint && (selectedForPrint.members || [selectedForPrint.name]).map((m, i) => (
              <IDCardPrintBox 
                key={`${selectedForPrint.id}-${i}`} 
                p={selectedForPrint} 
                memberName={m} 
                memberId={selectedForPrint.type === 'group' ? `${selectedForPrint.id}-${i+1}` : selectedForPrint.id} 
                logo={selectedForPrint.level === 'kabupaten' ? generalConfig.logos?.['kabupaten'] : generalConfig.logos?.[selectedForPrint.district]}
              />
            ))}
            {isBulkPrint && participants
              .filter(p => (!userDistrict || p.district === userDistrict) && (p.level || "kecamatan") === activeLevel)
              .flatMap(p => (p.members || [p.name]).map((m, i) => (
                <IDCardPrintBox 
                  key={`${p.id}-${i}`} 
                  p={p} 
                  memberName={m} 
                  memberId={p.type === 'group' ? `${p.id}-${i+1}` : p.id} 
                  logo={p.level === 'kabupaten' ? generalConfig.logos?.['kabupaten'] : generalConfig.logos?.[p.district]}
                />
            )))}
          </div>
        </div>
      )}

      {/* MODAL EDIT DATA SANTRI */}
      {editModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[150] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[48px] p-8 md:p-12 shadow-2xl animate-in zoom-in duration-300 relative">
            <button onClick={() => setEditModal(null)} className="absolute top-8 right-8 text-slate-400 hover:text-red-500 transition-colors"><LogOut size={24}/></button>
            <h3 className="font-black text-2xl uppercase text-slate-800 mb-8 italic flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-2xl"><Edit3 className="text-blue-600" size={24}/></div>
              Edit Data Santri
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Informasi Dasar & Nama</div>
                {editModal.type === "single" ? (
                  <input name="name" defaultValue={editModal.name} placeholder="Nama Lengkap Santri" className="w-full p-5 bg-slate-50 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-emerald-100 border border-slate-200" required />
                ) : (
                  <div className="space-y-3">
                    {editModal.members.map((m, i) => (
                      <input key={i} name={`member_${i}`} defaultValue={m} placeholder={`Nama Anggota ${i+1}`} className="w-full p-5 bg-slate-50 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-emerald-100 border border-slate-200" required={i === 0} />
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                   <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Unit Lembaga</div>
                   <input name="institution" defaultValue={editModal.institution} className="w-full p-5 bg-slate-50 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-emerald-100 border border-slate-200" required />
                </div>
                <div>
                   <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Kecamatan</div>
                   <select name="district" defaultValue={editModal.district} className="w-full p-5 bg-slate-50 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-emerald-100 border border-slate-200 cursor-pointer">
                      {KECAMATAN_LIST.map(k => <option key={k} value={k}>{k}</option>)}
                   </select>
                </div>
              </div>
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start gap-3 text-amber-800">
                <Info size={18} className="shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold italic leading-relaxed">Untuk mengubah Cabang Lomba atau Tingkat Usia, silakan <b>Hapus</b> data ini di tabel utama lalu daftarkan ulang sebagai peserta baru. Hal ini untuk mencegah kerusakan format skor pada sistem juri.</p>
              </div>
              <div className="flex gap-4 pt-4">
                 <button type="submit" className="flex-1 bg-emerald-600 text-white font-black py-5 rounded-[24px] shadow-lg uppercase text-xs tracking-widest hover:scale-[1.02] transition-all"><Save size={18} className="inline mr-2"/> Simpan Perubahan</button>
              </div>
            </form>
          </div>
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
                   {userDistrict && <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">â€¢ {userDistrict}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button title="Mode Layar Penuh" onClick={toggleFullscreen} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-emerald-600 transition-all shadow-sm">
                {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
              </button>
              <button title="Ganti Otoritas" onClick={() => setShowRoleSwitcher(true)} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-emerald-600 transition-all shadow-sm">
                <UserCircle size={24} />
              </button>
            </div>
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

            {/* SEKSI MONITORING PENDAFTAR */}
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
              <div className="space-y-4">
                {(berandaFilterCat === "Semua" ? ["TKQ", "TPQ", "TQA"] : [berandaFilterCat]).map(cat => {
                  const isExpanded = berandaFilterCat !== "Semua" || expandedDashCats[cat];
                  return (
                  <div key={cat} className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
                    <button onClick={() => toggleDashCat(cat)} className="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="bg-slate-900 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-lg italic">{cat}</div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic hidden sm:block">{BRANCH_DATA[cat].length} Cabang Lomba</span>
                      </div>
                      <div className="bg-white p-2 rounded-full shadow-sm border border-slate-200 text-slate-400">
                         {isExpanded ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 bg-white border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
                        {BRANCH_DATA[cat].filter(b => berandaFilterBranch === "Semua" || b.id === berandaFilterBranch).map(b => (
                          <div key={b.id} className="bg-slate-50 p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center justify-between hover:scale-[1.02] transition-transform">
                            <div className="min-w-0 pr-4">
                              <p className="font-black text-[11px] uppercase text-slate-800 leading-none mb-2 truncate">{b.name}</p>
                              <div className="flex gap-2">
                                <span className="text-[8px] font-bold text-slate-400 uppercase leading-none">Pendaftar</span>
                              </div>
                            </div>
                            <div className="bg-emerald-50 text-emerald-700 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner italic border border-emerald-100 shrink-0">
                              {branchSummary[b.id] || 0}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )})}
              </div>

              {/* TABLE MONITORING */}
              <div className="bg-white rounded-[48px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
                <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <h4 className="font-black text-xs uppercase text-slate-800 leading-none">Daftar Santri Terdaftar ({monitoredParticipants.length})</h4>
                  <div className="text-[9px] font-bold text-slate-400 uppercase italic">Filter: {berandaFilterKec} â€¢ {berandaFilterCat}</div>
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

        {/* --- BLOK PENDAFTARAN & TAMPILAN LOCK SCREEN --- */}
        {activeTab === "pendaftaran" && (
          <div className="animate-in slide-in-from-right duration-500">
            {/* 1. Tampilan Layar Kunci Global (Kabupaten) */}
            {!isGlobalRegistrationOpen ? (
               <div className="bg-red-50 p-16 md:p-24 rounded-[60px] border-4 border-red-100 shadow-2xl text-center">
                  <div className="bg-red-500 text-white w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-red-200">
                     <Lock size={48} />
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-red-900 mb-4 leading-none">Pendaftaran Tingkat Kabupaten Telah Ditutup</h2>
                  <p className="text-red-600 font-bold max-w-lg mx-auto italic">Mohon maaf, panitia FASI tingkat Kabupaten telah menutup sistem pendaftaran santri baru secara global.</p>
               </div>
            ) : 
            /* 2. Tampilan Layar Kunci Spesifik Admin Kecamatan */
            (currentRole.id === "ADMIN_KEC" && !isMyDistrictRegistrationOpen) ? (
               <div className="bg-amber-50 p-16 md:p-24 rounded-[60px] border-4 border-amber-100 shadow-2xl text-center">
                  <div className="bg-amber-500 text-white w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-amber-200">
                     <Lock size={48} />
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-amber-900 mb-4 leading-none">Pendaftaran Kecamatan {userDistrict} Ditutup</h2>
                  <p className="text-amber-700 font-bold max-w-lg mx-auto italic">Anda telah menutup sistem pendaftaran untuk wilayah kecamatan Anda. Buka kembali melalui menu Admin untuk menerima pendaftaran santri baru.</p>
               </div>
            ) : 
            /* 3. Tampilan Form Pendaftaran (Terbuka) */
            (
              <div className="bg-white p-10 rounded-[60px] shadow-sm border border-slate-200">
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
                    <select name="district" className="p-5 bg-slate-100 rounded-2xl font-black text-xs border-none outline-none appearance-none cursor-pointer" value={regDistrict} onChange={(e) => setRegDistrict(e.target.value)} required disabled={currentRole.id === "ADMIN_KEC"}>
                      <option value="" disabled>Pilih Kecamatan</option>
                      {KECAMATAN_LIST.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                    <input name="institution" placeholder="Unit Lembaga LPQ" className="p-5 bg-slate-100 rounded-2xl font-black text-sm border-none outline-none shadow-sm" required />
                  </div>

                  {/* Warning khusus Publik jika kecamatan yang dipilih sedang ditutup */}
                  {regDistrict && !isSelectedDistrictRegistrationOpen && currentRole.id !== "ADMIN_KEC" && (
                     <div className="bg-red-50 text-red-600 p-6 rounded-[24px] font-black text-[11px] uppercase border-2 border-red-200 flex items-center gap-3 animate-in fade-in">
                        <Lock size={20}/> Pendaftaran untuk Kecamatan {regDistrict} sedang ditutup!
                     </div>
                  )}

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
                  <button type="submit" disabled={!isSelectedDistrictRegistrationOpen} className={`w-full font-black py-6 rounded-[40px] shadow-2xl uppercase text-xs tracking-widest transition-all ${isSelectedDistrictRegistrationOpen ? 'bg-emerald-600 text-white hover:scale-[1.02]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                     <Save size={18} className="inline mr-2"/> Simpan Pendaftaran
                  </button>
                </form>
              </div>
            )}
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
                        {currentRole.id === "JURI" ? `Kec. ${userDistrict} â€¢ ${ALL_BRANCHES.find(b => b.id === userBranch)?.name || 'Juri'}` : `Admin Panel â€¢ ${currentRole.name}`}
                        </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
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
                        <div className="text-[10px] font-black text-emerald-600 uppercase leading-none italic">{list.length} Santri â€¢ Mode: {scoringMode === 'rinci' ? 'Per Kriteria' : 'Skor Akhir'}</div>
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
                        <option value="kecamatan">ðŸš© Seleksi Kec.</option>
                        <option value="kabupaten">ðŸ† Final Kab.</option>
                        </select>
                    </div>
                </div>
             </div>

             <div className="space-y-16">
                {Object.keys(BRANCH_DATA).map(cat => {
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
                                                <p className="text-[9px] font-bold text-emerald-600 uppercase truncate leading-none">Kec. {win.district} â€¢ {win.institution}</p>
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

            {/* BLOK KHUSUS PENGATURAN ADMIN KABUPATEN */}
            {currentRole.id === "ADMIN_KAB" && (
              <>
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

              {/* GRID SETTING BUKA TUTUP & UPLOAD LOGO (KABUPATEN) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* BUKA TUTUP PENDAFTARAN GLOBAL (KABUPATEN) */}
                  <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-xl p-8 flex flex-col justify-between h-full">
                      <div>
                          <div className="flex items-center gap-4 mb-6">
                              <div className={`p-4 rounded-2xl shadow-md ${isGlobalRegistrationOpen ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-red-500 text-white shadow-red-200'}`}>
                                  {isGlobalRegistrationOpen ? <Power size={28}/> : <PowerOff size={28}/>}
                              </div>
                              <div>
                                  <h3 className="text-xl font-black uppercase tracking-tighter italic">Pendaftaran Kab.</h3>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">
                                      {isGlobalRegistrationOpen ? 'Sistem Terbuka' : 'Ditutup Paksa'}
                                  </p>
                              </div>
                          </div>
                      </div>
                      <button onClick={() => toggleRegistrationSetting('kabupaten', isGlobalRegistrationOpen)} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md active:scale-95 transition-all border-2 ${isGlobalRegistrationOpen ? 'bg-white text-red-500 border-red-500 hover:bg-red-50' : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'}`}>
                          {isGlobalRegistrationOpen ? "Tutup Pendaftaran Global" : "Buka Pendaftaran"}
                      </button>
                  </div>

                  {/* UPLOAD LOGO BADKO KABUPATEN */}
                  <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-xl p-8 flex flex-col justify-between h-full">
                      <div>
                          <div className="flex items-center gap-4 mb-4">
                              <div className="p-4 rounded-2xl shadow-md bg-blue-500 text-white shadow-blue-200">
                                  <ImageIcon size={28}/>
                              </div>
                              <div>
                                  <h3 className="text-xl font-black uppercase tracking-tighter italic">Logo BADKO Kab.</h3>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Untuk ID Card Finalis</p>
                              </div>
                          </div>
                          <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic mb-4">Unggah logo ID Card peserta ketika ditarik ke tingkat Kabupaten (Maks 1MB. 1:1).</p>
                      </div>
                      <div className="relative group cursor-pointer mt-auto">
                          <input type="file" accept="image/*" onChange={handleKabupatenLogoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" title="Klik untuk pilih logo" />
                          <div className="bg-slate-50 border-2 border-dashed border-slate-300 group-hover:border-blue-500 group-hover:bg-blue-50 rounded-2xl p-4 flex items-center justify-center gap-3 transition-all">
                              <UploadCloud size={20} className="text-slate-400 group-hover:text-blue-500"/>
                              <span className="font-black text-[10px] uppercase text-slate-500 group-hover:text-blue-600 tracking-widest">Pilih Gambar (Klik)</span>
                          </div>
                      </div>
                  </div>
              </div>
              </>
            )}

            {/* BLOK KHUSUS PENGATURAN ADMIN KECAMATAN */}
            {currentRole.id === "ADMIN_KEC" && (
                <div className="bg-white rounded-[48px] border border-slate-200 overflow-hidden shadow-2xl">
                    <div className="p-10 bg-slate-900 text-white flex items-center gap-6">
                        <div className="bg-slate-800 p-4 rounded-3xl border border-slate-700 shadow-inner"><Settings size={32}/></div>
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter italic">Pengaturan Wilayah {userDistrict}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Kontrol Pendaftaran & Tampilan ID Card</p>
                        </div>
                    </div>
                    
                    <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* BUKA TUTUP PENDAFTARAN KECAMATAN */}
                        <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-8 space-y-6 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    {isMyDistrictRegistrationOpen ? <Power className="text-emerald-500" size={24}/> : <PowerOff className="text-red-500" size={24}/>}
                                    <h4 className="font-black text-sm uppercase text-slate-800 italic">Status Pendaftaran</h4>
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic">Atur apakah sistem masih menerima entri santri baru untuk wilayah Kecamatan {userDistrict}.</p>
                            </div>
                            <button onClick={() => toggleRegistrationSetting(userDistrict, isMyDistrictRegistrationOpen)} className={`w-full px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2 ${isMyDistrictRegistrationOpen ? 'bg-white text-red-500 border-red-500 hover:bg-red-50' : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'}`}>
                                {isMyDistrictRegistrationOpen ? "Tutup Pendaftaran" : "Buka Pendaftaran"}
                            </button>
                        </div>

                        {/* UPLOAD LOGO BADKO */}
                        <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-8 space-y-6 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <ImageIcon className="text-blue-500" size={24}/>
                                    <h4 className="font-black text-sm uppercase text-slate-800 italic">Logo BADKO LPQ</h4>
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic">Unggah logo kustom untuk ID Card peserta wilayah Anda (Maks 1MB. Resolusi 1:1 direkomendasikan).</p>
                            </div>
                            <div className="relative group cursor-pointer">
                                <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" title="Klik untuk pilih logo" />
                                <div className="bg-white border-2 border-dashed border-slate-300 group-hover:border-blue-500 group-hover:bg-blue-50 rounded-2xl p-4 flex items-center justify-center gap-3 transition-all">
                                    <UploadCloud size={20} className="text-slate-400 group-hover:text-blue-500"/>
                                    <span className="font-black text-[10px] uppercase text-slate-500 group-hover:text-blue-600 tracking-widest">Pilih Gambar (Klik)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-[48px] border border-slate-200 overflow-hidden shadow-sm">
               <div className="p-10 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <h3 className="font-black text-2xl uppercase tracking-tighter text-slate-800 leading-none italic">Database Santri</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">{activeLevel === 'kabupaten' ? 'ðŸ† Finalis Tingkat Kabupaten' : 'ðŸš© Peserta Seleksi Kecamatan'}</p>
                  </div>
                  <div className="flex gap-4">
                     <button onClick={() => setIsBulkPrint(true)} className="bg-emerald-600 text-white px-8 py-4 rounded-full font-black text-[10px] uppercase shadow-lg shadow-emerald-200 flex items-center gap-2 hover:bg-emerald-700 transition-all"><Printer size={16}/> Cetak Masal</button>
                  </div>
               </div>
               <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <tr><th className="p-8">Profil Santri</th><th className="p-8">Unit Lembaga</th><th className="p-8 text-center">Aksi (Edit / Cetak / Hapus)</th></tr>
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
                                 <button title="Edit Data" onClick={() => setEditModal(p)} className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit3 size={18}/></button>
                                 <button title="Cetak ID Card" onClick={() => setSelectedForPrint(p)} className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><Printer size={18}/></button>
                                 <button title="Hapus Data" onClick={async () => { if(confirm(`Hapus data ${p.name}?`)) { await deleteDoc(doc(db, "artifacts", appId, "public", "data", "participants", p.id)); notify("Data Dihapus"); } }} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={18}/></button>
                              </div>
                           </td>
                         </tr>
                       ))}
                    </tbody>
                  </table>
               </div>
            </div>

            {/* BLOK PASSWORD ADMIN KECAMATAN */}
            {currentRole.id === "ADMIN_KEC" && (
              <div className="bg-white rounded-[48px] border border-slate-200 overflow-hidden shadow-2xl animate-in zoom-in duration-500">
                 <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter italic">Pengaturan Password Juri Lomba</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Wilayah Kecamatan: {userDistrict}</p>
                    </div>
                    <KeyRound size={32} className="opacity-30" />
                 </div>
                 <div className="p-10 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {ALL_BRANCHES.map(branch => {
                         const pwdKey = `JURI_PWD_${userDistrict}_${branch.id}`;
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

            {/* BLOK MANAJEMEN KEAMANAN KHUSUS ADMIN KABUPATEN */}
            {currentRole.id === "ADMIN_KAB" && (
              <div className="bg-white rounded-[48px] border border-slate-200 overflow-hidden shadow-2xl animate-in zoom-in duration-500">
                 <div className="p-8 md:p-10 bg-slate-900 text-white flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter italic">Manajemen Keamanan Sistem</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Akses Super Admin Kabupaten</p>
                    </div>
                    <ShieldCheck size={32} className="opacity-30" />
                 </div>
                 
                 <div className="p-6 md:p-10 space-y-6 bg-slate-50">
                    {/* ACCORDION 1: ADMIN KECAMATAN */}
                    <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm transition-all duration-300">
                       <button onClick={() => setAdminAcc(p => ({...p, kec: !p.kec}))} className="w-full p-6 md:p-8 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-4">
                             <div className="bg-blue-100 text-blue-600 p-3 rounded-2xl"><Users size={24}/></div>
                             <div className="text-left">
                                <div className="font-black text-sm uppercase text-slate-800 italic leading-none">Password Admin Kecamatan</div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase mt-1">Kelola 15 Hak Akses Admin Tingkat Kecamatan</div>
                             </div>
                          </div>
                          <div className="bg-slate-100 p-2 rounded-full text-slate-400">
                             {adminAcc.kec ? <ChevronDown size={20}/> : <ChevronRight size={20}/>}
                          </div>
                       </button>
                       {adminAcc.kec && (
                          <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 border-t border-slate-100 bg-slate-50/50 animate-in slide-in-from-top-2 duration-300">
                             {KECAMATAN_LIST.map(kec => {
                                const pwdKey = `DIST_PWD_${kec}`;
                                return (
                                   <div key={kec} className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm space-y-3 hover:border-blue-300 transition-colors">
                                      <div className="text-[10px] font-black text-slate-500 uppercase leading-none italic">Kecamatan {kec}</div>
                                      <div className="relative">
                                        <input 
                                          type="text" 
                                          placeholder="Sandi Admin"
                                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs outline-none focus:ring-4 focus:ring-blue-100 shadow-inner italic"
                                          value={passwords[pwdKey] || ""}
                                          onChange={(e) => {
                                            const next = { ...passwords };
                                            next[pwdKey] = e.target.value;
                                            setPasswords(next);
                                          }}
                                        />
                                        <button 
                                          title="Simpan Sandi"
                                          onClick={async () => {
                                            await setDoc(doc(db, "artifacts", appId, "public", "data", "config", "security"), passwords);
                                            notify(`Sandi Admin Kec. ${kec} disimpan!`);
                                          }}
                                          className="absolute right-2 top-2 p-2 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 active:scale-90 transition-all"
                                        >
                                          <Save size={14}/>
                                        </button>
                                      </div>
                                   </div>
                                );
                             })}
                          </div>
                       )}
                    </div>

                    {/* ACCORDION 2: JURI KABUPATEN */}
                    <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm transition-all duration-300">
                       <button onClick={() => setAdminAcc(p => ({...p, juri: !p.juri}))} className="w-full p-6 md:p-8 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-4">
                             <div className="bg-amber-100 text-amber-600 p-3 rounded-2xl"><Gavel size={24}/></div>
                             <div className="text-left">
                                <div className="font-black text-sm uppercase text-slate-800 italic leading-none">Password Juri Final Kabupaten</div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase mt-1">Kelola Akses Penilaian Tingkat Kabupaten</div>
                             </div>
                          </div>
                          <div className="bg-slate-100 p-2 rounded-full text-slate-400">
                             {adminAcc.juri ? <ChevronDown size={20}/> : <ChevronRight size={20}/>}
                          </div>
                       </button>
                       {adminAcc.juri && (
                          <div className="p-6 md:p-8 space-y-10 border-t border-slate-100 bg-slate-50/50 animate-in slide-in-from-top-2 duration-300">
                             {["TKQ", "TPQ", "TQA"].map(cat => (
                                <div key={cat} className="space-y-4">
                                   <div className="flex items-center gap-3">
                                      <div className="bg-slate-800 text-white px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest">{cat}</div>
                                      <div className="h-px bg-slate-200 flex-1"></div>
                                   </div>
                                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                      {BRANCH_DATA[cat].map(branch => {
                                         const pwdKey = `JURI_PWD_KAB_${branch.id}`;
                                         return (
                                            <div key={branch.id} className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm space-y-3 hover:border-amber-300 transition-colors">
                                               <div className="text-[10px] font-black text-slate-500 uppercase leading-none truncate italic" title={branch.name}>{branch.name}</div>
                                               <div className="relative">
                                                 <input 
                                                   type="text" 
                                                   placeholder="Sandi Juri"
                                                   className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs outline-none focus:ring-4 focus:ring-amber-100 shadow-inner italic"
                                                    value={passwords[pwdKey] || ""}
                                                   onChange={(e) => {
                                                     const next = { ...passwords };
                                                     next[pwdKey] = e.target.value;
                                                     setPasswords(next);
                                                   }}
                                                 />
                                                 <button 
                                                   title="Simpan Sandi"
                                                   onClick={async () => {
                                                     await setDoc(doc(db, "artifacts", appId, "public", "data", "config", "security"), passwords);
                                                     notify(`Sandi Juri ${branch.name} disimpan!`);
                                                   }}
                                                   className="absolute right-2 top-2 p-2 bg-amber-600 text-white rounded-xl shadow-md hover:bg-amber-700 active:scale-90 transition-all"
                                                 >
                                                   <Save size={14}/>
                                                 </button>
                                               </div>
                                            </div>
                                         );
                                      })}
                                   </div>
                                </div>
                             ))}
                          </div>
                       )}
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
                     Kec. {authModal.district} {authModal.branch && `â€¢ ${ALL_BRANCHES.find(b => b.id === authModal.branch)?.name}`}
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

    </div>
  );
}
