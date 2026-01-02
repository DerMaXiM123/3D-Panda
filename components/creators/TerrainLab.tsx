import React, { useState, useEffect, useRef } from 'react';
import { Download, Mountain, Sliders, Zap, RefreshCw, Box as BoxIcon } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls, STLExporter } from 'three-stdlib';

const TerrainLab: React.FC = () => {
  const [scale, setScale] = useState(100);
  const [ruggedness, setRuggedness] = useState(25);
  const [detail, setDetail] = useState(100);
  const [seed, setSeed] = useState(Math.floor(Math.random() * 1000));
  const [baseHeight, setBaseHeight] = useState(15);
  
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(120, 120, 120);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dLight = new THREE.DirectionalLight(0xffffff, 1.8);
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

  const generateTerrain = () => {
    if (!sceneRef.current) return;
    if (meshRef.current) { sceneRef.current.remove(meshRef.current); meshRef.current.geometry.dispose(); }
    const geometry = new THREE.BoxGeometry(scale, baseHeight, scale, detail, 1, detail);
    geometry.translate(0, baseHeight / 2, 0);
    const position = geometry.attributes.position;
    const noise = (x: number, z: number, s: number) => Math.sin(x * 0.1 + s) * Math.cos(z * 0.08 + s) * 0.6 + Math.sin(x * 0.05 - s * 0.5) * Math.sin(z * 0.04 + s * 1.2) * 1.2;
    for (let i = 0; i < position.count; i++) {
      const py = position.getY(i);
      if (py > baseHeight - 0.1) {
        const h = noise(position.getX(i), position.getZ(i), seed) * (ruggedness / 2);
        position.setY(i, baseHeight + Math.max(0, h));
      }
    }
    geometry.computeVertexNormals();
    meshRef.current = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.8 }));
    sceneRef.current.add(meshRef.current);
  };

  useEffect(() => { generateTerrain(); }, [scale, ruggedness, detail, seed, baseHeight]);

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="flex justify-between items-end">
        <div><h1 className="text-5xl font-black italic text-white uppercase">TERRAIN LAB</h1></div>
        <button onClick={() => {
            if (!meshRef.current) return;
            const exporter = new STLExporter();
            const result = exporter.parse(meshRef.current, { binary: true });
            const blob = new Blob([(result as DataView).buffer], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `terrain.stl`;
            link.click();
        }} className="bg-emerald-600 px-10 py-5 rounded-[28px] font-black uppercase italic shadow-xl hover:scale-105 transition-transform">
          <Download className="inline mr-2" size={20}/> EXPORT STL
        </button>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 glass rounded-[56px] h-[650px] relative overflow-hidden bg-slate-900/20 group">
          <div ref={mountRef} className="absolute inset-0 cursor-move" />
        </div>
        <div className="lg:col-span-4 space-y-8">
          <div className="glass rounded-[48px] p-10 space-y-10 bg-slate-900/40">
             <TerrainSlider label="Größe" value={scale} min={50} max={250} onChange={setScale} />
             <TerrainSlider label="Intensität" value={ruggedness} min={0} max={80} onChange={setRuggedness} />
             <button onClick={() => setSeed(Math.floor(Math.random()*1000))} className="w-full bg-white/5 py-4 rounded-2xl text-xs font-black uppercase italic hover:bg-white/10 transition-all">Seed Neu Rollen</button>
          </div>
        </div>
      </div>
    </div>
  );
};
const TerrainSlider = ({ label, value, min, max, step = 1, onChange }: any) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center px-2">
      <label className="text-[10px] font-black uppercase text-slate-500 italic tracking-widest">{label}</label>
      <span className="text-emerald-400 font-black italic text-lg">{value}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="modern-slider" />
  </div>
);
export default TerrainLab;