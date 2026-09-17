export type ActiveStation = 
  | 'flight-sim' 
  | 'telemetry-deck' 
  | 'star-tracker' 
  | 'apollo-mission' 
  | 'gradiometer-lab' 
  | 'dossier'
  | 'tracking-network';

export interface TelemetryData {
  missionTime: number; // in seconds
  altitude: number; // in km
  velocity: number; // in m/s (Mach)
  downrange: number; // in km
  stage: 
    | 'PRE_LAUNCH_4KT' 
    | 'SUB_BUBBLE_EJECT' 
    | 'BUBBLE_BURST' 
    | 'MOTOR_IGNITION' 
    | 'STAGE_1' 
    | 'AEROSPIKE' 
    | 'STAGE_2' 
    | 'STAGE_3' 
    | 'REACH_ATTITUDE' 
    | 'PLATFORM_DEPLOY' 
    | 'WARHEAD_RELEASE' 
    | 'REENTRY_STREAK' 
    | 'TARGET_IMPACT';
  fuelPercent: number;
  pitchAngle: number;
  yawAngle: number;
  dynamicPressure: number; // kPa (Max Q)
  inertialDrift: number; // in meters CEP error
  starLockStatus: 'STANDBY' | 'ACQUIRING' | 'LOCKED' | 'CORRECTED';
  antennaSignalStrength: number; // 0 to 100 dB
  carrierLock: boolean;
  telemetryStream: string[];
  
  // GSS & SINS Calibration state
  gssEnabled: boolean;
  subSpeedKnots: number; // 4.0 knots standard launch patrol speed
  subDepthMeters: number; // current depth in meters (0 = surface, 22 = patrol launch, 60+ = deep)
  subSurfaceMode: boolean; // true if surfaced at 0m waterline
  bubbleIntegrity: number; // 100% inside water column -> 0% at broach
  sinsDeflectionArcsec: number; // 0.08 with GSS vs 24.5 without GSS
  targetMissMeters: number; // terminal downrange miss
  siloOverpressurePsi: number; // overpressure at target silo
  targetKillProb: number; // P_k probability of hard target kill

  // Submarine Evasion & Tactical Systems
  noodlingPattern: 'OFF' | 'SERPENTINE' | 'BAFFLE_CLEAR' | 'THERMAL_DIVE';
  superSilentMode: boolean;
  countermeasuresRemaining: number;
  countermeasuresActive: boolean;
  russianSubContact: {
    name: string;
    bearing: number;
    distanceYards: number;
    depthMeters: number;
    trackingStatus: 'LOCKED' | 'SEARCHING' | 'BAFFLED' | 'SPOOFED_BY_DECOY';
    tmaConfidence: number; // 0 to 100%
    activePingCooldown: number;
  };
  subRadiatedNoiseDb: number;
}

export interface SelectableObjectIntel {
  id: string;
  name: string;
  designation: string;
  category: 'MISSILE' | 'SUBMARINE' | 'SATELLITE' | 'PLANET' | 'COUNTERMEASURE' | 'GROUND_TARGET' | 'VESSEL';
  affiliation: string;
  status: string;
  position: { x: number; y: number; z: number };
  telemetrySummary: {
    altitudeOrDepth: string;
    speedOrVelocity: string;
    rangeOrDistance?: string;
    bearingOrAzimuth?: string;
    coordinatesOrOrbit?: string;
  };
  specifications: Array<{ label: string; value: string }>;
  description: string;
}

export interface ShipSensor {
  id: string;
  name: string;
  code: string;
  frequencyBand: string;
  purpose: string;
  status: 'ONLINE' | 'TRACKING' | 'CALIBRATING' | 'STANDBY';
  azimuth: number; // 0 - 360 deg
  elevation: number; // 0 - 90 deg
  signalDb: number;
  xPercent: number; // position on ship schematic (0 - 100%)
  yPercent: number;
  details: string;
}

export interface NavigationalStar {
  name: string;
  designation: string;
  magnitude: number;
  rightAscension: string;
  declination: string;
  x: number; // relative normalized coordinates for minigame
  y: number;
  matched: boolean;
}

export interface ApolloMissionEvent {
  timeSec: number;
  label: string;
  description: string;
  speaker: 'VANGUARD_COMM' | 'HOUSTON_CAPCOM' | 'SPACECRAFT' | 'FLIGHT_DIRECTOR';
}
