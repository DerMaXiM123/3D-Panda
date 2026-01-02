import React, { useEffect, useState } from 'react';
import { AppView, Filament, User, Friend, Printer, PrintLogEntry } from '../types';
import { Activity, Zap, Package, Server, Users, Box, Flower2, Cog, Fingerprint, Wrench, Mountain, HeartPulse, ShieldCheck, Timer, Cpu, ListChecks, Share2, Radio, Database, ChevronRight, Binary, Image as ImageIcon, Globe, ScanFace, Droplets, Ruler, Gauge, BookOpen, MessageSquare, Microscope, Scale, Type, FileCode, QrCode, Maximize2, ListTodo, Cloud, Github, ExternalLink, Info, Archive } from 'lucide-react';
import { db } from '../services/database';

// Fix: Corrected casing to 'Ads' to match the existing file system and resolve compiler naming conflict
import AdBanner from './Ads/AdBanner';

interface DashboardProps {
  onViewChange: (view: AppView) => void;
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ onViewChange, user }) => {
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [logs, setLogs] = useState<PrintLogEntry[]>([]);
  const [isCloudActive, setIsCloudActive] = useState(false);

  useEffect(() => {
    Promise.all([db.getFilaments(), db.getFriends(), db.getPrinters(), db.getPrintLogs()]).then(([f, fr, p, l]) => {
      setFilaments(f); setFriends(fr); setPrinters(p); setLogs(l);
      setIsCloudActive(window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');
    });
  }, []);

  const activeFilaments = filaments.filter(f => f.status === 'InPrinter');

  return (
    <div className="space-y-16 max-w-7xl mx-auto animate-in fade-in duration-1000 pb-32">
      {/* Welcome Banner */}
      {filaments.length === 0 && (
        <div className="bg-blue-600/10 border border-blue-500/20 rounded-[40px] p-8 flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-10 duration-700">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                 <Zap className="text-white" size={32} />
              </div>
              <div>
                 <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">Willkommen im Panda Nexus!</h2>
                 <p className="text-slate-400 text-sm font-medium italic">Dein lokales Lager ist noch leer. Startte mit der Inventur oder erstelle dein erstes 3D-Modell.</p>
              </div>
           </div>
           <button onClick={() => onViewChange(AppView.INVENTORY)} className="bg-white text-black px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all">Filament hinzufügen</button>
        </div>
      )}

      {/* Header */}
      <header className="relative">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="px-4 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-full flex items-center gap-2.5">
                <ShieldCheck size={14} className="text-blue-500" />
                <span className="text-[10px] font-black uppercase text-blue-400 tracking-[0.2em] italic">OFFICIAL PUBLIC NODE ACTIVE</span>
              </div>
            </div>
            <h1 className="text-8xl font-black tracking-tighter italic uppercase text-white leading-none">
              BASE <span className="text-blue-600">COMMAND</span>.
            </h1>
            <p className="text-slate-500 font-bold uppercase text-[11px] tracking-[0.5em] italic opacity-60 ml-2">Operator: {user.username}</p>
          </div>
          
          <div className="flex flex-wrap gap-4">
             <button 
              onClick={() => onViewChange(AppView.PRINT_QUEUE)}
              className="glass px-10 py-6 rounded-[32px] border-white/5 flex items-center gap-6 bg-slate-900/40 hover:bg-orange-600/10 transition-all group"
             >
                <ListTodo size={24} className="text-orange-500 group-hover:scale-110 transition-transform" />
                <div>
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Schedule</p>
                   <p className="text-lg font-black italic text-white leading-none mt-1">{logs.length % 3 + 1} Jobs <span className="text-[10px] text-orange-500 uppercase ml-2 tracking-tighter">Planned</span></p>
                </div>
             </button>
          </div>
        </div>
      </header>

      {/* Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 glass rounded-[56px] p-12 border-white/5 bg-slate-900/60 relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
             <TelemetryGauge label="Global Users" value="Live" progress={85} color="blue" />
             <TelemetryGauge label="Edge Network" value="Optimal" progress={92} color="purple" />
             <TelemetryGauge label="API Mesh" value="Active" progress={100} color="emerald" />
          </div>
        </div>

        <div className="lg:col-span-4 glass rounded-[56px] p-12 border-white/5 bg-slate-900/60 space-y-10 flex flex-col">
           <h2 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.4em] italic flex items-center gap-4">
              <Package size={20} className="text-orange-500" /> My Materials
           </h2>
           <div className="flex-1 space-y-4">
              {activeFilaments.slice(0, 4).map(f => (
                <div key={f.id} className="p-5 rounded-[32px] bg-white/5 border border-white/5 flex items-center gap-5">
                   <div className="w-12 h-12 rounded-2xl" style={{ backgroundColor: f.hex }} />
                   <div className="flex-1 min-w-0">
                      <p className="text-xs font-black italic text-white uppercase truncate">{f.color}</p>
                      <span className="text-[8px] font-bold text-slate-500 uppercase">{f.material}</span>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* AD BLOCK */}
      <section>
         <AdBanner slot="1234567890" className="w-full max-h-[120px]" />
      </section>

      {/* Matrix */}
      <section className="space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
           <div className="space-y-6">
              <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest px-4">3D Creators</h3>
              <div className="grid grid-cols-1 gap-3">
                 <MatrixItem icon={<Box size={18}/>} label="Brick Studio" view={AppView.CREATOR_BRICK} onClick={onViewChange} color="red" />
                 <MatrixItem icon={<Maximize2 size={18}/>} label="Panda Cube" view={AppView.CREATOR_CUBE} onClick={onViewChange} color="blue" />
                 <MatrixItem icon={<Archive size={18}/>} label="Container Forge" view={AppView.CREATOR_FORGE} onClick={onViewChange} color="blue" />
                 <MatrixItem icon={<Flower2 size={18}/>} label="Vase Architect" view={AppView.CREATOR_VASE} onClick={onViewChange} color="blue" />
              </div>
           </div>
           <div className="space-y-6">
              <h3 className="text-[10px] font-black text-purple-500 uppercase tracking-widest px-4">AI & Analysis</h3>
              <div className="grid grid-cols-1 gap-3">
                 <MatrixItem icon={<ScanFace size={18}/>} label="Vision Lab AI" view={AppView.VISION_LAB} onClick={onViewChange} color="blue" />
                 <MatrixItem icon={<MessageSquare size={18}/>} label="AI Chat Expert" view={AppView.CHAT} onClick={onViewChange} color="purple" />
                 <MatrixItem icon={<FileCode size={18}/>} label="G-Code Analyst" view={AppView.GCODE_ANALYST} onClick={onViewChange} color="orange" />
              </div>
           </div>
           <div className="space-y-6">
              <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-widest px-4">Network & Logistics</h3>
              <div className="grid grid-cols-1 gap-3">
                 <MatrixItem icon={<ListTodo size={18}/>} label="Print Queue" view={AppView.PRINT_QUEUE} onClick={onViewChange} color="orange" />
                 <MatrixItem icon={<Users size={18}/>} label="Maker Network" view={AppView.FRIENDS} onClick={onViewChange} color="emerald" />
                 <MatrixItem icon={<Package size={18}/>} label="Material Hub" view={AppView.INVENTORY} onClick={onViewChange} color="orange" />
              </div>
           </div>
        </div>
      </section>
    </div>
  );
};

const MatrixItem = ({ icon, label, view, onClick, color }: any) => (
  <button onClick={() => onClick(view)} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-left">
     <div className={`p-2 rounded-xl bg-${color}-500/10 text-${color}-500`}>{icon}</div>
     <span className="text-[11px] font-black italic text-slate-300 uppercase">{label}</span>
     <ChevronRight size={12} className="ml-auto text-slate-600" />
  </button>
);

const TelemetryGauge = ({ label, value, progress, color }: any) => (
  <div className="space-y-5">
    <div className="flex justify-between items-end">
       <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">{label}</span>
       <span className={`text-sm font-black italic text-${color}-400`}>{value}</span>
    </div>
    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
       <div className={`h-full bg-${color}-500 rounded-full transition-all duration-1000`} style={{ width: `${progress}%` }} />
    </div>
  </div>
);

export default Dashboard;
