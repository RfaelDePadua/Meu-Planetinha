/**
 * jogo.js — Teia Viva (Naturox · Ciências).
 *
 * Dois modos, ambos com o conteúdo como mecânica:
 * - montar: a criança liga os seres com setas que mostram para onde vai a
 *   energia (do alimento para quem come); o jogo explica cada seta errada;
 * - prever: acontece um evento ("uma seca..."), a criança prevê se cada ser
 *   marcado aumenta, diminui ou fica igual, e a simulação mostra o resultado,
 *   destacando o caminho de setas que explica cada efeito.
 *
 * Base: Hmelo-Silver et al. (2017), Dickes et al. (2016), Riopel et al. (2019);
 * ver docs/PESQUISA_JOGOS.md.
 *
 * Parâmetros para o professor (URL): ?etapa=1..5  ?tarefas=3..12  ?dupla=1
 */
(function () {
  'use strict';

  var C = window.TeiaConteudo;
  var F = C.FALAS;
  var Base = window.PlanetinhaJogo;
  var GAME_ID = 'teia-viva';
  var SAVE_KEY = 'meu-planetinha.teia-viva.v1';
  var NS = 'http://www.w3.org/2000/svg';
  var REDUZIR = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CORES_SETA = {
    pronta: '#C7D2FE', usuario: '#FFD43B', errada: '#FF6B6B', certa: '#4DFFB4',
    demo: '#67E8F9', materia: '#D6B48A', caminho: '#FFB84D'
  };

  var params = new URLSearchParams(location.search);

  function $(id) { return document.getElementById(id); }
  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
  function mesma(s, t) { return s[0] === t[0] && s[1] === t[1]; }
  function contem(lista, s) { return lista.some(function (t) { return mesma(s, t); }); }

  var app = $('app');
  var campo = $('campo');
  var svg = $('setas');

  /* ------------------------------------------------
     Progresso salvo neste dispositivo (sem dados pessoais)
     ------------------------------------------------ */
  function lerSave() {
    try {
      var salvo = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (salvo && salvo.versao === 1) return salvo;
    } catch (e) { /* armazenamento indisponível: segue sem salvar */ }
    return { versao: 1, etapa: 1, etapas: {}, estrategias: {}, sessoes: 0 };
  }

  function gravarSave() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignora */ }
  }

  var save = lerSave();

  function dominada(id) {
    var e = save.etapas[id];
    return Boolean(e && (e.dominada || (e.acertos >= 5 && e.acertos / e.tentativas >= 0.75)));
  }

  /* ------------------------------------------------
     Estado
     ------------------------------------------------ */
  var S = {
    estado: 'inicio',     // inicio | montando | prevendo | confirmando | simulando | feedback | fim
    modo: 'solo',
    total: clamp(parseInt(params.get('tarefas'), 10) || 6, 3, 12),
    indice: 0,
    etapa: 1,
    item: null,
    pos: {},
    tentativa: 1,
    setasUsuario: [],
    erradas: [],
    demo: [],
    certo: false,
    selecionada: null,
    previsoes: {},
    populacao: {},
    caminho: [],
    avaliado: false,
    resultados: [],
    recentes: [],
    historico: {},
    dominadasAntes: [],
    sequencia: 0,
    melhorSequencia: 0,
    pontos: 0,
    pausado: false,
    token: 0
  };

  function etapaAtual() { return C.ETAPAS[S.etapa - 1]; }
  function montando() { return etapaAtual().modo === 'montar'; }
  function naturalistaAtual() { return (S.indice % 2) + 1; }

  /* ------------------------------------------------
     Voz e sons
     ------------------------------------------------ */
  var voz = Base.criarVoz();
  var falar = voz.falar;
  var calar = voz.calar;
  var som = Base.som;
  var registro = Base.criarRegistro(GAME_ID);

  voz.aoMudarDisponibilidade(function (disponivel) {
    $('btn-ouvir').hidden = !disponivel;
    $('btn-ouvir-reflexao').hidden = !disponivel;
  });

  function esperar(ms) {
    var token = S.token;
    return new Promise(function (resolve) {
      setTimeout(function () { if (token === S.token) resolve(); }, REDUZIR ? Math.min(ms, 150) : ms);
    });
  }

  /* ------------------------------------------------
     Posições das cartas (frações da largura e altura do campo)
     ------------------------------------------------ */
  // Posições pensadas para que nenhuma seta atravesse uma carta.
  var POSICOES_FIXAS = {
    campo: {
      sol: [0.07, 0.5], capim: [0.24, 0.5], gafanhoto: [0.42, 0.2], prea: [0.42, 0.8],
      sapo: [0.6, 0.2], cobra: [0.76, 0.5], gaviao: [0.93, 0.8]
    },
    lobo: {
      sol: [0.08, 0.5], capim: [0.3, 0.25], lobeira: [0.3, 0.8], gafanhoto: [0.56, 0.18],
      prea: [0.56, 0.52], seriema: [0.86, 0.18], loboguara: [0.86, 0.78]
    },
    lagoa: {
      sol: [0.08, 0.5], algas: [0.3, 0.5], lambari: [0.52, 0.5], traira: [0.72, 0.2], garca: [0.92, 0.62]
    },
    solo: {
      sol: [0.08, 0.22], capim: [0.3, 0.22], gafanhoto: [0.55, 0.22], sapo: [0.82, 0.22],
      solo: [0.18, 0.78], fungos: [0.45, 0.78], restos: [0.72, 0.78]
    }
  };

  function embaralhar(lista) {
    var copia = lista.slice();
    for (var i = copia.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = copia[i]; copia[i] = copia[j]; copia[j] = t;
    }
    return copia;
  }

  // Nível trófico = maior distância a partir do Sol (só setas de energia).
  function niveis(item) {
    var nivel = {};
    item.seres.forEach(function (s) { nivel[s] = 0; });
    var energia = item.setas.filter(function (s) { return !contem(item.materia || [], s); });
    for (var volta = 0; volta < item.seres.length; volta++) {
      energia.forEach(function (s) { nivel[s[1]] = Math.max(nivel[s[1]], nivel[s[0]] + 1); });
    }
    return nivel;
  }

  function calcularPosicoes(item) {
    var pos = {};
    if (item.teia && POSICOES_FIXAS[item.teia]) {
      Object.keys(POSICOES_FIXAS[item.teia]).forEach(function (s) {
        pos[s] = { x: POSICOES_FIXAS[item.teia][s][0], y: POSICOES_FIXAS[item.teia][s][1] };
      });
      return pos;
    }
    if (item.embaralhar) {
      // Cadeia: posições em zigue-zague, em ordem sorteada (a ordem é o desafio).
      var ordem;
      do { ordem = embaralhar(item.seres); } while (ordem.join() === item.seres.join());
      ordem.forEach(function (s, i) {
        pos[s] = { x: (i + 0.5) / ordem.length, y: i % 2 ? 0.7 : 0.3 };
      });
      return pos;
    }
    // Teia: colunas por nível, da esquerda (Sol) para a direita.
    var nivel = niveis(item);
    var maximo = Math.max.apply(null, item.seres.map(function (s) { return nivel[s]; }));
    var colunas = {};
    item.seres.forEach(function (s) { (colunas[nivel[s]] = colunas[nivel[s]] || []).push(s); });
    Object.keys(colunas).forEach(function (n) {
      var coluna = colunas[n];
      coluna.forEach(function (s, i) {
        pos[s] = {
          x: 0.08 + (Number(n) / Math.max(1, maximo)) * 0.84,
          y: coluna.length === 1 ? 0.5 : 0.2 + (i / (coluna.length - 1)) * 0.6
        };
      });
    });
    return pos;
  }

  /* ------------------------------------------------
     Desenho: cartas (HTML) e setas (SVG)
     ------------------------------------------------ */
  var cartasEl = {};

  // Em campo estreito (celular), as cartas não cabem lado a lado: a teia gira,
  // com o Sol em cima e os níveis descendo, e o campo fica mais alto.
  function emPe() { return campo.clientWidth < 560; }

  function posicaoNaTela(id) {
    var p = S.pos[id];
    return emPe() ? { x: 0.12 + p.y * 0.76, y: p.x } : p;
  }

  function desenharCartas() {
    campo.classList.toggle('campo--em-pe', emPe());
    var caixa = $('cartas');
    caixa.textContent = '';
    cartasEl = {};
    var item = S.item;
    var prever = !montando();
    var perguntados = prever ? item.perguntas.map(function (p) { return p.ser; }) : [];

    item.seres.forEach(function (id) {
      var ser = C.SERES[id];
      var carta = document.createElement(prever ? 'div' : 'button');
      if (!prever) carta.type = 'button';
      carta.className = 'carta carta--' + ser.tipo;
      carta.dataset.ser = id;
      var pos = posicaoNaTela(id);
      carta.style.left = (pos.x * 100) + '%';
      carta.style.top = (pos.y * 100) + '%';
      if (S.selecionada === id) carta.classList.add('selecionada');
      if (S.estado === 'simulando' || S.avaliado) {
        if (!(id in item.efeitos)) carta.classList.add('apagada');
      }
      carta.innerHTML = '<svg aria-hidden="true"><use href="#s-' + id + '"/></svg><span class="carta__nome"></span>';
      carta.querySelector('.carta__nome').textContent = ser.nome;
      if (!prever) {
        carta.setAttribute('aria-label', ser.nome + (S.selecionada === id ? ', selecionado' : ''));
        carta.addEventListener('click', function () { tocarCarta(id); });
      }

      if (prever && id === item.alvo) {
        var evento = document.createElement('span');
        evento.className = 'carta__evento';
        evento.innerHTML = '<svg><use href="#i-' + item.direcao + '"/></svg>';
        carta.appendChild(evento);
      }

      if (prever && id in S.populacao) {
        var barra = document.createElement('div');
        barra.className = 'populacao' + (S.populacao[id] < 3 ? ' desce' : '');
        for (var i = 0; i < 5; i++) {
          var bloco = document.createElement('span');
          if (i < S.populacao[id]) bloco.className = 'cheia';
          barra.appendChild(bloco);
        }
        carta.appendChild(barra);
      }

      if (perguntados.indexOf(id) !== -1) carta.appendChild(criarPrevisao(id));
      caixa.appendChild(carta);
      cartasEl[id] = carta;
    });
    manterDentroDoCampo();
  }

  // Empurra para dentro as cartas que passam da borda do campo.
  function manterDentroDoCampo() {
    var base = campo.getBoundingClientRect();
    Object.keys(cartasEl).forEach(function (id) {
      var carta = cartasEl[id];
      var r = carta.getBoundingClientRect();
      var dx = Math.max(0, base.left + 4 - r.left) - Math.max(0, r.right - (base.right - 4));
      var dy = Math.max(0, base.top + 4 - r.top) - Math.max(0, r.bottom - (base.bottom - 4));
      if (dx) carta.style.left = 'calc(' + carta.style.left + ' + ' + dx + 'px)';
      if (dy) carta.style.top = 'calc(' + carta.style.top + ' + ' + dy + 'px)';
    });
  }

  function criarPrevisao(id) {
    var caixa = document.createElement('div');
    caixa.className = 'previsao';
    caixa.setAttribute('role', 'group');
    caixa.setAttribute('aria-label', 'O que acontece com ' + C.SERES[id].o + '?');
    var pergunta = S.item.perguntas.filter(function (p) { return p.ser === id; })[0];
    if (S.avaliado) caixa.classList.add(S.previsoes[id] === pergunta.resposta ? 'certa' : 'errada');
    ['sobe', 'desce', 'igual'].forEach(function (dir) {
      var botao = document.createElement('button');
      botao.type = 'button';
      botao.innerHTML = '<svg aria-hidden="true"><use href="#i-' + dir + '"/></svg>';
      botao.setAttribute('aria-label', C.DIRECOES[dir].texto);
      botao.setAttribute('aria-pressed', String(S.previsoes[id] === dir));
      botao.disabled = S.estado !== 'prevendo';
      if (S.avaliado && dir === pergunta.resposta && S.previsoes[id] !== dir) botao.classList.add('resposta-real');
      botao.addEventListener('click', function () { escolherPrevisao(id, dir); });
      caixa.appendChild(botao);
    });
    return caixa;
  }

  function el(tag, attrs, pai) {
    var no = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach(function (k) { no.setAttribute(k, attrs[k]); });
    if (pai) pai.appendChild(no);
    return no;
  }

  // Ponto da borda da carta na direção (dx, dy).
  function borda(caixa, dx, dy) {
    var t = Math.min(caixa.l / 2 / Math.max(Math.abs(dx), 1e-6), caixa.a / 2 / Math.max(Math.abs(dy), 1e-6));
    return { x: caixa.cx + dx * t, y: caixa.cy + dy * t };
  }

  function caixaDa(id) {
    var carta = cartasEl[id];
    var base = campo.getBoundingClientRect();
    var r = carta.getBoundingClientRect();
    return { cx: r.left - base.left + r.width / 2, cy: r.top - base.top + r.height / 2, l: r.width, a: r.height };
  }

  // Ponto de uma curva quadrática (p1 → controle → p2) na fração t.
  function pontoDaCurva(p1, c, p2, t) {
    var u = 1 - t;
    return { x: u * u * p1.x + 2 * u * t * c.x + t * t * p2.x, y: u * u * p1.y + 2 * u * t * c.y + t * t * p2.y };
  }

  // Monta o caminho da seta A → B. Se a linha reta atravessa outra carta,
  // tenta curvas cada vez mais abertas até achar um caminho livre.
  function caminhoDaSeta(s, caixas, temOposta) {
    var a = caixas[s[0]];
    var b = caixas[s[1]];
    var dx = b.cx - a.cx;
    var dy = b.cy - a.cy;
    var comprimento = Math.hypot(dx, dy) || 1;
    var ux = dx / comprimento;
    var uy = dy / comprimento;
    var outras = Object.keys(caixas).filter(function (id) { return id !== s[0] && id !== s[1]; })
      .map(function (id) { return caixas[id]; });

    function bate(c) {
      var p1 = borda(a, c.x - a.cx, c.y - a.cy);
      var p2 = borda(b, c.x - b.cx, c.y - b.cy);
      for (var t = 0.06; t <= 0.94; t += 0.04) {
        var p = pontoDaCurva(p1, c, p2, t);
        var dentro = outras.some(function (o) {
          return Math.abs(p.x - o.cx) < o.l / 2 + 2 && Math.abs(p.y - o.cy) < o.a / 2 + 2;
        });
        if (dentro) return true;
      }
      return false;
    }

    var meio = { x: (a.cx + b.cx) / 2, y: (a.cy + b.cy) / 2 };
    // Seta oposta existente: curva levemente para as duas não se sobreporem.
    var desvios = temOposta ? [22] : [0, 40, -40, 70, -70, 100, -100, 140, -140];
    var controle = meio;
    for (var i = 0; i < desvios.length; i++) {
      var c = { x: meio.x - uy * desvios[i], y: meio.y + ux * desvios[i] };
      controle = c;
      if (!bate(c)) break;
    }

    var p1 = borda(a, controle.x - a.cx, controle.y - a.cy);
    var p2 = borda(b, controle.x - b.cx, controle.y - b.cy);
    var v1 = Math.hypot(controle.x - p1.x, controle.y - p1.y) || 1;
    var v2 = Math.hypot(p2.x - controle.x, p2.y - controle.y) || 1;
    p1 = { x: p1.x + (controle.x - p1.x) / v1 * 4, y: p1.y + (controle.y - p1.y) / v1 * 4 };
    p2 = { x: p2.x - (p2.x - controle.x) / v2 * 8, y: p2.y - (p2.y - controle.y) / v2 * 8 };
    return 'M' + p1.x + ' ' + p1.y + 'Q' + controle.x + ' ' + controle.y + ' ' + p2.x + ' ' + p2.y;
  }

  function desenharSetas() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    if (!S.item) return;
    var defs = el('defs', {}, svg);
    Object.keys(CORES_SETA).forEach(function (tipo) {
      var marcador = el('marker', {
        id: 'ponta-' + tipo, viewBox: '0 0 10 10', refX: 7, refY: 5,
        markerWidth: 3.4, markerHeight: 3.4, orient: 'auto'
      }, defs);
      el('path', { d: 'M0 0L10 5L0 10z', fill: CORES_SETA[tipo] }, marcador);
    });

    var item = S.item;
    var materia = item.materia || [];
    var lista = [];
    if (montando()) {
      (item.prontas || []).forEach(function (s) { lista.push({ s: s, tipo: S.certo ? 'certa' : 'pronta' }); });
      S.setasUsuario.forEach(function (s, i) {
        var tipo = S.certo ? 'certa' : (contem(S.erradas, s) ? 'errada' : 'usuario');
        lista.push({ s: s, tipo: tipo, indice: i });
      });
      S.demo.forEach(function (s) { lista.push({ s: s, tipo: 'demo' }); });
    } else {
      item.setas.forEach(function (s) { lista.push({ s: s, tipo: contem(materia, s) ? 'materia' : 'pronta' }); });
    }
    S.caminho.forEach(function (s) { lista.push({ s: s, tipo: 'caminho' }); });

    var todas = lista.map(function (x) { return x.s; });
    var caixas = {};
    S.item.seres.forEach(function (id) { caixas[id] = caixaDa(id); });
    lista.forEach(function (x) {
      var d = caminhoDaSeta(x.s, caixas, contem(todas, [x.s[1], x.s[0]]));
      el('path', { d: d, class: 'seta seta--' + x.tipo, 'marker-end': 'url(#ponta-' + x.tipo + ')' }, svg);
      if (x.indice !== undefined && S.estado === 'montando') {
        var alvo = el('path', { d: d, class: 'seta-alvo' }, svg);
        alvo.addEventListener('click', function () { removerSeta(x.indice); });
      }
    });
  }

  function desenharHUD() {
    var etapa = etapaAtual();
    $('hud-etapa').textContent = 'Etapa ' + etapa.id + ' · ' + etapa.nome;
    var lista = $('hud-marcadores');
    lista.textContent = '';
    for (var i = 0; i < S.total; i++) {
      var ponto = document.createElement('li');
      var r = S.resultados[i];
      if (r) ponto.className = r.tipo;
      else if (i === S.indice && S.estado !== 'fim') ponto.className = 'atual';
      lista.appendChild(ponto);
    }
    var naturalista = $('hud-naturalista');
    naturalista.hidden = S.modo !== 'dupla';
    naturalista.textContent = 'Naturalista ' + naturalistaAtual() + ' investiga';
  }

  function desenharEnunciado() {
    var item = S.item;
    var etapa = etapaAtual();
    var tipo = $('tarefa-tipo');
    var texto = $('tarefa-texto');
    var legenda = 'A seta mostra para onde vai a energia: de quem é comido para quem come.';
    if (etapa.id === 1) {
      tipo.textContent = 'Cadeia alimentar';
      texto.textContent = 'Ligue os seres, começando pelo Sol.';
    } else if (etapa.modo === 'montar') {
      tipo.textContent = 'Teia alimentar';
      texto.textContent = 'Faltam ' + item.faltam.length + ' setas. Complete a teia.';
    } else {
      tipo.textContent = 'E se…?';
      texto.textContent = '';
      var evento = document.createElement('span');
      evento.className = 'evento';
      evento.textContent = item.evento;
      texto.appendChild(evento);
      if (item.materia && item.materia.length) legenda += ' Tracejada: o caminho da matéria.';
    }
    $('legenda').textContent = legenda;
  }

  function desenharTudo() {
    desenharCartas();
    desenharSetas();
    desenharHUD();
    atualizarBotoes();
  }

  function atualizarBotoes() {
    var conferir = $('btn-conferir');
    if (montando()) {
      conferir.textContent = 'Conferir';
      conferir.disabled = !S.setasUsuario.length;
      $('btn-desfazer').hidden = false;
      $('btn-desfazer').disabled = !S.setasUsuario.length;
    } else {
      conferir.textContent = 'Ver o que acontece';
      conferir.disabled = S.item.perguntas.some(function (p) { return !S.previsoes[p.ser]; });
      $('btn-desfazer').hidden = true;
    }
  }

  function definirEstado(estado) {
    S.estado = estado;
    app.dataset.estado = estado;
  }

  function mostrarControles(qual) {
    $('controles-acao').hidden = qual !== 'acao';
    $('controles-confirma').hidden = qual !== 'confirma';
    $('controles-feedback').hidden = qual !== 'feedback';
  }

  var acaoSeguir = null;

  function mostrarFeedback(tom, titulo, texto, rotuloBotao, acao) {
    var caixa = $('controles-feedback');
    caixa.dataset.tom = tom;
    $('feedback-titulo').textContent = titulo;
    $('feedback-texto').textContent = texto;
    $('btn-seguir').hidden = !rotuloBotao;
    $('btn-seguir').textContent = rotuloBotao || '';
    acaoSeguir = acao || null;
    mostrarControles('feedback');
    $('anuncio').textContent = titulo + ' ' + texto;
    if (rotuloBotao) $('btn-seguir').focus({ preventScroll: true });
  }

  var avisoTimer = null;
  function aviso(texto) {
    var no = $('aviso');
    no.textContent = texto;
    no.hidden = false;
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(function () { no.hidden = true; }, 3600);
  }

  /* ------------------------------------------------
     Fluxo
     ------------------------------------------------ */
  function escolherItem() {
    var etapa = etapaAtual();
    var chaves = etapa.itens.map(function (_, i) { return etapa.id + '-' + i; });
    var livres = chaves.filter(function (k) { return S.recentes.indexOf(k) === -1; });
    var chave = (livres.length ? livres : chaves)[Math.floor(Math.random() * (livres.length || chaves.length))];
    S.recentes.push(chave);
    if (S.recentes.length > 3) S.recentes.shift();
    S.chaveItem = chave;
    return etapa.itens[Number(chave.split('-')[1])];
  }

  function iniciarSessao(modo) {
    S.token++;
    calar();
    S.modo = modo;
    registro.iniciarSessao(modo);
    S.indice = 0;
    S.resultados = [];
    S.recentes = [];
    S.historico = {};
    S.sequencia = 0;
    S.melhorSequencia = 0;
    S.pontos = 0;
    S.etapa = clamp(parseInt(params.get('etapa'), 10) || save.etapa || 1, 1, C.ETAPAS.length);
    S.dominadasAntes = C.ETAPAS.filter(function (e) { return dominada(e.id); }).map(function (e) { return e.id; });
    S.jaInstruiu = {};
    $('tela-inicio').hidden = true;
    $('tela-fim').hidden = true;
    iniciarTarefa(null);
  }

  function iniciarTarefa(falaAntes) {
    S.token++;
    S.item = escolherItem();
    S.pos = calcularPosicoes(S.item);
    S.tentativa = 1;
    S.setasErradas = 0;
    S.previsoesErradas = 0;
    registro.iniciarItem();
    S.setasUsuario = [];
    S.erradas = [];
    S.demo = [];
    S.certo = false;
    S.selecionada = null;
    S.previsoes = {};
    S.populacao = {};
    S.caminho = [];
    S.avaliado = false;
    definirEstado(montando() ? 'montando' : 'prevendo');
    desenharEnunciado();
    desenharTudo();
    mostrarControles('acao');

    var etapa = etapaAtual();
    var falas = [falaAntes];
    if (S.modo === 'dupla') falas.push(F.naturalista(naturalistaAtual()));
    if (etapa.modo === 'montar') {
      falas.push(etapa.id === 1 ? F.instrucaoCadeia : F.instrucaoTeia);
      if (!S.jaInstruiu.montar) { S.jaInstruiu.montar = true; falas.push(F.instrucaoMontar); }
    } else {
      falas.push(S.item.evento);
      if (!S.jaInstruiu.prever) { S.jaInstruiu.prever = true; falas.push(F.instrucaoPrever); }
      voz.preCarregar(S.item.perguntas.map(function (p) { return p.explicacao; }));
    }
    falar(falas);
  }

  function falasDoEnunciado() {
    var etapa = etapaAtual();
    if (etapa.modo === 'montar') return [etapa.id === 1 ? F.instrucaoCadeia : F.instrucaoTeia, F.instrucaoMontar];
    return [S.item.evento, F.instrucaoPrever];
  }

  /* ── Montar ──────────────────────────────────────── */
  function tocarCarta(id) {
    if (S.estado !== 'montando' || S.pausado) return;
    if (!S.selecionada) {
      S.selecionada = id;
    } else if (S.selecionada === id) {
      S.selecionada = null;
    } else {
      adicionarSeta(S.selecionada, id);
      S.selecionada = null;
    }
    desenharTudo();
  }

  function adicionarSeta(a, b) {
    var seta = [a, b];
    if (contem(S.setasUsuario, seta) || contem(S.item.prontas || [], seta)) {
      aviso('Essa seta já está na teia.');
      return;
    }
    S.setasUsuario.push(seta);
    som('tique');
    $('anuncio').textContent = 'Seta de ' + C.SERES[a].nome + ' para ' + C.SERES[b].nome + '.';
  }

  function removerSeta(indice) {
    if (S.estado !== 'montando') return;
    S.setasUsuario.splice(indice, 1);
    desenharTudo();
  }

  function avaliarMontagem() {
    var item = S.item;
    var prontas = item.prontas || [];
    var erradas = S.setasUsuario.filter(function (s) { return !contem(item.setas, s); });
    var faltando = item.setas.filter(function (s) { return !contem(S.setasUsuario, s) && !contem(prontas, s); });
    if (!erradas.length && !faltando.length) { acertouMontagem(); return; }

    S.setasErradas += erradas.length;
    S.tentativa += 1;
    if (S.tentativa > 3) { demonstrarMontagem(erradas, faltando); return; }
    som('quase');
    S.erradas = erradas;
    var titulo = erradas.length ? F.temErrada : F.quaseLa;
    var partes = [];
    if (erradas.length) partes.push(C.erroSeta(erradas[0][0], erradas[0][1], item.setas));
    if (faltando.length) partes.push(F.faltaSeta(faltando.length));
    // Dicas em camadas: a seta errada já é explicada; sem ela, primeiro vem a
    // estratégia; na tentativa seguinte, o jogo aponta qual ser olhar.
    if (S.tentativa === 2 && !erradas.length) partes.push(F.dicaMontar);
    else if (S.tentativa === 3 && faltando.length) partes.push(C.quemCome(faltando[0][0]));
    definirEstado('feedback');
    desenharTudo();
    if (S.tentativa === 3 && faltando.length) pulsar(faltando[0][0]);
    mostrarFeedback('quase', titulo.replace(/\.$/, ''), partes.join(' '), 'Tentar de novo', voltarAMontar);
    falar([titulo].concat(partes));
  }

  function pulsar(id) {
    var carta = cartasEl[id];
    if (!carta) return;
    carta.classList.remove('pulsar');
    void carta.offsetWidth;
    carta.classList.add('pulsar');
  }

  function voltarAMontar() {
    S.setasUsuario = S.setasUsuario.filter(function (s) { return !contem(S.erradas, s); });
    S.erradas = [];
    definirEstado('montando');
    desenharTudo();
    mostrarControles('acao');
  }

  function acertouMontagem() {
    var primeira = S.tentativa === 1;
    registrar(primeira ? 'primeira' : 'dica');
    som('acerto');
    S.certo = true;
    definirEstado('feedback');
    desenharTudo();
    var titulo = primeira ? (etapaAtual().id === 1 ? F.certoCadeia : F.certo) : F.certoDica;
    var explicacao = C.explicacaoCadeia(S.item.faltam || S.item.setas);
    mostrarFeedback('acerto', titulo, explicacao, rotuloProximo(), proximo);
    falar([titulo, explicacao]);
  }

  function demonstrarMontagem(erradas, faltando) {
    registrar('demo');
    S.setasUsuario = S.setasUsuario.filter(function (s) { return !contem(erradas, s); });
    S.erradas = [];
    definirEstado('feedback');
    var explicacao = C.explicacaoCadeia(S.item.faltam || S.item.setas);
    mostrarFeedback('demo', 'Vamos ver juntos', explicacao, null);
    falar([F.vamosVer, explicacao]);
    // Desenha as setas que faltavam, uma de cada vez.
    faltando.reduce(function (cadeia, seta) {
      return cadeia.then(function () { return esperar(650); }).then(function () {
        S.demo.push(seta);
        som('tique');
        desenharTudo();
      });
    }, esperar(200)).then(function () {
      mostrarFeedback('demo', 'Vamos ver juntos', explicacao, rotuloProximo(), proximo);
    });
  }

  /* ── Prever ──────────────────────────────────────── */
  function escolherPrevisao(ser, dir) {
    if (S.estado !== 'prevendo' || S.pausado) return;
    S.previsoes[ser] = dir;
    som('tique');
    desenharCartas();
    atualizarBotoes();
  }

  function simular() {
    definirEstado('simulando');
    mostrarControles('none');
    calar();
    var item = S.item;
    var ordem = [item.alvo].concat(item.perguntas.map(function (p) { return p.ser; }));
    ordem.forEach(function (s) { S.populacao[s] = 3; });
    desenharTudo();
    var nivelFinal = { sobe: 5, desce: 1, igual: 3 };
    ordem.reduce(function (cadeia, ser, i) {
      return cadeia.then(function () { return esperar(i === 0 ? 400 : 850); }).then(function () {
        S.populacao[ser] = nivelFinal[item.efeitos[ser]];
        var pergunta = item.perguntas.filter(function (p) { return p.ser === ser; })[0];
        S.caminho = pergunta ? [pergunta.caminho[pergunta.caminho.length - 1]] : [];
        som('tique');
        desenharTudo();
      });
    }, Promise.resolve()).then(function () { return esperar(600); }).then(avaliarPrevisoes);
  }

  function avaliarPrevisoes() {
    var item = S.item;
    var erradas = item.perguntas.filter(function (p) { return S.previsoes[p.ser] !== p.resposta; });
    var acertos = item.perguntas.length - erradas.length;
    var resultado = !erradas.length ? 'primeira' : (acertos ? 'dica' : 'demo');
    S.previsoesErradas = erradas.length;
    registrar(resultado);
    S.avaliado = true;
    definirEstado('feedback');

    var titulo;
    var explicacoes;
    if (!erradas.length) {
      som('acerto');
      var ultima = item.perguntas[item.perguntas.length - 1];
      S.caminho = ultima.caminho;
      titulo = F.previsaoCerta;
      explicacoes = [ultima.explicacao];
    } else {
      som('quase');
      S.caminho = [];
      erradas.forEach(function (p) {
        p.caminho.forEach(function (s) { if (!contem(S.caminho, s)) S.caminho.push(s); });
      });
      titulo = 'Veja o que aconteceu de verdade';
      explicacoes = erradas.slice(0, 2).map(function (p) { return p.explicacao; });
    }
    desenharTudo();
    mostrarFeedback(erradas.length ? 'quase' : 'acerto', titulo, explicacoes.join(' '), rotuloProximo(), proximo);
    falar([erradas.length ? F.previsaoParte : F.previsaoCerta].concat(explicacoes));
  }

  /* ── Comum ───────────────────────────────────────── */
  function pedirConferir() {
    var estado = S.estado;
    if ((estado !== 'montando' && estado !== 'prevendo') || S.pausado || $('btn-conferir').disabled) return;
    if (S.modo === 'dupla') {
      S.estadoAntes = estado;
      definirEstado('confirmando');
      var parceiro = naturalistaAtual() === 1 ? 2 : 1;
      $('confirma-texto').textContent = 'Naturalista ' + parceiro + ', você concorda?';
      mostrarControles('confirma');
      $('btn-confirmar').focus({ preventScroll: true });
      falar(F.confirma(parceiro));
      return;
    }
    conferir(estado);
  }

  function conferir(estado) {
    S.selecionada = null;
    if (estado === 'montando') avaliarMontagem();
    else simular();
  }

  function registrar(tipo) {
    var primeira = tipo === 'primeira';
    S.resultados[S.indice] = { tipo: tipo, etapa: S.etapa };
    var historico = S.historico[S.etapa] = S.historico[S.etapa] || [];
    historico.push(primeira);
    var reg = save.etapas[S.etapa] = save.etapas[S.etapa] || { tentativas: 0, acertos: 0 };
    reg.tentativas += 1;
    if (primeira) reg.acertos += 1;
    if (historico.length >= 3 && historico.slice(-3).every(Boolean)) reg.dominada = true;
    S.sequencia = primeira ? S.sequencia + 1 : 0;
    S.melhorSequencia = Math.max(S.melhorSequencia, S.sequencia);
    S.pontos += primeira ? 100 : (tipo === 'dica' ? 50 : 10);
    gravarSave();
    desenharHUD();

    // Registro anônimo (professores/registro.html). Montar: erro = setas erradas
    // somadas nas tentativas. Prever (uma tentativa, sem dicas): erro = previsões
    // erradas de quantas, e o resultado vira primeira / parcial / errou.
    var prever = !montando();
    registro.item({
      etapa: S.etapa,
      item: S.chaveItem,
      resultado: prever ? { primeira: 'primeira', dica: 'parcial', demo: 'errou' }[tipo] : tipo,
      tentativas: prever ? 1 : (tipo === 'demo' ? S.tentativa - 1 : S.tentativa),
      dicas: prever ? 0 : Math.min(S.tentativa - 1, 2),
      erro: prever ? S.previsoesErradas + ' de ' + S.item.perguntas.length : S.setasErradas
    });
  }

  function rotuloProximo() { return S.indice + 1 >= S.total ? 'Ver resultado' : 'Próxima tarefa'; }

  // Sobe de etapa após 3 acertos de primeira seguidos; volta após 3 tarefas sem acerto.
  function adaptar() {
    var h = S.historico[S.etapa] || [];
    var ultimos = h.slice(-3);
    if (ultimos.length < 3) return null;
    if (ultimos.every(Boolean) && S.etapa < C.ETAPAS.length) {
      S.etapa += 1;
      S.historico[S.etapa] = [];
      return 'sobe';
    }
    if (!ultimos.some(Boolean) && S.etapa > 1) {
      S.etapa -= 1;
      S.historico[S.etapa] = [];
      return 'desce';
    }
    return null;
  }

  function proximo() {
    S.indice += 1;
    if (S.indice >= S.total) { finalizar(); return; }
    var mudanca = adaptar();
    var fala = null;
    if (mudanca === 'sobe') {
      som('etapa');
      aviso('Nova etapa: ' + etapaAtual().nome + '!');
      fala = F.novaEtapa(etapaAtual());
    } else if (mudanca === 'desce') {
      aviso('Vamos treinar mais um pouco: ' + etapaAtual().nome + '.');
      fala = F.treinar;
    }
    iniciarTarefa(fala);
  }

  function finalizar() {
    S.token++;
    definirEstado('fim');
    save.sessoes += 1;
    save.etapa = S.etapa;
    gravarSave();
    desenharHUD();
    registro.fim({ etapa: S.etapa });

    var primeira = S.resultados.filter(function (r) { return r.tipo === 'primeira'; }).length;
    var ajuda = S.resultados.filter(function (r) { return r.tipo === 'dica'; }).length;
    var resumo = $('fim-resumo');
    resumo.textContent = '';
    [[primeira + ' de ' + S.total, 'de primeira'], [String(ajuda), 'com ajuda'], [String(S.total), 'tarefas']]
      .forEach(function (par) {
        var bloco = document.createElement('div');
        var forte = document.createElement('strong');
        forte.textContent = par[0];
        var rotulo = document.createElement('span');
        rotulo.textContent = par[1];
        bloco.appendChild(forte);
        bloco.appendChild(rotulo);
        resumo.appendChild(bloco);
      });

    var lista = $('fim-etapas');
    lista.textContent = '';
    var novas = [];
    C.ETAPAS.forEach(function (etapa) {
      var feita = dominada(etapa.id);
      var registro = save.etapas[etapa.id];
      if (feita && S.dominadasAntes.indexOf(etapa.id) === -1) novas.push(etapa);
      var li = document.createElement('li');
      li.className = feita ? 'dominada' : (registro ? 'praticando' : '');
      if (feita) {
        li.innerHTML = '<svg><use href="#i-check"/></svg>';
      } else {
        var marcador = document.createElement('span');
        marcador.className = 'marcador';
        li.appendChild(marcador);
      }
      var nome = document.createElement('span');
      nome.textContent = etapa.nome;
      var estado = document.createElement('small');
      estado.textContent = feita ? 'dominada' : (registro ? 'praticando' : 'a descobrir');
      li.appendChild(nome);
      li.appendChild(estado);
      lista.appendChild(li);
    });

    var novo = $('fim-dominio-novo');
    novo.hidden = !novas.length;
    if (novas.length) novo.textContent = 'Agora você sabe ' + novas[novas.length - 1].dominio + '!';

    document.querySelectorAll('[data-estrategia]').forEach(function (b) { b.classList.remove('escolhida'); b.disabled = false; });
    $('fim-obrigado').hidden = true;
    $('tela-fim').hidden = false;
    $('btn-de-novo').focus({ preventScroll: true });

    falar([F.fim, novas.length ? F.dominio(novas[novas.length - 1]) : null, F.pergunta]);

    portal.enviarResultado(GAME_ID, {
      score: S.pontos,
      correct: primeira,
      incorrect: S.total - primeira,
      bestCombo: S.melhorSequencia,
      completed: true,
      etapa: S.etapa
    });
  }

  function voltarAoInicio() {
    S.token++;
    calar();
    definirEstado('inicio');
    S.item = null;
    $('cartas').textContent = '';
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var etapa = C.ETAPAS[clamp(parseInt(params.get('etapa'), 10) || save.etapa || 1, 1, C.ETAPAS.length) - 1];
    $('inicio-etapa').textContent = 'Etapa ' + etapa.id + ' de ' + C.ETAPAS.length + ': ' + etapa.nome;
    $('tela-fim').hidden = true;
    $('tela-inicio').hidden = false;
    (params.get('dupla') === '1' ? $('btn-dupla') : $('btn-solo')).focus({ preventScroll: true });
  }

  /* ------------------------------------------------
     Entrada
     ------------------------------------------------ */
  $('btn-conferir').addEventListener('click', pedirConferir);
  $('btn-desfazer').addEventListener('click', function () {
    if (S.estado !== 'montando' || !S.setasUsuario.length) return;
    S.setasUsuario.pop();
    desenharTudo();
  });
  $('btn-confirmar').addEventListener('click', function () {
    if (S.estado === 'confirmando') conferir(S.estadoAntes);
  });
  $('btn-mudar').addEventListener('click', function () {
    if (S.estado !== 'confirmando') return;
    definirEstado(S.estadoAntes);
    desenharTudo();
    mostrarControles('acao');
  });
  $('btn-seguir').addEventListener('click', function () {
    if (S.estado === 'feedback' && acaoSeguir) acaoSeguir();
  });
  $('btn-ouvir').addEventListener('click', function () { if (S.item) falar(falasDoEnunciado()); });
  $('btn-solo').addEventListener('click', function () { iniciarSessao('solo'); });
  $('btn-dupla').addEventListener('click', function () { iniciarSessao('dupla'); });
  $('btn-de-novo').addEventListener('click', voltarAoInicio);

  $('btn-ouvir-reflexao').addEventListener('click', function () {
    falar([F.pergunta].concat(C.ESTRATEGIAS.map(F.estrategia)));
  });
  C.ESTRATEGIAS.forEach(function (estrategia) {
    var botao = document.createElement('button');
    botao.type = 'button';
    botao.dataset.estrategia = estrategia.id;
    botao.innerHTML = '<svg><use href="#' + estrategia.icone + '"/></svg>';
    botao.appendChild(document.createTextNode(estrategia.texto));
    botao.addEventListener('click', function () {
      save.estrategias[estrategia.id] = (save.estrategias[estrategia.id] || 0) + 1;
      gravarSave();
      registro.estrategia(estrategia.id);
      document.querySelectorAll('[data-estrategia]').forEach(function (b) {
        b.classList.toggle('escolhida', b === botao);
        b.disabled = true;
      });
      $('fim-obrigado').hidden = false;
      falar(F.obrigado);
    });
    $('fim-opcoes').appendChild(botao);
  });

  var portal = Base.conectarPortal({
    aoPausar: function () { S.pausado = true; $('tela-pausa').hidden = false; },
    aoContinuar: function () { S.pausado = false; $('tela-pausa').hidden = true; },
    aoReiniciar: function () { S.pausado = false; $('tela-pausa').hidden = true; voltarAoInicio(); }
  });

  // Ao mudar o tamanho, redesenha tudo (a teia pode girar entre deitada e em pé).
  function redesenhar() { if (S.item) { desenharCartas(); desenharSetas(); } }
  if ('ResizeObserver' in window) new ResizeObserver(redesenhar).observe(campo);
  else window.addEventListener('resize', redesenhar);

  Base.barraDoProfessor(GAME_ID);
  voltarAoInicio();
  portal.pronto();
})();
