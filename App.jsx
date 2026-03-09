import React, { useState, useEffect, useMemo } from "react";
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
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Filter,
} from "lucide-react";

// --- 1. KONFIGURASI FIREBASE ---
const manualConfig = {
  apiKey: "AIzaSyCHdwhrtWUgS46KL0IS1UB8cHGEEye-TCw",
  authDomain: "fasi-ix-82267.firebaseapp.com",
  projectId: "fasi-ix-82267",
  storageBucket: "fasi-ix-82267.firebasestorage.app",
  messagingSenderId: "1078063708798",
  appId: "1:1078063708798:web:7180f28c1224ea5965362f",
};

const firebaseConfig =
  typeof __firebase_config !== "undefined" &&
  JSON.parse(__firebase_config).apiKey
    ? JSON.parse(__firebase_config)
    : manualConfig;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const rawAppId = typeof __app_id !== "undefined" ? __app_id : "fasi-batang-2026";
const appId = rawAppId.replace(/\//g, "_");

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
  JURI: { id: "JURI", name: "Juri", access: ["beranda", "penilaian", "hasil"] },
  ADMIN: { id: "ADMIN", name: "Admin", access: ["beranda", "pendaftaran", "penilaian", "hasil", "admin"] },
};

// --- LOGIKA PERHITUNGAN USIA ---
const calculateAgeAtRef = (birthDateStr) => {
  if (!birthDateStr) return null;
  const birth = new Date(birthDateStr);
  const ref = new Date("2027-07-01");

  let years = ref.getFullYear() - birth.getFullYear();
  let months = ref.getMonth() - birth.getMonth();
  let days = ref.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    const lastMonth = new Date(ref.getFullYear(), ref.getMonth(), 0);
    days += lastMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalDays = Math.floor((ref - birth) / (1000 * 60 * 60 * 24));
  return { years, months, days, totalDays };
};

const checkCategoryEligibility = (age) => {
  if (!age) return [];
  const { years, months, days } = age;
  const isEligible = (maxYears) => {
    if (years < maxYears) return true;
    if (years === maxYears && months === 0 && days === 0) return true;
    return false;
  };
  const canTKQ = isEligible(7);
  const canTPQ = isEligible(12);
  const canTQA = isEligible(15);
  if (canTKQ) return ["TKQ", "TPQ", "TQA"];
  if (canTPQ) return ["TPQ", "TQA"];
  if (canTQA) return ["TQA"];
  return ["Melebihi Batas"];
};

const IDCard = ({ p, memberName, memberId }) => (
  <div style={{ width: "6.5cm", height: "10.2cm" }} className="relative bg-white border-2 border-emerald-600 overflow-hidden flex flex-col p-2 break-inside-avoid box-border mx-auto shadow-sm">
    <div className="flex justify-between items-center mb-1 pb-1">
      <img src="[https://upload.wikimedia.org/wikipedia/commons/4/41/Kementerian_Agama_new_logo.png](https://upload.wikimedia.org/wikipedia/commons/4/41/Kementerian_Agama_new_logo.png)" alt="K" className="h-5 w-5 object-contain" />
      <img src="[https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_BKPRMI.png/600px-Logo_BKPRMI.png](https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_BKPRMI.png/600px-Logo_BKPRMI.png)" alt="F" className="h-5 w-5 object-contain mx-1" />
      <img src="[https://drive.google.com/uc?export=view&id=1IFOugVQJksGBT7YY2KdXo1i4gJp7meym](https://drive.google.com/uc?export=view&id=1IFOugVQJksGBT7YY2KdXo1i4gJp7meym)" alt="B" className="h-5 w-5 object-contain" />
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

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { console.error("Auth Error:", e); setLoading(false); }
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
    const unsubP = onSnapshot(pRef, (snap) => setParticipants(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => console.error("P Err:", err));
    const unsubS = onSnapshot(sRef, (snap) => { const s = {}; snap.forEach(d => s[d.id] = d.data().values); setScores(s); }, (err) => console.error("S Err:", err));
    const unsubC = onSnapshot(cRef, (d) => { if (d.exists()) setPasswords(d.data()); }, (err) => console.error("C Err:", err));
    return () => { unsubP(); unsubS(); unsubC(); };
  }, [user]);

  const notify = (msg, type = "success") => { setNotification({ msg: String(msg), type }); setTimeout(() => setNotification(null), 3000); };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!user) return notify("Harap tunggu koneksi cloud...", "error");
    const fd = new FormData(e.target);
    const branchId = fd.get("branchId");
    if (!branchId || !regCategory) return notify("Lengkapi pilihan lomba", "error");

    const branchInfo = Object.values(BRANCH_DATA).flat().find(b => b.id === branchId);
    const active = regMembers.filter(m => m.name.trim() !== "");
    const pId = `FASI-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const newP = {
      name: regType === "single" ? active[0].name : `Regu ${fd.get("institution")}`,
      members: active.map(m => ({
        name: m.name,
        birthDate: m.birthDate,
        gender: m.gender,
        ageStr: m.age ? `${m.age.years}th ${m.age.months}bln` : "",
      })),
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
    } catch (err) { notify("Gagal simpan (Cek koneksi/izin)", "error"); }
  };

  const results = useMemo(() => {
    const branchGroups = {};
    const distPts = {};
    const instPts = {};
    KECAMATAN_LIST.forEach((k) => (distPts[k] = 0));

    participants.forEach((p) => {
      const pScores = scores[p.id] || [];
      const hasScore = pScores.some((s) => Number(s) > 0);
      const total = pScores.reduce((a, b) => a + (Number(b) || 0), 0);
      if (!branchGroups[p.branchId])
        branchGroups[p.branchId] = { PA: [], PI: [], Group: [] };
      if (p.type === "group")
        branchGroups[p.branchId].Group.push({ ...p, total, hasScore });
      else branchGroups[p.branchId][p.gender]?.push({ ...p, total, hasScore });
    });

    Object.values(branchGroups).forEach((cat) => {
      ["PA", "PI", "Group"].forEach((g) => {
        cat[g]
          ?.filter((p) => p.hasScore)
          .sort((a, b) => b.total - a.total)
          .slice(0, 3)
          .forEach((winner, idx) => {
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
    <div className="h-screen flex items-center justify-center bg-emerald-900 text-white font-black tracking-widest uppercase text-center p-6">
      <div className="space-y-4">
        <Loader2 className="animate-spin mx-auto" size={48} />
        <p className="animate-pulse tracking-widest">SINKRONISASI CLOUD...</p>
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
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 p-5 shadow-sm">
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
          ].filter((item) => currentRole.access.includes(item.id)).map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center px-5 py-2.5 rounded-[24px] transition-all ${activeTab === t.id ? "text-emerald-600 bg-emerald-50 shadow-inner" : "text-slate-300"}`}>
              <t.icon size={20} />
              <span className="text-[8px] font-black uppercase mt-1.5 tracking-tighter">{String(t.label)}</span>
            </button>
          ))}
        </nav>

        <main className="max-w-4xl mx-auto p-5 md:p-8">
          {activeTab === "beranda" && (
            <div className="space-y-6 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-600 text-white p-8 rounded-[48px] shadow-xl relative overflow-hidden group">
                  <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em]">Peserta Terdaftar</p>
                  <p className="text-5xl font-black mt-2 leading-none">{participants.length}</p>
                  <Users className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform" size={140} />
                </div>
                <div className="bg-white p-8 rounded-[48px] border border-slate-200 shadow-sm flex flex-col justify-center">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Lembaga LPQ</p>
                  <p className="text-4xl font-black text-slate-800 mt-2">{new Set(participants.map((p) => p.institution)).size}</p>
                </div>
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
                  <button type="button" onClick={() => { 
                    setRegType("group"); 
                    setRegMembers(Array.from({ length: 3 }, () => ({ name: "", birthDate: "", age: null, gender: "PA" }))); 
                    setRegCategory("");
                  }} className={`p-4 rounded-[26px] font-black text-[10px] uppercase transition-all ${regType === "group" ? "bg-white text-emerald-600 shadow-md" : "text-slate-400"}`}>REGU</button>
                </div>
                {regMembers.map((m, i) => (
                  <div key={i} className="p-6 bg-slate-50 rounded-[40px] border border-slate-100 space-y-4 shadow-inner">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{regType === "group" ? `Identitas Anggota ${i+1}` : 'Identitas Santri'}</p>
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
                        <select className="w-full p-4 rounded-2xl border-none text-[11px] font-black bg-white shadow-sm outline-none" value={m.gender} onChange={(e) => { 
                          const next = [...regMembers]; 
                          next[i].gender = e.target.value; 
                          setRegMembers(next); 
                        }} required>
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
                          <AlertTriangle size={14} /> Usia Melebihi Batas (Maks 15 Thn)
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
                  <button key={c} onClick={() => setFilterCategory(c)} className={`px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase transition-all ${filterCategory === c ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" : "bg-slate-50 text-slate-400"}`}>{String(c)}</button>
                ))}
              </div>
              {BRANCH_DATA[filterCategory]?.map((branch) => {
                const list = participants.filter((p) => p.branchId === branch.id);
                if (list.length === 0) return null;
                return (
                  <div key={branch.id} className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-6 bg-emerald-50/50 border-b border-emerald-100"><h4 className="font-black text-emerald-900 text-xs uppercase tracking-tight">{String(branch.name)}</h4></div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <tr>
                            <th className="p-6">{branch.type === 'group' ? 'Nama TPQ / Lembaga' : 'Nama Santri'}</th>
                            {branch.criteria.map((c) => <th key={c} className="p-6 text-center">{String(c)}</th>)}
                            <th className="p-6 text-center text-emerald-600 font-black">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {list.map((p) => {
                            const pScores = scores[p.id] || Array(branch.criteria.length).fill(0);
                            const total = pScores.reduce((a, b) => a + (Number(b) || 0), 0);
                            return (
                              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-6">
                                  <p className="font-black text-sm text-slate-800 uppercase leading-none mb-1">
                                    {p.type === 'group' ? String(p.institution) : String(p.name)}
                                  </p>
                                  {p.type === 'group' && <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">Regu Kecamatan {String(p.district)}</p>}
                                </td>
                                {branch.criteria.map((c, idx) => (
                                  <td key={idx} className="p-6 text-center">
                                    <input type="number" className="w-16 p-3 bg-white border border-slate-200 rounded-2xl text-center font-black text-sm outline-none focus:ring-4 focus:ring-emerald-100 shadow-inner transition-all" value={pScores[idx] || ""} onChange={async (e) => {
                                      const val = Math.min(branch.max[idx], Math.max(0, parseInt(e.target.value) || 0));
                                      const next = [...pScores];
                                      next[idx] = val;
                                      await setDoc(doc(db, "artifacts", appId, "public", "data", "scores", p.id), { values: next });
                                    }} />
                                  </td>
                                ))}
                                <td className="p-6 text-center font-black text-emerald-700 text-xl">{total}</td>
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
            <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-500">
               <div className="bg-emerald-900 p-12 rounded-[64px] text-white relative overflow-hidden shadow-2xl">
                <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none mb-3">Papan Kejuaraan</h2>
                <Trophy className="absolute -right-6 -bottom-6 text-white/5 w-64 h-64 rotate-12" />
              </div>
              {Object.entries(results.branchGroups).map(([bid, groups]) => {
                const branch = Object.values(BRANCH_DATA).flat().find((b) => b.id === bid);
                return (
                  <div key={bid} className="space-y-6">
                    <div className="flex items-center gap-4 ml-6"><div className="h-10 w-2.5 bg-emerald-500 rounded-full shadow-lg shadow-emerald-100"></div><h3 className="font-black text-2xl uppercase text-slate-800 tracking-tighter">{String(branch?.name)}</h3></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {["PA", "PI", "Group"].map((g) => {
                        const list = groups[g];
                        if (!list || list.length === 0) return null;
                        return (
                          <div key={g} className={`bg-white rounded-[56px] p-10 shadow-xl border-t-[14px] ${g === "PI" ? "border-t-pink-500" : g === "Group" ? "border-t-amber-500" : "border-t-blue-500"}`}>
                            <div className="flex justify-between items-center mb-8"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">JUARA {g === "Group" ? "REGU" : g === "PA" ? "PUTRA" : "PUTRI"}</p><Award className={g === "PI" ? "text-pink-500" : "text-blue-500"} size={24} /></div>
                            <div className="space-y-5">
                              {list.filter(p => p.hasScore).sort((a,b) => b.total - a.total).slice(0, 3).map((p, i) => (
                                <div key={p.id} className={`flex items-center justify-between p-6 rounded-[36px] border ${i === 0 ? "bg-amber-50 border-amber-200 shadow-md scale-[1.02] border-opacity-50" : "bg-white border-slate-100"}`}>
                                  <div className="flex items-center gap-5">
                                    <span className={`w-10 h-10 flex items-center justify-center rounded-[14px] font-black text-base ${i === 0 ? "bg-amber-400 text-white shadow-lg shadow-amber-200" : "bg-slate-100 text-slate-500"}`}>{i + 1}</span>
                                    <div><p className="font-black text-sm text-slate-800 uppercase leading-none mb-1">{p.type === 'group' ? String(p.institution) : String(p.name)}</p><p className="text-[9px] text-slate-400 font-bold uppercase">{String(p.district)}</p></div>
                                  </div>
                                  <div className="text-right"><p className="font-black text-emerald-700 text-2xl leading-none">{p.total}</p></div>
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
          )}

          {activeTab === "admin" && (
            <div className="space-y-8 animate-in duration-700">
               <div className="bg-white rounded-[56px] border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-6">
                  <h3 className="font-black text-3xl text-slate-800 uppercase tracking-tighter leading-none">Database Santri</h3>
                  <button onClick={() => setIsBulkPrint(true)} className="flex items-center gap-3 bg-emerald-600 text-white px-8 py-4 rounded-[28px] font-black text-[10px] uppercase shadow-xl hover:bg-emerald-700 transition-all shadow-emerald-200"><Printer size={18} /> Cetak Masal</button>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      <tr><th className="p-8">Nama / Lembaga</th><th className="p-8 text-center">Aksi</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {participants.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-8">
                            <p className="font-black text-lg text-slate-800 uppercase leading-none mb-2">{p.type === 'group' ? String(p.institution) : String(p.name)}</p>
                            <div className="flex gap-2">
                              <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full uppercase">{String(p.category)}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{String(p.branchName)}</span>
                            </div>
                          </td>
                          <td className="p-8 text-center flex justify-center gap-3">
                            <button onClick={() => setSelectedForPrint(p)} className="p-4 bg-slate-100 rounded-2xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all"><Printer size={20} /></button>
                            <button onClick={() => { if (confirm(`Hapus data ${p.name}?`)) { deleteDoc(doc(db, "artifacts", appId, "public", "data", "participants", p.id)); deleteDoc(doc(db, "artifacts", appId, "public", "data", "scores", p.id)); notify("Data Dihapus!"); } }} className="p-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={20} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {showRoleSwitcher && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[56px] p-10 shadow-2xl animate-in slide-in-from-bottom duration-500 border-t-8 border-emerald-500/10">
            <div className="flex justify-between items-center mb-10"><h3 className="font-black text-base uppercase text-slate-400 tracking-[0.2em] ml-4">Ganti Akses Sistem</h3><button onClick={() => setShowRoleSwitcher(false)} className="p-4 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200"><X size={24} /></button></div>
            <div className="space-y-4">
              {Object.values(ROLES).map((role) => (
                <button key={role.id} onClick={() => { if (role.id === "PUBLIK") { setCurrentRole(role); setShowRoleSwitcher(false); setActiveTab("beranda"); } else setAuthModal({ id: role.id, input: "" }); }} className="w-full p-8 rounded-[40px] bg-slate-50 border-4 border-transparent hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all flex justify-between items-center group">
                  <div><p className="font-black text-xl uppercase tracking-tighter group-hover:text-emerald-700">{String(role.name)}</p><p className="text-[10px] text-slate-400 font-black uppercase mt-1">Ganti ke mode {role.name.toLowerCase()}</p></div>
                  {role.id !== "PUBLIK" ? <Lock size={20} className="text-slate-300" /> : <Unlock size={20} className="text-emerald-500" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {authModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[110] flex items-center justify-center p-6">
          <div className="bg-white p-12 rounded-[64px] w-full max-sm:p-8 w-full max-w-sm shadow-2xl border border-slate-100 text-center">
            <KeyRound className="mx-auto text-emerald-600 mb-6" size={48} />
            <h3 className="font-black text-2xl uppercase tracking-tighter mb-8">Sandi {String(authModal.id)}</h3>
            <input type="password" autoFocus className="w-full p-6 bg-slate-100 rounded-[36px] font-black text-center text-2xl mb-8 outline-none focus:ring-8 focus:ring-emerald-100 transition-all shadow-inner" value={authModal.input} onChange={(e) => setAuthModal({ ...authModal, input: e.target.value })} />
            <div className="flex gap-4">
              <button onClick={() => { if (authModal.input === passwords[authModal.id]) { setCurrentRole(ROLES[authModal.id]); setAuthModal(null); setShowRoleSwitcher(false); setActiveTab("beranda"); notify(`Akses Terbuka!`); } else notify("Password Salah!", "error"); }} className="flex-1 bg-emerald-600 text-white font-black py-6 rounded-[32px] text-xs shadow-2xl hover:bg-emerald-700 transition-colors">MASUK</button>
              <button onClick={() => setAuthModal(null)} className="flex-1 bg-slate-100 text-slate-400 font-black py-6 rounded-[32px] text-xs hover:bg-slate-200 transition-colors">BATAL</button>
            </div>
          </div>
        </div>
      )}

      {selectedForPrint && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-[120] flex items-center justify-center p-6 print:bg-white print:p-0">
          <div className="bg-white p-8 rounded-[48px] max-w-sm w-full text-center shadow-2xl print:hidden animate-in zoom-in duration-300">
            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-6">Preview Kartu</h4>
            <div className="flex justify-center gap-2 overflow-x-auto pb-4 no-scrollbar">
              {selectedForPrint.type === "group" ? (selectedForPrint.members || []).map((m, idx) => <IDCard key={idx} p={selectedForPrint} memberName={m.name} memberId={`${selectedForPrint.id}-${idx + 1}`} />) : <IDCard p={selectedForPrint} />}
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => window.print()} className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-[36px] text-xs shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-colors">PRINT</button>
              <button onClick={() => setSelectedForPrint(null)} className="flex-1 bg-slate-100 text-slate-400 font-black py-4 rounded-[32px] hover:bg-slate-200 transition-colors">TUTUP</button>
            </div>
          </div>
          <div className="hidden print:grid print:grid-cols-3 print:gap-4 print:w-full">
            {selectedForPrint.type === "group" ? (selectedForPrint.members || []).map((m, idx) => <IDCard key={idx} p={selectedForPrint} memberName={m.name} memberId={`${selectedForPrint.id}-${idx + 1}`} />) : <IDCard p={selectedForPrint} />}
          </div>
        </div>
      )}

      {isBulkPrint && (
        <div className="absolute top-0 left-0 right-0 min-h-screen bg-white z-[200] p-12 print:p-0">
          <div className="flex justify-between items-center mb-12 no-print bg-slate-50 p-10 rounded-[56px] border border-slate-200 shadow-sm">
            <div><h2 className="text-4xl font-black uppercase text-slate-800 tracking-tighter leading-none">Cetak Masal</h2><p className="text-xs font-black text-slate-400 uppercase mt-2 tracking-widest">Total Peserta ({participants.length} Registrasi)</p></div>
            <div className="flex gap-4">
              <button onClick={() => window.print()} className="bg-emerald-600 text-white px-12 py-5 rounded-[36px] font-black shadow-2xl hover:bg-emerald-700 transition-all shadow-emerald-200">PRINT SEMUA</button>
              <button onClick={() => setIsBulkPrint(false)} className="bg-slate-200 px-12 py-5 rounded-[36px] font-black hover:bg-slate-300 transition-all">KEMBALI</button>
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
