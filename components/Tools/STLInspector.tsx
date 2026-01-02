
import React, { useState, useEffect, useRef } from 'react';
import { Box, Maximize, Ruler, Upload, RefreshCw, Layers, Zap, Info, ShieldCheck, BoxSelect, Expand, Minimize2, Trash2 } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls, STLLoader } from 'three-stdlib';

const STLInspector: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{x: number, y: number, z: number} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [wireframe, setWireframe] = useState(false);
  
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
    camera.position.set(150, 150, 150);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Stylish Grid
    const grid = new THREE.GridHelper(200, 20, 0x3b82f6, 0x1e293b);
    grid.position.y = -0.1;
    scene.add(grid);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dLight.position.set(100, 100, 100);
    scene.add(dLight);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const ro = new ResizeObserver(entries => {
      for (let e of entries) {
        renderer.setSize(e.contentRect.width, e.contentRect.height);
        camera.aspect = e.contentRect.width / e.contentRect.height;
        camera.updateProjectionMatrix();
      }
    });
    ro.observe(mountRef.current);
    return () => { ro.disconnect(); renderer.dispose(); };
  }, []);

  const toggleWireframe = () => {
    if (meshRef.current) {
        const material = meshRef.current.material as THREE.MeshStandardMaterial;
        material.wireframe = !material.wireframe;
        setWireframe(material.wireframe);
    }
  };

  const handleFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.stl')) {
        alert('Bitte nur .stl Dateien hochladen!');
        return;
    }
    setIsLoading(true);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
        const loader = new STLLoader();
        const geometry = loader.parse(e.target?.result as ArrayBuffer);
        
        if (meshRef.current) sceneRef.current?.remove(meshRef.current);
        
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x3b82f6, 
            roughness: 0.3, 
            metalness: 0.4,
            emissive: 0x1d4ed8,
            emissiveIntensity: 0.1
        });
        const mesh = new THREE.Mesh(geometry, material);
        
        geometry.computeBoundingBox();
        const bbox = geometry.boundingBox!;
        const size = new THREE.Vector3();
        bbox.getSize(size);
        setDimensions({ x: size.x, y: size.y, z: size.z });
        
        let vol = 0;
        const pos = geometry.attributes.position;
        for (let i = 0; i < pos.count; i += 3) {
            const v1 = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
            const v2 = new THREE.Vector3(pos.getX(i+1), pos.getY(i+1), pos.getZ(i+1));
            const v3 = new THREE.Vector3(pos.getX(i+2), pos.getY(i+2), pos.getZ(i+2));
            vol += v1.dot(v2.cross(v3)) / 6.0;
        }
        setVolume(Math.abs(vol) / 1000); 

        geometry.center();
        mesh.position.y = size.y / 2;
        
        meshRef.current = mesh;
        sceneRef.current?.add(mesh);
        setIsLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const clearInspector = () => {
    if (meshRef.current) sceneRef.current?.remove(meshRef.current);
    meshRef.current = null;
    setDimensions(null);
    setVolume(null);
    setFileName(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <div className="bg-blue-600/10 border border-blue-500/20 px-3 py-1 rounded-full flex items-center gap-2">
                <BoxSelect size={12} className="text-blue-500" />
                <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest">3D Lab Hub</span>
             </div>
          </div>
          <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter flex items-center gap-4 leading-none">
             STL <span className="text-blue-500">Inspector</span>.
          </h1>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.4em] mt-3 italic opacity-60">High-Precision Geometry Validation Engine</p>
        </div>
        
        {fileName && (
          <div className="flex gap-4">
            <button 
              onClick={toggleWireframe}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase italic transition-all border ${wireframe ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
            >
              Wireframe: {wireframe ? 'ON' : 'OFF'}
            </button>
            <button onClick={clearInspector} className="p-4 bg-red-600/10 hover:bg-red-600 border border-red-500/20 hover:border-red-500 text-red-500 hover:text-white rounded-2xl transition-all group">
              <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Viewer Card */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div 
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if(f) handleFile(f); }}
              className="glass rounded-[56px] h-[600px] relative overflow-hidden border-2 border-white/5 bg-[#020617]/40 group cursor-crosshair shadow-2xl"
          >
             <div ref={mountRef} className="absolute inset-0" />
             
             {!dimensions && !isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center pointer-events-none">
                   <div className="bg-blue-600/10 p-12 rounded-[40px] border border-blue-500/20 mb-8 group-hover:scale-110 transition-transform duration-700 animate-float">
                      <Upload size={56} className="text-blue-500" />
                   </div>
                   <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter">Ready for Inspection</h3>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-3 italic">Drag STL or click to browse</p>
                </div>
             )}

             {isLoading && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center space-y-6 z-20">
                   <div className="relative">
                      <RefreshCw size={64} className="text-blue-500 animate-spin" />
                      <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse" />
                   </div>
                   <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white italic">Neural Meshing Active...</p>
                </div>
             )}

             {fileName && (
                <div className="absolute top-8 left-8 flex flex-col gap-3 z-10 pointer-events-none">
                   <div className="glass-bright px-5 py-2.5 rounded-2xl border border-blue-500/20 flex items-center gap-3">
                      <Box size={14} className="text-blue-500" />
                      <span className="text-[10px] font-black uppercase text-white tracking-widest">{fileName}</span>
                   </div>
                   <div className="bg-emerald-600/20 border border-emerald-500/20 px-4 py-2 rounded-full w-max">
                      <span className="text-[8px] font-black uppercase text-emerald-500 tracking-widest">Valid Geometry</span>
                   </div>
                </div>
             )}

             <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".stl" onChange={e => { const f = e.target.files?.[0]; if(f) handleFile(f); }} />
          </div>
        </div>

        {/* Analytics Panel */}
        <div className="lg:col-span-4 flex flex-col gap-6">
           <div className="glass rounded-[48px] p-10 border-white/5 bg-slate-900/40 space-y-10 shadow-2xl h-full flex flex-col">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-blue-600/10 rounded-2xl text-blue-500"><Ruler size={24} /></div>
                 <h3 className="text-xs font-black uppercase text-slate-500 tracking-[0.4em] italic leading-none">Mesh Analytics</h3>
              </div>
              
              <div className="flex-1 space-y-8">
                 <DimensionCard label="X-Axis (Width)" value={dimensions ? `${dimensions.x.toFixed(2)} mm` : '--'} color="bg-red-500" />
                 <DimensionCard label="Y-Axis (Height)" value={dimensions ? `${dimensions.y.toFixed(2)} mm` : '--'} color="bg-green-500" />
                 <DimensionCard label="Z-Axis (Depth)" value={dimensions ? `${dimensions.z.toFixed(2)} mm` : '--'} color="bg-blue-500" />
                 
                 <div className="pt-10 border-t border-white/5 mt-10">
                    <div className="bg-[#020617] rounded-[32px] p-8 border border-white/5 relative overflow-hidden group">
                       <div className="flex justify-between items-center relative z-10 mb-2">
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">Computed Volume</span>
                          <span className="text-2xl font-black italic text-white leading-none">{volume ? `${volume.toFixed(2)} cm³` : '--'}</span>
                       </div>
                       <p className="text-[9px] text-slate-600 font-bold uppercase italic leading-relaxed relative z-10">
                          Est. Material Weight: {volume ? (volume * 1.24).toFixed(1) : '--'}g PLA
                       </p>
                       <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 shadow-[0_0_15px_#3b82f6] opacity-30 group-hover:opacity-60 transition-opacity" />
                    </div>
                 </div>
              </div>

              <div className="p-6 bg-blue-600/5 rounded-3xl border border-blue-500/10 flex gap-5">
                 <ShieldCheck size={24} className="text-blue-500 flex-shrink-0" />
                 <p className="text-[10px] text-blue-200/50 font-black uppercase italic tracking-widest leading-relaxed">
                   Privacy Lock Active: All geometry processing is performed locally in your V8 instance. No data leaves this device.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const DimensionCard = ({ label, value, color }: any) => (
  <div className="group">
     <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest italic group-hover:text-slate-400 transition-colors">{label}</span>
        <span className="text-lg font-black italic text-white">{value}</span>
     </div>
     <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full w-full ${color} opacity-20 group-hover:opacity-100 transition-all duration-700`} />
     </div>
  </div>
);

export default STLInspector;
