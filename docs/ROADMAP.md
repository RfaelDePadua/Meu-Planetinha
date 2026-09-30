# Roadmap do Meu Planetinha

## Visão do produto

Meu Planetinha será um universo de aventuras educativas para estudantes do 4º e
5º ano do Ensino Fundamental (9 a 11 anos), alinhado à BNCC. Cada planeta
representa uma área do conhecimento, e cada jogo treina habilidades concretas
em que os alunos de escola pública mais têm dificuldade (SAEB).

Em 30/09/2026 o projeto foi repaginado com base em pesquisa sobre jogos
educativos ([PESQUISA_JOGOS.md](PESQUISA_JOGOS.md)). Princípios:

- **o conteúdo é a mecânica:** a ação do jogador é a própria resposta, nunca
  uma pergunta por cima de um jogo genérico;
- feedback que explica o erro e deixa tentar de novo; dicas em camadas;
- dificuldade adaptativa, mirando ~80% de acerto;
- tudo falado, texto curto, alvos de toque grandes;
- visual simples e narrativa mínima;
- recompensa que mostra domínio, sem moedas, rankings ou prêmios diários;
- jogo em dupla no mesmo computador e conversa com o professor depois;
- sem login e sem dados pessoais; progresso salvo no próprio dispositivo.

## Estado atual

- **Pouso na Reta** (Calculon): primeiro jogo no novo modelo. Frações,
  decimais, porcentagens e dinheiro na reta numérica, em 5 etapas BNCC.
  Guia do professor: [jogos/POUSO_NA_RETA.md](jogos/POUSO_NA_RETA.md).
- Contando Estrelas e Palavra Parkour: jogos do modelo antigo (pergunta por
  cima de ação), mantidos no catálogo até serem substituídos.
- Nave Central e prólogo de Letrion: protótipos do ciclo anterior. A economia
  de estrelas e troféus contraria a pesquisa sobre recompensas e será
  refeita como mapa de domínio.
- Infraestrutura mantida: página de jogo com contrato por `postMessage`
  (pronto, pausa, som, reinício, resultado) e progresso local (`progress.js`).

## Portfólio de jogos (meta institucional: 3 a 5)

Um jogo principal por matéria prioritária, depois dois complementares.

| # | Jogo | Planeta | Habilidades BNCC | Por que |
|---|---|---|---|---|
| 1 | **Pouso na Reta** ✅ | Calculon | EF04MA09/10, EF05MA03–06 | Números racionais são o maior gargalo do SAEB em Matemática; reta numérica tem a evidência mais forte. |
| 2 | **Detetive de Letrion** | Letrion | EF15LP03, EF35LP03–05 | Inferência é o gargalo em Português. A criança responde e precisa tocar nas frases do texto que provam a resposta. |
| 3 | **Teia Viva** | Naturox | EF04CI04–06, EF05CI03 | Montar a teia alimentar, prever o efeito de um evento (seca, caça) e simular. |
| 4 | Fábrica de Palavras | Letrion | EF04LP08, EF05LP08, EF04LP01, EF05LP01 | Ortografia pela morfologia: radical + sufixo (belo → beleza). |
| 5 | Carga da Frota | Calculon | EF04MA06/07, EF05MA08/12 | Problemas de multiplicação e divisão montando o esquema antes de calcular. |

## Próximos marcos

1. **Validar o Pouso na Reta** com professores e 3 a 5 crianças: compreensão
   sem ajuda, tolerâncias, voz, uso em dupla. Aplicar pré e pós-teste curtos.
2. **Detetive de Letrion:** escrever 12 a 15 casos curtos (fábula, notícia,
   tirinha, carta) com revisão docente; construir o jogo.
3. **Mapa de domínio** no lugar da Nave Central: mostrar o que a criança já
   sabe em cada planeta, sem economia de estrelas.
4. **Painel do professor:** resumo dos erros mais comuns da turma no
   dispositivo, para orientar a conversa depois do jogo.
5. **Teia Viva.**
6. Aposentar Contando Estrelas e Palavra Parkour quando houver substitutos.
7. Sincronização opcional (Firebase) só se as escolas precisarem continuar o
   progresso em outro computador: conta do responsável, perfis por apelido e
   apenas resumos de progresso.

## Decisões pendentes

- Confirmar com o coordenador e a equipe a repaginação e o portfólio acima.
- Definir as escolas e turmas para o teste do Pouso na Reta.
- Decidir se o prólogo narrativo (O Eclipse dos Cinco Planetas) continua. A
  pesquisa indica que narrativa longa não melhora a aprendizagem.
