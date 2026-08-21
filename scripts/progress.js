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
    return { version: 1, games: {} };
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

  window.MeuPlanetinha = window.MeuPlanetinha || {};
  window.MeuPlanetinha.progress = {
    getGame: getGame,
    recordSession: recordSession
  };
})();
