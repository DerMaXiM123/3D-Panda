
import React, { useState } from 'react';
import { Thermometer, Clock, Droplets, Info, Wind, Zap } from 'lucide-react';

const DRYING_DATA: Record<string, { temp: number, hours: number, info: string }> = {
  'PLA': { temp: 45, hours: 4, info: 'PLA ist spröde, wenn es feucht ist. Vorsicht bei über 50°C (Deformierung).' },
  'PETG': { temp: 65, hours: 6, info: 'PETG neigt stark zum Stringing, wenn es nicht trocken ist.' },
  'ABS': { temp: 80, hours: 8, info: 'Benötigt hohe Temperaturen. Achte auf gute Belüftung des Trockners.' },
  'TPU': { temp: 55, hours: 6, info: 'TPU ist extrem hygroskopisch. Muss oft direkt aus der Drybox gedruckt werden.' },
  'NYLON': { temp: 90, hours: 12, info: 'Nylon nimmt Feuchtigkeit in Minuten auf. 12h Trocknung sind Minimum.' },
  'ASA': { temp: 80, hours: 8, info: 'Ähnlich wie ABS, sehr wichtig für Layer-Adhäsion.' }
};

const DryingGuide: React.FC = () => {
  const [material, setMaterial] = useState('PLA');

  const data = DRYING_DATA[material];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter flex items-center gap-3">
           <Droplets size={36} className="text-blue-500" /> Filament <span className="text-blue-500">Dry-Lab</span>
        </h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1 italic">Materialwissenschaftliche Trocknungsparameter</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass rounded-[48px] p-10 border-white/5 bg-slate-900/40 space-y-8">
           <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Material wählen</label>
              <div className="grid grid-cols-2 gap-3">
                 {Object.keys(DRYING_DATA).map(m => (
                   <button 
                    key={m}
                    onClick={() => setMaterial(m)}
                    className={`py-4 rounded-2xl text-xs font-black italic transition-all uppercase ${material === m ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                   >
                     {m}
                   </button>
                 ))}
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="glass rounded-[48px] p-10 border-blue-500/20 bg-blue-600/5 space-y-10">
              <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2 italic">
                       <Thermometer size={14} /> Temperatur
                    </p>
                    <p className="text-5xl font-black italic text-white">{data.temp}°C</p>
                 </div>
                 <div className="space-y-2">
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2 italic">
                       <Clock size={14} /> Dauer
                    </p>
                    <p className="text-5xl font-black italic text-white">{data.hours}h</p>
                 </div>
              </div>

              <div className="bg-black/40 p-6 rounded-3xl border border-white/5 flex gap-4">
                 <Info size={20} className="text-blue-400 flex-shrink-0" />
                 <p className="text-xs text-slate-300 font-medium italic leading-relaxed">{data.info}</p>
              </div>
           </div>

           <div className="bg-orange-600/5 p-6 rounded-[32px] border border-orange-500/10 flex gap-4">
              <Wind size={20} className="text-orange-500 flex-shrink-0" />
              <p className="text-[9px] text-orange-200/60 font-black uppercase italic tracking-widest leading-tight">
                Achtung: Trockne dein Filament nie in einem Backofen, in dem du Essen zubereitest. Mikroplastik-Gefahr!
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DryingGuide;
