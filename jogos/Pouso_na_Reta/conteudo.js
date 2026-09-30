/**
 * conteudo.js — itens, etapas e textos do Pouso na Reta (sem DOM).
 *
 * Cada item é um ponto da reta numérica que a criança deve localizar pousando
 * a nave. Todo texto exibido tem uma versão para fala (`fala`), porque a voz
 * sintetizada lê "3/4" de forma imprevisível (às vezes como data).
 */
(function (global) {
  'use strict';

  /* ------------------------------------------------
     Números por extenso (0–100)
     ------------------------------------------------ */
  var UNIDADES = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete',
    'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze',
    'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  var DEZENAS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta',
    'setenta', 'oitenta', 'noventa'];

  function extenso(n) {
    if (n < 20) return UNIDADES[n];
    if (n < 100) {
      var u = n % 10;
      return DEZENAS[Math.floor(n / 10)] + (u ? ' e ' + UNIDADES[u] : '');
    }
    return n === 100 ? 'cem' : String(n);
  }

  // "uma parte", "duas moedas", "vinte e uma partes"
  function extensoFeminino(n) {
    return extenso(n).replace(/\bum$/, 'uma').replace(/\bdois$/, 'duas');
  }

  var DENOMINADORES = {
    2: ['meio', 'meios'], 3: ['terço', 'terços'], 4: ['quarto', 'quartos'],
    5: ['quinto', 'quintos'], 6: ['sexto', 'sextos'], 7: ['sétimo', 'sétimos'],
    8: ['oitavo', 'oitavos'], 9: ['nono', 'nonos'], 10: ['décimo', 'décimos'],
    100: ['centésimo', 'centésimos']
  };

  function fracaoFalada(a, b) {
    var nome = DENOMINADORES[b];
    if (!nome) return extenso(a) + ' ' + extenso(b) + (a === 1 ? ' avo' : ' avos');
    return extenso(a) + ' ' + nome[a === 1 ? 0 : 1];
  }

  function casasDecimais(v) {
    for (var c = 0; c < 3; c++) {
      var escalado = v * Math.pow(10, c);
      if (Math.abs(Math.round(escalado) - escalado) < 1e-9) return c;
    }
    return 3;
  }

  function comVirgula(v, casas) {
    return v.toFixed(casas === undefined ? casasDecimais(v) : casas).replace('.', ',');
  }

  function decimalFalado(v) {
    var inteiro = Math.floor(v + 1e-9);
    var casas = casasDecimais(v);
    if (!casas) return extenso(inteiro);
    return extenso(inteiro) + ' vírgula ' +
      extenso(Math.round((v - inteiro) * Math.pow(10, casas)));
  }

  function dinheiroTexto(v) { return 'R$ ' + comVirgula(v, 2); }

  function dinheiroFalado(v) {
    var reais = Math.floor(v + 1e-9);
    var centavos = Math.round((v - reais) * 100);
    var partes = [];
    if (reais) partes.push(extenso(reais) + (reais === 1 ? ' real' : ' reais'));
    if (centavos) partes.push(extenso(centavos) + (centavos === 1 ? ' centavo' : ' centavos'));
    return partes.join(' e ') || 'zero real';
  }

  function mdc(a, b) { return b ? mdc(b, a % b) : a; }

  /* ------------------------------------------------
     Construtores de itens
     `partes` = divisões da régua por inteiro; `passos` = partes até o alvo.
     `rotulo` descreve como desenhar o valor (fração empilhada ou texto).
     ------------------------------------------------ */
  function fracao(a, b, max) {
    return {
      tipo: 'fracao', a: a, b: b, valor: a / b, max: max || 1,
      texto: a + '/' + b, fala: fracaoFalada(a, b),
      rotulo: { a: a, b: b }, partes: b, passos: a
    };
  }

  function partesPara(v) {
    return Math.abs(Math.round(v * 10) - v * 10) < 1e-9 ? 10 : 4;
  }

  function decimal(v, max) {
    var partes = partesPara(v);
    return {
      tipo: 'decimal', valor: v, max: max || 1,
      texto: comVirgula(v), fala: decimalFalado(v),
      rotulo: { t: comVirgula(v) }, partes: partes, passos: Math.round(v * partes)
    };
  }

  function porcentagem(p) {
    var v = p / 100;
    var partes = partesPara(v);
    return {
      tipo: 'porcentagem', valor: v, max: 1,
      texto: p + '%', fala: extenso(p) + ' por cento',
      rotulo: { t: p + '%' }, partes: partes, passos: Math.round(v * partes)
    };
  }

  function dinheiro(v) {
    var partes = partesPara(v);
    return {
      tipo: 'dinheiro', valor: v, max: 1,
      texto: dinheiroTexto(v), fala: dinheiroFalado(v),
      rotulo: { t: dinheiroTexto(v) }, partes: partes, passos: Math.round(v * partes)
    };
  }

  // Fração não simplificada: ao revelar, mostra também a régua da forma simples.
  function equivalente(a, b) {
    var item = fracao(a, b, 1);
    var d = mdc(a, b);
    item.equivalente = fracao(a / d, b / d, 1);
    return item;
  }

  // Item com um ponto de referência já marcado na pista.
  function comMarco(item, marco) {
    item.marco = marco;
    return item;
  }

  /* ------------------------------------------------
     Etapas (progressão), cada uma ligada à BNCC
     `tolerancia` = erro máximo aceito, em fração do comprimento da pista.
     Valores iniciais; ajustar depois dos testes com crianças.
     ------------------------------------------------ */
  function reduzidas(denominadores) {
    var lista = [];
    denominadores.forEach(function (b) {
      for (var a = 2; a < b; a++) if (mdc(a, b) === 1) lista.push(fracao(a, b, 1));
    });
    return lista;
  }

  var ETAPAS = [
    {
      id: 1, nome: 'Frações unitárias', bncc: 'EF04MA09', tolerancia: 0.07,
      dominio: 'localizar frações unitárias, como 1/4, na reta',
      itens: [[1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 8], [1, 10]]
        .map(function (p) { return fracao(p[0], p[1], 1); })
    },
    {
      id: 2, nome: 'Frações até 1', bncc: 'EF05MA03', tolerancia: 0.06,
      dominio: 'localizar frações como 3/4 e 5/8 na reta',
      itens: reduzidas([3, 4, 5, 6, 8, 10])
    },
    {
      id: 3, nome: 'Decimais, % e dinheiro', bncc: 'EF04MA10 · EF05MA06', tolerancia: 0.06,
      dominio: 'localizar decimais, porcentagens e valores em reais',
      itens: [0.2, 0.3, 0.5, 0.6, 0.7, 0.9, 0.25, 0.75].map(function (v) { return decimal(v, 1); })
        .concat([10, 25, 40, 50, 75, 80, 90].map(porcentagem))
        .concat([0.1, 0.25, 0.3, 0.5, 0.6, 0.75].map(dinheiro))
    },
    {
      id: 4, nome: 'Maiores que 1', bncc: 'EF05MA03', tolerancia: 0.05,
      dominio: 'localizar frações maiores que um inteiro',
      itens: [[3, 2], [5, 4], [7, 4], [4, 3], [5, 3], [6, 5], [7, 5], [8, 5]]
        .map(function (p) { return fracao(p[0], p[1], 2); })
        .concat([1.5, 1.25, 1.75].map(function (v) { return decimal(v, 2); }))
    },
    {
      id: 5, nome: 'Mesmo ponto, outro nome', bncc: 'EF05MA04 · EF05MA05', tolerancia: 0.05,
      dominio: 'reconhecer frações equivalentes e comparar números na reta',
      itens: [[2, 4], [3, 6], [4, 8], [5, 10], [2, 6], [4, 6], [2, 8], [6, 8], [4, 10], [6, 10], [8, 10]]
        .map(function (p) { return equivalente(p[0], p[1]); })
        .concat([
          comMarco(equivalente(6, 8), fracao(3, 4, 1)),
          comMarco(fracao(3, 8, 1), fracao(1, 2, 1)),
          comMarco(fracao(5, 8, 1), fracao(1, 2, 1)),
          comMarco(fracao(2, 3, 1), fracao(3, 4, 1)),
          comMarco(decimal(0.75, 1), fracao(3, 4, 1)),
          comMarco(porcentagem(50), fracao(1, 2, 1)),
          comMarco(fracao(3, 5, 1), fracao(1, 2, 1))
        ])
    }
  ];

  /* ------------------------------------------------
     Textos de apoio: cada função devolve { texto, fala }
     Partes: string (igual nos dois) ou [texto, fala].
     ------------------------------------------------ */
  function frase(partes) {
    return {
      texto: partes.map(function (p) { return Array.isArray(p) ? p[0] : p; }).join(''),
      fala: partes.map(function (p) { return Array.isArray(p) ? p[1] : p; }).join('')
    };
  }

  function rep(item) { return [item.texto, item.fala]; }

  function contagem(n, singular, plural) {
    return [n + ' ' + (n === 1 ? singular : plural),
      extensoFeminino(n) + ' ' + (n === 1 ? singular : plural)];
  }

  // Valor de uma parte da régua ("1/4", "0,1", "10%", "10 centavos").
  function unidade(item) {
    var v = 1 / item.partes;
    switch (item.tipo) {
      case 'fracao': return [('1/' + item.partes), fracaoFalada(1, item.partes)];
      case 'decimal': return [comVirgula(v), decimalFalado(v)];
      case 'porcentagem': return [Math.round(v * 100) + '%', extenso(Math.round(v * 100)) + ' por cento'];
      default: return [Math.round(v * 100) + ' centavos', extenso(Math.round(v * 100)) + ' centavos'];
    }
  }

  // Rótulo do k-ésimo traço da régua (para a contagem animada).
  function rotuloPasso(item, k) {
    var v = k / item.partes;
    switch (item.tipo) {
      case 'fracao': return { a: k, b: item.partes };
      case 'decimal': return { t: comVirgula(v, item.partes === 4 ? 2 : 1) };
      case 'porcentagem': return { t: Math.round(v * 100) + '%' };
      default: return { t: comVirgula(v, 2) };
    }
  }

  function falaPasso(item, k) {
    var v = k / item.partes;
    switch (item.tipo) {
      case 'fracao': return fracaoFalada(k, item.partes);
      case 'decimal': return decimalFalado(v);
      case 'porcentagem': return extenso(Math.round(v * 100)) + ' por cento';
      default: return dinheiroFalado(v);
    }
  }

  function rotulosExtremos(item) {
    if (item.tipo === 'porcentagem') return ['0%', '100%'];
    if (item.tipo === 'dinheiro') return ['R$ 0', 'R$ 1'];
    return item.max === 2 ? ['0', '1', '2'] : ['0', '1'];
  }

  function explicacao(item) {
    var marco = item.marco;
    if (marco) {
      if (Math.abs(marco.valor - item.valor) < 1e-9) {
        return frase([rep(item), ' é o mesmo ponto que ', rep(marco), '!']);
      }
      return frase([rep(item), item.valor < marco.valor ? ' é menor que ' : ' é maior que ',
        rep(marco), item.valor < marco.valor ? ': fica à esquerda.' : ': fica à direita.']);
    }
    if (item.equivalente) {
      return frase([rep(item), ' é o mesmo ponto que ', rep(item.equivalente),
        '. Mesmo lugar, outro nome.']);
    }
    if (item.passos === 1) {
      return frase([rep(item), ' é uma das ', contagem(item.partes, 'parte igual', 'partes iguais'),
        item.tipo === 'dinheiro' ? [' de R$ 1.', ' de um real.'] : ' da pista.']);
    }
    switch (item.tipo) {
      case 'fracao':
        if (item.valor > 1) {
          return frase([rep(item), ' é 1 inteiro e mais ',
            [(item.a - item.b) + '/' + item.b, fracaoFalada(item.a - item.b, item.b)], '.']);
        }
        if (item.a === 1) {
          return frase([rep(item), ' é uma das ', contagem(item.b, 'parte igual', 'partes iguais'),
            ' da pista.']);
        }
        return frase([rep(item), ' é contar ', contagem(item.a, 'parte', 'partes'),
          ' de ', unidade(item), '.']);
      case 'decimal':
        return frase([rep(item), ' é contar ', contagem(item.passos, 'parte', 'partes'),
          ' de ', unidade(item), '.']);
      case 'porcentagem':
        return frase(['100% é a pista toda. ', rep(item), ' são ',
          contagem(item.passos, 'parte', 'partes'), ' de ', unidade(item), '.']);
      default:
        return frase([rep(item), ' são ', contagem(item.passos, 'moeda', 'moedas'),
          ' de ', unidade(item), '.']);
    }
  }

  // Primeira dica após errar: relação com uma referência + estratégia.
  function dica(item, pousou) {
    var partes = [];
    var referencia = item.max === 2 ? 1 : 0.5;
    var nomeRef = item.max === 2 ? ['o 1', 'o um'] : ['a metade', 'a metade'];
    var ladoAlvo = Math.sign(item.valor - referencia);
    var ladoPouso = Math.sign(pousou - referencia);
    if (item.marco) {
      partes.push('Compare com ', rep(item.marco), ', que já está marcado. ');
    } else if (ladoAlvo && ladoPouso && ladoAlvo !== ladoPouso) {
      partes.push(rep(item), ladoAlvo < 0 ? ' é menor que ' : ' é maior que ', nomeRef, '. ');
    }
    switch (item.tipo) {
      case 'fracao':
        partes.push('O ', [String(item.b), extenso(item.b)],
          ' de baixo diz em quantas partes iguais dividir ',
          item.max === 2 ? 'cada inteiro' : 'a pista', '. Use a régua e conte ',
          contagem(item.a, 'parte', 'partes'), '.');
        break;
      case 'decimal':
        partes.push(rep(item), ' são ', contagem(item.passos, 'parte', 'partes'), ' de ',
          unidade(item), '. Use a régua.');
        break;
      case 'porcentagem':
        partes.push('100% é a pista toda. Cada parte da régua vale ', unidade(item), '.');
        break;
      default:
        partes.push('Cada parte da régua vale ', unidade(item), '. Conte as moedas.');
    }
    return frase(partes);
  }

  global.PousoConteudo = {
    ETAPAS: ETAPAS,
    dica: dica,
    explicacao: explicacao,
    extenso: extenso,
    falaPasso: falaPasso,
    fracaoFalada: fracaoFalada,
    rotuloPasso: rotuloPasso,
    rotulosExtremos: rotulosExtremos
  };
})(window);
