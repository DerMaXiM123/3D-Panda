import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Download, Archive, Sliders, Zap, Box, Disc, Shield, Maximize2, ArrowUp, Info, Eye } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls, STLExporter } from 'three-stdlib';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const ContainerForge: React.FC = () => {
  const [size, setSize] = useState(40);
  const [height, setHeight] = useState(60);
  const [wallThickness, setWallThickness] = useState(3.0);
  const [tolerance, setTolerance] = useState(0.2);
  const [viewMode, setViewMode] = useState<'both' | 'box' | 'lid'>('both');
  const [isXRay, setIsXRay] = useState(false);
  
  const neckRadius = useMemo(() => size * 0.85, [size]);
  const innerRadius = useMemo(() => neckRadius - wallThickness, [neckRadius, wallThickness]);

  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(110, 140, 110);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(50, 100, 50);
    scene.add(mainLight);
    
    const backLight = new THREE.PointLight(0x3b82f6, 0.8);
    backLight.position.set(-50, 20, -50);
    scene.add(backLight);

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
    
    return () => { 
      ro.disconnect(); 
      renderer.dispose(); 
    };
  }, []);

  const normalizeGeo = (geo: THREE.BufferGeometry): THREE.BufferGeometry => {
    const clean = geo.toNonIndexed();
    const toDelete = ['uv', 'uv2', 'color', 'tangent', 'bitangent'];
    toDelete.forEach(attr => {
      if (clean.hasAttribute(attr)) clean.deleteAttribute(attr);
    });
    clean.computeVertexNormals();
    return clean;
  };

  const createThread = (diameter: number, h: number, pitch: number, internal: boolean) => {
    const segments = 64;
    const turns = h / pitch;
    const vertices: number[] = [];
    const depth = 1.6;

    for (let i = 0; i < turns * segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const nextAngle = ((i + 1) / segments) * Math.PI * 2;
      const progress = i / (turns * segments);
      const nextProgress = (i + 1) / (turns * segments);
      
      const y = progress * h;
      const nextY = nextProgress * h;
      
      const taper = progress < 0.1 ? progress / 0.1 : (progress > 0.9 ? (1 - progress) / 0.1 : 1);
      const nextTaper = nextProgress < 0.1 ? nextProgress / 0.1 : (nextProgress > 0.9 ? (1 - nextProgress) / 0.1 : 1);

      const rBase = diameter / 2;
      const rPeak = internal ? (rBase - depth * taper) : (rBase + depth * taper);
      const nextRPeak = internal ? (rBase - depth * nextTaper) : (rBase + depth * nextTaper);

      const p1 = new THREE.Vector3(Math.cos(angle) * rBase, y, Math.sin(angle) * rBase);
      const p2 = new THREE.Vector3(Math.cos(angle) * rPeak, y + pitch * 0.4, Math.sin(angle) * rPeak);
      const p3 = new THREE.Vector3(Math.cos(angle) * rBase, y + pitch * 0.8, Math.sin(angle) * rBase);

      const n1 = new THREE.Vector3(Math.cos(nextAngle) * rBase, nextY, Math.sin(nextAngle) * rBase);
      const n2 = new THREE.Vector3(Math.cos(nextAngle) * nextRPeak, nextY + pitch * 0.4, Math.sin(nextAngle) * nextRPeak);
      const n3 = new THREE.Vector3(Math.cos(nextAngle) * rBase, nextY + pitch * 0.8, Math.sin(nextAngle) * rBase);

      vertices.push(p1.x, p1.y, p1.z, n1.x, n1.y, n1.z, p2.x, p2.y, p2.z);
      vertices.push(n1.x, n1.y, n1.z, n2.x, n2.y, n2.z, p2.x, p2.y, p2.z);
      vertices.push(p2.x, p2.y, p2.z, n2.x, n2.y, n2.z, p3.x, p3.y, p3.z);
      vertices.push(n2.x, n2.y, n2.z, n3.x, n3.y, n3.z, p3.x, p3.y, p3.z);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.computeVertexNormals();
    return geo;
  };

  const generate = () => {
    if (!sceneRef.current) return;
    if (meshGroupRef.current) {
        meshGroupRef.current.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
            }
        });
        sceneRef.current.remove(meshGroupRef.current);
    }

    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0x1e293b, roughness: 0.3, metalness: 0.7, side: THREE.DoubleSide,
      transparent: isXRay, opacity: isXRay ? 0.4 : 1.0 
    });
    const lidMat = new THREE.MeshStandardMaterial({ 
      color: 0x2563eb, roughness: 0.2, metalness: 0.5, side: THREE.DoubleSide,
      transparent: isXRay, opacity: isXRay ? 0.4 : 1.0 
    });

    const threadH = 15;

    if (viewMode === 'both' || viewMode === 'box') {
      try {
        const boxParts: THREE.BufferGeometry[] = [];
        const bottom = normalizeGeo(new THREE.CylinderGeometry(size, size, wallThickness, 6));
        bottom.translate(0, wallThickness/2, 0);
        boxParts.push(bottom);

        const wallShape = new THREE.Shape();
        for(let i=0; i<6; i++) {
          const a = (i/6)*Math.PI*2;
          wallShape[i===0?'moveTo':'lineTo'](Math.cos(a)*size, Math.sin(a)*size);
        }
        const hole = new THREE.Path();
        hole.absarc(0, 0, innerRadius, 0, Math.PI*2, true);
        wallShape.holes.push(hole);

        const wallH = height - threadH - wallThickness;
        const wallGeo = normalizeGeo(new THREE.ExtrudeGeometry(wallShape, { depth: wallH, bevelEnabled: false }));
        wallGeo.rotateX(Math.PI/2);
        wallGeo.translate(0, wallH/2 + wallThickness, 0);
        boxParts.push(wallGeo);

        const neckShape = new THREE.Shape();
        neckShape.absarc(0, 0, neckRadius, 0, Math.PI*2, false);
        const neckHole = new THREE.Path();
        neckHole.absarc(0, 0, innerRadius, 0, Math.PI*2, true);
        neckShape.holes.push(neckHole);
        const neckGeo = normalizeGeo(new THREE.ExtrudeGeometry(neckShape, { depth: threadH, bevelEnabled: false }));
        neckGeo.rotateX(Math.PI/2);
        neckGeo.translate(0, wallH + wallThickness + threadH/2, 0);
        boxParts.push(neckGeo);

        const tGeo = normalizeGeo(createThread(neckRadius*2, threadH, 3.5, false));
        tGeo.translate(0, wallH + wallThickness, 0);
        boxParts.push(tGeo);

        const finalBoxGeo = BufferGeometryUtils.mergeGeometries(boxParts);
        group.add(new THREE.Mesh(finalBoxGeo, bodyMat));
      } catch (e) {}
    }

    if (viewMode === 'both' || viewMode === 'lid') {
      try {
        const lidParts: THREE.BufferGeometry[] = [];
        const lidRadius = size + 2;
        const lidH = threadH + 5;
        const lidInner = neckRadius + tolerance;

        const cap = normalizeGeo(new THREE.CylinderGeometry(lidRadius, lidRadius, 4, 6));
        cap.translate(0, lidH + 2, 0);
        lidParts.push(cap);

        const lShape = new THREE.Shape();
        for(let i=0; i<6; i++) {
          const a = (i/6)*Math.PI*2;
          lShape[i===0?'moveTo':'lineTo'](Math.cos(a)*lidRadius, Math.sin(a)*lidRadius);
        }
        const lHole = new THREE.Path();
        lHole.absarc(0, 0, lidInner + 1.5, 0, Math.PI*2, true);
        lShape.holes.push(lHole);
        const lWall = normalizeGeo(new THREE.ExtrudeGeometry(lShape, { depth: lidH, bevelEnabled: false }));
        lWall.rotateX(Math.PI/2);
        lWall.translate(0, lidH/2, 0);
        lidParts.push(lWall);

        const itGeo = normalizeGeo(createThread(lidInner*2, threadH, 3.5, true));
        itGeo.rotateX(Math.PI);
        itGeo.translate(0, lidH, 0);
        lidParts.push(itGeo);

        const finalLidGeo = BufferGeometryUtils.mergeGeometries(lidParts);
        const lidMesh = new THREE.Mesh(finalLidGeo, lidMat);
        if (viewMode === 'both') {
          lidMesh.position.y = height + 15;
          lidMesh.rotation.x = 0.1; 
        }
        group.add(lidMesh);
      } catch (e) {}
    }

    meshGroupRef.current = group;
    sceneRef.current.add(group);
  };

  useEffect(() => { generate(); }, [size, height, wallThickness, tolerance, viewMode, isXRay]);

  const handleExport = (mode: 'box' | 'lid') => {
    if (!meshGroupRef.current) return;
    const exporter = new STLExporter();
    const originalMode = viewMode;
    setViewMode(mode);
    
    setTimeout(() => {
        if (!meshGroupRef.current) return;
        let targetMesh: THREE.Mesh | null = null;
        meshGroupRef.current.traverse((child) => {
            if (child instanceof THREE.Mesh) targetMesh = child;
        });

        if (targetMesh) {
            const res = exporter.parse(targetMesh, { binary: true });
            const blob = new Blob([(res as DataView).buffer], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `forge_${mode}_v2.stl`;
            link.click();
        }
        setViewMode(originalMode);
    }, 150);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter flex items-center gap-4 leading-none text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            CONTAINER <span className="text-white">FORGE</span>.
          </h1>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.4em] mt-3 italic opacity-60">High-Fidelity 3D Engineering Hub</p>
        </div>
        <div className="flex gap-4">
           <button onClick={() => setIsXRay(!isXRay)} className={`p-5 rounded-[24px] border transition-all ${isXRay ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}>
              <Eye size={24} />
           </button>
          <button onClick={() => handleExport('box')} className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-5 rounded-[28px] font-black italic transition-all shadow-xl uppercase tracking-widest flex items-center gap-4">
            <Box size={24} /> BOX STL
          </button>
          <button onClick={() => handleExport('lid')} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-5 rounded-[28px] font-black italic transition-all shadow-xl uppercase tracking-widest flex items-center gap-4">
            <Disc size={24} /> LID STL
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 glass rounded-[56px] h-[700px] relative overflow-hidden border-2 border-white/5 bg-[#020617]/80 shadow-2xl">
          <div ref={mountRef} className="absolute inset-0 cursor-move" />
          <div className="absolute top-8 left-8 flex flex-col gap-3 pointer-events-none">
             <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-[10px] font-black uppercase text-blue-400 italic flex items-center gap-2">
                <Shield size={14} /> Mesh Harmonized (Pos+Norm)
             </div>
             <div className="bg-blue-600/20 border border-blue-500/20 px-4 py-2 rounded-2xl text-[8px] font-black uppercase text-blue-400 tracking-widest italic flex items-center gap-2">
                <ArrowUp size={12} /> Cavity Logic: {innerRadius.toFixed(1)}mm ID
             </div>
          </div>
          <div className="absolute bottom-8 right-8 flex bg-black/40 p-1.5 rounded-2xl border border-white/10">
            {(['both', 'box', 'lid'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase italic transition-all ${viewMode === m ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>{m}</button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="glass rounded-[48px] p-10 space-y-10 border-white/5 bg-slate-900/40">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-[0.4em] italic flex items-center gap-3">
               <Sliders size={18} className="text-blue-500" /> Engineering Specs
            </h3>
            
            <div className="space-y-8">
              <ForgeSlider label="Container Radius" value={size} min={20} max={80} onChange={setSize} />
              <ForgeSlider label="Nutz-Höhe" value={height} min={30} max={150} onChange={setHeight} />
              <ForgeSlider label="Wandstärke" value={wallThickness} min={1.6} max={6.0} step={0.4} onChange={setWallThickness} />
              <ForgeSlider label="Gewinde-Spiel" value={tolerance} min={0.1} max={0.5} step={0.05} onChange={setTolerance} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ForgeSlider = ({ label, value, min, max, step = 1, onChange }: any) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center px-2">
      <label className="text-[10px] font-black uppercase text-slate-500 italic tracking-widest">{label}</label>
      <span className="text-blue-400 font-black italic text-lg">{value}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="modern-slider" />
  </div>
);

export default ContainerForge;