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
  ToggleLeft,
  ToggleRight,
  Upload,
  Image as ImageIcon,
  Download,
  FileSpreadsheet,
  Crown,
  Eye,
  FileUp,
  FileDown
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

// --- HELPER UNTUK EXCEL (XLSX) ---
let xlsxPromise = null;
const loadXLSX = () => {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (xlsxPromise) return xlsxPromise;
  xlsxPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.onload = () => resolve(window.XLSX);
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return xlsxPromise;
};

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

// URL Logo FASI Global
const FASI_LOGO_URL = "https://lh3.googleusercontent.com/d/1D5vY95V0cO775xSScKjc9XA_jFP6S6zK";
const DEFAULT_BADKO_LOGO = "https://lh3.googleusercontent.com/d/1AyXkCbeTzEGiPxz51ZmdPHDDW2oK2qTe";

// --- KOMPONEN ID CARD ---
const IDCard = ({ p, memberName, memberId, badkoLogoUrl }) => {
  const extractedName = typeof memberName === 'object' ? (memberName?.name || p?.name) : memberName;
  const nama = String(extractedName || p?.name || "NAMA PESERTA");
  const cabangLomba = String(p?.branchName || "CABANG LOMBA");
  const tingkatUsia = String(p?.category || "TPQ/TKQ/TQA");
  const idPeserta = String(memberId || p?.id || "0000");
  const kecamatan = String(p?.district || "Bandar"); 
  const nomorUrut = (p?.drawNumber || p?.globalNumber) ? String(p.drawNumber || p.globalNumber) : "-";

  // Pengecekan panjang nama (jika lebih dari 20 karakter)
  const isLongName = nama.length > 20;
  const isLongBranch = cabangLomba.length > 20;

  const currentLogo = badkoLogoUrl || DEFAULT_BADKO_LOGO;

  return (
    <div className="w-[491px] h-[771px] rounded-3xl overflow-hidden shadow-2xl bg-[#0a4d33] border-[6px] border-blue-800 font-sans flex text-gray-800 shrink-0">
      
      {/* Background Watermark Pattern */}
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

      {/* PANEL KIRI (Logos) */}
      <div className="w-[140px] h-full flex flex-col items-center py-10 px-2 border-r-[4px] border-blue-800 bg-[#d4af37] z-10 relative">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-12 bg-emerald-700 rounded-b-lg border-x-4 border-b-4 border-emerald-900 shadow-xl flex items-center justify-center">
            <div className="w-4 h-4 bg-gray-300 rounded-full border-2 border-gray-500 shadow-inner"></div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-start mt-8 gap-8">
          <div className="flex flex-col items-center drop-shadow-xl">
            <div className="w-[80px] h-[80px] relative flex items-center justify-center">
              <img src="https://lh3.googleusercontent.com/d/1iWK2Q855dKPSlITO4Wr2LZ8hdlPk4x49" alt="Kemenag" className="w-full h-full object-contain" />
            </div>
            <p className="text-[10px] text-[#0a4d33] text-center font-bold mt-2 uppercase leading-tight">Kementerian Agama<br/>Republik Indonesia</p>
          </div>
          <div className="flex flex-col items-center drop-shadow-xl mt-2">
            <div className="w-[95px] h-[95px] relative flex items-center justify-center bg-white/20 rounded-2xl p-2">
              <img src={currentLogo} alt="Badko" className="w-full h-full object-contain" />
            </div>
            <p className="text-[11px] text-[#0a4d33] text-center font-bold mt-2 uppercase leading-tight">Badko LPQ<br/>Kecamatan {kecamatan}</p>
          </div>
          <div className="flex flex-col items-center drop-shadow-xl mt-8">
            <div className="w-[125px] flex justify-center">
              <img src={FASI_LOGO_URL} alt="FASI" className="w-full h-auto object-contain drop-shadow-lg" />
            </div>
            <p className="text-[10px] text-[#0a4d33] text-center font-black uppercase leading-tight mt-2">Festival Anak Sholeh<br/>Indonesia</p>
          </div>
        </div>
      </div>

      {/* PANEL KANAN (Data) */}
      <div className="flex-1 flex flex-col relative z-10 bg-[#fefdf9]">
        <div className="bg-gradient-to-b from-emerald-700 to-emerald-900 py-6 px-4 shadow-md z-20">
          <h2 className="text-white font-black text-3xl text-center tracking-wide drop-shadow-md">ID CARD PESERTA</h2>
          <p className="text-white font-bold text-[13px] text-center uppercase tracking-wider drop-shadow-md mt-1">FASI Kecamatan {kecamatan} 2026</p>
        </div>

        <div className="flex-1 relative p-6 pt-5 flex flex-col justify-start">
          <div className="absolute inset-0 z-0 flex items-center justify-center opacity-10 pointer-events-none overflow-hidden">
            <img src={currentLogo} alt="Watermark Badko" className="w-[85%] h-auto object-contain grayscale" />
          </div>

          <div className="relative z-10">
            <div className="flex flex-col items-center justify-center mb-6 text-center">
              <h1 className="text-[#0f2c59] text-[75px] font-black font-serif tracking-widest drop-shadow-md leading-none">FASI</h1>
              <h2 className="text-[#d4af37] text-[15px] font-bold font-sans uppercase tracking-[0.2em] mt-2 drop-shadow-sm">Festival Anak Sholeh Indonesia</h2>
            </div>

            <div className="space-y-6 mt-4">
              <div className="flex flex-col">
                <span className="text-[#0f2c59] font-black text-[16px] mb-1">NAMA:</span>
                <span className={`font-bold border-b-[4px] border-gray-800 leading-tight pb-1.5 ${isLongName ? 'text-[21px] line-clamp-2' : 'text-[24px] truncate'}`}>{nama}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#0f2c59] font-black text-[16px] mb-1">CABANG LOMBA:</span>
                <span className={`font-bold border-b-[4px] border-gray-800 leading-tight pb-1.5 ${isLongBranch ? 'text-[21px] line-clamp-2' : 'text-[24px] truncate'}`}>{cabangLomba}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#0f2c59] font-black text-[16px] mb-1">TINGKAT USIA (TPQ/TKQ/TQA):</span>
                <span className="font-bold text-[24px] border-b-[4px] border-gray-800 leading-tight pb-1.5 truncate">{tingkatUsia}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#0f2c59] font-black text-[16px] mb-1">NOMOR URUT:</span>
                <span className="font-bold text-[24px] border-b-[4px] border-gray-800 leading-tight pb-1.5 truncate">{nomorUrut}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-0 w-full flex justify-center z-20">
            <div className="text-white bg-[#0a4d33] font-black text-[22px] tracking-[0.15em] px-8 py-2 rounded-xl shadow-lg border-[3px] border-blue-800">
              ID: {idPeserta}
            </div>
        </div>
      </div>
    </div>
  );
};

const IDCardPrintBox = ({ p, memberName, memberId, badkoLogoUrl }) => (
  <div style={{ width: '245.5px', height: '385.5px' }} className="relative print:break-inside-avoid shrink-0 bg-white mx-auto shadow-xl print:shadow-none overflow-hidden rounded-xl border border-gray-200 print:border-none print:m-0">
    <div style={{ width: '491px', height: '771px', transform: 'scale(0.5)', transformOrigin: 'top left' }} className="absolute top-0 left-0">
      <IDCard p={p} memberName={memberName} memberId={memberId} badkoLogoUrl={badkoLogoUrl} />
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [scores, setScores] = useState({});
  const [passwords, setPasswords] = useState({});
  const [appSettings, setAppSettings] = useState({ regStatus: {}, badkoLogos: {} });

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
  
  // Impor Data State
  const [importModal, setImportModal] = useState(false);
  const [importTargetDistrict, setImportTargetDistrict] = useState("");

  const [regType, setRegType] = useState("single");
  const [regMembers, setRegMembers] = useState([{ name: "", birthDate: "", gender: "PA", age: null }]);
  const [regCategory, setRegCategory] = useState("");
  const [allowedCategories, setAllowedCategories] = useState([]);
  
  const [filterCategory, setFilterCategory] = useState("TKQ");
  const [filterDistrictGlobal, setFilterDistrictGlobal] = useState("Semua");
  const [scoringFilterKec, setScoringFilterKec] = useState("Semua");
  const [scoringFilterLomba, setScoringFilterLomba] = useState("Semua");
  const [activeLevel, setActiveLevel] = useState("kecamatan");

  const [berandaFilterKec, setBerandaFilterKec] = useState("Semua");
  const [berandaFilterCat, setBerandaFilterCat] = useState("Semua");
  const [berandaFilterBranch, setBerandaFilterBranch] = useState("Semua");

  const [dbSort, setDbSort] = useState("name_asc"); // State baru untuk fitur sortir database

  const [expandedDashCats, setExpandedDashCats] = useState({ TKQ: true, TPQ: false, TQA: false });
  const toggleDashCat = (cat) => setExpandedDashCats(prev => ({ ...prev, [cat]: !prev[cat] }));

  // State untuk Accordion di panel Admin Kabupaten
  const [adminAcc, setAdminAcc] = useState({ kec: false, juri: false, settings: false });

  const [scoringMode, setScoringMode] = useState("rinci");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const getBadkoLogoUrl = (district) => appSettings?.badkoLogos?.[district] || DEFAULT_BADKO_LOGO;

  // --- LOGIKA AUTO FULLSCREEN PADA KLIK PERTAMA ---
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleFirstClick = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.log("Browser memblokir auto-fullscreen:", err);
        });
      }
      // Hapus event listener agar tidak terus-terusan meminta fullscreen setiap kali diklik
      document.removeEventListener('click', handleFirstClick);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('click', handleFirstClick);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('click', handleFirstClick);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    if (currentRole.id === "ADMIN_KEC") {
      setScoringFilterKec(userDistrict);
      setFilterDistrictGlobal(userDistrict);
      setBerandaFilterKec(userDistrict);
      setActiveLevel("kecamatan");
      setImportTargetDistrict(userDistrict); // Set target dist untuk fitur import
    } else if (currentRole.id === "JURI") {
      if (userDistrict === "Kabupaten") {
        setScoringFilterKec("Semua");
        setActiveLevel("kabupaten");
      } else {
        setScoringFilterKec(userDistrict);
        setActiveLevel("kecamatan");
      }
      setScoringFilterLomba(userBranch);
      
      const foundCat = Object.keys(BRANCH_DATA).find(cat => 
        BRANCH_DATA[cat].some(b => b.id === userBranch)
      );
      if (foundCat) setFilterCategory(foundCat);
      
    } else if (currentRole.id === "ADMIN_KAB") {
      setActiveLevel("kabupaten");
      setImportTargetDistrict(""); // Biarkan admin kab pilih sendiri
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
    const appSetRef = doc(db, "artifacts", appId, "public", "data", "config", "app_settings");

    const unsubP = onSnapshot(pRef, (snap) => setParticipants(snap.docs.map(d => ({ id: d.id, ...d.data() }))), () => {});
    const unsubS = onSnapshot(sRef, (snap) => {
      const s = {}; snap.forEach(d => s[d.id] = d.data().values); setScores(s);
    }, () => {});
    const unsubC = onSnapshot(cRef, (d) => {
      if (d.exists()) setPasswords(d.data());
    }, () => {});
    const unsubAS = onSnapshot(appSetRef, (d) => {
      if (d.exists()) setAppSettings(d.data());
    }, () => {});
    return () => { unsubP(); unsubS(); unsubC(); unsubAS(); };
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

  // --- LOGIKA KLASEMEN JUARA UMUM ---
  const juaraUmumData = useMemo(() => {
      const standings = {};
      
      const isKabupatenLevel = activeLevel === 'kabupaten';
      const entities = isKabupatenLevel 
          ? KECAMATAN_LIST 
          : [...new Set(participants.filter(p => (filterDistrictGlobal === "Semua" || p.district === filterDistrictGlobal)).map(p => p.institution))];

      entities.forEach(ent => {
         standings[ent] = { name: ent, gold: 0, silver: 0, bronze: 0, points: 0, tieBreakerScore: 0 };
      });

      participants.filter(p => (p.level || "kecamatan") === activeLevel && (filterDistrictGlobal === "Semua" || p.district === filterDistrictGlobal)).forEach(p => {
         if (p.branchId.includes('tartil') || p.branchId.includes('tilawah')) {
             const pScores = scores[p.id] || [];
             const total = pScores.reduce((a,b)=>a+b, 0);
             const key = isKabupatenLevel ? p.district : p.institution;
             if (standings[key]) standings[key].tieBreakerScore += total;
         }
      });

      Object.keys(resultsData).forEach(branchId => {
         const w = resultsData[branchId];
         ["PA", "PI", "Group"].forEach(g => {
             if (w[g] && w[g].length > 0) {
                 const sorted = [...w[g]].sort((a,b) => b.total - a.total);
                 if (sorted[0] && sorted[0].total > 0) {
                     const key = isKabupatenLevel ? sorted[0].district : sorted[0].institution;
                     if (standings[key]) { standings[key].gold += 1; standings[key].points += 5; }
                 }
                 if (sorted[1] && sorted[1].total > 0) {
                     const key = isKabupatenLevel ? sorted[1].district : sorted[1].institution;
                     if (standings[key]) { standings[key].silver += 1; standings[key].points += 3; }
                 }
                 if (sorted[2] && sorted[2].total > 0) {
                     const key = isKabupatenLevel ? sorted[2].district : sorted[2].institution;
                     if (standings[key]) { standings[key].bronze += 1; standings[key].points += 1; }
                 }
             }
         });
      });

      return Object.values(standings)
          .filter(s => s.points > 0 || s.tieBreakerScore > 0)
          .sort((a, b) => {
              if (b.points !== a.points) return b.points - a.points;
              return b.tieBreakerScore - a.tieBreakerScore;
          });

  }, [resultsData, participants, scores, activeLevel, filterDistrictGlobal]);

  const notify = (msg, type = "success") => {
    setNotification({ msg: String(msg), type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handlePromoteWinners = async () => {
    if (!confirm("Tarik seluruh Juara 1 tingkat kecamatan ke kabupaten? Nilai lama akan dihapus.")) return;
    notify("Sedang memproses tarikan data...", "success");
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
  };

  // --- FUNGSI UNDUH EXCEL ---
  const handleDownloadExcel = async () => {
    notify("Menyiapkan file Excel, mohon tunggu...");
    try {
      const XLSX = await loadXLSX();
      const wb = XLSX.utils.book_new();
      
      const dataToExport = participants.filter(p => (!userDistrict || p.district === userDistrict) && (p.level || "kecamatan") === activeLevel);
      const categories = ["TKQ", "TPQ", "TQA"];
      let hasData = false;

      categories.forEach(cat => {
         BRANCH_DATA[cat].forEach(branch => {
            const list = dataToExport.filter(p => p.branchId === branch.id);
            if (list.length === 0) return;
            hasData = true;

            const wsData = [
               ["No", "No. Peserta", "Nama Peserta", "Tanggal Lahir", "Jenis Kelamin", "Unit LPQ", "Kecamatan", "Cabang Lomba", "Kategori Usia"]
            ];

            let no = 1;
            list.forEach(p => {
               const mDataList = p.membersData || p.members.map(name => ({ name, birthDate: "-", gender: p.gender }));
               
               mDataList.forEach((m, idx) => {
                  const isGroup = p.type === 'group';
                  let displayedGender = "-";
                  if (m.gender === "PA" || p.gender === "PA") displayedGender = "Putra";
                  if (m.gender === "PI" || p.gender === "PI") displayedGender = "Putri";
                  
                  wsData.push([
                     no++,
                     isGroup ? `${p.id}-${idx+1}` : p.id,
                     typeof m === 'object' ? m.name : m,
                     m.birthDate || "-",
                     displayedGender,
                     p.institution,
                     p.district,
                     p.branchName,
                     p.category
                  ]);
               });
            });

            const ws = XLSX.utils.aoa_to_sheet(wsData);
            ws['!cols'] = [{wch: 5}, {wch: 20}, {wch: 35}, {wch: 15}, {wch: 15}, {wch: 25}, {wch: 20}, {wch: 30}, {wch: 15}];
            
            let sheetName = `${cat}-${branch.name}`.substring(0, 31).replace(/[\\/?*\[\]]/g, '');
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
         });
      });

      if (!hasData) {
         notify("Tidak ada data peserta untuk diunduh", "error");
         return;
      }

      const fileName = `Data_Peserta_FASI_${userDistrict || 'Kabupaten'}_${activeLevel === 'kabupaten' ? 'Final' : 'Seleksi'}.xlsx`;
      XLSX.writeFile(wb, fileName);
      notify("Berhasil mengunduh Excel!");
    } catch (err) {
      console.error(err);
      notify("Gagal membuat file Excel", "error");
    }
  };

  // --- FUNGSI IMPOR EXCEL ---
  const handleDownloadTemplate = async () => {
    try {
      notify("Menyiapkan template Excel...");
      const XLSX = await loadXLSX();
      const wb = XLSX.utils.book_new();

      // Sheet 1: Peserta Tunggal
      const wsTunggalData = [
        ["Nama Peserta", "Tanggal Lahir (YYYY-MM-DD)", "Jenis Kelamin (PA/PI)", "Unit LPQ", "Kode Lomba"],
        ["Ahmad Fatih", "2015-08-15", "PA", "TPQ Al-Ikhlas", "tkq_tartil"],
        ["Aisyah Putri", "2016-02-20", "PI", "TPQ An-Nur", "tkq_mewarnai"]
      ];
      const wsTunggal = XLSX.utils.aoa_to_sheet(wsTunggalData);
      wsTunggal['!cols'] = [{wch: 25}, {wch: 25}, {wch: 20}, {wch: 25}, {wch: 20}];
      XLSX.utils.book_append_sheet(wb, wsTunggal, "Peserta_Tunggal");

      // Sheet 2: Peserta Regu
      const wsReguData = [
        ["Unit LPQ", "Kode Lomba", "Nama Anggota 1", "Tgl Lahir 1 (YYYY-MM-DD)", "Gender 1 (PA/PI)", "Nama Anggota 2", "Tgl Lahir 2 (YYYY-MM-DD)", "Gender 2 (PA/PI)", "Nama Anggota 3", "Tgl Lahir 3 (YYYY-MM-DD)", "Gender 3 (PA/PI)"],
        ["TPQ An-Nur", "tpq_nasyid", "Budi", "2014-05-10", "PA", "Candra", "2014-06-11", "PA", "Dika", "2014-07-12", "PA"],
        ["TPQ Al-Hidayah", "tkq_puitisasi", "Siti", "2016-01-10", "PI", "Aminah", "2016-03-05", "PI", "", "", ""]
      ];
      const wsRegu = XLSX.utils.aoa_to_sheet(wsReguData);
      wsRegu['!cols'] = [{wch: 25}, {wch: 20}, {wch: 25}, {wch: 25}, {wch: 20}, {wch: 25}, {wch: 25}, {wch: 20}, {wch: 25}, {wch: 25}, {wch: 20}];
      XLSX.utils.book_append_sheet(wb, wsRegu, "Peserta_Regu");

      // Sheet 3: Referensi Kode
      const refData = [["Kategori", "Kode Lomba", "Tipe Peserta", "Nama Lomba"]];
      ALL_BRANCHES.forEach(b => {
         const cat = b.id.split('_')[0].toUpperCase();
         refData.push([cat, b.id, b.type === 'single' ? 'Tunggal' : 'Regu', b.name]);
      });
      const wsRef = XLSX.utils.aoa_to_sheet(refData);
      wsRef['!cols'] = [{wch: 15}, {wch: 20}, {wch: 15}, {wch: 35}];
      XLSX.utils.book_append_sheet(wb, wsRef, "Referensi_Kode_Lomba");

      XLSX.writeFile(wb, "Template_Impor_Peserta_FASI.xlsx");
    } catch (e) {
      console.error(e);
      notify("Gagal mengunduh template", "error");
    }
  };

  const handleProcessImport = async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    if(!importTargetDistrict) {
      e.target.value = null;
      return notify("Pilih kecamatan target impor terlebih dahulu!", "error");
    }

    notify("Membaca file Excel...");
    try {
      const XLSX = await loadXLSX();
      const reader = new FileReader();
      
      reader.onload = async (evt) => {
         try {
           const bstr = evt.target.result;
           const wb = XLSX.read(bstr, {type: 'binary'});
           
           if(!wb.SheetNames.includes("Peserta_Tunggal") && !wb.SheetNames.includes("Peserta_Regu")) {
              notify("Format file tidak valid. Gunakan template terbaru yang diunduh dari sistem.", "error");
              return;
           }

           const batch = writeBatch(db);
           let count = 0;
           let errCount = 0;

           const processRowBirthDate = (rawBirth) => {
              if(!rawBirth) return "-";
              let bd = String(rawBirth);
              if(bd.includes('/')) bd = bd.replace(/\//g, '-');
              return bd;
           };

           // 1. Proses Sheet Peserta Tunggal
           if (wb.SheetNames.includes("Peserta_Tunggal")) {
              const dataTunggal = XLSX.utils.sheet_to_json(wb.Sheets["Peserta_Tunggal"], { raw: false });
              for(const row of dataTunggal) {
                 const name = row['Nama Peserta'];
                 const rawBirth = row['Tanggal Lahir (YYYY-MM-DD)'];
                 const gender = row['Jenis Kelamin (PA/PI)'];
                 const inst = row['Unit LPQ'];
                 const branchId = row['Kode Lomba'];

                 if(!name || !gender || !inst || !branchId) { errCount++; continue; }
                 
                 const branchInfo = ALL_BRANCHES.find(b => b.id === branchId);
                 if(!branchInfo || branchInfo.type !== 'single') { errCount++; continue; }

                 const pId = `FASI-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
                 const derivedCategory = branchId.split('_')[0].toUpperCase();
                 const membersData = [{ name, birthDate: processRowBirthDate(rawBirth), gender }];
                 
                 batch.set(doc(db, "artifacts", appId, "public", "data", "participants", pId), {
                    name, members: [name], membersData, institution: inst, district: importTargetDistrict,
                    gender, category: derivedCategory, branchId, branchName: branchInfo.name, type: "single", createdAt: Date.now(), level: "kecamatan"
                 });
                 count++;
              }
           }

           // 2. Proses Sheet Peserta Regu
           if (wb.SheetNames.includes("Peserta_Regu")) {
              const dataRegu = XLSX.utils.sheet_to_json(wb.Sheets["Peserta_Regu"], { raw: false });
              for(const row of dataRegu) {
                 const inst = row['Unit LPQ'];
                 const branchId = row['Kode Lomba'];

                 if(!inst || !branchId) { errCount++; continue; }
                 
                 const branchInfo = ALL_BRANCHES.find(b => b.id === branchId);
                 if(!branchInfo || branchInfo.type !== 'group') { errCount++; continue; }

                 const membersData = [];
                 for(let i=1; i<=3; i++) {
                    const mName = row[`Nama Anggota ${i}`];
                    const mBirth = row[`Tgl Lahir ${i} (YYYY-MM-DD)`];
                    const mGender = row[`Gender ${i} (PA/PI)`];

                    if(mName && mName.trim() !== "") {
                       membersData.push({
                          name: mName.trim(),
                          birthDate: processRowBirthDate(mBirth),
                          gender: mGender || "PA"
                       });
                    }
                 }

                 if(membersData.length === 0) { errCount++; continue; }

                 const pId = `FASI-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
                 const derivedCategory = branchId.split('_')[0].toUpperCase();
                 
                 batch.set(doc(db, "artifacts", appId, "public", "data", "participants", pId), {
                    name: `Regu ${inst}`, members: membersData.map(m => m.name), membersData, institution: inst, district: importTargetDistrict,
                    gender: "Group", category: derivedCategory, branchId, branchName: branchInfo.name, type: "group", createdAt: Date.now(), level: "kecamatan"
                 });
                 count++;
              }
           }

           if(count > 0) {
              await batch.commit();
              notify(`Berhasil mengimpor ${count} data. Terdapat ${errCount} baris tidak valid dilewati.`);
           } else {
              notify("Tidak ada data valid yang dapat diimpor", "error");
           }
           setImportModal(false);

         } catch(err) {
           console.error(err);
           notify("Format tabel Excel tidak sesuai. Harap gunakan template terbaru.", "error");
         }
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      console.error(err);
      notify("Gagal memuat sistem pemrosesan Excel", "error");
    }
    e.target.value = null;
  };

  // --- Fungsi Update Settings (Logo & Reg Status) ---
  const handleToggleRegistration = async (district) => {
    const currentStatus = appSettings?.regStatus?.[district] ?? true;
    const newSettings = { ...appSettings };
    if (!newSettings.regStatus) newSettings.regStatus = {};
    newSettings.regStatus[district] = !currentStatus;
    
    setAppSettings(newSettings); 
    await setDoc(doc(db, "artifacts", appId, "public", "data", "config", "app_settings"), newSettings, { merge: true });
    notify(`Pendaftaran Kec. ${district} ${!currentStatus ? 'Dibuka' : 'Ditutup'}`);
  };

  const handleToggleHasilVisibility = async () => {
    const currentStatus = appSettings?.isHasilOpen !== false;
    const newSettings = { ...appSettings, isHasilOpen: !currentStatus };
    setAppSettings(newSettings); 
    await setDoc(doc(db, "artifacts", appId, "public", "data", "config", "app_settings"), newSettings, { merge: true });
    notify(`Halaman Hasil ${!currentStatus ? 'Dibuka' : 'Ditutup'} untuk Publik`);
  };

  const handleLogoUpload = (e, district) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250; 
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/png', 0.8);
        
        const newSettings = { ...appSettings };
        if (!newSettings.badkoLogos) newSettings.badkoLogos = {};
        newSettings.badkoLogos[district] = dataUrl;
        
        setAppSettings(newSettings); 
        await setDoc(doc(db, "artifacts", appId, "public", "data", "config", "app_settings"), newSettings, { merge: true });
        notify(`Logo Kec. ${district} berhasil diperbarui!`);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const branchId = fd.get("branchId");
    const district = fd.get("district") || userDistrict;
    const institution = fd.get("institution");

    const isRegOpen = appSettings?.regStatus?.[district] !== false;
    if (!isRegOpen) return notify("Pendaftaran untuk kecamatan ini sedang ditutup!", "error");

    if (!branchId || !regCategory || !district) return notify("Lengkapi form!", "error");
    const branchInfo = ALL_BRANCHES.find(b => b.id === branchId);
    const activeMembers = regMembers.filter(m => m.name.trim() !== "");
    const pId = `FASI-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const newP = {
      name: regType === "single" ? activeMembers[0].name : `Regu ${institution}`,
      members: activeMembers.map(m => m.name),
      membersData: activeMembers.map(m => ({ name: m.name, birthDate: m.birthDate, gender: m.gender })),
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

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editModal) return;
    
    const fd = new FormData(e.target);
    const newGlobalNumber = parseInt(fd.get("globalNumber")) || 0;
    const data = {
      institution: fd.get("institution"),
      district: fd.get("district"),
      drawNumber: parseInt(fd.get("drawNumber")) || 0,
      globalNumber: newGlobalNumber,
    };
    
    if (editModal.type === "single") {
      data.name = fd.get("name");
      data.members = [fd.get("name")];
      if (editModal.membersData) {
         data.membersData = [{ ...editModal.membersData[0], name: data.name }];
      }
    } else {
      const members = [];
      const updatedMembersData = [];
      for(let i=0; i<editModal.members.length; i++) {
        const val = fd.get(`member_${i}`);
        if(val) {
           members.push(val);
           if (editModal.membersData && editModal.membersData[i]) {
              updatedMembersData.push({ ...editModal.membersData[i], name: val });
           }
        }
      }
      data.name = `Regu ${data.institution}`;
      data.members = members;
      if (editModal.membersData) data.membersData = updatedMembersData;
    }

    try {
      const batch = writeBatch(db);

      // 1. Update data peserta utama yang sedang diedit
      batch.update(doc(db, "artifacts", appId, "public", "data", "participants", editModal.id), data);

      // 2. Sinkronisasi Nomor Kafilah/Global secara otomatis
      const pLevel = editModal.level || "kecamatan";
      const matchingParticipants = participants.filter(p => {
         if (p.id === editModal.id) return false;
         if ((p.level || "kecamatan") !== pLevel) return false;
         
         if (pLevel === "kabupaten") {
            // Jika level kabupaten, setara kan dalam 1 kecamatan
            return p.district === data.district;
         } else {
            // Jika level kecamatan, setara kan dalam 1 unit LPQ/lembaga
            return p.institution === data.institution && p.district === data.district;
         }
      });

      // Update seluruh partisipan yang matching menggunakan batch
      matchingParticipants.forEach(p => {
         if (p.globalNumber !== newGlobalNumber) {
             batch.update(doc(db, "artifacts", appId, "public", "data", "participants", p.id), { globalNumber: newGlobalNumber });
         }
      });

      await batch.commit();
      notify("Data peserta berhasil diperbarui!");
      setEditModal(null);
    } catch (err) {
      notify("Gagal memperbarui data peserta", "error");
    }
  };

  const SettingsKecamatanBlock = ({ dist }) => {
    const isRegOpen = appSettings?.regStatus?.[dist] !== false;
    const currentLogo = getBadkoLogoUrl(dist);
    return (
       <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm space-y-6 hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
             <div className="text-xs font-black text-slate-800 uppercase leading-none italic">Kecamatan {dist}</div>
          </div>
          
          <div className="space-y-4">
             <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Pendaftaran</p>
                   <p className={`text-[9px] font-bold mt-1 ${isRegOpen ? 'text-emerald-500' : 'text-red-500'}`}>{isRegOpen ? 'DIBUKA' : 'DITUTUP'}</p>
                </div>
                <button onClick={() => handleToggleRegistration(dist)} className={`transition-all ${isRegOpen ? 'text-emerald-600 drop-shadow-md' : 'text-slate-300'}`}>
                   {isRegOpen ? <ToggleRight size={36}/> : <ToggleLeft size={36}/>}
                </button>
             </div>

             <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl relative overflow-hidden group">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden p-1 relative z-10">
                   <img src={currentLogo} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 relative z-10">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Logo BADKO</p>
                   <label className="mt-1 flex items-center gap-2 text-[9px] font-bold text-emerald-600 cursor-pointer hover:underline">
                      <Upload size={12}/> Unggah File Gambar
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, dist)} />
                   </label>
                </div>
                <ImageIcon className="absolute -right-4 -bottom-4 w-20 h-20 text-slate-200 opacity-50 z-0 group-hover:scale-110 transition-transform" />
             </div>
          </div>
       </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-28 font-sans">
      <style>{`
        @media print { 
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } 
          .no-print { display: none !important; } 
          @page { size: A4 landscape; margin: 1mm; }
          body { margin: 0; }
          .print-container {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 3mm !important;
            padding: 0 !important;
            justify-content: center !important;
            align-content: flex-start !important;
            max-width: none !important;
          }
        } 
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
      
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
          
          <div className="print-container p-8 flex flex-wrap justify-center gap-4 items-start max-w-5xl mx-auto mt-4 print:mt-0">
            {selectedForPrint && (Array.isArray(selectedForPrint.members) && selectedForPrint.members.length > 0 ? selectedForPrint.members : [selectedForPrint.name]).map((m, i) => {
              const actualName = typeof m === 'object' ? (m.name || selectedForPrint.name) : m;
              return (
              <IDCardPrintBox 
                key={`${selectedForPrint.id}-${i}`} 
                p={selectedForPrint} 
                memberName={actualName} 
                memberId={selectedForPrint.type === 'group' ? `${selectedForPrint.id}-${i+1}` : selectedForPrint.id} 
                badkoLogoUrl={getBadkoLogoUrl(selectedForPrint.district)}
              />
            )})}
            {isBulkPrint && participants
              .filter(p => (!userDistrict || p.district === userDistrict) && (p.level || "kecamatan") === activeLevel)
              .flatMap(p => (Array.isArray(p.members) && p.members.length > 0 ? p.members : [p.name]).map((m, i) => {
                const actualName = typeof m === 'object' ? (m.name || p.name) : m;
                return (
                <IDCardPrintBox 
                  key={`${p.id}-${i}`} 
                  p={p} 
                  memberName={actualName} 
                  memberId={p.type === 'group' ? `${p.id}-${i+1}` : p.id} 
                  badkoLogoUrl={getBadkoLogoUrl(p.district)}
                />
            )}))}
          </div>
        </div>
      )}

      {/* OVERLAY MODAL IMPOR EXCEL */}
      {importModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[150] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[48px] p-8 md:p-12 shadow-2xl animate-in zoom-in duration-300 relative border border-slate-100">
            <button onClick={() => setImportModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-red-500 transition-colors"><LogOut size={24}/></button>
            
            <div className="flex items-center gap-4 mb-8">
               <div className="bg-emerald-100 p-4 rounded-3xl"><FileSpreadsheet className="text-emerald-600" size={32}/></div>
               <div>
                  <h3 className="font-black text-2xl uppercase text-slate-800 leading-none italic">Impor Data Santri</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Unggah dari File Excel (.xlsx)</p>
               </div>
            </div>

            <div className="space-y-8">
               <div className="bg-amber-50 p-6 rounded-3xl border border-amber-200/50 flex items-start gap-4 text-amber-800">
                  <div className="bg-white p-2 rounded-xl border border-amber-100"><FileDown className="text-amber-600" size={24}/></div>
                  <div className="flex-1">
                     <p className="font-black text-sm uppercase leading-none italic mb-2">Langkah 1: Unduh Format Tabel</p>
                     <p className="text-[10px] font-bold leading-relaxed mb-4">Wajib menggunakan template Excel ini untuk menghindari kegagalan sistem saat membaca kolom. Isi data sesuai panduan yang tertera di dalam file.</p>
                     <button onClick={handleDownloadTemplate} className="bg-amber-600 text-white px-6 py-2.5 rounded-full font-black text-[9px] uppercase shadow-md flex items-center gap-2 hover:bg-amber-700 active:scale-95 transition-all"><Download size={14}/> Unduh Template (.xlsx)</button>
                  </div>
               </div>

               <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 flex items-start gap-4">
                  <div className="bg-white p-2 rounded-xl border border-emerald-100"><FileUp className="text-emerald-600" size={24}/></div>
                  <div className="flex-1 w-full">
                     <p className="font-black text-sm uppercase text-slate-800 leading-none italic mb-2">Langkah 2: Unggah Data</p>
                     <p className="text-[10px] font-bold text-slate-500 mb-4">Pilih wilayah kecamatan dan unggah file yang telah diisi dengan benar.</p>
                     
                     <div className="space-y-4">
                        <div>
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Kecamatan Target</label>
                           <select 
                             className="w-full p-4 bg-white rounded-2xl font-black text-xs border border-slate-200 outline-none focus:ring-4 focus:ring-emerald-100 shadow-sm"
                             value={importTargetDistrict} 
                             onChange={e => setImportTargetDistrict(e.target.value)}
                             disabled={currentRole.id === "ADMIN_KEC"}
                           >
                             <option value="" disabled>Pilih Kecamatan</option>
                             {KECAMATAN_LIST.map(k => <option key={k} value={k}>{k}</option>)}
                           </select>
                        </div>
                        
                        <div className="relative border-2 border-dashed border-emerald-300 bg-white rounded-[24px] p-6 text-center hover:bg-emerald-50 transition-colors group">
                           <input type="file" accept=".xlsx, .xls, .csv" onChange={handleProcessImport} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                           <Upload size={32} className="mx-auto text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
                           <p className="font-black text-xs uppercase text-emerald-700 leading-none mb-1">Klik atau Tarik File Kesini</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase">Maksimal 5MB</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
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
                    {editModal.members.map((m, i) => {
                      const mName = typeof m === 'object' ? m.name : m;
                      return (
                      <input key={i} name={`member_${i}`} defaultValue={mName} placeholder={`Nama Anggota ${i+1}`} className="w-full p-5 bg-slate-50 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-emerald-100 border border-slate-200" required={i === 0} />
                    )})}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                   <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nomor Urut Lomba</div>
                   <input type="number" name="drawNumber" defaultValue={editModal.drawNumber || ""} placeholder="Contoh: 1" className="w-full p-5 bg-white rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-emerald-100 border border-slate-200 shadow-sm" />
                </div>
                <div>
                   <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nomor Kafilah / Global</div>
                   <input type="number" name="globalNumber" defaultValue={editModal.globalNumber || ""} placeholder="Contoh: 12" className="w-full p-5 bg-white rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-emerald-100 border border-slate-200 shadow-sm" />
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
              <div className="w-12 h-12 shrink-0">
                <img src={FASI_LOGO_URL} alt="Logo FASI" className="w-full h-full object-contain drop-shadow-md" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">FASI IX BATANG</h1>
                <div className="flex items-center gap-2 mt-1">
                   <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-widest">{currentRole.name}</span>
                   {userDistrict && <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">• {userDistrict}</span>}
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
              <img src={FASI_LOGO_URL} alt="Logo FASI" className="w-28 md:w-32 h-auto mx-auto mb-8 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic mb-4 leading-none">FESTIVAL ANAK SHOLEH INDONESIA</h2>
              <p className="text-emerald-100 max-w-lg mx-auto mb-10 text-sm md:text-base leading-relaxed opacity-90 italic">Menyiapkan Generasi Islami, Smart, Beradab, dan Berjiwa Quráni</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => setActiveTab("pendaftaran")} className="bg-white text-emerald-900 px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Daftar Sekarang</button>
                {currentRole.id !== "PUBLIK" || appSettings?.isHasilOpen !== false ? (
                  <button onClick={() => setActiveTab("hasil")} className="bg-emerald-800 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest border border-emerald-700 hover:bg-emerald-700 transition-all">Lihat Hasil</button>
                ) : (
                  <button disabled title="Rekapitulasi ditutup sementara" className="bg-slate-800 text-slate-400 px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest border border-slate-700 cursor-not-allowed transition-all flex items-center justify-center gap-2"><Lock size={16}/> Hasil Ditutup</button>
                )}
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
                    <button 
                      onClick={() => toggleDashCat(cat)} 
                      className="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
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
               <div className="bg-emerald-100 p-3 rounded-2xl"><UserPlus className="text-emerald-600" /></div> Pendaftaran Peserta Baru
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
                  {KECAMATAN_LIST.map(k => {
                     const isOpen = appSettings?.regStatus?.[k] !== false;
                     return <option key={k} value={k} disabled={!isOpen}>{k} {!isOpen && '(DITUTUP)'}</option>;
                  })}
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
                        {currentRole.id === "JURI" ? `${userDistrict === "Kabupaten" ? 'Final Kabupaten' : `Kec. ${userDistrict}`} • ${ALL_BRANCHES.find(b => b.id === userBranch)?.name || 'Juri'}` : `Admin Panel • ${currentRole.name}`}
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
                 const list = scoringParticipants
                    .filter(p => p.branchId === branch.id)
                    .sort((a, b) => (a.drawNumber || 9999) - (b.drawNumber || 9999));
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
                                        <div className="text-[10px] font-bold text-emerald-600 uppercase leading-none truncate italic bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">No. Urut: {p.drawNumber || '-'}</div>
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
             
             {currentRole.id === "PUBLIK" && appSettings?.isHasilOpen === false ? (
                 <div className="p-20 text-center bg-white rounded-[48px] border border-dashed border-slate-200 mt-10 shadow-sm animate-in zoom-in">
                    <Lock size={64} className="mx-auto text-slate-300 mb-6" />
                    <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tighter mb-2 italic">Klasemen Ditutup Sementara</h2>
                    <p className="font-bold text-xs uppercase text-slate-400 tracking-widest italic leading-none max-w-md mx-auto">Panitia sedang memproses atau meninjau rekapitulasi nilai akhir. Harap bersabar menunggu hasil resmi dibuka kembali.</p>
                 </div>
             ) : (
               <>
                 {/* KLASEMEN JUARA UMUM (NEW SECTION) */}
                 {juaraUmumData.length > 0 && (
                    <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-1 md:p-2 rounded-[48px] shadow-2xl mb-12">
                       <div className="bg-white rounded-[40px] p-8 md:p-10 border border-amber-200/50">
                          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
                             <div className="flex items-center gap-5">
                                <div className="bg-amber-100 text-amber-600 p-4 rounded-3xl shadow-inner border border-amber-200"><Crown size={36}/></div>
                                <div>
                                   <h2 className="text-3xl font-black uppercase tracking-tighter leading-none text-slate-800 italic">Klasemen Juara Umum</h2>
                                   <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-2 italic">Berdasarkan Total Poin Medali {activeLevel === 'kabupaten' ? 'Antar Kecamatan' : 'Antar Unit LPQ'}</p>
                                </div>
                             </div>
                          </div>

                          <div className="overflow-x-auto">
                             <table className="w-full text-left">
                                <thead className="bg-amber-50 text-[10px] font-black text-amber-800 uppercase tracking-widest border-b border-amber-100">
                                   <tr>
                                      <th className="p-6 text-center rounded-tl-2xl">Rank</th>
                                      <th className="p-6">{activeLevel === 'kabupaten' ? 'Kafilah Kecamatan' : 'Utusan Unit LPQ'}</th>
                                      <th className="p-6 text-center">Emas (5)</th>
                                      <th className="p-6 text-center">Perak (3)</th>
                                      <th className="p-6 text-center">Perunggu (1)</th>
                                      <th className="p-6 text-center bg-amber-100 rounded-tr-2xl">Total Poin</th>
                                   </tr>
                                </thead>
                                <tbody className="divide-y divide-amber-50">
                                   {juaraUmumData.map((stand, index) => (
                                      <tr key={stand.name} className={`hover:bg-amber-50/50 transition-colors ${index === 0 ? 'bg-amber-50/80' : ''}`}>
                                         <td className="p-6 text-center">
                                            {index === 0 ? (
                                               <div className="w-10 h-10 mx-auto bg-amber-400 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-md border-2 border-white">1</div>
                                            ) : index === 1 ? (
                                               <div className="w-10 h-10 mx-auto bg-slate-300 text-slate-700 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner border-2 border-white">2</div>
                                            ) : index === 2 ? (
                                               <div className="w-10 h-10 mx-auto bg-orange-300 text-orange-900 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner border-2 border-white">3</div>
                                            ) : (
                                               <div className="font-black text-slate-400 text-lg">{index + 1}</div>
                                            )}
                                         </td>
                                         <td className="p-6">
                                            <div className={`font-black text-lg uppercase leading-none ${index === 0 ? 'text-amber-600' : 'text-slate-800'}`}>{stand.name}</div>
                                            {/* Tampilkan indikator tie-breaker jika punya poin Tartil/Tilawah */}
                                            <div className="text-[9px] font-bold text-slate-400 uppercase mt-1 italic">Tie-Breaker (Tartil/Tilawah): {stand.tieBreakerScore}</div>
                                         </td>
                                         <td className="p-6 text-center font-black text-amber-500 text-xl">{stand.gold}</td>
                                         <td className="p-6 text-center font-black text-slate-400 text-xl">{stand.silver}</td>
                                         <td className="p-6 text-center font-black text-orange-400 text-xl">{stand.bronze}</td>
                                         <td className="p-6 text-center font-black text-amber-700 text-3xl tracking-tighter bg-amber-50/50">{stand.points}</td>
                                      </tr>
                                   ))}
                                </tbody>
                             </table>
                          </div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-6 text-center italic">* Sesuai Pasal 15: Jika poin sama, diurutkan berdasarkan akumulasi skor tertinggi pada cabang Tartil/Tilawah.</p>
                       </div>
                    </div>
                 )}

                 <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-slate-200 text-slate-600 p-3 rounded-2xl shadow-inner border border-white"><Trophy size={28}/></div>
                      <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter leading-none text-slate-800 italic">Juara Per Cabang</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Rincian Perolehan Medali per Kategori</p>
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
                                                 <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-amber-400 text-white shadow-md' : i === 1 ? 'bg-slate-300 text-slate-700' : 'bg-orange-300 text-orange-900'}`}>{i+1}</div>
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
               </>
             )}
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

            {/* MANAJEMEN PENDAFTARAN & LOGO KECAMATAN (KHUSUS ADMIN KECAMATAN) */}
            {currentRole.id === "ADMIN_KEC" && userDistrict && (
              <div className="bg-white rounded-[48px] border border-slate-200 overflow-hidden shadow-2xl animate-in zoom-in duration-500">
                 <div className="p-8 md:p-10 bg-slate-900 text-white flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter italic">Pendaftaran & Logo ID Card</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Kustomisasi untuk Kecamatan {userDistrict}</p>
                    </div>
                    <ImageIcon size={32} className="opacity-30" />
                 </div>
                 <div className="p-6 md:p-10 bg-slate-50">
                    <SettingsKecamatanBlock dist={userDistrict} />
                 </div>
              </div>
            )}

            <div className="bg-white rounded-[48px] border border-slate-200 overflow-hidden shadow-sm">
               <div className="p-10 border-b border-slate-100 bg-slate-50 flex flex-col xl:flex-row justify-between items-center gap-6">
                  <div className="text-center xl:text-left flex-1">
                    <h3 className="font-black text-2xl uppercase tracking-tighter text-slate-800 leading-none italic">Database Santri</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">{activeLevel === 'kabupaten' ? '🏆 Finalis Tingkat Kabupaten' : '🚩 Peserta Seleksi Kecamatan'}</p>
                  </div>
                  
                  {/* Dropdown Sortir Database */}
                  <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                      <ListFilter size={16} className="text-slate-400" />
                      <select className="bg-transparent text-[10px] font-black uppercase text-slate-600 outline-none cursor-pointer" value={dbSort} onChange={(e) => setDbSort(e.target.value)}>
                         <option value="name_asc">Urut Nama (A-Z)</option>
                         <option value="name_desc">Urut Nama (Z-A)</option>
                         <option value="inst_asc">Urut Lembaga</option>
                         <option value="branch_asc">Urut Cabang Lomba</option>
                         <option value="draw_asc">Urut No. Urut Lomba</option>
                         <option value="global_asc">Urut No. Kafilah/Global</option>
                      </select>
                  </div>

                  <div className="flex flex-wrap justify-center gap-4 shrink-0">
                     <button onClick={() => setImportModal(true)} className="bg-emerald-100 text-emerald-700 px-6 md:px-8 py-3 md:py-4 rounded-full font-black text-[10px] uppercase border border-emerald-200 flex items-center gap-2 hover:bg-emerald-200 active:scale-95 transition-all"><FileSpreadsheet size={16}/> Impor Data</button>
                     <button onClick={handleDownloadExcel} className="bg-blue-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-black text-[10px] uppercase shadow-lg shadow-blue-200 flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all"><Download size={16}/> Unduh Excel</button>
                     <button onClick={() => setIsBulkPrint(true)} className="bg-emerald-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-black text-[10px] uppercase shadow-lg shadow-emerald-200 flex items-center gap-2 hover:bg-emerald-700 active:scale-95 transition-all"><Printer size={16}/> Cetak Masal</button>
                  </div>
               </div>
               <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <tr><th className="p-8">Profil Santri</th><th className="p-8">Unit Lembaga</th><th className="p-8 text-center">Aksi (Edit / Cetak / Hapus)</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {participants
                          .filter(p => (!userDistrict || p.district === userDistrict) && (p.level || "kecamatan") === activeLevel)
                          .sort((a, b) => {
                             if (dbSort === "name_asc") return a.name.localeCompare(b.name);
                             if (dbSort === "name_desc") return b.name.localeCompare(a.name);
                             if (dbSort === "inst_asc") return a.institution.localeCompare(b.institution);
                             if (dbSort === "branch_asc") return a.branchName.localeCompare(b.branchName);
                             if (dbSort === "draw_asc") return (a.drawNumber || 9999) - (b.drawNumber || 9999);
                             if (dbSort === "global_asc") return (a.globalNumber || 9999) - (b.globalNumber || 9999);
                             return 0;
                          })
                          .map(p => (
                         <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                           <td className="p-8">
                              <div className="font-black text-lg text-slate-800 uppercase leading-none mb-3 group-hover:text-emerald-700 transition-all italic">{p.name}</div>
                              <div className="flex flex-wrap gap-2">
                                <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase leading-none italic ${p.gender === 'PA' ? 'bg-blue-100 text-blue-700' : p.gender === 'PI' ? 'bg-pink-100 text-pink-700' : 'bg-slate-200 text-slate-700'}`}>{p.gender === 'PA' ? 'Putra' : p.gender === 'PI' ? 'Putri' : 'Regu'}</span>
                                <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full uppercase leading-none italic">{p.category}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase leading-none self-center italic">{p.branchName}</span>
                                {p.drawNumber > 0 && <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-3 py-1 rounded-full uppercase leading-none italic">No. Urut: {p.drawNumber}</span>}
                                {p.globalNumber > 0 && <span className="text-[9px] font-black text-purple-700 bg-purple-100 px-3 py-1 rounded-full uppercase leading-none italic">Kafilah: {p.globalNumber}</span>}
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
                 <div className="p-8 md:p-10 bg-slate-900 text-white flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter italic">Pengaturan Password Juri Lomba</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Wilayah Kecamatan: {userDistrict}</p>
                    </div>
                    <KeyRound size={32} className="opacity-30" />
                 </div>
                 <div className="p-6 md:p-10 space-y-10 bg-slate-50">
                    {["TKQ", "TPQ", "TQA"].map(cat => (
                        <div key={cat} className="space-y-4">
                           <div className="flex items-center gap-3">
                              <div className="bg-slate-800 text-white px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest">{cat}</div>
                              <div className="h-px bg-slate-200 flex-1"></div>
                           </div>
                           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                              {BRANCH_DATA[cat].map(branch => {
                                 const pwdKey = `JURI_PWD_${userDistrict}_${branch.id}`;
                                 return (
                                    <div key={branch.id} className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm space-y-3 hover:border-emerald-300 transition-colors">
                                       <div className="text-[10px] font-black text-slate-500 uppercase leading-none truncate italic" title={branch.name}>{branch.name}</div>
                                       <div className="relative">
                                         <input 
                                           type="text" 
                                           placeholder="Default: juri123"
                                           className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs outline-none focus:ring-4 focus:ring-emerald-100 shadow-inner italic"
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
                    ))}
                 </div>
              </div>
            )}

            {/* BLOK MANAJEMEN KHUSUS ADMIN KABUPATEN */}
            {currentRole.id === "ADMIN_KAB" && (
              <div className="bg-white rounded-[48px] border border-slate-200 overflow-hidden shadow-2xl animate-in zoom-in duration-500">
                 <div className="p-8 md:p-10 bg-slate-900 text-white flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter italic">Manajemen Sistem</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Akses Super Admin Kabupaten</p>
                    </div>
                    <ShieldCheck size={32} className="opacity-30" />
                 </div>
                 
                 <div className="p-6 md:p-10 space-y-6 bg-slate-50">
                    
                    {/* ACCORDION 0: PUBLIKASI HASIL */}
                    <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm transition-all duration-300">
                       <div className="p-6 md:p-8 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="bg-indigo-100 text-indigo-600 p-3 rounded-2xl"><Eye size={24}/></div>
                             <div className="text-left">
                                <div className="font-black text-sm uppercase text-slate-800 italic leading-none">Publikasi Klasemen Hasil</div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase mt-1">Buka/Tutup halaman Rekapitulasi Juara untuk akun Publik</div>
                             </div>
                          </div>
                          <button onClick={handleToggleHasilVisibility} className={`transition-all ${appSettings?.isHasilOpen !== false ? 'text-indigo-600 drop-shadow-md' : 'text-slate-300'}`}>
                             {appSettings?.isHasilOpen !== false ? <ToggleRight size={36}/> : <ToggleLeft size={36}/>}
                          </button>
                       </div>
                    </div>

                    {/* ACCORDION 1: STATUS PENDAFTARAN & LOGO KECAMATAN */}
                    <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm transition-all duration-300">
                       <button onClick={() => setAdminAcc(p => ({...p, settings: !p.settings}))} className="w-full p-6 md:p-8 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-4">
                             <div className="bg-emerald-100 text-emerald-600 p-3 rounded-2xl"><ImageIcon size={24}/></div>
                             <div className="text-left">
                                <div className="font-black text-sm uppercase text-slate-800 italic leading-none">Pendaftaran & Logo Kecamatan</div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase mt-1">Buka/Tutup Pendaftaran & Atur Logo BADKO per Daerah</div>
                             </div>
                          </div>
                          <div className="bg-slate-100 p-2 rounded-full text-slate-400">
                             {adminAcc.settings ? <ChevronDown size={20}/> : <ChevronRight size={20}/>}
                          </div>
                       </button>
                       {adminAcc.settings && (
                          <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-slate-100 bg-slate-50/50 animate-in slide-in-from-top-2 duration-300">
                             {KECAMATAN_LIST.map(kec => <SettingsKecamatanBlock key={kec} dist={kec} />)}
                          </div>
                       )}
                    </div>

                    {/* ACCORDION 2: ADMIN KECAMATAN (PASSWORD) */}
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
                                          placeholder={`Default: admin${kec.toLowerCase()}`}
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

                    {/* ACCORDION 3: JURI KABUPATEN */}
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
                                                   placeholder="Default: jurikab123"
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
                 <h3 className="font-black text-2xl uppercase tracking-tighter mb-8 text-slate-800 leading-none italic">Pilih Wilayah</h3>
                 <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2 no-scrollbar mb-8">
                   {authModal.id === "JURI" && (
                     <button onClick={() => setAuthModal({...authModal, step: 1.3, district: "Kabupaten"})} className="col-span-2 p-4 bg-amber-50 text-amber-700 rounded-2xl font-black text-[10px] uppercase hover:bg-amber-600 hover:text-white transition-all shadow-sm border border-amber-200 mb-2">🏆 Juri Final Kabupaten</button>
                   )}
                   {KECAMATAN_LIST.map(k => (
                     <button key={k} onClick={() => setAuthModal({...authModal, step: authModal.id === "JURI" ? 1.3 : 2, district: k})} className="p-4 bg-slate-50 rounded-2xl font-black text-[10px] uppercase hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-slate-100">{k}</button>
                   ))}
                 </div>
                 <button onClick={() => setAuthModal(null)} className="text-slate-400 font-black text-xs uppercase tracking-widest leading-none italic">Batalkan</button>
               </>
             ) : authModal.step === 1.3 ? (
               <>
                 <h3 className="font-black text-2xl uppercase tracking-tighter mb-8 text-slate-800 leading-none italic">Pilih Kategori Usia</h3>
                 <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2 no-scrollbar mb-8">
                   {["TKQ", "TPQ", "TQA"].map(cat => (
                     <button key={cat} onClick={() => setAuthModal({...authModal, step: 1.6, category: cat})} className="p-4 bg-slate-50 rounded-2xl font-black text-[10px] uppercase hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-slate-100 italic">{cat}</button>
                   ))}
                 </div>
                 <button onClick={() => setAuthModal({...authModal, step: 1})} className="text-slate-400 font-black text-[9px] uppercase tracking-widest leading-none underline italic">Kembali Pilih Kecamatan</button>
               </>
             ) : authModal.step === 1.6 ? (
               <>
                 <h3 className="font-black text-2xl uppercase tracking-tighter mb-8 text-slate-800 italic leading-none italic">Cabang Lomba {authModal.category}</h3>
                 <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2 no-scrollbar mb-8">
                   {BRANCH_DATA[authModal.category]?.map(b => (
                     <button key={b.id} onClick={() => setAuthModal({...authModal, step: 2, branch: b.id})} className="p-4 bg-slate-50 rounded-2xl font-black text-[10px] uppercase hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-slate-100 italic">{b.name}</button>
                   ))}
                 </div>
                 <button onClick={() => setAuthModal({...authModal, step: 1.3})} className="text-slate-400 font-black text-[9px] uppercase tracking-widest leading-none underline italic">Kembali Pilih Kategori</button>
               </>
             ) : (
               <>
                 <div className="bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"><KeyRound className="text-emerald-600" size={32} /></div>
                 <h3 className="font-black text-xl uppercase tracking-tighter mb-2 text-slate-800 leading-none italic italic">Verifikasi Sandi</h3>
                 <p className="text-[9px] font-black text-slate-400 uppercase mb-8 leading-none italic italic">
                     Kec. {authModal.district} {authModal.category && `• ${authModal.category}`} {authModal.branch && `• ${ALL_BRANCHES.find(b => b.id === authModal.branch)?.name}`}
                 </p>
                 <input type="password" autoFocus className="w-full p-6 bg-slate-100 rounded-[36px] font-black text-center text-3xl mb-8 outline-none focus:ring-8 focus:ring-emerald-100 shadow-inner border border-slate-200" value={authModal.input || ""} onChange={(e) => setAuthModal({ ...authModal, input: e.target.value })} />
                 <div className="flex gap-4">
                    <button onClick={() => { 
                      let match = false;
                      if (authModal.id === "ADMIN_KAB") match = (authModal.input === (passwords.ADMIN_KAB_PWD || "adminkab123"));
                      else if (authModal.id === "ADMIN_KEC") match = (authModal.input === (passwords[`DIST_PWD_${authModal.district}`] || `admin${authModal.district.toLowerCase()}`));
                      else if (authModal.id === "JURI") {
                        const pwdKey = authModal.district === "Kabupaten" ? `JURI_PWD_KAB_${authModal.branch}` : `JURI_PWD_${authModal.district}_${authModal.branch}`;
                        const defaultPwd = authModal.district === "Kabupaten" ? "jurikab123" : "juri123";
                        match = (authModal.input === (passwords[pwdKey] || defaultPwd));
                      }
                      
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
