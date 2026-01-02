import React, { useState, useEffect, useRef } from 'react';
import { Download, Type, Sliders, Zap, AlignLeft, RefreshCw } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls, STLExporter, FontLoader, TextGeometry } from 'three-stdlib';

const FONT_URL = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/fonts/helvetiker_bold.typeface.json';

const SignCreator: React.FC = () => {
  const [text, setText] = useState('MAKER HUB');
  const [width, setWidth] = useState(150);
  const [height, setHeight] = useState(50);
  const [depth, setDepth] = useState(3);
  const [textDepth, setTextDepth] = useState(2);
  const [rounded, setRounded] = useState(8);
  const [font, setFont] = useState<any>(null);
  const [isLoadingFont, setIsLoadingFont] = useState(true);
  
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const loader = new FontLoader();
    loader.load(FONT_URL, (loadedFont) => {
      setFont(loadedFont);
      setIsLoadingFont(false);
    });
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 100, 150);
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

  const generateSign = () => {
    if (!sceneRef.current || !font) return;
    if (meshRef.current) sceneRef.current.remove(meshRef.current);
    const group = new THREE.Group();
    const shape = new THREE.Shape();
    const x = -width / 2; const y = -height / 2; const r = rounded;
    shape.moveTo(x + r, y); shape.lineTo(x + width - r, y); shape.quadraticCurveTo(x + width, y, x + width, y + r);
    shape.lineTo(x + width, y + height - r); shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    shape.lineTo(x + r, y + height); shape.quadraticCurveTo(x, y + height, x, y + height - r);
    shape.lineTo(x, y + r); shape.quadraticCurveTo(x, y, x + r, y);
    const extrudeSettings = { depth: depth, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5 };
    const plateGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    plateGeo.rotateX(Math.PI / 2);
    const plate = new THREE.Mesh(plateGeo, new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    group.add(plate);

    if (text.trim().length > 0) {
      const textGeo = new TextGeometry(text, {
        font: font, 
        size: height * 0.5, 
        height: textDepth, 
        curveSegments: 12,
        bevelEnabled: true, 
        bevelThickness: 0.2, 
        bevelSize: 0.1
      });
      textGeo.center();
      const textMesh = new THREE.Mesh(textGeo, new THREE.MeshStandardMaterial({ color: 0x3b82f6 }));
      textMesh.rotation.x = -Math.PI / 2;
      textMesh.position.y = depth + (textDepth / 2);
      group.add(textMesh);
    }
    meshRef.current = group;
    sceneRef.current.add(group);
  };

  useEffect(() => { if (font) generateSign(); }, [text, width, height, depth, textDepth, rounded, font]);

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter flex items-center gap-4">SIGN <span className="text-blue-500">STUDIO</span>.</h1>
        </div>
        <button 
          onClick={() => {
            if (!meshRef.current) return;
            const exporter = new STLExporter();
            const result = exporter.parse(meshRef.current, { binary: true });
            const blob = new Blob([(result as DataView).buffer], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `label_${text}.stl`;
            link.click();
          }} className="bg-blue-600 text-white px-10 py-5 rounded-[28px] font-black uppercase italic shadow-xl">
          <Download size={24} /> DOWNLOAD STL
        </button>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 glass rounded-[56px] h-[550px] relative overflow-hidden bg-black/20">
          <div ref={mountRef} className="absolute inset-0 cursor-move" />
          {isLoadingFont && <div className="absolute inset-0 flex items-center justify-center bg-black/40"><RefreshCw className="animate-spin text-blue-500" /></div>}
        </div>
        <div className="lg:col-span-4 space-y-8">
          <div className="glass rounded-[48px] p-10 space-y-6 bg-slate-900/40">
             <input type="text" maxLength={20} value={text} onChange={e => setText(e.target.value.toUpperCase())} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white uppercase" />
             <SignSlider label="Breite" value={width} min={50} max={300} onChange={setWidth} />
             <SignSlider label="Höhe" value={height} min={20} max={150} onChange={setHeight} />
          </div>
        </div>
      </div>
    </div>
  );
};
const SignSlider = ({ label, value, min, max, step = 1, onChange }: any) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center px-2">
      <label className="text-[10px] font-black uppercase text-slate-500 italic">{label}</label>
      <span className="text-blue-500 font-black italic">{value}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="modern-slider" />
  </div>
);
export default SignCreator;