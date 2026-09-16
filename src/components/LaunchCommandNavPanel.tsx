import React from 'react';
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
  RotateCcw
} from 'lucide-react';
import { soundFx } from '../audio/soundEngine';

export interface LaunchCommand {
  id: string;
  name: string;
  timeSec: number;
  stageKey: string;
  badge: string;
  desc: string;
  cameraMode: 'SUB_4KT' | 'BUBBLE_CAM' | 'FOLLOW' | 'PLATFORM_BUS' | 'TARGET_SILO' | 'SHIP';
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
    desc: 'Nose shroud jettison exposes MIRV deployment platform.',
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
    desc: 'Mk 4/5 warheads deployed on divergent target vectors.',
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

interface LaunchCommandNavPanelProps {
  currentMissionTime: number;
  currentStage: string;
  onExecuteCommand: (cmd: LaunchCommand) => void;
  autoCamEnabled: boolean;
  onToggleAutoCam: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onResetSim: () => void;
}

export const LaunchCommandNavPanel: React.FC<LaunchCommandNavPanelProps> = ({
  currentMissionTime,
  onExecuteCommand,
  autoCamEnabled,
  onToggleAutoCam,
  isPlaying,
  onTogglePlay,
  onResetSim
}) => {
  // Determine which command is currently active based on mission time
  const getActiveCommandIndex = () => {
    if (currentMissionTime < 3) return 0; // 4-KT TUBE
    if (currentMissionTime < 5.8) return 1; // GAS BUBBLE
    if (currentMissionTime < 6.8) return 2; // BROACH
    if (currentMissionTime < 60) return 3; // IGNITION (encompasses boost stages)
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

  return (
    <aside 
      id="left-nav-panel"
      className="w-full lg:w-64 xl:w-72 shrink-0 flex flex-col bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-2xl font-mono text-slate-200"
    >
      {/* Panel Title & Controller Header */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              COMMAND PANEL
            </span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            FBM STAGING
          </span>
        </div>

        {/* Global Play / Pause & Quick Step */}
        <div className="flex items-center gap-1.5 pt-1">
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

        {/* Auto Camera Sync Toggle */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
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
      </div>

      {/* 9 Flight Phase Commands List */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 divide-y divide-slate-850/60 max-h-[calc(100vh-260px)] scrollbar-thin scrollbar-thumb-slate-800">
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
              {/* Header row: Icon, Command Name, Badge */}
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

              {/* Status footer pill */}
              <div className="flex items-center justify-between text-[9px] pl-7 pt-0.5 text-slate-500">
                <span>VIEW: <span className="text-slate-300">{cmd.cameraMode}</span></span>
                <span>{isActive ? '● IN PROGRESS' : isPassed ? '✓ COMPLETED' : '○ QUEUED'}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Panel Footer: Current Telemetry Snapshot */}
      <div className="p-2.5 bg-slate-900/80 border-t border-slate-800 text-[10px] flex justify-between items-center text-slate-400">
        <span>T+{currentMissionTime.toFixed(1)}s</span>
        <span className="text-amber-400 font-bold">
          PHASE {activeIndex + 1} / 9
        </span>
      </div>
    </aside>
  );
};
