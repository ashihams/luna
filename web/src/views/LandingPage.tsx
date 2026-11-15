import React, { useState } from 'react';
import { usePlannerStore } from '../state/usePlannerStore';
import {
  ArrowRight,
  Sparkles,
  Mountain,
  Radio,
  Sun,
  ShieldCheck,
  Zap,
  Globe,
  Layers,
  ExternalLink,
  Code2,
  Copy,
  Check,
  Compass,
  Terminal,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setActiveTab } = usePlannerStore();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    const codeSnippet = `import { SiteMetricsHelper } from './workers/metrics';
import { fetchTracks, fetchHorizon } from './data/loader';

// Compute 6.5-day Artemis sortie viability under LOLA 720-azimuth occlusion
const helper = new SiteMetricsHelper('connecting-ridge', tracks, horizon);
const metrics = helper.evaluateWindow(plannedDayIndex + slipDays, {
  stay_days: 6.5,
  min_sun_fraction: 0.85,
  max_dark_gap_hours: 24.0,
  min_earth_fraction: 0.80,
  antenna_mask_deg: 0.0,
});

console.log(\`Viable: \${metrics.viable} | Slip Tolerance: \${metrics.slipToleranceDays}d\`);`;

    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tickerItems = [
    { label: 'CANDIDATE SITES', value: '13 ARTEMIS SITES' },
    { label: 'AZIMUTHAL RESOLUTION', value: '720 AZIMUTHS (0.5°)' },
    { label: 'COMPUTATION SPEED', value: 'COMPACT VISIBILITY TABLES' },
    { label: 'EPHEMERIS RANGE', value: '35,088 SPICE INTERVALS' },
    { label: 'JPL HORIZONS CHECK', value: 'SPICE vs HORIZONS API' },
    { label: 'SUB-EARTH LIBRATION', value: 'SITE-DEPENDENT ELEVATION' },
    { label: 'PHYSICAL HORIZON', value: '19 KM OCCLUSION CYLINDER' },
    { label: 'DATA RUNTIME', value: 'PRECOMPUTED SCIENTIFIC DATA' },
  ];

  const featureCards = [
    {
      icon: Mountain,
      title: '720-Azimuth LOLA Horizons',
      desc: 'Flat-horizon approximations can miss terrain-driven shadows. Slip Planner traces LOLA 80 m polar stereographic DEMs across 300 km, subtracting spherical curvature at 0.5° intervals.',
      tag: '0.5° TOPOGRAPHIC RAY TRACE',
      accent: 'text-violet-400',
      action: () => setActiveTab('site'),
    },
    {
      icon: Zap,
      title: 'Interactive Slip Matrix',
      desc: 'Evaluate over 9,503 landing windows (13 candidate sites × 731 dates in 2027–2028) using typed visibility tables and prefix sums. Immediately alerts on fragile launch windows with less than 3 days of slip tolerance.',
      tag: 'PRECOMPUTED VISIBILITY DATA',
      accent: 'text-cyan-400',
      action: () => setActiveTab('planner'),
    },
    {
      icon: Globe,
      title: 'SPICE DE421 Ephemeris Engine',
      desc: 'Topocentric solar and Earth positions precomputed at 30-minute intervals across 35,088 timesteps using official NAIF SPICE DE421 kernels and pck00011.tpc in the MOON_ME reference frame.',
      tag: 'JPL HORIZONS CROSS-CHECKED',
      accent: 'text-emerald-400',
      action: () => setActiveTab('planner'),
    },
    {
      icon: Compass,
      title: '3D First-Person Surface Scene',
      desc: 'Stand 2.0 meters above the lunar regolith. A local 513×513 DEM mesh paired with a procedural 19 km horizon occlusion cylinder casts true grazing shadows and models terrain signal cutoff.',
      tag: 'THREE.JS FIRST-PERSON EYE LEVEL',
      accent: 'text-violet-400',
      action: () => setActiveTab('site'),
    },
    {
      icon: Radio,
      title: 'Sub-Earth Libration Tracking',
      desc: 'Models the Moon’s complex 14-day libration cycle where Earth wobbles by ±8.5° in elevation. Evaluates customizable antenna elevation masks from 0° to 5° to prevent terrain multipath loss.',
      tag: '±8.5° LIBRATION MODEL',
      accent: 'text-cyan-400',
      action: () => setActiveTab('planner'),
    },
    {
      icon: ShieldCheck,
      title: 'Rescue & Pairwise Comparison',
      desc: 'When launch delays push a site past its viable battery or thermal threshold, instant rescue algorithms suggest alternate dates, alternative sites, or high-illumination polar peaks.',
      tag: 'DUAL SCENARIO COMPARATOR',
      accent: 'text-emerald-400',
      action: () => setActiveTab('planner'),
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#030303] text-white font-sans antialiased overflow-x-hidden selection:bg-[#8B5CF6] selection:text-white">
      {/* 1. FIXED FLOATING NAVIGATION PILL */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-[672px] rounded-full bg-[#0a0a0a]/70 backdrop-blur-xl border border-white/10 px-5 py-2.5 flex items-center justify-between shadow-2xl shadow-black/80">
        {/* Left: Logo (4px gradient circle + Instrument Serif text) */}
        <div
          onClick={() => setActiveTab('landing')}
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-[#8B5CF6] via-purple-400 to-[#06B6D4] shadow-[0_0_12px_#8B5CF6]" />
          <span className="font-serif text-xl font-normal tracking-tight text-white group-hover:text-purple-300 transition duration-300 ease-snappy">
            Luna Slip
          </span>
        </div>

        {/* Center: Links (12px uppercase Inter, neutral-400) */}
        <div className="hidden sm:flex items-center space-x-6 text-[12px] font-sans uppercase tracking-wider text-neutral-400">
          <a
            href="#features"
            className="hover:text-white transition duration-300 ease-snappy"
          >
            Features
          </a>
          <a
            href="#code"
            className="hover:text-white transition duration-300 ease-snappy"
          >
            Engine
          </a>
          <a
            href="https://github.com/ashihams/luna"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition duration-300 ease-snappy flex items-center space-x-1"
          >
            <span>GitHub</span>
            <span className="text-[10px]">↗</span>
          </a>
        </div>

        {/* Right: CTA (White background, black text, rounded-full) */}
        <button
          onClick={() => setActiveTab('planner')}
          className="px-4 py-1.5 rounded-full bg-white text-black font-sans text-xs font-semibold hover:bg-neutral-200 transition duration-300 ease-snappy shadow-sm"
        >
          Launch Console
        </button>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative min-h-screen w-full flex flex-col justify-center items-center pt-32 pb-20 px-6 overflow-hidden">
        {/* Background Gradients: Radial Violet Glow + Left Cyan Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60rem] h-[32rem] bg-[#8B5CF6]/30 filter blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/3 -left-32 w-[36rem] h-[36rem] bg-[#06B6D4]/10 filter blur-[130px] rounded-full pointer-events-none -z-10" />

        {/* Floating Ambient Orbs */}
        <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full bg-[#8B5CF6]/15 filter blur-[90px] animate-float-orb-1 pointer-events-none -z-10" />
        <div className="absolute bottom-1/4 left-1/5 w-80 h-80 rounded-full bg-[#06B6D4]/15 filter blur-[90px] animate-float-orb-2 pointer-events-none -z-10" />

        {/* Hero Content */}
        <div className="max-w-5xl mx-auto text-center flex flex-col items-center space-y-8 z-10">
          {/* Status Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981] animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-neutral-300">
              NASA SPACE APPS 2026 // LUNAR SITE NAVIGATOR
            </span>
          </div>

          {/* Massive Editorial Heading with Text Shimmer */}
          <h1 className="font-serif text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-[-0.03em] leading-[0.92] text-white max-w-5xl">
            My landing slipped <em className="italic font-normal">N</em> days. Is the site <span className="text-shimmer">viable?</span>
          </h1>

          {/* Subtext */}
          <p className="max-w-2xl mx-auto font-sans text-base sm:text-lg text-neutral-400 font-light leading-relaxed">
            Standard flat geometric spheres overestimate lunar south pole illumination by up to 18%.
            Evaluate true 720-azimuth LOLA topography and NAIF SPICE orbits across 9,503 landing windows with precomputed visibility data.
          </p>

          {/* Interactive Action Row: Shiny Border Button & Secondary Link */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            {/* Special Component: Shiny Border Button */}
            <div
              onClick={() => setActiveTab('planner')}
              className="relative p-[1.5px] rounded-full overflow-hidden group cursor-pointer shadow-[0_0_30px_-10px_#8B5CF6] transition-transform duration-300 ease-snappy hover:scale-[1.02]"
            >
              <div className="absolute -inset-[100%] shiny-border-conic animate-spin-conic" />
              <div className="relative z-10 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-[#0a0a0a] text-white font-sans text-sm font-semibold flex items-center space-x-3 group-hover:bg-[#121212] transition duration-300 ease-snappy">
                <span>Enter Mission Planner</span>
                <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition duration-300 ease-snappy" />
              </div>
            </div>

            {/* Secondary GitHub Code Link */}
            <a
              href="https://github.com/ashihams/luna"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 text-neutral-200 font-sans text-sm font-medium transition duration-300 ease-snappy flex items-center space-x-2"
            >
              <Code2 className="w-4 h-4 text-neutral-400" />
              <span>GitHub Repository ↗</span>
            </a>
          </div>

          {/* Quick Metrics Badges */}
          <div className="pt-6 flex flex-wrap justify-center items-center gap-3 text-neutral-400 font-mono text-[11px] tracking-widest uppercase">
            <span className="px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/5">
              13 Candidate Sites
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/5">
              720 Azimuths (0.5°)
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/5">
              Instant Slip Updates
            </span>
          </div>
        </div>
      </section>

      {/* 3. METRICS TICKER */}
      <section id="metrics" className="w-full h-16 bg-black/40 border-y border-white/5 flex items-center overflow-hidden relative">
        <div className="flex space-x-12 animate-ticker whitespace-nowrap">
          {[...tickerItems, ...tickerItems].map((item, idx) => (
            <div key={idx} className="flex items-center space-x-3 font-mono">
              <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                {item.label}:
              </span>
              <span className="text-sm text-neutral-200 font-medium">
                {item.value}
              </span>
              <span className="text-white/10 text-xs ml-4">•</span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FEATURE GRID */}
      <section id="features" className="py-28 px-6 sm:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#8B5CF6] block">
            [ARCHITECTURAL CORE]
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal text-white tracking-[-0.02em]">
            Deterministic <span className="italic font-normal">Lunar Physics</span>
          </h2>
          <p className="font-sans text-neutral-400 text-sm sm:text-base font-light leading-relaxed">
            Engineered for space architects and trajectory designers. Every simulation executes with zero server roundtrips using precomputed SPICE DE421 kernels and LOLA 80 m topography.
          </p>
        </div>

        {/* 3-Column Grid of Interactive Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureCards.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                onClick={feat.action}
                className="group relative rounded-3xl border border-white/5 bg-white/[0.02] p-8 sm:p-10 transition-all duration-500 ease-snappy hover:-translate-y-3 hover:border-violet-500/40 hover:bg-white/[0.04] hover:shadow-[0_0_30px_-10px_rgba(139,92,246,0.4)] cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Top Icon Box */}
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-violet-400 group-hover:scale-110 group-hover:rotate-3 transition duration-300 ease-snappy">
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Title */}
                  <h3 className="font-serif text-2xl text-white font-normal mt-6 mb-3 tracking-tight group-hover:text-purple-200 transition duration-300 ease-snappy">
                    {feat.title}
                  </h3>

                  {/* Description */}
                  <p className="font-sans text-sm text-neutral-400 leading-relaxed font-light">
                    {feat.desc}
                  </p>
                </div>

                {/* Bottom Tag */}
                <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between font-mono text-[10px] tracking-[0.2em] uppercase">
                  <span className={feat.accent}>{feat.tag}</span>
                  <span className="text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition duration-300 ease-snappy">
                    ↗
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. CODE INTEGRATION BLOCK */}
      <section id="code" className="py-24 px-6 sm:px-12 max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#06B6D4] block">
            [DEVELOPER INTERFACE]
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl font-normal text-white tracking-tight">
            Sub-Millisecond <span className="italic font-normal">SDK</span> Execution
          </h2>
          <p className="font-sans text-neutral-400 text-sm font-light">
            Zero external API latency. The slip engine runs entirely in-memory using typed arrays and precomputed LOLA horizon masks.
          </p>
        </div>

        {/* Dark IDE Window */}
        <div className="bg-[#080808]/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          {/* Window Header */}
          <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500/40" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/40" />
              <div className="w-3 h-3 rounded-full bg-green-500/40" />
            </div>

            <div className="font-mono text-xs text-neutral-400 tracking-wider flex items-center space-x-2">
              <Terminal className="w-3.5 h-3.5 text-neutral-500" />
              <span>luna_slip_evaluator.ts</span>
            </div>

            <button
              onClick={handleCopyCode}
              className="text-neutral-400 hover:text-white transition duration-200 flex items-center space-x-1.5 text-xs font-mono"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Code Window Body */}
          <div className="p-6 sm:p-8 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto text-neutral-300">
            <div className="space-y-1">
              <div>
                <span className="text-[#8B5CF6]">import</span> {'{'} <span className="text-[#06B6D4]">SiteMetricsHelper</span> {'}'} <span className="text-[#8B5CF6]">from</span> <span className="text-[#10B981]">'./workers/metrics'</span>;
              </div>
              <div>
                <span className="text-[#8B5CF6]">import</span> {'{'} <span className="text-[#06B6D4]">fetchTracks</span>, <span className="text-[#06B6D4]">fetchHorizon</span> {'}'} <span className="text-[#8B5CF6]">from</span> <span className="text-[#10B981]">'./data/loader'</span>;
              </div>
              <div className="pt-3 text-neutral-500">
                // Initialize topocentric SPICE ephemeris and LOLA 720-azimuth horizons
              </div>
              <div>
                <span className="text-[#8B5CF6]">const</span> helper = <span className="text-[#8B5CF6]">new</span> <span className="text-[#06B6D4]">SiteMetricsHelper</span>(<span className="text-[#10B981]">'connecting-ridge'</span>, tracks, horizon);
              </div>
              <div className="pt-2 text-neutral-500">
                // Evaluate 6.5-day Artemis sortie window under 24h battery constraint
              </div>
              <div>
                <span className="text-[#8B5CF6]">const</span> metrics = helper.<span className="text-[#06B6D4]">evaluateWindow</span>(plannedDayIndex + slipDays, {'{'}
              </div>
              <div className="pl-6">
                stay_days: <span className="text-[#10B981]">6.5</span>,
              </div>
              <div className="pl-6">
                min_sun_fraction: <span className="text-[#10B981]">0.85</span>,
              </div>
              <div className="pl-6">
                max_dark_gap_hours: <span className="text-[#10B981]">24.0</span>,
              </div>
              <div className="pl-6">
                min_earth_fraction: <span className="text-[#10B981]">0.80</span>,
              </div>
              <div className="pl-6">
                antenna_mask_deg: <span className="text-[#10B981]">0.0</span>,
              </div>
              <div>{'}'});</div>
              <div className="pt-3 text-neutral-500">
                // Instant slip tolerance verification in precomputed visibility data
              </div>
              <div>
                console.<span className="text-[#06B6D4]">log</span>(<span className="text-[#10B981]">'Viable: true | Slip: +6d'</span>);
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="bg-[#050505] border-t border-white/5 pt-20 pb-12 px-6 sm:px-12 mt-20">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Column 1: Branding & Philosophy */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center space-x-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-[#8B5CF6] to-[#06B6D4] shadow-[0_0_12px_#8B5CF6]" />
                <span className="font-serif text-2xl font-normal text-white">
                  Luna Slip
                </span>
              </div>
              <p className="font-sans text-xs text-neutral-400 font-light leading-relaxed">
                Precision lunar landing site feasibility and slip planning for the Artemis era.
                Engineered for the NASA Space Apps Challenge 2026.
              </p>
            </div>

            {/* Column 2: Architecture */}
            <div className="space-y-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">
                Core Systems
              </div>
              <ul className="space-y-2 font-sans text-xs text-neutral-400 font-light">
                <li>
                  <button onClick={() => setActiveTab('planner')} className="hover:text-white transition">
                    Slip Tolerance Matrix
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('site')} className="hover:text-white transition">
                    Three.js 3D Regolith
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('pole')} className="hover:text-white transition">
                    300 km Polar Overview
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('planner')} className="hover:text-white transition">
                    Dual Scenario Compare
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Science */}
            <div className="space-y-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">
                Science & Validation
              </div>
              <ul className="space-y-2 font-sans text-xs text-neutral-400 font-light">
                <li>NASA NAIF SPICE DE421</li>
                <li>LOLA 80 m Polar Stereographic</li>
                <li>JPL Horizons ephemeris cross-checks</li>
                <li>PGDA published-map validation: pending</li>
              </ul>
            </div>

            {/* Column 4: Open Source */}
            <div className="space-y-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">
                Repository
              </div>
              <p className="font-sans text-xs text-neutral-400 font-light leading-relaxed">
                Full source code, horizon precomputation scripts, and validation test suite are open source.
              </p>
              <div className="pt-1">
                <a
                  href="https://github.com/ashihams/luna"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs font-mono text-[#8B5CF6] hover:text-purple-300 transition"
                >
                  <span>github.com/ashihams/luna</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Operational Status Indicator */}
          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center text-xs text-neutral-500 font-sans">
            <div>
              © 2026 Luna Slip Planner • Built for NASA Space Apps Challenge
            </div>

            <div className="flex items-center space-x-2 mt-4 sm:mt-0 font-mono text-[11px] tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981] animate-pulse" />
              <span className="text-neutral-300">All Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
