
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { 
  LayoutDashboard, Box, Flower2, QrCode, ScanFace, Activity, 
  Settings as SettingsIcon, LogOut, Loader2, Menu, X,
  Database, Microscope, Binary, Cpu, Clock, ShieldCheck, User as UserIcon,
  Ruler, Gauge, FileCode, Beaker, Briefcase
} from 'lucide-react';
import { AppView, User } from './types';
import Dashboard from './components/Dashboard';
import AuthGate from './components/Auth/AuthGate';
import { db } from './services/database';

// Lazy loaded components with standard casing
// Fix: Use uppercase 'Creators' for component imports to resolve casing mismatch errors with already included files
const BrickCreator = lazy(() => import('./components/Creators/BrickCreator'));
const VaseCreator = lazy(() => import('./components/Creators/VaseCreator'));
const CalibrationCube = lazy(() => import('./components/Creators/CalibrationCube'));
const FilamentInventory = lazy(() => import('./components/Inventory/FilamentInventory'));
const AIChat = lazy(() => import('./components/AIChat'));
const VisionLab = lazy(() => import('./components/Tools/VisionLab'));
const GCodeAnalyst = lazy(() => import('./components/Tools/GCodeAnalyst'));
const STLInspector = lazy(() => import('./components/Tools/STLInspector'));
const QRStudio = lazy(() => import('./components/Tools/QRStudio'));
const ProjectManager = lazy(() => import('./components/Projects/ProjectManager'));
const ResinLab = lazy(() => import('./components/Tools/ResinLab'));
const Settings = lazy(() => import('./components/Settings'));

const LoadingView = () => (
  <div className="flex h-full w-full items-center justify-center bg-[#020617]">
    <div className="flex flex-col items-center gap-4 text-blue-500">
      <Loader2 className="w-12 h-12 animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.5em] italic animate-pulse">Syncing Nexus Core...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    db.getCurrentUser().then(user => {
      if (user) setCurrentUser(user);
      setIsInitializing(false);
    });
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (isInitializing) return <div className="h-screen w-full bg-[#020617] flex items-center justify-center text-4xl animate-pulse">🐼</div>;
  if (!currentUser) return <AuthGate onAuth={setCurrentUser} />;

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD: return <Dashboard onViewChange={setCurrentView} user={currentUser} />;
      case AppView.CREATOR_BRICK: return <BrickCreator />;
      case AppView.CREATOR_VASE: return <VaseCreator />;
      case AppView.CREATOR_CUBE: return <CalibrationCube />;
      case AppView.INVENTORY: return <FilamentInventory />;
      case AppView.CHAT: return <AIChat user={currentUser} />;
      case AppView.VISION_LAB: return <VisionLab />;
      case AppView.GCODE_ANALYST: return <GCodeAnalyst />;
      case AppView.STL_VIEWER: return <STLInspector />;
      case AppView.QR_STUDIO: return <QRStudio />;
      case AppView.PROJECT_MANAGER: return <ProjectManager />;
      case AppView.RESIN_LAB: return <ResinLab />;
      case AppView.SETTINGS: return <Settings user={currentUser} onUserUpdate={setCurrentUser} />;
      default: return <Dashboard onViewChange={setCurrentView} user={currentUser} />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#020617] text-slate-100 overflow-hidden font-sans select-none relative">
      <div className="scanline" />
      
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-24'} h-full flex flex-col glass border-r border-white/5 transition-all duration-300 z-50 shrink-0`}>
        <div className="p-6 mb-4 flex items-center justify-between shrink-0">
          {isSidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-lg">🐼</div>
              <p className="font-black text-lg tracking-tighter italic uppercase text-white leading-none">NEXUS <span className="text-blue-500">ENG</span></p>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 transition-colors mx-auto">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-1.5 scrollbar-hide">
          <NavItem icon={<LayoutDashboard size={20}/>} label="Command" active={currentView === AppView.DASHBOARD} onClick={() => setCurrentView(AppView.DASHBOARD)} open={isSidebarOpen} />
          
          <div className={`mt-6 mb-2 px-4 ${!isSidebarOpen && 'hidden'}`}>
             <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">Core Logistics</p>
          </div>
          <NavItem icon={<Database size={20}/>} label="Lager" active={currentView === AppView.INVENTORY} onClick={() => setCurrentView(AppView.INVENTORY)} open={isSidebarOpen} />
          <NavItem icon={<Briefcase size={20}/>} label="Projekte" active={currentView === AppView.PROJECT_MANAGER} onClick={() => setCurrentView(AppView.PROJECT_MANAGER)} open={isSidebarOpen} />
          
          <div className={`mt-6 mb-2 px-4 ${!isSidebarOpen && 'hidden'}`}>
             <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">Creators</p>
          </div>
          <NavItem icon={<Box size={20}/>} label="Brick Lab" active={currentView === AppView.CREATOR_BRICK} onClick={() => setCurrentView(AppView.CREATOR_BRICK)} open={isSidebarOpen} />
          <NavItem icon={<Flower2 size={20}/>} label="Vase Lab" active={currentView === AppView.CREATOR_VASE} onClick={() => setCurrentView(AppView.CREATOR_VASE)} open={isSidebarOpen} />
          <NavItem icon={<Binary size={20}/>} label="Cali-Cube" active={currentView === AppView.CREATOR_CUBE} onClick={() => setCurrentView(AppView.CREATOR_CUBE)} open={isSidebarOpen} />
          
          <div className={`mt-6 mb-2 px-4 ${!isSidebarOpen && 'hidden'}`}>
             <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">Engineering Tools</p>
          </div>
          <NavItem icon={<FileCode size={20}/>} label="Analyst" active={currentView === AppView.GCODE_ANALYST} onClick={() => setCurrentView(AppView.GCODE_ANALYST)} open={isSidebarOpen} />
          <NavItem icon={<Microscope size={20}/>} label="STL Viewer" active={currentView === AppView.STL_VIEWER} onClick={() => setCurrentView(AppView.STL_VIEWER)} open={isSidebarOpen} />
          <NavItem icon={<Beaker size={20}/>} label="Resin Lab" active={currentView === AppView.RESIN_LAB} onClick={() => setCurrentView(AppView.RESIN_LAB)} open={isSidebarOpen} />
          <NavItem icon={<ScanFace size={20}/>} label="Surface AI" active={currentView === AppView.VISION_LAB} onClick={() => setCurrentView(AppView.VISION_LAB)} open={isSidebarOpen} />
          <NavItem icon={<QrCode size={20}/>} label="Label Studio" active={currentView === AppView.QR_STUDIO} onClick={() => setCurrentView(AppView.QR_STUDIO)} open={isSidebarOpen} />
        </div>
        
        <div className="p-4 mt-auto border-t border-white/5 space-y-1 shrink-0">
           <NavItem icon={<SettingsIcon size={20}/>} label="System Config" active={currentView === AppView.SETTINGS} onClick={() => setCurrentView(AppView.SETTINGS)} open={isSidebarOpen} />
           <button onClick={() => db.logout().then(() => window.location.reload())} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-500 transition-all">
              <LogOut size={20} />
              {isSidebarOpen && <span className="font-black text-[10px] uppercase tracking-widest italic">Terminate</span>}
           </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col bg-[#020617] h-screen relative overflow-hidden">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 glass shrink-0">
           <div className="text-[9px] font-black uppercase text-slate-500 tracking-[0.5em] italic truncate">SYSTEM_NODE // {currentView}</div>
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-6">
                 <div className="flex flex-col items-end">
                    <p className="text-[10px] font-black italic uppercase text-white leading-none">{currentUser.username}</p>
                    <p className="text-[8px] font-bold text-blue-500 uppercase tracking-widest mt-1 opacity-60">Operator Prime</p>
                 </div>
                 <img src={currentUser.avatar} className="w-8 h-8 rounded-lg border border-white/10 shadow-lg" alt="Avatar" />
              </div>
           </div>
        </header>
        
        <div className="flex-1 min-h-0 relative overflow-hidden">
           <Suspense fallback={<LoadingView />}>
              {renderView()}
           </Suspense>
        </div>

        <footer className="h-8 bg-slate-950 border-t border-white/5 px-6 flex items-center justify-between shrink-0 glass z-50">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-blue-500/50">
                 <Cpu size={10} />
                 <span className="text-[7px] font-black uppercase tracking-widest italic">Core: Active</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-500/50">
                 <ShieldCheck size={10} />
                 <span className="text-[7px] font-black uppercase tracking-widest italic">Kernel V12.0</span>
              </div>
           </div>
           <div className="flex items-center gap-4 text-blue-400">
              <Clock size={10} />
              <span className="text-[9px] font-mono font-bold tracking-widest">{time}</span>
           </div>
        </footer>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick, open }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all relative ${active ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}>
    {icon}
    {open && <span className="font-black text-[10px] uppercase tracking-widest italic leading-none">{label}</span>}
    {active && <div className="absolute right-3 w-1 h-1 bg-white rounded-full animate-pulse" />}
  </button>
);

export default App;
