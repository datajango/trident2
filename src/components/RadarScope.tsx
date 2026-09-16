import React, { useEffect, useRef, useState } from 'react';
import { soundFx } from '../audio/soundEngine';
import { Crosshair, Radio, Shield, Zap } from 'lucide-react';

interface RadarScopeProps {
  targetDistanceKm: number;
  targetAltitudeKm: number;
  targetVelocityMs: number;
  targetStage: string;
}

export const RadarScope: React.FC<RadarScopeProps> = ({
  targetDistanceKm,
  targetAltitudeKm,
  targetVelocityMs,
  targetStage
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rangeScaleNm, setRangeScaleNm] = useState<number>(200);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [radarGain, setRadarGain] = useState<number>(85);
  const [phosphorColor, setPhosphorColor] = useState<'GREEN' | 'AMBER'>('GREEN');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let sweepAngle = 0;

    // Blip history for phosphor decay
    const blipTrails: { x: number; y: number; alpha: number }[] = [];

    const render = () => {
      animId = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(centerX, centerY) - 18;

      // Dark background with slight phosphor persistence
      ctx.fillStyle = phosphorColor === 'GREEN' ? 'rgba(5, 18, 12, 0.15)' : 'rgba(20, 12, 4, 0.15)';
      ctx.fillRect(0, 0, width, height);

      // Radar Range Rings
      const ringColor = phosphorColor === 'GREEN' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)';
      const textColor = phosphorColor === 'GREEN' ? '#34d399' : '#fbbf24';
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = 1;

      const rings = [0.25, 0.5, 0.75, 1.0];
      rings.forEach((rRatio) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * rRatio, 0, Math.PI * 2);
        ctx.stroke();

        // Range ring distance label
        ctx.fillStyle = textColor;
        ctx.font = '10px monospace';
        const distVal = (rangeScaleNm * rRatio).toFixed(0);
        ctx.fillText(`${distVal} NM`, centerX + 4, centerY - radius * rRatio + 12);
      });

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY + radius);
      ctx.stroke();

      // Azimuth tick marks (every 30 degrees)
      for (let deg = 0; deg < 360; deg += 30) {
        const rad = (deg * Math.PI) / 180;
        const x1 = centerX + Math.cos(rad) * (radius - 5);
        const y1 = centerY + Math.sin(rad) * (radius - 5);
        const x2 = centerX + Math.cos(rad) * radius;
        const y2 = centerY + Math.sin(rad) * radius;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.fillStyle = textColor;
        ctx.font = '9px monospace';
        const tx = centerX + Math.cos(rad) * (radius + 10);
        const ty = centerY + Math.sin(rad) * (radius + 10) + 3;
        ctx.fillText(`${deg}°`, tx - 8, ty);
      }

      // Rotating Sweep Beam
      sweepAngle += 0.035;
      if (sweepAngle >= Math.PI * 2) {
        sweepAngle = 0;
        soundFx.playRadarPing();
      }

      // Sweep gradient sector
      const sweepGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      sweepGrad.addColorStop(0, phosphorColor === 'GREEN' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(251, 191, 36, 0.3)');
      sweepGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, sweepAngle - 0.25, sweepAngle);
      ctx.closePath();
      ctx.fillStyle = phosphorColor === 'GREEN' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)';
      ctx.fill();

      // Leading beam line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(sweepAngle) * radius, centerY + Math.sin(sweepAngle) * radius);
      ctx.strokeStyle = phosphorColor === 'GREEN' ? '#6ee7b7' : '#fde68a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Calculate Target Blip Position on Radar Screen
      // Downrange distance in Nautical Miles
      const targetDistNm = targetDistanceKm * 0.539957;
      const normDist = Math.min(1.0, targetDistNm / rangeScaleNm);
      // Bearing simulated at ~138 degrees (SE launch corridor)
      const targetAzRad = (138 * Math.PI) / 180;
      const blipX = centerX + Math.cos(targetAzRad) * (radius * normDist);
      const blipY = centerY + Math.sin(targetAzRad) * (radius * normDist);

      // Check if sweep line just passed over blip
      const blipAngle = (targetAzRad + Math.PI * 2) % (Math.PI * 2);
      const angleDiff = Math.abs(sweepAngle - blipAngle);
      if (angleDiff < 0.05) {
        blipTrails.push({ x: blipX, y: blipY, alpha: 1.0 });
      }

      // Draw blip trails
      for (let i = blipTrails.length - 1; i >= 0; i--) {
        const b = blipTrails[i];
        b.alpha -= 0.008;
        if (b.alpha <= 0) {
          blipTrails.splice(i, 1);
          continue;
        }

        ctx.fillStyle = phosphorColor === 'GREEN' 
          ? `rgba(110, 231, 183, ${b.alpha})` 
          : `rgba(253, 230, 138, ${b.alpha})`;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4 + (1 - b.alpha) * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Active Target Tracking Reticle
      if (isLocked) {
        ctx.strokeStyle = phosphorColor === 'GREEN' ? '#10b981' : '#f59e0b';
        ctx.lineWidth = 1.5;
        // Tracking Box
        ctx.strokeRect(blipX - 9, blipY - 9, 18, 18);

        // Velocity vector line
        const vectorLen = Math.min(45, (targetVelocityMs / 100) * 1.5);
        ctx.beginPath();
        ctx.moveTo(blipX, blipY);
        ctx.lineTo(blipX + Math.cos(targetAzRad) * vectorLen, blipY + Math.sin(targetAzRad) * vectorLen);
        ctx.stroke();

        // Target Tag
        ctx.fillStyle = textColor;
        ctx.font = '10px monospace';
        ctx.fillText(`TRK-01 [${targetStage}]`, blipX + 12, blipY - 4);
        ctx.fillText(`R: ${targetDistNm.toFixed(1)} NM`, blipX + 12, blipY + 8);
        ctx.fillText(`ALT: ${targetAltitudeKm.toFixed(1)} KM`, blipX + 12, blipY + 20);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [rangeScaleNm, isLocked, phosphorColor, targetDistanceKm, targetAltitudeKm, targetVelocityMs, targetStage]);

  return (
    <div className="flex flex-col rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
          <Crosshair className="w-4 h-4 animate-spin-slow" />
          <span>C-BAND RADAR SCOPE (AN/FPS-16 MONOPULSE)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">PHOSPHOR:</span>
          <button
            onClick={() => {
              soundFx.playClick();
              setPhosphorColor('GREEN');
            }}
            className={`w-4 h-4 rounded-full border ${phosphorColor === 'GREEN' ? 'bg-emerald-500 border-white' : 'bg-emerald-950 border-slate-700'}`}
            title="P31 Green Phosphor"
          />
          <button
            onClick={() => {
              soundFx.playClick();
              setPhosphorColor('AMBER');
            }}
            className={`w-4 h-4 rounded-full border ${phosphorColor === 'AMBER' ? 'bg-amber-500 border-white' : 'bg-amber-950 border-slate-700'}`}
            title="Amber CRT Phosphor"
          />
        </div>
      </div>

      {/* Radar Canvas with authentic CRT bezel */}
      <div className="flex items-center justify-center p-2 bg-black/90 rounded border border-slate-850 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={380}
          height={380}
          className="rounded-full shadow-[0_0_20px_rgba(16,185,129,0.15)] max-w-full"
        />

        {/* Scanlines overlay effect */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_65%,rgba(0,0,0,0.85)_100%)]" />
      </div>

      {/* Radar Scope Controls & Telemetry Data */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-900/80 p-2 rounded border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">RANGE SCALE:</span>
          <div className="flex gap-1">
            {[100, 200, 400].map((scale) => (
              <button
                key={scale}
                onClick={() => {
                  soundFx.playClick();
                  setRangeScaleNm(scale);
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${
                  rangeScaleNm === scale ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {scale}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/80 p-2 rounded border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">TRACK GATE:</span>
          <button
            onClick={() => {
              soundFx.playClick();
              setIsLocked(!isLocked);
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
              isLocked ? 'bg-emerald-950 border border-emerald-500 text-emerald-300' : 'bg-red-950 border border-red-700 text-red-300'
            }`}
          >
            {isLocked ? 'AUTOTRACK LOCKED' : 'BREAK LOCK'}
          </button>
        </div>
      </div>
    </div>
  );
};
