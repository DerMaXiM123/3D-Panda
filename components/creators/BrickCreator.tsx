import React, { useState, useEffect, useRef } from 'react';
import { Download, Box, Maximize2, Zap, Activity, Cpu, ShieldCheck, Database, Binary, Cog, Layers, Ruler, Radio, Gauge, Terminal as TerminalIcon } from 'lucide-react';
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
    <div className="flex flex-col h-full w-full bg-[#020617] overflow-hidden p-6 gap-6 animate-in fade-in duration-700">
      <header className="shrink-0 flex justify-between items-center bg-slate-900/40 p-5 rounded-[24px] border border-white/5 shadow-lg">
        <div>
          <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter leading-none">
             BRICK <span className="text-red-600">LAB</span>.
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest mt-1.5 italic opacity-60">LEGO® Precision Studio // V10.5</p>
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
          className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-[16px] font-black uppercase italic shadow-lg transition-all flex items-center gap-3 text-xs tracking-widest group"
        >
          <Download size={18} /> EXPORT STL
        </button>
      </header>

      <div className="flex-1 flex flex-col gap-6 min-h-0">
        <section className="flex-[4] grid lg:grid-cols-12 gap-6 min-h-0">
          <div className="lg:col-span-8 glass rounded-[40px] relative overflow-hidden bg-black/60 border-white/5 shadow-2xl h-full">
             <div ref={mountRef} className="absolute inset-0 cursor-crosshair" />
             <div className="absolute top-6 left-6 flex flex-col gap-2 pointer-events-none">
                <div className="bg-black/60 backdrop-blur-xl px-4 py-2 rounded-[16px] border border-yellow-500/20 text-[8px] font-black uppercase text-yellow-500 italic flex items-center gap-2 shadow-lg">
                   <Zap size={12} className="animate-pulse" /> Clutch High Power
                </div>
                <div className="bg-blue-600/10 backdrop-blur-xl px-4 py-2 rounded-[16px] border border-blue-500/20 text-[8px] font-black uppercase text-blue-400 italic flex items-center gap-2 shadow-lg">
                   <ShieldCheck size={12} /> Solid Mesh Engine OK
                </div>
             </div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-red-600/5 blur-[120px] pointer-events-none rounded-full" />
          </div>

          <div className="lg:col-span-4 glass rounded-[40px] p-8 space-y-8 border-white/5 bg-slate-900/40 flex flex-col overflow-y-auto scrollbar-hide shrink-0 shadow-2xl h-full">
             <div className="flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center text-red-500 border border-red-500/20">
                   <Maximize2 size={20} />
                </div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">Core Parameters</p>
             </div>
             
             <div className="space-y-10 flex-1">
                <div className="space-y-3">
                   <label className="text-[9px] font-black uppercase text-slate-500 flex justify-between px-1 tracking-widest italic">Stud Width <span>{width}x</span></label>
                   <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 4, 8].map(v => (
                        <button key={v} onClick={() => setWidth(v)} className={`py-3 rounded-lg text-xs font-black transition-all ${width === v ? 'bg-red-600 text-white shadow-lg scale-105' : 'bg-white/5 text-slate-600 hover:bg-white/10'}`}>{v}x</button>
                      ))}
                   </div>
                </div>
                <div className="space-y-3">
                   <label className="text-[9px] font-black uppercase text-slate-500 flex justify-between px-1 tracking-widest italic">Stud Length <span>{length}x</span></label>
                   <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 4, 6, 8, 12].map(v => (
                        <button key={v} onClick={() => setLength(v)} className={`py-3 rounded-lg text-xs font-black transition-all ${length === v ? 'bg-red-600 text-white shadow-lg scale-105' : 'bg-white/5 text-slate-600 hover:bg-white/10'}`}>{v}x</button>
                      ))}
                   </div>
                </div>
                <div className="space-y-3">
                   <label className="text-[9px] font-black uppercase text-slate-500 italic px-1 tracking-widest">Material Grade</label>
                   <div className="flex flex-wrap gap-2.5">
                      {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ffffff', '#18181b', '#a855f7'].map(c => (
                        <button key={c} onClick={() => setColorHex(c)} className={`w-9 h-9 rounded-lg border-2 transition-all ${colorHex === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'}`} style={{ backgroundColor: c }} />
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </section>

        <section className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0 mb-2 h-full min-h-[160px]">
           <StatCard icon={<Ruler size={28}/>} label="Dimensions" value={`${width*8}x${length*8}mm`} sub="9.60MM Z-HEIGHT" color="text-red-500" />
           <StatCard icon={<Binary size={28}/>} label="Resolution" value={`${SEGMENTS} SEG`} sub="HIGH_POLY_ACTIVE" color="text-blue-500" />
           <StatCard icon={<Gauge size={28}/>} label="CPU Load" value="Optimal" sub="SIM_CORE_V10.5" color="text-orange-500" />
           
           <div className="glass rounded-[32px] p-8 bg-slate-900/40 border-white/5 flex flex-col justify-center shadow-lg font-mono overflow-hidden relative group border-t border-white/10">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700">
                 <TerminalIcon size={120} />
              </div>
              <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest italic mb-2 flex items-center gap-2">
                 <Radio size={12} className="animate-pulse" /> Core Link
              </p>
              <div className="text-[11px] text-slate-400 font-bold uppercase truncate italic">
                 BRICK_PROTO_{width}X{length}_ACTIVE...
              </div>
              <div className="text-[9px] text-slate-600 font-mono mt-3 flex justify-between">
                 <span>TX: 0.8 GB/S</span>
                 <span>SYNC: NOMINAL</span>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, sub, color }: any) => (
  <div className="glass rounded-[32px] p-8 bg-slate-900/40 border-white/5 flex items-center gap-6 shadow-lg hover:bg-slate-900/60 transition-colors">
    <div className={`w-16 h-16 bg-white/5 rounded-[24px] flex items-center justify-center ${color} border border-white/10 shadow-inner`}>
       {icon}
    </div>
    <div>
       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">{label}</p>
       <p className="text-2xl font-black text-white italic uppercase mt-0.5">{value}</p>
       <p className="text-[8px] font-mono text-slate-600 mt-1 uppercase tracking-tighter">{sub}</p>
    </div>
  </div>
);

export default BrickCreator;
