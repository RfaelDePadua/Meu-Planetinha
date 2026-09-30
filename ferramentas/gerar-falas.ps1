<#
.SYNOPSIS
  Gera os áudios das falas de um jogo com as vozes neurais do Azure (Speech).

.DESCRIPTION
  Lê o roteiro do jogo (jogos/<Jogo>/audio/roteiro.json, uma lista de frases),
  gera um mp3 por frase e grava o índice jogos/<Jogo>/audio/falas.json, que o
  jogo usa para tocar os áudios. Só gera o que ainda não existe; frases que
  saíram do roteiro têm o áudio apagado.

  O roteiro sai de ferramentas/roteiro-falas.html (abra pelo servidor local e
  clique em "Baixar roteiro.json").

  A chave nunca vai para o Git: fica no arquivo .env da raiz do projeto
  (já ignorado), com as linhas
    AZURE_SPEECH_KEY=...
    AZURE_SPEECH_REGION=brazilsouth

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File ferramentas/gerar-falas.ps1 -Amostras
  Gera uma amostra de cada voz pt-BR em ferramentas/amostras-voz/ para escolher.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File ferramentas/gerar-falas.ps1 -Amostras -Vozes pt-BR-AntonioNeural -Velocidade '+8%' -Tom '+5%'
  Amostra de vozes específicas com outra velocidade e outro tom (mais animado).

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File ferramentas/gerar-falas.ps1
  Gera o que falta com a voz oficial do projeto (Macerio, velocidade +8%, tom +5%,
  escolhida em 30/09/2026). Trocar voz, velocidade ou tom regrava todos os áudios.
#>
param(
  [string]$Jogo = 'Pouso_na_Reta',
  [string]$Voz = 'pt-BR-MacerioMultilingualNeural',
  [string]$Velocidade = '+8%',
  [string]$Tom = '+5%',
  [switch]$Amostras,
  [string[]]$Vozes,
  [string]$Frase = 'Pouso perfeito! Três quartos é contar três partes de um quarto. Agora, pouse em cinco oitavos.',
  [switch]$Refazer
)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
$utf8 = New-Object System.Text.UTF8Encoding $false

# ── Configuração (.env ou variáveis de ambiente) ────────────────────────────
$config = @{}
$arquivoEnv = Join-Path $raiz '.env'
if (Test-Path -LiteralPath $arquivoEnv) {
  foreach ($linha in [IO.File]::ReadAllLines($arquivoEnv, $utf8)) {
    if ($linha -match '^\s*([A-Z_]+)\s*=\s*(.*?)\s*$') { $config[$matches[1]] = $matches[2].Trim('"', "'") }
  }
}
$chave = if ($env:AZURE_SPEECH_KEY) { $env:AZURE_SPEECH_KEY } else { $config['AZURE_SPEECH_KEY'] }
$regiao = if ($env:AZURE_SPEECH_REGION) { $env:AZURE_SPEECH_REGION } else { $config['AZURE_SPEECH_REGION'] }
if (-not $chave -or -not $regiao) {
  throw 'Faltam AZURE_SPEECH_KEY e AZURE_SPEECH_REGION no arquivo .env da raiz do projeto.'
}

$base = "https://$regiao.tts.speech.microsoft.com"
$cabecalhos = @{
  'Ocp-Apim-Subscription-Key' = $chave
  'X-Microsoft-OutputFormat' = 'audio-24khz-48kbitrate-mono-mp3'
}

function Sintetizar([string]$texto, [string]$voz, [string]$destino) {
  $ssml = "<speak version='1.0' xml:lang='pt-BR'><voice name='$voz'>" +
    "<prosody rate='$Velocidade' pitch='$Tom'>$([Security.SecurityElement]::Escape($texto))</prosody></voice></speak>"
  $corpo = $utf8.GetBytes($ssml)
  for ($tentativa = 1; $tentativa -le 8; $tentativa++) {
    try {
      Invoke-WebRequest -Uri "$base/cognitiveservices/v1" -Method Post -Headers $cabecalhos `
        -ContentType 'application/ssml+xml; charset=utf-8' -Body $corpo -OutFile $destino `
        -UserAgent 'MeuPlanetinha-gerar-falas' -UseBasicParsing | Out-Null
      return
    } catch {
      $status = 0
      if ($_.Exception.Response) { $status = [int]$_.Exception.Response.StatusCode }
      if ($status -eq 429 -or $status -ge 500) {
        # Camada gratuita limita requisições por minuto: espera e tenta de novo.
        Start-Sleep -Seconds ([Math]::Min(60, 6 * $tentativa))
        continue
      }
      if ($status -eq 401) { throw 'Chave recusada pelo Azure (HTTP 401). Confira AZURE_SPEECH_KEY e a região.' }
      throw "Falha ao gerar '$texto' (HTTP $status): $($_.Exception.Message)"
    }
  }
  throw "Muitas tentativas ao gerar '$texto'."
}

function NomeDoArquivo([string]$texto) {
  # O tom só entra na chave quando muda, para não invalidar áudios já gerados.
  $chaveAudio = if ($Tom -eq '+0%') { "$Voz|$Velocidade|$texto" } else { "$Voz|$Velocidade|$Tom|$texto" }
  $sha = [Security.Cryptography.SHA1]::Create()
  $hash = $sha.ComputeHash($utf8.GetBytes($chaveAudio))
  return (-join ($hash[0..7] | ForEach-Object { $_.ToString('x2') })) + '.mp3'
}

function Sinal([string]$valor) { ($valor -replace '%', '') -replace '^\+', 'p' -replace '^-', 'm' }

# ── Modo amostras: uma frase nas vozes pedidas (ou em todas as pt-BR) ───────
# Cada rodada acrescenta arquivos (voz + velocidade + tom) sem apagar os anteriores.
if ($Amostras) {
  $pasta = Join-Path $PSScriptRoot 'amostras-voz'
  New-Item -ItemType Directory -Force -Path $pasta | Out-Null
  # Chamado com -File, "-Vozes a,b" chega como um texto só: separa pelas vírgulas.
  $Vozes = @($Vozes | ForEach-Object { $_ -split ',' } | Where-Object { $_ })
  if (-not $Vozes) {
    $lista = Invoke-RestMethod -Uri "$base/cognitiveservices/voices/list" -Headers @{ 'Ocp-Apim-Subscription-Key' = $chave } -UseBasicParsing
    $Vozes = $lista | Where-Object { $_.Locale -eq 'pt-BR' } | Sort-Object ShortName | ForEach-Object { $_.ShortName }
  }
  foreach ($v in $Vozes) {
    $arquivo = '{0}__vel{1}__tom{2}.mp3' -f $v, (Sinal $Velocidade), (Sinal $Tom)
    Write-Host "Amostra: $v (velocidade $Velocidade, tom $Tom)"
    Sintetizar $Frase $v (Join-Path $pasta $arquivo)
  }

  # Recria o índice com todas as amostras da pasta, das mais novas para as mais antigas.
  $itens = Get-ChildItem -LiteralPath $pasta -Filter '*.mp3' | Sort-Object LastWriteTime -Descending | ForEach-Object {
    $rotulo = $_.BaseName
    if ($_.BaseName -match '^(.+?)__vel([pm]?\d+)__tom([pm]?\d+)$') {
      $fmt = { param($s) ($s -replace '^p', '+' -replace '^m', '-') + '%' }
      $rotulo = "$($matches[1]) · velocidade $(& $fmt $matches[2]) · tom $(& $fmt $matches[3])"
    } else {
      $rotulo = "$($_.BaseName) · primeira rodada (velocidade -5%)"
    }
    "<li><strong>$rotulo</strong><br><audio controls preload='none' src='$($_.Name)'></audio></li>"
  }
  $html = "<!doctype html><meta charset='utf-8'><title>Amostras de voz</title>" +
    "<style>body{font-family:system-ui;max-width:680px;margin:32px auto;padding:0 16px}li{margin:14px 0}</style>" +
    "<h1>Amostras de voz pt-BR</h1><p>Mais recentes: <em>$Frase</em></p><ul>$($itens -join '')</ul>"
  [IO.File]::WriteAllText((Join-Path $pasta 'index.html'), $html, $utf8)
  Write-Host "Pronto: $(@($Vozes).Count) amostras em $pasta (abra index.html pelo servidor local)."
  return
}

# ── Modo normal: gera os áudios do roteiro ──────────────────────────────────
$pastaAudio = Join-Path $raiz "jogos\$Jogo\audio"
$arquivoRoteiro = Join-Path $pastaAudio 'roteiro.json'
if (-not (Test-Path -LiteralPath $arquivoRoteiro)) {
  throw "Roteiro não encontrado: $arquivoRoteiro. Gere com ferramentas/roteiro-falas.html."
}
$roteiro = [IO.File]::ReadAllText($arquivoRoteiro, $utf8) | ConvertFrom-Json

$indice = [ordered]@{}
$novos = 0
$total = @($roteiro).Count
$n = 0
foreach ($texto in $roteiro) {
  $n++
  $arquivo = NomeDoArquivo $texto
  $destino = Join-Path $pastaAudio $arquivo
  if ($Refazer -or -not (Test-Path -LiteralPath $destino)) {
    Write-Host "[$n/$total] $texto"
    Sintetizar $texto $Voz $destino
    $novos++
  }
  $indice[$texto] = $arquivo
}

# Remove áudios que não estão mais no roteiro.
$usados = @{}
foreach ($a in $indice.Values) { $usados[$a] = $true }
Get-ChildItem -LiteralPath $pastaAudio -Filter '*.mp3' | Where-Object { -not $usados[$_.Name] } | ForEach-Object {
  Write-Host "Removendo áudio fora do roteiro: $($_.Name)"
  Remove-Item -LiteralPath $_.FullName
}

$json = $indice | ConvertTo-Json -Compress
[IO.File]::WriteAllText((Join-Path $pastaAudio 'falas.json'), $json, $utf8)
$tamanho = (Get-ChildItem -LiteralPath $pastaAudio -Filter '*.mp3' | Measure-Object Length -Sum).Sum / 1MB
Write-Host ("Pronto: {0} falas ({1} novas), {2:N1} MB, voz {3}, velocidade {4}, tom {5}." -f $total, $novos, $tamanho, $Voz, $Velocidade, $Tom)
