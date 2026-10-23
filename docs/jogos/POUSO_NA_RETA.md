# Pouso na Reta — guia do professor

**Planeta:** Calculon · **Matéria:** Matemática · **Público:** 4º e 5º ano
**Duração sugerida:** 10–15 min por sessão, em várias sessões ao longo de semanas.

## O que o jogo treina

A criança pilota uma nave e pousa no ponto da pista (uma reta numérica) que
corresponde ao número pedido. O lugar do pouso é a resposta: para acertar, é
preciso entender a fração, o decimal ou a porcentagem como uma **medida**.

| Etapa | Conteúdo | BNCC |
|---|---|---|
| 1 | Frações unitárias (1/2, 1/4, 1/10…) na pista de 0 a 1 | EF04MA09 |
| 2 | Frações até 1 (3/4, 5/8, 7/10…) | EF05MA03 |
| 3 | Decimais, porcentagens e dinheiro (0,75; 25%; R$ 0,50) | EF04MA10 · EF05MA06 |
| 4 | Frações maiores que 1, na pista de 0 a 2 (5/4, 3/2…) | EF05MA03 |
| 5 | Frações equivalentes e comparação com um ponto marcado | EF05MA04 · EF05MA05 |

## Como o jogo ajuda quem erra

1. **Primeiro erro:** diz se a nave passou ou ficou antes do ponto, dá uma dica
   de estratégia e mostra a **régua** (a pista dividida em partes iguais).
2. **Segundo erro:** o jogo demonstra, contando as partes em voz alta até o
   ponto certo ("um quarto, dois quartos, três quartos").

Não há vidas, cronômetro nem ranking. A dificuldade sobe depois de 3 acertos
de primeira seguidos e volta uma etapa depois de 3 erros seguidos.

## Como usar em sala

- **Em dupla no mesmo computador** (botão "Jogar em dupla"): os pilotos se
  alternam e o copiloto precisa concordar antes de cada pouso. Isso obriga a
  dupla a conversar sobre onde fica o número.
- **Depois do jogo (5 min):** pergunte "como vocês descobriram onde fica 3/4?",
  "por que 6/8 caiu no mesmo lugar que 3/4?", "0,5 e 50% são o mesmo ponto?".
  No fim da missão o próprio jogo pergunta à criança qual estratégia usou.
- **Repita:** o efeito aparece com várias sessões curtas, não com uma só.

## Ajustes pela URL

Acrescente ao endereço do jogo:

- `?etapa=3` — começa na etapa 3 (1 a 5);
- `?pousos=6` — missão com 6 pousos (4 a 20; padrão 10);
- `?dupla=1` — deixa "Jogar em dupla" selecionado.

Exemplo: `jogos/Pouso_na_Reta/index.html?etapa=2&pousos=8`.

## O que fica salvo

Apenas no navegador do computador usado, sem nome nem login: etapa atual,
acertos por etapa e as estratégias escolhidas na pergunta final. Limpar os
dados do navegador apaga esse progresso.

Também fica, no mesmo aparelho, o **registro das jogadas**: uma linha por
tarefa (etapa, acerto de primeira, dicas, erro e tempo), identificada só pelo
código da dupla que o professor digita em "Para o professor › Nova dupla", na
tela inicial. No fim de cada sessão, baixe a planilha em
`professores/registro.html`. "Nova dupla" faz a próxima dupla começar do zero
em todos os jogos do aparelho, sem apagar o registro; "Preparar para usar sem
internet" guarda o jogo e todos os áudios no aparelho antes da aula.

## Voz

Todas as falas são áudios gravados uma vez com a voz neural
**pt-BR-MacerioMultilingualNeural**, 8% mais rápida e com tom 5% mais alto para
soar animada (Azure Speech, nível gratuito F0), e ficam em `jogos/Pouso_na_Reta/audio/`.
Assim a voz é a mesma em qualquer computador e funciona sem internet. Se
faltar algum áudio, o jogo usa a voz do navegador.

Para mudar um texto falado:

1. edite `jogos/Pouso_na_Reta/conteudo.js`;
2. rode `powershell -ExecutionPolicy Bypass -File ferramentas/servidor-local.ps1`,
   abra `http://localhost:8080/ferramentas/roteiro-falas.html` e clique em
   **Salvar no projeto** (a página também serve para professores revisarem
   todas as frases);
3. rode `powershell -ExecutionPolicy Bypass -File ferramentas/gerar-falas.ps1`.
   Ele grava só as frases novas e apaga os áudios que saíram do roteiro.

A chave do Azure fica no arquivo `.env` da raiz, que não vai para o Git.

## Base na pesquisa

O formato segue o jogo *Catch the Monster* (Fazio, Kennedy & Siegler, 2016),
em que alunos de 4º e 5º ano melhoraram a estimativa de frações em menos de
15 minutos quando o feedback mostrava as partes e o ponto certo. Outros
estudos mostram que treinar frações na reta numérica transfere para a
comparação de frações. Detalhes em [PESQUISA_JOGOS.md](../PESQUISA_JOGOS.md).

## Ainda falta

- Testar com crianças e professores e ajustar as tolerâncias de acerto
  (hoje 7% da pista na etapa 1 até 5% na etapa 5).
- Pré-teste e pós-teste curtos para medir o efeito antes de afirmar que
  funciona.
- Etapa de ordenar 3 ou 4 números na pista (EF05MA05).
