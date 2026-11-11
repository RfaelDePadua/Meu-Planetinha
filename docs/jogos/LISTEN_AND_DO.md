# Listen & Do — guia do professor

**Planeta:** Globish · **Matéria:** Inglês (complemento) · **Público:** 4º e 5º ano
**Duração sugerida:** 10–15 min por sessão (8 comandos), em várias sessões.
**Fones de ouvido:** recomendados. Sem fones, o professor pode projetar o jogo
e a turma responde junto.

## O que o jogo treina

A criança ouve um comando em inglês e faz o que ele pede num quarto desenhado:

- **Toque:** "Touch the red ball" — tocar na coisa pedida;
- **Coloque:** "Put the cat under the table" — tocar na coisa, depois no lugar,
  e em **Pronto**.

O comando é **só ouvido**: não aparece escrito no começo, porque o objetivo é
compreender o inglês falado. Os botões **Ouvir** e **Devagar** repetem o
comando quantas vezes a criança quiser. Instruções e explicações são em
português; inglês só nos comandos e nas palavras-chave. O professor não
precisa falar inglês para usar o jogo.

| Etapa | Tarefa | Referência |
|---|---|---|
| 1 | Coisas: ball, car, book, robot, doll, cat, dog | EF04LI10 |
| 2 | Cores: red, blue, green, yellow ("the red ball") | EF04LI10 |
| 3 | In, on, under, com a cama, a mesa, a cadeira, a caixa e a mochila | EF05LI02 · EF05LI15 |
| 4 | Cor e lugar, com next to ("Put the blue car next to the box") | EF05LI02 · EF05LI15 |
| 5 | Dois comandos seguidos ("Put the cat on the bed and the ball in the box") | EF05LI02 |

A BNCC só tem Língua Inglesa a partir do 6º ano. Os códigos acima são do
**Currículo da Cidade de São Paulo** (Língua Inglesa, anos iniciais), usado
como referência. O vocabulário vem da lista **Cambridge Pre A1 Starters**
(nível CEFR Pre-A1).

## Como o jogo ajuda quem erra

- **1º erro:** o jogo diz o que a criança fez ("Você tocou o carro azul — the
  blue car") e repete o comando **mais devagar**.
- **2º erro:** o comando aparece escrito, com a **palavra que decide**
  destacada e traduzida ("**under** quer dizer embaixo").
- **3º erro:** o jogo **demonstra**: mostra a coisa certa ou leva cada coisa
  ao lugar, e diz o comando em inglês e em português.

Depois de cada tarefa, certa ou não, a tela mostra o comando e a tradução. As
etapas sobem depois de pelo menos 5 tarefas, com as 3 últimas de primeira, e
voltam com 3 tarefas seguidas que o jogo precisou demonstrar. Não há vidas, tempo nem ranking.

## Como usar em sala

- **Em dupla** ("Jogar em dupla"): os ouvintes se alternam. Antes de concordar,
  o parceiro precisa ouvir o comando (botão "Ouvir o comando"); o jogo pede que
  a dupla use a caixa de som baixinho, para os dois ouvirem. Peça que a dupla diga em voz alta a palavra que
  ouviu ("ouvi *under*, é embaixo").
- **Depois do jogo (5 min):** o professor diz um comando ("Put your pencil on
  the book!") e a turma faz com objetos de verdade; depois, uma criança dá o
  comando para a turma.

## Computador sem som

Na tela inicial, **"Dupla sem som: um lê, o outro faz"**: o leitor vê o comando
em inglês e o lê em voz alta; o ouvinte faz sem olhar a tela. O leitor toca em
"Já li em voz alta" (o comando some) e pode tocar em "Ler de novo". No fim, o
leitor confere se foi isso que leu. Os papéis trocam a cada tarefa. Assim a
criança ainda treina ouvir, e o leitor treina ler e falar. No registro, a
sessão aparece com o modo `leitor`. Pela URL: `?leitor=1`.

## Ajustes pela URL

- `?etapa=3` — começa na etapa 3 (1 a 5);
- `?tarefas=10` — sessão com 10 comandos (4 a 12; padrão 8);
- `?dupla=1` — deixa "Jogar em dupla" selecionado;
- `?texto=1` — mostra o comando escrito desde o começo (para quem não ouve bem,
  ou para treinar leitura).

## Voz

Os comandos usam a voz neural **en-US-JennyNeural** do Azure, em duas
velocidades (normal e −25%); as falas em português usam a voz do projeto
(Macerio). No roteiro, frases em inglês começam com `en:` e as lentas com
`en-lento:`. Para regerar depois de mudar o conteúdo: abra
`ferramentas/roteiro-falas.html?jogo=Listen_and_Do` pelo servidor local,
salve o roteiro e rode
`powershell -ExecutionPolicy Bypass -File ferramentas/gerar-falas.ps1 -Jogo Listen_and_Do`.

## O que fica salvo

Apenas no navegador do computador usado, sem nome nem login: etapa atual,
acertos por etapa e as estratégias escolhidas na pergunta final. Não há
microfone nem reconhecimento de voz.

Também fica, no mesmo aparelho, o **registro das jogadas**: uma linha por
tarefa (etapa, comando, acerto de primeira, dicas, erro e tempo), identificada
só pelo código da dupla que o professor digita em "Para o professor › Nova
dupla", na tela inicial. No fim de cada sessão, baixe a planilha em
`professores/registro.html`. "Preparar para usar sem internet" guarda o jogo e
todos os áudios no aparelho antes da aula.

## Base na pesquisa

Crianças lembram mais palavras de outra língua quando o áudio vem com imagem e
ação (Andrä et al., 2020); prática espaçada supera a concentrada (Kim & Webb,
2022); jogos digitais ajudam no vocabulário em língua estrangeira (Tsai &
Tsai, 2018). A evidência específica de "ouvir e fazer" (Total Physical
Response) com crianças é fraca, em estudos pequenos: o efeito deste jogo ainda
precisa ser medido. Detalhes em [PESQUISA_JOGOS.md](../PESQUISA_JOGOS.md).

## Ainda falta

- Revisão por professor de inglês e teste com crianças.
- Confirmar se alguma escola parceira de Passos tem inglês nos anos iniciais.
- Mais cenas (sala de aula, parque), números (1 a 10) e between.
- Revisão espaçada dos comandos errados entre sessões.
