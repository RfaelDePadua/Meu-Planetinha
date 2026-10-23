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
    calculon:  { nome: 'Calculon',  materia: 'Matemática', art: 'midia/planet-calculon.webp',  icon: 'bi-plus-slash-minus', jogo: 'pouso-na-reta',       nomeJogo: 'Pouso na Reta',       convite: 'Pouse a nave no ponto certo da reta!' },
    letrion:   { nome: 'Letrion',   materia: 'Português',  art: 'midia/planet-letrion.webp',   icon: 'bi-fonts',            jogo: 'detetive-de-letrion', nomeJogo: 'Detetive de Letrion', convite: 'Resolva mistérios com as pistas do texto!' },
    naturox:   { nome: 'Naturox',   materia: 'Ciências',   art: 'midia/planet-naturox.webp',   icon: 'bi-flower1',          jogo: 'teia-viva',           nomeJogo: 'Teia Viva',           convite: 'Descubra por onde a energia passa no Cerrado!' },
    terramund: { nome: 'Terramund', materia: 'Geografia',  art: 'midia/planet-terramund.webp', icon: 'bi-globe-americas',   jogo: 'rumo-certo',          nomeJogo: 'Rumo Certo',          convite: 'Use a rosa dos ventos para cumprir missões no mapa!' },
    globish:   { nome: 'Globish',   materia: 'Inglês',     art: 'midia/planet-globish.webp',   icon: 'bi-translate',        jogo: 'listen-and-do',       nomeJogo: 'Listen & Do',         convite: 'Ouça o comando em inglês e faça no quarto!' }
  };

  /* ------------------------------------------------
     1. Scroll-triggered header background
     ------------------------------------------------ */
  // O menu é injetado depois (components.js): procura a barra a cada rolagem
  // e de novo quando os componentes avisam que estão prontos.
  function initScrollHeader() {
    function onScroll() {
      var nav = document.querySelector('.site-nav');
      if (nav) nav.classList.toggle(SCROLLED_CLASS, window.scrollY > SCROLL_THRESHOLD);
    }

    onScroll(); // handle reload mid-scroll
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('componentes-prontos', onScroll);
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
      badge.innerHTML = buildBadgeInner(slug);

      // Planet-scoped color tokens (eyebrow + CTA gradient)
      hero.setAttribute('data-planeta', slug);
      if (ctaWrap) ctaWrap.setAttribute('data-planeta', slug);

      // Info text
      if (elMateria) elMateria.textContent = p.materia;
      if (elNome) elNome.textContent = p.nome;
      if (elConvite) elConvite.textContent = p.convite;

      // Botão principal leva direto ao jogo do planeta escolhido
      var cta = document.getElementById('hero-cta-jogo');
      var ctaTexto = document.getElementById('hero-cta-texto');
      if (cta) cta.href = 'jogos/jogar.html?game=' + p.jogo;
      if (ctaTexto) ctaTexto.textContent = 'Jogar ' + p.nomeJogo;

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
