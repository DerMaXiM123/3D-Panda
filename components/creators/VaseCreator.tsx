import React, { useState, useEffect, useRef } from 'react';
import { Download, Sliders, Activity, ShieldCheck, Binary, RotateCw, MoveUp, Box, Layers, Gauge, Cpu, Radio } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls, STLExporter } from 'three-stdlib';

const VaseCreator: React.FC = () => {
  const [sides, setSides] = useState(128);
  const [height, setHeight] = useState(120);
  const [radiusBottom, setRadiusBottom] = useState(40);
  const [radiusTop, setRadiusTop] = useState(30);
  const [twist, setTwist] = useState(Math.PI); 
  const [waves, setWaves] = useState(8);
  const [waveAmplitude, setWaveAmplitude] = useState(3);

  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
    camera.position.set(160, 160, 160);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, logarithmicDepthBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dLight.position.set(100, 200, 100);
    scene.add(dLight);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const ro = new ResizeObserver(entries => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      rendererRef.current.setSize(width, height);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
    });
    ro.observe(mountRef.current);
    return () => { ro.disconnect(); renderer.dispose(); };
  }, []);

  const generateVase = () => {
    if (!sceneRef.current) return;
    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
      meshRef.current.geometry.dispose();
    }
    
    const segmentsY = 60;
    const segmentsX = sides;
    const vertices: number[] = [];
    const indices: number[] = [];

    vertices.push(0, 0, 0);

    for (let y = 0; y <= segmentsY; y++) {
      const v = y / segmentsY;
      const currentHeight = v * height;
      const currentTwist = v * twist;
      const baseR = THREE.MathUtils.lerp(radiusBottom, radiusTop, v);
      
      for (let x = 0; x < segmentsX; x++) {
        const u = x / segmentsX;
        const angle = u * Math.PI * 2 + currentTwist;
        const wave = Math.sin(u * Math.PI * 2 * waves) * waveAmplitude;
        const finalR = baseR + wave;
        vertices.push(Math.cos(angle) * finalR, currentHeight, Math.sin(angle) * finalR);
      }
    }

    for (let y = 0; y < segmentsY; y++) {
      const start = 1 + (y * segmentsX);
      const next = 1 + ((y + 1) * segmentsX);
      for (let x = 0; x < segmentsX; x++) {
        const xNext = (x + 1) % segmentsX;
        const a = start + x; const b = start + xNext;
        const c = next + x; const d = next + xNext;
        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }

    for (let x = 0; x < segmentsX; x++) {
      indices.push(0, 1 + ((x + 1) % segmentsX), 1 + x);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();

    meshRef.current = new THREE.Mesh(
      geometry, 
      new THREE.MeshStandardMaterial({ 
        color: 0x3b82f6, 
        roughness: 0.2, 
        metalness: 0.3,
        side: THREE.DoubleSide
      })
    );
    sceneRef.current.add(meshRef.current);
  };

  useEffect(() => { generateVase(); }, [sides, height, radiusBottom, radiusTop, twist, waves, waveAmplitude]);

  return (
    <div className="flex flex-col h-full w-full bg-[#020617] overflow-hidden p-6 gap-6 animate-in fade-in duration-700">
      <header className="shrink-0 flex justify-between items-center bg-slate-900/40 p-5 rounded-[24px] border border-white/5">
        <div>
          <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter leading-none">
             VASE <span className="text-blue-500">LAB</span>.
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest mt-1.5 italic opacity-60">Parametric Modeler // V12.0</p>
        </div>
        <button onClick={() => {
            if (!meshRef.current) return;
            const exporter = new STLExporter();
            const result = exporter.parse(meshRef.current, { binary: true });
            const blob = new Blob([(result as DataView).buffer], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Vase_Nexus_Solid.stl`;
            link.click();
        }} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-[16px] font-black uppercase italic shadow-lg transition-all flex items-center gap-3 text-xs tracking-widest group">
          <Download size={18} /> EXPORT STL
        </button>
      </header>

      <div className="flex-1 flex flex-col gap-6 min-h-0">
        <section className="flex-[3] grid lg:grid-cols-12 gap-6 min-h-0">
          <div className="lg:col-span-8 glass rounded-[40px] relative overflow-hidden bg-black/60 border-white/5 shadow-2xl h-full">
             <div ref={mountRef} className="absolute inset-0 cursor-move" />
             <div className="absolute top-6 left-6 flex flex-col gap-2 pointer-events-none">
                <div className="bg-black/60 backdrop-blur-xl px-4 py-2 rounded-[16px] border border-emerald-500/20 text-[8px] font-black uppercase text-emerald-400 italic flex items-center gap-2 shadow-2xl">
                   <ShieldCheck size={12} /> Watertight Geometry
                </div>
                <div className="bg-blue-600/10 backdrop-blur-xl px-4 py-2 rounded-[16px] border border-blue-500/20 text-[8px] font-black uppercase text-blue-400 italic flex items-center gap-2 shadow-2xl">
                   <Activity size={12} className="animate-pulse" /> Live Mesh Engine
                </div>
             </div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-600/5 blur-[120px] pointer-events-none rounded-full" />
          </div>

          <div className="lg:col-span-4 glass rounded-[40px] p-8 space-y-8 border-white/5 bg-slate-900/40 flex flex-col overflow-y-auto scrollbar-hide shrink-0 shadow-2xl h-full">
             <div className="flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                   <Sliders size={20} />
                </div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">Engineering Sidebar</p>
             </div>
             
             <div className="space-y-6 flex-1">
                <VaseSlider label="Höhe" icon={<MoveUp size={14}/>} value={height} min={20} max={250} onChange={setHeight} />
                <VaseSlider label="Basis Radius" value={radiusBottom} min={10} max={100} onChange={setRadiusBottom} />
                <VaseSlider label="Top Radius" value={radiusTop} min={10} max={100} onChange={setRadiusTop} />
                <VaseSlider label="Twist" icon={<RotateCw size={14}/>} value={Number((twist * (180/Math.PI)).toFixed(0))} unit="°" min={0} max={720} onChange={(v: number) => setTwist(v * (Math.PI / 180))} />
                <VaseSlider label="Wellen" value={waves} min={0} max={30} onChange={setWaves} />
                <VaseSlider label="Amplitude" value={waveAmplitude} min={0} max={20} step={0.5} onChange={setWaveAmplitude} />
             </div>
          </div>
        </section>

        <section className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0 h-full min-h-[160px] pb-4">
           <TelemetryCard icon={<Binary size={28} />} label="Vertices" value={(sides * 60).toLocaleString()} sub="BUFFER_OPTIMIZED" />
           <TelemetryCard icon={<Layers size={28} />} label="Print Layers" value={(height / 0.2).toFixed(0)} sub="@ 0.20MM LH" />
           <TelemetryCard icon={<Gauge size={28} />} label="Memory Node" value="12.4 MB" sub="VRAM_STABLE" />
           
           <div className="glass rounded-[32px] p-8 bg-slate-900/40 border-white/5 flex flex-col justify-center shadow-lg font-mono overflow-hidden relative group border-t border-white/10 h-full">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700">
                 <Cpu size={120} />
              </div>
              <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest italic mb-2 flex items-center gap-2 leading-none">
                 <Radio size={12} className="animate-pulse" /> Live Uplink
              </p>
              <div className="text-[11px] text-slate-400 font-bold uppercase truncate italic">
                 RENDER_CORE_V12.0_READY...
              </div>
              <div className="text-[9px] text-slate-600 font-mono mt-3 flex justify-between">
                 <span>FPS: 60.00</span>
                 <span>DL: 12.4MS</span>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};

const TelemetryCard = ({ icon, label, value, sub }: any) => (
  <div className="glass rounded-[32px] p-8 bg-slate-900/40 border-white/5 flex items-center gap-6 shadow-lg hover:bg-slate-900/60 transition-colors h-full">
    <div className="w-16 h-16 bg-blue-600/10 rounded-[24px] flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-inner shrink-0">
       {icon}
    </div>
    <div className="min-w-0">
       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic truncate">{label}</p>
       <p className="text-2xl font-black text-white italic uppercase mt-0.5 truncate">{value}</p>
       <p className="text-[8px] font-mono text-blue-400 mt-1 uppercase opacity-60 tracking-tighter truncate">{sub}</p>
    </div>
  </div>
);

const VaseSlider = ({ label, icon, value, unit = "mm", min, max, step = 1, onChange }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center px-1">
      <div className="flex items-center gap-2">
        {icon && <span className="text-slate-500">{icon}</span>}
        <label className="text-[9px] font-black uppercase text-slate-500 italic tracking-widest">{label}</label>
      </div>
      <span className="text-blue-400 font-black italic text-[11px]">{value}{unit}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="modern-slider" />
  </div>
);

export default VaseCreator;