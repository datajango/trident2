import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export const ApolloThreeSim: React.FC<{
  missionPhase: 'AWAITING_AOS' | 'CARRIER_LOCK' | 'SIVB_BURN' | 'TLI_COMPLETE';
}> = ({ missionPhase }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // SCENE SETUP
    const w = mountRef.current.clientWidth;
    const h = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(10, 5, -15);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // EARTH SPHERE
    const earthGeometry = new THREE.SphereGeometry(15, 32, 32);
    const earthMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1e3a8a, 
      roughness: 0.8,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.set(0, -18, 0);
    scene.add(earth);

    // S-IVB ROCKET STAGE (Cylinder)
    const sivbGeom = new THREE.CylinderGeometry(0.8, 0.8, 4, 16);
    const sivbMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2 });
    const sivb = new THREE.Mesh(sivbGeom, sivbMat);
    sivb.rotation.z = Math.PI / 2; // horizontal
    group.add(sivb);

    // ENGINE NOZZLE
    const nozzleGeom = new THREE.ConeGeometry(0.6, 1.2, 16);
    const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
    const nozzle = new THREE.Mesh(nozzleGeom, nozzleMat);
    nozzle.position.x = -2.6;
    nozzle.rotation.z = -Math.PI / 2;
    group.add(nozzle);

    // FLAME MESH (J-2 Engine)
    const flameGeom = new THREE.ConeGeometry(0.8, 6, 16);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
    const flame = new THREE.Mesh(flameGeom, flameMat);
    flame.position.x = -6.2;
    flame.rotation.z = -Math.PI / 2;
    flame.visible = false;
    group.add(flame);

    // APOLLO CSM (Cone/Cylinder)
    const csmGeom = new THREE.ConeGeometry(0.8, 2, 16);
    const csmMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, roughness: 0.1, metalness: 0.8 });
    const csm = new THREE.Mesh(csmGeom, csmMat);
    csm.position.x = 3.0;
    csm.rotation.z = -Math.PI / 2;
    group.add(csm);

    // LIGHTING
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.5);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // STARS
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
    const starsVertices = [];
    for (let i = 0; i < 400; i++) {
      const x = THREE.MathUtils.randFloatSpread(100);
      const y = THREE.MathUtils.randFloatSpread(100);
      const z = THREE.MathUtils.randFloatSpread(100);
      starsVertices.push(x, y, z);
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);

    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += 0.016;

      earth.rotation.y += 0.001;
      starField.rotation.y += 0.0005;

      // Orbit motion around earth
      if (missionPhase === 'SIVB_BURN') {
        group.position.x = Math.cos(time * 0.2) * 5 - 2;
        group.position.y = Math.sin(time * 0.2) * 2;
        group.rotation.x = Math.sin(time * 0.5) * 0.1;
      } else if (missionPhase === 'TLI_COMPLETE') {
        group.position.x += 0.08;
        group.position.y += 0.04;
        group.rotation.x = Math.sin(time * 0.5) * 0.1;
      } else {
        // Idle orbit
        group.position.y = Math.sin(time * 0.5) * 0.5;
        group.position.x = -2;
      }

      // Flame visibility and flicker
      if (missionPhase === 'SIVB_BURN') {
        flame.visible = true;
        const pulse = 0.9 + Math.random() * 0.2;
        flame.scale.set(pulse, pulse * 1.5, pulse);
      } else {
        flame.visible = false;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const nw = mountRef.current.clientWidth;
      const nh = mountRef.current.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      // Clean up geometries/materials
      earthGeometry.dispose();
      earthMaterial.dispose();
      sivbGeom.dispose();
      sivbMat.dispose();
      nozzleGeom.dispose();
      nozzleMat.dispose();
      flameGeom.dispose();
      flameMat.dispose();
      csmGeom.dispose();
      csmMat.dispose();
      starsGeometry.dispose();
      starsMaterial.dispose();
    };
  }, [missionPhase]);

  return <div ref={mountRef} className="w-full h-full rounded overflow-hidden" />;
};
