
import React, { useState, useEffect, useRef } from 'react';
import { Download, Box, Maximize2, Zap, Activity, Cpu, ShieldCheck, Database, Binary, Cog, Layers, Ruler, Radio, Gauge, Terminal as TerminalIcon } from 'lucide-react';
// Fix: Consolidated duplicate imports and corrected reference source
import * as THREE from 'three';
import { OrbitControls, STLExporter } from 'three-stdlib';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const PITCH = 8.0;
const HEIGHT = 9.6; 
const STUD_H = 1.7;
const STUD_R = 2.4;
const WALL_T = 1.5; 
const TUBE_R_OUT = 3.255; 
const TUBE_R_IN = 2.4;    
const SEGMENTS = 128;     

const BrickCreator: React.FC = () => {
  const [width, setWidth] = useState(2);
  const [length, setLength] = useState(4);
  const [colorHex, setColorHex] = useState('#ef4444');
  
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(35, 16/9, 0.1, 2000);
    camera.position.set(100, 100, 150);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, logarithmicDepthBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dLight.position.set(100, 200, 100);
    scene.add(dLight);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const ro = new ResizeObserver(entries => {
      for (let e of entries) {
        if (!renderer || !camera) return;
        renderer.setSize(e.contentRect.width, e.contentRect.height);
        camera.aspect = e.contentRect.width / e.contentRect.height;
        camera.updateProjectionMatrix();
      }
    });
    ro.observe(mountRef.current);
    return () => { ro.disconnect(); renderer.dispose(); };
  }, []);

  const generateBrick = (w: number, l: number, color: string) => {
    if (!sceneRef.current) return;
    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
      meshRef.current.geometry.dispose();
    }
    
    const bW = w * PITCH;
    const bL = l * PITCH;
    const rawGeometries: THREE.BufferGeometry[] = [];
    
    const prepare = (g: THREE.BufferGeometry) => {
      const clean = g.index ? g.toNonIndexed() : g.clone();
      if (clean.hasAttribute('uv')) clean.deleteAttribute('uv');
      return clean;
    };

    const top = new THREE.BoxGeometry(bW, WALL_T, bL);
    top.translate(0, HEIGHT - WALL_T/2, 0);
    rawGeometries.push(prepare(top));

    const wallLong = new THREE.BoxGeometry(bW, HEIGHT - WALL_T, WALL_T);
    wallLong.translate(0, (HEIGHT - WALL_T)/2, (bL/2) - (WALL_T/2));
    rawGeometries.push(prepare(wallLong));
    const wallLong2 = wallLong.clone();
    wallLong2.translate(0, 0, -(bL - WALL_T));
    rawGeometries.push(prepare(wallLong2));

    const wallShort = new THREE.BoxGeometry(WALL_T, HEIGHT - WALL_T, bL - 2*WALL_T);
    wallShort.translate((bW/2) - (WALL_T/2), (HEIGHT - WALL_T)/2, 0);
    rawGeometries.push(prepare(wallShort));
    const wallShort2 = wallShort.clone();
    wallShort2.translate(-(bW - WALL_T), 0, 0);
    rawGeometries.push(prepare(wallShort2));

    const studGeo = new THREE.CylinderGeometry(STUD_R, STUD_R, STUD_H, SEGMENTS);
    for (let i = 0; i < w; i++) {
      for (let j = 0; j < l; j++) {
        const s = studGeo.clone();
        s.translate((i * PITCH) - (bW/2) + (PITCH/2), HEIGHT + STUD_H/2, (j * PITCH) - (bL/2) + (PITCH/2));
        rawGeometries.push(prepare(s));
      }
    }

    if (w > 1 && l > 1) {
      const tubeShape = new THREE.Shape();
      tubeShape.absarc(0, 0, TUBE_R_OUT, 0, Math.PI * 2, false);
      const holePath = new THREE.Path();
      holePath.absarc(0, 0, TUBE_R_IN, 0, Math.PI * 2, true);
      tubeShape.holes.push(holePath);

      const extrudeSettings = { depth: HEIGHT - WALL_T, bevelEnabled: false, curveSegments: SEGMENTS };
      const tubeGeo = new THREE.ExtrudeGeometry(tubeShape, extrudeSettings);
      tubeGeo.rotateX(Math.PI / 2);

      for (let i = 0; i < w - 1; i++) {
        for (let j = 0; j < l - 1; j++) {
          const t = tubeGeo.clone();
          const posX = ((i + 1) * PITCH) - (bW/2);
          const posZ = ((j + 1) * PITCH) - (bL/2);
          t.translate(posX, HEIGHT - WALL_T, posZ);
          rawGeometries.push(prepare(t));
        }
      }
    } else if ((w === 1 || l === 1) && (w + l > 2)) {
       const pinGeo = new THREE.CylinderGeometry(1.5, 1.5, HEIGHT - WALL_T, 32);
       const count = Math.max(w, l) - 1;
       for (let i = 0; i < count; i++) {
          const p = pinGeo.clone();
          const offset = ((i + 1) * PITCH) - (Math.max(bW, bL)/2);
          if (w > l) p.translate(offset, (HEIGHT - WALL_T)/2, 0);
          else p.translate(0, (HEIGHT - WALL_T)/2, offset);
          rawGeometries.push(prepare(p));
       }
    }

    let merged = BufferGeometryUtils.mergeGeometries(rawGeometries);
    merged = BufferGeometryUtils.mergeVertices(merged, 0.0001); 
    merged.computeVertexNormals();
    
    meshRef.current = new THREE.Mesh(merged, new THREE.MeshStandardMaterial({ 
      color, 
      roughness: 0.2, 
      metalness: 0.1,
      side: THREE.DoubleSide
    }));
    sceneRef.current.add(meshRef.current);
    rawGeometries.forEach(g => g.dispose());
  };

  useEffect(() => { generateBrick(width, length, colorHex); }, [width, length, colorHex]);

  return (
    <div className="flex flex-col h-full w-full bg-[#020617] overflow-hidden p-6 lg:p-10 gap-6 lg:gap-10 animate-in fade-in duration-700">
      <header className="shrink-0 flex justify-between items-center bg-slate-900/40 p-6 rounded-[32px] border border-white/5 shadow-lg w-full">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter leading-none">
             BRICK <span className="text-red-600">LAB</span>.
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest mt-2 italic opacity-60">Precision Geometries Unlimited</p>
        </div>
        <button 
          onClick={() => {
            if (!meshRef.current) return;
            const exporter = new STLExporter();
            const res = exporter.parse(meshRef.current, { binary: true });
            const blob = new Blob([(res as DataView).buffer], { type: 'application/octet-stream' });
            const link = document.createElement('a'); 
            link.href = URL.createObjectURL(blob);
            link.download = `PrecisionBrick_${width}x${length}.stl`; 
            link.click();
          }} 
          className="bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-[20px] font-black uppercase italic shadow-xl transition-all flex items-center gap-4 text-xs tracking-widest"
        >
          <Download size={20} /> EXPORT STL
        </button>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 lg:gap-10 min-h-0 w-full">
        <div className="flex-1 glass rounded-[48px] lg:rounded-[64px] relative overflow-hidden bg-black/60 border-white/5 shadow-2xl h-full">
           <div ref={mountRef} className="absolute inset-0 cursor-crosshair" />
           <div className="absolute top-8 left-8 flex flex-col gap-3 pointer-events-none">
              <div className="bg-black/60 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-yellow-500/20 text-[10px] font-black uppercase text-yellow-500 italic flex items-center gap-2 shadow-lg">
                 <Zap size={14} className="animate-pulse" /> Precision Engine Active
              </div>
           </div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-red-600/5 blur-[120px] pointer-events-none rounded-full opacity-50" />
        </div>

        <div className="lg:w-[450px] glass rounded-[48px] lg:rounded-[64px] p-10 space-y-12 border-white/5 bg-slate-900/40 flex flex-col overflow-y-auto scrollbar-hide shrink-0 shadow-2xl h-full">
           <div className="flex items-center gap-4 shrink-0">
              <div className="w-14 h-14 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-500 border border-red-500/20 shadow-inner">
                 <Maximize2 size={28} />
              </div>
              <p className="text-[11px] font-black uppercase text-slate-500 tracking-[0.3em] italic">Engineering Node</p>
           </div>
           
           <div className="space-y-12 flex-1">
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-slate-500 flex justify-between px-2 tracking-widest italic">Stud Width <span>{width}x</span></label>
                 <div className="grid grid-cols-4 gap-3">
                    {[1, 2, 4, 8].map(v => (
                      <button key={v} onClick={() => setWidth(v)} className={`py-4 rounded-2xl text-sm font-black transition-all ${width === v ? 'bg-red-600 text-white shadow-xl scale-105' : 'bg-white/5 text-slate-600 hover:bg-white/10'}`}>{v}x</button>
                    ))}
                 </div>
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-slate-500 flex justify-between px-2 tracking-widest italic">Stud Length <span>{length}x</span></label>
                 <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 4, 6, 8, 12].map(v => (
                      <button key={v} onClick={() => setLength(v)} className={`py-4 rounded-2xl text-sm font-black transition-all ${length === v ? 'bg-red-600 text-white shadow-xl scale-105' : 'bg-white/5 text-slate-600 hover:bg-white/10'}`}>{v}x</button>
                    ))}
                 </div>
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-slate-500 italic px-2 tracking-widest">Material Grade</label>
                 <div className="flex flex-wrap gap-3.5">
                    {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ffffff', '#18181b', '#a855f7'].map(c => (
                      <button key={c} onClick={() => setColorHex(c)} className={`w-11 h-11 rounded-2xl border-2 transition-all ${colorHex === c ? 'border-white scale-110 shadow-xl' : 'border-transparent opacity-40 hover:opacity-100'}`} style={{ backgroundColor: c }} />
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default BrickCreator;
