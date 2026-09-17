import React from 'react';
import { Layers, Globe, Shield, Cpu, ExternalLink } from 'lucide-react';
import { soundFx } from '../audio/soundEngine';

export type ActivePocId = 'poc-01' | 'poc-02' | 'poc-architecture';

interface PocShellHeaderProps {
  activePoc: ActivePocId;
  onSelectPoc: (pocId: ActivePocId) => void;
}

export const PocShellHeader: React.FC<PocShellHeaderProps> = ({
  activePoc,
  onSelectPoc
}) => {
  return (
    <header className="bg-slate-950 border-b border-slate-800 text-slate-100 z-50">
      <div className="max-w-7xl mx-auto px-3 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Project Title & System Version */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-black text-sm shadow-md shadow-cyan-950/50">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-wider text-slate-100 uppercase">
                STRATCOM SIMULATION LAB
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800">
                MULTI-POC WORKSPACE
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
              <span>DATA-DRIVEN SIM ENGINE</span>
              <span className="text-slate-600">•</span>
              <span>SHARED REUSABLE CORE</span>
            </div>
          </div>
        </div>

        {/* Master POC Navigation Tabs */}
        <nav className="flex items-center bg-slate-900/90 p-1 rounded-lg border border-slate-800 gap-1 font-mono text-xs">
          {/* POC-01 */}
          <button
            onClick={() => {
              soundFx.playClick();
              onSelectPoc('poc-01');
            }}
            className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-2 cursor-pointer ${
              activePoc === 'poc-01'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>POC-01: TRIDENT II LAUNCH</span>
          </button>

          {/* POC-02 */}
          <button
            onClick={() => {
              soundFx.playClick();
              onSelectPoc('poc-02');
            }}
            className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-2 cursor-pointer ${
              activePoc === 'poc-02'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>POC-02: 3D SIM ENGINE (CYBERPUNK)</span>
          </button>

          {/* Architecture & Roadmap */}
          <button
            onClick={() => {
              soundFx.playClick();
              onSelectPoc('poc-architecture');
            }}
            className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-2 cursor-pointer ${
              activePoc === 'poc-architecture'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>CORE LIBRARY & ROADMAP</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
