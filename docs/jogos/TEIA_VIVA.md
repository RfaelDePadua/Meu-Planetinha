# Teia Viva — guia do professor

**Planeta:** Naturox · **Matéria:** Ciências · **Público:** 4º e 5º ano
**Duração sugerida:** 10–15 min por sessão (6 tarefas), em várias sessões, com
conversa depois.

## O que o jogo treina

Os seres do Cerrado (e de uma lagoa) aparecem como cartas. A criança trabalha
de dois jeitos:

- **Montar:** liga os seres com setas que mostram para onde vai a energia — do
  alimento para quem come (Sol → capim → gafanhoto → sapo…). Desenhar a seta
  ao contrário ("quem come quem") é um erro muito comum, e o jogo explica esse
  erro em particular.
- **E se…?:** acontece um evento (uma seca, a caça dos gaviões, o sumiço dos
  fungos). A criança **prevê** se cada ser marcado vai aumentar, diminuir ou
  ficar igual. A simulação mostra o que acontece, passo a passo, e destaca o
  caminho de setas que explica cada efeito.

| Etapa | Tarefa | BNCC |
|---|---|---|
| 1 | Montar cadeias alimentares começando pelo Sol | EF04CI04 |
| 2 | Completar teias alimentares com vários caminhos | EF04CI04 |
| 3 | E se…? Efeito direto (quem come ou é comido) | EF04CI04 |
| 4 | E se…? Efeito em cadeia (seguir as setas) | EF04CI04 |
| 5 | Decompositores e o solo (ciclo da matéria) | EF04CI05 · EF04CI06 |

## Como o jogo ajuda quem erra

- **Montar:** cada seta errada recebe uma explicação ("Seta ao contrário: é o
  sapo que come o gafanhoto"; "O capim não come outros seres: as plantas
  produzem o próprio alimento com a luz do Sol"). Sem setas erradas, o jogo
  dá a estratégia ("Comece pelo Sol…"); no erro seguinte, aponta o ser a olhar
  ("Quem come o preá?"). No terceiro, desenha as setas que faltavam, falando o
  caminho da energia.
- **E se…?:** a resposta é revelada pela simulação; cada previsão errada vem
  com a explicação e as setas que levam ao efeito.

As etapas sobem com 3 acertos de primeira seguidos e voltam com 3 tarefas sem
acerto nenhum (demonstradas, ou com todas as previsões erradas); acertar com
dica não faz voltar. Não há vidas, tempo nem ranking.

## Como usar em sala

- **Em dupla** ("Jogar em dupla"): os naturalistas se alternam. Antes de
  conferir, o parceiro responde sozinho: nas cadeias, "quem come tal ser?"
  (as setas do colega ficam escondidas); no "E se…?", a previsão de um dos
  seres. Se as respostas não batem, conversam e decidem juntos. Nas tarefas "E se…?", peça que a dupla
  combine a previsão em voz alta antes de tocar.
- **Depois do jogo (5 min):** "Por que a seta sai do capim e vai para o
  gafanhoto?", "Se os gaviões sumirem, por que os gafanhotos aumentam?",
  "O que aconteceria com as folhas da escola se não houvesse fungos?". Vale
  desenhar no quadro uma teia de um lugar que as crianças conhecem.

## Ajustes pela URL

- `?etapa=3` — começa na etapa 3 (1 a 5);
- `?tarefas=8` — missão com 8 tarefas (3 a 12; padrão 6);
- `?dupla=1` — deixa "Jogar em dupla" selecionado.

## O conteúdo

As relações de alimentação foram escolhidas para serem claras e verdadeiras
(o lobo-guará come o fruto da lobeira e preás; a seriema come gafanhotos; o
gavião come preás e cobras). Nos cenários "E se…?", o resultado de cada
pergunta foi escrito à mão, e a simulação só mexe no ser atingido e nos seres
perguntados, para não mostrar efeitos ambíguos. **Precisa de revisão de um
professor de Ciências.** Para revisar as frases, abra
`ferramentas/roteiro-falas.html?jogo=Teia_Viva` pelo servidor local.

## O que fica salvo

Apenas no navegador do computador usado, sem nome nem login: etapa atual,
acertos por etapa e as estratégias escolhidas na pergunta final.

Também fica, no mesmo aparelho, o **registro das jogadas**: uma linha por
tarefa (etapa, acerto de primeira, dicas, erro e tempo), identificada só pelo
código da dupla que o professor digita em "Para o professor › Nova dupla", na
tela inicial. No fim de cada sessão, baixe a planilha em
`professores/registro.html`. "Nova dupla" faz a próxima dupla começar do zero
em todos os jogos do aparelho, sem apagar o registro; "Preparar para usar sem
internet" guarda o jogo e todos os áudios no aparelho antes da aula.

## Base na pesquisa

Simulações e modelagem guiadas ajudam crianças a entender a dinâmica de
ecossistemas (Hmelo-Silver et al., 2017; Dickes et al., 2016), e jogos sérios
de Ciências superam o ensino convencional (Riopel et al., 2019). Há pouca
evidência experimental com jogos para 9–11 anos nesta área: o efeito deste
jogo ainda precisa ser medido. Detalhes em [PESQUISA_JOGOS.md](../PESQUISA_JOGOS.md).

## Ainda falta

- Revisão do conteúdo por professor de Ciências e teste com crianças.
- Mais teias (Mata Atlântica, rio) e cenários "E se…?".
- Tarefa de ciclo da água e cobertura vegetal (EF05CI02, EF05CI03).
