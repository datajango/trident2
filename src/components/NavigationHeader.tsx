import React, { useState, useEffect, useRef } from 'react';
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
  Globe,
  ChevronDown,
  Layers,
  Activity,
  Menu,
  X,
  Check,
  ExternalLink
} from 'lucide-react';

interface NavigationHeaderProps {
  activeStation: ActiveStation;
  onSelectStation: (station: ActiveStation) => void;
  telemetryStatus: 'NOMINAL' | 'TRACKING' | 'ALERT';
}

interface StationItem {
  id: ActiveStation;
  label: string;
  sub: string;
  badge: string;
  icon: React.ReactNode;
}

interface StationCategory {
  id: string;
  name: string;
  shortName: string;
  badge: string;
  stations: StationItem[];
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  activeStation,
  onSelectStation,
  telemetryStatus
}) => {
  const [zuluTime, setZuluTime] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const headerRef = useRef<HTMLElement>(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStationClick = (station: ActiveStation) => {
    soundFx.playClick();
    onSelectStation(station);
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  };

  const handleToggleMute = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      soundFx.playClick();
    }
  };

  // 3 Distinct Functional Layers / Categories
  const categories: StationCategory[] = [
    {
      id: 'flight-ops',
      name: 'FLIGHT & LAUNCH',
      shortName: 'FLIGHT',
      badge: 'FBM D5',
      stations: [
        {
          id: 'flight-sim',
          label: 'TRIDENT II SIMULATOR',
          sub: '3D Submerged Ejection, Boost & MIRVs',
          badge: '3D REAL-TIME',
          icon: <Rocket className="w-4 h-4 text-amber-400" />
        },
        {
          id: 'gradiometer-lab',
          label: 'BELL GSS GRADIOMETER',
          sub: 'Gravity Tensor & Deflection of Vertical',
          badge: 'SINS BIAS',
          icon: <Compass className="w-4 h-4 text-pink-400" />
        }
      ]
    },
    {
      id: 'tracking-telemetry',
      name: 'TRACKING & SENSORS',
      shortName: 'TRACKING',
      badge: 'T-AGM-19',
      stations: [
        {
          id: 'telemetry-deck',
          label: 'VANGUARD TELEMETRY DECK',
          sub: 'C-Band Radar, Sensor Fusion & Stream',
          badge: 'PRIMARY RADAR',
          icon: <Radio className="w-4 h-4 text-emerald-400" />
        },
        {
          id: 'tracking-network',
          label: 'GLOBAL TRACKING NETWORK',
          sub: 'NASA STDN & DOD Global Range Map',
          badge: 'WORLDWIDE',
          icon: <Globe className="w-4 h-4 text-cyan-400" />
        },
        {
          id: 'apollo-mission',
          label: 'APOLLO TLI PASS',
          sub: 'Trans-Lunar Ocean Gap Mission Relay',
          badge: 'NASA 1969',
          icon: <Satellite className="w-4 h-4 text-purple-400" />
        }
      ]
    },
    {
      id: 'guidance-intel',
      name: 'OPTICS & ARCHIVES',
      shortName: 'OPTICS',
      badge: 'MK 6 SSP',
      stations: [
        {
          id: 'star-tracker',
          label: 'MK 6 CELESTIAL TRACKER',
          sub: 'Daylight Stellar Sighting Simulator',
          badge: 'INTERACTIVE',
          icon: <Sparkles className="w-4 h-4 text-amber-300" />
        },
        {
          id: 'dossier',
          label: 'ARCHIVAL DOSSIER',
          sub: 'Blueprints, Specifications & Audio',
          badge: 'DECLASSIFIED',
          icon: <BookOpen className="w-4 h-4 text-blue-400" />
        }
      ]
    }
  ];

  // Identify active category and station
  const activeCategory = categories.find((cat) => 
    cat.stations.some((st) => st.id === activeStation)
  ) || categories[0];

  const activeStationItem = activeCategory.stations.find((st) => st.id === activeStation) 
    || categories[0].stations[0];

  return (
    <header 
      ref={headerRef}
      className="border-b border-slate-800 bg-slate-950 text-slate-100 select-none shadow-xl sticky top-0 z-50 font-mono"
    >
      {/* ============================================================== */}
      {/* TIER 1: PRIMARY TOP MENU BAR (Zero vertical wrapping / scroll) */}
      {/* ============================================================== */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-12 flex items-center justify-between gap-2 border-b border-slate-900 text-xs">
        {/* Left: Ship Brand & Status */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2 font-bold tracking-wider text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-white font-black text-xs sm:text-sm">USNS VANGUARD</span>
            <span className="text-slate-600 hidden md:inline">|</span>
            <span className="text-amber-400 text-[11px] hidden md:inline font-semibold">T-AGM-19 SSP</span>
          </div>
        </div>

        {/* Center: Layered Category Menus */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {categories.map((cat) => {
            const hasActiveStation = cat.stations.some((s) => s.id === activeStation);
            const isOpen = openDropdown === cat.id;

            return (
              <div key={cat.id} className="relative">
                <button
                  id={`cat-btn-${cat.id}`}
                  onClick={() => {
                    soundFx.playClick();
                    setOpenDropdown(isOpen ? null : cat.id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer border ${
                    hasActiveStation
                      ? 'bg-slate-900 border-amber-500/80 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                      : isOpen
                      ? 'bg-slate-850 border-slate-700 text-white'
                      : 'bg-slate-950/60 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  aria-expanded={isOpen}
                >
                  {hasActiveStation && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                  <span>{cat.name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpen ? 'rotate-180 text-amber-400' : 'text-slate-500'}`} />
                </button>

                {/* Layered Popover Dropdown Menu */}
                {isOpen && (
                  <div className="absolute left-0 mt-1.5 w-72 bg-slate-950 border border-slate-750 rounded-lg shadow-2xl p-1.5 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-2.5 py-1.5 border-b border-slate-850 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>{cat.name} STATIONS</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-850 text-amber-400 text-[9px]">{cat.badge}</span>
                    </div>

                    <div className="py-1 flex flex-col gap-1">
                      {cat.stations.map((st) => {
                        const isCurrent = st.id === activeStation;
                        return (
                          <button
                            key={st.id}
                            id={`dropdown-station-${st.id}`}
                            onClick={() => handleStationClick(st.id)}
                            className={`w-full flex items-start gap-2.5 p-2 rounded text-left transition-all cursor-pointer border ${
                              isCurrent
                                ? 'bg-amber-500/15 border-amber-500/70 text-white shadow-sm ring-1 ring-amber-500/40'
                                : 'bg-slate-900/40 hover:bg-slate-850 border-transparent text-slate-300 hover:text-white'
                            }`}
                          >
                            <div className={`p-1.5 rounded mt-0.5 ${isCurrent ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                              {st.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className={`text-xs font-bold tracking-wide truncate ${isCurrent ? 'text-amber-300 font-extrabold' : 'text-slate-200'}`}>
                                  {st.label}
                                </span>
                                {isCurrent && (
                                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 leading-tight line-clamp-1 font-sans mt-0.5">
                                {st.sub}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right: Telemetry Time, Status & Audio Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-[11px]">
          {/* Mission Zulu Time */}
          <div className="bg-slate-900 px-2 py-1 rounded border border-slate-800 hidden sm:flex items-center gap-1.5">
            <span className="text-slate-500 text-[10px] tracking-wider">ZULU:</span>
            <span className="text-emerald-400 font-bold tracking-wider">{zuluTime}</span>
          </div>

          {/* Telemetry Status Pill */}
          <div className={`px-2 py-0.5 rounded border flex items-center gap-1.5 font-bold ${
            telemetryStatus === 'NOMINAL' 
              ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300' 
              : telemetryStatus === 'TRACKING'
              ? 'bg-cyan-950/50 border-cyan-800 text-cyan-300'
              : 'bg-amber-950/50 border-amber-800 text-amber-300'
          }`}>
            <Waves className="w-3 h-3" />
            <span>{telemetryStatus}</span>
          </div>

          {/* Audio Mute Button */}
          <button
            id="btn-sound-toggle"
            onClick={handleToggleMute}
            className={`p-1.5 sm:px-2 sm:py-1 rounded border transition-colors cursor-pointer flex items-center gap-1 text-[11px] ${
              isMuted 
                ? 'bg-red-950/40 border-red-800 text-red-400 hover:bg-red-900/50' 
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title={isMuted ? 'Unmute telemetry sound effects' : 'Mute sound effects'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="hidden lg:inline">{isMuted ? 'MUTED' : 'AUDIO'}</span>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            title="Open Station Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TIER 2: SUB-NAVIGATION LAYER & BREADCRUMB CONTEXT BAR           */}
      {/* ============================================================== */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-3 sm:px-4 py-1 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-hidden">
          {/* Breadcrumb path */}
          <div className="flex items-center gap-1.5 text-[11px] truncate">
            <span className="text-slate-500 font-bold">DECK:</span>
            <span className="text-slate-400 font-bold">{activeCategory.name}</span>
            <span className="text-slate-600">&gt;</span>
            <span className="text-amber-400 font-extrabold flex items-center gap-1 truncate">
              {activeStationItem.label}
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            </span>
          </div>

          {/* Direct Sister-Station Quick Pills (No wrapping or scrolling!) */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-slate-500 text-[10px] hidden lg:inline mr-1">SWITCH:</span>
            {activeCategory.stations.map((st) => {
              const isCurrent = st.id === activeStation;
              return (
                <button
                  key={st.id}
                  onClick={() => handleStationClick(st.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1 border ${
                    isCurrent
                      ? 'bg-amber-500/20 border-amber-500/70 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <span className="truncate max-w-[130px]">{st.label.replace('SIMULATOR', 'SIM')}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MOBILE / RESPONSIVE LAYERED ACCORDION DRAWER                    */}
      {/* ============================================================== */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 p-3 flex flex-col gap-3 animate-in slide-in-from-top-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-400/90 border-b border-slate-850 pb-1">
                <span>{cat.name}</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-slate-900 rounded text-slate-400 border border-slate-800">{cat.badge}</span>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {cat.stations.map((st) => {
                  const isCurrent = st.id === activeStation;
                  return (
                    <button
                      key={st.id}
                      onClick={() => handleStationClick(st.id)}
                      className={`flex items-center gap-2 p-2 rounded text-left border cursor-pointer ${
                        isCurrent 
                          ? 'bg-amber-500/20 border-amber-500 text-amber-200' 
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      <div className="p-1 rounded bg-slate-950">
                        {st.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold">{st.label}</div>
                        <div className="text-[10px] text-slate-400 font-sans truncate">{st.sub}</div>
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </header>
  );
};
