import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { TelemetryData } from '../types';
import { soundFx } from '../audio/soundEngine';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Eye, 
  Sparkles, 
  Crosshair, 
  ShieldCheck, 
  AlertTriangle,
  Flame,
  Target,
  Waves,
  Zap,
  Activity,
  Compass,
  CheckCircle2
} from 'lucide-react';

interface ThreeFlightSimulatorProps {
  telemetry: TelemetryData;
  setTelemetry: React.Dispatch<React.SetStateAction<TelemetryData>>;
  onOpenStarTracker: () => void;
}

export const ThreeFlightSimulator: React.FC<ThreeFlightSimulatorProps> = ({
  telemetry,
  setTelemetry,
  onOpenStarTracker
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [cameraMode, setCameraMode] = useState<'FOLLOW' | 'SUB_4KT' | 'BUBBLE_CAM' | 'PLATFORM_BUS' | 'TARGET_SILO' | 'SHIP'>('FOLLOW');
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [shockConeVisible, setShockConeVisible] = useState<boolean>(true);
  const [targetViewGssComparison, setTargetViewGssComparison] = useState<boolean>(false);

  // Keep references for Three.js animation loop
  const animFrameId = useRef<number | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // 3D Objects
  const subGroupRef = useRef<THREE.Group | null>(null);
  const subWakeRef = useRef<THREE.Points | null>(null);
  const missileGroupRef = useRef<THREE.Group | null>(null);
  const steamBubbleMeshRef = useRef<THREE.Mesh | null>(null);
  const bubbleParticlesRef = useRef<THREE.Points | null>(null);
  const bubbleBurstMeshRef = useRef<THREE.Mesh | null>(null);
  const aerospikeMeshRef = useRef<THREE.Mesh | null>(null);
  const flameMeshRef = useRef<THREE.Mesh | null>(null);
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

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050811);
    scene.fog = new THREE.FogExp2(0x050811, 0.0006);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    camera.position.set(0, 15, 50);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x334155, 1.3);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.8);
    sunLight.position.set(150, 250, 180);
    scene.add(sunLight);

    const waterLight = new THREE.DirectionalLight(0x0284c7, 1.2);
    waterLight.position.set(0, -60, 50);
    scene.add(waterLight);

    // Deep Ocean Water Surface Plane
    const oceanGeo = new THREE.PlaneGeometry(4000, 4000, 32, 32);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0c283f,
      roughness: 0.15,
      metalness: 0.85,
      transparent: true,
      opacity: 0.88
    });
    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    oceanMesh.rotation.x = -Math.PI / 2;
    oceanMesh.position.y = 0;
    scene.add(oceanMesh);

    // Ocean grid overlay
    const gridHelper = new THREE.GridHelper(3000, 60, 0x1e293b, 0x0f172a);
    gridHelper.position.y = 0.1;
    scene.add(gridHelper);

    // Submarine Undersea Floor (Bathymetry Seamount)
    const seaFloorGeo = new THREE.PlaneGeometry(2000, 2000, 24, 24);
    const seaFloorMat = new THREE.MeshStandardMaterial({ color: 0x08111e, roughness: 0.9 });
    const seaFloor = new THREE.Mesh(seaFloorGeo, seaFloorMat);
    seaFloor.rotation.x = -Math.PI / 2;
    seaFloor.position.y = -80;
    scene.add(seaFloor);

    // ==========================================
    // 1. OHIO-CLASS SUBMARINE (4-KNOT PATROL SPEED)
    // ==========================================
    const subGroup = new THREE.Group();
    subGroup.position.set(-60, -18, 0); // submerged ~45 meters
    subGroupRef.current = subGroup;

    // Hull (170m Ohio class cylinder)
    const hullGeo = new THREE.CylinderGeometry(7.5, 7.5, 120, 32);
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x18202b,
      metalness: 0.7,
      roughness: 0.35
    });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.rotation.z = Math.PI / 2;
    subGroup.add(hull);

    // Conning Tower / Sail
    const sailGeo = new THREE.BoxGeometry(16, 12, 5.5);
    const sailMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
    const sail = new THREE.Mesh(sailGeo, sailMat);
    sail.position.set(18, 9, 0);
    subGroup.add(sail);

    // Submarine Stern Propulsor / Screw
    const screwGeo = new THREE.CylinderGeometry(4.5, 4.5, 3.5, 16);
    const screwMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.9, roughness: 0.2 });
    const screw = new THREE.Mesh(screwGeo, screwMat);
    screw.rotation.z = Math.PI / 2;
    screw.position.set(-61, 0, 0);
    subGroup.add(screw);

    // 24 Missile Tube Hatches on Turtleback deck
    const hatchMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5 });
    const openHatchMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 });
    for (let i = 0; i < 12; i++) {
      [-2.4, 2.4].forEach((zOff) => {
        const xPos = -32 + i * 5.5;
        const isTube4 = i === 3 && zOff > 0;
        const hatchGeo = new THREE.CylinderGeometry(1.8, 1.8, 0.4, 16);
        const hatch = new THREE.Mesh(hatchGeo, isTube4 ? openHatchMat : hatchMat);
        hatch.position.set(xPos, 7.6, zOff);
        subGroup.add(hatch);
      });
    }

    // Submarine 4-Knot Wake Particles (Trailing bubbles)
    const wakeParticleCount = 180;
    const wakeGeo = new THREE.BufferGeometry();
    const wakePos = new Float32Array(wakeParticleCount * 3);
    for (let i = 0; i < wakeParticleCount * 3; i += 3) {
      wakePos[i] = -60 - Math.random() * 90;
      wakePos[i + 1] = -18 + (Math.random() - 0.5) * 6;
      wakePos[i + 2] = (Math.random() - 0.5) * 8;
    }
    wakeGeo.setAttribute('position', new THREE.BufferAttribute(wakePos, 3));
    const wakeMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 1.8,
      transparent: true,
      opacity: 0.4
    });
    const subWake = new THREE.Points(wakeGeo, wakeMat);
    subGroup.add(subWake);
    subWakeRef.current = subWake;

    scene.add(subGroup);

    // ==========================================
    // 2. USNS VANGUARD SHIP DOWNRANGE
    // ==========================================
    const shipGroup = new THREE.Group();
    shipGroup.position.set(280, 0, -420);

    const shipHullGeo = new THREE.BoxGeometry(68, 12, 16);
    const shipHullMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
    const shipHull = new THREE.Mesh(shipHullGeo, shipHullMat);
    shipHull.position.y = 4;
    shipGroup.add(shipHull);

    [-20, -7, 7, 20].forEach((xPos, idx) => {
      const rad = idx === 1 || idx === 2 ? 6.5 : 5.0;
      const domeGeo = new THREE.SphereGeometry(rad, 16, 16);
      const domeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
      const dome = new THREE.Mesh(domeGeo, domeMat);
      dome.position.set(xPos, 14, 0);
      shipGroup.add(dome);
    });
    scene.add(shipGroup);

    // ==========================================
    // 3. TARGET SILO COMPLEX DOWNRANGE
    // ==========================================
    const targetGroup = new THREE.Group();
    targetGroup.position.set(0, 0.1, -1200); // 4000nm downrange simulated
    targetComplexRef.current = targetGroup;

    // Hardened Silo #41 Reinforced Door
    const siloRingGeo = new THREE.RingGeometry(8, 22, 32);
    const siloRingMat = new THREE.MeshBasicMaterial({
      color: 0x475569,
      side: THREE.DoubleSide
    });
    const siloRing = new THREE.Mesh(siloRingGeo, siloRingMat);
    siloRing.rotation.x = -Math.PI / 2;
    targetGroup.add(siloRing);

    // Hardened Silo Blast Door (center 2000 psi cap)
    const doorGeo = new THREE.CircleGeometry(7.5, 32);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.rotation.x = -Math.PI / 2;
    door.position.y = 0.05;
    targetGroup.add(door);

    // 2,000 PSI Lethal Crater Radius Circle (Green dashed)
    const lethalGeo = new THREE.RingGeometry(65, 68, 48);
    const lethalMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide });
    const lethalCircle = new THREE.Mesh(lethalGeo, lethalMat);
    lethalCircle.rotation.x = -Math.PI / 2;
    targetGroup.add(lethalCircle);

    // Target Label Crosshair Ring
    const crosshairGeo = new THREE.RingGeometry(180, 185, 48);
    const crosshairMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
    const crosshair = new THREE.Mesh(crosshairGeo, crosshairMat);
    crosshair.rotation.x = -Math.PI / 2;
    targetGroup.add(crosshair);

    scene.add(targetGroup);

    // Detonation Nuclear Flash Sphere
    const flashGeo = new THREE.SphereGeometry(45, 32, 32);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffedd5,
      transparent: true,
      opacity: 0.0
    });
    const detFlash = new THREE.Mesh(flashGeo, flashMat);
    detFlash.position.set(0, 15, -1200);
    scene.add(detFlash);
    detonationFlashRef.current = detFlash;

    // ==========================================
    // 4. DEEP SPACE STARFIELD
    // ==========================================
    const starCount = 3500;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 5000;
      starPositions[i + 1] = Math.random() * 2500 + 80;
      starPositions[i + 2] = (Math.random() - 0.5) * 5000;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.8, sizeAttenuation: true });
    scene.add(new THREE.Points(starGeo, starMat));

    // ==========================================
    // 5. UGM-133A TRIDENT II MISSILE & BUBBLE
    // ==========================================
    const missileGroup = new THREE.Group();
    missileGroup.position.set(-60, -15, 2.4); // right above Tube #4
    missileGroupRef.current = missileGroup;

    // --- STEAM / AIR BUBBLE ENVELOPE (SUPERCAVITATION CAVITY) ---
    // Surrounds the missile while ascending through the water column
    const bubbleGeo = new THREE.SphereGeometry(3.6, 24, 24);
    bubbleGeo.scale(1.0, 3.2, 1.0); // elongated capsule shape
    const bubbleMat = new THREE.MeshStandardMaterial({
      color: 0xa5f3fc,
      transparent: true,
      opacity: 0.38,
      roughness: 0.1,
      metalness: 0.2,
      wireframe: false
    });
    const steamBubbleMesh = new THREE.Mesh(bubbleGeo, bubbleMat);
    steamBubbleMesh.position.y = 7.5;
    missileGroup.add(steamBubbleMesh);
    steamBubbleMeshRef.current = steamBubbleMesh;

    // Rising Air/Steam Bubbles Particles inside water column
    const bubbleCount = 120;
    const bGeo = new THREE.BufferGeometry();
    const bPos = new Float32Array(bubbleCount * 3);
    for (let i = 0; i < bubbleCount * 3; i += 3) {
      bPos[i] = (Math.random() - 0.5) * 5.5;
      bPos[i + 1] = Math.random() * 16 - 2;
      bPos[i + 2] = (Math.random() - 0.5) * 5.5;
    }
    bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
    const bMat = new THREE.PointsMaterial({
      color: 0xe0f2fe,
      size: 1.5,
      transparent: true,
      opacity: 0.85
    });
    const bubbleParticles = new THREE.Points(bGeo, bMat);
    missileGroup.add(bubbleParticles);
    bubbleParticlesRef.current = bubbleParticles;

    // Bubble Burst Cavitation Ring (at water surface)
    const burstGeo = new THREE.RingGeometry(2.0, 18.0, 32);
    const burstMat = new THREE.MeshBasicMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide
    });
    const bubbleBurstMesh = new THREE.Mesh(burstGeo, burstMat);
    bubbleBurstMesh.rotation.x = -Math.PI / 2;
    bubbleBurstMesh.position.set(-60, 0.2, 2.4);
    scene.add(bubbleBurstMesh);
    bubbleBurstMeshRef.current = bubbleBurstMesh;

    // --- MISSILE BODIES ---
    // Stage 1 (Carbon Epoxy Motor)
    const stage1Geo = new THREE.CylinderGeometry(1.6, 1.6, 6.5, 32);
    const stage1Mat = new THREE.MeshStandardMaterial({ color: 0x22262c, roughness: 0.3, metalness: 0.5 });
    const stage1Mesh = new THREE.Mesh(stage1Geo, stage1Mat);
    stage1Mesh.position.y = 3.25;
    missileGroup.add(stage1Mesh);
    stage1MeshRef.current = stage1Mesh;

    // Stage 2
    const stage2Geo = new THREE.CylinderGeometry(1.6, 1.6, 4.5, 32);
    const stage2Mat = new THREE.MeshStandardMaterial({ color: 0x2b313a, roughness: 0.3, metalness: 0.5 });
    const stage2Mesh = new THREE.Mesh(stage2Geo, stage2Mat);
    stage2Mesh.position.y = 8.75;
    missileGroup.add(stage2Mesh);
    stage2MeshRef.current = stage2Mesh;

    // Stage 3
    const stage3Geo = new THREE.CylinderGeometry(1.5, 1.6, 3.2, 32);
    const stage3Mat = new THREE.MeshStandardMaterial({ color: 0x333b47, roughness: 0.3, metalness: 0.5 });
    const stage3Mesh = new THREE.Mesh(stage3Geo, stage3Mat);
    stage3Mesh.position.y = 12.6;
    missileGroup.add(stage3Mesh);
    stage3MeshRef.current = stage3Mesh;

    // --- POST-BOOST VEHICLE (PBV) / EQUIPMENT SECTION & MIRV PLATFORM ---
    const pbvGroup = new THREE.Group();
    pbvGroup.position.y = 14.2;
    missileGroup.add(pbvGroup);
    pbvGroupRef.current = pbvGroup;

    // PBV Bus Core
    const busCoreGeo = new THREE.CylinderGeometry(1.48, 1.48, 1.2, 32);
    const busCoreMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });
    const busCore = new THREE.Mesh(busCoreGeo, busCoreMat);
    busCore.position.y = 0.6;
    pbvGroup.add(busCore);

    // MIRV Deployment Platform Base
    const platformGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.4, 24);
    const platformMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.2 });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = 1.4;
    pbvGroup.add(platform);

    // 4 Reentry Vehicles (Mk 4 / Mk 5 W76/W88 nuclear cones)
    const warheadMeshes: THREE.Mesh[] = [];
    const warheadAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    warheadAngles.forEach((ang) => {
      const whGeo = new THREE.ConeGeometry(0.35, 1.8, 16);
      const whMat = new THREE.MeshStandardMaterial({
        color: 0xf1f5f9,
        metalness: 0.6,
        roughness: 0.2
      });
      const wh = new THREE.Mesh(whGeo, whMat);
      const rad = 0.75;
      wh.position.set(Math.cos(ang) * rad, 2.3, Math.sin(ang) * rad);
      pbvGroup.add(wh);
      warheadMeshes.push(wh);
    });
    warheadsRef.current = warheadMeshes;

    // Vernier Attitude Control Thruster Plumes
    const thrusterPlumes: THREE.Mesh[] = [];
    [-1.45, 1.45].forEach((xOff) => {
      const tGeo = new THREE.ConeGeometry(0.3, 0.9, 12);
      const tMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.0 });
      const plume = new THREE.Mesh(tGeo, tMat);
      plume.rotation.z = xOff > 0 ? -Math.PI / 2 : Math.PI / 2;
      plume.position.set(xOff, 0.6, 0);
      pbvGroup.add(plume);
      thrusterPlumes.push(plume);
    });
    thrusterPlumesRef.current = thrusterPlumes;

    // Nose Shroud / Fairing Halves (ejected at platform deploy)
    const fairingHalfGeo = new THREE.ConeGeometry(1.5, 3.2, 16, 1, false, 0, Math.PI);
    const fairingMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.4, roughness: 0.2 });

    const fairingLeft = new THREE.Mesh(fairingHalfGeo, fairingMat);
    fairingLeft.position.y = 1.6;
    fairingLeft.rotation.y = 0;
    pbvGroup.add(fairingLeft);
    noseFairingLeftRef.current = fairingLeft;

    const fairingRight = new THREE.Mesh(fairingHalfGeo, fairingMat);
    fairingRight.position.y = 1.6;
    fairingRight.rotation.y = Math.PI;
    pbvGroup.add(fairingRight);
    noseFairingRightRef.current = fairingRight;

    // Telescoping Aerospike
    const spikeGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.5, 16);
    const spikeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const aerospike = new THREE.Mesh(spikeGeo, spikeMat);
    aerospike.position.y = 17.5;
    const discGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.15, 16);
    const discMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9 });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.y = 1.75;
    aerospike.add(disc);
    missileGroup.add(aerospike);
    aerospikeMeshRef.current = aerospike;

    // Detached Bow Shock Cone
    const shockGeo = new THREE.ConeGeometry(3.5, 6.0, 24, 1, true);
    const shockMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      wireframe: true
    });
    const shockCone = new THREE.Mesh(shockGeo, shockMat);
    shockCone.position.y = 14.5;
    shockCone.rotation.x = Math.PI;
    missileGroup.add(shockCone);
    shockConeMeshRef.current = shockCone;

    // Rocket Exhaust Plume
    const flameGeo = new THREE.ConeGeometry(1.8, 8.5, 24);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.85
    });
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.position.y = -4.2;
    flameMesh.rotation.x = Math.PI;
    missileGroup.add(flameMesh);
    flameMeshRef.current = flameMesh;

    scene.add(missileGroup);

    // Reentry Plasma Trails (Line segments behind warheads)
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

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const newW = containerRef.current.clientWidth;
      const newH = containerRef.current.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      renderer.dispose();
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Main Simulation Loop
  useEffect(() => {
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      animFrameId.current = requestAnimationFrame(animate);
      const deltaSec = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (!isPlaying) {
        rendererRef.current?.render(sceneRef.current!, cameraRef.current!);
        return;
      }

      setTelemetry((prev) => {
        const step = deltaSec * simulationSpeed;
        const newTime = prev.missionTime + step;

        let stage = prev.stage;
        let alt = prev.altitude;
        let vel = prev.velocity;
        let downrange = prev.downrange;
        let fuel = prev.fuelPercent;
        let drift = prev.inertialDrift;
        let starStatus = prev.starLockStatus;
        let pitch = prev.pitchAngle;
        let dynPress = prev.dynamicPressure;
        let bubbleInt = prev.bubbleIntegrity;
        let stream = [...prev.telemetryStream];
        const isGss = prev.gssEnabled;

        // Calculate Deflection & Accuracy depending on GSS
        const currentDeflection = isGss ? 0.08 : 24.5;
        const missMeters = isGss ? 38 : 1420;
        const overpressure = isGss ? 2850 : 38;
        const killProb = isGss ? 99.4 : 18.2;

        // 1. PRE-LAUNCH 4-KNOT PATROL (0 to 3s)
        if (newTime < 3) {
          stage = 'PRE_LAUNCH_4KT';
          alt = -0.045; // submerged 45m
          vel = 2.06; // 4 knots forward speed
          downrange = 0;
          fuel = 100;
          pitch = 90;
          dynPress = 0;
          bubbleInt = 100;
          drift = isGss ? 15 : 120;
        }
        // 2. SUBMERGED STEAM BUBBLE EJECTION (3s to 5.8s)
        else if (newTime >= 3 && newTime < 5.8) {
          if (stage !== 'SUB_BUBBLE_EJECT') {
            soundFx.playBubbleEjection();
            stream.unshift(`T+${newTime.toFixed(1)}s: 4.0-KT RUN: STEAM GENERATOR EJECTS MISSILE INTO PROTECTIVE GAS BUBBLE`);
            stream.unshift(`T+${newTime.toFixed(1)}s: SUPERCAVITATING STEAM ENVELOPE SHIELDING TRIDENT SKIN FROM 4-KT HYDRODYNAMIC SHEAR`);
          }
          stage = 'SUB_BUBBLE_EJECT';
          const tRel = newTime - 3;
          alt = -0.045 + tRel * 0.016; // rises through water column
          vel = 24.5; // ~25 m/s upward
          bubbleInt = 100;
        }
        // 3. OCEAN SURFACE BROACH & BUBBLE BURST (5.8s to 6.8s)
        else if (newTime >= 5.8 && newTime < 6.8) {
          if (stage !== 'BUBBLE_BURST') {
            soundFx.playBubbleBurst();
            stream.unshift(`T+${newTime.toFixed(1)}s: SURFACE BROACH! PROTECTIVE GAS BUBBLE BURSTS WITH CAVITATION SHOCK`);
            stream.unshift(`T+${newTime.toFixed(1)}s: WATER CLEARING FROM NOSE CONE - SOLID MOTOR SAFE-AND-ARM UNLOCKED`);
          }
          stage = 'BUBBLE_BURST';
          alt = 0.005 + (newTime - 5.8) * 0.025;
          vel = 22;
          bubbleInt = Math.max(0, 100 - (newTime - 5.8) * 120);
        }
        // 4. MOTOR IGNITION & AEROSPIKE EXTENSION (6.8s to 12s)
        else if (newTime >= 6.8 && newTime < 12) {
          if (stage !== 'MOTOR_IGNITION' && stage !== 'AEROSPIKE') {
            soundFx.startRocketRumble();
            soundFx.playCarrierLock();
            stream.unshift(`T+${newTime.toFixed(1)}s: BUBBLE BURST COMPLETE - STAGE 1 NEPE-75 SOLID MOTOR IGNITION!`);
            stream.unshift(`T+${newTime.toFixed(1)}s: TELESCOPING AEROSPIKE FULLY EXTENDED - 50% DRAG REDUCTION ACTIVE`);
          }
          stage = 'AEROSPIKE';
          const tRel = newTime - 6.8;
          alt = 0.03 + tRel * 0.42;
          vel = 95 + tRel * 140;
          fuel = 98 - tRel * 2.5;
          pitch = 88;
          dynPress = tRel * 9.2;
          bubbleInt = 0;
          drift += step * (isGss ? 4 : 22);
        }
        // 5. STAGE 1 BOOST THROUGH TRANSONIC (12s to 28s)
        else if (newTime >= 12 && newTime < 28) {
          if (stage !== 'STAGE_1') {
            stream.unshift(`T+${newTime.toFixed(1)}s: TRANSONIC PITCH-OVER - GRAVITY TURN INITIATED`);
          }
          stage = 'STAGE_1';
          const tRel = newTime - 12;
          alt = 2.2 + tRel * 1.8;
          vel = 820 + tRel * 95;
          downrange = tRel * 1.4;
          fuel = 85 - tRel * 2.8;
          pitch = 88 - tRel * 1.5;
          dynPress = Math.max(0, 48 - (tRel - 6) ** 2 * 0.4);
          drift += step * (isGss ? 8 : 45);
        }
        // 6. STAGE 2 BOOST (28s to 45s)
        else if (newTime >= 28 && newTime < 45) {
          if (stage !== 'STAGE_2') {
            soundFx.playRadarPing();
            stream.unshift(`T+${newTime.toFixed(1)}s: STAGE 1 BURNOUT - INTERSTAGE SEPARATION - STAGE 2 IGNITION`);
          }
          stage = 'STAGE_2';
          const tRel = newTime - 28;
          alt = 31 + tRel * 3.6;
          vel = 2340 + tRel * 140;
          downrange = 22 + tRel * 9.8;
          fuel = 40 - tRel * 1.5;
          pitch = 64 - tRel * 1.4;
          dynPress = Math.max(0, 3.5 - tRel * 0.2);
          drift += step * (isGss ? 10 : 65);
        }
        // 7. STAGE 3 VACUUM BURN (45s to 60s)
        else if (newTime >= 45 && newTime < 60) {
          if (stage !== 'STAGE_3') {
            stream.unshift(`T+${newTime.toFixed(1)}s: STAGE 2 SEPARATION - STAGE 3 MOTOR VACUUM INSERTION`);
          }
          stage = 'STAGE_3';
          const tRel = newTime - 45;
          alt = 92 + tRel * 4.4;
          vel = 4720 + tRel * 160;
          downrange = 188 + tRel * 22;
          fuel = 14 - tRel * 0.9;
          pitch = 40 - tRel * 0.8;
          dynPress = 0;
          drift += step * (isGss ? 12 : 78);
        }
        // 8. REACH ATTITUDE & VERNIER TRIMMING (60s to 72s)
        else if (newTime >= 60 && newTime < 72) {
          if (stage !== 'REACH_ATTITUDE') {
            soundFx.stopRocketRumble();
            soundFx.playCarrierLock();
            soundFx.playThrusterPuff();
            stream.unshift(`T+${newTime.toFixed(1)}s: STAGE 3 CUTOFF - POST-BOOST VEHICLE (PBV) IN EXOSPHERE`);
            stream.unshift(`T+${newTime.toFixed(1)}s: VERNIER THRUSTERS FIRING - PBV REACHING PRECISE ATTITUDE`);
          }
          stage = 'REACH_ATTITUDE';
          const tRel = newTime - 60;
          alt = 158 + tRel * 2.8;
          vel = 7120 + tRel * 8;
          downrange = 518 + tRel * 40;
          fuel = Math.max(0, 6 - tRel * 0.2);
          pitch = 28;
          if (starStatus === 'CORRECTED') {
            drift = Math.max(38, drift * 0.9);
          }
        }
        // 9. PLATFORM DEPLOY & NOSE SHROUD JETTISON (72s to 82s)
        else if (newTime >= 72 && newTime < 82) {
          if (stage !== 'PLATFORM_DEPLOY') {
            soundFx.playThrusterPuff();
            stream.unshift(`T+${newTime.toFixed(1)}s: NOSE SHROUD JETTISONED - MIRV DEPLOYMENT PLATFORM EXPOSED`);
            stream.unshift(`T+${newTime.toFixed(1)}s: PBV TARGETING COMPUTER COMPUTING INDIVIDUAL RELEASE VECTORS`);
          }
          stage = 'PLATFORM_DEPLOY';
          const tRel = newTime - 72;
          alt = 191 + tRel * 2.4;
          vel = 7200;
          downrange = 998 + tRel * 45;
          fuel = 4;
          pitch = 25;
        }
        // 10. WARHEAD RELEASE ON TARGET VECTORS (82s to 96s)
        else if (newTime >= 82 && newTime < 96) {
          if (stage !== 'WARHEAD_RELEASE') {
            soundFx.playWarheadRelease();
            stream.unshift(`T+${newTime.toFixed(1)}s: PBV RELEASING REENTRY VEHICLES (MK 4/5) ON DIVERGENT SUB-TRAJECTORIES`);
            stream.unshift(`T+${newTime.toFixed(1)}s: GSS CALIBRATION STATUS: ${isGss ? 'ACTIVE (SINS ZERO-BIASED)' : 'BYPASSED (RAW TILT BIAS)'}`);
          }
          stage = 'WARHEAD_RELEASE';
          const tRel = newTime - 82;
          alt = 215 + tRel * 1.8;
          vel = 7250;
          downrange = 1448 + tRel * 52;
          fuel = 2;
          pitch = 15;
        }
        // 11. HYPERSONIC ATMOSPHERIC REENTRY STREAK (96s to 110s)
        else if (newTime >= 96 && newTime < 110) {
          if (stage !== 'REENTRY_STREAK') {
            soundFx.playRadarPing();
            stream.unshift(`T+${newTime.toFixed(1)}s: ENTRY INTERFACE (400,000 FT) - MACH 22 IONIZING PLASMA TRAIL`);
            stream.unshift(`T+${newTime.toFixed(1)}s: DOWNRANGE RADAR (USNS VANGUARD) TRACKING WARHEADS TO TARGET`);
          }
          stage = 'REENTRY_STREAK';
          const tRel = newTime - 96;
          alt = Math.max(0.5, 240 - tRel * 17);
          vel = 7400 - tRel * 90;
          downrange = 2176 + tRel * 68;
          fuel = 0;
          pitch = -45 - tRel * 2.2;
        }
        // 12. TARGET SILO IMPACT & DETONATION (110s+)
        else if (newTime >= 110) {
          if (stage !== 'TARGET_IMPACT') {
            soundFx.playDetonation();
            stream.unshift(`T+${newTime.toFixed(1)}s: *** TERMINAL IMPACT DETONATION ***`);
            stream.unshift(`T+${newTime.toFixed(1)}s: GSS IMPACT REPORT: MISS DISTANCE ${missMeters}M | OVERPRESSURE ${overpressure} PSI`);
            stream.unshift(`T+${newTime.toFixed(1)}s: SILO DAMAGE ASSESSMENT: ${isGss ? 'HARD TARGET CRUSHED (Pk = 99.4%)' : 'TARGET SURVIVED (Pk = 18.2%)'}`);
          }
          stage = 'TARGET_IMPACT';
          alt = 0;
          vel = 0;
          downrange = 3128;
          fuel = 0;
          pitch = -90;
        }

        if (stream.length > 8) stream = stream.slice(0, 8);

        // ==========================================
        // 3D OBJECT VISUAL UPDATES
        // ==========================================
        // 1. Submarine Movement (4 knots = slow forward translation along X)
        if (subGroupRef.current) {
          const subX = -60 + (newTime * 0.4); // 4-knot forward run
          subGroupRef.current.position.x = subX;
        }

        // 2. Missile 3D Position & Attitude
        if (missileGroupRef.current) {
          // Underwater or Atmospheric coordinates
          let visualY = alt * 1.5;
          let visualZ = -(downrange * 0.38);

          if (stage === 'TARGET_IMPACT') {
            visualY = 0.5;
            visualZ = -1200;
          }

          missileGroupRef.current.position.set(-60 + (newTime * 0.1), visualY, visualZ);

          // Attitude Rotation (pitch)
          const rad = (pitch * Math.PI) / 180;
          missileGroupRef.current.rotation.x = -(Math.PI / 2 - rad);

          // Steam Bubble Envelope Visibility & Pulse
          if (steamBubbleMeshRef.current) {
            const isSubmerged = stage === 'PRE_LAUNCH_4KT' || stage === 'SUB_BUBBLE_EJECT' || stage === 'BUBBLE_BURST';
            steamBubbleMeshRef.current.visible = isSubmerged && bubbleInt > 5;
            if (isSubmerged) {
              const pulse = 1.0 + Math.sin(newTime * 14) * 0.06;
              steamBubbleMeshRef.current.scale.set(pulse, 3.2, pulse);
            }
          }

          // Rising Bubble Particles
          if (bubbleParticlesRef.current) {
            bubbleParticlesRef.current.visible = stage === 'SUB_BUBBLE_EJECT';
            if (stage === 'SUB_BUBBLE_EJECT') {
              bubbleParticlesRef.current.rotation.y += 0.08;
            }
          }

          // Bubble Burst Ring at Ocean Surface
          if (bubbleBurstMeshRef.current) {
            if (stage === 'BUBBLE_BURST') {
              const bScale = (newTime - 5.8) * 18;
              bubbleBurstMeshRef.current.scale.set(bScale, bScale, 1);
              (bubbleBurstMeshRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.85 - (newTime - 5.8) * 0.85);
            } else {
              (bubbleBurstMeshRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
            }
          }

          // Motor Flame
          if (flameMeshRef.current) {
            const isMotorFired = stage === 'AEROSPIKE' || stage === 'STAGE_1' || stage === 'STAGE_2' || stage === 'STAGE_3';
            flameMeshRef.current.visible = isMotorFired;
            if (isMotorFired) {
              let pulse = 0.9 + Math.random() * 0.3;
              // Ignition flashes during stage transitions
              if (stage === 'STAGE_2' && newTime < 28.5) pulse *= 1.5;
              if (stage === 'STAGE_3' && newTime < 45.5) pulse *= 1.5;
              flameMeshRef.current.scale.set(pulse, pulse * 1.3, pulse);
              
              // Shift flame position to the active stage base
              if (stage === 'STAGE_3') {
                flameMeshRef.current.position.y = 11.0 - 4.25; // 6.75
              } else if (stage === 'STAGE_2') {
                flameMeshRef.current.position.y = 6.5 - 4.25; // 2.25
              } else {
                flameMeshRef.current.position.y = -4.2;
              }
            }
          }

          // Aerospike extension
          if (aerospikeMeshRef.current) {
            const hasSpike = stage !== 'PRE_LAUNCH_4KT' && stage !== 'SUB_BUBBLE_EJECT' && stage !== 'BUBBLE_BURST';
            aerospikeMeshRef.current.visible = hasSpike && stage !== 'PLATFORM_DEPLOY' && stage !== 'WARHEAD_RELEASE' && stage !== 'REENTRY_STREAK' && stage !== 'TARGET_IMPACT';
          }

          // Shock cone
          if (shockConeMeshRef.current) {
            shockConeMeshRef.current.visible = shockConeVisible && (stage === 'AEROSPIKE' || stage === 'STAGE_1');
          }

          // Staging Separations with visual animation
          if (stage1MeshRef.current) {
            if (newTime >= 28) {
              const tSep1 = newTime - 28;
              stage1MeshRef.current.position.y = 3.25 - Math.pow(tSep1, 1.4) * 3;
              stage1MeshRef.current.visible = tSep1 < 6; // Hide after 6s to avoid clipping
            } else {
              stage1MeshRef.current.position.y = 3.25;
              stage1MeshRef.current.visible = true;
            }
          }
          if (stage2MeshRef.current) {
            if (newTime >= 45) {
              const tSep2 = newTime - 45;
              stage2MeshRef.current.position.y = 8.75 - Math.pow(tSep2, 1.4) * 3;
              stage2MeshRef.current.visible = tSep2 < 6;
            } else {
              stage2MeshRef.current.position.y = 8.75;
              stage2MeshRef.current.visible = true;
            }
          }
          if (stage3MeshRef.current) {
            if (newTime >= 60) {
              const tSep3 = newTime - 60;
              stage3MeshRef.current.position.y = 12.6 - Math.pow(tSep3, 1.4) * 3;
              stage3MeshRef.current.visible = tSep3 < 6;
            } else {
              stage3MeshRef.current.position.y = 12.6;
              stage3MeshRef.current.visible = true;
            }
          }

          // Nose Shroud Fairings (splitting apart at PLATFORM_DEPLOY)
          if (noseFairingLeftRef.current && noseFairingRightRef.current) {
            if (stage === 'PLATFORM_DEPLOY' || stage === 'WARHEAD_RELEASE' || stage === 'REENTRY_STREAK' || stage === 'TARGET_IMPACT') {
              const deployT = Math.min(6, newTime - 72);
              noseFairingLeftRef.current.position.x = -deployT * 1.5;
              noseFairingLeftRef.current.position.z = -deployT * 1.2;
              noseFairingRightRef.current.position.x = deployT * 1.5;
              noseFairingRightRef.current.position.z = deployT * 1.2;
              noseFairingLeftRef.current.rotation.z = deployT * 0.4;
              noseFairingRightRef.current.rotation.z = -deployT * 0.4;
            } else {
              noseFairingLeftRef.current.position.set(0, 1.6, 0);
              noseFairingRightRef.current.position.set(0, 1.6, 0);
              noseFairingLeftRef.current.rotation.set(0, 0, 0);
              noseFairingRightRef.current.rotation.set(0, Math.PI, 0);
            }
          }

          // PBV Vernier Thruster Puffs (firing at REACH_ATTITUDE)
          thrusterPlumesRef.current.forEach((plume) => {
            const isFiring = stage === 'REACH_ATTITUDE' || stage === 'PLATFORM_DEPLOY';
            (plume.material as THREE.MeshBasicMaterial).opacity = isFiring ? (0.4 + Math.random() * 0.5) : 0;
          });

          // 4 Reentry Vehicles Separation & Trajectories
          warheadsRef.current.forEach((wh, idx) => {
            if (stage === 'WARHEAD_RELEASE' || stage === 'REENTRY_STREAK' || stage === 'TARGET_IMPACT') {
              const tSep = Math.min(25, newTime - 82);
              // Target offset: with GSS tightly centered (<40m), without GSS offset by 1400m
              const offsetBias = isGss ? (idx - 1.5) * 1.2 : ((idx - 1.5) * 6.0 + 35.0);
              wh.position.x = Math.cos(idx * Math.PI / 2) * (0.8 + tSep * 0.35) + (offsetBias * 0.02);
              wh.position.z = (idx - 1.5) * (tSep * 0.4);
              wh.position.y = 2.3 - tSep * 0.15;
            } else {
              const ang = idx * Math.PI / 2;
              wh.position.set(Math.cos(ang) * 0.75, 2.3, Math.sin(ang) * 0.75);
            }
          });
        }

        // Reentry Plasma Ionization Trails behind warheads
        plasmaTrailsRef.current.forEach((line, idx) => {
          if (stage === 'REENTRY_STREAK' && missileGroupRef.current) {
            const mPos = missileGroupRef.current.position;
            const wh = warheadsRef.current[idx];
            const pArr = (line.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
            pArr[0] = mPos.x + wh.position.x;
            pArr[1] = mPos.y + wh.position.y;
            pArr[2] = mPos.z + wh.position.z;
            pArr[3] = mPos.x + wh.position.x;
            pArr[4] = mPos.y + wh.position.y + 35; // trailing upwards
            pArr[5] = mPos.z + wh.position.z + 18;
            line.geometry.attributes.position.needsUpdate = true;
            (line.material as THREE.LineBasicMaterial).opacity = 0.85;
          } else {
            (line.material as THREE.LineBasicMaterial).opacity = 0;
          }
        });

        // Detonation Nuclear Flash at Target Silo
        if (detonationFlashRef.current) {
          if (stage === 'TARGET_IMPACT') {
            const tFlash = newTime - 110;
            const flashScale = Math.min(4.5, 1.0 + tFlash * 3.5);
            detonationFlashRef.current.scale.set(flashScale, flashScale, flashScale);
            // Position near silo door: with GSS right on the door (x=0, z=-1200), without GSS far to side (x=55)
            const targetX = isGss ? 0 : 65;
            detonationFlashRef.current.position.set(targetX, 10, -1200);
            (detonationFlashRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.95 - tFlash * 0.2);
          } else {
            (detonationFlashRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
          }
        }

        // Camera Positioning Logic
        if (cameraRef.current && missileGroupRef.current) {
          const mPos = missileGroupRef.current.position;

          if (cameraMode === 'SUB_4KT') {
            // Underwater perspective tracking the Ohio-class sub at 4 knots
            if (subGroupRef.current) {
              const sPos = subGroupRef.current.position;
              cameraRef.current.position.set(sPos.x + 35, sPos.y + 6, sPos.z + 28);
              cameraRef.current.lookAt(sPos.x + 5, sPos.y + 4, sPos.z);
            }
          } else if (cameraMode === 'BUBBLE_CAM') {
            // Close-up camera examining the steam bubble envelope around the Trident
            cameraRef.current.position.set(mPos.x + 12, mPos.y + 4, mPos.z + 14);
            cameraRef.current.lookAt(mPos.x, mPos.y + 6, mPos.z);
          } else if (cameraMode === 'PLATFORM_BUS') {
            // Close-up view of the PBV MIRV deployment platform
            cameraRef.current.position.set(mPos.x + 8, mPos.y + 16, mPos.z + 10);
            cameraRef.current.lookAt(mPos.x, mPos.y + 14, mPos.z);
          } else if (cameraMode === 'TARGET_SILO') {
            // Downrange tactical view looking at the reinforced ICBM silo
            cameraRef.current.position.set(35, 45, -1140);
            cameraRef.current.lookAt(0, 0, -1200);
          } else if (cameraMode === 'SHIP') {
            // USNS Vanguard downrange perspective
            cameraRef.current.position.set(280, 20, -420);
            cameraRef.current.lookAt(mPos.x, mPos.y + 10, mPos.z);
          } else {
            // Default FOLLOW camera
            cameraRef.current.position.set(mPos.x + 28, mPos.y + 12, mPos.z + 45);
            cameraRef.current.lookAt(mPos.x, mPos.y + 6, mPos.z);
          }
        }

        return {
          ...prev,
          missionTime: newTime,
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
          targetKillProb: killProb,
          telemetryStream: stream
        };
      });

      rendererRef.current?.render(sceneRef.current!, cameraRef.current!);
    };

    animFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [isPlaying, simulationSpeed, cameraMode, shockConeVisible, setTelemetry]);

  const handleReset = () => {
    soundFx.playClick();
    soundFx.stopRocketRumble();
    setTelemetry((prev) => ({
      ...prev,
      missionTime: 0,
      altitude: -0.045,
      velocity: 2.06,
      downrange: 0,
      stage: 'PRE_LAUNCH_4KT',
      fuelPercent: 100,
      pitchAngle: 90,
      yawAngle: 0,
      dynamicPressure: 0,
      inertialDrift: prev.gssEnabled ? 15 : 120,
      starLockStatus: 'STANDBY',
      antennaSignalStrength: 88,
      carrierLock: true,
      bubbleIntegrity: 100,
      telemetryStream: [
        'OHIO-CLASS SSBN CRUISING AT 4.0 KNOTS PATROL SPEED - TUBE #4 FLOOD EQUALIZED',
        `BELL GSS REAL-TIME TENSOR UPDATE: ${prev.gssEnabled ? 'ACTIVE (SINS ZERO-BIASED)' : 'BYPASSED (RAW SINS DRIFT)'}`,
        'GAS GENERATOR STEAM EJECTION CHARGE ARMED - SUPERCAVITATING STEAM ENVELOPE READY'
      ]
    }));
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
    if (newGss) {
      soundFx.playStellarLock();
    }
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
  };

  // Jump to specific flight phase for quick inspection
  const handleJumpToPhase = (timeSec: number) => {
    soundFx.playClick();
    setTelemetry((prev) => ({
      ...prev,
      missionTime: timeSec
    }));
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-4 p-4 text-slate-100">
      {/* 3D Viewport Column */}
      <div className="flex-1 flex flex-col rounded-lg border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
        {/* HUD Viewport Header */}
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Crosshair className="w-4 h-4" />
              <span>3D DOWNRANGE VECTOR CAM</span>
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">
              TARGET: <strong className="text-white">UGM-133A TRIDENT II (D5)</strong>
            </span>
          </div>

          {/* Camera View Switcher */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">CAM:</span>
            {[
              { id: 'FOLLOW', label: 'FOLLOW' },
              { id: 'SUB_4KT', label: '4-KT SUB' },
              { id: 'BUBBLE_CAM', label: 'STEAM BUBBLE' },
              { id: 'PLATFORM_BUS', label: 'MIRV BUS' },
              { id: 'TARGET_SILO', label: 'TARGET SILO' },
              { id: 'SHIP', label: 'VANGUARD' }
            ].map((cam) => (
              <button
                key={cam.id}
                onClick={() => {
                  soundFx.playClick();
                  setCameraMode(cam.id as any);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
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

        {/* 3D Canvas Container */}
        <div className="relative w-full h-[470px] md:h-[550px] bg-black">
          <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

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
                  SSBN moving at <strong>4.0 knots</strong>. High-pressure steam bubble encapsulates missile to prevent transverse hydrodynamic shear before surface broach.
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
                <div className="text-[10px] space-y-0.5">
                  <div>MISS DISTANCE: <strong>±{telemetry.targetMissMeters}M</strong></div>
                  <div>BLAST OVERPRESSURE: <strong>{telemetry.siloOverpressurePsi} PSI</strong> (Req: 2,000 psi)</div>
                  <div>KILL PROBABILITY: <strong>{telemetry.targetKillProb}%</strong></div>
                </div>
              </div>
            )}
          </div>

          {/* Shock Cone Drag Callout */}
          {(telemetry.stage === 'AEROSPIKE' || telemetry.stage === 'STAGE_1') && (
            <div className="absolute top-4 right-4 pointer-events-none font-mono text-[11px] bg-slate-900/90 border border-sky-500/50 px-3 py-2 rounded text-sky-200 backdrop-blur max-w-[210px]">
              <div className="font-bold flex items-center gap-1.5 text-sky-400 mb-1">
                <Flame className="w-3.5 h-3.5" />
                <span>AEROSPIKE DETACHED SHOCK</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-tight">
                Forward disc breaks air barrier, reducing frontal aerodynamic drag by <strong className="text-white">~50%</strong>.
              </p>
            </div>
          )}

          {/* Synthetic Vision Artificial Horizon HUD Overlay */}
          <div className="absolute bottom-20 right-4 w-32 h-32 rounded-full border border-slate-500 bg-slate-900/50 overflow-hidden backdrop-blur-md flex items-center justify-center shadow-lg pointer-events-none">
            {/* Pitch Ladder (Moving Background) */}
            <div 
              className="absolute w-64 h-64 flex flex-col transition-transform duration-75"
              style={{ 
                transform: `rotate(${-telemetry.yawAngle}deg) translateY(${(telemetry.pitchAngle - 90) * 1.5}px)`
              }}
            >
              {/* Sky (Upper half, positive pitch > 0 means nose up -> see sky) */}
              <div className="w-full h-1/2 bg-sky-500/30 border-b border-emerald-400 flex flex-col items-center justify-end pb-1 text-[8px] text-emerald-300 gap-4">
                <div className="w-16 border-b border-emerald-400/50 text-center">60</div>
                <div className="w-24 border-b border-emerald-400/50 text-center">30</div>
              </div>
              {/* Ground (Lower half) */}
              <div className="w-full h-1/2 bg-amber-800/30 flex flex-col items-center justify-start pt-1 text-[8px] text-amber-500/80 gap-4">
                <div className="w-24 border-b border-amber-600/50 text-center -mt-2">-30</div>
                <div className="w-16 border-b border-amber-600/50 text-center">-60</div>
              </div>
            </div>
            
            {/* Fixed Reticle / Crosshair */}
            <div className="absolute w-14 h-px bg-emerald-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="absolute w-3 h-3 border-t-2 border-l-2 border-emerald-400 rounded-tl -translate-x-6"></div>
            <div className="absolute w-3 h-3 border-t-2 border-r-2 border-emerald-400 rounded-tr translate-x-6"></div>

            <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[9px] font-mono text-emerald-400 font-bold drop-shadow-md">
              P: {telemetry.pitchAngle.toFixed(1)}°
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-mono text-emerald-400 font-bold drop-shadow-md">
              ADI HUD
            </div>
          </div>

          {/* Quick Trajectory Phase Scrubber at bottom */}
          <div className="absolute top-4 right-4 hidden md:flex flex-col gap-1 items-end font-mono text-[10px]">
            <span className="text-slate-400 font-bold">FLIGHT TIMELINE SCRUB:</span>
            <div className="flex flex-wrap gap-1 max-w-[280px] justify-end">
              {[
                { time: 0, label: '4-KT TUBE' },
                { time: 3.5, label: 'GAS BUBBLE' },
                { time: 6.0, label: 'BROACH' },
                { time: 7.2, label: 'IGNITION' },
                { time: 62, label: 'PBV ATTITUDE' },
                { time: 74, label: 'PLATFORM' },
                { time: 84, label: 'MIRV DROP' },
                { time: 98, label: 'REENTRY' },
                { time: 110, label: 'IMPACT' }
              ].map((ph) => (
                <button
                  key={ph.label}
                  onClick={() => handleJumpToPhase(ph.time)}
                  className="px-1.5 py-0.5 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-750 text-slate-300 cursor-pointer"
                >
                  {ph.label}
                </button>
              ))}
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
                <Compass className="w-3.5 h-3.5" />
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
      <div className="w-full lg:w-96 flex flex-col gap-4">
        {/* GSS Impact on MIRV Target Effectiveness Card */}
        <div className="p-4 rounded-lg border border-slate-800 bg-slate-950 font-mono shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <span className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4" />
              GSS SINS &amp; MIRV TARGET KILL
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              telemetry.gssEnabled ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
            }`}>
              {telemetry.gssEnabled ? 'CALIBRATED' : 'UNCOMPENSATED'}
            </span>
          </div>

          {/* Kill Probability Gauge */}
          <div className="mb-3 p-2.5 rounded bg-slate-900/90 border border-slate-850">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-400">HARD SILO KILL PROBABILITY (Pk):</span>
              <strong className={`text-base ${telemetry.targetKillProb > 90 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {telemetry.targetKillProb}%
              </strong>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  telemetry.targetKillProb > 90 ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                style={{ width: `${telemetry.targetKillProb}%` }}
              />
            </div>
          </div>

          {/* GSS Comparison Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div className="bg-slate-900/80 p-2 rounded border border-slate-850">
              <span className="text-[10px] text-slate-400">VERTICAL DEFLECTION (ξ)</span>
              <div className={`font-bold text-sm ${telemetry.gssEnabled ? 'text-emerald-300' : 'text-rose-400'}`}>
                {telemetry.sinsDeflectionArcsec.toFixed(2)}&quot;
              </div>
              <div className="text-[9px] text-slate-500">
                {telemetry.gssEnabled ? 'Zero-biased' : 'Raw seamount pull'}
              </div>
            </div>

            <div className="bg-slate-900/80 p-2 rounded border border-slate-850">
              <span className="text-[10px] text-slate-400">TERMINAL MISS (CEP)</span>
              <div className={`font-bold text-sm ${telemetry.targetMissMeters < 50 ? 'text-emerald-300' : 'text-rose-400'}`}>
                ±{telemetry.targetMissMeters} M
              </div>
              <div className="text-[9px] text-slate-500">
                {telemetry.targetMissMeters < 50 ? 'Direct crater hit' : 'Misses reinforced door'}
              </div>
            </div>

            <div className="bg-slate-900/80 p-2 rounded border border-slate-850">
              <span className="text-[10px] text-slate-400">SILO OVERPRESSURE</span>
              <div className={`font-bold text-sm ${telemetry.siloOverpressurePsi > 2000 ? 'text-emerald-300' : 'text-rose-400'}`}>
                {telemetry.siloOverpressurePsi} PSI
              </div>
              <div className="text-[9px] text-slate-500">Threshold: 2,000 PSI</div>
            </div>

            <div className="bg-slate-900/80 p-2 rounded border border-slate-850">
              <span className="text-[10px] text-slate-400">TARGET SILO STATUS</span>
              <div className={`font-bold text-[11px] mt-0.5 ${telemetry.gssEnabled ? 'text-emerald-400' : 'text-rose-400'}`}>
                {telemetry.gssEnabled ? 'SILO CRUSHED' : 'OPERATIONAL'}
              </div>
              <div className="text-[9px] text-slate-500">Hardened ICBM Silo</div>
            </div>
          </div>

          <button
            onClick={handleToggleGss}
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-750 rounded text-xs text-slate-200 font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Compass className="w-3.5 h-3.5 text-pink-400" />
            <span>TOGGLE GSS MAP-MATCHING INJECTION</span>
          </button>
        </div>

        {/* Core Flight Metrics */}
        <div className="p-4 rounded-lg border border-slate-800 bg-slate-950 font-mono shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4" />
              FLIGHT DYNAMICS METRICS
            </span>
            <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              MK 6 GUIDANCE
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs mb-3">
            <div className="bg-slate-900/80 p-2 rounded border border-slate-850">
              <div className="text-slate-400 text-[10px]">ALTITUDE</div>
              <div className="text-sm font-bold text-white">
                {telemetry.altitude.toFixed(2)} <span className="text-[10px] text-slate-400">KM</span>
              </div>
            </div>

            <div className="bg-slate-900/80 p-2 rounded border border-slate-850">
              <div className="text-slate-400 text-[10px]">VELOCITY</div>
              <div className="text-sm font-bold text-cyan-400">
                {telemetry.velocity.toFixed(0)} <span className="text-[10px] text-slate-400">M/S</span>
              </div>
              <div className="text-[9px] text-slate-500">
                MACH {(telemetry.velocity / 343).toFixed(1)}
              </div>
            </div>

            <div className="bg-slate-900/80 p-2 rounded border border-slate-850">
              <div className="text-slate-400 text-[10px]">DOWNRANGE</div>
              <div className="text-sm font-bold text-emerald-400">
                {telemetry.downrange.toFixed(0)} <span className="text-[10px] text-slate-400">KM</span>
              </div>
              <div className="text-[9px] text-slate-500">
                {(telemetry.downrange * 0.539957).toFixed(0)} NM
              </div>
            </div>

            <div className="bg-slate-900/80 p-2 rounded border border-slate-850">
              <div className="text-slate-400 text-[10px]">SUB PATROL SPEED</div>
              <div className="text-sm font-bold text-amber-300">
                4.0 <span className="text-[10px] text-slate-400">KNOTS</span>
              </div>
              <div className="text-[9px] text-slate-500">Submerged Cruise</div>
            </div>
          </div>

          {/* Propellant remaining */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
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
    </div>
  );
};
