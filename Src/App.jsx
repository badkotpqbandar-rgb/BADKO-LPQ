import React, { useState, useEffect, useMemo } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  onSnapshot,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
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
  Building2,
  MapPin,
  Settings,
  ShieldCheck,
  X,
  Lock,
  Unlock,
  KeyRound,
  Loader2,
  Award,
  Star,
  Search,
  Hash,
  Save,
  Pencil,
  Download,
  AlertTriangle,
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

// --- DATA MASTER ---
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

const KECAMATAN_LIST = ["Batang", "Warungasem", "Wonotunggal", "Bandar", "Blado", "Reban", "Tulis", "Kandeman", "Subah", "Pecalungan", "Banyuputih", "Limpung", "Gringsing", "Tersono", "Bawang"];

const ROLES = {
  PUBLIK: { id: "PUBLIK", name: "Publik", access: ["beranda", "pendaftaran", "hasil"] },
  JURI: { id: "JURI", name: "Juri", access: ["penilaian"] },
  ADMIN: { id: "ADMIN", name: "Admin", access: ["beranda", "pendaftaran", "penilaian", "hasil", "admin"] },
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
  const { years, months, days } = age;
  const isEligible = (maxYears) => years < maxYears || (years === maxYears && months === 0 && days === 0);
  if (isEligible(7)) return ["TKQ", "TPQ", "TQA"];
  if (isEligible(12)) return ["TPQ", "TQA"];
  if (isEligible(15)) return ["TQA"];
  return ["Melebihi Batas"];
};

const IDCard = ({ p, memberName, memberId }) => (
  <div style={{ width: "6.5cm", height: "10.2cm" }} className="relative bg-white border-2 border-emerald-600 overflow-hidden flex flex-col p-2 break-inside-avoid box-border mx-auto shadow-sm">
    <div className="flex justify-between items-center mb-1 pb-1">
      <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Kementerian_Agama_new_logo.png" alt="K" className="h-5 w-5 object-contain" />
      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_BKPRMI.png/600px-Logo_BKPRMI.png" alt="F" className="h-5 w-5 object-contain mx-1" />
      <img src="https://drive.google.com/uc?export=view&id=1IFOugVQJksGBT7YY2KdXo1i4gJp7meym" alt="B" className="h-5 w-5 object-contain" />
    </div>
    <div className="text-center px-1 mb-1 border-b border-emerald-600 pb-1">
      <p className="text-[6px] font-black uppercase text-emerald-800 leading-tight">FESTIVAL ANAK SHOLEH INDONESIA (FASI) IX</p>
      <p className="text-[5px] font-bold uppercase text-slate-600 tracking-widest mt-0.5">KABUPATEN BATANG 2026</p>
    </div>
    <div className="w-[2.2cm] h-[2.8cm] mx-auto border-2 border-emerald-100 bg-slate-50 flex items-center justify-center shrink-0 mt-0.5 mb-1.5 rounded-md overflow-hidden shadow-inner">
      <UserCircle className="text-slate-300" size={36} strokeWidth={1.5} />
    </div>
    <div className="flex-1 flex flex-col items-center text-center space-y-1.5 text-[7px] uppercase font-bold text-slate-800 px-1">
      <div className="w-full">
        <p className="text-[5px] text-slate-400 uppercase tracking-widest leading-none mb-1">NAMA PESERTA</p>
        <p className="font-black text-[10px] text-emerald-700 leading-none truncate w-full">{String(memberName || p.name)}</p>
      </div>
      <div className="w-full">
        <p className="text-[5px] text-slate-400 uppercase tracking-widest leading-none mb-1">CABANG LOMBA</p>
        <p className="leading-tight line-clamp-2 w-full font-bold text-[8px]">{String(p.branchName)} <br/><span className="text-emerald-600">({String(p.category)})</span></p>
      </div>
      <div className="w-full">
        <p className="text-[5px] text-slate-400 uppercase tracking-widest leading-none mb-1">UTUSAN / LEMBAGA</p>
        <p className="leading-none truncate w-full font-bold text-[8px] text-slate-700">{String(p.institution)}</p>
        <p className="leading-tight truncate w-full text-[6px] text-slate-500 mt-1">Kecamatan {String(p.district)}</p>
      </div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 bg-emerald-600 py-1.5 text-center flex flex-col items-center border-t-2 border-emerald-700">
      <p className="text-[5px] text-emerald-100 uppercase tracking-widest mb-0.5">ID PESERTA</p>
      <p className="text-[8px] text-white font-black tracking-[0.2em] leading-none">{String(memberId || p.id)}</p>
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [scores, setScores] = useState({});
  const [passwords, setPasswords] = useState({ JURI: "juri123", ADMIN: "admin123" });
  const [activeTab, setActiveTab] = useState("beranda");
  const [notification, setNotification] = useState(null);
  const [selectedForPrint, setSelectedForPrint] = useState(null);
  const [currentRole, setCurrentRole] = useState(ROLES.PUBLIK);
  const [authModal, setAuthModal] = useState(null);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [isBulkPrint, setIsBulkPrint] = useState(false);
  const [regType, setRegType] = useState("single");
  const [regMembers, setRegMembers] = useState([{ name: "", birthDate: "", age: null, gender: "PA" }]);
  const [regCategory, setRegCategory] = useState("");
  const [allowedCategories, setAllowedCategories] = useState([]);
  const [filterCategory, setFilterCategory] = useState("TKQ");
  const [editModal, setEditModal] = useState(null);
  
  const [scoringBranchId, setScoringBranchId] = useState("all");
  const [scoringGender, setScoringGender] = useState("all");

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Cek token khusus lingkungan preview
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
          } catch (tokenErr) {
            // Jika token mismatch (biasanya karena apiKey diganti), fallback ke anonim
            console.warn("Token mismatch, falling back to anonymous...");
            await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { 
        console.error("Auth Error:", e); 
        setLoading(false); 
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => { 
      if (u) { 
        setUser(u); 
        setLoading(false); 
      } 
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const pRef = collection(db, "artifacts", appId, "public", "data", "participants");
    const sRef = collection(db, "artifacts", appId, "public", "data", "scores");
    const cRef = doc(db, "artifacts", appId, "public", "data", "config", "security");
    
    const unsubP = onSnapshot(pRef, (snap) => {
      setParticipants(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Snapshot P Error:", err));
    
    const unsubS = onSnapshot(sRef, (snap) => {
      const s = {}; 
      snap.forEach(d => s[d.id] = d.data().values); 
      setScores(s);
    }, (err) => console.error("Snapshot S Error:", err));
    
    const unsubC = onSnapshot(cRef, (d) => {
      if (d.exists()) setPasswords(d.data());
    }, (err) => console.error("Snapshot C Error:", err));
    
    return () => { unsubP(); unsubS(); unsubC(); };
  }, [user]);

  const notify = (msg, type = "success") => { setNotification({ msg: String(msg), type }); setTimeout(() => setNotification(null), 3000); };

  const handleRegister = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const branchId = fd.get("branchId");
    if (!branchId || !regCategory) return notify("Lengkapi pilihan lomba", "error");
    const branchInfo = Object.values(BRANCH_DATA).flat().find(b => b.id === branchId);
    const active = regMembers.filter(m => m.name.trim() !== "");
    const pId = `FASI-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const newP = {
      name: regType === "single" ? active[0].name : `Regu ${fd.get("institution")}`,
      members: active.map(m => ({ name: m.name, birthDate: m.birthDate, gender: m.gender, ageStr: m.age ? `${m.age.years}th ${m.age.months}bln` : "" })),
      institution: fd.get("institution"),
      district: fd.get("district"),
      gender: regType === "single" ? active[0].gender : "Group",
      category: regCategory,
      branchId,
      branchName: branchInfo.name,
      type: regType,
      createdAt: Date.now(),
    };
    try {
      await setDoc(doc(db, "artifacts", appId, "public", "data", "participants", pId), newP);
      notify("Berhasil Terdaftar!");
      setSelectedForPrint({ id: pId, ...newP });
      e.target.reset();
      setRegType("single");
      setRegMembers([{ name: "", birthDate: "", age: null, gender: "PA" }]);
      setRegCategory("");
      setAllowedCategories([]);
    } catch (err) { notify("Gagal simpan data", "error"); }
  };

  const handleUpdateParticipant = async (e) => {
    e.preventDefault();
    if (!editModal) return;
    const fd = new FormData(e.target);
    const branchId = fd.get("branchId");
    const branchInfo = Object.values(BRANCH_DATA).flat().find(b => b.id === branchId);
    const updatedData = {
      name: fd.get("name"),
      institution: fd.get("institution"),
      district: fd.get("district"),
      branchId,
      branchName: branchInfo.name,
      category: fd.get("category"),
    };
    try {
      await updateDoc(doc(db, "artifacts", appId, "public", "data", "participants", editModal.id), updatedData);
      notify("Data Diperbarui!");
      setEditModal(null);
    } catch (err) { notify("Gagal perbarui data", "error"); }
  };

  const exportToCSV = () => {
    if (participants.length === 0) return notify("Tidak ada data", "error");
    const headers = ["ID", "Nama", "Kategori", "Cabang Lomba", "Lembaga", "Kecamatan", "Tipe", "Total Skor"];
    const rows = participants.map(p => {
      const pScores = scores[p.id] || [];
      const total = pScores.reduce((a, b) => a + (Number(b) || 0), 0);
      return [p.id, p.name, p.category, p.branchName, p.institution, p.district, p.type, total].join(",");
    });
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Data_FASI_IX_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleUpdatePasswords = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newPasswords = { JURI: fd.get("juriPass"), ADMIN: fd.get("adminPass") };
    try {
      await setDoc(doc(db, "artifacts", appId, "public", "data", "config", "security"), newPasswords);
      notify("Sandi Diperbarui!");
    } catch (err) { notify("Gagal ganti sandi", "error"); }
  };

  const results = useMemo(() => {
    const branchGroups = {};
    const distPts = {};
    const instPts = {};
    KECAMATAN_LIST.forEach((k) => (distPts[k] = 0));
    participants.forEach((p) => {
      const pScores = scores[p.id] || [];
      const total = pScores.reduce((a, b) => a + (Number(b) || 0), 0);
      const hasScore = pScores.some((s) => Number(s) > 0);
      if (!branchGroups[p.branchId]) branchGroups[p.branchId] = { PA: [], PI: [], Group: [] };
      if (p.type === "group") branchGroups[p.branchId].Group.push({ ...p, total, hasScore });
      else branchGroups[p.branchId][p.gender]?.push({ ...p, total, hasScore });
    });
    Object.values(branchGroups).forEach((cat) => {
      ["PA", "PI", "Group"].forEach((g) => {
        cat[g]?.filter((p) => p.hasScore).sort((a, b) => b.total - a.total).slice(0, 3).forEach((winner, idx) => {
          const pts = [5, 3, 1][idx];
          distPts[winner.district] = (distPts[winner.district] || 0) + pts;
          instPts[winner.institution] = (instPts[winner.institution] || 0) + pts;
        });
      });
    });
    return {
      branchGroups,
      distLeaderboard: Object.entries(distPts).sort((a, b) => b[1] - a[1]).filter(x => x[1] > 0),
      instLeaderboard: Object.entries(instPts).sort((a, b) => b[1] - a[1]).filter(x => x[1] > 0),
    };
  }, [participants, scores]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-emerald-900 text-white font-black uppercase text-center p-6">
      <div className="space-y-4">
        <Loader2 className="animate-spin mx-auto" size={48} />
        <p className="animate-pulse">SINKRONISASI...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 font-sans selection:bg-emerald-100">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 1cm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {notification && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-8 py-3 rounded-full text-white font-black text-[10px] uppercase shadow-2xl transition-all ${notification.type === "error" ? "bg-red-500" : "bg-emerald-600"}`}>
          {String(notification.msg)}
        </div>
      )}

      <div className={isBulkPrint || selectedForPrint ? "no-print hidden" : ""}>
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 p-5 shadow-sm">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-600 p-2.5 rounded-2xl shadow-lg">
                <ShieldCheck className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-800 uppercase leading-none tracking-tighter">FASI IX BATANG</h1>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{String(currentRole.name)} Mode</span>
                </div>
              </div>
            </div>
            <button onClick={() => setShowRoleSwitcher(true)} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-emerald-600 transition-all"><UserCircle size={24} /></button>
          </div>
        </header>

        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-slate-200 p-2 flex gap-1 rounded-[32px] shadow-2xl z-50">
          {[
            { id: "beranda", label: "Beranda", icon: LayoutDashboard },
            { id: "pendaftaran", label: "Daftar", icon: UserPlus },
            { id: "penilaian", label: "Nilai", icon: ClipboardCheck },
            { id: "hasil", label: "Hasil", icon: Trophy },
            { id: "admin", label: "Admin", icon: Settings },
          ].filter((item) => {
            if (currentRole.id === "PUBLIK") return item.id === "beranda";
            return currentRole.access.includes(item.id);
          }).map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center px-5 py-2.5 rounded-[24px] transition-all ${activeTab === t.id ? "text-emerald-600 bg-emerald-50 shadow-inner" : "text-slate-300"}`}>
              <t.icon size={20} />
              <span className="text-[8px] font-black uppercase mt-1.5 tracking-tighter">{String(t.label)}</span>
            </button>
          ))}
        </nav>

        <main className="max-w-4xl mx-auto p-5 md:p-8">
          {activeTab === "beranda" && (
            <div className="space-y-8 pb-10">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-600 text-white p-6 rounded-[40px] shadow-xl relative overflow-hidden">
                  <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Peserta Terdaftar</p>
                  <p className="text-4xl font-black mt-2 leading-none">{String(participants.length)}</p>
                  <Users className="absolute -right-4 -bottom-4 opacity-10" size={100} />
                </div>
                <div className="bg-white p-6 rounded-[40px] border border-slate-200 shadow-sm flex flex-col justify-center">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Lembaga LPQ</p>
                  <p className="text-3xl font-black text-slate-800 mt-2">{String(new Set(participants.map(p => p.institution)).size)}</p>
                </div>
                <div className="bg-white p-6 rounded-[40px] border border-slate-200 shadow-sm flex flex-col justify-center">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Kecamatan</p>
                  <p className="text-3xl font-black text-slate-800 mt-2">{String(new Set(participants.map(p => p.district)).size)}</p>
                </div>
              </div>

              <div className="bg-white p-12 rounded-[56px] border border-slate-200 shadow-sm text-center space-y-4">
                <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <Trophy size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">
                  {currentRole.id === "ADMIN" ? "Dashboard Administrator" : "Selamat Datang di FASI IX"}
                </h2>
                <p className="text-slate-400 text-sm max-w-md mx-auto font-medium">
                  {currentRole.id === "ADMIN" 
                    ? "Gunakan menu navigasi di bawah untuk mengelola database santri, mencetak kartu, dan memantau penilaian juri." 
                    : "Sistem Informasi Pendaftaran, Penilaian, dan Rekapitulasi Juara FASI IX Kabupaten Batang."
                  }
                </p>
                
                {currentRole.id === "PUBLIK" && (
                  <div className="pt-4 flex justify-center gap-3">
                    <button onClick={() => setActiveTab("pendaftaran")} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg">Daftar Sekarang</button>
                    <button onClick={() => setActiveTab("hasil")} className="bg-slate-100 text-slate-600 px-8 py-3 rounded-2xl font-black text-[10px] uppercase">Lihat Hasil</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "pendaftaran" && (
            <div className="bg-white p-8 rounded-[48px] shadow-sm border border-slate-200 animate-in slide-in-from-bottom-6 duration-500">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3 text-slate-800">
                <UserPlus className="text-emerald-500" /> Pendaftaran Santri
              </h2>
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-50 rounded-[32px]">
                  <button type="button" onClick={() => { setRegType("single"); setRegMembers([{ name: "", birthDate: "", age: null, gender: "PA" }]); setRegCategory(""); }} className={`p-4 rounded-[26px] font-black text-[10px] uppercase transition-all ${regType === "single" ? "bg-white text-emerald-600 shadow-md" : "text-slate-400"}`}>PERSONAL</button>
                  <button type="button" onClick={() => { setRegType("group"); setRegMembers(Array.from({ length: 3 }, () => ({ name: "", birthDate: "", age: null, gender: "PA" }))); setRegCategory(""); }} className={`p-4 rounded-[26px] font-black text-[10px] uppercase transition-all ${regType === "group" ? "bg-white text-emerald-600 shadow-md" : "text-slate-400"}`}>REGU</button>
                </div>
                {regMembers.map((m, i) => (
                  <div key={i} className="p-6 bg-slate-50 rounded-[40px] border border-slate-100 space-y-4 shadow-inner">
                    <input placeholder="Nama Lengkap" className="w-full p-4 rounded-2xl border-none text-sm font-black outline-none shadow-sm focus:ring-4 focus:ring-emerald-100" value={m.name} onChange={(e) => { const next = [...regMembers]; next[i].name = e.target.value; setRegMembers(next); }} required={i === 0 || (regType === "group" && i < 2)} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-300 uppercase ml-2 tracking-widest">Tgl Lahir</p>
                        <input type="date" className="w-full p-4 rounded-2xl border-none text-[11px] font-black bg-white shadow-sm outline-none" value={m.birthDate || ""} onChange={(e) => {
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
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-300 uppercase ml-2 tracking-widest">Gender</p>
                        <select className="w-full p-4 rounded-2xl border-none text-[11px] font-black bg-white shadow-sm outline-none" value={m.gender} onChange={(e) => { const next = [...regMembers]; next[i].gender = e.target.value; setRegMembers(next); }} required>
                          <option value="PA">Putra (PA)</option>
                          <option value="PI">Putri (PI)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select name="district" className="p-4 bg-slate-100 rounded-2xl font-black text-xs border-none outline-none appearance-none">
                    {KECAMATAN_LIST.map((k) => <option key={k} value={k}>{String(k)}</option>)}
                  </select>
                  <input name="institution" placeholder="Nama Lembaga (TPQ/LPQ)" className="w-full p-4 bg-slate-100 rounded-2xl font-black text-sm border-none outline-none shadow-sm" required />
                </div>
                {allowedCategories.length > 0 && (
                  <div className="space-y-6 pt-6 border-t border-slate-100">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {allowedCategories[0] === "Melebihi Batas" ? (
                        <div className="p-4 bg-red-50 text-red-500 rounded-3xl text-[10px] font-black uppercase text-center w-full border border-red-100 flex items-center justify-center gap-2">
                          <AlertTriangle size={14} /> Usia Melebihi Batas
                        </div>
                      ) : (
                        allowedCategories.map((c) => (
                          <button key={c} type="button" onClick={() => setRegCategory(c)} className={`px-8 py-3 rounded-2xl text-[10px] font-black transition-all shadow-sm ${regCategory === c ? "bg-emerald-600 text-white" : "bg-white text-slate-400 border border-slate-100 hover:bg-slate-50"}`}>{String(c)}</button>
                        ))
                      )}
                    </div>
                    {regCategory && regCategory !== "Melebihi Batas" && (
                      <select name="branchId" className="w-full p-5 bg-emerald-50 text-emerald-800 rounded-[32px] font-black text-xs border-none outline-none uppercase shadow-inner" required>
                        <option value="">-- PILIH CABANG LOMBA --</option>
                        {BRANCH_DATA[regCategory]?.filter((b) => b.type === regType).map((b) => <option key={b.id} value={b.id}>{String(b.name)}</option>)}
                      </select>
                    )}
                  </div>
                )}
                <button className="w-full bg-emerald-600 text-white font-black py-6 rounded-[36px] shadow-2xl uppercase text-xs active:scale-95 transition-transform">Simpan Data Ke Cloud</button>
              </form>
            </div>
          )}

          {activeTab === "penilaian" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex gap-2 overflow-x-auto no-scrollbar bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                {["TKQ", "TPQ", "TQA"].map((c) => (
                  <button key={c} onClick={() => { setFilterCategory(c); setScoringBranchId("all"); }} className={`px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase transition-all ${filterCategory === c ? "bg-emerald-600 text-white shadow-lg" : "bg-slate-50 text-slate-400"}`}>{String(c)}</button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sortir Mata Lomba</p>
                  <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-xs outline-none focus:ring-4 focus:ring-emerald-100 shadow-inner" value={scoringBranchId} onChange={(e) => setScoringBranchId(e.target.value)}>
                    <option value="all">-- Semua Mata Lomba --</option>
                    {BRANCH_DATA[filterCategory].map(b => <option key={b.id} value={b.id}>{String(b.name)}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sortir Gender / Tipe</p>
                  <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-xs outline-none focus:ring-4 focus:ring-emerald-100 shadow-inner" value={scoringGender} onChange={(e) => setScoringGender(e.target.value)}>
                    <option value="all">-- Semua Gender/Tipe --</option>
                    <option value="PA">Putra (PA)</option>
                    <option value="PI">Putri (PI)</option>
                    <option value="Group">Regu / Kelompok</option>
                  </select>
                </div>
              </div>

              {BRANCH_DATA[filterCategory]?.filter(b => scoringBranchId === "all" || b.id === scoringBranchId)?.map((branch) => {
                const list = participants.filter((p) => p.branchId === branch.id && (scoringGender === "all" || p.gender === scoringGender));
                if (list.length === 0) return null;
                return (
                  <div key={branch.id} className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-6 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between">
                      <div className="flex items-center gap-3"><div className="bg-white p-2 rounded-xl text-emerald-600 shadow-sm"><ClipboardCheck size={18} /></div><h4 className="font-black text-emerald-900 text-xs uppercase tracking-tight">{String(branch.name)}</h4></div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <tr><th className="p-6">Nama Peserta</th>{branch.criteria.map((c) => <th key={c} className="p-6 text-center">{String(c)}</th>)}<th className="p-6 text-center text-emerald-600 font-black">Total</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {list.map((p) => {
                            const pScores = scores[p.id] || Array(branch.criteria.length).fill(0);
                            const total = pScores.reduce((a, b) => a + (Number(b) || 0), 0);
                            return (
                              <tr key={p.id}>
                                <td className="p-6 font-black text-sm uppercase">{String(p.name)}</td>
                                {branch.criteria.map((c, idx) => (
                                  <td key={idx} className="p-6 text-center">
                                    <input type="number" className="w-16 p-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-black" value={String(pScores[idx] || "")} onChange={async (e) => {
                                      const val = Math.min(branch.max[idx], Math.max(0, parseInt(e.target.value) || 0));
                                      const next = [...pScores]; next[idx] = val;
                                      await setDoc(doc(db, "artifacts", appId, "public", "data", "scores", p.id), { values: next });
                                    }} />
                                  </td>
                                ))}
                                <td className="p-6 text-center font-black text-emerald-700">{String(total)}</td>
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
          )}

          {activeTab === "hasil" && (
            <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-500 pb-10">
               <div className="bg-emerald-900 p-12 rounded-[64px] text-white relative overflow-hidden shadow-2xl">
                <h2 className="text-4xl font-black italic uppercase leading-none mb-3">Laporan Kejuaraan</h2>
                <Trophy className="absolute -right-6 -bottom-6 text-white/5 w-64 h-64 rotate-12" />
              </div>

              <div className="space-y-12 pb-10">
                {Object.keys(BRANCH_DATA).map((catKey) => (
                  <div key={catKey} className="space-y-8">
                    <div className="bg-slate-900 text-white px-8 py-4 rounded-full inline-flex items-center gap-3 shadow-xl">
                      <Award size={20} className="text-amber-400" />
                      <span className="font-black text-base uppercase tracking-widest">KATEGORI {String(catKey)}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-8">
                      {BRANCH_DATA[catKey].map((branch) => {
                        const winners = results.branchGroups[branch.id];
                        if (!winners) return null;
                        const hasAnyWinner = ["PA", "PI", "Group"].some(g => winners[g]?.filter(p => p.hasScore).length > 0);
                        if (!hasAnyWinner) return null;

                        return (
                          <div key={branch.id} className="bg-white rounded-[48px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
                            <div className="p-8 bg-emerald-50 border-b border-emerald-100 flex items-center gap-4">
                              <div className="bg-white p-3 rounded-2xl text-emerald-600 shadow-sm"><Trophy size={24} /></div>
                              <h4 className="font-black text-emerald-900 text-lg uppercase">{String(branch.name)}</h4>
                            </div>
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                              {["PA", "PI", "Group"].map((gKey) => {
                                const list = winners[gKey]?.filter(p => p.hasScore).sort((a,b) => b.total - a.total).slice(0, 3);
                                if (!list || list.length === 0) return null;
                                return (
                                  <div key={gKey} className="space-y-4">
                                    <p className="text-[11px] font-black text-slate-400 uppercase border-b pb-2">Juara {String(gKey)}</p>
                                    <div className="space-y-3">
                                      {list.map((winner, idx) => (
                                        <div key={winner.id} className={`p-4 rounded-3xl border ${idx === 0 ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-100"}`}>
                                          <div className="flex items-start gap-3">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] shrink-0 ${idx === 0 ? "bg-amber-400 text-white" : "bg-slate-200 text-slate-500"}`}>{String(idx + 1)}</div>
                                            <div className="flex-1 min-w-0">
                                              <p className="font-black text-[11px] text-slate-800 uppercase truncate leading-none mb-1">{String(winner.name)}</p>
                                              <p className="text-[9px] font-bold text-emerald-600 uppercase truncate">{String(winner.institution)}</p>
                                            </div>
                                            <p className="font-black text-base text-slate-800">{String(winner.total)}</p>
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
                ))}
              </div>
            </div>
          )}

          {activeTab === "admin" && (
            <div className="space-y-8 animate-in duration-700 pb-10">
               <div className="bg-white rounded-[56px] border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-6">
                  <h3 className="font-black text-3xl text-slate-800 uppercase tracking-tighter leading-none">Database Santri</h3>
                  <div className="flex flex-wrap gap-4 justify-center">
                    <button onClick={exportToCSV} className="bg-blue-600 text-white px-8 py-4 rounded-full font-black text-[10px] uppercase shadow-xl"><Download size={18} className="inline mr-2"/> CSV</button>
                    <button onClick={() => setIsBulkPrint(true)} className="bg-emerald-600 text-white px-8 py-4 rounded-full font-black text-[10px] uppercase shadow-xl"><Printer size={18} className="inline mr-2"/> Cetak</button>
                  </div>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      <tr><th className="p-8">Nama / Lembaga</th><th className="p-8 text-center">Aksi</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {participants.map((p) => (
                        <tr key={p.id}>
                          <td className="p-8">
                            <p className="font-black text-lg text-slate-800 uppercase leading-none mb-2">{String(p.name)}</p>
                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full uppercase">{String(p.category)}</span>
                          </td>
                          <td className="p-8 text-center flex justify-center gap-2">
                            <button onClick={() => setSelectedForPrint(p)} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><Printer size={18} /></button>
                            <button onClick={() => setEditModal(p)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Pencil size={18} /></button>
                            <button onClick={() => { if (confirm(`Hapus data ${p.name}?`)) { deleteDoc(doc(db, "artifacts", appId, "public", "data", "participants", p.id)); deleteDoc(doc(db, "artifacts", appId, "public", "data", "scores", p.id)); notify("Data Dihapus!"); } }} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-[56px] border border-slate-200 p-10 shadow-sm space-y-8">
                <h3 className="text-2xl font-black uppercase tracking-tighter italic">Keamanan Sistem</h3>
                <form onSubmit={handleUpdatePasswords} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Sandi Baru Juri</p><input name="juriPass" type="text" className="w-full p-5 bg-slate-50 border-none rounded-[28px] font-black text-sm outline-none shadow-inner" defaultValue={String(passwords.JURI)} required /></div>
                  <div className="space-y-3"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Sandi Baru Admin</p><input name="adminPass" type="text" className="w-full p-5 bg-slate-50 border-none rounded-[28px] font-black text-sm outline-none shadow-inner" defaultValue={String(passwords.ADMIN)} required /></div>
                  <div className="md:col-span-2"><button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-xs uppercase shadow-xl hover:bg-black transition-all">Simpan Sandi Baru</button></div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Auth & Modals */}
      {showRoleSwitcher && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[56px] p-10 shadow-2xl animate-in zoom-in duration-300">
            <h3 className="font-black text-base uppercase text-slate-400 tracking-widest mb-8">Pilih Akses Sistem</h3>
            <div className="space-y-4">
              {Object.values(ROLES).map((role) => (
                <button key={role.id} onClick={() => { if (role.id === "PUBLIK") { setCurrentRole(role); setShowRoleSwitcher(false); setActiveTab("beranda"); } else setAuthModal({ id: role.id, input: "" }); }} className="w-full p-8 rounded-[40px] bg-slate-50 border-4 border-transparent hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all flex justify-between items-center group">
                  <div><p className="font-black text-xl uppercase tracking-tighter group-hover:text-emerald-700">{String(role.name)}</p></div>
                  {role.id !== "PUBLIK" ? <Lock size={20} className="text-slate-300" /> : <Unlock size={20} className="text-emerald-500" />}
                </button>
              ))}
            </div>
            <button onClick={() => setShowRoleSwitcher(false)} className="w-full mt-6 p-4 text-slate-400 font-black uppercase text-xs">Tutup</button>
          </div>
        </div>
      )}

      {authModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[110] flex items-center justify-center p-6">
          <div className="bg-white p-12 rounded-[64px] w-full max-sm:p-8 w-full max-w-sm shadow-2xl border border-slate-100 text-center">
            <h3 className="font-black text-2xl uppercase tracking-tighter mb-8">Sandi {String(authModal.id)}</h3>
            <input type="password" autoFocus className="w-full p-6 bg-slate-100 rounded-[36px] font-black text-center text-2xl mb-8 outline-none focus:ring-8 focus:ring-emerald-100 shadow-inner" value={String(authModal.input)} onChange={(e) => setAuthModal({ ...authModal, input: e.target.value })} />
            <div className="flex gap-4">
              <button onClick={() => { if (authModal.input === passwords[authModal.id]) { setCurrentRole(ROLES[authModal.id]); setAuthModal(null); setShowRoleSwitcher(false); setActiveTab(authModal.id === "JURI" ? "penilaian" : "beranda"); notify(`Akses Terbuka!`); } else notify("Password Salah!", "error"); }} className="flex-1 bg-emerald-600 text-white font-black py-6 rounded-[32px] text-xs shadow-2xl">MASUK</button>
              <button onClick={() => setAuthModal(null)} className="flex-1 bg-slate-100 text-slate-400 font-black py-6 rounded-[32px] text-xs">BATAL</button>
            </div>
          </div>
        </div>
      )}

      {selectedForPrint && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-[120] flex items-center justify-center p-6 print:bg-white print:p-0">
          <div className="bg-white p-8 rounded-[48px] max-w-sm w-full text-center shadow-2xl print:hidden">
            <div className="flex justify-center gap-2 overflow-x-auto pb-4 no-scrollbar">
              {selectedForPrint.type === "group" ? (selectedForPrint.members || []).map((m, idx) => <IDCard key={idx} p={selectedForPrint} memberName={m.name} memberId={`${selectedForPrint.id}-${idx + 1}`} />) : <IDCard p={selectedForPrint} />}
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => window.print()} className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-[36px] text-xs shadow-xl">PRINT</button>
              <button onClick={() => setSelectedForPrint(null)} className="flex-1 bg-slate-100 text-slate-400 font-black py-4 rounded-[32px]">TUTUP</button>
            </div>
          </div>
          <div className="hidden print:grid print:grid-cols-3 print:gap-4 print:w-full">
            {selectedForPrint.type === "group" ? (selectedForPrint.members || []).map((m, idx) => <IDCard key={idx} p={selectedForPrint} memberName={m.name} memberId={`${selectedForPrint.id}-${idx + 1}`} />) : <IDCard p={selectedForPrint} />}
          </div>
        </div>
      )}

      {isBulkPrint && (
        <div className="absolute top-0 left-0 right-0 min-h-screen bg-white z-[200] p-12 print:p-0">
          <div className="flex justify-between items-center mb-12 no-print bg-slate-50 p-10 rounded-[56px] border border-slate-200">
            <div><h2 className="text-4xl font-black uppercase text-slate-800 tracking-tighter">Cetak Masal</h2></div>
            <div className="flex gap-4">
              <button onClick={() => window.print()} className="bg-emerald-600 text-white px-12 py-5 rounded-[36px] font-black shadow-2xl shadow-emerald-200">PRINT SEMUA</button>
              <button onClick={() => setIsBulkPrint(false)} className="bg-slate-200 px-12 py-5 rounded-[36px] font-black hover:bg-slate-300">KEMBALI</button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid-cols-3 print:gap-4">
            {participants.flatMap((p) => p.type === "group" ? (p.members || []).map((m, idx) => <IDCard key={`${p.id}-${idx}`} p={p} memberName={m.name} memberId={`${p.id}-${idx+1}`} />) : <IDCard key={p.id} p={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
