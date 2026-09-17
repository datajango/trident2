import * as THREE from 'three';
import { LatLonAlt, SecurityClearance } from './types';

// Clearance levels in ascending hierarchy
const CLEARANCE_LEVELS: Record<SecurityClearance, number> = {
  'UNCLASSIFIED': 0,
  'CONFIDENTIAL': 1,
  'SECRET // NOFORN': 2,
  'TOP SECRET // SI-TK': 3,
  'COSMIC // BICES': 4
};

export function hasClearance(userLevel: SecurityClearance, requiredLevel: SecurityClearance): boolean {
  return (CLEARANCE_LEVELS[userLevel] ?? 0) >= (CLEARANCE_LEVELS[requiredLevel] ?? 0);
}

/**
 * Converts Geodetic Lat, Lon, Altitude into 3D Cartesian coordinates on a globe of radius R.
 * In Three.js:
 *  Y is North Pole (+90 deg lat)
 *  -Y is South Pole (-90 deg lat)
 *  X, Z is the Equator plane
 *  Prime Meridian (0 lon) points towards +Z
 */
export function latLonAltToCartesian(
  lat: number,
  lon: number,
  altitudeKm: number,
  globeRadius: number = 100,
  earthRealRadiusKm: number = 6371
): THREE.Vector3 {
  // Scale altitude relative to Earth radius
  const scale = (earthRealRadiusKm + altitudeKm) / earthRealRadiusKm;
  const r = globeRadius * scale;

  const phi = (90 - lat) * (Math.PI / 180); // Polar angle from +Y
  const theta = (lon + 180) * (Math.PI / 180); // Azimuthal angle around Y

  const x = -r * Math.sin(phi) * Math.cos(theta);
  const z = r * Math.sin(phi) * Math.sin(theta);
  const y = r * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

/**
 * Converts 3D Cartesian vector back to Lat, Lon, AltitudeKm.
 */
export function cartesianToLatLonAlt(
  v: THREE.Vector3,
  globeRadius: number = 100,
  earthRealRadiusKm: number = 6371
): LatLonAlt {
  const r = v.length();
  const altitudeKm = ((r / globeRadius) - 1) * earthRealRadiusKm;

  const lat = 90 - (Math.acos(Math.max(-1, Math.min(1, v.y / r))) * 180 / Math.PI);
  let lon = (Math.atan2(v.z, -v.x) * 180 / Math.PI) - 180;
  if (lon < -180) lon += 360;
  if (lon > 180) lon -= 360;

  return { lat, lon, altitudeKm };
}

/**
 * Great circle slerp between two geographic coordinates
 */
export function interpolateGreatCircle(
  p1: LatLonAlt,
  p2: LatLonAlt,
  t: number
): LatLonAlt {
  const p1Safe = p1 || { lat: 0, lon: 0, altitudeKm: 0 };
  const p2Safe = p2 || { lat: 0, lon: 0, altitudeKm: 0 };
  const v1 = latLonAltToCartesian(p1Safe.lat ?? 0, p1Safe.lon ?? 0, 0, 1).normalize();
  const v2 = latLonAltToCartesian(p2Safe.lat ?? 0, p2Safe.lon ?? 0, 0, 1).normalize();

  // Spherical linear interpolation
  const interpolated = new THREE.Vector3().copy(v1).lerp(v2, t).normalize();
  const res = cartesianToLatLonAlt(interpolated, 1, 6371);
  res.altitudeKm = THREE.MathUtils.lerp(p1Safe.altitudeKm || 0, p2Safe.altitudeKm || 0, t);
  return res;
}

/**
 * Compute orbit position for inclined circular satellite orbit
 */
export function computeOrbitCartesian(
  orbitRadiusKm: number,
  inclinationDeg: number,
  periodHours: number,
  phaseDeg: number,
  elapsedSec: number,
  globeRadius: number = 100,
  earthRealRadiusKm: number = 6371
): THREE.Vector3 {
  const scaledR = globeRadius * ((earthRealRadiusKm + orbitRadiusKm) / earthRealRadiusKm);
  const incRad = inclinationDeg * (Math.PI / 180);
  
  // Mean motion
  const omega = (2 * Math.PI) / (periodHours * 3600);
  const theta = (phaseDeg * (Math.PI / 180)) + (omega * elapsedSec);

  // In orbital plane (xOrb, zOrb)
  const xOrb = scaledR * Math.cos(theta);
  const zOrb = scaledR * Math.sin(theta);

  // Incline around X axis
  const x = xOrb;
  const y = zOrb * Math.sin(incRad);
  const z = zOrb * Math.cos(incRad);

  return new THREE.Vector3(x, y, z);
}
