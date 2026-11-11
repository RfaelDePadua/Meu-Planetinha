# Histórico de versões — Meu Planetinha

Registro das entregas do projeto de extensão (Edital 07/2026, IFSULDEMINAS
Campus Passos), como pede o eixo "desenvolvimento técnico" da avaliação do
projeto: commits, changelog e histórico de versões. O histórico completo está
no Git (repositório privado `LucasTerrau/meu-planetinha`, branch `repaginacao`).
As datas são as dos commits.

## Antes do projeto de 2026 (plataforma herdada)

- 22/06/2026 — repositório público inicial (`RfaelDePadua/Meu-Planetinha`).
- 30/06/2026 — Contando Estrelas (Matemática) com novo visual.
- 21/08/2026 — primeira versão do Palavra Parkour (Português), a partir do
  Jogo de Sílaba.

## Ciclo 1 — repaginação baseada em pesquisa (30/09 a 05/10/2026)

Decisão: refazer os jogos com a aprendizagem como mecânica central (e não uma
pergunta por cima de um jogo genérico), um jogo por planeta, para o 4º e o 5º
ano. Fundamentação em [PESQUISA_JOGOS.md](PESQUISA_JOGOS.md).

- 30/09 — Nave Central e prólogo de Letrion (protótipos, depois retirados do
  site); equipe e público-alvo (4º e 5º ano) alinhados ao projeto oficial.
- 30/09 — **Pouso na Reta** (Matemática): frações, decimais e porcentagem na
  reta numérica, com falas gravadas em voz neural.
- 30/09 — peças comuns dos jogos (voz, sons, contrato com o portal, visual).
- 30/09 — **Detetive de Letrion** (Português) e **Teia Viva** (Ciências).
- 05/10 — portal mostra só os jogos novos; jogos antigos arquivados.
- 05/10 — materiais do professor: pré e pós-teste (formas A e B), gabarito e
  roteiro de observação.
- 05/10 — **Rumo Certo** (Geografia). Site publicado em
  meu-planetinha.netlify.app.

## Ciclo 2 — preparação para as escolas (23/10/2026)

- **Uso na escola:** funcionar sem internet ("Preparar para usar sem
  internet"), "Nova dupla" para computadores compartilhados e registro anônimo
  das jogadas, exportado em planilha.
- **Listen & Do** (Inglês): quinto jogo; com ele, cada planeta tem um jogo.
- Arte 3D dos planetas Naturox, Terramund e Globish; as cinco artes em WebP.
- Revisão do site a partir de auditoria: menu, acessibilidade dos filtros,
  página 404, celular deitado, sem "melhor pontuação", protótipos fora do site.
- Correção do modo sem internet no endereço publicado.

## Ciclo 3 — validação com professores (a partir de 28/10/2026)

- Ficha de **validação pedagógica** por jogo (antes das visitas) e formulário
  de **feedback da visita** (depois de cada visita), como prevê a metodologia
  do projeto (Fases 3 e 4).
- Apresentação do projeto para as escolas, com a folha de combinados.
- Mais conteúdo para várias sessões sem repetir: **Teia Viva** de 19 para 40
  tarefas e **Rumo Certo** de 28 para 50 missões (mesmos mapas e teias), com
  as falas novas gravadas.
- Guia de manutenção ([MANUTENCAO.md](MANUTENCAO.md)) para quem continuar o
  projeto.
- **Teste de jogo antes das escolas (28/10):** cinco testadores automáticos
  jogaram cada jogo como crianças (acertando, chutando, em dupla, lendo pouco)
  e apontaram problemas; os relatórios ficam no repositório privado da equipe.
  Corrigido:
  - Pouso na Reta: etapa 3 alterna decimal, porcentagem e dinheiro.
  - Detetive de Letrion: gabarito aceita as frases que também provam a
    resposta; a segunda dica destaca as frases perto da pista, não o texto
    todo; alternativa errada fica riscada; só se marca quantas frases a
    pergunta pede; dicas e alternativas revisadas ("Tirinha" virou "Diálogo").
  - Teia Viva: a frase de erro "X não come Y" afirmava fatos falsos (o gavião
    come preás); agora fala da tarefa. Todas as previsões erradas são
    explicadas; a tela do "E se…?" diz o que fazer; novo cenário de
    decompositores.
  - Rumo Certo: pontos cardeais e colaterais sem respostas ambíguas (casas que
    ficavam "meio de lado" e colaterais tortos); o caminho pela ponte não conta
    mais como "se afastou"; mapa da cidade diz qual mercado ou escola; cada
    etapa nova se apresenta; "quadras" virou "quadradinhos".
  - Listen & Do: o lugar pedido nunca começa ocupado; tocar num lugar cheio
    troca as coisas; com o som desligado, o comando aparece escrito; "Tentar
    de novo" desfaz o que foi mexido por engano.
  - Todos: acertar com ajuda não faz descer de etapa; o portal repassa ao jogo
    os ajustes da URL (como `?texto=1`) e o som desligado.

- **O que tinha ficado do teste (28/10):**
  - Modo dupla nos cinco jogos: antes de conferir, o parceiro responde sozinho
    uma pergunta curta sobre o que o colega fez (de que lado da metade fica o
    número; qual frase prova; quem come tal ser; para que lado fica o lugar;
    quantos quadradinhos andaram). Se as respostas não batem, o jogo pede que
    conversem e decidam juntos. No Listen & Do, o parceiro ouve o comando antes
    de concordar; no "Leve o explorador", os dois se revezam a cada passo.
  - Detetive de Letrion: de 12 para 18 casos (6 por nível): convite, fábula da
    raposa e as uvas, receita, notícia, carta de leitor e texto sobre o
    tatu-bola.
  - Teia Viva: previsões cuja resposta é "fica igual" (a lobeira, que nenhuma
    seta liga aos gafanhotos nem às seriemas); com tudo certo, o jogo explica
    o caminho inteiro.
  - Telas: a tela final cabe em 1024×768; no celular em pé, os botões de ação
    ficam presos ao pé da tela, o Detetive mostra a pergunta antes do texto e
    os botões de previsão da Teia têm 44 px; no celular deitado, o Listen & Do
    rola.

- **Revisão de 04/11, antes da primeira reunião na escola** (robô com 21 mil
  toques, teste real sem internet e três revisões independentes):
  - Pouso na Reta: desfeita a margem apertada de 28/10 (até ±1,25% da pista),
    que quase impedia sair da primeira etapa. Agora 10% a 6% por etapa e 3
    acertos seguidos para subir; a tela sempre mostra o ponto exato.
  - Modo dupla: no Rumo Certo, o parceiro toca sozinho no lugar; na Teia Viva,
    a seta certa já pronta deixou de contar como discordância.
  - Listen & Do: tocar em outra coisa muda a seleção (não troca de lugar); nada
    começa dentro da caixa ou da mochila; subir e dominar seguem o mesmo critério.
  - Detetive de Letrion: gabarito revisado em cinco mistérios.
  - Todos os jogos: a etapa fica salva assim que muda; experimentar com `?etapa=`
    (`?nivel=` no Detetive) não grava nada; a última tarefa da sessão também conta
    para subir ou descer; o resumo final mostra o que foi visto junto; "Chutei"
    tem resposta própria.
  - Portal: "Nova dupla" funciona dentro do portal; sem internet, o botão
    principal e o menu funcionam; contato corrigido; compatibilidade com
    navegadores antigos.
  - Referências: retirados EF04GE10 (Rumo Certo) e EF04CI05 (Teia Viva), que os
    jogos não trabalham.
  - Fichas e apresentação: prazo e destinatário, tempo real, como ver as etapas
    avançadas, registro das jogadas e voz sintética.

- **11/11 — ajustes pedidos pela equipe:**
  - Rumo Certo: mapa redesenhado como tabuleiro de papel (chão em dois tons,
    rio com margem e ponte de verdade, lugares em plaquinhas, explorador novo
    que fica no canto quando está sobre um lugar, rastro tracejado, rosa dos
    ventos nova e nome do mapa); o mapa girado não encolhe mais; legenda junto
    do mapa; tablet em pé e celular deitado com o mapa grande.
  - Rumo Certo: na etapa 4, metade das missões com o mapa girado e metade com
    o norte para cima; cada mapa gira sempre do mesmo jeito; as rotas da etapa 5
    ficaram todas com o norte para cima (duas rotas novas no lugar das giradas).
  - Pouso na Reta: marquinhas de régua fixas na pista (10 por inteiro).
  - Teia Viva: menos toques: depois de cada seta, o último ser fica marcado
    para seguir a cadeia; tocar fora desmarca; "Desfazer" volta a marcar de
    onde a seta saía.

- **11/11 — Listen & Do sem som:** modo "Dupla sem som: um lê, o outro faz",
  para computadores sem caixa de som (o colega lê o comando em voz alta).
- **11/11 — site no domínio do projeto:** a versão nova passou a ser publicada em
  www.meuplanetinha.com.br (GitHub Pages, `main` do repositório público); o
  endereço da Netlify redireciona para lá.

## Alterações a partir do parecer dos professores

Registre aqui cada mudança feita por causa de uma ficha de validação ou de um
feedback de visita (o projeto conta quantas modificações vieram do parecer
docente).

| Data | Jogo | O que mudou | Origem (ficha/visita) | Commit |
|---|---|---|---|---|
| | | | | |
