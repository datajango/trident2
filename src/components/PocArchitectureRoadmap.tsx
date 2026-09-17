import React from 'react';
import { Layers, Cpu, Globe, Shield, Terminal, ArrowRight, CheckCircle2, Code2, Database, Zap } from 'lucide-react';
import { soundFx } from '../audio/soundEngine';

interface PocArchitectureRoadmapProps {
  onLaunchPoc2: () => void;
  onLaunchPoc1: () => void;
}

export const PocArchitectureRoadmap: React.FC<PocArchitectureRoadmapProps> = ({
  onLaunchPoc2,
  onLaunchPoc1
}) => {
  return (
    <div className="flex-1 bg-slate-950 text-slate-100 overflow-y-auto p-4 md:p-8 font-mono">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        {/* Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
              <Cpu className="w-4 h-4" />
              <span>ARCHITECTURAL REFACTORING & EXTRACTION</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-wide">
              FROM MONOLITH TO SIMULATION CASSETTE ENGINE
            </h1>
            <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
              POC-01 (Trident II Sub-Launch & USNS Vanguard Dossier) has been demoted to the first proof-of-concept in our tactical suite. Core 3D orbital propagation, geodetic positioning, and rendering subsystems have been extracted into an autonomous, data-driven simulation and game engine.
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={() => {
                soundFx.playClick();
                onLaunchPoc2();
              }}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <span>LAUNCH POC-02 ENGINE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                onLaunchPoc1();
              }}
              className="px-4 py-2 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-2 cursor-pointer border border-slate-700"
            >
              <span>RETURN TO POC-01</span>
            </button>
          </div>
        </div>

        {/* 3 Core Extraction Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pillar 1 */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-cyan-300">1. DATA-DRIVEN CASSETTE SPEC</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every simulation is now encapsulated into a standardized JSON <code>SimulationCassette</code>. Cassettes define world radius, visual style (Cyberpunk Retro Vector vs. Tactical CRT), multi-domain layers, tactical entities, and AI behavioral scripts.
            </p>
            <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>src/engine/types.ts</span>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-amber-300">2. CYBERPUNK VECTOR GLOBE</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Extracted from POC-01 and elevated into a procedural wireframe planet. Generates glowing neon continental boundaries, latitude/longitude graticules, international shipping lanes, and submarine defense bastions with CRT vector aesthetics.
            </p>
            <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>src/engine/cyberpunkVectorWorld.ts</span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-emerald-300">3. SECURITY HIERARCHY & ROE</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Integrated multi-level security clearance model (UNCLASSIFIED to COSMIC BICES). Restricted sensor tracks, SSBN bastions, and stealth bombers are masked or redacted in real time based on active user clearance.
            </p>
            <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>src/engine/simulationMath.ts</span>
            </div>
          </div>
        </div>

        {/* Engine Graduation Modes Comparison */}
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              ENGINE GRADUATION TIERS (VIEWER ➔ GAME ➔ AUTHORING TOOL)
            </h2>
            <span className="text-xs text-slate-500">TRI-MODAL ARCHITECTURE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-cyan-500/30">
              <span className="text-cyan-400 font-bold block mb-1">TIER 1: OBSERVATION VIEWER</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Passive tactical monitoring, high-speed time warping (1x to 100x), continuous entity tracking, and sensor coverage bubble analysis.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-amber-500/30">
              <span className="text-amber-400 font-bold block mb-1">TIER 2: CONSTRAINED GAME</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Command & Control interaction: issue DEFCON escalations, scramble Quick Reaction Alert interceptors, activate silent running, and resolve crisis scenarios.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-emerald-500/30">
              <span className="text-emerald-400 font-bold block mb-1">TIER 3: AUTHORING STUDIO</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Live asset placement on the globe, entity parameter editing, waypoint manipulation, narrative timeline event creation, and JSON cassette export/import.
              </p>
            </div>
          </div>
        </div>

        {/* POC Roadmap Timeline */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-slate-300">PROGRESSIVE PROOF-OF-CONCEPT ROADMAP</h2>
          <div className="flex flex-col gap-2 text-xs">
            <div className="p-3 rounded-lg bg-slate-900 border border-amber-500/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  POC-01
                </span>
                <span className="font-bold text-slate-200">TRIDENT II SUB-LAUNCH & RANGE INSTRUMENTATION SHIP</span>
              </div>
              <span className="text-emerald-400 text-[11px] font-bold">COMPLETED (ACTIVE)</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-cyan-500/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                  POC-02
                </span>
                <span className="font-bold text-slate-200">DATA-DRIVEN SIMULATION ENGINE & CYBERPUNK VECTOR THEATER</span>
              </div>
              <span className="text-cyan-400 text-[11px] font-bold">RELEASED (ACTIVE)</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 flex items-center justify-between opacity-60">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold">
                  POC-03
                </span>
                <span className="text-slate-400">PROCEDURAL KINETIC ASAT & MULTI-AGENT WARGAMING RULES</span>
              </div>
              <span className="text-slate-500 text-[11px]">QUEUED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
