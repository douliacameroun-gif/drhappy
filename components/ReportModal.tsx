
import React from 'react';
import { AuditReport } from '../types';

interface ReportModalProps {
  report: AuditReport;
  onClose: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ report, onClose }) => {
  const handleWhatsAppShare = () => {
    const text = `SYNTHESE AUDIT DOULIA\n\nDocteur Happy - Hôpital Laquintinie\n\nFONCTIONNALITE : ${report.priorityFeature}\nGAIN ESTIMÉ : ${report.timeGain}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#001F3F]/95 backdrop-blur-xl animate-fadeIn">
      <div className="bg-white rounded-[3rem] w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl relative">
        <div className="p-10 md:p-14">
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 text-slate-400 hover:text-[#001F3F] transition-colors p-2 bg-slate-100 rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center space-y-6 md:space-y-0 md:space-x-8 mb-12">
            <div className="w-32 h-32 bg-white rounded-3xl p-3 shadow-xl flex items-center justify-center border-2 border-slate-50">
              <img src="https://i.postimg.cc/LsPpGcLD/LOGO-DOULIA-OFFICIEL-fond-blanc.png" className="w-full h-full object-contain" alt="Doulia Official" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-[#001F3F] tracking-tighter uppercase leading-tight">Synthèse d'Audit IA</h2>
              <div className="flex items-center mt-2">
                <span className="text-[#A4C639] font-extrabold uppercase tracking-[0.2em] text-xs">Exclusivité Dr Happy</span>
                <span className="mx-3 text-slate-200">|</span>
                <span className="text-slate-400 font-bold text-xs uppercase">Laquintinie</span>
              </div>
            </div>
          </div>

          <div className="space-y-12">
            <section className="bg-slate-50 rounded-[2rem] p-8">
              <h3 className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] mb-6 flex items-center">
                <span className="w-8 h-[2px] bg-[#A4C639] mr-4"></span>
                Analyse des Flux Actuels
              </h3>
              <p className="text-[#001F3F] text-lg leading-relaxed font-semibold italic">
                {report.dailyLife}
              </p>
            </section>

            <section>
              <h3 className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] mb-6 flex items-center">
                <span className="w-8 h-[2px] bg-red-400 mr-4"></span>
                Points de Friction Identifiés
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {report.painPoints.map((point, i) => (
                  <div key={i} className="flex items-center bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-[#A4C639] mr-4 shadow-[0_0_8px_#A4C639]"></div>
                    <span className="text-[#001F3F] font-bold text-base">{point}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-[#001F3F] text-white rounded-[2.5rem] p-10 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#A4C639]/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
               <h3 className="text-[#A4C639] font-black text-[10px] tracking-[0.4em] mb-6 uppercase">La Solution DOULIA</h3>
               <div className="text-2xl font-black mb-8 leading-snug">
                 {report.priorityFeature}
               </div>
               
               <div className="grid grid-cols-2 gap-6">
                 <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                   <div className="text-[10px] text-[#A4C639] font-black uppercase tracking-widest mb-1">Gain de temps</div>
                   <div className="text-2xl font-black">{report.timeGain}</div>
                 </div>
                 <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                   <div className="text-[10px] text-[#A4C639] font-black uppercase tracking-widest mb-1">Complexité</div>
                   <div className="text-2xl font-black">{report.technicalComplexity}</div>
                 </div>
               </div>
            </section>

            <section className="border-2 border-slate-50 p-10 rounded-[2.5rem]">
               <h3 className="text-[#001F3F] font-black text-xl mb-6 flex items-center">
                 <span className="mr-3">📞</span> Contact DOULIA
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-500 font-bold mb-10">
                 <div className="flex items-center p-4 bg-slate-50 rounded-2xl">
                   <span className="mr-3 text-lg">🌐</span>
                   www.douliacameroun.com
                 </div>
                 <div className="flex items-center p-4 bg-slate-50 rounded-2xl">
                   <span className="mr-3 text-lg">✉️</span>
                   contact@douliacameroun.com
                 </div>
                 <div className="flex flex-col p-4 bg-slate-50 rounded-2xl">
                   <div className="flex items-center mb-1">
                     <span className="mr-3 text-lg">📱</span>
                     (+237) 6 73 04 31 27
                   </div>
                   <div className="flex items-center">
                     <span className="mr-3 text-lg invisible">📱</span>
                     (+237) 6 56 30 48 18
                   </div>
                 </div>
                 <div className="flex items-center p-4 bg-slate-50 rounded-2xl">
                   <span className="mr-3 text-lg">🏥</span>
                   Douala, Cameroun
                 </div>
               </div>
               
               <div className="flex flex-col md:flex-row gap-5">
                 <button 
                   onClick={handleWhatsAppShare}
                   className="flex-1 bg-[#A4C639] text-[#001F3F] font-black py-5 rounded-2xl hover:scale-[1.02] transition-all flex items-center justify-center shadow-xl shadow-[#A4C639]/30 uppercase tracking-widest text-xs"
                 >
                   Confirmer via WhatsApp
                 </button>
                 <button 
                   onClick={onClose}
                   className="px-10 py-5 rounded-2xl border-2 border-slate-100 text-slate-400 font-black hover:bg-slate-50 transition-all text-xs uppercase tracking-widest"
                 >
                   Fermer
                 </button>
               </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
