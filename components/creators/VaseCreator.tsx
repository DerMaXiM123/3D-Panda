import React, { useState, useEffect, useRef } from 'react';
import { Download, Sliders, Zap, RefreshCw, BrainCircuit, X, CheckCircle2, Loader2 } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls, STLExporter } from 'three-stdlib';
import { geminiService } from '../../services/geminiService';

const VaseCreator: React.FC = () => {
  const [sides, setSides] = useState(64);
  const [height, setHeight] = useState(100);
  const [radiusBottom, setRadiusBottom] = useState(30);
  const [radiusTop, setRadiusTop] = useState(20);
  const [twist, setTwist] = useState(Math.PI);
  const [waves, setWaves] = useState(10);
  const [waveAmplitude, setWaveAmplitude] = useState(2);

  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(100, 100, 150);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const dLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dLight.position.set(50, 100, 50);
    scene.add(dLight);
    const animate = () => { requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); };
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

  const generateVase = () => {
    if (!sceneRef.current) return;
    if (meshRef.current) { sceneRef.current.remove(meshRef.current); meshRef.current.geometry?.dispose(); }
    const segmentsY = 100; const segmentsX = sides;
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = []; const indices: number[] = [];
    for (let y = 0; y <= segmentsY; y++) {
      const v = y / segmentsY; const currentHeight = v * height; const t = v * twist; const r = THREE.MathUtils.lerp(radiusBottom, radiusTop, v);
      for (let x = 0; x <= segmentsX; x++) {
        const u = x / segmentsX; const angle = u * Math.PI * 2 + t; const wave = Math.sin(u * Math.PI * 2 * waves) * waveAmplitude;
        vertices.push(Math.cos(angle) * (r + wave), currentHeight, Math.sin(angle) * (r + wave));
      }
    }
    for (let y = 0; y < segmentsY; y++) {
      for (let x = 0; x < segmentsX; x++) {
        const a = y * (segmentsX + 1) + x; const b = y * (segmentsX + 1) + (x + 1); const c = (y + 1) * (segmentsX + 1) + x; const d = (y + 1) * (segmentsX + 1) + (x + 1);
        indices.push(a, b, c, b, d, c);
      }
    }
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    meshRef.current = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.1, side: THREE.DoubleSide }));
    sceneRef.current.add(meshRef.current);
  };

  useEffect(() => { generateVase(); }, [sides, height, radiusBottom, radiusTop, twist, waves, waveAmplitude]);

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="flex justify-between items-end">
        <div><h1 className="text-5xl font-black italic text-white uppercase">VASE LAB</h1></div>
        <button onClick={() => {
            if (!meshRef.current) return;
            const exporter = new STLExporter();
            const result = exporter.parse(meshRef.current, { binary: true });
            const blob = new Blob([(result as DataView).buffer], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `vase.stl`;
            link.click();
        }} className="bg-blue-600 px-10 py-5 rounded-[28px] font-black uppercase italic shadow-xl hover:scale-105 transition-transform">
          <Download className="inline mr-2" size={20}/> EXPORT STL
        </button>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 glass rounded-[56px] h-[650px] relative overflow-hidden bg-slate-900/20 group">
          <div ref={mountRef} className="absolute inset-0 cursor-move" />
        </div>
        <div className="lg:col-span-4 space-y-8">
          <div className="glass rounded-[48px] p-10 space-y-10 bg-slate-900/40">
             <VaseSlider label="Höhe" value={height} min={20} max={250} onChange={setHeight} />
             <VaseSlider label="Twist" value={twist.toFixed(1)} min={0} max={12.5} step={0.1} onChange={setTwist} />
             <VaseSlider label="Wellen" value={waves} min={0} max={30} onChange={setWaves} />
          </div>
        </div>
      </div>
    </div>
  );
};
const VaseSlider = ({ label, value, min, max, step = 1, onChange }: any) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center px-2">
      <label className="text-[10px] font-black uppercase text-slate-500 italic tracking-widest">{label}</label>
      <span className="text-blue-400 font-black italic text-lg">{value}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="modern-slider" />
  </div>
);
export default VaseCreator;