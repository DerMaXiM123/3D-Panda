
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Loader2, Sparkles, MessageCircle, MoreHorizontal } from 'lucide-react';
import { ChatMessage, User } from '../types';
import { geminiService } from '../services/geminiService';

interface AIChatProps {
  user: User;
}

const AIChat: React.FC<AIChatProps> = ({ user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'model', 
      text: `Moin ${user.username}! Ich bin der 3D Panda Nexus Architect. Dein Cloud-Backup ist aktiv. Wie kann ich dir heute helfen?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await geminiService.sendMessage(`Context: User is ${user.username}, Pro Member. Message: ${input}`);
      const modelMsg: ChatMessage = { 
        role: 'model', 
        text: response || "Keine Antwort erhalten.", 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, modelMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-160px)] flex flex-col glass rounded-[48px] overflow-hidden border-white/5 shadow-3xl animate-in fade-in duration-500">
      <div className="p-8 border-b border-white/5 bg-slate-900/40 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-2xl relative">
             <div className="text-3xl">🐼</div>
             <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-slate-900 rounded-full" />
          </div>
          <div>
            <h3 className="text-xl font-black italic tracking-tighter uppercase text-white">PANDA <span className="text-blue-500">ARCHITECT</span></h3>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mt-0.5 italic">
               Dienste Online • Cloud-Sync Aktiv
            </span>
          </div>
        </div>
        <div className="flex gap-2">
           <button className="bg-white/5 p-3 rounded-xl text-slate-500 hover:text-white transition-colors"><MoreHorizontal size={20}/></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide bg-slate-900/20">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-5 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${m.role === 'user' ? 'bg-slate-800' : 'bg-blue-600 shadow-blue-900/20'}`}>
                {m.role === 'user' ? <UserIcon size={20} className="text-slate-400" /> : <Sparkles size={20} className="text-white" />}
              </div>
              <div className={`p-6 rounded-[32px] text-sm leading-relaxed shadow-xl ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'glass border-white/5 rounded-tl-none bg-slate-900/60'}`}>
                <div className="whitespace-pre-wrap font-medium tracking-wide">{m.text}</div>
                <div className="text-[9px] mt-4 opacity-40 font-black uppercase tracking-widest">
                  {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4 items-center animate-pulse pl-4">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 flex items-center justify-center">🐼</div>
            <div className="glass px-5 py-2.5 rounded-2xl text-[9px] font-black text-blue-400 uppercase tracking-widest italic">Panda berechnet Parameter...</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-8 bg-slate-900/60 border-t border-white/5 backdrop-blur-xl">
        <div className="flex items-center gap-4 glass border-white/10 p-2.5 pl-8 rounded-[32px] focus-within:border-blue-500/50 focus-within:ring-4 ring-blue-500/10 transition-all shadow-2xl">
          <input 
            type="text" 
            placeholder={`Frag den Panda, ${user.username}...`} 
            className="flex-1 bg-transparent border-none outline-none py-4 text-sm placeholder:text-slate-600 font-bold italic"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-5 rounded-[22px] transition-all ${input.trim() ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/30' : 'bg-white/5 text-slate-600'}`}
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
