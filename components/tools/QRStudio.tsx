import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Download, Activity, Database, Hash, Ruler, Info, ChevronRight, Maximize2, ShieldCheck, Cpu, Binary, Layers, History, Terminal as TerminalIcon, BarChart3, Radio } from 'lucide-react';
import { db } from '../../services/database';
import { Filament } from '../../types';
import QRCode from 'qrcode';

const QRStudio: React.FC = () => {
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSpecs, setShowSpecs] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    db.getFilaments().then(setFilaments);
  }, []);

  const selectedFilament = filaments.find(f => f.id === selectedId);

  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    return ctx;
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  const generateLabel = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedFilament) return;
    setIsGenerating(true);

    try {
      const ctx = canvas.getContext('2d', { alpha: false })!;
      const dpr = 4; 
      const width = 800;
      const height = 450;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#f8fafc';
      for(let i=0; i<width; i+=40) { ctx.fillRect(i, 0, 1, height); }
      for(let i=0; i<height; i+=40) { ctx.fillRect(0, i, width, 1); }

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      roundRect(ctx, 10, 10, width - 20, height - 20, 30).stroke();

      ctx.fillStyle = '#0f172a';
      roundRect(ctx, 20, 20, width - 40, 70, 20).fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 18px "Plus Jakarta Sans"';
      ctx.letterSpacing = "6px";
      ctx.fillText('NEXUS ASSET LOGISTICS // V7.0', 50, 62);

      ctx.fillStyle = selectedFilament.hex;
      roundRect(ctx, width - 140, 35, 90, 40, 12).fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      roundRect(ctx, width - 140, 35, 90, 40, 12).stroke();

      const contentLeft = 45;
      const qrAreaWidth = 240;
      const dividerX = width - qrAreaWidth - 20;
      const textMaxWidth = dividerX - contentLeft - 40;

      ctx.fillStyle = '#0f172a';
      ctx.font = '900 140px "Plus Jakarta Sans"';
      ctx.letterSpacing = "-6px";
      ctx.fillText(selectedFilament.material.toUpperCase(), contentLeft - 5, 210);

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(dividerX, 120);
      ctx.lineTo(dividerX, height - 130);
      ctx.stroke();

      let fontSize = 52;
      ctx.fillStyle = '#475569';
      ctx.letterSpacing = "-1px";
      
      const colorText = selectedFilament.color.toUpperCase();
      let lines: string[] = [];
      
      const fitText = () => {
        ctx.font = `800 ${fontSize}px "Plus Jakarta Sans"`;
        lines = wrapText(ctx, colorText, textMaxWidth);
        if (lines.length > 2 && fontSize > 24) {
          fontSize -= 2;
          fitText();
        }
      };
      fitText();

      lines.forEach((line, i) => {
        if (i < 2) {
          ctx.fillText(line, contentLeft, 270 + (i * (fontSize + 8)));
        }
      });

      const qrSize = 180;
      const qrDataUrl = await QRCode.toDataURL(selectedFilament.id, {
        margin: 0,
        width: qrSize * dpr,
        color: { dark: '#0f172a', light: '#ffffff' }
      });

      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      await new Promise((resolve) => {
        qrImg.onload = () => {
          ctx.drawImage(qrImg, width - qrAreaWidth + 30, 130, qrSize, qrSize);
          resolve(null);
        };
      });

      const podY = 350;
      const podH = 75;
      
      ctx.fillStyle = '#f1f5f9';
      roundRect(ctx, 45, podY, 200, podH, 15).fill();
      ctx.fillStyle = '#64748b';
      ctx.font = '900 9px "JetBrains Mono"';
      ctx.fillText('BRAND_VENDOR', 60, podY + 25);
      ctx.fillStyle = '#0f172a';
      ctx.font = '800 18px "Plus Jakarta Sans"';
      ctx.fillText(selectedFilament.brand.toUpperCase(), 60, podY + 55);

      ctx.fillStyle = '#f1f5f9';
      roundRect(ctx, 260, podY, 160, podH, 15).fill();
      ctx.fillStyle = '#64748b';
      ctx.font = '900 9px "JetBrains Mono"';
      ctx.fillText('UNIT_VALUE', 275, podY + 25);
      ctx.fillStyle = '#0f172a';
      ctx.font = '800 18px "Plus Jakarta Sans"';
      const priceStr = selectedFilament.price ? `${selectedFilament.price.toFixed(2)} EUR` : 'N/A';
      ctx.fillText(priceStr, 275, podY + 55);

      ctx.fillStyle = '#0f172a';
      roundRect(ctx, 435, podY, width - 435 - 45, podH, 15).fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '900 9px "JetBrains Mono"';
      ctx.fillText('NODE_HASH_IDENTIFIER', 450, podY + 25);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 14px "JetBrains Mono"';
      ctx.fillText(selectedFilament.id.substring(0, 20).toUpperCase(), 450, podY + 55);

    } catch (err) {
      console.error('Label Forge Failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (selectedId) generateLabel();
  }, [selectedId]);

  return (
    <div className="h-full w-full flex flex-col p-6 gap-6 animate-in fade-in duration-700 overflow-hidden relative">
      <div className="scanline opacity-[0.03]" />
      
      <header className="shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter leading-none">
             TAG <span className="text-blue-500">FORGE</span>.
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.7em] mt-2 italic opacity-60 ml-1">Asset Node // V7.0</p>
        </div>
      </header>

      <div className="flex-1 flex flex-col gap-6 min-h-0 relative z-10">
        <section className="flex-[4] grid lg:grid-cols-12 gap-6 min-h-0">
          <div className="lg:col-span-4 glass rounded-[40px] p-8 border-white/5 bg-[#0f172a]/40 flex flex-col shadow-xl overflow-hidden h-full">
             <div className="shrink-0 mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                      <Database size={20} />
                   </div>
                   <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">Registry</p>
                </div>
                <span className="bg-white/5 px-3 py-1 rounded-full text-[8px] font-mono text-slate-500 border border-white/5">{filaments.length} UNITS</span>
             </div>
             
             <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                {filaments.map(f => (
                  <button 
                    key={f.id} 
                    onClick={() => setSelectedId(f.id)}
                    className={`w-full flex items-center gap-5 p-5 rounded-[28px] border transition-all group ${selectedId === f.id ? 'bg-blue-600 border-blue-500 text-white shadow-lg scale-[1.02]' : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'}`}
                  >
                     <div className="w-14 h-14 rounded-[18px] shadow-lg border border-white/10 flex-shrink-0 relative overflow-hidden" style={{ backgroundColor: f.hex }}>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                     </div>
                     <div className="text-left min-w-0 flex-1">
                        <p className="text-base font-black italic uppercase truncate leading-none">{f.color}</p>
                        <p className={`text-[9px] font-bold uppercase mt-2 tracking-tighter ${selectedId === f.id ? 'text-blue-100' : 'text-slate-500'}`}>{f.material} // {f.brand}</p>
                     </div>
                     <ChevronRight size={20} className={`transition-transform duration-300 ${selectedId === f.id ? 'translate-x-1 opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                  </button>
                ))}
             </div>
          </div>

          <div className="lg:col-span-8 glass rounded-[48px] border-white/5 bg-[#020617]/60 flex flex-col items-center justify-center p-8 lg:p-12 shadow-2xl relative overflow-hidden h-full border-t border-l border-white/10">
             {selectedId ? (
               <div className="w-full h-full flex flex-col items-center justify-center gap-12 animate-in zoom-in-95 duration-700 relative z-10">
                  <div className="bg-white p-1 rounded-[32px] shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden w-full max-w-3xl transform hover:scale-[1.01] transition-transform duration-500">
                     <canvas ref={canvasRef} className="w-full h-auto rounded-[31px]" />
                  </div>
                  
                  <div className="flex gap-6">
                    <button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.download = `FORGE_TAG_${selectedFilament?.color.replace(/\s+/g, '_')}.png`;
                        link.href = canvasRef.current?.toDataURL('image/png') || '';
                        link.click();
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white py-6 px-16 rounded-[28px] font-black italic uppercase tracking-widest text-sm flex items-center justify-center gap-5 transition-all shadow-xl group"
                    >
                       <Download size={24} className="group-hover:translate-y-1 transition-transform" /> 
                       DOWNLOAD TAG
                    </button>
                    <button onClick={() => setShowSpecs(!showSpecs)} className={`p-6 rounded-[28px] border transition-all ${showSpecs ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10'}`}>
                       <Maximize2 size={30} />
                    </button>
                  </div>
               </div>
             ) : (
               <div className="text-center opacity-10 italic">
                  <QrCode size={100} className="mx-auto mb-8" />
                  <p className="text-base font-black uppercase tracking-[0.5em]">Standby for Input</p>
               </div>
             )}
          </div>
        </section>

        <section className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0 mb-2 h-full min-h-[160px]">
           <TelemetryCard icon={<Cpu size={28} />} label="Core Engine" value="Active" sub="V7.2 OPTIMIZED" />
           <TelemetryCard icon={<ShieldCheck size={28} />} label="Integrity" value="100%" sub="ECC_SECURE" />
           <TelemetryCard icon={<BarChart3 size={28} />} label="Node Load" value="Minimal" sub="V7.2_CORE" />
           
           <div className="glass rounded-[32px] p-8 bg-slate-900/40 border-white/5 flex flex-col justify-center shadow-lg font-mono overflow-hidden relative group border-t border-white/10">
              <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest italic mb-2 flex items-center gap-2 leading-none">
                 <Radio size={12} className="animate-pulse" /> Live Uplink
              </p>
              <div className="text-[11px] text-slate-400 font-bold uppercase truncate italic">
                 {selectedId ? `STREAM_NODE_${selectedId.substring(0,10)}...` : 'SYS_IDLE: STANDBY'}
              </div>
              <div className="text-[9px] text-slate-600 font-mono mt-3 flex justify-between">
                 <span>TX: 1.2 GB/S</span>
                 <span>RX: 0.8 GB/S</span>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};

const TelemetryCard = ({ icon, label, value, sub }: any) => (
  <div className="glass rounded-[32px] p-8 bg-slate-900/40 border-white/5 flex items-center gap-6 shadow-lg hover:bg-slate-900/60 transition-colors">
    <div className="w-16 h-16 bg-blue-600/10 rounded-[24px] flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-inner">
       {icon}
    </div>
    <div>
       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">{label}</p>
       <p className="text-2xl font-black text-white italic uppercase mt-0.5">{value}</p>
       <p className="text-[8px] font-mono text-blue-400 mt-1 uppercase opacity-60 tracking-tighter">{sub}</p>
    </div>
  </div>
);

export default QRStudio;
