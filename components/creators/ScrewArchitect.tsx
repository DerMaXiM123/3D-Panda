import React, { useState, useEffect, useRef } from 'react';
import { Download, Wrench, Sliders, Zap, Box, Ruler, Disc } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls, STLExporter } from 'three-stdlib';

const ScrewArchitect: React.FC = () => {
  const [partType, setPartType] = useState<'bolt' | 'nut'>('bolt');
  const [diameter, setDiameter] = useState(8);
  const [length, setLength] = useState(30);
  const [headType, setHeadType] = useState<'hex' | 'cap'>('cap');
  const [pitch, setPitch] = useState(1.25);
  const [tolerance, setTolerance] = useState(0.2);
  
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(60, 60, 60);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dLight = new THREE.DirectionalLight(0xffffff, 1.5);
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
    return () => { ro.disconnect(); renderer.dispose(); if(meshRef.current) { meshRef.current.traverse((c:any) => { if(c.isMesh) c.geometry.dispose(); }); } };
  }, []);

  const createThreadMesh = (isInternal: boolean, threadLength: number, threadDiameter: number, threadPitch: number) => {
    const threadPoints = 64; const turns = threadLength / threadPitch;
    const spiralGeometry = new THREE.BufferGeometry();
    const spiralVertices: number[] = []; const spiralIndices: number[] = [];
    const threadDepth = threadPitch * 0.54; const totalSteps = turns * threadPoints;
    for (let i = 0; i <= totalSteps; i++) {
      const angle = (i / threadPoints) * Math.PI * 2;
      const progress = i / totalSteps;
      const y = -progress * (threadLength - threadPitch);
      let taper = progress < 0.1 ? progress * 10 : (progress > 0.9 ? (1.0 - progress) * 10 : 1.0);
      const rBase = threadDiameter / 2;
      const rPeak = isInternal ? (rBase - (threadDepth * taper)) : (rBase + (threadDepth * taper));
      const nextRPeak = isInternal ? (rBase - (threadDepth * taper)) : (rBase + (threadDepth * taper));
      spiralVertices.push(Math.cos(angle) * rBase, y, Math.sin(angle) * rBase);
      spiralVertices.push(Math.cos(angle) * rPeak, y - (threadPitch * 0.5), Math.sin(angle) * rPeak);
      spiralVertices.push(Math.cos(angle) * rBase, y - threadPitch, Math.sin(angle) * rBase);
    }
    for (let i = 0; i < totalSteps; i++) {
        const curr = i * 3; const next = (i + 1) * 3;
        if (!isInternal) { spiralIndices.push(curr, next, curr + 1, next, next + 1, curr + 1, curr + 1, next + 1, curr + 2, next + 1, next + 2, curr + 2); } 
        else { spiralIndices.push(curr, curr + 1, next, next, curr + 1, next + 1, curr + 1, curr + 2, next + 1, next + 1, curr + 2, next + 2); }
    }
    spiralGeometry.setAttribute('position', new THREE.Float32BufferAttribute(spiralVertices, 3));
    spiralGeometry.setIndex(spiralIndices);
    spiralGeometry.computeVertexNormals();
    return spiralGeometry;
  };

  const generateGeometry = () => {
    if (!sceneRef.current) return;
    if (meshRef.current) sceneRef.current.remove(meshRef.current);
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.2, metalness: 0.9 });
    if (partType === 'bolt') {
      const hH = diameter * 0.8;
      let hG = headType === 'hex' ? new THREE.CylinderGeometry(diameter * 0.9, diameter * 0.9, hH, 6) : new THREE.CylinderGeometry(diameter * 0.75, diameter * 0.75, hH, 32);
      hG.translate(0, hH / 2, 0); group.add(new THREE.Mesh(hG, material));
      const sG = new THREE.CylinderGeometry(diameter / 2, diameter / 2, length, 32); sG.translate(0, -length / 2, 0); group.add(new THREE.Mesh(sG, material));
      group.add(new THREE.Mesh(createThreadMesh(false, length, diameter, pitch), material));
    } else {
      const nH = diameter * 0.8; const nW = diameter * 1.8;
      const hexShape = new THREE.Shape();
      for(let i=0; i<6; i++) { const a = (i/6) * Math.PI * 2; const px = Math.cos(a) * (nW/2); const py = Math.sin(a) * (nW/2); if(i===0) hexShape.moveTo(px, py); else hexShape.lineTo(px, py); }
      hexShape.closePath();
      const holePath = new THREE.Path(); holePath.absarc(0, 0, (diameter / 2) + tolerance, 0, Math.PI * 2, true); hexShape.holes.push(holePath);
      const nG = new THREE.ExtrudeGeometry(hexShape, { depth: nH, bevelEnabled: true, bevelThickness: 1, bevelSize: 1 });
      nG.rotateX(Math.PI / 2); nG.translate(0, nH/2, 0); group.add(new THREE.Mesh(nG, material));
      const iTG = createThreadMesh(true, nH, diameter + (tolerance * 2), pitch); iTG.translate(0, nH/2, 0); group.add(new THREE.Mesh(iTG, material));
    }
    meshRef.current = group; sceneRef.current.add(group);
  };

  useEffect(() => { generateGeometry(); }, [partType, diameter, length, headType, pitch, tolerance]);

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="flex justify-between items-end">
        <div><h1 className="text-5xl font-black italic text-white uppercase">SCREW MASTER</h1></div>
        <button onClick={() => {
            if (!meshRef.current) return;
            const exporter = new STLExporter();
            const result = exporter.parse(meshRef.current, { binary: true });
            const blob = new Blob([result], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `screw.stl`;
            link.click();
        }} className="bg-slate-700 px-10 py-5 rounded-[28px] font-black uppercase italic shadow-xl">EXPORT STL</button>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 glass rounded-[56px] h-[650px] relative overflow-hidden bg-slate-900/20 group">
          <div ref={mountRef} className="absolute inset-0 cursor-move" />
        </div>
        <div className="lg:col-span-4 space-y-8">
          <div className="glass rounded-[48px] p-10 space-y-10 bg-slate-900/40">
             <ScrewSlider label="Diameter" value={diameter} min={3} max={20} onChange={setDiameter} />
             <ScrewSlider label="Length" value={length} min={5} max={150} onChange={setLength} />
          </div>
        </div>
      </div>
    </div>
  );
};
const ScrewSlider = ({ label, value, min, max, step = 1, onChange }: any) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center px-2">
      <label className="text-[10px] font-black uppercase text-slate-500 italic tracking-widest">{label}</label>
      <span className="text-slate-200 font-black italic text-lg">{value}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="modern-slider" />
  </div>
);
export default ScrewArchitect;