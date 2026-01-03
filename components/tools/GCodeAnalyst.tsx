
import React, { useState, useRef, useEffect } from 'react';
import { FileCode, Upload, Zap, Clock, Weight, Save, RefreshCw, CheckCircle2, ShieldCheck, Database, Fingerprint, Terminal, Activity, Binary, Cpu } from 'lucide-react';
import { db } from '../../services/database';
import { Filament, Printer } from '../../types';

const GCodeAnalyst: React.FC = () => {
  const [fileData, setFileData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [selectedPrinterId, setSelectedPrinterId] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [detectedSlots, setDetectedSlots] = useState<Record<number, string>>({});
  const [isSynced, setIsSynced] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([db.getFilaments(), db.getPrinters()]).then(([f, p]) => {
      setFilaments(f);
      setPrinters(p);
    });
  }, []);

  const addLog = (msg: string) => setTerminalLogs(prev => [...prev.slice(-15), `> ${msg}`]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsAnalyzing(true);
    setIsSynced(false);
    setTerminalLogs([]);
    setDetectedSlots({});
    addLog(`INIT: Lade Datei ${file.name}...`);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const stats = parseGCode(content);
      setFileData({ ...stats, name: file.name });
      setIsAnalyzing(false);
    };
    reader.readAsText(file.slice(0, 3000000)); 
  };

  const parseGCode = (content: string) => {
    addLog("START: Scanne Slicer-Metadaten...");
    const slots: Record<number, string> = {};
    for (let i = 1; i <= 4; i++) {
        const match = content.match(new RegExp(`; PV_SLOT_${i}_ID: (.*)`));
        if (match) {
            slots[i] = match[1].trim();
            const f = filaments.find(x => x.id === slots[i]);
            addLog(`DETECTED: Slot ${i} erkannt als [${f?.color || 'Unbekannt'}]`);
        }
    }
    setDetectedSlots(slots);
    const filamentUsedMatch = content.match(/filament used \[mm\] = ([\d.]+)/) || content.match(/Filament used: ([\d.]+)m/);
    const timeMatch = content.match(/estimated printing time \(normal mode\) = (.*)/) || content.match(/;TIME:(\d+)/);
    
    let hours = 0;
    if (timeMatch) {
      const rawTime = timeMatch[1];
      hours = isNaN(Number(rawTime)) ? 4.5 : Number(rawTime) / 3600;
    }

    let grams = 0;
    if (filamentUsedMatch) {
        const val = parseFloat(filamentUsedMatch[1]);
        grams = (val * 1.24 * 0.0024);
    }
    addLog("SUCCESS: G-Code Mapping abgeschlossen.");
    return { weight: grams.toFixed(1), duration: hours.toFixed(2) };
  };

  return (
    <div className="h-full w-full flex flex-col p-8 gap-8 animate-in fade-in duration-700 overflow-hidden">
      <header className="shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <div className="bg-blue-600/10 border border-blue-500/20 px-3 py-1 rounded-full flex items-center gap-2">
                <ShieldCheck size={12} className="text-blue-500" />
                <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest">Multi-Slicer Analysis</span>
             </div>
          </div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter leading-none">
             G-Code <span className="text-blue-500">Analyst</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-2 italic opacity-60">Universal Data Extraction Engine</p>
        </div>
      </header>

      <section className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
        <div className="flex-1 flex flex-col gap-6 h-full">
          <div 
            onClick={() => !isAnalyzing && fileInputRef.current?.click()}
            className={`glass flex-1 rounded-[56px] border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer group relative overflow-hidden ${fileData ? 'border-blue-500/50 bg-blue-600/5' : 'border-white/10 hover:border-blue-500/30'}`}
          >
             {isAnalyzing ? (
               <div className="flex flex-col items-center gap-4">
                  <RefreshCw className="animate-spin text-blue-500" size={56} />
                  <p className="text-[10px] font-black uppercase text-white tracking-widest">Neural Parsing...</p>
               </div>
             ) : fileData ? (
               <div className="text-center space-y-6 p-12">
                  <FileCode size={64} className="text-blue-500 mx-auto" />
                  <h3 className="text-2xl font-black italic text-white uppercase truncate max-w-md">{fileData.name}</h3>
                  <div className="flex justify-center gap-4">
                      {Object.keys(detectedSlots).map(s => (
                        <div key={s} className="text-emerald-500 font-black italic uppercase text-[9px] bg-emerald-600/10 px-4 py-2 rounded-full border border-emerald-500/20">Slot {s} Mapped</div>
                      ))}
                  </div>
               </div>
             ) : (
               <div className="flex flex-col items-center gap-6 opacity-40">
                  <Upload size={64} />
                  <p className="text-xs font-black uppercase tracking-widest">Drop Sliced G-Code</p>
               </div>
             )}
             <input type="file" ref={fileInputRef} className="hidden" accept=".gcode" onChange={handleFileUpload} />
          </div>

          <div className="h-48 glass rounded-[32px] p-6 bg-black/40 border border-white/5 font-mono overflow-hidden shrink-0">
             <div className="flex items-center gap-3 mb-4 text-blue-500 opacity-60">
                <Terminal size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest">Parser Log</span>
             </div>
             <div className="space-y-1">
                {terminalLogs.length === 0 ? <p className="text-[10px] text-slate-700 italic">Standby...</p> : terminalLogs.map((log, i) => (
                  <p key={i} className="text-[10px] text-emerald-400/80 font-bold animate-in slide-in-from-left-2">{log}</p>
                ))}
             </div>
          </div>
        </div>

        <div className="lg:w-[400px] glass rounded-[48px] p-10 border-white/5 bg-slate-900/40 space-y-10 flex flex-col shrink-0 shadow-2xl overflow-y-auto scrollbar-hide">
           <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest italic flex items-center gap-3">
              <Database size={18} className="text-blue-500" /> Parameters
           </h3>
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/20 p-5 rounded-3xl border border-white/5">
                 <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Duration</p>
                 <p className="text-xl font-black italic text-white">{fileData ? `${fileData.duration}h` : '--'}</p>
              </div>
              <div className="bg-black/20 p-5 rounded-3xl border border-white/5">
                 <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Mass</p>
                 <p className="text-xl font-black italic text-white">{fileData ? `${fileData.weight}g` : '--'}</p>
              </div>
           </div>
           <div className="space-y-6 flex-1">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Target Printer</label>
                 <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white outline-none" value={selectedPrinterId} onChange={e => setSelectedPrinterId(e.target.value)}>
                    <option value="">Select Printer...</option>
                    {printers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                 </select>
              </div>
              <button disabled={!fileData || !selectedPrinterId} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white py-6 rounded-[28px] font-black italic uppercase text-sm shadow-xl transition-all"><Zap className="inline mr-2" size={18} /> Execute Sync</button>
           </div>
        </div>
      </section>

      <footer className="shrink-0 glass rounded-[32px] border-white/5 bg-slate-900/40 p-6 flex flex-wrap items-center justify-between gap-8 shadow-2xl mb-2">
         <div className="flex items-center gap-8 border-r border-white/10 pr-10">
            <Activity size={24} className="text-blue-500 animate-pulse" />
            <div>
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] leading-none italic">Logistics Node</p>
               <p className="text-sm font-black italic text-white mt-1.5 uppercase leading-none tracking-tight">Sync Status: Online</p>
            </div>
         </div>
         
         <div className="flex-1 flex gap-12 justify-center">
            <div className="flex items-center gap-3">
               <Binary size={14} className="text-slate-500" />
               <p className="text-[11px] font-bold text-slate-300 uppercase italic">Metadata Mapping: Active</p>
            </div>
            <div className="flex items-center gap-3">
               <Cpu size={14} className="text-slate-500" />
               <p className="text-[11px] font-bold text-slate-300 uppercase italic">Direct Node Link: Enabled</p>
            </div>
         </div>

         <div className="text-right pl-10 border-l border-white/10">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none italic">G-Code Rev</p>
            <p className="text-[11px] font-mono font-bold text-blue-500 mt-1 uppercase italic leading-none">ANALYSIS-v8.2</p>
         </div>
      </footer>
    </div>
  );
};

export default GCodeAnalyst;
