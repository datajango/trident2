import React, { useState } from 'react';
import {
  Box,
  Save,
  RotateCcw,
  Check,
  ZoomIn,
  ZoomOut,
  Lock,
  Unlock,
  Sliders,
  ChevronUp,
  ChevronDown,
  Compass
} from 'lucide-react';
import { CameraMemoryParameters } from './types';

interface IsoCameraControlWidgetProps {
  cameraParams: CameraMemoryParameters;
  currentZoomDistance: number;
  onToggleIsoPerspective: (force?: boolean) => void;
  onSaveCurrentZoom: (distance: number) => void;
  onApplySavedZoom: () => void;
  onSetZoomDistance: (distance: number) => void;
  onSetIsoQuadrant: (quadrantDeg: number) => void;
  onToggleLockIsoAngle: () => void;
}

export const IsoCameraControlWidget: React.FC<IsoCameraControlWidgetProps> = ({
  cameraParams,
  currentZoomDistance,
  onToggleIsoPerspective,
  onSaveCurrentZoom,
  onApplySavedZoom,
  onSetZoomDistance,
  onSetIsoQuadrant,
  onToggleLockIsoAngle
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState<boolean>(false);

  const handleSave = () => {
    onSaveCurrentZoom(currentZoomDistance);
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 2000);
  };

  const roundedCurZoom = Math.round(currentZoomDistance * 10) / 10;
  const zoomMultiplier = Math.round((currentZoomDistance / 55.0) * 100) / 100;

  return (
    <div className="absolute top-3 right-3 md:right-[215px] z-30 font-mono text-xs pointer-events-auto flex flex-col items-end max-w-[calc(100%-120px)]">
      {/* Compact Header Pill Bar */}
      <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900/95 border border-cyan-500/50 shadow-2xl backdrop-blur">
        {/* ISO PERSPECTIVE MASTER TOGGLE */}
        <button
          onClick={() => onToggleIsoPerspective()}
          className={`px-2.5 py-1 rounded text-[10px] font-extrabold transition cursor-pointer flex items-center gap-1.5 border ${
            cameraParams.isIsoPerspective
              ? 'bg-cyan-500/35 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400 shadow-md shadow-cyan-950'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle Isometric Perspective View (Fixed 35.26° x 45° Angle & Saved Zoom Parameter)"
        >
          <Box className={`w-3.5 h-3.5 ${cameraParams.isIsoPerspective ? 'text-cyan-300 animate-pulse' : 'text-slate-500'}`} />
          <span>ISO PERSPECTIVE: {cameraParams.isIsoPerspective ? 'ON' : 'OFF'}</span>
        </button>

        {/* Live Zoom Factor Readout */}
        <div className="px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-[10px] text-slate-300 flex items-center gap-1.5">
          <span className="text-slate-500">ZOOM:</span>
          <span className="font-bold text-cyan-400">{roundedCurZoom}u</span>
          <span className="text-[9px] text-slate-400">({zoomMultiplier}x)</span>
        </div>

        {/* Instant Save Zoom Button */}
        <button
          onClick={handleSave}
          className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-1 border ${
            showSavedFeedback
              ? 'bg-emerald-500 text-black border-emerald-400'
              : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700 hover:border-cyan-500/50'
          }`}
          title="Save current zoom factor into in-memory parameters"
        >
          {showSavedFeedback ? (
            <>
              <Check className="w-3 h-3 text-black" />
              <span>SAVED!</span>
            </>
          ) : (
            <>
              <Save className="w-3 h-3 text-cyan-400" />
              <span>SAVE ZOOM</span>
            </>
          )}
        </button>

        {/* Expand / Collapse In-Memory Parameters Inspector */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-1 rounded text-[10px] transition cursor-pointer border ${
            isExpanded
              ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60'
              : 'bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 border-slate-700'
          }`}
          title={isExpanded ? 'Collapse in-memory parameters drawer' : 'Open in-memory camera parameters drawer'}
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Expanded In-Memory Parameters Drawer */}
      {isExpanded && (
        <div className="mt-1.5 w-76 p-3 rounded-lg bg-slate-950/95 border border-cyan-500/60 shadow-2xl backdrop-blur flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px]">
              <Compass className="w-3.5 h-3.5" />
              <span>IN-MEMORY CAMERA PARAMETERS</span>
            </div>
            <span className="text-[9px] text-slate-500">RUNTIME PARAMS</span>
          </div>

          {/* Status & Values Display */}
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex flex-col">
              <span className="text-slate-500">PROJECTION:</span>
              <span className={`font-bold ${cameraParams.isIsoPerspective ? 'text-cyan-300' : 'text-slate-300'}`}>
                {cameraParams.isIsoPerspective ? 'ISOMETRIC (35.26°)' : 'FREE ORBITAL'}
              </span>
            </div>
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex flex-col">
              <span className="text-slate-500">SAVED PARAMETER:</span>
              <span className="font-bold text-amber-300">
                {cameraParams.savedZoomFactor}u ({cameraParams.zoomMultiplier}x)
              </span>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSave}
              className="flex-1 py-1 px-2 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/80 text-cyan-200 font-bold text-[10px] cursor-pointer flex items-center justify-center gap-1 shadow"
            >
              <Save className="w-3 h-3 text-cyan-400" />
              <span>SAVE CURRENT ZOOM</span>
            </button>
            <button
              onClick={onApplySavedZoom}
              className="flex-1 py-1 px-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-[10px] cursor-pointer flex items-center justify-center gap-1"
              title="Apply stored in-memory zoom factor to active camera"
            >
              <RotateCcw className="w-3 h-3 text-amber-400" />
              <span>RECALL SAVED</span>
            </button>
          </div>

          {/* Zoom Slider Control */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>ZOOM DISTANCE:</span>
              <span className="font-bold text-cyan-300">{roundedCurZoom} units</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSetZoomDistance(Math.max(20, currentZoomDistance * 0.85))}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <input
                type="range"
                min="25"
                max="350"
                step="5"
                value={Math.min(350, Math.max(25, currentZoomDistance))}
                onChange={(e) => onSetZoomDistance(parseFloat(e.target.value))}
                className="flex-1 accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
              <button
                onClick={() => onSetZoomDistance(Math.min(950, currentZoomDistance * 1.15))}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Zoom Distance Presets */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500">QUICK ZOOM PRESETS:</span>
            <div className="grid grid-cols-4 gap-1">
              {[
                { label: 'CLOSE', dist: 35 },
                { label: 'TACTICAL', dist: 55 },
                { label: 'SECTOR', dist: 110 },
                { label: 'THEATER', dist: 260 }
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => onSetZoomDistance(p.dist)}
                  className={`py-0.5 rounded text-[9px] font-bold border transition cursor-pointer ${
                    Math.abs(currentZoomDistance - p.dist) < 10
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p.label} ({p.dist})
                </button>
              ))}
            </div>
          </div>

          {/* Isometric Perspective Compass Quadrants */}
          <div className="flex flex-col gap-1 border-t border-slate-800 pt-1.5">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-500">ISO QUADRANT ORIENTATION:</span>
              <button
                onClick={onToggleLockIsoAngle}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 border cursor-pointer ${
                  cameraParams.lockIsoAngle
                    ? 'bg-purple-950 border-purple-500 text-purple-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
                title="Lock camera to strict isometric angles during orbit"
              >
                {cameraParams.lockIsoAngle ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                <span>LOCK ANGLE: {cameraParams.lockIsoAngle ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1">
              {[
                { label: 'NE', deg: 45 },
                { label: 'SE', deg: 135 },
                { label: 'SW', deg: 225 },
                { label: 'NW', deg: 315 }
              ].map((quad) => (
                <button
                  key={quad.label}
                  onClick={() => onSetIsoQuadrant(quad.deg)}
                  className={`py-0.5 rounded text-[9px] font-bold border transition cursor-pointer ${
                    cameraParams.isIsoPerspective && Math.abs((cameraParams.azimuthDeg % 360) - quad.deg) < 5
                      ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title={`Orient Isometric view to ${quad.label} (${quad.deg}°)`}
                >
                  {quad.label} ({quad.deg}°)
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
