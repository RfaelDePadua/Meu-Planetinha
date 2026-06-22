/**
 * jogar.js — Meu Planetinha · Controlador da página do jogo
 *
 * Conduz a experiência fullscreen do wrapper:
 *   lobby (apresentação) → shell de jogo (iframe + painéis) → overlays.
 *
 * Responsabilidades:
 *  - Roteamento por ?game=<id> e busca via MeuPlanetinha.games.findGameById.
 *  - Popular lobby + shell + overlays (tema do planeta via body[data-planeta]).
 *  - Carregar o iframe ao clicar em JOGAR; dispensar o loading interno quando o
 *    jogo envia postMessage('game-ready') (com fallback de timeout).
 *  - Controles best-effort: pausar / som / reiniciar enviam postMessage ao jogo
 *    (os jogos ainda podem não escutar — a UI sincroniza os ícones localmente),
 *    além de tela cheia, voltar, tutorial e aviso de girar o celular.
 *
 * Depende de: games.js (MeuPlanetinha.games.findGameById, e os campos
 *   sobre/tutorial/orientacao adicionados a cada jogo).
 * Carregar após: games.js
 *
 * Contrato de mensagens (parent → jogo, targetOrigin '*'):
 *   'pause' | 'resume' | 'mute' | 'unmute' | 'restart'
 * Contrato (jogo → parent):
 *   'game-ready'  (string) — dispensa o overlay de carregamento.
 */

(function () {
  'use strict';

  /* ------------------------------------------------
     Constantes
     ------------------------------------------------ */
  var LOADING_TIMEOUT_MS = 5000;  // Fallback para dispensar o loading do jogo

  /* ------------------------------------------------
     Tabelas de apoio (planeta → nome/ícone)
     ------------------------------------------------ */
  var PLANET_NAMES = {
    calculon: 'Calculon', letrion: 'Letrion',
    naturox: 'Naturox', terramund: 'Terramund', globish: 'Globish'
  };
  var PLANET_ICONS = {
    calculon: 'bi-plus-slash-minus', letrion: 'bi-fonts',
    naturox: 'bi-flower1', terramund: 'bi-globe-americas', globish: 'bi-translate'
  };

  /* ------------------------------------------------
     Estado + helpers de DOM
     ------------------------------------------------ */
  var game = null;
  var isMuted = false;
  var isPaused = false;
  var isDrawerOpen = false;
  var loadingTimeout = null;

  function $(id) { return document.getElementById(id); }
  var el = {};

  /* ------------------------------------------------
     Resolve a URL base do projeto a partir do src deste script.
     (mesma técnica usada para resolver caminhos de capa e do jogo)
     ------------------------------------------------ */
  function getBaseURL() {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].src || '';
      var idx = src.indexOf('scripts/jogar.js');
      if (idx !== -1) { return src.substring(0, idx); }
    }
    var path = location.pathname;
    var jogosIdx = path.lastIndexOf('jogos/');
    if (jogosIdx !== -1) { return location.origin + path.substring(0, jogosIdx); }
    return '';
  }

  function getGameIdFromURL() {
    return new URLSearchParams(location.search).get('game');
  }

  function getGamesAPI() {
    return window.MeuPlanetinha && window.MeuPlanetinha.games;
  }

  /* ------------------------------------------------
     Helpers de renderização
     ------------------------------------------------ */
  function renderStars(container, level) {
    if (!container) return;
    container.innerHTML = '';
    for (var i = 1; i <= 3; i++) {
      var ic = document.createElement('i');
      ic.className = i <= level ? 'bi bi-star-fill' : 'bi bi-star';
      ic.setAttribute('aria-hidden', 'true');
      container.appendChild(ic);
    }
  }

  function renderTutorialSteps(container, steps, cls) {
    if (!container) return;
    var frag = document.createDocumentFragment();
    (steps || []).forEach(function (s, i) {
      var li = document.createElement('li');
      var num = document.createElement('span');
      num.className = cls || 'step-num';
      num.textContent = String(i + 1);
      var txt = document.createElement('span');
      txt.textContent = s;
      li.appendChild(num);
      li.appendChild(txt);
      frag.appendChild(li);
    });
    container.innerHTML = '';
    container.appendChild(frag);
  }

  /* ------------------------------------------------
     Popular toda a UI a partir do objeto do jogo.
     Mapeia os campos do projeto (name/subject/difficulty) para os rótulos
     em PT usados nesta página.
     ------------------------------------------------ */
  function populateGame(g) {
    var nome = g.name;
    var materia = g.subject;
    var dificuldade = g.difficulty;
    var orientacao = g.orientacao || 'vertical';

    document.title = nome + ' — Meu Planetinha';
    document.body.setAttribute('data-planeta', g.planet);

    var chipText = (PLANET_NAMES[g.planet] || g.planet) + ' · ' + materia;

    /* Lobby — capa */
    if (g.cover) {
      var img = $('lobby-cover-img');
      img.src = getBaseURL() + g.cover;
      img.alt = nome;
      img.hidden = false;
      $('lobby-cover-fallback').hidden = true;
    } else {
      $('lobby-cover-fallback').innerHTML =
        '<i class="bi ' + (PLANET_ICONS[g.planet] || 'bi-controller') + '"></i>';
    }
    renderStars($('lobby-stars'), dificuldade);
    $('lobby-chip-text').textContent = chipText;
    $('lobby-title').textContent = nome;
    $('sobre-text').textContent = g.sobre || '';
    renderTutorialSteps($('tutorial-steps-lobby'), g.tutorial, 'step-num');

    /* Shell — painel esquerdo */
    $('left-chip-text').textContent = chipText;
    $('left-title').textContent = nome;
    renderStars($('left-stars'), dificuldade);

    /* Shell — painel direito */
    $('right-chip-text').textContent = chipText;
    $('right-title').textContent = nome;

    /* Shell — faixa horizontal + barra mobile */
    $('strip-title').textContent = nome;
    $('mobile-title').textContent = nome;

    /* Overlays de tutorial + drawer */
    renderTutorialSteps($('tutorial-steps-overlay'), g.tutorial, 'step-n');
    renderTutorialSteps($('tutorial-steps-drawer'), g.tutorial, 'step-num');
    $('drawer-sobre-text').textContent = g.sobre || '';

    /* Layout horizontal */
    if (orientacao === 'horizontal') {
      el.shell.classList.add('is-horizontal');
    }
  }

  /* ------------------------------------------------
     Lobby → shell + carregamento do iframe
     ------------------------------------------------ */
  function startGame() {
    el.lobby.hidden = true;
    el.shell.hidden = false;
    checkOrientation();
    loadGameIframe();
  }

  function dismissGameLoading() {
    if (loadingTimeout) { clearTimeout(loadingTimeout); loadingTimeout = null; }
    el.gameLoading.hidden = true;
    el.iframe.hidden = false;
  }

  function loadGameIframe() {
    el.gameLoading.hidden = false;
    el.iframe.hidden = true;
    el.iframe.src = getBaseURL() + game.path;
    // Dispensa quando o jogo sinaliza 'game-ready' (listener abaixo) ou no timeout.
    loadingTimeout = setTimeout(dismissGameLoading, LOADING_TIMEOUT_MS);
  }

  /* Mensagem do iframe do jogo */
  window.addEventListener('message', function (e) {
    if (e.source === el.iframe.contentWindow && e.data === 'game-ready') {
      dismissGameLoading();
    }
  });

  /* ------------------------------------------------
     Orientação (aviso de girar o celular — só jogos horizontais)
     ------------------------------------------------ */
  function checkOrientation() {
    if (!game || (game.orientacao || 'vertical') !== 'horizontal') {
      el.rotateOverlay.hidden = true;
      return;
    }
    el.rotateOverlay.hidden = window.innerWidth >= window.innerHeight;
  }

  /* ------------------------------------------------
     Envio best-effort de comando ao jogo
     ------------------------------------------------ */
  function postToGame(msg) {
    try {
      if (el.iframe.contentWindow) {
        el.iframe.contentWindow.postMessage(msg, '*');
      }
    } catch (e) { /* cross-origin / não carregado — ignora */ }
  }

  /* ------------------------------------------------
     Pausa
     ------------------------------------------------ */
  function setPaused(val) {
    isPaused = val;
    el.pauseOverlay.hidden = !val;
    [$('pause-icon'), $('strip-pause-icon'), $('mobile-pause-icon')].forEach(function (ic) {
      if (ic) ic.className = val ? 'bi bi-play-circle' : 'bi bi-pause-circle';
    });
    var lbl = $('pause-label');
    if (lbl) lbl.textContent = val ? 'Continuar' : 'Pausar';
    postToGame(val ? 'pause' : 'resume');
  }

  /* ------------------------------------------------
     Som (mute)
     ------------------------------------------------ */
  function setMuted(val) {
    isMuted = val;
    var cls = val ? 'bi bi-volume-mute-fill' : 'bi bi-volume-up-fill';
    [$('mute-icon'), $('strip-mute-icon'), $('drawer-mute-icon')].forEach(function (ic) {
      if (ic) ic.className = cls;
    });
    var lbl = $('mute-label');
    if (lbl) lbl.textContent = val ? 'Som off' : 'Som';
    postToGame(val ? 'mute' : 'unmute');
  }

  /* ------------------------------------------------
     Tela cheia
     ------------------------------------------------ */
  function toggleFullscreen() {
    var req = el.shell.requestFullscreen || el.shell.webkitRequestFullscreen;
    var exit = document.exitFullscreen || document.webkitExitFullscreen;
    var isFs = document.fullscreenElement || document.webkitFullscreenElement;
    if (!isFs) {
      if (req) req.call(el.shell);
    } else {
      if (exit) exit.call(document);
    }
  }

  function syncFullscreenIcons() {
    var isFs = document.fullscreenElement || document.webkitFullscreenElement;
    var cls = isFs ? 'bi bi-fullscreen-exit' : 'bi bi-fullscreen';
    [$('fs-icon'), $('strip-fs-icon'), $('drawer-fs-icon')].forEach(function (ic) {
      if (ic) ic.className = cls;
    });
  }

  /* ------------------------------------------------
     Tutorial
     ------------------------------------------------ */
  function showTutorial() {
    if (isPaused) setPaused(false);
    el.tutorialOverlay.hidden = false;
  }
  function hideTutorial() { el.tutorialOverlay.hidden = true; }

  /* ------------------------------------------------
     Voltar
     ------------------------------------------------ */
  function goBack() {
    if (window.history.length > 1) {
      history.back();
      setTimeout(function () { window.location.href = '../explorar/explorar.html'; }, 400);
    } else {
      window.location.href = '../explorar/explorar.html';
    }
  }

  /* ------------------------------------------------
     Ligações de eventos
     ------------------------------------------------ */
  function bindEvents() {
    /* Abas do lobby */
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.tab-btn').forEach(function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.tab-panel').forEach(function (p) {
          p.classList.remove('active');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        var panel = $('tab-' + btn.dataset.tab);
        if (panel) panel.classList.add('active');
      });
    });

    /* Abas do drawer (mobile) */
    document.querySelectorAll('.drawer-tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.drawer-tab-btn').forEach(function (b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        $('dtab-how').hidden = btn.dataset.dtab !== 'how';
        $('dtab-info').hidden = btn.dataset.dtab !== 'info';
      });
    });

    /* Abrir/fechar drawer */
    el.drawerTrigger.addEventListener('click', function () {
      isDrawerOpen = !isDrawerOpen;
      el.drawerContent.hidden = !isDrawerOpen;
      el.drawerTrigger.setAttribute('aria-expanded', String(isDrawerOpen));
    });

    /* JOGAR */
    el.jogarBtn.addEventListener('click', function () {
      if (!el.jogarBtn.disabled) startGame();
    });

    /* Pausa */
    $('btn-pause').addEventListener('click', function () { setPaused(!isPaused); });
    bindIf('strip-pause', function () { setPaused(!isPaused); });
    bindIf('mobile-pause', function () { setPaused(!isPaused); });
    $('btn-resume').addEventListener('click', function () { setPaused(false); });
    $('btn-exit-pause').addEventListener('click', function () { setPaused(false); goBack(); });
    $('btn-restart').addEventListener('click', function () {
      setPaused(false);
      postToGame('restart');
      el.iframe.src = el.iframe.src; // recarrega como fallback
    });

    /* Som */
    $('btn-mute').addEventListener('click', function () { setMuted(!isMuted); });
    bindIf('strip-mute', function () { setMuted(!isMuted); });
    bindIf('drawer-mute', function () { setMuted(!isMuted); });

    /* Tela cheia */
    [$('btn-fullscreen'), $('strip-fullscreen'), $('drawer-fullscreen')].forEach(function (b) {
      if (b) b.addEventListener('click', toggleFullscreen);
    });
    document.addEventListener('fullscreenchange', syncFullscreenIcons);
    document.addEventListener('webkitfullscreenchange', syncFullscreenIcons);

    /* Tutorial */
    $('btn-tutorial-panel').addEventListener('click', showTutorial);
    $('tutorial-close').addEventListener('click', hideTutorial);
    $('btn-tutorial-ok').addEventListener('click', hideTutorial);
    bindIf('strip-tutorial', showTutorial);
    $('btn-how-pause').addEventListener('click', function () { setPaused(false); showTutorial(); });

    /* Voltar (todas as superfícies) */
    ['back-link', 'shell-back', 'strip-back', 'mobile-back', 'drawer-exit'].forEach(function (id) {
      var b = $(id);
      if (b) b.addEventListener('click', function (e) { e.preventDefault(); goBack(); });
    });

    /* Orientação */
    window.addEventListener('resize', checkOrientation);

    /* Esc fecha overlays (a11y) */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (!el.tutorialOverlay.hidden) { hideTutorial(); }
      else if (isPaused) { setPaused(false); }
    });
  }

  function bindIf(id, handler) {
    var b = $(id);
    if (b) b.addEventListener('click', handler);
  }

  /* ------------------------------------------------
     Estado de erro
     ------------------------------------------------ */
  function showError() {
    el.lobby.hidden = true;
    el.shell.hidden = true;
    el.error.hidden = false;
  }

  /* ------------------------------------------------
     Init
     ------------------------------------------------ */
  function init() {
    el = {
      lobby: $('state-lobby'),
      shell: $('state-shell'),
      error: $('state-error'),
      iframe: $('game-iframe'),
      gameLoading: $('game-loading'),
      rotateOverlay: $('rotate-overlay'),
      pauseOverlay: $('pause-overlay'),
      tutorialOverlay: $('tutorial-overlay'),
      jogarBtn: $('btn-jogar'),
      jogarIcon: $('jogar-icon'),
      jogarText: $('jogar-text'),
      progressBar: $('lobby-progress-bar'),
      drawerContent: $('drawer-content'),
      drawerTrigger: $('drawer-trigger')
    };

    var id = getGameIdFromURL();
    var api = getGamesAPI();
    game = (id && api && typeof api.findGameById === 'function')
      ? api.findGameById(id)
      : null;

    if (!game) { showError(); return; }

    populateGame(game);
    bindEvents();

    /* Decisão de produto: JOGAR habilita de imediato. A barra de progresso é
       cosmética; o carregamento real é gated dentro da shell (game-ready). */
    el.progressBar.style.width = '100%';
    el.jogarBtn.disabled = false;
    el.jogarIcon.className = 'bi bi-play-fill';
    el.jogarText.textContent = 'JOGAR';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
