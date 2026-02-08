
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-[#001F3F] via-[#002b55] to-[#001F3F] text-white py-4 px-6 md:px-12 flex justify-between items-center shadow-2xl border-b border-white/10 overflow-hidden">
      {/* Scanning effect */}
      <div className="ai-header-scan"></div>
      
      {/* Subtle light beam effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>
      
      <div className="flex items-center group relative z-10">
        <div className="relative">
          {/* Official Doulia Logo on white background */}
          <img 
            src="https://i.postimg.cc/LsPpGcLD/LOGO-DOULIA-OFFICIEL-fond-blanc.png" 
            alt="DOULIA Logo" 
            className="w-14 h-14 md:w-20 md:h-20 object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] transition-all duration-700 group-hover:scale-110 group-hover:rotate-3 bg-white rounded-xl p-1"
          />
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 blur-2xl transition-opacity rounded-full"></div>
        </div>
        <div className="ml-5">
          <h1 className="text-xl md:text-2xl font-black tracking-tighter flex flex-col md:flex-row md:items-center leading-none">
            <span className="animate-ai-title md:mr-3 transition-all duration-500">DOULIA</span>
            <div className="mt-1 md:mt-0 flex items-center">
              <span className="text-[9px] bg-[#A4C639] text-[#001F3F] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-xl shadow-[#A4C639]/30 border border-white/20">
                Audit IA Dr Happy
              </span>
            </div>
          </h1>
          <p className="text-[9px] text-blue-200/40 uppercase tracking-[0.4em] font-black mt-2 flex items-center">
            <span className="w-4 h-[1px] bg-[#A4C639]/30 mr-2"></span>
            Intelligence Médicale Stratégique
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-4 md:space-x-8 relative z-10">
        <div className="hidden sm:flex flex-col items-end leading-none">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black text-[#A4C639] uppercase tracking-[0.2em]">Hôpital Laquintinie</span>
            <div className="w-2 h-2 rounded-full bg-[#A4C639] shadow-[0_0_10px_#A4C639] animate-pulse"></div>
          </div>
          <span className="text-[8px] text-blue-100/40 font-bold mt-1.5 uppercase tracking-widest tracking-tighter">Core v4.2 Deployment</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white p-1.5 shadow-2xl border border-white/20 transition-all hover:scale-105 hover:-translate-y-1 flex items-center justify-center">
            <img 
              src="https://hopitallaquintinie.cm/logos/HLD1322205158.jpg" 
              alt="Logo HLD" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#A4C639] to-[#8fb32e] text-[#001F3F] flex items-center justify-center font-black text-sm shadow-xl shadow-[#A4C639]/30 border-2 border-white/30 transform hover:rotate-12 transition-transform">
            H
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
