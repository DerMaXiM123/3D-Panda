
import React, { useState, useEffect } from 'react';
import { Scale, RefreshCw, Euro, Ruler, Zap, ArrowRight, Package, Search } from 'lucide-react';
import { Filament } from '../../types';
import { db } from '../../services/database';

const CompareLab: React.FC = () => {
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [f1Id, setF1Id] = useState('');
  const [f2Id, setF2Id] = useState('');

  useEffect(() => {
    db.getFilaments().then(setFilaments);
  }, []);

  const f1 = filaments.find(f => f.id === f1Id);
  const f2 = filaments.find(f => f.id === f2Id);

  // Stats
  const getPricePerKg = (f: Filament) => (f.price || 0) / (f.weight / 1000);
  const getLength = (f: Filament) => {
    const density = f.material === 'PLA' ? 1.24 : f.material === 'PETG' ? 1.27 : 1.05;
    const radius = 0.0875; // 1.75mm
    const volume = f.weight / density;
    return (volume / (Math.PI * Math.pow(radius, 2))) / 100;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
      <header>
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter flex items-center gap-3">
           <Scale size={36} className="text-blue-500" /> Compare <span className="text-blue-500">Lab</span>
        </h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1 italic">Direkter Filament-Vergleich und Effizienz-Check</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <CompareSelector label="FILAMENT A" selectedId={f1Id} filaments={filaments} onSelect={setF1Id} />
        <CompareSelector label="FILAMENT B" selectedId={f2Id} filaments={filaments} onSelect={setF2Id} />
      </div>

      <div className="glass rounded-[56px] p-12 border-white/5 bg-slate-900/40 space-y-10 shadow-3xl relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-white/5 hidden md:block" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
           <CompareStats filament={f1} getPricePerKg={getPricePerKg} getLength={getLength} align="left" />
           <CompareStats filament={f2} getPricePerKg={getPricePerKg} getLength={getLength} align="right" />
        </div>

        {!f1 && !f2 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 pointer-events-none italic">
             <Scale size={64} className="mb-4" />
             <p className="text-xs font-black uppercase tracking-widest">Zwei Rollen zum Vergleich wählen</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CompareSelector = ({ label, selectedId, filaments, onSelect }: any) => (
  <div className="space-y-4">
     <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4 italic">{label}</label>
     <div className="glass rounded-[32px] p-4 border-white/5 bg-white/5 flex items-center gap-4">
        <div className="pl-2 text-slate-700"><Search size={18} /></div>
        <select 
          className="flex-1 bg-transparent border-none outline-none text-sm font-black italic uppercase text-white appearance-none py-2 cursor-pointer"
          value={selectedId}
          onChange={e => onSelect(e.target.value)}
        >
           <option value="">Rolle wählen...</option>
           {filaments.map((f: any) => (
             <option key={f.id} value={f.id}>{f.brand} - {f.color} ({f.material})</option>
           ))}
        </select>
     </div>
  </div>
);

const CompareStats = ({ filament, getPricePerKg, getLength, align }: any) => {
  if (!filament) return <div />;
  return (
    <div className={`space-y-10 ${align === 'right' ? 'md:text-right md:items-end' : ''} flex flex-col animate-in fade-in duration-500`}>
       <div className={`flex items-center gap-6 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
          <div className="w-16 h-16 rounded-[24px] shadow-2xl border-2 border-white/10" style={{ backgroundColor: filament.hex }} />
          <div>
             <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter leading-none">{filament.color}</h3>
             <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-2">{filament.brand} • {filament.material}</p>
          </div>
       </div>

       <div className="space-y-6 w-full max-w-sm">
          <StatBox label="Preis / kg" value={`${getPricePerKg(filament).toFixed(2)} €`} icon={<Euro size={16}/>} align={align} />
          <StatBox label="Total Länge (ca.)" value={`${getLength(filament).toFixed(0)} m`} icon={<Ruler size={16}/>} align={align} />
          <StatBox label="Verfügbar" value={`${filament.remaining}g`} icon={<Package size={16}/>} align={align} />
       </div>
    </div>
  );
};

const StatBox = ({ label, value, icon, align }: any) => (
  <div className={`flex flex-col ${align === 'right' ? 'items-end' : 'items-start'} bg-white/5 p-6 rounded-3xl border border-white/5 group hover:border-blue-500/20 transition-all`}>
     <div className="flex items-center gap-3 text-slate-500 mb-1">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-widest italic">{label}</span>
     </div>
     <p className="text-2xl font-black italic text-white">{value}</p>
  </div>
);

export default CompareLab;
