import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { TelemetryData } from '../types';
import { soundFx } from '../audio/soundEngine';
import { LaunchCommandNavPanel, LaunchCommand, LeftPanelState } from './LaunchCommandNavPanel';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Crosshair, 
  AlertTriangle,
  Target,
  Waves,
  CheckCircle2,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  ShieldAlert,
  VolumeX,
  Volume2,
  Compass,
  EyeOff,
  Layers,
  Radio,
  ShieldCheck,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Hand,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  PanelLeftOpen,
  Anchor,
  Globe,
  Info,
  Focus
} from 'lucide-react';
import { 
  SATELLITE_DEFINITIONS, 
  SatelliteDefinition, 
  ALL_SELECTABLE_OBJECTS, 
  getLiveObjectIntel 
} from '../data/tacticalAssets';

interface ThreeFlightSimulatorProps {
  telemetry: TelemetryData;
  setTelemetry: React.Dispatch<React.SetStateAction<TelemetryData>>;
  onOpenStarTracker: () => void;
}

// Telemetry calculation helper for any point in mission time
function calculateTelemetryAtTime(t: number, isGss: boolean, prevLogs: string[] = []): Partial<TelemetryData> {
  let stage: TelemetryData['stage'] = 'PRE_LAUNCH_4KT';
  let alt = -0.045;
  let vel = 2.06;
  let downrange = 0;
  let fuel = 100;
  let pitch = 90;
  let dynPress = 0;
  let bubbleInt = 100;
  let drift = isGss ? 15 : 120;
  let starStatus: 'STANDBY' | 'ACQUIRING' | 'LOCKED' | 'CORRECTED' = 'STANDBY';

  const currentDeflection = isGss ? 0.08 : 24.5;
  const missMeters = isGss ? 38 : 1420;
  const overpressure = isGss ? 2850 : 38;
  const killProb = isGss ? 99.4 : 18.2;

  if (t < 3.0) {
    stage = 'PRE_LAUNCH_4KT';
    alt = -0.045;
    vel = 2.06;
    downrange = 0;
    fuel = 100;
    pitch = 90;
    dynPress = 0;
    bubbleInt = 100;
  } else if (t >= 3.0 && t < 5.8) {
    stage = 'SUB_BUBBLE_EJECT';
    const tRel = t - 3.0;
    alt = -0.045 + tRel * 0.016;
    vel = 24.5;
    bubbleInt = 100;
    downrange = tRel * 0.02;
    pitch = 90;
  } else if (t >= 5.8 && t < 6.8) {
    stage = 'BUBBLE_BURST';
    alt = 0.005 + (t - 5.8) * 0.025;
    vel = 22;
    bubbleInt = Math.max(0, 100 - (t - 5.8) * 120);
    downrange = 0.06;
    pitch = 89;
  } else if (t >= 6.8 && t < 12.0) {
    stage = 'AEROSPIKE';
    const tRel = t - 6.8;
    alt = 0.03 + tRel * 0.42;
    vel = 95 + tRel * 140;
    fuel = 98 - tRel * 2.5;
    pitch = 88;
    dynPress = tRel * 9.2;
    bubbleInt = 0;
    drift += tRel * (isGss ? 2 : 12);
  } else if (t >= 12.0 && t < 28.0) {
    stage = 'STAGE_1';
    const tRel = t - 12.0;
    alt = 2.2 + tRel * 1.8;
    vel = 820 + tRel * 95;
    downrange = tRel * 1.4;
    fuel = 85 - tRel * 2.8;
    pitch = 88 - tRel * 1.5;
    dynPress = Math.max(0, 48 - Math.pow(tRel - 6, 2) * 0.4);
    drift += tRel * (isGss ? 3 : 18);
  } else if (t >= 28.0 && t < 45.0) {
    stage = 'STAGE_2';
    const tRel = t - 28.0;
    alt = 31 + tRel * 3.8;
    vel = 2340 + tRel * 165;
    downrange = 22.4 + tRel * 7.5;
    fuel = 40 - tRel * 1.6;
    pitch = 64 - tRel * 1.2;
    dynPress = Math.max(0, 12 - tRel * 0.8);
    drift += tRel * (isGss ? 4 : 26);
  } else if (t >= 45.0 && t < 60.0) {
    stage = 'STAGE_3';
    const tRel = t - 45.0;
    alt = 95 + tRel * 4.2;
    vel = 5145 + tRel * 130;
    downrange = 150 + tRel * 24.5;
    fuel = 13 - tRel * 0.6;
    pitch = 44 - tRel * 1.0;
    dynPress = 0;
    starStatus = t >= 52 ? 'LOCKED' : 'ACQUIRING';
  } else if (t >= 60.0 && t < 72.0) {
    stage = 'REACH_ATTITUDE';
    const tRel = t - 60.0;
    alt = 158 + tRel * 2.8;
    vel = 7120 + tRel * 8;
    downrange = 518 + tRel * 40;
    fuel = Math.max(0, 6 - tRel * 0.2);
    pitch = 28;
    starStatus = 'CORRECTED';
    drift = isGss ? 18 : 650;
  } else if (t >= 72.0 && t < 82.0) {
    stage = 'PLATFORM_DEPLOY';
    const tRel = t - 72.0;
    alt = 191 + tRel * 2.4;
    vel = 7200;
    downrange = 998 + tRel * 45;
    fuel = 4;
    pitch = 25;
    starStatus = 'CORRECTED';
  } else if (t >= 82.0 && t < 96.0) {
    stage = 'WARHEAD_RELEASE';
    const tRel = t - 82.0;
    alt = 215 + tRel * 1.8;
    vel = 7250;
    downrange = 1448 + tRel * 52;
    fuel = 2;
    pitch = 15;
    starStatus = 'CORRECTED';
  } else if (t >= 96.0 && t < 110.0) {
    stage = 'REENTRY_STREAK';
    const tRel = t - 96.0;
    alt = Math.max(0.5, 240 - tRel * 17);
    vel = 7400 - tRel * 90;
    downrange = 2176 + tRel * 68;
    fuel = 0;
    pitch = -45 - tRel * 2.2;
    starStatus = 'CORRECTED';
  } else {
    stage = 'TARGET_IMPACT';
    alt = 0;
    vel = 0;
    downrange = 3128;
    fuel = 0;
    pitch = -90;
    starStatus = 'CORRECTED';
  }

  return {
    missionTime: t,
    altitude: alt,
    velocity: vel,
    downrange: downrange,
    stage: stage,
    fuelPercent: fuel,
    pitchAngle: pitch,
    dynamicPressure: dynPress,
    inertialDrift: drift,
    starLockStatus: starStatus,
    bubbleIntegrity: bubbleInt,
    sinsDeflectionArcsec: currentDeflection,
    targetMissMeters: missMeters,
    siloOverpressurePsi: overpressure,
    targetKillProb: killProb
  };
}

function createEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep oceanic blue
  ctx.fillStyle = '#08172e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Tactical Lat/Long graticule grid
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
  ctx.lineWidth = 1;
  for (let lat = -80; lat <= 80; lat += 20) {
    const y = ((90 - lat) / 180) * canvas.height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  for (let lon = -180; lon <= 180; lon += 30) {
    const x = ((lon + 180) / 360) * canvas.width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Tactical continental landmasses
  ctx.fillStyle = '#163323';
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 1.5;

  const drawPoly = (pts: [number, number][]) => {
    ctx.beginPath();
    pts.forEach(([lon, lat], i) => {
      const x = ((lon + 180) / 360) * canvas.width;
      const y = ((90 - lat) / 180) * canvas.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  // North America
  drawPoly([
    [-165, 65], [-140, 70], [-95, 75], [-80, 60], [-65, 45], [-75, 25],
    [-80, 25], [-90, 30], [-105, 20], [-120, 35], [-125, 48], [-140, 58], [-165, 65]
  ]);
  // South America
  drawPoly([
    [-80, 10], [-50, -5], [-35, -5], [-40, -22], [-55, -40], [-70, -55],
    [-75, -45], [-70, -20], [-80, 0], [-80, 10]
  ]);
  // Eurasia
  drawPoly([
    [-10, 60], [30, 70], [80, 75], [140, 72], [170, 65], [140, 50],
    [130, 35], [105, 20], [80, 10], [60, 25], [40, 30], [25, 40],
    [10, 45], [-5, 45], [-10, 60]
  ]);
  // Africa
  drawPoly([
    [-15, 35], [30, 32], [50, 12], [40, -5], [30, -32], [18, -35],
    [10, -10], [-15, 10], [-15, 35]
  ]);
  // Australia
  drawPoly([
    [115, -20], [150, -22], [152, -38], [130, -38], [115, -30], [115, -20]
  ]);
  // Greenland
  drawPoly([
    [-50, 82], [-20, 80], [-25, 70], [-45, 60], [-55, 72], [-50, 82]
  ]);

  // Polar ice caps
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, 0, canvas.width, 22);
  ctx.fillRect(0, canvas.height - 25, canvas.width, 25);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function createSatelliteMesh(sat: SatelliteDefinition): THREE.Group {
  const group = new THREE.Group();
  group.userData = { objectId: sat.id, name: sat.name };

  const goldMliMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.95,
    roughness: 0.15
  });
  const silverMliMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.9,
    roughness: 0.2
  });
  const solarMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a,
    metalness: 0.85,
    roughness: 0.1
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.8,
    roughness: 0.3
  });
  const sensorGlowMat = new THREE.MeshBasicMaterial({
    color: sat.colorHex
  });

  if (sat.modelType === 'SBIRS') {
    const busGeo = new THREE.BoxGeometry(6, 9, 6);
    const bus = new THREE.Mesh(busGeo, goldMliMat);
    bus.userData = { objectId: sat.id };
    group.add(bus);

    const sensorGeo = new THREE.CylinderGeometry(1.8, 2.5, 6, 20);
    const sensor = new THREE.Mesh(sensorGeo, darkMetalMat);
    sensor.position.set(0, 0, 4);
    sensor.rotation.x = Math.PI / 2;
    sensor.userData = { objectId: sat.id };
    group.add(sensor);

    const sensorLens = new THREE.Mesh(new THREE.CircleGeometry(1.7, 20), sensorGlowMat);
    sensorLens.position.set(0, 0, 7.01);
    group.add(sensorLens);

    const wingGeo = new THREE.BoxGeometry(22, 5, 0.4);
    const wingLeft = new THREE.Mesh(wingGeo, solarMat);
    wingLeft.position.set(-14, 0, 0);
    wingLeft.userData = { objectId: sat.id };
    group.add(wingLeft);

    const wingRight = new THREE.Mesh(wingGeo, solarMat);
    wingRight.position.set(14, 0, 0);
    wingRight.userData = { objectId: sat.id };
    group.add(wingRight);

    const dishGeo = new THREE.SphereGeometry(2.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 3);
    const dish = new THREE.Mesh(dishGeo, goldMliMat);
    dish.position.set(0, 5.5, -2);
    dish.rotation.x = -Math.PI / 3;
    group.add(dish);

  } else if (sat.modelType === 'DSP') {
    const busGeo = new THREE.CylinderGeometry(4.5, 4.5, 12, 24);
    const bus = new THREE.Mesh(busGeo, solarMat);
    bus.userData = { objectId: sat.id };
    group.add(bus);

    const baffleGeo = new THREE.ConeGeometry(6.5, 7, 24, 1, true);
    const baffle = new THREE.Mesh(baffleGeo, darkMetalMat);
    baffle.position.set(0, 0, 7);
    baffle.rotation.x = Math.PI / 2;
    baffle.userData = { objectId: sat.id };
    group.add(baffle);

    const sensorFocal = new THREE.Mesh(new THREE.CircleGeometry(4.2, 24), sensorGlowMat);
    sensorFocal.position.set(0, 0, 9);
    group.add(sensorFocal);

    const boomGeo = new THREE.CylinderGeometry(0.15, 0.15, 16, 8);
    const boom = new THREE.Mesh(boomGeo, silverMliMat);
    boom.rotation.z = Math.PI / 2;
    group.add(boom);

  } else if (sat.modelType === 'GPS') {
    const busGeo = new THREE.BoxGeometry(5.5, 7, 5.5);
    const bus = new THREE.Mesh(busGeo, goldMliMat);
    bus.userData = { objectId: sat.id };
    group.add(bus);

    const deckGeo = new THREE.CylinderGeometry(3.2, 3.2, 1.2, 20);
    const deck = new THREE.Mesh(deckGeo, silverMliMat);
    deck.position.set(0, 0, 3.5);
    deck.rotation.x = Math.PI / 2;
    deck.userData = { objectId: sat.id };
    group.add(deck);

    for (let h = 0; h < 8; h++) {
      const hAng = (h / 8) * Math.PI * 2;
      const helix = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8), sensorGlowMat);
      helix.position.set(Math.cos(hAng) * 2.0, Math.sin(hAng) * 2.0, 4.3);
      helix.rotation.x = Math.PI / 2;
      group.add(helix);
    }

    const wingGeo = new THREE.BoxGeometry(20, 4.5, 0.3);
    const wingL = new THREE.Mesh(wingGeo, solarMat);
    wingL.position.set(-13, 0, 0);
    wingL.userData = { objectId: sat.id };
    group.add(wingL);

    const wingR = new THREE.Mesh(wingGeo, solarMat);
    wingR.position.set(13, 0, 0);
    wingR.userData = { objectId: sat.id };
    group.add(wingR);

  } else if (sat.modelType === 'KH11') {
    const barrelGeo = new THREE.CylinderGeometry(3.6, 3.6, 18, 24);
    const barrel = new THREE.Mesh(barrelGeo, silverMliMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.userData = { objectId: sat.id };
    group.add(barrel);

    const mirror = new THREE.Mesh(new THREE.CircleGeometry(3.2, 24), new THREE.MeshBasicMaterial({ color: 0x0284c7 }));
    mirror.position.set(0, 0, 9.01);
    group.add(mirror);

    const wingGeo = new THREE.BoxGeometry(14, 4, 0.3);
    const wingL = new THREE.Mesh(wingGeo, solarMat);
    wingL.position.set(-10, 0, 0);
    wingL.userData = { objectId: sat.id };
    group.add(wingL);

    const wingR = new THREE.Mesh(wingGeo, solarMat);
    wingR.position.set(10, 0, 0);
    wingR.userData = { objectId: sat.id };
    group.add(wingR);

    const relayDish = new THREE.Mesh(new THREE.SphereGeometry(1.8, 16, 16, 0, Math.PI * 2, 0, Math.PI / 3), goldMliMat);
    relayDish.position.set(0, -3.5, -6);
    relayDish.rotation.x = Math.PI * 0.8;
    group.add(relayDish);

  } else {
    const busGeo = new THREE.BoxGeometry(7, 9, 7);
    const bus = new THREE.Mesh(busGeo, darkMetalMat);
    bus.userData = { objectId: sat.id };
    group.add(bus);

    const dish1 = new THREE.Mesh(new THREE.SphereGeometry(2.0, 16, 16, 0, Math.PI * 2, 0, Math.PI / 3), goldMliMat);
    dish1.position.set(-2, 3.5, 4);
    dish1.rotation.x = Math.PI / 2;
    group.add(dish1);

    const dish2 = new THREE.Mesh(new THREE.SphereGeometry(2.0, 16, 16, 0, Math.PI * 2, 0, Math.PI / 3), goldMliMat);
    dish2.position.set(2, 3.5, 4);
    dish2.rotation.x = Math.PI / 2;
    group.add(dish2);

    const horn = new THREE.Mesh(new THREE.ConeGeometry(1.2, 3.0, 16), sensorGlowMat);
    horn.position.set(0, -3.5, 4);
    horn.rotation.x = Math.PI / 2;
    group.add(horn);

    const wingGeo = new THREE.BoxGeometry(24, 6, 0.4);
    const wingL = new THREE.Mesh(wingGeo, solarMat);
    wingL.position.set(-16, 0, 0);
    wingL.userData = { objectId: sat.id };
    group.add(wingL);

    const wingR = new THREE.Mesh(wingGeo, solarMat);
    wingR.position.set(16, 0, 0);
    wingR.userData = { objectId: sat.id };
    group.add(wingR);
  }

  // Tactical HUD diamond marker ring
  const markerGeo = new THREE.RingGeometry(8, 10, 4);
  const markerMat = new THREE.MeshBasicMaterial({
    color: sat.colorHex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85
  });
  const marker = new THREE.Mesh(markerGeo, markerMat);
  marker.userData = { objectId: sat.id };
  group.add(marker);

  // Large invisible hit sphere for responsive raycasting
  const hitGeo = new THREE.SphereGeometry(45, 12, 12);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  hitMesh.userData = { objectId: sat.id, name: sat.name };
  group.add(hitMesh);

  return group;
}

export const ThreeFlightSimulator: React.FC<ThreeFlightSimulatorProps> = ({
  telemetry,
  setTelemetry,
  onOpenStarTracker
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [cameraMode, setCameraMode] = useState<'FOLLOW' | 'SUB_4KT' | 'TACTICAL_EVASION' | 'BUBBLE_CAM' | 'PLATFORM_BUS' | 'TARGET_SILO' | 'SHIP' | 'EARTH_ORBIT' | 'SATELLITE_TRACK'>('FOLLOW');
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [shockConeVisible, setShockConeVisible] = useState<boolean>(true);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [autoCamSync, setAutoCamSync] = useState<boolean>(true);
  const [zoomDisplay, setZoomDisplay] = useState<number>(100);
  const [leftPanelState, setLeftPanelState] = useState<LeftPanelState>('expanded');
  const [dragInteractionMode, setDragInteractionMode] = useState<'ORBIT' | 'PAN'>('ORBIT');
  const [show3DControlsWidget, setShow3DControlsWidget] = useState<boolean>(true);
  const [panDisplay, setPanDisplay] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 3D Object Selection & Hover State
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>('trident-missile');
  const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null);
  const [hoverTooltipPos, setHoverTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const lastPingSecondRef = useRef<number>(-1);

  // Time reference driving the animation independent of React state batches
  const simTimeRef = useRef<number>(telemetry.missionTime);
  const lastStateUpdateRef = useRef<number>(0);

  // User interactive camera orbit, pan, and zoom state
  const userOrbitRef = useRef({
    rotX: 0,
    rotY: 0,
    distanceFactor: 1.0,
    panX: 0,
    panY: 0,
    isDragging: false,
    activeDragMode: 'ORBIT' as 'ORBIT' | 'PAN',
    startX: 0,
    startY: 0,
    downX: 0,
    downY: 0,
    hasMoved: false,
    initialTouchDist: 0,
    initialTouchMidX: 0,
    initialTouchMidY: 0,
    isPinching: false
  });

  // Three.js References
  const animFrameId = useRef<number | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // 3D Objects
  const subGroupRef = useRef<THREE.Group | null>(null);
  const subRudderUpperRef = useRef<THREE.Mesh | null>(null);
  const subRudderLowerRef = useRef<THREE.Mesh | null>(null);
  const subScrewRef = useRef<THREE.Group | THREE.Mesh | null>(null);
  const subSurfaceWakeRef = useRef<THREE.Mesh | null>(null);
  const subSilentFieldRef = useRef<THREE.Mesh | null>(null);
  const missileScrewRef = useRef<THREE.Group | null>(null);

  // Earth Globe & Orbiting Satellites Refs
  const earthGroupRef = useRef<THREE.Group | null>(null);
  const earthCloudsRef = useRef<THREE.Mesh | null>(null);
  const earthAtmosphereRef = useRef<THREE.Mesh | null>(null);
  const satelliteMeshesRef = useRef<Map<string, { mesh: THREE.Group; hitMesh: THREE.Mesh | THREE.Group; orbitRadius: number; speed: number; inclination: number; phase: number }>>(new Map());
  const satelliteOrbitsRef = useRef<THREE.Line[]>([]);
  const selectionReticleRef = useRef<THREE.Group | null>(null);

  // Russian Hunter-Killer Submarine (Akula-I Class) Refs
  const russianSubGroupRef = useRef<THREE.Group | null>(null);
  const russianSubScrewRef = useRef<THREE.Mesh | null>(null);
  const sonarPingWavesRef = useRef<THREE.Mesh[]>([]);

  // Acoustic Countermeasures Decoy Refs
  const decoyGroupRef = useRef<THREE.Group | null>(null);
  const activeDecoyRef = useRef<{ active: boolean; x: number; y: number; z: number; birthTime: number } | null>(null);

  const missileGroupRef = useRef<THREE.Group | null>(null);
  const steamBubbleMeshRef = useRef<THREE.Mesh | null>(null);
  const bubbleParticlesRef = useRef<THREE.Points | null>(null);
  const bubbleBurstMeshRef = useRef<THREE.Mesh | null>(null);
  const aerospikeMeshRef = useRef<THREE.Mesh | null>(null);
  const flameInnerMeshRef = useRef<THREE.Mesh | null>(null);
  const flameOuterMeshRef = useRef<THREE.Mesh | null>(null);
  const flameLightRef = useRef<THREE.PointLight | null>(null);
  const shockConeMeshRef = useRef<THREE.Mesh | null>(null);
  const stage1MeshRef = useRef<THREE.Mesh | null>(null);
  const stage2MeshRef = useRef<THREE.Mesh | null>(null);
  const stage3MeshRef = useRef<THREE.Mesh | null>(null);
  const pbvGroupRef = useRef<THREE.Group | null>(null);
  const noseFairingLeftRef = useRef<THREE.Mesh | null>(null);
  const noseFairingRightRef = useRef<THREE.Mesh | null>(null);
  const warheadsRef = useRef<THREE.Mesh[]>([]);
  const plasmaTrailsRef = useRef<THREE.Line[]>([]);
  const targetComplexRef = useRef<THREE.Group | null>(null);
  const detonationFlashRef = useRef<THREE.Mesh | null>(null);
  const thrusterPlumesRef = useRef<THREE.Mesh[]>([]);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);

  // Synchronize simTimeRef when telemetry.missionTime changes externally
  useEffect(() => {
    simTimeRef.current = telemetry.missionTime;
  }, [telemetry.missionTime]);

  // Dedicated scene update & render function callable anytime (playing or paused)
  const updateSimulationVisuals = useCallback((t: number) => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;

    const data = calculateTelemetryAtTime(t, telemetry.gssEnabled);
    const stage = data.stage || 'PRE_LAUNCH_4KT';
    const alt = data.altitude ?? 0;
    const downrange = data.downrange ?? 0;
    const pitch = data.pitchAngle ?? 90;
    const bubbleInt = data.bubbleIntegrity ?? 100;
    const isGss = telemetry.gssEnabled;

    // 1. Submarine Position, Depth, Surface Mode & Evasive Noodling Dynamics
    const isSurfaced = telemetry.subSurfaceMode || (telemetry.subDepthMeters ?? 22) === 0;
    const commandedDepth = isSurfaced ? 0 : (telemetry.subDepthMeters ?? 22);
    const commandedSpeed = telemetry.subSpeedKnots ?? 4.0;
    const isSilent = telemetry.superSilentMode || false;

    // Advance speed in sim coordinates: 1 knot ≈ 0.1 unit/s (silent mode cuts speed to ~1.8 kt)
    const effectiveSpeedKnots = isSilent ? Math.min(commandedSpeed, 1.8) : commandedSpeed;
    const speedFactor = effectiveSpeedKnots * 0.1;
    let subCurrentX = t * speedFactor;

    // Depth in meters: Surface waterline is at y = 0.
    // When surfaced, the submarine's waterline is at y = -2.2 so its top deck, sail and rudder breach the ocean surface!
    // When submerged, depth is -commandedDepth
    let subCurrentY = isSurfaced ? -2.2 : -commandedDepth;
    let subCurrentZ = 0;
    let subYaw = 0;
    let subRoll = 0;
    let subPitch = isSurfaced ? 0.015 : 0; // Slight bow-up trim when surfaced
    let rudderAngle = 0;

    const pattern = telemetry.noodlingPattern || 'OFF';

    if (pattern === 'SERPENTINE') {
      // Sinusoidal weave: ±22m amplitude, period ~14s
      const freq = 0.45;
      subCurrentZ = Math.sin(t * freq) * 22;
      subYaw = Math.cos(t * freq) * 0.28; // yaw turns
      subRoll = -Math.cos(t * freq) * 0.12; // banks into turns
      rudderAngle = Math.cos(t * freq) * 0.48;
      if (!isSurfaced) {
        subCurrentY += Math.sin(t * freq * 0.5) * 2.0;
      }
    } else if (pattern === 'BAFFLE_CLEAR') {
      // 45-degree zig-zag to clear the stern baffles
      const cycle = (t * 0.28) % (Math.PI * 2);
      const zig = Math.sin(cycle);
      subCurrentZ = Math.sign(zig) * Math.min(26, Math.pow(Math.abs(zig), 0.7) * 30);
      subYaw = zig * 0.52;
      subRoll = -zig * 0.2;
      rudderAngle = zig * 0.75;
    } else if (pattern === 'THERMAL_DIVE') {
      // Dynamic depth porpoise across thermocline (-18m to -44m)
      const dFreq = 0.35;
      if (!isSurfaced) {
        subCurrentY = -Math.max(22, commandedDepth) + Math.sin(t * dFreq) * 13;
      }
      subCurrentZ = Math.sin(t * dFreq * 0.5) * 8;
      subPitch = -Math.cos(t * dFreq) * 0.15;
      subRoll = Math.sin(t * dFreq * 0.5) * 0.06;
      rudderAngle = Math.sin(t * dFreq * 0.5) * 0.25;
    }

    if (subGroupRef.current) {
      subGroupRef.current.position.set(subCurrentX, subCurrentY, subCurrentZ);
      subGroupRef.current.rotation.set(subRoll, subYaw, subPitch);

      // Articulate rudder fins
      if (subRudderUpperRef.current) subRudderUpperRef.current.rotation.y = rudderAngle;
      if (subRudderLowerRef.current) subRudderLowerRef.current.rotation.y = rudderAngle;

      // Spin Ohio propeller screw proportional to speed (higher speed = faster rotation)
      if (subScrewRef.current) {
        const spinDelta = effectiveSpeedKnots * 0.06;
        subScrewRef.current.rotation.x += spinDelta;
      }

      // Surface mode waterline foam wake
      if (subSurfaceWakeRef.current) {
        subSurfaceWakeRef.current.visible = isSurfaced;
        if (isSurfaced) {
          const wakePulse = 1.0 + Math.sin(t * 3.5) * 0.06;
          subSurfaceWakeRef.current.scale.set(wakePulse, wakePulse, 1.0);
          subSurfaceWakeRef.current.position.y = -subCurrentY; // Sit exactly at water plane y = 0
        }
      }

      // Silent Mode Anechoic Shielding Visual
      if (subSilentFieldRef.current) {
        subSilentFieldRef.current.visible = isSilent;
        if (isSilent) {
          const pulse = 1.0 + Math.sin(t * 3.5) * 0.04;
          subSilentFieldRef.current.scale.set(pulse, pulse, pulse);
        }
      }
    }

    // 1b. Russian Fast Attack Submarine (Akula-I Class) Stalker Simulation
    if (russianSubGroupRef.current) {
      // Akula stalks behind and below the Ohio SSBN
      const stalkX = subCurrentX - 165;
      let stalkY = -35;
      let stalkZ = -38;
      let akulaYaw = 0;

      if (telemetry.countermeasuresActive && activeDecoyRef.current && activeDecoyRef.current.active) {
        // Akula is seduced by decoy: turns towards decoy!
        stalkZ = activeDecoyRef.current.z + 12;
        akulaYaw = 0.22;
      } else if (pattern === 'SERPENTINE' || pattern === 'BAFFLE_CLEAR') {
        // Akula struggles with TMA solution: wobbles with delayed tracking
        stalkZ = -38 + Math.sin((t - 2) * 0.3) * 14;
        akulaYaw = Math.cos((t - 2) * 0.3) * 0.15;
      } else if (isSilent) {
        // Akula lost acoustic contact, sweeps slowly
        stalkZ = -38 + Math.sin(t * 0.15) * 8;
        akulaYaw = Math.sin(t * 0.15) * 0.08;
      }

      russianSubGroupRef.current.position.set(stalkX, stalkY, stalkZ);
      russianSubGroupRef.current.rotation.set(0, akulaYaw, 0);

      // Spin Akula sabre propeller
      if (russianSubScrewRef.current) {
        russianSubScrewRef.current.rotation.x += 0.22;
      }

      // Sonar ping wavefront animation
      sonarPingWavesRef.current.forEach((wave, idx) => {
        const progress = ((t * 0.35 + idx * 0.33) % 1.0);
        const radius = 4 + progress * 170;
        wave.scale.set(radius, radius, radius);
        wave.position.set(stalkX + 56, stalkY, stalkZ);
        const mat = wave.material as THREE.MeshBasicMaterial;
        if (isSilent) {
          mat.opacity = Math.max(0, (1 - progress) * 0.12);
        } else {
          mat.opacity = Math.max(0, (1 - progress) * 0.45);
        }
      });
    }

    // 1c. Acoustic Countermeasure Decoy Dynamics
    if (decoyGroupRef.current) {
      if (activeDecoyRef.current && activeDecoyRef.current.active) {
        const age = t - activeDecoyRef.current.birthTime;
        if (age >= 0 && age < 25) {
          decoyGroupRef.current.visible = true;
          // Decoy slowly drifts and bubble cloud rises toward thermocline
          decoyGroupRef.current.position.set(
            activeDecoyRef.current.x - age * 0.4,
            activeDecoyRef.current.y + Math.min(14, age * 0.5),
            activeDecoyRef.current.z
          );
          // Pulsing acoustic noisemaker beacon
          const beacon = decoyGroupRef.current.getObjectByName('decoyBeacon');
          if (beacon) {
            const bPulse = 1.0 + Math.sin(t * 10) * 0.35;
            beacon.scale.set(bPulse, bPulse, bPulse);
          }
        } else {
          decoyGroupRef.current.visible = false;
        }
      } else {
        decoyGroupRef.current.visible = false;
      }
    }

    // 2. Trident Missile Position & Gravity-Turn Attitude
    if (missileGroupRef.current) {
      // Trajectory: emerges from Tube #4, ascends through water column, and arches downrange along -Z
      let visualX = 0;
      let visualY: number;
      let visualZ: number;

      if (t < 5.8) {
        // Underwater ejection: from Tube #4 (-14m) to surface (0m)
        const tRel = Math.max(0, t - 3.0);
        visualX = subCurrentX - 16.4;
        visualY = (subCurrentY + 8.0) + (tRel / 2.8) * (-subCurrentY - 8.0);
        visualZ = subCurrentZ;
      } else if (stage === 'TARGET_IMPACT') {
        visualX = 0;
        visualY = 0.5;
        visualZ = -1200;
      } else {
        // Boost & Exoatmospheric Trajectory
        visualX = 0;
        visualY = Math.max(0, alt * 0.45);
        visualZ = -(downrange * 0.35);
      }

      missileGroupRef.current.position.set(visualX, visualY, visualZ);

      // Attitude Rotation (pitch angle: 90 = vertical up, 0 = horizontal downrange, -90 = straight down)
      const rad = (pitch * Math.PI) / 180;
      missileGroupRef.current.rotation.x = -(Math.PI / 2 - rad);

      // Spin Trident rear rotating screw (prop)
      if (missileScrewRef.current) {
        const isBoost = stage === 'STAGE_1' || stage === 'STAGE_2' || stage === 'STAGE_3' || stage === 'MOTOR_IGNITION';
        const screwSpeed = isBoost ? 0.45 : 0.28;
        missileScrewRef.current.rotation.y += screwSpeed;
      }

      // Dynamic Sun & Engine Light tracking
      if (sunLightRef.current) {
        sunLightRef.current.position.set(20, visualY + 40, visualZ + 35);
        sunLightRef.current.target.position.set(0, visualY, visualZ);
        sunLightRef.current.target.updateMatrixWorld();
      }

      // Steam Cavity Bubble Envelope Visibility
      if (steamBubbleMeshRef.current) {
        const isSubmerged = stage === 'PRE_LAUNCH_4KT' || stage === 'SUB_BUBBLE_EJECT' || stage === 'BUBBLE_BURST';
        steamBubbleMeshRef.current.visible = isSubmerged && bubbleInt > 5;
        if (isSubmerged) {
          const pulse = 1.0 + Math.sin(t * 16) * 0.08;
          steamBubbleMeshRef.current.scale.set(pulse, 1.0, pulse);
        }
      }

      // Rising Cavitation Bubble Particles inside water column
      if (bubbleParticlesRef.current) {
        bubbleParticlesRef.current.visible = stage === 'SUB_BUBBLE_EJECT';
        if (stage === 'SUB_BUBBLE_EJECT') {
          bubbleParticlesRef.current.rotation.y += 0.06;
        }
      }

      // Ocean Surface Cavitation Burst Ring
      if (bubbleBurstMeshRef.current) {
        if (stage === 'BUBBLE_BURST') {
          const bScale = Math.max(1, (t - 5.8) * 22);
          bubbleBurstMeshRef.current.scale.set(bScale, bScale, 1);
          (bubbleBurstMeshRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 - (t - 5.8) * 0.9);
        } else {
          (bubbleBurstMeshRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      }

      // Rocket Motor Exhaust Plumes & Lighting
      const isMotorFired = stage === 'AEROSPIKE' || stage === 'STAGE_1' || stage === 'STAGE_2' || stage === 'STAGE_3';
      
      if (flameInnerMeshRef.current && flameOuterMeshRef.current && flameLightRef.current) {
        flameInnerMeshRef.current.visible = isMotorFired;
        flameOuterMeshRef.current.visible = isMotorFired;
        flameLightRef.current.visible = isMotorFired;

        if (isMotorFired) {
          const flicker = 0.9 + Math.random() * 0.25;
          flameInnerMeshRef.current.scale.set(flicker, flicker * 1.2, flicker);
          flameOuterMeshRef.current.scale.set(flicker * 1.1, flicker * 1.3, flicker * 1.1);

          // Adjust plume base position to active stage
          let nozzleY = -6.0;
          if (stage === 'STAGE_3') nozzleY = 10.0;
          else if (stage === 'STAGE_2') nozzleY = 3.5;
          
          flameInnerMeshRef.current.position.y = nozzleY;
          flameOuterMeshRef.current.position.y = nozzleY - 2.0;
          flameLightRef.current.position.y = nozzleY - 4.0;
          flameLightRef.current.intensity = 5.0 + Math.random() * 2.0;
        }
      }

      // Telescoping Aerospike Extension
      if (aerospikeMeshRef.current) {
        const hasSpike = stage !== 'PRE_LAUNCH_4KT' && stage !== 'SUB_BUBBLE_EJECT' && stage !== 'BUBBLE_BURST';
        aerospikeMeshRef.current.visible = hasSpike && stage !== 'PLATFORM_DEPLOY' && stage !== 'WARHEAD_RELEASE' && stage !== 'REENTRY_STREAK' && stage !== 'TARGET_IMPACT';
      }

      // Supersonic Bow Shock Cone
      if (shockConeMeshRef.current) {
        shockConeMeshRef.current.visible = shockConeVisible && (stage === 'AEROSPIKE' || stage === 'STAGE_1');
      }

      // Stage Separations (Stage 1, Stage 2, Stage 3 dropping behind)
      if (stage1MeshRef.current) {
        if (t >= 28.0) {
          const tSep1 = t - 28.0;
          stage1MeshRef.current.position.y = 4.75 - Math.pow(tSep1, 1.4) * 4;
          stage1MeshRef.current.visible = tSep1 < 8;
        } else {
          stage1MeshRef.current.position.y = 4.75;
          stage1MeshRef.current.visible = true;
        }
      }

      if (stage2MeshRef.current) {
        if (t >= 45.0) {
          const tSep2 = t - 45.0;
          stage2MeshRef.current.position.y = 12.5 - Math.pow(tSep2, 1.4) * 4;
          stage2MeshRef.current.visible = tSep2 < 8;
        } else {
          stage2MeshRef.current.position.y = 12.5;
          stage2MeshRef.current.visible = true;
        }
      }

      if (stage3MeshRef.current) {
        if (t >= 60.0) {
          const tSep3 = t - 60.0;
          stage3MeshRef.current.position.y = 18.0 - Math.pow(tSep3, 1.4) * 4;
          stage3MeshRef.current.visible = tSep3 < 8;
        } else {
          stage3MeshRef.current.position.y = 18.0;
          stage3MeshRef.current.visible = true;
        }
      }

      // Nose Shroud Fairings (splitting apart at PLATFORM_DEPLOY)
      if (noseFairingLeftRef.current && noseFairingRightRef.current) {
        if (stage === 'PLATFORM_DEPLOY' || stage === 'WARHEAD_RELEASE' || stage === 'REENTRY_STREAK' || stage === 'TARGET_IMPACT') {
          const deployT = Math.min(8, t - 72.0);
          noseFairingLeftRef.current.position.x = -deployT * 2.2;
          noseFairingLeftRef.current.position.z = -deployT * 1.8;
          noseFairingLeftRef.current.rotation.z = deployT * 0.45;
          noseFairingRightRef.current.position.x = deployT * 2.2;
          noseFairingRightRef.current.position.z = deployT * 1.8;
          noseFairingRightRef.current.rotation.z = -deployT * 0.45;
        } else {
          noseFairingLeftRef.current.position.set(0, 2.5, 0);
          noseFairingRightRef.current.position.set(0, 2.5, 0);
          noseFairingLeftRef.current.rotation.set(0, 0, 0);
          noseFairingRightRef.current.rotation.set(0, Math.PI, 0);
        }
      }

      // Post-Boost Vehicle Vernier Thrusters
      thrusterPlumesRef.current.forEach((plume) => {
        const isFiring = stage === 'REACH_ATTITUDE' || stage === 'PLATFORM_DEPLOY';
        (plume.material as THREE.MeshBasicMaterial).opacity = isFiring ? (0.5 + Math.random() * 0.5) : 0;
      });

      // 4 Mk 4/5 Reentry Vehicles Separation
      warheadsRef.current.forEach((wh, idx) => {
        if (stage === 'WARHEAD_RELEASE' || stage === 'REENTRY_STREAK' || stage === 'TARGET_IMPACT') {
          const tSep = Math.min(30, t - 82.0);
          const offsetBias = isGss ? (idx - 1.5) * 1.2 : ((idx - 1.5) * 6.0 + 35.0);
          wh.position.x = Math.cos(idx * Math.PI / 2) * (1.2 + tSep * 0.45) + (offsetBias * 0.02);
          wh.position.z = (idx - 1.5) * (tSep * 0.55);
          wh.position.y = 3.5 - tSep * 0.2;
        } else {
          const ang = idx * Math.PI / 2;
          wh.position.set(Math.cos(ang) * 1.1, 3.5, Math.sin(ang) * 1.1);
        }
      });
    }

    // Reentry Plasma Trails behind warheads
    plasmaTrailsRef.current.forEach((line, idx) => {
      if (stage === 'REENTRY_STREAK' && missileGroupRef.current) {
        const mPos = missileGroupRef.current.position;
        const wh = warheadsRef.current[idx];
        const pArr = (line.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
        pArr[0] = mPos.x + wh.position.x;
        pArr[1] = mPos.y + wh.position.y;
        pArr[2] = mPos.z + wh.position.z;
        pArr[3] = mPos.x + wh.position.x;
        pArr[4] = mPos.y + wh.position.y + 45;
        pArr[5] = mPos.z + wh.position.z + 25;
        line.geometry.attributes.position.needsUpdate = true;
        (line.material as THREE.LineBasicMaterial).opacity = 0.9;
      } else {
        (line.material as THREE.LineBasicMaterial).opacity = 0;
      }
    });

    // Detonation Nuclear Flash at Target Silo
    if (detonationFlashRef.current) {
      if (stage === 'TARGET_IMPACT') {
        const tFlash = t - 110.0;
        const flashScale = Math.min(5.0, 1.0 + tFlash * 4.0);
        detonationFlashRef.current.scale.set(flashScale, flashScale, flashScale);
        const targetX = isGss ? 0 : 65;
        detonationFlashRef.current.position.set(targetX, 10, -1200);
        (detonationFlashRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.95 - tFlash * 0.2);
      } else {
        (detonationFlashRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
      }
    }

    // Camera Framing: Centered prominently on the Trident II missile
    if (cameraRef.current && missileGroupRef.current) {
      const mPos = missileGroupRef.current.position;
      const distScale = userOrbitRef.current.distanceFactor;
      const { rotX, rotY, panX = 0, panY = 0 } = userOrbitRef.current;

      const targetLookAt = new THREE.Vector3(mPos.x, mPos.y + 10, mPos.z);
      const targetCamPos = new THREE.Vector3();

      if (cameraMode === 'TACTICAL_EVASION') {
        // Wide tactical view framing both Ohio SSBN and the stalking Russian Akula SSN
        if (subGroupRef.current) {
          const sPos = subGroupRef.current.position;
          targetLookAt.set(sPos.x - 70, sPos.y - 4, sPos.z - 15);
          targetCamPos.set(
            sPos.x - 60 + 130 * distScale,
            sPos.y + 35 * distScale,
            sPos.z + 125 * distScale
          );
        }
      } else if (cameraMode === 'SUB_4KT') {
        // Close perspective tracking Ohio-class sub at 4 knots
        if (subGroupRef.current) {
          const sPos = subGroupRef.current.position;
          targetLookAt.set(sPos.x, sPos.y + 5, sPos.z);
          targetCamPos.set(
            sPos.x + 26 * distScale,
            sPos.y + 8 * distScale,
            sPos.z + 28 * distScale
          );
        }
      } else if (cameraMode === 'BUBBLE_CAM') {
        // Close-up examining supercavitating steam bubble around the missile
        targetLookAt.set(mPos.x, mPos.y + 8, mPos.z);
        targetCamPos.set(
          mPos.x + 14 * distScale,
          mPos.y + 8 * distScale,
          mPos.z + 18 * distScale
        );
      } else if (cameraMode === 'PLATFORM_BUS') {
        // High-resolution view of PBV platform & warhead deployment
        targetLookAt.set(mPos.x, mPos.y + 20, mPos.z);
        targetCamPos.set(
          mPos.x + 10 * distScale,
          mPos.y + 21 * distScale,
          mPos.z + 13 * distScale
        );
      } else if (cameraMode === 'TARGET_SILO') {
        // Tactical view at reinforced ICBM silo
        targetLookAt.set(0, 0, -1200);
        targetCamPos.set(
          35 * distScale,
          32 * distScale,
          -1140 + (1 - distScale) * 35
        );
      } else if (cameraMode === 'SHIP') {
        // USNS Vanguard downrange perspective
        targetLookAt.set(mPos.x, mPos.y + 10, mPos.z);
        targetCamPos.set(240 * distScale, 20 * distScale, -380 * distScale);
      } else if (cameraMode === 'EARTH_ORBIT') {
        // Global orbital view: Earth globe and full satellite constellation
        const earthCenter = new THREE.Vector3(0, -1200, -250);
        targetLookAt.set(earthCenter.x, earthCenter.y + 1200, earthCenter.z);
        const orbitDist = 3200 * (distScale > 1.2 ? distScale / 1.2 : 1.0);
        targetCamPos.set(
          earthCenter.x + orbitDist * 0.72,
          earthCenter.y + 1200 + orbitDist * 0.55,
          earthCenter.z + orbitDist * 0.78
        );
      } else if (cameraMode === 'SATELLITE_TRACK') {
        // High-precision tracking of selected orbiting satellite
        const satEntry = selectedObjectId ? satelliteMeshesRef.current.get(selectedObjectId) : null;
        if (satEntry) {
          const sPos = satEntry.mesh.position;
          targetLookAt.set(sPos.x, sPos.y, sPos.z);
          targetCamPos.set(
            sPos.x + 35 * distScale,
            sPos.y + 20 * distScale,
            sPos.z + 45 * distScale
          );
        } else {
          targetLookAt.set(mPos.x, mPos.y + 10, mPos.z);
          targetCamPos.set(
            mPos.x + 20 * distScale,
            mPos.y + 10 * distScale,
            mPos.z + 28 * distScale
          );
        }
      } else {
        // Default FOLLOW camera: missile is centered, majestic, and prominently fills the frame
        targetLookAt.set(mPos.x, mPos.y + 10, mPos.z);
        targetCamPos.set(
          mPos.x + 20 * distScale,
          mPos.y + 10 * distScale,
          mPos.z + 28 * distScale
        );
      }

      // Dynamic Fog & Starfield adaptation for deep orbital distances
      if (sceneRef.current?.fog) {
        const targetFog = distScale > 2.0 
          ? Math.max(0.000006, 0.00035 / (1 + (distScale - 2.0) * 0.75))
          : 0.00035;
        (sceneRef.current.fog as THREE.FogExp2).density = targetFog;
      }

      // Update Earth and Clouds planetary rotation
      if (earthCloudsRef.current) {
        earthCloudsRef.current.rotation.y = t * 0.003;
      }
      if (earthGroupRef.current && earthGroupRef.current.children[0]) {
        earthGroupRef.current.children[0].rotation.y = t * 0.0008;
      }

      // Propagate Orbiting Military Satellites
      const earthCenterPos = new THREE.Vector3(0, -1200, -250);
      satelliteMeshesRef.current.forEach((item, satId) => {
        const sat = SATELLITE_DEFINITIONS.find(s => s.id === satId);
        if (!sat) return;
        const curAngle = sat.orbitPhaseOffset + t * sat.orbitSpeed;
        const sx = sat.orbitRadius * Math.cos(curAngle);
        const sz = sat.orbitRadius * Math.sin(curAngle);
        const sy = sz * Math.sin(sat.orbitInclination);
        const szInclined = sz * Math.cos(sat.orbitInclination);

        item.mesh.position.set(
          earthCenterPos.x + sx,
          earthCenterPos.y + sy,
          earthCenterPos.z + szInclined
        );

        // Nadir pointing: Orient sensor arrays towards Earth center
        item.mesh.lookAt(earthCenterPos.x, earthCenterPos.y, earthCenterPos.z);
      });

      // Update 3D Tactical Selection Reticle
      if (selectionReticleRef.current && cameraRef.current) {
        if (selectedObjectId) {
          let targetWorldPos: THREE.Vector3 | null = null;
          if (selectedObjectId === 'trident-missile' && missileGroupRef.current) {
            targetWorldPos = missileGroupRef.current.position.clone().add(new THREE.Vector3(0, 10, 0));
          } else if (selectedObjectId === 'uss-ohio' && subGroupRef.current) {
            targetWorldPos = subGroupRef.current.position.clone();
          } else if (selectedObjectId === 'akula-pantera' && russianSubGroupRef.current) {
            targetWorldPos = russianSubGroupRef.current.position.clone();
          } else if (selectedObjectId === 'earth-globe' && earthGroupRef.current) {
            targetWorldPos = new THREE.Vector3(earthCenterPos.x, 0, earthCenterPos.z);
          } else if (selectedObjectId === 'target-silo' && targetComplexRef.current) {
            targetWorldPos = targetComplexRef.current.position.clone();
          } else if (selectedObjectId === 'usns-vanguard') {
            targetWorldPos = new THREE.Vector3(240, 5, -380);
          } else if (selectedObjectId === 'decoy-mk3' && decoyGroupRef.current) {
            targetWorldPos = decoyGroupRef.current.position.clone();
          } else if (satelliteMeshesRef.current.has(selectedObjectId)) {
            targetWorldPos = satelliteMeshesRef.current.get(selectedObjectId)!.mesh.position.clone();
          }

          if (targetWorldPos) {
            selectionReticleRef.current.visible = true;
            selectionReticleRef.current.position.copy(targetWorldPos);
            selectionReticleRef.current.quaternion.copy(cameraRef.current.quaternion);
            const dist = cameraRef.current.position.distanceTo(targetWorldPos);
            const reticleScale = Math.max(0.4, dist * 0.042);
            selectionReticleRef.current.scale.set(reticleScale, reticleScale, reticleScale);
            selectionReticleRef.current.rotateZ(t * 0.35);
          } else {
            selectionReticleRef.current.visible = false;
          }
        } else {
          selectionReticleRef.current.visible = false;
        }
      }

      // Apply 3D camera pan offsets relative to view orientation
      if (panX !== 0 || panY !== 0) {
        const camDir = new THREE.Vector3().subVectors(targetLookAt, targetCamPos).normalize();
        const camRight = new THREE.Vector3().crossVectors(camDir, new THREE.Vector3(0, 1, 0)).normalize();
        const camUp = new THREE.Vector3().crossVectors(camRight, camDir).normalize();
        const panOffset = new THREE.Vector3()
          .addScaledVector(camRight, panX)
          .addScaledVector(camUp, panY);
        targetLookAt.add(panOffset);
        targetCamPos.add(panOffset);
      }

      // Apply interactive orbit angles around targetLookAt
      if (rotX !== 0 || rotY !== 0) {
        const relX = targetCamPos.x - targetLookAt.x;
        const relY = targetCamPos.y - targetLookAt.y;
        const relZ = targetCamPos.z - targetLookAt.z;

        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);

        const rx = relX * cosY - relZ * sinY;
        const rz = relX * sinY + relZ * cosY;
        const ry = relY * cosX - rz * sinX;
        const rz2 = relY * sinX + rz * cosX;

        cameraRef.current.position.set(
          targetLookAt.x + rx,
          targetLookAt.y + ry,
          targetLookAt.z + rz2
        );
      } else {
        cameraRef.current.position.copy(targetCamPos);
      }

      cameraRef.current.lookAt(targetLookAt);
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, [cameraMode, shockConeVisible, telemetry.gssEnabled]);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060c18);
    scene.fog = new THREE.FogExp2(0x060c18, 0.00035);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 65000);
    camera.position.set(22, 10, 30);
    camera.lookAt(0, 10, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    containerRef.current.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // --- LIGHTING SETUP (High contrast & full illumination) ---
    const ambientLight = new THREE.AmbientLight(0x64748b, 1.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 3.2);
    sunLight.position.set(20, 50, 40);
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Blue earthshine fill light from below
    const earthshineLight = new THREE.DirectionalLight(0x38bdf8, 1.6);
    earthshineLight.position.set(-30, -20, -20);
    scene.add(earthshineLight);

    // Dynamic Rocket Motor Fire PointLight
    const flamePointLight = new THREE.PointLight(0xff8822, 6.0, 120);
    flamePointLight.visible = false;
    scene.add(flamePointLight);
    flameLightRef.current = flamePointLight;

    // --- 360-DEGREE SPHERICAL STARFIELD ---
    const starCount = 3800;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 2400 + Math.random() * 1600;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.4, sizeAttenuation: true });
    scene.add(new THREE.Points(starGeo, starMat));

    // --- 3D EARTH GLOBE & PLANETARY ATMOSPHERE ---
    const earthGroup = new THREE.Group();
    earthGroup.position.set(0, -1200, -250);
    earthGroup.userData = { objectId: 'earth-globe', name: 'Planet Earth (Terra)' };
    earthGroupRef.current = earthGroup;

    // Earth Sphere with procedural oceans, continents, and graticule
    const earthGeo = new THREE.SphereGeometry(1200, 64, 48);
    const earthTexture = createEarthTexture();
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.75,
      metalness: 0.15
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.userData = { objectId: 'earth-globe', name: 'Planet Earth (Terra)' };
    earthGroup.add(earthMesh);

    // Atmospheric Cloud Layer
    const cloudsGeo = new THREE.SphereGeometry(1206, 48, 36);
    const cloudsMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.22,
      roughness: 0.9
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    earthGroup.add(cloudsMesh);
    earthCloudsRef.current = cloudsMesh;

    // Atmospheric Limb Glow Halo
    const atmosphereGeo = new THREE.SphereGeometry(1235, 48, 36);
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.28
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    earthGroup.add(atmosphereMesh);
    earthAtmosphereRef.current = atmosphereMesh;

    scene.add(earthGroup);

    // --- MILITARY ORBITING SATELLITES & CONSTELLATION ORBITS ---
    const satMap = new Map<string, { mesh: THREE.Group; hitMesh: THREE.Mesh | THREE.Group; orbitRadius: number; speed: number; inclination: number; phase: number }>();
    const satOrbitLines: THREE.Line[] = [];

    SATELLITE_DEFINITIONS.forEach((satDef) => {
      // 1. Satellite 3D Group
      const satGroup = createSatelliteMesh(satDef);
      scene.add(satGroup);

      // 2. Orbital Trajectory Path (Inclined circular ring)
      const numPts = 96;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= numPts; i++) {
        const theta = (i / numPts) * Math.PI * 2;
        const ox = satDef.orbitRadius * Math.cos(theta);
        const oz = satDef.orbitRadius * Math.sin(theta);
        const oy = oz * Math.sin(satDef.orbitInclination);
        const ozInc = oz * Math.cos(satDef.orbitInclination);
        pts.push(new THREE.Vector3(ox, oy - 1200, ozInc - 250));
      }
      const orbGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const orbMat = new THREE.LineBasicMaterial({
        color: satDef.colorHex,
        transparent: true,
        opacity: 0.45
      });
      const orbLine = new THREE.Line(orbGeo, orbMat);
      scene.add(orbLine);
      satOrbitLines.push(orbLine);

      // Hit mesh reference for raycasting
      const hitMesh = satGroup.children.find(c => (c as THREE.Mesh).geometry instanceof THREE.SphereGeometry) as THREE.Mesh;

      satMap.set(satDef.id, {
        mesh: satGroup,
        hitMesh: hitMesh || satGroup,
        orbitRadius: satDef.orbitRadius,
        speed: satDef.orbitSpeed,
        inclination: satDef.orbitInclination,
        phase: satDef.orbitPhaseOffset
      });
    });

    satelliteMeshesRef.current = satMap;
    satelliteOrbitsRef.current = satOrbitLines;

    // --- 3D TACTICAL SELECTION RETICLE ---
    const reticleGroup = new THREE.Group();
    reticleGroup.visible = false;

    // Targeting Ring
    const retRing = new THREE.Mesh(
      new THREE.RingGeometry(1.2, 1.4, 32),
      new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    );
    reticleGroup.add(retRing);

    // 4 Corner brackets
    const bLen = 0.5;
    const bDist = 1.8;
    const bPoints = [
      // Top-right
      [new THREE.Vector3(bDist - bLen, bDist, 0), new THREE.Vector3(bDist, bDist, 0), new THREE.Vector3(bDist, bDist - bLen, 0)],
      // Top-left
      [new THREE.Vector3(-bDist + bLen, bDist, 0), new THREE.Vector3(-bDist, bDist, 0), new THREE.Vector3(-bDist, bDist - bLen, 0)],
      // Bottom-left
      [new THREE.Vector3(-bDist + bLen, -bDist, 0), new THREE.Vector3(-bDist, -bDist, 0), new THREE.Vector3(-bDist, -bDist + bLen, 0)],
      // Bottom-right
      [new THREE.Vector3(bDist - bLen, -bDist, 0), new THREE.Vector3(bDist, -bDist, 0), new THREE.Vector3(bDist, -bDist + bLen, 0)]
    ];
    bPoints.forEach((pts) => {
      const bGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const bMat = new THREE.LineBasicMaterial({ color: 0x10b981 });
      reticleGroup.add(new THREE.Line(bGeo, bMat));
    });
    scene.add(reticleGroup);
    selectionReticleRef.current = reticleGroup;

    // --- DEEP OCEAN WATER SURFACE PLANE ---
    const oceanGeo = new THREE.PlaneGeometry(5000, 5000, 48, 48);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0f2942,
      roughness: 0.12,
      metalness: 0.88,
      transparent: true,
      opacity: 0.92
    });
    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    oceanMesh.rotation.x = -Math.PI / 2;
    oceanMesh.position.y = 0;
    scene.add(oceanMesh);

    // Ocean grid tactical overlay
    const gridHelper = new THREE.GridHelper(3500, 70, 0x0284c7, 0x1e293b);
    gridHelper.position.y = 0.1;
    scene.add(gridHelper);

    // Undersea Floor / Seamount
    const seaFloorGeo = new THREE.PlaneGeometry(2500, 2500, 24, 24);
    const seaFloorMat = new THREE.MeshStandardMaterial({ color: 0x030811, roughness: 0.95 });
    const seaFloor = new THREE.Mesh(seaFloorGeo, seaFloorMat);
    seaFloor.rotation.x = -Math.PI / 2;
    seaFloor.position.y = -90;
    scene.add(seaFloor);

    // ==========================================
    // 1. OHIO-CLASS SUBMARINE (CENTERED BENEATH LAUNCH POINT)
    // ==========================================
    const subGroup = new THREE.Group();
    subGroup.position.set(0, -22, 0);
    subGroup.userData = { objectId: 'uss-ohio', name: 'USS Ohio (SSBN-726)' };
    subGroupRef.current = subGroup;

    // Submarine raycast hit box
    const subHitBox = new THREE.Mesh(new THREE.BoxGeometry(160, 26, 26), new THREE.MeshBasicMaterial({ visible: false }));
    subHitBox.userData = { objectId: 'uss-ohio', name: 'USS Ohio (SSBN-726)' };
    subGroup.add(subHitBox);

    // Submarine Hull (Black anechoic tiles)
    const hullGeo = new THREE.CylinderGeometry(8.5, 8.5, 140, 32);
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.8,
      roughness: 0.3
    });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.rotation.z = Math.PI / 2;
    subGroup.add(hull);

    // Rounded Bow Dome (BQQ-6 Spherical Sonar Dome)
    const bowGeo = new THREE.SphereGeometry(8.5, 24, 16);
    const bow = new THREE.Mesh(bowGeo, hullMat);
    bow.position.set(70, 0, 0);
    subGroup.add(bow);

    // Tapered Stern Conical Hull
    const sternGeo = new THREE.ConeGeometry(8.5, 26, 24);
    const stern = new THREE.Mesh(sternGeo, hullMat);
    stern.rotation.z = -Math.PI / 2;
    stern.position.set(-83, 0, 0);
    subGroup.add(stern);

    // Conning Tower Sail
    const sailGeo = new THREE.BoxGeometry(18, 14, 6.0);
    const sailMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.7, roughness: 0.3 });
    const sail = new THREE.Mesh(sailGeo, sailMat);
    sail.position.set(22, 10, 0);
    subGroup.add(sail);

    // Sail Fairwater Dive Planes
    const sailPlanesGeo = new THREE.BoxGeometry(6, 0.8, 14);
    const sailPlanes = new THREE.Mesh(sailPlanesGeo, sailMat);
    sailPlanes.position.set(22, 11, 0);
    subGroup.add(sailPlanes);

    // Steerable Vertical Upper Rudder Fin
    const rudderUpperGeo = new THREE.BoxGeometry(4.0, 10.0, 1.2);
    const rudderUpper = new THREE.Mesh(rudderUpperGeo, sailMat);
    rudderUpper.position.set(-78, 8.5, 0);
    subGroup.add(rudderUpper);
    subRudderUpperRef.current = rudderUpper;

    // Steerable Vertical Lower Rudder Fin
    const rudderLower = new THREE.Mesh(rudderUpperGeo, sailMat);
    rudderLower.position.set(-78, -8.5, 0);
    subGroup.add(rudderLower);
    subRudderLowerRef.current = rudderLower;

    // Stern Horizontal Stabilizers & Dive Planes
    const sternPlanesGeo = new THREE.BoxGeometry(5.0, 1.2, 22.0);
    const sternPlanes = new THREE.Mesh(sternPlanesGeo, sailMat);
    sternPlanes.position.set(-78, 0, 0);
    subGroup.add(sternPlanes);

    // Stern 7-Bladed Skewed Bronze Screw Propulsor
    const subScrewGroup = new THREE.Group();
    subScrewGroup.position.set(-96, 0, 0);

    const screwHubGeo = new THREE.CylinderGeometry(2.2, 1.4, 4.0, 16);
    const screwBronzeMat = new THREE.MeshStandardMaterial({ 
      color: 0xcd7f32, // phosphor marine bronze
      metalness: 0.85, 
      roughness: 0.25 
    });
    const screwHub = new THREE.Mesh(screwHubGeo, screwBronzeMat);
    screwHub.rotation.z = Math.PI / 2;
    subScrewGroup.add(screwHub);

    // 7 Skewed Hydrodynamic Propeller Blades
    const subBladeGeo = new THREE.BoxGeometry(0.35, 4.8, 1.8);
    for (let b = 0; b < 7; b++) {
      const blade = new THREE.Mesh(subBladeGeo, screwBronzeMat);
      const angle = (b * Math.PI * 2) / 7;
      blade.position.set(-0.2, Math.sin(angle) * 3.2, Math.cos(angle) * 3.2);
      blade.rotation.x = angle;
      blade.rotation.y = 0.45; // pitch angle
      blade.rotation.z = 0.15; // skew
      subScrewGroup.add(blade);
    }
    subGroup.add(subScrewGroup);
    subScrewRef.current = subScrewGroup;

    // Surface Mode Waterline Foam Wake Ring
    const wakeGeo = new THREE.RingGeometry(4.0, 18.0, 32);
    const wakeMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    const surfaceWake = new THREE.Mesh(wakeGeo, wakeMat);
    surfaceWake.rotation.x = -Math.PI / 2;
    surfaceWake.scale.set(6.0, 1.2, 1.0); // elongated along sub length
    surfaceWake.visible = false;
    subGroup.add(surfaceWake);
    subSurfaceWakeRef.current = surfaceWake;

    // Super Silent Anechoic Acoustic Dampening Glow
    const silentShieldGeo = new THREE.CylinderGeometry(10.5, 10.5, 150, 24);
    const silentShieldMat = new THREE.MeshBasicMaterial({ 
      color: 0x38bdf8, 
      transparent: true, 
      opacity: 0.12, 
      wireframe: true 
    });
    const silentShield = new THREE.Mesh(silentShieldGeo, silentShieldMat);
    silentShield.rotation.z = Math.PI / 2;
    silentShield.visible = false;
    subGroup.add(silentShield);
    subSilentFieldRef.current = silentShield;

    // 24 Missile Tube Hatches (Tube #4 is active and highlighted)
    const hatchMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.6 });
    const openHatchMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.1 });
    for (let i = 0; i < 12; i++) {
      [-2.8, 2.8].forEach((zOff) => {
        const xPos = -35 + i * 6.2;
        const isTube4 = i === 3 && zOff > 0;
        const hatchGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.5, 20);
        const hatch = new THREE.Mesh(hatchGeo, isTube4 ? openHatchMat : hatchMat);
        hatch.position.set(xPos, 8.7, zOff);
        subGroup.add(hatch);
      });
    }
    scene.add(subGroup);

    // ==========================================
    // 1b. RUSSIAN FAST ATTACK SUB (PROJECT 971 AKULA-I CLASS)
    // ==========================================
    const russianSubGroup = new THREE.Group();
    russianSubGroup.position.set(-165, -35, -38);
    russianSubGroup.userData = { objectId: 'akula-pantera', name: 'K-317 Pantera (Akula-I)' };
    russianSubGroupRef.current = russianSubGroup;

    // Akula raycast hit box
    const akulaHitBox = new THREE.Mesh(new THREE.BoxGeometry(130, 24, 24), new THREE.MeshBasicMaterial({ visible: false }));
    akulaHitBox.userData = { objectId: 'akula-pantera', name: 'K-317 Pantera (Akula-I)' };
    russianSubGroup.add(akulaHitBox);

    // Akula Hull (Dark Russian Naval Steel)
    const akulaHullGeo = new THREE.CylinderGeometry(6.6, 6.6, 110, 32);
    const akulaHullMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.85,
      roughness: 0.28
    });
    const akulaHull = new THREE.Mesh(akulaHullGeo, akulaHullMat);
    akulaHull.rotation.z = Math.PI / 2;
    russianSubGroup.add(akulaHull);

    // Akula Bow MGK-540 Skat-3 Sonar Dome
    const akulaBowGeo = new THREE.SphereGeometry(6.6, 24, 16);
    const akulaBow = new THREE.Mesh(akulaBowGeo, akulaHullMat);
    akulaBow.position.set(55, 0, 0);
    russianSubGroup.add(akulaBow);

    // Akula Tapered Stern
    const akulaSternGeo = new THREE.ConeGeometry(6.6, 26, 24);
    const akulaStern = new THREE.Mesh(akulaSternGeo, akulaHullMat);
    akulaStern.rotation.z = -Math.PI / 2;
    akulaStern.position.set(-68, 0, 0);
    russianSubGroup.add(akulaStern);

    // Akula Streamlined Teardrop Conning Tower Sail
    const akulaSailGeo = new THREE.BoxGeometry(18, 9.5, 4.4);
    const akulaSail = new THREE.Mesh(akulaSailGeo, akulaHullMat);
    akulaSail.position.set(16, 7.5, 0);
    russianSubGroup.add(akulaSail);

    // Signature Akula Towed-Array Pod Capsule on Upper Rudder
    const akulaRudderGeo = new THREE.BoxGeometry(3.5, 9.0, 1.0);
    const akulaRudder = new THREE.Mesh(akulaRudderGeo, akulaHullMat);
    akulaRudder.position.set(-64, 7.5, 0);
    russianSubGroup.add(akulaRudder);

    const akulaPodGeo = new THREE.SphereGeometry(2.4, 18, 18);
    const akulaPodMat = new THREE.MeshStandardMaterial({ color: 0x09090b, metalness: 0.92, roughness: 0.2 });
    const akulaPod = new THREE.Mesh(akulaPodGeo, akulaPodMat);
    akulaPod.scale.set(3.4, 1.0, 1.0);
    akulaPod.position.set(-64, 12.0, 0);
    russianSubGroup.add(akulaPod);

    // Lower Vertical Rudder & Stern Planes
    const akulaLowerRudder = new THREE.Mesh(akulaRudderGeo, akulaHullMat);
    akulaLowerRudder.position.set(-64, -7.5, 0);
    russianSubGroup.add(akulaLowerRudder);

    const akulaPlanesGeo = new THREE.BoxGeometry(4.0, 1.0, 18.0);
    const akulaPlanes = new THREE.Mesh(akulaPlanesGeo, akulaHullMat);
    akulaPlanes.position.set(-64, 0, 0);
    russianSubGroup.add(akulaPlanes);

    // Akula 7-Bladed Sabre Screw Propulsor
    const akulaScrewGeo = new THREE.CylinderGeometry(4.4, 4.4, 3.2, 14);
    const akulaScrewMat = new THREE.MeshStandardMaterial({ color: 0x92400e, metalness: 0.95, roughness: 0.2 });
    const akulaScrew = new THREE.Mesh(akulaScrewGeo, akulaScrewMat);
    akulaScrew.rotation.z = Math.PI / 2;
    akulaScrew.position.set(-82, 0, 0);
    russianSubGroup.add(akulaScrew);
    russianSubScrewRef.current = akulaScrew;

    scene.add(russianSubGroup);

    // Active Sonar Ping Wavefront Pulses (emitted towards Ohio SSBN)
    const pingWaves: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const pingGeo = new THREE.RingGeometry(0.8, 1.6, 32);
      const pingMat = new THREE.MeshBasicMaterial({ 
        color: 0x06b6d4, 
        transparent: true, 
        opacity: 0.35, 
        side: THREE.DoubleSide 
      });
      const pingMesh = new THREE.Mesh(pingGeo, pingMat);
      pingMesh.rotation.y = Math.PI / 2;
      scene.add(pingMesh);
      pingWaves.push(pingMesh);
    }
    sonarPingWavesRef.current = pingWaves;

    // ==========================================
    // 1c. ACOUSTIC COUNTERMEASURE DECOY (ADC-MK3)
    // ==========================================
    const decoyGroup = new THREE.Group();
    decoyGroup.visible = false;
    decoyGroupRef.current = decoyGroup;

    // ADC Mk3 Canister
    const decoyCanGeo = new THREE.CylinderGeometry(0.8, 0.8, 3.4, 16);
    const decoyCanMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.25 });
    const decoyCan = new THREE.Mesh(decoyCanGeo, decoyCanMat);
    decoyCan.rotation.z = Math.PI / 3;
    decoyGroup.add(decoyCan);

    // Pulsing Acoustic Beacon
    const beaconGeo = new THREE.SphereGeometry(2.0, 16, 16);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.5, wireframe: true });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.name = 'decoyBeacon';
    decoyGroup.add(beacon);

    // Effervescent Bubble Cloud
    const decoyBubbleGeo = new THREE.BufferGeometry();
    const decoyBubbleCount = 75;
    const decoyBubblePositions = new Float32Array(decoyBubbleCount * 3);
    for (let i = 0; i < decoyBubbleCount; i++) {
      decoyBubblePositions[i * 3] = (Math.random() - 0.5) * 16;
      decoyBubblePositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      decoyBubblePositions[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    decoyBubbleGeo.setAttribute('position', new THREE.BufferAttribute(decoyBubblePositions, 3));
    const decoyBubbleMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.7, transparent: true, opacity: 0.7 });
    const decoyBubblePoints = new THREE.Points(decoyBubbleGeo, decoyBubbleMat);
    decoyGroup.add(decoyBubblePoints);

    scene.add(decoyGroup);

    // ==========================================
    // 2. USNS VANGUARD SHIP DOWNRANGE
    // ==========================================
    const shipGroup = new THREE.Group();
    shipGroup.position.set(240, 0, -380);
    shipGroup.userData = { objectId: 'usns-vanguard', name: 'USNS Vanguard (T-AGM-19)' };

    const shipHitBox = new THREE.Mesh(new THREE.BoxGeometry(95, 26, 26), new THREE.MeshBasicMaterial({ visible: false }));
    shipHitBox.userData = { objectId: 'usns-vanguard', name: 'USNS Vanguard (T-AGM-19)' };
    shipGroup.add(shipHitBox);

    const shipHullGeo = new THREE.BoxGeometry(85, 14, 20);
    const shipHullMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.35 });
    const shipHull = new THREE.Mesh(shipHullGeo, shipHullMat);
    shipHull.position.y = 5;
    shipGroup.add(shipHull);

    [-25, -9, 9, 25].forEach((xPos, idx) => {
      const rad = idx === 1 || idx === 2 ? 8.0 : 6.0;
      const domeGeo = new THREE.SphereGeometry(rad, 20, 20);
      const domeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
      const dome = new THREE.Mesh(domeGeo, domeMat);
      dome.position.set(xPos, 16, 0);
      shipGroup.add(dome);
    });
    scene.add(shipGroup);

    // ==========================================
    // 3. TARGET SILO COMPLEX DOWNRANGE
    // ==========================================
    const targetGroup = new THREE.Group();
    targetGroup.position.set(0, 0.1, -1200);
    targetGroup.userData = { objectId: 'target-silo', name: 'Hardened ICBM Silo #41' };
    targetComplexRef.current = targetGroup;

    const siloHitBox = new THREE.Mesh(new THREE.BoxGeometry(60, 40, 60), new THREE.MeshBasicMaterial({ visible: false }));
    siloHitBox.userData = { objectId: 'target-silo', name: 'Hardened ICBM Silo #41' };
    targetGroup.add(siloHitBox);

    // Hardened Silo #41 Blast Door
    const siloRingGeo = new THREE.RingGeometry(10, 26, 32);
    const siloRingMat = new THREE.MeshBasicMaterial({ color: 0x475569, side: THREE.DoubleSide });
    const siloRing = new THREE.Mesh(siloRingGeo, siloRingMat);
    siloRing.rotation.x = -Math.PI / 2;
    targetGroup.add(siloRing);

    const doorGeo = new THREE.CircleGeometry(9.0, 32);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.rotation.x = -Math.PI / 2;
    door.position.y = 0.05;
    targetGroup.add(door);

    // Lethal Crater Radius Circle (Green)
    const lethalGeo = new THREE.RingGeometry(75, 78, 48);
    const lethalMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide });
    const lethalCircle = new THREE.Mesh(lethalGeo, lethalMat);
    lethalCircle.rotation.x = -Math.PI / 2;
    targetGroup.add(lethalCircle);

    // Target Crosshair Ring (Red)
    const crosshairGeo = new THREE.RingGeometry(200, 205, 48);
    const crosshairMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
    const crosshair = new THREE.Mesh(crosshairGeo, crosshairMat);
    crosshair.rotation.x = -Math.PI / 2;
    targetGroup.add(crosshair);
    scene.add(targetGroup);

    // Detonation Nuclear Flash Sphere
    const flashGeo = new THREE.SphereGeometry(55, 32, 32);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffedd5, transparent: true, opacity: 0.0 });
    const detFlash = new THREE.Mesh(flashGeo, flashMat);
    detFlash.position.set(0, 15, -1200);
    scene.add(detFlash);
    detonationFlashRef.current = detFlash;

    // ==========================================
    // 4. UGM-133A TRIDENT II MISSILE (PROMINENT & ENLARGED)
    // ==========================================
    const missileGroup = new THREE.Group();
    missileGroup.position.set(0, -14, 0);
    missileGroup.userData = { objectId: 'trident-missile', name: 'UGM-133A Trident II D5' };
    missileGroupRef.current = missileGroup;

    const missileHitBox = new THREE.Mesh(new THREE.CylinderGeometry(5.0, 5.0, 35, 12), new THREE.MeshBasicMaterial({ visible: false }));
    missileHitBox.position.y = 12;
    missileHitBox.userData = { objectId: 'trident-missile', name: 'UGM-133A Trident II D5' };
    missileGroup.add(missileHitBox);

    // --- SUPERCAVITATING STEAM / AIR BUBBLE ENVELOPE ---
    const bubbleGeo = new THREE.SphereGeometry(5.2, 28, 28);
    bubbleGeo.scale(1.0, 3.2, 1.0);
    const bubbleMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.42,
      roughness: 0.1,
      metalness: 0.3
    });
    const steamBubbleMesh = new THREE.Mesh(bubbleGeo, bubbleMat);
    steamBubbleMesh.position.y = 11.0;
    missileGroup.add(steamBubbleMesh);
    steamBubbleMeshRef.current = steamBubbleMesh;

    // Water column bubble particles
    const bubbleCount = 160;
    const bGeo = new THREE.BufferGeometry();
    const bPos = new Float32Array(bubbleCount * 3);
    for (let i = 0; i < bubbleCount * 3; i += 3) {
      bPos[i] = (Math.random() - 0.5) * 8.0;
      bPos[i + 1] = Math.random() * 24 - 4;
      bPos[i + 2] = (Math.random() - 0.5) * 8.0;
    }
    bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
    const bMat = new THREE.PointsMaterial({ color: 0xe0f2fe, size: 2.2, transparent: true, opacity: 0.85 });
    const bubbleParticles = new THREE.Points(bGeo, bMat);
    missileGroup.add(bubbleParticles);
    bubbleParticlesRef.current = bubbleParticles;

    // Bubble Burst Foam Ring at Water Surface
    const burstGeo = new THREE.RingGeometry(3.0, 26.0, 36);
    const burstMat = new THREE.MeshBasicMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.0, side: THREE.DoubleSide });
    const bubbleBurstMesh = new THREE.Mesh(burstGeo, burstMat);
    bubbleBurstMesh.rotation.x = -Math.PI / 2;
    bubbleBurstMesh.position.set(0, 0.2, 0);
    scene.add(bubbleBurstMesh);
    bubbleBurstMeshRef.current = bubbleBurstMesh;

    // --- MISSILE BODIES (HIGH-CONTRAST TACTICAL OFF-WHITE COMPOSITE) ---
    // Stage 1 (Carbon Epoxy Motor with dark interstage ring)
    const stage1Group = new THREE.Group();
    stage1Group.position.y = 4.75;
    const stage1Geo = new THREE.CylinderGeometry(2.6, 2.6, 9.5, 36);
    const stage1Mat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.25, metalness: 0.2 });
    const stage1Mesh = new THREE.Mesh(stage1Geo, stage1Mat);
    stage1Group.add(stage1Mesh);

    // Carbon interstage skirt ring
    const skirtGeo = new THREE.CylinderGeometry(2.65, 2.65, 1.2, 36);
    const skirtMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.5 });
    const skirtMesh = new THREE.Mesh(skirtGeo, skirtMat);
    skirtMesh.position.y = 4.2;
    stage1Group.add(skirtMesh);

    missileGroup.add(stage1Group);
    stage1MeshRef.current = stage1Group as any;

    // Stage 2 (Clean tactical composite with orange stripe)
    const stage2Group = new THREE.Group();
    stage2Group.position.y = 12.5;
    const stage2Geo = new THREE.CylinderGeometry(2.6, 2.6, 6.5, 36);
    const stage2Mat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.2 });
    const stage2Mesh = new THREE.Mesh(stage2Geo, stage2Mat);
    stage2Group.add(stage2Mesh);

    // Interstage 2 ring
    const skirt2Mesh = new THREE.Mesh(skirtGeo, skirtMat);
    skirt2Mesh.position.y = 2.8;
    stage2Group.add(skirt2Mesh);

    missileGroup.add(stage2Group);
    stage2MeshRef.current = stage2Group as any;

    // Stage 3 (Light composite motor casing)
    const stage3Group = new THREE.Group();
    stage3Group.position.y = 18.0;
    const stage3Geo = new THREE.CylinderGeometry(2.5, 2.6, 4.8, 36);
    const stage3Mat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.2 });
    const stage3Mesh = new THREE.Mesh(stage3Geo, stage3Mat);
    stage3Group.add(stage3Mesh);
    missileGroup.add(stage3Group);
    stage3MeshRef.current = stage3Group as any;

    // --- POST-BOOST VEHICLE (PBV) / EQUIPMENT SECTION & MIRV PLATFORM ---
    const pbvGroup = new THREE.Group();
    pbvGroup.position.y = 20.6;
    missileGroup.add(pbvGroup);
    pbvGroupRef.current = pbvGroup;

    // Anodized Gold Bus Core
    const busCoreGeo = new THREE.CylinderGeometry(2.4, 2.4, 1.8, 32);
    const busCoreMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, metalness: 0.85, roughness: 0.2 });
    const busCore = new THREE.Mesh(busCoreGeo, busCoreMat);
    busCore.position.y = 0.9;
    pbvGroup.add(busCore);

    // MIRV Deployment Platform Ring
    const platformGeo = new THREE.CylinderGeometry(2.3, 2.3, 0.6, 28);
    const platformMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.25 });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = 2.1;
    pbvGroup.add(platform);

    // 4 Reentry Vehicles (Mk 4/5 W76/W88 aerodynamic nuclear cones)
    const warheadMeshes: THREE.Mesh[] = [];
    const warheadAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    warheadAngles.forEach((ang) => {
      const whGeo = new THREE.ConeGeometry(0.65, 3.0, 20);
      const whMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.5, roughness: 0.25 });
      const wh = new THREE.Mesh(whGeo, whMat);
      wh.position.set(Math.cos(ang) * 1.1, 3.5, Math.sin(ang) * 1.1);
      pbvGroup.add(wh);
      warheadMeshes.push(wh);
    });
    warheadsRef.current = warheadMeshes;

    // PBV Attitude Vernier Thrusters
    const thrusterPlumes: THREE.Mesh[] = [];
    [-2.35, 2.35].forEach((xOff) => {
      const tGeo = new THREE.ConeGeometry(0.45, 1.4, 16);
      const tMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.0 });
      const plume = new THREE.Mesh(tGeo, tMat);
      plume.rotation.z = xOff > 0 ? -Math.PI / 2 : Math.PI / 2;
      plume.position.set(xOff, 0.9, 0);
      pbvGroup.add(plume);
      thrusterPlumes.push(plume);
    });
    thrusterPlumesRef.current = thrusterPlumes;

    // Nose Shroud Fairing Halves (ejected at platform deploy)
    const fairingHalfGeo = new THREE.ConeGeometry(2.5, 5.5, 24, 1, false, 0, Math.PI);
    const fairingMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.35, roughness: 0.2 });

    const fairingLeft = new THREE.Mesh(fairingHalfGeo, fairingMat);
    fairingLeft.position.y = 2.5;
    fairingLeft.rotation.y = 0;
    pbvGroup.add(fairingLeft);
    noseFairingLeftRef.current = fairingLeft;

    const fairingRight = new THREE.Mesh(fairingHalfGeo, fairingMat);
    fairingRight.position.y = 2.5;
    fairingRight.rotation.y = Math.PI;
    pbvGroup.add(fairingRight);
    noseFairingRightRef.current = fairingRight;

    // Telescoping Aerospike with Drag-Reduction Disc
    const spikeGeo = new THREE.CylinderGeometry(0.18, 0.18, 5.5, 16);
    const spikeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 });
    const aerospike = new THREE.Mesh(spikeGeo, spikeMat);
    aerospike.position.y = 25.5;

    const discGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.25, 20);
    const discMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.y = 2.75;
    aerospike.add(disc);

    missileGroup.add(aerospike);
    aerospikeMeshRef.current = aerospike;

    // Detached Supersonic Shock Cone
    const shockGeo = new THREE.ConeGeometry(5.5, 9.5, 28, 1, true);
    const shockMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.3, wireframe: true });
    const shockCone = new THREE.Mesh(shockGeo, shockMat);
    shockCone.position.y = 21.0;
    shockCone.rotation.x = Math.PI;
    missileGroup.add(shockCone);
    shockConeMeshRef.current = shockCone;

    // --- ROTATING SCREW (PROP) AT REAR OF TRIDENT MISSILE ---
    const missileScrewGroup = new THREE.Group();
    missileScrewGroup.position.y = 0.0; // Mounted right at the aft base skirt of Stage 1

    const propBronzeMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Polished naval phosphor marine bronze
      metalness: 0.9,
      roughness: 0.2
    });

    // Central streamlined aft hub boss & spinner cone
    const propHubGeo = new THREE.CylinderGeometry(1.1, 0.85, 2.0, 20);
    const propHub = new THREE.Mesh(propHubGeo, propBronzeMat);
    propHub.position.y = -1.0;
    missileScrewGroup.add(propHub);

    const propSpinnerGeo = new THREE.ConeGeometry(0.85, 1.8, 20);
    const propSpinner = new THREE.Mesh(propSpinnerGeo, propBronzeMat);
    propSpinner.position.y = -2.9;
    propSpinner.rotation.x = Math.PI; // Pointing backwards
    missileScrewGroup.add(propSpinner);

    // Propeller mounting collar
    const collarGeo = new THREE.TorusGeometry(1.4, 0.15, 12, 32);
    const collarMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = -0.2;
    missileScrewGroup.add(collar);

    // 5 Hydrodynamic Bronze Propeller Blades radiating outwards
    const propBladeGeo = new THREE.BoxGeometry(0.12, 1.2, 2.2);
    for (let b = 0; b < 5; b++) {
      const blade = new THREE.Mesh(propBladeGeo, propBronzeMat);
      const angle = (b * Math.PI * 2) / 5;
      blade.position.set(Math.sin(angle) * 1.5, -1.0, Math.cos(angle) * 1.5);
      blade.rotation.y = -angle;
      blade.rotation.x = 0.52; // Pitch twist
      blade.rotation.z = 0.2;
      missileScrewGroup.add(blade);
    }

    // Outer ducted shroud ring around screw prop
    const shroudGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.8, 32, 1, true);
    const shroudMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.75,
      roughness: 0.35,
      side: THREE.DoubleSide
    });
    const shroud = new THREE.Mesh(shroudGeo, shroudMat);
    shroud.position.y = -1.0;
    missileScrewGroup.add(shroud);

    missileGroup.add(missileScrewGroup);
    missileScrewRef.current = missileScrewGroup;

    // Dual-Layer Rocket Exhaust Plume emerging behind/through aft screw during boost
    const flameOuterGeo = new THREE.ConeGeometry(3.2, 16.0, 24);
    const flameOuterMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.85 });
    const flameOuterMesh = new THREE.Mesh(flameOuterGeo, flameOuterMat);
    flameOuterMesh.position.y = -10.0;
    flameOuterMesh.rotation.x = Math.PI;
    missileGroup.add(flameOuterMesh);
    flameOuterMeshRef.current = flameOuterMesh;

    const flameInnerGeo = new THREE.ConeGeometry(1.6, 9.0, 20);
    const flameInnerMat = new THREE.MeshBasicMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.95 });
    const flameInnerMesh = new THREE.Mesh(flameInnerGeo, flameInnerMat);
    flameInnerMesh.position.y = -7.0;
    flameInnerMesh.rotation.x = Math.PI;
    missileGroup.add(flameInnerMesh);
    flameInnerMeshRef.current = flameInnerMesh;

    scene.add(missileGroup);

    // Reentry Plasma Trails behind warheads
    const plasmaLines: THREE.Line[] = [];
    for (let i = 0; i < 4; i++) {
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      const pMat = new THREE.LineBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.0 });
      const line = new THREE.Line(pGeo, pMat);
      scene.add(line);
      plasmaLines.push(line);
    }
    plasmaTrailsRef.current = plasmaLines;

    // Initial render
    updateSimulationVisuals(simTimeRef.current);

    // Resize Handler with ResizeObserver
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const newW = containerRef.current.clientWidth;
      const newH = containerRef.current.clientHeight;
      if (newW === 0 || newH === 0) return;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
      updateSimulationVisuals(simTimeRef.current);
    };

    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(() => handleResize());
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      renderer.dispose();
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [updateSimulationVisuals]);

  // Main Animation Loop
  useEffect(() => {
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      animFrameId.current = requestAnimationFrame(animate);
      const deltaSec = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (isPlaying) {
        const step = deltaSec * simulationSpeed;
        simTimeRef.current = Math.min(125.0, simTimeRef.current + step);

        // Throttle React state telemetry updates (25Hz) to keep UI fast & decoupled from WebGL loop
        if (currentTime - lastStateUpdateRef.current > 40) {
          lastStateUpdateRef.current = currentTime;
          const updated = calculateTelemetryAtTime(simTimeRef.current, telemetry.gssEnabled);
          setTelemetry((prev) => ({
            ...prev,
            ...updated
          }));
        }

        // Periodic atmospheric sonar ping when submerged or viewing tactical undersea
        if (simTimeRef.current < 10 || cameraMode === 'SUB_4KT' || cameraMode === 'TACTICAL_EVASION') {
          const secInt = Math.floor(simTimeRef.current);
          if (!telemetry.superSilentMode && secInt > 0 && secInt % 7 === 0 && secInt !== lastPingSecondRef.current) {
            lastPingSecondRef.current = secInt;
            soundFx.playSonarPing(true);
          }
        }
      }

      // Always update 3D visuals and render (both when playing and when paused!)
      updateSimulationVisuals(simTimeRef.current);
    };

    animFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [isPlaying, simulationSpeed, telemetry.gssEnabled, telemetry.superSilentMode, cameraMode, setTelemetry, updateSimulationVisuals]);

  const handleReset = () => {
    soundFx.playClick();
    soundFx.stopRocketRumble();
    simTimeRef.current = 0;
    userOrbitRef.current.rotX = 0;
    userOrbitRef.current.rotY = 0;
    userOrbitRef.current.distanceFactor = 1.0;
    setZoomDisplay(100);

    const resetData = calculateTelemetryAtTime(0, telemetry.gssEnabled);
    setTelemetry((prev) => ({
      ...prev,
      ...resetData,
      telemetryStream: [
        'OHIO-CLASS SSBN CRUISING AT 4.0 KNOTS PATROL SPEED - TUBE #4 FLOOD EQUALIZED',
        `BELL GSS REAL-TIME TENSOR UPDATE: ${prev.gssEnabled ? 'ACTIVE (SINS ZERO-BIASED)' : 'BYPASSED (RAW SINS DRIFT)'}`,
        'GAS GENERATOR STEAM EJECTION CHARGE ARMED - SUPERCAVITATING STEAM ENVELOPE READY'
      ]
    }));
    updateSimulationVisuals(0);
  };

  const handleTogglePlay = () => {
    soundFx.playClick();
    if (isPlaying) {
      soundFx.stopRocketRumble();
    } else {
      if (telemetry.stage === 'STAGE_1' || telemetry.stage === 'STAGE_2' || telemetry.stage === 'AEROSPIKE') {
        soundFx.startRocketRumble();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleToggleGss = () => {
    soundFx.playClick();
    const newGss = !telemetry.gssEnabled;
    if (newGss) soundFx.playStellarLock();

    setTelemetry((prev) => ({
      ...prev,
      gssEnabled: newGss,
      sinsDeflectionArcsec: newGss ? 0.08 : 24.5,
      targetMissMeters: newGss ? 38 : 1420,
      siloOverpressurePsi: newGss ? 2850 : 38,
      targetKillProb: newGss ? 99.4 : 18.2,
      telemetryStream: [
        `GSS-TO-SINS CALIBRATION TOGGLED: ${newGss ? 'ENABLED (Deflection <0.08")' : 'BYPASSED (Uncompensated 24.5")'}`,
        ...prev.telemetryStream
      ]
    }));
    updateSimulationVisuals(simTimeRef.current);
  };

  // Tactical Submarine Evasion Handlers
  const handleSetNoodlingPattern = (pattern: 'OFF' | 'SERPENTINE' | 'BAFFLE_CLEAR' | 'THERMAL_DIVE') => {
    soundFx.playRudderShift();
    setTelemetry((prev) => {
      let tma = 94;
      let status: TelemetryData['russianSubContact']['trackingStatus'] = 'LOCKED';
      if (pattern === 'SERPENTINE') {
        tma = prev.superSilentMode ? 0 : 18;
        status = prev.superSilentMode ? 'SEARCHING' : 'BAFFLED';
      } else if (pattern === 'BAFFLE_CLEAR') {
        tma = prev.superSilentMode ? 0 : 8;
        status = prev.superSilentMode ? 'SEARCHING' : 'BAFFLED';
      } else if (pattern === 'THERMAL_DIVE') {
        tma = 0;
        status = 'SEARCHING';
      } else if (prev.superSilentMode) {
        tma = 0;
        status = 'SEARCHING';
      } else if (prev.countermeasuresActive) {
        tma = 5;
        status = 'SPOOFED_BY_DECOY';
      }

      const patternNames = {
        OFF: 'STEADY PATROL COURSE (4.0 KT)',
        SERPENTINE: 'SERPENTINE WEAVE (±25° COURSE CORRIDOR) - BAFFLING RUSSIAN TMA',
        BAFFLE_CLEAR: 'BAFFLE-CLEARING 45° S-TURN - CLEARING STERN SONAR CONE',
        THERMAL_DIVE: 'THERMAL LAYER DIVE - PORPOISING ACROSS SOUND VELOCITY PROFILE'
      };

      return {
        ...prev,
        noodlingPattern: pattern,
        russianSubContact: {
          ...prev.russianSubContact,
          trackingStatus: status,
          tmaConfidence: tma
        },
        telemetryStream: [
          `TACTICAL HELM: ${patternNames[pattern]}`,
          ...prev.telemetryStream.slice(0, 14)
        ]
      };
    });
    updateSimulationVisuals(simTimeRef.current);
  };

  const handleToggleSuperSilent = () => {
    const nextSilent = !telemetry.superSilentMode;
    soundFx.playSilentModeToggle(nextSilent);

    setTelemetry((prev) => {
      const noise = nextSilent ? 78 : (prev.noodlingPattern === 'OFF' ? 104 : 108);
      let status: TelemetryData['russianSubContact']['trackingStatus'] = nextSilent ? 'SEARCHING' : 'LOCKED';
      let tma = nextSilent ? 0 : (prev.noodlingPattern === 'OFF' ? 94 : 18);
      if (prev.countermeasuresActive) {
        status = 'SPOOFED_BY_DECOY';
        tma = 5;
      }

      return {
        ...prev,
        superSilentMode: nextSilent,
        subRadiatedNoiseDb: noise,
        subSpeedKnots: nextSilent ? 1.8 : 4.0,
        russianSubContact: {
          ...prev.russianSubContact,
          trackingStatus: status,
          tmaConfidence: tma
        },
        telemetryStream: [
          nextSilent
            ? 'TACTICAL: RIG FOR ULTRA-QUIET - NATURAL CIRCULATION COOLING ACTIVE (78 dB < SEA FLOOR AMBIENT)'
            : 'TACTICAL: ULTRA-QUIET SECURED - PRIMARY COOLANT PUMPS RUNNING (104 dB CRUISE SIGNATURE)',
          ...prev.telemetryStream.slice(0, 14)
        ]
      };
    });
    updateSimulationVisuals(simTimeRef.current);
  };

  const handleDeployCountermeasures = () => {
    if (telemetry.countermeasuresRemaining <= 0) return;
    soundFx.playCountermeasureLaunch();

    // Spawn 3D decoy at submarine stern
    if (subGroupRef.current) {
      const sPos = subGroupRef.current.position;
      activeDecoyRef.current = {
        active: true,
        x: sPos.x - 30,
        y: sPos.y,
        z: sPos.z - 4,
        birthTime: simTimeRef.current
      };
    }

    setTelemetry((prev) => {
      const remaining = Math.max(0, prev.countermeasuresRemaining - 1);
      return {
        ...prev,
        countermeasuresRemaining: remaining,
        countermeasuresActive: true,
        russianSubContact: {
          ...prev.russianSubContact,
          trackingStatus: 'SPOOFED_BY_DECOY',
          tmaConfidence: 4
        },
        telemetryStream: [
          `WEAPONS: ACOUSTIC COUNTERMEASURE ADC-MK3 DEPLOYED (${remaining}/6 REMAINING) - AKULA SONAR SPOOFED`,
          ...prev.telemetryStream.slice(0, 14)
        ]
      };
    });
    updateSimulationVisuals(simTimeRef.current);
  };

  // Tactical Patrol Posture Handler (Standard 4.0 KT Cruise)
  const handleEngagePatrolMode = () => {
    soundFx.playClick();
    setCameraMode('SUB_4KT');
    userOrbitRef.current.rotX = 0;
    userOrbitRef.current.rotY = 0;
    setTelemetry((prev) => ({
      ...prev,
      noodlingPattern: 'OFF',
      subSpeedKnots: 4.0,
      subRadiatedNoiseDb: prev.superSilentMode ? 78 : 104,
      russianSubContact: {
        ...prev.russianSubContact,
        trackingStatus: prev.superSilentMode ? 'SEARCHING' : (prev.countermeasuresActive ? 'SPOOFED_BY_DECOY' : 'LOCKED'),
        tmaConfidence: prev.superSilentMode ? 0 : 94
      },
      telemetryStream: [
        'PATROL ORDER: RESUMING NOMINAL 4.0 KT PATROL CRUISE - TUBE #4 FLOOD EQUALIZED - HEADING STEADY',
        ...prev.telemetryStream.slice(0, 14)
      ]
    }));
    updateSimulationVisuals(simTimeRef.current);
  };

  // Tactical Evade Posture Handler (Countermeasures vs Akula Stalker)
  const handleEngageEvadeMode = (mode: 'SERPENTINE' | 'BAFFLE_CLEAR' | 'THERMAL_DIVE' | 'DECOY') => {
    if (mode === 'DECOY') {
      handleDeployCountermeasures();
      setCameraMode('TACTICAL_EVASION');
    } else {
      handleSetNoodlingPattern(mode);
      setCameraMode('TACTICAL_EVASION');
    }
  };

  // Submarine Depth Control Handler
  const handleChangeDepth = (targetDepth: number) => {
    const clampedDepth = Math.max(0, Math.min(100, Math.round(targetDepth)));
    const isSurfacing = clampedDepth === 0;
    soundFx.playBallastBlow();

    setTelemetry((prev) => ({
      ...prev,
      subDepthMeters: clampedDepth,
      subSurfaceMode: isSurfacing,
      telemetryStream: [
        isSurfacing
          ? 'DIVING OFFICER: MAIN BALLAST TANKS BLOWN — SURFACED AT 0 METERS (WATERLINE BREACHED)'
          : `DIVING OFFICER: DEPTH ADJUSTED TO ${clampedDepth} METERS — FLOODING/PUMPING TRIM TANKS`,
        ...prev.telemetryStream.slice(0, 14)
      ]
    }));
    updateSimulationVisuals(simTimeRef.current);
  };

  // Surface Mode Toggle Handler
  const handleToggleSurfaceMode = () => {
    soundFx.playBallastBlow();
    setTelemetry((prev) => {
      const isCurrentlySurfaced = prev.subSurfaceMode || (prev.subDepthMeters ?? 22) === 0;
      const nextSurfaced = !isCurrentlySurfaced;
      const targetDepth = nextSurfaced ? 0 : 22;

      return {
        ...prev,
        subSurfaceMode: nextSurfaced,
        subDepthMeters: targetDepth,
        telemetryStream: [
          nextSurfaced
            ? 'SURFACE ORDER: EMERGENCY BLOW ON MAIN BALLAST — OHIO SSBN BROACHING SURFACE (0m DEPTH)'
            : 'DIVE ORDER: SUBMERGING TO 22 METERS KEEL DEPTH — EQUALIZING DIVE TRIM',
          ...prev.telemetryStream.slice(0, 14)
        ]
      };
    });
    updateSimulationVisuals(simTimeRef.current);
  };

  // Submarine Velocity Control Handler
  const handleChangeVelocity = (speedKnots: number) => {
    const clampedSpeed = Math.max(0, Math.min(25, parseFloat(speedKnots.toFixed(1))));
    soundFx.playPropRpmShift(clampedSpeed);

    setTelemetry((prev) => {
      const noise = prev.superSilentMode 
        ? 78 
        : clampedSpeed <= 1.8 
        ? 82 
        : clampedSpeed <= 5 
        ? 104 
        : 104 + Math.round((clampedSpeed - 5) * 1.8);

      return {
        ...prev,
        subSpeedKnots: clampedSpeed,
        subRadiatedNoiseDb: noise,
        telemetryStream: [
          `ENGINEERING: ENGINE TELEGRAPH ORDERED TO ${clampedSpeed} KNOTS — PROPELLER RPM ADJUSTED (${noise} dB)`,
          ...prev.telemetryStream.slice(0, 14)
        ]
      };
    });
    updateSimulationVisuals(simTimeRef.current);
  };

  // Execute one of the 9 primary launch navigation commands
  const handleExecuteLaunchCommand = (cmd: LaunchCommand) => {
    soundFx.playClick();

    if (autoCamSync) {
      setCameraMode(cmd.cameraMode);
    }

    // Reset user orbit angles for clean cinematic center lock
    userOrbitRef.current.rotX = 0;
    userOrbitRef.current.rotY = 0;

    // Play appropriate sound
    if (cmd.id === '4-KT TUBE' || cmd.id === 'GAS BUBBLE' || cmd.id === 'BROACH') {
      soundFx.stopRocketRumble();
    } else if (cmd.id === 'IGNITION') {
      soundFx.startRocketRumble();
    } else if (cmd.id === 'PBV ATTITUDE' || cmd.id === 'PLATFORM') {
      soundFx.stopRocketRumble();
      soundFx.playStellarLock();
    } else if (cmd.id === 'MIRV DROP') {
      soundFx.stopRocketRumble();
    }

    simTimeRef.current = cmd.timeSec;
    const cmdData = calculateTelemetryAtTime(cmd.timeSec, telemetry.gssEnabled);

    setTelemetry((prev) => ({
      ...prev,
      ...cmdData,
      telemetryStream: [
        `CMD EXEC [${cmd.name}]: JUMP T+${cmd.timeSec.toFixed(1)}s (${cmd.desc})`,
        ...prev.telemetryStream
      ]
    }));

    // Instantly update visuals so there is zero delay or black screen
    updateSimulationVisuals(cmd.timeSec);
  };

  // Raycast 3D Object Selection
  const raycastSelectObject = (clientX: number, clientY: number) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
    for (const hit of intersects) {
      let curr: THREE.Object3D | null = hit.object;
      while (curr) {
        if (curr.userData && curr.userData.objectId) {
          const id = curr.userData.objectId as string;
          setSelectedObjectId(id);
          soundFx.playTargetLock();
          if (leftPanelState === 'collapsed') {
            setLeftPanelState('compact');
          }
          updateSimulationVisuals(simTimeRef.current);
          return id;
        }
        curr = curr.parent;
      }
    }
    return null;
  };

  // Raycast 3D Hover Detection
  const raycastHoverTest = (clientX: number, clientY: number) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
    for (const hit of intersects) {
      let curr: THREE.Object3D | null = hit.object;
      while (curr) {
        if (curr.userData && curr.userData.objectId) {
          setHoveredObjectId(curr.userData.objectId as string);
          setHoverTooltipPos({ x: clientX - rect.left, y: clientY - rect.top });
          if (containerRef.current) {
            containerRef.current.style.cursor = 'pointer';
          }
          return;
        }
        curr = curr.parent;
      }
    }
    setHoveredObjectId(null);
    setHoverTooltipPos(null);
    if (containerRef.current) {
      containerRef.current.style.cursor = userOrbitRef.current.isDragging ? 'grabbing' : 'grab';
    }
  };

  // Focus 3D Camera on any selected tactical asset
  const handleFocusSelectedObject = (objectId: string) => {
    soundFx.playTargetLock();
    setSelectedObjectId(objectId);
    if (objectId === 'earth-globe') {
      setCameraMode('EARTH_ORBIT');
      userOrbitRef.current.distanceFactor = 55.0;
      userOrbitRef.current.panX = 0;
      userOrbitRef.current.panY = 0;
    } else if (objectId.startsWith('sbirs') || objectId.startsWith('dsp') || objectId.startsWith('gps') || objectId.startsWith('usa') || objectId.startsWith('milstar')) {
      setCameraMode('SATELLITE_TRACK');
      userOrbitRef.current.distanceFactor = 1.0;
      userOrbitRef.current.panX = 0;
      userOrbitRef.current.panY = 0;
    } else if (objectId === 'uss-ohio') {
      setCameraMode('SUB_4KT');
      userOrbitRef.current.distanceFactor = 1.0;
      userOrbitRef.current.panX = 0;
      userOrbitRef.current.panY = 0;
    } else if (objectId === 'akula-pantera') {
      setCameraMode('TACTICAL_EVASION');
      userOrbitRef.current.distanceFactor = 1.2;
      userOrbitRef.current.panX = 0;
      userOrbitRef.current.panY = 0;
    } else if (objectId === 'trident-missile') {
      setCameraMode('FOLLOW');
      userOrbitRef.current.distanceFactor = 1.0;
      userOrbitRef.current.panX = 0;
      userOrbitRef.current.panY = 0;
    } else if (objectId === 'target-silo') {
      setCameraMode('TARGET_SILO');
      userOrbitRef.current.distanceFactor = 1.0;
      userOrbitRef.current.panX = 0;
      userOrbitRef.current.panY = 0;
    } else if (objectId === 'usns-vanguard') {
      setCameraMode('SHIP');
      userOrbitRef.current.distanceFactor = 1.0;
      userOrbitRef.current.panX = 0;
      userOrbitRef.current.panY = 0;
    }
    setZoomDisplay(Math.round(100 / userOrbitRef.current.distanceFactor));
    setPanDisplay({ x: 0, y: 0 });
    updateSimulationVisuals(simTimeRef.current);
  };

  // Mouse orbit, pan & touch handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    userOrbitRef.current.isDragging = true;
    userOrbitRef.current.startX = e.clientX;
    userOrbitRef.current.startY = e.clientY;
    userOrbitRef.current.downX = e.clientX;
    userOrbitRef.current.downY = e.clientY;
    userOrbitRef.current.hasMoved = false;

    // Right click (2), middle click (1), or Shift key activates PAN mode
    if (e.button === 2 || e.button === 1 || e.shiftKey) {
      userOrbitRef.current.activeDragMode = 'PAN';
    } else {
      userOrbitRef.current.activeDragMode = dragInteractionMode;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!userOrbitRef.current.isDragging) {
      raycastHoverTest(e.clientX, e.clientY);
      return;
    }

    const totalDist = Math.hypot(e.clientX - userOrbitRef.current.downX, e.clientY - userOrbitRef.current.downY);
    if (totalDist > 4) {
      userOrbitRef.current.hasMoved = true;
    }

    const dx = e.clientX - userOrbitRef.current.startX;
    const dy = e.clientY - userOrbitRef.current.startY;
    userOrbitRef.current.startX = e.clientX;
    userOrbitRef.current.startY = e.clientY;

    if (userOrbitRef.current.activeDragMode === 'PAN') {
      const distScale = userOrbitRef.current.distanceFactor;
      userOrbitRef.current.panX -= dx * 0.05 * distScale;
      userOrbitRef.current.panY += dy * 0.05 * distScale;
      setPanDisplay({
        x: Math.round(userOrbitRef.current.panX),
        y: Math.round(userOrbitRef.current.panY)
      });
      updateSimulationVisuals(simTimeRef.current);
    } else {
      userOrbitRef.current.rotY -= dx * 0.007;
      userOrbitRef.current.rotX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, userOrbitRef.current.rotX + dy * 0.007));
      updateSimulationVisuals(simTimeRef.current);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!userOrbitRef.current.hasMoved) {
      // Direct click on object without dragging -> Raycast select!
      raycastSelectObject(e.clientX, e.clientY);
    }
    userOrbitRef.current.isDragging = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      userOrbitRef.current.isDragging = true;
      userOrbitRef.current.activeDragMode = dragInteractionMode;
      userOrbitRef.current.startX = e.touches[0].clientX;
      userOrbitRef.current.startY = e.touches[0].clientY;
      userOrbitRef.current.downX = e.touches[0].clientX;
      userOrbitRef.current.downY = e.touches[0].clientY;
      userOrbitRef.current.hasMoved = false;
      userOrbitRef.current.isPinching = false;
    } else if (e.touches.length >= 2) {
      userOrbitRef.current.isDragging = true;
      userOrbitRef.current.isPinching = true;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      userOrbitRef.current.initialTouchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      userOrbitRef.current.initialTouchMidX = (t1.clientX + t2.clientX) / 2;
      userOrbitRef.current.initialTouchMidY = (t1.clientY + t2.clientY) / 2;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!userOrbitRef.current.isDragging) return;
    if (e.touches.length === 1 && !userOrbitRef.current.isPinching) {
      const totalDist = Math.hypot(e.touches[0].clientX - userOrbitRef.current.downX, e.touches[0].clientY - userOrbitRef.current.downY);
      if (totalDist > 6) {
        userOrbitRef.current.hasMoved = true;
      }

      const dx = e.touches[0].clientX - userOrbitRef.current.startX;
      const dy = e.touches[0].clientY - userOrbitRef.current.startY;
      userOrbitRef.current.startX = e.touches[0].clientX;
      userOrbitRef.current.startY = e.touches[0].clientY;

      if (userOrbitRef.current.activeDragMode === 'PAN') {
        const distScale = userOrbitRef.current.distanceFactor;
        userOrbitRef.current.panX -= dx * 0.05 * distScale;
        userOrbitRef.current.panY += dy * 0.05 * distScale;
        setPanDisplay({
          x: Math.round(userOrbitRef.current.panX),
          y: Math.round(userOrbitRef.current.panY)
        });
      } else {
        userOrbitRef.current.rotY -= dx * 0.007;
        userOrbitRef.current.rotX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, userOrbitRef.current.rotX + dy * 0.007));
      }
      updateSimulationVisuals(simTimeRef.current);
    } else if (e.touches.length >= 2) {
      userOrbitRef.current.hasMoved = true;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;

      // Pinch zoom with proportional scaling up to 120.0 (Earth orbit)
      if (userOrbitRef.current.initialTouchDist > 0) {
        const zoomDelta = (userOrbitRef.current.initialTouchDist - dist) * 0.004 * userOrbitRef.current.distanceFactor;
        const newFactor = Math.max(0.25, Math.min(120.0, userOrbitRef.current.distanceFactor + zoomDelta));
        userOrbitRef.current.distanceFactor = newFactor;
        setZoomDisplay(Math.round(100 / newFactor));
      }

      // Two-finger pan
      const dx = midX - userOrbitRef.current.initialTouchMidX;
      const dy = midY - userOrbitRef.current.initialTouchMidY;
      const distScale = userOrbitRef.current.distanceFactor;
      userOrbitRef.current.panX -= dx * 0.05 * distScale;
      userOrbitRef.current.panY += dy * 0.05 * distScale;
      setPanDisplay({
        x: Math.round(userOrbitRef.current.panX),
        y: Math.round(userOrbitRef.current.panY)
      });

      userOrbitRef.current.initialTouchDist = dist;
      userOrbitRef.current.initialTouchMidX = midX;
      userOrbitRef.current.initialTouchMidY = midY;
      updateSimulationVisuals(simTimeRef.current);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!userOrbitRef.current.hasMoved && e.changedTouches && e.changedTouches[0]) {
      raycastSelectObject(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    }
    userOrbitRef.current.isDragging = false;
    userOrbitRef.current.isPinching = false;
    userOrbitRef.current.initialTouchDist = 0;
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Proportional zooming: smooth from 0.25 up to 120.0 (Global Earth Orbit)
    const curFactor = userOrbitRef.current.distanceFactor;
    const zoomMultiplier = e.deltaY > 0 ? 1.14 : 0.88;
    const newFactor = Math.max(0.25, Math.min(120.0, curFactor * zoomMultiplier));
    userOrbitRef.current.distanceFactor = newFactor;
    setZoomDisplay(Math.round(100 / newFactor));
    updateSimulationVisuals(simTimeRef.current);
  };

  const handleZoom = (delta: number) => {
    soundFx.playClick();
    const curFactor = userOrbitRef.current.distanceFactor;
    const zoomMultiplier = delta > 0 ? 0.72 : 1.35;
    const newFactor = Math.max(0.25, Math.min(120.0, curFactor * zoomMultiplier));
    userOrbitRef.current.distanceFactor = newFactor;
    setZoomDisplay(Math.round(100 / newFactor));
    updateSimulationVisuals(simTimeRef.current);
  };

  const handlePan = (dx: number, dy: number) => {
    soundFx.playClick();
    const factor = userOrbitRef.current.distanceFactor;
    userOrbitRef.current.panX += dx * factor * 6;
    userOrbitRef.current.panY += dy * factor * 6;
    setPanDisplay({
      x: Math.round(userOrbitRef.current.panX),
      y: Math.round(userOrbitRef.current.panY)
    });
    updateSimulationVisuals(simTimeRef.current);
  };

  const handleOrbitStep = (dPitch: number, dYaw: number) => {
    soundFx.playClick();
    userOrbitRef.current.rotY += dYaw;
    userOrbitRef.current.rotX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, userOrbitRef.current.rotX + dPitch));
    updateSimulationVisuals(simTimeRef.current);
  };

  const handleResetOrbitZoomPan = () => {
    soundFx.playClick();
    userOrbitRef.current.rotX = 0;
    userOrbitRef.current.rotY = 0;
    userOrbitRef.current.distanceFactor = 1.0;
    userOrbitRef.current.panX = 0;
    userOrbitRef.current.panY = 0;
    setZoomDisplay(100);
    setPanDisplay({ x: 0, y: 0 });
    updateSimulationVisuals(simTimeRef.current);
  };

  const handleSetQuickPreset = (preset: 'DEFAULT' | 'TOP' | 'PROFILE' | 'ISOMETRIC' | 'ORBIT') => {
    soundFx.playClick();
    userOrbitRef.current.panX = 0;
    userOrbitRef.current.panY = 0;
    setPanDisplay({ x: 0, y: 0 });
    if (preset === 'DEFAULT') {
      userOrbitRef.current.rotX = 0;
      userOrbitRef.current.rotY = 0;
      userOrbitRef.current.distanceFactor = 1.0;
    } else if (preset === 'TOP') {
      userOrbitRef.current.rotX = Math.PI / 2.6;
      userOrbitRef.current.rotY = 0;
      userOrbitRef.current.distanceFactor = 1.25;
    } else if (preset === 'PROFILE') {
      userOrbitRef.current.rotX = 0;
      userOrbitRef.current.rotY = Math.PI / 2;
      userOrbitRef.current.distanceFactor = 1.0;
    } else if (preset === 'ISOMETRIC') {
      userOrbitRef.current.rotX = Math.PI / 6;
      userOrbitRef.current.rotY = Math.PI / 4;
      userOrbitRef.current.distanceFactor = 1.1;
    } else if (preset === 'ORBIT') {
      userOrbitRef.current.rotX = 0.35;
      userOrbitRef.current.rotY = 0.55;
      userOrbitRef.current.distanceFactor = 55.0;
      setCameraMode('EARTH_ORBIT');
    }
    setZoomDisplay(Math.round(100 / userOrbitRef.current.distanceFactor));
    updateSimulationVisuals(simTimeRef.current);
  };

  // Live Object Intel data for Left Panel
  const selectedObjectIntel = useMemo(() => {
    if (!selectedObjectId) return null;
    return getLiveObjectIntel(selectedObjectId, telemetry);
  }, [selectedObjectId, telemetry]);

  return (
    <div className="w-full h-full lg:h-[calc(100vh-76px)] flex flex-col lg:flex-row gap-2 md:gap-3 p-2 text-slate-100 min-h-0 overflow-hidden">
      {/* LEFT NAVIGATION PANEL with 3-state collapse (expanded / compact / collapsed) and Patrol/Evade modes */}
      <LaunchCommandNavPanel
        currentMissionTime={telemetry.missionTime}
        currentStage={telemetry.stage}
        onExecuteCommand={handleExecuteLaunchCommand}
        autoCamEnabled={autoCamSync}
        onToggleAutoCam={() => setAutoCamSync(!autoCamSync)}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onResetSim={handleReset}
        panelState={leftPanelState}
        onChangePanelState={setLeftPanelState}
        noodlingPattern={telemetry.noodlingPattern}
        superSilentMode={telemetry.superSilentMode}
        countermeasuresRemaining={telemetry.countermeasuresRemaining}
        countermeasuresActive={telemetry.countermeasuresActive}
        trackingStatus={telemetry.russianSubContact.trackingStatus}
        tmaConfidence={telemetry.russianSubContact.tmaConfidence}
        subSpeedKnots={telemetry.subSpeedKnots}
        subRadiatedNoiseDb={telemetry.subRadiatedNoiseDb}
        subDepthMeters={telemetry.subDepthMeters}
        subSurfaceMode={telemetry.subSurfaceMode}
        onEngagePatrolMode={handleEngagePatrolMode}
        onEngageEvadeMode={handleEngageEvadeMode}
        onToggleSuperSilent={handleToggleSuperSilent}
        onDeployCountermeasures={handleDeployCountermeasures}
        onChangeDepth={handleChangeDepth}
        onToggleSurfaceMode={handleToggleSurfaceMode}
        onChangeVelocity={handleChangeVelocity}
        onSetCameraMode={(cam) => {
          setCameraMode(cam);
          updateSimulationVisuals(simTimeRef.current);
        }}
        selectedObject={selectedObjectIntel}
        onSelectObjectId={(id) => {
          setSelectedObjectId(id);
          soundFx.playTargetLock();
          updateSimulationVisuals(simTimeRef.current);
        }}
        onFocusSelectedObject={handleFocusSelectedObject}
      />

      {/* 3D Viewport Column (100% Vertical Height & Centered Display) */}
      <div className="flex-1 flex flex-col min-w-0 h-full rounded-lg border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
        {/* HUD Viewport Header */}
        <div className="px-3 md:px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 md:gap-3">
            <span className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Crosshair className="w-4 h-4" />
              <span className="hidden sm:inline">3D DOWNRANGE VECTOR CAM</span>
              <span className="sm:hidden">3D VECTOR</span>
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300 hidden md:inline">
              TARGET: <strong className="text-white">UGM-133A TRIDENT II (D5)</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Drag Mode Toggle (Orbit vs Pan) */}
            <div className="flex items-center bg-slate-800/90 rounded border border-slate-700 p-0.5 text-[10px]">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setDragInteractionMode('ORBIT');
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                  dragInteractionMode === 'ORBIT'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Left click drags to rotate/orbit camera around target"
              >
                <RotateCw className="w-3 h-3" />
                <span className="hidden sm:inline">ORBIT</span>
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setDragInteractionMode('PAN');
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                  dragInteractionMode === 'PAN'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Left click drags to pan camera across view plane (Right-click or Shift-drag always pans)"
              >
                <Move className="w-3 h-3" />
                <span className="hidden sm:inline">PAN</span>
              </button>
            </div>

            {/* Pan & Zoom Status Readout */}
            {(panDisplay.x !== 0 || panDisplay.y !== 0) && (
              <span className="hidden md:inline px-1.5 py-0.5 bg-slate-800/80 rounded border border-slate-700 text-[10px] text-amber-300 font-mono">
                PAN: {panDisplay.x},{panDisplay.y}
              </span>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700 text-[10px]">
              <button
                onClick={() => handleZoom(-0.2)}
                className="p-1 hover:text-amber-400 text-slate-300 cursor-pointer"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetOrbitZoomPan}
                className="px-1 font-bold text-slate-300 hover:text-white cursor-pointer"
                title="Reset Camera Zoom, Orbit Angle & Pan"
              >
                {zoomDisplay}%
              </button>
              <button
                onClick={() => handleZoom(0.2)}
                className="p-1 hover:text-amber-400 text-slate-300 cursor-pointer"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Reset View Button */}
            <button
              onClick={handleResetOrbitZoomPan}
              className="p-1.5 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
              title="Reset 3D camera pan, orbit, and zoom to defaults"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Theater Mode Toggle */}
            <button
              onClick={() => {
                soundFx.playClick();
                setIsTheaterMode(!isTheaterMode);
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                isTheaterMode
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isTheaterMode ? 'Restore side metrics panel' : 'Maximize 3D viewport across full screen width'}
            >
              {isTheaterMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isTheaterMode ? 'COLLAPSE' : 'EXPAND VIEW'}</span>
            </button>

            {/* Camera View Switcher */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[11px] hidden xl:inline">CAM:</span>
              {[
                { id: 'FOLLOW', label: 'FOLLOW' },
                { id: 'TACTICAL_EVASION', label: 'SUB & STALKER' },
                { id: 'SUB_4KT', label: '4-KT SUB' },
                { id: 'BUBBLE_CAM', label: 'BUBBLE' },
                { id: 'PLATFORM_BUS', label: 'MIRV BUS' },
                { id: 'TARGET_SILO', label: 'SILO' },
                { id: 'SHIP', label: 'VANGUARD' },
                { id: 'EARTH_ORBIT', label: 'ORBIT (EARTH)' },
                { id: 'SATELLITE_TRACK', label: 'SATELLITES' }
              ].map((cam) => (
                <button
                  key={cam.id}
                  onClick={() => {
                    soundFx.playClick();
                    setCameraMode(cam.id as any);
                    updateSimulationVisuals(simTimeRef.current);
                  }}
                  className={`px-1.5 md:px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    cameraMode === cam.id
                      ? 'bg-amber-500/20 border border-amber-500 text-amber-300'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cam.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3D Canvas Container (Full Vertical Height & Centered) */}
        <div 
          className="relative w-full flex-1 min-h-[350px] bg-black select-none cursor-grab active:cursor-grabbing overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div ref={containerRef} className="w-full h-full" />

          {/* 3D Object Interactive Hover Tooltip */}
          {hoveredObjectId && hoverTooltipPos && (
            <div 
              className="absolute pointer-events-none z-40 px-2.5 py-1 rounded bg-slate-950/92 border border-amber-500/80 text-amber-300 font-mono text-[11px] shadow-2xl backdrop-blur flex items-center gap-1.5 -translate-x-1/2 -translate-y-full -mt-2.5"
              style={{ left: hoverTooltipPos.x, top: hoverTooltipPos.y }}
            >
              <Crosshair className="w-3 h-3 text-amber-400 animate-pulse" />
              <span className="font-bold tracking-wider">
                {hoveredObjectId === 'earth-globe' ? 'PLANET EARTH (TERRA)' :
                 hoveredObjectId === 'uss-ohio' ? 'USS OHIO (SSBN-726)' :
                 hoveredObjectId === 'akula-pantera' ? 'K-317 PANTERA (AKULA-I)' :
                 hoveredObjectId === 'trident-missile' ? 'UGM-133A TRIDENT II (D5)' :
                 hoveredObjectId === 'target-silo' ? 'TARGET SILO #41 (SS-18 ICBM)' :
                 hoveredObjectId === 'usns-vanguard' ? 'USNS VANGUARD (T-AGM-19)' :
                 hoveredObjectId.toUpperCase()}
              </span>
              <span className="text-[9px] text-slate-400 font-normal">[CLICK TO INSPECT]</span>
            </div>
          )}

          {/* Floating Expand Left Panel Button when Left Panel is Collapsed */}
          {leftPanelState === 'collapsed' && (
            <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setLeftPanelState('expanded');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-950/92 border border-amber-500/70 text-amber-300 hover:bg-amber-500/20 shadow-2xl backdrop-blur font-mono text-xs cursor-pointer transition-all hover:scale-105"
                title="Open Launch Commands & Tactical Patrol Panel"
              >
                <PanelLeftOpen className="w-4 h-4 text-amber-400" />
                <span className="font-bold">COMMANDS &amp; PATROL</span>
              </button>
            </div>
          )}

          {/* Interactive Navigation Hint Pill & Undersea Tactical HUD */}
          <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 font-mono">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400 backdrop-blur shadow">
              <span>L-DRAG: {dragInteractionMode === 'ORBIT' ? 'ORBIT' : 'PAN'}</span>
              <span className="text-slate-600">•</span>
              <span>R-DRAG/SHIFT: PAN</span>
              <span className="text-slate-600">•</span>
              <span>WHEEL/PINCH: ZOOM</span>
            </div>

            {/* Tactical Evasion Status & Quick Controls Pill */}
            <div className="px-3 py-1.5 rounded-lg bg-slate-950/92 border border-slate-700 backdrop-blur shadow-xl flex flex-col items-end gap-1.5 max-w-sm">
              <div className="flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${
                  telemetry.russianSubContact.trackingStatus === 'LOCKED' 
                    ? 'bg-rose-500 animate-ping' 
                    : telemetry.russianSubContact.trackingStatus === 'SPOOFED_BY_DECOY'
                    ? 'bg-amber-400 animate-pulse'
                    : telemetry.russianSubContact.trackingStatus === 'SEARCHING'
                    ? 'bg-emerald-400'
                    : 'bg-cyan-400'
                }`} />
                <span className="text-slate-400 text-[10px] font-bold">AKULA-I SSN:</span>
                <span className={`text-[10px] font-bold ${
                  telemetry.russianSubContact.trackingStatus === 'LOCKED' ? 'text-rose-400' :
                  telemetry.russianSubContact.trackingStatus === 'SPOOFED_BY_DECOY' ? 'text-amber-300' :
                  telemetry.russianSubContact.trackingStatus === 'SEARCHING' ? 'text-emerald-300' : 'text-cyan-300'
                }`}>
                  {telemetry.russianSubContact.trackingStatus === 'LOCKED' ? `LOCKED (${telemetry.russianSubContact.tmaConfidence}%)` :
                   telemetry.russianSubContact.trackingStatus === 'SPOOFED_BY_DECOY' ? 'SPOOFED (DECOY)' :
                   telemetry.russianSubContact.trackingStatus === 'SEARCHING' ? 'LOST (78 dB)' :
                   `BAFFLED (${telemetry.russianSubContact.tmaConfidence}%)`}
                </span>
              </div>

              {/* Tactical Quick Action Toolbar */}
              <div className="flex flex-wrap items-center justify-end gap-1 text-[10px]">
                {/* Noodling Mode Selector */}
                <div className="flex items-center bg-slate-900 rounded p-0.5 border border-slate-800">
                  <span className="px-1 text-slate-500 font-bold hidden sm:inline">NOODLE:</span>
                  {(['OFF', 'SERPENTINE', 'BAFFLE_CLEAR', 'THERMAL_DIVE'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => handleSetNoodlingPattern(mode)}
                      className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                        telemetry.noodlingPattern === mode
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title={`Engage ${mode} evasion pattern to evade Russian fast attack submarine`}
                    >
                      {mode === 'OFF' ? 'OFF' : mode === 'SERPENTINE' ? 'SERP' : mode === 'BAFFLE_CLEAR' ? 'ZIG' : 'DIVE'}
                    </button>
                  ))}
                </div>

                {/* Deploy Countermeasure Button */}
                <button
                  onClick={handleDeployCountermeasures}
                  disabled={telemetry.countermeasuresRemaining <= 0}
                  className={`px-2 py-0.5 rounded font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                    telemetry.countermeasuresRemaining <= 0
                      ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                      : telemetry.countermeasuresActive
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse'
                      : 'bg-amber-600/30 border-amber-500/80 text-amber-200 hover:bg-amber-600/50'
                  }`}
                  title="Deploy acoustic countermeasure ADC-Mk3 decoy"
                >
                  <ShieldAlert className="w-3 h-3 text-amber-400" />
                  <span>DECOY ({telemetry.countermeasuresRemaining}/6)</span>
                </button>

                {/* Super Silent Toggle */}
                <button
                  onClick={handleToggleSuperSilent}
                  className={`px-2 py-0.5 rounded font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                    telemetry.superSilentMode
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title="Toggle Super Silent Running Mode (natural circulation cooling, creep speed)"
                >
                  {telemetry.superSilentMode ? <VolumeX className="w-3 h-3 text-emerald-400" /> : <Volume2 className="w-3 h-3 text-slate-400" />}
                  <span>{telemetry.superSilentMode ? 'SILENT (78dB)' : 'PATROL (104dB)'}</span>
                </button>

                {/* Submarine Helm: Depth, Surface Mode & Velocity HUD bar */}
                <div className="flex items-center gap-1 mt-1 pt-1 border-t border-slate-800/80 w-full justify-end text-[10px]">
                  {/* Surface Mode Toggle */}
                  <button
                    onClick={handleToggleSurfaceMode}
                    className={`px-2 py-0.5 rounded font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                      telemetry.subSurfaceMode || (telemetry.subDepthMeters ?? 22) === 0
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow'
                        : 'bg-slate-900 border-slate-750 text-slate-300 hover:text-cyan-200'
                    }`}
                    title={telemetry.subSurfaceMode || (telemetry.subDepthMeters ?? 22) === 0 ? "Surfaced at 0m (Click to dive to 22m)" : "Blow Main Ballast to Surface (0m)"}
                  >
                    <Waves className="w-3 h-3 text-cyan-400" />
                    <span>{telemetry.subSurfaceMode || (telemetry.subDepthMeters ?? 22) === 0 ? 'SURFACED (0m)' : 'SURFACE'}</span>
                  </button>

                  {/* Depth Stepper */}
                  <div className="flex items-center bg-slate-900 rounded border border-slate-750 px-1.5 py-0.5 gap-1">
                    <span className="text-cyan-400 font-bold">DEP:</span>
                    <span className="text-slate-200 font-bold">
                      {telemetry.subSurfaceMode || (telemetry.subDepthMeters ?? 22) === 0 ? '0m' : `${telemetry.subDepthMeters ?? 22}m`}
                    </span>
                    <button
                      onClick={() => handleChangeDepth(Math.max(0, (telemetry.subDepthMeters ?? 22) - 5))}
                      className="px-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                      title="Ascend 5m"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleChangeDepth(Math.min(100, (telemetry.subDepthMeters ?? 22) + 5))}
                      className="px-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                      title="Dive 5m"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Velocity Stepper */}
                  <div className="flex items-center bg-slate-900 rounded border border-slate-750 px-1.5 py-0.5 gap-1">
                    <span className="text-amber-400 font-bold">SPD:</span>
                    <span className="text-slate-200 font-bold">{(telemetry.subSpeedKnots ?? 4).toFixed(0)}kt</span>
                    <button
                      onClick={() => handleChangeVelocity(Math.max(0, (telemetry.subSpeedKnots ?? 4) - 1))}
                      className="px-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                      title="Decrease 1 knot"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleChangeVelocity(Math.min(25, (telemetry.subSpeedKnots ?? 4) + 1))}
                      className="px-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                      title="Increase 1 knot"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Flight Phase Badge */}
          <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-2 font-mono">
            <div className="px-3 py-1.5 rounded bg-slate-950/85 border border-slate-700 backdrop-blur shadow flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-slate-300 text-xs font-bold">PHASE:</span>
              <span className="text-amber-400 font-bold text-sm tracking-wider">{telemetry.stage}</span>
            </div>

            {/* 4-Knot Sub Patrol & Bubble Envelope Callout */}
            {(telemetry.stage === 'PRE_LAUNCH_4KT' || telemetry.stage === 'SUB_BUBBLE_EJECT') && (
              <div className="px-3 py-1.5 rounded bg-sky-950/90 border border-sky-500/60 text-sky-200 text-xs backdrop-blur max-w-xs">
                <div className="flex items-center gap-1.5 font-bold text-sky-300 mb-0.5">
                  <Waves className="w-3.5 h-3.5" />
                  <span>4-KNOT RUN &amp; GAS BUBBLE ENVELOPE</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-tight">
                  SSBN cruising at <strong>4.0 knots</strong>. High-pressure steam bubble encapsulates missile to prevent transverse hydrodynamic shear before surface broach.
                </p>
              </div>
            )}

            {/* Bubble Burst Callout */}
            {telemetry.stage === 'BUBBLE_BURST' && (
              <div className="px-3 py-1.5 rounded bg-cyan-950/90 border border-cyan-400 text-cyan-200 text-xs backdrop-blur animate-pulse">
                <div className="font-bold text-cyan-300">💥 SEA SURFACE BROACH &amp; BUBBLE BURST</div>
                <div className="text-[10px] text-slate-200">Gas cavity ruptures with cavitation spray. Stage 1 engine ignition armed!</div>
              </div>
            )}

            {/* Platform Deploy / Warhead Drop Callout */}
            {(telemetry.stage === 'PLATFORM_DEPLOY' || telemetry.stage === 'WARHEAD_RELEASE') && (
              <div className="px-3 py-1.5 rounded bg-amber-950/90 border border-amber-500 text-amber-200 text-xs backdrop-blur max-w-xs">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>MIRV DEPLOYMENT PLATFORM ACTIVE</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-tight">
                  PBV bus firing vernier thrusters to deploy Mk 4/5 warheads onto independent target trajectories.
                </p>
              </div>
            )}

            {/* Terminal Impact Silo Effectiveness Callout */}
            {(telemetry.stage === 'REENTRY_STREAK' || telemetry.stage === 'TARGET_IMPACT') && (
              <div className={`px-3 py-2 rounded border backdrop-blur max-w-xs text-xs ${
                telemetry.gssEnabled 
                  ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200' 
                  : 'bg-rose-950/90 border-rose-500 text-rose-200'
              }`}>
                <div className="font-bold flex items-center gap-1.5 mb-0.5">
                  {telemetry.gssEnabled ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                  <span>{telemetry.gssEnabled ? 'WITH GSS: SILO CRUSHED' : 'WITHOUT GSS: SILO SURVIVES'}</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-tight">
                  {telemetry.gssEnabled 
                    ? 'Target CEP 38m, overpressure 2,850 PSI crushes hardened launch silo.' 
                    : 'Uncompensated vertical bias causes 1,420m CEP miss; silo survives.'}
                </p>
              </div>
            )}
          </div>

          {/* Interactive 3D On-Screen Nav Controller (Pan, Orbit, Zoom, Angles) */}
          <div className="absolute bottom-16 left-4 z-20 font-mono text-[11px] select-none">
            {!show3DControlsWidget ? (
              <button
                onClick={() => {
                  soundFx.playClick();
                  setShow3DControlsWidget(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950/90 border border-slate-750 text-slate-300 hover:text-amber-400 hover:border-amber-500/50 backdrop-blur shadow-xl cursor-pointer"
                title="Open 3D Pan, Orbit and Zoom Controller"
              >
                <Move className="w-3.5 h-3.5 text-amber-400" />
                <span>3D CONTROLS</span>
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ) : (
              <div className="bg-slate-950/92 border border-slate-750 rounded-lg p-2.5 backdrop-blur-md shadow-2xl flex flex-col gap-2 max-w-[280px]">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[10px] tracking-wider">
                    <Move className="w-3.5 h-3.5" />
                    <span>3D VECTOR CONTROLS</span>
                  </div>
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setShow3DControlsWidget(false);
                    }}
                    className="p-0.5 text-slate-400 hover:text-white cursor-pointer"
                    title="Minimize Controls Widget"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Primary Interaction Mode Switcher */}
                <div className="grid grid-cols-2 gap-1 text-[10px] font-bold">
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setDragInteractionMode('ORBIT');
                    }}
                    className={`flex items-center justify-center gap-1 py-1 rounded border cursor-pointer ${
                      dragInteractionMode === 'ORBIT'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white'
                    }`}
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>DRAG: ORBIT</span>
                  </button>
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setDragInteractionMode('PAN');
                    }}
                    className={`flex items-center justify-center gap-1 py-1 rounded border cursor-pointer ${
                      dragInteractionMode === 'PAN'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Move className="w-3 h-3" />
                    <span>DRAG: PAN</span>
                  </button>
                </div>

                {/* Controller Pad (Pan D-Pad & Orbit Rotation) */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  {/* Pan D-Pad */}
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] text-slate-400 font-bold mb-1">PAN PAD</span>
                    <div className="grid grid-cols-3 gap-1 w-20">
                      <div />
                      <button
                        onClick={() => handlePan(0, 5)}
                        className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-400 flex items-center justify-center cursor-pointer"
                        title="Pan Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <div />
                      <button
                        onClick={() => handlePan(-5, 0)}
                        className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-400 flex items-center justify-center cursor-pointer"
                        title="Pan Left"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          soundFx.playClick();
                          userOrbitRef.current.panX = 0;
                          userOrbitRef.current.panY = 0;
                          setPanDisplay({ x: 0, y: 0 });
                          updateSimulationVisuals(simTimeRef.current);
                        }}
                        className="p-1 rounded bg-slate-900 hover:bg-amber-950 border border-slate-800 text-amber-400 font-bold text-[9px] flex items-center justify-center cursor-pointer"
                        title="Center / Reset Pan"
                      >
                        •
                      </button>
                      <button
                        onClick={() => handlePan(5, 0)}
                        className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-400 flex items-center justify-center cursor-pointer"
                        title="Pan Right"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      <div />
                      <button
                        onClick={() => handlePan(0, -5)}
                        className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-400 flex items-center justify-center cursor-pointer"
                        title="Pan Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <div />
                    </div>
                  </div>

                  {/* Orbit Stepping Buttons */}
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] text-slate-400 font-bold mb-1">ORBIT ROTATE</span>
                    <div className="grid grid-cols-2 gap-1 text-[9px]">
                      <button
                        onClick={() => handleOrbitStep(0.15, 0)}
                        className="px-1.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                        title="Pitch Up"
                      >
                        PITCH ▲
                      </button>
                      <button
                        onClick={() => handleOrbitStep(-0.15, 0)}
                        className="px-1.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                        title="Pitch Down"
                      >
                        PITCH ▼
                      </button>
                      <button
                        onClick={() => handleOrbitStep(0, 0.2)}
                        className="px-1.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                        title="Yaw Left"
                      >
                        YAW ◀
                      </button>
                      <button
                        onClick={() => handleOrbitStep(0, -0.2)}
                        className="px-1.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                        title="Yaw Right"
                      >
                        YAW ▶
                      </button>
                    </div>
                  </div>
                </div>

                {/* Camera Perspective Presets */}
                <div className="flex flex-col gap-1 border-t border-slate-850 pt-1.5">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">VIEW PRESETS</span>
                  <div className="grid grid-cols-5 gap-1 text-[9px]">
                    <button
                      onClick={() => handleSetQuickPreset('DEFAULT')}
                      className="py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer text-center font-bold"
                    >
                      CHASE
                    </button>
                    <button
                      onClick={() => handleSetQuickPreset('TOP')}
                      className="py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer text-center font-bold"
                    >
                      TOP
                    </button>
                    <button
                      onClick={() => handleSetQuickPreset('PROFILE')}
                      className="py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer text-center font-bold"
                    >
                      SIDE
                    </button>
                    <button
                      onClick={() => handleSetQuickPreset('ISOMETRIC')}
                      className="py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer text-center font-bold"
                    >
                      ISO
                    </button>
                    <button
                      onClick={() => handleSetQuickPreset('ORBIT')}
                      className="py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-300 hover:text-white cursor-pointer text-center font-bold"
                      title="Extreme Zoom Earth Orbit View"
                    >
                      ORBIT
                    </button>
                  </div>
                </div>

                {/* Reset View Button */}
                <button
                  onClick={handleResetOrbitZoomPan}
                  className="w-full py-1 rounded bg-slate-900 hover:bg-slate-850 border border-slate-750 text-amber-400 font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>RESET VIEW &amp; PAN (100%)</span>
                </button>
              </div>
            )}
          </div>

          {/* Pitch Angle Indicator (Attitude Director Indicator HUD) */}
          <div className="absolute bottom-16 right-4 pointer-events-none w-24 h-24 rounded-full border border-emerald-500/40 bg-slate-950/80 backdrop-blur overflow-hidden flex items-center justify-center">
            <div 
              className="absolute inset-0 transition-transform duration-100 ease-out"
              style={{
                transform: `rotate(${90 - telemetry.pitchAngle}deg)`,
                transformOrigin: 'center center'
              }}
            >
              <div className="w-full h-1/2 bg-sky-900/40 border-b border-emerald-400"></div>
              <div className="w-full h-1/2 bg-amber-950/40"></div>
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-emerald-400 -translate-y-1/2"></div>
            </div>

            <div className="relative z-10 w-8 h-2 border-l-2 border-r-2 border-b-2 border-emerald-400"></div>

            <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[9px] font-mono text-emerald-400 font-bold drop-shadow-md">
              P: {telemetry.pitchAngle.toFixed(1)}°
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-mono text-emerald-400 font-bold drop-shadow-md">
              ADI HUD
            </div>
          </div>

          {/* Viewport Bottom Controls Bar */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 bg-slate-950/90 border border-slate-800 px-4 py-2 rounded backdrop-blur font-mono text-xs">
            <div className="flex items-center gap-2">
              <button
                id="btn-play-pause"
                onClick={handleTogglePlay}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'PAUSE' : 'RUN'}</span>
              </button>

              <button
                id="btn-reset-sim"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESET</span>
              </button>

              <div className="flex items-center gap-1 ml-2 text-slate-400">
                <span>WARP:</span>
                {[1, 2, 4].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setSimulationSpeed(speed)}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      simulationSpeed === speed ? 'bg-slate-700 text-amber-400 font-bold' : 'hover:text-white'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            {/* GSS SINS Toggle inside Simulation HUD */}
            <div className="flex items-center gap-3">
              <button
                id="btn-sim-gss-toggle"
                onClick={handleToggleGss}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-bold transition-all cursor-pointer ${
                  telemetry.gssEnabled
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                    : 'bg-rose-950 border-rose-500 text-rose-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>GSS-SINS UPDATE: {telemetry.gssEnabled ? 'ACTIVE (0.08")' : 'BYPASSED (24.5")'}</span>
              </button>

              <button
                id="btn-open-star-station"
                onClick={onOpenStarTracker}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-950 border border-cyan-600/80 hover:bg-cyan-900 text-cyan-200 font-bold transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>MK 6 STAR RETICLE</span>
              </button>
            </div>
          </div>
        </div>

        {/* Telemetry Stream Log Marquee */}
        <div className="bg-slate-900/90 border-t border-slate-800 px-4 py-2 font-mono text-[11px] flex items-center gap-3 overflow-hidden">
          <span className="text-emerald-400 font-bold shrink-0 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            DOWNLINK:
          </span>
          <div className="text-slate-300 truncate">
            {telemetry.telemetryStream[0] || 'Awaiting telemetry frames...'}
          </div>
        </div>
      </div>

      {/* Flight Control & GSS MIRV Effectiveness Column */}
      {!isTheaterMode && (
        <div className="w-full lg:w-80 xl:w-96 shrink-0 h-full overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-slate-800">
          {/* Tactical Submarine Evasion & Countermeasures Console */}
          <div className="p-4 rounded-lg border border-cyan-800/80 bg-slate-950 font-mono shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                SSBN TACTICAL EVASION
              </span>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setCameraMode('TACTICAL_EVASION');
                  updateSimulationVisuals(simTimeRef.current);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                  cameraMode === 'TACTICAL_EVASION'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
                title="View Ohio SSBN & Stalking Russian SSN together in 3D"
              >
                CAM: SUB &amp; STALKER
              </button>
            </div>

            {/* Hostile Russian Akula-I Threat Monitor */}
            <div className={`p-2.5 rounded border mb-3 text-xs ${
              telemetry.russianSubContact.trackingStatus === 'LOCKED'
                ? 'bg-rose-950/40 border-rose-600/80'
                : telemetry.russianSubContact.trackingStatus === 'SPOOFED_BY_DECOY'
                ? 'bg-amber-950/40 border-amber-600/80'
                : telemetry.russianSubContact.trackingStatus === 'SEARCHING'
                ? 'bg-emerald-950/40 border-emerald-600/80'
                : 'bg-sky-950/40 border-sky-600/80'
            }`}>
              <div className="flex items-center justify-between font-bold mb-1">
                <span className="text-slate-200 text-[11px] flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  PR. 971 AKULA-I STALKER
                </span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  telemetry.russianSubContact.trackingStatus === 'LOCKED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse' :
                  telemetry.russianSubContact.trackingStatus === 'SPOOFED_BY_DECOY' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' :
                  telemetry.russianSubContact.trackingStatus === 'SEARCHING' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' :
                  'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                }`}>
                  {telemetry.russianSubContact.trackingStatus === 'LOCKED' ? 'TMA LOCKED (94%)' :
                   telemetry.russianSubContact.trackingStatus === 'SPOOFED_BY_DECOY' ? 'SPOOFED BY ADC-MK3' :
                   telemetry.russianSubContact.trackingStatus === 'SEARCHING' ? 'CONTACT LOST (78 dB)' :
                   `TMA BAFFLED (${telemetry.russianSubContact.tmaConfidence}%)`}
                </span>
              </div>
              <div className="text-[10px] text-slate-300 leading-tight">
                {telemetry.russianSubContact.trackingStatus === 'LOCKED' 
                  ? 'Russian active sonar ping holds direct acoustic lock. Engage Noodling or Decoy immediately.' 
                  : telemetry.russianSubContact.trackingStatus === 'SPOOFED_BY_DECOY'
                  ? 'Russian MGK-540 sonar seduced by high-gain acoustic decoy bubble cloud.'
                  : telemetry.russianSubContact.trackingStatus === 'SEARCHING'
                  ? 'Submarine acoustic emissions dropped below ocean noise threshold (78 dB).'
                  : 'Ohio course maneuvers broke continuous bearing rate solution.'}
              </div>
            </div>

            {/* Submarine Helm: Depth, Surface Mode & Velocity */}
            <div className="mb-3 p-2.5 rounded bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-200 mb-2">
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <Anchor className="w-3.5 h-3.5" />
                  SUBMARINE HELM &amp; DEPTH CONTROL
                </span>
                <span className="text-[9px] text-slate-400 font-mono">
                  {telemetry.subSurfaceMode || (telemetry.subDepthMeters ?? 22) === 0 ? 'SURFACED' : `${telemetry.subDepthMeters ?? 22}m SUBMERGED`}
                </span>
              </div>

              {/* Surface Mode Button */}
              <button
                onClick={handleToggleSurfaceMode}
                className={`w-full py-1.5 px-2 rounded mb-2 text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  telemetry.subSurfaceMode || (telemetry.subDepthMeters ?? 22) === 0
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <Waves className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {telemetry.subSurfaceMode || (telemetry.subDepthMeters ?? 22) === 0
                    ? 'SURFACED AT 0m (CLICK TO DIVE TO 22m)'
                    : 'SURFACE MODE (BLOW MAIN BALLAST TANKS)'}
                </span>
              </button>

              {/* Depth and Velocity Sliders */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-slate-950/70 p-2 rounded border border-slate-850">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-cyan-400 font-bold">DEPTH</span>
                    <span className="text-white font-mono font-bold">
                      {telemetry.subSurfaceMode || (telemetry.subDepthMeters ?? 22) === 0 ? '0m' : `${telemetry.subDepthMeters ?? 22}m`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={telemetry.subSurfaceMode ? 0 : (telemetry.subDepthMeters ?? 22)}
                    onChange={(e) => handleChangeDepth(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[8px] text-slate-500 mt-0.5">
                    <span>0m (Surf)</span>
                    <span>100m</span>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-2 rounded border border-slate-850">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-amber-400 font-bold">VELOCITY</span>
                    <span className="text-white font-mono font-bold">
                      {(telemetry.subSpeedKnots ?? 4).toFixed(1)} kt
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    step="0.5"
                    value={telemetry.subSpeedKnots ?? 4}
                    onChange={(e) => handleChangeVelocity(parseFloat(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[8px] text-slate-500 mt-0.5">
                    <span>0 kt (Stop)</span>
                    <span>25 kt (Flank)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 1. Noodling Evasion Pattern Selector */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1.5">
                <span className="flex items-center gap-1 text-cyan-300">
                  <Compass className="w-3.5 h-3.5" />
                  1. NOODLING PATTERNS
                </span>
                <span className="text-[9px] text-slate-400">EVADE FAST ATTACK SUB</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                {[
                  { id: 'OFF', label: 'OFF (STEADY)', desc: '4.0 kt straight cruise' },
                  { id: 'SERPENTINE', label: 'SERPENTINE', desc: '±25° weave baffle' },
                  { id: 'BAFFLE_CLEAR', label: 'BAFFLE-CLEAR', desc: '45° stern clear zig' },
                  { id: 'THERMAL_DIVE', label: 'THERMAL DIVE', desc: 'Thermocline layer dip' }
                ].map((pat) => (
                  <button
                    key={pat.id}
                    onClick={() => handleSetNoodlingPattern(pat.id as any)}
                    className={`p-1.5 rounded border text-left cursor-pointer transition-colors ${
                      telemetry.noodlingPattern === pat.id
                        ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold">{pat.label}</div>
                    <div className="text-[9px] text-slate-500 leading-none mt-0.5">{pat.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Deploy Countermeasures */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1.5">
                <span className="flex items-center gap-1 text-amber-300">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  2. COUNTERMEASURES
                </span>
                <span className="text-[9px] text-amber-400">
                  {telemetry.countermeasuresRemaining}/6 CANISTERS
                </span>
              </div>

              <button
                onClick={handleDeployCountermeasures}
                disabled={telemetry.countermeasuresRemaining <= 0}
                className={`w-full py-2 px-3 rounded text-xs font-bold border transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  telemetry.countermeasuresRemaining <= 0
                    ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    : telemetry.countermeasuresActive
                    ? 'bg-amber-950/70 border-amber-400 text-amber-200 shadow-md'
                    : 'bg-amber-500/20 border-amber-500 text-amber-300 hover:bg-amber-500/30'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {telemetry.countermeasuresRemaining <= 0 
                    ? 'ALL DECOYS EXPENDED' 
                    : `DEPLOY ADC-MK3 ACOUSTIC DECOY (${telemetry.countermeasuresRemaining} LEFT)`}
                </span>
              </button>
              {telemetry.countermeasuresActive && (
                <div className="text-[9px] text-amber-400/90 mt-1 leading-tight flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                  Active Decoy in water generating false acoustic echo &amp; micro-bubble curtain.
                </div>
              )}
            </div>

            {/* 3. Super Silent Operation Mode Toggle */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1.5">
                <span className="flex items-center gap-1 text-emerald-300">
                  <VolumeX className="w-3.5 h-3.5" />
                  3. SUPER SILENT OPERATION
                </span>
                <span className={`text-[9px] font-bold ${telemetry.superSilentMode ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {telemetry.superSilentMode ? 'ULTRA-QUIET ON' : 'PATROL NOISE'}
                </span>
              </div>

              <button
                onClick={handleToggleSuperSilent}
                className={`w-full py-2 px-3 rounded text-xs font-bold border transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  telemetry.superSilentMode
                    ? 'bg-emerald-950/60 border-emerald-400 text-emerald-300 shadow-md'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-850'
                }`}
              >
                {telemetry.superSilentMode ? <VolumeX className="w-3.5 h-3.5 text-emerald-400" /> : <Volume2 className="w-3.5 h-3.5 text-slate-400" />}
                <span>{telemetry.superSilentMode ? 'SECURE ULTRA-QUIET MODE' : 'RIG FOR ULTRA-QUIET (78 dB)'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2 text-[10px] mt-2">
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                  <div className="text-slate-400">RADIATED NOISE</div>
                  <div className={`font-bold ${telemetry.superSilentMode ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {telemetry.subRadiatedNoiseDb} dB
                  </div>
                  <div className="text-[8px] text-slate-500">Ocean floor: 84 dB</div>
                </div>

                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                  <div className="text-slate-400">COOLANT SYSTEM</div>
                  <div className={`font-bold ${telemetry.superSilentMode ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {telemetry.superSilentMode ? 'NATURAL CIRC' : 'MAIN PUMPS'}
                  </div>
                  <div className="text-[8px] text-slate-500">S8G Nuclear Core</div>
                </div>
              </div>
            </div>
          </div>

          {/* GSS Impact on MIRV Target Effectiveness Card */}
          <div className="p-4 rounded-lg border border-slate-800 bg-slate-950 font-mono shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <span className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-4 h-4" />
                GSS SINS &amp; MIRV TARGET KILL
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                telemetry.gssEnabled ? 'bg-emerald-950 border border-emerald-500 text-emerald-400' : 'bg-rose-950 border border-rose-500 text-rose-400'
              }`}>
                {telemetry.gssEnabled ? 'SINS CALIBRATED' : 'RAW SINS DRIFT'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="bg-slate-900/70 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">DEFLECTION OF VERTICAL</div>
                <div className={`text-base font-bold ${telemetry.gssEnabled ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {telemetry.sinsDeflectionArcsec.toFixed(2)}&quot;
                </div>
                <div className="text-[9px] text-slate-500">
                  {telemetry.gssEnabled ? 'Bell GSS tensor compensated' : 'Uncorrected gravity bias'}
                </div>
              </div>

              <div className="bg-slate-900/70 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">TARGET MISS (CEP)</div>
                <div className={`text-base font-bold ${telemetry.gssEnabled ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {telemetry.targetMissMeters} M
                </div>
                <div className="text-[9px] text-slate-500">
                  {telemetry.gssEnabled ? 'Hard Target Kill threshold' : 'Exceeds lethal radius'}
                </div>
              </div>

              <div className="bg-slate-900/70 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">SILO OVERPRESSURE</div>
                <div className={`text-base font-bold ${telemetry.gssEnabled ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {telemetry.siloOverpressurePsi} PSI
                </div>
                <div className="text-[9px] text-slate-500">Threshold: 2,000 PSI</div>
              </div>

              <div className="bg-slate-900/70 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">SILO DESTRUCTION (Pk)</div>
                <div className={`text-base font-bold ${telemetry.gssEnabled ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {telemetry.targetKillProb}%
                </div>
                <div className="text-[9px] text-slate-500">
                  {telemetry.gssEnabled ? 'SILO CRUSHED' : 'Hardened ICBM Silo'}
                </div>
              </div>
            </div>

            <button
              onClick={handleToggleGss}
              className={`w-full py-2 px-3 rounded text-xs font-bold border transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                telemetry.gssEnabled
                  ? 'bg-pink-950/40 border-pink-500 text-pink-300 hover:bg-pink-900/40'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>TOGGLE GSS MAP-MATCHING INJECTION</span>
            </button>
          </div>

          {/* Flight Dynamics Telemetry Metrics */}
          <div className="p-4 rounded-lg border border-slate-800 bg-slate-950 font-mono shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Crosshair className="w-4 h-4" />
                FLIGHT DYNAMICS METRICS
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                MK 6 GUIDANCE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-3">
              <div className="bg-slate-900/70 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">ALTITUDE</div>
                <div className="text-base font-bold text-white">
                  {telemetry.altitude < 0 
                    ? `${(telemetry.altitude * 1000).toFixed(0)} M (SUB)` 
                    : `${telemetry.altitude.toFixed(2)} KM`}
                </div>
              </div>

              <div className="bg-slate-900/70 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">VELOCITY</div>
                <div className="text-base font-bold text-amber-400">
                  {telemetry.velocity.toFixed(0)} M/S
                </div>
                <div className="text-[10px] text-slate-500">
                  MACH {(telemetry.velocity / 340).toFixed(1)}
                </div>
              </div>

              <div className="bg-slate-900/70 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">DOWNRANGE</div>
                <div className="text-base font-bold text-white">
                  {telemetry.downrange.toFixed(0)} KM
                </div>
                <div className="text-[10px] text-slate-500">
                  {(telemetry.downrange * 0.54).toFixed(0)} NM
                </div>
              </div>

              <div className="bg-slate-900/70 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">SUB PATROL SPEED</div>
                <div className="text-base font-bold text-sky-400">
                  4.0 KNOTS
                </div>
                <div className="text-[10px] text-slate-500">
                  Submerged Cruise
                </div>
              </div>
            </div>

            {/* Fuel Remaining Bar */}
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-400">NEPE-75 PROPELLANT</span>
              <span className="font-bold text-amber-400">{telemetry.fuelPercent.toFixed(0)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-200"
                style={{ width: `${Math.max(0, telemetry.fuelPercent)}%` }}
              />
            </div>
          </div>

          {/* Historical Teletype Printer */}
          <div className="p-4 rounded-lg border border-slate-800 bg-slate-950 font-mono flex-1 shadow-md flex flex-col">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1.5 flex items-center justify-between">
              <span>FBM GUIDANCE BUS FEED</span>
              <span className="text-[10px] text-emerald-400">CH-2287</span>
            </div>

            <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto max-h-40 text-[11px] text-slate-300 scrollbar-thin scrollbar-thumb-slate-800">
              {telemetry.telemetryStream.map((log, idx) => (
                <div key={idx} className="p-1.5 rounded bg-slate-900/60 border border-slate-850 leading-tight">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
