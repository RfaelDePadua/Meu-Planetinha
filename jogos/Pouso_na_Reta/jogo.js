/**
 * jogo.js — Pouso na Reta (Calculon · Matemática).
 *
 * A criança move a nave sobre a pista (uma reta numérica) e pousa onde acha
 * que fica o número pedido. O ponto de pouso É a resposta: não existe pergunta
 * por cima do jogo. Ao errar, recebe primeiro uma dica e a régua; se errar de
 * novo, vê uma demonstração contando as partes.
 *
 * Base: Fazio, Kennedy & Siegler (2016) e demais fontes em docs/PESQUISA_JOGOS.md.
 *
 * Parâmetros para o professor (URL): ?etapa=1..5  ?pousos=4..20  ?dupla=1
 */
(function () {
  'use strict';

  var C = window.PousoConteudo;
  var F = C.FALAS;
  var GAME_ID = 'pouso-na-reta';
  var SAVE_KEY = 'meu-planetinha.pouso-na-reta.v1';
  var NS = 'http://www.w3.org/2000/svg';
  var PERFEITO = 0.025;         // erro máximo (fração da pista) para "pouso perfeito"
  var PASSO_TECLADO = 0.01;     // cada seta move 1% da pista
  var REDUZIR = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var params = new URLSearchParams(location.search);

  function $(id) { return document.getElementById(id); }
  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

  var app = $('app');
  var cena = $('cena');
  var svg = $('svg');

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

  // Dominada: subiu de etapa (3 acertos de primeira seguidos) ou acumulou
  // pelo menos 5 acertos de primeira com 75% de aproveitamento.
  function dominada(id) {
    var e = save.etapas[id];
    return Boolean(e && (e.dominada || (e.acertos >= 5 && e.acertos / e.tentativas >= 0.75)));
  }

  /* ------------------------------------------------
     Estado
     ------------------------------------------------ */
  var S = {
    estado: 'inicio',   // inicio | mirando | confirmando | animando | feedback | fim
    modo: 'solo',
    total: clamp(parseInt(params.get('pousos'), 10) || 10, 4, 20),
    indice: 0,
    etapa: 1,
    item: null,
    tentativa: 1,
    naveV: 0,           // posição da nave, em unidades da reta
    naveY: 0,           // 0 = no alto, 1 = na pista
    reguaVisivel: false,
    contagem: 0,        // partes já destacadas na revelação
    alvoRevelado: false,
    fantasma: null,     // onde pousou na tentativa anterior
    resultados: [],
    recentes: [],
    historico: {},
    dominadasAntes: [],
    sequencia: 0,
    melhorSequencia: 0,
    pontos: 0,
    pausado: false,
    token: 0           // invalida animações antigas ao reiniciar
  };

  function etapaAtual() { return C.ETAPAS[S.etapa - 1]; }
  function maxPista() { return S.item ? S.item.max : 1; }

  /* ------------------------------------------------
     Voz e sons (jogos/comum/jogo-base.js)
     ------------------------------------------------ */
  var Base = window.PlanetinhaJogo;
  var voz = Base.criarVoz();
  var falar = voz.falar;
  var calar = voz.calar;
  var preCarregar = voz.preCarregar;
  var som = Base.som;
  var registro = Base.criarRegistro(GAME_ID);

  voz.aoMudarDisponibilidade(function (disponivel) {
    $('btn-ouvir').hidden = !disponivel;
    $('btn-ouvir-reflexao').hidden = !disponivel;
  });

  /* ------------------------------------------------
     Animação (cancelável por token)
     ------------------------------------------------ */
  function suave(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }

  function animar(duracao, passo) {
    var token = S.token;
    duracao = REDUZIR ? Math.min(duracao, 120) : duracao;
    return new Promise(function (resolve) {
      var inicio = performance.now();
      function quadro(agora) {
        if (token !== S.token) return;
        var p = Math.min(1, (agora - inicio) / duracao);
        passo(suave(p));
        if (p < 1) requestAnimationFrame(quadro); else resolve();
      }
      requestAnimationFrame(quadro);
    });
  }

  function esperar(ms) {
    var token = S.token;
    return new Promise(function (resolve) {
      setTimeout(function () { if (token === S.token) resolve(); }, REDUZIR ? Math.min(ms, 150) : ms);
    });
  }

  /* ------------------------------------------------
     Layout e desenho da cena (SVG)
     ------------------------------------------------ */
  var L = {};
  var ESTRELAS = (function () {
    var semente = 7;
    function aleatorio() { semente = (semente * 16807) % 2147483647; return semente / 2147483647; }
    var lista = [];
    for (var i = 0; i < 42; i++) lista.push([aleatorio(), aleatorio() * 0.7, 0.6 + aleatorio(), 0.25 + aleatorio() * 0.5]);
    return lista;
  })();

  function medir() {
    var caixa = cena.getBoundingClientRect();
    L.w = Math.max(280, caixa.width);
    L.h = Math.max(160, caixa.height);
    var margem = clamp(L.w * 0.07, 34, 80);
    L.x0 = margem;
    L.x1 = L.w - margem;
    L.yPista = Math.round(L.h - Math.max(76, L.h * 0.26));
    L.escala = clamp(Math.min(L.w / 900, L.h / 300), 0.7, 1.15);
    L.yAlto = Math.max(62 * L.escala, (L.yPista - 58 * L.escala) * 0.42 + 58 * L.escala);
    svg.setAttribute('viewBox', '0 0 ' + L.w + ' ' + L.h);
  }

  function xDe(v) { return L.x0 + (v / maxPista()) * (L.x1 - L.x0); }
  function vDe(x) { return clamp((x - L.x0) / (L.x1 - L.x0), 0, 1) * maxPista(); }

  function el(tag, attrs, pai) {
    var no = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { no.setAttribute(k, attrs[k]); });
    if (pai) pai.appendChild(no);
    return no;
  }

  function txt(pai, x, y, conteudo, attrs) {
    var no = el('text', Object.assign({ x: x, y: y, 'text-anchor': 'middle' }, attrs), pai);
    no.textContent = conteudo;
    return no;
  }

  // Desenha um rótulo ({a,b} empilhado ou {t}) ou uma sequência deles, centralizado em x.
  function rotuloSVG(pai, partes, x, topo, tamanho, cor) {
    partes = Array.isArray(partes) ? partes : [partes];
    var larguras = partes.map(function (p) {
      if (p.t !== undefined) return p.t.length * tamanho * 0.56 + 6;
      return Math.max(String(p.a).length, String(p.b).length) * tamanho * 0.62 + 10;
    });
    var total = larguras.reduce(function (s, l) { return s + l; }, 0);
    var cursor = x - total / 2;
    var estilo = { fill: cor, 'font-family': "'Baloo 2', 'Trebuchet MS', sans-serif", 'font-weight': 800 };
    partes.forEach(function (p, i) {
      var cx = cursor + larguras[i] / 2;
      if (p.t !== undefined) {
        txt(pai, cx, topo + tamanho * 1.2, p.t, Object.assign({ 'font-size': tamanho }, estilo));
      } else {
        txt(pai, cx, topo + tamanho * 0.88, String(p.a), Object.assign({ 'font-size': tamanho }, estilo));
        el('line', {
          x1: cx - larguras[i] / 2 + 4, x2: cx + larguras[i] / 2 - 4,
          y1: topo + tamanho * 1.08, y2: topo + tamanho * 1.08,
          stroke: cor, 'stroke-width': Math.max(2, tamanho / 9), 'stroke-linecap': 'round'
        }, pai);
        txt(pai, cx, topo + tamanho * 2.02, String(p.b), Object.assign({ 'font-size': tamanho }, estilo));
      }
      cursor += larguras[i];
    });
  }

  function losango(pai, x, y, r, cor) {
    el('path', {
      d: 'M' + x + ' ' + (y - r) + 'L' + (x + r) + ' ' + y + 'L' + x + ' ' + (y + r) + 'L' + (x - r) + ' ' + y + 'Z',
      fill: cor, stroke: '#0A0E28', 'stroke-width': 3
    }, pai);
  }

  var gNave = null;

  function desenharCena() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    if (!S.item) return;
    var item = S.item;
    var max = item.max;
    var y = L.yPista;
    var xMarco = item.marco ? xDe(item.marco.valor) : null;
    var xAlvo = xDe(item.valor);
    var igualMarco = item.marco && Math.abs(item.marco.valor - item.valor) < 1e-9;

    // Céu e solo
    var fundo = el('g', {}, svg);
    ESTRELAS.forEach(function (e) {
      el('circle', { cx: e[0] * L.w, cy: e[1] * y, r: e[2], fill: '#fff', opacity: e[3] }, fundo);
    });
    el('path', {
      d: 'M0 ' + (y + 6) + 'Q' + L.w / 2 + ' ' + (y - 8) + ' ' + L.w + ' ' + (y + 6) + 'V' + L.h + 'H0Z',
      fill: '#211946'
    }, fundo);

    // Pista
    el('line', { x1: L.x0, x2: L.x1, y1: y, y2: y, stroke: '#E8ECFF', 'stroke-width': 8, 'stroke-linecap': 'round' }, svg);

    // Régua (dica): divide cada inteiro em `partes`
    var totalPartes = max * item.partes;
    var passoPx = (L.x1 - L.x0) / totalPartes;
    if (S.reguaVisivel) {
      for (var i = 1; i < totalPartes; i++) {
        if (i % item.partes === 0) continue;
        var xr = xDe(i / item.partes);
        el('line', { x1: xr, x2: xr, y1: y - 12, y2: y + 12, stroke: '#67E8F9', 'stroke-width': 3, 'stroke-linecap': 'round' }, svg);
      }
    }

    // Régua da forma simplificada (frações equivalentes, na revelação)
    if (S.alvoRevelado && item.equivalente) {
      var partesEq = item.equivalente.b;
      for (var j = 1; j < partesEq * max; j++) {
        if (j % partesEq === 0) continue;
        var xe = xDe(j / partesEq);
        el('line', { x1: xe, x2: xe, y1: y - 26, y2: y - 10, stroke: '#4DFFB4', 'stroke-width': 3, 'stroke-linecap': 'round' }, svg);
      }
    }

    // Partes contadas na revelação
    for (var k = 1; k <= S.contagem; k++) {
      var xa = xDe((k - 1) / item.partes);
      var xb = xDe(k / item.partes);
      el('rect', { x: xa + 1, y: y - 6, width: Math.max(1, xb - xa - 2), height: 12, rx: 4, fill: '#FF8C42' }, svg);
    }

    // Traços e rótulos dos inteiros
    var extremos = C.rotulosExtremos(item);
    for (var n = 0; n <= max; n++) {
      var xi = xDe(n);
      el('line', { x1: xi, x2: xi, y1: y - 17, y2: y + 17, stroke: '#FFFFFF', 'stroke-width': 4, 'stroke-linecap': 'round' }, svg);
      rotuloSVG(svg, { t: extremos[n] }, xi, y + 14, 20, '#FFFFFF');
    }

    // Rótulos da contagem (se houver espaço entre os traços)
    var larguraMin = item.tipo === 'fracao' ? 34 : 46;
    if (passoPx >= larguraMin) {
      for (var c = 1; c < S.contagem; c++) {
        if (c % item.partes === 0) continue;
        var xc = xDe(c / item.partes);
        if (xMarco !== null && Math.abs(xc - xMarco) < 26) continue;
        rotuloSVG(svg, C.rotuloPasso(item, c), xc, y + 16, 15, '#67E8F9');
      }
    }

    // Ponto de referência (etapa 5)
    if (item.marco && !(S.alvoRevelado && igualMarco)) {
      losango(svg, xMarco, y, 9, '#FF8C42');
      rotuloSVG(svg, item.marco.rotulo, xMarco, y + 14, 18, '#FF8C42');
    }

    // Pouso anterior (tentativa que não acertou)
    if (S.fantasma !== null) {
      var xf = xDe(S.fantasma);
      el('line', { x1: xf, x2: xf, y1: y - 16, y2: y + 16, stroke: '#FFB84D', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.85 }, svg);
    }

    // Ponto certo, revelado
    if (S.alvoRevelado) {
      losango(svg, xAlvo, y, 10, '#4DFFB4');
      var rotuloFinal = [item.rotulo];
      if (item.equivalente) rotuloFinal = [item.rotulo, { t: '=' }, item.equivalente.rotulo];
      else if (igualMarco) rotuloFinal = [item.rotulo, { t: '=' }, item.marco.rotulo];
      rotuloSVG(svg, rotuloFinal, clamp(xAlvo, 60, L.w - 60), y + 14, 20, '#4DFFB4');
    }

    desenharNave();
  }

  function criarNave() {
    var g = el('g', {});
    g.innerHTML =
      '<line class="guia" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="2" stroke-dasharray="4 7"/>' +
      '<ellipse class="sombra" fill="#FFFFFF" fill-opacity=".22"/>' +
      '<g class="nave">' +
        '<path class="chama" d="M-6 -7 Q0 16 6 -7Z" fill="#FFD43B"/>' +
        '<path d="M-17 -14L-26 0M17 -14L26 0M-31 0H-21M21 0H31" stroke="#C9D1FF" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M-7 -13H7L4 -7H-4Z" fill="#9AA4D6"/>' +
        '<rect x="-30" y="-34" width="60" height="22" rx="11" fill="#FF8C42"/>' +
        '<rect x="-30" y="-24" width="60" height="4" fill="#B8581C" opacity=".5"/>' +
        '<circle cx="0" cy="-38" r="16" fill="#E8ECFF"/>' +
        '<circle cx="0" cy="-38" r="9" fill="#67E8F9"/>' +
        '<circle cx="-3" cy="-41" r="3" fill="#FFFFFF" opacity=".8"/>' +
        '<path d="M-5 3L0 9L5 3Z" fill="#FFD43B"/>' +
      '</g>';
    return g;
  }

  function desenharNave() {
    if (!S.item) return;
    if (!gNave) gNave = criarNave();
    svg.appendChild(gNave);
    var x = xDe(S.naveV);
    var yBase = L.yAlto + (L.yPista - 4 - L.yAlto) * S.naveY;
    var noAr = S.naveY < 0.999;
    var guia = gNave.querySelector('.guia');
    guia.setAttribute('x1', x); guia.setAttribute('x2', x);
    guia.setAttribute('y1', yBase + 12 * L.escala); guia.setAttribute('y2', L.yPista - 8);
    guia.style.display = noAr && S.estado !== 'animando' ? '' : 'none';
    var sombra = gNave.querySelector('.sombra');
    sombra.setAttribute('cx', x); sombra.setAttribute('cy', L.yPista);
    sombra.setAttribute('rx', (12 + 14 * S.naveY) * L.escala); sombra.setAttribute('ry', 4);
    sombra.style.display = noAr ? '' : 'none';
    gNave.querySelector('.chama').style.display = noAr ? '' : 'none';
    gNave.querySelector('.nave').setAttribute('transform',
      'translate(' + x + ' ' + yBase + ') scale(' + L.escala + ')');
    cena.setAttribute('aria-valuenow', String(Math.round(S.naveV / maxPista() * 100)));
  }

  /* ------------------------------------------------
     Interface (HUD, alvo, controles)
     ------------------------------------------------ */
  function rotuloHTML(alvo, rotulo) {
    alvo.textContent = '';
    if (rotulo.t !== undefined) { alvo.textContent = rotulo.t; return; }
    var fr = document.createElement('span');
    fr.className = 'fr';
    [rotulo.a, rotulo.b].forEach(function (n) {
      var parte = document.createElement('span');
      parte.textContent = String(n);
      fr.appendChild(parte);
    });
    alvo.appendChild(fr);
  }

  function atualizarHUD() {
    var etapa = etapaAtual();
    $('hud-etapa').textContent = 'Etapa ' + etapa.id + ' · ' + etapa.nome;
    var lista = $('hud-pousos');
    lista.textContent = '';
    for (var i = 0; i < S.total; i++) {
      var ponto = document.createElement('li');
      var r = S.resultados[i];
      if (r) ponto.className = r.tipo;
      else if (i === S.indice && S.estado !== 'fim') ponto.className = 'atual';
      lista.appendChild(ponto);
    }
    var piloto = $('hud-piloto');
    piloto.hidden = S.modo !== 'dupla';
    piloto.textContent = 'Piloto ' + pilotoAtual() + ' pilota';
  }

  function pilotoAtual() { return (S.indice % 2) + 1; }

  function atualizarAlvo() {
    rotuloHTML($('alvo-valor'), S.item.rotulo);
    var marco = $('alvo-marco');
    marco.hidden = !S.item.marco;
    if (S.item.marco) marco.textContent = 'O ponto ' + S.item.marco.texto + ' já está marcado na pista.';
  }

  function mostrarControles(qual) {
    $('controles-mira').hidden = qual !== 'mira';
    $('controles-confirma').hidden = qual !== 'confirma';
    $('controles-feedback').hidden = qual !== 'feedback';
  }

  function definirEstado(estado) {
    S.estado = estado;
    app.dataset.estado = estado;
  }

  var acaoSeguir = null;

  function mostrarFeedback(tom, titulo, texto, rotuloBotao, acao) {
    var caixa = $('controles-feedback');
    caixa.dataset.tom = tom;
    $('feedback-titulo').textContent = titulo;
    $('feedback-texto').textContent = texto;
    var botao = $('btn-seguir');
    botao.hidden = !rotuloBotao;
    botao.textContent = rotuloBotao || '';
    acaoSeguir = acao || null;
    mostrarControles('feedback');
    $('anuncio').textContent = titulo + '. ' + texto;
    if (rotuloBotao) botao.focus({ preventScroll: true });
  }

  var avisoTimer = null;
  function aviso(texto) {
    var no = $('aviso');
    no.textContent = texto;
    no.hidden = false;
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(function () { no.hidden = true; }, 4200);
  }

  /* ------------------------------------------------
     Fluxo do jogo
     ------------------------------------------------ */
  function chave(item) { return item.texto + (item.marco ? '@' + item.marco.texto : ''); }

  function escolherItem() {
    var etapa = etapaAtual();
    if (S.indice === 0 && etapa.id === 1 && !save.sessoes) return etapa.itens[0]; // começa por 1/2
    var opcoes = etapa.itens.filter(function (it) { return S.recentes.indexOf(chave(it)) === -1; });
    if (!opcoes.length) opcoes = etapa.itens;
    var item = opcoes[Math.floor(Math.random() * opcoes.length)];
    S.recentes.push(chave(item));
    if (S.recentes.length > 4) S.recentes.shift();
    return item;
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
    var etapaParam = parseInt(params.get('etapa'), 10);
    S.etapa = clamp(etapaParam || save.etapa || 1, 1, C.ETAPAS.length);
    S.dominadasAntes = C.ETAPAS.filter(function (e) { return dominada(e.id); }).map(function (e) { return e.id; });
    $('tela-inicio').hidden = true;
    $('tela-fim').hidden = true;
    iniciarPouso(null);
  }

  function iniciarPouso(falaAntes) {
    S.token++;
    S.item = escolherItem();
    S.tentativa = 1;
    S.erro1 = null;
    registro.iniciarItem();
    S.naveV = 0;
    S.naveY = 0;
    S.reguaVisivel = false;
    S.contagem = 0;
    S.alvoRevelado = false;
    S.fantasma = null;
    definirEstado('mirando');
    medir();
    desenharCena();
    atualizarAlvo();
    atualizarHUD();
    mostrarControles('mira');
    cena.focus({ preventScroll: true });

    var falas = [falaAntes];
    if (S.modo === 'dupla') falas.push(F.piloto(pilotoAtual()));
    if (S.indice === 0 && !save.sessoes) {
      aviso('Arraste a nave ou use as setas. Depois toque em Pousar.');
      falas.push(F.primeiraVez);
    }
    if (S.item.max === 2 && !S.avisouPista2) {
      S.avisouPista2 = true;
      aviso('Atenção: agora a pista vai até 2.');
      falas.push(F.pista2);
    }
    falar(falas.concat(falasDoAlvo()));

    // Deixa prontos os áudios que este pouso pode precisar.
    var passos = [];
    for (var k = 1; k <= S.item.passos; k++) passos.push(C.falaPasso(S.item, k));
    preCarregar(passos.concat(C.dica(S.item, S.item.valor > S.item.max / 2 ? 0 : S.item.max).falas,
      [C.explicacao(S.item).fala]));
  }

  function falasDoAlvo() { return [F.instrucao(S.item), F.marco(S.item)]; }

  function moverPara(v) {
    S.naveV = clamp(v, 0, maxPista());
    desenharNave();
  }

  function pedirPouso() {
    if (S.estado !== 'mirando' || S.pausado) return;
    if (S.modo === 'dupla') {
      definirEstado('confirmando');
      var copiloto = pilotoAtual() === 1 ? 2 : 1;
      $('confirma-texto').textContent = 'Piloto ' + copiloto + ', você concorda?';
      mostrarControles('confirma');
      $('btn-confirmar').focus({ preventScroll: true });
      falar(F.confirma(copiloto));
      return;
    }
    pousar();
  }

  function pousar() {
    var token = S.token;
    definirEstado('animando');
    mostrarControles('none');
    calar();
    var yInicial = S.naveY;
    animar(650, function (p) { S.naveY = yInicial + (1 - yInicial) * p; desenharNave(); })
      .then(function () {
        if (token !== S.token) return;
        som('pouso');
        var erro = Math.abs(S.naveV - S.item.valor) / S.item.max;
        if (S.tentativa === 1) S.erro1 = erro;
        if (erro <= etapaAtual().tolerancia) acertou(erro);
        else errou(erro);
      });
  }

  function registrar(tipo, erro) {
    var primeira = tipo === 'primeira';
    S.resultados[S.indice] = { tipo: tipo, erro: erro, etapa: S.etapa, item: S.item.texto };
    var historico = S.historico[S.etapa] = S.historico[S.etapa] || [];
    historico.push(primeira);

    var reg = save.etapas[S.etapa] = save.etapas[S.etapa] || { tentativas: 0, acertos: 0 };
    reg.tentativas += 1;
    if (primeira) reg.acertos += 1;
    if (historico.length >= 3 && historico.slice(-3).every(Boolean)) reg.dominada = true;

    S.sequencia = primeira ? S.sequencia + 1 : 0;
    S.melhorSequencia = Math.max(S.melhorSequencia, S.sequencia);
    S.pontos += primeira ? (erro <= PERFEITO ? 100 : 70) : (tipo === 'regua' ? 40 : 10);
    gravarSave();
    atualizarHUD();

    // Registro anônimo (professores/registro.html). erro = distância do
    // primeiro pouso até o ponto certo, em % do comprimento da pista.
    registro.item({
      etapa: S.etapa,
      item: S.item.texto + (S.item.marco ? ' (marco ' + S.item.marco.texto + ')' : '') +
        (S.item.max !== 1 ? ' [pista até ' + S.item.max + ']' : ''),
      resultado: tipo === 'regua' ? 'dica' : tipo,
      tentativas: S.tentativa,
      dicas: S.tentativa - 1,
      erro: S.erro1 === null ? '' : Math.round(S.erro1 * 1000) / 10
    });
  }

  // Revela a régua e conta as partes até o alvo. Na demonstração (`narrar`),
  // cada parte é falada e a contagem espera a fala terminar.
  function contarPartes(intervalo, narrar) {
    S.reguaVisivel = true;
    S.contagem = 0;
    desenharCena();
    var passos = S.item.passos;
    var cadeia = Promise.resolve();
    for (var k = 1; k <= passos; k++) {
      cadeia = cadeia.then(function () {
        S.contagem += 1;
        desenharCena();
        if (!narrar) return esperar(intervalo);
        som('tique');
        return Promise.all([falar(C.falaPasso(S.item, S.contagem)), esperar(intervalo)]);
      });
    }
    return cadeia.then(function () {
      S.alvoRevelado = true;
      desenharCena();
    });
  }

  function acertou(erro) {
    var comRegua = S.tentativa > 1;
    registrar(comRegua ? 'regua' : 'primeira', erro);
    som('acerto');
    var titulo = erro <= PERFEITO ? 'Pouso perfeito!' : 'Bom pouso!';
    if (comRegua) titulo = erro <= PERFEITO ? 'Perfeito, com a régua!' : 'Boa, com a régua!';
    var explicacao = C.explicacao(S.item);
    mostrarFeedback('acerto', titulo, '', null);
    falar([F.titulo(titulo), explicacao.fala]);
    contarPartes(S.item.passos > 6 ? 90 : 160, false).then(function () {
      definirEstado('feedback');
      mostrarFeedback('acerto', titulo, explicacao.texto, rotuloProximo(), proximo);
    });
  }

  function errou(erro) {
    if (S.tentativa === 1) {
      som('quase');
      S.tentativa = 2;
      S.fantasma = S.naveV;
      S.reguaVisivel = true;
      desenharCena();
      definirEstado('feedback');
      var titulo = S.naveV > S.item.valor ? 'Passou do ponto' : 'Ficou antes do ponto';
      var dica = C.dica(S.item, S.naveV);
      mostrarFeedback('quase', titulo, dica.texto, 'Tentar de novo', tentarDeNovo);
      falar([F.titulo(titulo)].concat(dica.falas));
      return;
    }

    // Segunda tentativa: demonstração contando as partes
    registrar('demo', erro);
    S.fantasma = S.naveV;
    mostrarFeedback('demo', 'Vamos ver juntos', 'Olhe a régua enquanto contamos.', null);
    var token = S.token;
    var explicacao = C.explicacao(S.item);

    Promise.all([
      falar(F.titulo('Vamos ver juntos')),
      animar(380, function (p) { S.naveY = 1 - p; desenharNave(); })
    ])
      .then(function () {
        if (token !== S.token) return null;
        return contarPartes(S.item.passos > 6 ? 450 : 600, true);
      })
      .then(function () {
        var inicio = S.naveV;
        return animar(600, function (p) { S.naveV = inicio + (S.item.valor - inicio) * p; desenharNave(); });
      })
      .then(function () {
        return animar(450, function (p) { S.naveY = p; desenharNave(); });
      })
      .then(function () {
        if (token !== S.token) return;
        som('pouso');
        definirEstado('feedback');
        mostrarFeedback('demo', 'Vamos ver juntos', explicacao.texto, rotuloProximo(), proximo);
        falar(explicacao.fala);
      });
  }

  function rotuloProximo() { return S.indice + 1 >= S.total ? 'Ver resultado' : 'Próximo pouso'; }

  function tentarDeNovo() {
    definirEstado('animando');
    mostrarControles('none');
    var token = S.token;
    animar(380, function (p) { S.naveY = 1 - p; desenharNave(); }).then(function () {
      if (token !== S.token) return;
      definirEstado('mirando');
      desenharNave();
      mostrarControles('mira');
      cena.focus({ preventScroll: true });
      falar([F.usarRegua].concat(falasDoAlvo()));
    });
  }

  // Sobe de etapa após 3 acertos de primeira seguidos; volta após 3 erros seguidos.
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
    iniciarPouso(fala);
  }

  function finalizar() {
    S.token++;
    definirEstado('fim');
    save.sessoes += 1;
    save.etapa = S.etapa;
    gravarSave();
    atualizarHUD();
    registro.fim({ etapa: S.etapa });

    var primeira = S.resultados.filter(function (r) { return r.tipo === 'primeira'; }).length;
    var regua = S.resultados.filter(function (r) { return r.tipo === 'regua'; }).length;
    var erroMedio = S.resultados.reduce(function (s, r) { return s + r.erro; }, 0) / S.resultados.length;
    var precisao = Math.max(0, Math.round(100 - erroMedio * 100));

    var resumo = $('fim-resumo');
    resumo.textContent = '';
    [[primeira + ' de ' + S.total, 'de primeira'], [String(regua), 'com a régua'], [precisao + '%', 'de precisão']]
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
      var li = document.createElement('li');
      var feita = dominada(etapa.id);
      var registro = save.etapas[etapa.id];
      if (feita && S.dominadasAntes.indexOf(etapa.id) === -1) novas.push(etapa);
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
    $('fim-reflexao').hidden = false;
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
      etapa: S.etapa,
      precisao: precisao
    });
  }

  function voltarAoInicio() {
    S.token++;
    calar();
    definirEstado('inicio');
    S.item = null;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var etapa = C.ETAPAS[clamp(parseInt(params.get('etapa'), 10) || save.etapa || 1, 1, C.ETAPAS.length) - 1];
    $('inicio-etapa').textContent = 'Etapa ' + etapa.id + ' de ' + C.ETAPAS.length + ': ' + etapa.nome;
    $('tela-fim').hidden = true;
    $('tela-inicio').hidden = false;
    (params.get('dupla') === '1' ? $('btn-dupla') : $('btn-solo')).focus({ preventScroll: true });
  }

  /* ------------------------------------------------
     Entrada: arrastar, teclado e botões
     ------------------------------------------------ */
  var arrastando = false;

  function vDoPonteiro(evento) {
    return vDe(evento.clientX - cena.getBoundingClientRect().left);
  }

  cena.addEventListener('pointerdown', function (e) {
    if (S.estado !== 'mirando' || S.pausado) return;
    arrastando = true;
    try { cena.setPointerCapture(e.pointerId); } catch (erro) { /* ponteiro sintético */ }
    moverPara(vDoPonteiro(e));
  });
  cena.addEventListener('pointermove', function (e) {
    if (arrastando && S.estado === 'mirando') moverPara(vDoPonteiro(e));
  });
  ['pointerup', 'pointercancel'].forEach(function (tipo) {
    cena.addEventListener(tipo, function () { arrastando = false; });
  });

  document.addEventListener('keydown', function (e) {
    if (S.pausado || S.estado !== 'mirando') return;
    var passo = PASSO_TECLADO * maxPista() * (e.shiftKey ? 5 : 1);
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); moverPara(S.naveV - passo); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); moverPara(S.naveV + passo); }
    else if (e.key === 'Home') { e.preventDefault(); moverPara(0); }
    else if (e.key === 'End') { e.preventDefault(); moverPara(maxPista()); }
    else if ((e.key === 'Enter' || e.key === ' ') && !(e.target instanceof HTMLButtonElement)) {
      e.preventDefault();
      pedirPouso();
    }
  });

  // Botões de ajuste fino: um passo por toque; segurar repete.
  function botaoRepetidor(botao, direcao) {
    var espera = null;
    var repeticao = null;
    function parar() { clearTimeout(espera); clearInterval(repeticao); }
    botao.addEventListener('pointerdown', function (e) {
      if (S.estado !== 'mirando' || S.pausado) return;
      e.preventDefault();
      moverPara(S.naveV + direcao * PASSO_TECLADO * maxPista());
      espera = setTimeout(function () {
        repeticao = setInterval(function () {
          if (S.estado !== 'mirando') return parar();
          moverPara(S.naveV + direcao * PASSO_TECLADO * maxPista());
        }, 45);
      }, 320);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (t) { botao.addEventListener(t, parar); });
    botao.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (S.estado === 'mirando') moverPara(S.naveV + direcao * PASSO_TECLADO * maxPista());
      }
    });
  }
  botaoRepetidor($('btn-esq'), -1);
  botaoRepetidor($('btn-dir'), 1);

  $('btn-pousar').addEventListener('click', pedirPouso);
  $('btn-confirmar').addEventListener('click', function () { if (S.estado === 'confirmando') pousar(); });
  $('btn-ajustar').addEventListener('click', function () {
    if (S.estado !== 'confirmando') return;
    definirEstado('mirando');
    mostrarControles('mira');
    cena.focus({ preventScroll: true });
  });
  $('btn-seguir').addEventListener('click', function () {
    if (S.estado === 'feedback' && acaoSeguir) acaoSeguir();
  });
  $('btn-ouvir').addEventListener('click', function () { if (S.item) falar(falasDoAlvo()); });
  $('btn-solo').addEventListener('click', function () { iniciarSessao('solo'); });
  $('btn-dupla').addEventListener('click', function () { iniciarSessao('dupla'); });
  $('btn-de-novo').addEventListener('click', voltarAoInicio);

  // Pergunta de autoexplicação: opções vêm do conteúdo (mesmo texto na tela e na voz).
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

  /* ------------------------------------------------
     Comandos da página do portal (contrato compartilhado)
     ------------------------------------------------ */
  var portal = Base.conectarPortal({
    aoPausar: function () { S.pausado = true; $('tela-pausa').hidden = false; },
    aoContinuar: function () { S.pausado = false; $('tela-pausa').hidden = true; },
    aoReiniciar: function () { S.pausado = false; $('tela-pausa').hidden = true; voltarAoInicio(); }
  });

  if ('ResizeObserver' in window) {
    new ResizeObserver(function () { medir(); desenharCena(); }).observe(cena);
  } else {
    window.addEventListener('resize', function () { medir(); desenharCena(); });
  }

  Base.barraDoProfessor(GAME_ID);
  medir();
  voltarAoInicio();
  if (params.get('dupla') === '1') $('btn-dupla').focus({ preventScroll: true });
  portal.pronto();
})();
