
import React, { useState } from 'react';
import { Target, Info, Zap, ChevronRight, Gauge } from 'lucide-react';

const FlowRateCalc: React.FC = () => {
  const [measuredThickness, setMeasuredThickness] = useState(0.45);
  const [targetThickness, setTargetThickness] = useState(0.40);
  const [currentFlow, setCurrentFlow] = useState(100);

  // Formel: (Target / Measured) * CurrentFlow = NewFlow
  const newFlow = (targetThickness / measuredThickness) * currentFlow;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter flex items-center gap-3">
           <Gauge size={36} className="text-blue-500" /> Flow-Rate <span className="text-blue-500">Expert</span>
        </h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1 italic">Präzisions-Kalibrierung für perfekte Oberflächen</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass rounded-[48px] p-10 border-white/5 bg-slate-900/40 space-y-10">
           <div className="space-y-6">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4 italic">Soll-Wandstärke (mm)</label>
              <div className="relative">
                 <input 
                  type="number" step="0.01" 
                  value={targetThickness} 
                  onChange={e => setTargetThickness(parseFloat(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-xl font-black text-white italic outline-none focus:border-blue-500"
                 />
                 <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 font-black italic uppercase text-xs">Target</span>
              </div>
           </div>

           <div className="space-y-6">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4 italic">Gemessene Wandstärke (mm)</label>
              <div className="relative">
                 <input 
                  type="number" step="0.01" 
                  value={measuredThickness} 
                  onChange={e => setMeasuredThickness(parseFloat(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-xl font-black text-white italic outline-none focus:border-orange-500"
                 />
                 <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 font-black italic uppercase text-xs">Measured</span>
              </div>
           </div>

           <div className="space-y-6">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4 italic">Aktueller Flow-Wert (%)</label>
              <input type="range" min="80" max="120" step="0.5" value={currentFlow} onChange={e => setCurrentFlow(parseFloat(e.target.value))} className="modern-slider" />
              <div className="text-right text-xs font-black italic text-blue-500">{currentFlow}%</div>
           </div>
        </div>

        <div className="space-y-6 flex flex-col justify-center">
           <div className="glass rounded-[48px] p-10 border-blue-500/20 bg-blue-600/5 text-center space-y-4 shadow-2xl relative overflow-hidden group">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] italic relative z-10">Optimierter Flow-Wert</p>
              <h2 className="text-7xl font-black italic text-white tracking-tighter relative z-10">{newFlow.toFixed(2)}<span className="text-blue-500">%</span></h2>
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_20px_#3b82f6] opacity-30 animate-pulse" />
              <div className="absolute inset-0 bg-blue-600/10 blur-3xl group-hover:opacity-40 transition-opacity" />
           </div>

           <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 flex gap-4">
              <Target size={20} className="text-blue-500 flex-shrink-0" />
              <p className="text-[9px] text-slate-500 font-bold uppercase italic leading-relaxed">
                Anleitung: Drucke einen "Hollow Cube" mit 1 Perimeter (Wand). Miss die Wandstärke mit einem Messschieber an allen vier Seiten und gib den Durchschnittswert hier ein.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FlowRateCalc;
