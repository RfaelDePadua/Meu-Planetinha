/**
 * jogo.js — Detetive de Letrion (Letrion · Português).
 *
 * A criança lê um caso curto e resolve mistérios sobre ele. Para resolver,
 * precisa escolher a resposta E marcar as frases do texto que a provam: a
 * busca de evidências no texto é a própria mecânica. Errou? Primeiro uma
 * explicação e uma estratégia; depois o jogo aponta a parte do texto; por
 * fim, demonstra.
 *
 * Base: Elleman (2017), ITSS (WWC 2020) e demais fontes em docs/PESQUISA_JOGOS.md.
 *
 * Parâmetros para o professor (URL): ?nivel=1..3  ?casos=2..6  ?dupla=1  ?audio=0
 * (audio=0 esconde o botão "Ouvir o texto", para treinar a leitura sem apoio).
 */
(function () {
  'use strict';

  var C = window.DetetiveConteudo;
  var F = C.FALAS;
  var Base = window.PlanetinhaJogo;
  var GAME_ID = 'detetive-de-letrion';
  var SAVE_KEY = 'meu-planetinha.detetive-de-letrion.v1';
  var NIVEIS = 3;
  var LETRAS = ['A', 'B', 'C', 'D'];

  var params = new URLSearchParams(location.search);

  function $(id) { return document.getElementById(id); }
  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

  var app = $('app');

  /* ------------------------------------------------
     Progresso salvo neste dispositivo (sem dados pessoais)
     ------------------------------------------------ */
  function lerSave() {
    try {
      var salvo = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (salvo && salvo.versao === 1) return salvo;
    } catch (e) { /* armazenamento indisponível: segue sem salvar */ }
    return { versao: 1, nivel: 1, feitos: [], tipos: {}, estrategias: {}, sessoes: 0 };
  }

  function gravarSave() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignora */ }
  }

  var save = lerSave();

  function dominado(tipo) {
    var t = save.tipos[tipo];
    return Boolean(t && t.acertos >= 3 && t.acertos / t.tentativas >= 0.75);
  }

  /* ------------------------------------------------
     Estado
     ------------------------------------------------ */
  var S = {
    estado: 'inicio',   // inicio | resolvendo | confirmando | feedback | fim
    modo: 'solo',
    totalCasos: clamp(parseInt(params.get('casos'), 10) || 3, 2, 6),
    nivel: 1,
    caso: null,
    casoNum: 0,
    misterio: null,
    misterioIdx: 0,
    ordem: [],            // ordem embaralhada das opções
    escolha: null,        // índice da opção escolhida (na lista original)
    marcadas: [],         // frases marcadas como pista
    tentativa: 1,
    respostaTravada: false,
    revelada: false,
    regiao: false,
    resultados: [],
    feitosSessao: [],
    dominadosAntes: [],
    sequencia: 0,
    melhorSequencia: 0,
    pontos: 0,
    pausado: false,
    leitura: 0            // invalida a leitura em voz alta em andamento
  };

  /* ------------------------------------------------
     Voz
     ------------------------------------------------ */
  var voz = Base.criarVoz();
  var som = Base.som;
  var registro = Base.criarRegistro(GAME_ID);
  var audioDoTexto = params.get('audio') !== '0';

  voz.aoMudarDisponibilidade(function (disponivel) {
    $('btn-ouvir').hidden = !disponivel;
    $('btn-ouvir-reflexao').hidden = !disponivel;
    $('btn-ler').hidden = !disponivel || !audioDoTexto;
  });

  function pararLeitura() {
    S.leitura++;
    document.querySelectorAll('.frase.lendo').forEach(function (el) { el.classList.remove('lendo'); });
    $('btn-ler').setAttribute('aria-pressed', 'false');
  }

  function falar(falas) {
    pararLeitura();
    return voz.falar(falas);
  }

  // Lê o texto frase por frase, destacando a frase que está sendo lida.
  function lerTexto() {
    if ($('btn-ler').getAttribute('aria-pressed') === 'true') { pararLeitura(); voz.calar(); return; }
    pararLeitura();
    var minha = S.leitura;
    $('btn-ler').setAttribute('aria-pressed', 'true');
    var cadeia = voz.falar(F.caso(S.caso));
    document.querySelectorAll('#texto-corpo .frase').forEach(function (el) {
      cadeia = cadeia.then(function () {
        if (minha !== S.leitura) return null;
        el.classList.add('lendo');
        el.scrollIntoView({ block: 'nearest' });
        return voz.falar(C.falaDa(S.caso.frases[Number(el.dataset.i)]))
          .then(function () { el.classList.remove('lendo'); });
      });
    });
    cadeia.then(function () { if (minha === S.leitura) pararLeitura(); });
  }

  /* ------------------------------------------------
     Desenho da tela
     ------------------------------------------------ */
  function definirEstado(estado) {
    S.estado = estado;
    app.dataset.estado = estado;
  }

  // Coloca o texto da frase no elemento, destacando a palavra do mistério.
  function preencherFrase(el, texto, i) {
    var d = S.misterio && S.misterio.destaque;
    var pos = d && d.frase === i ? texto.indexOf(d.palavra) : -1;
    if (pos === -1) { el.appendChild(document.createTextNode(texto)); return; }
    el.appendChild(document.createTextNode(texto.slice(0, pos)));
    var mark = document.createElement('mark');
    mark.className = 'destaque';
    mark.textContent = d.palavra;
    el.appendChild(mark);
    el.appendChild(document.createTextNode(texto.slice(pos + d.palavra.length)));
  }

  function desenharTexto() {
    var caso = S.caso;
    var corpo = $('texto-corpo');
    var rolagem = corpo.scrollTop;
    $('texto-genero').textContent = caso.genero;
    $('texto-titulo').textContent = caso.titulo;
    corpo.textContent = '';
    var quebras = caso.quebras || [];
    var paragrafo = null;
    caso.frases.forEach(function (frase, i) {
      if (!paragrafo || caso.dialogo || quebras.indexOf(i) !== -1) {
        paragrafo = document.createElement('p');
        corpo.appendChild(paragrafo);
      }
      var el = document.createElement('span');
      el.className = 'frase';
      el.dataset.i = i;
      el.tabIndex = 0;
      el.setAttribute('role', 'button');
      var texto = C.textoDa(frase);
      if (caso.dialogo) {
        var fim = texto.indexOf(':') + 1;
        var falante = document.createElement('span');
        falante.className = 'falante';
        falante.textContent = texto.slice(0, fim);
        el.appendChild(falante);
        texto = texto.slice(fim);
      }
      preencherFrase(el, texto, i);
      var marcada = S.marcadas.indexOf(i) !== -1;
      var ehPista = S.misterio.pistas.indexOf(i) !== -1;
      el.setAttribute('aria-pressed', String(marcada));
      if (S.revelada && ehPista) el.classList.add('certa');
      else if (marcada) el.classList.add('marcada');
      paragrafo.appendChild(el);
      paragrafo.appendChild(document.createTextNode(' '));
      if (S.regiao && ehPista) paragrafo.classList.add('regiao');
    });
    corpo.scrollTop = rolagem;
  }

  function desenharMisterio() {
    var m = S.misterio;
    var tipo = C.TIPOS[m.tipo];
    $('misterio-tipo').textContent = tipo.nome;
    $('misterio-pergunta').textContent = m.pergunta;

    var necessarias = m.todas ? m.pistas.length : 1;
    var pistas = $('misterio-pistas');
    pistas.innerHTML = '<svg aria-hidden="true"><use href="#i-lupa"/></svg>';
    pistas.appendChild(document.createTextNode(
      (necessarias === 1 ? 'Marque a frase que prova a resposta' : 'Marque as ' + necessarias + ' frases que provam a resposta') +
      (S.marcadas.length ? ' · ' + S.marcadas.length + (S.marcadas.length === 1 ? ' marcada' : ' marcadas') : '')));

    var caixa = $('opcoes');
    caixa.textContent = '';
    S.ordem.forEach(function (idx, pos) {
      var opcao = m.opcoes[idx];
      var botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'opcao' + (S.revelada && opcao.certa ? ' certa' : '');
      botao.setAttribute('role', 'radio');
      botao.setAttribute('aria-checked', String(S.escolha === idx));
      botao.disabled = S.respostaTravada || S.estado !== 'resolvendo';
      var letra = document.createElement('span');
      letra.className = 'opcao__letra';
      letra.textContent = LETRAS[pos];
      var texto = document.createElement('span');
      texto.textContent = opcao.texto;
      botao.appendChild(letra);
      botao.appendChild(texto);
      botao.addEventListener('click', function () { escolher(idx); });
      caixa.appendChild(botao);
    });

    $('btn-resolver').disabled = !(S.escolha !== null && S.marcadas.length > 0);
  }

  function desenharHUD() {
    $('hud-caso').textContent = 'Caso ' + S.casoNum + ' de ' + S.totalCasos + ' · Nível ' + S.nivel;
    var lista = $('hud-marcadores');
    lista.textContent = '';
    for (var i = 0; i < S.totalCasos * 2; i++) {
      var ponto = document.createElement('li');
      var r = S.resultados[i];
      if (r) ponto.className = r.resultado;
      else if (i === S.resultados.length && S.estado !== 'fim') ponto.className = 'atual';
      lista.appendChild(ponto);
    }
    var detetive = $('hud-detetive');
    detetive.hidden = S.modo !== 'dupla';
    detetive.textContent = 'Detetive ' + detetiveAtual() + ' investiga';
  }

  function desenharTudo() {
    desenharTexto();
    desenharMisterio();
    desenharHUD();
  }

  function detetiveAtual() { return (S.resultados.length % 2) + 1; }

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
    avisoTimer = setTimeout(function () { no.hidden = true; }, 4200);
  }

  function rolarAtePista() {
    var el = document.querySelector('#texto-corpo .frase[data-i="' + S.misterio.pistas[0] + '"]');
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  /* ------------------------------------------------
     Fluxo do jogo
     ------------------------------------------------ */
  function embaralhar(lista) {
    var copia = lista.slice();
    for (var i = copia.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = copia[i]; copia[i] = copia[j]; copia[j] = t;
    }
    return copia;
  }

  // Prefere casos do nível atual ainda não feitos neste dispositivo.
  function escolherCaso() {
    var livres = C.CASOS.filter(function (c) { return S.feitosSessao.indexOf(c.id) === -1; });
    for (var distancia = 0; distancia < NIVEIS; distancia++) {
      var doNivel = livres.filter(function (c) { return Math.abs(c.nivel - S.nivel) === distancia; });
      var ineditos = doNivel.filter(function (c) { return save.feitos.indexOf(c.id) === -1; });
      var opcoes = ineditos.length ? ineditos : doNivel;
      if (opcoes.length) return opcoes[Math.floor(Math.random() * opcoes.length)];
    }
    return C.CASOS[0];
  }

  function iniciarSessao(modo) {
    calarTudo();
    S.modo = modo;
    registro.iniciarSessao(modo);
    S.casoNum = 0;
    S.resultados = [];
    S.feitosSessao = [];
    S.sequencia = 0;
    S.melhorSequencia = 0;
    S.pontos = 0;
    S.nivel = clamp(parseInt(params.get('nivel'), 10) || save.nivel || 1, 1, NIVEIS);
    S.dominadosAntes = Object.keys(C.TIPOS).filter(dominado);
    $('tela-inicio').hidden = true;
    $('tela-fim').hidden = true;
    iniciarCaso(null);
  }

  function iniciarCaso(mudanca) {
    S.casoNum += 1;
    S.caso = escolherCaso();
    S.misterioIdx = 0;
    var antes = [];
    if (mudanca === 'sobe') {
      som('etapa');
      aviso('Nível ' + S.nivel + ': casos mais difíceis!');
      antes.push(F.novoNivel);
    } else if (mudanca === 'desce') {
      aviso('Vamos treinar com casos mais curtos.');
      antes.push(F.treinar);
    }
    iniciarMisterio(antes, true);
    $('texto-corpo').scrollTop = 0;
  }

  function iniciarMisterio(antes, casoNovo) {
    S.misterio = S.caso.misterios[S.misterioIdx];
    S.ordem = embaralhar(S.misterio.opcoes.map(function (_, i) { return i; }));
    S.escolha = null;
    S.marcadas = [];
    S.tentativa = 1;
    S.motivos = [];
    registro.iniciarItem();
    S.respostaTravada = false;
    S.revelada = false;
    S.regiao = false;
    definirEstado('resolvendo');
    desenharTudo();
    mostrarControles('acao');

    var falas = (antes || []).slice();
    if (S.modo === 'dupla') falas.push(F.detetive(detetiveAtual()));
    if (casoNovo && S.casoNum === 1 && !save.sessoes) {
      aviso('Toque nas frases que são pistas. Depois escolha a resposta.');
      falas.push(F.instrucao);
    }
    if (casoNovo) falas.push(F.caso(S.caso));
    falas.push(S.misterio.pergunta);
    if (S.misterio.todas) falas.push(F.duasPistas);
    falar(falas);

    // Deixa prontos os áudios que este mistério pode precisar.
    var m = S.misterio;
    voz.preCarregar(S.caso.frases.map(C.falaDa).concat([m.explicacao, C.TIPOS[m.tipo].dica],
      m.opcoes.map(F.opcao), m.opcoes.map(function (o) { return o.porque; })));
  }

  function alternarFrase(i) {
    if (S.estado !== 'resolvendo' || S.pausado) return;
    var pos = S.marcadas.indexOf(i);
    if (pos !== -1) {
      S.marcadas.splice(pos, 1);
    } else {
      var limite = (S.misterio.todas ? S.misterio.pistas.length : 1) + 1;
      if (S.marcadas.length >= limite) {
        aviso('Você já marcou ' + S.marcadas.length + ' frases. Toque numa marcada para desmarcar.');
        return;
      }
      S.marcadas.push(i);
      som('tique');
    }
    desenharTexto();
    desenharMisterio();
  }

  function escolher(idx) {
    if (S.estado !== 'resolvendo' || S.respostaTravada || S.pausado) return;
    S.escolha = idx;
    desenharMisterio();
  }

  function pedirResolver() {
    if (S.estado !== 'resolvendo' || S.pausado || S.escolha === null || !S.marcadas.length) return;
    if (S.modo === 'dupla') {
      definirEstado('confirmando');
      var parceiro = detetiveAtual() === 1 ? 2 : 1;
      $('confirma-texto').textContent = 'Detetive ' + parceiro + ', você concorda?';
      mostrarControles('confirma');
      $('btn-confirmar').focus({ preventScroll: true });
      falar(F.confirma(parceiro));
      return;
    }
    resolver();
  }

  function resolver() {
    var m = S.misterio;
    var certa = Boolean(m.opcoes[S.escolha].certa);
    var achadas = m.pistas.filter(function (p) { return S.marcadas.indexOf(p) !== -1; });
    var pistasOk = m.todas ? achadas.length === m.pistas.length : achadas.length > 0;

    if (certa && pistasOk) { sucesso(); return; }

    // Achou só parte das pistas exigidas: não conta como erro.
    if (certa && m.todas && achadas.length > 0) {
      S.respostaTravada = true;
      S.marcadas = achadas;
      definirEstado('feedback');
      desenharTudo();
      mostrarFeedback('quase', 'Você achou uma pista!', 'Esta pergunta pede duas. Marque a outra.', 'Continuar', voltarAoMisterio);
      falar(F.faltaPista);
      return;
    }
    falhar(certa ? 'pista' : 'resposta');
  }

  function falhar(motivo) {
    S.motivos.push(motivo);
    S.tentativa += 1;
    if (S.tentativa > 3) { demonstrar(); return; }
    som('quase');
    var m = S.misterio;
    var titulo;
    var falas;
    if (motivo === 'pista') {
      S.respostaTravada = true;
      S.marcadas = S.marcadas.filter(function (i) { return m.pistas.indexOf(i) !== -1; });
      titulo = F.respostaCerta;
      falas = [F.respostaCerta, F.pistaNaoProva];
    } else {
      var errada = m.opcoes[S.escolha];
      S.escolha = null;
      titulo = 'Ainda não';
      falas = [F.aindaNao, errada.porque];
    }
    // Dicas em camadas: primeiro a estratégia do tipo de mistério; no segundo
    // erro, o jogo aponta a parte do texto; no terceiro, demonstra.
    if (S.tentativa === 2) {
      falas.push(C.TIPOS[m.tipo].dica);
    } else {
      S.regiao = true;
      falas.push(F.olheAqui);
    }
    definirEstado('feedback');
    desenharTudo();
    if (S.regiao) rolarAtePista();
    mostrarFeedback('quase', titulo, falas.slice(1).join(' '), 'Tentar de novo', voltarAoMisterio);
    falar(falas);
  }

  function voltarAoMisterio() {
    definirEstado('resolvendo');
    desenharTudo();
    mostrarControles('acao');
  }

  function revelar() {
    S.revelada = true;
    S.respostaTravada = true;
    definirEstado('feedback');
    desenharTudo();
    rolarAtePista();
  }

  function sucesso() {
    var resultado = S.tentativa === 1 ? 'primeira' : 'dica';
    registrar(resultado);
    som('acerto');
    var titulo = resultado === 'primeira' ? F.resolvido : F.resolvidoDica;
    revelar();
    mostrarFeedback('acerto', titulo, S.misterio.explicacao, rotuloProximo(), proximo);
    falar([titulo, S.misterio.explicacao]);
  }

  function demonstrar() {
    registrar('demo');
    var m = S.misterio;
    S.marcadas = m.pistas.slice();
    S.escolha = m.opcoes.findIndex(function (o) { return o.certa; });
    revelar();
    mostrarFeedback('demo', 'Vamos ver juntos', m.explicacao, rotuloProximo(), proximo);
    falar([F.vamosVer, m.explicacao]);
  }

  function registrar(resultado) {
    var primeira = resultado === 'primeira';
    S.resultados.push({ resultado: resultado, tipo: S.misterio.tipo, caso: S.caso.id });
    var reg = save.tipos[S.misterio.tipo] = save.tipos[S.misterio.tipo] || { tentativas: 0, acertos: 0 };
    reg.tentativas += 1;
    if (primeira) reg.acertos += 1;
    S.sequencia = primeira ? S.sequencia + 1 : 0;
    S.melhorSequencia = Math.max(S.melhorSequencia, S.sequencia);
    S.pontos += primeira ? 100 : (resultado === 'dica' ? 50 : 10);
    gravarSave();
    desenharHUD();

    // Registro anônimo (professores/registro.html). erro = o que estava errado em
    // cada tentativa: "resposta" (alternativa) ou "pista" (frase que não prova).
    var demo = resultado === 'demo';
    registro.item({
      etapa: S.nivel,
      item: S.caso.id + ' · ' + S.misterio.tipo,
      resultado: resultado,
      tentativas: demo ? S.tentativa - 1 : S.tentativa,
      dicas: Math.min(S.tentativa - 1, 2),
      erro: S.motivos.join(' ')
    });
  }

  function rotuloProximo() {
    var ultimoDoCaso = S.misterioIdx + 1 >= S.caso.misterios.length;
    if (!ultimoDoCaso) return 'Próximo mistério';
    return S.casoNum >= S.totalCasos ? 'Ver resultado' : 'Próximo caso';
  }

  // Após cada caso: sobe de nível se os dois mistérios saíram de primeira,
  // desce se os dois precisaram de demonstração.
  function adaptar() {
    var ultimos = S.resultados.slice(-2).map(function (r) { return r.resultado; });
    if (ultimos.length < 2) return null;
    if (ultimos.every(function (r) { return r === 'primeira'; }) && S.nivel < NIVEIS) { S.nivel += 1; return 'sobe'; }
    if (ultimos.every(function (r) { return r === 'demo'; }) && S.nivel > 1) { S.nivel -= 1; return 'desce'; }
    return null;
  }

  function proximo() {
    if (S.misterioIdx + 1 < S.caso.misterios.length) {
      S.misterioIdx += 1;
      iniciarMisterio(null, false);
      return;
    }
    S.feitosSessao.push(S.caso.id);
    if (save.feitos.indexOf(S.caso.id) === -1) save.feitos.push(S.caso.id);
    gravarSave();
    if (S.casoNum >= S.totalCasos) { finalizar(); return; }
    iniciarCaso(adaptar());
  }

  function finalizar() {
    definirEstado('fim');
    save.sessoes += 1;
    save.nivel = S.nivel;
    gravarSave();
    desenharHUD();
    registro.fim({ etapa: S.nivel });

    var total = S.resultados.length;
    var primeira = S.resultados.filter(function (r) { return r.resultado === 'primeira'; }).length;
    var comDica = S.resultados.filter(function (r) { return r.resultado === 'dica'; }).length;

    var resumo = $('fim-resumo');
    resumo.textContent = '';
    [[primeira + ' de ' + total, 'de primeira'], [String(comDica), 'com dica'], [String(S.totalCasos), 'casos resolvidos']]
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

    // Um item por tipo de mistério: mostra ao professor onde a turma precisa de ajuda.
    var lista = $('fim-tipos');
    lista.textContent = '';
    var novos = [];
    Object.keys(C.TIPOS).forEach(function (chave) {
      var tipo = C.TIPOS[chave];
      var feito = dominado(chave);
      var registro = save.tipos[chave];
      if (feito && S.dominadosAntes.indexOf(chave) === -1) novos.push(tipo);
      var li = document.createElement('li');
      li.className = feito ? 'dominada' : (registro ? 'praticando' : '');
      if (feito) {
        li.innerHTML = '<svg><use href="#i-check"/></svg>';
      } else {
        var marcador = document.createElement('span');
        marcador.className = 'marcador';
        li.appendChild(marcador);
      }
      var nome = document.createElement('span');
      nome.textContent = tipo.nome;
      var estado = document.createElement('small');
      estado.textContent = feito ? 'dominado' : (registro ? registro.acertos + ' de ' + registro.tentativas + ' de primeira' : 'a descobrir');
      li.appendChild(nome);
      li.appendChild(estado);
      lista.appendChild(li);
    });

    var novo = $('fim-dominio-novo');
    novo.hidden = !novos.length;
    if (novos.length) novo.textContent = 'Agora você sabe ' + novos[novos.length - 1].dominio + '!';

    document.querySelectorAll('[data-estrategia]').forEach(function (b) { b.classList.remove('escolhida'); b.disabled = false; });
    $('fim-reflexao').hidden = false;
    $('fim-obrigado').hidden = true;
    $('tela-fim').hidden = false;
    $('btn-de-novo').focus({ preventScroll: true });

    falar([F.fim, novos.length ? F.dominio(novos[novos.length - 1]) : null, F.pergunta]);

    portal.enviarResultado(GAME_ID, {
      score: S.pontos,
      correct: primeira,
      incorrect: total - primeira,
      bestCombo: S.melhorSequencia,
      completed: true,
      nivel: S.nivel
    });
  }

  function calarTudo() {
    pararLeitura();
    voz.calar();
  }

  function voltarAoInicio() {
    calarTudo();
    definirEstado('inicio');
    var nivel = clamp(parseInt(params.get('nivel'), 10) || save.nivel || 1, 1, NIVEIS);
    $('inicio-nivel').textContent = 'Nível ' + nivel + ' de ' + NIVEIS;
    $('tela-fim').hidden = true;
    $('tela-inicio').hidden = false;
    (params.get('dupla') === '1' ? $('btn-dupla') : $('btn-solo')).focus({ preventScroll: true });
  }

  /* ------------------------------------------------
     Entrada
     ------------------------------------------------ */
  $('texto-corpo').addEventListener('click', function (e) {
    var frase = e.target.closest('.frase');
    if (frase) alternarFrase(Number(frase.dataset.i));
  });
  $('texto-corpo').addEventListener('keydown', function (e) {
    var frase = e.target.closest('.frase');
    if (frase && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      alternarFrase(Number(frase.dataset.i));
    }
  });

  $('btn-ler').addEventListener('click', lerTexto);
  $('btn-resolver').addEventListener('click', pedirResolver);
  $('btn-confirmar').addEventListener('click', function () { if (S.estado === 'confirmando') resolver(); });
  $('btn-mudar').addEventListener('click', function () {
    if (S.estado !== 'confirmando') return;
    definirEstado('resolvendo');
    mostrarControles('acao');
  });
  $('btn-seguir').addEventListener('click', function () {
    if (S.estado === 'feedback' && acaoSeguir) acaoSeguir();
  });
  $('btn-ouvir').addEventListener('click', function () {
    if (!S.misterio) return;
    falar([S.misterio.pergunta].concat(S.ordem.map(function (i) { return F.opcao(S.misterio.opcoes[i]); })));
  });
  $('btn-solo').addEventListener('click', function () { iniciarSessao('solo'); });
  $('btn-dupla').addEventListener('click', function () { iniciarSessao('dupla'); });
  $('btn-de-novo').addEventListener('click', voltarAoInicio);

  // Pergunta de autoexplicação no fim da missão.
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
    aoPausar: function () { pararLeitura(); S.pausado = true; $('tela-pausa').hidden = false; },
    aoContinuar: function () { S.pausado = false; $('tela-pausa').hidden = true; },
    aoReiniciar: function () { S.pausado = false; $('tela-pausa').hidden = true; voltarAoInicio(); }
  });

  Base.barraDoProfessor(GAME_ID);
  voltarAoInicio();
  portal.pronto();
})();
