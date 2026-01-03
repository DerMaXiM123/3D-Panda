
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Trash2, Scale, X, Package, Euro, Edit3, Monitor, Save, Database, Activity, ShieldCheck, Cpu, Zap } from 'lucide-react';
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
    const filament: Filament = { ...initialFormState, ...formData, id: editingId || Date.now().toString() } as Filament;
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
    <div className="h-full w-full flex flex-col p-8 gap-8 animate-in fade-in duration-500 overflow-hidden">
      <header className="shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="bg-blue-600 p-4 rounded-3xl shadow-xl shadow-blue-900/20">
             <Database size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">Material <span className="text-blue-500">Inventory</span></h1>
            <p className="text-slate-500 mt-2 font-bold text-[10px] uppercase tracking-widest italic opacity-60">Systematic Logistics Core V10.5</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="glass px-6 py-3 rounded-2xl border-white/5 flex items-center gap-4">
             <div className="p-2 bg-blue-500/10 rounded-lg"><Euro size={18} className="text-blue-400" /></div>
             <div>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Stock Value</p>
                <p className="text-sm font-black italic">{stats.totalValue.toFixed(2)} €</p>
             </div>
          </div>
          <button onClick={handleOpenAdd} className="bg-blue-600 text-white hover:bg-blue-500 px-8 py-3 rounded-2xl font-black text-xs transition-all shadow-xl uppercase italic tracking-widest">+ Add Material</button>
        </div>
      </header>

      <div className="flex-1 flex flex-col min-h-0 gap-6">
         <div className="shrink-0 glass p-2 rounded-3xl border-white/5 flex items-center gap-4 max-w-md bg-slate-900/40 shadow-inner">
            <div className="pl-4 text-slate-500"><Search size={18} /></div>
            <input type="text" placeholder="Search parameters..." className="flex-1 bg-transparent border-none outline-none py-2 text-sm font-medium italic text-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
         </div>

         <div className="flex-1 overflow-y-auto pr-2 space-y-12 scrollbar-hide">
            {Object.entries(groupedFilaments).map(([brand, materials]) => (
               <section key={brand} className="space-y-6 animate-in slide-in-from-left-4 duration-500">
                  <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                    <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">{brand}</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Object.values(materials).flat().map(f => (
                      <div key={f.id} className={`glass rounded-[32px] p-6 space-y-5 transition-all group relative overflow-hidden bg-slate-900/40 border-white/5 hover:border-blue-500/30 ${f.status === 'InPrinter' ? 'border-blue-500/50 shadow-2xl shadow-blue-900/20' : ''}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl shadow-2xl relative border-2 border-white/10" style={{ backgroundColor: f.hex }} />
                            <div>
                              <h3 className="font-black text-sm text-white italic truncate leading-none">{f.color}</h3>
                              <div className="flex items-center gap-2 mt-1.5">
                                 <span className="text-[9px] text-blue-400 font-black uppercase tracking-widest">{f.material}</span>
                                 <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">• {f.price?.toFixed(2)}€</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => handleOpenEdit(f)} className="p-2 rounded-xl bg-white/5 text-slate-500 hover:text-white transition-all"><Edit3 size={14} /></button>
                            <button onClick={() => cycleStatus(f.id)} className={`p-2 rounded-xl transition-all ${f.status === 'InPrinter' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-500 hover:text-white'}`}><Monitor size={14} /></button>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between text-[9px] font-black uppercase italic">
                             <span className={f.remaining < 200 ? 'text-red-500' : 'text-slate-500'}>{f.remaining}g / {f.weight}g</span>
                             <span className="text-slate-600">{f.status}</span>
                          </div>
                          <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                             <div className={`h-full rounded-full transition-all duration-1000 ${f.remaining < 200 ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${(f.remaining / f.weight) * 100}%` }} />
                          </div>
                        </div>
                        <button onClick={() => handleDelete(f.id)} className="absolute bottom-4 right-4 p-2 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
               </section>
            ))}
         </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="bg-[#0f172a] border border-white/10 w-full max-w-2xl rounded-[48px] p-12 animate-in zoom-in-95 duration-300 shadow-2xl">
             <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
                <div>
                   <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white leading-none">{editingId ? 'Edit' : 'Add'} Spool</h2>
                   <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-2 italic">Node Update Protocol v10.5</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all"><X size={24}/></button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-500 ml-4 tracking-widest">Brand</label>
                      <input className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-blue-500 transition-all" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-500 ml-4 tracking-widest">Color Name</label>
                      <input className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-blue-500 transition-all" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase text-slate-500 ml-4 tracking-widest">Price (€)</label>
                         <input type="number" step="0.01" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-blue-500 transition-all" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase text-slate-500 ml-4 tracking-widest">Weight (g)</label>
                         <input type="number" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white" value={formData.weight} onChange={e => setFormData({...formData, weight: parseInt(e.target.value), remaining: editingId ? formData.remaining : parseInt(e.target.value)})} />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-500 ml-4 tracking-widest">Color Accent (Hex)</label>
                      <input type="color" className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl p-2 cursor-pointer" value={formData.hex} onChange={e => setFormData({...formData, hex: e.target.value})} />
                   </div>
                </div>
             </div>

             <div className="mt-12 flex gap-4">
                <button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-[32px] transition-all shadow-xl shadow-blue-900/30 uppercase italic tracking-tighter text-lg flex items-center justify-center gap-3">
                   <Save size={24} /> {editingId ? 'Update Data' : 'Store Spool'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilamentInventory;
