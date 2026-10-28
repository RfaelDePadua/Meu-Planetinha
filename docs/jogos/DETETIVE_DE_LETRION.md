# Detetive de Letrion — guia do professor

**Planeta:** Letrion · **Matéria:** Língua Portuguesa · **Público:** 4º e 5º ano
**Duração sugerida:** 12–15 min por sessão (3 casos, 6 mistérios), em várias
sessões ao longo de semanas, com conversa depois.

## O que o jogo treina

A criança lê um caso curto (bilhete, fábula, notícia, diálogo, cartaz, carta,
instruções, diário, texto informativo) e resolve dois mistérios sobre ele.
Para resolver, precisa **escolher a resposta e marcar as frases do texto que
a provam**. Resposta sem prova não resolve o caso: a busca de evidências no
texto é a própria mecânica.

| Tipo de mistério | O que pede | BNCC |
|---|---|---|
| Pista direta | localizar uma informação escrita no texto | EF15LP03 |
| Pista escondida | inferir o que o texto não diz com todas as letras | EF35LP04 |
| Palavra misteriosa | descobrir o sentido de uma palavra pelo contexto | EF35LP05 |
| Quem é quem | descobrir a quem um pronome ou expressão se refere | EF35LP06 |
| Assunto principal | identificar a ideia central ou o ensinamento | EF35LP03 |

Inferência e relação entre partes do texto são justamente as habilidades em
que a média dos alunos de 5º ano ainda não chega no SAEB (ver
[PESQUISA_JOGOS.md](../PESQUISA_JOGOS.md)).

## Como o jogo ajuda quem erra

1. **Primeiro erro:** explica por que aquela resposta não serve (cada resposta
   errada tem sua explicação) e dá a estratégia do tipo de mistério. A
   alternativa errada fica riscada até o fim do mistério. Se a resposta estava
   certa mas a frase marcada não prova, o jogo diz isso, mostra a frase errada
   em vermelho e deixa a resposta travada.
2. **Segundo erro:** repete a explicação e destaca as frases perto da pista
   (a frase da pista e as vizinhas).
3. **Terceiro erro:** demonstra — mostra as pistas e a resposta, com a
   explicação falada.

Só dá para marcar quantas frases a pergunta pede (uma, ou duas quando ela diz
"junte duas pistas"): marcar várias ao acaso não vale como prova.

Os casos têm três níveis. O nível sobe depois de dois casos seguidos com os
dois mistérios de primeira, e desce quando nenhum mistério do caso sai de
primeira e pelo menos um precisa de demonstração. Um tipo de mistério aparece
como "dominado" com 5 acertos de primeira (e pelo menos 75% de acerto). Não há
vidas, tempo nem ranking.

## Como usar em sala

- **Em dupla no mesmo computador** ("Jogar em dupla"): os detetives se
  alternam e o parceiro precisa concordar com a pista e a resposta antes de
  resolver. A conversa sobre "qual frase prova?" é o objetivo.
- **Ouvir o texto:** lê o caso em voz alta, frase por frase, destacando a
  frase lida. Ajuda quem ainda lê devagar. Para treinar a leitura sem apoio,
  use `?audio=0`.
- **Depois do jogo (5 min):** peça que as duplas leiam em voz alta a frase que
  usaram como prova e expliquem por que ela prova. No fim, o jogo mostra o
  resultado por tipo de mistério e pergunta à criança como ela achou as
  pistas.

## Ajustes pela URL

- `?nivel=2` — começa no nível 2 (1 a 3);
- `?casos=4` — missão com 4 casos (2 a 6; padrão 3);
- `?dupla=1` — deixa "Jogar em dupla" selecionado;
- `?audio=0` — esconde o botão "Ouvir o texto".

## Os textos

São 12 casos originais escritos para o jogo (as duas fábulas recontam Esopo,
domínio público), 4 por nível, cada um com 2 mistérios. **É um rascunho:**
precisa de revisão dos professores parceiros quanto a vocabulário, tamanho e
adequação à turma. Para revisar todas as frases de uma vez, abra
`ferramentas/roteiro-falas.html?jogo=Detetive_de_Letrion` pelo servidor local.

Para acrescentar ou mudar um caso, edite `jogos/Detetive_de_Letrion/conteudo.js`,
salve o roteiro e regrave as falas (o passo a passo está em
[POUSO_NA_RETA.md](POUSO_NA_RETA.md#voz), trocando o jogo por
`-Jogo Detetive_de_Letrion`).

## O que fica salvo

Apenas no navegador do computador usado, sem nome nem login: nível atual,
casos já feitos, acertos por tipo de mistério e as estratégias escolhidas.

Também fica, no mesmo aparelho, o **registro das jogadas**: uma linha por
tarefa (etapa, acerto de primeira, dicas, erro e tempo), identificada só pelo
código da dupla que o professor digita em "Para o professor › Nova dupla", na
tela inicial. No fim de cada sessão, baixe a planilha em
`professores/registro.html`. "Nova dupla" faz a próxima dupla começar do zero
em todos os jogos do aparelho, sem apagar o registro; "Preparar para usar sem
internet" guarda o jogo e todos os áudios no aparelho antes da aula.

## Base na pesquisa

Ensino explícito de inferência melhora a compreensão (Elleman, 2017,
d = 0,58), e tutores de estrutura textual tiveram efeito positivo com alunos
de 4º e 5º ano (ITSS, WWC 2020). Não encontramos jogo de compreensão testado
em português para 9–11 anos: este jogo transpõe instrução validada para uma
mecânica de jogo, e seu efeito ainda precisa ser medido.

## Ainda falta

- Revisão dos textos pelos professores e teste com crianças.
- Mais casos por nível (com 3 casos por sessão, uma criança vê todos em 4 sessões).
- Mistérios de fato × opinião e de conjunções (EF05LP07).
