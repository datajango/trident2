import * as THREE from 'three';
import { SimulationEntity, ModelTemplate, EntityFaction } from './types';

export const FACTION_COLORS: Record<EntityFaction, number> = {
  'USA': 0x06b6d4, // Cyan
  'RUS': 0xef4444, // Crimson
  'CHN': 0xf97316, // Amber-Orange
  'GBR': 0xa855f7, // Purple
  'CAN': 0x10b981, // Emerald
  'CIVILIAN': 0xe2e8f0, // White / Slate
  'NATO': 0x3b82f6 // Deep Blue
};

export function createTacticalEntityMesh(entity: SimulationEntity): THREE.Group {
  const group = new THREE.Group();
  group.name = `entity-${entity.id}`;
  group.userData = {
    objectId: entity.id,
    entityName: entity.name,
    faction: entity.faction,
    domain: entity.domain,
    securityLevel: entity.securityLevel
  };

  const color = FACTION_COLORS[entity.faction] || 0x06b6d4;
  const lineMat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
  const meshMat = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.85 });

  // 1. Domain/Template Specific Geometry
  switch (entity.modelTemplate) {
    case 'CARRIER': {
      // Aircraft carrier flight deck + island
      const hullGeo = new THREE.BoxGeometry(4.8, 0.6, 1.6);
      const hull = new THREE.Mesh(hullGeo, meshMat);
      const islandGeo = new THREE.BoxGeometry(0.8, 1.2, 0.4);
      const island = new THREE.Mesh(islandGeo, meshMat);
      island.position.set(0.6, 0.8, -0.6);
      group.add(hull, island);

      // Angled flight deck vector lines
      const deckPoints = [
        new THREE.Vector3(-2.4, 0.35, -0.8),
        new THREE.Vector3(2.4, 0.35, -0.8),
        new THREE.Vector3(2.2, 0.35, 0.8),
        new THREE.Vector3(-2.4, 0.35, 0.8),
        new THREE.Vector3(-2.4, 0.35, -0.8)
      ];
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(deckPoints), lineMat));
      break;
    }

    case 'DESTROYER': {
      // Guided missile cruiser/destroyer
      const hullGeo = new THREE.ConeGeometry(0.8, 3.2, 5);
      hullGeo.rotateZ(Math.PI / 2);
      const hull = new THREE.Mesh(hullGeo, meshMat);
      const mastGeo = new THREE.CylinderGeometry(0.1, 0.3, 1.0, 4);
      mastGeo.translate(0, 0.6, 0);
      const mast = new THREE.Mesh(mastGeo, meshMat);
      group.add(hull, mast);
      break;
    }

    case 'SUBMARINE': {
      // Submarine teardrop hull + sail
      const hullGeo = new THREE.CapsuleGeometry(0.4, 2.4, 4, 8);
      hullGeo.rotateZ(Math.PI / 2);
      const hull = new THREE.Mesh(hullGeo, meshMat);
      const sailGeo = new THREE.BoxGeometry(0.4, 0.5, 0.2);
      sailGeo.translate(0.2, 0.4, 0);
      const sail = new THREE.Mesh(sailGeo, meshMat);
      group.add(hull, sail);
      break;
    }

    case 'FIGHTER': {
      // Delta wing fighter silhouette
      const pts = [
        new THREE.Vector3(1.4, 0, 0),      // Nose
        new THREE.Vector3(-0.9, 0, 1.1),   // Right wingtip
        new THREE.Vector3(-0.6, 0, 0.3),   // Inboard
        new THREE.Vector3(-1.1, 0.5, 0),   // Vertical fin top
        new THREE.Vector3(-0.6, 0, -0.3),  // Inboard
        new THREE.Vector3(-0.9, 0, -1.1),  // Left wingtip
        new THREE.Vector3(1.4, 0, 0)       // Return
      ];
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat);
      group.add(line);
      break;
    }

    case 'BOMBER': {
      // Flying wing stealth bomber (B-2/B-21 or Tu-160 style)
      const pts = [
        new THREE.Vector3(1.2, 0, 0),
        new THREE.Vector3(-1.2, 0, 2.8),
        new THREE.Vector3(-1.6, 0, 2.2),
        new THREE.Vector3(-0.8, 0, 0),
        new THREE.Vector3(-1.6, 0, -2.2),
        new THREE.Vector3(-1.2, 0, -2.8),
        new THREE.Vector3(1.2, 0, 0)
      ];
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat);
      group.add(line);
      break;
    }

    case 'AWACS': {
      // Reconnaissance aircraft with radar rotodome
      const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2.6, 6), meshMat);
      fuselage.rotation.z = Math.PI / 2;
      const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.2, 12), meshMat);
      dish.position.set(-0.2, 0.7, 0);
      group.add(fuselage, dish);
      break;
    }

    case 'TANKER_SHIP':
    case 'CONTAINER_SHIP': {
      // Blocky commercial freighter
      const hullGeo = new THREE.BoxGeometry(3.6, 0.7, 1.2);
      const hull = new THREE.Mesh(hullGeo, meshMat);
      const bridgeGeo = new THREE.BoxGeometry(0.7, 1.1, 1.0);
      bridgeGeo.translate(-1.2, 0.7, 0);
      const bridge = new THREE.Mesh(bridgeGeo, meshMat);
      group.add(hull, bridge);
      break;
    }

    case 'SATELLITE_LEO':
    case 'SATELLITE_GEO': {
      // Satellite bus + dual solar panels + dish
      const bus = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), meshMat);
      const solarL = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.6), meshMat);
      solarL.position.set(0, 0, 1.2);
      const solarR = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.6), meshMat);
      solarR.position.set(0, 0, -1.2);
      group.add(bus, solarL, solarR);
      break;
    }

    case 'SPACE_STATION': {
      // Multi-module space station (ISS / Tiangong style)
      const core = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 3.0, 8), meshMat);
      const truss = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 5.0), meshMat);
      group.add(core, truss);
      break;
    }

    case 'RADAR_INSTALLATION': {
      // Ground phased-array radar or BMEWS dome
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 6), meshMat);
      group.add(dome);
      break;
    }

    case 'MISSILE': {
      // Ballistic missile slender cylinder
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 2.2, 6), meshMat);
      cyl.rotation.z = Math.PI / 2;
      group.add(cyl);
      break;
    }

    default: {
      const defaultBox = new THREE.Mesh(new THREE.OctahedronGeometry(0.8), meshMat);
      group.add(defaultBox);
      break;
    }
  }

  // 2. Invisible Raycast Hit Box (enlarged for easy clicking)
  const hitBoxGeo = new THREE.SphereGeometry(2.4, 8, 8);
  const hitBoxMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.001, depthWrite: false });
  const hitMesh = new THREE.Mesh(hitBoxGeo, hitBoxMat);
  hitMesh.userData = { objectId: entity.id };
  group.add(hitMesh);

  // 3. Tactical Reticle / Bearing Marker Ring
  const ringGeo = new THREE.RingGeometry(1.4, 1.6, 16);
  const ringMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  // 4. Sensor Radius Arc (if active emission)
  if (entity.sensors.radarRangeKm > 0 && entity.sensors.activeEmission) {
    const radarRingPts: THREE.Vector3[] = [];
    const radiusVisual = Math.min(10, Math.max(2.5, entity.sensors.radarRangeKm * 0.015));
    for (let i = 0; i <= 32; i++) {
      const angle = (i / 32) * Math.PI * 2;
      radarRingPts.push(new THREE.Vector3(Math.cos(angle) * radiusVisual, 0, Math.sin(angle) * radiusVisual));
    }
    const radarLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(radarRingPts),
      new THREE.LineDashedMaterial({ color, dashSize: 0.5, gapSize: 0.3, transparent: true, opacity: 0.35 })
    );
    radarLine.computeLineDistances();
    group.add(radarLine);
  }

  return group;
}
