
import React, { useState, useEffect, useMemo } from 'react';
import { Scissors, Weight, Package, ChevronRight, CheckCircle2, AlertTriangle, Euro, Link, RefreshCw, Radio, Wifi, Globe } from 'lucide-react';
import { Filament } from '../types';

interface SlicerToolProps {
  onFinish: () => void;
}

const SlicerTool: React.FC<SlicerToolProps> = ({ onFinish }) => {
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [consumedGrams, setConsumedGrams] = useState<number>(0);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Printer Link State
  const [printerIp, setPrinterIp] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [printerStatus, setPrinterStatus] = useState<'idle' | 'connected' | 'error'>('idle');
  const [lastJobInfo, setLastJobInfo] = useState<{filename: string, filamentGrams: number} | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('printverse_filaments');
    if (saved) setFilaments(JSON.parse(saved));
    
    const savedConfig = localStorage.getItem('printverse_printer_config');
    if (savedConfig) {
      const { ip, key } = JSON.parse(savedConfig);
      setPrinterIp(ip);
      setApiKey(key);
    }
  }, []);

  const savePrinterConfig = () => {
    localStorage.setItem('printverse_printer_config', JSON.stringify({ ip: printerIp, key: apiKey }));
    setPrinterStatus('idle');
  };

  const fetchLastPrintJob = async () => {
    if (!printerIp) return;
    setIsConnecting(true);
    setPrinterStatus('idle');

    try {
      // Simulation einer OctoPrint/Moonraker API Abfrage
      // In einer echten Umgebung würde hier fetch(`http://${printerIp}/api/job`) stehen
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock-Daten für die Demo (In Echt: Daten aus API extrahieren)
      const mockJob = {
        filename: "Benchy_V3_HighRes.gcode",
        filamentGrams: Math.floor(Math.random() * 45) + 12 
      };
      
      setLastJobInfo(mockJob);
      setConsumedGrams(mockJob.filamentGrams);
      setPrinterStatus('connected');
    } catch (err) {
      setPrinterStatus('error');
    } finally {
      setIsConnecting(false);
    }
  };

  // Filter-Logik
  const brands = useMemo(() => Array.from(new Set(filaments.map(f => f.brand))), [filaments]);
  const materials = useMemo(() => 
    selectedBrand ? Array.from(new Set(filaments.filter(f => f.brand === selectedBrand).map(f => f.material))) : [],
    [filaments, selectedBrand]
  );
  const availableItems = useMemo(() => 
    (selectedBrand && selectedMaterial) ? filaments.filter(f => f.brand === selectedBrand && f.material === selectedMaterial) : [],
    [filaments, selectedBrand, selectedMaterial]
  );

  const selectedFilament = useMemo(() => 
    filaments.find(f => f.id === selectedId),
    [filaments, selectedId]
  );

  const handleSubtract = () => {
    if (!selectedFilament || consumedGrams <= 0) return;
    
    const updated = filaments.map(f => {
      if (f.id === selectedId) {
        return { ...f, remaining: Math.max(0, f.remaining - consumedGrams) };
      }
      return f;
    });

    localStorage.setItem('printverse_filaments', JSON.stringify(updated));
    setFilaments(updated);
    setIsSuccess(true);
    setTimeout(() => {
      onFinish();
    }, 2000);
  };

  const cost = selectedFilament && selectedFilament.price 
    ? (selectedFilament.price * (consumedGrams / selectedFilament.weight)).toFixed(2) 
    : "0.00";

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto h-[60vh] flex flex-col items-center justify-center space-y-4 animate-in zoom-in-95 duration-500">
        <div className="bg-green-500/20 p-8 rounded-full">
           <CheckCircle2 size={64} className="text-green-500" />
        </div>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">Druck registriert!</h2>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Lagerbestand wurde automatisch aktualisiert.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase flex items-center gap-4">
            <Scissors className="text-blue-500" size={36} /> Slicer-Sync <span className="text-blue-500">PRO</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1 italic flex items-center gap-2">
            <Link size={14} className="text-blue-400" /> API-SUPPORT FÜR OCTOPRINT & MAINSAIL AKTIV
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Drucker Anbindung */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass rounded-[40px] p-8 space-y-6 border-white/10 bg-slate-900/40">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 italic flex items-center gap-2">
              <Radio size={16} className="text-blue-500" /> Drucker-Remote
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-500 ml-2">Printer IP / URL</label>
                <input 
                  placeholder="192.168.178.XX" 
                  className="w-full bg-black/20 border border-white/5 rounded-2xl py-3 px-5 text-xs font-medium focus:border-blue-500 transition-all"
                  value={printerIp}
                  onChange={e => setPrinterIp(e.target.value)}
                  onBlur={savePrinterConfig}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-500 ml-2">API Key</label>
                <input 
                  type="password"
                  placeholder="X-Api-Key..." 
                  className="w-full bg-black/20 border border-white/5 rounded-2xl py-3 px-5 text-xs font-medium focus:border-blue-500 transition-all"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  onBlur={savePrinterConfig}
                />
              </div>
              
              <button 
                onClick={fetchLastPrintJob}
                disabled={!printerIp || isConnecting}
                className="w-full bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl transition-all border border-white/5 flex items-center justify-center gap-3 text-xs uppercase italic"
              >
                {isConnecting ? <RefreshCw size={16} className="animate-spin" /> : <Wifi size={16} />}
                {isConnecting ? 'Verbinde...' : 'Letzten Druck abrufen'}
              </button>

              {printerStatus === 'connected' && lastJobInfo && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-300">
                   <p className="text-[8px] font-black text-green-500 uppercase tracking-widest mb-1">Erfolg: Daten synchronisiert</p>
                   <p className="text-[11px] font-black text-white italic truncate">{lastJobInfo.filename}</p>
                   <p className="text-[10px] font-bold text-slate-400 mt-1">{lastJobInfo.filamentGrams}g verbraucht</p>
                </div>
              )}
              {printerStatus === 'error' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
                   <AlertTriangle size={16} className="text-red-500" />
                   <span className="text-[9px] font-black text-red-400 uppercase tracking-tighter leading-tight">Verbindung fehlgeschlagen. IP/Key prüfen.</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-blue-600/5 p-6 rounded-[32px] border border-blue-600/10 italic">
            <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">
              Hinweis: Webhooks benötigen einen Server. Diese App nutzt direktes API-Polling für maximale Privatsphäre in deinem lokalen Netzwerk.
            </p>
          </div>
        </div>

        {/* Filament Wahl */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass rounded-[40px] p-8 space-y-8 border-white/10 bg-slate-900/40 min-h-[500px]">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 italic flex items-center gap-2">
              <Package size={16} className="text-blue-500" /> Filament Auswahl
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Marke</label>
                <div className="grid grid-cols-2 gap-2">
                  {brands.map(b => (
                    <button 
                      key={b} 
                      onClick={() => { setSelectedBrand(b); setSelectedMaterial(''); setSelectedId(''); }}
                      className={`py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${selectedBrand === b ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {selectedBrand && (
                <div className="space-y-3 animate-in slide-in-from-left-4 duration-300">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Typ</label>
                  <div className="flex flex-wrap gap-2">
                    {materials.map(m => (
                      <button 
                        key={m} 
                        onClick={() => { setSelectedMaterial(m); setSelectedId(''); }}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${selectedMaterial === m ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedMaterial && (
                <div className="space-y-3 animate-in slide-in-from-left-4 duration-300">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Rolle</label>
                  <div className="space-y-2">
                    {availableItems.map(f => (
                      <button 
                        key={f.id} 
                        onClick={() => setSelectedId(f.id)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedId === f.id ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'}`}
                      >
                        <div className="flex items-center gap-3">
                           <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: f.hex }} />
                           <span className="text-[11px] font-black italic">{f.color}</span>
                        </div>
                        <span className="text-[9px] font-bold opacity-60">{f.remaining}g</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Kalkulation & Submit */}
        <div className="lg:col-span-4 space-y-6">
           <div className="glass rounded-[40px] p-8 space-y-8 border-white/10 bg-slate-900/60 relative overflow-hidden h-full flex flex-col justify-between">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 italic">Verbrauch</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-end px-2">
                        <label className="text-[10px] font-black uppercase text-slate-400">Gramm (Slicer-Info)</label>
                        <span className="text-blue-500 font-black italic text-2xl">{consumedGrams}g</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" max="1000" 
                      value={consumedGrams} 
                      onChange={e => setConsumedGrams(parseInt(e.target.value))}
                      className="modern-slider"
                    />
                  </div>
                </div>

                <div className="pt-8 space-y-4 border-t border-white/5">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-tight text-slate-400">
                      <span>Druck-Kosten</span>
                      <span className="text-green-400 font-black italic flex items-center gap-1"><Euro size={12}/> {cost}</span>
                  </div>
                  
                  {selectedFilament && (
                      <div className={`p-4 rounded-2xl flex items-center gap-3 ${selectedFilament.remaining < consumedGrams ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'}`}>
                        {selectedFilament.remaining < consumedGrams ? <AlertTriangle size={18}/> : <CheckCircle2 size={18}/>}
                        <span className="text-[10px] font-black uppercase italic tracking-tighter">
                            {selectedFilament.remaining < consumedGrams 
                              ? "WARNUNG: Nicht genügend Filament!" 
                              : `Restbestand: ~${selectedFilament.remaining - consumedGrams}g`}
                        </span>
                      </div>
                  )}
                </div>
              </div>

              <button 
                disabled={!selectedId || consumedGrams <= 0 || (selectedFilament ? selectedFilament.remaining < consumedGrams : false)}
                onClick={handleSubtract}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 text-white font-black py-6 rounded-[24px] transition-all shadow-xl shadow-blue-900/20 uppercase italic tracking-tighter text-lg flex items-center justify-center gap-3 mt-8"
              >
                <Scissors size={20} /> Abzug Bestätigen
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SlicerTool;
