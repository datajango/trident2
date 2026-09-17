import {
  SimulationEntity,
  UnitVitals,
  SubsystemCapability,
  MissionPlan,
  MissionObjective,
  MissionDecisionRule
} from './types';

/**
 * Returns tailored domain-specific subsystems with operational, in-repair, and offline states.
 */
export function generateDefaultSubsystems(modelTemplate: string, domain: string): SubsystemCapability[] {
  if (domain === 'SUBSURFACE' || modelTemplate === 'SUBMARINE') {
    return [
      {
        id: 'sub-prop-nuclear',
        name: 'S9G Nuclear Propulsion Core',
        category: 'PROPULSION',
        state: 'OPERATIONAL',
        repairProgressPercent: 100,
        description: 'Pressurized water reactor driving natural circulation steam turbines.',
        powerDrawKw: 4200
      },
      {
        id: 'sub-sonar-bqq10',
        name: 'AN/BQQ-10 Sonar Spherical Array',
        category: 'RADAR_SENSORS',
        state: 'OPERATIONAL',
        repairProgressPercent: 100,
        description: 'Passive/active acoustic bow array for extreme range target detection.',
        powerDrawKw: 850
      },
      {
        id: 'sub-sonar-towed',
        name: 'TB-29A Thin-Line Towed Array Sonar',
        category: 'RADAR_SENSORS',
        state: 'REPAIRING',
        repairProgressPercent: 54,
        description: 'Reel-out acoustic array currently undergoing winch recalibration.',
        powerDrawKw: 420
      },
      {
        id: 'sub-weap-torpedo',
        name: 'Mk 48 Mod 7 CBASS Heavyweight Torpedo Tubes',
        category: 'WEAPONS_VLS',
        state: 'OPERATIONAL',
        repairProgressPercent: 100,
        description: 'Four 533mm swim-out tubes with broadband acoustic homing wire-guidance.',
        powerDrawKw: 600
      },
      {
        id: 'sub-weap-vls',
        name: 'Tactical VLS Tomahawk Strike Canisters',
        category: 'WEAPONS_VLS',
        state: 'OPERATIONAL',
        repairProgressPercent: 100,
        description: 'Twelve vertical launch cells for long-range precision land attack.',
        powerDrawKw: 350
      },
      {
        id: 'sub-stealth-tiles',
        name: 'Anechoic Acoustic Damping Tiles',
        category: 'STEALTH_SIGNATURE',
        state: 'OPERATIONAL',
        repairProgressPercent: 100,
        description: 'Synthetic rubber outer coating absorbing active enemy ping reflections.',
        powerDrawKw: 0
      },
      {
        id: 'sub-ew-decoy',
        name: 'ADC Mk 3 Acoustic Countermeasure Launcher',
        category: 'ELECTRONIC_WARFARE',
        state: 'OPERATIONAL',
        repairProgressPercent: 100,
        description: 'High-frequency acoustic masking noise generators & phantom echo decoys.',
        powerDrawKw: 280
      },
      {
        id: 'sub-comms-elf',
        name: 'ELF / Buoyant Cable Antenna (VLF/ELF)',
        category: 'COMMUNICATIONS',
        state: 'OFFLINE',
        repairProgressPercent: 0,
        description: 'Submerged antenna severed during depth maneuver; awaiting manual splicing.',
        powerDrawKw: 150
      }
    ];
  }

  if (domain === 'AIR_FORCE' || modelTemplate === 'BOMBER' || modelTemplate === 'FIGHTER' || modelTemplate === 'AWACS') {
    return [
      {
        id: 'air-prop-engines',
        name: 'F135-PW-100 Afterburning Turbofan',
        category: 'PROPULSION',
        state: 'OPERATIONAL',
        repairProgressPercent: 100,
        description: 'Twin vectoring turbofans providing high subsonic/supercruise thrust.',
        powerDrawKw: 3100
      },
      {
        id: 'air-radar-aesa',
        name: 'AN/APG-81 Active Electronically Scanned Array',
        category: 'RADAR_SENSORS',
        state: 'OPERATIONAL',
        repairProgressPercent: 100,
        description: 'Solid-state active phased array with synthetic aperture mapping & EW modes.',
        powerDrawKw: 1250
      },
      {
        id: 'air-weap-bay',
        name: 'Internal Rotary Launcher Bay (AMRAAM / JASSM-ER)',
        category: 'WEAPONS_VLS',
        state: 'OPERATIONAL',
        repairProgressPercent: 100,
        description: 'Stealth enclosure preventing radar reflections during weapon carriage.',
        powerDrawKw: 450
      },
      {
        id: 'air-ew-jamming',
        name: 'Next-Gen Jammer (NGJ-MB) Pods',
        category: 'ELECTRONIC_WARFARE',
        state: 'REPAIRING',
        repairProgressPercent: 68,
        description: 'Gallium-nitride beamforming array conducting automated cooling cycle.',
        powerDrawKw: 800
      },
      {
        id: 'air-stealth-ram',
        name: 'Radar-Absorbent Material (RAM) Composite Skin',
        category: 'STEALTH_SIGNATURE',
        state: 'OPERATIONAL',
        repairProgressPercent: 100,
        description: '0.0001 m² frontal radar cross-section multi-band stealth treatment.',
        powerDrawKw: 0
      },
      {
        id: 'air-comms-madds',
        name: 'MADL Low-Probability-of-Intercept Data Link',
        category: 'COMMUNICATIONS',
        state: 'OPERATIONAL',
        repairProgressPercent: 100,
        description: 'Directional Ku-band phased arrays communicating stealthily with strike package.',
        powerDrawKw: 220
      },
      {
        id: 'air-optics-eots',
        name: 'Electro-Optical Targeting System (EOTS)',
        category: 'RADAR_SENSORS',
        state: 'OFFLINE',
        repairProgressPercent: 0,
        description: 'FLIR sapphire optical window damaged by high-altitude ice shearing.',
        powerDrawKw: 340
      }
    ];
  }

  if (domain === 'SPACE_SATELLITE' || modelTemplate === 'SATELLITE_LEO' || modelTemplate === 'SATELLITE_GEO') {
    return [
      {
        id: 'sat-prop-ion',
        name: 'Hall-Effect Xenon Ion Thrusters',
        category: 'PROPULSION',
        state: 'OPERATIONAL',
        repairProgressPercent: 100,
        description: 'High specific-impulse electric thrusters for orbital station-keeping.',
        powerDrawKw: 350
      },
      {
        id: 'sat-sensor-optical',
        name: 'Sub-Meter Multispectral Optical Telescope',
        category: 'RADAR_SENSORS',
        state: 'OPERATIONAL',
        repairProgressPercent: 100,
        description: 'Cryo-cooled focal plane array with 0.15m ground sampling resolution.',
        powerDrawKw: 680
      },
      {
        id: 'sat-sigint-antenna',
        name: '30-Meter Deployable SIGINT Mesh Reflector',
        category: 'ELECTRONIC_WARFARE',
        state: 'OPERATIONAL',
        repairProgressPercent: 100,
        description: 'Wideband RF interception listening post tracking maritime comms & radars.',
        powerDrawKw: 920
      },
      {
        id: 'sat-power-solar',
        name: 'Ultra-Flex Gallium Arsenide Solar Wings',
        category: 'DAMAGE_CONTROL',
        state: 'REPAIRING',
        repairProgressPercent: 78,
        description: 'Gimbal micro-stepper motor resetting after solar flare anomaly.',
        powerDrawKw: 0
      },
      {
        id: 'sat-laser-comms',
        name: 'Free-Space Optical (Laser) Crosslink Array',
        category: 'COMMUNICATIONS',
        state: 'OPERATIONAL',
        repairProgressPercent: 100,
        description: '10 Gbps inter-satellite encrypted optical mesh uplink.',
        powerDrawKw: 190
      },
      {
        id: 'sat-decoy-flare',
        name: 'Anti-ASAT Laser Dazzler Countermeasure',
        category: 'STEALTH_SIGNATURE',
        state: 'OFFLINE',
        repairProgressPercent: 0,
        description: 'Blind-fire blinding laser unit offline due to thermal radiator leak.',
        powerDrawKw: 450
      }
    ];
  }

  // Default: Surface Navy (Carriers, Destroyers, Cruisers)
  return [
    {
      id: 'navy-prop-gas',
      name: 'LM2500+ Combined Gas Turbine Propulsion',
      category: 'PROPULSION',
      state: 'OPERATIONAL',
      repairProgressPercent: 100,
      description: 'Four gas turbines delivering 100,000 shp to twin controllable-pitch screws.',
      powerDrawKw: 7500
    },
    {
      id: 'navy-radar-spy6',
      name: 'AN/SPY-6(V)1 Air & Missile Defense Radar',
      category: 'RADAR_SENSORS',
      state: 'OPERATIONAL',
      repairProgressPercent: 100,
      description: 'Four-face Gallium Nitride (GaN) active phased array with integrated BMD tracking.',
      powerDrawKw: 3800
    },
    {
      id: 'navy-weap-vls',
      name: 'Mk 41 Baseline VII Vertical Launch System (96 Cells)',
      category: 'WEAPONS_VLS',
      state: 'OPERATIONAL',
      repairProgressPercent: 100,
      description: 'Tactical strike magazine loaded with SM-6, Tomahawk Block V, and LRASM.',
      powerDrawKw: 950
    },
    {
      id: 'navy-ew-slq32',
      name: 'AN/SLQ-32(V)7 Surface Electronic Warfare (SEWIP Block III)',
      category: 'ELECTRONIC_WARFARE',
      state: 'REPAIRING',
      repairProgressPercent: 62,
      description: 'High-power active beam electronic attack suite undergoing RF power tube bake-out.',
      powerDrawKw: 1600
    },
    {
      id: 'navy-sonar-sqq89',
      name: 'AN/SQQ-89(V)15 Integrated ASW Combat System',
      category: 'RADAR_SENSORS',
      state: 'OPERATIONAL',
      repairProgressPercent: 100,
      description: 'Hull-mounted bow array paired with multi-function towed array sonar.',
      powerDrawKw: 1100
    },
    {
      id: 'navy-defense-ciws',
      name: 'Phalanx Block 1B Close-In Weapon System (20mm FLIR)',
      category: 'WEAPONS_VLS',
      state: 'OPERATIONAL',
      repairProgressPercent: 100,
      description: 'Automated 4,500 rpm radar-guided Gatling cannon for terminal missile defense.',
      powerDrawKw: 420
    },
    {
      id: 'navy-comms-link16',
      name: 'Joint All-Domain Command & Control (JADC2 Link-16 / CEC)',
      category: 'COMMUNICATIONS',
      state: 'OPERATIONAL',
      repairProgressPercent: 100,
      description: 'Cooperative Engagement Capability sharing fire-control solutions fleet-wide.',
      powerDrawKw: 580
    },
    {
      id: 'navy-decoy-srbrc',
      name: 'Mk 53 NULKA Active Missile Decoy Hovering Rockets',
      category: 'ELECTRONIC_WARFARE',
      state: 'OFFLINE',
      repairProgressPercent: 0,
      description: 'Pneumatic decoy launcher port-side stuck in salt-crust lock; engineering crew tasked.',
      powerDrawKw: 120
    }
  ];
}

/**
 * Generates default vitals telemetry for a simulation entity.
 */
export function generateDefaultVitals(entity: SimulationEntity): UnitVitals {
  const isSub = entity.domain === 'SUBSURFACE';
  const isAir = entity.domain === 'AIR_FORCE';
  const isCarrier = entity.modelTemplate === 'CARRIER';
  const isSat = entity.domain === 'SPACE_SATELLITE';

  let maxAmmo = 96;
  let currentAmmo = 72;
  let rangeKm = 3200;

  if (isSub) {
    maxAmmo = 38;
    currentAmmo = 28;
    rangeKm = 18000; // Nuclear unlimited / limited by stores
  } else if (isAir) {
    maxAmmo = 16;
    currentAmmo = 14;
    rangeKm = 4500;
  } else if (isCarrier) {
    maxAmmo = 240;
    currentAmmo = 210;
    rangeKm = 24000;
  } else if (isSat) {
    maxAmmo = 0;
    currentAmmo = 0;
    rangeKm = 40000;
  }

  const subsystems = generateDefaultSubsystems(entity.modelTemplate, entity.domain);
  const hasInRepair = subsystems.some((s) => s.state === 'REPAIRING');

  return {
    healthPercent: 94,
    powerPercent: 97,
    fuelPercent: 86,
    ammoCount: currentAmmo,
    maxAmmo: maxAmmo,
    operationalRangeKm: rangeKm,
    operatingCondition: hasInRepair ? 'UNDER_REPAIR' : 'COMBAT_READY',
    isRepairing: true,
    repairRatePerSec: 0.8, // Increments repairProgressPercent smoothly during playback
    subsystems
  };
}

/**
 * Creates default sequential mission instructions with survival decision points.
 */
export function generateDefaultMissionPlan(entity: SimulationEntity): MissionPlan {
  const isSub = entity.domain === 'SUBSURFACE';
  const isAir = entity.domain === 'AIR_FORCE';

  // Base waypoint around current entity position
  const lat = entity.position?.lat ?? 0;
  const lon = entity.position?.lon ?? 0;

  const objectives: MissionObjective[] = [
    {
      id: `obj-1-${entity.id}`,
      stepNumber: 1,
      title: isSub ? 'INFILTRATE CHOKEPOINT PASSAGE' : isAir ? 'INGRESS HIGH-ALTITUDE CORRIDOR' : 'SURFACE TRANSIT TO BASTION',
      type: 'INFILTRATE',
      description: isSub
        ? 'Rig for silent running. Submerge to 250m depth beneath thermal inversion layer; minimize acoustic emissions.'
        : 'Transit stealth ingress vector. Radio emission silence (EMCON Alpha) until checkpoint Alpha reached.',
      targetCoord: { lat: lat + 2.5, lon: lon + 3.0, altitudeKm: isSub ? -0.25 : isAir ? 12.0 : 0 },
      estimatedDurationSec: 180,
      status: 'ACTIVE',
      decisionRules: [
        {
          id: `rule-1-1-${entity.id}`,
          title: 'GO/NO-GO: EMCON & SENSOR INTEGRITY',
          triggerCondition: 'GO_NO_GO_CHECK',
          ruleAction: 'INFILTRATE',
          ruleDescription: 'Confirm all active radar/radio beacons silenced. If signature leaked, abort to submerged loiter.',
          isTriggered: false
        },
        {
          id: `rule-1-2-${entity.id}`,
          title: 'RADAR LOCK DETECTED -> CONFOUND',
          triggerCondition: 'RADAR_SPIKE_DETECTED',
          ruleAction: 'CONFOUND',
          ruleDescription: 'If hostile search radar locks, immediately deploy active EW chaff & acoustic decoys to break track.',
          isTriggered: false
        }
      ]
    },
    {
      id: `obj-2-${entity.id}`,
      stepNumber: 2,
      title: 'RECON SWEEP & SENSOR SURVEILLANCE',
      type: 'RECON_SWEEP',
      description: 'Execute wide-aperture sweep of contested maritime sector. Classify and catalogue all unknown contacts.',
      targetCoord: { lat: lat + 4.0, lon: lon + 6.5, altitudeKm: isSub ? -0.12 : isAir ? 14.0 : 0 },
      estimatedDurationSec: 240,
      status: 'PENDING',
      decisionRules: [
        {
          id: `rule-2-1-${entity.id}`,
          title: 'HOSTILE NUMERICAL SUPERIORITY -> STAND AND HOLD',
          triggerCondition: 'HOSTILE_SUPERIORITY',
          ruleAction: 'STAND_AND_HOLD',
          ruleDescription: 'If 2+ hostile combatants identified, hold defensive line at chokepoint; do not advance alone.',
          targetFallbackCoord: { lat: lat + 3.0, lon: lon + 4.0, altitudeKm: 0 },
          isTriggered: false
        }
      ]
    },
    {
      id: `obj-3-${entity.id}`,
      stepNumber: 3,
      title: 'SHADOW HIGH-VALUE ADVERSARY FLOTILLA',
      type: 'SHADOW_TARGET',
      description: 'Maintain passive standoff tracking at 85 km perimeter. Relay targeting telemetry to allied fleet strike units.',
      targetCoord: { lat: lat + 5.2, lon: lon + 9.0, altitudeKm: isSub ? -0.18 : isAir ? 11.5 : 0 },
      estimatedDurationSec: 300,
      status: 'PENDING',
      decisionRules: [
        {
          id: `rule-3-1-${entity.id}`,
          title: 'HULL INTEGRITY COMPROMISED -> EVADE',
          triggerCondition: 'HEALTH_BELOW_40',
          ruleAction: 'EVADE',
          ruleDescription: 'If health falls below 40% under attack, break tracking immediately, engage flank speed and zig-zag evasive vectors.',
          isTriggered: false
        }
      ]
    },
    {
      id: `obj-4-${entity.id}`,
      stepNumber: 4,
      title: 'STAND AND HOLD DEFENSIVE PERIMETER',
      type: 'STAND_AND_HOLD',
      description: 'Anchor outer defensive perimeter. Intercept any missile or subsurface intrusions attempting to penetrate corridor.',
      targetCoord: { lat: lat + 4.5, lon: lon + 7.2, altitudeKm: 0 },
      estimatedDurationSec: 220,
      status: 'PENDING',
      decisionRules: [
        {
          id: `rule-4-1-${entity.id}`,
          title: 'AMMUNITION DEPLETED -> RETURN TO BASE',
          triggerCondition: 'AMMO_DEPLETED',
          ruleAction: 'RETURN_TO_BASE',
          ruleDescription: 'If VLS cells or torpedo inventory depleted to zero, break off and plot high-speed transit to home naval base.',
          targetFallbackCoord: { lat: lat, lon: lon, altitudeKm: 0 },
          isTriggered: false
        }
      ]
    },
    {
      id: `obj-5-${entity.id}`,
      stepNumber: 5,
      title: 'TACTICAL RETURN TO BASE (RTB)',
      type: 'RETURN_TO_BASE',
      description: 'Disengage from operational theater. Ingress friendly port/airfield approach corridor for replenishment.',
      targetCoord: { lat: lat, lon: lon, altitudeKm: 0 },
      estimatedDurationSec: 200,
      status: 'PENDING',
      decisionRules: [
        {
          id: `rule-5-1-${entity.id}`,
          title: 'BINGO FUEL CRITICAL WARNING',
          triggerCondition: 'FUEL_CRITICAL',
          ruleAction: 'RETURN_TO_BASE',
          ruleDescription: 'If fuel reserves drop below 20%, maximum economic cruise speed straight to nearest safe haven.',
          isTriggered: false
        }
      ]
    }
  ];

  return {
    id: `plan-${entity.id}`,
    title: `TACTICAL OPERATION: ${entity.callsign}-HORIZON`,
    doctrineName: isSub ? 'SILENT HUNTER / ACOUSTIC INTERCEPT' : isAir ? 'STEALTH PENETRATION & STRIKE' : 'EXPEDITIONARY FLEET DEFENSE',
    status: 'EXECUTING',
    currentObjectiveIndex: 0,
    objectives,
    missionLogs: [
      {
        simSec: 0,
        text: `Mission plan initialized for ${entity.name} [${entity.callsign}]. Operating condition: COMBAT READY.`,
        type: 'INFO'
      },
      {
        simSec: 2,
        text: `Step 1 engaged: ${objectives[0].title}. Decision points loaded into tactical flight computer.`,
        type: 'ACTION'
      }
    ]
  };
}

/**
 * Pre-defined tactical doctrine presets for rapid application.
 */
export const DOCTRINE_PRESETS: {
  id: string;
  name: string;
  description: string;
  generateObjectives: (entity: SimulationEntity) => MissionObjective[];
}[] = [
  {
    id: 'doctrine-pacific-hold',
    name: 'HOLD THE LINE: CHOKEPOINT BARRIER',
    description: 'Establish impenetrable defensive perimeter. Stand and hold position, engage hostiles, evade on heavy counter-fire.',
    generateObjectives: (entity) => {
      const lat = entity.position?.lat ?? 0;
      const lon = entity.position?.lon ?? 0;
      return [
        {
          id: `obj-hold-1-${Date.now()}`,
          stepNumber: 1,
          title: 'RAPID TRANSIT TO DEFENSIVE LINE',
          type: 'WAYPOINT_TRANSIT',
          description: 'Flank speed transit to the designated tactical barrier line.',
          targetCoord: { lat: lat + 1.5, lon: lon + 2.0, altitudeKm: 0 },
          estimatedDurationSec: 120,
          status: 'ACTIVE',
          decisionRules: [
            {
              id: `rule-trans-1`,
              title: 'MISSILE SPIKE -> EVADE',
              triggerCondition: 'RADAR_SPIKE_DETECTED',
              ruleAction: 'EVADE',
              ruleDescription: 'Deploy chaff/flares and evasive jinking if painted by targeting radar.',
              isTriggered: false
            }
          ]
        },
        {
          id: `obj-hold-2-${Date.now()}`,
          stepNumber: 2,
          title: 'STAND AND HOLD COMBAT PERIMETER',
          type: 'STAND_AND_HOLD',
          description: 'Form defensive line. Do not retreat; intercept all contacts violating the 100km cordon.',
          targetCoord: { lat: lat + 2.2, lon: lon + 3.5, altitudeKm: 0 },
          estimatedDurationSec: 360,
          status: 'PENDING',
          decisionRules: [
            {
              id: `rule-hold-1`,
              title: 'OUTNUMBERED -> CONFOUND & HOLD',
              triggerCondition: 'HOSTILE_SUPERIORITY',
              ruleAction: 'CONFOUND',
              ruleDescription: 'Activate saturation EW jamming to blind enemy targeting while maintaining defensive position.',
              isTriggered: false
            },
            {
              id: `rule-hold-2`,
              title: 'CATASTROPHIC DAMAGE -> EVADE',
              triggerCondition: 'HEALTH_BELOW_40',
              ruleAction: 'EVADE',
              ruleDescription: 'If health falls under 40%, disengage and retreat behind friendly air cover.',
              isTriggered: false
            }
          ]
        },
        {
          id: `obj-hold-3-${Date.now()}`,
          stepNumber: 3,
          title: 'TACTICAL RTB & AMMO RE-ARM',
          type: 'RETURN_TO_BASE',
          description: 'Proceed to replenishment tanker or naval anchorage.',
          targetCoord: { lat: lat, lon: lon, altitudeKm: 0 },
          estimatedDurationSec: 200,
          status: 'PENDING',
          decisionRules: [
            {
              id: `rule-rtb-1`,
              title: 'EMPTY VLS -> RTB',
              triggerCondition: 'AMMO_DEPLETED',
              ruleAction: 'RETURN_TO_BASE',
              ruleDescription: 'Immediate departure when magazine is empty.',
              isTriggered: false
            }
          ]
        }
      ];
    }
  },
  {
    id: 'doctrine-deep-infiltrate',
    name: 'GHOST INFILTRATE & CONFOUND',
    description: 'High-stealth infiltration deep behind contested corridors. Confound sensors with false targets and phantom echoes.',
    generateObjectives: (entity) => {
      const lat = entity.position?.lat ?? 0;
      const lon = entity.position?.lon ?? 0;
      return [
        {
          id: `obj-infil-1-${Date.now()}`,
          stepNumber: 1,
          title: 'SILENT INFILTRATION INGRESS',
          type: 'INFILTRATE',
          description: 'EMCON Alpha emission blackout. Drift along natural acoustic/thermal conduits.',
          targetCoord: { lat: lat + 3.0, lon: lon + 4.0, altitudeKm: 0 },
          estimatedDurationSec: 180,
          status: 'ACTIVE',
          decisionRules: [
            {
              id: `rule-infil-1`,
              title: 'GO / NO-GO SENSOR INTEGRITY',
              triggerCondition: 'GO_NO_GO_CHECK',
              ruleAction: 'INFILTRATE',
              ruleDescription: 'Abort ingress if passive acoustics detect active sonobuoy barrier.',
              isTriggered: false
            }
          ]
        },
        {
          id: `obj-infil-2-${Date.now()}`,
          stepNumber: 2,
          title: 'CONFOUND WITH ELECTRONIC DECOYS',
          type: 'CONFOUND_DECOY',
          description: 'Deploy acoustic noisemakers and RF repeaters to create multiple false contact signatures.',
          targetCoord: { lat: lat + 4.5, lon: lon + 6.0, altitudeKm: 0 },
          estimatedDurationSec: 240,
          status: 'PENDING',
          decisionRules: [
            {
              id: `rule-conf-1`,
              title: 'RADAR COUNTER-FIRE -> EVADE',
              triggerCondition: 'RADAR_SPIKE_DETECTED',
              ruleAction: 'EVADE',
              ruleDescription: 'High-speed deep dive / thermal evasion on contact.',
              isTriggered: false
            }
          ]
        },
        {
          id: `obj-infil-3-${Date.now()}`,
          stepNumber: 3,
          title: 'EGRESS TO SAFE HAVEN SECTOR',
          type: 'RETURN_TO_BASE',
          description: 'Exit theater through pre-cleared corridor.',
          targetCoord: { lat: lat, lon: lon, altitudeKm: 0 },
          estimatedDurationSec: 240,
          status: 'PENDING',
          decisionRules: [
            {
              id: `rule-egr-1`,
              title: 'BINGO FUEL -> RTB',
              triggerCondition: 'FUEL_CRITICAL',
              ruleAction: 'RETURN_TO_BASE',
              ruleDescription: 'Direct return to home port on low energy.',
              isTriggered: false
            }
          ]
        }
      ];
    }
  }
];
