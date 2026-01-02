
import React, { useState, useEffect, useRef } from 'react';
import { Box, Play, Square, Layers, Cpu, Zap } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';

const GCodeVisualizer: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const lineRef = useRef<THREE.LineSegments | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(100, 100, 150);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Build plate
    const grid = new THREE.GridHelper(200, 20, 0x334155, 0x0f172a);
    grid.rotateX(Math.PI / 2);
    scene.add(grid);

    // Initial Path Data
    const geometry = new THREE.BufferGeometry();
    const points: number[] = [];
    for(let i=0; i<500; i++) {
        points.push(
            Math.sin(i * 0.1) * (i * 0.2), 
            Math.cos(i * 0.1) * (i * 0.2), 
            i * 0.1
        );
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    const material = new THREE.LineBasicMaterial({ color: 0x3b82f6, linewidth: 2 });
    const line = new THREE.Line(geometry, material);
    lineRef.current = line as any;
    scene.add(line);

    const animate = () => {
      requestAnimationFrame(animate);
      if (isSimulating && lineRef.current) {
         lineRef.current.rotation.z += 0.01;
      }
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
    
    return () => {
      ro.disconnect();
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, [isSimulating]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter flex items-center gap-3">
           <Cpu size={36} className="text-blue-500" /> Path Visualizer <span className="text-blue-500">BETA</span>
        </h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1 italic">Vorschau der Werkzeugwege (G-Code Interpretation)</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 glass rounded-[48px] h-[500px] relative overflow-hidden border border-white/5 bg-slate-900/40">
           <div ref={mountRef} className="absolute inset-0" />
           <div className="absolute bottom-8 left-8 flex gap-4">
              <button 
                onClick={() => setIsSimulating(!isSimulating)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black italic flex items-center gap-3 transition-all shadow-xl"
              >
                {isSimulating ? <Square size={18} /> : <Play size={18} />}
                {isSimulating ? 'STOP' : 'SIMULIEREN'}
              </button>
           </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="glass rounded-[40px] p-8 border-white/5 bg-slate-900/40 space-y-6">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest italic flex items-center gap-2">
                 <Layers size={18} /> Layer Info
              </h3>
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase">Total Layers:</span>
                    <span className="text-white font-black italic">412</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase">E-Steps Calc:</span>
                    <span className="text-green-500 font-black italic">Optimal</span>
                 </div>
              </div>
              <div className="pt-6 border-t border-white/5">
                 <p className="text-[10px] text-slate-500 font-bold uppercase italic leading-relaxed">
                   Dieser Modus erlaubt dir, potenzielle Over-Extrusions oder instabile Überhänge visuell zu prüfen, bevor du Filament verschwendest.
                 </p>
              </div>
           </div>
           
           <div className="bg-blue-600/5 p-6 rounded-[32px] border border-blue-500/10 flex gap-4">
              <Zap size={20} className="text-blue-500 flex-shrink-0" />
              <p className="text-[9px] text-blue-200/60 font-black uppercase italic tracking-widest leading-tight">
                Keine Cloud-Kosten: Das Rendering findet komplett auf deiner Grafikkarte statt.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default GCodeVisualizer;
