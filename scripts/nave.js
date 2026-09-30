(function () {
  'use strict';

  var GAME_LABELS = {
    'contando-estrelas': { name: 'Contando Estrelas', planet: 'Calculon', icon: '🔢' },
    'jogo-de-silaba': { name: 'Palavra Parkour', planet: 'Letrion', icon: '🔤' }
  };

  function progressApi() {
    return window.MeuPlanetinha && window.MeuPlanetinha.progress;
  }

  function gameProgress(id) {
    var api = progressApi();
    return (api && api.getGame(id)) || {};
  }

  function summary() {
    var api = progressApi();
    return api && api.getSummary ? api.getSummary() : {
      sessions: 0, totalCorrect: 0, totalIncorrect: 0, bestCombo: 0,
      gamesPlayed: 0, explorationStars: 0
    };
  }

  function setPingoColor(color, save) {
    var allowed = ['ciano', 'rosa', 'amarelo'];
    if (allowed.indexOf(color) === -1) color = 'ciano';
    var stage = document.getElementById('pingo-stage');
    if (stage) stage.setAttribute('data-color', color);

    document.querySelectorAll('[data-pingo-color]').forEach(function (button) {
      var active = button.getAttribute('data-pingo-color') === color;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    if (save) {
      var api = progressApi();
      if (api && api.updateProfile) api.updateProfile({ companionColor: color });
      var message = document.getElementById('pingo-message');
      if (message) message.textContent = 'Nova cor ativada! Ficou espacial, não acha?';
    }
  }

  function renderMissions(data) {
    var letrion = gameProgress('jogo-de-silaba');
    var missions = [
      { title: 'Primeira corrida', detail: 'Conclua uma aventura no Palavra Parkour.', current: letrion.sessions || 0, target: 1, reward: 5 },
      { title: 'Caçador de palavras', detail: 'Acerte 10 palavras em Letrion.', current: letrion.totalCorrect || 0, target: 10, reward: 10 },
      { title: 'Piloto de dois mundos', detail: 'Jogue em Calculon e Letrion.', current: data.gamesPlayed, target: 2, reward: 15 }
    ];
    var container = document.getElementById('mission-list');
    if (!container) return;
    container.innerHTML = missions.map(function (mission) {
      var done = mission.current >= mission.target;
      var progress = Math.min(mission.current, mission.target) + '/' + mission.target;
      return '<div class="mission' + (done ? ' is-complete' : '') + '">' +
        '<span class="mission__check" aria-hidden="true">✓</span>' +
        '<span><strong>' + mission.title + '</strong><small>' + mission.detail + ' · ' + progress + '</small></span>' +
        '<span class="mission__reward">★ ' + mission.reward + '</span></div>';
    }).join('');
  }

  function renderTrophies(data) {
    var api = progressApi();
    var prologue = (api && api.getNarrative && api.getNarrative('letrion-prologo')) || {};
    var trophies = [
      { icon: '🚀', title: 'Primeira decolagem', detail: 'Conclua sua primeira partida.', unlocked: data.sessions >= 1 },
      { icon: '⚡', title: 'Combo brilhante', detail: 'Alcance um combo de 3 acertos.', unlocked: data.bestCombo >= 3 },
      { icon: '🪐', title: 'Dois planetas', detail: 'Explore Calculon e Letrion.', unlocked: data.gamesPlayed >= 2 },
      { icon: '🌟', title: 'Mestre aprendiz', detail: 'Some 25 respostas corretas.', unlocked: data.totalCorrect >= 25 },
      { icon: '💎', title: 'Primeiro fragmento', detail: 'Conclua o capítulo de Letrion.', unlocked: Boolean(prologue.completed) }
    ];
    var container = document.getElementById('trophy-grid');
    if (!container) return;
    container.innerHTML = trophies.map(function (trophy) {
      return '<div class="trophy' + (trophy.unlocked ? ' is-unlocked' : '') + '">' +
        '<span class="trophy__badge" aria-hidden="true">' + trophy.icon + '</span>' +
        '<strong>' + trophy.title + '</strong><small>' + trophy.detail + '</small></div>';
    }).join('');
  }

  function renderStoryMission() {
    var api = progressApi();
    var progress = (api && api.getNarrative && api.getNarrative('letrion-prologo')) || {};
    var status = document.getElementById('story-mission-status');
    var cta = document.getElementById('story-mission-cta');
    if (!status || !cta) return;

    if (progress.completed) {
      status.textContent = 'Cristal encontrado';
      cta.textContent = 'Revisitar capítulo →';
      cta.href = 'missao-letrion.html?replay=1&build=narrativa-v1';
    } else if (progress.stage) {
      status.textContent = 'Missão em andamento';
      cta.textContent = 'Continuar missão →';
    }
  }

  function renderProgress() {
    var container = document.getElementById('progress-grid');
    if (!container) return;
    container.innerHTML = Object.keys(GAME_LABELS).map(function (id) {
      var game = GAME_LABELS[id];
      var progress = gameProgress(id);
      var sessions = progress.sessions || 0;
      return '<article class="progress-card">' +
        '<span class="progress-card__planet" aria-hidden="true">' + game.icon + '</span>' +
        '<div><span class="eyebrow">' + game.planet + '</span><h3>' + game.name + '</h3>' +
        '<p>' + (sessions ? 'Progresso salvo neste dispositivo.' : 'Nenhuma aventura concluída ainda.') + '</p>' +
        '<div class="progress-card__stats"><span><strong>' + sessions + '</strong> partidas</span>' +
        '<span><strong>' + (progress.bestScore || 0) + '</strong> recorde</span>' +
        '<span><strong>' + (progress.totalCorrect || 0) + '</strong> acertos</span></div></div></article>';
    }).join('');
  }

  function init() {
    var api = progressApi();
    var data = summary();
    var stars = document.getElementById('exploration-stars');
    if (stars) stars.textContent = String(data.explorationStars || 0);

    var profile = api && api.getProfile ? api.getProfile() : { companionColor: 'ciano' };
    setPingoColor(profile.companionColor, false);
    document.querySelectorAll('[data-pingo-color]').forEach(function (button) {
      button.addEventListener('click', function () {
        setPingoColor(button.getAttribute('data-pingo-color'), true);
      });
    });

    renderMissions(data);
    renderTrophies(data);
    renderProgress();
    renderStoryMission();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
