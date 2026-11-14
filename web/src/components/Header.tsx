import React from 'react';
import { usePlannerStore } from '../state/usePlannerStore';
import { Calendar, Compass, ShieldAlert, Sparkles, Layers, Globe, Scale } from 'lucide-react';

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
    <header className="h-14 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl px-5 flex items-center justify-between z-20 select-none text-white">
      {/* Brand & Mission */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-[#8B5CF6] to-[#06B6D4] shadow-[0_0_10px_#8B5CF6]" />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif text-lg font-normal tracking-tight text-white">
                Luna Slip Planner
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] text-neutral-400 border border-white/10 uppercase tracking-widest">
                NASA SPACE APPS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="hidden md:flex items-center bg-white/[0.02] border border-white/10 rounded-full p-1 space-x-1 shadow-sm">
        <button
          onClick={() => applyPreset('artemis')}
          className={`px-3 py-1 text-xs font-sans rounded-full transition duration-300 ease-snappy flex items-center space-x-1.5 ${
            isArtemis
              ? 'bg-[#8B5CF6] text-white shadow-[0_0_15px_-5px_#8B5CF6] font-semibold'
              : 'text-neutral-400 hover:text-white'
          }`}
          title="Artemis III profile: 6.5-day surface stay"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Artemis (6.5d)</span>
        </button>
        <button
          onClick={() => applyPreset('clps')}
          className={`px-3 py-1 text-xs font-sans rounded-full transition duration-300 ease-snappy flex items-center space-x-1.5 ${
            isCLPS
              ? 'bg-[#8B5CF6] text-white shadow-[0_0_15px_-5px_#8B5CF6] font-semibold'
              : 'text-neutral-400 hover:text-white'
          }`}
          title="Commercial Lunar Payload Services profile: 14-day surface stay"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>CLPS (14d)</span>
        </button>
      </div>

      {/* Slip Status Badge */}
      {slipAnalysis && (
        <div className="hidden lg:flex items-center space-x-2.5">
          <div
            className={`px-3.5 py-1 rounded-full text-xs font-mono tracking-wider flex items-center space-x-2 border transition duration-300 ease-snappy ${
              slipAnalysis.isViable
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_-5px_#10B981]'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300 shadow-[0_0_12px_-5px_#EF4444]'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                slipAnalysis.isViable ? 'bg-[#10B981] animate-pulse shadow-[0_0_8px_#10B981]' : 'bg-[#EF4444]'
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
            <div className="px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider uppercase bg-amber-950/40 border border-amber-500/40 text-amber-300 flex items-center space-x-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Fragile (&lt;3d)</span>
            </div>
          )}
        </div>
      )}

      {/* Navigation tabs & Actions */}
      <div className="flex items-center space-x-2.5">
        <a
          href="https://github.com/ashihams/luna"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden xl:flex px-3 py-1.5 text-xs text-neutral-400 hover:text-white transition duration-300 items-center space-x-1 font-mono tracking-wider uppercase"
          title="View GitHub Repository"
        >
          <span>GitHub ↗</span>
        </a>

        <button
          onClick={() => pinCurrentScenario()}
          className="px-3 py-1.5 text-xs text-neutral-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-full transition duration-300 ease-snappy flex items-center space-x-1.5"
          title="Pin current scenario for comparison"
        >
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          <span>Pin ({pinnedScenarios.length})</span>
        </button>

        <button
          onClick={() => setIsComparisonOpen(true)}
          className="px-3 py-1.5 text-xs font-semibold text-purple-200 bg-violet-950/40 hover:bg-violet-900/50 border border-violet-500/40 rounded-full transition duration-300 ease-snappy flex items-center space-x-1.5 shadow-[0_0_15px_-5px_#8B5CF6]"
          title="Compare scenarios side-by-side"
        >
          <Scale className="w-3.5 h-3.5 text-violet-300" />
          <span>Compare</span>
        </button>

        <div className="flex items-center bg-white/[0.02] border border-white/10 rounded-full p-1 space-x-1 shadow-sm">
          <button
            onClick={() => setActiveTab('planner')}
            className={`px-3 py-1 text-xs font-sans rounded-full transition duration-300 ease-snappy flex items-center space-x-1.5 ${
              activeTab === 'planner'
                ? 'bg-[#8B5CF6] text-white shadow-[0_0_15px_-5px_#8B5CF6] font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Heatmap</span>
          </button>
          <button
            onClick={() => setActiveTab('site')}
            className={`px-3 py-1 text-xs font-sans rounded-full transition duration-300 ease-snappy flex items-center space-x-1.5 ${
              activeTab === 'site'
                ? 'bg-[#8B5CF6] text-white shadow-[0_0_15px_-5px_#8B5CF6] font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Site 3D</span>
          </button>
          <button
            onClick={() => setActiveTab('pole')}
            className={`px-3 py-1 text-xs font-sans rounded-full transition duration-300 ease-snappy flex items-center space-x-1.5 ${
              activeTab === 'pole'
                ? 'bg-[#8B5CF6] text-white shadow-[0_0_15px_-5px_#8B5CF6] font-semibold'
                : 'text-neutral-400 hover:text-white'
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
