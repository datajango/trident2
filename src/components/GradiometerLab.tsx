import React, { useState } from 'react';
import { soundFx } from '../audio/soundEngine';
import { 
  Compass, 
  Waves, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw,
  Info,
  Target,
  Cpu,
  Zap,
  Flame,
  ArrowRight,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';

export const GradiometerLab: React.FC = () => {
  const [seamountHeight, setSeamountHeight] = useState<number>(3200); // meters undersea mount
  const [isGssCompensated, setIsGssCompensated] = useState<boolean>(true);
  const [subDepthMeters, setSubDepthMeters] = useState<number>(120);
  const [warheadType, setWarheadType] = useState<'W76' | 'W88'>('W88');
  const [targetSiloHardnessPsi, setTargetSiloHardnessPsi] = useState<number>(2000); // hardened Soviet ICBM silo rating

  // Compute Deflection of the Vertical in arcseconds
  // Deflection angle is proportional to anomalous mass of seamount
  const uncompensatedDeflectionArcsec = (seamountHeight / 300) * 1.85; // e.g. ~19.7 arcseconds
  const currentDeflectionArcsec = isGssCompensated ? 0.08 : uncompensatedDeflectionArcsec;

  // Downrange trajectory multiplier over 4200 nautical miles
  // 1 arcsecond pitch error at cold-gas launch / burnout translates to ~60-80 meters downrange ellipse error
  const downrangeMissMeters = isGssCompensated ? 38 : Math.round(currentDeflectionArcsec * 68);

  // Nuclear blast physics overpressure calculation:
  // W88 = 455 kt TNT equivalent; W76 = 100 kt TNT equivalent
  const yieldKt = warheadType === 'W88' ? 455 : 100;
  // Scaled distance: d_scaled = R / (Y^(1/3))
  const scaledDistanceM = Math.max(15, downrangeMissMeters) / Math.cbrt(yieldKt);
  // Empirical Brode formula for peak blast overpressure (in psi):
  const rawOverpressurePsi = Math.round(
    (yieldKt * 120000) / (downrangeMissMeters ** 1.85 + 400)
  );
  const finalOverpressurePsi = isGssCompensated 
    ? (warheadType === 'W88' ? 3150 : 2180) 
    : Math.max(12, Math.min(65, Math.round(rawOverpressurePsi)));

  // Probability of Kill (P_k) against blast-hardened silo:
  const isKill = finalOverpressurePsi >= targetSiloHardnessPsi;
  const killProbability = isGssCompensated 
    ? (warheadType === 'W88' ? 99.8 : 98.4) 
    : (warheadType === 'W88' ? 22.4 : 14.1);

  // Eötvös tensor values (1 E = 10^-9 s^-2)
  const gammaXX = (seamountHeight * 0.012).toFixed(1);
  const gammaXY = (seamountHeight * 0.004).toFixed(1);
  const gammaXZ = (seamountHeight * 0.028).toFixed(1);
  const gammaZZ = (-(parseFloat(gammaXX) + parseFloat(gammaXZ))).toFixed(1);

  const handleToggleCompensation = () => {
    soundFx.playClick();
    if (!isGssCompensated) {
      soundFx.playStellarLock();
    }
    setIsGssCompensated(!isGssCompensated);
  };

  return (
    <div className="w-full flex flex-col gap-6 p-4 text-slate-100 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-md font-mono">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-pink-400" />
            <h2 className="text-base font-bold text-white tracking-wider">
              BELL AEROSPACE GRAVITY GRADIOMETER SYSTEM (GSS) &amp; SINS INTEGRATION
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Real-Time Deflection of the Vertical Correction • Trident SINS Calibration • Downrange MIRV Lethality
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
            <span className="text-slate-400 text-[10px]">TENSOR UNIT:</span>{' '}
            <strong className="text-pink-400">EÖTVÖS (10⁻⁹ s⁻²)</strong>
          </div>
          <div className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
            <span className="text-slate-400 text-[10px]">SINS RESIDUAL TILT:</span>{' '}
            <strong className={isGssCompensated ? 'text-emerald-400' : 'text-rose-400'}>
              {currentDeflectionArcsec.toFixed(2)}&quot;
            </strong>
          </div>
          <div className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
            <span className="text-slate-400 text-[10px]">MIRV LETHALITY (Pk):</span>{' '}
            <strong className={isKill ? 'text-emerald-400' : 'text-rose-400'}>
              {killProbability}%
            </strong>
          </div>
        </div>
      </div>

      {/* Row 1: Bathymetry Gravity Tensor Profile & SINS Bus Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Bathymetry Canvas */}
        <div className="lg:col-span-7 bg-slate-950 p-5 rounded-lg border border-slate-800 flex flex-col shadow-xl font-mono">
          <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-4 text-xs">
            <span className="text-pink-400 font-bold flex items-center gap-2">
              <Waves className="w-4 h-4" />
              UNDERSEA MASS ANOMALY &amp; DEFLECTION OF VERTICAL
            </span>
            <span className="text-[11px] text-slate-400">SUBMERGED DEPTH: {subDepthMeters}M</span>
          </div>

          {/* SVG Bathymetric Cross-Section */}
          <div className="relative w-full h-64 bg-gradient-to-b from-sky-950/40 via-slate-900/60 to-slate-950 rounded border border-slate-850 overflow-hidden flex items-end">
            <svg viewBox="0 0 600 240" className="w-full h-full">
              {/* Ocean Water Surface */}
              <line x1="0" y1="25" x2="600" y2="25" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4,4" />
              <text x="15" y="20" fill="#38bdf8" fontSize="10" fontFamily="monospace">
                OCEAN SURFACE (Broach Plane)
              </text>

              {/* Submarine in water column */}
              <g transform="translate(180, 55)">
                <rect x="0" y="0" width="85" height="18" rx="8" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
                <rect x="35" y="-9" width="18" height="10" rx="3" fill="#475569" stroke="#94a3b8" />
                <text x="10" y="12" fill="#f8fafc" fontSize="8" fontFamily="monospace">
                  SSBN 4-KT RUN
                </text>

                {/* True Geodetic Vertical (Green Dashed) */}
                <line x1="42" y1="-25" x2="42" y2="60" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3,3" />

                {/* Local Apparent Gravity (deflected toward seamount) */}
                <line
                  x1="42"
                  y1="-25"
                  x2={isGssCompensated ? 42 : 42 + (uncompensatedDeflectionArcsec * 0.8)}
                  y2="60"
                  stroke={isGssCompensated ? '#10b981' : '#f43f5e'}
                  strokeWidth="2.5"
                />

                {/* Submarine Launch Tube Alignment Vector */}
                <line
                  x1="42"
                  y1="-2"
                  x2={isGssCompensated ? 42 : 42 - (uncompensatedDeflectionArcsec * 0.8)}
                  y2="-35"
                  stroke="#fbbf24"
                  strokeWidth="2.5"
                />
              </g>

              {/* Ocean Floor with Undersea Seamount Anomaly */}
              <path
                d={`M 0,220 
                   Q 150,215 220,${220 - seamountHeight * 0.035} 
                   Q 310,${220 - seamountHeight * 0.045} 400,220 
                   L 600,225 
                   L 600,240 
                   L 0,240 Z`}
                fill="#1e293b"
                stroke="#475569"
                strokeWidth="2"
              />

              {/* Seamount Label */}
              <text x="270" y="215" fill="#f472b6" fontSize="10" fontFamily="monospace">
                HIGH-DENSITY BASALT SEAMOUNT ({seamountHeight}M)
              </text>
            </svg>

            {/* In-canvas legend */}
            <div className="absolute top-2 right-2 bg-slate-950/90 p-2 rounded border border-slate-800 text-[10px] space-y-1 backdrop-blur">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" />
                <span>True Geodetic Normal</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-0.5 bg-rose-400 inline-block" />
                <span>Distorted Local Plumb Line</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-0.5 bg-amber-400 inline-block" />
                <span>Tube Launch Pitch Angle</span>
              </div>
            </div>
          </div>

          {/* Controls: Seamount Height & GSS Toggle */}
          <div className="mt-4 p-3 bg-slate-900/80 rounded border border-slate-850 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">BATHYMETRIC SEAMOUNT ELEVATION:</span>
              <span className="font-bold text-white">{seamountHeight} METERS</span>
            </div>
            <input
              type="range"
              min={500}
              max={5000}
              step={100}
              value={seamountHeight}
              onChange={(e) => setSeamountHeight(Number(e.target.value))}
              className="w-full accent-pink-500 cursor-pointer"
            />

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div className="text-xs">
                <div className="font-bold text-slate-200">GSS TENSOR UPDATE TO SINS:</div>
                <div className="text-[10px] text-slate-400">
                  {isGssCompensated
                    ? 'Transmitting gravity gradient map-match fix to ESGM SINS bus'
                    : 'Bypassed: SINS gyro stabilized to local anomalous gravity vector'}
                </div>
              </div>

              <button
                id="btn-toggle-gss-lab"
                onClick={handleToggleCompensation}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isGssCompensated
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
                    : 'bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-600'
                }`}
              >
                {isGssCompensated ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{isGssCompensated ? 'GSS UPDATE ON' : 'GSS UPDATE OFF'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: SINS Architecture & Tensor Matrix */}
        <div className="lg:col-span-5 flex flex-col gap-4 font-mono">
          {/* SINS Data Bus Pipeline */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 shadow-md">
            <div className="text-xs font-bold text-slate-300 border-b border-slate-850 pb-2 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Cpu className="w-4 h-4" />
                SINS BUS CALIBRATION ARCHITECTURE
              </span>
              <span className="text-[10px] text-slate-500">MK 2 MOD 7</span>
            </div>

            {/* Step-by-Step Bus Transfer Flow */}
            <div className="space-y-2 text-[11px]">
              <div className="p-2 rounded bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-pink-400 font-bold">1. BELL GSS CARROUSEL</span>
                  <p className="text-[10px] text-slate-400">4 rotating accelerometer pairs cancel submarine motion</p>
                </div>
                <span className="text-emerald-400 font-bold text-xs">{gammaXZ} E</span>
              </div>

              <div className="flex justify-center text-slate-600">
                <ArrowRight className="w-3.5 h-3.5 rotate-90" />
              </div>

              <div className="p-2 rounded bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-amber-400 font-bold">2. FBM FIRE CONTROL COMP</span>
                  <p className="text-[10px] text-slate-400">Computes Deflection of Vertical (ξ, η) map-matching</p>
                </div>
                <span className={`font-bold text-xs ${isGssCompensated ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isGssCompensated ? 'COMPENSATED' : 'RAW DRIFT'}
                </span>
              </div>

              <div className="flex justify-center text-slate-600">
                <ArrowRight className="w-3.5 h-3.5 rotate-90" />
              </div>

              <div className="p-2 rounded bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-cyan-400 font-bold">3. SINS (ESGM NAVIGATOR)</span>
                  <p className="text-[10px] text-slate-400">Transfers true geodetic reference frame to Trident MK 6</p>
                </div>
                <span className={`font-bold text-xs ${isGssCompensated ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isGssCompensated ? '0.08" RESIDUAL' : `${uncompensatedDeflectionArcsec.toFixed(1)}" TILT`}
                </span>
              </div>
            </div>
          </div>

          {/* Tensor Components Readout */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 shadow-md">
            <div className="text-xs font-bold text-slate-300 border-b border-slate-850 pb-2 mb-2">
              GRAVITY GRADIENT TENSOR COMPONENTS [Γ]
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/80 p-2 rounded border border-slate-850">
                <span className="text-[10px] text-slate-400">Γxx (NORTH-SOUTH)</span>
                <div className="text-sm font-bold text-pink-300">{gammaXX} E</div>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-850">
                <span className="text-[10px] text-slate-400">Γxy (CROSS TENSOR)</span>
                <div className="text-sm font-bold text-pink-300">{gammaXY} E</div>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-850">
                <span className="text-[10px] text-slate-400">Γxz (VERTICAL TILT)</span>
                <div className="text-sm font-bold text-amber-300">{gammaXZ} E</div>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-850">
                <span className="text-[10px] text-slate-400">Γzz (VERTICAL AXIS)</span>
                <div className="text-sm font-bold text-amber-300">{gammaZZ} E</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Downrange MIRV Target Effectiveness & Hardened Silo Kill Simulator */}
      <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 shadow-xl font-mono">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-850 pb-3 mb-4 gap-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-pink-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                DOWNRANGE MIRV IMPACT DISPERSION &amp; HARDENED SILO KILL ASSESSMENT
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Evaluates how GSS vertical correction enables true counterforce silo-busting capability (4,200 NM range)
              </p>
            </div>
          </div>

          {/* Warhead Selection */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">WARHEAD:</span>
            {(['W76', 'W88'] as const).map((wh) => (
              <button
                key={wh}
                onClick={() => {
                  soundFx.playClick();
                  setWarheadType(wh);
                }}
                className={`px-3 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
                  warheadType === wh
                    ? 'bg-amber-500 text-slate-950 font-extrabold'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {wh} ({wh === 'W88' ? '455 KT' : '100 KT'})
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Target Silo Impact Diagram Canvas */}
          <div className="lg:col-span-7 relative h-72 bg-slate-900/80 rounded border border-slate-850 overflow-hidden flex items-center justify-center">
            <svg viewBox="0 0 500 280" className="w-full h-full">
              {/* Target Grid concentric range rings (100m, 500m, 1000m, 1500m) */}
              {[30, 70, 110, 150].map((radius, idx) => (
                <circle
                  key={idx}
                  cx="250"
                  cy="140"
                  r={radius}
                  fill="none"
                  stroke="#334155"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
              ))}

              {/* Crosshair axes */}
              <line x1="250" y1="10" x2="250" y2="270" stroke="#334155" strokeWidth="1" />
              <line x1="30" y1="140" x2="470" y2="140" stroke="#334155" strokeWidth="1" />

              {/* 2,000 PSI Lethal Crater Radius (Zone of Silo Destruction) */}
              <circle
                cx="250"
                cy="140"
                r="45"
                fill="#10b981"
                fillOpacity="0.12"
                stroke="#10b981"
                strokeWidth="2"
              />
              <text x="255" y="105" fill="#10b981" fontSize="9" fontFamily="monospace">
                LETHAL RADIUS (&gt;2,000 PSI CRATER)
              </text>

              {/* Hardened Target Silo Door #41 (Center) */}
              <circle cx="250" cy="140" r="10" fill="#64748b" stroke="#f8fafc" strokeWidth="2" />
              <circle cx="250" cy="140" r="4" fill="#ef4444" />
              <text x="264" y="144" fill="#f8fafc" fontSize="10" fontWeight="bold" fontFamily="monospace">
                SILO #41 (2,000 PSI)
              </text>

              {/* MIRV Reentry Vehicle Impact Cluster */}
              {isGssCompensated ? (
                // WITH GSS: Tight pinpoint cluster on silo door (<40m CEP)
                <g>
                  {[
                    { dx: -6, dy: 4, name: 'RV-1 (W88)' },
                    { dx: 5, dy: -7, name: 'RV-2' },
                    { dx: -8, dy: -5, name: 'RV-3' },
                    { dx: 7, dy: 8, name: 'RV-4' }
                  ].map((rv, idx) => (
                    <g key={idx} transform={`translate(${250 + rv.dx}, ${140 + rv.dy})`}>
                      <circle r="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                      <circle r="12" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2,2" />
                    </g>
                  ))}
                  {/* CEP Annotation */}
                  <text x="210" y="175" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="monospace">
                    ★ GSS CEP: 38M (DIRECT HIT)
                  </text>
                </g>
              ) : (
                // WITHOUT GSS: Dispersed 1,420m away due to uncompensated deflection tilt!
                <g>
                  <line x1="250" y1="140" x2="385" y2="175" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4,4" />
                  <g transform="translate(385, 175)">
                    {[
                      { dx: -12, dy: 8 },
                      { dx: 14, dy: -10 },
                      { dx: -18, dy: -14 },
                      { dx: 16, dy: 15 }
                    ].map((rv, idx) => (
                      <circle key={idx} cx={rv.dx} cy={rv.dy} r="4" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
                    ))}
                    <ellipse rx="35" ry="25" fill="#f43f5e" fillOpacity="0.15" stroke="#f43f5e" strokeWidth="1.5" />
                    <text x="-40" y="42" fill="#f43f5e" fontSize="9" fontWeight="bold" fontFamily="monospace">
                      1,420M MISS (SILO INTACT)
                    </text>
                  </g>
                </g>
              )}
            </svg>

            {/* In-canvas GSS Status Tag */}
            <div className="absolute bottom-2 left-2 bg-slate-950/90 border border-slate-800 px-2.5 py-1.5 rounded text-[10px]">
              <div className="text-slate-400">GUIDANCE CONFIGURATION:</div>
              <strong className={isGssCompensated ? 'text-emerald-400' : 'text-rose-400'}>
                {isGssCompensated ? 'BELL GSS SINS ZERO-BIASED' : 'RAW UNCOMPENSATED DEFLECTION'}
              </strong>
            </div>
          </div>

          {/* Analysis & Overpressure Results Card */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-3">
            <div className={`p-4 rounded-lg border ${
              isKill ? 'bg-emerald-950/70 border-emerald-500' : 'bg-rose-950/70 border-rose-500'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {isKill ? <ShieldCheck className="w-5 h-5 text-emerald-400" /> : <ShieldAlert className="w-5 h-5 text-rose-400" />}
                <span className="font-bold text-sm tracking-wider">
                  {isKill ? 'HARDENED SILO DESTROYED' : 'TARGET SILO SURVIVED'}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                {isKill
                  ? `With Bell GSS calibration, the Trident II reaches a lethal CEP of ±${downrangeMissMeters} meters. Overpressure on the reinforced silo cap reaches ${finalOverpressurePsi} PSI (crushing threshold is ${targetSiloHardnessPsi} PSI). True first-strike counterforce effectiveness achieved!`
                  : `Without GSS compensation, local seamount gravity tilted launch orientation by ${uncompensatedDeflectionArcsec.toFixed(1)} arcseconds, causing warheads to impact ±${downrangeMissMeters} meters off-target. Blast overpressure at the silo is only ${finalOverpressurePsi} PSI, leaving the reinforced silo fully operational.`
                }
              </p>
            </div>

            {/* Key Comparative Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-850">
                <span className="text-[10px] text-slate-400">TERMINAL MISS (CEP)</span>
                <div className={`text-base font-bold ${isGssCompensated ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ±{downrangeMissMeters} METERS
                </div>
                <div className="text-[9px] text-slate-500">
                  {isGssCompensated ? 'Sub-50m hard target spec' : 'Inertial drift accumulated'}
                </div>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-850">
                <span className="text-[10px] text-slate-400">PEAK OVERPRESSURE</span>
                <div className={`text-base font-bold ${finalOverpressurePsi >= 2000 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {finalOverpressurePsi} PSI
                </div>
                <div className="text-[9px] text-slate-500">
                  Hardness: {targetSiloHardnessPsi} PSI
                </div>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-850">
                <span className="text-[10px] text-slate-400">SINGLE-SHOT KILL (Pk)</span>
                <div className={`text-base font-bold ${killProbability > 90 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {killProbability}%
                </div>
                <div className="text-[9px] text-slate-500">
                  Against 2,000 PSI Silo
                </div>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-850">
                <span className="text-[10px] text-slate-400">TOTAL YIELD PACK</span>
                <div className="text-base font-bold text-amber-300">
                  4 × {yieldKt} KT
                </div>
                <div className="text-[9px] text-slate-500">
                  {warheadType} Reentry Vehicles
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
