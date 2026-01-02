import React, { useState, useEffect, useRef } from 'react';
import { Download, Cog, Sliders, Zap, Ruler, BrainCircuit, Loader2, X, CheckCircle2 } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls, STLExporter } from 'three-stdlib';
import { geminiService } from '../../services/geminiService';

const GearCreator: React.FC = () => {
  const [teeth, setTeeth] = useState(24);
  const [thickness, setThickness] = useState(10);
  const [holeRadius, setHoleRadius] = useState(4);
  const [module, setModule] = useState(2.0);
  
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [aiTip, setAiTip] = useState<string | null>(null);

  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(50, 50, 50);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const dLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dLight.position.set(50, 100, 50);
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

  const generateGear = () => {
    if (!sceneRef.current) return;
    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
      meshRef.current.geometry.dispose();
    }

    const gearShape = new THREE.Shape();
    const pitchRadius = (teeth * module) / 2;
    const addendum = module;
    const dedendum = 1.25 * module;
    const outerRadius = pitchRadius + addendum;
    const innerRadius = pitchRadius - dedendum;
    
    for (let i = 0; i < teeth; i++) {
      const angle = (i / teeth) * Math.PI * 2;
      const step = (Math.PI * 2) / teeth;
      gearShape.absarc(0, 0, innerRadius, angle, angle + step * 0.25, false);
      gearShape.absarc(0, 0, outerRadius, angle + step * 0.4, angle + step * 0.6, false);
      gearShape.absarc(0, 0, innerRadius, angle + step * 0.75, angle + step, false);
    }

    const holePath = new THREE.Path();
    holePath.absarc(0, 0, holeRadius, 0, Math.PI * 2, true);
    gearShape.holes.push(holePath);

    const extrudeSettings = { depth: thickness, bevelEnabled: true, bevelThickness: 1, bevelSize: 0.5, bevelSegments: 3, curveSegments: 32 };
    const geometry = new THREE.ExtrudeGeometry(gearShape, extrudeSettings);
    geometry.center();
    meshRef.current = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.3, metalness: 0.5 }));
    sceneRef.current.add(meshRef.current);
  };

  useEffect(() => { generateGear(); }, [teeth, thickness, holeRadius, module]);

  const handleAiOptimize = async () => {
    setIsOptimizing(true);
    const tip = await geminiService.optimizeDesign("Involute Gear", { teeth, module, thickness });
    setAiTip(tip || "Optimierung fehlgeschlagen.");
    setIsOptimizing(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter flex items-center gap-4">GEAR <span className="text-cyan-500">ARCHITECT</span>.</h1>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleAiOptimize}
            className="bg-white/5 hover:bg-white/10 text-white px-8 py-5 rounded-[28px] font-black uppercase italic shadow-xl flex items-center gap-4 transition-all"
          >
             {isOptimizing ? <Loader2 className="animate-spin" size={24}/> : <BrainCircuit size={24} />} AI ANALYSE
          </button>
          <button onClick={() => {
              if (!meshRef.current) return;
              const exporter = new STLExporter();
              const result = exporter.parse(meshRef.current, { binary: true });
              const blob = new Blob([(result as DataView).buffer], { type: 'application/octet-stream' });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = `gear_${teeth}t.stl`;
              link.click();
          }} className="bg-cyan-600 px-10 py-5 rounded-[28px] font-black uppercase italic shadow-xl">
            <Download size={24} /> EXPORT STL
          </button>
        </div>
      </header>
      
      {aiTip && (
        <div className="glass rounded-[32px] p-8 border-cyan-500/20 bg-cyan-600/5 animate-in slide-in-from-top-4 relative overflow-hidden">
           <button onClick={() => setAiTip(null)} className="absolute top-6 right-6 text-slate-500"><X size={20}/></button>
           <div className="flex gap-6">
              <div className="p-4 bg-cyan-600/20 rounded-2xl h-max text-cyan-400"><CheckCircle2 size={32} /></div>
              <div className="space-y-2">
                 <p className="text-[10px] font-black uppercase tracking-widest text-cyan-500">Panda's Engineering Tip</p>
                 <p className="text-white font-medium italic text-sm leading-relaxed">{aiTip}</p>
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 glass rounded-[56px] h-[600px] relative overflow-hidden bg-slate-900/20 group">
          <div ref={mountRef} className="absolute inset-0 cursor-move" />
        </div>
        <div className="lg:col-span-4 space-y-8">
          <div className="glass rounded-[48px] p-10 space-y-10 bg-slate-900/40">
             <GearSlider label="Teeth Count" value={teeth} min={8} max={120} onChange={setTeeth} />
             <GearSlider label="Module" value={module.toFixed(1)} min={0.5} max={10} step={0.1} onChange={setModule} />
             <GearSlider label="Thickness" value={thickness} min={1} max={50} onChange={setThickness} />
          </div>
        </div>
      </div>
    </div>
  );
};

const GearSlider = ({ label, value, min, max, step = 1, onChange }: any) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center px-2">
      <label className="text-[10px] font-black uppercase text-slate-500 italic tracking-widest">{label}</label>
      <span className="text-cyan-500 font-black italic text-lg">{value}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="modern-slider" />
  </div>
);
export default GearCreator;