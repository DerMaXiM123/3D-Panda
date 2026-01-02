
import React, { useState, useRef, useEffect } from 'react';
import { FileCode, Upload, Zap, Clock, Weight, Thermometer, Box, Save, RefreshCw, CheckCircle2, ShieldCheck, Database, Fingerprint, Search, Terminal, AlertCircle } from 'lucide-react';
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
    
    // Multi-Slot Detection
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

    // Standard Metadaten
    const filamentUsedMatch = content.match(/filament used \[mm\] = ([\d.]+)/) || content.match(/Filament used: ([\d.]+)m/);
    const timeMatch = content.match(/estimated printing time \(normal mode\) = (.*)/) || content.match(/;TIME:(\d+)/);
    
    addLog("ANALYZE: Berechne Materialverbrauch...");
    
    let hours = 0;
    if (timeMatch) {
      const rawTime = timeMatch[1];
      if (rawTime.includes('h')) {
        const parts = rawTime.split(' ');
        hours = parseInt(parts[0]) + (parseInt(parts[1] || '0') / 60);
      } else if (!isNaN(Number(rawTime))) {
        hours = parseInt(rawTime) / 3600;
      }
    }

    let grams = 0;
    if (filamentUsedMatch) {
        const val = parseFloat(filamentUsedMatch[1]);
        const isMeter = filamentUsedMatch[0].includes('m') && !filamentUsedMatch[0].includes('mm');
        const mm = isMeter ? val * 1000 : val;
        grams = (mm * Math.PI * Math.pow(1.75/2, 2) * 1.24) / 1000;
    }

    addLog("SUCCESS: G-Code Mapping abgeschlossen.");
    return {
      weight: grams.toFixed(1),
      duration: hours.toFixed(2),
      name: ''
    };
  };

  const handleSync = async () => {
    if (!fileData || !selectedPrinterId) return;
    
    // Wenn Slots erkannt wurden, buche alle ab
    const slotEntries = Object.entries(detectedSlots);
    if (slotEntries.length > 0) {
        for (const [slot, id] of slotEntries) {
            const filament = filaments.find(f => f.id === id);
            if (filament) {
                // Bei Multi-Material teilen wir das Gewicht (vereinfacht) oder buchen alles ab
                // Hier: Wir buchen den Gesamtverbrauch von der Haupt-Rolle ab (Slot 1) oder anteilig
                const share = parseFloat(fileData.weight) / slotEntries.length;
                await db.updateFilament({ ...filament, remaining: Math.max(0, filament.remaining - share) });
            }
        }
    }

    await db.addPrintLog({
      id: `log_${Date.now()}`,
      projectName: fileData.name,
      printerId: selectedPrinterId,
      filamentId: detectedSlots[1] || 'Manual',
      startTime: new Date().toISOString().split('T')[0],
      duration: parseFloat(fileData.duration),
      weight: parseFloat(fileData.weight),
      status: 'Success',
      notes: `Neural Sync: ${Object.keys(detectedSlots).length} Slots verarbeitet.`
    });

    setIsSynced(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <div className="bg-blue-600/10 border border-blue-500/20 px-3 py-1 rounded-full flex items-center gap-2">
                <ShieldCheck size={12} className="text-blue-500" />
                <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest">Multi-Slicer Intelligence</span>
             </div>
          </div>
          <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter flex items-center gap-4 leading-none">
             G-CODE <span className="text-blue-500">ANALYST</span>.
          </h1>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.4em] mt-3 italic opacity-60">Universal Data Extraction Engine</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-6">
          <div 
            onClick={() => !isAnalyzing && fileInputRef.current?.click()}
            className={`glass aspect-video rounded-[56px] border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer group relative overflow-hidden ${fileData ? 'border-blue-500/50 bg-blue-600/5' : 'border-white/10 hover:border-blue-500/30'}`}
          >
             <div className="scanline" />
             {isAnalyzing ? (
               <div className="flex flex-col items-center gap-4">
                  <RefreshCw className="animate-spin text-blue-500" size={56} />
                  <p className="text-[10px] font-black uppercase text-white tracking-widest">Neural Parsing...</p>
               </div>
             ) : fileData ? (
               <div className="text-center space-y-4 p-12">
                  <div className="bg-blue-600/20 p-8 rounded-full w-max mx-auto mb-6">
                     <FileCode size={48} className="text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-black italic text-white uppercase truncate max-w-md">{fileData.name}</h3>
                  <div className="flex flex-wrap justify-center gap-2">
                      {Object.keys(detectedSlots).map(s => (
                        <div key={s} className="flex items-center gap-2 text-emerald-500 font-black italic uppercase text-[9px] tracking-widest bg-emerald-600/10 px-4 py-2 rounded-full border border-emerald-500/20">
                           <Fingerprint size={12} /> Slot {s} ID Match
                        </div>
                      ))}
                  </div>
               </div>
             ) : (
               <div className="flex flex-col items-center gap-6">
                  <div className="p-10 bg-white/5 rounded-full text-slate-700 group-hover:text-blue-500 transition-colors">
                     <Upload size={64} />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black italic text-white uppercase tracking-tight">Drop Sliced G-Code</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 italic">Works with Anycubic, Orca, Bambu, Prusa & Cura</p>
                  </div>
               </div>
             )}
             <input type="file" ref={fileInputRef} className="hidden" accept=".gcode" onChange={handleFileUpload} />
          </div>

          <div className="glass rounded-[32px] p-6 bg-black/40 border border-white/5 font-mono overflow-hidden">
             <div className="flex items-center gap-3 mb-4 text-blue-500 opacity-60">
                <Terminal size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest">Neural Parser Console</span>
             </div>
             <div className="space-y-1">
                {terminalLogs.length === 0 ? (
                  <p className="text-[10px] text-slate-700 italic font-bold">Warte auf G-Code Stream...</p>
                ) : terminalLogs.map((log, i) => (
                  <p key={i} className="text-[10px] text-emerald-400/80 font-bold animate-in slide-in-from-left-2 duration-300">{log}</p>
                ))}
             </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
           <div className="glass rounded-[48px] p-10 border-white/5 bg-slate-900/40 space-y-8">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-[0.4em] italic flex items-center gap-3">
                 <Database size={18} className="text-blue-500" /> Production Sync
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                 <StatMini icon={<Clock size={16}/>} label="Dauer" value={fileData ? `${fileData.duration}h` : '--'} />
                 <StatMini icon={<Weight size={16}/>} label="Masse" value={fileData ? `${fileData.weight}g` : '--'} />
              </div>

              <div className="space-y-6 pt-4 border-t border-white/5">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Target Printer</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white outline-none focus:border-blue-500 appearance-none" value={selectedPrinterId} onChange={e => setSelectedPrinterId(e.target.value)}>
                       <option value="">Select Printer...</option>
                       {printers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                 </div>
              </div>

              <button 
                disabled={!fileData || !selectedPrinterId || isSynced}
                onClick={handleSync}
                className={`w-full py-6 rounded-[28px] font-black italic uppercase tracking-widest text-lg flex items-center justify-center gap-4 transition-all shadow-xl ${isSynced ? 'bg-green-600 text-white shadow-green-900/20' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'}`}
              >
                {isSynced ? <CheckCircle2 size={24} /> : <Zap size={24} />}
                {isSynced ? 'SYNC COMPLETE' : 'EXECUTE SYNC'}
              </button>

              {isSynced && (
                <div className="p-6 bg-green-600/10 border border-green-500/20 rounded-3xl animate-in zoom-in-95">
                   <p className="text-[10px] text-green-500 font-black uppercase leading-relaxed text-center italic">
                     Erfolg: Bestände wurden basierend auf den Neural Tags aktualisiert.
                   </p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

const StatMini = ({ icon, label, value }: any) => (
  <div className="glass p-5 rounded-[28px] border-white/5 bg-slate-900/40">
    <div className="flex items-center gap-2 text-blue-500 mb-2">
       {icon}
       <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <p className="text-xl font-black italic text-white leading-none">{value}</p>
  </div>
);

export default GCodeAnalyst;
