import React, { useState, useEffect, useRef } from 'react';
import { Download, Box, Type, Sliders, Zap, Ruler } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls, STLExporter, FontLoader, TextGeometry } from 'three-stdlib';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const FONT_URL = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/fonts/helvetiker_bold.typeface.json';

const CalibrationCube: React.FC = () => {
  const [size, setSize] = useState(20);
  const [textX, setTextX] = useState('X');
  const [textY, setTextY] = useState('Y');
  const [textZ, setTextZ] = useState('Z');
  const [font, setFont] = useState<any>(null);

  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const loader = new FontLoader();
    loader.load(FONT_URL, (f) => setFont(f));
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(40, 40, 40);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dLight.position.set(50, 50, 50);
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

  const generate = () => {
    if (!sceneRef.current || !font) return;
    if (meshGroupRef.current) sceneRef.current.remove(meshGroupRef.current);
    
    const group = new THREE.Group();
    const cubeMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.2, metalness: 0.4 });
    const textMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

    // Main Body
    const cubeGeo = new THREE.BoxGeometry(size, size, size);
    const cubeMesh = new THREE.Mesh(cubeGeo, cubeMat);
    group.add(cubeMesh);

    const createText = (text: string, axis: 'x' | 'y' | 'z') => {
      const tGeo = new TextGeometry(text, { font, size: size * 0.5, height: 1.5, bevelEnabled: false });
      tGeo.center();
      const tMesh = new THREE.Mesh(tGeo, textMat);
      if (axis === 'x') {
        tMesh.position.x = size / 2;
        tMesh.rotation.y = Math.PI / 2;
      } else if (axis === 'y') {
        tMesh.position.y = size / 2;
        tMesh.rotation.x = -Math.PI / 2;
      } else if (axis === 'z') {
        tMesh.position.z = size / 2;
      }
      return tMesh;
    };

    group.add(createText(textX, 'x'));
    group.add(createText(textY, 'y'));
    group.add(createText(textZ, 'z'));

    meshGroupRef.current = group;
    sceneRef.current.add(group);
  };

  useEffect(() => { generate(); }, [size, textX, textY, textZ, font]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">PANDA <span className="text-blue-500">CUBE</span></h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1 italic">Parametric Calibration Engine</p>
        </div>
        <button onClick={() => {
            if (!meshGroupRef.current) return;
            const exporter = new STLExporter();
            const result = exporter.parse(meshGroupRef.current, { binary: true });
            const blob = new Blob([(result as DataView).buffer], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `calibration_cube_${size}mm.stl`;
            link.click();
        }} className="bg-blue-600 px-8 py-4 rounded-3xl font-black uppercase italic shadow-xl">EXPORT STL</button>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 glass rounded-[48px] h-[550px] relative overflow-hidden bg-black/20">
          <div ref={mountRef} className="absolute inset-0" />
        </div>
        <div className="lg:col-span-4 space-y-6">
          <div className="glass rounded-[40px] p-8 space-y-8 bg-slate-900/40">
             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-500 italic tracking-widest">Dimension (mm)</label>
                <div className="flex items-center gap-4">
                  <span className="text-blue-500 font-black italic text-lg">{size}mm</span>
                  <input type="range" min={10} max={50} value={size} onChange={e => setSize(parseInt(e.target.value))} className="modern-slider" />
                </div>
             </div>
             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-500 italic tracking-widest">Labels</label>
                <div className="grid grid-cols-3 gap-2">
                   <input maxLength={2} value={textX} onChange={e => setTextX(e.target.value.toUpperCase())} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center font-black uppercase" placeholder="X" />
                   <input maxLength={2} value={textY} onChange={e => setTextY(e.target.value.toUpperCase())} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center font-black uppercase" placeholder="Y" />
                   <input maxLength={2} value={textZ} onChange={e => setTextZ(e.target.value.toUpperCase())} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center font-black uppercase" placeholder="Z" />
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalibrationCube;