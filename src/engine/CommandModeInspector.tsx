import React, { useState } from 'react';
import {
  SimulationEntity,
  UnitVitals,
  SubsystemCapability,
  MissionPlan,
  MissionObjective,
  MissionDecisionRule,
  DecisionTriggerCondition,
  DecisionRuleAction,
  ObjectiveType
} from './types';
import { DOCTRINE_PRESETS } from './missionDoctrineTemplates';
import { soundFx } from '../audio/soundEngine';
import {
  Shield,
  Crosshair,
  Radio,
  Zap,
  Fuel,
  Compass,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  GitBranch,
  CornerDownRight,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Volume2,
  Layers,
  Sliders,
  Flame,
  Wifi,
  Eye,
  Lock,
  Globe,
  CircleDot
} from 'lucide-react';

interface CommandModeInspectorProps {
  selectedEntity: SimulationEntity | null;
  selectedEntityIds: Set<string>;
  allEntities: SimulationEntity[];
  onSelectEntity: (entityId: string, isShift?: boolean) => void;
  onUpdateEntityVitals: (entityId: string, vitals: UnitVitals) => void;
  onUpdateEntityMission: (entityId: string, mission: MissionPlan) => void;
  onBroadcastMissionToSelected: (mission: MissionPlan) => void;
  showRangeRing: boolean;
  onToggleRangeRing: (show: boolean) => void;
  simTimeSec: number;
}

export const CommandModeInspector: React.FC<CommandModeInspectorProps> = ({
  selectedEntity,
  selectedEntityIds,
  allEntities,
  onSelectEntity,
  onUpdateEntityVitals,
  onUpdateEntityMission,
  onBroadcastMissionToSelected,
  showRangeRing,
  onToggleRangeRing,
  simTimeSec
}) => {
  // Active Sub-tab inside Command Mode
  const [activeSubTab, setActiveSubTab] = useState<'VITALS_SUBSYSTEMS' | 'MISSION_QUEUE' | 'DECISION_TREE'>('MISSION_QUEUE');

  // New Objective Form State
  const [isAddingObjective, setIsAddingObjective] = useState<boolean>(false);
  const [newObjType, setNewObjType] = useState<ObjectiveType>('INFILTRATE');
  const [newObjTitle, setNewObjTitle] = useState<string>('INFILTRATE CHOKEPOINT PASSAGE');
  const [newObjDesc, setNewObjDesc] = useState<string>('Silent running protocol. Navigate acoustic shadow corridor.');

  // New Decision Rule Form State
  const [addingRuleToObjId, setAddingRuleToObjId] = useState<string | null>(null);
  const [newRuleTrigger, setNewRuleTrigger] = useState<DecisionTriggerCondition>('RADAR_SPIKE_DETECTED');
  const [newRuleAction, setNewRuleAction] = useState<DecisionRuleAction>('CONFOUND');
  const [newRuleDesc, setNewRuleDesc] = useState<string>('Deploy high-gain active EW jamming and radar signature decoys.');

  if (!selectedEntity) {
    return (
      <div className="p-6 text-center text-slate-500 font-mono text-xs flex flex-col items-center justify-center h-full gap-3">
        <Crosshair className="w-10 h-10 text-slate-700 animate-pulse" />
        <span className="font-bold text-slate-400">NO TACTICAL UNIT SELECTED</span>
        <p className="max-w-xs text-[11px] text-slate-500 leading-relaxed">
          Select a naval combatant, submarine, bomber, or satellite on the 3D globe or from the Force Roster below to enter Command Mode.
        </p>
        <div className="w-full mt-4 flex flex-col gap-1 text-left">
          <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Quick Select Available Combatants:</span>
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
            {allEntities.slice(0, 8).map((e) => (
              <button
                key={e.id}
                onClick={() => onSelectEntity(e.id)}
                className="p-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.colorHex }} />
                  <span className="font-bold">{e.name}</span>
                </div>
                <span className="text-[9px] text-slate-400">{e.faction}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const vitals = selectedEntity.vitals!;
  const mission = selectedEntity.missionPlan!;

  // Helpers to update vitals
  const updateVitals = (partial: Partial<UnitVitals>) => {
    onUpdateEntityVitals(selectedEntity.id, {
      ...vitals,
      ...partial
    });
  };

  // Helper to repair / toggle a subsystem
  const handleToggleSubsystem = (subId: string) => {
    soundFx.playClick();
    const nextSubs = vitals.subsystems.map((s) => {
      if (s.id !== subId) return s;
      if (s.state === 'OPERATIONAL') {
        return { ...s, state: 'OFFLINE' as const, repairProgressPercent: 0 };
      }
      if (s.state === 'OFFLINE') {
        return { ...s, state: 'REPAIRING' as const, repairProgressPercent: 20 };
      }
      return { ...s, state: 'OPERATIONAL' as const, repairProgressPercent: 100 };
    });
    updateVitals({ subsystems: nextSubs });
  };

  // Expedite repair on an active subsystem
  const handleExpediteRepair = (subId: string) => {
    soundFx.playTargetLock();
    const nextSubs = vitals.subsystems.map((s) => {
      if (s.id === subId) {
        return { ...s, state: 'OPERATIONAL' as const, repairProgressPercent: 100 };
      }
      return s;
    });
    updateVitals({ subsystems: nextSubs, operatingCondition: 'COMBAT_READY' });
  };

  // Quick test triggers
  const handleExpendAmmo = (count: number = 4) => {
    soundFx.playAlarm();
    const nextAmmo = Math.max(0, vitals.ammoCount - count);
    updateVitals({ ammoCount: nextAmmo });

    // Check if ammo rule triggered
    if (nextAmmo === 0) {
      triggerDecisionAction('RETURN_TO_BASE', 'Ammunition completely exhausted. RTB rule initiated!');
    }
  };

  const handleTakeDamage = (amount: number = 25) => {
    soundFx.playAlarm();
    const nextHealth = Math.max(10, vitals.healthPercent - amount);
    const nextCondition = nextHealth < 40 ? 'CRITICAL_OFFLINE' : nextHealth < 75 ? 'DEGRADED' : 'COMBAT_READY';
    updateVitals({ healthPercent: nextHealth, operatingCondition: nextCondition });

    if (nextHealth < 40) {
      triggerDecisionAction('EVADE', 'Hull health collapsed below 40%. Emergency EVADE survival rule active!');
    }
  };

  const handleTriggerRadarSpike = () => {
    soundFx.playTargetLock();
    triggerDecisionAction('CONFOUND', 'Hostile fire-control radar spike detected! Deploying CONFOUND electronic countermeasures.');
  };

  const handleTriggerBingoFuel = () => {
    soundFx.playAlarm();
    updateVitals({ fuelPercent: 18 });
    triggerDecisionAction('RETURN_TO_BASE', 'Bingo fuel alert: Reserve depleted below 20%. Autonomous RTB engaged.');
  };

  const handleRestoreCombatReady = () => {
    soundFx.playClick();
    const restoredSubs = vitals.subsystems.map((s) => ({
      ...s,
      state: 'OPERATIONAL' as const,
      repairProgressPercent: 100
    }));
    updateVitals({
      healthPercent: 100,
      powerPercent: 100,
      fuelPercent: 100,
      ammoCount: vitals.maxAmmo,
      operatingCondition: 'COMBAT_READY',
      subsystems: restoredSubs
    });
    onUpdateEntityMission(selectedEntity.id, {
      ...mission,
      activeBranch: undefined,
      missionLogs: [
        ...mission.missionLogs,
        {
          simSec: Math.floor(simTimeSec),
          text: `Unit replenished to full combat readiness. Systems 100% nominal.`,
          type: 'SUCCESS'
        }
      ]
    });
  };

  const triggerDecisionAction = (action: DecisionRuleAction, reason: string) => {
    const updatedMission: MissionPlan = {
      ...mission,
      activeBranch: {
        action,
        reason,
        activatedAtSimSec: Math.floor(simTimeSec)
      },
      missionLogs: [
        ...mission.missionLogs,
        {
          simSec: Math.floor(simTimeSec),
          text: `[DECISION GATE TRIGGERED] ${reason}`,
          type: 'DECISION'
        }
      ]
    };
    onUpdateEntityMission(selectedEntity.id, updatedMission);
  };

  // Add new Objective Step
  const handleAddObjective = () => {
    soundFx.playClick();
    const newStep: MissionObjective = {
      id: `obj-${Date.now()}`,
      stepNumber: mission.objectives.length + 1,
      title: newObjTitle,
      type: newObjType,
      description: newObjDesc,
      targetCoord: {
        lat: (selectedEntity.position?.lat ?? 0) + (Math.random() * 4 - 2),
        lon: (selectedEntity.position?.lon ?? 0) + (Math.random() * 6 - 3),
        altitudeKm: selectedEntity.position?.altitudeKm ?? 0
      },
      estimatedDurationSec: 180,
      status: 'PENDING',
      decisionRules: []
    };

    const nextObjectives = [...mission.objectives, newStep];
    onUpdateEntityMission(selectedEntity.id, {
      ...mission,
      objectives: nextObjectives,
      missionLogs: [
        ...mission.missionLogs,
        {
          simSec: Math.floor(simTimeSec),
          text: `Added step ${newStep.stepNumber}: ${newStep.title}`,
          type: 'ACTION'
        }
      ]
    });
    setIsAddingObjective(false);
  };

  // Delete an Objective Step
  const handleDeleteObjective = (objId: string) => {
    soundFx.playClick();
    const filtered = mission.objectives
      .filter((o) => o.id !== objId)
      .map((o, idx) => ({ ...o, stepNumber: idx + 1 }));

    onUpdateEntityMission(selectedEntity.id, {
      ...mission,
      objectives: filtered
    });
  };

  // Move Step Up / Down
  const handleMoveStep = (index: number, direction: 'UP' | 'DOWN') => {
    soundFx.playClick();
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= mission.objectives.length) return;

    const list = [...mission.objectives];
    const [moved] = list.splice(index, 1);
    list.splice(targetIdx, 0, moved);

    const renumbered = list.map((o, idx) => ({ ...o, stepNumber: idx + 1 }));
    onUpdateEntityMission(selectedEntity.id, {
      ...mission,
      objectives: renumbered
    });
  };

  // Add Decision Rule to a Step
  const handleAddRuleToStep = (objId: string) => {
    soundFx.playClick();
    const newRule: MissionDecisionRule = {
      id: `rule-${Date.now()}`,
      title: `${newRuleTrigger.replace('_', ' ')} -> ${newRuleAction}`,
      triggerCondition: newRuleTrigger,
      ruleAction: newRuleAction,
      ruleDescription: newRuleDesc,
      isTriggered: false
    };

    const updatedObjectives = mission.objectives.map((obj) => {
      if (obj.id === objId) {
        return {
          ...obj,
          decisionRules: [...obj.decisionRules, newRule]
        };
      }
      return obj;
    });

    onUpdateEntityMission(selectedEntity.id, {
      ...mission,
      objectives: updatedObjectives
    });
    setAddingRuleToObjId(null);
  };

  // Load a Pre-built Tactical Doctrine
  const handleLoadDoctrine = (doctrineId: string) => {
    soundFx.playTargetLock();
    const preset = DOCTRINE_PRESETS.find((p) => p.id === doctrineId);
    if (!preset) return;

    const newObjectives = preset.generateObjectives(selectedEntity);
    const newMission: MissionPlan = {
      ...mission,
      doctrineName: preset.name,
      status: 'EXECUTING',
      currentObjectiveIndex: 0,
      objectives: newObjectives,
      activeBranch: undefined,
      missionLogs: [
        ...mission.missionLogs,
        {
          simSec: Math.floor(simTimeSec),
          text: `Tactical doctrine loaded: ${preset.name}. Decision trees synchronized.`,
          type: 'INFO'
        }
      ]
    };
    onUpdateEntityMission(selectedEntity.id, newMission);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/95 font-mono text-xs overflow-hidden">
      {/* Unit Command Header Ribbon */}
      <div className="p-3 border-b border-slate-800 bg-slate-950 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full ring-2 ring-slate-800 animate-pulse"
              style={{ backgroundColor: selectedEntity.colorHex }}
            />
            <div className="flex flex-col">
              <span className="font-black text-sm text-white tracking-wide">{selectedEntity.name}</span>
              <span className="text-[10px] text-slate-400">
                CALLSIGN: <strong className="text-cyan-400">{selectedEntity.callsign}</strong> • DOMAIN:{' '}
                {selectedEntity.domain.replace('_', ' ')}
              </span>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase tracking-wider ${
              vitals.operatingCondition === 'COMBAT_READY'
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                : vitals.operatingCondition === 'UNDER_REPAIR'
                ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                : 'bg-red-950/80 border-red-500 text-red-300'
            }`}
          >
            {vitals.operatingCondition.replace('_', ' ')}
          </span>
        </div>

        {/* Multi-Unit Selection Controls */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-850 text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              TASK FORCE UNITS:{' '}
              <strong className="text-cyan-300">
                {selectedEntityIds.size > 1 ? `${selectedEntityIds.size} SELECTED` : '1 UNIT (STANDALONE)'}
              </strong>
            </span>
          </div>

          {selectedEntityIds.size > 1 && (
            <button
              onClick={() => {
                soundFx.playTargetLock();
                onBroadcastMissionToSelected(mission);
                alert(`Mission Plan & Decision Trees broadcast to all ${selectedEntityIds.size} selected units!`);
              }}
              className="px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold tracking-wider cursor-pointer"
            >
              SYNC TO ALL {selectedEntityIds.size} UNITS
            </button>
          )}
        </div>

        {/* Sub-tab Navigation */}
        <div className="grid grid-cols-3 gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-bold">
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveSubTab('MISSION_QUEUE');
            }}
            className={`py-1 rounded text-center transition cursor-pointer flex items-center justify-center gap-1 ${
              activeSubTab === 'MISSION_QUEUE'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3 h-3" />
            OBJECTIVES ({mission.objectives.length})
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveSubTab('DECISION_TREE');
            }}
            className={`py-1 rounded text-center transition cursor-pointer flex items-center justify-center gap-1 ${
              activeSubTab === 'DECISION_TREE'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitBranch className="w-3 h-3" />
            DECISION TREE
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveSubTab('VITALS_SUBSYSTEMS');
            }}
            className={`py-1 rounded text-center transition cursor-pointer flex items-center justify-center gap-1 ${
              activeSubTab === 'VITALS_SUBSYSTEMS'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3 h-3" />
            VITALS & ABILITIES
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-0">
        {/* Active Emergency Decision Branch Alert Banner */}
        {mission.activeBranch && (
          <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500 text-red-200 flex flex-col gap-1 shadow-lg animate-pulse">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-xs">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                SURVIVAL DIRECTIVE ACTIVE: {mission.activeBranch.action}
              </span>
              <span className="text-[10px] text-red-400">T+{mission.activeBranch.activatedAtSimSec}s</span>
            </div>
            <p className="text-[11px] text-red-300/90 leading-tight">{mission.activeBranch.reason}</p>
            <button
              onClick={() => {
                soundFx.playClick();
                onUpdateEntityMission(selectedEntity.id, {
                  ...mission,
                  activeBranch: undefined
                });
              }}
              className="mt-1 px-2 py-0.5 rounded bg-red-900/60 hover:bg-red-800 text-[10px] font-bold text-white self-start cursor-pointer"
            >
              DISENGAGE DIRECTIVE / RESUME MISSION
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: SEQUENTIAL MISSION OBJECTIVES QUEUE                    */}
        {/* ------------------------------------------------------------- */}
        {activeSubTab === 'MISSION_QUEUE' && (
          <div className="flex flex-col gap-3">
            {/* Doctrine Presets Ribbon */}
            <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>DOCTRINE PRESET:</span>
              </div>
              <select
                onChange={(e) => handleLoadDoctrine(e.target.value)}
                defaultValue=""
                className="bg-slate-900 border border-slate-700 text-cyan-300 text-[11px] px-2 py-0.5 rounded outline-none cursor-pointer"
              >
                <option value="" disabled>
                  Load Tactical Doctrine...
                </option>
                {DOCTRINE_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Objectives List */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>SEQUENTIAL OBJECTIVE QUEUE</span>
                <span>{mission.objectives.length} STEPS</span>
              </div>

              {mission.objectives.map((obj, idx) => {
                const isActive = idx === mission.currentObjectiveIndex && mission.status === 'EXECUTING';

                return (
                  <div
                    key={obj.id}
                    className={`p-2.5 rounded-lg border transition flex flex-col gap-1.5 ${
                      isActive
                        ? 'bg-slate-950 border-cyan-500 shadow-md shadow-cyan-950/40'
                        : 'bg-slate-950/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                            isActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {obj.stepNumber}
                        </span>
                        <span className="font-bold text-slate-100 text-xs">{obj.title}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            obj.type === 'INFILTRATE'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              : obj.type === 'STAND_AND_HOLD'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : obj.type === 'EVADE_ESCAPE'
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : obj.type === 'CONFOUND_DECOY'
                              ? 'bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-800'
                              : obj.type === 'RETURN_TO_BASE'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {obj.type.replace('_', ' ')}
                        </span>

                        <button
                          onClick={() => handleMoveStep(idx, 'UP')}
                          disabled={idx === 0}
                          className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                          title="Move step up"
                        >
                          <ChevronUp className="w-3 h-3 text-slate-400" />
                        </button>
                        <button
                          onClick={() => handleMoveStep(idx, 'DOWN')}
                          disabled={idx === mission.objectives.length - 1}
                          className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                          title="Move step down"
                        >
                          <ChevronDown className="w-3 h-3 text-slate-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteObjective(obj.id)}
                          className="p-1 rounded hover:bg-red-950 hover:text-red-400 cursor-pointer"
                          title="Delete step"
                        >
                          <Trash2 className="w-3 h-3 text-slate-500" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400">{obj.description}</p>

                    {/* Target Coordinate Badge */}
                    {obj.targetCoord && typeof obj.targetCoord.lat === 'number' && (
                      <div className="flex items-center justify-between text-[10px] text-slate-500 bg-slate-900/60 px-2 py-1 rounded">
                        <span>
                          TARGET: {obj.targetCoord.lat.toFixed(2)}°, {(obj.targetCoord.lon ?? 0).toFixed(2)}°
                        </span>
                        <span>EST DURATION: ~{obj.estimatedDurationSec}s</span>
                      </div>
                    )}

                    {/* Attached Decision Rules */}
                    {obj.decisionRules.length > 0 && (
                      <div className="mt-1 pt-1 border-t border-slate-850 flex flex-col gap-1">
                        <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                          <GitBranch className="w-3 h-3" />
                          DECISION GATES ({obj.decisionRules.length}):
                        </span>
                        {obj.decisionRules.map((rule) => (
                          <div
                            key={rule.id}
                            className="p-1.5 rounded bg-amber-950/20 border border-amber-500/30 text-[10px] text-amber-200 flex flex-col gap-0.5"
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span>
                                IF {rule.triggerCondition.replace('_', ' ')}
                              </span>
                              <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-black">
                                → {rule.ruleAction}
                              </span>
                            </div>
                            <span className="text-slate-400 text-[9px]">{rule.ruleDescription}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Rule to this step button */}
                    <button
                      onClick={() => setAddingRuleToObjId(addingRuleToObjId === obj.id ? null : obj.id)}
                      className="mt-1 self-start text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      {addingRuleToObjId === obj.id ? 'CANCEL DECISION GATE' : 'ADD DECISION GATE TO STEP'}
                    </button>

                    {/* Inline Add Decision Rule Form */}
                    {addingRuleToObjId === obj.id && (
                      <div className="p-2 rounded bg-slate-900 border border-amber-500/50 flex flex-col gap-2 mt-1">
                        <span className="text-[10px] font-bold text-amber-300">CONFIGURE SITUATION RULE:</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] text-slate-400">TRIGGER SITUATION:</span>
                            <select
                              value={newRuleTrigger}
                              onChange={(e) => setNewRuleTrigger(e.target.value as DecisionTriggerCondition)}
                              className="bg-slate-950 border border-slate-700 text-slate-200 text-[10px] p-1 rounded"
                            >
                              <option value="HEALTH_BELOW_40">Health Below 40%</option>
                              <option value="AMMO_DEPLETED">Ammo Depleted (0 Cells)</option>
                              <option value="FUEL_CRITICAL">Bingo Fuel (&lt;20%)</option>
                              <option value="HOSTILE_SUPERIORITY">Hostile Superiority (Outnumbered)</option>
                              <option value="RADAR_SPIKE_DETECTED">Radar Spike / Missile Lock</option>
                              <option value="COMMUNICATION_JAMMED">Comms / Data Link Jammed</option>
                              <option value="GO_NO_GO_CHECK">Go / No-Go Sensor Verification</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] text-slate-400">SURVIVAL ACTION:</span>
                            <select
                              value={newRuleAction}
                              onChange={(e) => setNewRuleAction(e.target.value as DecisionRuleAction)}
                              className="bg-slate-950 border border-slate-700 text-amber-300 text-[10px] p-1 rounded font-bold"
                            >
                              <option value="RETURN_TO_BASE">Return to Base (RTB)</option>
                              <option value="STAND_AND_HOLD">Stand and Hold</option>
                              <option value="EVADE">Evade &amp; Break Lock</option>
                              <option value="CONFOUND">Confound (EW &amp; Decoys)</option>
                              <option value="INFILTRATE">Infiltrate (Silent Running)</option>
                              <option value="ABORT_TO_SECONDARY">Abort to Secondary</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] text-slate-400">RULE DESCRIPTION:</span>
                          <input
                            type="text"
                            value={newRuleDesc}
                            onChange={(e) => setNewRuleDesc(e.target.value)}
                            className="bg-slate-950 border border-slate-700 text-slate-200 text-[10px] p-1 rounded"
                          />
                        </div>

                        <button
                          onClick={() => handleAddRuleToStep(obj.id)}
                          className="py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] cursor-pointer"
                        >
                          ATTACH DECISION GATE TO STEP {obj.stepNumber}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Step Button or Form */}
            {!isAddingObjective ? (
              <button
                onClick={() => {
                  soundFx.playClick();
                  setIsAddingObjective(true);
                }}
                className="w-full py-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/50 text-cyan-300 font-bold flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                <Plus className="w-4 h-4" />
                QUEUE NEW MISSION OBJECTIVE STEP
              </button>
            ) : (
              <div className="p-3 rounded-lg bg-slate-950 border border-cyan-500 flex flex-col gap-2">
                <span className="font-bold text-cyan-400 text-xs">CREATE OBJECTIVE STEP:</span>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400">OBJECTIVE TYPE:</span>
                  <select
                    value={newObjType}
                    onChange={(e) => setNewObjType(e.target.value as ObjectiveType)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs p-1.5 rounded"
                  >
                    <option value="INFILTRATE">Infiltrate (Low signature / silent transit)</option>
                    <option value="RECON_SWEEP">Recon Sweep (Wide sensor aperture sweep)</option>
                    <option value="STAND_AND_HOLD">Stand and Hold (Hold combat perimeter)</option>
                    <option value="SHADOW_TARGET">Shadow Target (Standoff tracking)</option>
                    <option value="CONFOUND_DECOY">Confound (Electronic attack &amp; decoys)</option>
                    <option value="EVADE_ESCAPE">Evade (Emergency thermal escape)</option>
                    <option value="STRIKE_INTERCEPT">Strike / Intercept Target</option>
                    <option value="RETURN_TO_BASE">Return to Base (RTB)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400">STEP TITLE:</span>
                  <input
                    type="text"
                    value={newObjTitle}
                    onChange={(e) => setNewObjTitle(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-slate-100 text-xs p-1.5 rounded"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400">INSTRUCTION DETAILS:</span>
                  <textarea
                    rows={2}
                    value={newObjDesc}
                    onChange={(e) => setNewObjDesc(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-slate-100 text-xs p-1.5 rounded"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={handleAddObjective}
                    className="py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs cursor-pointer"
                  >
                    CONFIRM &amp; QUEUE STEP
                  </button>
                  <button
                    onClick={() => setIsAddingObjective(false)}
                    className="py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: SURVIVAL DECISION TREE & GO/NO-GO RULES                */}
        {/* ------------------------------------------------------------- */}
        {activeSubTab === 'DECISION_TREE' && (
          <div className="flex flex-col gap-3">
            <div className="p-2.5 rounded bg-amber-950/20 border border-amber-500/40 text-amber-200 text-[11px] flex flex-col gap-1">
              <span className="font-bold flex items-center gap-1.5">
                <GitBranch className="w-4 h-4 text-amber-400" />
                AUTONOMOUS SURVIVAL DECISION TREE
              </span>
              <p className="text-slate-400 text-[10px] leading-relaxed">
                Rules continuously evaluate unit health, fuel, munitions, and hostile contact spikes. When triggered, the unit
                overrides the standard sequence to survive or hold the line based on operational conditions.
              </p>
            </div>

            {/* Test Simulation Controls */}
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                SIMULATE SITUATION TO TEST DECISION GATES:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={handleTriggerRadarSpike}
                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] text-amber-300 font-bold text-left cursor-pointer flex items-center gap-1"
                >
                  <Radio className="w-3 h-3 text-amber-400" />
                  RADAR SPIKE (CONFOUND)
                </button>
                <button
                  onClick={() => handleTakeDamage(35)}
                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] text-red-300 font-bold text-left cursor-pointer flex items-center gap-1"
                >
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                  BATTLE DAMAGE (EVADE)
                </button>
                <button
                  onClick={() => handleExpendAmmo(vitals.ammoCount)}
                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] text-blue-300 font-bold text-left cursor-pointer flex items-center gap-1"
                >
                  <Crosshair className="w-3 h-3 text-blue-400" />
                  EXHAUST AMMO (RTB)
                </button>
                <button
                  onClick={handleTriggerBingoFuel}
                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] text-purple-300 font-bold text-left cursor-pointer flex items-center gap-1"
                >
                  <Fuel className="w-3 h-3 text-purple-400" />
                  BINGO FUEL (&lt;20%)
                </button>
              </div>

              <button
                onClick={handleRestoreCombatReady}
                className="w-full py-1.5 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-300 font-bold text-[10px] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                RESTORE 100% COMBAT READY (RESET METERS)
              </button>
            </div>

            {/* Tree Nodes Visualizer */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-400">ACTIVE CONTINGENCY NODES:</span>

              {/* Node: Return To Base */}
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    CONTINGENCY: RETURN TO BASE (RTB)
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    SAFE HAVEN VECTOR
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex flex-col gap-1 pl-4 border-l-2 border-emerald-500/40">
                  <div className="flex items-center justify-between">
                    <span>CRITERIA 1: Fuel reserve &lt; 20% (Bingo)</span>
                    <span className={vitals.fuelPercent < 20 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                      {vitals.fuelPercent}% {vitals.fuelPercent < 20 ? '[TRIGGERED]' : '[NOMINAL]'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>CRITERIA 2: Ammunition magazine empty (0 VLS/Torpedoes)</span>
                    <span className={vitals.ammoCount === 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                      {vitals.ammoCount} left {vitals.ammoCount === 0 ? '[TRIGGERED]' : '[NOMINAL]'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Node: Evade */}
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-400 flex items-center gap-1.5">
                    <CornerDownRight className="w-3.5 h-3.5" />
                    CONTINGENCY: EMERGENCY EVADE
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                    FLANK SPEED BREAKOUT
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex flex-col gap-1 pl-4 border-l-2 border-red-500/40">
                  <div className="flex items-center justify-between">
                    <span>CRITERIA: Hull Integrity &lt; 40%</span>
                    <span className={vitals.healthPercent < 40 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                      {vitals.healthPercent}% {vitals.healthPercent < 40 ? '[TRIGGERED]' : '[NOMINAL]'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Node: Confound with EW Decoys */}
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-fuchsia-400 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5" />
                    CONTINGENCY: CONFOUND &amp; SPOOF
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-800">
                    EW JAMMING &amp; DECOYS
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex flex-col gap-1 pl-4 border-l-2 border-fuchsia-500/40">
                  <p>
                    Deploys high-power Gallium-Nitride active jamming beams, launches radar/acoustic phantom decoys, and
                    spoofs AIS/IFF transponders to create false fleet contacts.
                  </p>
                </div>
              </div>

              {/* Node: Stand and Hold */}
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    CONTINGENCY: STAND AND HOLD
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                    BATTLE PERIMETER
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex flex-col gap-1 pl-4 border-l-2 border-blue-500/40">
                  <p>
                    Anchor defensive perimeter cordon. Maintain interlocking fire-control channels with task force. Do not
                    break line unless explicitly counter-ordered.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: VITALS METERS & SUBSYSTEM ABILITIES MATRIX             */}
        {/* ------------------------------------------------------------- */}
        {activeSubTab === 'VITALS_SUBSYSTEMS' && (
          <div className="flex flex-col gap-3">
            {/* Vital Telemetry Meters */}
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col gap-2.5">
              <span className="font-bold text-cyan-400 text-[11px] flex items-center justify-between">
                <span>OPERATING CONDITION METERS</span>
                <button
                  onClick={() => onToggleRangeRing(!showRangeRing)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                    showRangeRing
                      ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  <CircleDot className="w-3 h-3" />
                  RANGE RING: {showRangeRing ? 'ON GLOBE' : 'HIDDEN'}
                </button>
              </span>

              {/* Health Meter */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    HULL &amp; STRUCTURE HEALTH:
                  </span>
                  <span
                    className={`font-black ${
                      vitals.healthPercent > 70
                        ? 'text-emerald-400'
                        : vitals.healthPercent > 35
                        ? 'text-amber-400'
                        : 'text-red-400 animate-pulse'
                    }`}
                  >
                    {vitals.healthPercent}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-300 ${
                      vitals.healthPercent > 70
                        ? 'bg-emerald-500'
                        : vitals.healthPercent > 35
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${vitals.healthPercent}%` }}
                  />
                </div>
              </div>

              {/* Power Grid Meter */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                    NUCLEAR REACTOR / POWER GRID:
                  </span>
                  <span className="font-black text-yellow-400">{vitals.powerPercent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-yellow-500 transition-all duration-300" style={{ width: `${vitals.powerPercent}%` }} />
                </div>
              </div>

              {/* Fuel Meter */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Fuel className="w-3.5 h-3.5 text-cyan-400" />
                    FUEL / ENDURANCE RESERVES:
                  </span>
                  <span
                    className={`font-black ${
                      vitals.fuelPercent > 25 ? 'text-cyan-400' : 'text-red-400 animate-pulse'
                    }`}
                  >
                    {vitals.fuelPercent}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-300 ${
                      vitals.fuelPercent > 25 ? 'bg-cyan-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${vitals.fuelPercent}%` }}
                  />
                </div>
              </div>

              {/* Ammo / VLS Cells Meter */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Crosshair className="w-3.5 h-3.5 text-red-400" />
                    MUNITIONS (VLS / TORPEDOES):
                  </span>
                  <span className="font-black text-slate-100">
                    {vitals.ammoCount} / {vitals.maxAmmo} ({Math.round((vitals.ammoCount / (vitals.maxAmmo || 1)) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{ width: `${(vitals.ammoCount / (vitals.maxAmmo || 1)) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <button
                    onClick={() => handleExpendAmmo(4)}
                    disabled={vitals.ammoCount <= 0}
                    className="px-2 py-0.5 rounded bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-[10px] font-bold cursor-pointer disabled:opacity-40"
                  >
                    EXPEND SALVO (-4)
                  </button>
                  <button
                    onClick={() => updateVitals({ ammoCount: vitals.maxAmmo })}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer"
                  >
                    REARM MAGAZINE
                  </button>
                </div>
              </div>

              {/* Operational Combat Range */}
              <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">COMBAT EFFECTIVE RADIUS:</span>
                <span className="font-black text-cyan-300">{vitals.operationalRangeKm.toLocaleString()} KM</span>
              </div>
            </div>

            {/* Subsystems & Enabled Capabilities Matrix */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>SUBSYSTEM CAPABILITIES ({vitals.subsystems.length})</span>
                <span className="text-[10px] text-slate-500">[CLICK TO TOGGLE STATE]</span>
              </div>

              {vitals.subsystems.map((sub) => {
                const isOperational = sub.state === 'OPERATIONAL';
                const isRepairing = sub.state === 'REPAIRING';
                const isOffline = sub.state === 'OFFLINE' || sub.state === 'DEGRADED';

                return (
                  <div
                    key={sub.id}
                    className={`p-2 rounded-lg border transition flex flex-col gap-1.5 ${
                      isOperational
                        ? 'bg-slate-950 border-slate-800'
                        : isRepairing
                        ? 'bg-amber-950/20 border-amber-500/60 shadow-md shadow-amber-950/20'
                        : 'bg-slate-950/40 border-slate-850 opacity-45'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {sub.category === 'PROPULSION' && <Zap className="w-3.5 h-3.5 text-cyan-400" />}
                        {sub.category === 'RADAR_SENSORS' && <Radio className="w-3.5 h-3.5 text-emerald-400" />}
                        {sub.category === 'WEAPONS_VLS' && <Crosshair className="w-3.5 h-3.5 text-red-400" />}
                        {sub.category === 'ELECTRONIC_WARFARE' && <Wifi className="w-3.5 h-3.5 text-fuchsia-400" />}
                        {sub.category === 'STEALTH_SIGNATURE' && <Shield className="w-3.5 h-3.5 text-blue-400" />}
                        {sub.category === 'COMMUNICATIONS' && <Globe className="w-3.5 h-3.5 text-amber-400" />}
                        {sub.category === 'DAMAGE_CONTROL' && <Wrench className="w-3.5 h-3.5 text-orange-400" />}

                        <span
                          className={`font-bold text-xs ${
                            isOperational ? 'text-slate-100' : isRepairing ? 'text-amber-300' : 'text-slate-500 line-through'
                          }`}
                        >
                          {sub.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            isOperational
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : isRepairing
                              ? 'bg-amber-950 text-amber-300 border border-amber-600 animate-pulse'
                              : 'bg-slate-900 text-slate-500 border border-slate-800'
                          }`}
                        >
                          {sub.state}
                        </span>

                        <button
                          onClick={() => handleToggleSubsystem(sub.id)}
                          className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-[9px] cursor-pointer"
                        >
                          TOGGLE
                        </button>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-tight">{sub.description}</p>

                    {/* Active Repair Progress Bar if repairing */}
                    {isRepairing && (
                      <div className="mt-1 pt-1 border-t border-amber-950 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[10px] text-amber-300 font-bold">
                          <span className="flex items-center gap-1">
                            <Wrench className="w-3 h-3 animate-spin" />
                            DAMAGE CONTROL REPAIRING:
                          </span>
                          <span>{Math.round(sub.repairProgressPercent)}% COMPLETED</span>
                        </div>
                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-amber-500/40 relative">
                          <div
                            className="h-full bg-amber-400 transition-all duration-300"
                            style={{ width: `${sub.repairProgressPercent}%` }}
                          />
                        </div>
                        <button
                          onClick={() => handleExpediteRepair(sub.id)}
                          className="mt-0.5 self-end px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-black font-black text-[9px] cursor-pointer"
                        >
                          EXPEDITE FIELD CREW (COMPLETE REPAIR)
                        </button>
                      </div>
                    )}

                    {/* If Offline */}
                    {isOffline && (
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-850">
                        <span className="flex items-center gap-1">
                          <Lock className="w-3 h-3 text-red-500" />
                          CAPABILITY DISABLED (BATTLE DAMAGE)
                        </span>
                        <button
                          onClick={() => handleToggleSubsystem(sub.id)}
                          className="px-1.5 py-0.5 rounded bg-amber-950 hover:bg-amber-900 text-amber-300 font-bold text-[9px] cursor-pointer"
                        >
                          INITIATE DAMAGE CONTROL
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Real-time Chronological Mission Log */}
        <div className="mt-2 p-2 rounded bg-slate-950 border border-slate-800 flex flex-col gap-1 shrink-0">
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
            <Radio className="w-3 h-3 text-cyan-400" />
            MISSION EXECUTION &amp; DECISION LOGS:
          </span>
          <div className="max-h-24 overflow-y-auto flex flex-col gap-0.5 text-[10px] font-mono pr-1">
            {mission.missionLogs.slice(-6).map((log, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-1.5 ${
                  log.type === 'DECISION'
                    ? 'text-amber-300 font-bold'
                    : log.type === 'ACTION'
                    ? 'text-cyan-300'
                    : log.type === 'SUCCESS'
                    ? 'text-emerald-300'
                    : 'text-slate-400'
                }`}
              >
                <span className="text-slate-600 shrink-0">T+{log.simSec}s:</span>
                <span>{log.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
