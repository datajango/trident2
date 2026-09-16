import React, { useState, useEffect } from 'react';
import { ActiveStation } from '../types';
import { soundFx } from '../audio/soundEngine';
import { 
  Rocket, 
  Radio, 
  Sparkles, 
  Compass, 
  BookOpen, 
  Volume2, 
  VolumeX, 
  Satellite, 
  Waves,
  ShieldAlert,
  Globe
} from 'lucide-react';

interface NavigationHeaderProps {
  activeStation: ActiveStation;
  onSelectStation: (station: ActiveStation) => void;
  telemetryStatus: 'NOMINAL' | 'TRACKING' | 'ALERT';
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  activeStation,
  onSelectStation,
  telemetryStatus
}) => {
  const [zuluTime, setZuluTime] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const mins = String(now.getUTCMinutes()).padStart(2, '0');
      const secs = String(now.getUTCSeconds()).padStart(2, '0');
      const millis = String(Math.floor(now.getUTCMilliseconds() / 10)).padStart(2, '0');
      setZuluTime(`${hours}:${mins}:${secs}.${millis}Z`);
    };
    updateClock();
    const timer = setInterval(updateClock, 50);
    return () => clearInterval(timer);
  }, []);

  const handleStationClick = (station: ActiveStation) => {
    soundFx.playClick();
    onSelectStation(station);
  };

  const handleToggleMute = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      soundFx.playClick();
    }
  };

  const stations: { id: ActiveStation; label: string; sub: string; icon: React.ReactNode }[] = [
    {
      id: 'flight-sim',
      label: 'TRIDENT II SIM',
      sub: '3D Launch & Guidance',
      icon: <Rocket className="w-4 h-4 text-amber-400" />
    },
    {
      id: 'telemetry-deck',
      label: 'VANGUARD DECK',
      sub: 'T-AGM-19 Sensors & Radar',
      icon: <Radio className="w-4 h-4 text-emerald-400" />
    },
    {
      id: 'star-tracker',
      label: 'MK 6 CELESTIAL',
      sub: 'Star-Sighting Minigame',
      icon: <Sparkles className="w-4 h-4 text-cyan-400" />
    },
    {
      id: 'apollo-mission',
      label: 'APOLLO TLI PASS',
      sub: 'Ocean Gap Tracking',
      icon: <Satellite className="w-4 h-4 text-purple-400" />
    },
    {
      id: 'gradiometer-lab',
      label: 'BELL GSS LAB',
      sub: 'Gravity & Vertical Bias',
      icon: <Compass className="w-4 h-4 text-pink-400" />
    },
    {
      id: 'dossier',
      label: 'ARCHIVAL DOSSIER',
      sub: 'Blueprints & History',
      icon: <BookOpen className="w-4 h-4 text-blue-400" />
    },
    {
      id: 'tracking-network',
      label: 'GLOBAL NETWORK',
      sub: 'NASA / DOD Tracking',
      icon: <Globe className="w-4 h-4 text-emerald-400" />
    }
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur sticky top-0 z-50 text-slate-100 select-none shadow-md">
      {/* Top Banner Row */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-mono font-bold tracking-wider text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>USNS VANGUARD (T-AGM-19 / T-AG-194)</span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-400">FBM STRATEGIC SYSTEMS PROGRAM</span>
          </div>
        </div>

        <div className="flex items-center gap-4 font-mono text-[11px]">
          {/* Mission Zulu Time */}
          <div className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800 flex items-center gap-2">
            <span className="text-slate-400 uppercase tracking-widest text-[10px]">RANGE TIME:</span>
            <span className="text-emerald-400 font-bold tracking-wider">{zuluTime}</span>
          </div>

          {/* Telemetry Status */}
          <div className={`px-2.5 py-1 rounded border flex items-center gap-1.5 font-bold ${
            telemetryStatus === 'NOMINAL' 
              ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300' 
              : telemetryStatus === 'TRACKING'
              ? 'bg-cyan-950/50 border-cyan-800 text-cyan-300'
              : 'bg-amber-950/50 border-amber-800 text-amber-300'
          }`}>
            <Waves className="w-3.5 h-3.5" />
            <span>LINK: {telemetryStatus}</span>
          </div>

          {/* Sound Mute Button */}
          <button
            id="btn-sound-toggle"
            onClick={handleToggleMute}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border transition-colors cursor-pointer ${
              isMuted 
                ? 'bg-red-950/40 border-red-800 text-red-400 hover:bg-red-900/50' 
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750'
            }`}
            title={isMuted ? 'Unmute telemetry sound effects' : 'Mute sound effects'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isMuted ? 'AUDIO OFF' : 'AUDIO ON'}</span>
          </button>
        </div>
      </div>

      {/* Station Selector Bar */}
      <div className="max-w-7xl mx-auto px-3 py-2">
        <nav className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
          {stations.map((st) => {
            const isActive = activeStation === st.id;
            return (
              <button
                key={st.id}
                id={`nav-${st.id}`}
                onClick={() => handleStationClick(st.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-md transition-all text-left whitespace-nowrap cursor-pointer border ${
                  isActive
                    ? 'bg-slate-800/90 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.15)] text-white'
                    : 'bg-slate-900/50 border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className={`p-1.5 rounded ${isActive ? 'bg-slate-950/80' : 'bg-slate-900'}`}>
                  {st.icon}
                </div>
                <div>
                  <div className="font-mono text-xs font-bold tracking-wider flex items-center gap-1.5">
                    {st.label}
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans">{st.sub}</div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
