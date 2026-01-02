
import React, { useState, useRef } from 'react';
import { Camera, ScanFace, BrainCircuit, AlertCircle, RefreshCw, Upload, CheckCircle2, ChevronRight, Zap, Info } from 'lucide-react';
import { geminiService } from '../../services/geminiService';

const VisionLab: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setDiagnosis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    const result = await geminiService.analyzeImage(image, "Technisches Gutachten: Identifiziere Artefakte in der Oberflächenstruktur dieses 3D-Drucks (Stringing, Ghosting, Under-Extrusion). Gib präzise Korrekturparameter an.");
    setDiagnosis(result || "Analyse-Stream unterbrochen.");
    setIsAnalyzing(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter flex items-center gap-3">
             <ScanFace size={36} className="text-blue-500" /> Surface <span className="text-blue-500">Inspector</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1 italic">Detektion von Prozessfehlern mittels neuronaler Optik</p>
        </div>
        <div className="bg-blue-600/10 border border-blue-500/20 px-6 py-3 rounded-2xl">
           <span className="text-[10px] font-black uppercase text-blue-400 italic tracking-widest animate-pulse">Neural Core Active</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-6">
          <div 
            onClick={() => !isAnalyzing && fileInputRef.current?.click()}
            className={`glass aspect-video rounded-[56px] border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden relative group ${image ? 'border-blue-500/50' : 'border-white/10 hover:border-blue-500/30 cursor-pointer'}`}
          >
             {image ? (
               <>
                 <img src={image} className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-full border border-white/20">
                       <Upload className="text-white" size={32} />
                    </div>
                 </div>
                 {isAnalyzing && (
                    <div className="absolute inset-0 pointer-events-none">
                       <div className="w-full h-1 bg-blue-500 shadow-[0_0_20px_#3b82f6] absolute top-0 animate-[scan_3s_ease-in-out_infinite]" />
                    </div>
                 )}
               </>
             ) : (
               <div className="flex flex-col items-center gap-4">
                  <div className="p-8 bg-white/5 rounded-full text-slate-700 group-hover:text-blue-500 transition-colors">
                     <Camera size={64} />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black italic text-white uppercase tracking-tight">Image Feed upload</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Prüfe auf Geometrie-Abweichungen</p>
                  </div>
               </div>
             )}
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
          </div>

          <button 
            disabled={!image || isAnalyzing}
            onClick={startAnalysis}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-black py-5 rounded-[28px] transition-all shadow-xl uppercase italic tracking-tighter text-sm flex items-center justify-center gap-3"
          >
            {isAnalyzing ? <RefreshCw className="animate-spin" size={20} /> : <BrainCircuit size={20} />}
            {isAnalyzing ? 'Processing Frame...' : 'Start Inspection Scan'}
          </button>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6">
           <div className="glass rounded-[48px] p-10 border-white/5 bg-slate-900/40 flex-1 flex flex-col min-h-[400px]">
              <div className="flex items-center gap-3 mb-8">
                 <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><Info size={24} /></div>
                 <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic leading-none">Diagnostic Log</h3>
              </div>

              {!diagnosis && !isAnalyzing && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-30 italic">
                   <AlertCircle size={40} className="text-slate-600" />
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">System bereit für Datensatz</p>
                </div>
              )}

              {diagnosis && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-full">
                   <div className="bg-emerald-600/10 border border-emerald-500/20 rounded-3xl p-6 mb-6 flex items-start gap-4">
                      <CheckCircle2 size={24} className="text-emerald-500 flex-shrink-0" />
                      <div>
                         <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Scan abgeschlossen</p>
                         <p className="text-[11px] font-bold text-slate-300 mt-1 uppercase italic">Confidence Level: 98.4%</p>
                      </div>
                   </div>
                   
                   <div className="flex-1 bg-white/5 rounded-[32px] p-8 border border-white/5 overflow-y-auto scrollbar-hide">
                      <div className="text-slate-200 text-sm font-medium leading-relaxed italic whitespace-pre-wrap">
                         {diagnosis}
                      </div>
                   </div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default VisionLab;
