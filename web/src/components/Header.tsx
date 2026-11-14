import React from 'react';
import { usePlannerStore } from '../state/usePlannerStore';
import { Sparkles, Compass, ShieldAlert, Layers, Scale, Home, Globe, Calendar, ExternalLink } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    parameters,
    slipDays,
    applyPreset,
    getSlipAnalysis,
    pinnedScenarios,
    pinCurrentScenario,
    setIsComparisonOpen,
  } = usePlannerStore();

  const slipAnalysis = getSlipAnalysis();
  const isArtemis = parameters.stay_days === 6.5;
  const isCLPS = parameters.stay_days === 14.0;

  return (
    <header className="h-16 border-b border-[#e5e5e5] bg-[#fcfbf9]/95 backdrop-blur-md px-6 flex items-center justify-between z-20 select-none text-[#171717]">
      {/* Brand & Mission */}
      <div className="flex items-center space-x-4">
        <div
          onClick={() => setActiveTab('landing')}
          className="flex items-center space-x-3 cursor-pointer group"
          title="Return to Landing Page"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4338ca] via-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-950/20 group-hover:scale-105 transition-transform duration-500 ease-premium">
            <span className="text-white font-serif font-bold text-sm tracking-tighter">LP</span>
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="font-serif italic font-bold text-base tracking-tight text-[#171717] group-hover:text-[#4338ca] transition duration-500 ease-premium">
                Luna Slip Planner
              </span>
              <span className="text-[9px] font-mono tracking-[0.3em] uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-[#4338ca] border border-indigo-200">
                NASA SPACE APPS
              </span>
            </div>
            <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#171717]/50">
              LUNAR SOUTH POLE • LOLA 720-AZIMUTH
            </p>
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="hidden md:flex items-center bg-white border border-[#e5e5e5] rounded-full p-1 space-x-1 shadow-sm">
        <button
          onClick={() => applyPreset('artemis')}
          className={`px-3.5 py-1.5 text-[11px] font-mono uppercase tracking-[0.25em] rounded-full transition-all duration-500 ease-premium flex items-center space-x-2 ${
            isArtemis
              ? 'bg-[#4338ca] text-white shadow-sm font-semibold'
              : 'text-[#171717]/60 hover:text-[#171717]'
          }`}
          title="Artemis III profile: 6.5-day surface stay"
        >
          <Sparkles className="w-3 h-3" />
          <span>Artemis (6.5d)</span>
        </button>
        <button
          onClick={() => applyPreset('clps')}
          className={`px-3.5 py-1.5 text-[11px] font-mono uppercase tracking-[0.25em] rounded-full transition-all duration-500 ease-premium flex items-center space-x-2 ${
            isCLPS
              ? 'bg-[#4338ca] text-white shadow-sm font-semibold'
              : 'text-[#171717]/60 hover:text-[#171717]'
          }`}
          title="Commercial Lunar Payload Services profile: 14-day surface stay"
        >
          <Compass className="w-3 h-3" />
          <span>CLPS (14d)</span>
        </button>
      </div>

      {/* Slip Status Badge */}
      {slipAnalysis && (
        <div className="hidden lg:flex items-center space-x-3">
          <div
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-mono tracking-[0.25em] uppercase font-semibold flex items-center space-x-2 border transition-all duration-500 ease-premium ${
              slipAnalysis.isViable
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-rose-50 border-rose-300 text-rose-800'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                slipAnalysis.isViable ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'
              }`}
            />
            <span>
              {slipAnalysis.isViable
                ? 'MISSION VIABLE'
                : slipDays === 0
                ? 'BASELINE NON-VIABLE'
                : 'SLIP FAILED'}
            </span>
          </div>

          {slipAnalysis.isFragile && (
            <div className="px-3 py-1.5 rounded-full text-[10px] font-mono tracking-[0.25em] uppercase bg-amber-50 border border-amber-300 text-amber-800 flex items-center space-x-1.5">
              <ShieldAlert className="w-3 h-3 text-amber-600" />
              <span>Fragile (&lt;3d)</span>
            </div>
          )}
        </div>
      )}

      {/* Navigation tabs, GitHub link & Actions */}
      <div className="flex items-center space-x-3">
        <a
          href="https://github.com/ashihams/luna"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden xl:flex px-3 py-1.5 text-[11px] font-mono tracking-[0.2em] uppercase text-[#171717]/70 bg-white hover:text-[#4338ca] border border-[#e5e5e5] rounded-full transition-all duration-500 ease-premium items-center space-x-1.5 shadow-sm"
          title="View GitHub Repository"
        >
          <span>GitHub ↗</span>
        </a>

        <button
          onClick={() => pinCurrentScenario()}
          className="px-3 py-1.5 text-[11px] font-mono tracking-[0.2em] uppercase text-[#171717]/70 bg-white hover:bg-slate-50 border border-[#e5e5e5] rounded-full transition-all duration-500 ease-premium flex items-center space-x-1.5 shadow-sm"
          title="Pin current scenario for comparison"
        >
          <Layers className="w-3.5 h-3.5 text-[#4338ca]" />
          <span>Pin ({pinnedScenarios.length})</span>
        </button>

        <button
          onClick={() => setIsComparisonOpen(true)}
          className="px-3 py-1.5 text-[11px] font-mono tracking-[0.2em] uppercase font-semibold text-[#4338ca] bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-full transition-all duration-500 ease-premium flex items-center space-x-1.5 shadow-sm"
          title="Compare scenarios side-by-side"
        >
          <Scale className="w-3.5 h-3.5 text-[#4338ca]" />
          <span>Compare</span>
        </button>

        <div className="flex items-center bg-white border border-[#e5e5e5] rounded-full p-1 space-x-1 shadow-sm">
          <button
            onClick={() => setActiveTab('landing')}
            className="px-3 py-1.5 text-[11px] font-mono tracking-[0.2em] uppercase rounded-full text-[#171717]/60 hover:text-[#171717] transition duration-500 ease-premium flex items-center space-x-1.5"
            title="Return to Landing Page"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Landing</span>
          </button>
          <button
            onClick={() => setActiveTab('planner')}
            className={`px-3 py-1.5 text-[11px] font-mono tracking-[0.2em] uppercase rounded-full transition-all duration-500 ease-premium flex items-center space-x-1.5 ${
              activeTab === 'planner'
                ? 'bg-[#4338ca] text-white shadow-sm font-semibold'
                : 'text-[#171717]/60 hover:text-[#171717]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Heatmap</span>
          </button>
          <button
            onClick={() => setActiveTab('site')}
            className={`px-3 py-1.5 text-[11px] font-mono tracking-[0.2em] uppercase rounded-full transition-all duration-500 ease-premium flex items-center space-x-1.5 ${
              activeTab === 'site'
                ? 'bg-[#4338ca] text-white shadow-sm font-semibold'
                : 'text-[#171717]/60 hover:text-[#171717]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Site 3D</span>
          </button>
          <button
            onClick={() => setActiveTab('pole')}
            className={`px-3 py-1.5 text-[11px] font-mono tracking-[0.2em] uppercase rounded-full transition-all duration-500 ease-premium flex items-center space-x-1.5 ${
              activeTab === 'pole'
                ? 'bg-[#4338ca] text-white shadow-sm font-semibold'
                : 'text-[#171717]/60 hover:text-[#171717]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Pole 3D</span>
          </button>
        </div>
      </div>
    </header>
  );
};
