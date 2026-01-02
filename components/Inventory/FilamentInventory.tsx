
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Trash2, Scale, X, Package, Euro, Tags, ChevronRight, Droplets, Zap, Monitor, RefreshCw, Edit3, Palette, Save } from 'lucide-react';
import { Filament, FilamentStatus } from '../../types';
import { db } from '../../services/database';

const FilamentInventory: React.FC = () => {
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const initialFormState: Partial<Filament> = {
    brand: '', material: 'PLA', color: '', hex: '#3b82f6', weight: 1000, remaining: 1000, price: 24.99, status: 'Inventory'
  };
  const [formData, setFormData] = useState<Partial<Filament>>(initialFormState);

  useEffect(() => {
    loadFilaments();
  }, []);

  const loadFilaments = async () => {
    const data = await db.getFilaments();
    setFilaments(data);
  };

  const stats = useMemo(() => {
    const totalWeight = filaments.reduce((acc, f) => acc + f.remaining, 0);
    const totalValue = filaments.reduce((acc, f) => {
      const val = (f.price || 0) * (f.remaining / f.weight);
      return acc + val;
    }, 0);
    return { totalWeight, totalValue };
  }, [filaments]);

  const groupedFilaments = useMemo(() => {
    const filtered = filaments.filter(f => 
      f.brand.toLowerCase().includes(searchTerm.toLowerCase()) || 
      f.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.material.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const groups: Record<string, Record<string, Filament[]>> = {};
    filtered.forEach(f => {
      if (!groups[f.brand]) groups[f.brand] = {};
      if (!groups[f.brand][f.material]) groups[f.brand][f.material] = [];
      groups[f.brand][f.material].push(f);
    });
    return groups;
  }, [filaments, searchTerm]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (f: Filament) => {
    setEditingId(f.id);
    setFormData(f);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.brand || !formData.color) return;
    
    const filament: Filament = {
      ...initialFormState,
      ...formData,
      id: editingId || Date.now().toString(),
    } as Filament;

    await db.updateFilament(filament);
    await loadFilaments();
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Diese Filamentrolle wirklich aus dem Lager entfernen?')) return;
    await db.deleteFilament(id);
    await loadFilaments();
  };

  const cycleStatus = async (id: string) => {
    const f = filaments.find(x => x.id === id);
    if (!f) return;
    const statuses: FilamentStatus[] = ['Inventory', 'InPrinter', 'Drying', 'Empty'];
    const currentIndex = statuses.indexOf(f.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    
    const updated = { ...f, status: nextStatus };
    await db.updateFilament(updated);
    await loadFilaments();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="bg-blue-600 p-4 rounded-3xl shadow-xl shadow-blue-900/20">
             <Package size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase">Pro-Inventory</h1>
            <p className="text-slate-500 mt-1 font-bold text-[10px] uppercase tracking-widest">Systematisches Filament-Management (V10 SYNC)</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="glass px-6 py-3 rounded-2xl border-white/5 flex items-center gap-4">
             <div className="p-2 bg-blue-500/10 rounded-lg"><Scale size={18} className="text-blue-400" /></div>
             <div>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Gesamtgewicht</p>
                <p className="text-sm font-black italic">{(stats.totalWeight / 1000).toFixed(2)} kg</p>
             </div>
          </div>
          <div className="glass px-6 py-3 rounded-2xl border-white/5 flex items-center gap-4">
             <div className="p-2 bg-emerald-500/10 rounded-lg"><Euro size={18} className="text-emerald-400" /></div>
             <div>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Lagerwert</p>
                <p className="text-sm font-black italic">{stats.totalValue.toFixed(2)} €</p>
             </div>
          </div>
          <button 
            onClick={handleOpenAdd}
            className="bg-blue-600 text-white hover:bg-blue-500 px-8 py-3 rounded-2xl font-black text-xs transition-all shadow-xl uppercase italic tracking-widest"
          >
            + Neue Rolle
          </button>
        </div>
      </header>

      <div className="glass p-2 rounded-3xl border-white/5 flex items-center gap-4 max-w-md">
        <div className="pl-4 text-slate-500"><Search size={18} /></div>
        <input 
          type="text" 
          placeholder="Suche nach Marke, Material oder Farbe..." 
          className="flex-1 bg-transparent border-none outline-none py-2 text-sm font-medium italic"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-12">
        {Object.entries(groupedFilaments).length === 0 ? (
           <div className="text-center py-20 opacity-20 italic">
              <Package size={64} className="mx-auto mb-4" />
              <p className="text-sm font-black uppercase tracking-widest">Kein Filament im System gefunden</p>
           </div>
        ) : Object.entries(groupedFilaments).map(([brand, materials]) => (
          <section key={brand} className="space-y-6">
            <div className="flex items-center gap-4 border-b border-white/5 pb-4">
              <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">{brand}</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Object.values(materials).flat().map(f => (
                <div key={f.id} className={`bg-slate-900/40 border rounded-[32px] p-6 space-y-5 transition-all group relative overflow-hidden ${f.status === 'InPrinter' ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'border-white/5 hover:border-white/20'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl shadow-inner relative border border-white/10 overflow-hidden" style={{ backgroundColor: f.hex }}>
                         <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
                      </div>
                      <div>
                        <h3 className="font-black text-sm text-white italic truncate leading-none">{f.color}</h3>
                        <div className="flex items-center gap-2 mt-1.5">
                           <span className="text-[9px] text-blue-400 font-black uppercase">{f.material}</span>
                           {f.status === 'InPrinter' && <Zap size={10} className="text-yellow-500 animate-pulse" />}
                           {f.status === 'Drying' && <Droplets size={10} className="text-blue-500" />}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleOpenEdit(f)} className="p-2 rounded-xl bg-white/5 text-slate-500 hover:text-white transition-all">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => cycleStatus(f.id)} className={`p-2 rounded-xl transition-all ${f.status === 'InPrinter' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-500 hover:text-white'}`}>
                        <Monitor size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-[9px] font-black uppercase italic">
                       <span className={f.remaining < 200 ? 'text-red-500' : 'text-slate-500'}>{f.remaining}g / {f.weight}g</span>
                       <span className="text-slate-600">{f.status}</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                       <div 
                        className={`h-full rounded-full transition-all duration-1000 ${f.remaining < 200 ? 'bg-red-500' : 'bg-blue-600'}`}
                        style={{ width: `${(f.remaining / f.weight) * 100}%` }}
                       />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                      <div className="flex-1 bg-white/5 py-2 rounded-xl text-[8px] font-black uppercase text-center border border-white/5 text-slate-500 italic">
                         ID: {f.id.slice(-4)}
                      </div>
                      <button 
                        onClick={() => handleDelete(f.id)}
                        className="p-2 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all"
                      >
                         <Trash2 size={14} />
                      </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-[#0f172a] border border-white/10 w-full max-w-2xl rounded-[48px] p-10 animate-in zoom-in-95 overflow-y-auto max-h-[90vh] scrollbar-hide">
             <div className="flex justify-between items-center mb-10">
                <div>
                   <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">
                      {editingId ? 'Rolle Bearbeiten' : 'Neue Spule'}
                   </h2>
                   <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1 italic">
                      Datenbank-Synchronisation V10.2
                   </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white"><X size={28}/></button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Marke / Hersteller</label>
                      <input placeholder="z.B. Bambu Lab" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-blue-500" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Farbe (Bezeichnung)</label>
                      <input placeholder="z.B. Navy Blue" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-blue-500" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Vorschau-Farbe (Hex)</label>
                      <div className="flex gap-4">
                         <input type="color" className="w-20 h-14 bg-white/5 border border-white/10 rounded-2xl p-2 cursor-pointer" value={formData.hex} onChange={e => setFormData({...formData, hex: e.target.value})} />
                         <input className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-mono text-white outline-none" value={formData.hex} onChange={e => setFormData({...formData, hex: e.target.value})} />
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Material</label>
                         <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-sm font-black italic uppercase text-white outline-none focus:border-blue-500" value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})}>
                            <option>PLA</option><option>PETG</option><option>ABS</option><option>ASA</option><option>TPU</option><option>Nylon</option><option>PC</option>
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Preis (€)</label>
                         <input type="number" step="0.01" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-blue-500" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Netto-Gewicht (g)</label>
                         <input type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-blue-500" value={formData.weight} onChange={e => setFormData({...formData, weight: parseInt(e.target.value), remaining: editingId ? formData.remaining : parseInt(e.target.value)})} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Restbestand (g)</label>
                         <input type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-blue-500" value={formData.remaining} onChange={e => setFormData({...formData, remaining: parseInt(e.target.value)})} />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 ml-4">System Status</label>
                      <div className="grid grid-cols-2 gap-2">
                         {(['Inventory', 'InPrinter', 'Drying', 'Empty'] as FilamentStatus[]).map(s => (
                           <button 
                            key={s} 
                            onClick={() => setFormData({...formData, status: s})}
                            className={`py-3 rounded-xl text-[8px] font-black uppercase italic transition-all ${formData.status === s ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                           >
                              {s}
                           </button>
                         ))}
                      </div>
                   </div>
                </div>
             </div>

             <div className="mt-12 flex gap-4 pt-8 border-t border-white/5">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black py-5 rounded-[24px] transition-all uppercase italic tracking-tighter text-sm">Abbrechen</button>
                <button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[24px] transition-all shadow-xl shadow-blue-900/20 uppercase italic tracking-tighter text-sm flex items-center justify-center gap-3">
                   <Save size={20} /> {editingId ? 'Update Sichern' : 'Im Lager Speichern'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilamentInventory;
