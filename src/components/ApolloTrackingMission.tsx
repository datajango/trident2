import React, { useState, useEffect } from 'react';
import { soundFx } from '../audio/soundEngine';
import { ApolloThreeSim } from './ApolloThreeSim';
import { 
  Satellite, 
  Radio, 
  CheckCircle, 
  Volume2, 
  Heart, 
  Gauge, 
  Waves, 
  Play, 
  RotateCcw,
  Zap
} from 'lucide-react';

export const ApolloTrackingMission: React.FC = () => {
  const [missionPhase, setMissionPhase] = useState<'AWAITING_AOS' | 'CARRIER_LOCK' | 'SIVB_BURN' | 'TLI_COMPLETE'>('AWAITING_AOS');
  const [antennaAzimuth, setAntennaAzimuth] = useState<number>(135.0);
  const [antennaElevation, setAntennaElevation] = useState<number>(12.0);
  const [carrierLocked, setCarrierLocked] = useState<boolean>(false);
  const [signalDb, setSignalDb] = useState<number>(-95);
  const [heartRate, setHeartRate] = useState<number>(78);
  const [sivbChamberPressure, setSivbChamberPressure] = useState<number>(0);
  const [commLogs, setCommLogs] = useState<string[]>([
    'HOUSTON CAPCOM: USNS Vanguard, this is Houston. Apollo 11 approaching your Atlantic horizon.',
    'VANGUARD COMM: Houston, Vanguard copies. S-Band 30ft dish slewing to AOS azimuth 138°.'
  ]);

  // Mission simulation tick
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (carrierLocked && missionPhase === 'CARRIER_LOCK') {
      interval = setTimeout(() => {
        setMissionPhase('SIVB_BURN');
        setSivbChamberPressure(720); // psi
        setHeartRate(112);
        soundFx.startRocketRumble();
        soundFx.playCarrierLock();
        setCommLogs((prev) => [
          'SPACECRAFT (ARMSTRONG): Houston, Vanguard... Ignition! S-IVB burn is active. Good thrust.',
          'VANGUARD COMM: Houston, Vanguard has S-IVB telemetry lock. Chamber pressure 720 psi nominal.',
          ...prev
        ]);
      }, 4000);
    } else if (missionPhase === 'SIVB_BURN') {
      interval = setTimeout(() => {
        setMissionPhase('TLI_COMPLETE');
        setSivbChamberPressure(0);
        setHeartRate(88);
        soundFx.stopRocketRumble();
        soundFx.playStellarLock();
        setCommLogs((prev) => [
          'HOUSTON CAPCOM: Apollo 11, Houston copies. You are on your way to the Moon!',
          'VANGUARD COMM: S-IVB cutoff confirmed. Velocity 24,200 mph. Translunar Injection successful.',
          ...prev
        ]);
      }, 7000);
    }

    return () => {
      if (interval) clearTimeout(interval);
    };
  }, [carrierLocked, missionPhase]);

  const handleAcquireSignal = () => {
    soundFx.playClick();
    soundFx.playCarrierLock();
    setCarrierLocked(true);
    setMissionPhase('CARRIER_LOCK');
    setSignalDb(-48);
    setAntennaAzimuth(140.2);
    setAntennaElevation(38.5);
    setCommLogs((prev) => [
      'VANGUARD COMM: AOS! Acquisition of Signal confirmed on Unified S-Band (2287.5 MHz)!',
      'VANGUARD COMM: Houston, Vanguard has carrier lock. Voice, telemetry, and biomed links established.',
      ...prev
    ]);
  };

  const handleResetMission = () => {
    soundFx.playClick();
    soundFx.stopRocketRumble();
    setMissionPhase('AWAITING_AOS');
    setCarrierLocked(false);
    setSignalDb(-95);
    setAntennaAzimuth(135.0);
    setAntennaElevation(12.0);
    setSivbChamberPressure(0);
    setHeartRate(78);
    setCommLogs([
      'HOUSTON CAPCOM: USNS Vanguard, this is Houston. Apollo 11 approaching your Atlantic horizon.',
      'VANGUARD COMM: Houston, Vanguard copies. S-Band 30ft dish slewing to AOS azimuth 138°.'
    ]);
  };

  return (
    <div className="w-full flex flex-col gap-6 p-4 text-slate-100 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <Satellite className="w-4 h-4 text-purple-400" />
            <h2 className="text-base font-mono font-bold text-white tracking-wider">
              APOLLO 11 TRANSLUNAR INJECTION (TLI) OCEAN TRACKING PASS
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            USNS Vanguard (T-AGM-19) • Mid-Atlantic Ocean Gap Station • Unified S-Band (USB) 30-Foot Dish Terminal
          </p>
        </div>

        <button
          onClick={handleResetMission}
          className="px-3 py-1.5 rounded bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-300 font-mono text-xs cursor-pointer flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          RESET PASS
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: S-Band Dish & Telemetry Status */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 font-mono shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
              <span className="text-xs font-bold text-purple-400 flex items-center gap-2">
                <Radio className="w-4 h-4" />
                UNIFIED S-BAND 30-FT HIGH GAIN DISH
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                carrierLocked ? 'bg-emerald-950 border border-emerald-500 text-emerald-300' : 'bg-amber-950 border border-amber-600 text-amber-300'
              }`}>
                {carrierLocked ? 'CARRIER SYNCHRONIZED' : 'SEARCHING HORIZON'}
              </span>
            </div>

            {/* Apollo 3D Tracking Visualization */}
            <div className="relative h-64 bg-slate-900/60 rounded border border-slate-850 flex items-center justify-center overflow-hidden mb-4">
              <ApolloThreeSim missionPhase={missionPhase} />
              
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                <div className="bg-slate-950/80 border border-slate-700 px-2 py-1 rounded text-[10px] text-slate-300 font-bold">
                  AZ: {antennaAzimuth.toFixed(1)}° | EL: {antennaElevation.toFixed(1)}°
                </div>
              </div>

              {carrierLocked && (
                <div className="absolute top-2 right-2 bg-emerald-950/80 border border-emerald-500 px-2 py-1 rounded text-[10px] text-emerald-300 flex items-center gap-1 font-bold">
                  <CheckCircle className="w-3 h-3" />
                  USB DOWNLINK: -48.2 dBm
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {!carrierLocked ? (
              <button
                id="btn-acquire-apollo"
                onClick={handleAcquireSignal}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg"
              >
                <Zap className="w-4 h-4" />
                ACQUIRE APOLLO 11 S-BAND CARRIER (AOS)
              </button>
            ) : (
              <div className="p-3 bg-slate-900 rounded border border-slate-850 text-xs">
                <div className="text-slate-400 text-[10px] uppercase">FLIGHT STATUS:</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">
                  {missionPhase === 'CARRIER_LOCK' && 'SPACECRAFT COMMUNICATING • PREPARING TLI BURN'}
                  {missionPhase === 'SIVB_BURN' && '🚀 SATURN S-IVB THIRD STAGE TRANSLUNAR INJECTION BURN ACTIVE!'}
                  {missionPhase === 'TLI_COMPLETE' && '🌕 TLI BURN COMPLETE • APOLLO 11 EN ROUTE TO MOON'}
                </div>
              </div>
            )}
          </div>

          {/* Real-time Apollo Bio-Telemetry & Engine Instruments */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono shadow-md">
            <span className="text-xs font-bold text-slate-300 block mb-3 border-b border-slate-850 pb-1.5">
              TELEMETRY SENSOR MATRIX (DOWNLINKED TO VANGUARD)
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-850 flex items-center gap-3">
                <Heart className={`w-5 h-5 ${carrierLocked ? 'text-red-400 animate-pulse' : 'text-slate-600'}`} />
                <div>
                  <div className="text-slate-400 text-[10px]">COMMANDER HR</div>
                  <div className="font-bold text-white text-sm">{heartRate} BPM</div>
                </div>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-850 flex items-center gap-3">
                <Gauge className="w-5 h-5 text-amber-400" />
                <div>
                  <div className="text-slate-400 text-[10px]">S-IVB CHAMBER</div>
                  <div className="font-bold text-amber-300 text-sm">{sivbChamberPressure} PSI</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Audio / Teletype Communications Log */}
        <div className="lg:col-span-6 bg-slate-950 p-5 rounded-lg border border-slate-800 font-mono flex flex-col shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-3">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              CAPCOM &amp; TELEMETRY COMMUNICATIONS LOOP
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">VANGUARD-NET 1</span>
          </div>

          <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[360px] text-xs scrollbar-thin scrollbar-thumb-slate-800">
            {commLogs.map((log, idx) => {
              const isCapcom = log.includes('HOUSTON CAPCOM');
              const isVanguard = log.includes('VANGUARD');
              const isAstronaut = log.includes('SPACECRAFT');

              return (
                <div
                  key={idx}
                  className={`p-3 rounded border leading-relaxed ${
                    isAstronaut
                      ? 'bg-purple-950/40 border-purple-800 text-purple-200'
                      : isVanguard
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                      : isCapcom
                      ? 'bg-blue-950/40 border-blue-800 text-blue-200'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  {log}
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-slate-900/80 rounded border border-slate-850 text-xs font-sans text-slate-300 leading-normal">
            <strong>Historical Role:</strong> Without the USNS <em>Vanguard</em> positioned in the open ocean, Apollo mission controllers in Houston would have experienced an 18-minute communication blackout precisely when the Saturn S-IVB ignited to propel humanity to the lunar surface.
          </div>
        </div>
      </div>
    </div>
  );
};
