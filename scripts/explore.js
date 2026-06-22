/**
 * explore.js — Explore Page Controller
 * Phase 7 — Meu Planetinha
 *
 * Renders planet filter buttons and game card grid for the Explore page.
 * Depends on: games.js (MeuPlanetinha.games public API)
 * Load after: games.js
 */

(function () {
  'use strict';

  /* ------------------------------------------------
     Config
     ------------------------------------------------ */

  var GRID_ID = 'explore-grid';
  var FILTERS_ID = 'explore-filters';
  var FILTERS_MOBILE_ID = 'explore-filters-mobile';
  var BASE_PATH = '../';

  /* Planet definitions — derived from GAME_DATA to get unique planets */
  var PLANET_INFO = [
    { slug: 'calculon',  label: 'Calculon',  subject: 'Matemática' },
    { slug: 'letrion',   label: 'Letrion',   subject: 'Português'  },
    { slug: 'naturox',   label: 'Naturox',   subject: 'Ciências'   },
    { slug: 'terramund', label: 'Terramund', subject: 'Geografia'  },
    { slug: 'globish',   label: 'Globish',   subject: 'Inglês'     }
  ];

  var activePlanet = null; // null = show all

  /* ------------------------------------------------
     Retrieve shared API
     ------------------------------------------------ */

  function getGamesAPI() {
    return window.MeuPlanetinha && window.MeuPlanetinha.games;
  }

  /* ------------------------------------------------
     Render Cards
     ------------------------------------------------ */

  /**
   * Render all game cards into #explore-grid using shared API.
   * Uses basePath '../' so hrefs resolve from /explorar/ depth.
   */
  function renderCards() {
    var api = getGamesAPI();
    if (!api) return;

    api.renderCards({
      gridId: GRID_ID,
      basePath: BASE_PATH
    });
  }

  /* ------------------------------------------------
     Filter Logic
     ------------------------------------------------ */

  /**
   * Filter cards in #explore-grid by planet.
   * @param {string|null} planet — planet slug or null for all
   */
  function filterCards(planet) {
    activePlanet = planet;

    var grid = document.getElementById(GRID_ID);
    if (!grid) return;

    var cards = grid.querySelectorAll('.game-card');
    var visibleCount = 0;

    for (var i = 0; i < cards.length; i++) {
      var cardPlanet = cards[i].getAttribute('data-planeta');
      if (!planet || cardPlanet === planet) {
        cards[i].removeAttribute('hidden');
        visibleCount++;
      } else {
        cards[i].setAttribute('hidden', '');
      }
    }

    updateFilterState(planet);
    updateMobileSelect(planet);
    updateEmptyState(grid, visibleCount);
  }

  function showAll() {
    filterCards(null);
  }

  /* ------------------------------------------------
     Filter Buttons (Desktop — pill buttons)
     ------------------------------------------------ */

  /**
   * Render the desktop pill filter buttons into #explore-filters.
   */
  function renderFilterButtons() {
    var container = document.getElementById(FILTERS_ID);
    if (!container) return;

    var html = '';

    // "Todos" button first — no active class; "Todos" never gets highlighted (context decision)
    html += '<button class="explore-filter-btn" data-planet="todos" type="button">Todos</button>';

    // One button per planet
    for (var i = 0; i < PLANET_INFO.length; i++) {
      var p = PLANET_INFO[i];
      html += '<button class="explore-filter-btn" data-planet="' + p.slug + '" type="button" ' +
              'aria-label="Planeta ' + p.label + ' \u2013 ' + p.subject + '">' + p.label + '</button>';
    }

    container.innerHTML = html;

    // Delegated click handler
    container.addEventListener('click', function (e) {
      var btn = e.target.closest('.explore-filter-btn');
      if (!btn) return;

      var planet = btn.getAttribute('data-planet');
      if (planet === 'todos') {
        showAll();
      } else {
        filterCards(planet);
      }
    });
  }

  /**
   * Update active state on desktop filter buttons.
   * @param {string|null} planet — active planet slug, or null for all
   */
  function updateFilterState(planet) {
    var container = document.getElementById(FILTERS_ID);
    if (!container) return;

    var buttons = container.querySelectorAll('.explore-filter-btn');
    for (var i = 0; i < buttons.length; i++) {
      var btnPlanet = buttons[i].getAttribute('data-planet');
      // "Todos" never gets active class (context decision)
      if (btnPlanet === 'todos') {
        buttons[i].classList.remove('explore-filter-btn--active');
      } else if (btnPlanet === planet) {
        buttons[i].classList.add('explore-filter-btn--active');
      } else {
        buttons[i].classList.remove('explore-filter-btn--active');
      }
    }
  }

  /* ------------------------------------------------
     Filter Dropdown (Mobile — <select>)
     ------------------------------------------------ */

  /**
   * Render the mobile <select> dropdown into #explore-filters-mobile.
   */
  function renderMobileFilter() {
    var container = document.getElementById(FILTERS_MOBILE_ID);
    if (!container) return;

    var html = '';
    html += '<label class="sr-only" for="explore-planet-select">Filtrar por planeta</label>';
    html += '<select id="explore-planet-select" class="explore-filter-select">';
    html += '<option value="todos">Todos os Planetas</option>';

    for (var i = 0; i < PLANET_INFO.length; i++) {
      var p = PLANET_INFO[i];
      html += '<option value="' + p.slug + '">' + p.label + '</option>';
    }

    html += '</select>';
    container.innerHTML = html;

    // Change handler
    var select = document.getElementById('explore-planet-select');
    if (select) {
      select.addEventListener('change', function () {
        var value = select.value;
        if (value === 'todos') {
          showAll();
        } else {
          filterCards(value);
        }
      });
    }
  }

  /**
   * Sync mobile <select> value with current filter state.
   * @param {string|null} planet — active planet slug, or null for all
   */
  function updateMobileSelect(planet) {
    var select = document.getElementById('explore-planet-select');
    if (!select) return;
    select.value = planet || 'todos';
  }

  /* ------------------------------------------------
     Empty State
     ------------------------------------------------ */

  /**
   * Show or hide empty state in the explore grid.
   * @param {HTMLElement} grid — the #explore-grid element
   * @param {number} visibleCount — number of visible cards
   */
  function updateEmptyState(grid, visibleCount) {
    var emptyEl = grid.querySelector('.explore-empty');

    if (visibleCount === 0) {
      if (!emptyEl) {
        emptyEl = document.createElement('div');
        emptyEl.className = 'explore-empty';
        emptyEl.setAttribute('role', 'status');
        emptyEl.innerHTML =
          '<i class="bi bi-stars explore-empty-icon" aria-hidden="true"></i>' +
          '<p class="explore-empty-text">Nenhum jogo disponível</p>' +
          '<button class="explore-empty-btn" type="button">Ver Todos</button>';
        grid.appendChild(emptyEl);

        // "Ver Todos" click handler
        emptyEl.querySelector('.explore-empty-btn').addEventListener('click', function () {
          showAll();
        });
      }
      emptyEl.removeAttribute('hidden');
    } else {
      if (emptyEl) {
        emptyEl.setAttribute('hidden', '');
      }
    }
  }

  /* ------------------------------------------------
     Initialization
     ------------------------------------------------ */

  function init() {
    var api = getGamesAPI();
    if (!api) {
      console.warn('explore.js: MeuPlanetinha.games API not found. Ensure games.js is loaded first.');
      return;
    }

    // 1. Render all game cards with corrected paths
    renderCards();

    // 2. Render filter UI (desktop + mobile)
    renderFilterButtons();
    renderMobileFilter();

    // 3. Default state: show all (Todos active)
    // Cards are already all visible after renderCards()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
