import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { lunarPolarXY } from '../data/science';
import { usePlannerStore } from '../state/usePlannerStore';
import { fetchPoleOverview, PoleOverviewData } from '../data/loader';
import { Globe, RotateCcw, ZoomIn, ZoomOut, CheckCircle2, AlertTriangle } from 'lucide-react';

export const PoleOverview: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    sites,
    selectedSiteId,
    setSelectedSiteId,
    setActiveTab,
    heatmapMatrix,
    plannedDayIndex,
    slipDays,
  } = usePlannerStore();

  const [hoveredSiteId, setHoveredSiteId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const numDays = 731;
  const slippedDayIndex = Math.max(0, Math.min(numDays - 1, plannedDayIndex + slipDays));

  // Determine viability for each site on the current date
  const siteViabilityMap = useMemo(() => {
    const map = new Map<string, { viable: boolean; score: number }>();
    if (!heatmapMatrix) return map;

    sites.forEach((site, idx) => {
      const cell = heatmapMatrix[idx]?.[slippedDayIndex];
      map.set(site.id, {
        viable: cell ? cell.viable : false,
        score: cell ? cell.score : 0,
      });
    });
    return map;
  }, [sites, heatmapMatrix, slippedDayIndex]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let destroyed = false;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030303);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      1000,
      800000
    );
    // Initial camera looking down at the south pole from ~260 km altitude
    camera.position.set(0, 240000, 180000);
    camera.lookAt(0, 0, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    sunLight.position.set(100000, 60000, -100000);
    scene.add(sunLight);

    // Raycaster for interactive markers
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const markerMeshes: THREE.Mesh[] = [];

    // Orbit controls state
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let spherical = { radius: 280000, phi: Math.PI / 4, theta: Math.PI / 4 };

    // Load Pole Overview DEM Mesh
    fetchPoleOverview()
      .then((data: PoleOverviewData) => {
        if (destroyed) return;

        const N = data.dim; // 512
        const halfW = data.half_width_m; // 150000
        const step = (2 * halfW) / (N - 1);
        const zMin = data.z_min;
        const zRange = data.z_max - data.z_min;
        const rMoon = 1737400;

        const positions = new Float32Array(N * N * 3);
        const indices: number[] = [];

        for (let r = 0; r < N; r++) {
          const yCoord = halfW - r * step; // Polar stereo Y
          for (let c = 0; c < N; c++) {
            const xCoord = -halfW + c * step; // Polar stereo X
            const idx = r * N + c;
            const rawVal = data.terrain[idx];
            const elev = zMin + (rawVal / 65535.0) * zRange;

            // Curvature drop
            const distSq = xCoord * xCoord + yCoord * yCoord;
            const curvDrop = distSq / (2 * rMoon);
            const height = elev - curvDrop;

            // X = East, Y = Up, Z = -North in Three.js
            positions[idx * 3] = xCoord;
            positions[idx * 3 + 1] = height * 1.5; // slight relief exaggeration for pole view
            positions[idx * 3 + 2] = -yCoord;

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

        const poleGeo = new THREE.BufferGeometry();
        poleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        poleGeo.setIndex(indices);
        poleGeo.computeVertexNormals();

        const poleMat = new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          roughness: 0.9,
          metalness: 0.05,
          flatShading: false,
        });

        const poleMesh = new THREE.Mesh(poleGeo, poleMat);
        scene.add(poleMesh);

        // Place Site Markers
        sites.forEach((site) => {
          // Lunar polar stereographic transformation
          const [x, yStereo] = lunarPolarXY(site.lat_deg, site.lon_deg_east);
          const z = -yStereo;

          const viability = siteViabilityMap.get(site.id);
          const isViable = viability ? viability.viable : false;

          // Pin marker geometry
          const pinGeo = new THREE.SphereGeometry(2500, 16, 16);
          const pinMat = new THREE.MeshStandardMaterial({
            color: isViable ? 0x10b981 : 0xf43f5e,
            emissive: isViable ? 0x059669 : 0xe11d48,
            emissiveIntensity: 0.8,
            roughness: 0.3,
          });

          const pin = new THREE.Mesh(pinGeo, pinMat);
          const curvDrop = (x * x + yStereo * yStereo) / (2 * rMoon);
          pin.position.set(x, (site.ground_height_m - curvDrop) * 1.5 + 4000, z);
          pin.userData = { siteId: site.id, siteName: site.name, isViable };

          scene.add(pin);
          markerMeshes.push(pin);
        });
      })
      .catch((err) => console.error('Failed to load pole overview DEM:', err));

    // Pointer events for orbit controls
    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const dx = e.clientX - prevMousePos.x;
        const dy = e.clientY - prevMousePos.y;
        prevMousePos = { x: e.clientX, y: e.clientY };

        spherical.theta -= dx * 0.006;
        spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, spherical.phi + dy * 0.006));
      } else {
        // Hover Raycast
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(markerMeshes);
        if (intersects.length > 0) {
          const hit = intersects[0].object as THREE.Mesh;
          setHoveredSiteId(hit.userData.siteId);
          setTooltipPos({ x: e.clientX, y: e.clientY });
          container.style.cursor = 'pointer';
        } else {
          setHoveredSiteId(null);
          setTooltipPos(null);
          container.style.cursor = 'grab';
        }
      }
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      spherical.radius = Math.max(80000, Math.min(500000, spherical.radius + e.deltaY * 150));
    };

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(markerMeshes);
      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const siteId = hit.userData.siteId;
        setSelectedSiteId(siteId);
        setActiveTab('site'); // fly directly to site view!
      }
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    container.addEventListener('wheel', onWheel);
    container.addEventListener('click', onClick);

    // Render loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Spherical to Cartesian camera position
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = spherical.radius * Math.cos(spherical.phi);
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(0, 0, 0);

      // Pulse markers
      const time = performance.now() * 0.003;
      markerMeshes.forEach((m) => {
        const scale = 1.0 + Math.sin(time) * 0.15;
        m.scale.set(scale, scale, scale);
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      destroyed = true;
      cancelAnimationFrame(animId);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('click', onClick);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [sites, siteViabilityMap, setSelectedSiteId, setActiveTab]);

  const hoveredSite = sites.find((s) => s.id === hoveredSiteId);
  const hoveredViability = hoveredSiteId ? siteViabilityMap.get(hoveredSiteId) : null;

  return (
    <div ref={containerRef} className="w-full h-full relative cursor-grab select-none overflow-hidden bg-[#030303]">
      {/* Top Overlay HUD */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col space-y-2">
        <div className="bg-[#030303]/85 backdrop-blur border border-white/10 rounded-xl p-3.5 shadow-xl max-w-sm pointer-events-auto">
          <div className="flex items-center space-x-2 text-cyan-400 mb-1">
            <Globe className="w-4 h-4" />
            <h2 className="text-sm font-serif font-bold text-white tracking-wide">
              Lunar South Pole Overview (300×300 km)
            </h2>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Full LOLA 80 m polar stereographic digital elevation model covering 80°S to 90°S.
            Markers indicate the 13 selected lunar study points, color-coded by mission viability on the selected date.
          </p>
          <div className="flex items-center space-x-4 mt-2.5 text-[10px] font-medium border-t border-white/10 pt-2">
            <div className="flex items-center space-x-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" />
              <span>Viable Site</span>
            </div>
            <div className="flex items-center space-x-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500" />
              <span>Failed Constraints</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredSite && tooltipPos && (
        <div
          className="fixed pointer-events-none z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-xl p-3.5 text-xs shadow-2xl transform -translate-x-1/2 -translate-y-full mb-3 w-60"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-1.5">
            <span className="font-bold text-white">{hoveredSite.name}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                hoveredViability?.viable
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                  : 'bg-rose-950 text-rose-400 border border-rose-700'
              }`}
            >
              {hoveredViability?.viable ? 'VIABLE' : 'FAILED'}
            </span>
          </div>
          <div className="text-[10px] font-mono text-cyan-400">
            {hoveredSite.lat_deg.toFixed(3)}°S, {hoveredSite.lon_deg_east.toFixed(3)}°E
          </div>
          <div className="mt-1 pt-1 border-t border-white/10 flex justify-between text-[10px]">
            <span className="text-neutral-400">Score</span>
            <span className="font-mono text-cyan-300 font-bold">
              {hoveredViability ? (hoveredViability.score * 100).toFixed(1) : 0}
            </span>
          </div>
          <div className="mt-1 text-[9px] text-cyan-400 font-medium text-center">
            Click to fly to Lander Site View →
          </div>
        </div>
      )}
    </div>
  );
};
