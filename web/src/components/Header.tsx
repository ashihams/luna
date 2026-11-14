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
    <header className="h-14 border-b border-slate-800 bg-slate-950/90 backdrop-blur px-4 flex items-center justify-between z-20">
      {/* Brand & Mission */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-950/50">
            <span className="text-white font-bold text-sm tracking-tighter">LP</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm tracking-wide text-slate-100 uppercase">
                Slip Planner
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                NASA Space Apps 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Lunar Landing Site Navigator • South Pole</p>
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
        <button
          onClick={() => applyPreset('artemis')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center space-x-1.5 ${
            isArtemis
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Artemis III profile: 6.5-day surface stay"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Artemis (6.5d)</span>
        </button>
        <button
          onClick={() => applyPreset('clps')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center space-x-1.5 ${
            isCLPS
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Commercial Lunar Payload Services profile: 14-day surface stay"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>CLPS (14d)</span>
        </button>
      </div>

      {/* Slip Status Badge */}
      {slipAnalysis && (
        <div className="hidden lg:flex items-center space-x-2">
          <div
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1.5 border ${
              slipAnalysis.isViable
                ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-400'
                : 'bg-rose-950/60 border-rose-600/50 text-rose-400'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                slipAnalysis.isViable ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
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
            <div className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-950/60 border border-amber-600/50 text-amber-300 flex items-center space-x-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Fragile (&lt;3d)</span>
            </div>
          )}
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => pinCurrentScenario()}
          className="px-2.5 py-1.5 text-xs text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md transition flex items-center space-x-1.5"
          title="Pin current scenario for comparison"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Pin Plan ({pinnedScenarios.length})</span>
        </button>

        <button
          onClick={() => setIsComparisonOpen(true)}
          className="px-2.5 py-1.5 text-xs font-medium text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-700/60 rounded-md transition flex items-center space-x-1.5 shadow-sm"
          title="Compare scenarios side-by-side"
        >
          <Scale className="w-3.5 h-3.5 text-cyan-400" />
          <span>Compare</span>
        </button>

        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab('planner')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center space-x-1.5 ${
              activeTab === 'planner'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Heatmap</span>
          </button>
          <button
            onClick={() => setActiveTab('site')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center space-x-1.5 ${
              activeTab === 'site'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Site 3D</span>
          </button>
          <button
            onClick={() => setActiveTab('pole')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center space-x-1.5 ${
              activeTab === 'pole'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
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
