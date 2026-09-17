export type SecurityClearance = 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET // NOFORN' | 'TOP SECRET // SI-TK' | 'COSMIC // BICES';

export type EntityFaction = 'USA' | 'RUS' | 'CHN' | 'GBR' | 'CAN' | 'CIVILIAN' | 'NATO';

export type EntityDomain = 
  | 'SURFACE_NAVY' 
  | 'SUBSURFACE' 
  | 'AIR_FORCE' 
  | 'LAND_ARMY' 
  | 'SPACE_SATELLITE' 
  | 'ORBITAL_STATION' 
  | 'BALLISTIC' 
  | 'COMMERCIAL_MARITIME';

export type ModelTemplate = 
  | 'CARRIER' 
  | 'DESTROYER' 
  | 'SUBMARINE' 
  | 'FIGHTER' 
  | 'BOMBER' 
  | 'AWACS' 
  | 'TANKER_SHIP' 
  | 'CONTAINER_SHIP' 
  | 'SATELLITE_LEO' 
  | 'SATELLITE_GEO' 
  | 'SPACE_STATION' 
  | 'RADAR_INSTALLATION'
  | 'MISSILE';

export type TrajectoryType = 'ORBITAL' | 'GREAT_CIRCLE' | 'PATROL_WAYPOINTS' | 'BALLISTIC_ARC' | 'STATIC' | 'MISSION_QUEUED';

export interface LatLonAlt {
  lat: number;      // -90 to +90 degrees
  lon: number;      // -180 to +180 degrees
  altitudeKm: number; // 0 for surface, negative for subsurface, positive for air/space
}

// Subsystem Operational Condition & Capabilities
export type SubsystemState = 'OPERATIONAL' | 'REPAIRING' | 'OFFLINE' | 'DEGRADED';

export interface SubsystemCapability {
  id: string;
  name: string;
  category: 'PROPULSION' | 'RADAR_SENSORS' | 'WEAPONS_VLS' | 'ELECTRONIC_WARFARE' | 'STEALTH_SIGNATURE' | 'COMMUNICATIONS' | 'DAMAGE_CONTROL';
  state: SubsystemState;
  repairProgressPercent: number; // 0-100%
  description: string;
  powerDrawKw: number;
}

export type UnitOperatingCondition = 'COMBAT_READY' | 'UNDER_REPAIR' | 'DEGRADED' | 'CRITICAL_OFFLINE';

export interface UnitVitals {
  healthPercent: number;        // 0-100%
  powerPercent: number;         // 0-100% (Reactor / Generator output)
  fuelPercent: number;          // 0-100% (Aviation Fuel, Bunker Oil, or Core Life)
  ammoCount: number;            // Active munitions count (VLS, Torpedoes, Bombs)
  maxAmmo: number;              // Max magazine capacity
  operationalRangeKm: number;   // Combat radius
  operatingCondition: UnitOperatingCondition;
  isRepairing: boolean;
  repairRatePerSec: number;
  subsystems: SubsystemCapability[];
}

// Decision Points & Situation Rules for Decision Trees
export type DecisionTriggerCondition = 
  | 'HEALTH_BELOW_40'
  | 'AMMO_DEPLETED'
  | 'FUEL_CRITICAL'
  | 'HOSTILE_SUPERIORITY'
  | 'RADAR_SPIKE_DETECTED'
  | 'COMMUNICATION_JAMMED'
  | 'GO_NO_GO_CHECK';

export type DecisionRuleAction =
  | 'RETURN_TO_BASE'
  | 'STAND_AND_HOLD'
  | 'EVADE'
  | 'CONFOUND'
  | 'INFILTRATE'
  | 'ABORT_TO_SECONDARY';

export interface MissionDecisionRule {
  id: string;
  title: string;
  triggerCondition: DecisionTriggerCondition;
  ruleAction: DecisionRuleAction;
  ruleDescription: string;
  targetFallbackCoord?: LatLonAlt;
  isTriggered?: boolean;
}

// Sequential Mission Objectives
export type ObjectiveType =
  | 'WAYPOINT_TRANSIT'
  | 'PATROL_SECTOR'
  | 'SHADOW_TARGET'
  | 'RECON_SWEEP'
  | 'STAND_AND_HOLD'
  | 'INFILTRATE'
  | 'CONFOUND_DECOY'
  | 'EVADE_ESCAPE'
  | 'STRIKE_INTERCEPT'
  | 'RETURN_TO_BASE';

export interface MissionObjective {
  id: string;
  stepNumber: number;
  title: string;
  type: ObjectiveType;
  description: string;
  targetCoord?: LatLonAlt;
  targetEntityId?: string;
  estimatedDurationSec: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'BRANCHED' | 'ABORTED';
  decisionRules: MissionDecisionRule[];
}

export interface MissionPlan {
  id: string;
  title: string;
  doctrineName: string;
  status: 'IDLE' | 'EXECUTING' | 'HOLDING' | 'ABORTED' | 'COMPLETED';
  currentObjectiveIndex: number;
  objectives: MissionObjective[];
  activeBranch?: {
    action: DecisionRuleAction;
    reason: string;
    activatedAtSimSec: number;
  };
  missionLogs: {
    simSec: number;
    text: string;
    type: 'INFO' | 'ACTION' | 'WARNING' | 'DECISION' | 'SUCCESS';
  }[];
}

export interface AiBehaviorConfig {
  mode: 'PATROL' | 'INTERCEPT' | 'TRANSIT' | 'SURVEILLANCE' | 'SHADOW' | 'STATIONARY';
  targetEntityId?: string;
  engagementRadiusKm?: number;
  alertStatus?: 'DEFCON_5' | 'DEFCON_4' | 'DEFCON_3' | 'DEFCON_2' | 'DEFCON_1';
  ruleOfEngagement?: string;
}

export interface SensorSuite {
  radarRangeKm: number;
  sonarRangeKm?: number;
  opticalTracking: boolean;
  sigintActive: boolean;
  activeEmission: boolean;
}

export interface SimulationEntity {
  id: string;
  name: string;
  callsign: string;
  faction: EntityFaction;
  domain: EntityDomain;
  securityLevel: SecurityClearance;
  position: LatLonAlt;
  trajectoryType: TrajectoryType;
  speedKnotsOrKms: number; // Knots for sea/air, km/s for orbital/ballistic
  headingDeg: number;
  modelTemplate: ModelTemplate;
  colorHex: string;
  aiBehavior: AiBehaviorConfig;
  sensors: SensorSuite;
  description: string;
  intelNotes: string;
  waypoints?: LatLonAlt[];
  // Orbital parameters if TrajectoryType === 'ORBITAL'
  orbitParams?: {
    orbitRadiusKm: number;
    inclinationDeg: number;
    periodHours: number;
    phaseDeg: number;
  };
  // Vital condition telemetry & operational abilities
  vitals?: UnitVitals;
  // Active / queued mission objectives & decision trees
  missionPlan?: MissionPlan;
  // Dynamic runtime properties calculated by engine
  currentWorldPos?: { x: number; y: number; z: number };
}

export interface SimulationLayer {
  id: string;
  name: string;
  domain: EntityDomain | 'ALL';
  description: string;
  visible: boolean;
  requiredClearance: SecurityClearance;
  colorHex: string;
}

export interface WorldVisualConfig {
  sphereRadius: number; // 3D units, e.g. 100
  style: 'CYBERPUNK_VECTOR' | 'HOLO_CYAN' | 'RETRO_AMBER_CRT' | 'DARK_STEALTH';
  graticuleSpacingDeg: number;
  rotationSpeedRadsPerSec: number;
  showCoastlines: boolean;
  showTacticalBorders: boolean;
  showAtmosphereGlow: boolean;
  showShippingLanes: boolean;
  showSubmarineChokepoints: boolean;
}

export interface SimulationCassette {
  id: string;
  title: string;
  version: string;
  author: string;
  classification: SecurityClearance;
  description: string;
  theater: string;
  epochTimestamp: string;
  worldConfig: WorldVisualConfig;
  layers: SimulationLayer[];
  entities: SimulationEntity[];
  narrativeEvents?: {
    timeSec: number;
    title: string;
    description: string;
    affectedEntityId?: string;
    alertLevel?: string;
  }[];
}

export type EngineGraduationMode = 'VIEWER' | 'COMMAND_MODE' | 'CONSTRAINED_GAME' | 'AUTHORING_STUDIO';

export interface CameraMemoryParameters {
  isIsoPerspective: boolean;
  savedZoomFactor: number; // Distance in 3D scene units (e.g. 55.0 for tactical inspection)
  zoomMultiplier: number;  // Normalized multiplier relative to 55u baseline
  elevationDeg: number;    // True isometric elevation: 35.264° (atan(1/sqrt(2)))
  azimuthDeg: number;      // Isometric quadrant azimuth: 45°, 135°, 225°, 315°
  lockIsoAngle: boolean;   // Prevent free orbit rotation while preserving isometric pitch/yaw
  lastUpdatedTimestamp: number;
}

