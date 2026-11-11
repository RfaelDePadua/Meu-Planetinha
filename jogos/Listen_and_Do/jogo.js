/**
 * jogo.js — Listen & Do (Globish · Inglês).
 *
 * A criança ouve um comando em inglês e faz na cena: toca na coisa pedida
 * ("Touch the red ball") ou leva coisas até um lugar ("Put the cat under the
 * table"). O comando é só ouvido; o texto aparece como dica, com a palavra
 * que decide destacada e traduzida. Ao errar: primeiro o jogo diz o que a
 * criança fez e repete o comando devagar; depois mostra a palavra-chave; por
 * fim demonstra.
 *
 * Base: palavras de outra língua com áudio e ação ficam mais tempo na memória
 * das crianças (Andrä et al., 2020). Ver docs/PESQUISA_JOGOS.md.
 *
 * Parâmetros para o professor (URL): ?etapa=1..5  ?tarefas=4..12  ?dupla=1
 * ?texto=1 (mostra o comando escrito desde o começo)
 */
(function () {
  'use strict';

  var C = window.ListenConteudo;
  var F = C.FALAS;
  var Base = window.PlanetinhaJogo;
  var GAME_ID = 'listen-and-do';
  var SAVE_KEY = 'meu-planetinha.listen-and-do.v1';
  var NS = 'http://www.w3.org/2000/svg';
  var TAM = 72;   // tamanho de uma coisa na cena

  var params = new URLSearchParams(location.search);

  function $(id) { return document.getElementById(id); }
  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

  var app = $('app');
  var cena = $('cena');
  var camadaCoisas = $('camada-coisas');
  var camadaVagas = $('camada-vagas');

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
    return Boolean(e && e.dominada);
  }

  // A etapa está vencida com pelo menos 5 tarefas feitas e as 3 últimas de primeira
  // (para não valer com palavras que a criança nem ouviu).
  function etapaVencida(h) {
    return h.length >= 5 && h.slice(-3).every(function (t) { return t === 'primeira'; });
  }

  /* ------------------------------------------------
     Estado
     ------------------------------------------------ */
  var S = {
    estado: 'inicio',      // inicio | ouvindo | arrumando | confirmando | feedback | fim
    modo: 'solo',
    total: clamp(parseInt(params.get('tarefas'), 10) || 8, 4, 12),
    sempreTexto: params.get('texto') === '1',
    // Sem som no computador: em dupla, um lê o comando em voz alta e o outro faz.
    leitor: params.get('leitor') === '1',
    leitorMostrando: false,
    semVoz: false,
    indice: 0,
    etapa: 1,
    item: null,
    objetos: [],
    nos: {},
    selecionado: null,     // coisa escolhida para mover
    tocado: null,          // coisa tocada, esperando o parceiro confirmar
    tentativa: 1,
    motivos: [],
    palavraChave: null,
    mostrarTexto: false,
    revelado: false,
    marcas: {},
    resultados: [],
    recentes: [],
    historico: {},
    dominadasAntes: [],
    sequencia: 0,
    melhorSequencia: 0,
    pontos: 0,
    pausado: false,
    jaInstruiu: {},
    avisouFones: false
  };

  function etapaAtual() { return C.ETAPAS[S.etapa - 1]; }
  function ouvinteAtual() { return (S.indice % 2) + 1; }
  function comando() { return C.comandoEn(S.item); }
  function tipoDaTarefa() { return S.item.tipo === 'tocar' ? 'tocar' : (S.item.alvos.length > 1 ? 'dois' : 'colocar'); }
  function objeto(id) { return S.objetos.filter(function (o) { return o.id === id; })[0]; }
  function vagaXY(vaga) { var p = vaga.split('#'); return C.LUGARES[p[0]].vagas[Number(p[1])]; }
  function ocupada(vaga, excetoId) { return S.objetos.some(function (o) { return o.vaga === vaga && o.id !== excetoId; }); }
  function moveu() { return S.objetos.some(function (o) { return o.vaga !== o.inicio; }); }
  function semPonto(t) { return t.replace(/[.!]$/, ''); }

  /* ------------------------------------------------
     Voz e sons
     ------------------------------------------------ */
  var voz = Base.criarVoz();
  var falar = voz.falar;
  var calar = voz.calar;
  var som = Base.som;
  var registro = Base.criarRegistro(GAME_ID);

  // Sem nenhuma voz (nem gravada, nem do navegador), o comando aparece escrito.
  voz.aoMudarDisponibilidade(function (disponivel) {
    S.semVoz = !disponivel;
    $('btn-ouvir').hidden = !disponivel || S.leitor;
    $('btn-devagar').hidden = !disponivel || S.leitor;
    $('btn-ouvir-reflexao').hidden = !disponivel;
    if (S.item) desenharEnunciado();
  });

  function ouvirComando(lento) { falar(lento ? C.enLento(comando()) : C.en(comando())); }

  /* ------------------------------------------------
     Desenho
     ------------------------------------------------ */
  function el(tag, attrs, pai) {
    var no = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { no.setAttribute(k, attrs[k]); });
    if (pai) pai.appendChild(no);
    return no;
  }

  function criarCoisas() {
    camadaCoisas.textContent = '';
    S.nos = {};
    S.objetos.forEach(function (o) {
      var g = el('g', { 'data-id': o.id, role: 'button', 'aria-label': C.descPt(o) }, camadaCoisas);
      el('circle', { 'class': 'coisa__halo', cx: TAM / 2, cy: TAM / 2, r: TAM / 2 + 6 }, g);
      var uso = el('use', { href: '#c-' + o.coisa, width: TAM, height: TAM }, g);
      if (o.cor) uso.style.setProperty('--cor', C.CORES[o.cor].hex);
      S.nos[o.id] = g;
    });
  }

  function desenharCoisas() {
    var interativo = S.estado === 'ouvindo' || S.estado === 'arrumando';
    S.objetos.forEach(function (o) {
      var g = S.nos[o.id];
      var xy = vagaXY(o.vaga);
      var classes = 'coisa';
      if (S.selecionado === o.id || S.tocado === o.id) classes += ' selecionada';
      if (S.marcas[o.id]) classes += ' ' + S.marcas[o.id];
      g.setAttribute('class', classes);
      g.setAttribute('tabindex', interativo ? '0' : '-1');
      g.style.transform = 'translate(' + (xy[0] - TAM / 2) + 'px, ' + (xy[1] - TAM) + 'px)';
    });
  }

  function desenharVagas() {
    camadaVagas.textContent = '';
    if (S.estado !== 'arrumando' || !S.selecionado) return;
    var escolhido = objeto(S.selecionado);
    C.todasAsVagas().forEach(function (v) {
      if (v === escolhido.vaga || ocupada(v, escolhido.id)) return;
      var xy = vagaXY(v);
      var g = el('g', {
        'class': 'vaga', 'data-vaga': v, role: 'button', tabindex: '0',
        'aria-label': 'Colocar ' + C.lugarPt(C.lugarDaVaga(v))
      }, camadaVagas);
      el('circle', { cx: xy[0], cy: xy[1] - TAM / 2, r: TAM / 2 + 2 }, g);
    });
  }

  function desenharEnunciado() {
    $('tarefa-tipo').textContent = { tocar: 'Ouça e toque', colocar: 'Ouça e coloque', dois: 'Dois comandos' }[tipoDaTarefa()];
    var caixa = $('comando-texto');
    caixa.textContent = '';
    var mostrar = S.sempreTexto || S.mostrarTexto || S.semVoz || S.mudo || S.revelado;
    var aviso = $('leitor-aviso');
    var botao = $('btn-leitor');
    aviso.hidden = !S.leitor;
    $('btn-ouvir').hidden = S.leitor || S.semVoz;
    $('btn-devagar').hidden = S.leitor || S.semVoz;
    botao.hidden = !S.leitor || S.revelado || (S.estado !== 'ouvindo' && S.estado !== 'arrumando');
    if (S.leitor) {
      // Na confirmação, o comando volta a aparecer para o leitor conferir.
      mostrar = S.leitorMostrando || S.mostrarTexto || S.revelado || S.estado === 'confirmando';
      aviso.textContent = S.leitorMostrando
        ? 'Leitor ' + leitorAtual() + ': leia em voz alta, em inglês. Ouvinte ' + ouvinteAtual() + ': não olhe, só escute!'
        : 'Ouvinte ' + ouvinteAtual() + ': faça o que ouviu. Pode pedir para ler de novo.';
      botao.textContent = S.leitorMostrando ? 'Já li em voz alta' : 'Ler de novo';
    }
    caixa.classList.toggle('escondido', !mostrar);
    if (!mostrar) {
      caixa.lang = 'pt-BR';
      caixa.textContent = S.leitor ? '(comando escondido)' : 'Ouça o comando em inglês.';
      return;
    }
    caixa.lang = 'en';
    var frase = comando();
    var marcou = false;
    if (S.palavraChave) {
      // Procura a palavra-chave a partir da parte do comando que fala do alvo.
      var inicio = Math.max(0, frase.toLowerCase().indexOf(C.descEn(S.palavraChave.alvo).toLowerCase()));
      var re = new RegExp('\\b' + S.palavraChave.en.replace(/ /g, '\\s') + '\\b', 'i');
      var m = re.exec(frase.slice(inicio));
      if (m) {
        var pos = inicio + m.index;
        caixa.appendChild(document.createTextNode(frase.slice(0, pos)));
        var marca = document.createElement('mark');
        marca.textContent = m[0];
        caixa.appendChild(marca);
        caixa.appendChild(document.createTextNode(frase.slice(pos + m[0].length)));
        marcou = true;
      }
    }
    if (!marcou) caixa.textContent = frase;
    if (S.revelado) {
      var traducao = document.createElement('small');
      traducao.lang = 'pt-BR';
      traducao.textContent = C.comandoPt(S.item);
      caixa.appendChild(traducao);
    }
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
    var ouvinte = $('hud-ouvinte');
    ouvinte.hidden = S.modo !== 'dupla';
    ouvinte.textContent = S.leitor ? 'Ouvinte ' + ouvinteAtual() + ' · Leitor ' + leitorAtual() : 'Ouvinte ' + ouvinteAtual() + ' na vez';
  }

  function desenharControles() {
    var colocar = S.item.tipo === 'colocar';
    $('dica-toque').textContent = !colocar ? 'Toque na coisa que o comando pede.'
      : (S.selecionado ? 'Agora toque no lugar.' : 'Toque na coisa e depois no lugar.');
    $('btn-desfazer').hidden = !colocar;
    $('btn-pronto').hidden = !colocar;
    var ativo = S.estado === 'arrumando' && moveu();
    $('btn-desfazer').disabled = !ativo;
    $('btn-pronto').disabled = !ativo;
  }

  function desenharTudo() {
    desenharEnunciado();
    desenharCoisas();
    desenharVagas();
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
    avisoTimer = setTimeout(function () { no.hidden = true; }, 3200);
  }

  /* ------------------------------------------------
     Fluxo
     ------------------------------------------------ */
  function escolherItem() {
    var etapa = etapaAtual();
    var chaves = etapa.itens.map(function (_, i) { return etapa.id + '-' + i; });
    var livres = chaves.filter(function (k) { return S.recentes.indexOf(k) === -1; });
    var lista = livres.length ? livres : chaves;
    var chave = lista[Math.floor(Math.random() * lista.length)];
    S.recentes.push(chave);
    if (S.recentes.length > 3) S.recentes.shift();
    return etapa.itens[Number(chave.split('-')[1])];
  }

  function iniciarSessao(modo, leitor) {
    calar();
    S.modo = modo;
    if (leitor !== undefined) S.leitor = leitor;
    if (S.leitor) S.modo = 'dupla';
    registro.iniciarSessao(S.leitor ? 'leitor' : S.modo);
    S.indice = 0;
    S.resultados = [];
    S.recentes = [];
    S.historico = {};
    S.sequencia = 0;
    S.melhorSequencia = 0;
    S.pontos = 0;
    S.jaInstruiu = {};
    // ?etapa= é para o professor experimentar: não muda o progresso salvo.
    S.etapaDaUrl = Boolean(parseInt(params.get('etapa'), 10));
    S.etapa = clamp(parseInt(params.get('etapa'), 10) || save.etapa || 1, 1, C.ETAPAS.length);
    S.dominadasAntes = C.ETAPAS.filter(function (e) { return dominada(e.id); }).map(function (e) { return e.id; });
    $('tela-inicio').hidden = true;
    $('tela-fim').hidden = true;
    iniciarTarefa(null);
  }

  function iniciarTarefa(falaAntes) {
    S.item = escolherItem();
    S.objetos = C.montarCena(S.item, S.etapa);
    S.tentativa = 1;
    S.parceiroOuviu = false;
    S.motivos = [];
    S.palavraChave = null;
    S.mostrarTexto = false;
    S.leitorMostrando = S.leitor;
    S.revelado = false;
    S.marcas = {};
    S.selecionado = null;
    S.tocado = null;
    registro.iniciarItem();
    definirEstado(S.item.tipo === 'tocar' ? 'ouvindo' : 'arrumando');
    criarCoisas();
    desenharTudo();
    mostrarControles('acao');

    var tipo = tipoDaTarefa();
    var falas = [falaAntes];
    if (S.modo === 'dupla') falas.push(F.ouvinte(ouvinteAtual()));
    if (tipo === 'dois' && !S.jaInstruiu.colocar) { S.jaInstruiu.colocar = true; falas.push(F.instrucaoColocar); }
    if (!S.jaInstruiu[tipo]) {
      S.jaInstruiu[tipo] = true;
      falas.push({ tocar: F.instrucaoTocar, colocar: F.instrucaoColocar, dois: F.instrucaoDois }[tipo]);
    }
    if (S.leitor) {
      // O comando em inglês não é falado: quem lê é o colega.
      falar(falas);
      return;
    }
    if (!S.avisouFones && S.indice === 0 && (!save.sessoes || S.modo === 'dupla')) {
      S.avisouFones = true;
      falas.push(S.modo === 'dupla' ? F.fonesDupla : F.fones);
    }
    falas.push(C.en(comando()));
    falar(falas);
    voz.preCarregar([C.enLento(comando()), C.comandoPt(S.item)]);
  }

  /* ── Tocar e mover ───────────────────────────────── */
  function tocarCoisa(id) {
    if (S.pausado) return;
    if (S.estado === 'ouvindo') {
      if (S.modo === 'dupla') {
        S.tocado = id;
        pedirConfirmacao();
        return;
      }
      avaliarToque(id);
      return;
    }
    if (S.estado === 'arrumando') {
      S.selecionado = S.selecionado === id ? null : id;
      som('tique');
      desenharTudo();
      var primeiraVaga = camadaVagas.querySelector('.vaga');
      if (primeiraVaga && document.activeElement && document.activeElement.closest &&
          document.activeElement.closest('.coisa')) primeiraVaga.focus({ preventScroll: true });
    }
  }

  function escolherVaga(vaga) {
    if (S.estado !== 'arrumando' || !S.selecionado || S.pausado) return;
    var o = objeto(S.selecionado);
    if (ocupada(vaga, o.id)) return;
    o.vaga = vaga;
    S.selecionado = null;
    som('tique');
    desenharTudo();
    $('anuncio').textContent = 'Você colocou ' + C.descPt(o) + ' ' + C.lugarPt(C.lugarDaVaga(vaga)) + '.';
  }

  function desfazer() {
    if (S.estado !== 'arrumando') return;
    S.objetos.forEach(function (o) { o.vaga = o.inicio; });
    S.selecionado = null;
    desenharTudo();
  }

  function pedirConfirmacao() {
    definirEstado('confirmando');
    desenharTudo();
    var parceiro = ouvinteAtual() === 1 ? 2 : 1;
    mostrarControles('confirma');
    // O parceiro ouve o comando antes de concordar (com um fone só, ele não
    // tinha ouvido). Sem som, o comando já aparece escrito.
    if (!semSom() && !S.parceiroOuviu) {
      Base.perguntarAoParceiro({
        texto: 'Ouvinte ' + parceiro + ': ouça o comando antes de responder.',
        opcoes: [{ rotulo: 'Ouvir o comando', valor: true }],
        aoResponder: function () {
          S.parceiroOuviu = true;
          $('confirma-texto').textContent = 'Ouvinte ' + parceiro + ', você concorda?';
          $('btn-confirmar').focus({ preventScroll: true });
          falar([C.en(comando()), F.confirma(parceiro)]);
        }
      });
      falar([F.ouvinte(parceiro), F.ouvirAntes]);
      return;
    }
    $('confirma-texto').textContent = S.leitor ? 'Leitor ' + parceiro + ': foi isso que você leu?' : 'Ouvinte ' + parceiro + ', você concorda?';
    $('btn-confirmar').focus({ preventScroll: true });
    if (!S.leitor) falar(F.confirma(parceiro));
  }

  function pedirPronto() {
    if (S.estado !== 'arrumando' || S.pausado || !moveu()) return;
    S.selecionado = null;
    if (S.modo === 'dupla') { pedirConfirmacao(); return; }
    avaliarArrumacao();
  }

  /* ── Conferir ────────────────────────────────────── */
  function confere(alvo) {
    var o = C.objetoDoAlvo(S.objetos, alvo);
    return Boolean(o) && C.lugarDaVaga(o.vaga) === alvo.lugar;
  }

  function avaliarToque(id) {
    S.tocado = null;
    var o = objeto(id);
    var alvo = S.item.alvos[0];
    S.marcas = {};
    if (o.coisa === alvo.coisa && (!alvo.cor || o.cor === alvo.cor)) {
      S.marcas[id] = 'certa';
      sucesso();
      return;
    }
    S.marcas[id] = 'errada';
    errar(o.coisa !== alvo.coisa ? 'coisa' : 'cor', alvo,
      [F.tocou(o), C.en(C.descEn(o))],
      'Você tocou ' + C.descPt(o) + ' (' + C.descEn(o) + ').');
  }

  function avaliarArrumacao() {
    var falhas = S.item.alvos.filter(function (a) { return !confere(a); });
    S.marcas = {};
    if (!falhas.length) {
      S.item.alvos.forEach(function (a) { S.marcas[C.objetoDoAlvo(S.objetos, a).id] = 'certa'; });
      sucesso();
      return;
    }
    // Fala primeiro do que a criança mexeu: um alvo levado ao lugar errado.
    var movido = function (a) { var x = C.objetoDoAlvo(S.objetos, a); return x.vaga !== x.inicio ? 1 : 0; };
    falhas.sort(function (a, b) { return movido(b) - movido(a); });
    var alvo = falhas[0];
    var umCerto = falhas.length < S.item.alvos.length;
    var falas = umCerto ? [F.umCerto] : [];
    var texto = umCerto ? F.umCerto + ' ' : '';
    // A parte certa fica marcada em verde.
    S.item.alvos.forEach(function (a) { if (falhas.indexOf(a) === -1) S.marcas[C.objetoDoAlvo(S.objetos, a).id] = 'certa'; });
    var o = C.objetoDoAlvo(S.objetos, alvo);

    if (o.vaga !== o.inicio) {
      // A coisa certa foi para o lugar errado: a preposição ou o móvel.
      var lugar = C.lugarDaVaga(o.vaga);
      S.marcas[o.id] = 'errada';
      var motivo = C.LUGARES[lugar].prep !== C.LUGARES[alvo.lugar].prep ? 'prep' : 'movel';
      errar(motivo, alvo, falas.concat([F.colocou(o), F.lugar(lugar), C.en(C.lugarEn(lugar))]),
        texto + 'Você colocou ' + C.descPt(o) + ' ' + C.lugarPt(lugar) + ' (' + C.lugarEn(lugar) + ').');
      return;
    }
    // A coisa pedida não saiu do lugar: outra coisa foi movida.
    var alvosObjs = S.item.alvos.map(function (a) { return C.objetoDoAlvo(S.objetos, a); });
    var outra = S.objetos.filter(function (x) { return x.vaga !== x.inicio && alvosObjs.indexOf(x) === -1; })[0];
    if (outra) {
      var lugarOutra = C.lugarDaVaga(outra.vaga);
      S.marcas[outra.id] = 'errada';
      errar(outra.coisa === alvo.coisa ? 'cor' : 'coisa', alvo,
        falas.concat([F.colocou(outra), F.lugar(lugarOutra), F.outraCoisa]),
        texto + 'Você colocou ' + C.descPt(outra) + ' ' + C.lugarPt(lugarOutra) + '. ' + F.outraCoisa);
      return;
    }
    errar('coisa', alvo, falas, texto.trim() || F.outraCoisa);
  }

  function palavraDoErro(motivo, alvo) {
    if (motivo === 'coisa') return { tipo: 'coisa', valor: alvo.coisa };
    if (motivo === 'cor') return { tipo: 'cor', valor: alvo.cor };
    if (motivo === 'prep') return { tipo: 'prep', valor: C.LUGARES[alvo.lugar].prep };
    return { tipo: 'movel', valor: C.LUGARES[alvo.lugar].movel };
  }

  // Dicas em camadas: 1º erro, o que a criança fez e o comando devagar;
  // 2º erro, a palavra que decide, destacada e traduzida; 3º erro, demonstração.
  function errar(motivo, alvo, falasDoErro, textoDoErro) {
    S.motivos.push(motivo);
    S.tentativa += 1;
    if (S.tentativa > 3) { demonstrar(); return; }
    som('quase');
    var falas = [F.aindaNao].concat(falasDoErro);
    var texto = textoDoErro;
    if (S.tentativa === 2) {
      falas.push(F.ouvirDeNovo, C.enLento(comando()));
      texto += S.leitor ? ' O leitor lê de novo, bem devagar.' : (semSom() ? ' Leia de novo com atenção.' : ' Ouça de novo, mais devagar.');
    } else {
      var p = palavraDoErro(motivo, alvo);
      var sig = C.significado(p.tipo, p.valor);
      S.palavraChave = { en: sig.en, pt: sig.pt, alvo: alvo };
      S.mostrarTexto = true;
      falas.push(C.en(sig.en), C.querDizer(p.tipo, p.valor), F.ouvirDeNovo, C.enLento(comando()));
      texto += ' Preste atenção em "' + sig.en + '": quer dizer ' + sig.pt + '.';
    }
    definirEstado('feedback');
    desenharTudo();
    mostrarFeedback('quase', semPonto(F.aindaNao), texto, 'Tentar de novo', tentarDeNovo);
    falar(falas);
  }

  function semSom() { return S.mudo || S.semVoz || S.sempreTexto || S.leitor; }
  function leitorAtual() { return ouvinteAtual() === 1 ? 2 : 1; }

  // Volta ao início o que foi mexido por engano (fica só o que está certo):
  // assim a próxima avaliação fala só do que a criança fizer agora.
  function tentarDeNovo() {
    if (S.item.tipo !== 'tocar') {
      var certos = S.item.alvos.filter(confere).map(function (a) { return C.objetoDoAlvo(S.objetos, a); });
      S.objetos.forEach(function (o) { if (certos.indexOf(o) === -1) o.vaga = o.inicio; });
    }
    S.selecionado = null;
    S.marcas = {};
    S.leitorMostrando = S.leitor; // o leitor lê de novo
    definirEstado(S.item.tipo === 'tocar' ? 'ouvindo' : 'arrumando');
    desenharTudo();
    mostrarControles('acao');
  }

  // Demonstração: mostra a coisa certa ou leva cada coisa ao lugar pedido.
  function demonstrar() {
    registrar('demo');
    S.revelado = true;
    S.palavraChave = null;
    S.selecionado = null;
    S.marcas = {};
    S.item.alvos.forEach(function (a) {
      var o = C.objetoDoAlvo(S.objetos, a);
      if (a.lugar && C.lugarDaVaga(o.vaga) !== a.lugar) {
        var vaga = C.LUGARES[a.lugar].vagas.map(function (_, i) { return a.lugar + '#' + i; })
          .filter(function (v) { return !ocupada(v, o.id); })[0];
        if (!vaga) {
          // Lugar cheio: troca de posição com quem está lá.
          vaga = a.lugar + '#0';
          var ocupante = S.objetos.filter(function (x) { return x.vaga === vaga; })[0];
          if (ocupante) ocupante.vaga = o.vaga;
        }
        o.vaga = vaga;
      }
      S.marcas[o.id] = 'certa pulsar';
    });
    definirEstado('feedback');
    desenharTudo();
    mostrarFeedback('demo', semPonto(F.vamosVer), comando() + ' = ' + C.comandoPt(S.item), rotuloProximo(), proximo);
    falar([F.vamosVer, C.en(comando()), C.comandoPt(S.item)]);
  }

  function sucesso() {
    var primeira = S.tentativa === 1;
    registrar(primeira ? 'primeira' : 'dica');
    som('acerto');
    S.revelado = true;
    S.palavraChave = null;
    definirEstado('feedback');
    desenharTudo();
    var titulo = primeira ? F.isso : F.issoAjuda;
    mostrarFeedback('acerto', semPonto(titulo), comando() + ' = ' + C.comandoPt(S.item), rotuloProximo(), proximo);
    falar([titulo, C.en(comando())]);
  }

  function registrar(tipo) {
    var primeira = tipo === 'primeira';
    S.resultados[S.indice] = { tipo: tipo, etapa: S.etapa };
    var historico = S.historico[S.etapa] = S.historico[S.etapa] || [];
    historico.push(tipo);
    var reg = save.etapas[S.etapa] = save.etapas[S.etapa] || { tentativas: 0, acertos: 0 };
    reg.tentativas += 1;
    if (primeira) reg.acertos += 1;
    if (etapaVencida(historico)) reg.dominada = true;
    S.sequencia = primeira ? S.sequencia + 1 : 0;
    S.melhorSequencia = Math.max(S.melhorSequencia, S.sequencia);
    S.pontos += primeira ? 100 : (tipo === 'dica' ? 50 : 10);
    gravarSave();
    desenharHUD();

    // Registro anônimo (professores/registro.html). erro = o que estava errado
    // em cada tentativa: coisa, cor, prep (in/on/under/next to) ou movel.
    registro.item({
      etapa: S.etapa,
      item: comando(),
      resultado: tipo,
      tentativas: tipo === 'demo' ? S.tentativa - 1 : S.tentativa,
      dicas: Math.min(S.tentativa - 1, 2),
      erro: S.motivos.join(' ')
    });
  }

  function rotuloProximo() { return S.indice + 1 >= S.total ? 'Ver resultado' : 'Próxima'; }

  // Sobe de etapa quando ela está vencida (ver etapaVencida); volta após 3 tarefas
  // sem acerto (demonstradas). Acertar com ajuda não faz voltar.
  function adaptar() {
    var h = S.historico[S.etapa] || [];
    var ultimos = h.slice(-3);
    if (ultimos.length < 3) return null;
    if (etapaVencida(h) && S.etapa < C.ETAPAS.length) {
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
      aviso('Nova etapa: ' + etapaAtual().nome + '!');
      fala = F.novaEtapa(etapaAtual());
    } else if (mudanca === 'desce') {
      aviso('Vamos treinar mais um pouco: ' + etapaAtual().nome + '.');
      fala = F.treinar;
    }
    iniciarTarefa(fala);
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
      var reg = save.etapas[etapa.id];
      if (feita && S.dominadasAntes.indexOf(etapa.id) === -1) novas.push(etapa);
      var li = document.createElement('li');
      li.className = feita ? 'dominada' : (reg ? 'praticando' : '');
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
      estado.textContent = feita ? 'dominada' : (reg ? 'praticando' : 'a descobrir');
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
    S.item = null;
    camadaCoisas.textContent = '';
    camadaVagas.textContent = '';
    var etapa = C.ETAPAS[clamp(parseInt(params.get('etapa'), 10) || save.etapa || 1, 1, C.ETAPAS.length) - 1];
    $('inicio-etapa').textContent = 'Etapa ' + etapa.id + ' de ' + C.ETAPAS.length + ': ' + etapa.nome;
    $('tela-fim').hidden = true;
    $('tela-inicio').hidden = false;
    (params.get('dupla') === '1' ? $('btn-dupla') : $('btn-solo')).focus({ preventScroll: true });
  }

  /* ------------------------------------------------
     Entrada
     ------------------------------------------------ */
  function acionar(alvo) {
    var coisa = alvo.closest && alvo.closest('.coisa');
    if (coisa) { tocarCoisa(coisa.getAttribute('data-id')); return true; }
    var vaga = alvo.closest && alvo.closest('.vaga');
    if (vaga) { escolherVaga(vaga.getAttribute('data-vaga')); return true; }
    return false;
  }
  cena.addEventListener('click', function (e) { acionar(e.target); });
  cena.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && acionar(e.target)) e.preventDefault();
  });
  $('btn-ouvir').addEventListener('click', function () { if (S.item) ouvirComando(false); });
  $('btn-devagar').addEventListener('click', function () { if (S.item) ouvirComando(true); });
  $('btn-desfazer').addEventListener('click', desfazer);
  $('btn-pronto').addEventListener('click', pedirPronto);
  $('btn-confirmar').addEventListener('click', function () {
    if (S.estado !== 'confirmando') return;
    if (S.item.tipo === 'tocar') avaliarToque(S.tocado);
    else avaliarArrumacao();
  });
  $('btn-mudar').addEventListener('click', function () {
    if (S.estado !== 'confirmando') return;
    Base.fimDaPergunta();
    S.tocado = null;
    definirEstado(S.item.tipo === 'tocar' ? 'ouvindo' : 'arrumando');
    desenharTudo();
    mostrarControles('acao');
  });
  $('btn-seguir').addEventListener('click', function () {
    if (S.estado === 'feedback' && acaoSeguir) acaoSeguir();
  });
  $('btn-solo').addEventListener('click', function () { iniciarSessao('solo', false); });
  $('btn-dupla').addEventListener('click', function () { iniciarSessao('dupla', false); });
  $('btn-leitor').addEventListener('click', function () {
    if (!S.leitor || S.pausado) return;
    S.leitorMostrando = !S.leitorMostrando;
    desenharTudo();
  });
  $('btn-sem-som').addEventListener('click', function () { iniciarSessao('dupla', true); });
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
    aoReiniciar: function () { S.pausado = false; $('tela-pausa').hidden = true; voltarAoInicio(); },
    // Portal silenciado: o comando aparece escrito (senão a criança fica sem saber o que fazer).
    aoSilenciar: function (mudo) { S.mudo = mudo; if (S.item) desenharEnunciado(); }
  });

  Base.barraDoProfessor(GAME_ID);
  voltarAoInicio();
  portal.pronto();
})();
