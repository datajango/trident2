import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Compass, Target, Maximize2, RotateCcw, Satellite, ArrowUpRight } from 'lucide-react';

export interface TrajectoryPoint {
  downrange: number; // in km
  altitude: number;  // in km
  time: number;      // in seconds
  velocity: number;  // in m/s
  stage: string;
}

interface AltitudeDownrangeD3ChartProps {
  currentAltitudeKm: number;
  currentDownrangeKm: number;
  velocityMs: number;
  missionTime: number;
  stage: string;
}

export const AltitudeDownrangeD3Chart: React.FC<AltitudeDownrangeD3ChartProps> = ({
  currentAltitudeKm,
  currentDownrangeKm,
  velocityMs,
  missionTime,
  stage
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([]);
  const [viewMode, setViewMode] = useState<'full' | 'auto'>('full');
  const [apogeeKm, setApogeeKm] = useState<number>(0);

  // Track trajectory history points
  useEffect(() => {
    if (missionTime <= 0) {
      setTrajectory([]);
      setApogeeKm(0);
      return;
    }

    const safeAlt = Math.max(0, currentAltitudeKm);
    const safeDownrange = Math.max(0, currentDownrangeKm);

    setApogeeKm((prev) => Math.max(prev, safeAlt));

    setTrajectory((prev) => {
      // If simulation time rewinds or resets
      if (prev.length > 0 && missionTime < prev[prev.length - 1].time) {
        return [{
          downrange: safeDownrange,
          altitude: safeAlt,
          time: missionTime,
          velocity: velocityMs,
          stage
        }];
      }

      // Avoid redundant identical points within a small delta
      const last = prev[prev.length - 1];
      if (
        last &&
        Math.abs(last.downrange - safeDownrange) < 0.1 &&
        Math.abs(last.altitude - safeAlt) < 0.1
      ) {
        return prev;
      }

      const next = [
        ...prev,
        {
          downrange: safeDownrange,
          altitude: safeAlt,
          time: missionTime,
          velocity: velocityMs,
          stage
        }
      ];

      // Limit memory footprint to last 600 data points
      if (next.length > 600) {
        return next.slice(next.length - 600);
      }
      return next;
    });
  }, [missionTime, currentAltitudeKm, currentDownrangeKm, velocityMs, stage]);

  // Nominal reference ballistic trajectory model (Trident II D5 standard 7,500 km range, 1,200 km apogee)
  const nominalCorridorData = useMemo(() => {
    const points: { downrange: number; altitude: number }[] = [];
    const totalDist = 7500;
    const maxH = 1200;
    for (let x = 0; x <= totalDist; x += 100) {
      // Parabolic ballistic approximation for reference overlay
      const h = 4 * maxH * (x / totalDist) * (1 - x / totalDist);
      points.push({ downrange: x, altitude: Math.max(0, h) });
    }
    return points;
  }, []);

  // Main D3 Rendering Effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth || 700;
    const height = 300;
    const margin = { top: 28, right: 36, bottom: 42, left: 62 };
    const width = containerWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('width', containerWidth).attr('height', height);

    // Defs for glowing filter and gradients
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter')
      .attr('id', 'd3-glow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '2.5')
      .attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Trajectory fill gradient
    const trajGradient = defs.append('linearGradient')
      .attr('id', 'traj-area-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    trajGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 0.25);
    trajGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 0.0);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Determine scale domains based on viewMode
    let xMax = 7500;
    let yMax = 1400;

    if (viewMode === 'auto' && trajectory.length > 0) {
      const maxTrajX = d3.max(trajectory, (d: TrajectoryPoint) => d.downrange) ?? 100;
      const maxTrajY = d3.max(trajectory, (d: TrajectoryPoint) => d.altitude) ?? 50;
      xMax = Math.max(120, maxTrajX * 1.25);
      yMax = Math.max(60, maxTrajY * 1.25);
    }

    const xScale = d3.scaleLinear()
      .domain([0, xMax])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, yMax])
      .range([innerHeight, 0]);

    // Grid lines - Horizontal
    const yGrid = d3.axisLeft(yScale)
      .tickSize(-width)
      .tickFormat(() => '')
      .ticks(5);

    g.append('g')
      .attr('class', 'y-grid')
      .call(yGrid)
      .selectAll('line')
      .attr('stroke', '#334155')
      .attr('stroke-dasharray', '2,3')
      .attr('stroke-opacity', 0.45);

    g.select('.y-grid .domain').remove();

    // Grid lines - Vertical
    const xGrid = d3.axisBottom(xScale)
      .tickSize(-innerHeight)
      .tickFormat(() => '')
      .ticks(6);

    g.append('g')
      .attr('class', 'x-grid')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xGrid)
      .selectAll('line')
      .attr('stroke', '#334155')
      .attr('stroke-dasharray', '2,3')
      .attr('stroke-opacity', 0.45);

    g.select('.x-grid .domain').remove();

    // Kármán Line (100 km altitude boundary)
    if (yScale(100) >= 0 && yScale(100) <= innerHeight) {
      const karmanY = yScale(100);
      g.append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', karmanY)
        .attr('y2', karmanY)
        .attr('stroke', '#0284c7')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,4')
        .attr('opacity', 0.75);

      g.append('text')
        .attr('x', width - 8)
        .attr('y', karmanY - 4)
        .attr('text-anchor', 'end')
        .attr('fill', '#38bdf8')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('opacity', 0.85)
        .text('KÁRMÁN BOUNDARY (100 KM)');
    }

    // Planned Nominal Trajectory (Dashed Reference Curve)
    const nominalLineGen = d3.line<{ downrange: number; altitude: number }>()
      .x((d) => xScale(d.downrange))
      .y((d) => yScale(d.altitude))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(nominalCorridorData.filter((d) => d.downrange <= xMax))
      .attr('fill', 'none')
      .attr('stroke', '#64748b')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.5)
      .attr('d', nominalLineGen);

    // Active Actual Track Area Fill
    if (trajectory.length > 1) {
      const areaGen = d3.area<TrajectoryPoint>()
        .x((d) => xScale(d.downrange))
        .y0(innerHeight)
        .y1((d) => yScale(d.altitude))
        .curve(d3.curveLinear);

      g.append('path')
        .datum(trajectory)
        .attr('fill', 'url(#traj-area-grad)')
        .attr('d', areaGen);

      // Active Track Line with Glow
      const trackLineGen = d3.line<TrajectoryPoint>()
        .x((d) => xScale(d.downrange))
        .y((d) => yScale(d.altitude))
        .curve(d3.curveLinear);

      g.append('path')
        .datum(trajectory)
        .attr('fill', 'none')
        .attr('stroke', '#10b981')
        .attr('stroke-width', 2.5)
        .attr('filter', 'url(#d3-glow)')
        .attr('d', trackLineGen);
    }

    // Milestone Event Annotations along the trajectory
    const milestoneStages = [
      { key: 'MOTOR_IGNITION', label: 'IGNITION', color: '#f97316' },
      { key: 'STAGE_1', label: 'STAGE 1', color: '#e2e8f0' },
      { key: 'STAGE_2', label: 'STAGE 2', color: '#10b981' },
      { key: 'STAGE_3', label: 'STAGE 3', color: '#38bdf8' },
      { key: 'WARHEAD_RELEASE', label: 'MIRV BUS', color: '#c084fc' },
      { key: 'TARGET_IMPACT', label: 'IMPACT', color: '#ef4444' },
    ];

    const seenStages = new Set<string>();
    trajectory.forEach((pt) => {
      const match = milestoneStages.find((m) => m.key === pt.stage);
      if (match && !seenStages.has(match.key)) {
        seenStages.add(match.key);
        const cx = xScale(pt.downrange);
        const cy = yScale(pt.altitude);

        if (cx >= 0 && cx <= width && cy >= 0 && cy <= innerHeight) {
          g.append('circle')
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('r', 3)
            .attr('fill', match.color)
            .attr('stroke', '#0f172a')
            .attr('stroke-width', 1);

          g.append('text')
            .attr('x', cx + 5)
            .attr('y', cy - 5)
            .attr('fill', match.color)
            .attr('font-size', '8.5px')
            .attr('font-family', 'monospace')
            .attr('font-weight', 'bold')
            .text(match.label);
        }
      }
    });

    // Current Live Vehicle Beacon
    const currentX = xScale(Math.max(0, currentDownrangeKm));
    const currentY = yScale(Math.max(0, currentAltitudeKm));

    if (currentX >= 0 && currentX <= width && currentY >= 0 && currentY <= innerHeight) {
      // Pulsing outer halo
      g.append('circle')
        .attr('cx', currentX)
        .attr('cy', currentY)
        .attr('r', 9)
        .attr('fill', 'none')
        .attr('stroke', '#10b981')
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', 0.6)
        .attr('class', 'animate-ping')
        .style('transform-origin', `${currentX}px ${currentY}px`);

      // Core dot
      g.append('circle')
        .attr('cx', currentX)
        .attr('cy', currentY)
        .attr('r', 4.5)
        .attr('fill', '#10b981')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.5)
        .attr('filter', 'url(#d3-glow)');

      // Live Telemetry Label Tag
      const labelText = `ALT: ${currentAltitudeKm.toFixed(1)} km | RNG: ${currentDownrangeKm.toFixed(1)} km`;
      const isRightSide = currentX > width * 0.7;

      g.append('rect')
        .attr('x', isRightSide ? currentX - 185 : currentX + 10)
        .attr('y', currentY - 24)
        .attr('width', 178)
        .attr('height', 18)
        .attr('rx', 3)
        .attr('fill', '#020617')
        .attr('stroke', '#10b981')
        .attr('stroke-width', 0.8)
        .attr('opacity', 0.92);

      g.append('text')
        .attr('x', isRightSide ? currentX - 179 : currentX + 16)
        .attr('y', currentY - 11)
        .attr('fill', '#a7f3d0')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .text(labelText);
    }

    // X Axis
    const xAxis = d3.axisBottom(xScale)
      .ticks(Math.max(4, Math.floor(width / 100)))
      .tickFormat((d) => `${d} km`);

    const xAxisGroup = g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup.selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    xAxisGroup.select('.domain')
      .attr('stroke', '#475569');

    xAxisGroup.selectAll('.tick line')
      .attr('stroke', '#475569');

    // X Axis Label
    g.append('text')
      .attr('x', width / 2)
      .attr('y', innerHeight + 34)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('font-weight', '600')
      .text('DOWNRANGE DISTANCE (km)');

    // Y Axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => `${d} km`);

    const yAxisGroup = g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis);

    yAxisGroup.selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    yAxisGroup.select('.domain')
      .attr('stroke', '#475569');

    yAxisGroup.selectAll('.tick line')
      .attr('stroke', '#475569');

    // Y Axis Label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -46)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('font-weight', '600')
      .text('ALTITUDE (km)');

    // Interactive Hover Overlay for Tooltip Inspection
    const hoverRect = g.append('rect')
      .attr('width', width)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair');

    const focusLine = g.append('line')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .style('opacity', 0);

    const focusCircle = g.append('circle')
      .attr('r', 4)
      .attr('fill', '#38bdf8')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5)
      .style('opacity', 0);

    hoverRect.on('mousemove', (event) => {
      if (trajectory.length === 0) return;

      const [pointerX] = d3.pointer(event);
      const hoveredDist = xScale.invert(pointerX);

      // Find closest trajectory point
      const bisector = d3.bisector<TrajectoryPoint, number>((d) => d.downrange).left;
      const idx = bisector(trajectory, hoveredDist);
      const d0 = trajectory[idx - 1];
      const d1 = trajectory[idx];
      let closest = d0;
      if (d0 && d1) {
        closest = (hoveredDist - d0.downrange > d1.downrange - hoveredDist) ? d1 : d0;
      } else if (d1) {
        closest = d1;
      }

      if (closest && tooltipRef.current) {
        const cx = xScale(closest.downrange);
        const cy = yScale(closest.altitude);

        focusLine.attr('x1', cx).attr('x2', cx).style('opacity', 0.85);
        focusCircle.attr('cx', cx).attr('cy', cy).style('opacity', 1);

        const tooltip = tooltipRef.current;
        tooltip.style.display = 'block';
        tooltip.style.left = `${cx + margin.left + 15}px`;
        tooltip.style.top = `${Math.min(cy + margin.top, height - 90)}px`;
        tooltip.innerHTML = `
          <div class="font-mono text-[11px] leading-tight text-slate-200">
            <div class="text-emerald-400 font-bold border-b border-slate-700 pb-1 mb-1">
              T+${closest.time.toFixed(1)}s • ${closest.stage}
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-slate-400">Altitude:</span>
              <span class="font-bold text-white">${closest.altitude.toFixed(2)} km</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-slate-400">Downrange:</span>
              <span class="font-bold text-white">${closest.downrange.toFixed(2)} km</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-slate-400">Velocity:</span>
              <span class="font-bold text-cyan-400">${closest.velocity.toFixed(0)} m/s</span>
            </div>
          </div>
        `;
      }
    });

    hoverRect.on('mouseleave', () => {
      focusLine.style('opacity', 0);
      focusCircle.style('opacity', 0);
      if (tooltipRef.current) {
        tooltipRef.current.style.display = 'none';
      }
    });

  }, [trajectory, viewMode, currentAltitudeKm, currentDownrangeKm, nominalCorridorData]);

  // Handle ResizeObserver for dynamic responsiveness
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      // Trigger re-render when container size shifts
      setTrajectory((prev) => [...prev]);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 shadow-xl flex flex-col gap-3 relative">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-wider">
            RADAR PROFILE: ALTITUDE VS DOWNRANGE (D3 ENGINE)
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 uppercase tracking-wider">
            Real-Time R-Z Plot
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          {/* Apogee readout */}
          <div className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800 text-[11px]">
            <span className="text-slate-400">APOGEE: </span>
            <span className="text-cyan-400 font-bold">{apogeeKm.toFixed(1)} km</span>
          </div>

          {/* View mode toggle */}
          <button
            onClick={() => setViewMode((m) => (m === 'full' ? 'auto' : 'full'))}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded text-[11px] cursor-pointer transition-colors"
            title="Toggle between Full Range (7,500km) and Dynamic Zoom"
          >
            <Maximize2 className="w-3 h-3 text-amber-400" />
            <span>{viewMode === 'full' ? 'FULL ENVELOPE' : 'ACTIVE ZOOM'}</span>
          </button>

          {/* Reset Track */}
          <button
            onClick={() => {
              setTrajectory([]);
              setApogeeKm(0);
            }}
            className="flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 rounded text-[11px] cursor-pointer transition-colors"
            title="Clear Trajectory Buffer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>CLEAR</span>
          </button>
        </div>
      </div>

      {/* Legend & Telemetry Indicators */}
      <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-y-2 px-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-400 rounded"></span>
            <span className="text-emerald-300">Live Tracked Trajectory</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-slate-400"></span>
            <span className="text-slate-400">Nominal 7,500km Corridor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-sky-400"></span>
            <span className="text-sky-400">Kármán Line (100km)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-500">POINTS LOGGED: <span className="text-slate-300">{trajectory.length}</span></span>
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{stage.replace(/_/g, ' ')}</span>
          </span>
        </div>
      </div>

      {/* D3 SVG Canvas Container */}
      <div ref={containerRef} className="relative w-full overflow-hidden rounded bg-slate-900/50 border border-slate-850">
        <svg ref={svgRef} className="w-full h-[300px] block select-none" />

        {/* Hover Tooltip Element */}
        <div
          ref={tooltipRef}
          className="absolute hidden pointer-events-none z-20 bg-slate-950/95 border border-slate-700 p-2.5 rounded shadow-2xl backdrop-blur-sm"
          style={{ minWidth: '170px' }}
        />
      </div>
    </div>
  );
};
