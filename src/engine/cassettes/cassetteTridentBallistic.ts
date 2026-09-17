import { SimulationCassette } from '../types';

export const cassetteTridentBallistic: SimulationCassette = {
  id: 'cassette-trident-ballistic',
  title: 'STRATEGIC LAUNCH: UGM-133A TRIDENT II (D5)',
  version: '1.8.2',
  author: 'STRATEGIC SYSTEMS PROGRAMS (SSP) / NAVSEA',
  classification: 'TOP SECRET // SI-TK',
  description: 'Extracted high-fidelity ballistic missile trajectory from POC-01. Simulates cold-gas submarine tube ejection, aerospike extension, 3-stage solid rocket boost, celestial star tracker fix, and MIRV bus deployment to target silo #41.',
  theater: 'Eastern Range Atlantic Test Corridor (Cape Canaveral to Ascension Island)',
  epochTimestamp: '2026-09-16T12:00:00Z',
  worldConfig: {
    sphereRadius: 100,
    style: 'CYBERPUNK_VECTOR',
    graticuleSpacingDeg: 15,
    rotationSpeedRadsPerSec: 0.0003,
    showCoastlines: true,
    showTacticalBorders: false,
    showAtmosphereGlow: true,
    showShippingLanes: false,
    showSubmarineChokepoints: true
  },
  layers: [
    {
      id: 'layer-launch-sub',
      name: 'LAUNCH PLATFORM & SUBMARINE ESCORT',
      domain: 'SUBSURFACE',
      description: 'Ohio-class SSBN launch platform and acoustic surveillance',
      visible: true,
      requiredClearance: 'UNCLASSIFIED',
      colorHex: '#38bdf8'
    },
    {
      id: 'layer-missile-flight',
      name: 'TRIDENT II D5 BALLISTIC ARCS & STAGING',
      domain: 'BALLISTIC',
      description: 'Boost phase, midcourse apogee, and reentry vehicle dispersion',
      visible: true,
      requiredClearance: 'SECRET // NOFORN',
      colorHex: '#f59e0b'
    },
    {
      id: 'layer-tracking-assets',
      name: 'RANGE TELEMETRY SHIPS & RADAR ARRAYS',
      domain: 'SURFACE_NAVY',
      description: 'USNS Vanguard (T-AGM-19) and Ascension Island tracking stations',
      visible: true,
      requiredClearance: 'UNCLASSIFIED',
      colorHex: '#10b981'
    }
  ],
  entities: [
    {
      id: 'trident-d5-missile',
      name: 'UGM-133A TRIDENT II (D5) #194',
      callsign: 'TRIDENT-ALPHA',
      faction: 'USA',
      domain: 'BALLISTIC',
      securityLevel: 'TOP SECRET // SI-TK',
      position: { lat: 28.4, lon: -79.5, altitudeKm: 420 },
      trajectoryType: 'BALLISTIC_ARC',
      speedKnotsOrKms: 6.2,
      headingDeg: 115,
      modelTemplate: 'MISSILE',
      colorHex: '#f59e0b',
      aiBehavior: {
        mode: 'TRANSIT',
        alertStatus: 'DEFCON_1',
        ruleOfEngagement: 'Execute pre-programmed digital flight sequence; stage separation at burnout'
      },
      sensors: { radarRangeKm: 0, opticalTracking: true, sigintActive: false, activeEmission: false },
      description: 'Three-stage solid-propellant intercontinental ballistic missile carrying W88 thermonuclear warheads.',
      intelNotes: 'Stellar-inertial guidance with Bell Model XI accelerometer updating drift parameters.'
    },
    {
      id: 'sub-uss-ohio',
      name: 'USS OHIO (SSBN-726)',
      callsign: 'NEPTUNE-FLAG',
      faction: 'USA',
      domain: 'SUBSURFACE',
      securityLevel: 'SECRET // NOFORN',
      position: { lat: 28.4, lon: -79.6, altitudeKm: -0.045 },
      trajectoryType: 'STATIC',
      speedKnotsOrKms: 4.0,
      headingDeg: 120,
      modelTemplate: 'SUBMARINE',
      colorHex: '#06b6d4',
      aiBehavior: {
        mode: 'PATROL',
        alertStatus: 'DEFCON_2',
        ruleOfEngagement: 'Submerged hover at 45m depth; steam ejection sequence active'
      },
      sensors: { radarRangeKm: 0, sonarRangeKm: 60, opticalTracking: false, sigintActive: true, activeEmission: false },
      description: 'Submarine launch platform in Patrick AFB test launch quadrant.',
      intelNotes: 'Tube #4 steam gas generator energized; SINS calibrated.'
    },
    {
      id: 'ship-usns-vanguard',
      name: 'USNS VANGUARD (T-AGM-19)',
      callsign: 'ORBIT-MONITOR',
      faction: 'USA',
      domain: 'SURFACE_NAVY',
      securityLevel: 'UNCLASSIFIED',
      position: { lat: 25.5, lon: -72.0, altitudeKm: 0 },
      trajectoryType: 'STATIC',
      speedKnotsOrKms: 12.0,
      headingDeg: 90,
      modelTemplate: 'DESTROYER',
      colorHex: '#10b981',
      aiBehavior: {
        mode: 'SURVEILLANCE',
        alertStatus: 'DEFCON_5',
        ruleOfEngagement: 'S-band and C-band dual autotrack lock on missile telemetry beacon'
      },
      sensors: { radarRangeKm: 800, opticalTracking: true, sigintActive: true, activeEmission: true },
      description: 'Range instrumentation ship equipped with 30-foot parabolic tracking dishes and SINS lab.',
      intelNotes: 'Receiving live telemetry stream and recording stage burnout times.'
    }
  ]
};
