import { ShipSensor } from '../types';

export interface TechFact {
  id: string;
  category: 'SHIP' | 'MISSILE' | 'GUIDANCE' | 'APOLLO';
  title: string;
  shortDesc: string;
  fullAnalysis: string;
  specTable?: { label: string; value: string }[];
  accentColor: string;
}

export const SHIP_SENSORS: ShipSensor[] = [
  {
    id: 'log-periodic-rx',
    name: 'Log Periodic Receiver Array',
    code: 'LP-RX-AFT',
    frequencyBand: '50 - 1000 MHz (VHF/UHF)',
    purpose: 'Wideband acquisition of downrange telemetry and RF stage beacon pings.',
    status: 'TRACKING',
    azimuth: 142.4,
    elevation: 28.5,
    signalDb: -78.4,
    xPercent: 14,
    yPercent: 44,
    details: 'Mounted aft. Receives continuous FM/FM frequency multiplexed telemetry from booster test packs and beacon transponders.'
  },
  {
    id: 'command-control',
    name: 'Command Control Dish Antenna',
    code: 'CMD-CTRL-AFT',
    frequencyBand: '400 - 450 MHz UHF Secure',
    purpose: 'Range Safety Destruct and Command link to test vehicles.',
    status: 'ONLINE',
    azimuth: 138.2,
    elevation: 32.1,
    signalDb: -64.2,
    xPercent: 23,
    yPercent: 46,
    details: 'High-power steerable parabolic dish for range flight termination commands and flight mode override.'
  },
  {
    id: 'c-band-tracker',
    name: 'C-Band Radar Tracking System',
    code: 'AN/FPS-16 MOD',
    frequencyBand: '5.4 - 5.9 GHz (C-Band)',
    purpose: 'High-precision radar skin and beacon tracking for exact trajectory coordinates.',
    status: 'TRACKING',
    azimuth: 139.7,
    elevation: 35.8,
    signalDb: -52.1,
    xPercent: 35,
    yPercent: 48,
    details: 'Monopulse tracking radar capable of measuring slant range, azimuth, and elevation with angular resolution of 0.1 mil.'
  },
  {
    id: 'star-tracker',
    name: 'Shipboard Optical Star Tracker',
    code: 'OST-DECK-CTR',
    frequencyBand: 'Visible / Near-IR Spectrum',
    purpose: 'Continuous celestial tracking to calibrate ship inertial navigation system (SINS).',
    status: 'TRACKING',
    azimuth: 210.5,
    elevation: 62.4,
    signalDb: 99.2, // Optical SNR
    xPercent: 44,
    yPercent: 55,
    details: 'Compensates for ship roll, pitch, and yaw on heavy ocean swells by locking onto stellar catalog landmarks.'
  },
  {
    id: 'unified-s-band',
    name: 'Unified S-Band (USB) 30ft Dish',
    code: 'USB-MAIN-30',
    frequencyBand: '2.1 - 2.3 GHz (S-Band)',
    purpose: 'Primary Apollo lunar spacecraft voice, biomedical data, trajectory tracking, and television.',
    status: 'TRACKING',
    azimuth: 140.1,
    elevation: 36.4,
    signalDb: -48.9,
    xPercent: 53,
    yPercent: 46,
    details: 'Combined carrier system carrying range, range-rate, voice communications, and telemetry on a single microwave frequency.'
  },
  {
    id: 'telemetry-array',
    name: 'Telemetry Array Antenna (30ft Dish)',
    code: 'TLM-MAIN-30',
    frequencyBand: '2.2 - 2.3 GHz (UHF/Telemetry)',
    purpose: 'Deep telemetry collection from post-boost vehicles and multi-channel re-entry instrumentation.',
    status: 'TRACKING',
    azimuth: 140.0,
    elevation: 36.2,
    signalDb: -51.3,
    xPercent: 63,
    yPercent: 49,
    details: 'Large high-gain parabolic reflector dedicated to high-bandwidth multi-track telemetry recording.'
  },
  {
    id: 'telemetry-test',
    name: 'Telemetry Calibration & Test Mast',
    code: 'TLM-TEST-CAL',
    frequencyBand: 'Test Synthesized Carrier',
    purpose: 'Internal RF loopback calibration and pre-launch signal validation.',
    status: 'STANDBY',
    azimuth: 0.0,
    elevation: 90.0,
    signalDb: -30.0,
    xPercent: 47,
    yPercent: 62,
    details: 'Simulates spacecraft and missile beacons for pre-pass lock calibration and receiver tuning.'
  },
  {
    id: 'chu-helical',
    name: 'CHU Helical HF/VHF Antenna Arrays',
    code: 'CHU-HEL-FWD',
    frequencyBand: '100 - 300 MHz Circular Polarization',
    purpose: 'Wide-beam telemetry acquisition during rapid staging and plasma sheath transitions.',
    status: 'ONLINE',
    azimuth: 144.0,
    elevation: 25.0,
    signalDb: -69.8,
    xPercent: 71,
    yPercent: 60,
    details: 'Circularly polarized helical antennas eliminate polarization fade when targets tumble or roll during staging.'
  },
  {
    id: 'log-periodic-tx',
    name: 'Log Periodic Transmitters (Forward Mast)',
    code: 'LP-TX-FWD',
    frequencyBand: 'HF / VHF Uplink',
    purpose: 'Long-range high-frequency relay to NASA Mission Control and Atlantic Fleet Command.',
    status: 'ONLINE',
    azimuth: 270.0,
    elevation: 15.0,
    signalDb: -42.0,
    xPercent: 88,
    yPercent: 32,
    details: 'Forward mast antenna ensuring unhindered over-the-horizon transmission to land stations.'
  }
];

export const TECHNICAL_DOSSIER: TechFact[] = [
  {
    id: 'vanguard-origin',
    category: 'SHIP',
    title: 'USNS Vanguard (T-AGM-19 / T-AG-194)',
    shortDesc: 'From WWII T2 Tanker to the premier Apollo tracking and Fleet Ballistic Missile test platform.',
    accentColor: '#38bdf8',
    fullAnalysis: `Originally launched during World War II in 1944 as the T2-SE-A2 fleet tanker SS Mission San Fernando (later USS/USNS Mission San Fernando AO-122), the ship underwent a profound conversion at General Dynamics Quincy Yard in 1965.\n\nCut in two and lengthened by inserting a massive 380-foot midsection, she emerged as USNS Vanguard (T-AGM-19)—a floating electronic city designed to close the critical "ocean telemetry gaps" in the Apollo Tracking Network.\n\nEquipped with massive 30-foot Unified S-Band and telemetry dishes, optical star tracker domes, and high-power C-Band tracking radars, Vanguard was stationed in the mid-Atlantic and Pacific. In 1980, she was redesignated T-AG-194 as a Navigational Test Launch Ship to support the UGM-133A Trident II ballistic missile guidance evolution, serving until December 1999.`,
    specTable: [
      { label: 'Original Vessel', value: 'SS Mission San Fernando (T2-SE-A2)' },
      { label: 'Length Over All', value: '595 ft (181.4 m)' },
      { label: 'Beam', value: '75 ft (22.9 m)' },
      { label: 'Full Displacement', value: '24,700 long tons' },
      { label: 'Propulsion', value: 'Steam turbine electric drive (10,000 shp)' },
      { label: 'Complement', value: '185 civilian mariners & 150+ engineers/scientists' },
      { label: 'Primary Tracking Antennas', value: '30ft S-Band, 30ft Telemetry, C-Band Radar, Optical Star Tracker' }
    ]
  },
  {
    id: 'trident-d5-architecture',
    category: 'MISSILE',
    title: 'UGM-133A Trident II (D5) Architecture',
    shortDesc: 'The apex of strategic naval deterrence: 3-stage solid propellant with aerospike technology.',
    accentColor: '#f59e0b',
    fullAnalysis: `The Trident II D5 was engineered to fit within the physical diameter of Ohio-class submarine tubes while delivering more than double the payload of Trident I with dramatically superior accuracy.\n\nTo achieve this, Lockheed and the Navy pioneered three major breakthroughs:\n1. Telescoping Aerospike: Because a blunt nose cone was required to pack up to 14 MIRV reentry vehicles into the length limit, an aerospike deploys from the nose immediately upon water broach. This spike forms a detached shock wave that cuts aerodynamic drag by 50%.\n2. NEPE-75 Propellant: A high-density propellant combining HMX, Aluminum, and Nitratopolyether ester plasticizers producing unprecedented specific impulse.\n3. Carbon Epoxy Motor Cases: Eliminating steel and titanium weight across all three stages.`,
    specTable: [
      { label: 'Length / Diameter', value: '44 ft (13.4 m) / 83 in (2.11 m)' },
      { label: 'Launch Mass', value: '130,000 lbs (58,500 kg)' },
      { label: 'Range', value: '4,000+ nm (7,360 km) to 12,000 km depending on payload' },
      { label: 'Propellant', value: '3-stage NEPE-75 Solid Fuel' },
      { label: 'Deployment Platform', value: 'US Ohio & Columbia class; UK Vanguard & Dreadnought class' },
      { label: 'Re-entry Vehicles', value: 'Mk 4 (W76 100kt) or Mk 5 (W88 475kt) MIRVs' }
    ]
  },
  {
    id: 'mk6-stellar-guidance',
    category: 'GUIDANCE',
    title: 'MK 6 Stellar-Inertial Guidance & Star Sighting',
    shortDesc: 'Eliminating accumulated inertial drift in mid-course via automated celestial navigation.',
    accentColor: '#10b981',
    fullAnalysis: `Even with ultra-precise beryllium electrostatically supported gyroscopes and pulse-integrating pendulum accelerometers, small guidance errors inevitably accumulate over a 4,000-mile flight.\n\nThe MK 6 guidance system on Trident II achieves historic sub-90-meter Circular Error Probable (CEP) by executing an automated mid-course star-sighting maneuver.\n\nWhile the Post-Boost Vehicle (PBV) coasts above the atmosphere, an optical star sensor peers through a dedicated optical quartz window, recognizes specific celestial constellation stars (such as Polaris, Vega, or Sirius), and measures their precise angles. The guidance computer runs an onboard Kalman filter comparing measured vs expected star angles, instantaneously zeroing out accumulated launch position errors and gyro precession drift before the MIRVs are deployed.`,
    specTable: [
      { label: 'Guidance Type', value: 'Stellar-Aided Inertial (Stellar-Inertial)' },
      { label: 'Accuracy (CEP)', value: '< 90 meters (silo-busting capability)' },
      { label: 'Sensor', value: 'Strapdown solid-state star tracker with optical quartz window' },
      { label: 'Drift Correction', value: 'Kalman filter resets inertial matrix prior to bus release' }
    ]
  },
  {
    id: 'bell-gss-gradiometer',
    category: 'GUIDANCE',
    title: 'Bell Aerospace Gravity Gradiometer System (GSS)',
    shortDesc: 'Solving the sub-surface "Deflection of the Vertical" to enable pinpoint submerged launches.',
    accentColor: '#ec4899',
    fullAnalysis: `Before a submarine can accurately launch a ballistic missile, it must know exactly where "true down" is. Mass anomalies in the Earth\'s crust—such as undersea mountains, oceanic trenches, and tectonic plates—warp the local gravity vector, creating a "Deflection of the Vertical".\n\nIf uncorrected, an unguided gyro platform launched from a submarine will mistake this tilted local gravity for the true center of the Earth, introducing substantial initial aiming errors.\n\nThe Bell Aerospace Gravity Gradiometer System (GSS) aboard naval test vessels and submarines measures the spatial gradients of the gravity tensor ($\\\\Gamma_{xx}, \\\\Gamma_{xy}, \\\\Gamma_{zz}$) in Eötvös units (1 Eötvös = $10^{-9} \\\\text{ s}^{-2}$). By comparing real-time gradiometry against bathymetric gravity maps, the ship computes the exact deflection angles $\\\\xi$ and $\\\\eta$, zeroing out orientation bias prior to missile tube pressurization.`,
    specTable: [
      { label: 'Manufacturer', value: 'Bell Aerospace (Textron) / US Navy SSP' },
      { label: 'Measurement Unit', value: 'Eötvös (1 E = 10^-9 m/s² per meter)' },
      { label: 'Parameters', value: '5 independent gravity gradient tensor components' },
      { label: 'Application', value: 'Bathymetric map-matching & Deflection of the Vertical correction' }
    ]
  },
  {
    id: 'four-knot-bubble-run',
    category: 'MISSILE',
    title: 'The 4-Knot Submerged Run & Steam Bubble Supercavitation',
    shortDesc: 'Cold-gas steam ejection dynamics and the protective bubble envelope shielding Trident from hydrodynamic cross-flow.',
    accentColor: '#06b6d4',
    fullAnalysis: `An Ohio-class submarine launches its ballistic missiles while maintaining continuous tactical stealth, cruising submerged at approximately 4 knots (~2 m/s) at depths of 120 to 150 feet.\n\nBecause the submarine is moving at 4 knots, a missile ejected raw into the ocean would suffer catastrophic cross-flow shear forces that would tilt or snap the missile body before broach.\n\nTo overcome this, the Trident launch mechanism employs a solid-propellant gas generator firing into a water chamber to flash-vaporize superheated steam. When the tube hatch opens and the steam charge fires, the missile is driven upward at ~25 m/s encased inside an expanding steam/gas bubble envelope (supercavitation cavity).\n\nThis gas envelope shields the missile skin from hydrodynamic water drag and cross-current shear. The missile ascends smoothly through the water column inside this bubble. The instant the nose cone penetrates the ocean surface (water broach), the gas bubble bursts with a tremendous cavitation shockwave. Once the base clears the surface and water sheds away (~0.8s after broach), the Stage 1 NEPE-75 solid motor ignites, and the aerospike telescopes outward to penetrate the supersonic shock front.`,
    specTable: [
      { label: 'Patrol Speed', value: '4.0 knots (~2.06 m/s) submerged' },
      { label: 'Ejection Mechanism', value: 'Gas-generator flash steam expansion' },
      { label: 'Protective Envelope', value: 'Supercavitating steam/gas cavity' },
      { label: 'Ejection Velocity', value: '~25 m/s through water column' },
      { label: 'Engine Kick-In Delay', value: '~0.8 sec after surface broach (upon bubble burst)' },
      { label: 'Stage 1 Motor', value: 'Hercules/Thiokol NEPE-75 solid propellant' }
    ]
  },
  {
    id: 'mirv-pbv-target-kill',
    category: 'GUIDANCE',
    title: 'Post-Boost Vehicle (PBV) & MIRV Hard-Target Silo Kill',
    shortDesc: 'How SINS and GSS calibration guide independent Reentry Vehicles (Mk 4/5) to crush hardened silos.',
    accentColor: '#f43f5e',
    fullAnalysis: `Following Stage 3 burnout at ~180 km altitude, the Post-Boost Vehicle (PBV) or "equipment section bus" takes over flight control. Using warm/cold hydrazine gas vernier thrusters, the PBV trims its attitude to establish the exact orbital trajectory.\n\nThe aerodynamic nose shroud splits and jettisons, exposing the internal MIRV Deployment Platform carrying multiple Mk 4 (W76 100kt) or Mk 5 (W88 455kt) nuclear reentry vehicles.\n\nTo deploy warheads onto separate targets, the PBV maneuvers, points its gimbaled thruster, and releases Warhead #1. It then burns verniers to offset its velocity vector, aims at the second target coordinates, and releases Warhead #2, repeating for all RVs.\n\nThe Crucial GSS SINS Effect: Hardened Soviet/Russian ICBM silos (such as SS-18 and SS-19 silos) are reinforced with massive concrete and steel spring-mounted capsules rated to withstand up to 2,000 PSI blast overpressure. To achieve a single-shot kill probability (Pk > 95%), the warhead must impact within a lethal radius of under 90 meters.\n\nWithout GSS calibration, uncompensated deflection of the vertical tilts the launch coordinate frame, dispersing warheads by 1,200 to 1,800 meters downrange—causing the silo overpressure to drop to under 40 PSI (silo survives, Pk < 20%). With GSS tensor calibration loaded into the submarine SINS, vertical deflection is zeroed to <0.08 arcseconds, locking terminal CEP under 40 meters and delivering >2,800 PSI directly onto the silo door (Pk > 99.4%).`,
    specTable: [
      { label: 'Bus Architecture', value: 'Gimbaled vernier PBV with cold/warm gas thrusters' },
      { label: 'Reentry Vehicles', value: 'Up to 8-12 Mk 4 (W76) or Mk 5 (W88) MIRVs' },
      { label: 'Target Silo Hardness', value: '2,000 PSI blast resistance' },
      { label: 'CEP With GSS', value: '≤ 38 - 75 meters (Direct Silo Kill)' },
      { label: 'CEP Without GSS', value: '1,200 - 1,800 meters (Silo Survives)' },
      { label: 'Kill Probability (Pk)', value: '99.4% (GSS Active) vs 18.2% (GSS Bypassed)' }
    ]
  },
  {
    id: 'apollo-tli-role',
    category: 'APOLLO',
    title: 'The Apollo Translunar Injection (TLI) Gap Filler',
    shortDesc: 'How USNS Vanguard secured critical telemetry when Apollo was out of reach of land stations.',
    accentColor: '#a855f7',
    fullAnalysis: `During the Apollo moon missions (including Apollo 8 and Apollo 11), the Saturn V spacecraft entered a low-Earth parking orbit before re-igniting its massive S-IVB third stage for Translunar Injection (TLI)—the burn that hurled astronauts towards the Moon.\n\nBecause orbital mechanics dictated that TLI often occurred over vast open oceans far from land tracking stations in Florida, Bermuda, or Spain, NASA relied on the Apollo Instrumentation Ships (USNS Vanguard, USNS Redstone, USNS Mercury) and eight Apollo Range Instrumentation Aircraft (ARIA).\n\nStationed in the Atlantic or Pacific, Vanguard\'s 30-foot Unified S-Band dish locked onto the spacecraft, maintaining continuous voice Capcom links, real-time electrocardiogram biosensors, engine telemetry, and velocity vectors. Astronauts heard: "Vanguard has acquisition!" confirming they were safely tracked as the Saturn S-IVB fired to lunar velocity.`,
    specTable: [
      { label: 'Missions Supported', value: 'Gemini, Apollo 7 through Apollo 17, Skylab' },
      { label: 'Critical Phase', value: 'Translunar Injection (TLI) & Orbital Insertion' },
      { label: 'Carrier Link', value: 'Unified S-Band (USB) 2.1 - 2.3 GHz uplink/downlink' },
      { label: 'Support Sister Ships', value: 'USNS Redstone (T-AGM-20), USNS Mercury (T-AGM-21)' }
    ]
  }
];

export const NAV_STARS = [
  { name: 'Polaris', designation: 'Alpha Ursae Minoris', magnitude: 1.98, rightAscension: '02h 31m', declination: '+89° 15′', x: 0.18, y: 0.22, matched: false },
  { name: 'Vega', designation: 'Alpha Lyrae', magnitude: 0.03, rightAscension: '18h 36m', declination: '+38° 47′', x: 0.52, y: 0.38, matched: false },
  { name: 'Sirius', designation: 'Alpha Canis Majoris', magnitude: -1.46, rightAscension: '06h 45m', declination: '-16° 42′', x: 0.78, y: 0.65, matched: false },
  { name: 'Arcturus', designation: 'Alpha Boötis', magnitude: -0.05, rightAscension: '14h 15m', declination: '+19° 10′', x: 0.35, y: 0.58, matched: false },
  { name: 'Rigel', designation: 'Beta Orionis', magnitude: 0.13, rightAscension: '05h 14m', declination: '-08° 12′', x: 0.82, y: 0.34, matched: false }
];
