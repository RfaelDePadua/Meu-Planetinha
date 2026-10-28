/**
 * jogo-base.js — peças comuns aos jogos do Meu Planetinha.
 *
 * - voz: toca os mp3 gerados por ferramentas/gerar-falas.ps1 (índice em
 *   audio/falas.json); se faltar algum, usa a melhor voz pt-BR do navegador;
 * - sons curtos sintetizados (sem arquivos);
 * - contrato com a página do portal (jogos/jogar.html): pronto, pausa, som,
 *   reinício e resultado;
 * - uso na escola: registro anônimo das jogadas (exportado em
 *   professores/registro.html), "Nova dupla" para aparelhos compartilhados e
 *   preparo para usar sem internet (com o service worker /sw.js).
 */
(function (global) {
  'use strict';

  var mudo = false;
  var vozes = [];

  /* ------------------------------------------------
     Voz
     ------------------------------------------------ */
  // Vozes "Natural"/"Online" (Edge) e Google soam bem melhor que as do sistema.
  function notaDaVoz(v, preferida) {
    return (preferida.test(v.lang) ? 10 : 0) + (/natural|neural|online/i.test(v.name) ? 5 : 0) +
      (/google/i.test(v.name) ? 3 : 0);
  }

  // Frases em inglês vêm marcadas: "en:" (normal) ou "en-lento:" (devagar).
  function lerFala(fala) {
    var m = /^en(-lento)?:(.*)$/.exec(fala);
    return m ? { texto: m[2], ingles: true, lento: Boolean(m[1]) } : { texto: fala, ingles: false, lento: false };
  }

  function criarVoz(config) {
    var pasta = (config && config.pasta) || 'audio/';
    var manifesto = null;
    var vozNavegador = null;
    var vozIngles = null;
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

    function melhorVoz(todas, prefixo, preferida) {
      var lista = todas.filter(function (v) { return prefixo.test(v.lang); });
      lista.sort(function (a, b) { return notaDaVoz(b, preferida) - notaDaVoz(a, preferida); });
      return lista[0] || null;
    }

    function carregarVozes() {
      var todas = global.speechSynthesis.getVoices();
      vozNavegador = melhorVoz(todas, /^pt/i, /^pt[-_]BR/i);
      vozIngles = melhorVoz(todas, /^en/i, /^en[-_]US/i);
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

    function falarNavegador(bruta) {
      var f = lerFala(bruta);
      var vozEscolhida = f.ingles ? vozIngles : vozNavegador;
      if (!vozEscolhida) return Promise.resolve();
      return new Promise(function (resolve) {
        var fala = new SpeechSynthesisUtterance(f.texto);
        fala.voice = vozEscolhida;
        fala.lang = vozEscolhida.lang;
        fala.rate = f.lento ? 0.7 : 1;
        fala.onend = fala.onerror = function () { resolve(); };
        setTimeout(resolve, 1500 + f.texto.length * (f.lento ? 130 : 90)); // algumas vozes não avisam o fim
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
        if (!audios.every(Boolean)) {
          // Sem algum áudio gravado: voz do navegador, frase a frase (cada uma na sua língua).
          return falas.reduce(function (cadeia, fala) {
            return cadeia.then(function () { return atual === token ? falarNavegador(fala) : null; });
          }, Promise.resolve());
        }
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
      else if (tipo === 'mute') { mudo = true; calarTudo(); if (acoes.aoSilenciar) acoes.aoSilenciar(true); }
      else if (tipo === 'unmute') { mudo = false; if (acoes.aoSilenciar) acoes.aoSilenciar(false); }
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

  /* ------------------------------------------------
     Uso na escola: registro anônimo, nova dupla e uso sem internet
     ------------------------------------------------ */
  var CHAVE_REGISTRO = 'meu-planetinha.registro.v1';
  var CHAVE_DUPLA = 'meu-planetinha.dupla.v1';
  var CHAVE_APARELHO = 'meu-planetinha.aparelho.v1';
  var PREFIXO_OFFLINE = 'meu-planetinha.offline.';
  var CACHE = 'meu-planetinha-v1';
  var LIMITE_REGISTRO = 8000;
  var CODIGO_VALIDO = /^(?=.*\d)[A-Z0-9-]{1,12}$/;

  // Raiz do site, a partir do endereço deste arquivo (jogos/comum/jogo-base.js).
  var RAIZ = (function () {
    var script = global.document.currentScript;
    return new URL('../../', script ? script.src : global.location.href).href;
  })();

  function lerLocal(chave, padrao) {
    try {
      var valor = JSON.parse(global.localStorage.getItem(chave));
      return valor === null || valor === undefined ? padrao : valor;
    } catch (e) { return padrao; }
  }

  function gravarLocal(chave, valor) {
    try { global.localStorage.setItem(chave, JSON.stringify(valor)); return true; } catch (e) { return false; }
  }

  function idCurto() { return Math.random().toString(36).slice(2, 8); }

  // Identifica o aparelho (não a pessoa), para juntar planilhas de vários computadores.
  function aparelho() {
    var id = lerLocal(CHAVE_APARELHO, null);
    if (!id) { id = idCurto(); gravarLocal(CHAVE_APARELHO, id); }
    return id;
  }

  function duplaAtual() { return lerLocal(CHAVE_DUPLA, null) || { codigo: '' }; }

  // Registro das jogadas, só neste aparelho: uma linha por tarefa resolvida e
  // uma por sessão terminada. Sem nomes: a dupla aparece pelo código que o
  // professor digitou em "Nova dupla". Exportado em professores/registro.html.
  function criarRegistro(jogo) {
    var sessao = '';
    var modo = 'solo';
    var inicioItem = 0;

    function linha(tipo, dados) {
      var l = {
        t: Date.now(), aparelho: aparelho(), dupla: duplaAtual().codigo || '', sessao: sessao,
        jogo: jogo, modo: modo, registro: tipo
      };
      Object.keys(dados || {}).forEach(function (k) { l[k] = dados[k]; });
      return l;
    }

    function anotar(l) {
      var lista = lerLocal(CHAVE_REGISTRO, []);
      if (!Array.isArray(lista)) lista = [];
      lista.push(l);
      if (lista.length > LIMITE_REGISTRO) lista = lista.slice(-LIMITE_REGISTRO);
      gravarLocal(CHAVE_REGISTRO, lista);
    }

    return {
      iniciarSessao: function (m) { sessao = idCurto(); modo = m || 'solo'; },
      iniciarItem: function () { inicioItem = Date.now(); },
      // dados: etapa, item, resultado (primeira | dica | demo…), tentativas, dicas, erro
      item: function (dados) {
        var l = linha('item', dados);
        l.tempo_s = inicioItem ? Math.round((Date.now() - inicioItem) / 1000) : '';
        anotar(l);
      },
      fim: function (dados) { anotar(linha('fim', dados)); },
      // A pergunta "Como você descobriu?" vem depois do fim: completa a linha da sessão.
      estrategia: function (id) {
        var lista = lerLocal(CHAVE_REGISTRO, []);
        for (var i = lista.length - 1; i >= 0; i--) {
          if (lista[i].registro === 'fim' && lista[i].sessao === sessao && lista[i].jogo === jogo) {
            lista[i].estrategia = id;
            gravarLocal(CHAVE_REGISTRO, lista);
            return;
          }
        }
      }
    };
  }

  // Próxima dupla começa do zero em todos os jogos deste aparelho. Ficam o
  // registro das jogadas, o código do aparelho e o preparo para usar sem internet.
  function novaDupla(codigo) {
    try {
      var apagar = [];
      for (var i = 0; i < global.localStorage.length; i++) {
        var chave = global.localStorage.key(i);
        if (/^meu-planetinha\./.test(chave) && chave.indexOf(PREFIXO_OFFLINE) !== 0 &&
            [CHAVE_REGISTRO, CHAVE_DUPLA, CHAVE_APARELHO].indexOf(chave) === -1) apagar.push(chave);
      }
      apagar.forEach(function (chave) { global.localStorage.removeItem(chave); });
    } catch (e) { /* armazenamento indisponível */ }
    gravarLocal(CHAVE_DUPLA, { codigo: codigo || '', desde: Date.now() });
  }

  var registroSW = null;

  function registrarServiceWorker() {
    if (registroSW) return registroSW;
    if (!('serviceWorker' in global.navigator) || !/^https?:$/.test(global.location.protocol)) {
      registroSW = Promise.resolve(null);
      return registroSW;
    }
    registroSW = global.navigator.serviceWorker.register(RAIZ + 'sw.js', { scope: RAIZ })
      .catch(function () { return null; });
    return registroSW;
  }

  // Páginas e peças do portal, para abrir o site sem internet pela página inicial
  // ou pelo Explorar (caminhos a partir da raiz do site).
  var PORTAL = [
    '', 'index.html', 'explorar/explorar.html', 'sobre_nos/sobre_nos.html', 'professores/index.html',
    'components/nav.html', 'components/footer.html', 'components/components.js', 'components/components.css',
    'estilos/reset.css', 'estilos/base.css', 'estilos/animacoes.css', 'estilos/layout.css', 'estilos/componentes.css',
    'estilos/cards.css', 'estilos/pages/page-shell.css', 'estilos/pages/homepage.css', 'estilos/pages/explore.css',
    'estilos/pages/jogar.css', 'estilos/pages/sobre_nos.css',
    'scripts/animacoes.js', 'scripts/homepage.js', 'scripts/games.js', 'scripts/explore.js',
    'scripts/progress.js?v=3', 'scripts/jogar.js?v=3',
    'midia/planetinha-mark.svg', 'midia/planet-calculon.webp', 'midia/planet-letrion.webp',
    'midia/planet-naturox.webp', 'midia/planet-terramund.webp', 'midia/planet-globish.webp'
  ];

  // Endereços já carregados por esta página e, dentro do portal, pela página de fora.
  function enderecosCarregados(janela) {
    try {
      return janela.performance.getEntriesByType('resource').map(function (e) { return e.name; })
        .concat([janela.location.href]);
    } catch (e) { return []; }
  }

  function baixarPara(cache, url) {
    var endereco = new URL(url);
    // Arquivos de fonte são sempre pedidos com CORS (uma cópia "opaca" não serve);
    // a folha de estilo das fontes é pedida sem CORS, como faz o <link>.
    var pedido = endereco.origin === global.location.origin ? fetch(url, { cache: 'no-cache' })
      : fetch(url, { mode: endereco.hostname === 'fonts.gstatic.com' ? 'cors' : 'no-cors' });
    return pedido.then(function (resp) {
      if (!resp || (!resp.ok && resp.type !== 'opaque')) throw new Error('falhou: ' + url);
      if (!resp.redirected) return cache.put(url, resp);
      // Resposta que veio de um redirecionamento não serve para abrir página: guarda limpa.
      return resp.blob().then(function (corpo) {
        return cache.put(url, new Response(corpo, {
          status: 200, headers: { 'Content-Type': resp.headers.get('Content-Type') || 'text/html; charset=utf-8' }
        }));
      });
    });
  }

  // Baixa tudo o que o jogo usa (páginas, código, áudios, fontes) para o cache
  // do service worker. aoProgresso(feitos, total).
  function prepararSemInternet(jogo, aoProgresso) {
    if (!('caches' in global)) return Promise.reject(new Error('sem-cache'));
    var pasta = new URL('./', global.location.href).href;
    var lista = [];
    function incluir(url) {
      if (!url || !/^https?:/.test(url) || /\/sw\.js(\?|$)/.test(url)) return;
      url = url.split('#')[0];
      if (lista.indexOf(url) === -1) lista.push(url);
    }
    ['', 'index.html', 'estilo.css', 'conteudo.js', 'jogo.js', 'audio/falas.json'].forEach(function (rel) { incluir(pasta + rel); });
    ['jogos/comum/jogo-base.js', 'jogos/comum/base.css', 'jogos/jogar.html',
      'professores/registro.html', 'professores/impressao.css'].concat(PORTAL)
      .forEach(function (rel) { incluir(RAIZ + rel); });
    enderecosCarregados(global).forEach(incluir);
    if (global.parent !== global) enderecosCarregados(global.parent).forEach(incluir);

    return registrarServiceWorker()
      .then(function () {
        return fetch(pasta + 'audio/falas.json', { cache: 'no-cache' })
          .then(function (r) { return r.ok ? r.json() : {}; })
          .catch(function () { return {}; });
      })
      .then(function (manifesto) {
        Object.keys(manifesto).forEach(function (fala) { incluir(pasta + 'audio/' + manifesto[fala]); });
        return caches.open(CACHE);
      })
      .then(function (cache) {
        var total = lista.length;
        var feitos = 0;
        var falhas = 0;
        var fila = lista.slice();
        function proximo() {
          var url = fila.shift();
          if (!url) return Promise.resolve();
          // Áudios nunca mudam (o nome vem do texto): se já está guardado, pula.
          var tarefa = /\.mp3$/i.test(url)
            ? cache.match(url).then(function (r) { return r || baixarPara(cache, url); })
            : baixarPara(cache, url);
          return tarefa.catch(function () { falhas += 1; }).then(function () {
            feitos += 1;
            if (aoProgresso) aoProgresso(feitos, total);
            return proximo();
          });
        }
        var trabalhadores = [];
        for (var i = 0; i < 6; i++) trabalhadores.push(proximo());
        return Promise.all(trabalhadores).then(function () {
          if (global.navigator.storage && global.navigator.storage.persist) {
            global.navigator.storage.persist().catch(function () { /* o navegador decide */ });
          }
          if (!falhas) gravarLocal(PREFIXO_OFFLINE + jogo, { quando: Date.now(), arquivos: total });
          return { total: total, falhas: falhas };
        });
      });
  }

  function dataCurta(ms) {
    var d = new Date(ms);
    return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2);
  }

  // Caixa "Para o professor" na tela inicial do jogo: código da dupla, nova
  // dupla, preparo para usar sem internet e o caminho para baixar o registro.
  function barraDoProfessor(jogo) {
    var painel = global.document.querySelector('#tela-inicio .painel');
    if (!painel) return;
    var caixa = global.document.createElement('details');
    caixa.className = 'professor';
    caixa.innerHTML =
      '<summary>Para o professor <span class="professor__dupla"></span></summary>' +
      '<div class="professor__corpo">' +
      '  <div class="professor__acoes">' +
      '    <button type="button" class="professor__btn" data-acao="nova-dupla">Nova dupla</button>' +
      '    <button type="button" class="professor__btn" data-acao="offline">Preparar para usar sem internet</button>' +
      '  </div>' +
      '  <form class="professor__form" hidden>' +
      '    <label for="professor-codigo">Código da dupla (opcional, sem nomes)</label>' +
      '    <input id="professor-codigo" name="codigo" maxlength="12" autocomplete="off" spellcheck="false" placeholder="ex.: 4A-07">' +
      '    <p class="professor__nota">A próxima dupla começa do início em todos os jogos deste aparelho. ' +
      'O registro das jogadas continua guardado.</p>' +
      '    <div class="professor__acoes">' +
      '      <button type="submit" class="professor__btn professor__btn--forte">Começar do zero</button>' +
      '      <button type="button" class="professor__btn" data-acao="cancelar">Cancelar</button>' +
      '    </div>' +
      '  </form>' +
      '  <p class="professor__status" role="status" aria-live="polite"></p>' +
      '  <p class="professor__nota">Registro das jogadas: <a target="_blank" rel="noopener" href="' +
      RAIZ + 'professores/registro.html">baixar a planilha deste aparelho</a>.</p>' +
      '</div>';
    painel.appendChild(caixa);

    function $(sel) { return caixa.querySelector(sel); }
    var form = $('.professor__form');
    var status = $('.professor__status');
    var botaoOffline = $('[data-acao="offline"]');

    function mostrarDupla() {
      var codigo = duplaAtual().codigo;
      $('.professor__dupla').textContent = codigo ? '· dupla ' + codigo : '';
    }

    function mostrarOffline() {
      var preparo = lerLocal(PREFIXO_OFFLINE + jogo, null);
      status.textContent = preparo ? 'Este jogo já foi preparado para usar sem internet (' + dataCurta(preparo.quando) + ').' : '';
    }

    $('[data-acao="nova-dupla"]').addEventListener('click', function () {
      form.hidden = false;
      form.elements.codigo.value = '';
      form.elements.codigo.focus();
      status.textContent = '';
    });
    $('[data-acao="cancelar"]').addEventListener('click', function () { form.hidden = true; mostrarOffline(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var codigo = form.elements.codigo.value.trim().toUpperCase();
      if (codigo && !CODIGO_VALIDO.test(codigo)) {
        status.textContent = 'Use só letras, números e hífen, com pelo menos um número (ex.: 4A-07). Não escreva nomes.';
        form.elements.codigo.focus();
        return;
      }
      novaDupla(codigo);
      global.location.reload();
    });

    botaoOffline.addEventListener('click', function () {
      botaoOffline.disabled = true;
      status.textContent = 'Preparando…';
      prepararSemInternet(jogo, function (feitos, total) {
        status.textContent = 'Baixando ' + feitos + ' de ' + total + ' arquivos…';
      }).then(function (r) {
        status.textContent = r.falhas
          ? 'Faltaram ' + r.falhas + ' de ' + r.total + ' arquivos. Confira a internet e toque de novo.'
          : 'Pronto: este jogo funciona sem internet neste aparelho.';
      }).catch(function () {
        status.textContent = 'Este navegador não consegue guardar o jogo para usar sem internet.';
      }).then(function () { botaoOffline.disabled = false; });
    });

    mostrarDupla();
    mostrarOffline();
  }

  registrarServiceWorker();

  global.PlanetinhaJogo = {
    conectarPortal: conectarPortal,
    criarVoz: criarVoz,
    som: som,
    criarRegistro: criarRegistro,
    barraDoProfessor: barraDoProfessor,
    prepararSemInternet: prepararSemInternet
  };
})(window);
