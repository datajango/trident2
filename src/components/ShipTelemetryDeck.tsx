import React, { useState, useEffect, useRef } from 'react';
import { SHIP_SENSORS } from '../data/dossierData';
import { ShipSensor, TelemetryData } from '../types';
import { soundFx } from '../audio/soundEngine';
import { RadarScope } from './RadarScope';
import { AltitudeDownrangeD3Chart } from './AltitudeDownrangeD3Chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Radio, 
  Compass, 
  Activity, 
  Wifi, 
  Sliders, 
  Satellite, 
  Info,
  CheckCircle,
  AlertCircle,
  Clock,
  Play,
  FastForward,
  Rocket,
  Flame,
  Target
} from 'lucide-react';

interface ShipTelemetryDeckProps {
  telemetryDistanceKm: number;
  telemetryAltitudeKm: number;
  telemetryVelocityMs: number;
  telemetryStage: string;
  telemetryDynamicPressure: number;
  missionTime: number;
  telemetryStream?: string[];
  antennaSignalStrength?: number;
  setTelemetry?: React.Dispatch<React.SetStateAction<TelemetryData>>;
}

export const ShipTelemetryDeck: React.FC<ShipTelemetryDeckProps> = ({
  telemetryDistanceKm,
  telemetryAltitudeKm,
  telemetryVelocityMs,
  telemetryStage,
  telemetryDynamicPressure,
  missionTime,
  telemetryStream = [],
  antennaSignalStrength = 92,
  setTelemetry
}) => {
  const [sensors, setSensors] = useState<ShipSensor[]>(SHIP_SENSORS);
  const [selectedSensorId, setSelectedSensorId] = useState<string>('unified-s-band');
  const [seaStateRoll, setSeaStateRoll] = useState<number>(3.2); // degrees ship roll on Atlantic swells
  const [seaStatePitch, setSeaStatePitch] = useState<number>(1.8);
  const [qHistory, setQHistory] = useState<{ time: number, altitude: number, q: number }[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [telemetryStream]);

  useEffect(() => {
    if (missionTime > 0) {
      setQHistory((prev) => {
        // If time reset or jumped backwards, clear history
        if (prev.length > 0 && missionTime < prev[prev.length - 1].time) {
          return [{ time: missionTime, altitude: telemetryAltitudeKm, q: telemetryDynamicPressure }];
        }
        // Only keep data points during active atmospheric stages (altitude > 0 and < ~100km) or generally to avoid memory leaks
        const newHistory = [...prev, { time: missionTime, altitude: Math.max(0, telemetryAltitudeKm), q: telemetryDynamicPressure }];
        if (newHistory.length > 300) newHistory.shift();
        return newHistory;
      });
    } else {
      setQHistory([]);
    }
  }, [missionTime, telemetryAltitudeKm, telemetryDynamicPressure]);

  const selectedSensor = sensors.find((s) => s.id === selectedSensorId) || sensors[0];

  const handleSelectSensor = (id: string) => {
    soundFx.playClick();
    setSelectedSensorId(id);
  };

  const handleAdjustAngle = (deltaAz: number, deltaEl: number) => {
    soundFx.playClick();
    setSensors((prev) =>
      prev.map((s) => {
        if (s.id !== selectedSensorId) return s;
        const newAz = (s.azimuth + deltaAz + 360) % 360;
        const newEl = Math.min(90, Math.max(0, s.elevation + deltaEl));
        return { ...s, azimuth: Number(newAz.toFixed(1)), elevation: Number(newEl.toFixed(1)) };
      })
    );
  };

  const handleTriggerStage = (
    stage: string,
    time: number,
    alt: number,
    vel: number,
    q: number,
    logMsg: string,
    downrange: number = 0
  ) => {
    if (setTelemetry) {
      soundFx.playClick();
      setTelemetry((prev) => ({
        ...prev,
        missionTime: time,
        altitude: alt,
        velocity: vel,
        downrange: downrange !== undefined ? downrange : prev.downrange,
        stage: stage as TelemetryData['stage'],
        dynamicPressure: q,
        telemetryStream: [...prev.telemetryStream, logMsg]
      }));
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 p-4 text-slate-100 max-w-7xl mx-auto">
      {/* Station Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <h2 className="text-base font-mono font-bold text-white tracking-wider">
              USNS VANGUARD (T-AGM-19) INSTRUMENTATION &amp; SENSOR DECK
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Station Position: Mid-Atlantic Tracking Station 28°14′N 45°22′W • Gyro-Stabilized Platform Active
          </p>
        </div>

        {/* Sea State Compensation Readout */}
        <div className="flex items-center gap-4 font-mono text-xs bg-slate-900 px-3.5 py-2 rounded border border-slate-800">
          <div>
            <div className="text-[10px] text-slate-500">SEA STATE GYRO COMP</div>
            <div className="text-emerald-400 font-bold">
              ROLL: <span className="text-white">±{seaStateRoll}°</span> | PITCH: <span className="text-white">±{seaStatePitch}°</span>
            </div>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <div className="text-[10px] text-slate-500">OPTICAL STAR ZERO</div>
            <div className="text-cyan-400 font-bold">SYNCHRONIZED</div>
          </div>
        </div>
      </div>

      {/* Launch Timeline Controller */}
      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 shadow-xl flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-wider">Mission Timeline Override</h3>
          <span className="text-[10px] text-slate-500 ml-2 font-mono">(Telemetry Dashboard Simulation Control)</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button onClick={() => handleTriggerStage('PRE_LAUNCH_4KT', 0, -0.045, 0, 0, 'MANUAL OVERRIDE: RESET TO PRE-LAUNCH (T-0s)', 0)} className="flex-1 min-w-[120px] bg-slate-900 hover:bg-slate-800 border border-slate-700 p-2 rounded text-xs font-mono text-slate-300 flex flex-col items-center gap-1 transition-colors">
            <span className="text-slate-500 font-bold">T-0s</span>
            <span className="text-amber-400">PRE-LAUNCH</span>
          </button>
          
          <button onClick={() => handleTriggerStage('SUB_BUBBLE_EJECT', 2, -0.020, 15, 0, 'MANUAL OVERRIDE: STEAM EJECT INITIATED (T+2s)', 0.05)} className="flex-1 min-w-[120px] bg-slate-900 hover:bg-slate-800 border border-slate-700 p-2 rounded text-xs font-mono text-slate-300 flex flex-col items-center gap-1 transition-colors">
            <span className="text-slate-500 font-bold">T+2s</span>
            <span className="text-blue-400">STEAM EJECT</span>
          </button>

          <button onClick={() => handleTriggerStage('MOTOR_IGNITION', 5, 0.010, 25, 0, 'MANUAL OVERRIDE: FIRST STAGE IGNITION - SURFACE BROACH (T+5s)', 0.3)} className="flex-1 min-w-[120px] bg-slate-900 hover:bg-slate-800 border border-slate-700 p-2 rounded text-xs font-mono text-slate-300 flex flex-col items-center gap-1 transition-colors">
            <Flame className="w-3 h-3 text-orange-500 mb-0.5" />
            <span className="text-slate-500 font-bold">T+5s</span>
            <span className="text-orange-500">IGNITION</span>
          </button>

          <button onClick={() => handleTriggerStage('STAGE_1', 25, 15.5, 850, 35, 'MANUAL OVERRIDE: STAGE 1 FLIGHT - MAX Q APPROACHING (T+25s)', 18.5)} className="flex-1 min-w-[120px] bg-slate-900 hover:bg-slate-800 border border-slate-700 p-2 rounded text-xs font-mono text-slate-300 flex flex-col items-center gap-1 transition-colors">
            <Rocket className="w-3 h-3 text-slate-400 mb-0.5" />
            <span className="text-slate-500 font-bold">T+25s</span>
            <span className="text-slate-200">STAGE 1</span>
          </button>

          <button onClick={() => handleTriggerStage('STAGE_2', 65, 90.0, 3500, 2.1, 'MANUAL OVERRIDE: STAGE 1 SEPARATION, STAGE 2 IGNITION (T+65s)', 145)} className="flex-1 min-w-[120px] bg-slate-900 hover:bg-slate-800 border border-slate-700 p-2 rounded text-xs font-mono text-slate-300 flex flex-col items-center gap-1 transition-colors">
            <FastForward className="w-3 h-3 text-emerald-400 mb-0.5" />
            <span className="text-slate-500 font-bold">T+65s</span>
            <span className="text-emerald-400">STAGE 2</span>
          </button>

          <button onClick={() => handleTriggerStage('WARHEAD_RELEASE', 180, 1200, 7000, 0, 'MANUAL OVERRIDE: POST-BOOST VEHICLE - MIRV DEPLOYMENT (T+180s)', 3500)} className="flex-1 min-w-[120px] bg-slate-900 hover:bg-slate-800 border border-slate-700 p-2 rounded text-xs font-mono text-slate-300 flex flex-col items-center gap-1 transition-colors">
            <Satellite className="w-3 h-3 text-cyan-400 mb-0.5" />
            <span className="text-slate-500 font-bold">T+180s</span>
            <span className="text-cyan-400">MIRV DEPLOY</span>
          </button>

          <button onClick={() => handleTriggerStage('TARGET_IMPACT', 1800, 0.0, 4000, 0, 'MANUAL OVERRIDE: TERMINAL REENTRY - TARGET IMPACT (T+1800s)', 7450)} className="flex-1 min-w-[120px] bg-slate-900 hover:bg-slate-800 border border-slate-700 p-2 rounded text-xs font-mono text-slate-300 flex flex-col items-center gap-1 transition-colors">
            <Target className="w-3 h-3 text-red-500 mb-0.5" />
            <span className="text-slate-500 font-bold">T+1800s</span>
            <span className="text-red-500">TERMINAL</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Ship Profile Section (Diagram Recreated from vanguard6-h04.jpg) */}
      <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4 font-mono text-xs">
          <span className="text-amber-400 font-bold tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4" />
            TOP DECK SENSOR ARRAY SCHEMATIC (INTERACTIVE)
          </span>
          <span className="text-slate-400 text-[11px]">
            SELECT AN ANTENNA ON THE HULL TO INSPECT RF LINK &amp; GIMBALS
          </span>
        </div>

        {/* Schematic Canvas with Annotated Nodes */}
        <div className="relative w-full bg-slate-900/60 rounded-lg border border-slate-850 p-6 overflow-x-auto min-h-[300px] flex items-center justify-center">
          {/* Detailed SVG Profile of USNS Vanguard Hull */}
          <div className="relative w-[900px] h-[240px] shrink-0">
            <svg viewBox="0 0 900 240" className="w-full h-full drop-shadow-md">
              <defs>
                <linearGradient id="hullGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>
                <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0369a1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#082f49" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {/* Water Line */}
              <rect x="0" y="195" width="900" height="45" fill="url(#oceanGrad)" />
              <path d="M0,195 Q 450,192 900,195" stroke="#38bdf8" strokeWidth="1.5" fill="none" opacity="0.6" />

              {/* Vanguard Hull Body */}
              <path
                d="M 60,185 
                   L 80,140 
                   L 220,138 
                   L 320,145 
                   L 600,145 
                   L 670,120 
                   L 710,120 
                   L 715,100 
                   L 740,100 
                   L 750,135 
                   L 820,140 
                   L 860,175 
                   L 855,195 
                   L 70,195 Z"
                fill="url(#hullGrad)"
                stroke="#64748b"
                strokeWidth="2"
              />

              {/* Portholes and Superstructure lines */}
              <line x1="120" y1="165" x2="800" y2="165" stroke="#475569" strokeWidth="1" strokeDasharray="6,6" />
              <circle cx="100" cy="165" r="3" fill="#cbd5e1" opacity="0.7" />
              <circle cx="125" cy="165" r="3" fill="#cbd5e1" opacity="0.7" />
              <circle cx="150" cy="165" r="3" fill="#cbd5e1" opacity="0.7" />
              <circle cx="780" cy="165" r="3" fill="#cbd5e1" opacity="0.7" />
              <circle cx="805" cy="165" r="3" fill="#cbd5e1" opacity="0.7" />

              {/* Hull Designation */}
              <text x="810" y="185" fill="#f8fafc" fontSize="11" fontFamily="monospace" fontWeight="bold">
                T-AGM-19
              </text>
              <text x="130" y="185" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                VANGUARD
              </text>

              {/* Antenna Masts & Dishes Representation */}
              {/* 1. Log Periodic Receiver (Aft) */}
              <line x1="130" y1="138" x2="130" y2="70" stroke="#94a3b8" strokeWidth="2.5" />
              <line x1="100" y1="70" x2="160" y2="70" stroke="#94a3b8" strokeWidth="2" />
              <line x1="110" y1="80" x2="150" y2="80" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="120" y1="90" x2="140" y2="90" stroke="#94a3b8" strokeWidth="1.5" />

              {/* 2. Command Control Dish (Aft Deck) */}
              <rect x="200" y="125" width="22" height="15" fill="#475569" />
              <line x1="211" y1="125" x2="211" y2="85" stroke="#94a3b8" strokeWidth="3" />
              <path d="M 195,85 A 18 18 0 0 1 227,85" stroke="#cbd5e1" strokeWidth="3" fill="none" />

              {/* 3. C-Band Tracker Dish */}
              <rect x="310" y="132" width="25" height="14" fill="#475569" />
              <line x1="322" y1="132" x2="322" y2="95" stroke="#94a3b8" strokeWidth="3" />
              <path d="M 305,95 A 20 20 0 0 1 339,95" stroke="#38bdf8" strokeWidth="3.5" fill="none" />

              {/* 4. Optical Star Tracker Dome */}
              <rect x="385" y="135" width="35" height="12" fill="#475569" />
              <path d="M 390,135 A 15 15 0 0 1 415,135" fill="#f8fafc" stroke="#38bdf8" strokeWidth="2" />

              {/* 5. Unified S-Band (USB) 30-Foot Dish */}
              <rect x="470" y="132" width="35" height="14" fill="#475569" />
              <line x1="487" y1="132" x2="487" y2="82" stroke="#e2e8f0" strokeWidth="4" />
              <path d="M 458,82 A 32 32 0 0 1 516,82" stroke="#10b981" strokeWidth="4.5" fill="none" />

              {/* 6. Telemetry 30-Foot Dish */}
              <rect x="560" y="132" width="35" height="14" fill="#475569" />
              <line x1="577" y1="132" x2="577" y2="84" stroke="#e2e8f0" strokeWidth="4" />
              <path d="M 548,84 A 32 32 0 0 1 606,84" stroke="#f59e0b" strokeWidth="4.5" fill="none" />

              {/* 7. Bridge & Forward Superstructure */}
              <rect x="660" y="70" width="40" height="70" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
              <rect x="670" y="55" width="20" height="15" fill="#475569" />

              {/* 8. CHU Helical HF Antennas */}
              <line x1="640" y1="140" x2="640" y2="105" stroke="#cbd5e1" strokeWidth="2" />
              <circle cx="640" cy="100" r="4" fill="#ec4899" />

              {/* 9. Log Periodic Transmitters (Forward Mast) */}
              <line x1="790" y1="140" x2="790" y2="45" stroke="#cbd5e1" strokeWidth="3" />
              <line x1="770" y1="50" x2="810" y2="50" stroke="#cbd5e1" strokeWidth="2" />
              <line x1="775" y1="65" x2="805" y2="65" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="780" y1="80" x2="800" y2="80" stroke="#cbd5e1" strokeWidth="1.5" />
            </svg>

            {/* Clickable Interactive Hotspots */}
            {sensors.map((s) => {
              const isSelected = s.id === selectedSensorId;
              return (
                <button
                  key={s.id}
                  id={`hotspot-${s.id}`}
                  onClick={() => handleSelectSensor(s.id)}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-lg ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 scale-110 border-2 border-white ring-4 ring-amber-500/40 z-20'
                      : 'bg-slate-900/90 text-slate-200 border border-slate-700 hover:border-amber-400 hover:text-white z-10'
                  }`}
                  style={{ left: `${s.xPercent}%`, top: `${s.yPercent}%` }}
                >
                  <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-slate-950' : 'bg-emerald-400'}`}></span>
                  <span>{s.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two Columns: Radar Scope + Selected Sensor Gimbals / RF Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Scope Column */}
        <div className="lg:col-span-5">
          <RadarScope
            targetDistanceKm={telemetryDistanceKm}
            targetAltitudeKm={telemetryAltitudeKm}
            targetVelocityMs={telemetryVelocityMs}
            targetStage={telemetryStage}
          />
        </div>

        {/* Selected Sensor Station Terminal */}
        <div className="lg:col-span-7 flex flex-col gap-4 bg-slate-950 p-5 rounded-lg border border-slate-800 shadow-xl font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="text-[10px] text-amber-400 font-bold tracking-widest uppercase">
                ACTIVE SENSOR STATION
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">{selectedSensor.name}</h3>
              <div className="text-xs text-slate-400 font-sans mt-0.5">{selectedSensor.code}</div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-600 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                STATUS: {selectedSensor.status}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 font-sans leading-relaxed bg-slate-900/60 p-3 rounded border border-slate-850">
            {selectedSensor.details}
          </p>

          {/* Operational Metrics */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-900/80 p-3 rounded border border-slate-850">
              <span className="text-slate-400 text-[10px]">FREQUENCY BAND</span>
              <div className="font-bold text-cyan-300 text-xs mt-1 truncate">
                {selectedSensor.frequencyBand}
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded border border-slate-850">
              <span className="text-slate-400 text-[10px]">AZIMUTH ANGLE</span>
              <div className="font-bold text-amber-400 text-sm mt-1">
                {selectedSensor.azimuth.toFixed(1)}°
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded border border-slate-850">
              <span className="text-slate-400 text-[10px]">ELEVATION ANGLE</span>
              <div className="font-bold text-emerald-400 text-sm mt-1">
                {selectedSensor.elevation.toFixed(1)}°
              </div>
            </div>
          </div>

          {/* Manual Antenna Gimbal Slewing Controls */}
          <div className="p-3 bg-slate-900/80 rounded border border-slate-850 flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              SERVO MOTOR GIMBAL MANUAL SLEW
            </span>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">AZIMUTH:</span>
                <button
                  onClick={() => handleAdjustAngle(-2, 0)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded cursor-pointer"
                >
                  -2°
                </button>
                <button
                  onClick={() => handleAdjustAngle(2, 0)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded cursor-pointer"
                >
                  +2°
                </button>
              </div>

              <div className="h-4 w-px bg-slate-700 mx-1" />

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">ELEVATION:</span>
                <button
                  onClick={() => handleAdjustAngle(0, -2)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded cursor-pointer"
                >
                  -2°
                </button>
                <button
                  onClick={() => handleAdjustAngle(0, 2)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded cursor-pointer"
                >
                  +2°
                </button>
              </div>
            </div>
          </div>

          {/* RF Signal Visualization (SNR Radial Gauge + Spectrum) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Radial SNR Gauge */}
            <div className="p-3 bg-slate-900/60 rounded border border-slate-850 flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0 drop-shadow-lg">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle
                    cx="50" cy="50" r="38"
                    fill="transparent"
                    stroke="#1e293b"
                    strokeWidth="12"
                  />
                  <circle
                    cx="50" cy="50" r="38"
                    fill="transparent"
                    stroke={antennaSignalStrength > 75 ? '#10b981' : antennaSignalStrength > 40 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="12"
                    strokeDasharray={`${2 * Math.PI * 38}`}
                    strokeDashoffset={`${(2 * Math.PI * 38) * (1 - Math.max(0, Math.min(100, antennaSignalStrength)) / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-in-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                  <Wifi className={`w-4 h-4 ${antennaSignalStrength > 75 ? 'text-emerald-400' : antennaSignalStrength > 40 ? 'text-amber-400' : 'text-red-400'}`} />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-mono tracking-widest">SIGNAL TO NOISE</span>
                <span className={`text-2xl font-bold font-mono ${antennaSignalStrength > 75 ? 'text-emerald-400' : antennaSignalStrength > 40 ? 'text-amber-400' : 'text-red-400'}`}>
                  {antennaSignalStrength.toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                  MARGIN: {(antennaSignalStrength / 3.14).toFixed(1)} dB
                </span>
              </div>
            </div>

            {/* Carrier Spectrum Visualization */}
            <div className="p-3 bg-slate-900/60 rounded border border-slate-850 flex flex-col justify-between">
              <div className="flex justify-between items-center text-[10px] text-slate-400 mb-2">
                <span className="tracking-widest">CARRIER SPECTRUM</span>
                <span className="text-emerald-400 font-bold font-mono">{selectedSensor.signalDb} dBm</span>
              </div>
              {/* Simulated spectrum bar graph responding to signal strength */}
              <div className="flex items-end gap-1 h-10 w-full px-1">
                {[20, 35, 48, 65, 85, 95, 82, 54, 38, 25, 18, 12, 8].map((val, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 rounded-t transition-all duration-300 ${
                      idx === 5 ? 'bg-emerald-400' : idx > 3 && idx < 7 ? 'bg-emerald-600' : 'bg-slate-700'
                    }`}
                    style={{ height: `${val * (Math.max(10, antennaSignalStrength) / 100)}%` }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-2">
            {/* Dynamic Pressure (Q) vs Altitude Graph */}
            <div className="p-3 bg-slate-900/60 rounded border border-slate-850">
              <div className="flex justify-between items-center text-[10px] text-slate-400 mb-2">
                <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-amber-400" /> DYNAMIC PRESSURE (Q)</span>
                <span className="text-amber-400 font-bold">MAX Q</span>
              </div>
              <div className="h-44 w-full mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={qHistory} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis 
                      dataKey="altitude" 
                      stroke="#64748b" 
                      fontSize={10} 
                      tickFormatter={(val) => `${val.toFixed(0)}km`}
                      type="number"
                      domain={['auto', 'auto']}
                      tickCount={6}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={10} 
                      tickFormatter={(val) => `${val.toFixed(0)}`}
                      domain={[0, 50]}
                      tickCount={6}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }}
                      itemStyle={{ color: '#fbbf24' }}
                      labelFormatter={(label) => `Altitude: ${Number(label).toFixed(1)} km`}
                      formatter={(value: number) => [value.toFixed(1) + ' kPa', 'Dyn Pressure (Q)']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="q" 
                      stroke="#fbbf24" 
                      strokeWidth={2} 
                      dot={false}
                      isAnimationActive={false}
                      name="Q (kPa)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* GSS Correction Trajectory Graph */}
            <div className="p-3 bg-slate-900/60 rounded border border-slate-850">
              <div className="flex justify-between items-center text-[10px] text-slate-400 mb-2">
                <span className="flex items-center gap-1.5"><Compass className="w-3.5 h-3.5 text-blue-400" /> GSS CORRECTION TRAJECTORY</span>
                <span className="text-blue-400 font-bold">CEP: ≤38m</span>
              </div>
              <div className="h-44 w-full mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis 
                      dataKey="downrange" 
                      stroke="#64748b" 
                      fontSize={10} 
                      tickFormatter={(val) => `${val}km`}
                      type="number"
                      domain={[0, 8000]}
                      tickCount={5}
                      allowDataOverflow
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={10} 
                      tickFormatter={(val) => `${val}`}
                      domain={[0, 1500]}
                      tickCount={4}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }}
                      labelFormatter={(label) => `Downrange: ${Number(label).toFixed(0)} km`}
                    />
                    <Line 
                      data={Array.from({ length: 50 }, (_, i) => {
                        const x = i * 160;
                        const alt = 4 * 1200 * (x / 7500) * (1 - (x / 7500));
                        return { downrange: x, alt: alt >= 0 ? alt : null };
                      })}
                      type="monotone" 
                      dataKey="alt" 
                      stroke="#10b981" 
                      strokeWidth={2} 
                      dot={false}
                      isAnimationActive={false}
                      name="With GSS (Corrected)"
                    />
                    <Line 
                      data={Array.from({ length: 50 }, (_, i) => {
                        const x = i * 160;
                        const alt = 4 * 1230 * (x / 7800) * (1 - (x / 7800));
                        return { downrange: x, alt: alt >= 0 ? alt : null };
                      })}
                      type="monotone" 
                      dataKey="alt" 
                      stroke="#ef4444" 
                      strokeWidth={2} 
                      strokeDasharray="4 4"
                      dot={false}
                      isAnimationActive={false}
                      name="Without GSS (Uncorrected)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Altitude vs Downrange D3 Tracking Chart */}
      <AltitudeDownrangeD3Chart
        currentAltitudeKm={telemetryAltitudeKm}
        currentDownrangeKm={telemetryDistanceKm}
        velocityMs={telemetryVelocityMs}
        missionTime={missionTime}
        stage={telemetryStage}
      />

      {/* Scrolling Telemetry Event Log */}
      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 shadow-xl flex flex-col h-64">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-wider">Mission Event Log</h3>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">Live Feed</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto font-mono text-[11px] md:text-xs text-slate-300 pr-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <ul className="flex flex-col gap-2">
            {telemetryStream.map((log, index) => (
              <li key={index} className="flex gap-3 items-start bg-slate-900/50 p-2 rounded border border-slate-800/50">
                <span className="text-slate-500 shrink-0">
                  T+{Math.max(0, missionTime - (telemetryStream.length - index) * 0.5).toFixed(1)}s
                </span>
                <span className="text-slate-200 leading-relaxed">{log}</span>
              </li>
            ))}
            <div ref={logEndRef} />
          </ul>
        </div>
      </div>

    </div>
  );
};
