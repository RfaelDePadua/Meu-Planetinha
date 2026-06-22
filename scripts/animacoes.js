/**
 * animacoes.js — Meu Planetinha Animation Utilities
 * Phase 13
 *
 * Responsibilities:
 * 1. ANIM-04: Reduced motion guard — exposes matchMedia result for other scripts.
 * 2. ANIM-05: Page Visibility API — pauses all CSS animations when tab is hidden
 *    by toggling a .tab-hidden class on <body>.
 *
 * Load on every page, after components.js, before page-specific scripts.
 */

(function () {
  'use strict';

  /* ---- ANIM-04: Reduced motion detection ---- */
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---- ANIM-05: Page Visibility API ---- */
  function onVisibilityChange() {
    if (reducedMotion.matches) {
      // Nothing animates under reduced motion — keep class clean
      document.body.classList.remove('tab-hidden');
      return;
    }
    document.body.classList.toggle('tab-hidden', document.hidden);
  }

  document.addEventListener('visibilitychange', onVisibilityChange);

  /* If user toggles reduced-motion while tab is hidden, clean up */
  reducedMotion.addEventListener('change', function () {
    if (reducedMotion.matches) {
      document.body.classList.remove('tab-hidden');
    }
  });

  /* ---- Public API for other scripts (Phase 14 carousel needs this) ---- */
  window.MeuPlanetinha = window.MeuPlanetinha || {};
  window.MeuPlanetinha.reducedMotion = reducedMotion;
})();
