/**
 * homepage.js — Meu Planetinha Homepage Behaviors
 *
 * 1. Scroll-triggered header: toggles .site-nav--scrolled after 80px scroll.
 * 2. Planet picker: clicking a picker button swaps the active planet in the
 *    hero (badge art/sphere, name, subject, invite, and CTA gradient).
 *
 * Loaded only on index.html, after components.js.
 */

(function () {
  'use strict';

  var SCROLL_THRESHOLD = 80;
  var SCROLLED_CLASS = 'site-nav--scrolled';

  /* Single source of truth for the five planets (mirrors games.js / explore.js).
     `art` = PNG path when the planet has illustration; otherwise the CSS sphere
     + Bootstrap icon is used. */
  var PLANETS = {
    calculon:  { nome: 'Calculon',  materia: 'Matemática', art: 'midia/planet-calculon.png', icon: 'bi-plus-slash-minus', convite: 'Conte estrelas e some pontos!' },
    letrion:   { nome: 'Letrion',   materia: 'Português',  art: 'midia/planet-letrion.png',  icon: 'bi-fonts',           convite: 'Monte palavras sílaba a sílaba!' },
    naturox:   { nome: 'Naturox',   materia: 'Ciências',   art: null,                        icon: 'bi-flower1',         convite: 'Explore a vida e a natureza.' },
    terramund: { nome: 'Terramund', materia: 'Geografia',  art: null,                        icon: 'bi-globe-americas',  convite: 'Viaje pelos continentes.' },
    globish:   { nome: 'Globish',   materia: 'Inglês',     art: null,                        icon: 'bi-translate',       convite: 'Descubra um novo idioma.' }
  };

  /* ------------------------------------------------
     1. Scroll-triggered header background
     ------------------------------------------------ */
  function initScrollHeader() {
    var nav = document.querySelector('.site-nav');
    if (!nav) return;

    var isScrolled = false;
    function onScroll() {
      var shouldBeScrolled = window.scrollY > SCROLL_THRESHOLD;
      if (shouldBeScrolled !== isScrolled) {
        isScrolled = shouldBeScrolled;
        nav.classList.toggle(SCROLLED_CLASS, isScrolled);
      }
    }

    onScroll(); // handle reload mid-scroll
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ------------------------------------------------
     2. Planet picker
     ------------------------------------------------ */

  /** Build the inner markup of the big hero badge for a planet. */
  function buildBadgeInner(slug) {
    var p = PLANETS[slug];
    var html =
      '<span class="planet-badge__glow" aria-hidden="true"></span>' +
      '<span class="planet-badge__ring" aria-hidden="true"></span>';
    if (p.art) {
      html += '<img class="planet-badge__img" src="' + p.art + '" alt="' + p.nome + '" width="240" height="240">';
    } else {
      html += '<span class="planet-badge__sphere" aria-hidden="true"><i class="bi ' + p.icon + '"></i></span>';
    }
    return html;
  }

  function initPlanetPicker() {
    var hero = document.querySelector('.home-hero');
    var badge = document.getElementById('hero-planet');
    var picker = document.querySelector('.home-hero__picker');
    if (!hero || !badge || !picker) return;

    var ctaWrap = document.getElementById('hero-cta-planeta');
    var elMateria = document.getElementById('hero-planet-materia');
    var elNome = document.getElementById('hero-planet-nome');
    var elConvite = document.getElementById('hero-planet-convite');

    function setActive(slug) {
      var p = PLANETS[slug];
      if (!p) return;

      // Hero badge: re-theme + rebuild miolo (img vs sphere)
      badge.setAttribute('data-planeta', slug);
      badge.setAttribute('aria-label', p.nome);
      badge.innerHTML = buildBadgeInner(slug);

      // Planet-scoped color tokens (eyebrow + CTA gradient)
      hero.setAttribute('data-planeta', slug);
      if (ctaWrap) ctaWrap.setAttribute('data-planeta', slug);

      // Info text
      if (elMateria) elMateria.textContent = p.materia;
      if (elNome) elNome.textContent = p.nome;
      if (elConvite) elConvite.textContent = p.convite;

      // Button states
      var buttons = picker.querySelectorAll('.home-hero__picker-btn');
      for (var i = 0; i < buttons.length; i++) {
        var isActive = buttons[i].getAttribute('data-planeta') === slug;
        buttons[i].classList.toggle('is-active', isActive);
        buttons[i].setAttribute('aria-pressed', isActive ? 'true' : 'false');
      }
    }

    picker.addEventListener('click', function (e) {
      var btn = e.target.closest('.home-hero__picker-btn');
      if (!btn) return;
      setActive(btn.getAttribute('data-planeta'));
    });
  }

  /* ------------------------------------------------
     Init
     ------------------------------------------------ */
  function init() {
    initScrollHeader();
    initPlanetPicker();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
