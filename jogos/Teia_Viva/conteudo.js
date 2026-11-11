/**
 * conteudo.js — seres vivos, teias e cenários da Teia Viva (sem DOM).
 *
 * Seta A → B quer dizer: a energia vai de A para B (B come A). É a convenção
 * dos livros de Ciências, e a inversão da seta é um erro comum que o jogo
 * explica em particular.
 *
 * Os resultados dos cenários "E se...?" são escritos à mão (não calculados)
 * para garantir que cada pergunta tenha uma resposta ecologicamente clara.
 * RASCUNHO: revisar com professores de Ciências.
 */
(function (global) {
  'use strict';

  /* ------------------------------------------------
     Seres (e componentes não vivos). `o` é o nome com artigo.
     ------------------------------------------------ */
  var SERES = {
    sol: { nome: 'Sol', o: 'o Sol', tipo: 'sol' },
    capim: { nome: 'Capim', o: 'o capim', tipo: 'produtor' },
    pequizeiro: { nome: 'Pequizeiro', o: 'o pequizeiro', tipo: 'produtor' },
    lobeira: { nome: 'Lobeira', o: 'a lobeira', tipo: 'produtor' },
    algas: { nome: 'Algas', o: 'as algas', tipo: 'produtor' },
    gafanhoto: { nome: 'Gafanhoto', o: 'o gafanhoto', tipo: 'consumidor' },
    lagarta: { nome: 'Lagarta', o: 'a lagarta', tipo: 'consumidor' },
    prea: { nome: 'Preá', o: 'o preá', tipo: 'consumidor' },
    sapo: { nome: 'Sapo', o: 'o sapo', tipo: 'consumidor' },
    bemtevi: { nome: 'Bem-te-vi', o: 'o bem-te-vi', tipo: 'consumidor' },
    cobra: { nome: 'Cobra', o: 'a cobra', tipo: 'consumidor' },
    seriema: { nome: 'Seriema', o: 'a seriema', tipo: 'consumidor' },
    gaviao: { nome: 'Gavião', o: 'o gavião', tipo: 'consumidor' },
    loboguara: { nome: 'Lobo-guará', o: 'o lobo-guará', tipo: 'consumidor' },
    lambari: { nome: 'Lambari', o: 'o lambari', tipo: 'consumidor' },
    traira: { nome: 'Traíra', o: 'a traíra', tipo: 'consumidor' },
    garca: { nome: 'Garça', o: 'a garça', tipo: 'consumidor' },
    fungos: { nome: 'Fungos e bactérias', o: 'os fungos e bactérias', tipo: 'decompositor' },
    restos: { nome: 'Restos e folhas mortas', o: 'os restos e folhas mortas', tipo: 'naovivo' },
    solo: { nome: 'Nutrientes do solo', o: 'os nutrientes do solo', tipo: 'naovivo' }
  };

  function maiuscula(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ------------------------------------------------
     Teias usadas nos cenários (todas as setas verdadeiras)
     ------------------------------------------------ */
  var TEIAS = {
    campo: {
      nome: 'Campo do Cerrado',
      seres: ['sol', 'capim', 'gafanhoto', 'prea', 'sapo', 'cobra', 'gaviao'],
      setas: [['sol', 'capim'], ['capim', 'gafanhoto'], ['capim', 'prea'], ['gafanhoto', 'sapo'],
        ['sapo', 'cobra'], ['prea', 'cobra'], ['cobra', 'gaviao'], ['prea', 'gaviao']]
    },
    lobo: {
      nome: 'Cerrado do lobo-guará',
      seres: ['sol', 'capim', 'lobeira', 'gafanhoto', 'prea', 'seriema', 'loboguara'],
      setas: [['sol', 'capim'], ['sol', 'lobeira'], ['capim', 'gafanhoto'], ['capim', 'prea'],
        ['gafanhoto', 'seriema'], ['prea', 'loboguara'], ['lobeira', 'loboguara']]
    },
    lagoa: {
      nome: 'Lagoa',
      seres: ['sol', 'algas', 'lambari', 'traira', 'garca'],
      setas: [['sol', 'algas'], ['algas', 'lambari'], ['lambari', 'traira'], ['lambari', 'garca'], ['traira', 'garca']]
    },
    solo: {
      nome: 'Ciclo no solo',
      seres: ['sol', 'capim', 'gafanhoto', 'sapo', 'restos', 'fungos', 'solo'],
      setas: [['sol', 'capim'], ['capim', 'gafanhoto'], ['gafanhoto', 'sapo'],
        ['capim', 'restos'], ['gafanhoto', 'restos'], ['sapo', 'restos'], ['restos', 'fungos'], ['fungos', 'solo'], ['solo', 'capim']],
      // Setas da matéria (tracejadas): o caminho que volta para o solo.
      materia: [['capim', 'restos'], ['gafanhoto', 'restos'], ['sapo', 'restos'], ['restos', 'fungos'], ['fungos', 'solo'], ['solo', 'capim']]
    }
  };

  /* ------------------------------------------------
     Etapas. Itens de montar: `seres` + `setas` certas; `prontas` já vêm
     desenhadas. Itens "E se": teia + evento + perguntas com resultado.
     ------------------------------------------------ */
  var ETAPAS = [
    {
      id: 1, nome: 'Cadeias alimentares', bncc: 'EF04CI04', modo: 'montar',
      dominio: 'montar cadeias alimentares começando pelo Sol',
      itens: [
        { seres: ['sol', 'capim', 'gafanhoto', 'sapo', 'cobra'] },
        { seres: ['sol', 'pequizeiro', 'lagarta', 'bemtevi', 'gaviao'] },
        { seres: ['sol', 'algas', 'lambari', 'garca'] },
        { seres: ['sol', 'capim', 'prea', 'cobra', 'gaviao'] },
        { seres: ['sol', 'lobeira', 'loboguara'] },
        { seres: ['sol', 'capim', 'gafanhoto', 'seriema'] },
        { seres: ['sol', 'capim', 'gafanhoto', 'bemtevi', 'gaviao'] },
        { seres: ['sol', 'algas', 'lambari', 'traira', 'garca'] },
        { seres: ['sol', 'capim', 'prea', 'loboguara'] }
      ].map(function (item) {
        item.setas = item.seres.slice(1).map(function (s, i) { return [item.seres[i], s]; });
        item.embaralhar = true;
        return item;
      })
    },
    {
      id: 2, nome: 'Teias alimentares', bncc: 'EF04CI04', modo: 'montar',
      dominio: 'completar teias alimentares com vários caminhos',
      itens: [
        { teia: 'campo', faltam: [['capim', 'prea'], ['sapo', 'cobra'], ['prea', 'gaviao']] },
        { teia: 'campo', faltam: [['capim', 'gafanhoto'], ['gafanhoto', 'sapo'], ['cobra', 'gaviao']] },
        { teia: 'lobo', faltam: [['lobeira', 'loboguara'], ['prea', 'loboguara'], ['gafanhoto', 'seriema']] },
        { teia: 'lagoa', faltam: [['algas', 'lambari'], ['traira', 'garca']] },
        { teia: 'campo', faltam: [['sol', 'capim'], ['prea', 'cobra'], ['cobra', 'gaviao']] },
        { teia: 'lobo', faltam: [['sol', 'lobeira'], ['capim', 'prea'], ['prea', 'loboguara']] },
        { teia: 'lobo', faltam: [['sol', 'capim'], ['capim', 'gafanhoto'], ['lobeira', 'loboguara']] },
        { teia: 'lagoa', faltam: [['lambari', 'traira'], ['lambari', 'garca']] }
      ]
    },
    {
      id: 3, nome: 'E se…? Efeito direto', bncc: 'EF04CI04', modo: 'prever',
      dominio: 'prever o que acontece com quem come ou é comido',
      itens: [
        {
          teia: 'campo', alvo: 'capim', direcao: 'desce', evento: 'Uma seca deixou pouco capim no campo.',
          perguntas: [
            { ser: 'gafanhoto', resposta: 'desce', explicacao: 'O gafanhoto come capim. Com pouco capim, falta comida e os gafanhotos diminuem.', caminho: [['capim', 'gafanhoto']] },
            { ser: 'prea', resposta: 'desce', explicacao: 'O preá também come capim. Com menos comida, os preás diminuem.', caminho: [['capim', 'prea']] }
          ]
        },
        {
          teia: 'campo', alvo: 'sapo', direcao: 'sobe', evento: 'Muitos sapos chegaram de uma lagoa vizinha.',
          perguntas: [
            { ser: 'gafanhoto', resposta: 'desce', explicacao: 'O sapo come gafanhotos. Com mais sapos caçando, os gafanhotos diminuem.', caminho: [['gafanhoto', 'sapo']] },
            { ser: 'cobra', resposta: 'sobe', explicacao: 'A cobra come sapos. Com mais sapos, sobra comida e as cobras aumentam.', caminho: [['sapo', 'cobra']] }
          ]
        },
        {
          teia: 'lobo', alvo: 'lobeira', direcao: 'sobe', evento: 'As lobeiras deram muitos frutos este ano.',
          perguntas: [
            { ser: 'loboguara', resposta: 'sobe', explicacao: 'O lobo-guará come o fruto da lobeira. Com mais frutos, os lobos-guará têm mais comida e aumentam.', caminho: [['lobeira', 'loboguara']] }
          ]
        },
        {
          teia: 'lagoa', alvo: 'traira', direcao: 'desce', evento: 'Pescadores tiraram muitas traíras da lagoa.',
          perguntas: [
            { ser: 'lambari', resposta: 'sobe', explicacao: 'A traíra come lambaris. Com menos traíras caçando, os lambaris aumentam.', caminho: [['lambari', 'traira']] }
          ]
        },
        {
          teia: 'campo', alvo: 'cobra', direcao: 'desce', evento: 'Uma doença atingiu as cobras do campo.',
          perguntas: [
            { ser: 'sapo', resposta: 'sobe', explicacao: 'A cobra come sapos. Com menos cobras caçando, os sapos aumentam.', caminho: [['sapo', 'cobra']] },
            { ser: 'prea', resposta: 'sobe', explicacao: 'A cobra também come preás. Com menos cobras, os preás aumentam.', caminho: [['prea', 'cobra']] }
          ]
        },
        {
          teia: 'lobo', alvo: 'gafanhoto', direcao: 'sobe', evento: 'Apareceram muitos gafanhotos no Cerrado.',
          perguntas: [
            { ser: 'seriema', resposta: 'sobe', explicacao: 'A seriema come gafanhotos. Com mais comida, as seriemas aumentam.', caminho: [['gafanhoto', 'seriema']] },
            { ser: 'capim', resposta: 'desce', explicacao: 'Os gafanhotos comem capim. Com muitos gafanhotos, o capim diminui.', caminho: [['capim', 'gafanhoto']] },
            // "Igual": nesta teia, nenhuma seta liga a lobeira aos gafanhotos.
            { ser: 'lobeira', resposta: 'igual', explicacao: 'Nesta teia, o gafanhoto não come lobeira, e quem come lobeira não come gafanhoto. Por isso a lobeira fica igual.', caminho: [] }
          ]
        },
        {
          teia: 'lobo', alvo: 'seriema', direcao: 'desce', evento: 'Caçadores levaram muitas seriemas.',
          perguntas: [
            { ser: 'gafanhoto', resposta: 'sobe', explicacao: 'A seriema come gafanhotos. Com menos seriemas caçando, os gafanhotos aumentam.', caminho: [['gafanhoto', 'seriema']] },
            { ser: 'lobeira', resposta: 'igual', explicacao: 'Nesta teia, a seriema não come lobeira, e quem come lobeira não come seriema. Por isso a lobeira fica igual.', caminho: [] }
          ]
        },
        {
          teia: 'lagoa', alvo: 'algas', direcao: 'sobe', evento: 'Com sol forte e água limpa, as algas cresceram muito.',
          perguntas: [
            { ser: 'lambari', resposta: 'sobe', explicacao: 'O lambari come algas. Com mais comida, os lambaris aumentam.', caminho: [['algas', 'lambari']] }
          ]
        },
        {
          teia: 'campo', alvo: 'prea', direcao: 'desce', evento: 'Uma doença atingiu os preás do campo.',
          perguntas: [
            { ser: 'capim', resposta: 'sobe', explicacao: 'O preá come capim. Com menos preás comendo, o capim aumenta.', caminho: [['capim', 'prea']] },
            { ser: 'gaviao', resposta: 'desce', explicacao: 'O gavião come preás. Com menos comida, os gaviões diminuem.', caminho: [['prea', 'gaviao']] }
          ]
        },
        {
          teia: 'lobo', alvo: 'loboguara', direcao: 'desce', evento: 'Atropelamentos nas estradas diminuíram os lobos-guará.',
          perguntas: [
            { ser: 'prea', resposta: 'sobe', explicacao: 'O lobo-guará come preás. Com menos lobos-guará caçando, os preás aumentam.', caminho: [['prea', 'loboguara']] }
          ]
        }
      ]
    },
    {
      id: 4, nome: 'E se…? Efeito em cadeia', bncc: 'EF04CI04', modo: 'prever',
      dominio: 'seguir as setas para prever efeitos em cadeia',
      itens: [
        {
          teia: 'campo', alvo: 'gaviao', direcao: 'desce', evento: 'Caçadores levaram muitos gaviões do campo.',
          perguntas: [
            { ser: 'cobra', resposta: 'sobe', explicacao: 'O gavião come cobras. Com menos gaviões, as cobras aumentam.', caminho: [['cobra', 'gaviao']] },
            { ser: 'sapo', resposta: 'desce', explicacao: 'Com mais cobras, mais sapos são comidos. Os sapos diminuem.', caminho: [['cobra', 'gaviao'], ['sapo', 'cobra']] },
            { ser: 'gafanhoto', resposta: 'sobe', explicacao: 'Com menos sapos, sobram gafanhotos. Um efeito puxa o outro pelas setas.', caminho: [['cobra', 'gaviao'], ['sapo', 'cobra'], ['gafanhoto', 'sapo']] }
          ]
        },
        {
          teia: 'campo', alvo: 'gafanhoto', direcao: 'sobe', evento: 'Uma praga de gafanhotos apareceu no campo.',
          perguntas: [
            { ser: 'capim', resposta: 'desce', explicacao: 'Os gafanhotos comem capim. Com muitos gafanhotos, o capim diminui.', caminho: [['capim', 'gafanhoto']] },
            { ser: 'sapo', resposta: 'sobe', explicacao: 'O sapo come gafanhotos. Com mais comida, os sapos aumentam.', caminho: [['gafanhoto', 'sapo']] },
            { ser: 'prea', resposta: 'desce', explicacao: 'O preá não come gafanhotos, mas come capim. Com menos capim, os preás diminuem.', caminho: [['capim', 'gafanhoto'], ['capim', 'prea']] }
          ]
        },
        {
          teia: 'lobo', alvo: 'lobeira', direcao: 'sobe', evento: 'As lobeiras deram muitos frutos este ano.',
          perguntas: [
            { ser: 'loboguara', resposta: 'sobe', explicacao: 'O lobo-guará come o fruto da lobeira. Com mais comida, os lobos-guará aumentam.', caminho: [['lobeira', 'loboguara']] }
          ]
        },
        {
          teia: 'lagoa', alvo: 'traira', direcao: 'desce', evento: 'Pescadores tiraram muitas traíras da lagoa.',
          perguntas: [
            { ser: 'lambari', resposta: 'sobe', explicacao: 'A traíra come lambaris. Com menos traíras, os lambaris aumentam.', caminho: [['lambari', 'traira']] },
            { ser: 'algas', resposta: 'desce', explicacao: 'Com mais lambaris comendo algas, as algas diminuem.', caminho: [['lambari', 'traira'], ['algas', 'lambari']] }
          ]
        },
        {
          teia: 'campo', alvo: 'capim', direcao: 'sobe', evento: 'Choveu bem e o capim cresceu muito.',
          perguntas: [
            { ser: 'gafanhoto', resposta: 'sobe', explicacao: 'O gafanhoto come capim. Com mais comida, os gafanhotos aumentam.', caminho: [['capim', 'gafanhoto']] },
            { ser: 'sapo', resposta: 'sobe', explicacao: 'Com mais gafanhotos, os sapos têm mais comida e aumentam.', caminho: [['capim', 'gafanhoto'], ['gafanhoto', 'sapo']] },
            { ser: 'cobra', resposta: 'sobe', explicacao: 'Com mais sapos, as cobras também têm mais comida e aumentam.', caminho: [['gafanhoto', 'sapo'], ['sapo', 'cobra']] }
          ]
        },
        {
          teia: 'lobo', alvo: 'capim', direcao: 'desce', evento: 'Uma queimada destruiu boa parte do capim.',
          perguntas: [
            { ser: 'gafanhoto', resposta: 'desce', explicacao: 'O gafanhoto come capim. Com pouco capim, os gafanhotos diminuem.', caminho: [['capim', 'gafanhoto']] },
            { ser: 'seriema', resposta: 'desce', explicacao: 'Com menos gafanhotos, as seriemas têm menos comida e diminuem.', caminho: [['capim', 'gafanhoto'], ['gafanhoto', 'seriema']] },
            { ser: 'prea', resposta: 'desce', explicacao: 'O preá também come capim. Com pouco capim, os preás diminuem.', caminho: [['capim', 'prea']] }
          ]
        },
        {
          teia: 'lagoa', alvo: 'algas', direcao: 'desce', evento: 'A água ficou turva e as algas diminuíram.',
          perguntas: [
            { ser: 'lambari', resposta: 'desce', explicacao: 'O lambari come algas. Com menos algas, os lambaris diminuem.', caminho: [['algas', 'lambari']] },
            { ser: 'traira', resposta: 'desce', explicacao: 'Com menos lambaris, as traíras têm menos comida e diminuem.', caminho: [['algas', 'lambari'], ['lambari', 'traira']] },
            { ser: 'garca', resposta: 'desce', explicacao: 'A garça come lambaris e traíras. Com os dois diminuindo, as garças também diminuem.', caminho: [['lambari', 'garca'], ['traira', 'garca']] }
          ]
        },
        {
          teia: 'campo', alvo: 'sapo', direcao: 'desce', evento: 'Uma doença atingiu os sapos do campo.',
          perguntas: [
            { ser: 'gafanhoto', resposta: 'sobe', explicacao: 'O sapo come gafanhotos. Com menos sapos, os gafanhotos aumentam.', caminho: [['gafanhoto', 'sapo']] },
            { ser: 'capim', resposta: 'desce', explicacao: 'Com mais gafanhotos comendo capim, o capim diminui.', caminho: [['gafanhoto', 'sapo'], ['capim', 'gafanhoto']] },
            { ser: 'cobra', resposta: 'desce', explicacao: 'A cobra come sapos. Com menos sapos, as cobras têm menos comida e diminuem.', caminho: [['sapo', 'cobra']] }
          ]
        }
      ]
    },
    {
      id: 5, nome: 'Decompositores e o solo', bncc: 'EF04CI06', modo: 'prever',
      dominio: 'explicar o papel dos fungos e bactérias no solo',
      itens: [
        {
          teia: 'solo', alvo: 'fungos', direcao: 'desce', evento: 'Os fungos e bactérias do solo sumiram.',
          perguntas: [
            { ser: 'restos', resposta: 'sobe', explicacao: 'Os fungos e bactérias decompõem os restos. Sem eles, os restos e folhas mortas se acumulam.', caminho: [['restos', 'fungos']] },
            { ser: 'solo', resposta: 'desce', explicacao: 'É a decomposição que devolve nutrientes para o solo. Sem ela, o solo fica pobre.', caminho: [['restos', 'fungos'], ['fungos', 'solo']] },
            { ser: 'capim', resposta: 'desce', explicacao: 'O capim precisa dos nutrientes do solo para crescer. Com o solo pobre, o capim diminui.', caminho: [['fungos', 'solo'], ['solo', 'capim']] }
          ]
        },
        {
          teia: 'solo', alvo: 'restos', direcao: 'sobe', evento: 'No fim da seca, caíram muitas folhas no chão.',
          perguntas: [
            { ser: 'fungos', resposta: 'sobe', explicacao: 'As folhas mortas são o alimento dos fungos e bactérias. Com mais folhas, eles aumentam.', caminho: [['restos', 'fungos']] },
            { ser: 'solo', resposta: 'sobe', explicacao: 'Decompondo as folhas, os fungos e bactérias devolvem mais nutrientes para o solo.', caminho: [['restos', 'fungos'], ['fungos', 'solo']] }
          ]
        },
        {
          teia: 'solo', alvo: 'restos', direcao: 'desce', evento: 'Varreram e levaram embora todas as folhas caídas no chão.',
          perguntas: [
            { ser: 'fungos', resposta: 'desce', explicacao: 'Os restos e folhas mortas são o alimento dos fungos e bactérias. Sem eles, os fungos e bactérias diminuem.', caminho: [['restos', 'fungos']] },
            { ser: 'solo', resposta: 'desce', explicacao: 'Sem restos para decompor, menos nutrientes voltam para o solo.', caminho: [['restos', 'fungos'], ['fungos', 'solo']] },
            { ser: 'capim', resposta: 'desce', explicacao: 'Com o solo mais pobre, o capim cresce menos.', caminho: [['fungos', 'solo'], ['solo', 'capim']] }
          ]
        },
        {
          teia: 'solo', alvo: 'solo', direcao: 'sobe', evento: 'O agricultor fez compostagem e o solo ficou rico em nutrientes.',
          perguntas: [
            { ser: 'capim', resposta: 'sobe', explicacao: 'O capim usa os nutrientes do solo para crescer. Com o solo rico, o capim aumenta.', caminho: [['solo', 'capim']] },
            { ser: 'gafanhoto', resposta: 'sobe', explicacao: 'Com mais capim, os gafanhotos têm mais comida e aumentam.', caminho: [['solo', 'capim'], ['capim', 'gafanhoto']] }
          ]
        },
        {
          teia: 'solo', alvo: 'fungos', direcao: 'sobe', evento: 'Com chuva e calor, os fungos e bactérias do solo se multiplicaram.',
          perguntas: [
            { ser: 'restos', resposta: 'desce', explicacao: 'Mais fungos e bactérias decompõem os restos mais depressa. Os restos e folhas mortas diminuem.', caminho: [['restos', 'fungos']] },
            { ser: 'solo', resposta: 'sobe', explicacao: 'Decompondo mais restos, os fungos e bactérias devolvem mais nutrientes para o solo.', caminho: [['fungos', 'solo']] },
            { ser: 'capim', resposta: 'sobe', explicacao: 'Com mais nutrientes no solo, o capim cresce mais.', caminho: [['fungos', 'solo'], ['solo', 'capim']] }
          ]
        }
      ]
    }
  ];

  // Resolve a teia de cada item de montar e marca as setas que já vêm prontas.
  ETAPAS.forEach(function (etapa) {
    etapa.itens.forEach(function (item) {
      if (!item.teia) return;
      var teia = TEIAS[item.teia];
      item.seres = teia.seres;
      if (etapa.modo === 'montar') {
        item.setas = teia.setas;
        item.prontas = teia.setas.filter(function (s) {
          return !item.faltam.some(function (f) { return f[0] === s[0] && f[1] === s[1]; });
        });
      } else {
        item.setas = teia.setas;
        item.materia = teia.materia || [];
        // A simulação só mexe no ser atingido e nos seres perguntados (a cadeia
        // de causa), para não mostrar efeitos ambíguos nos outros.
        item.efeitos = {};
        item.efeitos[item.alvo] = item.direcao;
        item.perguntas.forEach(function (p) { item.efeitos[p.ser] = p.resposta; });
      }
    });
  });

  /* ------------------------------------------------
     Textos gerados (a mesma frase serve para tela e voz: sem símbolos)
     ------------------------------------------------ */
  function ehProdutor(id) { return SERES[id].tipo === 'produtor'; }

  // Explica por que a seta A → B está errada.
  function erroSeta(a, b, setasCertas) {
    var A = SERES[a];
    var B = SERES[b];
    var invertida = setasCertas.some(function (s) { return s[0] === b && s[1] === a; });
    if (b === 'sol') {
      return invertida
        ? 'Seta ao contrário: a energia sai do Sol e vai para ' + A.o + '.'
        : 'Ninguém alimenta o Sol. A energia sai do Sol e vai para as plantas.';
    }
    if (invertida) {
      var pluralA = /^(os|as) /.test(A.o);
      return 'Seta ao contrário: ' + (pluralA ? 'são ' : 'é ') + A.o + (pluralA ? ' que comem ' : ' que come ') + B.o + '. A seta vai de quem é comido para quem come.';
    }
    var plural = /^(os|as) /.test(B.o);
    if (a === 'sol') return maiuscula(B.o) + (plural ? ' não se alimentam' : ' não se alimenta') + ' da luz do Sol. Só as plantas e as algas usam a luz do Sol para produzir alimento.';
    if (ehProdutor(b)) return maiuscula(B.o) + (plural ? ' não comem' : ' não come') + ' outros seres. As plantas e as algas produzem o próprio alimento com a luz do Sol.';
    if (!setasCertas.some(function (s) { return s[0] === a; })) return 'Nesta tarefa, ninguém come ' + A.o + '. Nenhuma seta sai daí.';
    return 'Nesta tarefa, a seta ' + de(a) + ' não vai para ' + B.o + '. Procure quem come ' + A.o + ' aqui.';
  }

  function quemCome(id) { return id === 'sol' ? 'Quem usa a luz do Sol?' : 'Quem come ' + SERES[id].o + '?'; }

  // "o capim" → "do capim"; "as algas" → "das algas"
  function de(id) { return SERES[id].o.replace(/^(o|a|os|as) /, 'd$1 '); }

  // "A energia vai do Sol para o capim, do capim para o gafanhoto e do gafanhoto para o sapo."
  function explicacaoCadeia(setas) {
    var partes = setas.map(function (s) { return de(s[0]) + ' para ' + SERES[s[1]].o; });
    var ultima = partes.pop();
    return 'A energia vai ' + (partes.length ? partes.join(', ') + ' e ' : '') + ultima + '.';
  }

  var DIRECOES = {
    sobe: { texto: 'Aumenta', fala: 'aumenta' },
    desce: { texto: 'Diminui', fala: 'diminui' },
    igual: { texto: 'Igual', fala: 'fica igual' }
  };

  var ESTRATEGIAS = [
    { id: 'setas', icone: 'i-seta', texto: 'Segui as setas, uma de cada vez' },
    { id: 'comida', icone: 'i-folha', texto: 'Pensei em quem come quem' },
    { id: 'lembrei', icone: 'i-pensar', texto: 'Lembrei de algo que já vi na natureza' },
    { id: 'chute', icone: 'i-chute', texto: 'Chutei' }
  ];

  var FALAS = {
    instrucaoMontar: 'Toque em um ser vivo e depois em quem come ele. A seta mostra para onde vai a energia. Para continuar a cadeia, é só tocar no próximo.',
    instrucaoCadeia: 'Monte a cadeia alimentar começando pelo Sol.',
    instrucaoTeia: 'Complete a teia: faltam algumas setas.',
    instrucaoPrever: 'Para cada carta marcada, diga se ela vai aumentar, diminuir ou ficar igual. Depois veja o que acontece.',
    faltaPrever: function (ser) { return 'Falta escolher para ' + SERES[ser].o + '.'; },
    faltaSeta: function (n) { return n === 1 ? 'Ainda falta uma seta.' : 'Ainda faltam ' + ['', '', 'duas', 'três', 'quatro', 'cinco'][n] + ' setas.'; },
    dicaMontar: 'Comece pelo Sol: quem usa a luz do Sol? Depois, quem come essa planta?',
    certo: 'Teia certinha!',
    certoCadeia: 'Cadeia certinha!',
    certoDica: 'Certo, com a dica!',
    previsaoCerta: 'Você previu tudo certo!',
    previsaoParte: 'Veja o que aconteceu de verdade.',
    vamosVer: 'Vamos ver juntos.',
    temErrada: 'Tem seta errada.',
    quaseLa: 'Quase lá.',
    naturalista: function (n) { return 'Naturalista ' + ['', 'um', 'dois'][n] + '.'; },
    confirma: function (n) { return 'Naturalista ' + ['', 'um', 'dois'][n] + ', você concorda?'; },
    // Modo dupla: o parceiro responde sozinho antes de conferir.
    toqueCarta: 'Toque na carta.',
    perguntaPrevisao: function (ser) {
      return maiuscula(SERES[ser].o) + (/^(os|as) /.test(SERES[ser].o) ? ' vão' : ' vai') + ' aumentar, diminuir ou ficar igual?';
    },
    pensaramDiferente: 'Vocês pensaram diferente. Conversem e decidam juntos.',
    novaEtapa: function (etapa) { return 'Nova etapa: ' + etapa.nome.replace('…', '') + '!'; },
    treinar: 'Vamos treinar mais um pouco.',
    fim: 'Missão concluída!',
    dominio: function (etapa) { return 'Agora você sabe ' + etapa.dominio + '!'; },
    pergunta: 'Como você descobriu as respostas?',
    obrigado: 'Boa! Conte para o seu professor como você fez.',
    obrigadoChute: 'Tudo bem! Na próxima, tente seguir as setas, uma de cada vez.',
    estrategia: function (e) { return e.texto + '.'; },
    evento: function (item) { return item.evento; }
  };

  // Todas as frases que o jogo pode falar: o roteiro para gerar os áudios.
  function todasAsFalas() {
    var lista = [];
    function add(f) { if (f && lista.indexOf(f) === -1) lista.push(f); }
    ['instrucaoMontar', 'instrucaoCadeia', 'instrucaoTeia', 'instrucaoPrever', 'dicaMontar', 'certo', 'certoCadeia', 'certoDica',
      'previsaoCerta', 'previsaoParte', 'vamosVer', 'temErrada', 'quaseLa', 'treinar', 'fim', 'pergunta', 'obrigado', 'obrigadoChute',
      'toqueCarta', 'pensaramDiferente']
      .forEach(function (k) { add(FALAS[k]); });
    [1, 2, 3, 4, 5].forEach(function (n) { add(FALAS.faltaSeta(n)); });
    [1, 2].forEach(function (n) { add(FALAS.naturalista(n)); add(FALAS.confirma(n)); });
    ESTRATEGIAS.forEach(function (e) { add(FALAS.estrategia(e)); });
    ETAPAS.forEach(function (etapa) {
      add(FALAS.novaEtapa(etapa));
      add(FALAS.dominio(etapa));
      etapa.itens.forEach(function (item) {
        if (etapa.modo === 'montar') {
          item.seres.forEach(function (a) {
            item.seres.forEach(function (b) {
              if (a === b) return;
              var certa = item.setas.some(function (s) { return s[0] === a && s[1] === b; });
              if (!certa) add(erroSeta(a, b, item.setas));
            });
            add(quemCome(a));
          });
          add(explicacaoCadeia(item.faltam || item.setas));
        } else {
          add(item.evento);
          item.perguntas.forEach(function (p) {
            add(p.explicacao);
            add(FALAS.faltaPrever(p.ser));
            add(FALAS.perguntaPrevisao(p.ser));
          });
        }
      });
    });
    return lista;
  }

  global.TeiaConteudo = {
    DIRECOES: DIRECOES,
    ESTRATEGIAS: ESTRATEGIAS,
    ETAPAS: ETAPAS,
    FALAS: FALAS,
    SERES: SERES,
    erroSeta: erroSeta,
    explicacaoCadeia: explicacaoCadeia,
    quemCome: quemCome,
    todasAsFalas: todasAsFalas
  };
})(window);
