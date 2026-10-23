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

## Um jogo por planeta (meta institucional: 3 a 5 jogos)

| Planeta | Jogo | Habilidades | Estado |
|---|---|---|---|
| Calculon · Matemática | **Pouso na Reta** — pousar a nave no ponto da reta numérica | BNCC EF04MA09/10, EF05MA03–06 | ✅ pronto ([guia](jogos/POUSO_NA_RETA.md)) |
| Letrion · Português | **Detetive de Letrion** — resolver mistérios marcando as frases que provam a resposta | BNCC EF15LP03, EF35LP03–06 | ✅ pronto; textos aguardam revisão docente ([guia](jogos/DETETIVE_DE_LETRION.md)) |
| Naturox · Ciências | **Teia Viva** — montar teias alimentares e prever o efeito de mudanças | BNCC EF04CI04–06 | ✅ pronto; conteúdo aguarda revisão docente ([guia](jogos/TEIA_VIVA.md)) |
| Terramund · Geografia | **Rumo Certo** — cumprir missões num mapa usando rosa dos ventos e legenda; o mapa gira e o Norte muda de lugar | BNCC EF04GE09, EF04GE10, EF03GE07, EF04MA16 | ✅ pronto; conteúdo aguarda revisão docente ([guia](jogos/RUMO_CERTO.md)) |
| Globish · Inglês | **Listen & Do** — ouvir um comando em inglês e executá-lo numa cena ("Put the red ball under the bed") | Currículo da Cidade SP EF04LI10, EF05LI02, EF05LI15; CEFR Pre-A1 (a BNCC só tem inglês a partir do 6º ano) | ✅ pronto; conteúdo aguarda revisão docente ([guia](jogos/LISTEN_AND_DO.md)) |

A fundamentação de cada um está em [PESQUISA_JOGOS.md](PESQUISA_JOGOS.md).

Também no repositório:

- voz: falas gravadas com voz neural do Azure (Macerio em português, Jenny nos
  comandos em inglês), iguais em qualquer computador e sem internet
  (`ferramentas/gerar-falas.ps1`);
- uso na escola: "Preparar para usar sem internet" (`sw.js`), "Nova dupla" e
  registro anônimo das jogadas, exportado em `professores/registro.html`;
- arte dos planetas: renders 3D gerados no Blender por
  `ferramentas/planeta-blender.py` (Naturox, Terramund, Globish), todos em
  `midia/planet-*.webp`;
- peças comuns dos jogos em `jogos/comum/` (voz, sons, contrato com o portal,
  visual);
- Contando Estrelas e Palavra Parkour: jogos do modelo antigo (pergunta por
  cima de ação), arquivados: os arquivos continuam no repositório, mas saíram
  do catálogo do portal;
- Nave Central e prólogo de Letrion: protótipos do ciclo anterior, fora da
  cópia publicada desde 23/10/2026 (`.gitattributes`, export-ignore). A economia
  de estrelas e troféus contraria a pesquisa sobre recompensas e será refeita
  como mapa de domínio.

## Calendário até fevereiro de 2027

As janelas de teste nas escolas são outubro–meados de dezembro e fevereiro.

| Mês | Desenvolvimento | Escolas e equipe |
|---|---|---|
| Outubro | Teia Viva ✅; Rumo Certo ✅ | Site publicado ✅ (provisório); professores revisam os quatro jogos |
| Novembro | Listen & Do ✅ (feito em outubro); uso sem internet, "Nova dupla" e registro anônimo ✅ | Primeiros testes nas escolas, com pré e pós-teste curtos |
| Dezembro | Portal repaginado: mapa de domínio no lugar da Nave; aposentar os jogos antigos | Últimos testes antes das férias |
| Janeiro | Ajustes a partir dos testes; painel do professor | Guias do professor, relatório |
| Fevereiro | — | Visitas com os 5 jogos e relatório final |

## Decisões pendentes

- Confirmar com o coordenador e a equipe a repaginação e o portfólio acima.
- Onde publicar: repositório próprio no GitHub ou acesso ao repositório atual.
- Definir as escolas e turmas para os testes.
- Decidir se o prólogo narrativo (O Eclipse dos Cinco Planetas) continua. A
  pesquisa indica que narrativa longa não melhora a aprendizagem.

