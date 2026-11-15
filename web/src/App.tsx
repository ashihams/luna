import React, { useEffect, useState, lazy, Suspense } from 'react';
import { usePlannerStore } from './state/usePlannerStore';
import { Header } from './components/Header';
import { ControlPanel } from './views/ControlPanel';
import { Heatmap } from './charts/Heatmap';
import { SlipControl } from './views/SlipControl';
import { RescuePanel } from './views/RescuePanel';
const SiteView = lazy(() => import('./views/SiteView').then(m => ({ default: m.SiteView })));
const PoleOverview = lazy(() => import('./three/PoleOverview').then(m => ({ default: m.PoleOverview })));
import { LandingPage } from './views/LandingPage';
import { ComparisonDrawer } from './views/ComparisonDrawer';
import { AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const { loading, error, initialize, activeTab } = usePlannerStore();
  const [mobilePanel, setMobilePanel] = useState<'constraints' | 'rescue' | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Sync activeTab with browser Back/Forward navigation & hash changes
  useEffect(() => {
    const handleNavigation = () => {
      const hash = window.location.hash.replace('#', '');
      if (['planner', 'site', 'pole'].includes(hash)) {
        usePlannerStore.setState({ activeTab: hash as 'planner' | 'site' | 'pole' });
      } else {
        usePlannerStore.setState({ activeTab: 'landing' });
      }
    };

    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);

    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('hashchange', handleNavigation);
    };
  }, []);

  // 1. Landing Page View (Instant display)
  if (activeTab === 'landing') {
    return <LandingPage />;
  }

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#030303] flex flex-col items-center justify-center text-white select-none relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#8B5CF6]/20 filter blur-[120px] rounded-full pointer-events-none" />
        <div className="flex flex-col items-center space-y-6 max-w-sm text-center relative z-10">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border border-white/10 border-t-[#8B5CF6] border-r-[#06B6D4] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center font-serif text-lg text-white font-normal">
              LP
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-normal text-white tracking-tight">
              Luna Slip <span className="text-shimmer">Engine</span>
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 leading-relaxed">
              Loading 35,088-step SPICE ephemeris and LOLA 80m horizons for all 13 Artemis sites...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-screen bg-[#030303] flex flex-col items-center justify-center text-rose-300 p-6">
        <div className="max-w-md bg-[#0a0a0a]/90 backdrop-blur-xl border border-rose-500/30 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="font-serif text-xl font-normal text-white">Initialization Error</h2>
          <p className="font-sans text-xs text-neutral-400 font-light">{error}</p>
          <button
            onClick={() => initialize()}
            className="px-6 py-2.5 bg-[#8B5CF6] hover:bg-[#7c3aed] text-white rounded-full font-sans text-xs font-semibold transition duration-300 ease-snappy shadow-lg shadow-purple-950/50"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  // 2. Synapse Mission Dashboard View
  return (
    <div className="planner-app w-screen h-screen flex flex-col bg-[#030303] overflow-hidden font-sans text-white">
      <Header />

      <main className="planner-main flex-1 min-h-0 w-full overflow-hidden">
        <Suspense fallback={<p className="p-8" role="status">Loading view…</p>}>
        {activeTab === 'planner' ? (
          <div className="planner-frame w-full h-full flex overflow-hidden">
            <div className="mobile-panel-tabs">
              <button aria-expanded={mobilePanel === 'constraints'} onClick={() => setMobilePanel(mobilePanel === 'constraints' ? null : 'constraints')}>Mission constraints</button>
              <button aria-expanded={mobilePanel === 'rescue'} onClick={() => setMobilePanel(mobilePanel === 'rescue' ? null : 'rescue')}>Rescue alternatives</button>
            </div>
            <div className={`planner-constraints ${mobilePanel === 'constraints' ? 'is-open' : ''}`}><ControlPanel /></div>

            <div className="planner-workspace flex-1 min-w-0 h-full flex flex-col overflow-hidden bg-[#030303]">
              <div className="planner-heatmap flex-1 w-full overflow-auto p-2.5 pb-0">
                <Heatmap />
              </div>
              <SlipControl />
            </div>

            <div className={`planner-rescue ${mobilePanel === 'rescue' ? 'is-open' : ''}`}><RescuePanel /></div>
          </div>
        ) : activeTab === 'pole' ? (
          <PoleOverview />
        ) : (
          <SiteView />
        )}
        </Suspense>
      </main>

      {/* Two-Scenario Comparison Drawer */}
      <ComparisonDrawer />
    </div>
  );
};
