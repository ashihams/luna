import React from 'react';
import { usePlannerStore } from '../state/usePlannerStore';
import { Sparkles, Compass, ShieldAlert, Layers, Scale, Home, Globe, Calendar } from 'lucide-react';

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
    <header className="h-16 border-b border-[#262626] bg-[#171717]/95 backdrop-blur-md px-6 flex items-center justify-between z-20 select-none">
      {/* Brand & Mission */}
      <div className="flex items-center space-x-4">
        <div
          onClick={() => setActiveTab('landing')}
          className="flex items-center space-x-3 cursor-pointer group"
          title="Return to Landing Page"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4338ca] via-indigo-500 to-purple-400 flex items-center justify-center shadow-lg shadow-indigo-950/40 group-hover:scale-105 transition-transform duration-500 ease-premium">
            <span className="text-white font-serif font-bold text-sm tracking-tighter">LP</span>
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="font-serif italic font-bold text-base tracking-tight text-[#fcfbf9] group-hover:text-indigo-300 transition duration-500 ease-premium">
                Luna Slip Planner
              </span>
              <span className="text-[9px] font-mono tracking-[0.3em] uppercase px-2 py-0.5 rounded-full bg-white/5 text-indigo-300 border border-white/10">
                NASA SPACE APPS
              </span>
            </div>
            <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-white/40">
              LUNAR SOUTH POLE • LOLA 720-AZIMUTH
            </p>
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="hidden md:flex items-center bg-black/40 border border-[#262626] rounded-full p-1 space-x-1">
        <button
          onClick={() => applyPreset('artemis')}
          className={`px-3.5 py-1.5 text-[11px] font-mono uppercase tracking-[0.25em] rounded-full transition-all duration-500 ease-premium flex items-center space-x-2 ${
            isArtemis
              ? 'bg-[#4338ca] text-white shadow-md shadow-indigo-900/30 font-semibold'
              : 'text-white/50 hover:text-white'
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
              ? 'bg-[#4338ca] text-white shadow-md shadow-indigo-900/30 font-semibold'
              : 'text-white/50 hover:text-white'
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
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                slipAnalysis.isViable ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'
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
            <div className="px-3 py-1.5 rounded-full text-[10px] font-mono tracking-[0.25em] uppercase bg-amber-950/40 border border-amber-500/40 text-amber-300 flex items-center space-x-1.5">
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              <span>Fragile (&lt;3d)</span>
            </div>
          )}
        </div>
      )}

      {/* Navigation tabs & Actions */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => pinCurrentScenario()}
          className="px-3 py-1.5 text-[11px] font-mono tracking-[0.2em] uppercase text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all duration-500 ease-premium flex items-center space-x-1.5"
          title="Pin current scenario for comparison"
        >
          <Layers className="w-3.5 h-3.5 text-indigo-300" />
          <span>Pin ({pinnedScenarios.length})</span>
        </button>

        <button
          onClick={() => setIsComparisonOpen(true)}
          className="px-3 py-1.5 text-[11px] font-mono tracking-[0.2em] uppercase font-semibold text-white bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-500/40 rounded-full transition-all duration-500 ease-premium flex items-center space-x-1.5 shadow-sm"
          title="Compare scenarios side-by-side"
        >
          <Scale className="w-3.5 h-3.5 text-indigo-300" />
          <span>Compare</span>
        </button>

        <div className="flex items-center bg-black/40 border border-[#262626] rounded-full p-1 space-x-1">
          <button
            onClick={() => setActiveTab('landing')}
            className="px-3 py-1.5 text-[11px] font-mono tracking-[0.2em] uppercase rounded-full text-white/60 hover:text-white transition duration-500 ease-premium flex items-center space-x-1.5"
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
                : 'text-white/60 hover:text-white'
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
                : 'text-white/60 hover:text-white'
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
                : 'text-white/60 hover:text-white'
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
