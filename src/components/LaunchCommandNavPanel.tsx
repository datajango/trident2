import React, { useState, useEffect } from 'react';
import { 
  Waves, 
  ShieldCheck, 
  Zap, 
  Flame, 
  RotateCw, 
  Layers, 
  Rocket, 
  Activity, 
  Target,
  ChevronRight,
  ChevronLeft,
  Video,
  Play,
  Pause,
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
  Columns,
  Anchor,
  Compass,
  ShieldAlert,
  Radio,
  Volume2,
  VolumeX,
  Eye,
  AlertTriangle,
  Gauge,
  Sliders,
  ArrowUp,
  ArrowDown,
  FastForward,
  Globe,
  Crosshair,
  Info,
  Sparkles,
  X
} from 'lucide-react';
import { soundFx } from '../audio/soundEngine';
import { SelectableObjectIntel } from '../types';
import { ALL_SELECTABLE_OBJECTS } from '../data/tacticalAssets';

export type LeftPanelState = 'expanded' | 'compact' | 'collapsed';

export interface LaunchCommand {
  id: string;
  name: string;
  timeSec: number;
  stageKey: string;
  badge: string;
  desc: string;
  cameraMode: 'SUB_4KT' | 'BUBBLE_CAM' | 'FOLLOW' | 'PLATFORM_BUS' | 'TARGET_SILO' | 'SHIP' | 'TACTICAL_EVASION';
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

export const LAUNCH_COMMANDS: LaunchCommand[] = [
  {
    id: '4-KT TUBE',
    name: '4-KT TUBE',
    timeSec: 1.0,
    stageKey: 'PRE_LAUNCH_4KT',
    badge: 'T+0.0s',
    desc: 'Submerged Ohio SSBN (4.0 kt). Tube #4 flood equalized.',
    cameraMode: 'SUB_4KT',
    icon: Waves,
    accentColor: 'text-sky-400'
  },
  {
    id: 'GAS BUBBLE',
    name: 'GAS BUBBLE',
    timeSec: 3.8,
    stageKey: 'SUB_BUBBLE_EJECT',
    badge: 'T+3.8s',
    desc: 'Steam generator ejects supercavitating gas envelope.',
    cameraMode: 'BUBBLE_CAM',
    icon: ShieldCheck,
    accentColor: 'text-blue-400'
  },
  {
    id: 'BROACH',
    name: 'BROACH',
    timeSec: 6.2,
    stageKey: 'BUBBLE_BURST',
    badge: 'T+6.2s',
    desc: 'Ocean surface breach with cavitation shockwave burst.',
    cameraMode: 'FOLLOW',
    icon: Zap,
    accentColor: 'text-cyan-300'
  },
  {
    id: 'IGNITION',
    name: 'IGNITION',
    timeSec: 7.5,
    stageKey: 'AEROSPIKE',
    badge: 'T+7.5s',
    desc: 'Stage 1 solid motor fire & aerospike shock cone deploy.',
    cameraMode: 'FOLLOW',
    icon: Flame,
    accentColor: 'text-orange-400'
  },
  {
    id: 'PBV ATTITUDE',
    name: 'PBV ATTITUDE',
    timeSec: 64.0,
    stageKey: 'REACH_ATTITUDE',
    badge: 'T+64s',
    desc: 'Exoatmospheric PBV vernier thrusters trimming attitude.',
    cameraMode: 'PLATFORM_BUS',
    icon: RotateCw,
    accentColor: 'text-amber-400'
  },
  {
    id: 'PLATFORM',
    name: 'PLATFORM',
    timeSec: 74.0,
    stageKey: 'PLATFORM_DEPLOY',
    badge: 'T+74s',
    desc: 'PBV attitude alignment; aerodynamic nose shroud retained intact until MIRV release.',
    cameraMode: 'PLATFORM_BUS',
    icon: Layers,
    accentColor: 'text-emerald-400'
  },
  {
    id: 'MIRV DROP',
    name: 'MIRV DROP',
    timeSec: 85.0,
    stageKey: 'WARHEAD_RELEASE',
    badge: 'T+85s',
    desc: 'Nose shroud pyrotechnic split & Mk 4/5 MIRVs deployed on divergent target vectors.',
    cameraMode: 'PLATFORM_BUS',
    icon: Rocket,
    accentColor: 'text-violet-400'
  },
  {
    id: 'REENTRY',
    name: 'REENTRY',
    timeSec: 99.0,
    stageKey: 'REENTRY_STREAK',
    badge: 'T+99s',
    desc: 'Hypersonic atmospheric entry interface at Mach 22.',
    cameraMode: 'TARGET_SILO',
    icon: Activity,
    accentColor: 'text-rose-400'
  },
  {
    id: 'IMPACT',
    name: 'IMPACT',
    timeSec: 110.5,
    stageKey: 'TARGET_IMPACT',
    badge: 'T+110s',
    desc: 'Thermonuclear burst at Silo #41 (GSS precision proof).',
    cameraMode: 'TARGET_SILO',
    icon: Target,
    accentColor: 'text-red-500'
  }
];

export interface LaunchCommandNavPanelProps {
  currentMissionTime: number;
  currentStage: string;
  onExecuteCommand: (cmd: LaunchCommand) => void;
  autoCamEnabled: boolean;
  onToggleAutoCam: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onResetSim: () => void;
  panelState: LeftPanelState;
  onChangePanelState: (state: LeftPanelState) => void;
  // Submarine Tactical Props (Patrol & Evade)
  noodlingPattern?: 'OFF' | 'SERPENTINE' | 'BAFFLE_CLEAR' | 'THERMAL_DIVE';
  superSilentMode?: boolean;
  countermeasuresRemaining?: number;
  countermeasuresActive?: boolean;
  trackingStatus?: 'LOCKED' | 'SEARCHING' | 'BAFFLED' | 'SPOOFED_BY_DECOY';
  tmaConfidence?: number;
  subSpeedKnots?: number;
  subRadiatedNoiseDb?: number;
  subDepthMeters?: number;
  subSurfaceMode?: boolean;
  onChangeDepth?: (depth: number) => void;
  onToggleSurfaceMode?: () => void;
  onChangeVelocity?: (speedKnots: number) => void;
  onEngagePatrolMode?: () => void;
  onEngageEvadeMode?: (mode: 'SERPENTINE' | 'BAFFLE_CLEAR' | 'THERMAL_DIVE' | 'DECOY') => void;
  onToggleSuperSilent?: () => void;
  onDeployCountermeasures?: () => void;
  onSetCameraMode?: (cam: any) => void;
  // 3D Object Intel & Selection Props
  selectedObject?: SelectableObjectIntel | null;
  onSelectObjectId?: (id: string | null) => void;
  onFocusSelectedObject?: (id: string) => void;
}

export const LaunchCommandNavPanel: React.FC<LaunchCommandNavPanelProps> = ({
  currentMissionTime,
  onExecuteCommand,
  autoCamEnabled,
  onToggleAutoCam,
  isPlaying,
  onTogglePlay,
  onResetSim,
  panelState,
  onChangePanelState,
  noodlingPattern = 'OFF',
  superSilentMode = false,
  countermeasuresRemaining = 6,
  countermeasuresActive = false,
  trackingStatus = 'LOCKED',
  tmaConfidence = 94,
  subSpeedKnots = 4.0,
  subRadiatedNoiseDb = 104,
  subDepthMeters = 22,
  subSurfaceMode = false,
  onChangeDepth,
  onToggleSurfaceMode,
  onChangeVelocity,
  onEngagePatrolMode,
  onEngageEvadeMode,
  onToggleSuperSilent,
  onDeployCountermeasures,
  onSetCameraMode,
  selectedObject = null,
  onSelectObjectId,
  onFocusSelectedObject
}) => {
  // Panel sub-tab switcher: 'phases' (9 launch stages), 'tactical' (Patrol & Evade), or 'intel' (Object Properties)
  const [activeTab, setActiveTab] = useState<'phases' | 'tactical' | 'intel'>('phases');

  // Automatically switch to 'intel' tab whenever an object is selected in the main 3D viewport
  useEffect(() => {
    if (selectedObject) {
      setActiveTab('intel');
    }
  }, [selectedObject?.id]);

  // Determine which command is currently active based on mission time
  const getActiveCommandIndex = () => {
    if (currentMissionTime < 3) return 0; // 4-KT TUBE
    if (currentMissionTime < 5.8) return 1; // GAS BUBBLE
    if (currentMissionTime < 6.8) return 2; // BROACH
    if (currentMissionTime < 60) return 3; // IGNITION
    if (currentMissionTime < 72) return 4; // PBV ATTITUDE
    if (currentMissionTime < 82) return 5; // PLATFORM
    if (currentMissionTime < 96) return 6; // MIRV DROP
    if (currentMissionTime < 110) return 7; // REENTRY
    return 8; // IMPACT
  };

  const activeIndex = getActiveCommandIndex();

  const handleStepPhase = (direction: 'prev' | 'next') => {
    soundFx.playClick();
    const newIdx = direction === 'next' 
      ? Math.min(LAUNCH_COMMANDS.length - 1, activeIndex + 1)
      : Math.max(0, activeIndex - 1);
    onExecuteCommand(LAUNCH_COMMANDS[newIdx]);
  };

  // -------------------------------------------------------------
  // STATE 1: COLLAPSED VIEW (Thin vertical edge rail ~38px)
  // -------------------------------------------------------------
  if (panelState === 'collapsed') {
    return (
      <div 
        id="left-nav-panel-collapsed"
        className="w-full lg:w-11 shrink-0 flex lg:flex-col items-center justify-between p-2 bg-slate-950/95 border border-slate-800 rounded-lg shadow-2xl font-mono text-slate-300 transition-all duration-200"
      >
        <div className="flex lg:flex-col items-center gap-2">
          {/* Uncollapse button */}
          <button
            onClick={() => {
              soundFx.playClick();
              onChangePanelState('expanded');
            }}
            className="p-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/60 text-amber-300 cursor-pointer transition-colors"
            title="Expand Command & Patrol Panel (Full)"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>

          {/* Quick toggle to compact mini */}
          <button
            onClick={() => {
              soundFx.playClick();
              onChangePanelState('compact');
            }}
            className="p-1 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
            title="Switch to Compact Mini Rail"
          >
            <Columns className="w-3.5 h-3.5" />
          </button>

          <div className="hidden lg:block w-4 h-px bg-slate-800 my-1" />

          {/* Quick Patrol Mode trigger */}
          <button
            onClick={() => {
              soundFx.playClick();
              onEngagePatrolMode?.();
            }}
            className={`p-1.5 rounded text-xs cursor-pointer transition-colors border ${
              noodlingPattern === 'OFF' && !superSilentMode
                ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-sky-300'
            }`}
            title="Engage Patrol Mode (Steady 4-kt cruise)"
          >
            <Anchor className="w-3.5 h-3.5" />
          </button>

          {/* Quick Evade Mode trigger */}
          <button
            onClick={() => {
              soundFx.playClick();
              onEngageEvadeMode?.('SERPENTINE');
            }}
            className={`p-1.5 rounded text-xs cursor-pointer transition-colors border ${
              noodlingPattern !== 'OFF' || countermeasuresActive
                ? 'bg-rose-500/20 border-rose-400 text-rose-300 animate-pulse'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-rose-300'
            }`}
            title="Engage Evade Mode (Serpentine weave vs Akula)"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
          </button>

          {/* Quick Surface Mode trigger */}
          <button
            onClick={() => {
              soundFx.playClick();
              onToggleSurfaceMode?.();
            }}
            className={`p-1.5 rounded text-xs cursor-pointer transition-colors border ${
              subSurfaceMode || subDepthMeters === 0
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-cyan-300'
            }`}
            title={subSurfaceMode || subDepthMeters === 0 ? "Surfaced at 0m (Click to dive)" : "Surface Submarine to 0m (Blow Ballast)"}
          >
            <Waves className="w-3.5 h-3.5" />
          </button>

          {/* Quick Selected Object button if locked */}
          {selectedObject && (
            <button
              onClick={() => {
                soundFx.playTargetLock();
                onChangePanelState('expanded');
                setActiveTab('intel');
              }}
              className="p-1.5 rounded bg-emerald-500/20 border border-emerald-400 text-emerald-300 cursor-pointer animate-pulse"
              title={`Target Locked: ${selectedObject.name} (Click to open intel)`}
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="hidden lg:block w-4 h-px bg-slate-800 my-1" />

          {/* Quick play/pause */}
          <button
            onClick={onTogglePlay}
            className={`p-1.5 rounded text-xs font-bold cursor-pointer transition-colors ${
              isPlaying 
                ? 'bg-amber-500 text-slate-950' 
                : 'bg-emerald-600 text-white'
            }`}
            title={isPlaying ? 'Pause simulation' : 'Run simulation'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Vertical rotated text label */}
        <div className="hidden lg:flex flex-col items-center gap-2 py-4">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <div 
            className="text-[10px] font-bold text-slate-400 tracking-widest cursor-pointer hover:text-amber-300 select-none"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            onClick={() => {
              soundFx.playClick();
              onChangePanelState('expanded');
            }}
          >
            COMMANDS &amp; PATROL/EVADE • P{activeIndex + 1}
          </div>
        </div>

        {/* Bottom indicator */}
        <div className="flex lg:flex-col items-center gap-1.5 text-[10px]">
          <span className="font-bold text-amber-400 text-[10px]">P{activeIndex + 1}</span>
          <button
            onClick={() => handleStepPhase('next')}
            disabled={activeIndex >= LAUNCH_COMMANDS.length - 1}
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300"
            title="Next Step"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 2: COMPACT VIEW (High-density mini rail ~80px)
  // -------------------------------------------------------------
  if (panelState === 'compact') {
    return (
      <aside 
        id="left-nav-panel-compact"
        className="w-full lg:w-20 xl:w-24 shrink-0 flex flex-col bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-2xl font-mono text-slate-200 transition-all duration-200 h-full"
      >
        {/* Compact Header */}
        <div className="p-2 bg-slate-900 border-b border-slate-800 flex flex-col items-center gap-1.5">
          {/* State Switcher Controls */}
          <div className="flex items-center justify-between w-full px-0.5">
            <button
              onClick={() => {
                soundFx.playClick();
                onChangePanelState('expanded');
              }}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Expand to Full Width"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <button
              onClick={() => {
                soundFx.playClick();
                onChangePanelState('collapsed');
              }}
              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Collapse Panel Completely"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Patrol, Surface & Evade mini toggles */}
          <div className="grid grid-cols-3 gap-0.5 w-full pt-0.5">
            <button
              onClick={() => {
                soundFx.playClick();
                onEngagePatrolMode?.();
              }}
              className={`p-1 rounded flex flex-col items-center justify-center border text-[8px] font-bold transition-colors cursor-pointer ${
                noodlingPattern === 'OFF' && !superSilentMode && !subSurfaceMode && subDepthMeters === 22
                  ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Patrol Mode: 4-kt Cruise"
            >
              <Anchor className="w-3 h-3" />
              <span className="text-[7px]">PATROL</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                onToggleSurfaceMode?.();
              }}
              className={`p-1 rounded flex flex-col items-center justify-center border text-[8px] font-bold transition-colors cursor-pointer ${
                subSurfaceMode || subDepthMeters === 0
                  ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-cyan-200'
              }`}
              title={subSurfaceMode || subDepthMeters === 0 ? "Surfaced at 0m (Click to dive)" : "Surface to 0m (Blow Ballast)"}
            >
              <Waves className="w-3 h-3" />
              <span className="text-[7px]">{subSurfaceMode || subDepthMeters === 0 ? 'SURF' : 'SURF'}</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                onEngageEvadeMode?.('SERPENTINE');
              }}
              className={`p-1 rounded flex flex-col items-center justify-center border text-[8px] font-bold transition-colors cursor-pointer ${
                noodlingPattern !== 'OFF' || countermeasuresActive
                  ? 'bg-rose-500/20 border-rose-400 text-rose-200 animate-pulse'
                  : 'bg-slate-900 border-slate-800 text-rose-400 hover:text-rose-200'
              }`}
              title="Evade Mode: Serpentine Weave"
            >
              <ShieldAlert className="w-3 h-3" />
              <span className="text-[7px]">EVADE</span>
            </button>
          </div>

          {/* Mini Depth & Speed quick step */}
          <div className="flex flex-col gap-1 w-full bg-slate-950 p-1 rounded border border-slate-850 text-[8px] font-mono text-slate-400">
            <div className="flex items-center justify-between">
              <span className="text-cyan-400">DEP:</span>
              <span className="text-slate-200 font-bold">{subSurfaceMode || subDepthMeters === 0 ? '0m' : `${subDepthMeters}m`}</span>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => onChangeDepth?.(Math.max(0, subDepthMeters - 5))}
                  className="w-3.5 h-3.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 flex items-center justify-center text-[7px] font-bold cursor-pointer"
                  title="Ascend 5m"
                >
                  -
                </button>
                <button
                  onClick={() => onChangeDepth?.(Math.min(100, subDepthMeters + 5))}
                  className="w-3.5 h-3.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 flex items-center justify-center text-[7px] font-bold cursor-pointer"
                  title="Dive 5m"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-amber-400">SPD:</span>
              <span className="text-slate-200 font-bold">{subSpeedKnots.toFixed(0)}kt</span>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => onChangeVelocity?.(Math.max(0, subSpeedKnots - 1))}
                  className="w-3.5 h-3.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 flex items-center justify-center text-[7px] font-bold cursor-pointer"
                  title="Decrease 1 knot"
                >
                  -
                </button>
                <button
                  onClick={() => onChangeVelocity?.(Math.min(25, subSpeedKnots + 1))}
                  className="w-3.5 h-3.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 flex items-center justify-center text-[7px] font-bold cursor-pointer"
                  title="Increase 1 knot"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Compact Run/Pause & Reset */}
          <div className="flex items-center gap-1 w-full justify-center pt-0.5">
            <button
              onClick={onTogglePlay}
              className={`p-1.5 flex-1 rounded flex items-center justify-center text-xs font-bold cursor-pointer transition-colors ${
                isPlaying 
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
              title={isPlaying ? 'Pause simulation' : 'Run simulation'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onResetSim}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 cursor-pointer"
              title="Reset to T-0s"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Stepper buttons */}
          <div className="flex items-center justify-between w-full text-[10px] text-slate-400 px-0.5">
            <button
              onClick={() => handleStepPhase('prev')}
              disabled={activeIndex <= 0}
              className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 disabled:opacity-30"
              title="Previous Phase"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <span className="font-bold text-amber-400 text-[11px]">{activeIndex + 1}/9</span>
            <button
              onClick={() => handleStepPhase('next')}
              disabled={activeIndex >= LAUNCH_COMMANDS.length - 1}
              className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 disabled:opacity-30"
              title="Next Phase"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Compact 9 Command Icons Rail */}
        <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          {LAUNCH_COMMANDS.map((cmd, idx) => {
            const isActive = activeIndex === idx;
            const isPassed = activeIndex > idx;
            const IconComp = cmd.icon;

            return (
              <button
                key={cmd.id}
                id={`cmd-compact-${cmd.id.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => {
                  soundFx.playClick();
                  onExecuteCommand(cmd);
                }}
                className={`w-full py-1.5 px-1 rounded flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-1 ring-amber-400/50 shadow'
                    : isPassed
                    ? 'bg-slate-900/40 hover:bg-slate-850 border-slate-800 text-slate-400'
                    : 'bg-slate-900/20 hover:bg-slate-850 border-slate-850 text-slate-400'
                }`}
                title={`[${idx + 1}] ${cmd.name} (${cmd.badge})\n${cmd.desc}`}
              >
                <div className="flex items-center justify-between w-full px-1 text-[9px] font-mono">
                  <span className={isActive ? 'text-amber-300 font-bold' : 'text-slate-500'}>
                    0{idx + 1}
                  </span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />}
                </div>

                <div className={`p-1 rounded ${isActive ? 'text-amber-300' : 'text-slate-300'}`}>
                  <IconComp className="w-4 h-4" />
                </div>

                <span className={`text-[8px] font-bold tracking-tight truncate max-w-[70px] ${
                  isActive ? 'text-amber-200 font-extrabold' : 'text-slate-400'
                }`}>
                  {cmd.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Compact Footer */}
        <div className="p-1.5 bg-slate-900 border-t border-slate-800 text-[9px] text-center text-slate-400 font-mono">
          T+{currentMissionTime.toFixed(0)}s
        </div>
      </aside>
    );
  }

  // -------------------------------------------------------------
  // STATE 3: EXPANDED VIEW (Standard rich full panel with Patrol & Evade)
  // -------------------------------------------------------------
  return (
    <aside 
      id="left-nav-panel"
      className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-2xl font-mono text-slate-200 transition-all duration-200 h-full"
    >
      {/* Panel Title & Controller Header */}
      <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              COMMAND &amp; PATROL
            </span>
          </div>

          {/* 3-State Layout Switcher Pill + Explicit Collapse Button */}
          <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded border border-slate-800">
            <button
              onClick={() => {
                soundFx.playClick();
                onChangePanelState('expanded');
              }}
              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 cursor-pointer"
              title="Full Expanded View"
            >
              FULL
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                onChangePanelState('compact');
              }}
              className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-white hover:bg-slate-850 cursor-pointer"
              title="Compact Mini Rail"
            >
              MINI
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                onChangePanelState('collapsed');
              }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 cursor-pointer transition-colors"
              title="Collapse Panel (Maximize 3D Viewport)"
            >
              <PanelLeftClose className="w-3 h-3 text-rose-400" />
              <span>HIDE</span>
            </button>
          </div>
        </div>

        {/* Global Play / Pause & Quick Step */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onTogglePlay}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-xs font-bold cursor-pointer transition-colors ${
              isPlaying 
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
            title={isPlaying ? 'Pause simulation' : 'Run simulation'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'PAUSE' : 'RUN'}</span>
          </button>

          <button
            onClick={onResetSim}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 cursor-pointer transition-colors"
            title="Reset to T-0s (Ohio Tube #4)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleStepPhase('prev')}
            disabled={activeIndex <= 0}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 rounded text-slate-300 cursor-pointer transition-colors"
            title="Previous Phase"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleStepPhase('next')}
            disabled={activeIndex >= LAUNCH_COMMANDS.length - 1}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 rounded text-slate-300 cursor-pointer transition-colors"
            title="Next Phase"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Primary Sub-Tabs: [LAUNCH PHASES] vs [PATROL & EVADE] vs [OBJECT INTEL] */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-0.5 rounded border border-slate-800 text-[10px] font-bold">
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('phases');
            }}
            className={`py-1 rounded flex items-center justify-center gap-1 cursor-pointer transition-colors ${
              activeTab === 'phases'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Rocket className="w-3 h-3 text-amber-400" />
            <span className="truncate">LAUNCH</span>
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('tactical');
            }}
            className={`py-1 rounded flex items-center justify-center gap-1 cursor-pointer transition-colors ${
              activeTab === 'tactical'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3 h-3 text-cyan-400" />
            <span className="truncate">PATROL</span>
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('intel');
            }}
            className={`py-1 rounded flex items-center justify-center gap-1 cursor-pointer transition-colors relative ${
              activeTab === 'intel'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                : selectedObject
                ? 'text-emerald-400 hover:text-emerald-300 font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Crosshair className="w-3 h-3 text-emerald-400" />
            <span className="truncate">INTEL</span>
            {selectedObject && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Quick Patrol, Surface & Evade Action Chips (Always Visible in Header) */}
        <div className="grid grid-cols-3 gap-1 pt-0.5">
          <button
            onClick={() => {
              soundFx.playClick();
              onEngagePatrolMode?.();
            }}
            className={`px-1.5 py-1 rounded text-[10px] font-bold border flex items-center justify-center gap-1 cursor-pointer transition-colors ${
              noodlingPattern === 'OFF' && !superSilentMode && !subSurfaceMode && subDepthMeters === 22
                ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                : 'bg-slate-850 border-slate-750 text-slate-300 hover:text-white'
            }`}
            title="Engage Steady 4.0 KT Patrol Cruise at 22m"
          >
            <Anchor className="w-3 h-3 text-sky-400" />
            <span className="truncate">PATROL</span>
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              onToggleSurfaceMode?.();
            }}
            className={`px-1.5 py-1 rounded text-[10px] font-bold border flex items-center justify-center gap-1 cursor-pointer transition-colors ${
              subSurfaceMode || subDepthMeters === 0
                ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-sm'
                : 'bg-slate-850 border-slate-750 text-slate-300 hover:text-cyan-200'
            }`}
            title={subSurfaceMode || subDepthMeters === 0 ? "Surfaced at 0m (Click to submerge to 22m)" : "Blow Ballast & Surface to 0m"}
          >
            <Waves className="w-3 h-3 text-cyan-400" />
            <span className="truncate">{subSurfaceMode || subDepthMeters === 0 ? 'SURFACED' : 'SURFACE'}</span>
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              onEngageEvadeMode?.('SERPENTINE');
            }}
            className={`px-1.5 py-1 rounded text-[10px] font-bold border flex items-center justify-center gap-1 cursor-pointer transition-colors ${
              noodlingPattern !== 'OFF' || countermeasuresActive
                ? 'bg-rose-500/20 border-rose-400 text-rose-200 animate-pulse'
                : 'bg-slate-850 border-slate-750 text-rose-400 hover:text-rose-200'
            }`}
            title="Engage Evasive Weave vs Russian Akula"
          >
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span className="truncate">EVADE</span>
          </button>
        </div>

        {/* Real-time Submarine Helm Telemetry Pill */}
        <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="text-cyan-400 font-bold">DEPTH:</span>
            <span className={subSurfaceMode || subDepthMeters === 0 ? 'text-amber-300 font-bold' : 'text-slate-100 font-bold'}>
              {subSurfaceMode || subDepthMeters === 0 ? '0m (SURFACE)' : `${subDepthMeters}m`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 font-bold">SPD:</span>
            <span className="text-slate-100 font-bold">{subSpeedKnots.toFixed(1)} KT</span>
            <div className="flex items-center gap-0.5 ml-1">
              <button
                onClick={() => onChangeVelocity?.(Math.max(0, subSpeedKnots - 1))}
                className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-[9px] font-bold cursor-pointer"
                title="Decrease speed by 1 knot"
              >
                -
              </button>
              <button
                onClick={() => onChangeVelocity?.(Math.min(25, subSpeedKnots + 1))}
                className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-[9px] font-bold cursor-pointer"
                title="Increase speed by 1 knot"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TAB CONTENT: LAUNCH PHASES */}
      {activeTab === 'phases' && (
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 divide-y divide-slate-850/60 scrollbar-thin scrollbar-thumb-slate-800">
          {/* Auto-Cam sync row */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 px-1">
            <span className="flex items-center gap-1">
              <Video className="w-3 h-3 text-cyan-400" />
              <span>AUTO-CAM LOCK:</span>
            </span>
            <button
              onClick={onToggleAutoCam}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                autoCamEnabled 
                  ? 'bg-cyan-950 border-cyan-500 text-cyan-300' 
                  : 'bg-slate-850 border-slate-700 text-slate-500'
              }`}
            >
              {autoCamEnabled ? 'ENGAGED' : 'MANUAL'}
            </button>
          </div>

          {LAUNCH_COMMANDS.map((cmd, idx) => {
            const isActive = activeIndex === idx;
            const isPassed = activeIndex > idx;
            const IconComp = cmd.icon;

            return (
              <button
                key={cmd.id}
                id={`cmd-btn-${cmd.id.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => {
                  soundFx.playClick();
                  onExecuteCommand(cmd);
                }}
                className={`w-full pt-1.5 pb-2 px-2.5 rounded text-left transition-all duration-150 flex flex-col gap-1 cursor-pointer border ${
                  isActive
                    ? 'bg-amber-500/15 border-amber-500 shadow-md shadow-amber-950/40 text-amber-200 ring-1 ring-amber-500/40'
                    : isPassed
                    ? 'bg-slate-900/40 hover:bg-slate-850/80 border-slate-800 text-slate-400'
                    : 'bg-slate-900/20 hover:bg-slate-850 border-slate-850 text-slate-300'
                }`}
              >
                {/* Header row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${isActive ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800/80 text-slate-400'}`}>
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                    <span className={`text-xs font-bold tracking-wide ${isActive ? 'text-amber-300 font-extrabold' : 'text-slate-200'}`}>
                      {cmd.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isActive 
                        ? 'bg-amber-400 text-slate-950 font-bold' 
                        : isPassed
                        ? 'bg-slate-800 text-slate-500'
                        : 'bg-slate-850 text-slate-400'
                    }`}>
                      {cmd.badge}
                    </span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    )}
                  </div>
                </div>

                {/* Subtitle description */}
                <p className={`text-[10px] leading-tight line-clamp-2 pl-7 ${isActive ? 'text-amber-100/90' : 'text-slate-400'}`}>
                  {cmd.desc}
                </p>

                {/* Status footer */}
                <div className="flex items-center justify-between text-[9px] pl-7 pt-0.5 text-slate-500">
                  <span>VIEW: <span className="text-slate-300">{cmd.cameraMode}</span></span>
                  <span>{isActive ? '● IN PROGRESS' : isPassed ? '✓ COMPLETED' : '○ QUEUED'}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* TAB CONTENT: SUBMARINE PATROL & EVADE MODES */}
      {activeTab === 'tactical' && (
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2.5 scrollbar-thin scrollbar-thumb-slate-800">
          {/* Hostile Russian Akula-I Threat Monitor Card */}
          <div className={`p-2.5 rounded border text-xs ${
            trackingStatus === 'LOCKED'
              ? 'bg-rose-950/40 border-rose-600/80'
              : trackingStatus === 'SPOOFED_BY_DECOY'
              ? 'bg-amber-950/40 border-amber-600/80'
              : trackingStatus === 'SEARCHING'
              ? 'bg-emerald-950/40 border-emerald-600/80'
              : 'bg-sky-950/40 border-sky-600/80'
          }`}>
            <div className="flex items-center justify-between font-bold mb-1">
              <span className="text-slate-200 text-[11px] flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                AKULA-I STALKER
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                trackingStatus === 'LOCKED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse' :
                trackingStatus === 'SPOOFED_BY_DECOY' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' :
                trackingStatus === 'SEARCHING' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' :
                'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
              }`}>
                {trackingStatus === 'LOCKED' ? `LOCKED (${tmaConfidence}%)` :
                 trackingStatus === 'SPOOFED_BY_DECOY' ? 'SPOOFED (DECOY)' :
                 trackingStatus === 'SEARCHING' ? 'LOST (78 dB)' :
                 `BAFFLED (${tmaConfidence}%)`}
              </span>
            </div>
            <div className="text-[10px] text-slate-300 leading-tight">
              {trackingStatus === 'LOCKED' 
                ? 'Russian active sonar ping holds direct acoustic lock. Engage Noodling or Decoy immediately.' 
                : trackingStatus === 'SPOOFED_BY_DECOY'
                ? 'Russian MGK-540 sonar seduced by high-gain acoustic decoy bubble cloud.'
                : trackingStatus === 'SEARCHING'
                ? 'Submarine acoustic emissions dropped below ocean floor ambient (78 dB).'
                : 'Ohio evasive maneuvers broke enemy continuous bearing rate solution.'}
            </div>
          </div>

          {/* SUBMARINE DEPTH & SURFACE CONTROLS CARD */}
          <div className="p-2.5 rounded border border-cyan-900/60 bg-slate-900/90 flex flex-col gap-2 shadow-lg">
            <div className="flex items-center justify-between text-[11px] font-bold text-cyan-400 border-b border-slate-800 pb-1.5">
              <span className="flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-cyan-400" />
                <span>DEPTH &amp; SURFACE CONTROL</span>
              </span>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                subSurfaceMode || subDepthMeters === 0 
                  ? 'bg-amber-400 text-slate-950 animate-pulse' 
                  : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
              }`}>
                {subSurfaceMode || subDepthMeters === 0 ? 'SURFACED (0m)' : `${subDepthMeters}m (${Math.round(subDepthMeters * 3.28)} FT)`}
              </span>
            </div>

            {/* Master Surface Mode Action Button */}
            <button
              onClick={() => {
                soundFx.playClick();
                onToggleSurfaceMode?.();
              }}
              className={`w-full p-2 rounded border text-left cursor-pointer transition-colors flex items-center justify-between ${
                subSurfaceMode || subDepthMeters === 0
                  ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400/50'
                  : 'bg-slate-850/80 border-slate-750 text-slate-300 hover:bg-slate-800 hover:border-cyan-500/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded ${subSurfaceMode || subDepthMeters === 0 ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-800 text-slate-400'}`}>
                  <Waves className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                    <span>{subSurfaceMode || subDepthMeters === 0 ? 'SURFACE MODE (0m)' : 'BLOW BALLAST TANKS'}</span>
                    {(subSurfaceMode || subDepthMeters === 0) && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {subSurfaceMode || subDepthMeters === 0 
                      ? 'Deck & sail breaching ocean surface. Click to dive to 22m.' 
                      : 'Blowing main ballast tanks to breach ocean waterline.'}
                  </div>
                </div>
              </div>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0 ${
                subSurfaceMode || subDepthMeters === 0 ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {subSurfaceMode || subDepthMeters === 0 ? 'SURFACED' : 'DIVE'}
              </span>
            </button>

            {/* Quick Depth Preset Buttons */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">DEPTH PRESETS:</span>
              <div className="grid grid-cols-5 gap-1 text-[9px] font-mono font-bold">
                {[
                  { depth: 0, label: '0m', desc: 'SURF' },
                  { depth: 12, label: '12m', desc: 'PERI' },
                  { depth: 22, label: '22m', desc: 'PATROL' },
                  { depth: 45, label: '45m', desc: 'LAYER' },
                  { depth: 80, label: '80m', desc: 'DEEP' }
                ].map((item) => (
                  <button
                    key={item.depth}
                    onClick={() => {
                      soundFx.playClick();
                      onChangeDepth?.(item.depth);
                    }}
                    className={`p-1 rounded flex flex-col items-center justify-center border cursor-pointer transition-colors ${
                      subDepthMeters === item.depth && (!subSurfaceMode || item.depth === 0)
                        ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[7px] text-slate-500 font-normal">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Depth Slider & Steppers */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onChangeDepth?.(Math.max(0, subDepthMeters - 5))}
                disabled={subDepthMeters <= 0}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-750 disabled:opacity-40 rounded text-[10px] font-bold text-slate-300 border border-slate-700 cursor-pointer"
                title="Ascend 5 meters"
              >
                -5m
              </button>
              <div className="flex-1 flex flex-col gap-0.5">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={subDepthMeters}
                  onChange={(e) => onChangeDepth?.(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                  <span>0m (SURF)</span>
                  <span>50m</span>
                  <span>100m (ABYSS)</span>
                </div>
              </div>
              <button
                onClick={() => onChangeDepth?.(Math.min(100, subDepthMeters + 5))}
                disabled={subDepthMeters >= 100}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-750 disabled:opacity-40 rounded text-[10px] font-bold text-slate-300 border border-slate-700 cursor-pointer"
                title="Dive 5 meters"
              >
                +5m
              </button>
            </div>
          </div>

          {/* SUBMARINE VELOCITY & PROPULSION CONTROLS CARD */}
          <div className="p-2.5 rounded border border-amber-900/60 bg-slate-900/90 flex flex-col gap-2 shadow-lg">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-400 border-b border-slate-800 pb-1.5">
              <span className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                <span>VELOCITY &amp; PROPULSION CONTROL</span>
              </span>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                subSpeedKnots > 18 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' 
                  : subSpeedKnots === 0
                  ? 'bg-slate-800 text-slate-400'
                  : 'bg-amber-950 text-amber-300 border border-amber-500/40'
              }`}>
                {subSpeedKnots.toFixed(1)} KT ({subRadiatedNoiseDb} dB)
              </span>
            </div>

            {/* Velocity State Banner */}
            <div className="flex items-center justify-between bg-slate-950/70 p-2 rounded border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  subSpeedKnots === 0 ? 'bg-slate-600' :
                  subSpeedKnots <= 2 ? 'bg-emerald-400 animate-pulse' :
                  subSpeedKnots <= 4.5 ? 'bg-sky-400' :
                  subSpeedKnots <= 15 ? 'bg-amber-400' :
                  'bg-rose-500 animate-ping'
                }`} />
                <div>
                  <div className="font-bold text-slate-200">
                    {subSpeedKnots === 0 ? 'ALL STOP' :
                     subSpeedKnots <= 2 ? 'ULTRA-QUIET CRAWL' :
                     subSpeedKnots <= 4.5 ? 'STANDARD PATROL CRUISE' :
                     subSpeedKnots <= 15 ? 'STANDARD AHEAD' :
                     'FLANK SPEED (CAVITATION)'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Propeller screw turns at {subSpeedKnots === 0 ? '0 RPM' : `${Math.round(subSpeedKnots * 8.5)} RPM`}.
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold text-amber-300">
                {subSpeedKnots.toFixed(1)} KTS
              </span>
            </div>

            {/* Velocity Presets */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">SPEED PRESETS:</span>
              <div className="grid grid-cols-5 gap-1 text-[9px] font-mono font-bold">
                {[
                  { speed: 0, label: '0 KT', desc: 'STOP' },
                  { speed: 2.0, label: '2 KT', desc: 'QUIET' },
                  { speed: 4.0, label: '4 KT', desc: 'PATROL' },
                  { speed: 10.0, label: '10 KT', desc: 'AHEAD' },
                  { speed: 25.0, label: '25 KT', desc: 'FLANK' }
                ].map((item) => (
                  <button
                    key={item.speed}
                    onClick={() => {
                      soundFx.playClick();
                      onChangeVelocity?.(item.speed);
                    }}
                    className={`p-1 rounded flex flex-col items-center justify-center border cursor-pointer transition-colors ${
                      Math.abs(subSpeedKnots - item.speed) < 0.2
                        ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[7px] text-slate-500 font-normal">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Velocity Slider & Steppers */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onChangeVelocity?.(Math.max(0, subSpeedKnots - 1))}
                disabled={subSpeedKnots <= 0}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-750 disabled:opacity-40 rounded text-[10px] font-bold text-slate-300 border border-slate-700 cursor-pointer"
                title="Decrease speed by 1 knot"
              >
                -1kt
              </button>
              <div className="flex-1 flex flex-col gap-0.5">
                <input
                  type="range"
                  min={0}
                  max={25}
                  step={0.5}
                  value={subSpeedKnots}
                  onChange={(e) => onChangeVelocity?.(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                  <span>0 KT</span>
                  <span>12.5 KT</span>
                  <span>25.0 KT (FLANK)</span>
                </div>
              </div>
              <button
                onClick={() => onChangeVelocity?.(Math.min(25, subSpeedKnots + 1))}
                disabled={subSpeedKnots >= 25}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-750 disabled:opacity-40 rounded text-[10px] font-bold text-slate-300 border border-slate-700 cursor-pointer"
                title="Increase speed by 1 knot"
              >
                +1kt
              </button>
            </div>
          </div>

          {/* PATROL MODES SECTION */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-sky-400 border-b border-slate-800 pb-1">
              <span className="flex items-center gap-1.5">
                <Anchor className="w-3.5 h-3.5" />
                <span>PATROL MODES</span>
              </span>
              <span className="text-[9px] text-slate-400">OHIO SSBN CRUISE</span>
            </div>

            {/* 1. Steady 4.0 KT Patrol Cruise */}
            <button
              onClick={() => {
                soundFx.playClick();
                onEngagePatrolMode?.();
              }}
              className={`p-2 rounded border text-left cursor-pointer transition-colors ${
                noodlingPattern === 'OFF' && !superSilentMode
                  ? 'bg-sky-950/60 border-sky-400 text-sky-200 ring-1 ring-sky-400/40'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1">
                  <Anchor className="w-3.5 h-3.5 text-sky-400" />
                  STEADY PATROL (4.0 KT)
                </span>
                <span className={`text-[9px] font-mono px-1 rounded ${
                  noodlingPattern === 'OFF' && !superSilentMode ? 'bg-sky-400 text-slate-950 font-bold' : 'text-slate-500'
                }`}>
                  {noodlingPattern === 'OFF' && !superSilentMode ? 'ACTIVE' : 'READY'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                Submerged Ohio SSBN cruising at nominal 4.0 knots patrol speed. Zero heading weave, Tube #4 flood equalized.
              </p>
            </button>

            {/* 2. Rig for Ultra-Quiet Patrol (78 dB) */}
            <button
              onClick={() => {
                soundFx.playClick();
                onToggleSuperSilent?.();
              }}
              className={`p-2 rounded border text-left cursor-pointer transition-colors ${
                superSilentMode
                  ? 'bg-emerald-950/60 border-emerald-400 text-emerald-200 ring-1 ring-emerald-400/40'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1">
                  {superSilentMode ? <VolumeX className="w-3.5 h-3.5 text-emerald-400" /> : <Volume2 className="w-3.5 h-3.5 text-slate-400" />}
                  ULTRA-QUIET PATROL (78 dB)
                </span>
                <span className={`text-[9px] font-mono px-1 rounded ${
                  superSilentMode ? 'bg-emerald-400 text-slate-950 font-bold' : 'text-slate-500'
                }`}>
                  {superSilentMode ? 'RIGGED' : 'STANDBY'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                Natural circulation S8G core cooling. Secures primary coolant pumps; radiates 78 dB (quieter than ocean floor ambient).
              </p>
            </button>
          </div>

          {/* EVADE MODES SECTION */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-rose-400 border-b border-slate-800 pb-1">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>EVADE MODES</span>
              </span>
              <span className="text-[9px] text-rose-300">AKULA COUNTERMEASURES</span>
            </div>

            {/* Serpentine Weave */}
            <button
              onClick={() => {
                soundFx.playClick();
                onEngageEvadeMode?.('SERPENTINE');
              }}
              className={`p-2 rounded border text-left cursor-pointer transition-colors ${
                noodlingPattern === 'SERPENTINE'
                  ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400/40'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  SERPENTINE WEAVE (±25°)
                </span>
                <span className={`text-[9px] font-mono px-1 rounded ${
                  noodlingPattern === 'SERPENTINE' ? 'bg-cyan-400 text-slate-950 font-bold' : 'text-slate-500'
                }`}>
                  {noodlingPattern === 'SERPENTINE' ? 'EVADING' : 'SELECT'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                Continuous sinusoidal heading weave preventing Russian Akula TMA fire control computer convergence.
              </p>
            </button>

            {/* Baffle Clear S-Turn */}
            <button
              onClick={() => {
                soundFx.playClick();
                onEngageEvadeMode?.('BAFFLE_CLEAR');
              }}
              className={`p-2 rounded border text-left cursor-pointer transition-colors ${
                noodlingPattern === 'BAFFLE_CLEAR'
                  ? 'bg-amber-950/60 border-amber-400 text-amber-200 ring-1 ring-amber-400/40'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1">
                  <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                  BAFFLE CLEAR (45° S-TURN)
                </span>
                <span className={`text-[9px] font-mono px-1 rounded ${
                  noodlingPattern === 'BAFFLE_CLEAR' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-500'
                }`}>
                  {noodlingPattern === 'BAFFLE_CLEAR' ? 'CLEARING' : 'SELECT'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                Hard 45° snap maneuver clearing the acoustic blind spot directly behind stern propeller screw.
              </p>
            </button>

            {/* Thermal Layer Dive */}
            <button
              onClick={() => {
                soundFx.playClick();
                onEngageEvadeMode?.('THERMAL_DIVE');
              }}
              className={`p-2 rounded border text-left cursor-pointer transition-colors ${
                noodlingPattern === 'THERMAL_DIVE'
                  ? 'bg-blue-950/60 border-blue-400 text-blue-200 ring-1 ring-blue-400/40'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1">
                  <Waves className="w-3.5 h-3.5 text-blue-400" />
                  THERMAL LAYER DIVE
                </span>
                <span className={`text-[9px] font-mono px-1 rounded ${
                  noodlingPattern === 'THERMAL_DIVE' ? 'bg-blue-400 text-slate-950 font-bold' : 'text-slate-500'
                }`}>
                  {noodlingPattern === 'THERMAL_DIVE' ? 'SUBMERGED' : 'SELECT'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                Porpoises below ocean thermocline layer; thermal gradient refracts active sonar pings away from hull.
              </p>
            </button>

            {/* Deploy ADC-MK3 Countermeasures Decoy */}
            <button
              onClick={() => {
                soundFx.playClick();
                onDeployCountermeasures?.();
              }}
              disabled={countermeasuresRemaining <= 0}
              className={`p-2 rounded border text-left cursor-pointer transition-colors ${
                countermeasuresRemaining <= 0
                  ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                  : countermeasuresActive
                  ? 'bg-amber-950/70 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400/40'
                  : 'bg-amber-500/20 border-amber-500 text-amber-300 hover:bg-amber-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-amber-400" />
                  DEPLOY ACOUSTIC DECOY
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-bold">
                  {countermeasuresRemaining}/6 CANISTERS
                </span>
              </div>
              <p className="text-[10px] text-slate-300 mt-1 leading-tight">
                Launches ADC-MK3 decoy generating high-gain false target echo &amp; microbubble curtain to seduce Akula sonar.
              </p>
            </button>

            {/* 3D Undersea Cam View Switch */}
            <button
              onClick={() => {
                soundFx.playClick();
                onSetCameraMode?.('TACTICAL_EVASION');
              }}
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-850 border border-cyan-800/80 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>3D CAM: OHIO SSBN &amp; AKULA STALKER</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: OBJECT PROPERTIES & THEATER INTEL */}
      {activeTab === 'intel' && (
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2.5 scrollbar-thin scrollbar-thumb-slate-800">
          {selectedObject ? (
            <>
              {/* Selected Object Primary Header Card */}
              <div className="p-2.5 rounded border border-emerald-500/50 bg-slate-900/90 flex flex-col gap-2 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                      {selectedObject.category}
                    </span>
                    <span className="text-[9px] text-slate-400 truncate max-w-[130px]">
                      {selectedObject.affiliation}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      onSelectObjectId?.(null);
                    }}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                    title="Deselect object"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-emerald-300 tracking-wide">
                    {selectedObject.name}
                  </h3>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {selectedObject.designation}
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="px-2 py-1 rounded bg-slate-950/80 border border-slate-800 flex items-center gap-1.5 text-[10px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-slate-200 font-bold truncate">
                    {selectedObject.status}
                  </span>
                </div>

                {/* Actions: Focus Camera & Telemetry Link */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    onClick={() => {
                      soundFx.playTargetLock();
                      onFocusSelectedObject?.(selectedObject.id);
                    }}
                    className="py-1.5 px-2 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow"
                    title="Center and focus 3D camera on this object"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>FOCUS 3D CAM</span>
                  </button>
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      onSelectObjectId?.(null);
                    }}
                    className="py-1.5 px-2 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-slate-750"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>CLEAR LOCK</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Live Telemetry Readouts */}
              <div className="p-2.5 rounded border border-slate-800 bg-slate-900/60 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Activity className="w-3 h-3 text-amber-400" />
                  <span>LIVE PHYSICAL TELEMETRY</span>
                </span>
                <div className="grid grid-cols-1 gap-1 text-[10px] font-mono">
                  <div className="flex items-center justify-between py-0.5 border-b border-slate-850">
                    <span className="text-slate-400">ALTITUDE / KEEL:</span>
                    <span className="text-slate-200 font-bold">{selectedObject.telemetrySummary.altitudeOrDepth}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5 border-b border-slate-850">
                    <span className="text-slate-400">SPEED / VELOCITY:</span>
                    <span className="text-slate-200 font-bold">{selectedObject.telemetrySummary.speedOrVelocity}</span>
                  </div>
                  {selectedObject.telemetrySummary.rangeOrDistance && (
                    <div className="flex items-center justify-between py-0.5 border-b border-slate-850">
                      <span className="text-slate-400">THEATER RANGE:</span>
                      <span className="text-slate-200 font-bold">{selectedObject.telemetrySummary.rangeOrDistance}</span>
                    </div>
                  )}
                  {selectedObject.telemetrySummary.bearingOrAzimuth && (
                    <div className="flex items-center justify-between py-0.5 border-b border-slate-850">
                      <span className="text-slate-400">AZIMUTH / BEARING:</span>
                      <span className="text-slate-200 font-bold">{selectedObject.telemetrySummary.bearingOrAzimuth}</span>
                    </div>
                  )}
                  {selectedObject.telemetrySummary.coordinatesOrOrbit && (
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-slate-400">ORBIT / DATUM:</span>
                      <span className="text-slate-300 font-medium text-[9px] truncate max-w-[160px] text-right">
                        {selectedObject.telemetrySummary.coordinatesOrOrbit}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Technical Specifications Table */}
              <div className="p-2.5 rounded border border-slate-800 bg-slate-900/60 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3 h-3 text-sky-400" />
                  <span>TECHNICAL SPECIFICATIONS</span>
                </span>
                <div className="flex flex-col divide-y divide-slate-850 text-[10px]">
                  {selectedObject.specifications.map((spec, sIdx) => (
                    <div key={sIdx} className="py-1 flex flex-col">
                      <span className="text-slate-400 text-[9px] font-bold uppercase">{spec.label}</span>
                      <span className="text-slate-200 font-mono text-[10px] leading-snug">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tactical Description & Intelligence Overview */}
              <div className="p-2.5 rounded border border-slate-800 bg-slate-900/60 flex flex-col gap-1 text-[10px]">
                <span className="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Info className="w-3 h-3 text-emerald-400" />
                  <span>OPERATIONAL BRIEFING</span>
                </span>
                <p className="text-slate-300 leading-relaxed font-sans text-[11px] pt-0.5">
                  {selectedObject.description}
                </p>
              </div>
            </>
          ) : (
            /* Empty state when no object is currently selected */
            <div className="p-3 rounded border border-slate-800 bg-slate-900/60 flex flex-col items-center text-center gap-2">
              <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Crosshair className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-200">NO TARGET LOCKED</div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Click any 3D asset in the main viewport (Missile, Submarine, Orbiting Satellites, Earth) or select from the theater registry below to inspect properties.
              </p>
            </div>
          )}

          {/* Quick Theater Asset Directory (All 12 selectable assets) */}
          <div className="p-2.5 rounded border border-slate-800 bg-slate-900/80 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>THEATER ASSETS (12)</span>
              <span className="text-[9px] text-emerald-400">CLICK TO INSPECT</span>
            </span>

            <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-slate-800">
              {ALL_SELECTABLE_OBJECTS.map((obj) => {
                const isCurrent = selectedObject?.id === obj.id;
                return (
                  <button
                    key={obj.id}
                    onClick={() => {
                      soundFx.playTargetLock();
                      onSelectObjectId?.(obj.id);
                    }}
                    className={`px-2 py-1.5 rounded flex items-center justify-between text-left cursor-pointer transition-all border ${
                      isCurrent
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-sm'
                        : 'bg-slate-950/60 hover:bg-slate-850 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                      <span className="text-[10px] font-bold truncate">{obj.name}</span>
                    </div>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 shrink-0 ml-1">
                      {obj.category}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Panel Footer: Current Telemetry Snapshot */}
      <div className="p-2 bg-slate-900/90 border-t border-slate-800 text-[10px] flex justify-between items-center text-slate-400 shrink-0">
        <span>T+{currentMissionTime.toFixed(1)}s</span>
        <span className="text-amber-400 font-bold">
          {activeTab === 'phases' ? `PHASE ${activeIndex + 1} / 9` : `${noodlingPattern} • ${subSpeedKnots} KT`}
        </span>
      </div>
    </aside>
  );
};
