import React, { useState, useEffect, useRef } from 'react';
import { NAV_STARS } from '../data/dossierData';
import { NavigationalStar, TelemetryData } from '../types';
import { soundFx } from '../audio/soundEngine';
import { 
  Sparkles, 
  Crosshair, 
  CheckCircle2, 
  ShieldCheck, 
  RotateCcw, 
  Info,
  Compass
} from 'lucide-react';

interface StarTrackerGameProps {
  telemetry: TelemetryData;
  setTelemetry: React.Dispatch<React.SetStateAction<TelemetryData>>;
}

export const StarTrackerGame: React.FC<StarTrackerGameProps> = ({
  telemetry,
  setTelemetry
}) => {
  const [stars, setStars] = useState<NavigationalStar[]>(NAV_STARS);
  const [currentTargetIdx, setCurrentTargetIdx] = useState<number>(1); // default target: Vega
  const [reticlePos, setReticlePos] = useState<{ x: number; y: number }>({ x: 0.45, y: 0.42 });
  const [isAligning, setIsAligning] = useState<boolean>(false);
  const [alignmentScore, setAlignmentScore] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentTargetStar = stars[currentTargetIdx];

  // Draw the starfield and circular quartz reticle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      animId = requestAnimationFrame(render);
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(cx, cy) - 15;

      // Deep space black viewport
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, w, h);

      // Circular quartz window mask
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      // Background ambient stars
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 90; i++) {
        const seedX = ((i * 12345) % w);
        const seedY = ((i * 67890) % h);
        const sz = (i % 3 === 0) ? 1.5 : 1.0;
        ctx.globalAlpha = 0.2 + ((i % 5) * 0.15);
        ctx.fillRect(seedX, seedY, sz, sz);
      }
      ctx.globalAlpha = 1.0;

      // Draw Major Navigational Catalog Stars
      stars.forEach((star, idx) => {
        const sx = star.x * w;
        const sy = star.y * h;
        const isTarget = idx === currentTargetIdx;

        // Glow ring for target star
        if (isTarget) {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(sx, sy, 12, 0, Math.PI * 2);
          ctx.stroke();

          // Pulsing diamond marker
          const pulse = Math.sin(Date.now() / 200) * 2;
          ctx.strokeStyle = '#38bdf8';
          ctx.strokeRect(sx - 7 - pulse / 2, sy - 7 - pulse / 2, 14 + pulse, 14 + pulse);
        }

        // Star core
        ctx.fillStyle = star.matched ? '#34d399' : '#ffffff';
        ctx.beginPath();
        const coreSize = Math.max(2.5, 4.5 - star.magnitude * 0.8);
        ctx.arc(sx, sy, coreSize, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = isTarget ? '#38bdf8' : '#94a3b8';
        ctx.font = '10px monospace';
        ctx.fillText(star.name, sx + 14, sy + 3);
        if (isTarget) {
          ctx.fillStyle = '#67e8f9';
          ctx.font = '9px monospace';
          ctx.fillText(`MAG ${star.magnitude}`, sx + 14, sy + 14);
        }
      });

      // Draw Optical Sighting Crosshair Reticle
      const rx = reticlePos.x * w;
      const ry = reticlePos.y * h;

      ctx.strokeStyle = isAligning ? '#34d399' : '#f59e0b';
      ctx.lineWidth = 1.5;

      // Inner target circle
      ctx.beginPath();
      ctx.arc(rx, ry, 16, 0, Math.PI * 2);
      ctx.stroke();

      // Center dot
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(rx - 1.5, ry - 1.5, 3, 3);

      // Four crosshair ticks
      ctx.beginPath();
      ctx.moveTo(rx - 28, ry);
      ctx.lineTo(rx - 16, ry);
      ctx.moveTo(rx + 16, ry);
      ctx.lineTo(rx + 28, ry);
      ctx.moveTo(rx, ry - 28);
      ctx.lineTo(rx, ry - 16);
      ctx.moveTo(rx, ry + 16);
      ctx.lineTo(rx, ry + 28);
      ctx.stroke();

      ctx.restore();

      // Optical Outer Bezel & Brass Ring
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
      ctx.stroke();
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [stars, currentTargetIdx, reticlePos, isAligning]);

  // Handle canvas click to position the reticle
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    soundFx.playClick();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;
    setReticlePos({ x: clickX, y: clickY });
  };

  // Perform Kalman Stellar Sighting Update
  const handleAcquireFix = () => {
    soundFx.playClick();
    setIsAligning(true);

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Calculate distance between reticle and target star
    const dx = reticlePos.x - currentTargetStar.x;
    const dy = reticlePos.y - currentTargetStar.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If within alignment tolerance (0.05 normalized radius)
    if (distance < 0.055) {
      soundFx.playStellarLock();
      const accuracyScore = Math.max(90, Math.round((1 - distance / 0.055) * 100));
      setAlignmentScore(accuracyScore);

      // Mark star as matched
      setStars((prev) =>
        prev.map((st, idx) => (idx === currentTargetIdx ? { ...st, matched: true } : st))
      );

      // Snap missile CEP drift down to authentic sub-90 meter capability!
      const calibratedCEP = Number((45 + Math.random() * 32).toFixed(1));
      setTelemetry((prev) => ({
        ...prev,
        starLockStatus: 'CORRECTED',
        inertialDrift: calibratedCEP,
        telemetryStream: [
          `CELESTIAL KALMAN UPDATE: LOCKED ON STAR ${currentTargetStar.name.toUpperCase()}`,
          `ACCUMULATED GYRO DRIFT ZEROED OUT: RESIDUAL CEP = ${calibratedCEP}M (<90M SILO-BUSTING SPEC)`,
          ...prev.telemetryStream
        ]
      }));
    } else {
      soundFx.playTeletype();
      setAlignmentScore(null);
      setTelemetry((prev) => ({
        ...prev,
        telemetryStream: [
          `KALMAN RESIDUAL REJECTED: OPTICAL RETICLE OFFSET TOO HIGH FROM ${currentTargetStar.name.toUpperCase()}`,
          ...prev.telemetryStream
        ]
      }));
    }

    setTimeout(() => {
      setIsAligning(false);
    }, 1200);
  };

  const handleResetMinigame = () => {
    soundFx.playClick();
    setStars(NAV_STARS);
    setAlignmentScore(null);
    setReticlePos({ x: 0.45, y: 0.42 });
  };

  return (
    <div className="w-full flex flex-col gap-6 p-4 text-slate-100 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <h2 className="text-base font-mono font-bold text-white tracking-wider">
              MK 6 STELLAR-INERTIAL GUIDANCE CALIBRATION RETICLE
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Post-Boost Vehicle (PBV) Exospheric Star Sighting Window • Zeroing Out Accumulated Gyro Drift
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
            <span className="text-slate-400 text-[10px]">CURRENT CEP DRIFT:</span>{' '}
            <strong className={telemetry.inertialDrift < 90 ? 'text-emerald-400' : 'text-amber-400'}>
              ±{telemetry.inertialDrift.toFixed(1)} M
            </strong>
          </div>

          <div className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
            <span className="text-slate-400 text-[10px]">ACCURACY SPEC:</span>{' '}
            <strong className="text-cyan-400">&lt; 90M CEP</strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Optical Quartz Reticle Canvas */}
        <div className="lg:col-span-7 bg-slate-950 p-5 rounded-lg border border-slate-800 flex flex-col items-center justify-center relative shadow-xl">
          <div className="w-full flex items-center justify-between border-b border-slate-800 pb-2 mb-4 font-mono text-xs">
            <span className="text-cyan-400 font-bold flex items-center gap-2">
              <Crosshair className="w-4 h-4" />
              OPTICAL QUARTZ SENSOR BORESIGHT
            </span>
            <span className="text-slate-400 text-[11px]">CLICK CANVAS TO SLEW RETICLE</span>
          </div>

          <canvas
            ref={canvasRef}
            width={420}
            height={420}
            onClick={handleCanvasClick}
            className="cursor-crosshair rounded-full shadow-[0_0_30px_rgba(56,189,248,0.2)] max-w-full"
          />

          {/* Slew Control Pad (Arrow buttons for touch or desktop) */}
          <div className="mt-4 flex flex-wrap items-center justify-between w-full font-mono text-xs pt-2 border-t border-slate-850">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">FINE SLEW:</span>
              <button
                onClick={() => setReticlePos((p) => ({ ...p, x: Math.max(0.1, p.x - 0.02) }))}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 cursor-pointer"
              >
                ←
              </button>
              <button
                onClick={() => setReticlePos((p) => ({ ...p, x: Math.min(0.9, p.x + 0.02) }))}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 cursor-pointer"
              >
                →
              </button>
              <button
                onClick={() => setReticlePos((p) => ({ ...p, y: Math.max(0.1, p.y - 0.02) }))}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 cursor-pointer"
              >
                ↑
              </button>
              <button
                onClick={() => setReticlePos((p) => ({ ...p, y: Math.min(0.9, p.y + 0.02) }))}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 cursor-pointer"
              >
                ↓
              </button>
            </div>

            <button
              id="btn-acquire-star-fix"
              onClick={handleAcquireFix}
              disabled={isAligning}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold rounded shadow transition-all cursor-pointer flex items-center gap-2"
            >
              <Crosshair className="w-4 h-4" />
              <span>{isAligning ? 'COMPUTING KALMAN MATRIX...' : 'ACQUIRE STAR FIX'}</span>
            </button>
          </div>
        </div>

        {/* Right: Star Catalog & Guidance Status */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Target Star Selector */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-3">
              <span className="text-xs font-bold text-amber-400">CELESTIAL CATALOG TARGETS</span>
              <button
                onClick={handleResetMinigame}
                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                RESET
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {stars.map((star, idx) => {
                const isSelected = idx === currentTargetIdx;
                return (
                  <button
                    key={star.name}
                    onClick={() => {
                      soundFx.playClick();
                      setCurrentTargetIdx(idx);
                    }}
                    className={`p-2.5 rounded border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-md'
                        : 'bg-slate-900/60 border-slate-850 text-slate-300 hover:bg-slate-850'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${star.matched ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        <span>{star.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({star.designation})</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                        RA: {star.rightAscension} | DEC: {star.declination} | MAG: {star.magnitude}
                      </div>
                    </div>

                    {star.matched && (
                      <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        FIXED
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alignment Accuracy Outcome Banner */}
          {alignmentScore !== null && (
            <div className="p-4 rounded-lg bg-emerald-950/70 border border-emerald-500 font-mono text-xs flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-emerald-300 font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  KALMAN FILTER MATRIX UPDATED!
                </span>
                <span className="text-xs bg-emerald-900 px-2 py-0.5 rounded text-emerald-200 font-bold">
                  GRADE: A+ (SILO-BUSTER)
                </span>
              </div>
              <p className="text-slate-300 text-[11px] font-sans">
                Optical star sighting matched catalog coordinates. Accumulated launch and gyro drift has been reduced to{' '}
                <strong className="text-emerald-300">{telemetry.inertialDrift}m</strong>, fulfilling the critical sub-90m CEP target!
              </p>
            </div>
          )}

          {/* Technical Explanatory Card */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-sans text-xs text-slate-300 leading-relaxed">
            <div className="font-mono font-bold text-amber-400 text-xs mb-2 flex items-center gap-1.5">
              <Info className="w-4 h-4" />
              HOW THE TRIDENT II MK 6 STAR SIGHTING WORKS
            </div>
            <p className="mb-2">
              Ballistic missiles flying 4,000+ miles suffer from subtle gyro precession and submarine launch orientation errors.
            </p>
            <p>
              By observing stars from space outside Earth&apos;s atmosphere, the MK 6 system takes a celestial snapshot. An onboard Kalman filter compares the observed angle with the expected star position, calculating the exact error vector and correcting the Post-Boost Vehicle (PBV) trajectory before releasing MIRVs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
