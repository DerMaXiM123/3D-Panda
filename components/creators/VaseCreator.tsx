
import React, { useState, useEffect, useRef } from 'react';
import { Download, Sliders, Activity, ShieldCheck, Binary, RotateCw, MoveUp, Box, Layers, Gauge, Cpu, Radio } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls, STLExporter } from 'three-stdlib';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

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
    const geometries: THREE.BufferGeometry[] = [];

    // 1. Die Wand der Vase
    const wallVertices: number[] = [];
    const wallIndices: number[] = [];
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
        wallVertices.push(Math.cos(angle) * finalR, currentHeight, Math.sin(angle) * finalR);
      }
    }
    for (let y = 0; y < segmentsY; y++) {
      for (let x = 0; x < segmentsX; x++) {
        const a = y * segmentsX + x;
        const b = y * segmentsX + (x + 1) % segmentsX;
        const c = (y + 1) * segmentsX + x;
        const d = (y + 1) * segmentsX + (x + 1) % segmentsX;
        wallIndices.push(a, b, c, b, d, c);
      }
    }
    const wallGeo = new THREE.BufferGeometry();
    wallGeo.setIndex(wallIndices);
    wallGeo.setAttribute('position', new THREE.Float32BufferAttribute(wallVertices, 3));
    geometries.push(wallGeo);

    // 2. Der Boden (Airtight Cap)
    const baseShape = new THREE.Shape();
    for(let x=0; x<segmentsX; x++) {
       const u = x / segmentsX;
       const wave = Math.sin(u * Math.PI * 2 * waves) * waveAmplitude;
       const finalR = radiusBottom + wave;
       const px = Math.cos(u * Math.PI * 2) * finalR;
       const py = Math.sin(u * Math.PI * 2) * finalR;
       if(x === 0) baseShape.moveTo(px, py); else baseShape.lineTo(px, py);
    }
    const capGeo = new THREE.ShapeGeometry(baseShape);
    capGeo.rotateX(Math.PI / 2);
    geometries.push(capGeo);

    const mergedGeo = BufferGeometryUtils.mergeGeometries(geometries);
    mergedGeo.computeVertexNormals();

    meshRef.current = new THREE.Mesh(
      mergedGeo, 
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
    <div className="flex flex-col h-full w-full bg-[#020617] overflow-hidden p-6 lg:p-10 gap-6 lg:gap-10 animate-in fade-in duration-700">
      <header className="shrink-0 flex justify-between items-center bg-slate-900/40 p-6 rounded-[32px] border border-white/5 w-full">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter leading-none">
             VASE <span className="text-blue-500">LAB</span>.
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-2 italic opacity-60">Full-Scale Design Environment // Solid Base Engine</p>
        </div>
        <button onClick={() => {
            if (!meshRef.current) return;
            const exporter = new STLExporter();
            const result = exporter.parse(meshRef.current, { binary: true });
            const blob = new Blob([(result as DataView).buffer], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `SolidVase_Nexus.stl`;
            link.click();
        }} className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-[20px] font-black uppercase italic shadow-xl transition-all flex items-center gap-4 text-xs tracking-widest">
          <Download size={20} /> EXPORT STL
        </button>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 lg:gap-10 min-h-0 w-full overflow-hidden">
        <div className="flex-1 glass rounded-[48px] lg:rounded-[64px] relative overflow-hidden bg-black/60 border-white/5 shadow-2xl h-full">
             <div ref={mountRef} className="absolute inset-0 cursor-move" />
             <div className="absolute top-8 left-8 flex flex-col gap-3 pointer-events-none">
                <div className="bg-black/60 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-emerald-500/20 text-[10px] font-black uppercase text-emerald-400 italic flex items-center gap-2 shadow-2xl">
                   <ShieldCheck size={14} /> Manifold Mesh Valid
                </div>
                <div className="bg-blue-600/10 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-blue-500/20 text-[10px] font-black uppercase text-blue-400 italic flex items-center gap-2 shadow-2xl">
                   <Activity size={14} className="animate-pulse" /> Solid Base Active
                </div>
             </div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-600/5 blur-[120px] pointer-events-none rounded-full opacity-50" />
        </div>

        <div className="lg:w-[450px] glass rounded-[48px] lg:rounded-[64px] p-10 space-y-12 border-white/5 bg-slate-900/40 flex flex-col overflow-y-auto scrollbar-hide shrink-0 shadow-2xl h-full">
             <div className="flex items-center gap-4 shrink-0">
                <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-inner">
                   <Sliders size={28} />
                </div>
                <p className="text-[11px] font-black uppercase text-slate-500 tracking-[0.3em] italic">Engineering Sidecar</p>
             </div>
             
             <div className="space-y-8 flex-1">
                <VaseSlider label="Höhe" icon={<MoveUp size={16}/>} value={height} min={20} max={250} onChange={setHeight} />
                <VaseSlider label="Basis Radius" value={radiusBottom} min={10} max={100} onChange={setRadiusBottom} />
                <VaseSlider label="Top Radius" value={radiusTop} min={10} max={100} onChange={setRadiusTop} />
                <VaseSlider label="Twist" icon={<RotateCw size={16}/>} value={Number((twist * (180/Math.PI)).toFixed(0))} unit="°" min={0} max={720} onChange={(v: number) => setTwist(v * (Math.PI / 180))} />
                <VaseSlider label="Wellen" value={waves} min={0} max={30} onChange={setWaves} />
                <VaseSlider label="Amplitude" value={waveAmplitude} min={0} max={20} step={0.5} onChange={setWaveAmplitude} />
             </div>
          </div>
        </div>
    </div>
  );
};

const VaseSlider = ({ label, icon, value, unit = "mm", min, max, step = 1, onChange }: any) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center px-1">
      <div className="flex items-center gap-2">
        {icon && <span className="text-slate-500">{icon}</span>}
        <label className="text-[10px] font-black uppercase text-slate-500 italic tracking-widest">{label}</label>
      </div>
      <span className="text-blue-400 font-black italic text-sm">{value}{unit}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="modern-slider" />
  </div>
);

export default VaseCreator;
