import React, { useEffect } from 'react';
import { usePlannerStore } from './state/usePlannerStore';
import { Header } from './components/Header';
import { ControlPanel } from './views/ControlPanel';
import { Heatmap } from './charts/Heatmap';
import { SlipControl } from './views/SlipControl';
import { RescuePanel } from './views/RescuePanel';
import { SiteView } from './views/SiteView';
import { Loader2, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const { loading, error, initialize, activeTab } = usePlannerStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200 select-none">
        <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-cyan-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-cyan-400">
              LP
            </div>
          </div>
          <div>
            <h1 className="text-base font-bold text-white uppercase tracking-wider">
              Slip Planner
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Loading precomputed 35,088-step SPICE ephemeris and LOLA 80m horizons for all 14 Artemis landing sites...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center text-rose-300 p-6">
        <div className="max-w-md bg-rose-950/40 border border-rose-800 rounded-xl p-6 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-base font-bold text-white">Initialization Error</h2>
          <p className="text-xs text-rose-300">{error}</p>
          <button
            onClick={() => initialize()}
            className="px-4 py-2 bg-rose-800 hover:bg-rose-700 text-white rounded text-xs font-semibold"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 overflow-hidden font-sans">
      <Header />

      <main className="flex-1 w-full h-[calc(100vh-3.5rem)] overflow-hidden">
        {activeTab === 'planner' ? (
          <div className="w-full h-full flex overflow-hidden">
            <ControlPanel />

            <div className="flex-1 h-full flex flex-col overflow-hidden bg-slate-950">
              <div className="flex-1 w-full overflow-hidden">
                <Heatmap />
              </div>
              <SlipControl />
            </div>

            <RescuePanel />
          </div>
        ) : (
          <SiteView />
        )}
      </main>
    </div>
  );
};
