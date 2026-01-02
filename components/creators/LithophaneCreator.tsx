import React, { useState, useRef, useEffect } from 'react';
import { Download, Image as ImageIcon, RefreshCw, Upload, ShieldCheck, Zap, Sliders } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls, STLExporter } from 'three-stdlib';

const LithophaneCreator: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [thickness, setThickness] = useState(3.2);
  const [baseThickness, setBaseThickness] = useState(0.8);
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
    camera.position.set(50, 50, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const dLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dLight.position.set(20, 30, 100);
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

  const generateLithophane = async (imgSrc: string) => {
    if (!sceneRef.current) return;
    setIsLoading(true);
    const img = new Image(); img.src = imgSrc; await img.decode();
    const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
    canvas.width = resolution; canvas.height = resolution;
    ctx?.drawImage(img, 0, 0, resolution, resolution);
    const pixels = ctx?.getImageData(0, 0, resolution, resolution).data;

    if (meshRef.current) { sceneRef.current.remove(meshRef.current); meshRef.current.geometry.dispose(); }

    const size = 60; const step = size / (resolution - 1);
    const vertices: number[] = []; const indices: number[] = [];
    const getIdx = (x: number, y: number, isBack: boolean) => (y * resolution + x) * 2 + (isBack ? 1 : 0);

    if (pixels) {
      for (let y = 0; y < resolution; y++) {
        for (let x = 0; x < resolution; x++) {
          const i = (y * resolution + x);
          const bright = (pixels[i * 4] + pixels[i * 4 + 1] + pixels[i * 4 + 2]) / 3 / 255;
          const px = x * step - size / 2; const py = -(y * step - size / 2);
          vertices.push(px, py, baseThickness + (1 - bright) * (thickness - baseThickness));
          vertices.push(px, py, 0);
        }
      }
      for (let y = 0; y < resolution - 1; y++) {
        for (let x = 0; x < resolution - 1; x++) {
          const f_tl = getIdx(x, y, false), f_tr = getIdx(x + 1, y, false), f_bl = getIdx(x, y + 1, false), f_br = getIdx(x + 1, y + 1, false);
          const b_tl = getIdx(x, y, true), b_tr = getIdx(x + 1, y, true), b_bl = getIdx(x, y + 1, true), b_br = getIdx(x + 1, y + 1, true);
          indices.push(f_tl, f_bl, f_tr, f_tr, f_bl, f_br);
          indices.push(b_tl, b_tr, b_bl, b_tr, b_br, b_bl);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setIndex(indices);
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.computeVertexNormals();
    meshRef.current = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, side: THREE.DoubleSide }));
    sceneRef.current.add(meshRef.current);
    setIsLoading(false);
  };

  useEffect(() => { if (image) generateLithophane(image); }, [image, thickness, baseThickness, resolution]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div><h1 className="text-4xl font-black italic text-white uppercase">LITHO LAB PRO</h1></div>
        <button disabled={!image} onClick={() => {
            if (!meshRef.current) return;
            const exporter = new STLExporter();
            const result = exporter.parse(meshRef.current, { binary: true });
            const blob = new Blob([(result as DataView).buffer], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `lithophane.stl`;
            link.click();
        }} className="bg-blue-600 px-8 py-4 rounded-3xl font-black shadow-xl uppercase italic">EXPORT STL</button>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 glass rounded-[48px] h-[500px] relative overflow-hidden bg-black/20">
          <div ref={mountRef} className="absolute inset-0" />
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => {
            const f = e.target.files?.[0];
            if(f) { const r = new FileReader(); r.onload = ev => setImage(ev.target?.result as string); r.readAsDataURL(f); }
          }} />
          {!image && <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 m-auto w-40 h-40 bg-white/5 rounded-full flex items-center justify-center border-dashed border-2 border-white/20"><Upload className="text-white"/></button>}
        </div>
        <div className="lg:col-span-4 space-y-6">
          <div className="glass rounded-[40px] p-8 space-y-8 bg-slate-900/40">
             <LithoSlider label="Thickness" value={thickness} min={2} max={6} step={0.1} onChange={setThickness} />
             <LithoSlider label="Resolution" value={resolution} min={50} max={250} step={10} onChange={setResolution} />
          </div>
        </div>
      </div>
    </div>
  );
};
const LithoSlider = ({ label, value, min, max, step = 1, onChange }: any) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center px-2">
      <label className="text-[10px] font-black uppercase text-slate-500 italic tracking-widest">{label}</label>
      <span className="text-blue-500 font-black italic text-lg">{value}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="modern-slider" />
  </div>
);
export default LithophaneCreator;