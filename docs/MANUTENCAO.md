# Manutenção — para quem continuar o Meu Planetinha

Guia curto para a próxima equipe (ou o próximo bolsista) manter os jogos
funcionando, mudar conteúdo e publicar. Não precisa de framework nem de
instalação: é um site estático (HTML, CSS e JavaScript puro).

## Estrutura

| Pasta | O que tem |
|---|---|
| `index.html`, `explorar/`, `sobre_nos/`, `components/`, `estilos/`, `scripts/` | Portal (página inicial, catálogo, menu e rodapé injetados) |
| `jogos/jogar.html` + `scripts/jogar.js` | Página que abre cada jogo num iframe (tela de abertura, pausa, som) |
| `jogos/<Jogo>/` | Um jogo: `index.html`, `estilo.css`, `conteudo.js` (textos, fases, falas), `jogo.js` (lógica), `audio/` (mp3 + `falas.json`) |
| `jogos/comum/` | Peças comuns: voz, sons, contrato com o portal, registro anônimo, "Nova dupla", uso sem internet |
| `sw.js` | Service worker (uso sem internet) |
| `professores/` | Folhas para imprimir (avaliação, validação, feedback, observação) e a planilha do registro |
| `docs/` | Pesquisa, roteiro, guias de cada jogo, este guia, histórico de versões |
| `ferramentas/` | Servidor local, gerador de falas (Azure), roteiro de falas, gerador da arte dos planetas (Blender) |
| `scripts/games.js` | **Catálogo**: lista de jogos (nome, planeta, caminho, textos do lobby) |

Cada jogo segue o mesmo padrão; o mais simples para estudar é o `Rumo_Certo`.

## Rodar no computador

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ferramentas/servidor-local.ps1
```

Abra http://localhost:8080/. (O service worker e o "Preparar" só funcionam por
http, não abrindo o arquivo direto.)

## Mudar o conteúdo de um jogo

1. Edite o `conteudo.js` do jogo (frases, fases, itens). Os textos falados
   ficam em `FALAS` e a função `todasAsFalas()` lista tudo o que o jogo pode
   falar.
2. Com o servidor local rodando, abra
   `http://localhost:8080/ferramentas/roteiro-falas.html?jogo=<Pasta>` e clique
   em **Salvar no projeto** (grava `audio/roteiro.json`).
3. Gere os áudios que faltam:
   `powershell -ExecutionPolicy Bypass -File ferramentas/gerar-falas.ps1 -Jogo <Pasta>`
   - Precisa de `.env` na raiz com `AZURE_SPEECH_KEY` e `AZURE_SPEECH_REGION`
     (**nunca** versionar o `.env`).
   - Vozes: português `pt-BR-MacerioMultilingualNeural` (+8% velocidade, +5%
     tom); inglês `en-US-JennyNeural` para frases que começam com `en:`
     (`en-lento:` = −25%).
   - Use o plano gratuito F0 do Azure Speech: o roteiro de um jogo inteiro
     cabe com folga no limite mensal.
   - Sem áudio gravado, o jogo usa a voz do navegador (funciona, mas pior).
4. Teste o jogo no navegador e registre a mudança no
   [CHANGELOG](CHANGELOG.md) se veio de um parecer de professor.

## Publicar

O site está em https://meu-planetinha.netlify.app (Netlify). **Nunca publique a
pasta do projeto direto** (ela tem o `.env` com a chave do Azure). Publique uma
cópia limpa, só com o que está no Git:

```bash
rm -rf .publicar && mkdir .publicar && git archive HEAD | tar -x -C .publicar
```

Depois publique a pasta `.publicar` (Netlify CLI ou arrastando a pasta no painel
do Netlify). O `.gitattributes` tira da cópia os protótipos antigos e as artes
PNG. Funciona igual no GitHub Pages, se for preciso trocar de hospedagem.

**Ao mudar algo que precisa chegar a computadores já preparados sem internet**,
nada a fazer: páginas e código vêm da rede primeiro. Só ao mudar a estrutura do
cache, troque o nome `meu-planetinha-v1` em `sw.js` **e** em
`jogos/comum/jogo-base.js` (os dois iguais); o service worker apaga o antigo.

## Contas e acessos (transferir antes do fim do projeto)

| Serviço | Onde está hoje | O que fazer |
|---|---|---|
| Código | GitHub `LucasTerrau/meu-planetinha` (privado) | Dar acesso ao coordenador; decidir com o NIT a licença antes de tornar público |
| Site | Netlify, conta do bolsista (site `meu-planetinha`) | Transferir para uma conta do projeto ou do campus |
| Vozes | Azure Speech F0, conta do bolsista | Criar um recurso F0 na conta de quem continuar (a chave nunca vai para o Git) |
| Domínio | `meuplanetinha.com.br` (registrado por ex-integrante) | Confirmar quem renova; se não for do projeto, apagar o `CNAME` |

## Arte dos planetas

`ferramentas/planeta-blender.py` gera as ilustrações 3D (Blender 5.x, linha de
comando):

```bash
blender --background --factory-startup --python ferramentas/planeta-blender.py -- naturox saida.png 160
```

O site usa `midia/planet-<nome>.webp` (400 × 400).

## Dados das crianças

Os jogos não têm login nem nomes. O progresso e o registro das jogadas ficam
só no navegador do aparelho; o professor baixa a planilha em
`professores/registro.html`. Mantenha assim: sem cadastro, sem fotos de rosto,
sem servidor com dados de crianças.
