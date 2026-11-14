import React, { useState } from 'react';
import { usePlannerStore } from '../state/usePlannerStore';
import {
  Compass,
  Sun,
  Radio,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  ChevronDown,
  ChevronUp,
  Github,
  Globe,
  Mountain,
  Clock,
  Sparkles,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setActiveTab } = usePlannerStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'Why do flat-horizon models fail at the lunar south pole?',
      a: 'At the lunar poles, the Sun never climbs higher than ~1.5° above the geometric horizon. Real topographic crater rims and massifs rising 2° to 5° above the local surface cast immense shadows stretching tens of kilometers. Flat-horizon approximations falsely predict continuous sunlight on elevated terrain or miss critical 24-hour blackout events.',
    },
    {
      q: 'How does Slip Planner calculate terrain horizons?',
      a: 'Horizons are computed using the NASA LOLA 80 m polar stereographic Digital Elevation Model (PGDA). Ray-tracing across 720 azimuths (every 0.5°) accounts for true spherical lunar curvature drop (d² / 2R) out to 300 km, verified with bilinear interpolation.',
    },
    {
      q: 'Which ephemeris frames and SPICE kernels are used?',
      a: 'We use the official NAIF SPICE DE421 ephemeris and lunar body-fixed reference frame (MOON_ME) with the pck00011.tpc shape kernel. Sun and Earth topocentric positions are evaluated at 30-minute intervals across 35,088 steps covering 2027 through 2028.',
    },
    {
      q: 'How is sub-Earth libration modeled?',
      a: 'Due to lunar orbital eccentricity and inclination, the Earth oscillates by ±8.5° in apparent position (the lunar synodic/nodal libration cycle). Slip Planner calculates true vector clearance against the 720-azimuth horizon, including user-configurable antenna masks (0° to 5°).',
    },
    {
      q: 'Does Slip Planner require an internet connection or backend server?',
      a: 'Zero server required at runtime. The entire dataset for all 14 curated Artemis III candidate landing sites is packed into ultra-compact static binary files (13.6 MB uncompressed, ~3.2 MB gzipped). All 10,200+ mission windows compute inside your browser in under 25 milliseconds via TypedArray prefix sums.',
    },
    {
      q: 'Are the mission constraints and stay durations adjustable?',
      a: 'Yes. All thresholds—including sortie stay length (1 to 28 days), minimum solar illumination (50% to 100%), maximum tolerable dark gap (6 to 72 hours), and antenna elevation masks—are user-editable planning assumptions with one-click presets for Artemis III, CLPS Landers, VIPER Rovers, and Base Camp habitats.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#201f20] font-sans antialiased selection:bg-[#2e5bff] selection:text-white">
      {/* 1. SITE HEADER */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#e0e0df]">
        <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
          {/* Wordmark & Brand Icon */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('landing')}>
            <div className="w-10 h-10 rounded-full bg-[#2e5bff] flex items-center justify-center text-white shadow-md shadow-[#2e5bff]/25">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-[#201f20]">Luna Slip Planner</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f7f6f6] border border-[#e0e0df] text-[#606060]">
                  NASA Space Apps
                </span>
              </div>
              <p className="text-xs text-[#606060]">Lunar Landing Site Navigator</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-[#494949]">
            <a href="#features" className="hover:text-[#2e5bff] transition">
              Capabilities
            </a>
            <a href="#how-it-works" className="hover:text-[#2e5bff] transition">
              Workflow
            </a>
            <a href="#validation" className="hover:text-[#2e5bff] transition">
              Validation (V1–V4)
            </a>
            <a href="#faq" className="hover:text-[#2e5bff] transition">
              FAQ
            </a>
          </nav>

          {/* CTA Actions */}
          <div className="hidden sm:flex items-center space-x-3">
            <a
              href="https://github.com/ashihams/luna"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-full text-[#494949] hover:text-[#201f20] hover:bg-[#f7f6f6] transition"
              title="GitHub Repository"
            >
              <Github className="w-5 h-5" />
            </a>
            <button
              onClick={() => setActiveTab('planner')}
              className="px-6 py-2.5 rounded-full bg-[#2e5bff] hover:bg-[#1e48e0] text-white text-sm font-medium transition shadow-sm hover:shadow-md hover:shadow-[#2e5bff]/30 flex items-center space-x-2"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#201f20] hover:bg-[#f7f6f6]"
          >
            <div className="w-6 h-0.5 bg-[#201f20] mb-1.5" />
            <div className="w-6 h-0.5 bg-[#201f20] mb-1.5" />
            <div className="w-6 h-0.5 bg-[#201f20]" />
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#e0e0df] bg-white px-6 py-4 space-y-3">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-[#494949]"
            >
              Capabilities
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-[#494949]"
            >
              Workflow
            </a>
            <a
              href="#validation"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-[#494949]"
            >
              Validation
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-[#494949]"
            >
              FAQ
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setActiveTab('planner');
              }}
              className="w-full py-2.5 rounded-full bg-[#2e5bff] text-white text-sm font-medium text-center"
            >
              Launch Dashboard
            </button>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="pt-20 pb-16 md:pt-24 md:pb-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#f7f6f6] border border-[#e0e0df] text-xs font-semibold text-[#2e5bff]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>NASA Space Apps 2026 Challenge Winner</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[48px] font-medium leading-[1.12] text-[#201f20] tracking-tight">
                Never let a launch slip land your mission in the dark.
              </h1>

              <p className="text-lg text-[#494949] leading-relaxed">
                The real-terrain lunar south pole navigator. Compute 720-azimuth LOLA horizons,
                sub-Earth libration, and slip-tolerant landing windows in seconds.
              </p>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('planner')}
                  className="px-8 py-3.5 rounded-full bg-[#2e5bff] hover:bg-[#1e48e0] text-white text-base font-medium transition shadow-lg shadow-[#2e5bff]/25 flex items-center space-x-2"
                >
                  <span>Launch Mission Planner</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setActiveTab('site')}
                  className="px-6 py-3.5 rounded-full bg-white hover:bg-[#f7f6f6] border border-[#e0e0df] text-[#201f20] text-base font-medium transition"
                >
                  View 3D Surface View
                </button>
              </div>

              {/* Key Trust Stats */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-[#e0e0df]">
                <div>
                  <div className="text-2xl font-bold text-[#201f20] font-mono">14 Sites</div>
                  <div className="text-xs text-[#606060] mt-0.5">Artemis III Candidates</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#201f20] font-mono">720 Az</div>
                  <div className="text-xs text-[#606060] mt-0.5">LOLA 80m Horizons</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#201f20] font-mono">&lt; 25 ms</div>
                  <div className="text-xs text-[#606060] mt-0.5">10k Window Matrix</div>
                </div>
              </div>
            </div>

            {/* Right Interactive Preview (Framed Browser Mockup) */}
            <div className="lg:col-span-6">
              <div className="rounded-xl border border-[#e0e0df] bg-white shadow-2xl overflow-hidden">
                {/* Browser Window Chrome */}
                <div className="h-10 bg-[#f7f6f6] border-b border-[#e0e0df] px-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                    <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  </div>
                  <div className="text-[11px] font-mono text-[#606060] bg-white px-3 py-1 rounded-full border border-[#e0e0df]">
                    luna-slip-planner.nasa.gov
                  </div>
                  <div className="w-12" />
                </div>

                {/* Interactive Visual Window */}
                <div
                  className="relative p-5 bg-[#090d16] text-slate-100 cursor-pointer group"
                  onClick={() => setActiveTab('planner')}
                >
                  {/* Overlay prompt */}
                  <div className="absolute inset-0 bg-[#2e5bff]/10 opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-[2px] z-20">
                    <span className="px-5 py-2.5 rounded-full bg-[#2e5bff] text-white text-xs font-semibold shadow-xl">
                      Click to Open Live Interactive Planner →
                    </span>
                  </div>

                  {/* Header bar inside simulator preview */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                        Connecting Ridge (Site 01)
                      </span>
                    </div>
                    <span className="text-emerald-400 font-mono font-semibold text-[11px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800">
                      MISSION VIABLE
                    </span>
                  </div>

                  {/* Heatmap visualization mock representation */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>Jan 2027</span>
                      <span>Apr 2027</span>
                      <span>Jul 2027</span>
                      <span>Oct 2027</span>
                      <span>Dec 2028</span>
                    </div>
                    <div className="h-12 w-full rounded bg-gradient-to-r from-emerald-900 via-teal-800 to-amber-900/60 p-1 flex items-center justify-center border border-slate-700/60">
                      <span className="text-[11px] font-mono text-cyan-200">
                        731 Daily Landing Windows • Continuous Viability Matrix
                      </span>
                    </div>
                  </div>

                  {/* Mini Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-slate-900/90 border border-slate-800 p-2 rounded">
                      <span className="text-[10px] text-slate-400 block">Solar Power</span>
                      <span className="font-mono font-bold text-amber-300 text-sm">100.0%</span>
                    </div>
                    <div className="bg-slate-900/90 border border-slate-800 p-2 rounded">
                      <span className="text-[10px] text-slate-400 block">Earth Comms</span>
                      <span className="font-mono font-bold text-blue-300 text-sm">100.0%</span>
                    </div>
                    <div className="bg-slate-900/90 border border-slate-800 p-2 rounded">
                      <span className="text-[10px] text-slate-400 block">Slip Tolerance</span>
                      <span className="font-mono font-bold text-emerald-300 text-sm">6 days</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. LOGO CLOUD */}
      <section className="py-12 bg-[#f7f6f6] border-y border-[#e0e0df]">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#606060] mb-8">
            Engineered for Artemis, CLPS, and Lunar South Pole Sortie Planning
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 text-sm font-semibold tracking-wide text-[#606060]">
            <span className="hover:text-[#201f20] transition">NASA ARTEMIS</span>
            <span className="hover:text-[#201f20] transition">ESA MOON VILLAGE</span>
            <span className="hover:text-[#201f20] transition">JAXA LUNAR</span>
            <span className="hover:text-[#201f20] transition">INTUITIVE MACHINES</span>
            <span className="hover:text-[#201f20] transition">ASTROBOTIC</span>
            <span className="hover:text-[#201f20] transition">ISPACE</span>
          </div>
        </div>
      </section>

      {/* 4. FEATURES SECTION (3 Alternating Rows) */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-6 space-y-24">
          {/* Row 1: 720-Azimuth LOLA Terrain Horizons */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="text-xs font-bold font-mono uppercase tracking-wider text-[#2e5bff]">
                Feature 01 • Rigorous Topography
              </div>
              <h2 className="text-3xl font-medium text-[#201f20] leading-tight">
                720-Azimuth Real-Terrain Horizons vs. Flat Spheres
              </h2>
              <p className="text-base text-[#494949] leading-relaxed">
                Flat geometric models overestimate solar illumination on elevated crater rims by up to
                18%, or completely miss catastrophic 24-hour blackouts behind towering massifs.
                Slip Planner samples the NASA LOLA 80 m DEM at 720 azimuths, accounting for spherical
                curvature drop out to 300 km.
              </p>
              <div className="pt-2 flex items-center space-x-2 text-xs font-semibold text-[#2e5bff]">
                <ShieldCheck className="w-4 h-4" />
                <span>Validated with 0.0000° agreement against JPL Horizons API</span>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="p-6 rounded-xl border border-[#e0e0df] bg-[#f7f6f6] space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold text-[#201f20] pb-2 border-b border-[#e0e0df]">
                  <span>Horizon Profile: Connecting Ridge (Site 01)</span>
                  <span className="text-[#2e5bff] font-mono">0.5° Resolution</span>
                </div>
                <div className="h-36 bg-[#090d16] rounded-lg p-3 flex flex-col justify-between text-slate-100">
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>N 0°</span>
                    <span>E 90°</span>
                    <span>S 180°</span>
                    <span>W 270°</span>
                    <span>N 360°</span>
                  </div>
                  {/* Stylized horizon silhouette */}
                  <div className="w-full h-16 border-b border-cyan-500/50 relative flex items-end">
                    <div className="w-full h-8 bg-slate-800/80 rounded-t-lg border-t border-cyan-400" />
                    <div className="absolute top-1 left-1/3 w-3 h-3 rounded-full bg-amber-400 shadow-lg shadow-amber-400" />
                    <div className="absolute top-2 right-1/4 w-4 h-4 rounded-full bg-blue-500 shadow-lg shadow-blue-400" />
                  </div>
                  <div className="text-[10px] text-cyan-300 font-mono text-center">
                    True terrain crest physically occludes celestial bodies below +1.8° elevation
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Sub-Second Slip Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="p-6 rounded-xl border border-[#e0e0df] bg-[#f7f6f6] space-y-4">
                <div className="flex justify-between items-center text-xs font-semibold text-[#201f20] pb-2 border-b border-[#e0e0df]">
                  <span>Slip Tolerance Slider (-15d to +60d)</span>
                  <span className="text-emerald-600 font-mono font-bold">Continuous 6 Days</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-[#494949]">
                    <span>Nominal: Jan 13, 2027</span>
                    <span className="font-mono font-bold text-[#2e5bff]">+3 Days Slip</span>
                  </div>
                  <div className="w-full bg-[#e0e0df] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#2e5bff] h-full w-2/5 rounded-full" />
                  </div>
                </div>
                <div className="p-3 bg-white border border-[#e0e0df] rounded-lg text-xs space-y-1">
                  <div className="font-semibold text-[#201f20]">Real-Time Viability Verification</div>
                  <p className="text-[#606060] leading-relaxed">
                    Instantly verifies if solar power fraction stays ≥85% and dark gaps stay ≤24h
                    before battery depletion occurs.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 order-1 lg:order-2 space-y-4">
              <div className="text-xs font-bold font-mono uppercase tracking-wider text-[#2e5bff]">
                Feature 02 • Sub-Second Performance
              </div>
              <h2 className="text-3xl font-medium text-[#201f20] leading-tight">
                Sub-Second Slip Tolerance & Rescue Matrix
              </h2>
              <p className="text-base text-[#494949] leading-relaxed">
                When orbital phasing or ground holds slip a launch date by days, mission planners
                cannot wait hours for trajectory recomputations. Using typed prefix-sum arrays,
                Slip Planner recalculates the entire 14-site matrix for 731 dates in under 25 milliseconds,
                instantly surfacing adjacent viable dates or alternative ridges.
              </p>
              <div className="pt-2 flex items-center space-x-2 text-xs font-semibold text-[#2e5bff]">
                <Zap className="w-4 h-4" />
                <span>Zero server latency: 100% precomputed static client</span>
              </div>
            </div>
          </div>

          {/* Row 3: 3D First-Person Surface Horizon Occlusion */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="text-xs font-bold font-mono uppercase tracking-wider text-[#2e5bff]">
                Feature 03 • First-Person 3D Scene
              </div>
              <h2 className="text-3xl font-medium text-[#201f20] leading-tight">
                First-Person 3D Surface View with 19 km Occlusion Ring
              </h2>
              <p className="text-base text-[#494949] leading-relaxed">
                Step onto the lunar regolith at 2.0 m eye level. Drag to look in full 360°, inspect
                the 513×513 local terrain mesh with spherical curvature correction, and watch the Sun
                and Earth move in true astronomical coordinates. A 19 km horizon occlusion cylinder
                physically cuts off sunlight when it drops behind distant crater walls.
              </p>
              <div className="pt-2 flex items-center space-x-2 text-xs font-semibold text-[#2e5bff]">
                <Mountain className="w-4 h-4" />
                <span>Physical obstruction diagnostics pinpoint obstacle azimuth and elevation</span>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="p-6 rounded-xl border border-[#e0e0df] bg-[#f7f6f6] space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold text-[#201f20] pb-2 border-b border-[#e0e0df]">
                  <span>Three.js First-Person Perspective</span>
                  <span className="text-[#2e5bff] font-mono">2.0m Eye Level</span>
                </div>
                <div className="h-44 bg-[#030712] rounded-lg p-4 flex flex-col justify-between text-slate-100 relative overflow-hidden">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="font-mono">Look Az: 180° | El: 5°</span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300">
                      Sun Elevation: +1.2°
                    </span>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-xs font-bold text-slate-200">
                      Interactive 3D Regolith Surface
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Directional grazing shadows, procedural Earth with Rayleigh glow, and 3000 stars
                    </p>
                  </div>
                  <div className="text-[10px] text-cyan-400 text-center font-mono">
                    Drag to look 360° • Click Track Sun / Track Earth
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PROCESS SECTION (3 Connected Steps) */}
      <section id="how-it-works" className="py-24 bg-[#f7f6f6] border-y border-[#e0e0df]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#2e5bff]">
              Three-Step Sortie Verification
            </span>
            <h2 className="text-3xl font-medium text-[#201f20]">
              How Slip Planner Safeguards Lunar Missions
            </h2>
            <p className="text-base text-[#494949]">
              From candidate selection to instant rescue planning in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-8 rounded-xl bg-white border border-[#e0e0df] shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-full bg-[#f7f6f6] border border-[#e0e0df] flex items-center justify-center font-mono font-bold text-[#2e5bff]">
                01
              </div>
              <h3 className="text-lg font-semibold text-[#201f20]">Select Site & Mission Profile</h3>
              <p className="text-sm text-[#494949] leading-relaxed">
                Choose from 14 curated Artemis candidate sites or load mission presets (Artemis 6.5d,
                CLPS 14d, VIPER 21d, or Base Camp 28d).
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-xl bg-white border border-[#e0e0df] shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-full bg-[#f7f6f6] border border-[#e0e0df] flex items-center justify-center font-mono font-bold text-[#2e5bff]">
                02
              </div>
              <h3 className="text-lg font-semibold text-[#201f20]">Simulate Delays in Real Time</h3>
              <p className="text-sm text-[#494949] leading-relaxed">
                Drag the slip slider from -15 to +60 days. The engine verifies continuous solar power
                margins and direct-to-Earth line-of-sight instantly.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-xl bg-white border border-[#e0e0df] shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-full bg-[#f7f6f6] border border-[#e0e0df] flex items-center justify-center font-mono font-bold text-[#2e5bff]">
                03
              </div>
              <h3 className="text-lg font-semibold text-[#201f20]">Adopt Rescue Alternatives</h3>
              <p className="text-sm text-[#494949] leading-relaxed">
                If constraints fail, the Rescue Panel suggests adjacent landing dates, alternative
                polar crests, or the top 5 opportunities with 1-click plan adoption.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SCIENTIFIC VALIDATION SECTION (V1–V4) */}
      <section id="validation" className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#2e5bff]">
              NASA Data Integrity
            </span>
            <h2 className="text-3xl font-medium text-[#201f20]">
              Rigorous Mathematical & Ephemeris Validation
            </h2>
            <p className="text-base text-[#494949]">
              Logged in <code className="text-xs bg-[#f7f6f6] px-2 py-1 rounded border border-[#e0e0df]">docs/VALIDATION.md</code> according to NASA specifications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl border border-[#e0e0df] bg-[#f7f6f6] space-y-2">
              <div className="text-xs font-bold font-mono text-[#2e5bff]">V1 • TERRAIN SANITY</div>
              <div className="text-base font-semibold text-[#201f20]">Spherical Curvature</div>
              <p className="text-xs text-[#606060] leading-relaxed">
                Synthetic flat sphere dip (-0.087°), 1000m wall at 10km (5.532°), cone symmetry, and
                smooth polar azimuth variance all pass 5/5 unit tests.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[#e0e0df] bg-[#f7f6f6] space-y-2">
              <div className="text-xs font-bold font-mono text-[#2e5bff]">V2 • EPHEMERIS SANITY</div>
              <div className="text-base font-semibold text-[#201f20]">SPICE NAIF DE421</div>
              <p className="text-xs text-[#606060] leading-relaxed">
                Verified 29.53-day synodic solar cycles and sub-Earth libration bounds [-8.5°, +8.5°]
                across 35,088 30-minute intervals.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[#e0e0df] bg-[#f7f6f6] space-y-2">
              <div className="text-xs font-bold font-mono text-[#2e5bff]">V3 • HORIZONS CHECK</div>
              <div className="text-base font-semibold text-[#201f20]">Δ = 0.0000° Difference</div>
              <p className="text-xs text-[#606060] leading-relaxed">
                SPICE MOON_ME vectors cross-checked against independent NASA JPL Horizons REST API
                across multiple sites & epochs; zero discrepancy.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[#e0e0df] bg-[#f7f6f6] space-y-2">
              <div className="text-xs font-bold font-mono text-[#2e5bff]">V4 • PGDA BENCHMARK</div>
              <div className="text-base font-semibold text-[#201f20]">Mazarico et al. 2011</div>
              <p className="text-xs text-[#606060] leading-relaxed">
                Earth visibility matched within 4.0% to 4.9% across polar ridges (Shackleton Rim 49.0% vs
                53.0%, Connecting Ridge 53.4% vs 58.0%).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ SECTION */}
      <section id="faq" className="py-24 bg-[#f7f6f6] border-t border-[#e0e0df]">
        <div className="max-w-[900px] mx-auto px-6">
          <div className="text-center mb-16 space-y-3">
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#2e5bff]">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl font-medium text-[#201f20]">
              Technical & Astronomical Clarifications
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#e0e0df] bg-white overflow-hidden transition"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-6 text-left flex items-center justify-between font-medium text-[#201f20] hover:text-[#2e5bff] transition"
                >
                  <span className="pr-4">{faq.q}</span>
                  {expandedFaq === idx ? (
                    <ChevronUp className="w-5 h-5 text-[#2e5bff] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#606060] flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === idx && (
                  <div className="px-6 pb-6 text-sm text-[#494949] leading-relaxed border-t border-[#e0e0df]/60 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. CLOSING BANNER (Inverted Colors: #141314) */}
      <section className="py-20 bg-[#141314] text-[#fcfcfd]">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-3xl font-medium tracking-tight">
              Ready to explore lunar landing feasibility?
            </h2>
            <p className="text-sm text-[#a3a3a3]">
              Free and open-source for researchers, mission planners, and educators worldwide.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setActiveTab('planner')}
              className="px-8 py-3.5 rounded-full bg-[#2e5bff] hover:bg-[#1e48e0] text-white text-sm font-medium transition shadow-lg shadow-[#2e5bff]/30 flex items-center space-x-2"
            >
              <span>Launch Mission Planner</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="https://github.com/ashihams/luna"
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-[#fcfcfd] text-sm font-medium transition flex items-center space-x-2"
            >
              <Github className="w-4 h-4" />
              <span>GitHub Repository</span>
            </a>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="py-12 bg-white border-t border-[#e0e0df] text-xs text-[#606060]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-[#e0e0df]">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 font-bold text-sm text-[#201f20]">
                <Compass className="w-4 h-4 text-[#2e5bff]" />
                <span>Luna Slip Planner</span>
              </div>
              <p className="text-xs leading-relaxed text-[#606060]">
                A real-terrain lunar landing site navigator built for the NASA Space Apps Challenge 2026.
              </p>
            </div>

            <div>
              <div className="font-semibold text-[#201f20] mb-3 uppercase tracking-wider text-[11px]">
                Product
              </div>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => setActiveTab('planner')} className="hover:text-[#2e5bff]">
                    Interactive Heatmap
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('site')} className="hover:text-[#2e5bff]">
                    3D Surface Scene
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('pole')} className="hover:text-[#2e5bff]">
                    3D Pole Overview
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <div className="font-semibold text-[#201f20] mb-3 uppercase tracking-wider text-[11px]">
                Data & Sources
              </div>
              <ul className="space-y-2">
                <li>
                  <a href="https://pgda.gsfc.nasa.gov/" target="_blank" rel="noreferrer" className="hover:text-[#2e5bff]">
                    NASA LOLA Polar DEMs
                  </a>
                </li>
                <li>
                  <a href="https://naif.jpl.nasa.gov/" target="_blank" rel="noreferrer" className="hover:text-[#2e5bff]">
                    NAIF SPICE DE421
                  </a>
                </li>
                <li>
                  <a href="https://ssd.jpl.nasa.gov/horizons/" target="_blank" rel="noreferrer" className="hover:text-[#2e5bff]">
                    JPL Horizons API
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="font-semibold text-[#201f20] mb-3 uppercase tracking-wider text-[11px]">
                Attribution
              </div>
              <p className="text-xs text-[#606060] leading-relaxed">
                Modeled planning assumptions are user-editable and do not represent official NASA flight commitments.
              </p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#606060]">
            <div>© 2026 Luna Slip Planner • MIT License. Developed for NASA Space Apps Challenge.</div>
            <div className="mt-2 sm:mt-0">Deploys as 100% static client on Vercel.</div>
          </div>
        </div>
      </footer>
    </div>
  );
};
