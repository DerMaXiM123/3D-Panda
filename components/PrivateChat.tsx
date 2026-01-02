
import React, { useState, useRef, useEffect } from 'react';
import { Send, User as UserIcon, ArrowLeft, MoreHorizontal, ShieldCheck, Play } from 'lucide-react';
import { PrivateMessage, User, Friend } from '../types';
import { db } from '../services/database';

interface PrivateChatProps {
  currentUser: User;
  targetFriend: Friend;
  onBack: () => void;
}

const PrivateChat: React.FC<PrivateChatProps> = ({ currentUser, targetFriend, onBack }) => {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    db.getPrivateMessages(currentUser.id, targetFriend.id).then(setMessages);
  }, [currentUser.id, targetFriend.id]);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const msg = await db.sendPrivateMessage({
      fromId: currentUser.id,
      toId: targetFriend.id,
      text: input
    });
    setMessages(prev => [...prev, msg]);
    setInput('');

    // Simulated Auto-Reply for "social" feel
    if (input.toLowerCase().includes('hallo')) {
        setTimeout(async () => {
            const reply = await db.sendPrivateMessage({
                fromId: targetFriend.id,
                toId: currentUser.id,
                text: `Moin ${currentUser.username}! Was druckst du gerade Schönes?`
            });
            setMessages(prev => [...prev, reply]);
        }, 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-160px)] flex flex-col glass rounded-[48px] overflow-hidden border-white/5 shadow-3xl animate-in slide-in-from-right-8 duration-500">
      <div className="p-6 border-b border-white/5 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 hover:bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all"><ArrowLeft size={20}/></button>
          <div className="relative">
            <img src={targetFriend.avatar} className="w-12 h-12 rounded-xl object-cover border border-white/10" />
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${targetFriend.status === 'online' ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`} />
          </div>
          <div>
            <h3 className="text-lg font-black italic tracking-tighter uppercase text-white flex items-center gap-2">
                {targetFriend.username}
                {targetFriend.isPro && <ShieldCheck size={14} className="text-blue-500" />}
            </h3>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
               {targetFriend.status === 'printing' ? (
                   <span className="flex items-center gap-1.5 text-orange-500"><Play size={10} className="fill-current" /> DRUCKT: {targetFriend.currentPrint}</span>
               ) : 'Zuletzt aktiv: Gerade eben'}
            </span>
          </div>
        </div>
        <button className="bg-white/5 p-3 rounded-xl text-slate-500 hover:text-white transition-colors"><MoreHorizontal size={20}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide bg-slate-900/20">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.fromId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-5 rounded-[28px] text-sm max-w-[75%] shadow-xl ${
              m.fromId === currentUser.id 
              ? 'bg-blue-600 text-white rounded-tr-none' 
              : 'glass border-white/5 rounded-tl-none bg-slate-800'
            }`}>
              <div className="font-medium">{m.text}</div>
              <div className="text-[8px] mt-3 opacity-40 font-black uppercase tracking-widest text-right">
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="p-8 bg-slate-900/60 border-t border-white/5">
        <div className="flex items-center gap-4 glass border-white/10 p-2 rounded-[28px]">
          <input 
            type="text" 
            placeholder={`Schreib ${targetFriend.username} etwas...`} 
            className="flex-1 bg-transparent border-none outline-none py-3 px-4 text-sm font-bold italic"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-4 bg-blue-600 text-white rounded-[20px] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-900/20 disabled:opacity-30"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivateChat;
