/**
 * conteudo.js — mapas, lugares e missões do Rumo Certo (sem DOM).
 *
 * Coordenadas em "quadras" do mapa: x cresce para o Leste, y cresce para o
 * Sul (y = 0 é a borda Norte). O mapa pode aparecer girado na tela; as
 * direções continuam valendo no mapa, guiadas pela rosa dos ventos.
 *
 * Tipos de missão:
 * - encontrar: tocar no lugar descrito por direção a partir de uma referência
 *   ("a casa ao norte da praça"); só um lugar daquele tipo satisfaz a descrição;
 * - ir: levar o explorador até um lugar visível, usando os botões de direção
 *   (com o mapa girado, "Norte" pode ser para a esquerda da tela);
 * - rota: seguir um caminho falado ("2 quadras para o leste...") e parar onde
 *   ele termina; o destino não é mostrado.
 * RASCUNHO: revisar com professores de Geografia.
 */
(function (global) {
  'use strict';

  var TIPOS_LUGAR = {
    casa: { nome: 'casa', o: 'a casa' },
    escola: { nome: 'escola', o: 'a escola' },
    posto: { nome: 'posto de saúde', o: 'o posto de saúde' },
    praca: { nome: 'praça', o: 'a praça' },
    mercado: { nome: 'mercado', o: 'o mercado' },
    biblioteca: { nome: 'biblioteca', o: 'a biblioteca' },
    lago: { nome: 'lago', o: 'o lago' },
    poco: { nome: 'poço', o: 'o poço' },
    hospital: { nome: 'hospital', o: 'o hospital' },
    correio: { nome: 'correio', o: 'o correio' },
    arvore: { nome: 'mata', o: 'a mata' },
    ponte: { nome: 'ponte', o: 'a ponte' }
  };

  /* ------------------------------------------------
     Mapas. `agua`: quadras de rio/lago (não dá para andar, exceto na ponte).
     ------------------------------------------------ */
  var MAPAS = {
    vila: {
      nome: 'Vila de Terramund', largura: 8, altura: 6,
      lugares: [
        { id: 'escola', tipo: 'escola', x: 1, y: 1 },
        { id: 'posto', tipo: 'posto', x: 6, y: 1 },
        { id: 'praca', tipo: 'praca', x: 3, y: 3 },
        { id: 'lago', tipo: 'lago', x: 6, y: 4 },
        { id: 'mercado', tipo: 'mercado', x: 0, y: 4 },
        { id: 'biblioteca', tipo: 'biblioteca', x: 5, y: 5 },
        { id: 'casaN', tipo: 'casa', x: 3, y: 0 },
        { id: 'casaL', tipo: 'casa', x: 5, y: 3 },
        { id: 'casaO', tipo: 'casa', x: 1, y: 3 },
        { id: 'casaS', tipo: 'casa', x: 3, y: 5 },
        { id: 'mata1', tipo: 'arvore', x: 7, y: 0 },
        { id: 'mata2', tipo: 'arvore', x: 0, y: 0 }
      ],
      agua: [[6, 4], [7, 4], [6, 5], [7, 5]]
    },
    sitio: {
      nome: 'Sítio do Poço', largura: 7, altura: 5,
      lugares: [
        { id: 'poco', tipo: 'poco', x: 3, y: 2 },
        { id: 'casaNE', tipo: 'casa', x: 5, y: 0 },
        { id: 'casaNO', tipo: 'casa', x: 1, y: 0 },
        { id: 'casaSE', tipo: 'casa', x: 5, y: 4 },
        { id: 'casaSO', tipo: 'casa', x: 1, y: 4 },
        { id: 'mata1', tipo: 'arvore', x: 3, y: 0 },
        { id: 'mata2', tipo: 'arvore', x: 6, y: 2 },
        { id: 'mataNE', tipo: 'arvore', x: 4, y: 1 },
        { id: 'mataNO', tipo: 'arvore', x: 2, y: 1 },
        { id: 'mataSE', tipo: 'arvore', x: 4, y: 3 },
        { id: 'mataSO', tipo: 'arvore', x: 2, y: 3 },
        { id: 'escola', tipo: 'escola', x: 0, y: 2 }
      ],
      agua: []
    },
    cidade: {
      nome: 'Cidade do Rio', largura: 8, altura: 7, rio: 3,
      lugares: [
        { id: 'hospitalN', tipo: 'hospital', x: 2, y: 1 },
        { id: 'hospitalS', tipo: 'hospital', x: 6, y: 5 },
        { id: 'mercadoN', tipo: 'mercado', x: 6, y: 1 },
        { id: 'mercadoS', tipo: 'mercado', x: 1, y: 5 },
        { id: 'escolaN', tipo: 'escola', x: 4, y: 0 },
        { id: 'escolaS', tipo: 'escola', x: 3, y: 6 },
        { id: 'correio', tipo: 'correio', x: 0, y: 1 },
        { id: 'ponte', tipo: 'ponte', x: 4, y: 3 }
      ],
      agua: [[0, 3], [1, 3], [2, 3], [3, 3], [5, 3], [6, 3], [7, 3]]
    }
  };

  var DIRECOES = {
    N: { nome: 'norte', dx: 0, dy: -1 },
    S: { nome: 'sul', dx: 0, dy: 1 },
    L: { nome: 'leste', dx: 1, dy: 0 },
    O: { nome: 'oeste', dx: -1, dy: 0 },
    NE: { nome: 'nordeste', dx: 1, dy: -1 },
    NO: { nome: 'noroeste', dx: -1, dy: -1 },
    SE: { nome: 'sudeste', dx: 1, dy: 1 },
    SO: { nome: 'sudoeste', dx: -1, dy: 1 }
  };

  // Direção de B vista a partir de A (as oito da rosa dos ventos).
  function direcaoEntre(a, b) {
    var dx = Math.sign(b.x - a.x);
    var dy = Math.sign(b.y - a.y);
    var chave = (dy < 0 ? 'N' : dy > 0 ? 'S' : '') + (dx > 0 ? (dy ? 'E' : 'L') : dx < 0 ? 'O' : '');
    if (chave === 'NE' || chave === 'SE') return chave;
    return { N: 'N', S: 'S', L: 'L', O: 'O', NO: 'NO', SO: 'SO' }[chave] || null;
  }

  function ao(dir) {
    // "ao norte", "a leste", "a nordeste" (com vogal: "a"; norte e sul: "ao")
    return (dir === 'N' || dir === 'S' ? 'ao ' : 'a ') + DIRECOES[dir].nome;
  }

  function maiuscula(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ------------------------------------------------
     Construtores de missões
     ------------------------------------------------ */
  function encontrar(mapa, alvo, referencia, dir) {
    var tipo = TIPOS_LUGAR[lugar(mapa, alvo).tipo];
    var ref = TIPOS_LUGAR[lugar(mapa, referencia).tipo];
    return {
      tipo: 'encontrar', mapa: mapa, alvo: alvo, referencia: referencia, dir: dir,
      texto: 'Encontre ' + tipo.o + ' ' + ao(dir) + ' d' + ref.o + '.'
    };
  }

  function ir(mapa, inicio, alvo) {
    var destino = lugar(mapa, alvo);
    var iguais = MAPAS[mapa].lugares.filter(function (l) { return l.tipo === destino.tipo; }).length;
    var qual = '';
    if (iguais > 1 && MAPAS[mapa].rio !== undefined) {
      var ladoInicio = lugar(mapa, inicio).y < MAPAS[mapa].rio;
      qual = (ladoInicio === (destino.y < MAPAS[mapa].rio)) ? ' deste lado do rio' : ' do outro lado do rio';
    }
    return {
      tipo: 'ir', mapa: mapa, inicio: inicio, alvo: alvo,
      texto: 'Leve o explorador até ' + TIPOS_LUGAR[destino.tipo].o + qual + '. Use os botões da rosa dos ventos.'
    };
  }

  // passos: [['L', 2], ['S', 1]]
  function rota(mapa, inicio, passos) {
    var p = { x: lugar(mapa, inicio).x, y: lugar(mapa, inicio).y };
    passos.forEach(function (s) { p.x += DIRECOES[s[0]].dx * s[1]; p.y += DIRECOES[s[0]].dy * s[1]; });
    var destino = MAPAS[mapa].lugares.filter(function (l) { return l.x === p.x && l.y === p.y; })[0];
    var partes = passos.map(function (s) {
      return (s[1] === 1 ? 'um quadradinho' : ['', '', 'dois', 'três', 'quatro'][s[1]] + ' quadradinhos') + ' para o ' + DIRECOES[s[0]].nome;
    });
    var ultima = partes.pop();
    return {
      tipo: 'rota', mapa: mapa, inicio: inicio, passos: passos, destino: destino ? destino.id : null,
      fim: p,
      texto: 'Saia d' + TIPOS_LUGAR[lugar(mapa, inicio).tipo].o + '. Ande ' +
        (partes.length ? partes.join(', ') + ' e depois ' : '') + ultima + '. Toque em Cheguei quando terminar.'
    };
  }

  function lugar(mapa, id) {
    return MAPAS[mapa].lugares.filter(function (l) { return l.id === id; })[0];
  }

  function girado(missao, graus) {
    var copia = Object.assign({}, missao);
    copia.giro = graus;
    return copia;
  }

  /* ------------------------------------------------
     Etapas
     ------------------------------------------------ */
  var ETAPAS = [
    {
      id: 1, nome: 'Pontos cardeais', bncc: 'EF04GE09',
      dominio: 'usar norte, sul, leste e oeste para achar lugares no mapa',
      itens: [
        encontrar('vila', 'casaN', 'praca', 'N'), encontrar('vila', 'casaS', 'praca', 'S'),
        encontrar('vila', 'casaL', 'praca', 'L'), encontrar('vila', 'casaO', 'praca', 'O'),
        ir('vila', 'escola', 'praca'), ir('vila', 'mercado', 'biblioteca'), ir('vila', 'praca', 'posto'),
        ir('vila', 'biblioteca', 'escola'), ir('vila', 'posto', 'mercado')
      ]
    },
    {
      id: 2, nome: 'Pontos colaterais', bncc: 'EF04GE09',
      apresenta: 'Os pontos colaterais ficam entre os cardeais: o nordeste fica entre o norte e o leste, e o sudoeste entre o sul e o oeste.',
      dominio: 'usar nordeste, noroeste, sudeste e sudoeste',
      itens: [
        encontrar('sitio', 'casaNE', 'poco', 'NE'), encontrar('sitio', 'casaNO', 'poco', 'NO'),
        encontrar('sitio', 'casaSE', 'poco', 'SE'), encontrar('sitio', 'casaSO', 'poco', 'SO'),
        encontrar('sitio', 'mataNE', 'poco', 'NE'), encontrar('sitio', 'mataNO', 'poco', 'NO'),
        encontrar('sitio', 'mataSE', 'poco', 'SE'), encontrar('sitio', 'mataSO', 'poco', 'SO')
      ]
    },
    {
      id: 3, nome: 'Legenda do mapa', bncc: 'EF03GE07',
      apresenta: 'Agora use a legenda: ela mostra o que é cada símbolo do mapa. Para atravessar o rio, só pela ponte.',
      dominio: 'ler a legenda para reconhecer os símbolos do mapa',
      itens: [
        encontrar('cidade', 'hospitalS', 'ponte', 'SE'), encontrar('cidade', 'hospitalN', 'ponte', 'NO'),
        encontrar('cidade', 'mercadoN', 'ponte', 'NE'), encontrar('cidade', 'mercadoS', 'ponte', 'SO'),
        ir('cidade', 'correio', 'hospitalS'), ir('cidade', 'escolaS', 'mercadoN'),
        encontrar('cidade', 'escolaN', 'ponte', 'N'), ir('cidade', 'escolaN', 'escolaS'), ir('cidade', 'mercadoS', 'correio'),
        ir('cidade', 'hospitalN', 'mercadoS')
      ]
    },
    {
      id: 4, nome: 'Mapa girado', bncc: 'EF04GE09',
      apresenta: 'Agora o mapa pode aparecer girado. O norte é para onde aponta a letra N da rosa dos ventos, não o alto da tela.',
      dominio: 'usar a rosa dos ventos mesmo com o mapa girado',
      // Metade das missões com o mapa girado e metade com o norte para cima, para
      // a criança aprender a conferir a rosa sempre, e não só quando o mapa
      // "parece estranho". Cada mapa gira sempre do mesmo jeito: a Vila fica de
      // cabeça para baixo e o Sítio, com o norte à direita.
      itens: [
        girado(encontrar('vila', 'casaN', 'praca', 'N'), 180), encontrar('vila', 'casaL', 'praca', 'L'),
        girado(ir('vila', 'escola', 'praca'), 180), encontrar('vila', 'casaO', 'praca', 'O'),
        girado(ir('vila', 'mercado', 'biblioteca'), 180), girado(encontrar('sitio', 'casaNE', 'poco', 'NE'), 90),
        encontrar('vila', 'casaS', 'praca', 'S'), girado(encontrar('sitio', 'mataNO', 'poco', 'NO'), 90),
        ir('vila', 'posto', 'mercado'), encontrar('sitio', 'casaSO', 'poco', 'SO'),
        girado(encontrar('sitio', 'mataSE', 'poco', 'SE'), 90)
      ]
    },
    {
      id: 5, nome: 'Rotas', bncc: 'EF04GE09 · EF04MA16',
      apresenta: 'Agora siga caminhos: ande os quadradinhos pedidos em cada direção e toque em Cheguei.',
      dominio: 'seguir rotas descritas com pontos cardeais',
      itens: [
        rota('vila', 'escola', [['S', 2], ['L', 2]]), rota('vila', 'mercado', [['L', 3], ['S', 1]]),
        rota('vila', 'praca', [['N', 2], ['L', 3]]), rota('vila', 'posto', [['S', 2], ['O', 1]]),
        rota('sitio', 'escola', [['L', 1], ['N', 2]]),
        rota('vila', 'posto', [['O', 3], ['S', 2]]), rota('vila', 'biblioteca', [['N', 2], ['O', 2]]),
        rota('vila', 'mercado', [['N', 3], ['L', 1]]), rota('vila', 'praca', [['S', 2], ['L', 2]]),
        rota('sitio', 'poco', [['N', 2], ['L', 2]]), rota('sitio', 'escola', [['S', 2], ['L', 1]]),
        rota('vila', 'biblioteca', [['N', 2], ['O', 4]])
      ]
    }
  ];

  /* ------------------------------------------------
     Textos de apoio (tela e voz iguais: sem símbolos)
     ------------------------------------------------ */
  function nomeDoLugar(mapa, id) { return TIPOS_LUGAR[lugar(mapa, id).tipo].o; }

  function feminino(tipo) { return TIPOS_LUGAR[tipo].o.charAt(0) === 'a'; }

  // Por que o lugar tocado não é o certo.
  function erroEncontrar(missao, tocadoId) {
    var tocado = lugar(missao.mapa, tocadoId);
    var ref = lugar(missao.mapa, missao.referencia);
    var alvo = lugar(missao.mapa, missao.alvo);
    if (tocado.tipo !== alvo.tipo) {
      return maiuscula(TIPOS_LUGAR[tocado.tipo].o) + ' não é ' + (feminino(alvo.tipo) ? 'uma ' : 'um ') +
        TIPOS_LUGAR[alvo.tipo].nome + '. Confira o símbolo na legenda.';
    }
    var dir = direcaoEntre(ref, tocado);
    return (feminino(tocado.tipo) ? 'Essa ' : 'Esse ') + TIPOS_LUGAR[tocado.tipo].nome + ' fica ' + ao(dir) + ' d' +
      TIPOS_LUGAR[ref.tipo].o + '.';
  }

  var ENTRE = { NE: ['norte', 'leste'], NO: ['norte', 'oeste'], SE: ['sul', 'leste'], SO: ['sul', 'oeste'] };

  function dicaRosa(missao) {
    var dir = missao.dir || 'N';
    if (ENTRE[dir]) {
      return 'O ' + DIRECOES[dir].nome + ' fica entre o ' + ENTRE[dir][0] + ' e o ' + ENTRE[dir][1] + '. Olhe a rosa dos ventos.';
    }
    return 'Procure a letra ' + dir + ' na rosa dos ventos: ela mostra para que lado fica o ' + DIRECOES[dir].nome + '.';
  }

  function explicaEncontrar(missao) {
    var ref = nomeDoLugar(missao.mapa, missao.referencia);
    return 'Partindo d' + ref + ', siga a direção ' + DIRECOES[missao.dir].nome +
      ' da rosa dos ventos: lá está ' + nomeDoLugar(missao.mapa, missao.alvo) + '.';
  }

  // Ao se afastar do destino numa missão "ir".
  function afastou(dir) {
    return 'Você foi para o ' + DIRECOES[dir].nome + ' e se afastou. Olhe na rosa dos ventos para que lado fica o destino.';
  }

  function erroRota(missao, chegouEm) {
    var onde = chegouEm ? 'n' + nomeDoLugar(missao.mapa, chegouEm) : 'num lugar vazio do mapa';
    return 'Você parou ' + onde + '. Siga de novo cada parte do caminho, contando os quadradinhos.';
  }

  // "Você chegou ao mercado." / "Você chegou à praça."
  function chegouA(mapa, id) {
    var tipo = TIPOS_LUGAR[lugar(mapa, id).tipo];
    return 'Você chegou ' + (feminino(lugar(mapa, id).tipo) ? 'à ' : 'ao ') + tipo.nome + '.';
  }

  var ESTRATEGIAS = [
    { id: 'rosa', icone: 'i-rosa', texto: 'Olhei a rosa dos ventos' },
    { id: 'legenda', icone: 'i-legenda', texto: 'Olhei a legenda' },
    { id: 'referencia', icone: 'i-pino', texto: 'Comecei pelo lugar de referência' },
    { id: 'chute', icone: 'i-chute', texto: 'Chutei' }
  ];

  var FALAS = {
    instrucaoEncontrar: 'Toque no lugar certo do mapa.',
    instrucaoIr: 'Use os botões Norte, Sul, Leste e Oeste para andar.',
    instrucaoRota: 'Ande seguindo o caminho e toque em Cheguei.',
    mapaGirado: 'Atenção: o mapa está girado. Use a rosa dos ventos.',
    achou: 'Achou!',
    chegou: 'Chegou!',
    chegouDica: 'Chegou, com ajuda!',
    caminhoCerto: 'Caminho certo!',
    quase: 'Ainda não.',
    olheReferencia: 'Olhe o lugar de referência e a seta da rosa dos ventos.',
    rosaNoExplorador: 'Agora a rosa dos ventos aparece em cima do explorador.',
    vamosVer: 'Vamos ver juntos.',
    referencia: 'Esse é o lugar de referência. A resposta fica perto dele, na direção pedida.',
    agua: 'Ali tem água. Procure outro caminho.',
    borda: 'Ali acaba o mapa.',
    novaEtapa: function (etapa) { return 'Nova etapa: ' + etapa.nome + '!'; },
    treinar: 'Vamos treinar mais um pouco.',
    fim: 'Missão concluída!',
    dominio: function (etapa) { return 'Agora você sabe ' + etapa.dominio + '!'; },
    pergunta: 'Como você descobriu para onde ir?',
    obrigado: 'Boa! Conte para o seu professor como você fez.',
    obrigadoChute: 'Tudo bem! Na próxima, olhe a rosa dos ventos antes de escolher.',
    estrategia: function (e) { return e.texto + '.'; },
    explorador: function (n) { return 'Explorador ' + ['', 'um', 'dois'][n] + '.'; },
    confirma: function (n) { return 'Explorador ' + ['', 'um', 'dois'][n] + ', você concorda?'; },
    // Modo dupla: o parceiro responde sozinho antes de conferir.
    toqueLugar: 'Toque no lugar que você acha certo.',
    perguntaQuadradinhos: 'Quantos quadradinhos vocês andaram ao todo?',
    pensaramDiferente: 'Vocês pensaram diferente. Conversem e decidam juntos.'
  };

  // Todas as frases que o jogo pode falar: o roteiro para gerar os áudios.
  function todasAsFalas() {
    var lista = [];
    function add(f) { if (f && lista.indexOf(f) === -1) lista.push(f); }
    ['instrucaoEncontrar', 'instrucaoIr', 'instrucaoRota', 'mapaGirado', 'achou', 'chegou', 'chegouDica', 'caminhoCerto',
      'quase', 'olheReferencia', 'rosaNoExplorador', 'vamosVer', 'referencia', 'agua', 'borda', 'treinar', 'fim', 'pergunta', 'obrigado',
      'obrigadoChute', 'toqueLugar', 'perguntaQuadradinhos', 'pensaramDiferente']
      .forEach(function (k) { add(FALAS[k]); });
    [1, 2].forEach(function (n) { add(FALAS.explorador(n)); add(FALAS.confirma(n)); });
    ESTRATEGIAS.forEach(function (e) { add(FALAS.estrategia(e)); });
    Object.keys(DIRECOES).forEach(function (d) { add(afastou(d)); });
    ETAPAS.forEach(function (etapa) {
      add(FALAS.novaEtapa(etapa));
      add(etapa.apresenta);
      add(FALAS.dominio(etapa));
      etapa.itens.forEach(function (m) {
        add(m.texto);
        if (m.tipo === 'encontrar') {
          add(dicaRosa(m));
          add(explicaEncontrar(m));
          MAPAS[m.mapa].lugares.forEach(function (l) { if (l.id !== m.alvo && l.id !== m.referencia) add(erroEncontrar(m, l.id)); });
        }
        if (m.tipo === 'ir') add(chegouA(m.mapa, m.alvo));
        if (m.tipo === 'rota') {
          MAPAS[m.mapa].lugares.forEach(function (l) { add(erroRota(m, l.id)); });
          add(erroRota(m, null));
          add(chegouA(m.mapa, m.destino));
        }
      });
    });
    return lista;
  }

  global.RumoConteudo = {
    DIRECOES: DIRECOES,
    ESTRATEGIAS: ESTRATEGIAS,
    ETAPAS: ETAPAS,
    FALAS: FALAS,
    MAPAS: MAPAS,
    TIPOS_LUGAR: TIPOS_LUGAR,
    afastou: afastou,
    chegouA: chegouA,
    dicaRosa: dicaRosa,
    direcaoEntre: direcaoEntre,
    erroEncontrar: erroEncontrar,
    erroRota: erroRota,
    explicaEncontrar: explicaEncontrar,
    lugar: lugar,
    nomeDoLugar: nomeDoLugar,
    todasAsFalas: todasAsFalas
  };
})(window);
