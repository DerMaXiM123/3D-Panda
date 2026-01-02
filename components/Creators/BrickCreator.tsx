import React, { useState, useEffect, useRef } from 'react';
import { Download, Box, Maximize2, Zap, Award } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls, STLExporter } from 'three-stdlib';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const STUD_PITCH = 8.0;
const BRICK_HEIGHT = 9.6; 
const STUD_HEIGHT = 1.7;
const STUD_RADIUS = 2.4;
const WALL_THICKNESS = 1.2;

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
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(50, -50, 80);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const dLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dLight.position.set(30, 60, 40);
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

    const bW = w * STUD_PITCH;
    const bL = l * STUD_PITCH;
    const rawGeometries: THREE.BufferGeometry[] = [];

    const prepare = (g: THREE.BufferGeometry) => {
      const nonIndexed = g.index ? g.toNonIndexed() : g.clone();
      if (nonIndexed.hasAttribute('uv')) nonIndexed.deleteAttribute('uv');
      if (nonIndexed.hasAttribute('uv2')) nonIndexed.deleteAttribute('uv2');
      return nonIndexed;
    };

    const EPS = 0.05;
    const sideLong1 = new THREE.BoxGeometry(bW, BRICK_HEIGHT, WALL_THICKNESS + EPS);
    sideLong1.translate(0, BRICK_HEIGHT / 2, (bL / 2) - (WALL_THICKNESS / 2));
    rawGeometries.push(prepare(sideLong1));
    const sideLong2 = sideLong1.clone();
    sideLong2.translate(0, 0, -(bL - WALL_THICKNESS));
    rawGeometries.push(prepare(sideLong2));
    const sideShort1 = new THREE.BoxGeometry(WALL_THICKNESS + EPS, BRICK_HEIGHT, bL - (2 * WALL_THICKNESS) + (2 * EPS));
    sideShort1.translate((bW / 2) - (WALL_THICKNESS / 2), BRICK_HEIGHT / 2, 0);
    rawGeometries.push(prepare(sideShort1));
    const sideShort2 = sideShort1.clone();
    sideShort2.translate(-(bW - WALL_THICKNESS), 0, 0);
    rawGeometries.push(prepare(sideShort2));
    const topPlate = new THREE.BoxGeometry(bW, WALL_THICKNESS, bL);
    topPlate.translate(0, BRICK_HEIGHT - (WALL_THICKNESS / 2), 0);
    rawGeometries.push(prepare(topPlate));

    const studGeo = new THREE.CylinderGeometry(STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, 32);
    for (let i = 0; i < w; i++) {
      for (let j = 0; j < l; j++) {
        const s = studGeo.clone();
        s.translate((i * STUD_PITCH) - (bW / 2) + (STUD_PITCH / 2), BRICK_HEIGHT + (STUD_HEIGHT / 2) - EPS, (j * STUD_PITCH) - (bL / 2) + (STUD_PITCH / 2));
        rawGeometries.push(prepare(s));
      }
    }

    if (w > 1 || l > 1) {
      const outerRadius = 3.25; 
      const innerRadius = 2.45;
      const pinHeight = BRICK_HEIGHT - WALL_THICKNESS; 
      for (let i = 0; i < w - 1; i++) {
        for (let j = 0; j < l - 1; j++) {
          const tubeShape = new THREE.Shape();
          tubeShape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
          const holePath = new THREE.Path();
          holePath.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
          tubeShape.holes.push(holePath);
          const extrudeSettings = { depth: pinHeight + EPS, bevelEnabled: false, curveSegments: 32 };
          const tubeGeo = new THREE.ExtrudeGeometry(tubeShape, extrudeSettings);
          tubeGeo.rotateX(Math.PI / 2);
          tubeGeo.translate((i * STUD_PITCH) - (bW / 2) + STUD_PITCH, pinHeight, (j * STUD_PITCH) - (bL / 2) + STUD_PITCH);
          rawGeometries.push(prepare(tubeGeo));
        }
      }
    }

    let merged = BufferGeometryUtils.mergeGeometries(rawGeometries);
    merged = BufferGeometryUtils.mergeVertices(merged, 0.0001); 
    merged.computeVertexNormals();
    meshRef.current = new THREE.Mesh(merged, new THREE.MeshStandardMaterial({ color, roughness: 0.05, metalness: 0.05 }));
    sceneRef.current.add(meshRef.current);
    rawGeometries.forEach(g => g.dispose());
  };

  useEffect(() => { generateBrick(width, length, colorHex); }, [width, length, colorHex]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black italic text-white flex items-center gap-3">
            <Box className="text-red-500" size={36} /> Brick-Studio <span className="text-red-500">PRO</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1 italic flex items-center gap-2">
            <Award size={14} className="text-yellow-500" /> V6.0: MASTER GRADE PRINT PROFILES
          </p>
        </div>
        <button 
          disabled={!meshRef.current}
          onClick={() => {
            if (!meshRef.current) return;
            const exporter = new STLExporter();
            const result = exporter.parse(meshRef.current, { binary: true });
            const blob = new Blob([(result as DataView).buffer], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `brick_${width}x${length}.stl`;
            link.click();
          }} className="bg-red-600 text-white px-8 py-4 rounded-3xl font-black flex items-center gap-3 shadow-2xl hover:scale-105 transition-transform">
           <Download size={20} /> MASTER GRADE EXPORT
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 glass rounded-[48px] h-[550px] relative overflow-hidden border border-white/5 bg-black/20">
          <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
          <div className="absolute top-6 left-6 flex flex-col gap-2">
             <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[8px] font-black uppercase text-yellow-400 italic flex items-center gap-1.5">
               <Zap size={10} /> QUALITY: HIGH SAMPLES
             </div>
             <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[8px] font-black uppercase text-green-400 italic">PRECISION: 0.0001mm</div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="glass rounded-[40px] p-8 space-y-8 border-white/10">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest italic flex items-center gap-2">
              <Maximize2 size={16} className="text-red-500" /> Dimensionen
            </h3>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 flex justify-between">Breite <span>{width}x</span></label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 4, 8].map(v => (
                    <button key={v} onClick={() => setWidth(v)} className={`py-3 rounded-2xl text-xs font-black transition-all ${width === v ? 'bg-red-600 text-white shadow-lg' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>{v}x</button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 flex justify-between">Länge <span>{length}x</span></label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 4, 6, 8, 12].map(v => (
                    <button key={v} onClick={() => setLength(v)} className={`py-3 rounded-2xl text-xs font-black transition-all ${length === v ? 'bg-red-600 text-white shadow-lg' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>{v}x</button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500">Farbe</label>
                <div className="flex flex-wrap gap-3">
                  {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ffffff', '#18181b'].map(c => (
                    <button key={c} onClick={() => setColorHex(c)} className={`w-10 h-10 rounded-full border-2 transition-all ${colorHex === c ? 'border-white' : 'border-transparent opacity-50'}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrickCreator;