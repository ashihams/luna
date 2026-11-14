import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { usePlannerStore } from '../state/usePlannerStore';
import { fetchTerrain } from '../data/loader';
import { Eye, Sun, Radio, Maximize2, RotateCcw, Settings2 } from 'lucide-react';

export const SiteScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    sites,
    selectedSiteId,
    manifest,
    helpers,
    currentHorizon,
    plannedDayIndex,
    slipDays,
    scrubStep,
  } = usePlannerStore();

  const selectedSite = sites.find((s) => s.id === selectedSiteId);
  const selectedSiteIdx = sites.findIndex((s) => s.id === selectedSiteId);
  const currentHelper = selectedSiteIdx >= 0 ? helpers[selectedSiteIdx] : null;

  // 3D Visual Sliders
  const [verticalExag, setVerticalExag] = useState<number>(1.0);
  const [celestialExag, setCelestialExag] = useState<number>(2.0);
  const [shadowResolution, setShadowResolution] = useState<number>(4096);
  const [showControls, setShowControls] = useState<boolean>(true);

  // Camera look angles (degrees)
  const [yawDeg, setYawDeg] = useState<number>(180); // Default looking South towards the pole
  const [pitchDeg, setPitchDeg] = useState<number>(5);

  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Ephemeris at scrubbed step
  const numDays = 731;
  const slippedDayIndex = Math.max(0, Math.min(numDays - 1, plannedDayIndex + slipDays));
  const startStep = slippedDayIndex * 48;
  const currentStep = Math.min(startStep + scrubStep, (manifest?.time.n_steps || 35088) - 1);

  const sunData = useMemo(() => {
    if (!currentHelper) return { az: 0, el: 0, visPct: 100 };
    return {
      az: currentHelper.tracks.sun_az[currentStep] || 0,
      el: currentHelper.tracks.sun_el[currentStep] || 0,
      visPct: currentHelper.tracks.sun_vis_pct[currentStep] || 0,
    };
  }, [currentHelper, currentStep]);

  const earthData = useMemo(() => {
    if (!currentHelper) return { az: 0, el: 0, clearance: 0 };
    return {
      az: currentHelper.tracks.earth_az[currentStep] || 0,
      el: currentHelper.tracks.earth_el[currentStep] || 0,
      clearance: currentHelper.tracks.earth_clearance[currentStep] || 0,
    };
  }, [currentHelper, currentStep]);

  // Procedural Earth Texture (No external assets)
  const earthTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Ocean gradient
    const ocean = ctx.createRadialGradient(256, 256, 80, 256, 256, 256);
    ocean.addColorStop(0, '#1d4ed8');
    ocean.addColorStop(0.7, '#1e3a8a');
    ocean.addColorStop(1, '#0f172a');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, 512, 512);

    // Procedural continents
    ctx.fillStyle = '#15803d';
    // Africa / Europe
    ctx.beginPath();
    ctx.ellipse(260, 220, 45, 95, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Asia
    ctx.beginPath();
    ctx.ellipse(340, 190, 80, 60, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // Americas
    ctx.beginPath();
    ctx.ellipse(140, 200, 40, 80, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(170, 320, 35, 70, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Australia
    ctx.beginPath();
    ctx.ellipse(360, 330, 28, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Swirling white clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    for (let i = 0; i < 40; i++) {
      const cx = 100 + (i * 27) % 320;
      const cy = 100 + (i * 43) % 320;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 25 + (i % 20), 8 + (i % 8), (i * 0.4), 0, Math.PI * 2);
      ctx.fill();
    }

    // Atmospheric limb glow (Rayleigh scattering)
    const glow = ctx.createRadialGradient(256, 256, 220, 256, 256, 256);
    glow.addColorStop(0, 'rgba(56, 189, 248, 0)');
    glow.addColorStop(0.85, 'rgba(56, 189, 248, 0.4)');
    glow.addColorStop(1, 'rgba(14, 165, 233, 0.9)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 512, 512);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, []);

  // Three.js Scene Setup & Animation Loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !selectedSite || !manifest) return;

    let destroyed = false;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712); // Deep space black

    const camera = new THREE.PerspectiveCamera(
      70, // Spec: FOV 70
      container.clientWidth / container.clientHeight,
      0.1,
      40000
    );
    // Spec: Camera at (0, obs_height, 0)
    const obsHeight = manifest.constants.OBS_HEIGHT_M || 2.0;
    camera.position.set(0, obsHeight, 0);

    // 1. Procedural Starfield
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 3000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 22000;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 35,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
    });
    const starField = new THREE.Points(starsGeo, starsMat);
    scene.add(starField);

    // 2. Ambient Light (Spec: ~0.02 for earthshine)
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.04);
    scene.add(ambientLight);

    // 3. Directional Sun Light
    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = shadowResolution;
    sunLight.shadow.mapSize.height = shadowResolution;
    sunLight.shadow.camera.near = 100;
    sunLight.shadow.camera.far = 30000;
    sunLight.shadow.camera.left = -12000;
    sunLight.shadow.camera.right = 12000;
    sunLight.shadow.camera.top = 12000;
    sunLight.shadow.camera.bottom = -12000;
    // Spec: tune bias and normalBias for very low grazing Sun
    sunLight.shadow.bias = -0.0001;
    sunLight.shadow.normalBias = 0.5;
    scene.add(sunLight);
    scene.add(sunLight.target);

    // 4. Sun Visual Billboard Sprite
    const sunCanvas = document.createElement('canvas');
    sunCanvas.width = 128;
    sunCanvas.height = 128;
    const sCtx = sunCanvas.getContext('2d')!;
    const sGrad = sCtx.createRadialGradient(64, 64, 10, 64, 64, 64);
    sGrad.addColorStop(0, '#ffffff');
    sGrad.addColorStop(0.2, '#fef08a');
    sGrad.addColorStop(0.6, 'rgba(251, 191, 36, 0.4)');
    sGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 128, 128);
    const sunTex = new THREE.CanvasTexture(sunCanvas);

    const sunSpriteMat = new THREE.SpriteMaterial({
      map: sunTex,
      color: 0xffffff,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    const sunSprite = new THREE.Sprite(sunSpriteMat);
    scene.add(sunSprite);

    // 5. Earth Visual Billboard Sprite
    const earthSpriteMat = new THREE.SpriteMaterial({
      map: earthTexture || undefined,
      color: 0xffffff,
      transparent: true,
    });
    const earthSprite = new THREE.Sprite(earthSpriteMat);
    scene.add(earthSprite);

    // 6. Beyond-Mesh Horizon Ring at 19 km (Spec Section 15)
    let horizonMesh: THREE.Mesh | null = null;
    if (currentHorizon && currentHorizon.variants) {
      const best = currentHorizon.variants['best'] || currentHorizon.variants['dem80'];
      if (best && best.elev_deg) {
        const elev = best.elev_deg;
        const nAz = elev.length;
        const dAz = (2 * Math.PI) / nAz;
        const R = 19000;

        const ringPositions: number[] = [];
        const ringIndices: number[] = [];

        for (let i = 0; i <= nAz; i++) {
          const az = (i % nAz) * dAz;
          const el = (elev[i % nAz] * Math.PI) / 180;

          // x = R * sin(az), z = -R * cos(az)
          const x = R * Math.sin(az);
          const z = -R * Math.cos(az);
          const yTop = obsHeight + R * Math.tan(el) * verticalExag;
          const yBottom = -2500;

          ringPositions.push(x, yBottom, z); // bottom vertex (2*i)
          ringPositions.push(x, yTop, z);    // top vertex (2*i + 1)

          if (i < nAz) {
            const b1 = 2 * i;
            const t1 = 2 * i + 1;
            const b2 = 2 * (i + 1);
            const t2 = 2 * (i + 1) + 1;

            ringIndices.push(b1, t1, b2);
            ringIndices.push(t1, t2, b2);
          }
        }

        const ringGeo = new THREE.BufferGeometry();
        ringGeo.setAttribute('position', new THREE.Float32BufferAttribute(ringPositions, 3));
        ringGeo.setIndex(ringIndices);
        ringGeo.computeVertexNormals();

        const ringMat = new THREE.MeshStandardMaterial({
          color: 0x070b14,
          roughness: 0.98,
          metalness: 0.0,
          side: THREE.DoubleSide,
        });

        horizonMesh = new THREE.Mesh(ringGeo, ringMat);
        scene.add(horizonMesh);
      }
    }

    // 7. Local Terrain Mesh 513 x 513 (Spec Section 15)
    let terrainMesh: THREE.Mesh | null = null;
    fetchTerrain(selectedSite)
      .then((rawUint16) => {
        if (destroyed) return;

        const N = 513;
        const halfSize = manifest.constants.TERRAIN_HALF_M || 10000;
        const step = (2 * halfSize) / (N - 1);
        const rMoon = manifest.constants.R_MOON_M || 1737400;

        const zMin = selectedSite.terrain_z_min;
        const zMax = selectedSite.terrain_z_max;
        const zRange = zMax - zMin;

        const positions = new Float32Array(N * N * 3);
        const indices: number[] = [];

        for (let r = 0; r < N; r++) {
          const north = halfSize - r * step; // Row 0 is North
          for (let c = 0; c < N; c++) {
            const east = -halfSize + c * step; // Col 0 is West

            const idx = r * N + c;
            const rawVal = rawUint16[idx];
            const zRel = zMin + (rawVal / 65535.0) * zRange;

            // Spec: subtract curvature (e^2 + n^2) / (2 * R_MOON_M)
            const curvDrop = (east * east + north * north) / (2 * rMoon);
            const y = (zRel - curvDrop) * verticalExag;

            // Coordinates: X = east, Y = y, Z = -north
            positions[idx * 3] = east;
            positions[idx * 3 + 1] = y;
            positions[idx * 3 + 2] = -north;

            if (r < N - 1 && c < N - 1) {
              const tl = r * N + c;
              const tr = tl + 1;
              const bl = (r + 1) * N + c;
              const br = bl + 1;

              indices.push(tl, bl, tr);
              indices.push(tr, bl, br);
            }
          }
        }

        const terrainGeo = new THREE.BufferGeometry();
        terrainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        terrainGeo.setIndex(indices);
        terrainGeo.computeVertexNormals();

        const terrainMat = new THREE.MeshStandardMaterial({
          color: 0x8a929f,
          roughness: 0.95,
          metalness: 0.05,
          flatShading: false,
        });

        terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
        terrainMesh.receiveShadow = true;
        terrainMesh.castShadow = true;
        scene.add(terrainMesh);
      })
      .catch((err) => console.error('Failed to load terrain mesh:', err));

    // Handle Window Resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Render loop
    let animId: number;
    const render = () => {
      animId = requestAnimationFrame(render);

      // Update camera orientation from yaw and pitch
      const yawRad = (yawDeg * Math.PI) / 180;
      const pitchRad = (pitchDeg * Math.PI) / 180;

      // Looking direction
      const dirX = Math.sin(yawRad) * Math.cos(pitchRad);
      const dirY = Math.sin(pitchRad);
      const dirZ = -Math.cos(yawRad) * Math.cos(pitchRad);

      camera.lookAt(dirX, obsHeight + dirY, dirZ);

      // Update Sun position & lighting
      const sunAzRad = (sunData.az * Math.PI) / 180;
      const sunElRad = (sunData.el * Math.PI) / 180;

      // Spec direction: (cos(el)*sin(az), sin(el), -cos(el)*cos(az))
      const sunDir = new THREE.Vector3(
        Math.cos(sunElRad) * Math.sin(sunAzRad),
        Math.sin(sunElRad),
        -Math.cos(sunElRad) * Math.cos(sunAzRad)
      ).normalize();

      const sunDistance = 18000;
      sunSprite.position.copy(sunDir).multiplyScalar(sunDistance);

      // Sun angular diameter ~ 0.52 deg (radius ~ 0.26 deg)
      const baseSunDiameter = 2 * sunDistance * Math.tan((0.26 * Math.PI) / 180);
      const sunScale = baseSunDiameter * celestialExag;
      sunSprite.scale.set(sunScale, sunScale, 1);

      // Light direction & intensity
      const lightDist = 15000;
      sunLight.position.copy(sunDir).multiplyScalar(lightDist);
      sunLight.target.position.set(0, 0, 0);

      const isSunAbove = sunData.el > -0.5 && sunData.visPct > 0;
      sunLight.intensity = isSunAbove ? (sunData.visPct / 100.0) * 2.8 : 0;
      sunSprite.visible = sunData.el > -2.0;

      // Update Earth position & sprite
      const earthAzRad = (earthData.az * Math.PI) / 180;
      const earthElRad = (earthData.el * Math.PI) / 180;

      const earthDir = new THREE.Vector3(
        Math.cos(earthElRad) * Math.sin(earthAzRad),
        Math.sin(earthElRad),
        -Math.cos(earthElRad) * Math.cos(earthAzRad)
      ).normalize();

      const earthDistance = 18000;
      earthSprite.position.copy(earthDir).multiplyScalar(earthDistance);

      // Earth angular diameter ~ 1.9 deg (radius ~ 0.95 deg)
      const baseEarthDiameter = 2 * earthDistance * Math.tan((0.95 * Math.PI) / 180);
      const earthScale = baseEarthDiameter * celestialExag;
      earthSprite.scale.set(earthScale, earthScale, 1);
      earthSprite.visible = earthData.el > -4.0;

      renderer.render(scene, camera);
    };
    render();

    return () => {
      destroyed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      starsGeo.dispose();
      starsMat.dispose();
      sunTex.dispose();
      sunSpriteMat.dispose();
      earthSpriteMat.dispose();
      if (horizonMesh) {
        horizonMesh.geometry.dispose();
        (horizonMesh.material as THREE.Material).dispose();
      }
      if (terrainMesh) {
        terrainMesh.geometry.dispose();
        (terrainMesh.material as THREE.Material).dispose();
      }
    };
  }, [
    selectedSite,
    manifest,
    currentHorizon,
    verticalExag,
    celestialExag,
    shadowResolution,
    yawDeg,
    pitchDeg,
    sunData,
    earthData,
    earthTexture,
  ]);

  // Pointer drag to look around (First-person camera controls)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    // Update yaw and pitch
    setYawDeg((prev) => (prev + dx * 0.25 + 360) % 360);
    setPitchDeg((prev) => Math.max(-25, Math.min(75, prev - dy * 0.25)));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  // Quick look shortcuts
  const lookAtSun = () => {
    setYawDeg(sunData.az);
    setPitchDeg(Math.max(-10, Math.min(60, sunData.el)));
  };

  const lookAtEarth = () => {
    setYawDeg(earthData.az);
    setPitchDeg(Math.max(-10, Math.min(60, earthData.el)));
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="w-full h-full relative cursor-grab active:cursor-grabbing select-none overflow-hidden"
    >
      {/* 3D Scene Compass & Orientation HUD */}
      <div className="absolute top-3 right-3 z-10 flex items-center space-x-2">
        <div className="bg-slate-950/85 backdrop-blur border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-300 shadow-lg flex items-center space-x-2">
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            Look Az: <strong className="text-cyan-300">{yawDeg.toFixed(0)}°</strong> | El:{' '}
            <strong className="text-cyan-300">{pitchDeg.toFixed(0)}°</strong>
          </span>
        </div>

        <button
          onClick={() => setShowControls(!showControls)}
          className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white transition shadow-lg"
          title="Toggle 3D View Settings"
        >
          <Settings2 className="w-4 h-4 text-cyan-400" />
        </button>
      </div>

      {/* Quick Camera Navigation Buttons */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-wrap gap-2">
        <button
          onClick={lookAtSun}
          className="px-2.5 py-1 bg-slate-950/80 backdrop-blur hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded text-xs font-medium text-amber-300 flex items-center space-x-1.5 shadow transition"
        >
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>Track Sun</span>
        </button>

        <button
          onClick={lookAtEarth}
          className="px-2.5 py-1 bg-slate-950/80 backdrop-blur hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded text-xs font-medium text-blue-300 flex items-center space-x-1.5 shadow transition"
        >
          <Radio className="w-3.5 h-3.5 text-blue-400" />
          <span>Track Earth</span>
        </button>

        <button
          onClick={() => {
            setYawDeg(180);
            setPitchDeg(5);
          }}
          className="px-2.5 py-1 bg-slate-950/80 backdrop-blur hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded text-xs font-medium text-slate-300 flex items-center space-x-1.5 shadow transition"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Look South (Pole)</span>
        </button>
      </div>

      {/* 3D Settings Overlay Panel */}
      {showControls && (
        <div className="absolute top-14 right-3 z-10 w-64 bg-slate-950/90 backdrop-blur border border-slate-800 rounded-lg p-3 text-xs shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">
              3D Terrain & Render Controls
            </span>
          </div>

          {/* Vertical Exaggeration Slider */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">Vertical Relief Exaggeration</span>
              <span className="font-mono text-cyan-400 font-bold">{verticalExag.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.2"
              value={verticalExag}
              onChange={(e) => setVerticalExag(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 h-1 bg-slate-800 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
              <span>1.0x (True scale)</span>
              <span>2.0x</span>
              <span>3.0x</span>
            </div>
          </div>

          {/* Celestial Disc Scale Exaggeration Slider */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">Celestial Size Scale</span>
              <span className="font-mono text-amber-400 font-bold">{celestialExag.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="8.0"
              step="0.5"
              value={celestialExag}
              onChange={(e) => setCelestialExag(parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1 bg-slate-800 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
              <span>1x (True angular size)</span>
              <span>4x</span>
              <span>8x</span>
            </div>
          </div>

          {/* Shadow Quality Toggle */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-2">
            <span className="text-slate-400 text-[11px]">Shadow Map Resolution</span>
            <button
              onClick={() => setShadowResolution(shadowResolution === 4096 ? 2048 : 4096)}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-cyan-400"
            >
              {shadowResolution}²
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
