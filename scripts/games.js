/**
 * games.js — Game Card Data & Renderer
 * Phase 6 — Meu Planetinha
 *
 * Defines game data and renders card components into #game-grid.
 * Exposes a small public API (window.MeuPlanetinha.games) consumed by the
 * Explore page (explore.js) for filtering.
 *
 * Depends on: cards.css (styles)
 */

(function () {
  'use strict';

  /* ------------------------------------------------
     Game Data
     ------------------------------------------------ */

  var GAME_DATA = [
    {
      id: 'contando-estrelas',
      name: 'Contando Estrelas',
      planet: 'calculon',
      subject: 'Matemática',
      difficulty: 2,
      cover: 'midia/Contando_Estrelas.png',
      path: 'jogos/Contando_Estrelas/index.html',
      orientacao: 'vertical',
      sobre: 'Embarque numa aventura matemática pelo espaço! Conte as estrelas cadentes e mostre que você é um verdadeiro explorador dos números.',
      tutorial: [
        'Estrelas aparecem na tela uma a uma',
        'Conte quantas estrelas aparecem',
        'Escolha o número correto antes do tempo acabar',
        'Acerte em sequência para ganhar mais pontos!'
      ]
    },
    {
      id: 'jogo-de-silaba',
      name: 'Jogo de Sílaba',
      planet: 'letrion',
      subject: 'Português',
      difficulty: 1,
      cover: 'midia/Jogo_de_silaba.png',
      path: 'jogos/Jogo_de_Silaba/index.html',
      orientacao: 'vertical',
      sobre: 'Aventure-se no planeta das palavras e domine o poder das sílabas. Uma jornada pelo universo da língua portuguesa!',
      tutorial: [
        'Uma palavra aparece na tela',
        'Observe qual sílaba está destacada',
        'Toque na sílaba correta entre as opções',
        'Cada acerto te leva mais longe na galáxia das letras!'
      ]
    }
  ];

  /* Planet display names + subject icons — used for the card chip and the
     templated (cover-less) fallback. Mirrors the design system's GameCard. */
  var PLANET_NAMES = {
    calculon: 'Calculon',
    letrion: 'Letrion',
    naturox: 'Naturox',
    terramund: 'Terramund',
    globish: 'Globish'
  };

  var PLANET_ICONS = {
    calculon: 'bi-plus-slash-minus',
    letrion: 'bi-fonts',
    naturox: 'bi-flower1',
    terramund: 'bi-globe-americas',
    globish: 'bi-translate'
  };

  /* ------------------------------------------------
     HTML Utilities
     ------------------------------------------------ */

  /**
   * Escape a string for safe HTML interpolation.
   * Prevents XSS if game data ever originates from an external source.
   * @param {*} str - Value to escape.
   * @returns {string} HTML-safe string.
   */
  function escHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ------------------------------------------------
     Card HTML Generators
     ------------------------------------------------ */

  /**
   * Build difficulty star icons (1–3 filled out of 3 total).
   * Uses Bootstrap Icons: bi-star-fill (filled) and bi-star (empty).
   */
  /* Difficulty level labels (context decision: named levels, not numeric) */
  var DIFFICULTY_LABELS = { 1: 'Fácil', 2: 'Médio', 3: 'Difícil' };

  function createStars(difficulty) {
    var label = DIFFICULTY_LABELS[difficulty] || ('Dificuldade ' + difficulty + ' de 3');
    var html = '';
    for (var i = 1; i <= 3; i++) {
      if (i <= difficulty) {
        html += '<i class="bi bi-star-fill game-card-star game-card-star--filled" aria-hidden="true"></i>';
      } else {
        html += '<i class="bi bi-star game-card-star" aria-hidden="true"></i>';
      }
    }
    return '<span class="game-card-stars" role="img" aria-label="Dificuldade: ' + label + '">' + html + '</span>';
  }

  /**
   * Build the 16:9 cover slot for a card. Shows the game's own illustration
   * when a `cover` exists; otherwise a templated cover (planet hue + subject
   * icon + title in the Press Start 2P score font) — always on-brand.
   * @param {Object} game - Game data object.
   * @param {string} basePath - Path prefix for the cover image.
   */
  function createCover(game, basePath) {
    if (game.cover) {
      return (
        '<div class="game-card-cover">' +
          '<img class="game-card-cover-img" src="' + escHtml(basePath) + escHtml(game.cover) + '" alt="" loading="lazy">' +
        '</div>'
      );
    }
    var icon = PLANET_ICONS[game.planet] || 'bi-controller';
    return (
      '<div class="game-card-cover game-card-cover--templated">' +
        '<i class="bi ' + icon + ' game-card-cover-icon" aria-hidden="true"></i>' +
        '<span class="game-card-cover-title">' + escHtml(game.name) + '</span>' +
      '</div>'
    );
  }

  /**
   * Build a single game card <article> element as an HTML string.
   * data-planeta drives the planet accent (chip, cover tint, hover border) and
   * the themed "Jogar!" button variant.
   * @param {Object} game - Game data object.
   * @param {string} [basePath] - Optional path prefix for game href (e.g. '../' from depth-1 pages).
   */
  function createCard(game, basePath) {
    basePath = basePath || '';
    var planetName = PLANET_NAMES[game.planet] || game.planet;
    var chipText = planetName + (game.subject ? ' · ' + game.subject : '');
    return (
      '<article class="game-card" data-planeta="' + escHtml(game.planet) + '" data-game-id="' + escHtml(game.id) + '">' +
        createCover(game, basePath) +
        '<div class="game-card-body">' +
          '<span class="game-card-chip">' +
            '<span class="game-card-chip-dot" aria-hidden="true"></span>' +
            escHtml(chipText) +
          '</span>' +
          '<h3 class="game-card-name">' + escHtml(game.name) + '</h3>' +
          createStars(game.difficulty) +
          '<a href="' + escHtml(basePath) + 'jogos/jogar.html?game=' + escHtml(game.id) + '" class="btn-primario game-card-btn" aria-label="Jogar ' + escHtml(game.name) + '">' +
            '<i class="bi bi-controller" aria-hidden="true"></i> Jogar!' +
          '</a>' +
        '</div>' +
      '</article>'
    );
  }

  /**
   * Build the "Em Breve" placeholder card HTML.
   * Shown after all real game cards to preview upcoming content.
   */
  function createPlaceholderCard() {
    return (
      '<article class="game-card game-card--placeholder" aria-label="Em Breve — novo jogo será adicionado">' +
        '<div class="game-card-body">' +
          '<i class="bi bi-hourglass-split game-card-placeholder-icon" aria-hidden="true"></i>' +
          '<h3 class="game-card-name">Em breve</h3>' +
          '<span class="game-card-subject">Novo jogo a caminho!</span>' +
        '</div>' +
      '</article>'
    );
  }

  /* ------------------------------------------------
     Lookup Utility
     ------------------------------------------------ */

  /**
   * Find a game object by its unique id slug.
   * @param {string} id - Game id (e.g., 'contando-estrelas').
   * @returns {Object|null} Game data object, or null if not found.
   */
  function findGameById(id) {
    if (!id) return null;
    for (var i = 0; i < GAME_DATA.length; i++) {
      if (GAME_DATA[i].id === id) return GAME_DATA[i];
    }
    return null;
  }

  /**
   * Render all game cards into a target grid container.
   * @param {Object} [options] - Optional configuration.
   * @param {string} [options.gridId='game-grid'] - ID of the target grid element.
   * @param {string} [options.basePath=''] - Path prefix for game hrefs (e.g. '../' from depth-1 pages).
   */
  function renderCards(options) {
    options = options || {};
    var gridId = options.gridId || 'game-grid';
    var basePath = options.basePath || '';
    var grid = document.getElementById(gridId);
    if (!grid) return;

    var html = '';
    for (var i = 0; i < GAME_DATA.length; i++) {
      html += createCard(GAME_DATA[i], basePath);
    }
    /* Append "Em Breve" placeholder as the last card */
    html += createPlaceholderCard();
    grid.innerHTML = html;
  }

  /* ------------------------------------------------
     Filter Logic
     ------------------------------------------------ */

  var activePlanet = null;

  /**
   * Filter game cards by planet slug.
   * Hides cards that don't match. Shows cards that do.
   * @param {string|null} planet - Planet slug to filter by, or null to show all.
   */
  function filterCards(planet, gridId) {
    activePlanet = planet;
    var grid = document.getElementById(gridId || 'game-grid');
    if (!grid) return;

    var cards = grid.querySelectorAll('.game-card');
    var visibleCount = 0;

    for (var i = 0; i < cards.length; i++) {
      /* Skip placeholder card — it's always visible */
      if (cards[i].classList.contains('game-card--placeholder')) {
        visibleCount++;
        continue;
      }
      var cardPlanet = cards[i].getAttribute('data-planeta');
      if (!planet || cardPlanet === planet) {
        cards[i].removeAttribute('hidden');
        visibleCount++;
      } else {
        cards[i].setAttribute('hidden', '');
      }
    }

    /* Show or hide empty state */
    updateEmptyState(grid, visibleCount);

    /* Update toolbar button state */
    updateToolbarState(planet);
  }

  /**
   * Show all cards (clear filter).
   */
  function showAll() {
    filterCards(null);
  }

  /**
   * Update the "Mostrar todos" button active/disabled state.
   * @param {string|null} planet - Currently active planet, or null for all.
   */
  function updateToolbarState(planet) {
    var btn = document.getElementById('jogos-mostrar-todos');
    if (!btn) return;

    if (planet) {
      btn.removeAttribute('disabled');
      btn.classList.remove('btn-primario--ativo');
    } else {
      btn.setAttribute('disabled', '');
      btn.classList.add('btn-primario--ativo');
    }
  }

  /**
   * Show or hide the empty state message.
   * @param {HTMLElement} grid - The #game-grid element.
   * @param {number} visibleCount - Number of visible cards.
   */
  function updateEmptyState(grid, visibleCount) {
    var emptyEl = grid.querySelector('.game-grid-empty');

    if (visibleCount === 0) {
      if (!emptyEl) {
        emptyEl = document.createElement('div');
        emptyEl.className = 'game-grid-empty';
        emptyEl.setAttribute('role', 'status');
        emptyEl.innerHTML =
          '<i class="bi bi-stars game-grid-empty-icon" aria-hidden="true"></i>' +
          '<p class="game-grid-empty-text">Nenhum jogo disponível para este planeta.</p>';
        grid.appendChild(emptyEl);
      }
      emptyEl.removeAttribute('hidden');
    } else {
      if (emptyEl) {
        emptyEl.setAttribute('hidden', '');
      }
    }
  }

  /**
   * Render the filter toolbar with a "Mostrar todos" button.
   */
  function renderToolbar() {
    var toolbar = document.getElementById('jogos-toolbar');
    if (!toolbar) return;

    toolbar.innerHTML =
      '<button id="jogos-mostrar-todos" class="btn-primario jogos-filtro-btn btn-primario--ativo" type="button" disabled>' +
        'Mostrar todos' +
      '</button>';

    toolbar.addEventListener('click', function (e) {
      var btn = e.target.closest('#jogos-mostrar-todos');
      if (btn && !btn.disabled) {
        showAll();
      }
    });
  }

  /* ------------------------------------------------
     Public API — consumed by explore page
     ------------------------------------------------ */

  window.MeuPlanetinha = window.MeuPlanetinha || {};
  window.MeuPlanetinha.games = {
    GAME_DATA: GAME_DATA,
    findGameById: findGameById,
    createCard: createCard,
    createStars: createStars,
    renderCards: renderCards,
    filterCards: filterCards,
    showAll: showAll
  };

  /* ------------------------------------------------
     Initialization
     ------------------------------------------------ */

  function init() {
    renderCards();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
