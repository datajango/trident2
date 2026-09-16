import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { TelemetryData } from '../types';
import { soundFx } from '../audio/soundEngine';
import { LaunchCommandNavPanel, LaunchCommand } from './LaunchCommandNavPanel';
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
  ZoomOut
} from 'lucide-react';

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
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [autoCamSync, setAutoCamSync] = useState<boolean>(true);
  const [zoomDisplay, setZoomDisplay] = useState<number>(100);

  // Time reference driving the animation independent of React state batches
  const simTimeRef = useRef<number>(telemetry.missionTime);
  const lastStateUpdateRef = useRef<number>(0);

  // User interactive camera orbit and zoom state
  const userOrbitRef = useRef({
    rotX: 0,
    rotY: 0,
    distanceFactor: 1.0,
    isDragging: false,
    startX: 0,
    startY: 0
  });

  // Three.js References
  const animFrameId = useRef<number | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // 3D Objects
  const subGroupRef = useRef<THREE.Group | null>(null);
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

    // 1. Submarine Position (Cruising at 4.0 knots patrol speed)
    if (subGroupRef.current) {
      // Submarine stays centered right beneath the launch origin, gliding slowly forward along X
      const subX = (t * 0.4);
      subGroupRef.current.position.set(subX, -22, 0);
    }

    // 2. Trident Missile Position & Gravity-Turn Attitude
    if (missileGroupRef.current) {
      // Direct center trajectory: emerges straight up at x=0, z=0 and arches downrange along -Z
      let visualY: number;
      let visualZ: number;

      if (t < 5.8) {
        // Underwater ejection: from Tube #4 (-14m) to surface (0m)
        const tRel = Math.max(0, t - 3.0);
        visualY = -14 + (tRel / 2.8) * 14;
        visualZ = 0;
      } else if (stage === 'TARGET_IMPACT') {
        visualY = 0.5;
        visualZ = -1200;
      } else {
        // Boost & Exoatmospheric Trajectory
        visualY = Math.max(0, alt * 0.45);
        visualZ = -(downrange * 0.35);
      }

      missileGroupRef.current.position.set(0, visualY, visualZ);

      // Attitude Rotation (pitch angle: 90 = vertical up, 0 = horizontal downrange, -90 = straight down)
      const rad = (pitch * Math.PI) / 180;
      missileGroupRef.current.rotation.x = -(Math.PI / 2 - rad);

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
      const { rotX, rotY } = userOrbitRef.current;

      const targetLookAt = new THREE.Vector3(mPos.x, mPos.y + 10, mPos.z);
      const targetCamPos = new THREE.Vector3();

      if (cameraMode === 'SUB_4KT') {
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
      } else {
        // Default FOLLOW camera: missile is centered, majestic, and prominently fills the frame
        targetLookAt.set(mPos.x, mPos.y + 10, mPos.z);
        targetCamPos.set(
          mPos.x + 20 * distScale,
          mPos.y + 10 * distScale,
          mPos.z + 28 * distScale
        );
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

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 12000);
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

    // --- EARTH ATMOSPHERE CURVED RIM HORIZON ---
    const horizonGeo = new THREE.RingGeometry(800, 1800, 64);
    const horizonMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.28
    });
    const horizonMesh = new THREE.Mesh(horizonGeo, horizonMat);
    horizonMesh.rotation.x = -Math.PI / 2;
    horizonMesh.position.y = -60;
    scene.add(horizonMesh);

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
    subGroupRef.current = subGroup;

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

    // Conning Tower Sail
    const sailGeo = new THREE.BoxGeometry(18, 14, 6.0);
    const sailMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.7, roughness: 0.3 });
    const sail = new THREE.Mesh(sailGeo, sailMat);
    sail.position.set(22, 10, 0);
    subGroup.add(sail);

    // Stern Screw Propulsor
    const screwGeo = new THREE.CylinderGeometry(5.0, 5.0, 4.0, 16);
    const screwMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.9, roughness: 0.2 });
    const screw = new THREE.Mesh(screwGeo, screwMat);
    screw.rotation.z = Math.PI / 2;
    screw.position.set(-72, 0, 0);
    subGroup.add(screw);

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
    // 2. USNS VANGUARD SHIP DOWNRANGE
    // ==========================================
    const shipGroup = new THREE.Group();
    shipGroup.position.set(240, 0, -380);
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
    targetComplexRef.current = targetGroup;

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
    missileGroupRef.current = missileGroup;

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

    // --- DUAL-LAYER ROCKET EXHAUST FLAME ---
    // Outer roaring orange-amber fire plume
    const flameOuterGeo = new THREE.ConeGeometry(3.6, 18.0, 24);
    const flameOuterMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.85 });
    const flameOuterMesh = new THREE.Mesh(flameOuterGeo, flameOuterMat);
    flameOuterMesh.position.y = -6.0;
    flameOuterMesh.rotation.x = Math.PI;
    missileGroup.add(flameOuterMesh);
    flameOuterMeshRef.current = flameOuterMesh;

    // Inner electric blue-white mach diamond core
    const flameInnerGeo = new THREE.ConeGeometry(1.8, 10.0, 20);
    const flameInnerMat = new THREE.MeshBasicMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.95 });
    const flameInnerMesh = new THREE.Mesh(flameInnerGeo, flameInnerMat);
    flameInnerMesh.position.y = -4.0;
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
      }

      // Always update 3D visuals and render (both when playing and when paused!)
      updateSimulationVisuals(simTimeRef.current);
    };

    animFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [isPlaying, simulationSpeed, telemetry.gssEnabled, setTelemetry, updateSimulationVisuals]);

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

  // Mouse orbit & wheel zoom handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    userOrbitRef.current.isDragging = true;
    userOrbitRef.current.startX = e.clientX;
    userOrbitRef.current.startY = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!userOrbitRef.current.isDragging) return;
    const dx = e.clientX - userOrbitRef.current.startX;
    const dy = e.clientY - userOrbitRef.current.startY;
    userOrbitRef.current.startX = e.clientX;
    userOrbitRef.current.startY = e.clientY;

    userOrbitRef.current.rotY -= dx * 0.007;
    userOrbitRef.current.rotX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, userOrbitRef.current.rotX + dy * 0.007));
    updateSimulationVisuals(simTimeRef.current);
  };

  const handleMouseUp = () => {
    userOrbitRef.current.isDragging = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const zoomDelta = e.deltaY * 0.0015;
    const newFactor = Math.max(0.35, Math.min(2.5, userOrbitRef.current.distanceFactor + zoomDelta));
    userOrbitRef.current.distanceFactor = newFactor;
    setZoomDisplay(Math.round(100 / newFactor));
    updateSimulationVisuals(simTimeRef.current);
  };

  const handleZoom = (delta: number) => {
    soundFx.playClick();
    const newFactor = Math.max(0.35, Math.min(2.5, userOrbitRef.current.distanceFactor - delta));
    userOrbitRef.current.distanceFactor = newFactor;
    setZoomDisplay(Math.round(100 / newFactor));
    updateSimulationVisuals(simTimeRef.current);
  };

  const handleResetOrbitZoom = () => {
    soundFx.playClick();
    userOrbitRef.current.rotX = 0;
    userOrbitRef.current.rotY = 0;
    userOrbitRef.current.distanceFactor = 1.0;
    setZoomDisplay(100);
    updateSimulationVisuals(simTimeRef.current);
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-3 md:gap-4 p-2 md:p-4 text-slate-100">
      {/* LEFT NAVIGATION PANEL with 9 launch commands */}
      <LaunchCommandNavPanel
        currentMissionTime={telemetry.missionTime}
        currentStage={telemetry.stage}
        onExecuteCommand={handleExecuteLaunchCommand}
        autoCamEnabled={autoCamSync}
        onToggleAutoCam={() => setAutoCamSync(!autoCamSync)}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onResetSim={handleReset}
      />

      {/* 3D Viewport Column (Enlarged & Centered Trident Animation) */}
      <div className="flex-1 flex flex-col min-w-0 rounded-lg border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
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
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700 text-[10px]">
              <button
                onClick={() => handleZoom(-0.2)}
                className="p-1 hover:text-amber-400 text-slate-300 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetOrbitZoom}
                className="px-1 font-bold text-slate-300 hover:text-white cursor-pointer"
                title="Reset Camera Zoom & Angle"
              >
                {zoomDisplay}%
              </button>
              <button
                onClick={() => handleZoom(0.2)}
                className="p-1 hover:text-amber-400 text-slate-300 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
            </div>

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
                { id: 'SUB_4KT', label: '4-KT SUB' },
                { id: 'BUBBLE_CAM', label: 'BUBBLE' },
                { id: 'PLATFORM_BUS', label: 'MIRV BUS' },
                { id: 'TARGET_SILO', label: 'SILO' },
                { id: 'SHIP', label: 'VANGUARD' }
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

        {/* 3D Canvas Container (Large & Centered) */}
        <div 
          className={`relative w-full ${
            isTheaterMode 
              ? 'h-[680px] lg:h-[780px] xl:h-[840px]' 
              : 'h-[520px] lg:h-[600px] xl:h-[650px]'
          } bg-black select-none cursor-grab active:cursor-grabbing overflow-hidden`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <div ref={containerRef} className="w-full h-full" />

          {/* Interactive Navigation Hint Pill */}
          <div className="absolute top-4 right-4 pointer-events-none hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-400 backdrop-blur shadow">
            <span>DRAG TO ORBIT</span>
            <span className="text-slate-600">•</span>
            <span>WHEEL TO ZOOM</span>
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
        <div className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col gap-4">
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
