
import React, { useState, useEffect } from 'react';
import { Server, Plus, Trash2, Settings2, Activity, Clock, Wrench, X, Save, AlertCircle } from 'lucide-react';
import { Printer } from '../../types';
import { db } from '../../services/database';

const FleetManager: React.FC = () => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newPrinter, setNewPrinter] = useState<Partial<Printer>>({
    name: '', model: '', nozzleSize: 0.4, totalPrintTime: 0, status: 'Idle', lastMaintenance: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    db.getPrinters().then(setPrinters);
  }, []);

  const handleAdd = async () => {
    if (!newPrinter.name || !newPrinter.model) return;
    const printer: Printer = {
      ...newPrinter as Printer,
      id: `ptr_${Date.now()}`
    };
    await db.updatePrinter(printer);
    setPrinters([...printers, printer]);
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Drucker aus Flotte entfernen?')) return;
    await db.deletePrinter(id);
    setPrinters(printers.filter(p => p.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter flex items-center gap-3">
             <Server size={36} className="text-blue-500" /> Fleet <span className="text-blue-500">Master</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1 italic">Zentrales Management deiner Drucker-Farm</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-3xl font-black italic flex items-center gap-3 transition-all shadow-xl"
        >
          <Plus size={20} /> DRUCKER HINZUFÜGEN
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {printers.length === 0 ? (
          <div className="col-span-full py-20 glass rounded-[48px] border-dashed border-white/10 flex flex-col items-center justify-center opacity-30">
             <Server size={64} className="mb-4" />
             <p className="text-xs font-black uppercase tracking-[0.2em]">Keine Drucker registriert</p>
          </div>
        ) : printers.map(p => (
          <div key={p.id} className="glass rounded-[40px] p-8 border-white/5 bg-slate-900/40 space-y-6 group hover:border-blue-500/20 transition-all">
             <div className="flex justify-between items-start">
                <div className="bg-white/5 p-4 rounded-2xl group-hover:bg-blue-600/10 transition-all">
                   <Activity size={24} className={p.status === 'Printing' ? 'text-orange-500 animate-pulse' : 'text-blue-500'} />
                </div>
                <button onClick={() => handleDelete(p.id)} className="text-slate-700 hover:text-red-500 transition-colors">
                   <Trash2 size={20} />
                </button>
             </div>
             
             <div>
                <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">{p.name}</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{p.model}</p>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                   <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic mb-1">Status</p>
                   <p className={`text-xs font-black italic uppercase ${p.status === 'Printing' ? 'text-orange-500' : 'text-green-500'}`}>{p.status}</p>
                </div>
                <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                   <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic mb-1">Nozzle</p>
                   <p className="text-xs font-black italic text-white uppercase">{p.nozzleSize}mm</p>
                </div>
             </div>

             <div className="pt-4 border-t border-white/5 space-y-4">
                <div className="flex justify-between items-center text-[10px]">
                   <span className="text-slate-500 font-bold uppercase flex items-center gap-2 italic"><Clock size={12}/> Betriebsstunden</span>
                   <span className="text-white font-black italic">{p.totalPrintTime}h</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                   <span className="text-slate-500 font-bold uppercase flex items-center gap-2 italic"><Wrench size={12}/> Letzte Wartung</span>
                   <span className="text-white font-black italic">{p.lastMaintenance}</span>
                </div>
             </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-[#0f172a] border border-white/10 w-full max-w-xl rounded-[48px] p-10 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-10">
               <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">Drucker Registrierung</h2>
               <button onClick={() => setIsAdding(false)}><X size={24} className="text-slate-500 hover:text-white"/></button>
            </div>
            <div className="space-y-6">
              <input 
                placeholder="Bezeichnung (z.B. Voron-01)" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold"
                value={newPrinter.name}
                onChange={e => setNewPrinter({...newPrinter, name: e.target.value})}
              />
              <input 
                placeholder="Modell (z.B. Creality Ender 3 S1)" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold"
                value={newPrinter.model}
                onChange={e => setNewPrinter({...newPrinter, model: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-4">
                 <input 
                  type="number" step="0.1" 
                  placeholder="Nozzle Ø (mm)" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold"
                  value={newPrinter.nozzleSize}
                  onChange={e => setNewPrinter({...newPrinter, nozzleSize: parseFloat(e.target.value)})}
                 />
                 <input 
                  type="date" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white"
                  value={newPrinter.lastMaintenance}
                  onChange={e => setNewPrinter({...newPrinter, lastMaintenance: e.target.value})}
                 />
              </div>
              <button onClick={handleAdd} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[24px] uppercase italic tracking-tighter">Speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetManager;
