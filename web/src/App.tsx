import React, { useEffect } from 'react';
import { usePlannerStore } from './state/usePlannerStore';
import { Header } from './components/Header';
import { ControlPanel } from './views/ControlPanel';
import { Heatmap } from './charts/Heatmap';
import { SlipControl } from './views/SlipControl';
import { RescuePanel } from './views/RescuePanel';
import { SiteView } from './views/SiteView';
import { PoleOverview } from './three/PoleOverview';
import { LandingPage } from './views/LandingPage';
import { ComparisonDrawer } from './views/ComparisonDrawer';
import { AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const { loading, error, initialize, activeTab } = usePlannerStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // 1. Landing Page View (Instant display)
  if (activeTab === 'landing') {
    return <LandingPage />;
  }

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#171717] flex flex-col items-center justify-center text-[#fcfbf9] select-none">
        <div className="flex flex-col items-center space-y-5 max-w-sm text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-white/10 border-t-[#4338ca] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center font-serif italic text-sm text-indigo-300">
              LP
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="font-serif italic text-lg font-normal text-white">
              Luna Slip Planner
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/50 leading-relaxed">
              Loading 35,088-step SPICE ephemeris and LOLA 80m horizons for all 14 candidate sites...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-screen bg-[#171717] flex flex-col items-center justify-center text-rose-300 p-6">
        <div className="max-w-md bg-black/60 border border-rose-900/50 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="font-serif text-base font-bold text-white">Initialization Error</h2>
          <p className="font-sans text-xs text-rose-300">{error}</p>
          <button
            onClick={() => initialize()}
            className="px-5 py-2.5 bg-[#4338ca] hover:bg-[#3730a3] text-white rounded-full font-mono text-xs uppercase tracking-[0.2em] transition"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  // 2. Mission Dashboard View
  return (
    <div className="w-screen h-screen flex flex-col bg-[#171717] overflow-hidden font-sans text-[#fcfbf9]">
      <Header />

      <main className="flex-1 w-full h-[calc(100vh-4rem)] overflow-hidden">
        {activeTab === 'planner' ? (
          <div className="w-full h-full flex overflow-hidden">
            <ControlPanel />

            <div className="flex-1 h-full flex flex-col overflow-hidden bg-[#171717]">
              <div className="flex-1 w-full overflow-hidden">
                <Heatmap />
              </div>
              <SlipControl />
            </div>

            <RescuePanel />
          </div>
        ) : activeTab === 'pole' ? (
          <PoleOverview />
        ) : (
          <SiteView />
        )}
      </main>

      {/* Two-Scenario Comparison Drawer */}
      <ComparisonDrawer />
    </div>
  );
};
