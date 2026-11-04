/**
 * jogo.js — Rumo Certo (Terramund · Geografia).
 *
 * Missões num mapa com rosa dos ventos e legenda. O mapa pode aparecer
 * girado (o Norte não fica sempre em cima): os botões de andar dizem Norte,
 * Sul, Leste e Oeste, e não "cima/baixo", então só a rosa dos ventos diz
 * para que lado cada um leva. É justamente aí que as crianças erram mais
 * (Liben & Downs, 1993).
 *
 * Parâmetros para o professor (URL): ?etapa=1..5  ?tarefas=4..12  ?dupla=1
 */
(function () {
  'use strict';

  var C = window.RumoConteudo;
  var F = C.FALAS;
  var Base = window.PlanetinhaJogo;
  var GAME_ID = 'rumo-certo';
  var SAVE_KEY = 'meu-planetinha.rumo-certo.v1';
  var NS = 'http://www.w3.org/2000/svg';
  var CEL = 60;          // tamanho de uma quadra, em unidades do SVG
  var MARGEM = 112;      // faixa a leste do mapa onde fica a rosa dos ventos

  var params = new URLSearchParams(location.search);

  function $(id) { return document.getElementById(id); }
  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

  var app = $('app');
  var svg = $('mapa');

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
    if (S && S.etapaDaUrl) return; // o professor experimentando pela URL não muda o progresso
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
    estado: 'inicio',      // inicio | procurando | andando | confirmando | feedback | fim
    modo: 'solo',
    total: clamp(parseInt(params.get('tarefas'), 10) || 8, 4, 12),
    indice: 0,
    etapa: 1,
    missao: null,
    tentativa: 1,
    erros: 0,
    pos: null,
    trilha: [],
    tocado: null,          // lugar tocado (encontrar), para confirmar em dupla
    errados: [],
    referenciaDestacada: false,
    revelado: false,
    rotaCerta: false,
    rosaNoExplorador: false,
    resultados: [],
    recentes: [],
    historico: {},
    dominadasAntes: [],
    sequencia: 0,
    melhorSequencia: 0,
    pontos: 0,
    pausado: false,
    jaInstruiu: {},
    avisouGiro: false
  };

  function etapaAtual() { return C.ETAPAS[S.etapa - 1]; }
  function mapa() { return C.MAPAS[S.missao.mapa]; }
  function giro() { return S.missao.giro || 0; }
  function exploradorAtual() { return (S.indice % 2) + 1; }
  function lugar(id) { return C.lugar(S.missao.mapa, id); }

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

  /* ------------------------------------------------
     Desenho do mapa (SVG). As coordenadas do mapa giram junto com ele;
     símbolos e letras giram ao contrário para continuarem de pé.
     ------------------------------------------------ */
  function el(tag, attrs, pai) {
    var no = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { no.setAttribute(k, attrs[k]); });
    if (pai) pai.appendChild(no);
    return no;
  }

  function centro(x, y) { return { x: x * CEL + CEL / 2, y: y * CEL + CEL / 2 }; }
  function dePe(x, y) { return 'translate(' + x + ' ' + y + ') rotate(' + (-giro()) + ')'; }

  function ehAgua(x, y) {
    return mapa().agua.some(function (c) { return c[0] === x && c[1] === y; });
  }

  function desenharRosa(pai, cx, cy) {
    var g = el('g', { transform: 'translate(' + cx + ' ' + cy + ')' }, pai);
    // Braços: N, S, L, O longos; colaterais curtos.
    [['N', 0, -1], ['S', 0, 1], ['L', 1, 0], ['O', -1, 0]].forEach(function (b) {
      var px = -b[2] * 7;
      var py = b[1] * 7;
      el('path', { d: 'M' + px + ' ' + py + 'L' + (b[1] * 34) + ' ' + (b[2] * 34) + 'L' + (-px) + ' ' + (-py) + 'Z', class: 'rosa-braco' }, g);
      var letra = el('text', { transform: dePe(b[1] * 44, b[2] * 44), 'text-anchor': 'middle', 'dominant-baseline': 'central',
        class: 'rosa-letra' + (b[0] === 'N' ? ' rosa-letra--n' : '') }, g);
      letra.textContent = b[0];
    });
    if (S.etapa >= 2) {
      [['NE', 1, -1], ['NO', -1, -1], ['SE', 1, 1], ['SO', -1, 1]].forEach(function (b) {
        el('path', { d: 'M0 0L' + (b[1] * 19) + ' ' + (b[2] * 19), stroke: '#64748B', 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
        var letra = el('text', { transform: dePe(b[1] * 27, b[2] * 27), 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'rosa-letra rosa-letra--menor' }, g);
        letra.textContent = b[0];
      });
    }
    el('circle', { r: 6, fill: '#FFD43B', stroke: '#1E293B', 'stroke-width': 2 }, g);
  }

  function desenharMapa() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    if (!S.missao) return;
    var M = mapa();
    var W = M.largura * CEL + MARGEM;
    var H = M.altura * CEL;
    var g = giro();
    var vw = g % 180 ? H : W;
    var vh = g % 180 ? W : H;
    svg.setAttribute('viewBox', (-8) + ' ' + (-8) + ' ' + (vw + 16) + ' ' + (vh + 16));
    var raiz = el('g', { transform: 'translate(' + vw / 2 + ' ' + vh / 2 + ') rotate(' + g + ') translate(' + (-W / 2) + ' ' + (-H / 2) + ')' }, svg);

    el('rect', { x: 0, y: 0, width: W, height: H, rx: 12, class: 'margem' }, raiz);
    el('rect', { x: 0, y: 0, width: M.largura * CEL, height: H, rx: 12, class: 'chao' }, raiz);
    M.agua.forEach(function (c) { el('rect', { x: c[0] * CEL, y: c[1] * CEL, width: CEL, height: CEL, class: 'agua' }, raiz); });
    for (var i = 1; i < M.largura; i++) el('line', { x1: i * CEL, y1: 0, x2: i * CEL, y2: H, class: 'malha' }, raiz);
    for (var j = 1; j < M.altura; j++) el('line', { x1: 0, y1: j * CEL, x2: M.largura * CEL, y2: j * CEL, class: 'malha' }, raiz);

    desenharRosa(raiz, M.largura * CEL + MARGEM / 2, Math.min(H / 2, 90));

    // Rastro do explorador
    S.trilha.forEach(function (p) {
      var c = centro(p.x, p.y);
      el('circle', { cx: c.x, cy: c.y, r: 7, class: 'trilha' }, raiz);
    });

    // Caminho certo (demonstração de rota)
    if (S.rotaCerta && S.missao.tipo === 'rota') {
      var inicio = lugar(S.missao.inicio);
      var p = { x: inicio.x, y: inicio.y };
      var c0 = centro(p.x, p.y);
      var d = 'M' + c0.x + ' ' + c0.y;
      S.missao.passos.forEach(function (passo) {
        p.x += C.DIRECOES[passo[0]].dx * passo[1];
        p.y += C.DIRECOES[passo[0]].dy * passo[1];
        var c = centro(p.x, p.y);
        d += 'L' + c.x + ' ' + c.y;
      });
      el('path', { d: d, class: 'rota-certa' }, raiz);
    }

    // Dica: seta saindo da referência na direção pedida
    if (S.referenciaDestacada && S.missao.tipo === 'encontrar') {
      var ref = lugar(S.missao.referencia);
      var dir = C.DIRECOES[S.missao.dir];
      var a = centro(ref.x, ref.y);
      var b = { x: a.x + dir.dx * CEL * 1.6, y: a.y + dir.dy * CEL * 1.6 };
      var marcador = el('marker', { id: 'ponta-dica', viewBox: '0 0 10 10', refX: 6, refY: 5, markerWidth: 3, markerHeight: 3, orient: 'auto' }, el('defs', {}, raiz));
      el('path', { d: 'M0 0L10 5L0 10z', fill: '#0891B2' }, marcador);
      el('path', { d: 'M' + a.x + ' ' + a.y + 'L' + b.x + ' ' + b.y, class: 'seta-dica', 'marker-end': 'url(#ponta-dica)' }, raiz);
    }

    // Lugares
    M.lugares.forEach(function (l) {
      var c = centro(l.x, l.y);
      var tipo = C.TIPOS_LUGAR[l.tipo];
      var grupo = el('g', { class: 'lugar', transform: 'translate(' + c.x + ' ' + c.y + ')', 'data-id': l.id }, raiz);
      if (S.missao.tipo === 'encontrar') {
        grupo.setAttribute('tabindex', S.estado === 'procurando' || S.perguntando ? '0' : '-1');
        grupo.setAttribute('role', 'button');
        grupo.setAttribute('aria-label', tipo.nome);
        if (S.referenciaDestacada && l.id === S.missao.referencia) grupo.classList.add('referencia');
        if (S.errados.indexOf(l.id) !== -1) grupo.classList.add('errado');
        if (!S.perguntando && l.id === S.tocado) grupo.classList.add('tocado');
        if (l.id === S.lugarParceiro) grupo.classList.add('parceiro');
        if (S.revelado && l.id === S.missao.alvo) grupo.classList.add('certo');
      } else if ((S.missao.tipo === 'ir' && l.id === S.missao.alvo) || (S.revelado && l.id === S.missao.destino)) {
        grupo.classList.add('certo');
      }
      el('rect', { x: -CEL / 2 + 3, y: -CEL / 2 + 3, width: CEL - 6, height: CEL - 6, rx: 10, class: 'lugar__fundo' }, grupo);
      var simbolo = el('use', { href: '#l-' + l.tipo, x: -21, y: -21, width: 42, height: 42 }, el('g', { transform: 'rotate(' + (-giro()) + ')' }, grupo));
      simbolo.setAttribute('aria-hidden', 'true');
    });

    // Explorador
    if (S.pos) {
      var e = centro(S.pos.x, S.pos.y);
      var grupoE = el('g', { transform: 'translate(' + e.x + ' ' + e.y + ')' }, raiz);
      if (S.rosaNoExplorador) {
        var rosa = el('g', { class: 'rosa-explorador' }, grupoE);
        [['N', 0, -1], ['S', 0, 1], ['L', 1, 0], ['O', -1, 0]].forEach(function (b) {
          el('path', { d: 'M' + (b[1] * 20) + ' ' + (b[2] * 20) + 'L' + (b[1] * 30) + ' ' + (b[2] * 30) }, rosa);
          var letra = el('text', { transform: dePe(b[1] * 40, b[2] * 40), 'text-anchor': 'middle', 'dominant-baseline': 'central' }, rosa);
          letra.textContent = b[0];
        });
      }
      el('use', { href: '#l-explorador', x: -18, y: -18, width: 36, height: 36 }, el('g', { transform: 'rotate(' + (-giro()) + ')' }, grupoE));
    }
  }

  function desenharLegenda() {
    var lista = $('legenda-lista');
    lista.textContent = '';
    var tipos = [];
    mapa().lugares.forEach(function (l) { if (tipos.indexOf(l.tipo) === -1) tipos.push(l.tipo); });
    tipos.forEach(function (t) {
      var li = document.createElement('li');
      li.innerHTML = '<svg aria-hidden="true"><use href="#l-' + t + '"/></svg>';
      li.appendChild(document.createTextNode(C.TIPOS_LUGAR[t].nome.charAt(0).toUpperCase() + C.TIPOS_LUGAR[t].nome.slice(1)));
      lista.appendChild(li);
    });
    if (mapa().agua.length) {
      var agua = document.createElement('li');
      agua.innerHTML = '<span class="amostra-agua" aria-hidden="true"></span>Água';
      lista.appendChild(agua);
    }
    var explorador = document.createElement('li');
    explorador.innerHTML = '<svg aria-hidden="true"><use href="#l-explorador"/></svg>Você';
    if (S.missao.tipo !== 'encontrar') lista.appendChild(explorador);
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
    var explorador = $('hud-explorador');
    explorador.hidden = S.modo !== 'dupla';
    explorador.textContent = 'Explorador ' + exploradorAtual() + ' na missão';
  }

  function desenharControles() {
    var tipo = S.missao.tipo;
    var dica = $('dica-toque');
    // Em dupla, andando, os dois se revezam a cada passo.
    if (tipo === 'encontrar') dica.textContent = 'Toque no lugar certo do mapa.';
    else if (S.modo === 'dupla') dica.textContent = 'Vez do Explorador ' + S.vez + ' apertar';
    dica.hidden = tipo !== 'encontrar' && S.modo !== 'dupla';
    $('direcoes').hidden = tipo === 'encontrar';
    $('btn-recomecar').hidden = tipo !== 'rota';
    $('btn-cheguei').hidden = tipo !== 'rota';
    var andando = S.estado === 'andando';
    document.querySelectorAll('.btn-direcao').forEach(function (b) { b.disabled = !andando; });
    $('btn-cheguei').disabled = !andando;
    $('btn-recomecar').disabled = !andando;
  }

  function desenharTudo() {
    desenharMapa();
    desenharHUD();
    desenharControles();
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
    $('btn-seguir').textContent = rotuloBotao;
    acaoSeguir = acao;
    mostrarControles('feedback');
    $('anuncio').textContent = titulo + ' ' + texto;
    $('btn-seguir').focus({ preventScroll: true });
  }

  var avisoTimer = null;
  function aviso(texto) {
    var no = $('aviso');
    no.textContent = texto;
    no.hidden = false;
    clearTimeout(avisoTimer);
    // Texto longo fica mais tempo na tela (quem lê devagar precisa).
    avisoTimer = setTimeout(function () { no.hidden = true; }, Math.max(3200, texto.length * 75));
  }

  function semPonto(t) { return t.replace(/\.$/, ''); }

  /* ------------------------------------------------
     Fluxo
     ------------------------------------------------ */
  function escolherMissao() {
    var etapa = etapaAtual();
    var chaves = etapa.itens.map(function (_, i) { return etapa.id + '-' + i; });
    var livres = chaves.filter(function (k) { return S.recentes.indexOf(k) === -1; });
    var lista = livres.length ? livres : chaves;
    var chave = lista[Math.floor(Math.random() * lista.length)];
    S.recentes.push(chave);
    if (S.recentes.length > 3) S.recentes.shift();
    return etapa.itens[Number(chave.split('-')[1])];
  }

  function iniciarSessao(modo) {
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
    S.jaInstruiu = {};
    S.avisouGiro = false;
    // ?etapa= é para o professor experimentar: não muda o progresso salvo.
    S.etapaDaUrl = Boolean(parseInt(params.get('etapa'), 10));
    S.etapa = clamp(parseInt(params.get('etapa'), 10) || save.etapa || 1, 1, C.ETAPAS.length);
    S.dominadasAntes = C.ETAPAS.filter(function (e) { return dominada(e.id); }).map(function (e) { return e.id; });
    $('tela-inicio').hidden = true;
    $('tela-fim').hidden = true;
    iniciarMissao(null);
  }

  function iniciarMissao(falaAntes) {
    S.missao = escolherMissao();
    S.tentativa = 1;
    registro.iniciarItem();
    S.erros = 0;
    S.tocado = null;
    S.perguntando = false;
    S.lugarParceiro = null;
    S.duplaConversou = false;
    S.vez = exploradorAtual();
    S.errados = [];
    S.referenciaDestacada = false;
    S.revelado = false;
    S.rotaCerta = false;
    S.rosaNoExplorador = false;
    S.trilha = [];
    S.pos = null;
    if (S.missao.tipo !== 'encontrar') {
      var inicio = lugar(S.missao.inicio);
      S.pos = { x: inicio.x, y: inicio.y };
    }
    definirEstado(S.missao.tipo === 'encontrar' ? 'procurando' : 'andando');

    var tipos = { encontrar: 'Encontre no mapa', ir: 'Leve o explorador', rota: 'Siga a rota' };
    $('missao-tipo').textContent = tipos[S.missao.tipo] + (giro() ? ' · mapa girado' : '');
    $('missao-texto').textContent = S.missao.texto;
    desenharLegenda();
    desenharTudo();
    mostrarControles('acao');

    var falas = [].concat(falaAntes);
    if (S.modo === 'dupla') falas.push(F.explorador(exploradorAtual()));
    if (giro() && !S.avisouGiro) {
      S.avisouGiro = true;
      aviso('O mapa está girado: use a rosa dos ventos!');
      falas.push(F.mapaGirado);
    }
    falas.push(S.missao.texto);
    var instrucao = { encontrar: F.instrucaoEncontrar, ir: F.instrucaoIr, rota: F.instrucaoRota }[S.missao.tipo];
    if (!S.jaInstruiu[S.missao.tipo]) { S.jaInstruiu[S.missao.tipo] = true; falas.push(instrucao); }
    falar(falas);
  }

  /* ── Encontrar ───────────────────────────────────── */
  function tocarLugar(id) {
    if (S.estado === 'confirmando' && S.perguntando && !S.pausado) { respostaDoParceiro(id); return; }
    if (S.estado !== 'procurando' || S.pausado) return;
    S.lugarParceiro = null;
    if (S.modo === 'dupla') {
      S.tocado = id;
      definirEstado('confirmando');
      var parceiro = exploradorAtual() === 1 ? 2 : 1;
      mostrarControles('confirma');
      // Na primeira vez da missão, o parceiro procura sozinho e toca no lugar
      // (o toque do colega não fica marcado); o jogo compara os dois.
      if (!S.duplaConversou && id !== S.missao.referencia) {
        S.perguntando = true;
        desenharTudo();
        Base.perguntarAoParceiro({ texto: 'Explorador ' + parceiro + ': toque no lugar que você acha certo.' });
        falar([F.explorador(parceiro), F.toqueLugar]);
        return;
      }
      desenharTudo();
      $('confirma-texto').textContent = 'Explorador ' + parceiro + ', você concorda com ' + C.nomeDoLugar(S.missao.mapa, id) + '?';
      $('btn-confirmar').focus({ preventScroll: true });
      falar(F.confirma(parceiro));
      return;
    }
    avaliarToque(id);
  }

  function respostaDoParceiro(id) {
    S.perguntando = false;
    Base.fimDaPergunta();
    if (id === S.tocado) { avaliarToque(id); return; }
    // Lugares diferentes: os dois ficam marcados e a dupla decide junto.
    S.lugarParceiro = id;
    pensaramDiferente('procurando');
  }

  function pensaramDiferente(estado) {
    S.duplaConversou = true;
    definirEstado(estado);
    desenharTudo();
    mostrarControles('acao');
    aviso(F.pensaramDiferente);
    falar(F.pensaramDiferente);
  }

  function avaliarToque(id) {
    S.tocado = null;
    S.lugarParceiro = null;
    var m = S.missao;
    if (id === m.alvo) {
      registrar(S.tentativa === 1 ? 'primeira' : 'dica');
      som('acerto');
      S.revelado = true;
      definirEstado('feedback');
      desenharTudo();
      var explicacao = C.explicaEncontrar(m);
      mostrarFeedback('acerto', semPonto(F.achou), explicacao, rotuloProximo(), proximo);
      falar([F.achou, explicacao]);
      return;
    }
    if (id === m.referencia) {
      definirEstado('procurando');
      aviso(F.referencia);
      falar(F.referencia);
      desenharTudo();
      mostrarControles('acao');
      return;
    }
    S.tentativa += 1;
    if (S.errados.indexOf(id) === -1) S.errados.push(id);
    if (S.tentativa > 3) { demonstrarEncontrar(); return; }
    som('quase');
    var falas = [C.erroEncontrar(m, id)];
    if (S.tentativa === 2) {
      falas.push(C.dicaRosa(m));
    } else {
      S.referenciaDestacada = true;
      falas.push(F.olheReferencia);
    }
    definirEstado('feedback');
    desenharTudo();
    mostrarFeedback('quase', semPonto(F.quase), falas.join(' '), 'Tentar de novo', function () {
      definirEstado('procurando');
      desenharTudo();
      mostrarControles('acao');
    });
    falar([F.quase].concat(falas));
  }

  function demonstrarEncontrar() {
    registrar('demo');
    S.referenciaDestacada = true;
    S.revelado = true;
    definirEstado('feedback');
    desenharTudo();
    var explicacao = C.explicaEncontrar(S.missao);
    mostrarFeedback('demo', semPonto(F.vamosVer), explicacao, rotuloProximo(), proximo);
    falar([F.vamosVer, explicacao]);
  }

  /* ── Ir e rota ───────────────────────────────────── */
  function passa(x, y) {
    return !ehAgua(x, y) || mapa().lugares.some(function (l) { return l.tipo === 'ponte' && l.x === x && l.y === y; });
  }

  // Passos do menor caminho andável até o alvo (desviando da água; a ponte
  // passa). Assim, ir até a ponte quando é o único caminho não conta como
  // "se afastou".
  function distancia(p, alvo) {
    var M = mapa();
    var fila = [[p.x, p.y, 0]];
    var visto = {};
    visto[p.x + ',' + p.y] = true;
    while (fila.length) {
      var q = fila.shift();
      if (q[0] === alvo.x && q[1] === alvo.y) return q[2];
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (v) {
        var x = q[0] + v[0];
        var y = q[1] + v[1];
        if (x < 0 || y < 0 || x >= M.largura || y >= M.altura || visto[x + ',' + y] || !passa(x, y)) return;
        visto[x + ',' + y] = true;
        fila.push([x, y, q[2] + 1]);
      });
    }
    return Infinity;
  }

  function mover(dir) {
    if (S.estado !== 'andando' || S.pausado) return;
    var M = mapa();
    var d = C.DIRECOES[dir];
    var nx = S.pos.x + d.dx;
    var ny = S.pos.y + d.dy;
    if (nx < 0 || ny < 0 || nx >= M.largura || ny >= M.altura) { aviso(F.borda); falar(F.borda); return; }
    if (!passa(nx, ny)) { aviso(F.agua); falar(F.agua); return; }

    var antes = S.missao.tipo === 'ir' ? distancia(S.pos, lugar(S.missao.alvo)) : 0;
    S.trilha.push({ x: S.pos.x, y: S.pos.y });
    S.pos = { x: nx, y: ny };
    if (S.modo === 'dupla') {
      S.vez = S.vez === 1 ? 2 : 1;
      $('dica-toque').textContent = 'Vez do Explorador ' + S.vez + ' apertar';
    }
    som('tique');
    $('anuncio').textContent = 'Andou para o ' + d.nome + '.';

    if (S.missao.tipo === 'ir') {
      var alvo = lugar(S.missao.alvo);
      if (S.pos.x === alvo.x && S.pos.y === alvo.y) { desenharMapa(); chegouIr(); return; }
      if (distancia(S.pos, alvo) > antes) {
        S.erros += 1;
        var falas = [C.afastou(dir)];
        // Dicas em camadas: no segundo afastamento, a rosa aparece sobre o explorador.
        if (S.erros === 2) { S.rosaNoExplorador = true; falas.push(F.rosaNoExplorador); }
        aviso(semPonto(falas[0]) + '.');
        falar(falas);
      }
    }
    desenharMapa();
  }

  function chegouIr() {
    var resultado = S.erros === 0 ? 'primeira' : 'dica';
    registrar(resultado);
    som('acerto');
    definirEstado('feedback');
    desenharTudo();
    var titulo = S.erros === 0 ? F.chegou : F.chegouDica;
    var texto = C.chegouA(S.missao.mapa, S.missao.alvo);
    mostrarFeedback('acerto', semPonto(titulo), texto, rotuloProximo(), proximo);
    falar([titulo, texto]);
  }

  function pedirCheguei() {
    if (S.estado !== 'andando' || S.missao.tipo !== 'rota' || S.pausado) return;
    if (S.modo === 'dupla') {
      definirEstado('confirmando');
      var parceiro = exploradorAtual() === 1 ? 2 : 1;
      mostrarControles('confirma');
      // Na primeira vez da rota, o parceiro conta sozinho quantos quadradinhos
      // a dupla andou; se não bate com o que andaram, conversam.
      var andou = S.trilha.length;
      if (!S.duplaConversou && andou > 0) {
        // A resposta certa não fica sempre no meio.
        var menor = Math.max(1, andou - Math.floor(Math.random() * 3));
        var opcoes = [menor, menor + 1, menor + 2];
        Base.perguntarAoParceiro({
          texto: 'Explorador ' + parceiro + ': ' + F.perguntaQuadradinhos.charAt(0).toLowerCase() + F.perguntaQuadradinhos.slice(1),
          opcoes: opcoes.map(function (n) { return { rotulo: String(n), valor: n }; }),
          aoResponder: function (n) {
            if (n === andou) { avaliarRota(); return; }
            pensaramDiferente('andando');
          }
        });
        falar([F.explorador(parceiro), F.perguntaQuadradinhos]);
        return;
      }
      $('confirma-texto').textContent = 'Explorador ' + parceiro + ', você concorda?';
      $('btn-confirmar').focus({ preventScroll: true });
      falar(F.confirma(parceiro));
      return;
    }
    avaliarRota();
  }

  function avaliarRota() {
    var m = S.missao;
    if (S.pos.x === m.fim.x && S.pos.y === m.fim.y) {
      registrar(S.tentativa === 1 ? 'primeira' : 'dica');
      som('acerto');
      S.revelado = true;
      definirEstado('feedback');
      desenharTudo();
      var texto = C.chegouA(m.mapa, m.destino);
      mostrarFeedback('acerto', semPonto(F.caminhoCerto), texto, rotuloProximo(), proximo);
      falar([F.caminhoCerto, texto]);
      return;
    }
    S.tentativa += 1;
    var aqui = mapa().lugares.filter(function (l) { return l.x === S.pos.x && l.y === S.pos.y; })[0];
    var erro = C.erroRota(m, aqui ? aqui.id : null);
    if (S.tentativa > 2) {
      registrar('demo');
      S.rotaCerta = true;
      S.revelado = true;
      S.pos = { x: m.fim.x, y: m.fim.y };
      definirEstado('feedback');
      desenharTudo();
      var chegada = C.chegouA(m.mapa, m.destino);
      mostrarFeedback('demo', semPonto(F.vamosVer), m.texto.replace(/ Toque em Cheguei quando terminar\.$/, '') + ' ' + chegada, rotuloProximo(), proximo);
      falar([F.vamosVer, chegada]);
      return;
    }
    som('quase');
    definirEstado('feedback');
    desenharTudo();
    mostrarFeedback('quase', semPonto(F.quase), erro, 'Tentar de novo', recomecarRota);
    falar([F.quase, erro]);
  }

  function recomecarRota() {
    var inicio = lugar(S.missao.inicio);
    S.pos = { x: inicio.x, y: inicio.y };
    S.trilha = [];
    definirEstado('andando');
    desenharTudo();
    mostrarControles('acao');
  }

  /* ── Comum ───────────────────────────────────────── */
  function registrar(tipo) {
    var primeira = tipo === 'primeira';
    S.resultados[S.indice] = { tipo: tipo, etapa: S.etapa };
    var historico = S.historico[S.etapa] = S.historico[S.etapa] || [];
    historico.push(tipo);
    var reg = save.etapas[S.etapa] = save.etapas[S.etapa] || { tentativas: 0, acertos: 0 };
    reg.tentativas += 1;
    if (primeira) reg.acertos += 1;
    if (historico.length >= 3 && historico.slice(-3).every(function (t) { return t === 'primeira'; })) reg.dominada = true;
    S.sequencia = primeira ? S.sequencia + 1 : 0;
    S.melhorSequencia = Math.max(S.melhorSequencia, S.sequencia);
    S.pontos += primeira ? 100 : (tipo === 'dica' ? 50 : 10);
    gravarSave();
    desenharHUD();

    // Registro anônimo (professores/registro.html). erro: lugares errados tocados
    // (encontrar), passos que afastaram do destino (ir) ou paradas erradas (rota).
    var m = S.missao;
    var demo = tipo === 'demo';
    var dados = m.tipo === 'ir'
      ? { tentativas: 1, dicas: Math.min(S.erros, 2), erro: S.erros }
      : m.tipo === 'rota'
        ? { tentativas: demo ? S.tentativa - 1 : S.tentativa, dicas: Math.min(S.tentativa - 1, 1), erro: S.tentativa - 1 }
        : { tentativas: demo ? S.tentativa - 1 : S.tentativa, dicas: Math.min(S.tentativa - 1, 2), erro: S.errados.length };
    registro.item({
      etapa: S.etapa,
      item: m.tipo + ' · ' + m.mapa + ' · ' + (m.alvo || m.destino || '') + (m.dir ? ' (' + m.dir + ')' : '') +
        (m.giro ? ' · girado ' + m.giro + '°' : ''),
      resultado: tipo,
      tentativas: dados.tentativas,
      dicas: dados.dicas,
      erro: dados.erro
    });
  }

  function rotuloProximo() { return S.indice + 1 >= S.total ? 'Ver resultado' : 'Próxima missão'; }

  // Sobe de etapa após 3 acertos de primeira seguidos; volta após 3 missões
  // sem acerto (demonstradas). Acertar com ajuda não faz descer.
  function adaptar() {
    var h = S.historico[S.etapa] || [];
    var ultimos = h.slice(-3);
    if (ultimos.length < 3) return null;
    if (ultimos.every(function (t) { return t === 'primeira'; }) && S.etapa < C.ETAPAS.length) {
      S.etapa += 1;
      S.historico[S.etapa] = [];
      return 'sobe';
    }
    if (ultimos.every(function (t) { return t === 'demo'; }) && S.etapa > 1) {
      S.etapa -= 1;
      S.historico[S.etapa] = [];
      return 'desce';
    }
    return null;
  }

  function proximo() {
    S.indice += 1;
    var mudanca = adaptar();
    // Guarda a etapa já na mudança: quem sai no meio não perde o que conquistou.
    if (mudanca && !S.etapaDaUrl) { save.etapa = S.etapa; gravarSave(); }
    if (S.indice >= S.total) { finalizar(); return; }
    var fala = null;
    if (mudanca === 'sobe') {
      som('etapa');
      // Apresenta a novidade da etapa antes da primeira missão dela.
      var nova = etapaAtual();
      aviso('Nova etapa: ' + nova.nome + '! ' + (nova.apresenta || ''));
      fala = [F.novaEtapa(nova), nova.apresenta];
    } else if (mudanca === 'desce') {
      aviso('Vamos treinar mais um pouco: ' + etapaAtual().nome + '.');
      fala = F.treinar;
    }
    iniciarMissao(fala);
  }

  function finalizar() {
    definirEstado('fim');
    save.sessoes += 1;
    if (!S.etapaDaUrl) save.etapa = S.etapa;
    gravarSave();
    desenharHUD();
    registro.fim({ etapa: S.etapa });

    var primeira = S.resultados.filter(function (r) { return r.tipo === 'primeira'; }).length;
    var ajuda = S.resultados.filter(function (r) { return r.tipo === 'dica'; }).length;
    var juntos = S.resultados.filter(function (r) { return r.tipo === 'demo'; }).length;
    var resumo = $('fim-resumo');
    resumo.textContent = '';
    [[primeira + ' de ' + S.total, 'de primeira'], [String(ajuda), 'com ajuda'], [String(juntos), 'vimos juntos']]
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
    calar();
    definirEstado('inicio');
    S.missao = null;
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
  svg.addEventListener('click', function (e) {
    var grupo = e.target.closest('.lugar');
    if (grupo && S.missao && S.missao.tipo === 'encontrar') tocarLugar(grupo.getAttribute('data-id'));
  });
  svg.addEventListener('keydown', function (e) {
    var grupo = e.target.closest && e.target.closest('.lugar');
    if (grupo && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); tocarLugar(grupo.getAttribute('data-id')); }
  });
  document.querySelectorAll('.btn-direcao').forEach(function (botao) {
    botao.addEventListener('click', function () { mover(botao.dataset.dir); });
  });
  $('btn-cheguei').addEventListener('click', pedirCheguei);
  $('btn-recomecar').addEventListener('click', function () { if (S.estado === 'andando') recomecarRota(); });
  $('btn-confirmar').addEventListener('click', function () {
    if (S.estado !== 'confirmando') return;
    if (S.missao.tipo === 'encontrar') avaliarToque(S.tocado);
    else avaliarRota();
  });
  $('btn-mudar').addEventListener('click', function () {
    if (S.estado !== 'confirmando') return;
    Base.fimDaPergunta();
    S.perguntando = false;
    S.tocado = null;
    definirEstado(S.missao.tipo === 'encontrar' ? 'procurando' : 'andando');
    desenharTudo();
    mostrarControles('acao');
  });
  $('btn-seguir').addEventListener('click', function () {
    if (S.estado === 'feedback' && acaoSeguir) acaoSeguir();
  });
  $('btn-ouvir').addEventListener('click', function () { if (S.missao) falar(S.missao.texto); });
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
      var resposta = estrategia.id === 'chute' ? F.obrigadoChute : F.obrigado;
      $('fim-obrigado').textContent = resposta;
      $('fim-obrigado').hidden = false;
      falar(resposta);
    });
    $('fim-opcoes').appendChild(botao);
  });

  var portal = Base.conectarPortal({
    aoPausar: function () { S.pausado = true; $('tela-pausa').hidden = false; },
    aoContinuar: function () { S.pausado = false; $('tela-pausa').hidden = true; },
    aoReiniciar: function () { S.pausado = false; $('tela-pausa').hidden = true; voltarAoInicio(); }
  });

  Base.barraDoProfessor(GAME_ID);
  voltarAoInicio();
  portal.pronto();
})();
