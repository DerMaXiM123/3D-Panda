
import React, { useState, useEffect } from 'react';
/* Fix: Added missing 'Weight' icon to the lucide-react imports */
import { LayoutGrid, ListTodo, Plus, Trash2, CheckCircle2, Clock, AlertTriangle, Play, ChevronRight, Package, Calendar, BarChart2, Info, Weight } from 'lucide-react';
import { Project, ProjectPart, Filament, PrintStatus } from '../../types';
import { db } from '../../services/database';

const ProjectManager: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '',
    description: '',
    parts: [],
    filamentId: ''
  });

  useEffect(() => {
    db.getProjects().then(setProjects);
    db.getFilaments().then(setFilaments);
  }, []);

  const handleCreateProject = async () => {
    if (!newProject.name) return;
    const project: Project = {
      id: `p_${Date.now()}`,
      name: newProject.name,
      description: newProject.description || '',
      parts: [],
      filamentId: newProject.filamentId,
      createdAt: new Date().toLocaleDateString(),
      deadline: newProject.deadline
    };
    await db.updateProject(project);
    setProjects([project, ...projects]);
    setIsAddingProject(false);
    setNewProject({ name: '', description: '', parts: [], filamentId: '' });
  };

  const addPartToProject = async (projectId: string) => {
    const name = prompt('Name des Bauteils:');
    if (!name) return;
    const grams = parseInt(prompt('Gewicht in Gramm:') || '0');
    const hours = parseFloat(prompt('Druckdauer in Stunden:') || '0');

    const updatedProjects = projects.map(p => {
      if (p.id === projectId) {
        const newPart: ProjectPart = {
          id: `pt_${Date.now()}`,
          name,
          grams,
          hours,
          status: 'Planned'
        };
        return { ...p, parts: [...p.parts, newPart] };
      }
      return p;
    });

    setProjects(updatedProjects);
    const updated = updatedProjects.find(p => p.id === projectId);
    if (updated) await db.updateProject(updated);
  };

  const updatePartStatus = async (projectId: string, partId: string, status: PrintStatus) => {
    const updatedProjects = projects.map(p => {
      if (p.id === projectId) {
        const updatedParts = p.parts.map(pt => {
          if (pt.id === partId) return { ...pt, status };
          return pt;
        });
        return { ...p, parts: updatedParts };
      }
      return p;
    });

    setProjects(updatedProjects);
    const updated = updatedProjects.find(p => p.id === projectId);
    if (updated) await db.updateProject(updated);
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Projekt wirklich löschen?')) return;
    await db.deleteProject(id);
    setProjects(projects.filter(p => p.id !== id));
    if (selectedProjectId === id) setSelectedProjectId(null);
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">Project Master</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1 italic">Vernetze deine Produktion zu Meilensteinen</p>
        </div>
        <button 
          onClick={() => setIsAddingProject(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-[24px] font-black italic transition-all shadow-xl shadow-blue-900/20 uppercase tracking-widest flex items-center gap-3"
        >
          <Plus size={20} /> Neues Projekt
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar: Project List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass rounded-[40px] p-6 border-white/5 bg-slate-900/40">
            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-6 italic flex items-center gap-2">
               <LayoutGrid size={14} className="text-blue-500" /> Aktive Projekte
            </h3>
            <div className="space-y-3">
              {projects.length === 0 ? (
                <p className="text-[10px] font-bold text-slate-600 uppercase text-center py-10 italic">Keine Projekte angelegt</p>
              ) : projects.map(p => (
                <button 
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`w-full text-left p-5 rounded-3xl border transition-all flex items-center justify-between group ${selectedProjectId === p.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'}`}
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-black italic uppercase truncate">{p.name}</h4>
                    <p className={`text-[9px] font-bold uppercase mt-1 ${selectedProjectId === p.id ? 'text-blue-100' : 'text-slate-500'}`}>
                      {p.parts.filter(pt => pt.status === 'Done').length} / {p.parts.length} Teile fertig
                    </p>
                  </div>
                  <ChevronRight size={18} className={`transition-transform ${selectedProjectId === p.id ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                </button>
              ))}
            </div>
          </div>

          {projects.length > 0 && (
             <div className="glass rounded-[40px] p-8 border-white/5 bg-blue-600/5">
                <h4 className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-4 flex items-center gap-2">
                   <BarChart2 size={14} /> Gesamt-Statistik
                </h4>
                <div className="space-y-4">
                   <div className="flex justify-between items-end">
                      <span className="text-[9px] font-bold text-slate-500 uppercase">Gedruckte Teile</span>
                      <span className="text-lg font-black italic text-white">{projects.reduce((acc, p) => acc + p.parts.filter(pt => pt.status === 'Done').length, 0)}</span>
                   </div>
                   <div className="flex justify-between items-end">
                      <span className="text-[9px] font-bold text-slate-500 uppercase">Materialverbrauch</span>
                      <span className="text-lg font-black italic text-white">{(projects.reduce((acc, p) => acc + p.parts.reduce((pa, pt) => pa + (pt.status === 'Done' ? pt.grams : 0), 0), 0) / 1000).toFixed(2)}kg</span>
                   </div>
                </div>
             </div>
          )}
        </div>

        {/* Main: Project Details */}
        <div className="lg:col-span-8">
           {selectedProject ? (
             <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                <div className="glass rounded-[48px] p-10 border-white/5 bg-slate-900/40 relative overflow-hidden">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                      <div>
                         <div className="flex items-center gap-3 mb-2">
                           <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter">{selectedProject.name}</h2>
                           <button onClick={() => deleteProject(selectedProject.id)} className="p-2 text-slate-600 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
                         </div>
                         <p className="text-sm font-medium text-slate-400 italic max-w-xl">{selectedProject.description}</p>
                      </div>
                      <div className="flex flex-col items-end">
                         <div className="bg-blue-600 px-6 py-2 rounded-full text-[10px] font-black italic uppercase tracking-widest text-white shadow-xl">
                            {Math.round((selectedProject.parts.filter(p => p.status === 'Done').length / (selectedProject.parts.length || 1)) * 100)}% Fortschritt
                         </div>
                         <div className="mt-3 flex items-center gap-3 text-slate-500">
                            <Calendar size={14} />
                            <span className="text-[10px] font-bold uppercase">{selectedProject.deadline || 'Keine Deadline'}</span>
                         </div>
                      </div>
                   </div>
                   
                   <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                      <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex flex-col gap-2">
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Verbleibende Zeit</span>
                         <span className="text-2xl font-black italic text-white">{selectedProject.parts.filter(p => p.status !== 'Done' && p.status !== 'Failed').reduce((acc, p) => acc + p.hours, 0).toFixed(1)}h</span>
                      </div>
                      <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex flex-col gap-2">
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Geplantes Material</span>
                         <span className="text-2xl font-black italic text-white">{selectedProject.parts.reduce((acc, p) => acc + p.grams, 0)}g</span>
                      </div>
                      <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex flex-col gap-2">
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Fehlgeschlagen</span>
                         <span className="text-2xl font-black italic text-red-500">{selectedProject.parts.filter(p => p.status === 'Failed').length} Teile</span>
                      </div>
                   </div>

                   <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-center px-4">
                      <h3 className="text-xs font-black uppercase text-slate-500 tracking-[0.4em] italic flex items-center gap-3">
                         <ListTodo size={18} /> Bauteile-Liste
                      </h3>
                      <button 
                        onClick={() => addPartToProject(selectedProject.id)}
                        className="text-[10px] font-black text-blue-500 uppercase italic tracking-widest hover:text-white transition-colors flex items-center gap-2"
                      >
                         <Plus size={16} /> Teil hinzufügen
                      </button>
                   </div>

                   <div className="grid grid-cols-1 gap-4">
                      {selectedProject.parts.length === 0 ? (
                        <div className="glass rounded-[32px] py-12 flex flex-col items-center justify-center text-center border-dashed border-white/10 italic">
                           <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">Noch keine Bauteile in diesem Projekt</p>
                        </div>
                      ) : selectedProject.parts.map(part => (
                        <div key={part.id} className="glass rounded-3xl p-6 border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/10 transition-all">
                           <div className="flex items-center gap-6">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                part.status === 'Done' ? 'bg-green-600/20 text-green-500' :
                                part.status === 'Printing' ? 'bg-orange-600/20 text-orange-500' :
                                part.status === 'Failed' ? 'bg-red-600/20 text-red-500' :
                                'bg-white/5 text-slate-600'
                              }`}>
                                 {part.status === 'Done' ? <CheckCircle2 size={24} /> :
                                  part.status === 'Printing' ? <Play size={24} className="animate-pulse" /> :
                                  part.status === 'Failed' ? <AlertTriangle size={24} /> :
                                  <Clock size={24} />}
                              </div>
                              <div>
                                 <h4 className="text-lg font-black italic text-white uppercase tracking-tight">{part.name}</h4>
                                 <div className="flex items-center gap-4 mt-1">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase italic flex items-center gap-1.5"><Weight size={12} /> {part.grams}g</span>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase italic flex items-center gap-1.5"><Clock size={12} /> {part.hours}h</span>
                                 </div>
                              </div>
                           </div>

                           <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                              {[
                                { status: 'Planned', label: 'Plan' },
                                { status: 'Printing', label: 'Druck' },
                                { status: 'Done', label: 'OK' },
                                { status: 'Failed', label: 'Fail' }
                              ].map(s => (
                                <button 
                                  key={s.status}
                                  onClick={() => updatePartStatus(selectedProject.id, part.id, s.status as PrintStatus)}
                                  className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase italic transition-all ${part.status === s.status ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-white'}`}
                                >
                                  {s.label}
                                </button>
                              ))}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
           ) : (
             <div className="h-full glass rounded-[56px] flex flex-col items-center justify-center text-center p-20 border-dashed border-white/10">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 text-slate-800">
                   <Package size={48} />
                </div>
                <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter mb-4">Wähle ein Projekt</h2>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em] max-sm leading-relaxed italic">
                  Oder erstelle ein neues Großvorhaben, um Material und Zeit effizient zu planen.
                </p>
             </div>
           )}
        </div>
      </div>

      {isAddingProject && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-[#0f172a] border border-white/10 w-full max-w-xl rounded-[48px] p-10 animate-in zoom-in-95 duration-300">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white mb-8">Neues Großprojekt</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Projekt-Name</label>
                <input 
                  placeholder="z.B. RC-Auto Chassis V2" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-blue-500" 
                  value={newProject.name}
                  onChange={e => setNewProject({...newProject, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Beschreibung</label>
                <textarea 
                  placeholder="Ziele, Slicer-Profile, Besonderheiten..." 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm font-medium italic outline-none focus:border-blue-500 h-24 resize-none"
                  value={newProject.description}
                  onChange={e => setNewProject({...newProject, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Deadline (Opt.)</label>
                    <input type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-blue-500" value={newProject.deadline} onChange={e => setNewProject({...newProject, deadline: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Filament</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-slate-100 outline-none focus:border-blue-500 appearance-none" value={newProject.filamentId} onChange={e => setNewProject({...newProject, filamentId: e.target.value})}>
                       <option value="">Keine Auswahl</option>
                       {filaments.map(f => <option key={f.id} value={f.id}>{f.color} ({f.material})</option>)}
                    </select>
                 </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsAddingProject(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black py-5 rounded-[24px] transition-all uppercase italic tracking-tighter text-sm">Abbrechen</button>
                <button onClick={handleCreateProject} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[24px] transition-all shadow-xl uppercase italic tracking-tighter text-sm">Anlegen</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;
