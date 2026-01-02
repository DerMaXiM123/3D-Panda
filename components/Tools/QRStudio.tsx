
import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Download, Printer, Palette, Type, ShieldCheck, Box, RefreshCw, Zap, Info, ArrowRight } from 'lucide-react';
import { db } from '../../services/database';
import { Filament } from '../../types';

const QRStudio: React.FC = () => {
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [labelSize, setLabelSize] = useState<'small' | 'large'>('large');
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    db.getFilaments().then(setFilaments);
  }, []);

  const selectedFilament = filaments.find(f => f.id === selectedId);

  const generateLabel = () => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedFilament) return;
    setIsGenerating(true);

    const ctx = canvas.getContext('2d')!;
    const width = labelSize === 'large' ? 800 : 400;
    const height = labelSize === 'large' ? 400 : 250;
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, width - 10, height - 10);

    // Sidebar with Color
    ctx.fillStyle = selectedFilament.hex;
    ctx.fillRect(10, 10, labelSize === 'large' ? 100 : 50, height - 20);

    // Text content
    ctx.fillStyle = '#000000';
    ctx.font = `black italic ${labelSize === 'large' ? 48 : 24}px "Plus Jakarta Sans"`;
    ctx.fillText(selectedFilament.brand.toUpperCase(), labelSize === 'large' ? 140 : 80, labelSize === 'large' ? 80 : 50);
    
    ctx.font = `bold ${labelSize === 'large' ? 32 : 16}px "Plus Jakarta Sans"`;
    ctx.fillText(selectedFilament.color.toUpperCase(), labelSize === 'large' ? 140 : 80, labelSize === 'large' ? 130 : 80);
    
    ctx.font = `900 ${labelSize === 'large' ? 60 : 30}px monospace`;
    ctx.fillText(selectedFilament.material, labelSize === 'large' ? 140 : 80, labelSize === 'large' ? 200 : 120);

    // Detailed Info
    ctx.font = `bold ${labelSize === 'large' ? 24 : 12}px "Plus Jakarta Sans"`;
    ctx.fillText(`INITIAL: ${selectedFilament.weight}g`, labelSize === 'large' ? 140 : 80, labelSize === 'large' ? 260 : 160);
    ctx.fillText(`ID: ${selectedFilament.id}`, labelSize === 'large' ? 140 : 80, labelSize === 'large' ? 300 : 185);

    // Placeholder QR Code (In Real: Use a library like qrcode.react)
    const qrSize = labelSize === 'large' ? 200 : 100;
    ctx.fillStyle = '#000000';
    ctx.fillRect(width - qrSize - 40, (height - qrSize) / 2, qrSize, qrSize);
    
    // Aesthetic "Digital" patterns inside QR
    ctx.fillStyle = '#ffffff';
    for(let i=0; i<8; i++) {
        for(let j=0; j<8; j++) {
            if(Math.random() > 0.5) ctx.fillRect(width - qrSize - 40 + (i * qrSize/8), (height - qrSize) / 2 + (j * qrSize/8), qrSize/8, qrSize/8);
        }
    }
    // QR Markers
    ctx.strokeStyle = '#000000'; ctx.lineWidth = 10;
    ctx.strokeRect(width - qrSize - 35, (height - qrSize)/2 + 5, 40, 40);
    ctx.strokeRect(width - 75, (height - qrSize)/2 + 5, 40, 40);
    ctx.strokeRect(width - qrSize - 35, (height + qrSize)/2 - 45, 40, 40);

    setIsGenerating(false);
  };

  useEffect(() => {
    if (selectedId) generateLabel();
  }, [selectedId, labelSize]);

  const downloadLabel = () => {
    const link = document.createElement('a');
    link.download = `SPOOL_TAG_${selectedFilament?.color}.png`;
    link.href = canvasRef.current!.toDataURL();
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <div className="bg-emerald-600/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-2">
                <QrCode size={12} className="text-emerald-500" />
                <span className="text-[9px] font-black uppercase text-emerald-400 tracking-widest">Physical Asset Link</span>
             </div>
          </div>
          <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter flex items-center gap-4 leading-none">
             LABEL <span className="text-emerald-500">STUDIO</span>.
          </h1>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.4em] mt-3 italic opacity-60">Printable QR-Inventory Integration</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-8">
           <div className="glass rounded-[48px] p-10 space-y-10 border-white/5 bg-slate-900/40 shadow-2xl">
              <div className="space-y-6">
                 <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest italic flex items-center gap-3">
                    <Box size={18} className="text-emerald-500" /> Select Spool
                 </h3>
                 <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                    {filaments.map(f => (
                      <button 
                        key={f.id} 
                        onClick={() => setSelectedId(f.id)}
                        className={`flex items-center gap-4 p-5 rounded-3xl border transition-all ${selectedId === f.id ? 'bg-emerald-600/20 border-emerald-500 text-white' : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'}`}
                      >
                         <div className="w-10 h-10 rounded-xl shadow-inner border border-white/10" style={{ backgroundColor: f.hex }} />
                         <div className="text-left min-w-0">
                            <p className="text-[12px] font-black italic uppercase truncate">{f.color}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">{f.brand} • {f.material}</p>
                         </div>
                         <ArrowRight size={14} className={`ml-auto transition-transform ${selectedId === f.id ? 'translate-x-0' : '-translate-x-4 opacity-0'}`} />
                      </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-white/5">
                 <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest italic flex items-center gap-3">
                    <Printer size={18} className="text-emerald-500" /> Label Format
                 </h3>
                 <div className="flex gap-4">
                    <button onClick={() => setLabelSize('small')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase italic transition-all border ${labelSize === 'small' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white/5 border-white/10 text-slate-500'}`}>Small (40x25mm)</button>
                    <button onClick={() => setLabelSize('large')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase italic transition-all border ${labelSize === 'large' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white/5 border-white/10 text-slate-500'}`}>Large (80x40mm)</button>
                 </div>
              </div>
           </div>

           <div className="bg-emerald-600/5 p-8 rounded-[48px] border border-emerald-500/20 flex gap-6">
              <Zap size={24} className="text-emerald-500 flex-shrink-0" />
              <p className="text-[10px] text-emerald-200/60 font-bold uppercase leading-relaxed italic">
                Tipp: Drucke diese Etiketten auf deinem normalen Papier-Drucker (A4) und klebe sie mit transparentem Tape auf die Spule. Der QR-Code verknüpft die physische Realität mit deinem Nexus Cloud Sync.
              </p>
           </div>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-6">
           <div className="glass rounded-[56px] border-white/5 bg-slate-900/60 flex-1 flex flex-col items-center justify-center p-12 shadow-3xl min-h-[500px]">
              {selectedId ? (
                <div className="space-y-12 w-full max-w-lg flex flex-col items-center">
                   <div className="bg-white p-4 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-500">
                      <canvas ref={canvasRef} className="w-full h-auto rounded-xl" />
                   </div>
                   
                   <div className="flex gap-4 w-full">
                      <button 
                        onClick={downloadLabel}
                        className="flex-1 bg-white text-black hover:bg-emerald-600 hover:text-white py-5 rounded-[24px] font-black italic uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all shadow-xl"
                      >
                         <Download size={20} /> Label Speichern (PNG)
                      </button>
                      <button 
                        onClick={() => window.print()}
                        className="p-5 bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 rounded-[24px] hover:bg-emerald-600 hover:text-white transition-all"
                      >
                         <Printer size={20} />
                      </button>
                   </div>
                </div>
              ) : (
                <div className="text-center space-y-6 opacity-30 italic">
                   <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto border-dashed border-white/10">
                      <QrCode size={48} className="text-slate-700" />
                   </div>
                   <p className="text-xs font-black uppercase tracking-widest text-slate-500">Wähle eine Spule aus dem Inventar</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default QRStudio;
