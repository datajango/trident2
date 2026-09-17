import * as THREE from 'three';
import { WorldVisualConfig } from './types';
import { latLonAltToCartesian } from './simulationMath';

// Continental outlines in polyline arrays [lat, lon]
const CONTINENTAL_VECTOR_DATA: [number, number][][] = [
  // North America
  [
    [71, -156], [70, -135], [68, -120], [60, -95], [62, -75], [55, -60], [47, -53], [44, -66],
    [35, -75], [25, -80], [29, -89], [26, -97], [19, -96], [16, -93], [8, -79], [9, -84],
    [16, -99], [22, -105], [32, -117], [37, -122], [48, -124], [58, -136], [60, -148], [65, -168], [71, -156]
  ],
  // Greenland
  [
    [83, -30], [80, -18], [70, -22], [60, -44], [65, -52], [76, -68], [82, -60], [83, -30]
  ],
  // South America
  [
    [12, -72], [10, -62], [5, -52], [-2, -44], [-7, -35], [-18, -39], [-23, -43], [-32, -52],
    [-40, -62], [-54, -68], [-55, -73], [-46, -75], [-33, -71], [-18, -70], [-5, -81], [5, -77], [12, -72]
  ],
  // Eurasia (UK, Europe, Russia, China, India, SE Asia)
  [
    [70, 28], [77, 104], [72, 140], [66, 170], [60, 163], [53, 143], [43, 132], [38, 128],
    [32, 121], [22, 114], [10, 105], [1, 104], [13, 100], [22, 89], [13, 80], [8, 77],
    [21, 70], [25, 62], [26, 56], [30, 48], [31, 35], [36, 28], [40, 23], [43, 12],
    [36, -5], [43, -9], [48, -4], [54, 8], [58, 10], [60, 5], [70, 28]
  ],
  // British Isles
  [
    [58, -5], [58, -2], [54, 0], [50, 1], [50, -5], [54, -3], [58, -5]
  ],
  // Scandinavia
  [
    [71, 26], [68, 15], [62, 5], [58, 8], [56, 12], [60, 18], [65, 23], [70, 30], [71, 26]
  ],
  // Africa
  [
    [37, 10], [32, 24], [31, 32], [22, 37], [12, 44], [12, 51], [-5, 40], [-15, 40],
    [-26, 33], [-34, 26], [-34, 18], [-22, 14], [-5, 12], [4, 7], [5, -1], [5, -4],
    [15, -17], [21, -17], [35, -6], [36, 0], [37, 10]
  ],
  // Australia & New Zealand
  [
    [-11, 142], [-15, 145], [-24, 153], [-33, 152], [-38, 146], [-35, 117], [-22, 114], [-15, 124], [-12, 131], [-11, 142]
  ],
  [
    [-35, 173], [-41, 175], [-46, 168], [-44, 171], [-37, 175], [-35, 173]
  ],
  // Japan
  [
    [45, 142], [43, 145], [36, 140], [33, 130], [35, 133], [40, 140], [45, 142]
  ],
  // Antarctica Rim
  [
    [-65, -64], [-68, 0], [-66, 60], [-65, 120], [-68, 160], [-71, -170], [-73, -100], [-65, -64]
  ]
];

// Strategic Strategic Bastions & Maritime Vector Corridors
const MARITIME_CORRIDORS: [number, number][][] = [
  // Malacca -> Indian Ocean -> Suez -> Gibraltar -> Atlantic
  [[1.3, 103.8], [5.9, 95.0], [6.0, 80.0], [12.0, 52.0], [27.8, 34.3], [31.5, 32.3], [36.0, 15.0], [36.0, -5.3], [40.0, -20.0], [40.7, -74.0]],
  // Trans-Pacific Container Corridor (Shanghai/Tokyo -> LA/Long Beach)
  [[31.2, 121.5], [34.5, 139.7], [38.0, 165.0], [40.0, -160.0], [37.0, -140.0], [33.7, -118.2]],
  // North Atlantic Route (Rotterdam/London -> New York)
  [[51.9, 4.3], [50.0, -5.0], [45.0, -30.0], [42.0, -50.0], [40.5, -73.8]],
  // Persian Gulf Oil Route (Hormuz -> Cape of Good Hope / Asia)
  [[26.5, 56.5], [23.5, 59.0], [15.0, 65.0], [5.0, 80.0], [0.0, 95.0]]
];

// Strategic Command Bases and Chokepoints
const STRATEGIC_BASES: { name: string; lat: number; lon: number; faction: string }[] = [
  { name: 'NORFOLK NAVAL BASE', lat: 36.9, lon: -76.3, faction: 'USA' },
  { name: 'SAN DIEGO FLEET BASE', lat: 32.7, lon: -117.2, faction: 'USA' },
  { name: 'PEARL HARBOR PACIFIC', lat: 21.3, lon: -157.9, faction: 'USA' },
  { name: 'SEVEROMORSK NORTHERN FLEET', lat: 69.0, lon: 33.4, faction: 'RUS' },
  { name: 'VLADIVOSTOK PACIFIC FLEET', lat: 43.1, lon: 131.9, faction: 'RUS' },
  { name: 'QINGDAO NORTH SEA FLEET', lat: 36.0, lon: 120.3, faction: 'CHN' },
  { name: 'SANYA YULIN SSBN BASE', lat: 18.2, lon: 109.5, faction: 'CHN' },
  { name: 'HMNB CLYDE FASLANE', lat: 56.0, lon: -4.8, faction: 'GBR' },
  { name: 'CFB HALIFAX ATLANTIC', lat: 44.6, lon: -63.5, faction: 'CAN' },
  { name: 'SINGAPORE STRAIT CHOKEPOINT', lat: 1.2, lon: 103.8, faction: 'CIVILIAN' },
  { name: 'SUEZ CANAL CHOKEPOINT', lat: 30.5, lon: 32.3, faction: 'CIVILIAN' },
  { name: 'STRAIT OF GIBRALTAR', lat: 35.9, lon: -5.6, faction: 'CIVILIAN' },
  { name: 'PANAMA CANAL', lat: 8.9, lon: -79.5, faction: 'CIVILIAN' }
];

/**
 * Creates an ultra-crisp Cyberpunk Retro Vector Earth canvas texture.
 * Ensures the globe is vividly luminous and readable from any camera angle.
 */
function createCyberpunkEarthTexture(style: WorldVisualConfig['style']): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  const isAmber = style === 'RETRO_AMBER_CRT';

  // 1. Oceanic Deep Digital Grid Base
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  if (isAmber) {
    oceanGrad.addColorStop(0, '#1c1003');
    oceanGrad.addColorStop(0.5, '#2e1905');
    oceanGrad.addColorStop(1, '#150c02');
  } else {
    oceanGrad.addColorStop(0, '#040d1a');
    oceanGrad.addColorStop(0.5, '#06172e');
    oceanGrad.addColorStop(1, '#020914');
  }
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Helper coordinate mapper: Lat [-90, 90] -> Y, Lon [-180, 180] -> X
  const toX = (lon: number) => ((lon + 180) / 360) * canvas.width;
  const toY = (lat: number) => ((90 - lat) / 180) * canvas.height;

  // 2. Tactical Lat/Lon Graticule Lines
  ctx.strokeStyle = isAmber ? 'rgba(245, 158, 11, 0.22)' : 'rgba(56, 189, 248, 0.22)';
  ctx.lineWidth = 1;
  for (let lat = -80; lat <= 80; lat += 20) {
    const y = toY(lat);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  for (let lon = -180; lon <= 180; lon += 30) {
    const x = toX(lon);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Highlight Equator & Prime Meridian
  ctx.strokeStyle = isAmber ? 'rgba(251, 191, 36, 0.65)' : 'rgba(6, 182, 212, 0.65)';
  ctx.lineWidth = 2;
  // Equator
  ctx.beginPath();
  ctx.moveTo(0, toY(0));
  ctx.lineTo(canvas.width, toY(0));
  ctx.stroke();
  // Prime Meridian
  ctx.beginPath();
  ctx.moveTo(toX(0), 0);
  ctx.lineTo(toX(0), canvas.height);
  ctx.stroke();

  // 3. Render Solid Continents with Glowing Cyber Edges
  CONTINENTAL_VECTOR_DATA.forEach((poly) => {
    if (poly.length < 3) return;
    ctx.beginPath();
    const startX = toX(poly[0][1]);
    const startY = toY(poly[0][0]);
    ctx.moveTo(startX, startY);
    for (let i = 1; i < poly.length; i++) {
      ctx.lineTo(toX(poly[i][1]), toY(poly[i][0]));
    }
    ctx.closePath();

    // Continental fill (digital landmass)
    ctx.fillStyle = isAmber ? 'rgba(120, 53, 15, 0.35)' : 'rgba(8, 47, 73, 0.55)';
    ctx.fill();

    // Luminous coastline border
    ctx.strokeStyle = isAmber ? '#fbbf24' : '#00ffcc';
    ctx.lineWidth = 3;
    ctx.shadowColor = isAmber ? '#f59e0b' : '#00ffcc';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0; // reset
  });

  // 4. Strategic Naval Bases & Chokepoint Markers
  STRATEGIC_BASES.forEach((base) => {
    const x = toX(base.lon);
    const y = toY(base.lat);

    // Glowing outer radar circle
    ctx.strokeStyle = isAmber ? '#f59e0b' : '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.stroke();

    // Center point
    ctx.fillStyle = isAmber ? '#fbbf24' : '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Base name label
    ctx.fillStyle = isAmber ? 'rgba(251, 191, 36, 0.85)' : 'rgba(56, 189, 248, 0.85)';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(base.name, x + 8, y + 4);
  });

  // 5. Retro CRT Scanline Overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  for (let y = 0; y < canvas.height; y += 4) {
    ctx.fillRect(0, y, canvas.width, 1.5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function buildCyberpunkVectorEarth(config: WorldVisualConfig): THREE.Group {
  const earthGroup = new THREE.Group();
  earthGroup.name = 'cyberpunk-vector-earth';
  const R = config.sphereRadius;

  // 1. High-Contrast Procedural Cyberpunk Globe
  const texture = createCyberpunkEarthTexture(config.style);
  const sphereGeo = new THREE.SphereGeometry(R, 64, 64);
  const sphereMat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.7,
    metalness: 0.2,
    emissive: new THREE.Color(config.style === 'RETRO_AMBER_CRT' ? 0x2e1905 : 0x031526),
    emissiveIntensity: 0.4
  });
  const earthSphere = new THREE.Mesh(sphereGeo, sphereMat);
  earthSphere.userData = { objectId: 'earth-globe-core' };
  earthGroup.add(earthSphere);

  // 2. Geodesic Floating Tactical Wireframe Grid
  const gridGeo = new THREE.IcosahedronGeometry(R * 1.002, 3);
  const wireMat = new THREE.MeshBasicMaterial({
    color: config.style === 'RETRO_AMBER_CRT' ? 0xf59e0b : 0x06b6d4,
    wireframe: true,
    transparent: true,
    opacity: 0.18
  });
  const wireMesh = new THREE.Mesh(gridGeo, wireMat);
  earthGroup.add(wireMesh);

  // 3. 3D Glowing Continental Vector Outlines (Elevated Floating Outlines)
  const coastGroup = new THREE.Group();
  coastGroup.name = 'vector-coastlines-3d';
  const coastColor = config.style === 'RETRO_AMBER_CRT' ? 0xfbbf24 : 0x00ffcc;

  CONTINENTAL_VECTOR_DATA.forEach((poly) => {
    const pts: THREE.Vector3[] = [];
    poly.forEach(([lat, lon]) => {
      pts.push(latLonAltToCartesian(lat, lon, 0.4, R * 1.003));
    });
    const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const lineMat = new THREE.LineBasicMaterial({
      color: coastColor,
      transparent: true,
      opacity: 0.95
    });
    coastGroup.add(new THREE.Line(lineGeo, lineMat));
  });
  earthGroup.add(coastGroup);

  // 4. Commercial Maritime Shipping Lanes (Glowing Cyan Corridors)
  if (config.showShippingLanes) {
    const lanesGroup = new THREE.Group();
    lanesGroup.name = 'shipping-lanes';
    MARITIME_CORRIDORS.forEach((corridor) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < corridor.length - 1; i++) {
        const [lat1, lon1] = corridor[i];
        const [lat2, lon2] = corridor[i + 1];
        // Subdivide for great-circle curve
        for (let step = 0; step <= 8; step++) {
          const t = step / 8;
          const lat = lat1 + (lat2 - lat1) * t;
          const lon = lon1 + (lon2 - lon1) * t;
          pts.push(latLonAltToCartesian(lat, lon, 0.8, R * 1.004));
        }
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineDashedMaterial({
        color: 0x38bdf8,
        dashSize: 3,
        gapSize: 2,
        transparent: true,
        opacity: 0.75
      });
      const line = new THREE.Line(lineGeo, lineMat);
      line.computeLineDistances();
      lanesGroup.add(line);
    });
    earthGroup.add(lanesGroup);
  }

  // 5. Strategic Defense Bastions & Patrol Lines
  if (config.showSubmarineChokepoints) {
    const defenseGroup = new THREE.Group();
    defenseGroup.name = 'defense-bastions';

    // Barents Sea Russian SSBN Bastion
    const barentsPts: THREE.Vector3[] = [];
    const barentsCoords: [number, number][] = [[70, 30], [75, 35], [78, 50], [74, 58], [69, 45], [70, 30]];
    barentsCoords.forEach(([lat, lon]) => barentsPts.push(latLonAltToCartesian(lat, lon, 1.2, R * 1.005)));
    const barentsGeo = new THREE.BufferGeometry().setFromPoints(barentsPts);
    const barentsMat = new THREE.LineBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.85 });
    defenseGroup.add(new THREE.Line(barentsGeo, barentsMat));

    // GIUK Gap (Greenland-Iceland-UK) SOSUS Line
    const giukPts: THREE.Vector3[] = [];
    const giukCoords: [number, number][] = [[65, -40], [64, -20], [60, -10], [58, -5]];
    giukCoords.forEach(([lat, lon]) => giukPts.push(latLonAltToCartesian(lat, lon, 1.2, R * 1.005)));
    const giukGeo = new THREE.BufferGeometry().setFromPoints(giukPts);
    const giukMat = new THREE.LineDashedMaterial({ color: 0x3b82f6, dashSize: 4, gapSize: 3, transparent: true, opacity: 0.9 });
    const giukLine = new THREE.Line(giukGeo, giukMat);
    giukLine.computeLineDistances();
    defenseGroup.add(giukLine);

    // Taiwan Strait Monitoring Corridor
    const taiwanPts: THREE.Vector3[] = [];
    const taiwanCoords: [number, number][] = [[22, 118], [24, 119], [26, 121], [25, 122], [22, 118]];
    taiwanCoords.forEach(([lat, lon]) => taiwanPts.push(latLonAltToCartesian(lat, lon, 1.2, R * 1.005)));
    const taiwanGeo = new THREE.BufferGeometry().setFromPoints(taiwanPts);
    const taiwanMat = new THREE.LineBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.9 });
    defenseGroup.add(new THREE.Line(taiwanGeo, taiwanMat));

    earthGroup.add(defenseGroup);
  }

  // 6. Atmospheric Luminous Rim Ring
  if (config.showAtmosphereGlow) {
    const atmoGeo = new THREE.SphereGeometry(R * 1.035, 48, 48);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: config.style === 'RETRO_AMBER_CRT' ? 0xf59e0b : 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    earthGroup.add(new THREE.Mesh(atmoGeo, atmoMat));
  }

  return earthGroup;
}
