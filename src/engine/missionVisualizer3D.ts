import * as THREE from 'three';
import { SimulationEntity, LatLonAlt } from './types';
import { latLonAltToCartesian } from './simulationMath';

/**
 * Computes a circle of coordinates on the sphere given center (lat, lon) and ground radius (km).
 */
export function computeGreatCirclePoints(
  centerLat: number,
  centerLon: number,
  radiusKm: number,
  segments: number = 48
): LatLonAlt[] {
  const earthRadiusKm = 6371;
  const angularRadiusRad = radiusKm / earthRadiusKm;
  const centerLatRad = (centerLat * Math.PI) / 180;
  const centerLonRad = (centerLon * Math.PI) / 180;

  const points: LatLonAlt[] = [];

  for (let i = 0; i <= segments; i++) {
    const bearing = (i / segments) * 2 * Math.PI;

    const latRad = Math.asin(
      Math.sin(centerLatRad) * Math.cos(angularRadiusRad) +
      Math.cos(centerLatRad) * Math.sin(angularRadiusRad) * Math.cos(bearing)
    );

    const lonRad = centerLonRad + Math.atan2(
      Math.sin(bearing) * Math.sin(angularRadiusRad) * Math.cos(centerLatRad),
      Math.cos(angularRadiusRad) - Math.sin(centerLatRad) * Math.sin(latRad)
    );

    points.push({
      lat: (latRad * 180) / Math.PI,
      lon: (lonRad * 180) / Math.PI,
      altitudeKm: 0.5
    });
  }

  return points;
}

/**
 * Builds a 3D tactical range ring for an entity on the globe.
 */
export function buildRangeRingGroup(
  entity: SimulationEntity,
  worldRadius: number
): THREE.Group {
  const group = new THREE.Group();
  group.name = `range-ring-${entity.id}`;

  const pos = entity.position || { lat: 0, lon: 0, altitudeKm: 0 };
  const rangeKm = entity.vitals?.operationalRangeKm || 2500;
  const circleCoords = computeGreatCirclePoints(pos.lat ?? 0, pos.lon ?? 0, rangeKm, 64);

  const pts: THREE.Vector3[] = circleCoords.map((c) =>
    latLonAltToCartesian(c.lat ?? 0, c.lon ?? 0, 0.6, worldRadius * 1.002)
  );

  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineDashedMaterial({
    color: entity.faction === 'USA' ? 0x06b6d4 : 0xf59e0b,
    dashSize: 2.5,
    gapSize: 1.5,
    transparent: true,
    opacity: 0.75
  });

  const line = new THREE.Line(geo, mat);
  line.computeLineDistances();
  group.add(line);

  return group;
}

/**
 * Builds the 3D visualization of an entity's queued mission objectives and decision branches.
 */
export function buildMissionPlan3DGroup(
  entity: SimulationEntity,
  worldRadius: number
): THREE.Group {
  const group = new THREE.Group();
  group.name = `mission-path-${entity.id}`;

  if (!entity.missionPlan || !entity.missionPlan.objectives.length) {
    return group;
  }

  const { objectives } = entity.missionPlan;

  // 1. Collect sequential waypoints starting from current position
  const startPos = entity.position || { lat: 0, lon: 0, altitudeKm: 0 };
  const pathCoords: LatLonAlt[] = [startPos];

  objectives.forEach((obj) => {
    if (obj.targetCoord && typeof obj.targetCoord.lat === 'number') {
      pathCoords.push(obj.targetCoord);
    }
  });

  if (pathCoords.length >= 2) {
    const interpolatedPts: THREE.Vector3[] = [];

    for (let i = 0; i < pathCoords.length - 1; i++) {
      const p1 = pathCoords[i];
      const p2 = pathCoords[i + 1];
      if (!p1 || !p2) continue;

      // Interpolate 10 points per segment for globe curvature
      for (let s = 0; s <= 10; s++) {
        const t = s / 10;
        const lat = (p1.lat ?? 0) + ((p2.lat ?? 0) - (p1.lat ?? 0)) * t;
        const lon = (p1.lon ?? 0) + ((p2.lon ?? 0) - (p1.lon ?? 0)) * t;
        const alt = (p1.altitudeKm || 0) + ((p2.altitudeKm || 0) - (p1.altitudeKm || 0)) * t + 0.8;
        interpolatedPts.push(latLonAltToCartesian(lat, lon, alt, worldRadius * 1.003));
      }
    }

    const pathGeo = new THREE.BufferGeometry().setFromPoints(interpolatedPts);
    const pathMat = new THREE.LineDashedMaterial({
      color: 0x00ffcc,
      dashSize: 3,
      gapSize: 2,
      transparent: true,
      opacity: 0.9
    });
    const mainPathLine = new THREE.Line(pathGeo, pathMat);
    mainPathLine.computeLineDistances();
    group.add(mainPathLine);
  }

  // 2. Waypoint markers and Decision Branch markers
  objectives.forEach((obj) => {
    if (!obj.targetCoord || typeof obj.targetCoord.lat !== 'number') return;

    const wpPos = latLonAltToCartesian(
      obj.targetCoord.lat,
      obj.targetCoord.lon ?? 0,
      (obj.targetCoord.altitudeKm || 0) + 1.2,
      worldRadius * 1.003
    );

    // Waypoint Sphere / Diamond
    const hasDecision = obj.decisionRules && obj.decisionRules.length > 0;
    const isStepActive = obj.status === 'ACTIVE';

    const wpGeo = hasDecision
      ? new THREE.OctahedronGeometry(1.2, 0)
      : new THREE.SphereGeometry(0.8, 8, 8);

    const wpColor = isStepActive
      ? 0x00ffcc
      : hasDecision
      ? 0xf59e0b
      : 0x38bdf8;

    const wpMat = new THREE.MeshBasicMaterial({
      color: wpColor,
      wireframe: true
    });

    const wpMesh = new THREE.Mesh(wpGeo, wpMat);
    wpMesh.position.copy(wpPos);
    wpMesh.userData = {
      objectType: 'MISSION_WAYPOINT',
      objectId: obj.id,
      objectiveId: obj.id,
      entityId: entity.id,
      stepNumber: obj.stepNumber,
      title: obj.title,
      type: obj.type,
      status: obj.status,
      description: obj.description,
      targetCoord: obj.targetCoord
    };
    group.add(wpMesh);

    // Hit-sphere for easy raycasting in 3D scene
    const hitGeo = new THREE.SphereGeometry(2.4, 8, 8);
    const hitMat = new THREE.MeshBasicMaterial({
      visible: false
    });
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    hitMesh.position.copy(wpPos);
    hitMesh.userData = wpMesh.userData;
    group.add(hitMesh);

    // 3. Render Decision Branch Vectors (e.g. EVADE vector in red, RTB vector in green)
    if (obj.decisionRules) {
      obj.decisionRules.forEach((rule) => {
        let branchColor = 0xf59e0b; // Amber default
        let branchLatOffset = 2.0;
        let branchLonOffset = -2.5;

        if (rule.ruleAction === 'EVADE') {
          branchColor = 0xef4444; // Red
          branchLatOffset = -2.5;
          branchLonOffset = 3.5;
        } else if (rule.ruleAction === 'RETURN_TO_BASE') {
          branchColor = 0x10b981; // Green
          branchLatOffset = -3.5;
          branchLonOffset = -4.0;
        } else if (rule.ruleAction === 'CONFOUND') {
          branchColor = 0xd946ef; // Fuchsia / Purple
          branchLatOffset = 3.0;
          branchLonOffset = -1.5;
        } else if (rule.ruleAction === 'STAND_AND_HOLD') {
          branchColor = 0x3b82f6; // Blue
          branchLatOffset = 0.5;
          branchLonOffset = 0.5;
        }

        const targetCoordLat = obj.targetCoord?.lat ?? 0;
        const targetCoordLon = obj.targetCoord?.lon ?? 0;
        const fallbackLat = rule.targetFallbackCoord?.lat ?? (targetCoordLat + branchLatOffset);
        const fallbackLon = rule.targetFallbackCoord?.lon ?? (targetCoordLon + branchLonOffset);

        const branchPts: THREE.Vector3[] = [];
        for (let s = 0; s <= 6; s++) {
          const t = s / 6;
          const bLat = targetCoordLat + (fallbackLat - targetCoordLat) * t;
          const bLon = targetCoordLon + (fallbackLon - targetCoordLon) * t;
          branchPts.push(latLonAltToCartesian(bLat, bLon, 1.0, worldRadius * 1.003));
        }

        const branchGeo = new THREE.BufferGeometry().setFromPoints(branchPts);
        const branchMat = new THREE.LineDashedMaterial({
          color: branchColor,
          dashSize: 2,
          gapSize: 1.5,
          transparent: true,
          opacity: 0.8
        });
        const branchLine = new THREE.Line(branchGeo, branchMat);
        branchLine.computeLineDistances();
        group.add(branchLine);

        // Branch terminal marker
        const endPos = branchPts[branchPts.length - 1];
        const endGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const endMat = new THREE.MeshBasicMaterial({ color: branchColor, wireframe: true });
        const endMesh = new THREE.Mesh(endGeo, endMat);
        endMesh.position.copy(endPos);
        endMesh.userData = {
          objectType: 'DECISION_BRANCH',
          objectId: rule.id,
          ruleId: rule.id,
          objectiveId: obj.id,
          entityId: entity.id,
          title: rule.title,
          ruleAction: rule.ruleAction,
          ruleDescription: rule.ruleDescription,
          triggerCondition: rule.triggerCondition,
          targetFallbackCoord: { lat: fallbackLat, lon: fallbackLon }
        };
        group.add(endMesh);

        // Hit-sphere for branch marker
        const branchHitGeo = new THREE.SphereGeometry(2.0, 8, 8);
        const branchHitMat = new THREE.MeshBasicMaterial({ visible: false });
        const branchHitMesh = new THREE.Mesh(branchHitGeo, branchHitMat);
        branchHitMesh.position.copy(endPos);
        branchHitMesh.userData = endMesh.userData;
        group.add(branchHitMesh);
      });
    }
  });

  return group;
}
