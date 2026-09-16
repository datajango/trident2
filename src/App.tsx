import React, { useState } from 'react';
import { ActiveStation, TelemetryData } from './types';
import { NavigationHeader } from './components/NavigationHeader';
import { ThreeFlightSimulator } from './components/ThreeFlightSimulator';
import { ShipTelemetryDeck } from './components/ShipTelemetryDeck';
import { StarTrackerGame } from './components/StarTrackerGame';
import { ApolloTrackingMission } from './components/ApolloTrackingMission';
import { GradiometerLab } from './components/GradiometerLab';
import { TechnicalDossier } from './components/TechnicalDossier';

import { TrackingNetworkMap } from './components/TrackingNetworkMap';

export default function App() {
  const [activeStation, setActiveStation] = useState<ActiveStation>('flight-sim');

  // Central Flight & Guidance Telemetry State
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    missionTime: 0,
    altitude: -0.045, // -45m submerged in Ohio-class launch tube
    velocity: 0,
    downrange: 0,
    stage: 'PRE_LAUNCH_4KT',
    fuelPercent: 100,
    pitchAngle: 90,
    yawAngle: 0,
    dynamicPressure: 0,
    inertialDrift: 18.4, // meters initial error
    starLockStatus: 'STANDBY',
    antennaSignalStrength: 92,
    carrierLock: true,
    gssEnabled: true,
    subSpeedKnots: 4.0,
    bubbleIntegrity: 100,
    sinsDeflectionArcsec: 0.08,
    targetMissMeters: 38,
    siloOverpressurePsi: 2850,
    targetKillProb: 99.4,
    telemetryStream: [
      'OHIO-CLASS SSBN CRUISING AT 4.0 KNOTS PATROL SPEED - TUBE #4 FLOOD EQUALIZED',
      'BELL GSS REAL-TIME TENSOR UPDATE LOADED TO SINS - DEFLECTION OF VERTICAL COMPENSATED (0.08")',
      'GAS GENERATOR STEAM EJECTION CHARGE ARMED - SUPERCAVITATING STEAM ENVELOPE READY'
    ]
  });

  const getLinkStatus = (): 'NOMINAL' | 'TRACKING' | 'ALERT' => {
    if (telemetry.stage === 'AEROSPIKE' || telemetry.stage === 'STAGE_1' || telemetry.stage === 'STAGE_2' || telemetry.stage === 'REENTRY_STREAK') {
      return 'TRACKING';
    }
    if (!telemetry.gssEnabled || telemetry.inertialDrift > 800) {
      return 'ALERT';
    }
    return 'NOMINAL';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navigation & Status Console */}
      <NavigationHeader
        activeStation={activeStation}
        onSelectStation={(st) => setActiveStation(st)}
        telemetryStatus={getLinkStatus()}
      />

      {/* Main Interactive Station Body */}
      <main className="flex-1 flex flex-col">
        {activeStation === 'flight-sim' && (
          <ThreeFlightSimulator
            telemetry={telemetry}
            setTelemetry={setTelemetry}
            onOpenStarTracker={() => setActiveStation('star-tracker')}
          />
        )}

        {activeStation === 'telemetry-deck' && (
          <ShipTelemetryDeck
            telemetryDistanceKm={telemetry.downrange}
            telemetryAltitudeKm={telemetry.altitude}
            telemetryVelocityMs={telemetry.velocity}
            telemetryStage={telemetry.stage}
            telemetryDynamicPressure={telemetry.dynamicPressure}
            missionTime={telemetry.missionTime}
            telemetryStream={telemetry.telemetryStream}
            antennaSignalStrength={telemetry.antennaSignalStrength}
            setTelemetry={setTelemetry}
          />
        )}

        {activeStation === 'star-tracker' && (
          <StarTrackerGame
            telemetry={telemetry}
            setTelemetry={setTelemetry}
          />
        )}

        {activeStation === 'apollo-mission' && (
          <ApolloTrackingMission />
        )}

        {activeStation === 'gradiometer-lab' && (
          <GradiometerLab />
        )}

        {activeStation === 'dossier' && (
          <TechnicalDossier />
        )}

        {activeStation === 'tracking-network' && (
          <TrackingNetworkMap />
        )}
      </main>

      {/* Military Telemetry Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-2.5 px-4 text-center text-xs font-mono text-slate-500 flex flex-wrap items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>USNS VANGUARD SPECIAL MISSIONS COMMAND</span>
          <span className="text-slate-700">•</span>
          <span>STRATEGIC SYSTEMS PROGRAMS (SSP)</span>
        </div>
        <div className="text-[11px] text-slate-400">
          APOLLO INSTRUMENTATION (T-AGM-19) / NAV TEST LAUNCH SHIP (T-AG-194)
        </div>
      </footer>
    </div>
  );
}
