
import React, { useEffect, useState } from 'react';
import { AppView, Filament, User, Friend, Printer, PrintLogEntry } from '../types';
import { Activity, Zap, Package, Server, Users, Box, Flower2, Cog, Fingerprint, Wrench, Mountain, HeartPulse, ShieldCheck, Timer, Cpu, ListChecks, Share2, Radio, Database, ChevronRight, Binary, Image as ImageIcon, Globe, ScanFace, Droplets, Ruler, Gauge, BookOpen, MessageSquare, Microscope, Scale, Type, FileCode, QrCode, Maximize2, ListTodo, Cloud } from 'lucide-react';
import { db } from '../services/database';
// Corrected casing to match file system (Ads instead of ads)
import AdBanner from './Ads/AdBanner';

interface DashboardProps {
  onViewChange: (view: AppView) => void;
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ onViewChange, user }) => {
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [stats, setStats] = useState({ totalWeight: 0, totalValue: 0 });

  useEffect(() => {
    db.getFilaments().then(data => {
      setFilaments(data);
      const total = data.reduce((acc, f) => acc + f.remaining, 0);
      setStats({ totalWeight: total, totalValue: data.length * 25 });
    });
  }, []);

  return (
    <div className="space-y-16 max-w-7xl mx-auto animate-in fade-in duration-1000 pb-32">
      <header className="relative">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="px-4 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-full flex items-center gap-2.5">
                <ShieldCheck size={14} className="text-blue-500" />
                <span className="text-[10px] font-black uppercase text-blue-400 tracking-[0.2em] italic">STATION STATUS: OPTIMAL</span>
              </div>
            </div>
            <h1 className="text-8xl font-black tracking-tighter italic uppercase text-white leading-none">
              NEXUS <span className="text-blue-600">COMMAND</span>.
            </h1>
            <p className="text-slate-500 font-bold uppercase text-[11px] tracking-[0.5em] italic opacity-60 ml-2">Operator ID: {user.username.toUpperCase()}-09-PRO</p>
          </div>
          
          <div className="flex flex-wrap gap-4">
             <QuickStat icon={<Box size={20}/>} label="FABRICATOR" value="READY" color="blue" />
             <QuickStat icon={<Zap size={20}/>} label="SYNC" value="ACTIVE" color="emerald" />
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div 
          onClick={() => onViewChange(AppView.CREATOR_BRICK)}
          className="lg:col-span-8 glass rounded-[56px] p-12 border-white/5 bg-slate-900/60 hover:border-blue-500/30 transition-all cursor-pointer group relative overflow-hidden shadow-2xl"
        >
          <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
             <Box size={240} className="text-blue-500 rotate-12" />
          </div>
          <div className="relative z-10 h-full flex flex-col justify-between min-h-[350px]">
             <div>
                <h2 className="text-5xl font-black italic text-white uppercase tracking-tighter leading-none mb-4">Brick Studio</h2>
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-10 max-w-sm leading-relaxed">
                  Generiere parametrische Klemmbausteine mit industrieller Präzision. Sofort druckfertig als STL.
                </p>
             </div>
             <div className="flex items-center gap-6">
                <button className="bg-blue-600 text-white px-10 py-5 rounded-[28px] font-black uppercase italic tracking-widest text-sm shadow-[0_0_40px_rgba(37,99,235,0.4)] group-hover:bg-blue-500 transition-all">
                  Studio betreten
                </button>
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-8">
           <div className="glass rounded-[48px] p-10 border-white/5 bg-slate-900/40 flex-1 space-y-8 shadow-xl">
              <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.4em] italic flex items-center gap-4">
                 <Cpu size={20} className="text-blue-500" /> System Logic
              </h3>
              <div className="space-y-4">
                 <DashboardLink icon={<ScanFace size={18}/>} label="Surface Inspector" view={AppView.VISION_LAB} onClick={onViewChange} color="blue" />
                 <DashboardLink icon={<MessageSquare size={18}/>} label="Expert Engine" view={AppView.CHAT} onClick={onViewChange} color="purple" />
                 <DashboardLink icon={<FileCode size={18}/>} label="G-Code Analyst" view={AppView.GCODE_ANALYST} onClick={onViewChange} color="orange" />
              </div>
           </div>
        </div>
      </section>

      <section>
         <AdBanner slot="1234567890" className="w-full" />
      </section>

      <section className="space-y-12">
        <div className="flex items-center gap-6 px-4">
           <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.6em] italic">Engineering Utility Matrix</h2>
           <div className="h-px flex-1 bg-white/5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <MatrixCard icon={<Flower2 size={24}/>} label="Vase Lab" desc="Parametrischer Spiral-Modus" onClick={() => onViewChange(AppView.CREATOR_VASE)} />
           <MatrixCard icon={<Binary size={24}/>} label="Screw Master" desc="Präzisions-Gewinde CAD" onClick={() => onViewChange(AppView.CREATOR_SCREW)} />
           <MatrixCard icon={<Database size={24}/>} label="Sync Center" desc="Slicer Integration Hub" onClick={() => onViewChange(AppView.SYNC_CENTER)} />
           <MatrixCard icon={<Ruler size={24}/>} label="Spool Math" desc="Material-Volumen Analyse" onClick={() => onViewChange(AppView.SPOOL_MATH)} />
        </div>
      </section>
    </div>
  );
};

const QuickStat = ({ icon, label, value, color }: any) => (
  <div className="glass px-8 py-5 rounded-[32px] border-white/5 flex items-center gap-6 bg-slate-900/40">
     <div className={`p-3 rounded-2xl bg-${color}-500/10 text-${color}-500`}>{icon}</div>
     <div>
        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
        <p className="text-lg font-black italic text-white leading-none mt-1">{value}</p>
     </div>
  </div>
);

const DashboardLink = ({ icon, label, view, onClick, color }: any) => (
  <button 
    onClick={() => onClick(view)}
    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-left group"
  >
     <div className={`p-2 rounded-xl bg-${color}-500/10 text-${color}-500`}>{icon}</div>
     <span className="text-[11px] font-black italic text-slate-300 uppercase tracking-widest flex-1">{label}</span>
     <ChevronRight size={14} className="text-slate-600 group-hover:text-white transition-colors" />
  </button>
);

const MatrixCard = ({ icon, label, desc, onClick }: any) => (
  <button 
    onClick={onClick}
    className="glass p-8 rounded-[40px] border-white/5 bg-slate-900/40 hover:bg-white/5 hover:-translate-y-2 transition-all text-left group shadow-lg"
  >
     <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-blue-500 group-hover:bg-blue-600/10 transition-all mb-8 shadow-inner">
        {icon}
     </div>
     <h3 className="text-lg font-black italic text-white uppercase tracking-tighter leading-none mb-2">{label}</h3>
     <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{desc}</p>
  </button>
);

export default Dashboard;
