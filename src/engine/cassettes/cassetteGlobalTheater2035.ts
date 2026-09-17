import { SimulationCassette } from '../types';

export const cassetteGlobalTheater2035: SimulationCassette = {
  id: 'cassette-global-theater-2035',
  title: 'GLOBAL THEATER 2035 (CYBERPUNK RETRO VECTOR)',
  version: '2.4.0',
  author: 'STRATCOM / GLOBAL SURVEILLANCE & TARGETING MATRIX',
  classification: 'TOP SECRET // SI-TK',
  description: 'Worldwide interactive tactical vector representation of multi-domain combatants, commercial shipping corridors, military satellite constellations, and orbital platforms across USA, Russia, China, UK, Canada, and global civil shipping lanes under real-time AI behavioral control.',
  theater: 'Global Planetary Sphere (Multi-Domain Land / Sea / Air / Space)',
  epochTimestamp: '2035-10-24T06:00:00Z',
  worldConfig: {
    sphereRadius: 100,
    style: 'CYBERPUNK_VECTOR',
    graticuleSpacingDeg: 30,
    rotationSpeedRadsPerSec: 0.0008,
    showCoastlines: true,
    showTacticalBorders: true,
    showAtmosphereGlow: true,
    showShippingLanes: true,
    showSubmarineChokepoints: true
  },
  layers: [
    {
      id: 'layer-us-navy',
      name: 'US NAVY (FLEET FORCES & PACIFIC)',
      domain: 'SURFACE_NAVY',
      description: 'Carrier Strike Groups, Guided Missile Cruisers, and Amphibious Squadrons',
      visible: true,
      requiredClearance: 'UNCLASSIFIED',
      colorHex: '#06b6d4'
    },
    {
      id: 'layer-subsurface',
      name: 'SUBSURFACE ASW & SSBN BASTIONS',
      domain: 'SUBSURFACE',
      description: 'Nuclear ballistic missile submarines and fast-attack hunters in active patrol areas',
      visible: true,
      requiredClearance: 'SECRET // NOFORN',
      colorHex: '#3b82f6'
    },
    {
      id: 'layer-air-forces',
      name: 'GLOBAL AIR FORCES & STRATEGIC BOMBERS',
      domain: 'AIR_FORCE',
      description: 'Stealth bombers, fighter combat air patrols, and airborne early warning rotodomes',
      visible: true,
      requiredClearance: 'UNCLASSIFIED',
      colorHex: '#10b981'
    },
    {
      id: 'layer-foreign-militaries',
      name: 'OPFOR & ALLIED FORCES (RUS / CHN / GBR / CAN)',
      domain: 'SURFACE_NAVY',
      description: 'Russian Northern/Pacific Fleets, Chinese PLA Navy, Royal Navy, and Canadian Maritime Command',
      visible: true,
      requiredClearance: 'UNCLASSIFIED',
      colorHex: '#ef4444'
    },
    {
      id: 'layer-commercial-shipping',
      name: 'COMMERCIAL MARITIME & TANKER FLEETS',
      domain: 'COMMERCIAL_MARITIME',
      description: 'Ultra Large Container Vessels and crude tankers transiting international choke points',
      visible: true,
      requiredClearance: 'UNCLASSIFIED',
      colorHex: '#e2e8f0'
    },
    {
      id: 'layer-satellites-orbital',
      name: 'ORBITAL SURVEILLANCE & SPACE STATIONS',
      domain: 'SPACE_SATELLITE',
      description: 'LEO/GEO early-warning satellites, SIGINT eavesdroppers, and manned space platforms',
      visible: true,
      requiredClearance: 'TOP SECRET // SI-TK',
      colorHex: '#f59e0b'
    },
    {
      id: 'layer-land-defense',
      name: 'GROUND AIR DEFENSE & RADAR ARRAYS',
      domain: 'LAND_ARMY',
      description: 'BMEWS missile warning radars, THAAD batteries, and coastal anti-ship batteries',
      visible: true,
      requiredClearance: 'SECRET // NOFORN',
      colorHex: '#8b5cf6'
    }
  ],
  entities: [
    // --- UNITED STATES FORCES (USA) ---
    {
      id: 'usa-cvn-78-ford',
      name: 'USS GERALD R. FORD (CVN-78)',
      callsign: 'WOLVERINE-01',
      faction: 'USA',
      domain: 'SURFACE_NAVY',
      securityLevel: 'UNCLASSIFIED',
      position: { lat: 36.2, lon: -28.5, altitudeKm: 0 },
      trajectoryType: 'GREAT_CIRCLE',
      speedKnotsOrKms: 28,
      headingDeg: 75,
      modelTemplate: 'CARRIER',
      colorHex: '#06b6d4',
      aiBehavior: {
        mode: 'PATROL',
        alertStatus: 'DEFCON_3',
        engagementRadiusKm: 650,
        ruleOfEngagement: 'Escort Carrier Air Wing 8; Intercept unidentified tracks within 300nm'
      },
      sensors: { radarRangeKm: 550, opticalTracking: true, sigintActive: true, activeEmission: true },
      description: 'Lead ship of Ford-class aircraft carriers featuring EMALS catapults and AN/SPY-6(V)1 AESA radar.',
      intelNotes: 'Operating in North Atlantic corridor monitoring GIUK gap and Mediterranean approach.',
      waypoints: [
        { lat: 34.0, lon: -40.0, altitudeKm: 0 },
        { lat: 36.2, lon: -28.5, altitudeKm: 0 },
        { lat: 40.0, lon: -15.0, altitudeKm: 0 },
        { lat: 36.0, lon: -5.3, altitudeKm: 0 }
      ]
    },
    {
      id: 'usa-ddg-1000-zumwalt',
      name: 'USS ZUMWALT (DDG-1000)',
      callsign: 'GHOST-LEADER',
      faction: 'USA',
      domain: 'SURFACE_NAVY',
      securityLevel: 'CONFIDENTIAL',
      position: { lat: 21.3, lon: 135.0, altitudeKm: 0 },
      trajectoryType: 'PATROL_WAYPOINTS',
      speedKnotsOrKms: 30,
      headingDeg: 280,
      modelTemplate: 'DESTROYER',
      colorHex: '#06b6d4',
      aiBehavior: {
        mode: 'SURVEILLANCE',
        alertStatus: 'DEFCON_3',
        engagementRadiusKm: 400,
        ruleOfEngagement: 'Passive sensor emission control; maintain stealth posture in Philippine Sea'
      },
      sensors: { radarRangeKm: 420, opticalTracking: true, sigintActive: true, activeEmission: false },
      description: 'Stealth guided missile destroyer equipped with Common Hypersonic Glide Body (C-HGB) VLS cells.',
      intelNotes: 'Stationed east of Luzon Strait conducting electromagnetic monitoring of adversary maritime movements.'
    },
    {
      id: 'usa-ssbn-726-ohio',
      name: 'USS OHIO (SSBN-726)',
      callsign: 'BLACK-TRENT',
      faction: 'USA',
      domain: 'SUBSURFACE',
      securityLevel: 'TOP SECRET // SI-TK',
      position: { lat: 28.5, lon: -145.2, altitudeKm: -0.06 },
      trajectoryType: 'PATROL_WAYPOINTS',
      speedKnotsOrKms: 4.5,
      headingDeg: 210,
      modelTemplate: 'SUBMARINE',
      colorHex: '#38bdf8',
      aiBehavior: {
        mode: 'PATROL',
        alertStatus: 'DEFCON_2',
        engagementRadiusKm: 7000,
        ruleOfEngagement: 'Maintain silent running; retain strategic nuclear deterrent launch posture'
      },
      sensors: { radarRangeKm: 0, sonarRangeKm: 85, opticalTracking: false, sigintActive: true, activeEmission: false },
      description: 'Nuclear-powered ballistic missile submarine carrying 24 UGM-133A Trident II D5 SLBMs.',
      intelNotes: 'Deep ocean patrol at 60m depth with Bell GSS real-time tensor navigation compensation active.'
    },
    {
      id: 'usa-b21-raider',
      name: 'B-21 RAIDER FLIGHT (SPIRIT-21)',
      callsign: 'PHANTOM-99',
      faction: 'USA',
      domain: 'AIR_FORCE',
      securityLevel: 'SECRET // NOFORN',
      position: { lat: 72.4, lon: -45.0, altitudeKm: 16.5 },
      trajectoryType: 'GREAT_CIRCLE',
      speedKnotsOrKms: 540,
      headingDeg: 15,
      modelTemplate: 'BOMBER',
      colorHex: '#22d3ee',
      aiBehavior: {
        mode: 'TRANSIT',
        alertStatus: 'DEFCON_3',
        engagementRadiusKm: 1200,
        ruleOfEngagement: 'High-altitude polar perimeter deterrence; EMCON Alpha'
      },
      sensors: { radarRangeKm: 380, opticalTracking: true, sigintActive: true, activeEmission: false },
      description: 'Next-generation stealth strategic dual-capable bomber operating in Arctic transpolar route.',
      intelNotes: 'Testing resilient quantum-encrypted laser communications link with SBIRS constellation.'
    },
    {
      id: 'usa-e3-sentry',
      name: 'USAF E-3G SENTRY AWACS',
      callsign: 'MAGIC-55',
      faction: 'USA',
      domain: 'AIR_FORCE',
      securityLevel: 'UNCLASSIFIED',
      position: { lat: 56.5, lon: 18.2, altitudeKm: 10.5 },
      trajectoryType: 'PATROL_WAYPOINTS',
      speedKnotsOrKms: 360,
      headingDeg: 90,
      modelTemplate: 'AWACS',
      colorHex: '#06b6d4',
      aiBehavior: {
        mode: 'SURVEILLANCE',
        alertStatus: 'DEFCON_4',
        engagementRadiusKm: 500,
        ruleOfEngagement: 'Maintain continuous 360-degree radar picture over Baltic Sea approaches'
      },
      sensors: { radarRangeKm: 520, opticalTracking: false, sigintActive: true, activeEmission: true },
      description: 'Airborne warning and control system aircraft providing battle management and tactical air picture.',
      intelNotes: 'Transmitting real-time Link-16 tactical feeds to NATO fighters and naval combatants.'
    },

    // --- RUSSIAN FORCES (RUS) ---
    {
      id: 'rus-k535-borei',
      name: 'YURI DOLGORUKIY (K-535 BOREI-CLASS)',
      callsign: 'RED-OCTOBER-II',
      faction: 'RUS',
      domain: 'SUBSURFACE',
      securityLevel: 'TOP SECRET // SI-TK',
      position: { lat: 73.0, lon: 44.0, altitudeKm: -0.12 },
      trajectoryType: 'PATROL_WAYPOINTS',
      speedKnotsOrKms: 5.0,
      headingDeg: 340,
      modelTemplate: 'SUBMARINE',
      colorHex: '#ef4444',
      aiBehavior: {
        mode: 'PATROL',
        alertStatus: 'DEFCON_2',
        engagementRadiusKm: 8500,
        ruleOfEngagement: 'Patrol Northern Fleet Bastion in Barents Sea; evade NATO maritime patrol aircraft'
      },
      sensors: { radarRangeKm: 0, sonarRangeKm: 90, opticalTracking: false, sigintActive: true, activeEmission: false },
      description: 'Project 955 Borei nuclear ballistic missile submarine armed with 16 RSM-56 Bulava SLBMs.',
      intelNotes: 'Submerged under Arctic ice sheet margin; pump-jet propulsion minimizes acoustic signature.'
    },
    {
      id: 'rus-akula-pantera',
      name: 'K-317 PANTERA (AKULA-I CLASS)',
      callsign: 'HUNTER-07',
      faction: 'RUS',
      domain: 'SUBSURFACE',
      securityLevel: 'SECRET // NOFORN',
      position: { lat: 62.0, lon: -14.5, altitudeKm: -0.18 },
      trajectoryType: 'PATROL_WAYPOINTS',
      speedKnotsOrKms: 9.0,
      headingDeg: 245,
      modelTemplate: 'SUBMARINE',
      colorHex: '#ef4444',
      aiBehavior: {
        mode: 'SHADOW',
        targetEntityId: 'usa-ssbn-726-ohio',
        engagementRadiusKm: 40,
        ruleOfEngagement: 'Maintain acoustic track on NATO SSBN egress routes; do not expose mast'
      },
      sensors: { radarRangeKm: 0, sonarRangeKm: 65, opticalTracking: false, sigintActive: true, activeEmission: false },
      description: 'Project 971 Shchuka-B nuclear attack submarine specialized in anti-submarine warfare.',
      intelNotes: 'Patrolling south of Iceland along the SOSUS array boundary.'
    },
    {
      id: 'rus-tu160m-blackjack',
      name: 'TU-160M WHITE SWAN PAIR',
      callsign: 'IVAN-401',
      faction: 'RUS',
      domain: 'AIR_FORCE',
      securityLevel: 'CONFIDENTIAL',
      position: { lat: 68.0, lon: 35.0, altitudeKm: 13.0 },
      trajectoryType: 'GREAT_CIRCLE',
      speedKnotsOrKms: 600,
      headingDeg: 300,
      modelTemplate: 'BOMBER',
      colorHex: '#f87171',
      aiBehavior: {
        mode: 'PATROL',
        alertStatus: 'DEFCON_3',
        engagementRadiusKm: 2500,
        ruleOfEngagement: 'Long-range standoff cruise missile training route over Barents/Norwegian Sea'
      },
      sensors: { radarRangeKm: 400, opticalTracking: true, sigintActive: true, activeEmission: true },
      description: 'Variable-sweep supersonic heavy strategic bomber armed with Kh-101/Kh-102 cruise missiles.',
      intelNotes: 'Operating out of Olenya Air Base on Kola Peninsula.'
    },

    // --- CHINESE PLA FORCES (CHN) ---
    {
      id: 'chn-type003-fujian',
      name: 'CNS FUJIAN (CV-18)',
      callsign: 'DRAGON-FLAGSHIP',
      faction: 'CHN',
      domain: 'SURFACE_NAVY',
      securityLevel: 'UNCLASSIFIED',
      position: { lat: 15.5, lon: 114.2, altitudeKm: 0 },
      trajectoryType: 'PATROL_WAYPOINTS',
      speedKnotsOrKms: 26,
      headingDeg: 45,
      modelTemplate: 'CARRIER',
      colorHex: '#f97316',
      aiBehavior: {
        mode: 'PATROL',
        alertStatus: 'DEFCON_3',
        engagementRadiusKm: 600,
        ruleOfEngagement: 'Enforce South China Sea anti-access/area-denial perimeter with J-35 and J-15T air wing'
      },
      sensors: { radarRangeKm: 500, opticalTracking: true, sigintActive: true, activeEmission: true },
      description: 'Type 003 aircraft carrier featuring electromagnetic catapults and integrated phased array radar.',
      intelNotes: 'Supported by Type 055 and Type 052D escort group conducting combat readiness patrols.'
    },
    {
      id: 'chn-type055-nanchang',
      name: 'CNS NANCHANG (TYPE 055 DDG)',
      callsign: 'RED-SPEAR-101',
      faction: 'CHN',
      domain: 'SURFACE_NAVY',
      securityLevel: 'UNCLASSIFIED',
      position: { lat: 24.2, lon: 122.8, altitudeKm: 0 },
      trajectoryType: 'PATROL_WAYPOINTS',
      speedKnotsOrKms: 24,
      headingDeg: 190,
      modelTemplate: 'DESTROYER',
      colorHex: '#f97316',
      aiBehavior: {
        mode: 'SURVEILLANCE',
        alertStatus: 'DEFCON_3',
        engagementRadiusKm: 450,
        ruleOfEngagement: 'Monitor Taiwan eastern maritime approaches; YJ-21 hypersonic anti-ship missiles armed'
      },
      sensors: { radarRangeKm: 480, opticalTracking: true, sigintActive: true, activeEmission: true },
      description: '12,000-ton guided missile cruiser with 112 universal VLS cells and dual-band radar.',
      intelNotes: 'Stationed between Yonaguni Island and Taiwan east coast.'
    },

    // --- BRITISH ROYAL NAVY & RAF (GBR) ---
    {
      id: 'gbr-hms-queen-elizabeth',
      name: 'HMS QUEEN ELIZABETH (R08)',
      callsign: 'BRITANNIA-LEADER',
      faction: 'GBR',
      domain: 'SURFACE_NAVY',
      securityLevel: 'UNCLASSIFIED',
      position: { lat: 58.2, lon: 0.5, altitudeKm: 0 },
      trajectoryType: 'PATROL_WAYPOINTS',
      speedKnotsOrKms: 25,
      headingDeg: 180,
      modelTemplate: 'CARRIER',
      colorHex: '#a855f7',
      aiBehavior: {
        mode: 'PATROL',
        alertStatus: 'DEFCON_4',
        engagementRadiusKm: 500,
        ruleOfEngagement: 'NATO Allied Joint Task Force North; air superiority with F-35B Lightning II'
      },
      sensors: { radarRangeKm: 450, opticalTracking: true, sigintActive: true, activeEmission: true },
      description: '65,000-ton Royal Navy fleet aircraft carrier embarked with UK and Allied stealth aircraft.',
      intelNotes: 'Conducting anti-submarine exercises in North Sea with Norwegian and Dutch escorts.'
    },
    {
      id: 'gbr-raf-typhoon',
      name: 'RAF TYPHOON FGR4 FLIGHT',
      callsign: 'COBRA-FLIGHT',
      faction: 'GBR',
      domain: 'AIR_FORCE',
      securityLevel: 'UNCLASSIFIED',
      position: { lat: 57.5, lon: -3.3, altitudeKm: 9.2 },
      trajectoryType: 'PATROL_WAYPOINTS',
      speedKnotsOrKms: 500,
      headingDeg: 45,
      modelTemplate: 'FIGHTER',
      colorHex: '#c084fc',
      aiBehavior: {
        mode: 'INTERCEPT',
        alertStatus: 'DEFCON_4',
        engagementRadiusKm: 300,
        ruleOfEngagement: 'Quick Reaction Alert (QRA) North; intercept unidentified military aircraft'
      },
      sensors: { radarRangeKm: 280, opticalTracking: true, sigintActive: true, activeEmission: true },
      description: 'Eurofighter Typhoon multirole combat aircraft armed with Meteor BVRAAM missiles.',
      intelNotes: 'Scrambled from RAF Lossiemouth on interception vector.'
    },

    // --- CANADIAN ARMED FORCES (CAN) ---
    {
      id: 'can-hmcs-harry-dewolf',
      name: 'HMCS HARRY DEWOLF (AOPV 430)',
      callsign: 'ARCTIC-WATCH',
      faction: 'CAN',
      domain: 'SURFACE_NAVY',
      securityLevel: 'UNCLASSIFIED',
      position: { lat: 74.5, lon: -92.0, altitudeKm: 0 },
      trajectoryType: 'PATROL_WAYPOINTS',
      speedKnotsOrKms: 14,
      headingDeg: 260,
      modelTemplate: 'DESTROYER',
      colorHex: '#10b981',
      aiBehavior: {
        mode: 'PATROL',
        alertStatus: 'DEFCON_5',
        engagementRadiusKm: 250,
        ruleOfEngagement: 'Sovereignty surveillance of Northwest Passage and Arctic archipelago'
      },
      sensors: { radarRangeKm: 220, opticalTracking: true, sigintActive: true, activeEmission: true },
      description: 'Arctic and Offshore Patrol Ship with Polar Class 5 ice-strengthened hull.',
      intelNotes: 'Monitoring commercial maritime traffic transiting Barrow Strait.'
    },
    {
      id: 'can-cp140-aurora',
      name: 'RCAF CP-140 AURORA ASW',
      callsign: 'TUSKER-22',
      faction: 'CAN',
      domain: 'AIR_FORCE',
      securityLevel: 'CONFIDENTIAL',
      position: { lat: 70.2, lon: -130.5, altitudeKm: 6.8 },
      trajectoryType: 'PATROL_WAYPOINTS',
      speedKnotsOrKms: 320,
      headingDeg: 120,
      modelTemplate: 'AWACS',
      colorHex: '#34d399',
      aiBehavior: {
        mode: 'SURVEILLANCE',
        alertStatus: 'DEFCON_4',
        engagementRadiusKm: 350,
        ruleOfEngagement: 'Magnetic Anomaly Detection (MAD) and sonobuoy barrier patrol in Beaufort Sea'
      },
      sensors: { radarRangeKm: 320, opticalTracking: true, sigintActive: true, activeEmission: true },
      description: 'Long-range maritime patrol aircraft equipped with AIMS-HD electro-optical turret and sonobuoy processor.',
      intelNotes: 'Searching for foreign subsurface acoustic contacts near Canadian Arctic waters.'
    },

    // --- COMMERCIAL SHIPPING FLEET (CIVILIAN) ---
    {
      id: 'civ-ever-titan',
      name: 'M/V EVER TITAN (24,000 TEU)',
      callsign: '9V-CONTAINER',
      faction: 'CIVILIAN',
      domain: 'COMMERCIAL_MARITIME',
      securityLevel: 'UNCLASSIFIED',
      position: { lat: 4.8, lon: 98.2, altitudeKm: 0 },
      trajectoryType: 'GREAT_CIRCLE',
      speedKnotsOrKms: 19.5,
      headingDeg: 305,
      modelTemplate: 'CONTAINER_SHIP',
      colorHex: '#e2e8f0',
      aiBehavior: {
        mode: 'TRANSIT',
        alertStatus: 'DEFCON_5',
        ruleOfEngagement: 'Commercial navigation; maintain AIS Class-A beacon broadcast'
      },
      sensors: { radarRangeKm: 48, opticalTracking: false, sigintActive: false, activeEmission: true },
      description: 'Ultra Large Container Vessel carrying 24,000 standard shipping containers.',
      intelNotes: 'Transiting Malacca Strait westbound towards Suez Canal; carrying consumer electronics and machinery.'
    },
    {
      id: 'civ-ocean-giant-tanker',
      name: 'VLCC OCEAN GIANT (320,000 DWT)',
      callsign: 'VR-CRUDE-9',
      faction: 'CIVILIAN',
      domain: 'COMMERCIAL_MARITIME',
      securityLevel: 'UNCLASSIFIED',
      position: { lat: 25.2, lon: 57.8, altitudeKm: 0 },
      trajectoryType: 'GREAT_CIRCLE',
      speedKnotsOrKms: 14.2,
      headingDeg: 135,
      modelTemplate: 'TANKER_SHIP',
      colorHex: '#e2e8f0',
      aiBehavior: {
        mode: 'TRANSIT',
        alertStatus: 'DEFCON_5',
        ruleOfEngagement: 'International crude transit; abide by IMO traffic separation scheme'
      },
      sensors: { radarRangeKm: 40, opticalTracking: false, sigintActive: false, activeEmission: true },
      description: 'Very Large Crude Carrier laden with 2 million barrels of refined hydrocarbons.',
      intelNotes: 'Exiting Strait of Hormuz eastbound into Gulf of Oman towards Asia.'
    },

    // --- SATELLITE CONSTELLATION & ORBITAL PLATFORMS (SPACE) ---
    {
      id: 'space-iss-core',
      name: 'INTERNATIONAL SPACE STATION (ISS-2)',
      callsign: 'ALPHA-STATION',
      faction: 'NATO',
      domain: 'ORBITAL_STATION',
      securityLevel: 'UNCLASSIFIED',
      position: { lat: 28.5, lon: -80.5, altitudeKm: 420 },
      trajectoryType: 'ORBITAL',
      speedKnotsOrKms: 7.66,
      headingDeg: 51.6,
      modelTemplate: 'SPACE_STATION',
      colorHex: '#38bdf8',
      orbitParams: {
        orbitRadiusKm: 420,
        inclinationDeg: 51.6,
        periodHours: 1.55,
        phaseDeg: 45
      },
      aiBehavior: {
        mode: 'STATIONARY',
        alertStatus: 'DEFCON_5',
        ruleOfEngagement: 'Civilian scientific research and Earth observation platform'
      },
      sensors: { radarRangeKm: 300, opticalTracking: true, sigintActive: false, activeEmission: true },
      description: 'Manned modular space station in low Earth orbit; international laboratory.',
      intelNotes: 'Tracking visual passes over North America and Europe; telemetry downlinked via TDRSS.'
    },
    {
      id: 'space-tiangong-station',
      name: 'TIANGONG ORBITAL STATION (CSS)',
      callsign: 'HEAVENLY-PALACE',
      faction: 'CHN',
      domain: 'ORBITAL_STATION',
      securityLevel: 'UNCLASSIFIED',
      position: { lat: 10.0, lon: 110.0, altitudeKm: 390 },
      trajectoryType: 'ORBITAL',
      speedKnotsOrKms: 7.68,
      headingDeg: 41.5,
      modelTemplate: 'SPACE_STATION',
      colorHex: '#fb923c',
      orbitParams: {
        orbitRadiusKm: 390,
        inclinationDeg: 41.5,
        periodHours: 1.53,
        phaseDeg: 120
      },
      aiBehavior: {
        mode: 'STATIONARY',
        alertStatus: 'DEFCON_5',
        ruleOfEngagement: 'Chinese national manned space station and orbital laboratory'
      },
      sensors: { radarRangeKm: 350, opticalTracking: true, sigintActive: false, activeEmission: true },
      description: 'Three-module orbital complex (Tianhe, Wentian, Mengtian) hosting Shenzhou crews.',
      intelNotes: 'Equipped with robotic inspection arm and multi-spectrum Earth remote sensing suite.'
    },
    {
      id: 'space-usa-sbirs-geo5',
      name: 'SBIRS GEO-5 EARLY WARNING',
      callsign: 'SENTINEL-ORBIT-5',
      faction: 'USA',
      domain: 'SPACE_SATELLITE',
      securityLevel: 'TOP SECRET // SI-TK',
      position: { lat: 0.0, lon: -45.0, altitudeKm: 35786 },
      trajectoryType: 'ORBITAL',
      speedKnotsOrKms: 3.07,
      headingDeg: 0,
      modelTemplate: 'SATELLITE_GEO',
      colorHex: '#06b6d4',
      orbitParams: {
        orbitRadiusKm: 35786,
        inclinationDeg: 0.1,
        periodHours: 23.93,
        phaseDeg: 0
      },
      aiBehavior: {
        mode: 'SURVEILLANCE',
        alertStatus: 'DEFCON_2',
        engagementRadiusKm: 12000,
        ruleOfEngagement: 'Persistent global infrared scanning for strategic and theater ballistic missile launches'
      },
      sensors: { radarRangeKm: 0, opticalTracking: true, sigintActive: true, activeEmission: false },
      description: 'Space-Based Infrared System satellite in geostationary orbit; dual scanning/staring sensor.',
      intelNotes: 'Detects rocket booster plume thermal signatures within 3.5 seconds of first-stage ignition.'
    },
    {
      id: 'space-rus-cosmos-2558',
      name: 'COSMOS-2558 (INSPECTOR SATELLITE)',
      callsign: 'KREMLIN-EYE',
      faction: 'RUS',
      domain: 'SPACE_SATELLITE',
      securityLevel: 'COSMIC // BICES',
      position: { lat: 60.0, lon: 15.0, altitudeKm: 480 },
      trajectoryType: 'ORBITAL',
      speedKnotsOrKms: 7.62,
      headingDeg: 97.4,
      modelTemplate: 'SATELLITE_LEO',
      colorHex: '#ef4444',
      orbitParams: {
        orbitRadiusKm: 480,
        inclinationDeg: 97.4,
        periodHours: 1.57,
        phaseDeg: 210
      },
      aiBehavior: {
        mode: 'SHADOW',
        targetEntityId: 'space-usa-sbirs-geo5',
        engagementRadiusKm: 50,
        ruleOfEngagement: 'Co-planar orbital tracking and SIGINT inspection of Western classified payloads'
      },
      sensors: { radarRangeKm: 80, opticalTracking: true, sigintActive: true, activeEmission: false },
      description: 'Russian military co-orbital rendezvous and proximity operations (RPO) spacecraft.',
      intelNotes: 'Maneuvered within proximity of classified reconnaissance orbit in late 2024.'
    },
    {
      id: 'space-milstar-2-4',
      name: 'MILSTAR II-4 PROTECTED COMMS',
      callsign: 'CROSSBOW-4',
      faction: 'USA',
      domain: 'SPACE_SATELLITE',
      securityLevel: 'TOP SECRET // SI-TK',
      position: { lat: 0.0, lon: -120.0, altitudeKm: 35786 },
      trajectoryType: 'ORBITAL',
      speedKnotsOrKms: 3.07,
      headingDeg: 0,
      modelTemplate: 'SATELLITE_GEO',
      colorHex: '#06b6d4',
      orbitParams: {
        orbitRadiusKm: 35786,
        inclinationDeg: 0.2,
        periodHours: 23.93,
        phaseDeg: 180
      },
      aiBehavior: {
        mode: 'STATIONARY',
        alertStatus: 'DEFCON_1',
        ruleOfEngagement: 'Provide jam-resistant, nuclear-survivable strategic communications to NCA and SSBNs'
      },
      sensors: { radarRangeKm: 0, opticalTracking: false, sigintActive: true, activeEmission: true },
      description: 'EHF secure strategic communications satellite with cross-link inter-satellite routing.',
      intelNotes: 'Maintains Emergency Action Message (EAM) transmission channels to submerged submarine forces.'
    }
  ],
  narrativeEvents: [
    {
      timeSec: 10,
      title: 'GLOBAL SENSOR GRID SYNCHRONIZED',
      description: 'All strategic assets, maritime transits, and orbital constellations linked via quantum secure data bus.',
      alertLevel: 'DEFCON_4'
    },
    {
      timeSec: 45,
      title: 'GIUK GAP SOSUS CONTACT REPORT',
      description: 'Acoustic anomaly detected south of Iceland. K-317 Pantera tracking US carrier group acoustic baffle.',
      affectedEntityId: 'rus-akula-pantera',
      alertLevel: 'DEFCON_3'
    },
    {
      timeSec: 90,
      title: 'PACIFIC THEATER MISSILE EXERCISE DETECTED',
      description: 'SBIRS GEO-5 reports simulated IR booster ignition in East Asian proving grounds. Link-16 alert broadcast.',
      affectedEntityId: 'space-usa-sbirs-geo5',
      alertLevel: 'DEFCON_2'
    }
  ]
};
