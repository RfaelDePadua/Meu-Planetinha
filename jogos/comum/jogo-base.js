/**
 * jogo-base.js — peças comuns aos jogos do Meu Planetinha.
 *
 * - voz: toca os mp3 gerados por ferramentas/gerar-falas.ps1 (índice em
 *   audio/falas.json); se faltar algum, usa a melhor voz pt-BR do navegador;
 * - sons curtos sintetizados (sem arquivos);
 * - contrato com a página do portal (jogos/jogar.html): pronto, pausa, som,
 *   reinício e resultado.
 */
(function (global) {
  'use strict';

  var mudo = false;
  var vozes = [];

  /* ------------------------------------------------
     Voz
     ------------------------------------------------ */
  // Vozes "Natural"/"Online" (Edge) e Google soam bem melhor que as do sistema.
  function notaDaVoz(v) {
    return (/^pt[-_]BR/i.test(v.lang) ? 10 : 0) + (/natural|neural|online/i.test(v.name) ? 5 : 0) +
      (/google/i.test(v.name) ? 3 : 0);
  }

  function criarVoz(config) {
    var pasta = (config && config.pasta) || 'audio/';
    var manifesto = null;
    var vozNavegador = null;
    var cache = {};
    var token = 0;
    var tocando = null;
    var ouvintes = [];

    function avisar() {
      var disponivel = Boolean(manifesto || vozNavegador);
      ouvintes.forEach(function (f) { f(disponivel); });
    }

    fetch(pasta + 'falas.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (m) { manifesto = m; avisar(); })
      .catch(function () { /* sem áudios gravados: fica a voz do navegador */ });

    function carregarVozes() {
      var lista = global.speechSynthesis.getVoices().filter(function (v) { return /^pt/i.test(v.lang); });
      lista.sort(function (a, b) { return notaDaVoz(b) - notaDaVoz(a); });
      vozNavegador = lista[0] || null;
      avisar();
    }

    if ('speechSynthesis' in global) {
      carregarVozes();
      global.speechSynthesis.addEventListener('voiceschanged', carregarVozes);
    }

    function audioDe(fala) {
      var arquivo = manifesto && manifesto[fala];
      if (!arquivo) return null;
      var url = pasta + arquivo;
      if (!cache[url]) {
        cache[url] = new Audio(url);
        cache[url].preload = 'auto';
      }
      return cache[url];
    }

    function tocar(audio) {
      return new Promise(function (resolve) {
        tocando = audio;
        audio.onended = audio.onerror = audio.onpause = function () { resolve(); };
        try { audio.currentTime = 0; } catch (e) { /* ainda carregando */ }
        var promessa = audio.play();
        if (promessa && promessa.catch) promessa.catch(resolve);
      });
    }

    function falarNavegador(texto) {
      if (!vozNavegador) return Promise.resolve();
      return new Promise(function (resolve) {
        var fala = new SpeechSynthesisUtterance(texto);
        fala.voice = vozNavegador;
        fala.lang = vozNavegador.lang;
        fala.rate = 1;
        fala.onend = fala.onerror = function () { resolve(); };
        setTimeout(resolve, 1500 + texto.length * 90); // algumas vozes não avisam o fim
        global.speechSynthesis.speak(fala);
      });
    }

    function calar() {
      token++;
      if (tocando) { tocando.pause(); tocando = null; }
      if ('speechSynthesis' in global) global.speechSynthesis.cancel();
    }

    var voz = {
      // Fala uma ou mais frases em sequência; resolve quando termina ou é interrompida.
      falar: function (falas) {
        falas = [].concat(falas).filter(Boolean);
        calar();
        if (mudo || !falas.length) return Promise.resolve();
        var atual = token;
        var audios = falas.map(audioDe);
        if (!audios.every(Boolean)) return falarNavegador(falas.join(' '));
        return audios.reduce(function (cadeia, audio) {
          return cadeia.then(function () { return atual === token ? tocar(audio) : null; });
        }, Promise.resolve());
      },
      calar: calar,
      preCarregar: function (falas) { falas.forEach(function (f) { if (f) audioDe(f); }); },
      // Avisa (agora e quando mudar) se há alguma voz disponível.
      aoMudarDisponibilidade: function (f) { ouvintes.push(f); avisar(); }
    };
    vozes.push(voz);
    return voz;
  }

  function calarTudo() { vozes.forEach(function (v) { v.calar(); }); }

  /* ------------------------------------------------
     Sons sintetizados
     ------------------------------------------------ */
  var audioCtx = null;

  function tom(freq, inicio, duracao, tipo, volume) {
    var osc = audioCtx.createOscillator();
    var ganho = audioCtx.createGain();
    osc.type = tipo;
    osc.frequency.value = freq;
    ganho.gain.setValueAtTime(0.0001, inicio);
    ganho.gain.exponentialRampToValueAtTime(volume, inicio + 0.01);
    ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + duracao);
    osc.connect(ganho).connect(audioCtx.destination);
    osc.start(inicio);
    osc.stop(inicio + duracao + 0.02);
  }

  var SONS = {
    pouso: function (t) { tom(150, t, 0.12, 'sine', 0.25); tom(95, t + 0.05, 0.2, 'sine', 0.2); },
    acerto: function (t) { [523, 659, 784].forEach(function (f, i) { tom(f, t + i * 0.09, 0.18, 'triangle', 0.16); }); },
    quase: function (t) { tom(392, t, 0.14, 'triangle', 0.12); tom(330, t + 0.12, 0.22, 'triangle', 0.1); },
    tique: function (t) { tom(700, t, 0.06, 'sine', 0.08); },
    etapa: function (t) { [523, 659, 784, 1047].forEach(function (f, i) { tom(f, t + i * 0.1, 0.2, 'triangle', 0.14); }); }
  };

  function som(nome) {
    if (mudo || !SONS[nome]) return;
    try {
      audioCtx = audioCtx || new (global.AudioContext || global.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) { return; }
    SONS[nome](audioCtx.currentTime);
  }

  /* ------------------------------------------------
     Contrato com a página do portal
     ------------------------------------------------ */
  function conectarPortal(acoes) {
    acoes = acoes || {};
    global.addEventListener('message', function (e) {
      var tipo = typeof e.data === 'string' ? e.data : e.data && e.data.type;
      if (tipo === 'pause') { calarTudo(); if (acoes.aoPausar) acoes.aoPausar(); }
      else if (tipo === 'resume') { if (acoes.aoContinuar) acoes.aoContinuar(); }
      else if (tipo === 'mute') { mudo = true; calarTudo(); }
      else if (tipo === 'unmute') { mudo = false; }
      else if (tipo === 'restart') { calarTudo(); if (acoes.aoReiniciar) acoes.aoReiniciar(); }
    });
    var noPortal = global.parent !== global;
    return {
      pronto: function () { if (noPortal) global.parent.postMessage('game-ready', '*'); },
      enviarResultado: function (gameId, payload) {
        if (!noPortal) return;
        global.parent.postMessage({ source: 'meu-planetinha-game', type: 'game-result', gameId: gameId, payload: payload }, '*');
      }
    };
  }

  global.PlanetinhaJogo = {
    conectarPortal: conectarPortal,
    criarVoz: criarVoz,
    som: som
  };
})(window);
