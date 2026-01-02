
import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, CheckCircle2, XCircle, Clock, Weight, Printer as PrinterIcon, Package, X, Save } from 'lucide-react';
import { PrintLogEntry, Filament, Printer } from '../../types';
import { db } from '../../services/database';

const PrintLog: React.FC = () => {
  const [logs, setLogs] = useState<PrintLogEntry[]>([]);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  const [newEntry, setNewEntry] = useState<Partial<PrintLogEntry>>({
    projectName: '', printerId: '', filamentId: '', weight: 0, duration: 0, status: 'Success', notes: '', startTime: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    Promise.all([db.getPrintLogs(), db.getFilaments(), db.getPrinters()]).then(([l, f, p]) => {
      setLogs(l.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
      setFilaments(f);
      setPrinters(p);
    });
  }, []);

  const handleAdd = async () => {
    if (!newEntry.projectName || !newEntry.printerId) return;
    const log: PrintLogEntry = { ...newEntry as PrintLogEntry, id: `log_${Date.now()}` };
    await db.addPrintLog(log);
    setLogs([log, ...logs]);
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eintrag löschen?')) return;
    await db.deletePrintLog(id);
    setLogs(logs.filter(l => l.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter flex items-center gap-3">
             <BookOpen size={36} className="text-blue-500" /> Print <span className="text-blue-500">Log PRO</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1 italic">Dokumentation deiner Produktions-Historie</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-3xl font-black italic flex items-center gap-3 transition-all shadow-xl">
          <Plus size={20} /> EINTRAG ERSTELLEN
        </button>
      </header>

      <div className="space-y-6">
        {logs.length === 0 ? (
          <div className="py-20 glass rounded-[48px] border-dashed border-white/10 flex flex-col items-center justify-center opacity-30 italic">
             <BookOpen size={64} className="mb-4" />
             <p className="text-xs font-black uppercase tracking-[0.2em]">Keine Logs vorhanden</p>
          </div>
        ) : logs.map(l => (
          <div key={l.id} className="glass rounded-[32px] p-8 border-white/5 bg-slate-900/40 flex flex-col lg:flex-row gap-8 hover:border-blue-500/20 transition-all relative group">
             <div className="flex-1 flex flex-col md:flex-row gap-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/5 border border-white/5">
                   {l.status === 'Success' ? <CheckCircle2 size={32} className="text-green-500" /> : <XCircle size={32} className="text-red-500" />}
                </div>
                <div className="flex-1 space-y-2">
                   <div className="flex items-center gap-3">
                      <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">{l.projectName}</h3>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">{l.startTime}</span>
                   </div>
                   <div className="flex flex-wrap gap-4 pt-2">
                      <InfoItem icon={<PrinterIcon size={12}/>} label="Drucker" value={printers.find(p => p.id === l.printerId)?.name || 'Unbekannt'} />
                      <InfoItem icon={<Package size={12}/>} label="Filament" value={filaments.find(f => f.id === l.filamentId)?.color || 'Unbekannt'} />
                      <InfoItem icon={<Weight size={12}/>} label="Gewicht" value={`${l.weight}g`} />
                      <InfoItem icon={<Clock size={12}/>} label="Dauer" value={`${l.duration}h`} />
                   </div>
                   {l.notes && <p className="text-sm font-medium text-slate-400 italic mt-4 bg-black/20 p-4 rounded-2xl border border-white/5">"{l.notes}"</p>}
                </div>
             </div>
             <button onClick={() => handleDelete(l.id)} className="absolute top-8 right-8 text-slate-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 size={20} />
             </button>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-[#0f172a] border border-white/10 w-full max-w-2xl rounded-[48px] p-10 animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh] scrollbar-hide">
            <div className="flex justify-between items-center mb-10">
               <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">Log-Eintrag</h2>
               <button onClick={() => setIsAdding(false)}><X size={24} className="text-slate-500 hover:text-white"/></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                 <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Projektname</label>
                 <input placeholder="z.B. Benchy V2" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white mt-2" value={newEntry.projectName} onChange={e => setNewEntry({...newEntry, projectName: e.target.value})} />
              </div>
              <div>
                 <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Drucker</label>
                 <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white mt-2 appearance-none" value={newEntry.printerId} onChange={e => setNewEntry({...newEntry, printerId: e.target.value})}>
                    <option value="">Wählen...</option>
                    {printers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                 </select>
              </div>
              <div>
                 <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Filament</label>
                 <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white mt-2 appearance-none" value={newEntry.filamentId} onChange={e => setNewEntry({...newEntry, filamentId: e.target.value})}>
                    <option value="">Wählen...</option>
                    {filaments.map(f => <option key={f.id} value={f.id}>{f.color} ({f.brand})</option>)}
                 </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Dauer (h)</label>
                    <input type="number" step="0.1" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white mt-2" value={newEntry.duration} onChange={e => setNewEntry({...newEntry, duration: parseFloat(e.target.value)})} />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Gewicht (g)</label>
                    <input type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white mt-2" value={newEntry.weight} onChange={e => setNewEntry({...newEntry, weight: parseInt(e.target.value)})} />
                 </div>
              </div>
              <div>
                 <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Ergebnis</label>
                 <div className="grid grid-cols-2 gap-2 mt-2">
                    <button onClick={() => setNewEntry({...newEntry, status: 'Success'})} className={`py-4 rounded-xl text-xs font-black uppercase italic transition-all ${newEntry.status === 'Success' ? 'bg-green-600 text-white shadow-lg' : 'bg-white/5 text-slate-500'}`}>Erfolg</button>
                    <button onClick={() => setNewEntry({...newEntry, status: 'Failed'})} className={`py-4 rounded-xl text-xs font-black uppercase italic transition-all ${newEntry.status === 'Failed' ? 'bg-red-600 text-white shadow-lg' : 'bg-white/5 text-slate-500'}`}>Fehler</button>
                 </div>
              </div>
              <div className="md:col-span-2">
                 <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Notizen / Fehlergrund</label>
                 <textarea className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm font-medium italic mt-2 h-24 resize-none" value={newEntry.notes} onChange={e => setNewEntry({...newEntry, notes: e.target.value})} />
              </div>
              <button onClick={handleAdd} className="md:col-span-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[24px] uppercase italic tracking-tighter shadow-xl shadow-blue-900/40">Log Speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoItem = ({ icon, label, value }: any) => (
  <div className="flex items-center gap-2">
     <div className="text-blue-500">{icon}</div>
     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}:</span>
     <span className="text-[10px] font-black italic text-white uppercase">{value}</span>
  </div>
);

export default PrintLog;
