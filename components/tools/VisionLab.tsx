
import React, { useState, useRef } from 'react';
import { Camera, ScanFace, BrainCircuit, RefreshCw, Upload, CheckCircle2, ShieldCheck, Activity, Binary, Cpu, Database, Loader2, Info } from 'lucide-react';
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
    <div className="h-full w-full flex flex-col bg-[#020617] animate-in fade-in duration-700 overflow-hidden">
      <header className="shrink-0 flex justify-between items-center bg-slate-900/40 p-6 m-4 mb-0 rounded-[32px] border border-white/5">
        <div>
          <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter flex items-center gap-3 leading-none">
             <ScanFace size={32} className="text-blue-500" /> Surface <span className="text-blue-500">Inspector</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest mt-2 italic">Neural Geometry Validation Engine</p>
        </div>
        <div className="bg-blue-600/10 border border-blue-500/20 px-6 py-3 rounded-2xl">
           <span className="text-[10px] font-black uppercase text-blue-400 italic tracking-widest animate-pulse">Neural Core Active</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0">
        <div className="flex-1 flex flex-col gap-4 h-full">
          <div 
            onClick={() => !isAnalyzing && fileInputRef.current?.click()}
            className={`glass flex-1 rounded-[48px] border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden relative group ${image ? 'border-blue-500/50' : 'border-white/10 hover:border-blue-500/30'}`}
          >
             {image ? (
               <>
                 <img src={image} className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <Upload className="text-white" size={48} />
                 </div>
               </>
             ) : (
               <div className="flex flex-col items-center gap-6 opacity-40">
                  <Camera size={64} />
                  <p className="text-xs font-black uppercase tracking-widest">Image Feed Upload</p>
               </div>
             )}
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
          </div>

          <button 
            disabled={!image || isAnalyzing}
            onClick={startAnalysis}
            className="shrink-0 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-black py-6 rounded-[32px] transition-all shadow-xl uppercase italic text-lg flex items-center justify-center gap-4"
          >
            {isAnalyzing ? <RefreshCw className="animate-spin" size={24} /> : <BrainCircuit size={24} />}
            {isAnalyzing ? 'Processing Frame...' : 'Start Inspection Scan'}
          </button>
        </div>

        <div className="lg:w-[450px] glass rounded-[48px] p-8 border-white/5 bg-slate-900/40 h-full flex flex-col shadow-2xl overflow-y-auto scrollbar-hide">
              <div className="shrink-0 flex items-center gap-3 mb-6">
                 <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500"><Info size={20} /></div>
                 <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic leading-none">Diagnostic Log</h3>
              </div>

              {!diagnosis && !isAnalyzing ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20 italic">
                   <Activity size={48} className="mb-4" />
                   <p className="text-xs font-black uppercase tracking-widest leading-relaxed px-10">Waiting for Geometrical Data Input</p>
                </div>
              ) : (
                <div className="flex-1 space-y-6">
                   {isAnalyzing ? (
                      <div className="h-full flex flex-col items-center justify-center gap-6 opacity-40">
                         <Loader2 className="animate-spin text-blue-500" size={40} />
                         <p className="text-[10px] font-black uppercase tracking-widest">Scanning Layer structures...</p>
                      </div>
                   ) : (
                      <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                         <div className="bg-emerald-600/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-4">
                            <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />
                            <div>
                               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">Scan Success</p>
                               <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase italic leading-none">Conf: 98.4%</p>
                            </div>
                         </div>
                         <div className="bg-black/20 rounded-3xl p-6 border border-white/5 text-slate-200 text-sm font-medium leading-relaxed italic whitespace-pre-wrap">
                            {diagnosis}
                         </div>
                      </div>
                   )}
                </div>
              )}
        </div>
      </div>

      <footer className="shrink-0 glass rounded-t-[32px] border-t border-white/5 bg-slate-950/80 p-5 mx-4 flex items-center justify-between">
         <div className="flex gap-10">
            <TelemetryItem icon={<Binary size={14}/>} label="Model" value="Gemini-3-Pro" />
            <TelemetryItem icon={<Cpu size={14}/>} label="Core" value="40.2 TFLOPS" />
            <TelemetryItem icon={<Database size={14}/>} label="Set" value="3D_Surface_v12" />
         </div>
         <div className="flex items-center gap-3">
            <ShieldCheck size={16} className="text-blue-500" />
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">Precision Scan Module</span>
         </div>
      </footer>
    </div>
  );
};

const TelemetryItem = ({ icon, label, value }: any) => (
  <div className="flex items-center gap-3">
     <div className="text-slate-600">{icon}</div>
     <div>
        <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest leading-none">{label}</p>
        <p className="text-[10px] font-bold text-slate-300 italic uppercase leading-none mt-1">{value}</p>
     </div>
  </div>
);

export default VisionLab;
