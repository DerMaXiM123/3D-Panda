
import React, { useState } from 'react';
/* Added ChevronRight to the lucide-react imports */
import { Search, Globe, Image as ImageIcon, Sparkles, ExternalLink, Box, Download, RefreshCw, Layers, Terminal, ChevronRight } from 'lucide-react';
import { geminiService } from '../../services/geminiService';

const ModelScout: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<{text: string, chunks: any[]}>({text: '', chunks: []});
  const [conceptImg, setConceptImg] = useState<string | null>(null);

  const handleScout = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setConceptImg(null);
    const data = await geminiService.scoutModels(query);
    setResults({ 
      text: data.text || "Keine Informationen gefunden.", 
      chunks: data.chunks || [] 
    });
    setIsSearching(false);
  };

  const handleGenImage = async () => {
    if (!query.trim()) return;
    setIsGenerating(true);
    const img = await geminiService.generateConcept(query);
    setConceptImg(img);
    setIsGenerating(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter flex items-center gap-3">
             <Globe size={36} className="text-blue-500" /> Nexus Scout <span className="text-blue-500">AI</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1 italic">Web-Grounding & Concept Generation Engine</p>
        </div>
      </header>

      <div className="glass p-3 rounded-[32px] border-white/5 flex items-center gap-4 bg-slate-900/60 shadow-2xl focus-within:border-blue-500/50 transition-all">
        <div className="pl-6 text-blue-500"><Search size={24} /></div>
        <input 
          type="text" 
          placeholder="Was möchtest du heute drucken?" 
          className="flex-1 bg-transparent border-none outline-none py-4 text-lg font-black italic uppercase placeholder:text-slate-700"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleScout()}
        />
        <button 
          onClick={handleScout}
          disabled={isSearching}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black italic transition-all flex items-center gap-3 disabled:opacity-50"
        >
          {isSearching ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} />}
          SCOUTEN
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
           <div className="glass rounded-[48px] p-10 border-white/5 bg-slate-900/40 min-h-[500px] flex flex-col">
              {isSearching ? (
                 <div className="flex-1 flex flex-col items-center justify-center space-y-6 opacity-50">
                    <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase text-white italic tracking-widest">Panda sucht...</p>
                 </div>
              ) : results.text ? (
                <div className="space-y-8">
                   <p className="text-slate-300 text-sm font-medium leading-relaxed italic whitespace-pre-wrap">{results.text}</p>
                   
                   {/* Render grounding chunks as Web URLs as per Search Grounding requirements */}
                   {results.chunks && results.chunks.length > 0 && (
                      <div className="pt-6 border-t border-white/5 space-y-4">
                         <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2 italic">
                            <ExternalLink size={14} /> Web-Referenzen & Quellen
                         </h4>
                         <div className="flex flex-wrap gap-2">
                            {results.chunks.map((chunk: any, i: number) => (
                               chunk.web && (
                                  <a 
                                    key={i} 
                                    href={chunk.web.uri} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] text-slate-400 hover:text-white hover:border-blue-500/40 transition-all group"
                                  >
                                     <span className="truncate max-w-[200px] font-bold italic">{chunk.web.title || chunk.web.uri}</span>
                                     <ChevronRight size={10} className="group-hover:translate-x-1 transition-transform" />
                                  </a>
                               )
                            ))}
                         </div>
                      </div>
                   )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center opacity-20 italic space-y-4">
                   <Globe size={64} className="text-slate-700" />
                   <p className="text-[10px] font-black uppercase tracking-widest">Warte auf Operator Input...</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ModelScout;
