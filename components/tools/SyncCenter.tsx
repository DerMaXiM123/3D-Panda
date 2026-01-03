import React, { useState, useEffect } from 'react';
import { Share2, Zap, Layers, Database, ShieldCheck, CheckCircle2, Copy, Info } from 'lucide-react';
import { db } from '../../services/database';
import { Filament } from '../../types';

type SlicerType = 'anycubic' | 'orca' | 'bambu' | 'prusa' | 'cura';

const SLICER_GUIDES: Record<SlicerType, any> = {
  anycubic: { name: 'AnycubicSlicer', color: 'text-blue-500', path: 'Drucker -> Start G-Code' },
  orca: { name: 'OrcaSlicer', color: 'text-orange-500', path: 'Printer Settings -> Custom G-Code' },
  bambu: { name: 'Bambu Studio', color: 'text-emerald-500', path: 'Printer -> Machine G-Code' },
  prusa: { name: 'PrusaSlicer', color: 'text-orange-600', path: 'Printer Settings -> Custom G-Code' },
  cura: { name: 'UltiMaker Cura', color: 'text-blue-400', path: 'Machine Settings' }
};

const SyncCenter: React.FC = () => {
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [selectedSlicer, setSelectedSlicer] = useState<SlicerType>('anycubic');
  const [slotMapping, setSlotMapping] = useState<Record<number, string>>({ 1: '', 2: '', 3: '', 4: '' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    db.getFilaments().then(setFilaments);
  }, []);

  const generateTags = () => {
    let tags = `; === PANDA SYNC TAGS ===\n`;
    Object.entries(slotMapping).forEach(([slot, id]) => {
      if (id) tags += `; PV_SLOT_${slot}_ID: ${id}\n`;
    });
    return tags + `; === END TAGS ===`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-full overflow-x-hidden space-y-10 animate-in fade-in duration-500 pb-20 px-4">
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter leading-none">
             SYNC <span className="text-blue-500">BRIDGE</span>.
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-3 italic">Nexus Slicer Integration Hub</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
           <div className="glass rounded-[48px] p-8 border-white/5 bg-slate-900/40 space-y-8 shadow-xl">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest italic flex items-center gap-3">
                 <Layers size={18} className="text-blue-500" /> Multi-Material Slots
              </h3>
              
              <div className="space-y-4">
                 {[1, 2, 3, 4].map(slot => (
                   <div key={slot} className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-600 tracking-widest px-2">Hardware Slot {slot}</label>
                      <select 
                        className={`w-full bg-white/5 border rounded-2xl py-4 px-4 text-[11px] font-black italic uppercase outline-none transition-all ${slotMapping[slot] ? 'border-blue-500/40 text-white' : 'border-white/5 text-slate-700'}`}
                        value={slotMapping[slot]}
                        onChange={e => setSlotMapping({...slotMapping, [slot]: e.target.value})}
                      >
                         <option value="">-- Leer --</option>
                         {filaments.map(f => (
                           <option key={f.id} value={f.id}>{f.color} ({f.material})</option>
                         ))}
                      </select>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="lg:col-span-8">
           <div className="glass rounded-[48px] p-10 border-white/5 bg-slate-900/40 space-y-8 shadow-2xl">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                 <div>
                    <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter leading-none">Slicer Configuration</h2>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">Kopiere IDs in deinen Slicer für Auto-Tracking</p>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {(Object.keys(SLICER_GUIDES) as SlicerType[]).map(key => (
                      <button 
                        key={key} 
                        onClick={() => setSelectedSlicer(key)}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase italic transition-all ${selectedSlicer === key ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-500 hover:text-white'}`}
                      >
                        {key}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="bg-[#020617] border border-blue-600/10 rounded-[32px] p-8 space-y-6 relative overflow-hidden group">
                 <div className="flex justify-between items-start">
                    <div>
                       <p className="text-sm font-bold text-white italic">Neural Header Snippet</p>
                       <p className="text-[9px] text-blue-400 font-black uppercase mt-1">Insert into: {SLICER_GUIDES[selectedSlicer].path}</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(generateTags())}
                      className={`p-4 rounded-2xl transition-all ${copied ? 'bg-emerald-600' : 'bg-white/5 hover:bg-blue-600 shadow-xl'}`}
                    >
                       {copied ? <CheckCircle2 size={20} className="text-white" /> : <Copy size={20} className="text-slate-400 hover:text-white" />}
                    </button>
                 </div>
                 <pre className="bg-black/40 p-6 rounded-2xl text-[10px] font-mono text-emerald-400/80 overflow-x-auto border border-white/5 max-h-48 scrollbar-hide select-all">
                    {generateTags()}
                 </pre>
                 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full" />
              </div>

              <div className="flex items-center gap-4 p-6 bg-white/5 rounded-3xl border border-white/5 opacity-60">
                 <Info size={18} className="text-blue-500 flex-shrink-0" />
                 <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed italic">
                    Die IDs sind lokal für deinen Browser generiert. Wenn du ein G-Code mit diesen Tags in den "Analyst" ziehst, wird der Bestand automatisch abgebucht.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SyncCenter;