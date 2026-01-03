
import React, { useState, useEffect, useRef } from 'react';
import { Box, BoxSelect, Ruler, Upload, RefreshCw, Layers, ShieldCheck, Trash2, Eye } from 'lucide-react';
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
    if (!file.name.toLowerCase().endsWith('.stl')) return;
    setIsLoading(true);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
        const loader = new STLLoader();
        const geometry = loader.parse(e.target?.result as ArrayBuffer);
        if (meshRef.current) sceneRef.current?.remove(meshRef.current);
        const material = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3, metalness: 0.4 });
        const mesh = new THREE.Mesh(geometry, material);
        geometry.computeBoundingBox();
        const size = new THREE.Vector3();
        geometry.boundingBox!.getSize(size);
        setDimensions({ x: size.x, y: size.y, z: size.z });
        geometry.center();
        mesh.position.y = size.y / 2;
        meshRef.current = mesh;
        sceneRef.current?.add(mesh);
        setIsLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#020617] animate-in fade-in duration-700 overflow-hidden">
      <header className="shrink-0 flex justify-between items-center bg-slate-900/40 p-6 m-4 mb-0 rounded-[32px] border border-white/5">
        <div>
          <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter flex items-center gap-3 leading-none">
             STL <span className="text-blue-500">Inspector</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest mt-2 italic leading-none">Precision Geometry Analysis</p>
        </div>
        {fileName && (
          <div className="flex gap-3">
            <button onClick={toggleWireframe} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase italic transition-all border ${wireframe ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}>Wireframe: {wireframe ? 'ON' : 'OFF'}</button>
            <button onClick={() => window.location.reload()} className="p-3 bg-red-600/10 text-red-500 border border-red-500/20 rounded-xl"><Trash2 size={18} /></button>
          </div>
        )}
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0">
        <div className="flex-1 glass rounded-[48px] relative overflow-hidden bg-black/40 border-white/5 shadow-2xl">
           <div ref={mountRef} className="absolute inset-0 cursor-crosshair" />
           {!fileName && !isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center pointer-events-none opacity-20">
                 <Upload size={64} className="mb-6" />
                 <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter leading-none">Drop STL to Inspect</h3>
              </div>
           )}
           <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".stl" onChange={e => { const f = e.target.files?.[0]; if(f) handleFile(f); }} />
        </div>

        <div className="lg:w-[350px] glass rounded-[48px] p-8 border-white/5 bg-slate-900/40 space-y-8 flex flex-col shrink-0 shadow-2xl h-full overflow-y-auto scrollbar-hide">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600/10 rounded-xl text-blue-500"><Ruler size={20} /></div>
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest italic leading-none">Mesh Analytics</h3>
           </div>
           
           <div className="flex-1 space-y-6">
              <DimensionItem label="X (Width)" value={dimensions ? `${dimensions.x.toFixed(2)}mm` : '--'} />
              <DimensionItem label="Y (Height)" value={dimensions ? `${dimensions.y.toFixed(2)}mm` : '--'} />
              <DimensionItem label="Z (Depth)" value={dimensions ? `${dimensions.z.toFixed(2)}mm` : '--'} />
              
              <div className="pt-8 border-t border-white/5 mt-8">
                 <div className="bg-black/40 rounded-2xl p-6 border border-white/5 text-center">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">V8 Mesh Processor</p>
                    <p className="text-xs font-bold text-blue-500 uppercase italic">Local Computation Only</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <footer className="shrink-0 glass rounded-t-[32px] border-t border-white/5 bg-slate-950/80 p-5 mx-4 flex items-center justify-between shadow-2xl">
         <div className="flex items-center gap-8">
            <ShieldCheck size={20} className="text-blue-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic leading-none">Security: All Mesh Data stays Local</span>
         </div>
         <div className="text-right">
            <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest leading-none italic">Analysis Node</p>
            <p className="text-[10px] font-mono font-bold text-blue-500 mt-1 uppercase italic leading-none">MESH_INSP_V1</p>
         </div>
      </footer>
    </div>
  );
};

const DimensionItem = ({ label, value }: any) => (
  <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
     <span className="text-[9px] font-black uppercase text-slate-500 italic">{label}</span>
     <span className="text-sm font-black italic text-white leading-none">{value}</span>
  </div>
);

export default STLInspector;
