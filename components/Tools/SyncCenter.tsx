
import React, { useState, useEffect } from 'react';
import { Share2, Zap, Monitor, RefreshCw, Layers, Database, ShieldCheck, CheckCircle2, Copy, ExternalLink, Box, ChevronRight, Info, Plus, Trash2, Globe, Server, Activity } from 'lucide-react';
import { db } from '../../services/database';
import { Filament, Printer } from '../../types';

type SlicerType = 'anycubic' | 'orca' | 'bambu' | 'prusa' | 'cura';

const SLICER_GUIDES: Record<SlicerType, any> = {
  anycubic: { name: 'AnycubicSlicer Next', color: 'text-blue-500', path: 'Drucker -> Custom G-Code -> Start G-Code', description: 'Optimiert für Kobra 3 & ACE Pro.' },
  orca: { name: 'OrcaSlicer', color: 'text-orange-500', path: 'Printer Settings -> Custom G-Code', description: 'Universeller Standard für moderne Drucker.' },
  bambu: { name: 'Bambu Studio', color: 'text-emerald-500', path: 'Printer -> Machine G-Code', description: 'Perfekt für X1/P1/A1 AMS Systeme.' },
  prusa: { name: 'PrusaSlicer', color: 'text-orange-600', path: 'Printer Settings -> Custom G-Code', description: 'Bewährtes System für MK3/MK4.' },
  cura: { name: 'UltiMaker Cura', color: 'text-blue-400', path: 'Manage Printers -> Machine Settings', description: 'Legacy Support für klassische Drucker.' }
};

const SyncCenter: React.FC = () => {
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [selectedSlicer, setSelectedSlicer] = useState<SlicerType>('anycubic');
  const [activeTab, setActiveTab] = useState<'status' | 'setup'>('setup');
  const [slotMapping, setSlotMapping] = useState<Record<number, string>>({ 1: '', 2: '', 3: '', 4: '' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([db.getFilaments(), db.getPrinters()]).then(([f, p]) => {
      setFilaments(f);
      setPrinters(p);
    });
  }, []);

  const generateTags = () => {
    let tags = `; === PRINTVERSE NEURAL TAGS ===\n`;
    Object.entries(slotMapping).forEach(([slot, id]) => {
      if (id) {
        const f = filaments.find(x => x.id === id);
        tags += `; PV_SLOT_${slot}_ID: ${id}\n; PV_SLOT_${slot}_MAT: ${f?.material}\n`;
      }
    });
    
    if (selectedSlicer === 'cura') {
        tags += `; PV_WEIGHT_EST: {filament_weight}\n`;
    } else {
        tags += `; PV_WEIGHT_EST: [filament_type]\n`;
    }
    
    return tags + `; === END NEURAL TAGS ===`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <div className="bg-blue-600/10 border border-blue-500/20 px-3 py-1 rounded-full flex items-center gap-2">
                <Share2 size={12} className="text-blue-500" />
                <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest">Neural Slicer Bridge</span>
             </div>
          </div>
          <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter flex items-center gap-4 leading-none">
             SYNC <span className="text-blue-500">CENTER</span>.
          </h1>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.4em] mt-3 italic opacity-60">Filament-to-GCode Synchronization</p>
        </div>
        
        <div className="flex bg-white/5 p-1.5 rounded-3xl border border-white/5">
           <button onClick={() => setActiveTab('setup')} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase italic transition-all ${activeTab === 'setup' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Slicer Config</button>
           <button onClick={() => setActiveTab('status')} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase italic transition-all ${activeTab === 'status' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Cloud Webhook</button>
        </div>
      </header>

      {activeTab === 'setup' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-left-4 duration-500">
            {/* Slot Mapping Column */}
            <div className="lg:col-span-4 space-y-6">
               <div className="glass rounded-[48px] p-8 border-white/5 bg-slate-900/40 space-y-8">
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest italic flex items-center gap-3">
                     <Layers size={18} className="text-blue-500" /> Slot Mapping
                  </h3>
                  
                  <div className="space-y-4">
                     {[1, 2, 3, 4].map(slot => (
                       <div key={slot} className="space-y-2">
                          <div className="flex justify-between items-center px-2">
                             <label className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Extruder Slot {slot}</label>
                             {slotMapping[slot] && <button onClick={() => setSlotMapping({...slotMapping, [slot]: ''})} className="text-red-500 hover:text-red-400 transition-colors"><Trash2 size={10}/></button>}
                          </div>
                          <select 
                            className={`w-full bg-white/5 border rounded-2xl py-3 px-4 text-[11px] font-black italic uppercase outline-none transition-all ${slotMapping[slot] ? 'border-blue-500/50 text-white' : 'border-white/5 text-slate-600'}`}
                            value={slotMapping[slot]}
                            onChange={e => setSlotMapping({...slotMapping, [slot]: e.target.value})}
                          >
                             <option value="">-- Leer --</option>
                             {filaments.map(f => (
                               <option key={f.id} value={f.id}>{f.color} ({f.brand})</option>
                             ))}
                          </select>
                       </div>
                     ))}
                  </div>
                  <div className="p-5 bg-blue-600/5 rounded-3xl border border-blue-500/10 italic">
                     <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">
                       Tipp: Weise hier die Rollen zu, die du aktuell im Drucker (oder ACE/AMS) geladen hast.
                     </p>
                  </div>
               </div>
            </div>

            {/* Instructions Column */}
            <div className="lg:col-span-8 space-y-8">
               <div className="glass rounded-[48px] p-10 border-white/5 bg-slate-900/40 space-y-10">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                     <div className="flex-1">
                        <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">1. G-Code-Tags erzeugen</h2>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1 italic">Kopiere den Code in deinen Slicer</p>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {(Object.keys(SLICER_GUIDES) as SlicerType[]).map(key => (
                          <button 
                            key={key} 
                            onClick={() => setSelectedSlicer(key)}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase italic transition-all ${selectedSlicer === key ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-slate-500'}`}
                          >
                            {key}
                          </button>
                        ))}
                     </div>
                  </div>

                  <div className="bg-blue-600/5 border border-blue-500/20 rounded-3xl p-8 space-y-6">
                     <div className="flex justify-between items-start">
                        <div>
                           <p className="text-sm font-bold text-white italic">Custom G-Code Snippet</p>
                           <p className="text-[9px] text-blue-400 font-black uppercase mt-1">Pfad: {SLICER_GUIDES[selectedSlicer].path}</p>
                        </div>
                        <button 
                          onClick={() => copyToClipboard(generateTags())}
                          className={`p-4 rounded-2xl transition-all ${copied ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white hover:bg-blue-600 shadow-xl'}`}
                        >
                           {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                        </button>
                     </div>
                     <pre className="bg-black/60 p-6 rounded-2xl text-[10px] font-mono text-emerald-400 overflow-x-auto border border-white/5 max-h-48 scrollbar-hide">
                        {generateTags()}
                     </pre>
                  </div>
               </div>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-right-4 duration-500">
           {/* Cloud Status Panel */}
           <div className="lg:col-span-7 space-y-8">
              <div className="glass rounded-[48px] p-10 border-white/5 bg-slate-900/40 space-y-10">
                 <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest italic flex items-center gap-3">
                       <Monitor size={18} /> Printer Fleet Registry
                    </h3>
                    <div className="px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                       <span className="text-[8px] font-black text-green-500 uppercase">Gateway Online</span>
                    </div>
                 </div>

                 <div className="space-y-4">
                    {printers.length === 0 ? (
                      <div className="p-10 text-center border-2 border-dashed border-white/5 rounded-[40px] opacity-30 italic uppercase text-[10px] font-black">Keine Drucker in Fleet Command registriert</div>
                    ) : printers.map(p => (
                      <div key={p.id} className="p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-between group">
                         <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center">
                               <Server size={24} className="text-blue-500" />
                            </div>
                            <div>
                               <h4 className="text-sm font-black italic text-white uppercase">{p.name}</h4>
                               <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{p.model}</p>
                            </div>
                         </div>
                         <div className="flex gap-2">
                            {[1, 2, 3, 4].map(s => {
                               const filamentId = slotMapping[s];
                               const f = filaments.find(x => x.id === filamentId);
                               return (
                                 <div key={s} className={`w-8 h-8 rounded-lg border flex items-center justify-center ${f ? 'border-blue-500/50 bg-blue-600/10' : 'border-dashed border-white/5 bg-black/20'}`}>
                                    {f ? <div className="w-3 h-3 rounded-full" style={{ backgroundColor: f.hex }} title={f.color} /> : <span className="text-[8px] font-black text-slate-800">{s}</span>}
                                 </div>
                               );
                            })}
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="bg-blue-600/5 p-8 rounded-[48px] border border-blue-500/20 space-y-6">
                 <h3 className="text-xs font-black uppercase text-blue-400 tracking-widest italic flex items-center gap-3">
                    <Globe size={18} /> Universal API Webhook
                 </h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed italic">
                   Nutze diesen Endpoint für automatisierte Post-Processing Scripte (z.B. in OrcaSlicer unter 'Post-processing scripts').
                 </p>
                 <div className="relative group">
                    <code className="block bg-black/60 p-5 rounded-2xl text-[10px] font-mono text-blue-300 border border-white/5 break-all">
                       http://localhost:3000/api/v1/sync?token=PV_EXPERT_99
                    </code>
                    <button 
                      onClick={() => copyToClipboard('http://localhost:3000/api/v1/sync?token=PV_EXPERT_99')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/5 hover:bg-blue-600 rounded-lg transition-all text-white"
                    >
                       <Copy size={14} />
                    </button>
                 </div>
              </div>
           </div>

           {/* Sidebar: Help/Info */}
           <div className="lg:col-span-5 space-y-6">
              <div className="glass rounded-[48px] p-10 border-white/5 bg-slate-900/40 space-y-8">
                 <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest italic">Workflow Dokumentation</h3>
                 <div className="space-y-6">
                    <StepItem number="1" title="Real-Time Sync" desc="Die App fungiert als lokaler Server. Slicer-Tags werden beim G-Code Export 'eingebrannt'." />
                    <StepItem number="2" title="Zero Manual Input" desc="Durch die Webhook-ID entfällt das manuelle Suchen der Filamentrolle im Analyst Lab." />
                    <StepItem number="3" title="Multi-Material Ready" desc="Unterstützt komplexe Setups wie Anycubic ACE Pro oder Bambu AMS nahtlos." />
                 </div>
              </div>
              
              <div className="p-8 bg-indigo-600/10 rounded-[40px] border border-indigo-500/20">
                 <div className="flex gap-4">
                    <Database size={24} className="text-indigo-500 flex-shrink-0" />
                    <div>
                       <p className="text-[10px] text-indigo-200 font-black uppercase italic tracking-widest">Local-First Privacy</p>
                       <p className="text-[9px] text-slate-400 font-bold uppercase mt-2 leading-relaxed">
                          Alle Webhook-Daten verbleiben in deiner lokalen Browser-Datenbank. Keine externe Cloud-Übertragung ohne deine explizite Zustimmung.
                       </p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const StepItem = ({ number, title, desc }: any) => (
  <div className="flex gap-5">
     <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0">{number}</div>
     <div>
        <h4 className="text-[10px] font-black text-white uppercase italic mb-1">{title}</h4>
        <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">{desc}</p>
     </div>
  </div>
);

export default SyncCenter;
