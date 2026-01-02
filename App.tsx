
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { 
  Layers, MessageSquare, Package, LayoutDashboard, BrickWall, Image as ImageIcon, 
  Menu, X, Scissors, Globe, Settings as SettingsIcon, Wrench, FolderKanban, 
  ScanFace, Gift, Cpu, Droplets, Server, Ruler, Gauge, BookOpen, Maximize, 
  Scale, ChevronLeft, ChevronRight, HardDrive, Zap, Binary, Box, Flower2, Cog, Type, Fingerprint, Archive, Mountain, FileCode, Share2, Radio, Users, Microscope, LogOut, Activity, ArrowLeft, QrCode, Maximize2, ListTodo, Loader2
} from 'lucide-react';
import { AppView, User, Friend } from './types';
import Dashboard from './components/Dashboard';
import AuthGate from './components/Auth/AuthGate';
import { db } from './services/database';

// Lazy loaded creators - Fixed imports to use lowercase 'creators' directory to resolve casing ambiguity errors
const BrickCreator = lazy(() => import('./components/creators/BrickCreator'));
const LithophaneCreator = lazy(() => import('./components/creators/LithophaneCreator'));
const VaseCreator = lazy(() => import('./components/creators/VaseCreator'));
const GearCreator = lazy(() => import('./components/creators/GearCreator'));
const SignCreator = lazy(() => import('./components/creators/SignCreator'));
const VoronoiLab = lazy(() => import('./components/creators/VoronoiLab'));
const ScrewArchitect = lazy(() => import('./components/creators/ScrewArchitect'));
const LithoSphere = lazy(() => import('./components/creators/LithoSphere'));
const TerrainLab = lazy(() => import('./components/creators/TerrainLab'));
const ContainerForge = lazy(() => import('./components/creators/ContainerForge'));
const CalibrationCube = lazy(() => import('./components/creators/CalibrationCube'));

// Lazy loaded modules
const FilamentInventory = lazy(() => import('./components/Inventory/FilamentInventory'));
const CommunityHub = lazy(() => import('./components/CommunityHub'));
const AIChat = lazy(() => import('./components/AIChat'));
const PrivateChat = lazy(() => import('./components/PrivateChat'));
const SlicerTool = lazy(() => import('./components/SlicerTool'));
const FriendsHub = lazy(() => import('./components/FriendsHub'));
const Settings = lazy(() => import('./components/Settings'));
const LiveWorkshop = lazy(() => import('./components/LiveWorkshop'));

// Lazy loaded tools
const FleetManager = lazy(() => import('./components/Tools/FleetManager'));
const VisionLab = lazy(() => import('./components/Tools/VisionLab'));
const STLInspector = lazy(() => import('./components/Tools/STLInspector'));
const SyncCenter = lazy(() => import('./components/Tools/SyncCenter'));
const ARBedPlacement = lazy(() => import('./components/Tools/ARBedPlacement'));
const PrintQueue = lazy(() => import('./components/Tools/PrintQueue'));
const GCodeAnalyst = lazy(() => import('./components/Tools/GCodeAnalyst'));
const SpoolMath = lazy(() => import('./components/Tools/SpoolMath'));
const FlowRateCalc = lazy(() => import('./components/Tools/FlowRateCalc'));
const ResinLab = lazy(() => import('./components/Tools/ResinLab'));
const ModelScout = lazy(() => import('./components/Tools/ModelScout'));

const LoadingView = () => (
  <div className="flex h-full w-full items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 italic">Terminal Module Loading...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [activeFriend, setActiveFriend] = useState<Friend | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await db.getCurrentUser();
        if (user) setCurrentUser(user);
      } catch (err) {
        console.error("Database initialization failed:", err);
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, []);

  const handleLogout = async () => {
    if (confirm('Verbindung zum Terminal trennen?')) {
      await db.logout();
      setCurrentUser(null);
      setCurrentView(AppView.DASHBOARD);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#020617] text-blue-500">
        <div className="flex flex-col items-center gap-4">
          <div className="text-6xl animate-pulse">🐼</div>
          <div className="text-[10px] font-black uppercase tracking-[0.4em] italic">Nexus Booting...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) return <AuthGate onAuth={setCurrentUser} />;

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD: return <Dashboard onViewChange={setCurrentView} user={currentUser} />;
      case AppView.CREATOR_BRICK: return <BrickCreator />;
      case AppView.CREATOR_LITHOPHANE: return <LithophaneCreator />;
      case AppView.CREATOR_VASE: return <VaseCreator />;
      case AppView.CREATOR_GEAR: return <GearCreator />;
      case AppView.CREATOR_SIGN: return <SignCreator />;
      case AppView.CREATOR_VORONOI: return <VoronoiLab />;
      case AppView.CREATOR_SCREW: return <ScrewArchitect />;
      case AppView.CREATOR_LITHO_SPHERE: return <LithoSphere />;
      case AppView.CREATOR_TERRAIN: return <TerrainLab />;
      case AppView.CREATOR_FORGE: return <ContainerForge />;
      case AppView.CREATOR_CUBE: return <CalibrationCube />;
      case AppView.INVENTORY: return <FilamentInventory />;
      case AppView.COMMUNITY: return <CommunityHub user={currentUser} />;
      case AppView.FRIENDS: return <FriendsHub onChatWithFriend={(f) => { setActiveFriend(f); setCurrentView(AppView.PRIVATE_CHAT); }} />;
      case AppView.CHAT: return <AIChat user={currentUser} />;
      case AppView.PRIVATE_CHAT: return activeFriend ? <PrivateChat currentUser={currentUser} targetFriend={activeFriend} onBack={() => setCurrentView(AppView.FRIENDS)} /> : null;
      case AppView.SLICER_TOOL: return <SlicerTool onFinish={() => setCurrentView(AppView.INVENTORY)} />;
      case AppView.SETTINGS: return <Settings user={currentUser} onUserUpdate={setCurrentUser} />;
      case AppView.LIVE_WORKSHOP: return <LiveWorkshop user={currentUser} />;
      case AppView.FLEET_MANAGER: return <FleetManager />;
      case AppView.VISION_LAB: return <VisionLab />;
      case AppView.STL_VIEWER: return <STLInspector />;
      case AppView.SYNC_CENTER: return <SyncCenter />;
      case AppView.AR_BED_PLACEMENT: return <ARBedPlacement />;
      case AppView.PRINT_QUEUE: return <PrintQueue />;
      case AppView.GCODE_ANALYST: return <GCodeAnalyst />;
      case AppView.SPOOL_MATH: return <SpoolMath />;
      case AppView.FLOW_CALC: return <FlowRateCalc />;
      case AppView.RESIN_LAB: return <ResinLab />;
      case AppView.MODEL_SCOUT: return <ModelScout />;
      default: return <Dashboard onViewChange={setCurrentView} user={currentUser} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className={`${isSidebarOpen ? 'w-80' : 'w-24'} flex flex-col glass border-r border-white/5 transition-all duration-500 z-50 group/sidebar`}>
        <div className="p-8 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 overflow-hidden">
              <div 
                onClick={() => setCurrentView(AppView.DASHBOARD)}
                className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(255,255,255,0.2)] flex-shrink-0 relative overflow-hidden group cursor-pointer active:scale-95 transition-transform"
              >
                <div className="text-2xl">🐼</div>
              </div>
              {isSidebarOpen && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                  <p className="font-black text-xl tracking-tighter italic uppercase leading-none text-white">NEXUS <span className="text-blue-500">CORE</span></p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    <p className="text-[8px] font-black text-emerald-500 tracking-[0.2em] uppercase">SYSTEM: ONLINE</p>
                  </div>
                </div>
              )}
            </div>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all transform"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 space-y-2 scrollbar-hide pb-10">
          <NavItem icon={<LayoutDashboard size={20}/>} label="Home Console" active={currentView === AppView.DASHBOARD} onClick={() => setCurrentView(AppView.DASHBOARD)} open={isSidebarOpen} />
          
          <div className="h-px bg-white/5 my-4" />
          
          <p className={`text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 px-3 ${!isSidebarOpen && 'hidden'}`}>Fabricators</p>
          <NavItem icon={<Box size={20}/>} label="Brick Studio" active={currentView === AppView.CREATOR_BRICK} onClick={() => setCurrentView(AppView.CREATOR_BRICK)} open={isSidebarOpen} />
          <NavItem icon={<Flower2 size={20}/>} label="Vase Lab" active={currentView === AppView.CREATOR_VASE} onClick={() => setCurrentView(AppView.CREATOR_VASE)} open={isSidebarOpen} />
          <NavItem icon={<HardDrive size={20}/>} label="Gears & Parts" active={currentView === AppView.CREATOR_GEAR} onClick={() => setCurrentView(AppView.CREATOR_GEAR)} open={isSidebarOpen} />
          
          <div className="h-px bg-white/5 my-4" />
          
          <p className={`text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 px-3 ${!isSidebarOpen && 'hidden'}`}>Logistics</p>
          <NavItem icon={<Package size={20}/>} label="Inventory" active={currentView === AppView.INVENTORY} onClick={() => setCurrentView(AppView.INVENTORY)} open={isSidebarOpen} />
          <NavItem icon={<Activity size={20}/>} label="Fleet Manager" active={currentView === AppView.FLEET_MANAGER} onClick={() => setCurrentView(AppView.FLEET_MANAGER)} open={isSidebarOpen} />
          
          <div className="h-px bg-white/5 my-4" />
          
          <p className={`text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 px-3 ${!isSidebarOpen && 'hidden'}`}>Logic Unit</p>
          <NavItem icon={<MessageSquare size={20}/>} label="AI Architect" active={currentView === AppView.CHAT} onClick={() => setCurrentView(AppView.CHAT)} open={isSidebarOpen} />
          <NavItem icon={<Globe size={20}/>} label="Maker Mesh" active={currentView === AppView.COMMUNITY} onClick={() => setCurrentView(AppView.COMMUNITY)} open={isSidebarOpen} />

          <div className="h-px bg-white/5 my-4" />
          
          <NavItem icon={<SettingsIcon size={20}/>} label="Configuration" active={currentView === AppView.SETTINGS} onClick={() => setCurrentView(AppView.SETTINGS)} open={isSidebarOpen} />
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-500 transition-all">
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-bold text-sm uppercase tracking-widest italic">Terminate</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-[#020617] relative">
        <div className="scanline" />
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 glass z-40">
           <div className="flex items-center gap-4">
              <div className="text-[10px] font-black uppercase text-slate-500 tracking-[0.5em] italic">
                {currentView === AppView.DASHBOARD ? 'Station Operator' : `Module // ${currentView.replace('CREATOR_', '')}`}
              </div>
           </div>
           <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                 <p className="text-[10px] font-black text-white italic leading-none">{currentUser.username}</p>
                 <p className="text-[8px] font-bold text-blue-500 uppercase tracking-tighter mt-1">Status: Active Node</p>
              </div>
              <img src={currentUser.avatar} alt="Avatar" className="w-10 h-10 rounded-xl border border-white/10 shadow-xl" />
           </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
           <Suspense fallback={<LoadingView />}>
              {renderView()}
           </Suspense>
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick, open }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group relative ${active ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'}`}
  >
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</div>
    {open && <span className="font-black text-xs uppercase tracking-widest italic">{label}</span>}
    {active && <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
  </button>
);

export default App;
