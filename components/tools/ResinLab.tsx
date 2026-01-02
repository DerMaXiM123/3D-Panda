
import React, { useState, useEffect } from 'react';
import { Droplets, Plus, Trash2, Zap, Thermometer, Clock, Ruler, Info, Layers, RefreshCw, X } from 'lucide-react';
import { ResinProfile } from '../../types';
import { db } from '../../services/database';

const ResinLab: React.FC = () => {
  const [profiles, setProfiles] = useState<ResinProfile[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newProfile, setNewProfile] = useState<Partial<ResinProfile>>({
    brand: '', name: '', color: '', exposureTime: 2.5, bottomExposure: 25, pricePerLiter: 35.00
  });

  // Calculator State
  const [modelVolume, setModelVolume] = useState(50);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    db.getResinProfiles().then(setProfiles);
  }, []);

  const handleAdd = async () => {
    if (!newProfile.brand || !newProfile.name) return;
    const profile: ResinProfile = { ...newProfile as ResinProfile, id: `rp_${Date.now()}` };
    await db.updateResinProfile(profile);
    setProfiles([...profiles, profile]);
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Profil löschen?')) return;
    await db.deleteResinProfile(id);
    setProfiles(profiles.filter(p => p.id !== id));
  };

  const selectedResin = profiles.find(p => p.id === selectedId);
  const cost = selectedResin ? (selectedResin.pricePerLiter * (modelVolume / 1000)) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter flex items-center gap-3">
             <Droplets size={36} className="text-indigo-500" /> Resin <span className="text-indigo-500">Lab</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1 italic">SLA/DLP Parameter & Kosten-Analyse</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-3xl font-black italic flex items-center gap-3 transition-all shadow-xl">
          <Plus size={20} /> PROFIL HINZUFÜGEN
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-8">
           <h3 className="text-xs font-black uppercase text-slate-500 tracking-0.4em italic flex items-center gap-3">
              <Layers size={18} /> Resin Inventar
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profiles.length === 0 ? (
                <div className="col-span-full py-20 glass rounded-[48px] border-dashed border-white/10 flex flex-col items-center justify-center opacity-20">
                   <Droplets size={48} className="mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-widest">Keine Resine gelistet</p>
                </div>
              ) : profiles.map(p => (
                <button 
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`glass rounded-[40px] p-8 border-white/5 bg-slate-900/40 text-left transition-all relative group hover:scale-[1.02] ${selectedId === p.id ? 'border-indigo-500 bg-indigo-600/5' : 'hover:border-white/10'}`}
                >
                   <div className="flex justify-between items-start mb-6">
                      <div className="w-10 h-10 rounded-xl shadow-inner border border-white/10" style={{ backgroundColor: p.color }} />
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="text-slate-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                         <Trash2 size={16} />
                      </button>
                   </div>
                   <h4 className="text-lg font-black italic text-white uppercase tracking-tight leading-none">{p.name}</h4>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{p.brand}</p>
                   
                   <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/5">
                      <div>
                         <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">Exposure</p>
                         <p className="text-xs font-black italic text-indigo-400">{p.exposureTime}s</p>
                      </div>
                      <div>
                         <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">Bottom</p>
                         <p className="text-xs font-black italic text-indigo-400">{p.bottomExposure}s</p>
                      </div>
                   </div>
                </button>
              ))}
           </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
           <h3 className="text-xs font-black uppercase text-slate-500 tracking-0.4em italic flex items-center gap-3">
              <RefreshCw size={18} /> Print Calculator
           </h3>
           <div className="glass rounded-[48px] p-10 border-white/5 bg-indigo-600/5 shadow-2xl space-y-10">
              <div className="space-y-6">
                 <div className="flex justify-between items-end px-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 italic">Modell Volumen (ml)</label>
                    <span className="text-indigo-500 font-black italic text-2xl">{modelVolume}ml</span>
                 </div>
                 <input type="range" min="1" max="500" step="1" value={modelVolume} onChange={e => setModelVolume(parseInt(e.target.value))} className="modern-slider" />
              </div>

              <div className="pt-8 border-t border-white/5 space-y-4">
                 <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest italic text-slate-500">
                    <span>Material-Kosten</span>
                    <span className="text-indigo-400 text-lg">{cost.toFixed(2)} €</span>
                 </div>
                 {selectedResin && (
                    <div className="bg-black/20 p-6 rounded-3xl border border-white/5">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-0.2em mb-4 italic">Belichtungsprofil</p>
                       <div className="grid grid-cols-2 gap-8">
                          <div>
                             <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">Normal Layer</p>
                             <p className="text-3xl font-black italic text-white">{selectedResin.exposureTime}s</p>
                          </div>
                          <div>
                             <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">Bottom Layer</p>
                             <p className="text-3xl font-black italic text-white">{selectedResin.bottomExposure}s</p>
                          </div>
                       </div>
                    </div>
                 )}
              </div>
              
              <div className="flex gap-4">
                 <div className="flex-1 bg-white/5 p-5 rounded-3xl border border-white/5 text-center">
                    <Clock size={20} className="text-indigo-500 mx-auto mb-2" />
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">UV-Cleaning</p>
                    <p className="text-sm font-black italic text-white mt-1">~5-10m</p>
                 </div>
                 <div className="flex-1 bg-white/5 p-5 rounded-3xl border border-white/5 text-center">
                    <Thermometer size={20} className="text-red-500 mx-auto mb-2" />
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Temp Opt.</p>
                    <p className="text-sm font-black italic text-white mt-1">20-25°C</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-[#0f172a] border border-white/10 w-full max-w-xl rounded-[48px] p-10 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-10">
               <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">Neues Resin Profil</h2>
               <button onClick={() => setIsAdding(false)}><X size={24} className="text-slate-500 hover:text-white"/></button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <input placeholder="Marke (z.B. Elegoo)" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white" value={newProfile.brand} onChange={e => setNewProfile({...newProfile, brand: e.target.value})} />
                 <input placeholder="Name (z.B. ABS-Like V2)" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white" value={newProfile.name} onChange={e => setNewProfile({...newProfile, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Normal Exposure (s)</label>
                    <input type="number" step="0.1" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white" value={newProfile.exposureTime} onChange={e => setNewProfile({...newProfile, exposureTime: parseFloat(e.target.value)})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Bottom Exposure (s)</label>
                    <input type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white" value={newProfile.bottomExposure} onChange={e => setNewProfile({...newProfile, bottomExposure: parseInt(e.target.value)})} />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Preis pro Liter (€)</label>
                    <input type="number" step="0.5" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white" value={newProfile.pricePerLiter} onChange={e => setNewProfile({...newProfile, pricePerLiter: parseFloat(e.target.value)})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Resin-Farbe</label>
                    <input type="color" className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl p-2 cursor-pointer" value={newProfile.color} onChange={e => setNewProfile({...newProfile, color: e.target.value})} />
                 </div>
              </div>
              <button onClick={handleAdd} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-[24px] uppercase italic tracking-tighter">Profil Speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResinLab;
