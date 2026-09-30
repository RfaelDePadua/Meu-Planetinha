/**
 * progress.js — persistência local de progresso do Meu Planetinha.
 *
 * Mantém somente resumos de partidas no dispositivo. A API foi desenhada para
 * que, futuramente, o mesmo objeto possa ser sincronizado com o Firestore sem
 * mudar o contrato usado pelos jogos.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'meu-planetinha.progress.v1';

  function emptyState() {
    return {
      version: 1,
      games: {},
      profile: { companionColor: 'ciano' },
      narratives: {}
    };
  }

  function read() {
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (parsed && parsed.version === 1 && parsed.games) return parsed;
    } catch (error) {
      console.warn('[progress] Não foi possível ler o progresso local.', error);
    }
    return emptyState();
  }

  function write(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      console.warn('[progress] Não foi possível salvar o progresso local.', error);
      return false;
    }
  }

  function asCount(value) {
    value = Number(value);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  }

  function recordSession(gameId, result) {
    if (!gameId || !result || typeof result !== 'object') return null;

    var state = read();
    var previous = state.games[gameId] || {};
    var score = asCount(result.score);
    var correct = asCount(result.correct);
    var incorrect = asCount(result.incorrect);
    var combo = asCount(result.bestCombo);

    state.games[gameId] = {
      sessions: asCount(previous.sessions) + 1,
      bestScore: Math.max(asCount(previous.bestScore), score),
      totalCorrect: asCount(previous.totalCorrect) + correct,
      totalIncorrect: asCount(previous.totalIncorrect) + incorrect,
      bestCombo: Math.max(asCount(previous.bestCombo), combo),
      lastScore: score,
      lastPlayedAt: new Date().toISOString()
    };

    write(state);
    return state.games[gameId];
  }

  function getGame(gameId) {
    return read().games[gameId] || null;
  }

  function getProfile() {
    var profile = read().profile || {};
    return { companionColor: profile.companionColor || 'ciano' };
  }

  function updateProfile(changes) {
    var state = read();
    var previous = state.profile || {};
    state.profile = {
      companionColor: changes && changes.companionColor
        ? String(changes.companionColor)
        : (previous.companionColor || 'ciano')
    };
    write(state);
    return getProfile();
  }

  function getNarrative(narrativeId) {
    var narratives = read().narratives || {};
    return narratives[narrativeId] || null;
  }

  function saveNarrative(narrativeId, changes) {
    if (!narrativeId || !changes || typeof changes !== 'object') return null;
    var state = read();
    state.narratives = state.narratives || {};
    var previous = state.narratives[narrativeId] || {};
    var next = Object.assign({}, previous, changes, {
      updatedAt: new Date().toISOString()
    });

    if (changes.completed && !previous.completedAt) {
      next.completedAt = new Date().toISOString();
    }

    state.narratives[narrativeId] = next;
    write(state);
    return next;
  }

  function getSummary() {
    var state = read();
    var games = state.games;
    var ids = Object.keys(games);
    var summary = ids.reduce(function (total, id) {
      var game = games[id] || {};
      total.sessions += asCount(game.sessions);
      total.totalCorrect += asCount(game.totalCorrect);
      total.totalIncorrect += asCount(game.totalIncorrect);
      total.bestCombo = Math.max(total.bestCombo, asCount(game.bestCombo));
      if (asCount(game.sessions) > 0) total.gamesPlayed += 1;
      return total;
    }, { sessions: 0, totalCorrect: 0, totalIncorrect: 0, bestCombo: 0, gamesPlayed: 0 });

    // Cada acerto vale uma estrela; concluir uma partida concede cinco extras.
    // As recompensas das missões são calculadas a partir do progresso salvo,
    // portanto continuam disponíveis sem conta e sem conexão com a internet.
    var letrion = games['jogo-de-silaba'] || {};
    summary.missionBonus = 0;
    if (asCount(letrion.sessions) >= 1) summary.missionBonus += 5;
    if (asCount(letrion.totalCorrect) >= 10) summary.missionBonus += 10;
    if (summary.gamesPlayed >= 2) summary.missionBonus += 15;

    var prologue = (state.narratives || {})['letrion-prologo'] || {};
    summary.narrativeBonus = prologue.completed ? 25 : 0;
    summary.explorationStars = summary.totalCorrect + summary.sessions * 5 +
      summary.missionBonus + summary.narrativeBonus;
    return summary;
  }

  window.MeuPlanetinha = window.MeuPlanetinha || {};
  window.MeuPlanetinha.progress = {
    getGame: getGame,
    getNarrative: getNarrative,
    getProfile: getProfile,
    getSummary: getSummary,
    recordSession: recordSession,
    saveNarrative: saveNarrative,
    updateProfile: updateProfile
  };
})();
