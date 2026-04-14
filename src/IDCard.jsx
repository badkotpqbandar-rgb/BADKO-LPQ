import React from "react";

// --- KOMPONEN ID CARD (Desain NATIVE SCALED untuk 6.5cm x 10.2cm) ---
// Ukuran inner diperbesar 2x lipat (491px x 771px) untuk menghindari limit font kecil browser
export const IDCard = ({ p, memberName, memberId }) => {
  const nama = String(memberName || p?.name || "NAMA PESERTA");
  const lembaga = String(p?.institution || "ASAL LEMBAGA");
  const cabangLomba = String(p?.branchName || "CABANG LOMBA");
  const tingkatUsia = String(p?.category || "TPQ/TKQ/TQA");
  const idPeserta = String(memberId || p?.id || "0000");
  const kecamatan = String(p?.district || "Bandar"); // Menangkap data kecamatan dinamis

  return (
    <div className="w-[491px] h-[771px] rounded-3xl overflow-hidden shadow-2xl bg-[#0a4d33] border-[6px] border-[#d4af37] font-sans flex text-gray-800 shrink-0">
      
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
      <div className="w-[140px] h-full flex flex-col items-center py-10 px-2 border-r-[6px] border-[#0a4d33] bg-[#d4af37] z-10 relative">        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-12 bg-blue-800 rounded-b-lg border-x-4 border-b-4 border-blue-900 shadow-xl flex items-center justify-center">
            <div className="w-4 h-4 bg-gray-300 rounded-full border-2 border-gray-500 shadow-inner"></div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-start mt-8 gap-8">
          <div className="flex flex-col items-center drop-shadow-xl">
            <div className="w-[80px] h-[80px] relative flex items-center justify-center">
              <img src="https://lh3.googleusercontent.com/d/1iWK2Q855dKPSlITO4Wr2LZ8hdlPk4x49" alt="Kemenag" className="w-full h-full object-contain" />
            </div>
            <p className="text-[10px] text-white text-center font-bold mt-2 uppercase leading-tight">Kementerian Agama<br/>Republik Indonesia</p>
          </div>
          <div className="flex flex-col items-center drop-shadow-xl mt-2">
            <div className="w-[95px] h-[95px] relative flex items-center justify-center">
              <img src="https://lh3.googleusercontent.com/d/1IFOugVQJksGBT7YY2KdXo1i4gJp7meym" alt="Badko" className="w-full h-full object-contain" />
            </div>
            <p className="text-[11px] text-white text-center font-bold mt-2 uppercase leading-tight">Badko LPQ<br/>Kecamatan {kecamatan}</p>
          </div>
          <div className="flex flex-col items-center drop-shadow-xl mt-8">
            <div className="w-[125px] flex justify-center">
              {/* Logo FASI Diperbarui di Sini menggunakan lh3 googleusercontent */}
              <img src="https://lh3.googleusercontent.com/d/1xv5rVvM-K1B1OERwI3hl-fhW8uBjT6SL" alt="FASI" className="w-full h-auto object-contain drop-shadow-lg" />
            </div>
            <p className="text-[10px] text-white text-center font-black uppercase leading-tight mt-2">Festival Anak Sholeh<br/>Indonesia</p>
          </div>
        </div>
      </div>

      {/* PANEL KANAN (Data) */}
      <div className="flex-1 flex flex-col relative z-10 bg-[#fefdf9]">
        <div className="bg-gradient-to-b from-[#1e40af] to-[#1e3a8a] py-6 px-4 shadow-md z-20">
          <h2 className="text-white font-black text-3xl text-center tracking-wide drop-shadow-md">ID CARD PESERTA</h2>
          <p className="text-white font-bold text-[13px] text-center uppercase tracking-wider drop-shadow-md mt-1">FASI Kecamatan {kecamatan} 2026</p>
        </div>

        <div className="flex-1 relative p-6 pt-5 flex flex-col justify-start">
          <div className="absolute inset-0 z-0 flex items-center justify-center opacity-5 pointer-events-none">
            <svg viewBox="0 0 200 200" className="w-[90%] h-[90%] fill-black">
              <path d="M 50 20 C 70 10, 100 30, 120 20 C 150 10, 180 40, 170 80 C 160 120, 180 150, 150 170 C 120 190, 80 180, 60 160 C 40 140, 20 120, 30 80 C 40 40, 30 30, 50 20 Z" />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="flex flex-col items-center justify-center mb-6 text-center">
              <h1 className="text-[#0f2c59] text-[75px] font-black font-serif tracking-widest drop-shadow-md leading-none">FASI</h1>
              <h2 className="text-[#d4af37] text-[15px] font-bold font-sans uppercase tracking-[0.2em] mt-2 drop-shadow-sm">Festival Anak Sholeh Indonesia</h2>
            </div>

            <div className="space-y-6 mt-4">
              <div className="flex flex-col">
                <span className="text-[#0f2c59] font-black text-[16px] mb-1">NAMA:</span>
                <span className="font-bold text-[24px] border-b-[4px] border-gray-800 leading-tight pb-1.5 truncate">{nama}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#0f2c59] font-black text-[16px] mb-1">LEMBAGA:</span>
                <span className="font-bold text-[24px] border-b-[4px] border-gray-800 leading-tight pb-1.5 truncate">{lembaga}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#0f2c59] font-black text-[16px] mb-1">CABANG LOMBA:</span>
                <span className="font-bold text-[24px] border-b-[4px] border-gray-800 leading-tight pb-1.5 truncate">{cabangLomba}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#0f2c59] font-black text-[16px] mb-1">TINGKAT USIA (TPQ/TKQ/TQA):</span>
                <span className="font-bold text-[24px] border-b-[4px] border-gray-800 leading-tight pb-1.5 truncate">{tingkatUsia}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-0 w-full flex justify-center z-20">
            <div className="text-white bg-[#0a4d33] font-black text-[22px] tracking-[0.15em] px-8 py-2 rounded-xl shadow-lg border-[3px] border-[#d4af37]">
              ID: {idPeserta}
            </div>
        </div>
      </div>
    </div>
  );
};

// --- WRAPPER FISIK CETAK: Kunci container ke persis 6.5cm x 10.2cm (245.5px x 385.5px standard web) ---
export const IDCardPrintBox = ({ p, memberName, memberId }) => (
  <div style={{ width: '245.5px', height: '385.5px' }} className="relative print:break-inside-avoid shrink-0 bg-white mx-auto shadow-xl print:shadow-none overflow-hidden rounded-xl border border-gray-200 print:border-none">
    {/* Skala card 491x771 menjadi separuhnya agar pas persis di 245.5x385.5 */}
    <div style={{ width: '491px', height: '771px', transform: 'scale(0.5)', transformOrigin: 'top left' }} className="absolute top-0 left-0">
      <IDCard p={p} memberName={memberName} memberId={memberId} />
    </div>
  </div>
);

// --- DEFAULT EXPORT UNTUK PREVIEW ---
export default function App() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-8">
      <h3 className="text-xl font-bold text-slate-700 mb-6">Preview Komponen ID Card</h3>
      <IDCardPrintBox />
    </div>
  );
}
