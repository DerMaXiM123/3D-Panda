
import React, { useState, useEffect, useRef } from 'react';
import { Maximize2, Ruler, Box, AlertTriangle, ChevronRight, Zap, RefreshCw, Smartphone, Sliders } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';

const ARBedPlacement: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [bedSize, setBedSize] = useState({ x: 256, y: 256 });
  const [objSize, setObjSize] = useState({ x: 50, y: 50, z: 50 });
  const [isTooBig, setIsTooBig] = useState(false);
  
  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const bedRef = useRef<THREE.GridHelper | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
    camera.position.set(300, 300, 300);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dLight.position.set(100, 200, 100);
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

  useEffect(() => {
    if (!sceneRef.current) return;
    
    if (bedRef.current) sceneRef.current.remove(bedRef.current);
    if (meshRef.current) sceneRef.current.remove(meshRef.current);

    const grid = new THREE.GridHelper(Math.max(bedSize.x, bedSize.y), 20, 0x3b82f6, 0x1e293b);
    grid.position.y = 0;
    sceneRef.current.add(grid);
    bedRef.current = grid;

    const geo = new THREE.BoxGeometry(objSize.x, objSize.z, objSize.y);
    const mat = new THREE.MeshStandardMaterial({ 
      color: (objSize.x > bedSize.x || objSize.y > bedSize.y) ? 0xef4444 : 0x3b82f6, 
      transparent: true, 
      opacity: 0.7 
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = objSize.z / 2;
    sceneRef.current.add(mesh);
    meshRef.current = mesh;

    setIsTooBig(objSize.x > bedSize.x || objSize.y > bedSize.y);
  }, [bedSize, objSize]);

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter flex items-center gap-4 leading-none">
             AR <span className="text-blue-500">BED PRO</span>.
          </h1>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.4em] mt-3 italic opacity-60">Virtual Scale & Collision Lab</p>
        </div>
        <button className="bg-white text-black hover:bg-blue-600 hover:text-white px-8 py-5 rounded-[28px] font-black italic transition-all shadow-xl uppercase tracking-widest flex items-center gap-4">
           <Smartphone size={24} /> Mobile AR-View
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 glass rounded-[56px] h-[600px] relative overflow-hidden border-2 border-white/5 bg-slate-900/60 shadow-2xl">
          <div ref={mountRef} className="absolute inset-0 cursor-move" />
          
          <div className="absolute top-8 left-8 flex flex-col gap-3 pointer-events-none">
             <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-[10px] font-black uppercase text-blue-400 italic flex items-center gap-2">
                <Ruler size={14} /> Bett: {bedSize.x}x{bedSize.y}mm
             </div>
             {isTooBig && (
               <div className="bg-red-600/20 border border-red-500/20 px-4 py-2 rounded-2xl text-[8px] font-black uppercase text-red-500 tracking-widest italic flex items-center gap-2 animate-pulse">
                  <AlertTriangle size={12} /> COLLISION DETECTED
               </div>
             )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="glass rounded-[48px] p-10 space-y-10 border-white/5 bg-slate-900/40">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-[0.4em] italic flex items-center gap-3">
               <Sliders size={18} className="text-blue-500" /> Platform Config
            </h3>
            
            <div className="space-y-8">
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Build Plate Size (mm)</label>
                 <div className="flex gap-2">
                    <button onClick={() => setBedSize({x: 256, y: 256})} className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase italic ${bedSize.x === 256 ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-500'}`}>Bambu (256)</button>
                    <button onClick={() => setBedSize({x: 220, y: 220})} className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase italic ${bedSize.x === 220 ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-500'}`}>Ender (220)</button>
                    <button onClick={() => setBedSize({x: 350, y: 350})} className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase italic ${bedSize.x === 350 ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-500'}`}>Voron (350)</button>
                 </div>
              </div>

              <PlacementSlider label="Objekt Breite (X)" value={objSize.x} min={10} max={400} onChange={(v: number) => setObjSize({...objSize, x: v})} />
              <PlacementSlider label="Objekt Tiefe (Y)" value={objSize.y} min={10} max={400} onChange={(v: number) => setObjSize({...objSize, y: v})} />
              <PlacementSlider label="Objekt Höhe (Z)" value={objSize.z} min={10} max={400} onChange={(v: number) => setObjSize({...objSize, z: v})} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PlacementSlider = ({ label, value, min, max, onChange }: { label: string, value: number, min: number, max: number, onChange: (val: number) => void }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center px-2">
      <label className="text-[10px] font-black uppercase text-slate-500 italic tracking-widest">{label}</label>
      <span className="text-blue-500 font-black italic text-lg">{value}mm</span>
    </div>
    <input type="range" min={min} max={max} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="modern-slider" />
  </div>
);

export default ARBedPlacement;
