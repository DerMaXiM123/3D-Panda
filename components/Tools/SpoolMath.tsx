
import React, { useState } from 'react';
import { Ruler, Weight, Droplets, Info, Zap, RefreshCw } from 'lucide-react';

const DENSITY: Record<string, number> = {
  'PLA': 1.24, 'PETG': 1.27, 'ABS': 1.04, 'TPU': 1.21, 'ASA': 1.07, 'NYLON': 1.12
};

const SpoolMath: React.FC = () => {
  const [weight, setWeight] = useState(250);
  const [diameter, setDiameter] = useState(1.75);
  const [material, setMaterial] = useState('PLA');

  // Berechnung: Volume = Weight / Density
  // Radius = Diameter / 2
  // Length = Volume / (PI * Radius^2)
  const density = DENSITY[material] || 1.24;
  const radius = (diameter / 10) / 2; // in cm
  const volume = weight / density; // in cm3
  const lengthCm = volume / (Math.PI * Math.pow(radius, 2));
  const lengthMeters = lengthCm / 100;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter flex items-center gap-3">
           <Ruler size={36} className="text-blue-500" /> Spool <span className="text-blue-500">Math PRO</span>
        </h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1 italic">Präzise Gewicht-zu-Länge Konvertierung</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass rounded-[48px] p-10 border-white/5 bg-slate-900/40 space-y-10">
           <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Material & Dichte</label>
              <div className="grid grid-cols-3 gap-2">
                 {Object.keys(DENSITY).map(m => (
                   <button 
                    key={m}
                    onClick={() => setMaterial(m)}
                    className={`py-3 rounded-xl text-[10px] font-black italic uppercase transition-all ${material === m ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                   >
                     {m}
                   </button>
                 ))}
              </div>
           </div>

           <div className="space-y-6">
              <div className="flex justify-between items-end px-2">
                 <label className="text-[10px] font-black uppercase text-slate-500">Restgewicht (g)</label>
                 <span className="text-blue-500 font-black italic text-xl">{weight}g</span>
              </div>
              <input type="range" min="1" max="5000" step="10" value={weight} onChange={e => setWeight(parseInt(e.target.value))} className="modern-slider" />
           </div>

           <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Durchmesser (mm)</label>
              <div className="flex gap-4">
                 {[1.75, 2.85].map(d => (
                   <button 
                    key={d}
                    onClick={() => setDiameter(d)}
                    className={`flex-1 py-4 rounded-2xl text-xs font-black italic transition-all ${diameter === d ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                   >
                     {d}mm
                   </button>
                 ))}
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="glass rounded-[48px] p-10 border-blue-500/20 bg-blue-600/5 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] italic">Verfügbare Länge</p>
              <h2 className="text-7xl font-black italic text-white tracking-tighter">{lengthMeters.toFixed(1)}<span className="text-blue-500">m</span></h2>
              <div className="h-px w-24 bg-blue-500/30 my-4" />
              <div className="grid grid-cols-2 gap-8 w-full">
                 <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Volumen</p>
                    <p className="text-xl font-black italic text-white">{volume.toFixed(1)} cm³</p>
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Dichte</p>
                    <p className="text-xl font-black italic text-white">{density} g/cm³</p>
                 </div>
              </div>
           </div>

           <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 flex gap-4">
              <Info size={20} className="text-blue-400 flex-shrink-0" />
              <p className="text-[9px] text-slate-500 font-bold uppercase italic leading-relaxed">
                Tipp: Wiege eine leere Spule desselben Herstellers, um das exakte Netto-Gewicht deines Filaments zu ermitteln. Übliche Leerspulen wiegen zwischen 200g und 250g.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SpoolMath;
