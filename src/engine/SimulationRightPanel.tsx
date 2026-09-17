import React, { useState, useMemo } from 'react';
import {
  SimulationCassette,
  SimulationEntity,
  EngineGraduationMode,
  EntityDomain,
  EntityFaction,
  UnitVitals,
  MissionPlan
} from './types';
import { CommandModeInspector } from './CommandModeInspector';
import { soundFx } from '../audio/soundEngine';
import {
  Compass,
  Radio,
  Crosshair,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  Shield,
  CheckSquare,
  Square,
  Trash2,
  Copy,
  Plus,
  Download,
  FileCode,
  AlertTriangle,
  Lock,
  Globe,
  ArrowLeft,
  Box,
  CircleDot,
  Focus,
  List,
  Navigation,
  CheckCircle2,
  Wrench,
  Save,
  RotateCcw
} from 'lucide-react';

export interface SimulationRightPanelProps {
  graduationMode: EngineGraduationMode;
  onChangeGraduationMode: (mode: EngineGraduationMode) => void;
  cassette: SimulationCassette;
  entities: SimulationEntity[];
  visibleEntities: SimulationEntity[];
  selectedEntity: SimulationEntity | null;
  selectedEntityIds: Set<string>;
  isMultiSelectMode: boolean;
  onToggleMultiSelectMode: () => void;
  onSelectEntity: (entityId: string | null, isShift?: boolean) => void;
  onUpdateEntityVitals: (entityId: string, vitals: UnitVitals) => void;
  onUpdateEntityMission: (entityId: string, mission: MissionPlan) => void;
  onBroadcastMissionToSelected: (mission: MissionPlan) => void;
  onUpdateCassette?: (updated: SimulationCassette) => void;
  showRangeRing: boolean;
  onToggleRangeRing: (show: boolean) => void;
  showMissionPlan?: boolean;
  onToggleMissionPlan?: (show: boolean) => void;
  isTrackingEntity: boolean;
  onToggleTracking: () => void;
  isAutoIsoZoom: boolean;
  onToggleAutoIsoZoom: () => void;
  onTriggerIsoFocus: (entity?: SimulationEntity | null) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  simTimeSec: number;
  isSoloSelected: boolean;
  onToggleSoloSelected: () => void;
  isIsoPerspective?: boolean;
  onToggleIsoPerspective?: () => void;
  savedZoomFactor?: number;
  onSaveCurrentZoom?: () => void;
  onApplySavedZoom?: () => void;
}

export const SimulationRightPanel: React.FC<SimulationRightPanelProps> = ({
  graduationMode,
  onChangeGraduationMode,
  cassette,
  entities,
  visibleEntities,
  selectedEntity,
  selectedEntityIds,
  isMultiSelectMode,
  onToggleMultiSelectMode,
  onSelectEntity,
  onUpdateEntityVitals,
  onUpdateEntityMission,
  onBroadcastMissionToSelected,
  onUpdateCassette,
  showRangeRing,
  onToggleRangeRing,
  showMissionPlan = true,
  onToggleMissionPlan,
  isTrackingEntity,
  onToggleTracking,
  isAutoIsoZoom,
  onToggleAutoIsoZoom,
  onTriggerIsoFocus,
  isCollapsed,
  onToggleCollapse,
  simTimeSec,
  isSoloSelected,
  onToggleSoloSelected,
  isIsoPerspective,
  onToggleIsoPerspective,
  savedZoomFactor,
  onSaveCurrentZoom,
  onApplySavedZoom
}) => {
  // Search query for the asset roster
  const [searchQuery, setSearchQuery] = useState<string>('');
  // Filter inside the right panel asset roster
  const [rosterDomainFilter, setRosterDomainFilter] = useState<EntityDomain | 'ALL'>('ALL');
  // Secondary sub-tab when an entity is selected: 'INSPECTOR' or 'ROSTER'
  const [selectedSubTab, setSelectedSubTab] = useState<'INSPECTOR' | 'ROSTER'>('INSPECTOR');

  // Filtered entities for the asset roster (allows browsing all available assets even when 3D scene is in solo/isolate mode)
  const filteredRosterEntities = useMemo(() => {
    return entities.filter((entity) => {
      if (rosterDomainFilter !== 'ALL' && entity.domain !== rosterDomainFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = entity.name.toLowerCase().includes(q);
        const matchCall = entity.callsign.toLowerCase().includes(q);
        const matchFaction = entity.faction.toLowerCase().includes(q);
        const matchDomain = entity.domain.toLowerCase().includes(q);
        return matchName || matchCall || matchFaction || matchDomain;
      }
      return true;
    });
  }, [entities, rosterDomainFilter, searchQuery]);

  // Quick helper to render Domain icon
  const getDomainIcon = (domain: EntityDomain) => {
    switch (domain) {
      case 'SURFACE_NAVY':
      case 'COMMERCIAL_MARITIME':
        return <Compass className="w-3.5 h-3.5 text-cyan-400" />;
      case 'SUBSURFACE':
        return <Navigation className="w-3.5 h-3.5 text-indigo-400" />;
      case 'AIR_FORCE':
        return <Radio className="w-3.5 h-3.5 text-sky-400" />;
      case 'SPACE_SATELLITE':
        return <Globe className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <CircleDot className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  // Quick helper for operating condition badge
  const renderConditionBadge = (entity: SimulationEntity) => {
    const condition = entity.vitals?.operatingCondition || 'COMBAT_READY';
    let colorClass = 'bg-emerald-950 text-emerald-300 border-emerald-500/50';
    if (condition === 'DEGRADED') colorClass = 'bg-amber-950 text-amber-300 border-amber-500/50';
    if (condition === 'UNDER_REPAIR') colorClass = 'bg-blue-950 text-blue-300 border-blue-500/50 animate-pulse';
    if (condition === 'CRITICAL_OFFLINE') colorClass = 'bg-red-950 text-red-300 border-red-500/50';

    return (
      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${colorClass}`}>
        {condition.replace('_', ' ')}
      </span>
    );
  };

  // If panel is collapsed, render a sleek vertical expand tab
  if (isCollapsed) {
    return (
      <div className="relative shrink-0 z-20">
        <button
          onClick={() => {
            soundFx.playClick();
            onToggleCollapse();
          }}
          className="h-full w-10 md:w-11 bg-slate-900/95 hover:bg-slate-850 border-l border-slate-800 flex flex-col items-center justify-between py-4 text-slate-300 hover:text-cyan-300 transition cursor-pointer shadow-2xl"
          title="Expand Tactical Asset Panel"
        >
          <div className="p-1 rounded bg-slate-800/80 text-cyan-400">
            <ChevronLeft className="w-4 h-4" />
          </div>
          <div className="[writing-mode:vertical-rl] text-center font-mono text-[10px] tracking-widest text-slate-400 font-bold uppercase flex items-center gap-2">
            <span className="text-cyan-400">EXPAND PANEL</span>
            <span>•</span>
            <span>{graduationMode.replace('_', ' ')}</span>
            <span>({visibleEntities.length} UNITS)</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-slate-500">
            {selectedEntity ? (
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" title={`Selected: ${selectedEntity.callsign}`} />
            ) : (
              <List className="w-4 h-4" />
            )}
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full md:w-96 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900/95 flex flex-col text-xs font-mono overflow-hidden max-h-[45vh] md:max-h-full shrink-0 z-20 shadow-2xl">
      {/* PANEL TOP HEADER */}
      <div className="bg-slate-950/90 border-b border-slate-800 px-3 py-2 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {selectedEntity && (
            <button
              onClick={() => {
                soundFx.playClick();
                onSelectEntity(null);
              }}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition flex items-center gap-1 font-bold text-[10px] cursor-pointer"
              title="Return to full asset list"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span>ROSTER</span>
            </button>
          )}

          <div className="flex flex-col min-w-0">
            <span className="font-bold text-cyan-300 tracking-wider truncate flex items-center gap-1.5">
              {graduationMode === 'VIEWER' && <Compass className="w-3.5 h-3.5 text-cyan-400" />}
              {graduationMode === 'COMMAND_MODE' && <Radio className="w-3.5 h-3.5 text-cyan-400" />}
              {graduationMode === 'CONSTRAINED_GAME' && <Crosshair className="w-3.5 h-3.5 text-amber-400" />}
              {graduationMode === 'AUTHORING_STUDIO' && <Sliders className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{graduationMode.replace('_', ' ')}</span>
            </span>
            <span className="text-[9px] text-slate-500 truncate">
              {selectedEntity ? `ACTIVE: ${selectedEntity.callsign}` : `${visibleEntities.length} COMBAT ASSETS`}
            </span>
          </div>
        </div>

        {/* Action controls: Solo, Auto Iso, Snap Iso, Collapse */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Solo / Just Display Selected Asset Toggle */}
          <button
            onClick={() => {
              soundFx.playTargetLock();
              onToggleSoloSelected();
            }}
            className={`px-1.5 py-1 rounded text-[10px] font-bold border transition cursor-pointer flex items-center gap-1 ${
              isSoloSelected
                ? 'bg-amber-500/25 text-amber-300 border-amber-400 ring-1 ring-amber-500/50 shadow-sm shadow-amber-950'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Just display the selected asset on the globe (isolate in 3D)"
          >
            <Eye className={`w-3 h-3 ${isSoloSelected ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
            <span>SOLO: {isSoloSelected ? 'ON' : 'OFF'}</span>
          </button>

          {/* Snap / Toggle ISO View button */}
          <button
            onClick={() => {
              soundFx.playClick();
              if (onToggleIsoPerspective) {
                onToggleIsoPerspective();
              } else {
                onTriggerIsoFocus(selectedEntity);
              }
            }}
            className={`p-1.5 rounded border transition cursor-pointer flex items-center gap-1 text-[10px] font-bold ${
              isIsoPerspective
                ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400 ring-1 ring-cyan-400'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-cyan-300 hover:text-cyan-200'
            }`}
            title="Toggle Isometric Perspective View (Loads saved zoom parameter & fixed angle)"
          >
            <Box className={`w-3 h-3 ${isIsoPerspective ? 'text-cyan-300 animate-pulse' : 'text-cyan-400'}`} />
            <span className="hidden sm:inline">ISO: {isIsoPerspective ? 'ON' : 'OFF'}</span>
          </button>

          {/* Auto ISO Toggle */}
          <button
            onClick={() => {
              soundFx.playClick();
              onToggleAutoIsoZoom();
            }}
            className={`px-1.5 py-1 rounded text-[10px] font-bold border transition cursor-pointer flex items-center gap-1 ${
              isAutoIsoZoom
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 ring-1 ring-cyan-500/50'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Auto Zoom to Unit in Isometric Perspective upon selection"
          >
            <Focus className={`w-3 h-3 ${isAutoIsoZoom ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
            <span>AUTO-ISO: {isAutoIsoZoom ? 'ON' : 'OFF'}</span>
          </button>

          {/* Collapse Panel Button */}
          <button
            onClick={() => {
              soundFx.playClick();
              onToggleCollapse();
            }}
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            title="Collapse Right Panel (Full Screen Viewport)"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* When an entity is selected, provide a quick dual-tab switch (INSPECTOR vs ALL ASSETS) */}
      {selectedEntity && (
        <div className="flex items-center bg-slate-950 border-b border-slate-800 p-1 gap-1 shrink-0">
          <button
            onClick={() => {
              soundFx.playClick();
              setSelectedSubTab('INSPECTOR');
            }}
            className={`flex-1 py-1 rounded text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
              selectedSubTab === 'INSPECTOR'
                ? 'bg-slate-800 text-cyan-300 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crosshair className="w-3 h-3 text-cyan-400" />
            <span>UNIT DETAILS: {selectedEntity.callsign}</span>
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setSelectedSubTab('ROSTER');
            }}
            className={`flex-1 py-1 rounded text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
              selectedSubTab === 'ROSTER'
                ? 'bg-slate-800 text-cyan-300 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <List className="w-3 h-3 text-slate-400" />
            <span>BROWSE ASSETS ({visibleEntities.length})</span>
          </button>
        </div>
      )}

      {/* BODY CONTENT (SCROLLABLE) */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* CASE 1: SHOW ASSET ROSTER (when no entity is selected OR when selectedSubTab === 'ROSTER') */}
        {(!selectedEntity || selectedSubTab === 'ROSTER') && (
          <div className="p-3 flex flex-col gap-2.5">
            {/* Header / Search Controls */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 text-[11px] flex items-center gap-1">
                  <List className="w-3.5 h-3.5 text-cyan-400" />
                  <span>THEATER COMBAT ASSETS</span>
                  <span className="text-slate-500 font-normal">({filteredRosterEntities.length})</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {/* Quick Solo Toggle in Roster */}
                  <button
                    onClick={() => {
                      soundFx.playTargetLock();
                      onToggleSoloSelected();
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                      isSoloSelected
                        ? 'bg-amber-950/80 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                    title="Just display the selected asset in the 3D scene"
                  >
                    <Eye className={`w-3 h-3 ${isSoloSelected ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
                    <span>SOLO: {isSoloSelected ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    onClick={() => {
                      soundFx.playClick();
                      onToggleMultiSelectMode();
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                      isMultiSelectMode
                        ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isMultiSelectMode ? <CheckSquare className="w-3 h-3 text-purple-400" /> : <Square className="w-3 h-3" />}
                    <span>MULTI: {isMultiSelectMode ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search callsign, class, domain, faction..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 text-[11px]"
                />
              </div>

              {/* Domain Filter Pills */}
              <div className="flex flex-wrap gap-1">
                {(['ALL', 'SURFACE_NAVY', 'SUBSURFACE', 'AIR_FORCE', 'SPACE_SATELLITE'] as const).map((dom) => (
                  <button
                    key={dom}
                    onClick={() => {
                      soundFx.playClick();
                      setRosterDomainFilter(dom);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition cursor-pointer ${
                      rosterDomainFilter === dom
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                        : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {dom === 'ALL' ? 'ALL' : dom.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* In AUTHORING_STUDIO: Quick Spawn Asset bar */}
            {graduationMode === 'AUTHORING_STUDIO' && (
              <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between gap-2">
                <span className="text-[10px] text-emerald-300 font-bold">CASSETTE ENGINE</span>
                <button
                  onClick={() => {
                    soundFx.playClick();
                    if (onUpdateCassette) {
                      const newEntity: SimulationEntity = {
                        id: `custom-asset-${Date.now()}`,
                        name: `TASK FORCE #${Math.floor(Math.random() * 900 + 100)}`,
                        callsign: 'AURORA-NINE',
                        faction: 'USA',
                        domain: 'SURFACE_NAVY',
                        securityLevel: 'UNCLASSIFIED',
                        position: { lat: 20 + Math.random() * 20, lon: -120 + Math.random() * 40, altitudeKm: 0 },
                        trajectoryType: 'PATROL_WAYPOINTS',
                        speedKnotsOrKms: 25,
                        headingDeg: Math.floor(Math.random() * 360),
                        modelTemplate: 'DESTROYER',
                        colorHex: '#06b6d4',
                        aiBehavior: {
                          mode: 'PATROL',
                          alertStatus: 'DEFCON_4',
                          engagementRadiusKm: 350,
                          ruleOfEngagement: 'Autonomous fleet surveillance'
                        },
                        sensors: { radarRangeKm: 350, opticalTracking: true, sigintActive: true, activeEmission: true },
                        description: 'User-authored tactical combatant spawned via authoring engine.',
                        intelNotes: 'Dynamic asset placed onto vector globe.'
                      };
                      onUpdateCassette({
                        ...cassette,
                        entities: [...cassette.entities, newEntity]
                      });
                      onSelectEntity(newEntity.id);
                      setSelectedSubTab('INSPECTOR');
                    }
                  }}
                  className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-[10px] cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>SPAWN ASSET</span>
                </button>
              </div>
            )}

            {/* Asset List Rows */}
            <div className="flex flex-col gap-1.5">
              {filteredRosterEntities.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-[11px] bg-slate-950 rounded border border-slate-800/80">
                  No tactical assets matched filter criteria.
                </div>
              ) : (
                filteredRosterEntities.map((entity) => {
                  const isSelected = selectedEntity?.id === entity.id;
                  const isInMulti = selectedEntityIds.has(entity.id);

                  return (
                    <div
                      key={entity.id}
                      onClick={() => {
                        onSelectEntity(entity.id, isMultiSelectMode);
                        if (!isMultiSelectMode) {
                          setSelectedSubTab('INSPECTOR');
                        }
                      }}
                      className={`p-2 rounded border transition flex flex-col gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-500/50 shadow-md'
                          : isInMulti
                          ? 'bg-purple-950/30 border-purple-500 ring-1 ring-purple-500/30'
                          : 'bg-slate-950 hover:bg-slate-850 border-slate-800'
                      }`}
                    >
                      {/* Top Row: Domain Icon + Callsign + Faction + Condition Badge */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isMultiSelectMode ? (
                            <span className="text-purple-400">
                              {isInMulti ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                            </span>
                          ) : (
                            getDomainIcon(entity.domain)
                          )}
                          <span className="font-black text-white truncate text-[11px]">
                            {entity.callsign}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                            {entity.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {renderConditionBadge(entity)}
                          <span
                            className="px-1 py-0.2 rounded text-[9px] font-bold"
                            style={{ backgroundColor: `${entity.colorHex}25`, color: entity.colorHex }}
                          >
                            {entity.faction}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Row: Telemetry pill & quick Iso view button */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-900 pt-1 mt-0.5">
                        <div className="flex items-center gap-2">
                          <span>
                            {(entity.position?.lat ?? 0).toFixed(1)}°, {(entity.position?.lon ?? 0).toFixed(1)}°
                          </span>
                          <span>•</span>
                          <span>{(entity.speedKnotsOrKms ?? 0).toFixed(0)} {entity.domain === 'SPACE_SATELLITE' ? 'km/s' : 'kts'}</span>
                          {(entity.position?.altitudeKm ?? 0) > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-cyan-400 font-bold">{(entity.position?.altitudeKm ?? 0).toFixed(0)}km</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Quick Solo button for this asset */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              soundFx.playTargetLock();
                              onSelectEntity(entity.id);
                              if (!isSoloSelected) {
                                onToggleSoloSelected();
                              }
                              onTriggerIsoFocus(entity);
                              setSelectedSubTab('INSPECTOR');
                            }}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 cursor-pointer transition border ${
                              isSelected && isSoloSelected
                                ? 'bg-amber-500 text-black border-amber-400 font-black shadow-sm'
                                : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-amber-300 hover:border-amber-500'
                            }`}
                            title="Just display this asset in 3D (Solo mode)"
                          >
                            <Eye className="w-2.5 h-2.5" />
                            <span>SOLO</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectEntity(entity.id);
                              onTriggerIsoFocus(entity);
                              setSelectedSubTab('INSPECTOR');
                            }}
                            className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 text-[9px] font-bold flex items-center gap-1 cursor-pointer transition"
                            title="Zoom camera to isometric view on this unit"
                          >
                            <Box className="w-2.5 h-2.5 text-cyan-400" />
                            <span>ISO</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Cassette Export in Authoring Mode */}
            {graduationMode === 'AUTHORING_STUDIO' && (
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    soundFx.playClick();
                    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cassette, null, 2));
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute('href', dataStr);
                    downloadAnchor.setAttribute('download', `${cassette.id}.json`);
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                  }}
                  className="py-1 px-2 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold flex items-center justify-center gap-1 cursor-pointer text-[10px]"
                >
                  <Download className="w-3 h-3 text-cyan-400" />
                  EXPORT CASSETTE
                </button>
                <button
                  onClick={() => {
                    soundFx.playClick();
                    const input = prompt('Paste Simulation Cassette JSON:');
                    if (input && onUpdateCassette) {
                      try {
                        const parsed = JSON.parse(input) as SimulationCassette;
                        onUpdateCassette(parsed);
                        alert('Cassette loaded successfully!');
                      } catch {
                        alert('Invalid Cassette JSON format');
                      }
                    }
                  }}
                  className="py-1 px-2 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold flex items-center justify-center gap-1 cursor-pointer text-[10px]"
                >
                  <FileCode className="w-3 h-3 text-emerald-400" />
                  IMPORT JSON
                </button>
              </div>
            )}
          </div>
        )}

        {/* CASE 2: SELECTED ENTITY DETAILS VIEW (when selectedEntity is active AND selectedSubTab === 'INSPECTOR') */}
        {selectedEntity && selectedSubTab === 'INSPECTOR' && (
          <div>
            {/* Active Unit Quick Toolbar: Return to Roster, Solo Mode, ISO Snap */}
            <div className="p-2 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  soundFx.playClick();
                  onSelectEntity(null);
                }}
                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-bold cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3 text-cyan-400" />
                <span>ALL ASSETS</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    soundFx.playTargetLock();
                    onToggleSoloSelected();
                  }}
                  className={`px-2 py-1 rounded text-[10px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                    isSoloSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm ring-1 ring-amber-400'
                      : 'bg-slate-900 border-amber-500/50 text-amber-300 hover:bg-slate-850'
                  }`}
                  title="Toggle 3D scene to only show this selected asset"
                >
                  <Eye className="w-3 h-3" />
                  <span>{isSoloSelected ? 'SOLO ACTIVE (SHOW ALL)' : 'SOLO ASSET'}</span>
                </button>

                <button
                  onClick={() => {
                    soundFx.playClick();
                    onTriggerIsoFocus(selectedEntity);
                  }}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-850 border border-cyan-500/60 text-cyan-300 text-[10px] font-bold cursor-pointer flex items-center gap-1"
                  title="Snap isometric camera to this unit"
                >
                  <Box className="w-3 h-3 text-cyan-400" />
                  <span>ISO</span>
                </button>
              </div>
            </div>

            {/* 3D Overlays Toggle Ribbon: Vectors & Range Ring */}
            <div className="px-3 py-1.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between gap-2 text-[10px]">
              <span className="text-slate-400 font-bold flex items-center gap-1">
                <span>3D OVERLAYS:</span>
              </span>
              <div className="flex items-center gap-1.5">
                {onToggleMissionPlan && (
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      onToggleMissionPlan(!showMissionPlan);
                    }}
                    className={`px-1.5 py-0.5 rounded border font-bold transition cursor-pointer flex items-center gap-1 ${
                      showMissionPlan
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                    title="Toggle 3D mission trajectory lines, waypoints, and decision branch boxes"
                  >
                    <Navigation className="w-2.5 h-2.5" />
                    <span>VECTORS: {showMissionPlan ? 'ON' : 'OFF'}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    soundFx.playClick();
                    onToggleRangeRing(!showRangeRing);
                  }}
                  className={`px-1.5 py-0.5 rounded border font-bold transition cursor-pointer flex items-center gap-1 ${
                    showRangeRing
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                  title="Toggle tactical radar & operational range ring"
                >
                  <CircleDot className="w-2.5 h-2.5" />
                  <span>RANGE: {showRangeRing ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>

            {/* SUB-VIEW A: VIEWER MODE TELEMETRY */}
            {graduationMode === 'VIEWER' && (
              <div className="p-3 flex flex-col gap-2.5">
                {/* Entity Identity Card */}
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-white">{selectedEntity.name}</span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-black"
                      style={{ backgroundColor: `${selectedEntity.colorHex}25`, color: selectedEntity.colorHex }}
                    >
                      {selectedEntity.faction}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2">
                    <span>CALLSIGN: {selectedEntity.callsign}</span>
                    <span>•</span>
                    <span>DOMAIN: {selectedEntity.domain.replace('_', ' ')}</span>
                  </div>
                </div>

                {/* Geodetic Telemetry */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">LATITUDE</span>
                    <span className="text-slate-200 font-bold">{(selectedEntity.position?.lat ?? 0).toFixed(3)}°</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">LONGITUDE</span>
                    <span className="text-slate-200 font-bold">{(selectedEntity.position?.lon ?? 0).toFixed(3)}°</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">ALTITUDE</span>
                    <span className="text-cyan-300 font-bold">{(selectedEntity.position?.altitudeKm ?? 0).toFixed(1)} km</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">SPEED</span>
                    <span className="text-amber-300 font-bold">
                      {(selectedEntity.speedKnotsOrKms ?? 0).toFixed(0)} {selectedEntity.domain === 'SPACE_SATELLITE' ? 'km/s' : 'kts'}
                    </span>
                  </div>
                </div>

                {/* AI Behavior & ROE */}
                <div className="p-2 rounded bg-slate-950 border border-slate-800 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                    <Radio className="w-3 h-3 text-cyan-400" />
                    AUTONOMOUS BEHAVIOR STATUS
                  </span>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300">AI MODE:</span>
                    <span className="text-emerald-400 font-bold">{selectedEntity.aiBehavior.mode}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300">ALERT:</span>
                    <span className="text-amber-400 font-bold">{selectedEntity.aiBehavior.alertStatus}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 border-t border-slate-800 pt-1">
                    {selectedEntity.aiBehavior.ruleOfEngagement}
                  </p>
                </div>

                {/* Intelligence Dossier Notes */}
                {selectedEntity.intelNotes && (
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300 flex flex-col gap-1">
                    <span className="font-bold text-amber-400 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      INTELLIGENCE BRIEF
                    </span>
                    <p className="text-slate-400">{selectedEntity.intelNotes}</p>
                  </div>
                )}

                {/* Camera Actions: Lock Camera & Iso View */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      onToggleTracking();
                    }}
                    className={`py-1.5 px-2 rounded font-bold cursor-pointer transition flex items-center justify-center gap-1.5 text-[10px] ${
                      isTrackingEntity
                        ? 'bg-cyan-500 text-slate-950 font-black'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isTrackingEntity ? 'TRACKING ON' : 'LOCK CAMERA'}</span>
                  </button>

                  <button
                    onClick={() => {
                      soundFx.playClick();
                      onTriggerIsoFocus(selectedEntity);
                    }}
                    className="py-1.5 px-2 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/80 text-cyan-300 font-bold cursor-pointer transition flex items-center justify-center gap-1.5 text-[10px]"
                  >
                    <Box className="w-3.5 h-3.5 text-cyan-400" />
                    <span>ISO PERSPECTIVE</span>
                  </button>
                </div>

                {/* Just Display Selected Asset (Solo View) Action Button */}
                <button
                  onClick={() => {
                    soundFx.playTargetLock();
                    onToggleSoloSelected();
                  }}
                  className={`w-full py-2 rounded-lg font-bold cursor-pointer transition flex items-center justify-center gap-1.5 text-xs border ${
                    isSoloSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-lg shadow-amber-950/60 ring-1 ring-amber-400'
                      : 'bg-slate-900 hover:bg-slate-850 border-amber-500/60 text-amber-300 hover:border-amber-400'
                  }`}
                  title="Display ONLY this asset on the 3D globe (hides all other forces)"
                >
                  <Eye className={`w-3.5 h-3.5 ${isSoloSelected ? 'text-black' : 'text-amber-400 animate-pulse'}`} />
                  <span>{isSoloSelected ? 'SOLO ACTIVE: CLICK TO RESTORE ALL FORCES' : 'JUST DISPLAY THIS ASSET (SOLO VIEW)'}</span>
                </button>

                {/* Switch to Command Mode Shortcut */}
                <button
                  onClick={() => {
                    soundFx.playTargetLock();
                    onChangeGraduationMode('COMMAND_MODE');
                  }}
                  className="w-full py-2 rounded-lg bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500/80 text-cyan-300 font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-950/50 text-xs transition"
                >
                  <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  ENTER COMMAND MODE & QUEUE MISSIONS
                </button>
              </div>
            )}

            {/* SUB-VIEW B: COMMAND MODE INSPECTOR */}
            {graduationMode === 'COMMAND_MODE' && (
              <CommandModeInspector
                selectedEntity={selectedEntity}
                selectedEntityIds={selectedEntityIds}
                allEntities={entities}
                onSelectEntity={(id) => onSelectEntity(id, false)}
                onUpdateEntityVitals={onUpdateEntityVitals}
                onUpdateEntityMission={onUpdateEntityMission}
                onBroadcastMissionToSelected={onBroadcastMissionToSelected}
                showRangeRing={showRangeRing}
                onToggleRangeRing={onToggleRangeRing}
                simTimeSec={simTimeSec}
              />
            )}

            {/* SUB-VIEW C: CONSTRAINED GAME CRISIS COMMAND */}
            {graduationMode === 'CONSTRAINED_GAME' && (
              <div className="p-3 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                    <Crosshair className="w-4 h-4" />
                    TACTICAL CRISIS COMMAND
                  </span>
                  <span className="text-[10px] text-amber-500 font-bold">GAME RULES ACTIVE</span>
                </div>

                <div className="p-2.5 rounded bg-amber-950/20 border border-amber-500/40 text-[11px] text-amber-200 flex flex-col gap-1">
                  <span className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    THEATER THREAT LEVEL: DEFCON 2
                  </span>
                  <p className="text-[10px] text-amber-300/80">
                    Direct crisis response commands for unit {selectedEntity.callsign}.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-slate-400 font-bold text-[11px]">DIRECT COMMAND: {selectedEntity.callsign}</span>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => {
                        soundFx.playTargetLock();
                        alert(`TACTICAL ORDER TRANSMITTED: ${selectedEntity.callsign} escalated to DEFCON 1!`);
                      }}
                      className="w-full py-2 rounded bg-red-950/80 hover:bg-red-900 border border-red-500/80 text-red-200 font-bold cursor-pointer text-left px-3 flex items-center justify-between"
                    >
                      <span>ESCALATE TO DEFCON 1</span>
                      <Shield className="w-3.5 h-3.5 text-red-400" />
                    </button>
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        alert(`EMCON ORDER: ${selectedEntity.callsign} switched to EMCON ALPHA (Radio Silence).`);
                      }}
                      className="w-full py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer text-left px-3 flex items-center justify-between"
                    >
                      <span>RIG FOR SILENT RUNNING (EMCON ALPHA)</span>
                      <Lock className="w-3.5 h-3.5 text-cyan-400" />
                    </button>
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        alert(`TACTICAL RECON: Scrambled airborne radar sweep on ${selectedEntity.callsign}.`);
                      }}
                      className="w-full py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer text-left px-3 flex items-center justify-between"
                    >
                      <span>SCRAMBLE ASW / RECON SWEEP</span>
                      <Radio className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-VIEW D: AUTHORING STUDIO ASSET EDITOR */}
            {graduationMode === 'AUTHORING_STUDIO' && (
              <div className="p-3 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4" />
                    ASSET CONFIGURATION
                  </span>
                  <span className="text-[10px] text-emerald-500 font-bold">{selectedEntity.callsign}</span>
                </div>

                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex flex-col gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">CALLSIGN</label>
                    <input
                      type="text"
                      value={selectedEntity.callsign}
                      onChange={(e) => {
                        if (onUpdateCassette) {
                          onUpdateCassette({
                            ...cassette,
                            entities: cassette.entities.map((ent) =>
                              ent.id === selectedEntity.id ? { ...ent, callsign: e.target.value } : ent
                            )
                          });
                        }
                      }}
                      className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono text-[11px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">LATITUDE (°)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedEntity.position?.lat ?? 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          if (onUpdateCassette) {
                            onUpdateCassette({
                              ...cassette,
                              entities: cassette.entities.map((ent) =>
                                ent.id === selectedEntity.id
                                  ? { ...ent, position: { ...(ent.position || { lat: 0, lon: 0, altitudeKm: 0 }), lat: val } }
                                  : ent
                              )
                            });
                          }
                        }}
                        className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">LONGITUDE (°)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedEntity.position?.lon ?? 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          if (onUpdateCassette) {
                            onUpdateCassette({
                              ...cassette,
                              entities: cassette.entities.map((ent) =>
                                ent.id === selectedEntity.id
                                  ? { ...ent, position: { ...(ent.position || { lat: 0, lon: 0, altitudeKm: 0 }), lon: val } }
                                  : ent
                              )
                            });
                          }
                        }}
                        className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">SPEED (KTS / KM/S)</label>
                    <input
                      type="number"
                      value={selectedEntity.speedKnotsOrKms}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        if (onUpdateCassette) {
                          onUpdateCassette({
                            ...cassette,
                            entities: cassette.entities.map((ent) =>
                              ent.id === selectedEntity.id ? { ...ent, speedKnotsOrKms: val } : ent
                            )
                          });
                        }
                      }}
                      className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono text-[11px]"
                    />
                  </div>

                  {/* Clone and Delete Actions */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        if (onUpdateCassette) {
                          const clone: SimulationEntity = {
                            ...selectedEntity,
                            id: `clone-${Date.now()}`,
                            callsign: `${selectedEntity.callsign}-B`,
                            name: `${selectedEntity.name} (Echelon 2)`,
                            position: {
                              ...(selectedEntity.position || { lat: 0, lon: 0, altitudeKm: 0 }),
                              lat: (selectedEntity.position?.lat ?? 0) + 1.5,
                              lon: (selectedEntity.position?.lon ?? 0) + 1.5,
                              altitudeKm: selectedEntity.position?.altitudeKm ?? 0
                            }
                          };
                          onUpdateCassette({
                            ...cassette,
                            entities: [...cassette.entities, clone]
                          });
                          onSelectEntity(clone.id);
                        }
                      }}
                      className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3 text-cyan-400" />
                      <span>DUPLICATE</span>
                    </button>

                    <button
                      onClick={() => {
                        soundFx.playAlarm();
                        if (onUpdateCassette && confirm(`Delete asset ${selectedEntity.callsign}?`)) {
                          onUpdateCassette({
                            ...cassette,
                            entities: cassette.entities.filter((e) => e.id !== selectedEntity.id)
                          });
                          onSelectEntity(null);
                        }
                      }}
                      className="py-1 px-2 rounded bg-red-950/80 hover:bg-red-900 border border-red-500/80 text-red-200 font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                      <span>REMOVE</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
