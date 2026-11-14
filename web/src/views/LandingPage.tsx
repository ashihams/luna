import React, { useState } from 'react';
import { usePlannerStore } from '../state/usePlannerStore';
import {
  ArrowRight,
  Compass,
  ChevronDown,
  Sparkles,
  Mountain,
  Radio,
  Sun,
  ShieldCheck,
  Zap,
  Globe,
  Layers,
  ExternalLink,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setActiveTab } = usePlannerStore();
  const [activeAccordion, setActiveAccordion] = useState<number | null>(0);

  const capabilities = [
    {
      id: '01',
      title: '720-Azimuth LOLA Horizons',
      tag: '[TOPOGRAPHIC RAY TRACING]',
      desc: 'Standard flat geometric spheres overestimate lunar south pole illumination by up to 18%. Slip Planner evaluates real lunar topography from LOLA 80 m polar stereographic DEMs out to 300 km, subtracting spherical curvature (d²/2R) at 0.5° azimuthal steps.',
    },
    {
      id: '02',
      title: 'Sub-Second Slip Matrix',
      tag: '[TYPEDARRAY PREFIX SUMS]',
      desc: 'Evaluate over 10,200 landing windows (14 candidate sites × 731 dates in 2027–2028) in under 25 milliseconds. Instant slip tolerance computation flags fragile landing windows (<3 days) and immediately identifies recovery windows.',
    },
    {
      id: '03',
      title: 'SPICE DE421 Ephemeris Engine',
      tag: '[LUNAR BODY-FIXED MOON_ME]',
      desc: 'Precision topocentric solar and Earth positions computed at 30-minute intervals across 35,088 timesteps using official NAIF SPICE DE421 kernels and pck00011.tpc. Verified to Δ = 0.0000° against the independent NASA JPL Horizons REST API.',
    },
    {
      id: '04',
      title: '3D Surface Scene & 19 km Occlusion Ring',
      tag: '[THREE.JS FIRST-PERSON EYE LEVEL]',
      desc: 'Stand 2.0 meters above the lunar regolith in interactive 3D. A 513×513 local mesh paired with a procedural 19 km horizon occlusion cylinder physically cuts off grazing solar rays and Earth direct LOS when they sink behind distant rim crests.',
    },
    {
      id: '05',
      title: 'Sub-Earth Libration Tracking',
      tag: '[±8.5° NODAL OSCILLATION]',
      desc: 'Models the Moon’s complex 14-day libration cycle where Earth wobbles by ±8.5° in topocentric elevation. Automatically evaluates antenna elevation masks from 0° to 5° to prevent multipath and terrain signal blockage.',
    },
  ];

  const workCards = [
    {
      title: 'Connecting Ridge (Site 01)',
      subtitle: 'Artemis III Candidate Crest',
      tag: 'LAT -89.305° • LON +123.623° • +1304M ELEV',
      bg: 'from-indigo-100/80 to-purple-100/60',
      orb: 'bg-indigo-500/25',
      preview: 'Ridge crest between Shackleton and de Gerlache craters with 71.3% annual illumination.',
      action: () => setActiveTab('planner'),
    },
    {
      title: '720-Azimuth LOLA Horizon Engine',
      subtitle: 'Rigorous Topographic Occlusion',
      tag: '0.5° AZIMUTHAL RESOLUTION • 300KM RAY CAST',
      bg: 'from-purple-100/80 to-blue-100/60',
      orb: 'bg-purple-500/25',
      preview: 'Eliminates flat-horizon errors that conceal 24-hour battery depletion blackout periods.',
      action: () => setActiveTab('site'),
    },
    {
      title: 'Sub-Second Slip Tolerance Matrix',
      subtitle: 'Instant Rescue Alternatives',
      tag: '10,234 WINDOWS • <25MS RECOMPUTATION',
      bg: 'from-blue-100/80 to-indigo-100/60',
      orb: 'bg-blue-500/25',
      preview: 'Calculates continuous viable days and generates ranked alternative dates and sites in real time.',
      action: () => setActiveTab('planner'),
    },
    {
      title: 'First-Person 3D Surface Scene',
      subtitle: 'Three.js Regolith Perspective',
      tag: '2.0M OBSERVER • 19KM OCCLUSION RING',
      bg: 'from-slate-200/80 to-indigo-100/60',
      orb: 'bg-indigo-600/20',
      preview: 'True grazing solar shadows, procedural Rayleigh Earth sprite, and physical obstacle diagnostics.',
      action: () => setActiveTab('site'),
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#fcfbf9] text-[#171717] font-sans antialiased overflow-x-hidden selection:bg-[#4338ca] selection:text-white">
      {/* 1. FIXED TOP NAVIGATION WITH MIX-BLEND-DIFFERENCE */}
      <header className="fixed top-0 left-0 right-0 z-50 h-20 px-8 flex items-center justify-between mix-blend-difference pointer-events-auto">
        {/* Logo in italic serif */}
        <div
          onClick={() => setActiveTab('landing')}
          className="cursor-pointer group flex items-center space-x-2 text-white"
        >
          <span className="font-serif italic font-bold text-2xl tracking-tight hover:opacity-80 transition duration-500 ease-premium">
            Luna Slip Planner
          </span>
          <span className="font-mono text-[10px] tracking-[0.4em] uppercase opacity-75 hidden sm:inline-block">
            // ORG.INTEL
          </span>
        </div>

        {/* Monospace links with width-growing underline on hover */}
        <nav className="hidden md:flex items-center space-x-10 text-white font-mono text-xs uppercase tracking-[0.35em]">
          <a href="#work" className="relative py-1 group">
            <span>Sites</span>
            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-500 ease-premium group-hover:w-full" />
          </a>
          <a href="#capabilities" className="relative py-1 group">
            <span>Capabilities</span>
            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-500 ease-premium group-hover:w-full" />
          </a>
          <a href="#validation" className="relative py-1 group">
            <span>Validation</span>
            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-500 ease-premium group-hover:w-full" />
          </a>
          <a
            href="https://github.com/ashihams/luna"
            target="_blank"
            rel="noopener noreferrer"
            className="relative py-1 group flex items-center space-x-1"
          >
            <span>GitHub ↗</span>
            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-500 ease-premium group-hover:w-full" />
          </a>
        </nav>

        {/* Pill-shaped CTA with pulsing status dot and GitHub Link */}
        <div className="flex items-center space-x-3">
          <a
            href="https://github.com/ashihams/luna"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex px-4 py-2.5 rounded-full border border-white/40 text-white font-mono text-xs uppercase tracking-[0.3em] hover:bg-white hover:text-black transition duration-500 ease-premium"
          >
            GitHub Code ↗
          </a>
          <button
            onClick={() => setActiveTab('planner')}
            className="px-5 py-2.5 rounded-full border border-white/40 text-white font-mono text-xs uppercase tracking-[0.3em] flex items-center space-x-2.5 hover:bg-white hover:text-black transition duration-500 ease-premium"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>System Online</span>
          </button>
        </div>
      </header>

      {/* 2. EXPANSIVE HERO SECTION (MIN 100VH + DRITFING MESH + WAVE CONTAINER) */}
      <section className="relative min-h-screen w-full flex flex-col justify-between items-center pt-32 pb-24 overflow-hidden bg-[#fcfbf9]">
        {/* Drifting Background Mesh Gradient (Indigo/Purple 30s drift) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
          <div className="absolute -top-1/4 -left-1/4 w-[150vw] h-[150vh] animate-mesh-drift blur-3xl">
            <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-indigo-200/50 mix-blend-multiply filter blur-2xl" />
            <div className="absolute top-1/2 right-1/4 w-[32rem] h-[32rem] rounded-full bg-purple-200/40 mix-blend-multiply filter blur-3xl" />
            <div className="absolute bottom-1/3 left-1/3 w-80 h-80 rounded-full bg-blue-100/60 mix-blend-multiply filter blur-2xl" />
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center flex flex-col items-center justify-center flex-1 space-y-6">
          <div className="font-mono text-xs uppercase tracking-[0.45em] text-[#4338ca] font-medium py-1 px-4 rounded-full border border-indigo-200/60 bg-white/60 backdrop-blur-sm">
            NASA Space Apps 2026 // Lunar Landing Site Navigator
          </div>

          {/* Monumental Serif Typography with Italic Emphasis (11vw-14vw) */}
          <h1 className="font-serif text-[11vw] sm:text-[10vw] lg:text-[8.5vw] font-normal leading-[0.88] text-[#171717] tracking-tight max-w-5xl">
            Organic <span className="italic font-normal text-[#4338ca]">Intelligence</span> on the Moon
          </h1>

          <p className="max-w-2xl mx-auto font-sans text-base sm:text-lg text-[#171717]/70 leading-relaxed pt-2">
            My landing slipped <em className="italic font-serif">N</em> days. Is the site still viable?
            Real-terrain 720-azimuth LOLA horizons and SPICE ephemerides evaluate true grazing solar occlusion and Earth line-of-sight in under 25 milliseconds.
          </p>

          {/* Quick Action Badges */}
          <div className="pt-4 flex flex-wrap justify-center items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.3em] px-4 py-1.5 rounded-full bg-white border border-[#e5e5e5] text-[#171717]/80 shadow-sm">
              14 Artemis Sites
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.3em] px-4 py-1.5 rounded-full bg-white border border-[#e5e5e5] text-[#171717]/80 shadow-sm">
              720 Azimuths
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.3em] px-4 py-1.5 rounded-full bg-white border border-[#e5e5e5] text-[#171717]/80 shadow-sm">
              &lt;25ms Matrix
            </span>
            <a
              href="https://github.com/ashihams/luna"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs uppercase tracking-[0.3em] px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-[#4338ca] hover:bg-indigo-100 transition duration-500 font-semibold shadow-sm"
            >
              GitHub: ashihams/luna ↗
            </a>
          </div>
        </div>

        {/* 3. SIGNATURE WAVE CONTAINER TRANSITION */}
        <div className="relative w-full h-[26vh] overflow-hidden flex items-end justify-center">
          <div
            className="absolute bottom-0 w-[140%] h-[240%] bg-[#fcfbf9] border-t border-[#e5e5e5]/80 shadow-2xl transition-transform duration-1000 ease-premium"
            style={{
              borderRadius: '50% 50% 0 0',
              transform: 'translate(0%, 15%)',
            }}
          />

          {/* Primary Action Button and GitHub Code at the crest of the curve */}
          <div className="relative z-20 mb-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setActiveTab('planner')}
              className="group px-9 py-4 rounded-full bg-[#4338ca] hover:bg-[#3730a3] text-white font-mono text-xs uppercase tracking-[0.35em] font-semibold animate-pulse-gentle transition-all duration-500 ease-premium flex items-center space-x-3 shadow-xl shadow-indigo-900/20"
            >
              <span>Initialize Mission Planner</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition duration-500 ease-premium" />
            </button>
            <a
              href="https://github.com/ashihams/luna"
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-4 rounded-full bg-white hover:bg-slate-50 text-[#171717] border border-[#e5e5e5] font-mono text-xs uppercase tracking-[0.3em] font-semibold transition duration-500 ease-premium shadow-md flex items-center space-x-2"
            >
              <span>GitHub Code ↗</span>
            </a>
          </div>
        </div>
      </section>

      {/* 4. WORK / PORTFOLIO GRID (INTELLIGENT CARD HOVER) */}
      <section id="work" className="py-24 px-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#e5e5e5] pb-8 mb-16">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.4em] text-[#4338ca] block mb-2">
              [Selected Portfolio]
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl font-normal text-[#171717]">
              Curated <span className="italic font-normal">Candidate</span> Regions
            </h2>
          </div>
          <p className="font-sans text-sm text-[#171717]/65 max-w-md mt-4 md:mt-0 leading-relaxed">
            Staggered topographic assessment across the lunar south polar zone (80°S to 90°S),
            verified against real LOLA elevation models.
          </p>
        </div>

        {/* 2-Column Staggered Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-start">
          {workCards.map((card, idx) => (
            <div
              key={card.title}
              onClick={card.action}
              className={`group cursor-pointer flex flex-col ${idx % 2 === 1 ? 'md:mt-16' : ''}`}
            >
              {/* Card Container: 4:3 Aspect Ratio + Intelligent Hover Scale & Lift */}
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-[#e5e5e5] bg-white transition-all duration-700 ease-premium group-hover:-translate-y-4 group-hover:shadow-2xl group-hover:shadow-indigo-500/10">
                {/* Inner background with drift scale */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${card.bg} transition-transform duration-700 ease-premium group-hover:scale-110 flex items-center justify-center p-8`}
                >
                  {/* Blurred color orb center */}
                  <div className={`w-40 h-40 rounded-full ${card.orb} filter blur-2xl transform group-hover:scale-125 transition duration-700 ease-premium`} />

                  {/* Surface preview teaser content */}
                  <div className="relative z-10 text-center max-w-xs space-y-2">
                    <span className="font-mono text-[10px] tracking-[0.35em] text-[#4338ca] uppercase font-semibold">
                      Telemetry Node
                    </span>
                    <p className="font-sans text-xs text-[#171717]/75 leading-relaxed">
                      {card.preview}
                    </p>
                  </div>
                </div>

                {/* Action Pill revealing on hover in bottom-right corner */}
                <div className="absolute bottom-5 right-5 z-20 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-premium">
                  <div className="px-5 py-2 rounded-full bg-white text-[#171717] font-mono text-[10px] uppercase tracking-[0.3em] font-bold shadow-lg border border-[#e5e5e5]">
                    Explore View ↗
                  </div>
                </div>
              </div>

              {/* Text Metadata below card separated by drawing 1px hairline */}
              <div className="pt-6 space-y-2">
                <div className="w-full h-[1px] bg-[#e5e5e5] group-hover:bg-[#4338ca] transition-colors duration-500 ease-premium" />
                <div className="flex items-baseline justify-between pt-1">
                  <h3 className="font-serif text-2xl font-normal text-[#171717] group-hover:text-[#4338ca] transition duration-500 ease-premium">
                    {card.title}
                  </h3>
                  <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#171717]/50">
                    {card.subtitle}
                  </span>
                </div>
                <div className="font-mono text-[11px] tracking-[0.25em] uppercase text-[#171717]/60">
                  {card.tag}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. SERVICE ACCORDION (CORE CAPABILITIES) */}
      <section id="capabilities" className="py-24 px-8 max-w-6xl mx-auto border-t border-[#e5e5e5]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Sticky Header */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
            <span className="font-mono text-xs uppercase tracking-[0.4em] text-[#4338ca] block">
              [System Architecture]
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl font-normal text-[#171717] leading-tight">
              Core <span className="italic font-normal">Capabilities</span>
            </h2>
            <p className="font-sans text-sm text-[#171717]/65 leading-relaxed">
              Designed for space architects who require scientific precision, deterministic offline execution, and zero guesswork.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setActiveTab('planner')}
                className="group inline-flex items-center space-x-2 font-mono text-xs uppercase tracking-[0.3em] text-[#4338ca] hover:text-[#312e81] transition duration-500 ease-premium"
              >
                <span>Launch Interactive Matrix</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition duration-500 ease-premium" />
              </button>
            </div>
          </div>

          {/* Right Interactive Vertical Accordion */}
          <div className="lg:col-span-8 divide-y divide-[#e5e5e5]">
            {capabilities.map((cap, idx) => {
              const isOpen = activeAccordion === idx;
              return (
                <div key={cap.id} className="py-8 group">
                  <button
                    onClick={() => setActiveAccordion(isOpen ? null : idx)}
                    className="w-full flex items-baseline justify-between text-left transition duration-500 ease-premium"
                  >
                    <div className="space-y-1">
                      <div className="font-mono text-[10px] tracking-[0.35em] text-[#4338ca] uppercase font-semibold">
                        {cap.id} // {cap.tag}
                      </div>
                      <h3
                        className={`font-serif text-2xl sm:text-3xl font-normal transition duration-500 ease-premium ${
                          isOpen ? 'text-[#171717]' : 'text-[#171717]/50 group-hover:text-[#171717]'
                        }`}
                      >
                        {cap.title}
                      </h3>
                    </div>

                    <span className="font-mono text-xs text-[#171717]/40 group-hover:text-[#4338ca] transition duration-500 ease-premium ml-4">
                      {isOpen ? '[-]' : '[+]'}
                    </span>
                  </button>

                  {/* Fluid Content Reveal */}
                  <div
                    className={`transition-all duration-700 ease-premium overflow-hidden ${
                      isOpen ? 'max-h-60 opacity-100 pt-4' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="font-sans text-sm text-[#171717]/70 leading-relaxed pr-8">
                      {cap.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. SCIENTIFIC BENCHMARK & VALIDATION (V1 - V4) */}
      <section id="validation" className="py-24 px-8 max-w-6xl mx-auto border-t border-[#e5e5e5]">
        <div className="max-w-2xl mb-16 space-y-3">
          <span className="font-mono text-xs uppercase tracking-[0.4em] text-[#4338ca] block">
            [Proof of Correctness]
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl font-normal text-[#171717]">
            Empirical <span className="italic font-normal">Validation</span>
          </h2>
          <p className="font-sans text-sm text-[#171717]/65 leading-relaxed">
            Every ephemeris step and terrain calculation is cross-checked against independent NASA reference data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="p-6 rounded-2xl border border-[#e5e5e5] bg-white space-y-3">
            <span className="font-mono text-[10px] tracking-[0.35em] text-[#4338ca] uppercase block">
              V1 // HORIZON
            </span>
            <div className="font-serif text-xl text-[#171717]">Spherical Dip</div>
            <p className="font-sans text-xs text-[#171717]/65 leading-relaxed">
              Synthetic flat sphere dip (-0.087°), 1000m wall (5.532°), cone symmetry, and pole smoothness pass 5/5 unit tests.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[#e5e5e5] bg-white space-y-3">
            <span className="font-mono text-[10px] tracking-[0.35em] text-[#4338ca] uppercase block">
              V2 // EPHEMERIS
            </span>
            <div className="font-serif text-xl text-[#171717]">SPICE DE421</div>
            <p className="font-sans text-xs text-[#171717]/65 leading-relaxed">
              29.53-day synodic solar cycles and sub-Earth libration bounds [-8.5°, +8.5°] verified over 35,088 intervals.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[#e5e5e5] bg-white space-y-3">
            <span className="font-mono text-[10px] tracking-[0.35em] text-[#4338ca] uppercase block">
              V3 // JPL HORIZONS
            </span>
            <div className="font-serif text-xl text-[#171717]">Δ = 0.0000°</div>
            <p className="font-sans text-xs text-[#171717]/65 leading-relaxed">
              SPICE vectors match NASA JPL Horizons REST API across multiple sites and epochs with 0.0000° delta.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[#e5e5e5] bg-white space-y-3">
            <span className="font-mono text-[10px] tracking-[0.35em] text-[#4338ca] uppercase block">
              V4 // PGDA MAPS
            </span>
            <div className="font-serif text-xl text-[#171717]">Mazarico 2011</div>
            <p className="font-sans text-xs text-[#171717]/65 leading-relaxed">
              Earth visibility matched within 4.0% to 4.9% across polar ridges against published PGDA Product 69 maps.
            </p>
          </div>
        </div>
      </section>

      {/* 7. HIGH-CONTRAST FOOTER WITH LARGE RADIUS CURVE (5REM) */}
      <footer className="relative bg-[#171717] text-white pt-24 pb-12 px-8 rounded-t-[5rem] overflow-hidden mt-20">
        {/* Subtle radial indigo glow from top-center */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-[20rem] bg-indigo-600/20 filter blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 max-w-6xl mx-auto space-y-16">
          {/* Large-Scale Serif Quote */}
          <div className="max-w-3xl border-b border-white/10 pb-12">
            <span className="font-mono text-xs uppercase tracking-[0.4em] text-indigo-400 block mb-4">
              [Mission Philosophy]
            </span>
            <blockquote className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal leading-tight text-white/90">
              “We choose to explore the lunar south pole not because it is flat, but because <span className="italic text-indigo-300">real topography</span> refuses to compromise.”
            </blockquote>
          </div>

          {/* 3-Column Grid for Details, Navigation, and Attribution */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 font-sans text-xs text-white/60">
            <div className="space-y-3">
              <div className="font-mono uppercase tracking-[0.35em] text-white font-semibold">
                Project Identity
              </div>
              <p className="leading-relaxed">
                Luna Slip Planner was engineered for the NASA Space Apps Challenge 2026 under the Lunar Landing Site Navigator challenge.
              </p>
              <div className="pt-2">
                <a
                  href="https://github.com/ashihams/luna"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 text-indigo-400 hover:text-white transition font-mono tracking-widest uppercase"
                >
                  <span>Open Source Repository ↗</span>
                </a>
              </div>
            </div>

            <div className="space-y-3">
              <div className="font-mono uppercase tracking-[0.35em] text-white font-semibold">
                Direct Telemetry
              </div>
              <ul className="space-y-2 font-mono uppercase tracking-[0.25em]">
                <li>
                  <button onClick={() => setActiveTab('planner')} className="hover:text-white transition">
                    &gt; Launch Heatmap Planner
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('site')} className="hover:text-white transition">
                    &gt; First-Person 3D Surface
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('pole')} className="hover:text-white transition">
                    &gt; 3D South Pole Overview
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="font-mono uppercase tracking-[0.35em] text-white font-semibold">
                Scientific Citations
              </div>
              <p className="leading-relaxed">
                Barker et al. 2023 (Planet. Sci. J. 4, 183) & Mazarico et al. 2011 (Icarus 211, 1066). Model parameters are user-editable assumptions.
              </p>
            </div>
          </div>

          {/* Minimalist Monospace Copyright */}
          <div className="pt-12 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono uppercase tracking-[0.4em] text-white/40">
            <div>© 2026 LUNA SLIP PLANNER • ZERO-RUNTIME STATIC ARCHITECTURE</div>
            <div className="mt-2 sm:mt-0">DEPLOYED TO VERCEL</div>
          </div>
        </div>
      </footer>
    </div>
  );
};
