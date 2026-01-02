
import React, { useState, useEffect } from 'react';
import { Terminal, ShieldCheck, Fingerprint, Cpu, Lock, ArrowRight, Zap, Globe, Rocket, User as UserIcon } from 'lucide-react';
import { User } from '../../types';
import { db } from '../../services/database';

interface AuthGateProps {
  onAuth: (user: User) => void;
}

const AuthGate: React.FC<AuthGateProps> = ({ onAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [terminalText, setTerminalText] = useState('');
  
  const hardwareId = "PA-99-X-" + Math.random().toString(36).substr(2, 4).toUpperCase();

  useEffect(() => {
    const texts = [
      "Initializing Neural Link...",
      "Syncing Local Database...",
      "Ready for Public Operator Input.",
      "Privacy Protocol: Local-Only Storage Active."
    ];
    let i = 0;
    const interval = setInterval(() => {
      setTerminalText(texts[i]);
      i = (i + 1) % texts.length;
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleInstantAccess = async () => {
    setIsLoading(true);
    const guestName = `MAKER_${Math.floor(Math.random() * 9000 + 1000)}`;
    
    setTimeout(async () => {
      const guestUser: User = {
        id: 'guest_' + Date.now(),
        username: guestName,
        email: 'guest@panda-eng.io',
        avatar: `https://i.pravatar.cc/150?u=${guestName}`,
        isPro: false,
        joinedDate: new Date().toLocaleDateString()
      };
      
      await db.login(guestUser);
      onAuth(guestUser);
      setIsLoading(false);
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(async () => {
      const mockUser: User = {
        id: 'user_' + Date.now(),
        username: formData.username || 'Operator_Alpha',
        email: formData.email,
        avatar: `https://i.pravatar.cc/150?u=${formData.username || 'default'}`,
        isPro: true,
        joinedDate: new Date().toLocaleDateString()
      };
      
      await db.login(mockUser);
      onAuth(mockUser);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 glass rounded-[40px] overflow-hidden border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-1000">
        
        {/* Technical Sidebar Branding */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#0f172a] to-black p-12 lg:p-16 flex flex-col justify-between border-r border-white/5 relative">
          <div className="scanline opacity-10" />
          
          <div className="relative z-10 space-y-12">
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                  <span className="text-2xl">🐼</span>
               </div>
               <div>
                  <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase leading-none">PANDA <span className="text-blue-500">ENG.</span></h2>
                  <p className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.3em] mt-1">Laboratory Workstation</p>
               </div>
            </div>

            <div className="space-y-6">
               <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-[0.9]">
                  UNLEASH <br /><span className="text-blue-600">PRECISION.</span>
               </h1>
               <p className="text-slate-400 font-medium italic text-sm leading-relaxed max-w-xs">
                  Die Workstation für jeden Maker. Keine Cloud-Zwänge. Deine Daten bleiben in deinem Browser.
               </p>
            </div>

            <div className="space-y-3 pt-8 border-t border-white/5 font-mono">
               <div className="flex items-center gap-3 text-blue-500/60">
                  <Terminal size={14} />
                  <span className="text-[10px] uppercase tracking-widest">{terminalText}</span>
               </div>
               <div className="flex items-center gap-3 text-slate-600">
                  <Cpu size={14} />
                  <span className="text-[10px] uppercase tracking-widest">Node ID: {hardwareId}</span>
               </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-col gap-4">
             <button 
                onClick={handleInstantAccess}
                disabled={isLoading}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 text-xs uppercase italic tracking-widest group"
             >
                <Rocket size={16} className="text-blue-500 group-hover:scale-110 transition-transform" />
                Quick Launch (Gast-Modus)
             </button>
             <div className="flex gap-4 opacity-40 grayscale">
                <Globe size={18} className="text-slate-500" />
                <ShieldCheck size={18} className="text-slate-500" />
                <Zap size={18} className="text-slate-500" />
             </div>
          </div>
        </div>

        {/* Access Form */}
        <div className="lg:col-span-7 p-12 lg:p-24 flex flex-col justify-center bg-black/20">
          <div className="mb-12">
            <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter">Personal Station</h3>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-2 italic">Identifikation erforderlich für Sync</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {!isLogin && (
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-600 ml-4 tracking-[0.2em]">Operator Tag</label>
                <input 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-sm focus:border-blue-500 transition-all outline-none text-white italic font-bold"
                  placeholder="Z.B. MAKER_PRO"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                />
              </div>
            )}
            
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-600 ml-4 tracking-[0.2em]">Neural ID (E-Mail)</label>
              <input 
                type="email"
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-sm focus:border-blue-500 transition-all outline-none text-white italic font-bold"
                placeholder="operator@nexus.io"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-600 ml-4 tracking-[0.2em]">Sicherheits-Code</label>
              <div className="relative">
                <Lock className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700" size={18} />
                <input 
                  type="password"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-sm focus:border-blue-500 transition-all outline-none text-white font-bold"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <button 
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-[24px] transition-all shadow-2xl shadow-blue-900/30 uppercase italic tracking-tighter text-lg flex items-center justify-center gap-4 mt-6 group"
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                   <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                   <span className="text-sm uppercase font-mono">Authorizing...</span>
                </div>
              ) : (
                <> {isLogin ? 'ENTER WORKSTATION' : 'INITIALIZE STATION'} <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" /> </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-black uppercase text-slate-600 hover:text-blue-400 transition-colors tracking-widest italic"
            >
              {isLogin ? 'Neuen Account anlegen' : 'Bereits registriert? Login'}
            </button>
            <div className="flex items-center gap-3 opacity-20">
               <Fingerprint size={24} className="text-white" />
               <span className="text-[8px] font-mono text-white">LOCAL-SYNC ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthGate;
