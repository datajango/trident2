import { useState, useEffect } from 'react';
import { CameraMemoryParameters } from './types';

// Standard true mathematical isometric angles
export const ISOMETRIC_PITCH_RAD = Math.atan(1 / Math.SQRT2); // 0.6154797 rad (~35.264°)
export const ISOMETRIC_YAW_RAD = Math.PI / 4; // 0.785398 rad (45.0°)

export const DEFAULT_CAMERA_MEMORY_PARAMS: CameraMemoryParameters = {
  isIsoPerspective: false,
  savedZoomFactor: 55.0, // Default tactical inspection distance in 3D units
  zoomMultiplier: 1.0,   // 55u = 1.0x baseline
  elevationDeg: 35.264,
  azimuthDeg: 45.0,
  lockIsoAngle: false,
  lastUpdatedTimestamp: Date.now()
};

// In-memory singleton state
let inMemoryCameraParams: CameraMemoryParameters = { ...DEFAULT_CAMERA_MEMORY_PARAMS };

type Listener = (params: CameraMemoryParameters) => void;
const listeners = new Set<Listener>();

function notify() {
  const current = { ...inMemoryCameraParams };
  listeners.forEach((listener) => {
    try {
      listener(current);
    } catch {
      // safe fallback
    }
  });
}

/**
 * Get current in-memory camera parameters
 */
export function getCameraMemoryParameters(): CameraMemoryParameters {
  return { ...inMemoryCameraParams };
}

/**
 * Update partial camera memory parameters
 */
export function updateCameraMemoryParameters(updates: Partial<CameraMemoryParameters>): CameraMemoryParameters {
  inMemoryCameraParams = {
    ...inMemoryCameraParams,
    ...updates,
    lastUpdatedTimestamp: Date.now()
  };

  // Keep multiplier in sync with savedZoomFactor
  if (updates.savedZoomFactor !== undefined) {
    const clamped = Math.max(20, Math.min(950, updates.savedZoomFactor));
    inMemoryCameraParams.savedZoomFactor = Math.round(clamped * 10) / 10;
    inMemoryCameraParams.zoomMultiplier = Math.round((clamped / 55.0) * 100) / 100;
  }

  notify();
  return { ...inMemoryCameraParams };
}

/**
 * Save current zoom distance explicitly to in-memory parameters
 */
export function saveCurrentZoomFactor(zoomDistance: number): CameraMemoryParameters {
  const clamped = Math.max(20, Math.min(950, zoomDistance));
  const rounded = Math.round(clamped * 10) / 10;
  return updateCameraMemoryParameters({
    savedZoomFactor: rounded,
    zoomMultiplier: Math.round((rounded / 55.0) * 100) / 100
  });
}

/**
 * Toggle Isometric Perspective Mode
 */
export function toggleIsoPerspective(force?: boolean): CameraMemoryParameters {
  const next = force !== undefined ? force : !inMemoryCameraParams.isIsoPerspective;
  return updateCameraMemoryParameters({ isIsoPerspective: next });
}

/**
 * React hook to subscribe to reactive updates of the in-memory camera parameters
 */
export function useCameraMemoryParameters(): {
  params: CameraMemoryParameters;
  saveZoom: (distance: number) => void;
  toggleIso: (force?: boolean) => void;
  updateParams: (updates: Partial<CameraMemoryParameters>) => void;
  resetToDefaults: () => void;
} {
  const [params, setParams] = useState<CameraMemoryParameters>(() => getCameraMemoryParameters());

  useEffect(() => {
    const handler: Listener = (newParams) => {
      setParams(newParams);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return {
    params,
    saveZoom: saveCurrentZoomFactor,
    toggleIso: toggleIsoPerspective,
    updateParams: updateCameraMemoryParameters,
    resetToDefaults: () => {
      inMemoryCameraParams = { ...DEFAULT_CAMERA_MEMORY_PARAMS, lastUpdatedTimestamp: Date.now() };
      notify();
    }
  };
}
