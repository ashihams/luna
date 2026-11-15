import React from 'react';

export const ModelNotice: React.FC = () => (
  <details className="shrink-0 border-b border-amber-400/20 bg-amber-950/20 px-4 py-2 text-xs text-amber-200" data-testid="model-notice">
    <summary className="cursor-pointer">80 m terrain model · ridge uncertainty roughly ±10–30 percentage points</summary>
    <p className="mt-2 max-w-4xl leading-relaxed">
      Exploratory estimates, not certified landing predictions. This is a provisional caution range,
      not a measured confidence interval or a guarantee for any mission window. Published-map
      disagreements remain. The previous 20 m study used incorrectly positioned terrain windows
      and has been withdrawn; higher resolution has not been shown to improve these results.
      Site coordinates are selected study points, and mission thresholds are editable assumptions.
      Earth LOS is geometric visibility of Earth’s center, not a radio-link guarantee.
      The published-map comparator can miss disc visibility beside steep horizons; a corrected
      rerun is pending—existing comparison figures are approximate.
    </p>
  </details>
);
