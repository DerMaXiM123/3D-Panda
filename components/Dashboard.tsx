import React, { useEffect, useState } from 'react';
import { AppView, User } from '../types';
import { 
  Box, Flower2, ShieldCheck, 
  Database, Binary, ScanFace, 
  Ruler, Gauge, MessageSquare, Microscope, FileCode, QrCode, Mountain, Target, ArrowUpRight
} from 'lucide-react';
import { db } from '../services/database';
// Wichtig: Pfad-Casing muss exakt sein
// Fix: Adjusted folder casing to lowercase 'ads' to resolve TS import conflicts
import AdBanner from './ads/AdBanner';

interface DashboardProps {
  onViewChange: (view: AppView) => void;
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ onViewChange, user }) => {
  const [stats, setStats] = useState({ totalWeight: 0, count: 0 });

  useEffect(() => {
    db.getFilaments().then(data => {
      const total = data.reduce((acc, f) => acc + f.remaining, 0);
      setStats({ totalWeight: total, count: data.length });
    });
  }, []);

  return (
    <div className="h-full w-full flex flex-col p-6 lg:p-10 gap-6 lg:gap-10 animate-in fade-in duration-700 overflow-x-hidden">
      <header className="shrink-0 flex flex-col xl:flex-row xl:items-end justify-between gap-6 w-full">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="px-4 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-full flex items-center gap-2.5">
              <ShieldCheck size={14} className="text-blue-500" />
              <span className="text-[9px] font-black uppercase text-blue-400 tracking-[0.3em] italic">SYSTEM STATUS: NOMINAL</span>
            </div>
          </div>
          <h1 className="text-6xl lg:text-9xl font-black tracking-tighter italic uppercase text-white leading-[0.85]">
            NEXUS <span className="text-blue-600">HUB</span>.
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] lg:text-[11px] tracking-[0.8em] italic opacity-60 ml-2 whitespace-normal break-all max-w-2xl line-clamp-2">
             ACCESS GRANTED // {user.username.toUpperCase()}
          </p>
        </div>
        
        <div className="flex gap-10">
           <div className="text-right">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">INV_WEIGHT</p>
              <p className="text-4xl lg:text-5xl font-black italic text-white mt-1 leading-none">{(stats.totalWeight/1000).toFixed(1)} <span className="text-blue-500">KG</span></p>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">ACTIVE_NODES</p>
              <p className="text-4xl lg:text-5xl font-black italic text-white mt-1 leading-none">{stats.count}</p>
           </div>
        </div>
      </header>

      <section className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 min-h-0 w-full">
         <div 
           onClick={() => onViewChange(AppView.CREATOR_BRICK)}
           className="lg:col-span-2 xl:col-span-3 xl:row-span-2 glass rounded-[48px] lg:rounded-[56px] p-8 lg:p-14 bg-blue-600 border-transparent hover:bg-blue-500 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-blue-900/40"
         >
            <div className="absolute -right-20 -top-20 opacity-10 group-hover:rotate-12 group-hover:scale-110 transition-all duration-1000 pointer-events-none">
               <Box size={800} />
            </div>
            <div className="relative z-10">
               <div className="bg-white/20 p-5 lg:p-6 rounded-3xl w-max mb-8 lg:mb-12"><Target size={48} className="lg:w-[64px] lg:h-[64px] text-white" /></div>
               <h2 className="text-6xl lg:text-8xl font-black italic uppercase tracking-tighter leading-none mb-6 lg:mb-10">Brick Lab</h2>
               <p className="text-blue-100 font-bold uppercase text-xs lg:text-base tracking-widest italic opacity-80 max-w-2xl leading-relaxed">Präzisions-CAD für Klemmbausteine. Parametrischer Geometrie-Generator.</p>
            </div>
            <div className="relative z-10 flex items-center justify-between mt-8">
               <span className="bg-white text-blue-600 px-10 lg:px-14 py-5 lg:py-6 rounded-[24px] lg:rounded-[32px] font-black uppercase italic tracking-widest text-xs lg:text-sm shadow-xl">Execute</span>
               <ArrowUpRight size={32} className="lg:w-[48px] lg:h-[48px] group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform text-white opacity-40 group-hover:opacity-100" />
            </div>
         </div>

         <NodeCard icon={<Database />} label="Lager" desc="Material Logistics" onClick={() => onViewChange(AppView.INVENTORY)} color="emerald" />
         <NodeCard icon={<Flower2 />} label="Vase Lab" desc="Solid Base Pro" onClick={() => onViewChange(AppView.CREATOR_VASE)} color="blue" />
         <NodeCard icon={<ScanFace />} label="Surface AI" desc="Neural Geometry" onClick={() => onViewChange(AppView.VISION_LAB)} color="purple" />
         
         <NodeCard icon={<FileCode />} label="G-Code" desc="Analyst Mode" onClick={() => onViewChange(AppView.GCODE_ANALYST)} color="orange" />
         <NodeCard icon={<Microscope />} label="Inspector" desc="Mesh Viewer" onClick={() => onViewChange(AppView.STL_VIEWER)} color="indigo" />
         <NodeCard icon={<MessageSquare />} label="Nexus AI" desc="Engineer Chat" onClick={() => onViewChange(AppView.CHAT)} color="pink" />
         
         <NodeCard icon={<Ruler />} label="Math" desc="Spool Calc" onClick={() => onViewChange(AppView.SPOOL_MATH)} color="slate" />
         <NodeCard icon={<QrCode />} label="Tags" desc="Label Studio" onClick={() => onViewChange(AppView.QR_STUDIO)} color="cyan" />
         <NodeCard icon={<Mountain />} label="Terrain" desc="Map Forge" onClick={() => onViewChange(AppView.CREATOR_TERRAIN)} color="green" />
      </section>

      <AdBanner slot="1234567890" className="w-full shrink-0" />
    </div>
  );
};

const NodeCard = ({ icon, label, desc, onClick, color }: any) => {
   const colors: any = {
      blue: 'hover:bg-blue-600/10 hover:border-blue-500/30 text-blue-500',
      emerald: 'hover:bg-emerald-600/10 hover:border-emerald-500/30 text-emerald-500',
      purple: 'hover:bg-purple-600/10 hover:border-purple-500/30 text-purple-500',
      orange: 'hover:bg-orange-600/10 hover:border-orange-500/30 text-orange-500',
      indigo: 'hover:bg-indigo-600/10 hover:border-indigo-500/30 text-indigo-500',
      pink: 'hover:bg-pink-600/10 hover:border-pink-500/30 text-pink-500',
      slate: 'hover:bg-slate-600/10 hover:border-slate-500/30 text-slate-400',
      cyan: 'hover:bg-cyan-600/10 hover:border-cyan-500/30 text-cyan-500',
      green: 'hover:bg-green-600/10 hover:border-green-500/30 text-green-500',
   };
   return (
      <button 
        onClick={onClick}
        className={`glass rounded-[32px] lg:rounded-[48px] p-6 lg:p-10 flex flex-col justify-between text-left transition-all group shadow-xl ${colors[color] || 'hover:bg-white/5'}`}
      >
         <div className="w-12 h-12 lg:w-16 lg:h-16 bg-white/5 rounded-2xl flex items-center justify-center transition-colors shadow-inner shrink-0">
            {React.cloneElement(icon, { size: 32 })}
         </div>
         <div className="mt-6">
            <h4 className="text-xl lg:text-2xl font-black italic text-white uppercase tracking-tighter leading-tight mb-2 break-all line-clamp-2">{label}</h4>
            <p className="text-[8px] lg:text-[10px] font-bold text-slate-500 uppercase tracking-widest italic opacity-60 leading-tight">{desc}</p>
         </div>
      </button>
   );
};

export default Dashboard;