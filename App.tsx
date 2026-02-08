
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import MessageItem from './components/MessageItem';
import ReportModal from './components/ReportModal';
import { Role, Message, AuditReport } from './types';
import { geminiService } from './services/geminiService';

const INITIAL_MESSAGE: Message = {
  role: Role.MODEL,
  text: `Bonjour Docteur Happy.

C'est un véritable privilège pour DOULIA de vous accompagner à l'Hôpital Laquintinie. Derrière votre regard d'experte, nous devinons une grande ambition pour la pédiatrie, malgré le poids de vos responsabilités quotidiennes.

Je suis ici pour apprendre de vous, afin de concevoir un assistant qui vous ressemble.

Pour commencer, si vous pouviez déléguer une seule tâche, administrative ou clinique, qui vous prend trop de temps aujourd'hui, laquelle choisiriez-vous ?`,
  timestamp: new Date()
};

const STORAGE_KEY_MESSAGES = 'doulia_messages';
const STORAGE_KEY_STEP = 'doulia_audit_step';

// Helper functions for audio decoding
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [auditStep, setAuditStep] = useState(0);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ data: string, mimeType: string, name: string } | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const recognitionRef = useRef<any>(null);

  // Persistence initialization
  useEffect(() => {
    const savedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES);
    const savedStep = localStorage.getItem(STORAGE_KEY_STEP);
    
    if (savedMessages) {
      const parsed = JSON.parse(savedMessages);
      setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
    } else {
      setMessages([INITIAL_MESSAGE]);
    }

    if (savedStep) {
      setAuditStep(parseInt(savedStep, 10));
    }
    
    // Setup Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'fr-FR';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    setIsInitialized(true);
  }, []);

  // Sync with localStorage
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
      localStorage.setItem(STORAGE_KEY_STEP, auditStep.toString());
    }
  }, [messages, auditStep, isInitialized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, isSynthesizing]);

  const stopSpeech = () => {
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
      } catch (e) {
        // Source might already be stopped
      }
      currentAudioSourceRef.current = null;
    }
  };

  const playAudioResponse = async (text: string) => {
    // Ensure existing speech is stopped before starting a new one
    stopSpeech();

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = audioContextRef.current;
    
    const base64Audio = await geminiService.generateSpeech(text);
    if (base64Audio) {
      const audioBytes = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(audioBytes, ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      currentAudioSourceRef.current = source;
      source.start();
      
      source.onended = () => {
        if (currentAudioSourceRef.current === source) {
          currentAudioSourceRef.current = null;
        }
      };
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      setSelectedFile({
        data: base64,
        mimeType: file.type,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      // If Douly is talking, stop her when the user wants to record a new query
      stopSpeech();
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !selectedFile) || isThinking || isSynthesizing) return;

    // Stop Douly immediately when user sends a new question
    stopSpeech();

    // Initialize audio context on first user interaction to comply with browser policies
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    const userText = selectedFile 
      ? `${inputValue}\n\nDOCUMENT JOINT : ${selectedFile.name}` 
      : inputValue;

    const userMsg: Message = {
      role: Role.USER,
      text: userText,
      timestamp: new Date()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    const currentInput = inputValue;
    const currentFile = selectedFile;
    
    setInputValue('');
    setSelectedFile(null);
    setIsThinking(true);

    try {
      const responseText = await geminiService.sendMessage(currentInput, newMessages, currentFile || undefined);
      
      const modelMsg: Message = {
        role: Role.MODEL,
        text: responseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, modelMsg]);
      setAuditStep(prev => prev + 1);
      
      // Speak the response
      playAudioResponse(responseText);
    } catch (error) {
      console.error(error);
    } finally {
      setIsThinking(false);
    }
  };

  const generateReport = async () => {
    if (isSynthesizing) return;
    stopSpeech();
    setIsSynthesizing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const finalReport = await geminiService.generateFinalReport(messages);
      setReport(finalReport);
      setShowReport(true);
    } catch (error) {
      alert("Une erreur s'est produite lors de la génération du rapport.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm("Docteur, souhaitez-vous réinitialiser cet audit ?")) {
      stopSpeech();
      localStorage.removeItem(STORAGE_KEY_MESSAGES);
      localStorage.removeItem(STORAGE_KEY_STEP);
      setMessages([INITIAL_MESSAGE]);
      setAuditStep(0);
      setReport(null);
      setShowReport(false);
    }
  };

  const progressPercentage = Math.min((auditStep / 5) * 100, 100);

  if (!isInitialized) return null;

  return (
    <div className="flex flex-col h-screen max-h-screen relative z-10 overflow-hidden">
      <Header />
      
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-20 lg:px-48 xl:px-[25vw] scroll-smooth">
        {/* Compact Progress Tracker */}
        <div className="sticky top-0 z-40 bg-white/50 backdrop-blur-xl mb-6 py-3 border-b border-[#001F3F]/5 flex items-center justify-between px-6 rounded-2xl shadow-sm">
          <div className="flex-1 mr-8">
            <div className="flex justify-between items-center mb-1.5 text-[9px] font-black text-[#001F3F] uppercase tracking-[0.3em]">
              <span>Cycle d'Audit IA</span>
              <span className="text-[#A4C639]">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="h-1 w-full bg-slate-200/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#001F3F] via-[#A4C639] to-[#001F3F] bg-[length:200%_auto] animate-[shimmer_3s_infinite_linear] transition-all duration-700 ease-out shadow-[0_0_8px_rgba(164,198,57,0.3)]"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
          <button 
            onClick={clearHistory}
            className="hidden md:flex flex-col items-end text-[8px] text-[#001F3F]/30 hover:text-red-500 font-black uppercase tracking-widest transition-colors"
          >
            <span>Réinitialiser</span>
            <div className="w-1 h-1 rounded-full bg-red-400 mt-0.5 opacity-20"></div>
          </button>
        </div>

        {/* Message List */}
        <div className="space-y-6 pb-2">
          {messages.map((msg, index) => (
            <MessageItem key={index} message={msg} />
          ))}
          
          {isThinking && (
            <div className="flex justify-start mb-6">
              <div className="glass-card rounded-2xl p-4 flex items-center space-x-4 border-l-4 border-[#A4C639] animate-pulse">
                <div className="flex space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-[#A4C639] rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-[#A4C639] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-[#A4C639] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                </div>
                <span className="text-[9px] text-[#001F3F] font-black uppercase tracking-widest">Douly analyse votre expertise...</span>
              </div>
            </div>
          )}

          {isSynthesizing && (
            <div className="flex justify-center my-10 animate-pulse">
              <div className="bg-[#001F3F] text-white rounded-[2rem] p-10 flex flex-col items-center shadow-2xl relative overflow-hidden group border border-[#A4C639]/20">
                <div className="flex space-x-2 mb-6">
                  <div className="w-2.5 h-2.5 bg-[#A4C639] rounded-full animate-ping"></div>
                  <div className="w-2.5 h-2.5 bg-[#A4C639] rounded-full animate-ping [animation-delay:0.2s]"></div>
                </div>
                <div className="text-xl font-black gradient-text mb-1 text-center uppercase tracking-tighter text-[#A4C639]">Intelligence DOULIA</div>
                <p className="text-[9px] text-slate-400 uppercase tracking-[0.4em] font-black text-center">Interconnexion Hôpital Laquintinie</p>
                <p className="text-[9px] mt-6 opacity-40 italic font-bold tracking-[0.2em] text-slate-200">Précision stratégique Dr Happy.</p>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Compact Footer Area */}
      <footer className="bg-white/80 backdrop-blur-2xl border-t border-slate-100 p-3 md:p-4 lg:px-48 xl:px-[25vw] relative overflow-hidden shadow-[0_-8px_20px_rgba(0,0,0,0.02)]">
        <div className="max-w-5xl mx-auto flex flex-col space-y-3">
          
          {/* Compact File Preview */}
          {selectedFile && (
            <div className="flex items-center space-x-3 bg-[#001F3F]/5 border border-[#001F3F]/10 p-2 rounded-xl animate-message">
              <div className="bg-[#001F3F] p-1.5 rounded-lg text-[#A4C639] shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-[#001F3F] truncate">{selectedFile.name}</p>
              </div>
              <button onClick={removeFile} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {auditStep >= 3 && !showReport && (
            <div className="flex justify-center -mt-1 mb-1">
              <button
                onClick={generateReport}
                disabled={isSynthesizing}
                className={`bg-[#001F3F] text-[#A4C639] font-black py-2.5 px-8 rounded-full text-[9px] transition-all flex items-center uppercase tracking-[0.3em] shadow-lg shadow-[#001F3F]/10 group border border-[#A4C639]/20 ${
                  isSynthesizing ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-xl hover:scale-105 active:scale-95'
                }`}
              >
                {isSynthesizing ? (
                  <div className="flex items-center">
                    <span className="mr-3">Synthèse Stratégique</span>
                    <div className="flex items-center space-x-1">
                        <div className="w-1 h-1 bg-[#A4C639] rounded-full animate-[dot-pulse_1.5s_infinite_ease-in-out]"></div>
                        <div className="h-[1px] bg-[#A4C639]/40 animate-[line-shimmer_1.5s_infinite_ease-in-out]"></div>
                        <div className="w-1 h-1 bg-[#A4C639] rounded-full animate-[dot-pulse_1.5s_infinite_ease-in-out_0.3s]"></div>
                        <div className="h-[1px] bg-[#A4C639]/40 animate-[line-shimmer_1.5s_infinite_ease-in-out_0.3s]"></div>
                        <div className="w-1 h-1 bg-[#A4C639] rounded-full animate-[dot-pulse_1.5s_infinite_ease-in-out_0.6s]"></div>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="mr-3">Synthétiser l'Audit</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}
          
          <div className="flex items-center space-x-3">
            {/* Attachment Button */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="relative p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#A4C639] transition-all shadow-sm group overflow-hidden active:scale-90"
              title="Ajouter un dossier"
            >
              <div className="absolute inset-0 bg-[#A4C639]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 group-hover:text-[#001F3F] transition-all duration-300 group-hover:-rotate-12 group-hover:scale-110 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx,.jpg,.png,.txt" />
            
            {/* Microphone Button */}
            <button 
              onClick={toggleRecording}
              className={`p-3 rounded-2xl transition-all shadow-sm active:scale-90 relative overflow-hidden group border ${
                isRecording 
                  ? 'bg-red-500 text-white border-red-600 animate-pulse' 
                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-[#A4C639]'
              }`}
              title="Dicter votre message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${!isRecording && 'group-hover:text-[#001F3F] transition-colors'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              {isRecording && (
                <div className="absolute inset-0 bg-white/20 animate-ping"></div>
              )}
            </button>

            <div className="flex-1 relative group">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                disabled={isSynthesizing}
                placeholder={isSynthesizing ? "Doulia analyse..." : "Poursuivez votre pensée, Docteur..."}
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#001F3F] rounded-2xl p-3 pr-10 text-[#001F3F] text-sm placeholder:text-slate-400 focus:outline-none transition-all font-bold resize-none min-h-[50px] max-h-[100px] disabled:opacity-50"
                rows={1}
              />
              <div className="absolute right-3 bottom-3 flex space-x-1 opacity-0 group-focus-within:opacity-30 transition-opacity">
                <div className="w-1.5 h-1.5 bg-[#001F3F] rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-[#A4C639] rounded-full"></div>
              </div>
            </div>
            
            <button
              onClick={handleSendMessage}
              disabled={(!inputValue.trim() && !selectedFile) || isThinking || isSynthesizing}
              className={`p-3 rounded-2xl transition-all flex items-center justify-center shadow-lg transform ${
                (!inputValue.trim() && !selectedFile) || isThinking || isSynthesizing
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200 shadow-none'
                  : 'bg-[#001F3F] text-white hover:scale-105 active:scale-95 shadow-[#001F3F]/20'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className="flex justify-center items-center py-1">
             <div className="text-[7px] md:text-[8px] text-slate-400 font-black uppercase tracking-[0.4em]">
                Doulia Ecosystem • Health Innovation
             </div>
          </div>
        </div>
      </footer>

      {showReport && report && (
        <ReportModal report={report} onClose={() => setShowReport(false)} />
      )}
    </div>
  );
};

export default App;
