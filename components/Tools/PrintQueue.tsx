
import React, { useState, useEffect } from 'react';
import { ListTodo, Clock, Calendar, Plus, Trash2, Printer, Zap, CheckCircle2, AlertCircle, ChevronRight, Share2 } from 'lucide-react';
import { db } from '../../services/database';
import { Project, Printer as PrinterType } from '../../types';

interface QueueItem {
  id: string;
  projectName: string;
  printerId: string;
  startTime: string;
  duration: number; // h
  status: 'pending' | 'printing' | 'done';
}

const PrintQueue: React.FC = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [printers, setPrinters] = useState<PrinterType[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    Promise.all([db.getProjects(), db.getPrinters()]).then(([proj, print]) => {
      setProjects(proj);
      setPrinters(print);
      // Mock Queue Data
      setQueue([
        { id: 'q1', projectName: 'Vase HQ', printerId: print[0]?.id || '1', startTime: '10:00', duration: 4.5, status: 'printing' },
        { id: 'q2', projectName: 'Brick 2x4 Set', printerId: print[0]?.id || '1', startTime: '14:45', duration: 2.0, status: 'pending' }
      ]);
    });
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter flex items-center gap-4 leading-none">
             PRINT <span className="text-orange-500">QUEUE</span>.
          </h1>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.4em] mt-3 italic opacity-60">Timeline-Based Production Scheduling</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-5 rounded-[28px] font-black italic transition-all shadow-xl uppercase tracking-widest flex items-center gap-4">
           <Plus size={24} /> New Schedule
        </button>
      </header>

      <div className="grid grid-cols-1 gap-10">
        {/* Timeline Visualization */}
        <div className="glass rounded-[56px] p-10 border-white/5 bg-slate-900/60 shadow-2xl relative overflow-hidden">
           <div className="flex items-center justify-between mb-12">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-[0.4em] italic flex items-center gap-3">
                 <Clock size={18} /> Daily Workflow
              </h3>
              <div className="flex gap-4">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black uppercase text-orange-400">In Progress</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-slate-700 rounded-full" />
                    <span className="text-[9px] font-black uppercase text-slate-500">Scheduled</span>
                 </div>
              </div>
           </div>

           <div className="relative pt-12 pb-12">
              {/* Hour Markers */}
              <div className="absolute top-0 left-0 right-0 flex justify-between px-2 text-[8px] font-black text-slate-700 uppercase tracking-widest border-b border-white/5 pb-2">
                 {['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'].map(h => <span key={h}>{h}</span>)}
              </div>
              
              <div className="space-y-8 mt-4">
                 {printers.map(printer => (
                   <div key={printer.id} className="space-y-4">
                      <div className="flex items-center gap-4 px-2">
                         <Printer size={14} className="text-blue-500" />
                         <span className="text-[10px] font-black uppercase italic text-white tracking-widest">{printer.name}</span>
                      </div>
                      <div className="h-16 w-full bg-black/40 rounded-3xl border border-white/5 relative overflow-hidden flex items-center p-1">
                         {queue.filter(q => q.printerId === printer.id).map(job => (
                           <div 
                            key={job.id}
                            className={`h-12 rounded-2xl border flex flex-col justify-center px-6 transition-all hover:scale-[1.01] cursor-pointer group ${job.status === 'printing' ? 'bg-orange-600/20 border-orange-500 text-orange-500' : 'bg-white/5 border-white/10 text-slate-500'}`}
                            style={{ width: `${(job.duration / 16) * 100}%` }}
                           >
                              <p className="text-[9px] font-black uppercase italic truncate">{job.projectName}</p>
                              <p className="text-[7px] font-bold uppercase opacity-60">{job.duration}h • {job.startTime}</p>
                           </div>
                         ))}
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="glass rounded-[48px] p-10 border-white/5 bg-slate-900/40 space-y-8">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-[0.4em] italic flex items-center gap-3">
                 <CheckCircle2 size={18} /> Optimization Report
              </h3>
              <div className="space-y-6">
                 <div className="flex items-center gap-6 p-6 bg-white/5 rounded-3xl border border-white/5">
                    <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500">
                       <Zap size={24} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-white uppercase italic">Efficiency Core</p>
                       <p className="text-[9px] font-bold text-slate-500 uppercase mt-1 leading-relaxed">Aktuelle Auslastung: 64%. Ein Slot auf Drucker "Voron-01" wird um 16:45 Uhr frei.</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-orange-600/5 p-10 rounded-[48px] border border-orange-500/20 flex flex-col justify-center">
              <div className="flex gap-6">
                 <AlertCircle size={32} className="text-orange-500 flex-shrink-0" />
                 <div>
                    <h4 className="text-lg font-black italic text-white uppercase tracking-tighter">Material Check</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 leading-relaxed italic">
                      Das System hat erkannt, dass für den nächsten Auftrag "Vase HQ" nur noch 140g Filament auf der Spule sind. Benötigt werden 180g. Bitte Spule rechtzeitig wechseln!
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PrintQueue;
