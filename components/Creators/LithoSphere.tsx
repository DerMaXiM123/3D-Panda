import React, { useState, useRef, useEffect } from 'react';
import { Download, Image as ImageIcon, RefreshCw, Upload, Globe, Zap, Sliders } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls, STLExporter } from 'three-stdlib';

const LithoSphere: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [radius, setRadius] = useState(50);
  const [thickness, setThickness] = useState(2.8);
  const [minThickness, setMinThickness] = useState(0.8);
  const [resolution, setResolution] = useState(120);
  const [isLoading, setIsLoading] = useState(false);
  
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 0, 150);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const dLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dLight.position.set(50, 50, 100);
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

  const generateSphere = async (imgSrc: string) => {
    if (!sceneRef.current) return;
    setIsLoading(true);
    const img = new Image();
    img.src = imgSrc;
    await img.decode();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const resX = resolution * 2;
    const resY = resolution;
    canvas.width = resX; canvas.height = resY;
    ctx?.drawImage(img, 0, 0, resX, resY);
    const pixels = ctx?.getImageData(0, 0, resX, resY).data;

    if (meshRef.current) { sceneRef.current.remove(meshRef.current); meshRef.current.geometry.dispose(); }

    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = []; const indices: number[] = [];

    for (let y = 0; y <= resY; y++) {
      const v = y / resY; const phi = v * Math.PI;
      for (let x = 0; x <= resX; x++) {
        const u = x / resX; const theta = u * Math.PI * 2;
        const px = Math.min(Math.floor(u * (resX - 1)), resX - 1);
        const py = Math.min(Math.floor(v * (resY - 1)), resY - 1);
        const i = (py * resX + px) * 4;
        const brightness = pixels ? (pixels[i] + pixels[i+1] + pixels[i+2]) / (3 * 255) : 0.5;
        const dist = radius + minThickness + (1 - brightness) * (thickness - minThickness);
        vertices.push(dist * Math.sin(phi) * Math.cos(theta), dist * Math.cos(phi), dist * Math.sin(phi) * Math.sin(theta));
      }
    }
    for (let y = 0; y < resY; y++) {
      for (let x = 0; x < resX; x++) {
        const a = y * (resX + 1) + x; const b = y * (resX + 1) + (x + 1);
        const c = (y + 1) * (resX + 1) + x; const d = (y + 1) * (resX + 1) + (x + 1);
        indices.push(a, b, c, b, d, c);
      }
    }
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    meshRef.current = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.1, side: THREE.DoubleSide }));
    sceneRef.current.add(meshRef.current);
    setIsLoading(false);
  };

  useEffect(() => { if (image) generateSphere(image); }, [image, radius, thickness, minThickness, resolution]);

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter flex items-center gap-4">LITHO <span className="text-amber-500">SPHERE</span>.</h1>
        </div>
        <button disabled={!image} onClick={() => {
            if (!meshRef.current) return;
            const exporter = new STLExporter();
            const result = exporter.parse(meshRef.current, { binary: true });
            const blob = new Blob([result], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `lithosphere.stl`;
            link.click();
        }} className="bg-amber-600 px-10 py-5 rounded-[28px] font-black uppercase italic shadow-xl">
          <Download size={24} /> EXPORT STL
        </button>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 glass rounded-[56px] h-[600px] relative overflow-hidden bg-[#020617]/40 group">
          <div ref={mountRef} className="absolute inset-0 cursor-move" />
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => {
            const f = e.target.files?.[0];
            if(f) { const r = new FileReader(); r.onload = ev => setImage(ev.target?.result as string); r.readAsDataURL(f); }
          }} />
          {!image && <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 m-auto w-40 h-40 bg-white/5 rounded-full flex items-center justify-center border-dashed border-2 border-white/20"><Upload className="text-white"/></button>}
        </div>
        <div className="lg:col-span-4 space-y-8">
          <div className="glass rounded-[48px] p-10 space-y-8 bg-slate-900/40">
             <SphereSlider label="Radius" value={radius} min={20} max={150} onChange={setRadius} />
             <SphereSlider label="Thickness" value={thickness} min={1.5} max={5} step={0.1} onChange={setThickness} />
          </div>
        </div>
      </div>
    </div>
  );
};
const SphereSlider = ({ label, value, min, max, step = 1, onChange }: any) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center px-2">
      <label className="text-[10px] font-black uppercase text-slate-500 italic tracking-widest">{label}</label>
      <span className="text-amber-500 font-black italic text-lg">{value}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="modern-slider" />
  </div>
);
export default LithoSphere;