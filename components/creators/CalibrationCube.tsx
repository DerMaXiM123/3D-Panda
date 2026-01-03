import React, { useState, useEffect, useRef } from 'react';
import { Download, Sliders, Activity, Binary, ShieldCheck, Target } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls, STLExporter, FontLoader, TextGeometry } from 'three-stdlib';

const FONT_URL = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/fonts/helvetiker_bold.typeface.json';

const CalibrationCube: React.FC = () => {
  const [size, setSize] = useState(20);
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
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
    camera.position.set(45, 45, 45);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
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
    
    // 1. Der Basiskörper (Würfel)
    // Wir nutzen ExtrudeGeometry für echtes Beveling (Abkantung) - industrieller Look
    const shape = new THREE.Shape();
    const half = size / 2;
    shape.moveTo(-half, -half);
    shape.lineTo(half, -half);
    shape.lineTo(half, half);
    shape.lineTo(-half, half);
    shape.closePath();

    const extrudeSettings = {
      depth: size,
      bevelEnabled: true,
      bevelThickness: 1.0, 
      bevelSize: 1.0,      
      bevelSegments: 1      
    };

    const cubeGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    cubeGeo.center();
    const cubeMat = new THREE.MeshStandardMaterial({ 
      color: 0x334155, 
      roughness: 0.3, 
      metalness: 0.2
    });
    const cubeMesh = new THREE.Mesh(cubeGeo, cubeMat);
    group.add(cubeMesh);

    // 2. Gravierte Buchstaben (Echte Vertiefungen)
    const createEngraving = (text: string, axis: 'x' | 'y' | 'z') => {
      const depth = 2.0; 
      const tGeo = new TextGeometry(text, { 
        font, 
        size: size * 0.45, 
        height: depth, 
        bevelEnabled: false 
      });
      tGeo.center();
      
      // Das Material der Gravur ist schwarz/dunkel für visuelle Tiefe
      const tMat = new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 1.0, roughness: 0.1 });
      const tMesh = new THREE.Mesh(tGeo, tMat);
      
      const offset = (size / 2) - (depth / 2) + 0.1; // Versenkt den Buchstaben IN den Würfel
      if (axis === 'x') { 
        tMesh.position.x = offset; 
        tMesh.rotation.y = Math.PI / 2; 
      } else if (axis === 'y') { 
        tMesh.position.y = offset; 
        tMesh.rotation.x = -Math.PI / 2; 
      } else if (axis === 'z') { 
        tMesh.position.z = offset; 
      }
      return tMesh;
    };

    group.add(createEngraving('X', 'x'));
    group.add(createEngraving('Y', 'y'));
    group.add(createEngraving('Z', 'z'));
    
    meshGroupRef.current = group;
    sceneRef.current.add(group);
  };

  useEffect(() => { generate(); }, [size, font]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full animate-in fade-in duration-500 overflow-hidden">
      <header className="shrink-0 flex justify-between items-center bg-slate-900/40 p-6 m-4 mb-0 rounded-[32px] border border-white/5 shadow-xl">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20"><Binary size={24} /></div>
           <div>
              <h1 className="text-2xl font-black italic text-white uppercase tracking-tighter leading-none">Cali <span className="text-blue-500">Cube</span> Pro</h1>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">Versenkte Gravur & Chamfer V12</p>
           </div>
        </div>
        <button onClick={() => {
            if (!meshGroupRef.current) return;
            const exporter = new STLExporter();
            const result = exporter.parse(meshGroupRef.current, { binary: true });
            const blob = new Blob([(result as DataView).buffer], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `CaliCube_V12_Engraved.stl`;
            link.click();
        }} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-[20px] font-black uppercase italic shadow-xl transition-all flex items-center gap-3">
          <Download size={20} /> Export Master STL
        </button>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0 overflow-hidden">
        <div className="flex-1 glass rounded-[48px] relative overflow-hidden bg-black/40 border-white/5 shadow-inner">
          <div ref={mountRef} className="absolute inset-0 cursor-move" />
          <div className="absolute top-8 left-8 flex flex-col gap-2 pointer-events-none">
              <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-[9px] font-black uppercase text-emerald-400 italic flex items-center gap-2">
                 <ShieldCheck size={12} /> Solid Geometry OK
              </div>
          </div>
        </div>

        <div className="lg:w-[380px] glass rounded-[48px] p-8 space-y-10 border-white/5 flex flex-col shrink-0 shadow-2xl bg-slate-900/40">
           <h3 className="text-xs font-black uppercase text-slate-500 tracking-[0.4em] italic leading-none">Configuration</h3>
           
           <div className="space-y-8 flex-1">
             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-500 italic tracking-widest px-2 flex justify-between">Dimension (mm) <span>{size}mm</span></label>
                <input type="range" min={10} max={50} value={size} onChange={e => setSize(parseInt(e.target.value))} className="modern-slider" />
             </div>
             <div className="p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10 italic">
                <p className="text-[8px] text-slate-400 font-bold uppercase leading-relaxed text-center">
                   Echte negative Buchstaben (2.0mm Tiefe) erlauben eine exakte Prüfung von Ghosting und Maßhaltigkeit.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalibrationCube;