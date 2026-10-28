/**
 * conteudo.js — vocabulário, cena e comandos do Listen & Do (sem DOM).
 *
 * A criança ouve um comando em inglês e faz o que ele pede numa cena (um
 * quarto): toca numa coisa ou leva uma coisa até um lugar. Instruções e
 * explicações em português; inglês só nos comandos e nas palavras-chave.
 *
 * Vocabulário da lista Cambridge Pre A1 Starters (coisas, cores, móveis e
 * in / on / under / next to), nível CEFR Pre-A1. A BNCC só tem inglês a
 * partir do 6º ano; a referência para o 4º e o 5º é o Currículo da Cidade de
 * São Paulo (EF04LI10, EF05LI02, EF05LI15).
 *
 * Falas: "en:" = voz em inglês; "en-lento:" = a mesma voz, mais devagar.
 * RASCUNHO: revisar com professor de inglês.
 */
(function (global) {
  'use strict';

  /* ------------------------------------------------
     Vocabulário
     ------------------------------------------------ */
  var COISAS = {
    ball: { en: 'ball', pt: 'bola', art: 'a', colorida: true },
    car: { en: 'car', pt: 'carro', art: 'o', colorida: true },
    book: { en: 'book', pt: 'livro', art: 'o', colorida: true },
    robot: { en: 'robot', pt: 'robô', art: 'o', colorida: true },
    doll: { en: 'doll', pt: 'boneca', art: 'a', colorida: true },
    cat: { en: 'cat', pt: 'gato', art: 'o', colorida: false },
    dog: { en: 'dog', pt: 'cachorro', art: 'o', colorida: false }
  };

  var CORES = {
    red: { en: 'red', m: 'vermelho', f: 'vermelha', hex: '#E5383B' },
    blue: { en: 'blue', m: 'azul', f: 'azul', hex: '#2D6FE0' },
    green: { en: 'green', m: 'verde', f: 'verde', hex: '#22A55B' },
    yellow: { en: 'yellow', m: 'amarelo', f: 'amarela', hex: '#F7C61B' }
  };

  // Todos os móveis são femininos em português: "da cama", "da mesa"...
  var MOVEIS = {
    bed: { en: 'bed', pt: 'cama' },
    bag: { en: 'bag', pt: 'mochila' },
    box: { en: 'box', pt: 'caixa' },
    table: { en: 'table', pt: 'mesa' },
    chair: { en: 'chair', pt: 'cadeira' }
  };

  var PREPOSICOES = {
    'in': { en: 'in', pt: 'dentro' },
    on: { en: 'on', pt: 'em cima' },
    under: { en: 'under', pt: 'embaixo' },
    'next to': { en: 'next to', pt: 'ao lado' }
  };

  // Lugares da cena: relação (preposição + móvel) e vagas. Cada vaga é o
  // ponto do chão do objeto (centro embaixo), no SVG de 1000 × 560.
  var LUGARES = {
    'on-bed': { prep: 'on', movel: 'bed', vagas: [[92, 284], [205, 284]] },
    'under-bed': { prep: 'under', movel: 'bed', vagas: [[98, 468], [200, 468]] },
    'next-bed': { prep: 'next to', movel: 'bed', vagas: [[310, 470]] },
    'in-bag': { prep: 'in', movel: 'bag', vagas: [[384, 438]] },
    'in-box': { prep: 'in', movel: 'box', vagas: [[502, 440]] },
    'next-box': { prep: 'next to', movel: 'box', vagas: [[600, 470]] },
    'on-table': { prep: 'on', movel: 'table', vagas: [[704, 300], [812, 300]] },
    'under-table': { prep: 'under', movel: 'table', vagas: [[712, 468], [802, 468]] },
    'on-chair': { prep: 'on', movel: 'chair', vagas: [[932, 362]] },
    'under-chair': { prep: 'under', movel: 'chair', vagas: [[940, 468]] }
  };

  /* ------------------------------------------------
     Textos em inglês e em português
     ------------------------------------------------ */
  function descEn(alvo) {
    return 'the ' + (alvo.cor ? CORES[alvo.cor].en + ' ' : '') + COISAS[alvo.coisa].en;
  }

  function descPt(alvo) {
    var c = COISAS[alvo.coisa];
    var cor = alvo.cor ? ' ' + (c.art === 'a' ? CORES[alvo.cor].f : CORES[alvo.cor].m) : '';
    return c.art + ' ' + c.pt + cor;
  }

  function lugarEn(id) {
    var l = LUGARES[id];
    return PREPOSICOES[l.prep].en + ' the ' + MOVEIS[l.movel].en;
  }

  function lugarPt(id) {
    var l = LUGARES[id];
    return PREPOSICOES[l.prep].pt + ' da ' + MOVEIS[l.movel].pt;
  }

  function maiuscula(t) { return t.charAt(0).toUpperCase() + t.slice(1); }

  function comandoEn(item) {
    if (item.tipo === 'tocar') return 'Touch ' + descEn(item.alvos[0]) + '.';
    return 'Put ' + item.alvos.map(function (a) { return descEn(a) + ' ' + lugarEn(a.lugar); }).join(' and ') + '.';
  }

  // "Toque na bola vermelha." / "Coloque o gato em cima da cama e a bola dentro da caixa."
  function comandoPt(item) {
    if (item.tipo === 'tocar') {
      var d = descPt(item.alvos[0]);
      return 'Toque ' + (d.charAt(0) === 'a' ? 'na' : 'no') + d.slice(1) + '.';
    }
    return 'Coloque ' + item.alvos.map(function (a) { return descPt(a) + ' ' + lugarPt(a.lugar); }).join(' e ') + '.';
  }

  // Palavra-chave: a palavra do comando que a criança precisa ouvir melhor.
  function significado(tipo, chave) {
    if (tipo === 'coisa') return { en: COISAS[chave].en, pt: COISAS[chave].pt };
    if (tipo === 'cor') return { en: CORES[chave].en, pt: CORES[chave].m };
    if (tipo === 'prep') return { en: PREPOSICOES[chave].en, pt: PREPOSICOES[chave].pt };
    return { en: MOVEIS[chave].en, pt: MOVEIS[chave].pt };
  }

  function querDizer(tipo, chave) { return 'quer dizer ' + significado(tipo, chave).pt + '.'; }

  /* ------------------------------------------------
     Etapas
     ------------------------------------------------ */
  function tocar(coisa, cor) { return { tipo: 'tocar', alvos: [{ coisa: coisa, cor: cor || null }] }; }
  function colocar(coisa, cor, lugar) { return { tipo: 'colocar', alvos: [{ coisa: coisa, cor: cor || null, lugar: lugar }] }; }
  function dois(a, b) {
    return {
      tipo: 'colocar',
      alvos: [{ coisa: a[0], cor: null, lugar: a[1] }, { coisa: b[0], cor: null, lugar: b[1] }]
    };
  }

  var ETAPAS = [
    {
      id: 1, nome: 'Coisas', ref: 'EF04LI10',
      dominio: 'reconhecer o nome das coisas em inglês',
      itens: Object.keys(COISAS).map(function (c) { return tocar(c); })
    },
    {
      id: 2, nome: 'Cores', ref: 'EF04LI10',
      dominio: 'ouvir a cor e a coisa juntas',
      itens: [
        tocar('ball', 'red'), tocar('ball', 'blue'), tocar('car', 'green'), tocar('car', 'yellow'),
        tocar('book', 'blue'), tocar('book', 'red'), tocar('robot', 'yellow'), tocar('robot', 'green'),
        tocar('doll', 'red'), tocar('doll', 'blue')
      ]
    },
    {
      id: 3, nome: 'In, on, under', ref: 'EF05LI02 · EF05LI15',
      dominio: 'entender in, on e under num comando',
      itens: [
        colocar('ball', null, 'in-box'), colocar('cat', null, 'on-bed'), colocar('dog', null, 'under-table'),
        colocar('book', null, 'on-table'), colocar('car', null, 'under-bed'), colocar('doll', null, 'in-bag'),
        colocar('robot', null, 'on-chair'), colocar('ball', null, 'under-chair'), colocar('cat', null, 'in-box'),
        colocar('book', null, 'in-bag'), colocar('dog', null, 'on-chair'), colocar('car', null, 'on-bed')
      ]
    },
    {
      id: 4, nome: 'Cor e lugar', ref: 'EF05LI02 · EF05LI15',
      dominio: 'seguir comandos com cor, coisa e lugar, até com next to',
      itens: [
        colocar('ball', 'red', 'under-bed'), colocar('car', 'blue', 'next-box'), colocar('book', 'yellow', 'on-chair'),
        colocar('robot', 'green', 'in-box'), colocar('doll', 'blue', 'next-bed'), colocar('car', 'red', 'on-table'),
        colocar('ball', 'yellow', 'in-bag'), colocar('book', 'green', 'under-table')
      ]
    },
    {
      id: 5, nome: 'Dois comandos', ref: 'EF05LI02',
      dominio: 'seguir dois comandos seguidos',
      itens: [
        dois(['cat', 'on-bed'], ['ball', 'in-box']), dois(['dog', 'under-table'], ['book', 'on-chair']),
        dois(['car', 'in-bag'], ['doll', 'on-table']), dois(['robot', 'under-bed'], ['cat', 'next-box']),
        dois(['ball', 'on-chair'], ['dog', 'next-bed']), dois(['book', 'under-chair'], ['car', 'on-bed'])
      ]
    }
  ];

  /* ------------------------------------------------
     Montagem da cena de uma tarefa
     ------------------------------------------------ */
  function sortear(lista) { return lista[Math.floor(Math.random() * lista.length)]; }
  function embaralhar(lista) {
    var a = lista.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function todasAsVagas() {
    var lista = [];
    Object.keys(LUGARES).forEach(function (id) {
      LUGARES[id].vagas.forEach(function (v, i) { lista.push(id + '#' + i); });
    });
    return lista;
  }

  function lugarDaVaga(vaga) { return vaga.split('#')[0]; }

  // Coisas que aparecem na cena: os alvos e os distratores certos para a etapa.
  // Na etapa de cores, a mesma coisa em outras cores e outras coisas da cor pedida;
  // nas outras, coisas diferentes. Nenhum alvo começa no lugar pedido.
  function montarCena(item, etapaId) {
    var objetos = [];
    var usadas = {};
    function chave(coisa, cor) { return coisa + '|' + (cor || ''); }
    function incluir(coisa, cor) {
      if (usadas[chave(coisa, cor)]) return;
      usadas[chave(coisa, cor)] = true;
      objetos.push({ coisa: coisa, cor: cor });
    }
    function corQualquer(coisa) { return COISAS[coisa].colorida ? sortear(Object.keys(CORES)) : null; }
    var outras = embaralhar(Object.keys(COISAS));

    item.alvos.forEach(function (a) { incluir(a.coisa, a.cor || corQualquer(a.coisa)); });
    var alvo = item.alvos[0];
    if (alvo.cor) {
      embaralhar(Object.keys(CORES)).filter(function (c) { return c !== alvo.cor; }).slice(0, etapaId === 2 ? 2 : 1)
        .forEach(function (c) { incluir(alvo.coisa, c); });
      outras.filter(function (c) { return c !== alvo.coisa && COISAS[c].colorida; }).slice(0, etapaId === 2 ? 2 : 1)
        .forEach(function (c) { incluir(c, alvo.cor); });
    } else {
      var quantas = item.tipo === 'tocar' ? 4 : (item.alvos.length > 1 ? 1 : 2);
      outras.filter(function (c) {
        return !item.alvos.some(function (a) { return a.coisa === c; });
      }).slice(0, quantas).forEach(function (c) { incluir(c, corQualquer(c)); });
    }

    // Distribui pelas vagas. Nada começa no lugar pedido (senão o lugar pode
    // estar cheio e a criança que entendeu não tem onde pôr). Quando a cor
    // decide, nada começa dentro da caixa ou da mochila, que escondem a cor.
    var pedidos = item.alvos.map(function (a) { return a.lugar; }).filter(Boolean);
    var proibidos = pedidos.concat(alvo.cor ? ['in-box', 'in-bag'] : []);
    var livres = embaralhar(todasAsVagas());
    objetos = embaralhar(objetos);
    objetos.forEach(function (o, i) {
      var k = livres.findIndex(function (v) { return proibidos.indexOf(lugarDaVaga(v)) === -1; });
      if (k === -1) k = 0;
      o.id = 'o' + i;
      o.vaga = livres.splice(k, 1)[0];
      o.inicio = o.vaga;
    });
    return objetos;
  }

  // O objeto da cena que corresponde a um alvo do comando.
  function objetoDoAlvo(objetos, alvo) {
    return objetos.filter(function (o) { return o.coisa === alvo.coisa && (!alvo.cor || o.cor === alvo.cor); })[0];
  }

  /* ------------------------------------------------
     Falas (tela e voz iguais)
     ------------------------------------------------ */
  var ESTRATEGIAS = [
    { id: 'coisa', icone: 'i-coisa', texto: 'Prestei atenção no nome da coisa' },
    { id: 'cor', icone: 'i-cor', texto: 'Prestei atenção na cor' },
    { id: 'lugar', icone: 'i-lugar', texto: 'Prestei atenção no lugar' },
    { id: 'chute', icone: 'i-chute', texto: 'Chutei' }
  ];

  var FALAS = {
    instrucaoTocar: 'Ouça o comando em inglês e toque na coisa certa.',
    instrucaoColocar: 'Ouça o comando. Toque na coisa e depois no lugar. No fim, toque em Pronto.',
    instrucaoDois: 'Agora são dois comandos. Faça os dois e toque em Pronto.',
    fones: 'Se puder, use fone de ouvido.',
    isso: 'Isso!',
    issoAjuda: 'Isso, com ajuda!',
    aindaNao: 'Ainda não.',
    ouvirDeNovo: 'Ouça de novo.',
    vamosVer: 'Vamos ver juntos.',
    umCerto: 'Uma parte está certa, marcada em verde. Falta a outra.',
    outraCoisa: 'O comando pede outra coisa.',
    novaEtapa: function (etapa) { return 'Nova etapa: ' + etapa.nome + '!'; },
    treinar: 'Vamos treinar mais um pouco.',
    fim: 'Missão concluída!',
    dominio: function (etapa) { return 'Agora você sabe ' + etapa.dominio + '!'; },
    pergunta: 'Como você descobriu o que fazer?',
    obrigado: 'Boa! Conte para o seu professor como você fez.',
    obrigadoChute: 'Tudo bem! Na próxima, toque em Devagar e ouça a palavra de novo.',
    estrategia: function (e) { return e.texto + '.'; },
    ouvinte: function (n) { return 'Ouvinte ' + ['', 'um', 'dois'][n] + '.'; },
    confirma: function (n) { return 'Ouvinte ' + ['', 'um', 'dois'][n] + ', você concorda?'; },
    tocou: function (alvo) { var d = descPt(alvo); return 'Você tocou ' + (d.charAt(0) === 'a' ? 'na' : 'no') + d.slice(1) + '.'; },
    colocou: function (alvo) { return 'Você colocou ' + descPt(alvo); },
    lugar: function (id) { return lugarPt(id) + '.'; }
  };

  function en(t) { return 'en:' + t; }
  function enLento(t) { return 'en-lento:' + t; }

  // Todas as frases que o jogo pode falar: o roteiro para gerar os áudios.
  function todasAsFalas() {
    var lista = [];
    function add(f) { if (f && lista.indexOf(f) === -1) lista.push(f); }
    ['instrucaoTocar', 'instrucaoColocar', 'instrucaoDois', 'fones', 'isso', 'issoAjuda', 'aindaNao', 'ouvirDeNovo',
      'vamosVer', 'umCerto', 'outraCoisa', 'treinar', 'fim', 'pergunta', 'obrigado', 'obrigadoChute'].forEach(function (k) { add(FALAS[k]); });
    [1, 2].forEach(function (n) { add(FALAS.ouvinte(n)); add(FALAS.confirma(n)); });
    ESTRATEGIAS.forEach(function (e) { add(FALAS.estrategia(e)); });

    // Descrições de cada coisa (com e sem cor), em inglês e em português.
    Object.keys(COISAS).forEach(function (c) {
      var variantes = [{ coisa: c, cor: null }];
      if (COISAS[c].colorida) Object.keys(CORES).forEach(function (cor) { variantes.push({ coisa: c, cor: cor }); });
      variantes.forEach(function (alvo) {
        add(en(descEn(alvo)));
        add(FALAS.tocou(alvo));
        add(FALAS.colocou(alvo));
      });
    });
    Object.keys(LUGARES).forEach(function (id) { add(en(lugarEn(id))); add(FALAS.lugar(id)); });
    [['coisa', COISAS], ['cor', CORES], ['prep', PREPOSICOES], ['movel', MOVEIS]].forEach(function (par) {
      Object.keys(par[1]).forEach(function (k) {
        add(en(significado(par[0], k).en));
        add(querDizer(par[0], k));
      });
    });
    ETAPAS.forEach(function (etapa) {
      add(FALAS.novaEtapa(etapa));
      add(FALAS.dominio(etapa));
      etapa.itens.forEach(function (item) {
        add(en(comandoEn(item)));
        add(enLento(comandoEn(item)));
        add(comandoPt(item));
      });
    });
    return lista;
  }

  global.ListenConteudo = {
    COISAS: COISAS,
    CORES: CORES,
    MOVEIS: MOVEIS,
    PREPOSICOES: PREPOSICOES,
    LUGARES: LUGARES,
    ETAPAS: ETAPAS,
    ESTRATEGIAS: ESTRATEGIAS,
    FALAS: FALAS,
    descEn: descEn,
    descPt: descPt,
    lugarEn: lugarEn,
    lugarPt: lugarPt,
    comandoEn: comandoEn,
    comandoPt: comandoPt,
    significado: significado,
    querDizer: querDizer,
    montarCena: montarCena,
    objetoDoAlvo: objetoDoAlvo,
    lugarDaVaga: lugarDaVaga,
    todasAsVagas: todasAsVagas,
    en: en,
    enLento: enLento,
    maiuscula: maiuscula,
    todasAsFalas: todasAsFalas
  };
})(window);
