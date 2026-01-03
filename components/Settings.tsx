
import React, { useState, useRef } from 'react';
import { Camera, User as UserIcon, Mail, Shield, Save, Check, Loader2, Download, Upload, Database, Github, Server, RefreshCw, Info, Key, FileJson, ShieldAlert, Activity, Binary, Cpu } from 'lucide-react';
import { User, GitHubConfig } from '../types';
import { db } from '../services/database';

interface SettingsProps {
  user: User;
  onUserUpdate: (user: User) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUserUpdate }) => {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [avatar, setAvatar] = useState(user.avatar);
  const [isSaving, setIsSaving] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const [ghConfig, setGhConfig] = useState<GitHubConfig>(user.githubConfig || {
    token: '', owner: '', repo: '', path: 'printverse_db.json', autoSync: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsOptimizing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        setAvatar(reader.result as string);
        setIsOptimizing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const updated = await db.updateUser({ username, email, avatar });
    onUserUpdate(updated);
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="h-full w-full flex flex-col p-8 gap-8 animate-in fade-in duration-500 overflow-hidden">
      <header className="shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">System <span className="text-blue-500">Config</span></h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-2 italic opacity-60">Nexus Terminal Environment Settings</p>
        </div>
        <div className="bg-blue-600/10 border border-blue-500/20 px-6 py-3 rounded-2xl flex items-center gap-3">
           <Server size={20} className="text-blue-500" />
           <span className="text-[10px] font-black uppercase text-blue-500 italic tracking-widest">Environment: Stable v10.5</span>
        </div>
      </header>

      <section className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
        <div className="lg:w-[400px] flex flex-col gap-6 shrink-0 h-full">
          <div className="glass rounded-[48px] p-10 flex flex-col items-center border-white/5 bg-slate-900/40 shadow-2xl">
            <div className="relative group cursor-pointer" onClick={() => !isOptimizing && fileInputRef.current?.click()}>
              <div className="w-32 h-32 rounded-[40px] overflow-hidden border-4 border-blue-600/20 shadow-2xl">
                <img src={avatar} className="w-full h-full object-cover" alt="User Avatar" />
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-[40px] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                {isOptimizing ? <Loader2 className="text-white animate-spin" size={32} /> : <Camera className="text-white" size={32} />}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
            </div>
            <h3 className="mt-8 text-2xl font-black italic text-white uppercase tracking-tighter">{username}</h3>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-2 italic">Operator Rank: Prime</p>
          </div>

          <div className="glass rounded-[48px] p-10 border-emerald-500/20 bg-emerald-600/5 space-y-6 flex-1 shadow-2xl">
             <div className="flex items-center gap-3 text-emerald-400">
                <ShieldAlert size={24} />
                <h4 className="text-xs font-black uppercase tracking-widest italic leading-none">Daten-Tresor</h4>
             </div>
             <p className="text-[10px] text-slate-400 font-bold uppercase italic leading-relaxed">Sichere dein komplettes Lager und deine Projekte lokal als JSON-Backup.</p>
             <div className="space-y-3 pt-4">
                <button onClick={() => db.exportBackup().then(d => {
                  const blob = new Blob([d], { type: 'application/json' });
                  const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
                  link.download = `Nexus_Backup.json`; link.click();
                })} className="w-full bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl transition-all border border-white/10 text-[10px] uppercase italic tracking-widest">Export Backup</button>
                <button onClick={() => backupInputRef.current?.click()} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg text-[10px] uppercase italic tracking-widest">Import Backup</button>
                <input type="file" ref={backupInputRef} className="hidden" accept=".json" onChange={async (e) => {
                   const file = e.target.files?.[0]; if(!file) return;
                   const reader = new FileReader(); reader.onload = async (ev) => { await db.importBackup(ev.target?.result as string); window.location.reload(); };
                   reader.readAsText(file);
                }} />
             </div>
          </div>
        </div>

        <div className="flex-1 glass rounded-[56px] p-12 border-white/5 bg-slate-900/40 shadow-3xl overflow-y-auto scrollbar-hide">
           <div className="max-w-2xl space-y-12">
              <div className="space-y-8">
                 <h3 className="text-xs font-black uppercase text-slate-500 tracking-[0.4em] italic leading-none">Identity Mapping</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Username</label>
                       <input className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-8 text-sm font-bold text-white outline-none focus:border-blue-500 transition-all" value={username} onChange={e => setUsername(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Email Uplink</label>
                       <input className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-8 text-sm font-bold text-white outline-none focus:border-blue-500 transition-all" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                 </div>
              </div>

              <div className="space-y-8 pt-12 border-t border-white/5">
                 <h3 className="text-xs font-black uppercase text-slate-500 tracking-[0.4em] italic leading-none flex items-center gap-3"><Github size={18}/> Github Cloud Sync</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <input type="password" placeholder="Github Token" className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-8 text-sm font-bold text-white" value={ghConfig.token} onChange={e => setGhConfig({...ghConfig, token: e.target.value})} />
                    <input placeholder="Repo Name (e.g. 3d-data)" className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-8 text-sm font-bold text-white" value={ghConfig.repo} onChange={e => setGhConfig({...ghConfig, repo: e.target.value})} />
                 </div>
              </div>

              <div className="pt-12 flex items-center gap-6">
                 <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-500 text-white font-black py-6 px-12 rounded-[28px] transition-all shadow-xl uppercase italic tracking-tighter text-sm flex items-center gap-3">
                    {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />} Commit Settings
                 </button>
                 {showSuccess && <div className="text-emerald-500 font-black uppercase text-[10px] italic flex items-center gap-2 animate-in slide-in-from-left-4"><Check size={16}/> Saved to Local Storage</div>}
              </div>
           </div>
        </div>
      </section>

      <footer className="shrink-0 glass rounded-[32px] border-white/5 bg-slate-900/40 p-6 flex flex-wrap items-center justify-between gap-8 shadow-2xl mb-2">
         <div className="flex items-center gap-8 border-r border-white/10 pr-10">
            <Activity size={24} className="text-blue-500 animate-pulse" />
            <div>
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] leading-none italic">Environment Status</p>
               <p className="text-sm font-black italic text-white mt-1.5 uppercase leading-none tracking-tight">Security Protocol: AES-256</p>
            </div>
         </div>
         
         <div className="flex-1 flex gap-12 justify-center">
            <div className="flex items-center gap-3">
               <Binary size={14} className="text-slate-500" />
               <p className="text-[11px] font-bold text-slate-300 uppercase italic">Local First Policy: ON</p>
            </div>
            <div className="flex items-center gap-3">
               <Cpu size={14} className="text-slate-500" />
               <p className="text-[11px] font-bold text-slate-300 uppercase italic">Worker Threads: Active</p>
            </div>
            <div className="flex items-center gap-3">
               <Database size={14} className="text-slate-500" />
               <p className="text-[11px] font-bold text-slate-300 uppercase italic">DB Health: 100%</p>
            </div>
         </div>

         <div className="text-right pl-10 border-l border-white/10">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none italic">Station ID</p>
            <p className="text-[11px] font-mono font-bold text-blue-500 mt-1 uppercase italic leading-none">CONFIG-NODE-PX-992</p>
         </div>
      </footer>
    </div>
  );
};

export default Settings;
