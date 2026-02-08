
import React from 'react';
import { Role, Message } from '../types';

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isModel = message.role === Role.MODEL;

  // Function to detect titles (lines ending with colon or short lines at start of paragraphs)
  const formatContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return <div key={index} className="h-4" />;

      // Detect "titles" or "keywords" (e.g., lines that end with a colon or specific keywords)
      const isTitle = trimmedLine.endsWith(':') || 
                      (trimmedLine.length < 50 && index === 0) ||
                      (trimmedLine.toUpperCase() === trimmedLine && trimmedLine.length > 3);

      let textColor = '';
      if (isModel) {
        textColor = isTitle ? 'text-[#001F3F] font-extrabold text-[18px] mt-4' : 'text-slate-700';
      } else {
        // User messages: Use high contrast colors for the dark blue background
        textColor = isTitle ? 'text-[#A4C639] font-extrabold text-[18px] mt-2' : 'text-white';
      }

      return (
        <p 
          key={index} 
          className={`mb-3 last:mb-0 leading-relaxed ${textColor}`}
        >
          {trimmedLine}
        </p>
      );
    });
  };

  return (
    <div className={`flex ${isModel ? 'justify-start' : 'justify-end'} mb-10 animate-message`}>
      <div className={`max-w-[85%] md:max-w-[75%] rounded-[2rem] p-8 glass-card relative group transition-all duration-500 hover:shadow-xl ${
        isModel 
          ? 'border-l-8 border-l-[#A4C639]' 
          : 'bg-[#001F3F] rounded-tr-none shadow-2xl shadow-[#001F3F]/20 border-r-4 border-r-[#A4C639]/20'
      }`}>
        {isModel && (
          <div className="flex items-center mb-6">
            <div className="w-14 h-14 rounded-full border-2 border-[#A4C639] overflow-hidden bg-white shadow-md transition-transform group-hover:rotate-6">
              <img 
                src="https://i.postimg.cc/BQT208Q9/Generated-Image-November-15-2025-3-43PM-(1).png" 
                alt="Douly Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="ml-4">
              <span className="font-extrabold text-sm text-[#001F3F] uppercase tracking-widest block">Douly Core IA</span>
              <span className="text-[9px] text-[#A4C639] font-black uppercase tracking-[0.2em]">Auditrice Stratégique</span>
            </div>
          </div>
        )}
        
        <div className={`text-[16px] font-medium tracking-tight`}>
          {formatContent(message.text)}
        </div>
        
        <div className={`flex justify-between items-center mt-6 pt-4 border-t ${isModel ? 'border-slate-200/30' : 'border-white/10'}`}>
          {isModel ? (
            <div className="text-[9px] text-slate-400 flex items-center bg-white/50 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest border border-slate-100">
              <span className="mr-2">👓</span> 
              <span>Perspective Dr Happy</span>
            </div>
          ) : (
            <div className="text-[9px] text-[#A4C639] flex items-center font-black tracking-widest uppercase">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              Requête Docteur
            </div>
          )}
          <div className={`text-[9px] font-mono tracking-tighter ml-auto ${isModel ? 'text-slate-300' : 'text-white/40'}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
