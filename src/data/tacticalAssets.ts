import { SelectableObjectIntel, TelemetryData } from '../types';

export interface SatelliteDefinition {
  id: string;
  name: string;
  designation: string;
  category: 'SATELLITE';
  affiliation: string;
  orbitType: 'LEO' | 'MEO' | 'GEO' | 'POLAR_LEO';
  orbitRadius: number; // in sim units
  orbitSpeed: number; // radians/sec in sim
  orbitInclination: number; // radians
  orbitPhaseOffset: number; // initial phase
  modelType: 'SBIRS' | 'DSP' | 'GPS' | 'KH11' | 'MILSTAR';
  altitudeKm: number;
  speedKmS: number;
  periodMin: number;
  sensorType: string;
  colorHex: number;
  specifications: Array<{ label: string; value: string }>;
  description: string;
}

export const SATELLITE_DEFINITIONS: SatelliteDefinition[] = [
  {
    id: 'sbirs-geo-5',
    name: 'SBIRS GEO-5',
    designation: 'USA-315 (Space-Based Infrared System)',
    category: 'SATELLITE',
    affiliation: 'US Space Force / Space Delta 4 (Buckley SFB)',
    orbitType: 'GEO',
    orbitRadius: 2800,
    orbitSpeed: 0.012,
    orbitInclination: 0.12,
    orbitPhaseOffset: 0.45,
    modelType: 'SBIRS',
    altitudeKm: 35786,
    speedKmS: 3.07,
    periodMin: 1436,
    sensorType: 'Dual-Band Staring & Scanning Infrared Focal Plane',
    colorHex: 0x38bdf8,
    specifications: [
      { label: 'NORAD Catalog ID', value: '48618 / 2021-042A' },
      { label: 'Orbit Shell', value: 'Geosynchronous Equatorial (GEO)' },
      { label: 'Altitude', value: '35,786 km (22,236 mi)' },
      { label: 'Orbital Speed', value: '3.07 km/s (11,050 km/h)' },
      { label: 'Sensors', value: 'Schmidt Infrared Telescope + High-Speed Scanning Sensor' },
      { label: 'Primary Mission', value: 'Worldwide ICBM/SLBM Boost Phase Flash Detection' },
      { label: 'Spacecraft Bus', value: 'Lockheed Martin LM2100 Modernized Combat Bus' },
      { label: 'Power Supply', value: 'Gallium Arsenide Multi-Junction Solar Wings (4.5 kW)' },
      { label: 'Data Relay', value: 'Real-time anti-jam down-link to Cheyenne Mountain & NORAD' }
    ],
    description: 'Premier geosynchronous early-warning satellite providing instantaneous detection and trajectory tracking of ballistic missile rocket exhaust flares with high-precision staring sensor arrays.'
  },
  {
    id: 'dsp-flight-23',
    name: 'DSP Flight-23',
    designation: 'USA-197 (Defense Support Program)',
    category: 'SATELLITE',
    affiliation: 'US Space Force / 2nd Space Warning Squadron',
    orbitType: 'GEO',
    orbitRadius: 3100,
    orbitSpeed: 0.009,
    orbitInclination: 0.18,
    orbitPhaseOffset: 2.1,
    modelType: 'DSP',
    altitudeKm: 35900,
    speedKmS: 3.06,
    periodMin: 1440,
    sensorType: 'Lead Sulfide (PbS) / Mercury Cadmium Telluride 30 RPM Sensor',
    colorHex: 0xf59e0b,
    specifications: [
      { label: 'NORAD Catalog ID', value: '32288 / 2007-054A' },
      { label: 'Orbit Shell', value: 'Geosynchronous Orbit (GEO)' },
      { label: 'Stabilization', value: 'Spin-Stabilized at 6.0 RPM with Sunshade Baffle' },
      { label: 'IR Detector Array', value: '6,000-element passive infrared optical focal plane' },
      { label: 'Primary Mission', value: 'Global Nuclear Detonation & Heavy Rocket Plume Alert' },
      { label: 'Mass in Orbit', value: '2,380 kg (5,250 lbs)' },
      { label: 'Telemetry Link', value: 'Nuclear hardened Air Force Satellite Control Network' }
    ],
    description: 'Proven defense early-warning sentinel utilizing a spin-stabilized infrared telescope to scan the Earth every 10 seconds for ballistic launches and high-energy thermal events.'
  },
  {
    id: 'gps-iii-sv06',
    name: 'GPS III-SV06',
    designation: 'Navstar SVN-77 / PRN-11 (Amelia Earhart)',
    category: 'SATELLITE',
    affiliation: 'US Space Force / Space Delta 8 (Schriever SFB)',
    orbitType: 'MEO',
    orbitRadius: 2150,
    orbitSpeed: 0.024,
    orbitInclination: 0.96, // 55 degrees
    orbitPhaseOffset: 1.15,
    modelType: 'GPS',
    altitudeKm: 20180,
    speedKmS: 3.87,
    periodMin: 718,
    sensorType: 'L-Band Phased Array Antenna + Quad Atomic Rubidium Clocks',
    colorHex: 0x10b981,
    specifications: [
      { label: 'NORAD Catalog ID', value: '55268 / 2023-008A' },
      { label: 'Orbit Shell', value: 'Semi-Synchronous Medium Earth Orbit (MEO)' },
      { label: 'Altitude', value: '20,180 km (12,540 mi)' },
      { label: 'Inclination', value: '55.0° Orbital Plane C' },
      { label: 'Signal Broadcast', value: 'L1C, L2C, L5, and Military M-Code (Jam-Resistant)' },
      { label: 'Clock Standard', value: 'Quad Atomic Rubidium & Cesium Standards (drift <1 ns/day)' },
      { label: 'Guidance Assistance', value: 'Terminal midcourse differential GPS/SINS updates for Trident Mk4A' },
      { label: 'Design Lifetime', value: '15 Years Operational' }
    ],
    description: 'Next-generation positioning, navigation, and timing satellite providing 3x higher broadcast accuracy and up to 8x improved anti-jam capabilities for strategic military guidance systems.'
  },
  {
    id: 'usa-224-kh11',
    name: 'USA-224 (KH-11 KENNEN)',
    designation: 'Keyhole Optical Reconnaissance Sat (Block IV)',
    category: 'SATELLITE',
    affiliation: 'National Reconnaissance Office (NRO) / NROL-49',
    orbitType: 'POLAR_LEO',
    orbitRadius: 1550,
    orbitSpeed: 0.052,
    orbitInclination: 1.70, // 97.4 degrees sun-sync
    orbitPhaseOffset: 3.8,
    modelType: 'KH11',
    altitudeKm: 280,
    speedKmS: 7.74,
    periodMin: 90.2,
    sensorType: '2.4-meter Folded Cassegrain Optical / Multispectral Digital Array',
    colorHex: 0xa855f7,
    specifications: [
      { label: 'NORAD Catalog ID', value: '37348 / 2011-002A' },
      { label: 'Orbit Shell', value: 'Sun-Synchronous Polar Low Earth Orbit (LEO)' },
      { label: 'Perigee / Apogee', value: '280 km / 1,010 km' },
      { label: 'Orbital Period', value: '90.2 minutes (16 revs/day)' },
      { label: 'Optical Aperture', value: '2.4-meter diffraction-limited primary mirror' },
      { label: 'Ground Resolution', value: 'Sub-5 cm (2 inch) Ground Sample Distance (GSD)' },
      { label: 'Downlink System', value: 'Near-real-time encrypted relay via SDS (Quasar) constellation' },
      { label: 'Primary Mission', value: 'Target Silo Pre-Strike & Post-Detonation Bomb Damage Assessment' }
    ],
    description: 'High-resolution strategic optical reconnaissance satellite in polar orbit monitoring ICBM launch complexes, missile silos, and naval submarine operating corridors.'
  },
  {
    id: 'milstar-ii-4',
    name: 'Milstar II Flight-4',
    designation: 'USA-169 (DFS-6 Advanced EHF Precursor)',
    category: 'SATELLITE',
    affiliation: 'US Space Force Space Systems Command (SSC)',
    orbitType: 'GEO',
    orbitRadius: 2950,
    orbitSpeed: 0.010,
    orbitInclination: 0.08,
    orbitPhaseOffset: 4.6,
    modelType: 'MILSTAR',
    altitudeKm: 35786,
    speedKmS: 3.07,
    periodMin: 1436,
    sensorType: 'Extremely High Frequency (EHF 44 GHz / 20 GHz) Cross-Link Array',
    colorHex: 0xec4899,
    specifications: [
      { label: 'NORAD Catalog ID', value: '27711 / 2003-012A' },
      { label: 'Orbit Shell', value: 'Geosynchronous Equatorial Orbit (GEO)' },
      { label: 'Communications', value: 'Extremely High Frequency (EHF) & Super High Frequency (SHF)' },
      { label: 'Nuclear Hardening', value: 'High-Altitude EMP (HEMP) & Radiation Tolerant Bus' },
      { label: 'Antenna Suite', value: 'Multi-beam steerable parabolic dishes with null-steering' },
      { label: 'Primary Mission', value: 'National Command Authority (NCA) to SSBN Emergency Action Messages (EAM)' }
    ],
    description: 'Nuclear-hardened, jam-resistant strategic command and communications relay satellite enabling continuous Emergency Action Message (EAM) transmission to deployed SSBN submarines.'
  }
];

/**
 * Builds live SelectableObjectIntel for any object ID using current telemetry and state.
 */
export function getLiveObjectIntel(
  objectId: string,
  telemetry: TelemetryData
): SelectableObjectIntel | null {
  const sat = SATELLITE_DEFINITIONS.find((s) => s.id === objectId);
  if (sat) {
    return {
      id: sat.id,
      name: sat.name,
      designation: sat.designation,
      category: 'SATELLITE',
      affiliation: sat.affiliation,
      status: `ACTIVE ORBITAL PASS — ${sat.orbitType} (${sat.altitudeKm.toLocaleString()} KM)`,
      position: { x: 0, y: sat.orbitRadius, z: 0 },
      telemetrySummary: {
        altitudeOrDepth: `${sat.altitudeKm.toLocaleString()} km (${(sat.altitudeKm * 0.621371).toFixed(0)} mi)`,
        speedOrVelocity: `${sat.speedKmS.toFixed(2)} km/s (${(sat.speedKmS * 2236.94).toFixed(0)} mph)`,
        coordinatesOrOrbit: `${sat.orbitType} | Period ${sat.periodMin.toFixed(1)}m | Inclination ${(sat.orbitInclination * 57.2958).toFixed(1)}°`,
        rangeOrDistance: `${sat.altitudeKm.toLocaleString()} km orbital elevation`
      },
      specifications: sat.specifications,
      description: sat.description
    };
  }

  if (objectId === 'trident-missile') {
    const isUndersea = telemetry.stage === 'PRE_LAUNCH_4KT' || telemetry.stage === 'SUB_BUBBLE_EJECT';
    const altDisplay = isUndersea
      ? `${(telemetry.altitude * 1000).toFixed(0)} m (Undersea)`
      : `${telemetry.altitude.toFixed(1)} km (${(telemetry.altitude * 3280.84).toFixed(0)} ft)`;
    const velDisplay = `Mach ${(telemetry.velocity / 343).toFixed(1)} (${telemetry.velocity.toFixed(0)} m/s)`;

    return {
      id: 'trident-missile',
      name: 'TRIDENT II D5 LE (SLBM)',
      designation: 'UGM-133A Trident II Life Extension',
      category: 'MISSILE',
      affiliation: 'US Strategic Command (USSTRATCOM) / Task Force 134',
      status: `FLIGHT PHASE: ${telemetry.stage.replace(/_/g, ' ')} (T+${telemetry.missionTime.toFixed(1)}s)`,
      position: { x: 0, y: telemetry.altitude, z: 0 },
      telemetrySummary: {
        altitudeOrDepth: altDisplay,
        speedOrVelocity: velDisplay,
        rangeOrDistance: `${telemetry.downrange.toFixed(1)} km downrange`,
        coordinatesOrOrbit: `Pitch: ${telemetry.pitchAngle.toFixed(1)}° | Yaw: ${telemetry.yawAngle.toFixed(1)}°`,
        bearingOrAzimuth: '045° True Azimuth (Atlantic Test Range)'
      },
      specifications: [
        { label: 'Missile System', value: 'UGM-133A Trident II D5 LE (Life Extension)' },
        { label: 'Manufacturer', value: 'Lockheed Martin Space Systems (Sunnyvale, CA)' },
        { label: 'Length & Diameter', value: '13.58 m (44.6 ft) / 2.11 m (83 in)' },
        { label: 'Launch Mass', value: '59,080 kg (130,250 lbs)' },
        { label: 'Propulsion', value: 'Three-stage solid propellant rocket motors (HTPB/NEPE-75)' },
        { label: 'Guidance Package', value: 'MK 6 SINS + Stellar Star Tracker + Bell GSS Tensor Inversion' },
        { label: 'Warhead Payload', value: 'Up to 8-12 Mk4A/W76-1 or Mk5/W88 MIRVs in Post-Boost Vehicle' },
        { label: 'Operational Range', value: '>7,400 km (>4,000 nautical miles) with full payload' },
        { label: 'Accuracy (CEP)', value: telemetry.gssEnabled ? '<90 m CEP (Bell GSS Calibrated)' : '~450 m CEP (Uncalibrated)' }
      ],
      description: 'The premier sea-based strategic deterrence missile of the United States and Royal Navy, launched underwater from an Ohio-class SSBN through cold gas steam ejection and aerospike drag reduction.'
    };
  }

  if (objectId === 'uss-ohio') {
    const isSurfaced = telemetry.subSurfaceMode || telemetry.subDepthMeters === 0;
    const depthStr = isSurfaced ? '0 m (Surfaced at Waterline)' : `${telemetry.subDepthMeters} m Submerged`;
    const speedStr = `${telemetry.subSpeedKnots.toFixed(1)} knots (${(telemetry.subSpeedKnots * 1.852).toFixed(1)} km/h)`;

    return {
      id: 'uss-ohio',
      name: 'USS OHIO (SSBN-726)',
      designation: 'Ohio-Class Fleet Ballistic Missile Submarine',
      category: 'SUBMARINE',
      affiliation: 'US Navy Submarine Group 10 / USSTRATCOM',
      status: telemetry.superSilentMode
        ? 'ULTRA-QUIET PATROL (78 dB) — ANECHOIC CLOAK ENGAGED'
        : isSurfaced
        ? 'SURFACE POSTURE (MAIN BALLAST TANKS BLOWN)'
        : `NOMINAL SUBMERGED PATROL (${telemetry.noodlingPattern} HELM)`,
      position: { x: 0, y: -telemetry.subDepthMeters, z: 0 },
      telemetrySummary: {
        altitudeOrDepth: depthStr,
        speedOrVelocity: speedStr,
        rangeOrDistance: 'Theater Origin (0.0 km Datum)',
        bearingOrAzimuth: '045° Heading | 0.0° Keel Trim',
        coordinatesOrOrbit: '28°24\'N, 79°48\'W (Eastern Atlantic Range)'
      },
      specifications: [
        { label: 'Hull Classification', value: 'SSBN (Nuclear-Powered Ballistic Missile Submarine)' },
        { label: 'Length & Beam', value: '170.7 m (560 ft) / 12.8 m (42 ft)' },
        { label: 'Displacement', value: '16,764 tons (surfaced) / 18,750 tons (submerged)' },
        { label: 'Nuclear Propulsion', value: '1× General Electric S8G Pressurized Water Reactor (220 MWt)' },
        { label: 'Drivetrain', value: '2× geared turbines (60,000 shp), single 7-bladed skewed bronze screw' },
        { label: 'Armament', value: '24× Vertical SLBM Launch Tubes (Trident II) + 4× 533mm Torpedo Tubes' },
        { label: 'Acoustic Signature', value: `${telemetry.subRadiatedNoiseDb} dB (Anechoic tile decoupling)` },
        { label: 'Diving Depth', value: '>240 m (800 ft) test depth' },
        { label: 'Crew Complement', value: '155 Officers & Enlisted (Blue/Gold rotation)' }
      ],
      description: 'The apex stealth deterrent of the United States Navy, providing undetectable undersea launch capability with 24 Trident II D5 missile tubes and quiet natural-circulation nuclear power.'
    };
  }

  if (objectId === 'akula-pantera') {
    const contact = telemetry.russianSubContact;
    return {
      id: 'akula-pantera',
      name: 'K-317 PANTERA (AKULA-I)',
      designation: 'Project 971 Shchuka-B Nuclear Attack Submarine',
      category: 'SUBMARINE',
      affiliation: 'Russian Northern Fleet / 24th Submarine Division',
      status: `TRACKING STATUS: ${contact.trackingStatus} (TMA CONFIDENCE: ${contact.tmaConfidence}%)`,
      position: { x: -80, y: -contact.depthMeters, z: -25 },
      telemetrySummary: {
        altitudeOrDepth: `${contact.depthMeters} m Keel Depth`,
        speedOrVelocity: '6.5 knots (Silent Stalking)',
        rangeOrDistance: `${contact.distanceYards.toLocaleString()} yards (${(contact.distanceYards * 0.9144).toFixed(0)} m)`,
        bearingOrAzimuth: `${contact.bearing.toFixed(0)}° Relative Bearing (Stern Baffles)`,
        coordinatesOrOrbit: 'Thermal Layer Boundary Trailing Corridor'
      },
      specifications: [
        { label: 'NATO Designation', value: 'Akula-I Class (Project 971 Shchuka-B)' },
        { label: 'Displacement', value: '8,140 tons surfaced / 12,770 tons submerged' },
        { label: 'Reactor Plant', value: '1× OK-650M Pressurized Water Reactor (190 MWt)' },
        { label: 'Sonar Systems', value: 'MGK-540 Skat-3 with Towed Sonar Pod on Upper Fin' },
        { label: 'Weapons System', value: '4× 533mm + 4× 650mm torpedo tubes (53-65K torpedoes, RPK-2 Viyuga)' },
        { label: 'Anechoic Treatment', value: 'Active pneumatic damping rafts + two-layer acoustic rubber tiles' },
        { label: 'Tactical Behavior', value: telemetry.noodlingPattern !== 'OFF' ? 'Disrupted by Ohio evasive maneuvers' : 'Maintaining passive narrow-band sonar lock' }
      ],
      description: 'Russian high-speed nuclear attack hunter-killer submarine equipped with advanced passive bow sonar and upper-fin towed array pod, specialized in stalking SSBN deterrent patrols.'
    };
  }

  if (objectId === 'usns-vanguard') {
    return {
      id: 'usns-vanguard',
      name: 'USNS VANGUARD (T-AGM-19)',
      designation: 'Missile Range Instrumentation & Apollo Tracking Ship',
      category: 'VESSEL',
      affiliation: 'Military Sealift Command / NASA Space Flight Tracking Network',
      status: 'CALIBRATION ON-STATION — BELL GSS SENSORS ACTIVE',
      position: { x: 240, y: 0, z: -380 },
      telemetrySummary: {
        altitudeOrDepth: '0 m (Surface Waterline)',
        speedOrVelocity: 'Station-keeping (0.0 kt dynamic positioning)',
        rangeOrDistance: '450 km downrange from SSBN datum',
        bearingOrAzimuth: '042° True Azimuth',
        coordinatesOrOrbit: 'Atlantic Missile Test Tracking Station Alpha'
      },
      specifications: [
        { label: 'Type & Hull', value: 'T-AGM-19 Range Instrumentation Ship (Converted T2 Tanker)' },
        { label: 'Length & Beam', value: '181 m (595 ft) / 23 m (75 ft)' },
        { label: 'Displacement', value: '23,400 tons full load' },
        { label: 'Telemetry Radars', value: '30-ft parabolic S-Band & C-Band tracking antennas' },
        { label: 'Inertial Datum', value: 'Bell Gravity Sensors (GSS) + SINS Geodesy Reference' },
        { label: 'Role in Trident', value: 'Providing real-time gravity deflection and trajectory radar tracking' }
      ],
      description: 'Specialized military and NASA ocean instrumentation vessel providing high-precision radar downrange tracking, Apollo communications, and Bell GSS gravity deflection measurements.'
    };
  }

  if (objectId === 'target-silo') {
    return {
      id: 'target-silo',
      name: 'HARDENED SILO COMPLEX #41',
      designation: 'Super-Hardened ICBM Launch Facility',
      category: 'GROUND_TARGET',
      affiliation: 'Designated Strategic Target (Downrange Test Range)',
      status: telemetry.stage === 'TARGET_IMPACT'
        ? `DETONATION RECORDED — ${telemetry.siloOverpressurePsi} PSI OVERPRESSURE (KILL PROB: ${telemetry.targetKillProb.toFixed(1)}%)`
        : `TERMINAL VECTOR LOCKED — ESTIMATED MISS: ${telemetry.targetMissMeters} m`,
      position: { x: 0, y: 0, z: -1200 },
      telemetrySummary: {
        altitudeOrDepth: '140 m Above Sea Level (Subterranean Silo)',
        speedOrVelocity: 'Stationary Hardened Ground Structure',
        rangeOrDistance: '1,200 km downrange from launch point',
        bearingOrAzimuth: '045° Downrange Vector',
        coordinatesOrOrbit: 'Reinforced Concrete Headworks Grid'
      },
      specifications: [
        { label: 'Structure Type', value: 'Underground Reinforced Reinforced Concrete & Steel Liner' },
        { label: 'Hardness Rating', value: '2,500 - 3,000 psi shock overpressure resistance' },
        { label: 'Target Miss Radius', value: `${telemetry.targetMissMeters} meters (CEP)` },
        { label: 'Expected Overpressure', value: `${telemetry.siloOverpressurePsi} psi` },
        { label: 'Single-Shot Kill Prob', value: `${telemetry.targetKillProb.toFixed(1)}% P_k` },
        { label: 'Significance', value: telemetry.gssEnabled ? 'SINS corrected via GSS tensor yields hard-kill certainty' : 'Uncalibrated deflection results in near-miss bounce' }
      ],
      description: 'Super-hardened reinforced subterranean ICBM missile silo used to calibrate nuclear warhead CEP precision and prove hard-target kill capability.'
    };
  }

  if (objectId === 'earth-globe') {
    return {
      id: 'earth-globe',
      name: 'PLANET EARTH (TERRA)',
      designation: 'WGS-84 Geodetic Reference Ellipsoid',
      category: 'PLANET',
      affiliation: 'Solar System / Terrestrial Theater',
      status: 'PLANETARY ROTATION ACTIVE — GRAVITY GRADIENT MAPPED',
      position: { x: 0, y: -2000, z: -400 },
      telemetrySummary: {
        altitudeOrDepth: '0 km Surface Waterline / Datum',
        speedOrVelocity: '1,670 km/h Equatorial Rotation (465 m/s)',
        coordinatesOrOrbit: 'WGS-84 Datum / SINS Geodesy Reference',
        rangeOrDistance: 'Primary Planetary Mass Body'
      },
      specifications: [
        { label: 'Equatorial Radius', value: '6,378.137 km (WGS-84)' },
        { label: 'Polar Radius', value: '6,356.752 km (Flattening: 1/298.257)' },
        { label: 'Mass', value: '5.972 × 10²⁴ kg' },
        { label: 'Standard Gravity', value: '9.80665 m/s² (1.000 g)' },
        { label: 'Atmosphere Boundary', value: '100 km (Kármán line), Exobase at 600 km' },
        { label: 'Geodetic Anomaly', value: 'Deflection of the Vertical caused by ocean trenches & seamounts' },
        { label: 'Strategic Role', value: 'Earth’s inhomogeneous mass distribution causes SINS inertial deflection unless compensated by Bell GSS sensors' }
      ],
      description: 'The home planet and operational theater. SINS inertial guidance on ballistic missiles relies on precise gravitational modeling of Earth’s complex mass anomalies.'
    };
  }

  if (objectId === 'decoy-mk3') {
    return {
      id: 'decoy-mk3',
      name: 'ADC-MK3 ACOUSTIC DECOY',
      designation: 'Acoustic Device Countermeasure Mk 3',
      category: 'COUNTERMEASURE',
      affiliation: 'US Navy Submarine Tactical Countermeasure',
      status: telemetry.countermeasuresActive ? 'ACTIVE ACOUSTIC EMISSION — SPOOFING ENEMY TMA' : 'STOWED IN EXTERNAL LAUNCHER',
      position: { x: -20, y: -22, z: 10 },
      telemetrySummary: {
        altitudeOrDepth: `${telemetry.subDepthMeters} m Depth`,
        speedOrVelocity: 'Slow Drift (0.5 kt)',
        rangeOrDistance: 'Deployed 150 yards aft-quarter of USS Ohio',
        bearingOrAzimuth: '225° True'
      },
      specifications: [
        { label: 'Device Class', value: 'Submarine Launched Acoustic Countermeasure (ADC)' },
        { label: 'Emitter Array', value: 'Broadband Acoustic Synthesizer (emulating 4.0 kt Ohio screw RPM)' },
        { label: 'Reaction Bubble', value: 'Micro-bubble effervescence cloud for active sonar reflection' },
        { label: 'Effective Duration', value: '7.5 minutes active broadcast' },
        { label: 'Target Effect', value: 'Decoys Russian Akula sonar into tracking phantom SSBN course' }
      ],
      description: 'Expendable acoustic device launched through sub 3-inch countermeasure tubes that emits broadband simulated Ohio-class screw noise and reflective bubble clouds.'
    };
  }

  return null;
}

export const ALL_SELECTABLE_OBJECTS: Array<{ id: string; name: string; category: string; icon: string }> = [
  { id: 'trident-missile', name: 'Trident II D5 LE (SLBM)', category: 'Missile', icon: 'Rocket' },
  { id: 'uss-ohio', name: 'USS Ohio (SSBN-726)', category: 'Submarine', icon: 'Anchor' },
  { id: 'akula-pantera', name: 'Akula-I Pantera (K-317)', category: 'Submarine', icon: 'ShieldAlert' },
  { id: 'earth-globe', name: 'Planet Earth (Terra)', category: 'Planet', icon: 'Globe' },
  { id: 'sbirs-geo-5', name: 'SBIRS GEO-5 (Early Warning)', category: 'Satellite', icon: 'Radio' },
  { id: 'dsp-flight-23', name: 'DSP Flight-23 (IR Warning)', category: 'Satellite', icon: 'Radio' },
  { id: 'gps-iii-sv06', name: 'GPS III-SV06 (Navstar)', category: 'Satellite', icon: 'Compass' },
  { id: 'usa-224-kh11', name: 'USA-224 (KH-11 Spy Sat)', category: 'Satellite', icon: 'Eye' },
  { id: 'milstar-ii-4', name: 'Milstar II-4 (Nuclear Relay)', category: 'Satellite', icon: 'Radio' },
  { id: 'usns-vanguard', name: 'USNS Vanguard (T-AGM-19)', category: 'Ship', icon: 'Waves' },
  { id: 'target-silo', name: 'Hardened Silo #41', category: 'Target', icon: 'Target' },
  { id: 'decoy-mk3', name: 'ADC-Mk3 Decoy', category: 'Decoy', icon: 'Zap' }
];
