/**
 * conteudo.js — casos, mistérios e falas do Detetive de Letrion (sem DOM).
 *
 * Cada caso é um texto curto dividido em frases (cada frase pode ser marcada
 * como pista). Cada mistério pede uma resposta E as frases que a provam.
 *
 * Textos originais escritos para o jogo (as fábulas recontam Esopo, domínio
 * público). RASCUNHO: precisa de revisão dos professores parceiros.
 *
 * Campos de uma frase: texto simples, ou { t: 'texto na tela', f: 'texto falado' }
 * quando há símbolos que a voz leria mal (horários, ordinais).
 */
(function (global) {
  'use strict';

  var TIPOS = {
    direta: {
      nome: 'Pista direta', bncc: 'EF15LP03',
      dica: 'Procure no texto as palavras da pergunta. A resposta está escrita perto delas.',
      dominio: 'encontrar informações escritas no texto'
    },
    escondida: {
      nome: 'Pista escondida', bncc: 'EF35LP04',
      dica: 'O texto não diz isso com todas as letras. Procure as frases que dão sinais da resposta e pense: o que esses sinais mostram?',
      dominio: 'descobrir o que o texto não diz com todas as letras'
    },
    palavra: {
      nome: 'Palavra misteriosa', bncc: 'EF35LP05',
      dica: 'Leia a frase da palavra e as frases perto dela. Elas ajudam a descobrir o que a palavra quer dizer.',
      dominio: 'descobrir o sentido de uma palavra pelo texto'
    },
    quem: {
      nome: 'Quem é quem', bncc: 'EF35LP06',
      dica: 'Volte nas frases de antes e pense: de quem ou do que o texto está falando aqui?',
      dominio: 'descobrir a quem uma palavra se refere'
    },
    assunto: {
      nome: 'Assunto principal', bncc: 'EF35LP03',
      dica: 'Pense: do que o texto fala do começo ao fim? Procure a frase que mostra isso.',
      dominio: 'encontrar o assunto principal de um texto'
    }
  };

  /* ------------------------------------------------
     Casos. `pistas`: índices das frases que provam a resposta;
     `todas: true` exige marcar todas elas (inferência que junta duas partes).
     `quebras`: índices em que começa um novo parágrafo.
     ------------------------------------------------ */
  var CASOS = [
    /* ── Nível 1 ─────────────────────────────────────── */
    {
      id: 'bilhete', nivel: 1, genero: 'Bilhete', titulo: 'O bilhete na geladeira',
      frases: [
        'Oi, Davi!',
        'Fui levar a vovó ao médico e volto às seis horas.',
        'O seu lanche está no forno, é só esquentar.',
        'Não esqueça de colocar ração para o Pipoca antes de fazer a tarefa.',
        'Beijos, mamãe.'
      ],
      misterios: [
        {
          tipo: 'direta', pergunta: 'Onde está o lanche de Davi?', pistas: [2],
          opcoes: [
            { texto: 'No forno', certa: true },
            { texto: 'Na geladeira', porque: 'O bilhete estava na geladeira, mas ele diz que o lanche está em outro lugar.' },
            { texto: 'Na casa da vovó', porque: 'A vovó foi ao médico. O bilhete não fala de lanche na casa dela.' }
          ],
          explicacao: 'A frase “O seu lanche está no forno” mostra onde está o lanche.'
        },
        {
          tipo: 'escondida', pergunta: 'Quem é o Pipoca?', pistas: [3], destaque: { frase: 3, palavra: 'Pipoca' },
          opcoes: [
            { texto: 'Um animal de estimação', certa: true },
            { texto: 'O irmão de Davi', porque: 'Leia de novo: o que Davi precisa colocar para o Pipoca? Quem come isso?' },
            { texto: 'O médico da vovó', porque: 'O médico aparece em outra frase. Quem recebe ração é o Pipoca.' }
          ],
          explicacao: 'Davi precisa colocar ração para o Pipoca. Ração é comida de bicho, então Pipoca é um animal de estimação.'
        }
      ]
    },
    {
      id: 'formiga-pomba', nivel: 1, genero: 'Fábula', titulo: 'A formiga e a pomba',
      frases: [
        'Uma formiga foi beber água no rio e caiu na correnteza.',
        'Uma pomba viu tudo do alto de uma árvore.',
        'Ela arrancou uma folha e jogou perto da formiga, que subiu nela e chegou salva à margem.',
        'Dias depois, um caçador mirou sua arma na pomba.',
        'A formiga correu e picou o pé do caçador.',
        'Ele gritou de dor, errou o tiro, e a pomba voou para longe.'
      ],
      misterios: [
        {
          tipo: 'quem', pergunta: 'Na frase “Ela arrancou uma folha”, quem é “ela”?', pistas: [1],
          destaque: { frase: 2, palavra: 'Ela' },
          opcoes: [
            { texto: 'A pomba', certa: true },
            { texto: 'A formiga', porque: 'A formiga estava na água. Ela é quem foi ajudada, não quem jogou a folha.' },
            { texto: 'A árvore', porque: 'A árvore é o lugar onde a pomba estava. Árvore não arranca folha sozinha.' }
          ],
          explicacao: 'A frase de antes fala da pomba, que viu tudo do alto. É ela quem joga a folha para ajudar a formiga.'
        },
        {
          tipo: 'escondida', pergunta: 'Por que a formiga picou o caçador?', pistas: [2, 3],
          opcoes: [
            { texto: 'Para salvar a pomba, que a salvou', certa: true },
            { texto: 'Porque estava com muita fome', porque: 'O texto não fala de fome. Veja o que a pomba tinha feito antes pela formiga.' },
            { texto: 'Porque o caçador pisou no formigueiro', porque: 'Em nenhuma frase o caçador pisa na formiga ou no formigueiro.' }
          ],
          explicacao: 'Antes, a pomba salvou a formiga jogando uma folha. Depois, a formiga retribuiu e salvou a pomba.'
        }
      ]
    },
    {
      id: 'cartaz-feira', nivel: 1, genero: 'Cartaz', titulo: 'Feira de Ciências',
      frases: [
        'Feira de Ciências da Escola Sol Nascente!',
        'Venha ver vulcões de bicarbonato, foguetes de garrafa e muito mais.',
        { t: 'Quando: sábado, 17 de outubro, das 9h às 12h.', f: 'Quando: sábado, dezessete de outubro, das nove ao meio-dia.' },
        'Onde: na quadra da escola.',
        'A entrada é gratuita e toda a família pode participar.'
      ],
      misterios: [
        {
          tipo: 'direta', pergunta: 'Em que lugar vai ser a feira?', pistas: [3],
          opcoes: [
            { texto: 'Na quadra da escola', certa: true },
            { texto: 'No sábado de manhã', porque: 'Isso diz QUANDO vai ser a feira. A pergunta quer saber ONDE.' },
            { texto: 'Na casa das famílias', porque: 'O cartaz convida as famílias para ir até a escola.' }
          ],
          explicacao: 'A frase “Onde: na quadra da escola” mostra o lugar da feira.'
        },
        {
          tipo: 'palavra', pergunta: 'O que quer dizer “gratuita” nesse cartaz?', pistas: [4],
          destaque: { frase: 4, palavra: 'gratuita' },
          opcoes: [
            { texto: 'Que não precisa pagar', certa: true },
            { texto: 'Que é muito divertida', porque: 'A feira pode ser divertida, mas “gratuita” fala da entrada: se é preciso pagar ou não.' },
            { texto: 'Que só abre de manhã', porque: 'O horário está em outra frase do cartaz.' }
          ],
          explicacao: 'A entrada é gratuita: ninguém precisa pagar, por isso toda a família pode ir.'
        }
      ]
    },
    {
      id: 'diario-bia', nivel: 1, genero: 'Diário', titulo: 'O diário de Bia',
      frases: [
        'Querido diário, hoje foi o meu primeiro dia na escola nova.',
        'Quando entrei na sala, minhas mãos suavam e eu olhava para o chão.',
        'Então uma menina chamada Júlia sentou do meu lado e me emprestou um lápis colorido.',
        'No recreio, a gente riu tanto que a barriga doeu.',
        'Acho que amanhã vai ser mais fácil.'
      ],
      misterios: [
        {
          tipo: 'escondida', pergunta: 'Como Bia se sentia quando entrou na sala?', pistas: [1],
          opcoes: [
            { texto: 'Nervosa', certa: true },
            { texto: 'Com raiva', porque: 'Quem está com raiva costuma gritar ou reclamar. Bia estava quieta, olhando para o chão.' },
            { texto: 'Com sono', porque: 'O texto não fala de bocejos nem de cansaço.' }
          ],
          explicacao: 'Mãos suando e olhar para o chão são sinais de nervosismo.'
        },
        {
          tipo: 'escondida', pergunta: 'Por que Bia acha que amanhã vai ser mais fácil?', pistas: [2, 3],
          opcoes: [
            { texto: 'Porque fez uma amiga', certa: true },
            { texto: 'Porque vai faltar à aula', porque: 'Bia não fala em faltar. Ela diz que amanhã vai ser mais fácil.' },
            { texto: 'Porque ganhou um lápis de presente', porque: 'Júlia emprestou o lápis, não deu. O importante é que as duas ficaram amigas.' }
          ],
          explicacao: 'Júlia sentou do lado de Bia e as duas riram juntas no recreio: Bia fez uma amiga.'
        }
      ]
    },

    /* ── Nível 2 ─────────────────────────────────────── */
    {
      id: 'noticia-trovao', nivel: 2, genero: 'Notícia', titulo: 'Cão ajuda a encontrar menino perdido',
      frases: [
        'Um cachorro chamado Trovão ajudou os bombeiros a encontrar um menino perdido na mata de Vila Serena, no domingo.',
        'O menino, de 10 anos, tinha se afastado da família durante um piquenique.',
        'Depois de três horas de busca, Trovão farejou uma blusa caída no chão e começou a latir sem parar.',
        'Os bombeiros seguiram o cão e acharam o garoto sentado perto de um riacho, com frio, mas sem ferimentos.',
        '“O Trovão foi incansável”, disse o capitão da equipe.',
        'A família agradeceu e prometeu levar um osso gigante para o herói.'
      ],
      quebras: [2],
      misterios: [
        {
          tipo: 'palavra', pergunta: 'O que quer dizer “incansável” nessa notícia?', pistas: [2],
          destaque: { frase: 4, palavra: 'incansável' },
          opcoes: [
            { texto: 'Que não parou de trabalhar', certa: true },
            { texto: 'Que estava muito cansado', porque: 'O “in” no começo muda o sentido: incansável é quem NÃO se cansa.' },
            { texto: 'Que estava com fome', porque: 'O texto não fala de fome. A palavra mostra outra coisa: Trovão continuou buscando por horas.' }
          ],
          explicacao: 'Trovão procurou por três horas sem parar. Por isso o capitão diz que ele foi incansável.'
        },
        {
          tipo: 'quem', pergunta: 'Na frase “acharam o garoto sentado perto de um riacho”, quem é “o garoto”?',
          pistas: [0, 1], destaque: { frase: 3, palavra: 'o garoto' },
          opcoes: [
            { texto: 'O menino que estava perdido', certa: true },
            { texto: 'O capitão dos bombeiros', porque: 'O capitão foi quem procurou e deu a entrevista. Quem foi achado perto do riacho foi outra pessoa.' },
            { texto: 'O dono do Trovão', porque: 'A notícia não fala do dono do cachorro.' }
          ],
          explicacao: '“O garoto” é outra forma de falar do menino perdido, que apareceu no começo da notícia.'
        }
      ]
    },
    {
      id: 'gato-ronrona', nivel: 2, genero: 'Texto informativo', titulo: 'Por que o gato ronrona?',
      frases: [
        'Quase todo mundo acha que o gato ronrona só quando está feliz.',
        'Mas os cientistas descobriram que não é bem assim.',
        'Os gatos também ronronam quando estão com dor, com medo ou machucados.',
        'Alguns pesquisadores acham que o ronronar ajuda o gato a se acalmar e até a se recuperar.',
        'Por isso, se o seu gato ronronar e parecer diferente do normal, vale levá-lo ao veterinário.'
      ],
      misterios: [
        {
          tipo: 'assunto', pergunta: 'Qual é o assunto principal desse texto?', pistas: [1, 2],
          opcoes: [
            { texto: 'Os motivos pelos quais o gato ronrona', certa: true },
            { texto: 'Como cuidar de um gato filhote', porque: 'O texto não fala de filhotes nem de como cuidar deles.' },
            { texto: 'Por que os gatos têm medo de cachorro', porque: 'Medo aparece em uma frase, mas cachorro não aparece no texto.' }
          ],
          explicacao: 'O texto todo explica por que os gatos ronronam: quando estão felizes, mas também com dor ou com medo.'
        },
        {
          tipo: 'escondida', pergunta: 'Por que vale levar ao veterinário um gato que ronrona e parece diferente?', pistas: [2],
          opcoes: [
            { texto: 'Porque ele pode estar com dor', certa: true },
            { texto: 'Porque ronronar faz mal', porque: 'O texto diz o contrário: o ronronar pode até ajudar o gato a se recuperar.' },
            { texto: 'Porque ele está feliz demais', porque: 'Se fosse só felicidade, não precisaria de veterinário.' }
          ],
          explicacao: 'O texto explica que os gatos também ronronam quando estão com dor. Por isso é bom o veterinário ver.'
        }
      ]
    },
    {
      id: 'tirinha-caio', nivel: 2, genero: 'Diálogo', titulo: 'A lição de Caio', dialogo: true,
      frases: [
        'Caio: Mãe, já terminei a lição! Posso ir jogar bola?',
        'Mãe: Terminou mesmo? E aquele caderno de matemática em cima da cama, aberto numa página em branco?',
        'Caio: Ah… esse caderno… é de outra matéria!',
        'Mãe: Desde quando tabuada é de outra matéria, Caio?'
      ],
      misterios: [
        {
          tipo: 'escondida', pergunta: 'O que a mãe descobriu?', pistas: [1],
          opcoes: [
            { texto: 'Que Caio não tinha terminado a lição', certa: true },
            { texto: 'Que Caio perdeu o caderno de matemática', porque: 'O caderno estava em cima da cama, então não estava perdido.' },
            { texto: 'Que Caio foi mal na prova de tabuada', porque: 'Ninguém fala de prova na conversa.' }
          ],
          explicacao: 'O caderno de matemática estava aberto numa página em branco: a lição não tinha sido feita.'
        },
        {
          tipo: 'escondida', pergunta: 'Por que Caio diz que o caderno “é de outra matéria”?', pistas: [2, 3],
          opcoes: [
            { texto: 'Para tentar escapar da bronca', certa: true },
            { texto: 'Porque pegou o caderno errado sem querer', porque: 'Leia de novo como Caio responde (“Ah… esse caderno…”) e o que a mãe diz depois.' },
            { texto: 'Porque tabuada é de português', porque: 'Tabuada é de matemática, e a mãe lembra isso a ele.' }
          ],
          explicacao: 'Caio inventa uma desculpa, mas a mãe lembra que tabuada é matemática: a desculpa não funcionou.'
        }
      ]
    },
    {
      id: 'plantar-feijao', nivel: 2, genero: 'Instruções', titulo: 'Como plantar feijão no algodão',
      frases: [
        'Você vai precisar de um copo, algodão, água e três grãos de feijão.',
        'Primeiro, forre o fundo do copo com algodão.',
        'Depois, coloque os grãos sobre o algodão e molhe com um pouco de água.',
        'Deixe o copo perto da janela, onde bata luz, mas não sol forte o dia todo.',
        'Molhe o algodão todos os dias, sem encharcar.',
        'Em mais ou menos uma semana, você vai ver as primeiras folhinhas.'
      ],
      misterios: [
        {
          tipo: 'direta', pergunta: 'O que fazer logo depois de forrar o copo com algodão?', pistas: [2],
          opcoes: [
            { texto: 'Colocar os grãos e molhar um pouco', certa: true },
            { texto: 'Deixar o copo perto da janela', porque: 'Esse passo vem mais tarde. Procure a palavra que mostra o que vem logo em seguida.' },
            { texto: 'Esperar uma semana para ver as folhas', porque: 'Esperar é o último passo, não o passo seguinte.' }
          ],
          explicacao: 'A palavra “Depois” mostra o passo seguinte: colocar os grãos e molhar com um pouco de água.'
        },
        {
          tipo: 'palavra', pergunta: 'O que quer dizer “encharcar”?', pistas: [2, 4],
          destaque: { frase: 4, palavra: 'encharcar' },
          opcoes: [
            { texto: 'Molhar demais', certa: true },
            { texto: 'Secar ao sol', porque: 'A frase fala de molhar o algodão. Encharcar tem a ver com água, não com secar.' },
            { texto: 'Colocar pouca água', porque: 'Colocar pouca água é o que o texto QUER. Encharcar é o contrário disso.' }
          ],
          explicacao: 'O texto pede só um pouco de água. “Sem encharcar” quer dizer sem molhar demais.'
        }
      ]
    },

    /* ── Nível 3 ─────────────────────────────────────── */
    {
      id: 'bola-telhado', nivel: 3, genero: 'Conto', titulo: 'A bola no telhado',
      frases: [
        'Na rua de Nina, todo fim de tarde tinha futebol.',
        'Naquela quinta, Rafa chutou forte demais e a bola foi parar no telhado de dona Cida.',
        'Todo mundo ficou quieto, porque dona Cida vivia reclamando do barulho das crianças.',
        'Nina respirou fundo, tocou a campainha e pediu desculpas.',
        'Para surpresa de todos, dona Cida sorriu e foi buscar uma escada.',
        'Ela contou que, quando era menina, também jogava bola na rua.',
        'Desde aquele dia, ela assiste aos jogos da janela e ainda torce pelas crianças.'
      ],
      quebras: [3],
      misterios: [
        {
          tipo: 'escondida', pergunta: 'Por que as crianças ficaram quietas quando a bola caiu no telhado?', pistas: [2],
          opcoes: [
            { texto: 'Tinham medo da reação de dona Cida', certa: true },
            { texto: 'Estavam cansadas do jogo', porque: 'Nada no texto mostra cansaço. O silêncio veio logo depois de a bola cair.' },
            { texto: 'Não sabiam de quem era a casa', porque: 'Elas sabiam: o texto diz que era o telhado de dona Cida.' }
          ],
          explicacao: 'Dona Cida vivia reclamando do barulho. Por isso as crianças acharam que ela ia brigar.'
        },
        {
          tipo: 'escondida', pergunta: 'O que mudou em dona Cida no fim da história? Marque uma pista de antes e uma de depois.',
          pistas: [2, 6], todas: true,
          opcoes: [
            { texto: 'Ela passou a gostar dos jogos das crianças', certa: true },
            { texto: 'Ela se mudou para outra casa da rua', porque: 'Ela continua na mesma casa: agora assiste aos jogos da janela.' },
            { texto: 'Ela proibiu o futebol na rua dela', porque: 'É o contrário: ela até torce pelas crianças.' }
          ],
          explicacao: 'Antes, dona Cida reclamava do barulho. Depois, ela assiste aos jogos e torce pelas crianças: ela mudou.'
        }
      ]
    },
    {
      id: 'carta-prefeito', nivel: 3, genero: 'Carta', titulo: 'Carta ao prefeito',
      frases: [
        'Senhor prefeito,',
        { t: 'Somos alunos do 5º ano da Escola Sol Nascente.', f: 'Somos alunos do quinto ano da Escola Sol Nascente.' },
        'Todos os dias atravessamos a Rua das Flores para chegar à escola.',
        'Nessa rua, os carros passam muito rápido e não existe faixa de pedestres.',
        'Na semana passada, um colega quase foi atropelado.',
        'Pedimos que seja pintada uma faixa e colocada uma lombada perto da escola.',
        { t: 'Atenciosamente, turma do 5º ano B.', f: 'Atenciosamente, turma do quinto ano B.' }
      ],
      quebras: [1, 5, 6],
      misterios: [
        {
          tipo: 'assunto', pergunta: 'Para que os alunos escreveram essa carta?', pistas: [5],
          opcoes: [
            { texto: 'Para pedir mais segurança na rua da escola', certa: true },
            { texto: 'Para convidar o prefeito para uma festa', porque: 'A carta não convida ninguém para nada.' },
            { texto: 'Para contar como é a escola deles', porque: 'A escola aparece só para explicar quem está escrevendo.' }
          ],
          explicacao: 'O pedido “seja pintada uma faixa e colocada uma lombada” mostra o objetivo: deixar a rua mais segura.'
        },
        {
          tipo: 'direta', pergunta: 'Por que os alunos acham a Rua das Flores perigosa?', pistas: [3, 4],
          opcoes: [
            { texto: 'Os carros correm e não há faixa de pedestres', certa: true },
            { texto: 'A rua é escura e não tem iluminação', porque: 'A carta não fala de luz na rua.' },
            { texto: 'A rua tem muitos buracos e lama', porque: 'Buracos não aparecem na carta.' }
          ],
          explicacao: 'A carta diz que os carros passam muito rápido e que não existe faixa. Um colega quase foi atropelado.'
        }
      ]
    },
    {
      id: 'abelhas', nivel: 3, genero: 'Texto informativo', titulo: 'As abelhas e as frutas',
      frases: [
        'As abelhas não servem só para fazer mel.',
        'Quando pousam nas flores, elas levam o pólen de uma flor para outra.',
        'Esse transporte, chamado polinização, ajuda as plantas a formar frutos e sementes.',
        'Sem as abelhas, muitas frutas que comemos, como a maçã e o morango, ficariam raras e caras.',
        'Por isso, os cientistas se preocupam com os venenos usados nas plantações, que matam muitas abelhas.'
      ],
      misterios: [
        {
          tipo: 'palavra', pergunta: 'No texto, o que é “polinização”?', pistas: [1, 2],
          destaque: { frase: 2, palavra: 'polinização' },
          opcoes: [
            { texto: 'Carregar o pólen entre as flores', certa: true },
            { texto: 'Fazer mel dentro da colmeia', porque: 'O texto começa dizendo que as abelhas não servem SÓ para fazer mel. A polinização é outra coisa.' },
            { texto: 'Colocar veneno nas plantações', porque: 'O veneno aparece no fim do texto, como um perigo para as abelhas.' }
          ],
          explicacao: '“Esse transporte” retoma a frase anterior: levar o pólen de uma flor para outra. Isso se chama polinização.'
        },
        {
          tipo: 'escondida', pergunta: 'Por que os venenos nas plantações preocupam os cientistas? Junte duas pistas.',
          pistas: [3, 4], todas: true,
          opcoes: [
            { texto: 'Porque, sem abelhas, faltariam frutas', certa: true },
            { texto: 'Porque o veneno estraga o gosto do mel', porque: 'O texto não fala do gosto do mel. Veja o que acontece com as abelhas e com as frutas.' },
            { texto: 'Porque as abelhas atacam as plantações', porque: 'O texto não diz que as abelhas atacam nada. É o veneno que mata as abelhas.' }
          ],
          explicacao: 'Os venenos matam as abelhas. E, sem abelhas, as frutas ficariam raras. Juntando as duas pistas, entendemos a preocupação.'
        }
      ]
    },
    {
      id: 'corvo-jarro', nivel: 3, genero: 'Fábula', titulo: 'O corvo e o jarro',
      frases: [
        'Um corvo estava morrendo de sede quando encontrou um jarro com um pouco de água no fundo.',
        'Ele tentou beber, mas seu bico não alcançava a água.',
        'Tentou derrubar o jarro, mas ele era pesado demais.',
        'Então o corvo teve uma ideia: começou a jogar pedrinhas dentro do jarro, uma por uma.',
        'Aos poucos, a água foi subindo, até que ele conseguiu beber.'
      ],
      misterios: [
        {
          tipo: 'assunto', pergunta: 'Qual ensinamento combina mais com essa fábula?', pistas: [3, 4],
          opcoes: [
            { texto: 'Usar a cabeça vale mais que a força', certa: true },
            { texto: 'Quem é mais forte sempre vence', porque: 'O corvo tentou usar a força para derrubar o jarro e não conseguiu.' },
            { texto: 'É melhor desistir quando algo é difícil', porque: 'O corvo não desistiu: ele tentou de outro jeito.' }
          ],
          explicacao: 'O corvo não conseguiu na força, mas teve uma ideia: jogou pedrinhas, uma por uma, até a água subir.'
        },
        {
          tipo: 'quem', pergunta: 'Na frase “mas ele era pesado demais”, quem é “ele”?', pistas: [2],
          destaque: { frase: 2, palavra: 'ele' },
          opcoes: [
            { texto: 'O jarro', certa: true },
            { texto: 'O corvo', porque: 'O corvo tentou derrubar alguma coisa pesada. Quem não saiu do lugar foi o jarro.' },
            { texto: 'O bico', porque: 'O bico apareceu na frase anterior, mas bico não se tenta derrubar.' }
          ],
          explicacao: 'O corvo tentou derrubar o jarro, mas “ele”, o jarro, era pesado demais.'
        }
      ]
    }
  ];

  /* ------------------------------------------------
     Falas fixas (frases fechadas, para gravar como áudio)
     ------------------------------------------------ */
  var EXTENSO = ['zero', 'um', 'dois'];

  var ESTRATEGIAS = [
    { id: 'localizar', icone: 'i-lupa', texto: 'Procurei no texto as palavras da pergunta' },
    { id: 'inferir', icone: 'i-pensar', texto: 'Juntei os sinais que o texto dá' },
    { id: 'contexto', icone: 'i-texto', texto: 'Reli a frase e as frases ao lado' },
    { id: 'chute', icone: 'i-chute', texto: 'Chutei' }
  ];

  var FALAS = {
    instrucao: 'Leia o caso. Toque nas frases que provam a resposta e depois escolha a resposta certa.',
    caso: function (caso) { return 'Caso: ' + caso.titulo + '.'; },
    duasPistas: 'Esta pergunta pede duas pistas.',
    faltaPista: 'Você achou uma pista! Esta pergunta pede duas. Marque a outra.',
    resolvido: 'Mistério resolvido!',
    resolvidoDica: 'Resolvido com a dica!',
    respostaCerta: 'A resposta está certa!',
    pistaNaoProva: 'Mas a frase marcada não prova isso. Procure outra frase.',
    aindaNao: 'Ainda não.',
    olheAqui: 'Olhe esta parte do texto.',
    vamosVer: 'Vamos ver juntos.',
    detetive: function (n) { return 'Detetive ' + EXTENSO[n] + '.'; },
    confirma: function (n) { return 'Detetive ' + EXTENSO[n] + ', leia em voz alta a frase marcada. Ela prova a resposta?'; },
    novoNivel: 'Muito bem! Os próximos casos vão ser mais difíceis.',
    treinar: 'Vamos treinar com casos mais fáceis.',
    fim: 'Missão concluída!',
    dominio: function (tipo) { return 'Agora você sabe ' + tipo.dominio + '!'; },
    pergunta: 'Como você encontrou as pistas?',
    estrategia: function (e) { return e.texto + '.'; },
    obrigado: 'Boa! Conte para o seu professor como você fez.',
    obrigadoChute: 'Tudo bem! Na próxima, tente achar a pista antes de escolher.',
    faltaMarcar: 'Antes, toque na frase que prova a resposta.',
    faltaEscolher: 'Agora escolha a resposta.',
    opcao: function (o) { return o.texto + '.'; }
  };

  function textoDa(frase) { return typeof frase === 'string' ? frase : frase.t; }
  function falaDa(frase) { return typeof frase === 'string' ? frase : frase.f; }

  // Todas as frases que o jogo pode falar: o roteiro para gerar os áudios.
  function todasAsFalas() {
    var lista = [];
    function add(f) { if (f && lista.indexOf(f) === -1) lista.push(f); }
    add(FALAS.instrucao);
    CASOS.forEach(function (caso) {
      add(FALAS.caso(caso));
      caso.frases.forEach(function (f) { add(falaDa(f)); });
      caso.misterios.forEach(function (m) {
        add(m.pergunta);
        add(m.explicacao);
        m.opcoes.forEach(function (o) { add(FALAS.opcao(o)); add(o.porque); });
      });
    });
    Object.keys(TIPOS).forEach(function (t) { add(TIPOS[t].dica); add(FALAS.dominio(TIPOS[t])); });
    [1, 2].forEach(function (n) { add(FALAS.detetive(n)); add(FALAS.confirma(n)); });
    ESTRATEGIAS.forEach(function (e) { add(FALAS.estrategia(e)); });
    ['duasPistas', 'faltaPista', 'resolvido', 'resolvidoDica', 'respostaCerta', 'pistaNaoProva', 'aindaNao',
      'olheAqui', 'vamosVer', 'novoNivel', 'treinar', 'fim', 'pergunta', 'obrigado', 'obrigadoChute',
      'faltaMarcar', 'faltaEscolher']
      .forEach(function (k) { add(FALAS[k]); });
    return lista;
  }

  global.DetetiveConteudo = {
    CASOS: CASOS,
    ESTRATEGIAS: ESTRATEGIAS,
    FALAS: FALAS,
    TIPOS: TIPOS,
    falaDa: falaDa,
    textoDa: textoDa,
    todasAsFalas: todasAsFalas
  };
})(window);
