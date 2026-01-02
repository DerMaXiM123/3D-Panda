
import React, { useState, useRef } from 'react';
import { Camera, User as UserIcon, Mail, Shield, Save, Check, Loader2, Download, Upload, Database, Github, Cloud, RefreshCw, AlertCircle, ExternalLink, Info, Gift, Key, Server, Terminal, FileJson, ShieldAlert } from 'lucide-react';
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
    token: '',
    owner: '',
    repo: '',
    path: 'printverse_db.json',
    autoSync: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsOptimizing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await db.compressImage(reader.result as string, 300, 0.8);
        setAvatar(compressed);
        setIsOptimizing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    const data = await db.exportBackup();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `panda_nexus_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    setIsExporting(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        await db.importBackup(ev.target?.result as string);
        alert("Import erfolgreich! Die Seite wird neu geladen.");
        window.location.reload();
      } catch (err) {
        alert("Fehler beim Importieren der Datei.");
      }
    };
    reader.readAsText(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await db.updateUser({ 
        username, 
        email, 
        avatar,
        githubConfig: ghConfig.token ? ghConfig : undefined 
      });
      onUserUpdate(updated);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Fehler beim Speichern.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">Maker Central Control</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1 italic">Verwalte dein Profil und dein Cloud-Setup</p>
        </div>
        <div className="bg-blue-600/10 border border-blue-500/20 px-6 py-3 rounded-2xl flex items-center gap-3">
           <Server size={20} className="text-blue-500" />
           <span className="text-[10px] font-black uppercase text-blue-500 italic tracking-widest">Environment: {window.location.hostname === 'localhost' ? 'Local' : 'Cloud'}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Avatar & Quick Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass rounded-[40px] p-8 flex flex-col items-center border-white/5 bg-slate-900/40">
            <div className="relative group cursor-pointer" onClick={() => !isOptimizing && fileInputRef.current?.click()}>
              <div className={`w-32 h-32 rounded-[40px] overflow-hidden border-4 border-blue-600/20 transition-transform group-hover:scale-105 ${isOptimizing ? 'opacity-50' : ''}`}>
                <img src={avatar} className="w-full h-full object-cover" alt="User Avatar" />
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {isOptimizing ? <Loader2 className="text-white animate-spin" size={32} /> : <Camera className="text-white" size={32} />}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
            </div>
            <h3 className="mt-6 text-xl font-black italic text-white uppercase tracking-tighter">{username}</h3>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1 italic">PRO-MAKER (Nexus Member)</p>
          </div>

          {/* DATA VAULT / BACKUP SECTION */}
          <div className="glass rounded-[40px] p-8 border-emerald-500/20 bg-emerald-600/5 space-y-6">
             <div className="flex items-center gap-3 text-emerald-400">
                <ShieldAlert size={24} />
                <h4 className="text-xs font-black uppercase tracking-widest italic">Daten-Tresor</h4>
             </div>
             <p className="text-[9px] text-slate-400 font-bold uppercase leading-relaxed italic">
                Sichere dein komplettes Lager und deine Projekte lokal als JSON-Backup.
             </p>
             <div className="flex flex-col gap-3">
                <button 
                  onClick={handleExport}
                  className="w-full bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl transition-all border border-white/10 flex items-center justify-center gap-3 text-[10px] uppercase italic tracking-widest"
                >
                   {isExporting ? <RefreshCw className="animate-spin" size={14}/> : <FileJson size={14}/>}
                   Export Backup
                </button>
                <button 
                  onClick={() => backupInputRef.current?.click()}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3 text-[10px] uppercase italic tracking-widest"
                >
                   <Upload size={14}/> Import Backup
                </button>
                <input type="file" ref={backupInputRef} className="hidden" accept=".json" onChange={handleImport} />
             </div>
          </div>
        </div>

        {/* Right Column: Main Form */}
        <div className="lg:col-span-8 space-y-8">
          <div className="glass rounded-[48px] p-10 space-y-8 border-white/5 bg-slate-900/40">
             <div className="flex justify-between items-start">
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-[0.3em] italic">Basis-Einstellungen</h3>
                <div className="bg-white/5 p-3 rounded-2xl"><UserIcon size={20} className="text-slate-500" /></div>
             </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-4 tracking-widest">Anzeigename</label>
                <input className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:border-blue-500 transition-all outline-none text-white" value={username} onChange={e => setUsername(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-4 tracking-widest">E-Mail Adresse</label>
                <input type="email" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:border-blue-500 transition-all outline-none text-white" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="pt-8 border-t border-white/5 flex items-center justify-between">
              <button onClick={handleSave} disabled={isSaving || isOptimizing} className="bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-10 rounded-[20px] transition-all shadow-xl shadow-blue-900/20 uppercase italic tracking-tighter text-sm flex items-center gap-3">
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Einstellungen sichern
              </button>
              {showSuccess && (
                <div className="flex items-center gap-2 text-emerald-500 font-black italic uppercase text-[10px] animate-in slide-in-from-right-4">
                  <Check size={16} /> Konfiguration lokal gesichert
                </div>
              )}
            </div>
          </div>
          
          <div className="glass rounded-[48px] p-10 border-white/5 bg-slate-900/40 space-y-6">
             <div className="flex items-center gap-3">
                <Github size={24} className="text-slate-400" />
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest italic">GitHub Cloud Sync</h3>
             </div>
             <p className="text-[10px] text-slate-500 font-bold uppercase italic leading-relaxed">
               Nutze ein privates Repository, um dein Inventar über mehrere Geräte hinweg zu synchronisieren.
             </p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="password" 
                  placeholder="GitHub Token" 
                  className="bg-black/20 border border-white/10 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-blue-500"
                  value={ghConfig.token}
                  onChange={e => setGhConfig({...ghConfig, token: e.target.value})}
                />
                <input 
                  placeholder="Repo Name (z.B. my-3d-data)" 
                  className="bg-black/20 border border-white/10 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-blue-500"
                  value={ghConfig.repo}
                  onChange={e => setGhConfig({...ghConfig, repo: e.target.value})}
                />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
