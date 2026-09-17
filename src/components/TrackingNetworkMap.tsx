import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Globe, 
  MapPin, 
  Ship,
  RadioTower,
  CheckCircle,
  Activity
} from 'lucide-react';
import { soundFx } from '../audio/soundEngine';

type AssetType = 'SHIP' | 'LAND';

interface TrackingAsset {
  id: string;
  name: string;
  type: AssetType;
  lat: number;
  lon: number;
  description: string;
  capabilities: string[];
  status: string;
}

const ASSETS: TrackingAsset[] = [
  {
    id: 'vanguard',
    name: 'USNS Vanguard (T-AGM-19)',
    type: 'SHIP',
    lat: -14.0,
    lon: -14.0,
    description: 'Apollo Instrumentation Ship positioned in the mid-Atlantic gap to cover the Saturn S-IVB Translunar Injection (TLI) burn.',
    capabilities: ['Unified S-Band (USB)', 'Telemetry', 'C-Band Radar', 'Ship Inertial Navigation System (SINS)'],
    status: 'ACTIVE - ON STATION'
  },
  {
    id: 'redstone',
    name: 'USNS Redstone (T-AGM-20)',
    type: 'SHIP',
    lat: -22.5,
    lon: 165.0,
    description: 'Apollo Instrumentation Ship providing tracking and communication coverage in the Pacific Ocean.',
    capabilities: ['Unified S-Band (USB)', 'Telemetry', 'C-Band Radar'],
    status: 'ACTIVE - ON STATION'
  },
  {
    id: 'ascension',
    name: 'Ascension Island Tracking',
    type: 'LAND',
    lat: -7.946,
    lon: -14.355,
    description: 'Critical mid-Atlantic land station for Apollo and DOD missile tracking.',
    capabilities: ['Telemetry', 'Command', 'C-Band Radar'],
    status: 'ACTIVE'
  },
  {
    id: 'bermuda',
    name: 'Bermuda (BDA)',
    type: 'LAND',
    lat: 32.3,
    lon: -64.7,
    description: 'Provides critical launch trajectory tracking shortly after liftoff from Cape Canaveral.',
    capabilities: ['Unified S-Band (USB)', 'Telemetry', 'C-Band Radar'],
    status: 'ACTIVE'
  },
  {
    id: 'canberra',
    name: 'Canberra DSN (DSS-42)',
    type: 'LAND',
    lat: -35.401,
    lon: 148.981,
    description: 'Deep Space Network (DSN) station in Australia, providing continuous coverage as the Earth rotates.',
    capabilities: ['26m S-Band Antenna', 'Deep Space Comm'],
    status: 'ACTIVE'
  },
  {
    id: 'goldstone',
    name: 'Goldstone DSN (DSS-14)',
    type: 'LAND',
    lat: 35.426,
    lon: -116.890,
    description: 'Pioneer Station in the Mojave Desert, featuring a massive 64-meter antenna for deep space missions.',
    capabilities: ['64m S-Band/X-Band Antenna', 'Deep Space Comm'],
    status: 'ACTIVE'
  },
  {
    id: 'madrid',
    name: 'Madrid DSN (DSS-61)',
    type: 'LAND',
    lat: 40.427,
    lon: -4.25,
    description: 'Deep Space Network station in Spain completing the 120-degree global coverage network.',
    capabilities: ['26m S-Band Antenna', 'Deep Space Comm'],
    status: 'ACTIVE'
  },
  {
    id: 'carnarvon',
    name: 'Carnarvon Tracking Station',
    type: 'LAND',
    lat: -24.88,
    lon: 113.72,
    description: 'Key station in Western Australia for Gemini and Apollo low Earth orbit tracking.',
    capabilities: ['Unified S-Band (USB)', 'FPQ-6 Radar'],
    status: 'ACTIVE'
  }
];

// Helper to convert lat/lon to 3D Cartesian coordinates
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 90) * (Math.PI / 180);
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

export const TrackingNetworkMap: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const selectedAsset = ASSETS.find(a => a.id === selectedAssetId) || null;

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const earthGroupRef = useRef<THREE.Group | null>(null);
  const targetCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 35));

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050811);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 35);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 2.0);
    dirLight.position.set(50, 20, 50);
    scene.add(dirLight);

    const earthGroup = new THREE.Group();
    scene.add(earthGroup);
    earthGroupRef.current = earthGroup;

    // Earth Sphere (Wireframe & Glow)
    const earthGeo = new THREE.SphereGeometry(10, 64, 64);
    
    // Core dark sphere
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.2
    });
    const earthCore = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthCore);

    // Wireframe overlay
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    const earthWire = new THREE.Mesh(earthGeo, wireMat);
    earthGroup.add(earthWire);

    // Asset Markers
    const markerGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const shipMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b }); // Amber
    const landMat = new THREE.MeshBasicMaterial({ color: 0x10b981 }); // Emerald

    ASSETS.forEach(asset => {
      if (!asset || typeof asset.lat !== 'number' || typeof asset.lon !== 'number') return;
      const pos = latLonToVector3(asset.lat, asset.lon, 10.05);
      const marker = new THREE.Mesh(markerGeo, asset.type === 'SHIP' ? shipMat : landMat);
      marker.position.copy(pos);
      
      // Add a subtle ring/halo
      const ringGeo = new THREE.RingGeometry(0.3, 0.4, 32);
      const ringMat = new THREE.MeshBasicMaterial({ 
        color: asset.type === 'SHIP' ? 0xf59e0b : 0x10b981,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(new THREE.Vector3(0,0,0));
      
      earthGroup.add(marker);
      earthGroup.add(ring);
    });

    // Stars
    const starsGeo = new THREE.BufferGeometry();
    const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1, transparent: true, opacity: 0.6 });
    const starsVerts = [];
    for(let i=0; i<1000; i++) {
      const x = THREE.MathUtils.randFloatSpread(200);
      const y = THREE.MathUtils.randFloatSpread(200);
      const z = THREE.MathUtils.randFloatSpread(200);
      // Keep stars away from center
      if (Math.abs(x) < 20 && Math.abs(y) < 20 && Math.abs(z) < 20) continue;
      starsVerts.push(x, y, z);
    }
    starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starsVerts, 3));
    const starField = new THREE.Points(starsGeo, starsMat);
    scene.add(starField);

    let animFrameId: number;
    let autoRotate = true;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);

      if (autoRotate && !selectedAssetId) {
        earthGroup.rotation.y += 0.001;
      }

      // Smooth camera interpolation
      if (cameraRef.current) {
        cameraRef.current.position.lerp(targetCamPosRef.current, 0.05);
        cameraRef.current.lookAt(0, 0, 0);
      }

      renderer.render(scene, cameraRef.current!);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const nw = containerRef.current.clientWidth;
      const nh = containerRef.current.clientHeight;
      cameraRef.current.aspect = nw / nh;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameId);
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, []);

  // Update target camera position when asset is selected
  useEffect(() => {
    if (selectedAsset && typeof selectedAsset.lat === 'number' && earthGroupRef.current) {
      soundFx.playClick();
      
      // Calculate global position of the asset accounting for current earth rotation
      const localPos = latLonToVector3(selectedAsset.lat, selectedAsset.lon, 10);
      
      // We want to move the camera to look at this point.
      // Instead of rotating the camera around the earth (complex with earth's rotation),
      // we rotate the earth so the asset faces the camera, and move camera to a fixed zoom.
      // Wait, standard way is to rotate earth to target.
      
      // Let's just snap earth rotation to identity, then rotate it so asset is at +Z
      // Actually, simplest is to let camera move to world position.
      const worldPos = localPos.clone().applyMatrix4(earthGroupRef.current.matrixWorld);
      
      // Target camera position is just worldPos normalized * zoom distance
      const targetPos = worldPos.normalize().multiplyScalar(20); // zoom in from 35 to 20
      targetCamPosRef.current.copy(targetPos);
    } else {
      // Zoom out to default
      targetCamPosRef.current.set(0, 0, 35);
    }
  }, [selectedAssetId]);

  return (
    <div className="w-full flex-1 flex flex-col lg:flex-row p-4 gap-4 max-w-7xl mx-auto h-[calc(100vh-140px)]">
      
      {/* LEFT: Asset List */}
      <div className="w-full lg:w-80 flex flex-col gap-3 bg-slate-950 border border-slate-800 rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <Globe className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-wider">Tracking Network</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 scrollbar-thin scrollbar-thumb-slate-800">
          {ASSETS.map(asset => (
            <button
              key={asset.id}
              onClick={() => setSelectedAssetId(asset.id === selectedAssetId ? null : asset.id)}
              className={`p-3 text-left rounded border transition-all cursor-pointer ${
                selectedAssetId === asset.id 
                  ? 'bg-slate-900 border-slate-600 shadow-md' 
                  : 'bg-slate-900/40 border-slate-850 hover:bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {asset.type === 'SHIP' ? <Ship className="w-3.5 h-3.5 text-amber-400" /> : <RadioTower className="w-3.5 h-3.5 text-emerald-400" />}
                <span className={`font-mono text-xs font-bold ${selectedAssetId === asset.id ? 'text-white' : 'text-slate-300'}`}>
                  {asset.name}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                LAT: {(asset.lat ?? 0) > 0 ? `${(asset.lat ?? 0).toFixed(2)}°N` : `${Math.abs(asset.lat ?? 0).toFixed(2)}°S`} | 
                LON: {(asset.lon ?? 0) > 0 ? `${(asset.lon ?? 0).toFixed(2)}°E` : `${Math.abs(asset.lon ?? 0).toFixed(2)}°W`}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CENTER: 3D Earth Map */}
      <div className="flex-1 rounded-lg border border-slate-800 bg-black overflow-hidden relative shadow-lg">
        <div ref={containerRef} className="w-full h-full" />
        
        {/* HUD Overlay */}
        <div className="absolute top-4 left-4 pointer-events-none">
          <div className="bg-slate-950/80 border border-slate-700 backdrop-blur px-3 py-1.5 rounded font-mono text-xs text-slate-300 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>GLOBAL NETWORK ACTIVE</span>
          </div>
        </div>
      </div>

      {/* RIGHT: Asset Details Panel */}
      <div className={`w-full lg:w-80 flex flex-col gap-4 bg-slate-950 border border-slate-800 rounded-lg p-4 shadow-lg transition-opacity duration-300 ${selectedAsset ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h2 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-wider">Asset Details</h2>
          <MapPin className="w-4 h-4 text-slate-500" />
        </div>

        {selectedAsset ? (
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {selectedAsset.type === 'SHIP' ? <Ship className="w-5 h-5 text-amber-400" /> : <RadioTower className="w-5 h-5 text-emerald-400" />}
                <h3 className="font-bold text-white font-mono">{selectedAsset.name}</h3>
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                selectedAsset.status.includes('ACTIVE') ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}>
                <CheckCircle className="w-3 h-3" />
                {selectedAsset.status}
              </span>
            </div>

            <div className="bg-slate-900/60 p-3 rounded border border-slate-850">
              <span className="text-[10px] text-slate-400 font-mono block mb-1">COORDINATES</span>
              <div className="font-mono text-xs text-slate-200">
                {(selectedAsset.lat ?? 0) > 0 ? `${(selectedAsset.lat ?? 0).toFixed(4)}° N` : `${Math.abs(selectedAsset.lat ?? 0).toFixed(4)}° S`}, {' '}
                {(selectedAsset.lon ?? 0) > 0 ? `${(selectedAsset.lon ?? 0).toFixed(4)}° E` : `${Math.abs(selectedAsset.lon ?? 0).toFixed(4)}° W`}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-mono block mb-1">DESCRIPTION</span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {selectedAsset.description}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-mono block mb-2">CAPABILITIES</span>
              <ul className="flex flex-col gap-1.5">
                {selectedAsset.capabilities.map((cap, idx) => (
                  <li key={idx} className="text-xs text-slate-200 font-mono flex items-center gap-2">
                    <span className="w-1 h-1 bg-amber-400 rounded-full" />
                    {cap}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-xs text-center px-4">
            Select a tracking network asset from the list to view its properties and location.
          </div>
        )}
      </div>

    </div>
  );
};
