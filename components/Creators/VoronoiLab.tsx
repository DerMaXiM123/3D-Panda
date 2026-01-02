import React, { useState, useEffect, useRef } from 'react';
import { Download, Fingerprint, Sliders, Zap, RefreshCw, Box } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls, STLExporter } from 'three-stdlib';

const VoronoiLab: React.FC = () => {
  const [density, setDensity] = useState(90); 
  const [complexity, setComplexity] = useState(3); 
  const [thickness, setThickness] = useState(2.5);
  const [radius, setRadius] = useState(50);
  const [seed, setSeed] = useState(1337);
  const [shape, setShape] = useState<'sphere' | 'box'>('sphere');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene(); sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000); camera.position.set(150, 150, 150);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dLight = new THREE.DirectionalLight(0xffffff, 1.2); dLight.position.set(1, 1, 1); scene.add(dLight);
    const animate = () => { requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); };
    animate();
    const ro = new ResizeObserver(() => {
      if (!mountRef.current) return;
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
    });
    ro.observe(mountRef.current);
    return () => { ro.disconnect(); renderer.dispose(); };
  }, []);

  const generateLattice = async () => {
    if (!sceneRef.current) return;
    setIsGenerating(true); await new Promise(r => setTimeout(r, 100));
    if (meshGroupRef.current) sceneRef.current.remove(meshGroupRef.current);
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3, metalness: 0.6, side: THREE.DoubleSide });
    let baseGeo = shape === 'sphere' ? new THREE.IcosahedronGeometry(radius, complexity) : new THREE.BoxGeometry(radius*1.4, radius*1.4, radius*1.4, complexity*3, complexity*3, complexity*3);
    const pos = baseGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const val = Math.sin(i * 0.13 + seed) * (radius * 0.1);
        pos.setXYZ(i, pos.getX(i) + val, pos.getY(i) + val, pos.getZ(i) + val);
    }
    baseGeo.computeVertexNormals();
    const wireframe = new THREE.WireframeGeometry(baseGeo);
    const linePos = wireframe.attributes.position;
    for (let i = 0; i < linePos.count; i += 2) {
      if (Math.random() > (density/100)) continue;
      const vS = new THREE.Vector3(linePos.getX(i), linePos.getY(i), linePos.getZ(i));
      const vE = new THREE.Vector3(linePos.getX(i+1), linePos.getY(i+1), linePos.getZ(i+1));
      const dist = vS.distanceTo(vE); if (dist < 0.5) continue;
      const cG = new THREE.CylinderGeometry(thickness, thickness, dist, 6);
      cG.translate(0, dist / 2, 0); cG.rotateX(Math.PI / 2);
      const cyl = new THREE.Mesh(cG, material); cyl.position.copy(vS); cyl.lookAt(vE);
      group.add(cyl);
    }
    meshGroupRef.current = group; sceneRef.current.add(group);
    setIsGenerating(false);
  };

  useEffect(() => { generateLattice(); }, [density, complexity, thickness, radius, seed, shape]);

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="flex justify-between items-end">
        <div><h1 className="text-6xl font-black italic text-white uppercase">VORONOI LAB</h1></div>
        <button onClick={() => {
            if (!meshGroupRef.current) return;
            const exporter = new STLExporter();
            const result = exporter.parse(meshGroupRef.current, { binary: true });
            const blob = new Blob([(result as DataView).buffer], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `voronoi.stl`;
            link.click();
        }} className="bg-indigo-600 px-10 py-5 rounded-[28px] font-black uppercase italic shadow-xl hover:scale-105 transition-transform">
          <Download className="inline mr-2" size={20}/> EXPORT STL
        </button>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 glass rounded-[56px] h-[600px] relative overflow-hidden bg-slate-900/20 group">
          <div ref={mountRef} className="absolute inset-0 cursor-move" />
          {isGenerating && <div className="absolute inset-0 flex items-center justify-center bg-black/40"><RefreshCw className="animate-spin text-white" size={48}/></div>}
        </div>
        <div className="lg:col-span-4 space-y-8">
          <div className="glass rounded-[48px] p-10 space-y-10 bg-slate-900/40">
             <VoroSlider label="Dichte" value={density} min={10} max={100} onChange={setDensity} />
             <VoroSlider label="Komplexität" value={complexity} min={1} max={5} onChange={setComplexity} />
             <VoroSlider label="Dicke" value={thickness} min={0.5} max={5} step={0.5} onChange={setThickness} />
          </div>
        </div>
      </div>
    </div>
  );
};
const VoroSlider = ({ label, value, min, max, step = 1, onChange }: any) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center px-2">
      <label className="text-[10px] font-black uppercase text-slate-500 italic tracking-widest">{label}</label>
      <span className="text-indigo-500 font-black italic text-lg">{value}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="modern-slider" />
  </div>
);
export default VoronoiLab;