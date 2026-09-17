import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  SimulationCassette,
  SimulationEntity,
  EngineGraduationMode,
  SecurityClearance,
  EntityDomain,
  EntityFaction,
  UnitVitals,
  MissionPlan
} from './types';
import { latLonAltToCartesian, computeOrbitCartesian, hasClearance } from './simulationMath';
import { buildCyberpunkVectorEarth } from './cyberpunkVectorWorld';
import { createTacticalEntityMesh } from './entityRenderer';
import { soundFx } from '../audio/soundEngine';
import { SimulationRightPanel } from './SimulationRightPanel';
import { generateDefaultVitals, generateDefaultMissionPlan } from './missionDoctrineTemplates';
import { buildRangeRingGroup, buildMissionPlan3DGroup } from './missionVisualizer3D';
import {
  useCameraMemoryParameters,
  ISOMETRIC_PITCH_RAD,
  ISOMETRIC_YAW_RAD
} from './cameraParametersStore';
import { IsoCameraControlWidget } from './IsoCameraControlWidget';
import {
  Play,
  Pause,
  RotateCcw,
  Shield,
  Eye,
  Crosshair,
  Sliders,
  Radio,
  Download,
  Plus,
  Compass,
  Lock,
  Layers,
  Globe,
  FileCode,
  AlertTriangle,
  CheckSquare,
  Square,
  CircleDot,
  Focus,
  Box,
  ChevronLeft,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
  List,
  GitFork,
  Trash2,
  X,
  Waypoints
} from 'lucide-react';

interface SimulationEngineViewerProps {
  cassette: SimulationCassette;
  onUpdateCassette?: (cassette: SimulationCassette) => void;
  onSelectCassette?: (cassetteId: string) => void;
  availableCassettes?: SimulationCassette[];
}

export const SimulationEngineViewer: React.FC<SimulationEngineViewerProps> = ({
  cassette,
  onUpdateCassette,
  onSelectCassette,
  availableCassettes = []
}) => {
  // Mount reference for the isolated WebGL Canvas (no React children inside)
  const canvasMountRef = useRef<HTMLDivElement>(null);

  // Core Three.js Engine Instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const earthMeshGroupRef = useRef<THREE.Group | null>(null);
  const entityMeshesMapRef = useRef<Map<string, THREE.Group>>(new Map());

  // Simulation Time Engine State
  const [simTimeSec, setSimTimeSec] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [timeMultiplier, setTimeMultiplier] = useState<number>(5);
  const simTimeRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(true);
  const timeMultRef = useRef<number>(5);
  const lastStateTickRef = useRef<number>(0);

  // Engine Graduation Mode: Viewer, Command Mode, Constrained Game, Authoring Studio
  const [graduationMode, setGraduationMode] = useState<EngineGraduationMode>('VIEWER');

  // Security Clearance Filter Level
  const [clearanceLevel, setClearanceLevel] = useState<SecurityClearance>('TOP SECRET // SI-TK');

  // Domain & Faction Filters
  const [activeDomainFilter, setActiveDomainFilter] = useState<EntityDomain | 'ALL'>('ALL');
  const [activeFactionFilter, setActiveFactionFilter] = useState<EntityFaction | 'ALL'>('ALL');

  // Hydrate entities with default vitals and mission plans if not already populated
  const [entitiesState, setEntitiesState] = useState<SimulationEntity[]>(() => {
    return cassette.entities.map((e) => ({
      ...e,
      vitals: e.vitals || generateDefaultVitals(e),
      missionPlan: e.missionPlan || generateDefaultMissionPlan(e)
    }));
  });

  const entitiesStateRef = useRef(entitiesState);
  useEffect(() => {
    entitiesStateRef.current = entitiesState;
  }, [entitiesState]);

  // Keep entities updated if cassette changes
  useEffect(() => {
    setEntitiesState((prev) => {
      return cassette.entities.map((e) => {
        const existing = prev.find((p) => p.id === e.id);
        return {
          ...e,
          vitals: existing?.vitals || e.vitals || generateDefaultVitals(e),
          missionPlan: existing?.missionPlan || e.missionPlan || generateDefaultMissionPlan(e)
        };
      });
    });
  }, [cassette.id, cassette.entities.length]);

  // Selected Entity and Multi-Unit Force Selection
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedEntityIds, setSelectedEntityIds] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false);
  const [showRangeRing, setShowRangeRing] = useState<boolean>(true);
  const [showMissionPlan, setShowMissionPlan] = useState<boolean>(true);

  const [hoveredEntityId, setHoveredEntityId] = useState<string | null>(null);
  const [hovered3DObject, setHovered3DObject] = useState<{
    type: 'ENTITY' | 'WAYPOINT' | 'DECISION_BRANCH';
    id: string;
    title: string;
    subtext?: string;
  } | null>(null);
  const [hoverTooltipPos, setHoverTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [isTrackingEntity, setIsTrackingEntity] = useState<boolean>(false);

  // Selected 3D Mission Objective or Decision Branch (Interactive Inspector)
  const [selectedObjectiveData, setSelectedObjectiveData] = useState<{
    objectiveId: string;
    entityId: string;
    stepNumber: number;
    title: string;
    type: string;
    status: string;
    description: string;
  } | null>(null);

  const [selectedBranchData, setSelectedBranchData] = useState<{
    ruleId: string;
    objectiveId: string;
    entityId: string;
    title: string;
    ruleAction: string;
    ruleDescription: string;
    triggerCondition: string;
  } | null>(null);

  // Auto Iso Zoom and Right Panel Collapse State
  const [isAutoIsoZoom, setIsAutoIsoZoom] = useState<boolean>(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(false);

  // Solo Asset / Isolate Selected Unit State
  const [isSoloSelected, setIsSoloSelected] = useState<boolean>(false);

  // In-Memory Camera Parameters hook & state
  const {
    params: cameraMemoryParams,
    saveZoom: saveCameraZoom,
    toggleIso: toggleIsoPerspectiveState,
    updateParams: updateCameraParams
  } = useCameraMemoryParameters();

  const [currentZoomDistance, setCurrentZoomDistance] = useState<number>(260);

  // Synchronized refs for render animation loop
  const selectedEntityIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedEntityIdRef.current = selectedEntityId;
  }, [selectedEntityId]);

  const isTrackingEntityRef = useRef<boolean>(false);
  useEffect(() => {
    isTrackingEntityRef.current = isTrackingEntity;
  }, [isTrackingEntity]);

  const isAutoIsoZoomRef = useRef<boolean>(false);
  useEffect(() => {
    isAutoIsoZoomRef.current = isAutoIsoZoom;
  }, [isAutoIsoZoom]);

  // 3D Mission Plan & Range Ring Groups in Three.js
  const missionGroupRef = useRef<THREE.Group | null>(null);
  const rangeRingGroupRef = useRef<THREE.Group | null>(null);

  // Camera Orbit & Pan State
  const cameraOrbitRef = useRef({
    distance: 260,
    rotX: 0.35,
    rotY: 0.65,
    panX: 0,
    panY: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    downX: 0,
    downY: 0,
    hasMoved: false,
    targetLookAt: new THREE.Vector3(0, 0, 0)
  });

  // Keep refs synced
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    timeMultRef.current = timeMultiplier;
  }, [timeMultiplier]);

  // Filter entities according to active filters, user clearance, and solo asset mode
  const visibleEntities = useMemo(() => {
    // Solo / Isolated Asset Mode: Only display the selected asset(s)
    if (isSoloSelected) {
      if (selectedEntityIds.size > 0) {
        return entitiesState.filter((e) => selectedEntityIds.has(e.id));
      }
      if (selectedEntityId) {
        return entitiesState.filter((e) => e.id === selectedEntityId);
      }
      return [];
    }

    return entitiesState.filter((entity) => {
      // Clearance check
      if (!hasClearance(clearanceLevel, entity.securityLevel)) {
        return false;
      }
      // Domain filter check
      if (activeDomainFilter !== 'ALL' && entity.domain !== activeDomainFilter) {
        return false;
      }
      // Faction filter check
      if (activeFactionFilter !== 'ALL' && entity.faction !== activeFactionFilter) {
        return false;
      }
      return true;
    });
  }, [entitiesState, isSoloSelected, selectedEntityId, selectedEntityIds, clearanceLevel, activeDomainFilter, activeFactionFilter]);

  const selectedEntity = useMemo(() => {
    return entitiesState.find((e) => e.id === selectedEntityId) || null;
  }, [entitiesState, selectedEntityId]);

  // Initialize Three.js Simulation Viewport
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const width = Math.max(100, canvasMountRef.current.clientWidth || window.innerWidth || 1024);
    const height = Math.max(100, canvasMountRef.current.clientHeight || (window.innerHeight - 120) || 768);

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x020712);

    // Deep vector space fog
    scene.fog = new THREE.FogExp2(0x020712, 0.0004);

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 100000);
    cameraRef.current = camera;
    camera.position.set(0, 80, cameraOrbitRef.current.distance);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Mount canvas into isolated container
    canvasMountRef.current.innerHTML = '';
    canvasMountRef.current.appendChild(renderer.domElement);

    // Strong ambient and tactical directional lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.5);
    dirLight1.position.set(300, 400, 300);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight2.position.set(-300, -200, -300);
    scene.add(dirLight2);

    // 1. Build Cyberpunk 3D Retro Vector Earth
    const earthGroup = buildCyberpunkVectorEarth(cassette.worldConfig);
    scene.add(earthGroup);
    earthMeshGroupRef.current = earthGroup;

    // 2. Build Starfield / Tactical Grid Enclosure
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const r = 2400 + Math.random() * 3200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i + 2] = r * Math.cos(phi);
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 3.5,
      transparent: true,
      opacity: 0.55
    });
    const starPoints = new THREE.Points(starsGeo, starMat);
    scene.add(starPoints);

    // 3. Build initial entity meshes immediately
    entityMeshesMapRef.current.clear();
    visibleEntities.forEach((entity) => {
      const mesh = createTacticalEntityMesh(entity);
      scene.add(mesh);
      entityMeshesMapRef.current.set(entity.id, mesh);
    });

    // Resize observer
    const handleResize = () => {
      if (!canvasMountRef.current || !renderer || !camera) return;
      const w = canvasMountRef.current.clientWidth;
      const h = canvasMountRef.current.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvasMountRef.current);

    // Animation Loop
    let lastTimestamp = performance.now();
    let animId: number;

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const deltaSec = Math.min(0.1, (now - lastTimestamp) / 1000);
      lastTimestamp = now;

      // Update simulation time
      if (isPlayingRef.current) {
        simTimeRef.current += deltaSec * timeMultRef.current;

        // Advance repair progress on active damage control subsystems in real-time
        let anyRepaired = false;
        entitiesStateRef.current.forEach((entity) => {
          if (entity.vitals && entity.vitals.subsystems) {
            entity.vitals.subsystems.forEach((sub) => {
              if (sub.state === 'REPAIRING') {
                sub.repairProgressPercent = Math.min(
                  100,
                  sub.repairProgressPercent + (entity.vitals?.repairRatePerSec || 0.8) * deltaSec * timeMultRef.current
                );
                if (sub.repairProgressPercent >= 100) {
                  sub.state = 'OPERATIONAL';
                  anyRepaired = true;
                }
              }
            });
            if (entity.vitals.subsystems.every((s) => s.state === 'OPERATIONAL') && entity.vitals.operatingCondition === 'UNDER_REPAIR') {
              entity.vitals.operatingCondition = 'COMBAT_READY';
              anyRepaired = true;
            }
          }
        });

        // Throttle React state update to ~4 times per second to prevent React render saturation
        const tickBucket = Math.floor(simTimeRef.current * 4);
        if (tickBucket !== lastStateTickRef.current) {
          lastStateTickRef.current = tickBucket;
          setSimTimeSec(simTimeRef.current);
          if (anyRepaired) {
            setEntitiesState([...entitiesStateRef.current]);
          }
        }
      }

      const curTime = simTimeRef.current;

      // Rotate Earth slowly
      if (earthMeshGroupRef.current) {
        earthMeshGroupRef.current.rotation.y = curTime * cassette.worldConfig.rotationSpeedRadsPerSec;
      }

      // Update entity positions in 3D scene
      entityMeshesMapRef.current.forEach((meshGroup, entityId) => {
        const entity = entitiesStateRef.current.find((e) => e.id === entityId) || cassette.entities.find((e) => e.id === entityId);
        if (!entity) return;

        let cartPos: THREE.Vector3;

        if (entity.trajectoryType === 'ORBITAL' && entity.orbitParams) {
          cartPos = computeOrbitCartesian(
            entity.orbitParams.orbitRadiusKm,
            entity.orbitParams.inclinationDeg,
            entity.orbitParams.periodHours,
            entity.orbitParams.phaseDeg,
            curTime,
            cassette.worldConfig.sphereRadius
          );
        } else if (entity.trajectoryType === 'GREAT_CIRCLE' && entity.waypoints && entity.waypoints.length >= 2) {
          // Progress along great circle waypoints
          const totalLegs = entity.waypoints.length - 1;
          const legDuration = 120; // seconds per leg
          const totalDuration = totalLegs * legDuration;
          const progress = totalDuration > 0 ? (curTime % totalDuration) / totalDuration : 0;
          const curLeg = Math.max(0, Math.min(totalLegs - 1, Math.floor(progress * totalLegs)));
          const legT = (progress * totalLegs) - curLeg;
          const p1 = entity.waypoints[curLeg] || entity.position || { lat: 0, lon: 0, altitudeKm: 0 };
          const p2 = entity.waypoints[curLeg + 1] || p1;
          const lat = (p1.lat ?? 0) + ((p2.lat ?? p1.lat ?? 0) - (p1.lat ?? 0)) * legT;
          const lon = (p1.lon ?? 0) + ((p2.lon ?? p1.lon ?? 0) - (p1.lon ?? 0)) * legT;
          cartPos = latLonAltToCartesian(lat, lon, entity.position?.altitudeKm || 0, cassette.worldConfig.sphereRadius);
        } else {
          // Stationary or slow drift
          const pos = entity.position || { lat: 0, lon: 0, altitudeKm: 0 };
          const headingRad = ((entity.headingDeg || 0) * Math.PI) / 180;
          const driftSpeed = ((entity.speedKnotsOrKms || 0) * 0.000008) * curTime;
          const lat = (pos.lat ?? 0) + Math.cos(headingRad) * driftSpeed;
          const lon = (pos.lon ?? 0) + Math.sin(headingRad) * driftSpeed;
          cartPos = latLonAltToCartesian(lat, lon, pos.altitudeKm || 0, cassette.worldConfig.sphereRadius);
        }

        meshGroup.position.copy(cartPos);

        // Orient mesh tangential to the globe
        const up = cartPos.clone().normalize();
        meshGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);

        // If currently tracked by camera or in auto-iso mode
        if ((isTrackingEntityRef.current || isAutoIsoZoomRef.current) && selectedEntityIdRef.current === entityId) {
          cameraOrbitRef.current.targetLookAt.lerp(cartPos, 0.08);
        }
      });

      // Update Camera Position & Orbit
      const orbit = cameraOrbitRef.current;
      const camX = orbit.targetLookAt.x + orbit.panX + orbit.distance * Math.sin(orbit.rotY) * Math.cos(orbit.rotX);
      const camY = orbit.targetLookAt.y + orbit.panY + orbit.distance * Math.sin(orbit.rotX);
      const camZ = orbit.targetLookAt.z + orbit.distance * Math.cos(orbit.rotY) * Math.cos(orbit.rotX);

      camera.position.set(camX, camY, camZ);
      camera.lookAt(orbit.targetLookAt.x + orbit.panX, orbit.targetLookAt.y + orbit.panY, orbit.targetLookAt.z);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      entityMeshesMapRef.current.forEach((mesh) => scene.remove(mesh));
      entityMeshesMapRef.current.clear();
      renderer.dispose();
      if (canvasMountRef.current) {
        canvasMountRef.current.innerHTML = '';
      }
    };
  }, [cassette]);

  // Sync visible entities with 3D scene meshes when filters or clearance changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Remove obsolete meshes
    const currentMeshIds = new Set(visibleEntities.map((e) => e.id));
    entityMeshesMapRef.current.forEach((mesh, id) => {
      if (!currentMeshIds.has(id)) {
        scene.remove(mesh);
        entityMeshesMapRef.current.delete(id);
      }
    });

    // Add new meshes
    visibleEntities.forEach((entity) => {
      if (!entityMeshesMapRef.current.has(entity.id)) {
        const mesh = createTacticalEntityMesh(entity);
        scene.add(mesh);
        entityMeshesMapRef.current.set(entity.id, mesh);
      }
    });
  }, [visibleEntities]);

  // Render / Update 3D Mission Plan Trajectory & Range Ring on the Globe
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Clean up previous groups
    if (missionGroupRef.current) {
      scene.remove(missionGroupRef.current);
      missionGroupRef.current = null;
    }
    if (rangeRingGroupRef.current) {
      scene.remove(rangeRingGroupRef.current);
      rangeRingGroupRef.current = null;
    }

    if (selectedEntity) {
      // 1. Mission Trajectory & Decision Branches
      if (showMissionPlan && selectedEntity.missionPlan && selectedEntity.missionPlan.objectives.length > 0) {
        const mg = buildMissionPlan3DGroup(selectedEntity, cassette.worldConfig.sphereRadius);
        scene.add(mg);
        missionGroupRef.current = mg;
      }

      // 2. Tactical Range Ring
      if (showRangeRing) {
        const rg = buildRangeRingGroup(selectedEntity, cassette.worldConfig.sphereRadius);
        scene.add(rg);
        rangeRingGroupRef.current = rg;
      }
    }
  }, [selectedEntity, showMissionPlan, showRangeRing, cassette.worldConfig.sphereRadius]);

  // Isometric Perspective Toggle & Camera In-Memory Parameters
  const handleToggleIsoPerspective = (force?: boolean) => {
    soundFx.playTargetLock();
    const next = force !== undefined ? force : !cameraMemoryParams.isIsoPerspective;
    toggleIsoPerspectiveState(next);

    if (next) {
      // Snap camera to true mathematical isometric angles (35.264° x 45°) and load saved zoom factor
      cameraOrbitRef.current.rotX = ISOMETRIC_PITCH_RAD;
      const targetAzimuthRad = (cameraMemoryParams.azimuthDeg * Math.PI) / 180;
      cameraOrbitRef.current.rotY = targetAzimuthRad;
      cameraOrbitRef.current.distance = cameraMemoryParams.savedZoomFactor;
      cameraOrbitRef.current.panX = 0;
      cameraOrbitRef.current.panY = 0;
      setCurrentZoomDistance(cameraMemoryParams.savedZoomFactor);

      if (selectedEntity) {
        let cartPos: THREE.Vector3;
        const meshGroup = entityMeshesMapRef.current.get(selectedEntity.id);
        if (meshGroup) {
          cartPos = meshGroup.position.clone();
        } else {
          const pos = selectedEntity.position || { lat: 0, lon: 0, altitudeKm: 0 };
          cartPos = latLonAltToCartesian(
            pos.lat ?? 0,
            pos.lon ?? 0,
            pos.altitudeKm ?? 0,
            cassette.worldConfig.sphereRadius
          );
        }
        cameraOrbitRef.current.targetLookAt.copy(cartPos);
        setIsTrackingEntity(true);
      }
    }
  };

  const handleSaveCurrentZoom = (distance?: number) => {
    soundFx.playClick();
    const distToSave = distance !== undefined ? distance : cameraOrbitRef.current.distance;
    saveCameraZoom(distToSave);
  };

  const handleApplySavedZoom = () => {
    soundFx.playClick();
    cameraOrbitRef.current.distance = cameraMemoryParams.savedZoomFactor;
    setCurrentZoomDistance(cameraMemoryParams.savedZoomFactor);
  };

  const handleSetZoomDistance = (dist: number) => {
    const clamped = Math.max(20, Math.min(950, dist));
    cameraOrbitRef.current.distance = clamped;
    setCurrentZoomDistance(clamped);
    if (cameraMemoryParams.isIsoPerspective) {
      saveCameraZoom(clamped);
    }
  };

  const handleSetIsoQuadrant = (quadDeg: number) => {
    soundFx.playClick();
    updateCameraParams({ azimuthDeg: quadDeg, isIsoPerspective: true });
    cameraOrbitRef.current.rotX = ISOMETRIC_PITCH_RAD;
    cameraOrbitRef.current.rotY = (quadDeg * Math.PI) / 180;
  };

  const handleToggleLockIsoAngle = () => {
    soundFx.playClick();
    updateCameraParams({ lockIsoAngle: !cameraMemoryParams.lockIsoAngle });
  };

  // Isometric View and Zoom to Unit
  const triggerIsoFocus = (targetEntity?: SimulationEntity | null) => {
    const entityToFocus = targetEntity || selectedEntity;
    if (!entityToFocus) return;

    soundFx.playTargetLock();
    let cartPos: THREE.Vector3;
    const meshGroup = entityMeshesMapRef.current.get(entityToFocus.id);
    if (meshGroup) {
      cartPos = meshGroup.position.clone();
    } else {
      const pos = entityToFocus.position || { lat: 0, lon: 0, altitudeKm: 0 };
      cartPos = latLonAltToCartesian(
        pos.lat ?? 0,
        pos.lon ?? 0,
        pos.altitudeKm ?? 0,
        cassette.worldConfig.sphereRadius
      );
    }

    cameraOrbitRef.current.targetLookAt.copy(cartPos);
    // Use saved in-memory zoom factor if configured, otherwise domain default
    const isoDist = cameraMemoryParams.savedZoomFactor || (entityToFocus.domain === 'SPACE_SATELLITE' ? 85 : 55);
    cameraOrbitRef.current.distance = isoDist;
    cameraOrbitRef.current.rotX = ISOMETRIC_PITCH_RAD; // ~35.264° elevation
    cameraOrbitRef.current.rotY = (cameraMemoryParams.azimuthDeg * Math.PI) / 180; // ~45° azimuth
    cameraOrbitRef.current.panX = 0;
    cameraOrbitRef.current.panY = 0;
    setCurrentZoomDistance(isoDist);
    setIsTrackingEntity(true);
  };

  // Entity selection and mission update handlers
  const handleSelectEntity = (entityId: string | null, isShift: boolean = false) => {
    if (!entityId) {
      if (isSoloSelected) {
        // When in Solo Asset mode, keep current selection to prevent an empty screen
        return;
      }
      if (!isShift && !isMultiSelectMode) {
        setSelectedEntityId(null);
        setSelectedEntityIds(new Set());
        setIsTrackingEntity(false);
      }
      return;
    }

    soundFx.playTargetLock();
    setSelectedEntityId(entityId);

    if (isShift || isMultiSelectMode) {
      setSelectedEntityIds((prev) => {
        const next = new Set(prev);
        if (next.has(entityId)) {
          next.delete(entityId);
          if (selectedEntityId === entityId) {
            const remaining = Array.from(next);
            setSelectedEntityId(remaining.length > 0 ? remaining[0] : null);
          }
        } else {
          next.add(entityId);
        }
        return next;
      });
    } else {
      setSelectedEntityIds(new Set([entityId]));
    }

    // Auto Iso Zoom: When enabled, immediately focus unit in isometric view
    if (isAutoIsoZoomRef.current && !isShift) {
      const ent = entitiesStateRef.current.find((e) => e.id === entityId) || cassette.entities.find((e) => e.id === entityId);
      if (ent) {
        triggerIsoFocus(ent);
      }
    }
  };

  // Toggle Solo / Isolate Selected Asset Mode
  const handleToggleSoloSelected = () => {
    soundFx.playTargetLock();
    const next = !isSoloSelected;
    setIsSoloSelected(next);
    if (next) {
      // Isolate strictly the selected asset - suppress decorative vectors & range ring by default
      setShowMissionPlan(false);
      setShowRangeRing(false);
      setSelectedObjectiveData(null);
      setSelectedBranchData(null);
      if (!selectedEntityId && entitiesState.length > 0) {
        handleSelectEntity(entitiesState[0].id, false);
        if (isAutoIsoZoom) {
          triggerIsoFocus(entitiesState[0]);
        }
      } else if (selectedEntity && isAutoIsoZoom) {
        triggerIsoFocus(selectedEntity);
      }
    } else {
      setShowMissionPlan(true);
      setShowRangeRing(true);
    }
  };

  const handleDeleteObjective = (entityId: string, objectiveId: string) => {
    soundFx.playTargetLock();
    setEntitiesState((prev) =>
      prev.map((e) => {
        if (e.id === entityId && e.missionPlan) {
          return {
            ...e,
            missionPlan: {
              ...e.missionPlan,
              objectives: e.missionPlan.objectives.filter((o) => o.id !== objectiveId)
            }
          };
        }
        return e;
      })
    );
    setSelectedObjectiveData(null);
  };

  const handleDeleteDecisionBranch = (entityId: string, objectiveId: string, ruleId: string) => {
    soundFx.playTargetLock();
    setEntitiesState((prev) =>
      prev.map((e) => {
        if (e.id === entityId && e.missionPlan) {
          return {
            ...e,
            missionPlan: {
              ...e.missionPlan,
              objectives: e.missionPlan.objectives.map((o) => {
                if (o.id === objectiveId && o.decisionRules) {
                  return {
                    ...o,
                    decisionRules: o.decisionRules.filter((r) => r.id !== ruleId)
                  };
                }
                return o;
              })
            }
          };
        }
        return e;
      })
    );
    setSelectedBranchData(null);
  };

  const handleUpdateEntityVitals = (entityId: string, vitals: UnitVitals) => {
    setEntitiesState((prev) =>
      prev.map((e) => (e.id === entityId ? { ...e, vitals } : e))
    );
  };

  const handleUpdateEntityMission = (entityId: string, missionPlan: MissionPlan) => {
    setEntitiesState((prev) =>
      prev.map((e) => (e.id === entityId ? { ...e, missionPlan } : e))
    );
  };

  const handleBroadcastMissionToSelected = (missionPlan: MissionPlan) => {
    setEntitiesState((prev) =>
      prev.map((e) => {
        if (selectedEntityIds.has(e.id)) {
          return {
            ...e,
            missionPlan: {
              ...missionPlan,
              id: `plan-${e.id}-${Date.now()}`,
              title: `TASK FORCE MISSION: ${e.callsign}`
            }
          };
        }
        return e;
      })
    );
  };

  // Raycast Object Selection (Units, Mission Waypoints & Decision Branches)
  const handleRaycast = (clientX: number, clientY: number, isClick: boolean, isShift: boolean = false) => {
    if (!canvasMountRef.current || !cameraRef.current || !sceneRef.current) return;

    const rect = canvasMountRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    // Collect all raycastable meshes
    const hitCandidates: THREE.Object3D[] = [];
    entityMeshesMapRef.current.forEach((meshGroup) => {
      meshGroup.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.objectId) {
          hitCandidates.push(child);
        }
      });
    });

    // Also collect 3D mission plan waypoints and decision branch markers
    if (missionGroupRef.current) {
      missionGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.objectType) {
          hitCandidates.push(child);
        }
      });
    }

    const intersects = raycaster.intersectObjects(hitCandidates, false);

    if (intersects.length > 0) {
      const hitObj = intersects[0].object;
      const uData = hitObj.userData;

      // Check if clicked/hovered on a mission objective waypoint
      if (uData.objectType === 'MISSION_WAYPOINT') {
        if (isClick) {
          soundFx.playTargetLock();
          setSelectedBranchData(null);
          setSelectedObjectiveData({
            objectiveId: uData.objectiveId,
            entityId: uData.entityId,
            stepNumber: uData.stepNumber,
            title: uData.title,
            type: uData.type,
            status: uData.status,
            description: uData.description
          });
        } else {
          setHoveredEntityId(null);
          setHovered3DObject({
            type: 'WAYPOINT',
            id: uData.objectiveId,
            title: `WP ${uData.stepNumber}: ${uData.title}`,
            subtext: `[CLICK TO INSPECT OR HIDE]`
          });
          setHoverTooltipPos({ x: clientX - rect.left, y: clientY - rect.top });
        }
        return;
      }

      // Check if clicked/hovered on a decision branch marker
      if (uData.objectType === 'DECISION_BRANCH') {
        if (isClick) {
          soundFx.playTargetLock();
          setSelectedObjectiveData(null);
          setSelectedBranchData({
            ruleId: uData.ruleId,
            objectiveId: uData.objectiveId,
            entityId: uData.entityId,
            title: uData.title,
            ruleAction: uData.ruleAction,
            ruleDescription: uData.ruleDescription,
            triggerCondition: uData.triggerCondition
          });
        } else {
          setHoveredEntityId(null);
          setHovered3DObject({
            type: 'DECISION_BRANCH',
            id: uData.ruleId,
            title: `BRANCH: ${uData.ruleAction} (${uData.title})`,
            subtext: `[CLICK TO INSPECT OR REMOVE]`
          });
          setHoverTooltipPos({ x: clientX - rect.left, y: clientY - rect.top });
        }
        return;
      }

      // Default entity hit
      const entityId = uData.objectId;
      if (isClick) {
        setSelectedObjectiveData(null);
        setSelectedBranchData(null);
        handleSelectEntity(entityId, isShift);
      } else {
        setHoveredEntityId(entityId);
        const ent = entitiesStateRef.current.find((e) => e.id === entityId) || cassette.entities.find((e) => e.id === entityId);
        setHovered3DObject({
          type: 'ENTITY',
          id: entityId,
          title: ent ? ent.name : entityId,
          subtext: `[CLICK TO INSPECT]`
        });
        setHoverTooltipPos({ x: clientX - rect.left, y: clientY - rect.top });
      }
    } else {
      if (isClick) {
        setSelectedObjectiveData(null);
        setSelectedBranchData(null);
        handleSelectEntity(null, isShift);
      } else {
        setHoveredEntityId(null);
        setHovered3DObject(null);
        setHoverTooltipPos(null);
      }
    }
  };

  // Camera Orbit Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    cameraOrbitRef.current.isDragging = true;
    cameraOrbitRef.current.startX = e.clientX;
    cameraOrbitRef.current.startY = e.clientY;
    cameraOrbitRef.current.downX = e.clientX;
    cameraOrbitRef.current.downY = e.clientY;
    cameraOrbitRef.current.hasMoved = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cameraOrbitRef.current.isDragging) {
      // Hover raycasting
      handleRaycast(e.clientX, e.clientY, false);
      return;
    }

    const dx = e.clientX - cameraOrbitRef.current.startX;
    const dy = e.clientY - cameraOrbitRef.current.startY;

    if (Math.abs(e.clientX - cameraOrbitRef.current.downX) > 4 || Math.abs(e.clientY - cameraOrbitRef.current.downY) > 4) {
      cameraOrbitRef.current.hasMoved = true;
    }

    cameraOrbitRef.current.startX = e.clientX;
    cameraOrbitRef.current.startY = e.clientY;

    if (e.buttons === 2) {
      // Pan
      cameraOrbitRef.current.panX -= dx * 0.3;
      cameraOrbitRef.current.panY += dy * 0.3;
    } else {
      // Orbit
      cameraOrbitRef.current.rotY -= dx * 0.006;
      if (cameraMemoryParams.lockIsoAngle) {
        // Enforce true mathematical isometric elevation angle
        cameraOrbitRef.current.rotX = ISOMETRIC_PITCH_RAD;
      } else {
        cameraOrbitRef.current.rotX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, cameraOrbitRef.current.rotX + dy * 0.006));
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!cameraOrbitRef.current.hasMoved) {
      handleRaycast(e.clientX, e.clientY, true, e.shiftKey);
    }
    cameraOrbitRef.current.isDragging = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const zoomMultiplier = e.deltaY > 0 ? 1.08 : 0.92;
    const newDist = Math.max(20, Math.min(950, cameraOrbitRef.current.distance * zoomMultiplier));
    cameraOrbitRef.current.distance = newDist;
    setCurrentZoomDistance(newDist);
    // If in ISO perspective mode, automatically save user's selected zoom factor in memory parameters
    if (cameraMemoryParams.isIsoPerspective) {
      saveCameraZoom(newDist);
    }
  };

  const handleResetCamera = () => {
    soundFx.playClick();
    if (cameraMemoryParams.isIsoPerspective) {
      cameraOrbitRef.current.distance = cameraMemoryParams.savedZoomFactor;
      cameraOrbitRef.current.rotX = ISOMETRIC_PITCH_RAD;
      cameraOrbitRef.current.rotY = (cameraMemoryParams.azimuthDeg * Math.PI) / 180;
    } else {
      cameraOrbitRef.current.distance = 260;
      cameraOrbitRef.current.rotX = 0.35;
      cameraOrbitRef.current.rotY = 0.65;
    }
    cameraOrbitRef.current.panX = 0;
    cameraOrbitRef.current.panY = 0;
    cameraOrbitRef.current.targetLookAt.set(0, 0, 0);
    setCurrentZoomDistance(cameraOrbitRef.current.distance);
    setIsTrackingEntity(false);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 min-h-0 overflow-hidden select-none">
      {/* Top Engine Mode & Clearance Control Ribbon */}
      <div className="bg-slate-900/95 border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shrink-0 z-30">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-850 border border-slate-700 text-cyan-400 font-bold">
            <Globe className="w-4 h-4" />
            <span className="tracking-wide">{cassette.title}</span>
          </div>
          <span className="text-slate-500">v{cassette.version}</span>

          {/* Cassette Switcher */}
          {availableCassettes.length > 1 && onSelectCassette && (
            <select
              value={cassette.id}
              onChange={(e) => onSelectCassette(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 px-2 py-0.5 rounded text-xs outline-none cursor-pointer hover:border-cyan-500"
            >
              {availableCassettes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Engine Graduation Mode Tabs: Viewer | Command Mode | Constrained Game | Authoring Studio */}
        <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => {
              soundFx.playClick();
              setGraduationMode('VIEWER');
            }}
            className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              graduationMode === 'VIEWER' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            VIEWER
          </button>
          <button
            onClick={() => {
              soundFx.playTargetLock();
              setGraduationMode('COMMAND_MODE');
            }}
            className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              graduationMode === 'COMMAND_MODE'
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400 shadow-md shadow-cyan-950/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            COMMAND MODE
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setGraduationMode('CONSTRAINED_GAME');
            }}
            className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              graduationMode === 'CONSTRAINED_GAME' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            TACTICAL GAME
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setGraduationMode('AUTHORING_STUDIO');
            }}
            className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              graduationMode === 'AUTHORING_STUDIO' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            AUTHORING STUDIO
          </button>
        </div>

        {/* Security Clearance Hierarchy Selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-[11px] font-bold flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            CLEARANCE:
          </span>
          <select
            value={clearanceLevel}
            onChange={(e) => {
              soundFx.playClick();
              setClearanceLevel(e.target.value as SecurityClearance);
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-bold border outline-none cursor-pointer ${
              clearanceLevel.includes('TOP SECRET') || clearanceLevel.includes('COSMIC')
                ? 'bg-red-950/80 border-red-500 text-red-300'
                : clearanceLevel.includes('SECRET')
                ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                : 'bg-slate-950 border-slate-700 text-slate-300'
            }`}
          >
            <option value="UNCLASSIFIED">UNCLASSIFIED</option>
            <option value="CONFIDENTIAL">CONFIDENTIAL</option>
            <option value="SECRET // NOFORN">SECRET // NOFORN</option>
            <option value="TOP SECRET // SI-TK">TOP SECRET // SI-TK</option>
            <option value="COSMIC // BICES">COSMIC // BICES</option>
          </select>

          {/* Right Panel Collapse / Expand Ribbon Button */}
          <button
            onClick={() => {
              soundFx.playClick();
              setIsPanelCollapsed(!isPanelCollapsed);
              setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
            }}
            className={`px-2.5 py-1 rounded text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ml-1 ${
              isPanelCollapsed
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500/80 shadow-md shadow-cyan-950'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isPanelCollapsed ? 'Expand Tactical Asset Panel' : 'Collapse Right Panel (Full Screen 3D)'}
          >
            {isPanelCollapsed ? <PanelRightOpen className="w-3.5 h-3.5 text-cyan-400" /> : <PanelRightClose className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isPanelCollapsed ? 'EXPAND PANEL' : 'COLLAPSE'}</span>
          </button>
        </div>
      </div>

      {/* Main 3D Viewport & Split Inspector Drawer */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative overflow-hidden">
        {/* Interactive 3D Canvas Area */}
        <div className="flex-1 h-full min-h-[360px] relative overflow-hidden bg-slate-950">
          {/* Isolated WebGL canvas mount container (strictly NO React children inside) */}
          <div
            ref={canvasMountRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            onContextMenu={(e) => e.preventDefault()}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
          />

          {/* Hover Tooltip */}
          {(hovered3DObject || hoveredEntityId) && hoverTooltipPos && (
            <div
              className="absolute pointer-events-none z-40 px-2.5 py-1.5 rounded-lg bg-slate-950/95 border border-cyan-400 text-cyan-200 font-mono text-[11px] shadow-2xl backdrop-blur flex items-center gap-1.5 -translate-x-1/2 -translate-y-full -mt-2"
              style={{ left: hoverTooltipPos.x, top: hoverTooltipPos.y }}
            >
              {hovered3DObject?.type === 'DECISION_BRANCH' ? (
                <GitFork className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              ) : hovered3DObject?.type === 'WAYPOINT' ? (
                <Waypoints className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              ) : (
                <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              )}
              <span className="font-bold">
                {hovered3DObject ? hovered3DObject.title : (cassette.entities.find((e) => e.id === hoveredEntityId)?.name || hoveredEntityId)}
              </span>
              <span className="text-[9px] text-slate-400">
                {hovered3DObject?.subtext || '[CLICK TO INSPECT]'}
              </span>
            </div>
          )}

          {/* Quick Filter Bar (Overlays inside 3D canvas) */}
          <div className="absolute top-3 left-3 z-30 flex flex-wrap gap-1 max-w-2xl pointer-events-auto">
            {/* Domain Filter Buttons */}
            {(['ALL', 'SURFACE_NAVY', 'SUBSURFACE', 'AIR_FORCE', 'SPACE_SATELLITE', 'COMMERCIAL_MARITIME'] as const).map((dom) => (
              <button
                key={dom}
                onClick={() => {
                  soundFx.playClick();
                  setActiveDomainFilter(dom);
                }}
                className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition cursor-pointer border backdrop-blur ${
                  activeDomainFilter === dom
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {dom === 'ALL' ? 'ALL DOMAINS' : dom.replace('_', ' ')}
              </button>
            ))}

            {/* Multi-Select Force Mode Toggle */}
            <button
              onClick={() => {
                soundFx.playClick();
                setIsMultiSelectMode(!isMultiSelectMode);
              }}
              className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition cursor-pointer border backdrop-blur flex items-center gap-1 ${
                isMultiSelectMode
                  ? 'bg-purple-600/40 border-purple-400 text-purple-200 ring-1 ring-purple-400 shadow-md shadow-purple-950'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle multi-unit selection mode"
            >
              {isMultiSelectMode ? <CheckSquare className="w-3 h-3 text-purple-300" /> : <Square className="w-3 h-3" />}
              <span>MULTI-SELECT: {isMultiSelectMode ? 'ON' : 'OFF'}</span>
            </button>

            {/* Solo Asset View Toggle Button */}
            <button
              onClick={handleToggleSoloSelected}
              className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition cursor-pointer border backdrop-blur flex items-center gap-1 ${
                isSoloSelected
                  ? 'bg-amber-500/35 border-amber-400 text-amber-200 ring-1 ring-amber-400 shadow-md shadow-amber-950'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Just display the selected asset on the 3D globe (isolate in 3D)"
            >
              <Eye className={`w-3 h-3 ${isSoloSelected ? 'text-amber-300 animate-pulse' : 'text-slate-400'}`} />
              <span>SOLO ASSET: {isSoloSelected ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Faction Filter Bar */}
          <div className="absolute top-12 left-3 z-30 flex flex-wrap gap-1 pointer-events-auto">
            {(['ALL', 'USA', 'RUS', 'CHN', 'GBR', 'CAN', 'CIVILIAN'] as const).map((fac) => (
              <button
                key={fac}
                onClick={() => {
                  soundFx.playClick();
                  setActiveFactionFilter(fac);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer border backdrop-blur ${
                  activeFactionFilter === fac
                    ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {fac}
              </button>
            ))}
          </div>

          {/* Solo / Isolated Asset HUD Overlay Banner */}
          {isSoloSelected && (
            <div className="absolute top-20 left-3 z-30 flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/95 border border-amber-500/80 shadow-2xl backdrop-blur font-mono text-xs text-amber-200 pointer-events-auto max-w-[calc(100%-24px)]">
              <Eye className="w-4 h-4 text-amber-400 animate-pulse" />
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-amber-400">SOLO ASSET DISPLAY:</span>
                <span className="text-white font-black bg-amber-500/25 px-1.5 py-0.5 rounded border border-amber-400/50">
                  {selectedEntity ? selectedEntity.callsign : 'NO ASSET SELECTED'}
                </span>
                {selectedEntity && (
                  <span className="text-[10px] text-amber-300 hidden sm:inline">
                    ({selectedEntity.name} • {selectedEntity.domain.replace('_', ' ')})
                  </span>
                )}
              </div>

              {/* Sub-toggles for Mission Vectors & Range Ring in Solo View */}
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setShowMissionPlan(!showMissionPlan);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                    showMissionPlan
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Toggle 3D mission plan trajectory lines, waypoints, and decision branches"
                >
                  <GitFork className="w-3 h-3" />
                  <span>VECTORS: {showMissionPlan ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  onClick={() => {
                    soundFx.playClick();
                    setShowRangeRing(!showRangeRing);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                    showRangeRing
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Toggle tactical operational range ring"
                >
                  <CircleDot className="w-3 h-3" />
                  <span>RANGE: {showRangeRing ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  onClick={() => {
                    soundFx.playClick();
                    setIsSoloSelected(false);
                    setShowMissionPlan(true);
                    setShowRangeRing(true);
                  }}
                  className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[10px] cursor-pointer transition shadow"
                >
                  RESTORE ALL ASSETS
                </button>
              </div>
            </div>
          )}

          {/* Interactive 3D Mission Objective Waypoint Inspector Popover */}
          {selectedObjectiveData && (
            <div className="absolute bottom-20 right-6 z-40 w-80 p-3 rounded-lg bg-slate-950/95 border border-cyan-400 shadow-2xl backdrop-blur font-mono text-xs animate-in fade-in zoom-in-95 pointer-events-auto">
              <div className="flex items-center justify-between border-b border-cyan-900 pb-1.5 mb-2">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Waypoints className="w-4 h-4 text-cyan-400" />
                  OBJECTIVE {selectedObjectiveData.stepNumber}: {selectedObjectiveData.type}
                </span>
                <button
                  onClick={() => setSelectedObjectiveData(null)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-white font-bold mb-1">{selectedObjectiveData.title}</div>
              <div className="text-[10px] text-cyan-400/90 mb-1">
                STATUS: {selectedObjectiveData.status}
              </div>
              <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                {selectedObjectiveData.description}
              </p>
              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleDeleteObjective(selectedObjectiveData.entityId, selectedObjectiveData.objectiveId)}
                    className="flex-1 py-1 px-2 rounded bg-red-950 hover:bg-red-900 border border-red-500/80 text-red-300 font-bold text-[10px] cursor-pointer flex items-center justify-center gap-1"
                    title="Remove this waypoint from the unit's mission"
                  >
                    <Trash2 className="w-3 h-3" />
                    DELETE OBJECTIVE
                  </button>
                  <button
                    onClick={() => {
                      setShowMissionPlan(false);
                      setSelectedObjectiveData(null);
                    }}
                    className="flex-1 py-1 px-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-[10px] cursor-pointer flex items-center justify-center gap-1"
                    title="Hide 3D mission plan trajectory lines and waypoints"
                  >
                    <Eye className="w-3 h-3 text-slate-400" />
                    HIDE ALL VECTORS
                  </button>
                </div>
                <button
                  onClick={() => {
                    soundFx.playTargetLock();
                    setGraduationMode('COMMAND_MODE');
                    setSelectedObjectiveData(null);
                  }}
                  className="py-1 px-2 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/80 text-cyan-300 font-bold text-[10px] cursor-pointer flex items-center justify-center gap-1"
                >
                  <Radio className="w-3 h-3 text-cyan-400" />
                  EDIT IN COMMAND MODE
                </button>
              </div>
            </div>
          )}

          {/* Interactive 3D Decision Branch Inspector Popover */}
          {selectedBranchData && (
            <div className="absolute bottom-20 right-6 z-40 w-80 p-3 rounded-lg bg-slate-950/95 border border-amber-400 shadow-2xl backdrop-blur font-mono text-xs animate-in fade-in zoom-in-95 pointer-events-auto">
              <div className="flex items-center justify-between border-b border-amber-900 pb-1.5 mb-2">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <GitFork className="w-4 h-4 text-amber-400" />
                  DECISION BRANCH: {selectedBranchData.ruleAction}
                </span>
                <button
                  onClick={() => setSelectedBranchData(null)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-white font-bold mb-1">{selectedBranchData.title}</div>
              <div className="text-[10px] text-amber-400/90 mb-1">
                TRIGGER: {selectedBranchData.triggerCondition.replace(/_/g, ' ')}
              </div>
              <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                {selectedBranchData.ruleDescription}
              </p>
              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleDeleteDecisionBranch(selectedBranchData.entityId, selectedBranchData.objectiveId, selectedBranchData.ruleId)}
                    className="flex-1 py-1 px-2 rounded bg-red-950 hover:bg-red-900 border border-red-500/80 text-red-300 font-bold text-[10px] cursor-pointer flex items-center justify-center gap-1"
                    title="Remove this decision branch and marker"
                  >
                    <Trash2 className="w-3 h-3" />
                    REMOVE BRANCH
                  </button>
                  <button
                    onClick={() => {
                      setShowMissionPlan(false);
                      setSelectedBranchData(null);
                    }}
                    className="flex-1 py-1 px-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-[10px] cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3 h-3 text-slate-400" />
                    HIDE ALL VECTORS
                  </button>
                </div>
                <button
                  onClick={() => {
                    soundFx.playTargetLock();
                    setGraduationMode('COMMAND_MODE');
                    setSelectedBranchData(null);
                  }}
                  className="py-1 px-2 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/80 text-cyan-300 font-bold text-[10px] cursor-pointer flex items-center justify-center gap-1"
                >
                  <Radio className="w-3 h-3 text-cyan-400" />
                  EDIT IN COMMAND MODE
                </button>
              </div>
            </div>
          )}

          {/* Multi-Select Floating Task Force Banner */}
          {selectedEntityIds.size > 1 && (
            <div className="absolute bottom-16 left-3 z-30 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/95 border border-purple-500/60 shadow-2xl backdrop-blur font-mono text-xs">
              <Shield className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="text-purple-200 font-bold">
                {selectedEntityIds.size} UNITS SELECTED IN TASK FORCE
              </span>
              <button
                onClick={() => {
                  soundFx.playTargetLock();
                  setGraduationMode('COMMAND_MODE');
                }}
                className="px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-[10px] cursor-pointer"
              >
                OPEN COMMAND MODE
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setSelectedEntityIds(selectedEntityId ? new Set([selectedEntityId]) : new Set());
                }}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer"
              >
                CLEAR
              </button>
            </div>
          )}

          {/* Bottom Left Simulation Clock & Controls */}
          <div className="absolute bottom-3 left-3 z-30 flex flex-wrap items-center gap-1.5 p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 backdrop-blur font-mono text-xs pointer-events-auto shadow-xl max-w-full">
            <button
              onClick={() => {
                soundFx.playClick();
                setIsPlaying(!isPlaying);
              }}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
              title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                simTimeRef.current = 0;
                setSimTimeSec(0);
              }}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              title="Reset Time"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Time Warp Multiplier Buttons */}
            {[1, 5, 20, 100].map((mult) => (
              <button
                key={mult}
                onClick={() => {
                  soundFx.playClick();
                  setTimeMultiplier(mult);
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                  timeMultiplier === mult ? 'bg-cyan-500 text-black font-extrabold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {mult}x
              </button>
            ))}

            <div className="border-l border-slate-700 pl-2 text-[11px] text-cyan-300 font-mono">
              T+{Math.floor(simTimeSec)}s
            </div>

            <button
              onClick={handleResetCamera}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer"
              title="Reset Camera to Global Theater View"
            >
              RESET CAM
            </button>

            {/* Master ISO PERSPECTIVE Toggle */}
            <button
              onClick={() => handleToggleIsoPerspective()}
              className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer flex items-center gap-1 border transition ${
                cameraMemoryParams.isIsoPerspective
                  ? 'bg-cyan-500/35 text-cyan-200 border-cyan-400 shadow-sm shadow-cyan-950 ring-1 ring-cyan-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Isometric Perspective View (Loads saved in-memory zoom factor & 35.26° elevation angle)"
            >
              <Box className={`w-3.5 h-3.5 ${cameraMemoryParams.isIsoPerspective ? 'text-cyan-300 animate-pulse' : 'text-slate-500'}`} />
              <span>ISO PERSPECTIVE: {cameraMemoryParams.isIsoPerspective ? 'ON' : 'OFF'}</span>
            </button>

            {/* In-Memory Zoom Factor Readout & Instant Save/Recall */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-850 border border-slate-700 text-[10px] font-mono text-slate-300">
              <span className="text-slate-500">ZOOM:</span>
              <span className="text-cyan-400 font-bold">{Math.round(currentZoomDistance)}u</span>
              <button
                onClick={() => handleSaveCurrentZoom()}
                className="px-1.5 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/70 text-cyan-300 text-[9px] font-bold cursor-pointer"
                title="Save current zoom factor into in-memory parameters"
              >
                SAVE
              </button>
              {Math.abs(currentZoomDistance - cameraMemoryParams.savedZoomFactor) > 2 && (
                <button
                  onClick={handleApplySavedZoom}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-300 text-[9px] font-bold cursor-pointer"
                  title={`Recall saved in-memory zoom parameter (${cameraMemoryParams.savedZoomFactor}u)`}
                >
                  RECALL
                </button>
              )}
            </div>

            {/* Auto Iso Toggle */}
            <button
              onClick={() => {
                soundFx.playClick();
                const next = !isAutoIsoZoom;
                setIsAutoIsoZoom(next);
                if (next && selectedEntity) {
                  triggerIsoFocus(selectedEntity);
                }
              }}
              className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer flex items-center gap-1 border transition ${
                isAutoIsoZoom
                  ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400 shadow-sm shadow-cyan-950/50 ring-1 ring-cyan-500/50'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Auto Zoom to Unit and Isometric View on Selection"
            >
              <Focus className={`w-3.5 h-3.5 ${isAutoIsoZoom ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
              <span>AUTO-ISO: {isAutoIsoZoom ? 'ON' : 'OFF'}</span>
            </button>

            {/* Solo / Just Display Selected Asset Toggle Button */}
            <button
              onClick={handleToggleSoloSelected}
              className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer flex items-center gap-1 border transition ${
                isSoloSelected
                  ? 'bg-amber-500/30 text-amber-300 border-amber-400 shadow-sm shadow-amber-950/50 ring-1 ring-amber-500/50'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Just display the selected asset on the 3D globe (isolate in 3D)"
            >
              <Eye className={`w-3.5 h-3.5 ${isSoloSelected ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
              <span>SOLO: {isSoloSelected ? 'ON' : 'OFF'}</span>
            </button>

            {/* Quick 3D Mission Vectors Toggle */}
            <button
              onClick={() => {
                soundFx.playClick();
                setShowMissionPlan(!showMissionPlan);
              }}
              className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer flex items-center gap-1 border transition ${
                showMissionPlan
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/80 shadow-sm shadow-cyan-950/50 ring-1 ring-cyan-500/40'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle 3D mission trajectory lines, waypoints, and decision branches"
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>VECTORS: {showMissionPlan ? 'ON' : 'OFF'}</span>
            </button>

            {/* Quick Tactical Range Ring Toggle */}
            <button
              onClick={() => {
                soundFx.playClick();
                setShowRangeRing(!showRangeRing);
              }}
              className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer flex items-center gap-1 border transition ${
                showRangeRing
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/80 shadow-sm shadow-cyan-950/50 ring-1 ring-cyan-500/40'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle operational radar & weapon engagement range ring"
            >
              <CircleDot className="w-3.5 h-3.5" />
              <span>RANGE: {showRangeRing ? 'ON' : 'OFF'}</span>
            </button>

            {/* Snap ISO View Button (Active when unit selected) */}
            {selectedEntity && (
              <button
                onClick={() => triggerIsoFocus(selectedEntity)}
                className="px-2 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/80 text-cyan-300 text-[10px] font-bold cursor-pointer flex items-center gap-1 transition"
                title={`Zoom and frame ${selectedEntity.callsign} in Isometric perspective`}
              >
                <Box className="w-3.5 h-3.5 text-cyan-400" />
                <span>ISO: {selectedEntity.callsign}</span>
              </button>
            )}

            {/* Collapse / Expand Panel Button */}
            <button
              onClick={() => {
                soundFx.playClick();
                setIsPanelCollapsed(!isPanelCollapsed);
                setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
              }}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-bold cursor-pointer flex items-center gap-1"
              title={isPanelCollapsed ? 'Expand Tactical Asset Panel' : 'Collapse Right Panel (Full Screen 3D)'}
            >
              {isPanelCollapsed ? <ChevronLeft className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span>{isPanelCollapsed ? 'EXPAND' : 'COLLAPSE'}</span>
            </button>
          </div>

          {/* Interactive In-Memory Camera Parameters & ISO Perspective Control Widget */}
          <IsoCameraControlWidget
            cameraParams={cameraMemoryParams}
            currentZoomDistance={currentZoomDistance}
            onToggleIsoPerspective={handleToggleIsoPerspective}
            onSaveCurrentZoom={handleSaveCurrentZoom}
            onApplySavedZoom={handleApplySavedZoom}
            onSetZoomDistance={handleSetZoomDistance}
            onSetIsoQuadrant={handleSetIsoQuadrant}
            onToggleLockIsoAngle={handleToggleLockIsoAngle}
          />

          {/* Top Right Live Telemetry Legend */}
          <div className="absolute top-3 right-3 z-30 bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 backdrop-blur font-mono text-[11px] text-slate-300 flex flex-col gap-1 max-w-[200px] pointer-events-none shadow-xl">
            <div className="flex items-center justify-between font-bold text-cyan-400 border-b border-slate-800 pb-1">
              <span>FORCES IN THEATER</span>
              <span>{visibleEntities.length}</span>
            </div>
            {isSoloSelected && (
              <div className="text-[10px] text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40 font-bold flex items-center justify-between">
                <span>SOLO MODE</span>
                <span className="text-white">{selectedEntity ? selectedEntity.callsign : 'NONE'}</span>
              </div>
            )}
            <div className="text-[10px] text-slate-400 flex flex-col gap-0.5">
              <div className="flex justify-between">
                <span>USA FORCES:</span>
                <span className="text-cyan-400 font-bold">{visibleEntities.filter(e => e.faction === 'USA').length}</span>
              </div>
              <div className="flex justify-between">
                <span>RUSSIAN FORCES:</span>
                <span className="text-red-400 font-bold">{visibleEntities.filter(e => e.faction === 'RUS').length}</span>
              </div>
              <div className="flex justify-between">
                <span>CHINESE FORCES:</span>
                <span className="text-amber-400 font-bold">{visibleEntities.filter(e => e.faction === 'CHN').length}</span>
              </div>
              <div className="flex justify-between">
                <span>ALLIED (GBR/CAN):</span>
                <span className="text-purple-400 font-bold">{visibleEntities.filter(e => e.faction === 'GBR' || e.faction === 'CAN').length}</span>
              </div>
              <div className="flex justify-between">
                <span>COMMERCIAL SHIPPING:</span>
                <span className="text-slate-200 font-bold">{visibleEntities.filter(e => e.faction === 'CIVILIAN').length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reusable Asset Roster and Tactical Inspector Right Panel */}
        <SimulationRightPanel
          graduationMode={graduationMode}
          onChangeGraduationMode={setGraduationMode}
          cassette={cassette}
          entities={entitiesState}
          visibleEntities={visibleEntities}
          selectedEntity={selectedEntity}
          selectedEntityIds={selectedEntityIds}
          isMultiSelectMode={isMultiSelectMode}
          onToggleMultiSelectMode={() => setIsMultiSelectMode(!isMultiSelectMode)}
          onSelectEntity={handleSelectEntity}
          onUpdateEntityVitals={handleUpdateEntityVitals}
          onUpdateEntityMission={handleUpdateEntityMission}
          onBroadcastMissionToSelected={handleBroadcastMissionToSelected}
          onUpdateCassette={onUpdateCassette}
          showRangeRing={showRangeRing}
          onToggleRangeRing={setShowRangeRing}
          showMissionPlan={showMissionPlan}
          onToggleMissionPlan={setShowMissionPlan}
          isTrackingEntity={isTrackingEntity}
          onToggleTracking={() => setIsTrackingEntity(!isTrackingEntity)}
          isAutoIsoZoom={isAutoIsoZoom}
          onToggleAutoIsoZoom={() => {
            const next = !isAutoIsoZoom;
            setIsAutoIsoZoom(next);
            if (next && selectedEntity) {
              triggerIsoFocus(selectedEntity);
            }
          }}
          onTriggerIsoFocus={triggerIsoFocus}
          isCollapsed={isPanelCollapsed}
          onToggleCollapse={() => {
            setIsPanelCollapsed(!isPanelCollapsed);
            setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
          }}
          simTimeSec={simTimeSec}
          isSoloSelected={isSoloSelected}
          onToggleSoloSelected={handleToggleSoloSelected}
          isIsoPerspective={cameraMemoryParams.isIsoPerspective}
          onToggleIsoPerspective={() => handleToggleIsoPerspective()}
          savedZoomFactor={cameraMemoryParams.savedZoomFactor}
          onSaveCurrentZoom={handleSaveCurrentZoom}
          onApplySavedZoom={handleApplySavedZoom}
        />
      </div>
    </div>
  );
};
