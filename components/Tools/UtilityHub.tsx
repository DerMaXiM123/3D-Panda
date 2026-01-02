
import React, { useState, useEffect } from 'react';
import { Calculator, ClipboardList, Zap, Euro, Clock, Weight, Wrench, CheckCircle2, Trash2, Plus, AlertTriangle, Hammer, BadgeDollarSign, Store, TrendingUp, HandCoins } from 'lucide-react';
import { db } from '../../services/database';
import { Filament, MaintenanceTask } from '../../types';

const UtilityHub: React.FC = () => {
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [activeTab, setActiveTab] = useState<'calculator' | 'maintenance'>('calculator');

  // Calculator State
  const [calcMaterialGrams, setCalcMaterialGrams] = useState<number>(50);
  const [calcHours, setCalcHours] = useState<number>(4);
  const [calcPowerWatt, setCalcPowerWatt] = useState<number>(150);
  const [calcPowerPrice, setCalcPowerPrice] = useState<number>(0.35);
  const [selectedFilamentId, setSelectedFilamentId] = useState<string>('');

  // Commercial / Sales State
  const [isCommercialMode, setIsCommercialMode] = useState<boolean>(false);
  const [profitMargin, setProfitMargin] = useState<number>(20);
  const [laborHours, setLaborHours] = useState<number>(0.5);
  const [hourlyRate, setHourlyRate] = useState<number>(25);
  const [additionalFees, setAdditionalFees] = useState<number>(2.00); // Verpackung/Versand/Gebühren

  // Maintenance State
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState<Partial<MaintenanceTask>>({
    type: 'Nozzle',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    db.getFilaments().then(setFilaments);
    db.getMaintenanceTasks().then(setTasks);
  }, []);

  const selectedFilament = filaments.find(f => f.id === selectedFilamentId);
  const materialCost = selectedFilament ? (selectedFilament.price! * (calcMaterialGrams / selectedFilament.weight)) : 0;
  const powerCost = (calcPowerWatt / 1000) * calcHours * calcPowerPrice;
  const baseProductionCost = materialCost + powerCost;
  
  // Commercial Calculations
  const laborCost = laborHours * hourlyRate;
  const totalInternalCost = baseProductionCost + laborCost + additionalFees;
  const profitAmount = totalInternalCost * (profitMargin / 100);
  const finalSellingPrice = totalInternalCost + profitAmount;

  const handleAddTask = async () => {
    if (!newTask.description) return;
    const task = await db.addMaintenanceTask(newTask as Omit<MaintenanceTask, 'id'>);
    setTasks([task, ...tasks]);
    setIsAddingTask(false);
    setNewTask({ type: 'Nozzle', description: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleDeleteTask = async (id: string) => {
    await db.deleteMaintenanceTask(id);
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">Pro Utility Hub</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1 italic">Präzisions-Tools für deine Werkstatt</p>
        </div>
        <div className="flex bg-white/5 p-1.5 rounded-[24px] border border-white/5">
           <button 
            onClick={() => setActiveTab('calculator')}
            className={`px-8 py-3 rounded-[18px] text-xs font-black uppercase italic transition-all flex items-center gap-3 ${activeTab === 'calculator' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}
           >
             <Calculator size={18} /> Kosten-Rechner
           </button>
           <button 
            onClick={() => setActiveTab('maintenance')}
            className={`px-8 py-3 rounded-[18px] text-xs font-black uppercase italic transition-all flex items-center gap-3 ${activeTab === 'maintenance' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}
           >
             <ClipboardList size={18} /> Wartungstagebuch
           </button>
        </div>
      </header>

      {activeTab === 'calculator' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-7 space-y-6">
              <div className="glass rounded-[48px] p-10 space-y-10 border-white/5 bg-slate-900/40">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-[0.3em] italic">Eingabe-Parameter</h3>
                  <button 
                    onClick={() => setIsCommercialMode(!isCommercialMode)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase italic transition-all ${isCommercialMode ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white/5 text-slate-500'}`}
                  >
                    <Store size={14} /> {isCommercialMode ? 'Sales Modus: AN' : 'Sales Modus: AUS'}
                  </button>
                </div>
                
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-4 tracking-widest">Druckmaterial wählen</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       {filaments.length === 0 ? (
                         <div className="col-span-2 p-6 bg-white/5 rounded-3xl border border-dashed border-white/10 text-center text-[10px] font-bold text-slate-600 uppercase">Keine Filamente im Lager</div>
                       ) : filaments.map(f => (
                         <button 
                          key={f.id} 
                          onClick={() => setSelectedFilamentId(f.id)}
                          className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${selectedFilamentId === f.id ? 'bg-blue-600/20 border-blue-500' : 'bg-white/5 border-transparent hover:border-white/10'}`}
                         >
                            <div className="w-8 h-8 rounded-lg shadow-inner" style={{ backgroundColor: f.hex }} />
                            <div className="text-left">
                               <p className="text-[11px] font-black text-white italic truncate leading-none">{f.color}</p>
                               <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">{f.brand} • {f.material}</p>
                            </div>
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex justify-between px-2">
                        <label className="text-[10px] font-black uppercase text-slate-500">Material (g)</label>
                        <span className="text-blue-500 font-black italic">{calcMaterialGrams}g</span>
                      </div>
                      <input type="range" min="1" max="1000" value={calcMaterialGrams} onChange={e => setCalcMaterialGrams(parseInt(e.target.value))} className="modern-slider" />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between px-2">
                        <label className="text-[10px] font-black uppercase text-slate-500">Druckdauer (h)</label>
                        <span className="text-blue-500 font-black italic">{calcHours}h</span>
                      </div>
                      <input type="range" min="0.5" max="100" step="0.5" value={calcHours} onChange={e => setCalcHours(parseFloat(e.target.value))} className="modern-slider" />
                    </div>
                  </div>

                  {isCommercialMode && (
                    <div className="p-8 bg-emerald-600/5 border border-emerald-500/20 rounded-[32px] space-y-8 animate-in slide-in-from-top-4 duration-300">
                      <h4 className="text-[10px] font-black uppercase text-emerald-500 tracking-widest flex items-center gap-2">
                        <BadgeDollarSign size={16} /> Sales und Profit Kalkulation
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div className="flex justify-between px-2">
                            <label className="text-[10px] font-black uppercase text-slate-500">Gewinnmarge (%)</label>
                            <span className="text-emerald-500 font-black italic">{profitMargin}%</span>
                          </div>
                          <input type="range" min="0" max="500" step="5" value={profitMargin} onChange={e => setProfitMargin(parseInt(e.target.value))} className="modern-slider" />
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between px-2">
                            <label className="text-[10px] font-black uppercase text-slate-500">Arbeitszeit (h)</label>
                            <span className="text-emerald-500 font-black italic">{laborHours}h</span>
                          </div>
                          <input type="range" min="0" max="10" step="0.25" value={laborHours} onChange={e => setLaborHours(parseFloat(e.target.value))} className="modern-slider" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Stundensatz (€/h)</label>
                          <div className="relative">
                             <HandCoins size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" />
                             <input type="number" value={hourlyRate} onChange={e => setHourlyRate(parseInt(e.target.value))} className="w-full bg-black/20 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:border-emerald-500 outline-none" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Pauschale (Versand/Gebühr)</label>
                          <div className="relative">
                             <Euro size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" />
                             <input type="number" step="0.10" value={additionalFees} onChange={e => setAdditionalFees(parseFloat(e.target.value))} className="w-full bg-black/20 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:border-emerald-500 outline-none" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Energieverbrauch (Watt)</label>
                      <div className="relative">
                         <Zap size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" />
                         <input type="number" value={calcPowerWatt} onChange={e => setCalcPowerWatt(parseInt(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:border-blue-500 outline-none" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Strompreis (€/kWh)</label>
                      <div className="relative">
                         <Euro size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" />
                         <input type="number" step="0.01" value={calcPowerPrice} onChange={e => setCalcPowerPrice(parseFloat(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:border-blue-500 outline-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
           </div>

           <div className="lg:col-span-5 flex flex-col gap-6">
              <div className={`glass rounded-[48px] p-10 border-blue-500/20 ${isCommercialMode ? 'bg-emerald-600/5 border-emerald-500/20' : 'bg-blue-600/5'} shadow-2xl flex-1 flex flex-col justify-between transition-colors duration-500`}>
                 <div className="space-y-8">
                    <h3 className={`text-xs font-black uppercase tracking-[0.3em] italic ${isCommercialMode ? 'text-emerald-400' : 'text-blue-400'}`}>
                      {isCommercialMode ? 'Retail und Profit Analyse' : 'Produktions-Kosten'}
                    </h3>
                    
                    <div className="space-y-4">
                       <CostItem icon={<Weight size={20} className="text-blue-500" />} label="Materialkosten" value={`${materialCost.toFixed(2)} €`} detail={`${calcMaterialGrams}g ${selectedFilament?.material || ''}`} />
                       <CostItem icon={<Zap size={20} className="text-yellow-500" />} label="Energiekosten" value={`${powerCost.toFixed(2)} €`} detail={`${calcHours}h bei ${calcPowerWatt}W`} />
                       
                       {isCommercialMode && (
                         <div className="space-y-4 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-right-4 duration-500">
                           <CostItem icon={<Clock size={20} className="text-emerald-500" />} label="Arbeitsaufwand" value={`${laborCost.toFixed(2)} €`} detail={`${laborHours}h à ${hourlyRate}€`} />
                           <CostItem icon={<Euro size={20} className="text-purple-500" />} label="Gebühren/Sonstiges" value={`${additionalFees.toFixed(2)} €`} detail="Pauschal" />
                           <CostItem icon={<TrendingUp size={20} className="text-orange-500" />} label="Gewinn (Profit)" value={`${profitAmount.toFixed(2)} €`} detail={`${profitMargin}% Marge`} />
                         </div>
                       )}

                       <div className="h-px bg-white/5 mt-4" />
                       
                       <div className="flex items-center justify-between pt-6">
                          <div>
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                               {isCommercialMode ? 'Empfohlener Verkaufspreis (UVP)' : 'Gesamtkosten Pro Druck'}
                             </p>
                             <h2 className={`text-5xl font-black italic tracking-tighter mt-1 transition-colors ${isCommercialMode ? 'text-emerald-400' : 'text-white'}`}>
                               {(isCommercialMode ? finalSellingPrice : baseProductionCost).toFixed(2)} <span className={isCommercialMode ? 'text-emerald-500' : 'text-blue-500'}>€</span>
                             </h2>
                          </div>
                          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl transition-all ${isCommercialMode ? 'bg-emerald-600 shadow-emerald-900/40' : 'bg-blue-600 shadow-blue-900/40'}`}>
                             {isCommercialMode ? <Store size={32} className="text-white" /> : <Euro size={32} className="text-white" />}
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className={`mt-8 p-6 rounded-3xl border border-white/5 italic ${isCommercialMode ? 'bg-emerald-600/10' : 'bg-white/5'}`}>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase">
                      {isCommercialMode 
                        ? `Pro-Tipp: Bei einem Verkaufspreis von ${finalSellingPrice.toFixed(2)}€ machst du ${profitAmount.toFixed(2)}€ Reingewinn nach Abzug aller Kosten und deiner eigenen Arbeitszeit.`
                        : "Pro-Tipp: Senke die Kosten durch optimierte Infill-Muster (Gyroid) und kürzere Druckzeiten. Der größte Kostenfaktor ist oft das Material."}
                    </p>
                 </div>
              </div>
           </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
          <div className="flex justify-between items-center px-4">
             <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] italic">Wartungs-Historie</h2>
             <button 
              onClick={() => setIsAddingTask(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase italic tracking-widest shadow-lg shadow-blue-900/20"
             >
               Eintrag hinzufügen
             </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
             {tasks.length === 0 ? (
               <div className="glass rounded-[48px] py-20 flex flex-col items-center justify-center text-center border-dashed border-white/10">
                  <Wrench size={48} className="text-slate-800 mb-4" />
                  <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Keine Wartungsereignisse dokumentiert</p>
               </div>
             ) : (
               tasks.map(task => (
                 <div key={task.id} className="glass rounded-[32px] p-8 border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/10 transition-all bg-slate-900/20">
                    <div className="flex items-center gap-6">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                         task.type === 'Nozzle' ? 'bg-orange-600/20 text-orange-500' :
                         task.type === 'Leveling' ? 'bg-blue-600/20 text-blue-500' :
                         task.type === 'Lube' ? 'bg-green-600/20 text-green-500' :
                         'bg-purple-600/20 text-purple-500'
                       }`}>
                          {task.type === 'Nozzle' ? <Hammer size={24} /> : 
                           task.type === 'Leveling' ? <CheckCircle2 size={24} /> :
                           task.type === 'Lube' ? <Zap size={24} /> : <Wrench size={24} />}
                       </div>
                       <div>
                          <div className="flex items-center gap-3">
                             <h4 className="text-lg font-black italic text-white uppercase tracking-tight">{task.type} Wartung</h4>
                             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">{task.date}</span>
                          </div>
                          <p className="text-slate-400 text-sm font-medium mt-1 italic">{task.description}</p>
                       </div>
                    </div>
                    <button onClick={() => handleDeleteTask(task.id)} className="p-4 bg-white/5 hover:bg-red-500/10 text-slate-600 hover:text-red-500 rounded-2xl transition-all">
                       <Trash2 size={20} />
                    </button>
                 </div>
               ))
             )}
          </div>
        </div>
      )}

      {isAddingTask && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-[#0f172a] border border-white/10 w-full max-w-xl rounded-[48px] p-10 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">Wartungsprotokoll</h2>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1 italic">Ereignis dokumentieren</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Kategorie</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                   {['Nozzle', 'Leveling', 'Lube', 'Belt'].map(t => (
                     <button 
                      key={t}
                      onClick={() => setNewTask({...newTask, type: t as any})}
                      className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all ${newTask.type === t ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                     >
                        {t}
                     </button>
                   ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Datum</label>
                <input type="date" value={newTask.date} onChange={e => setNewTask({...newTask, date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Beschreibung / Details</label>
                <textarea 
                  placeholder="z.B. Düse auf 0.6mm gewechselt, Kalibrierung durchgeführt..." 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm font-medium italic outline-none focus:border-blue-500 h-32 resize-none"
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsAddingTask(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black py-5 rounded-[24px] transition-all uppercase italic tracking-tighter text-sm">Abbrechen</button>
                <button onClick={handleAddTask} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[24px] transition-all shadow-xl shadow-blue-900/20 uppercase italic tracking-tighter text-sm">Protokollieren</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CostItem = ({ icon, label, value, detail }: any) => (
  <div className="flex items-center gap-5 p-4 bg-white/5 rounded-3xl border border-white/5">
    <div className="p-3 bg-white/5 rounded-xl">{icon}</div>
    <div className="flex-1">
       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">{label}</p>
       <p className="text-lg font-black italic text-white mt-1">{value}</p>
    </div>
    <div className="text-right">
       <p className="text-[9px] font-bold text-slate-600 uppercase italic tracking-tighter">{detail}</p>
    </div>
  </div>
);

export default UtilityHub;
