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
  powershell -ExecutionPolicy Bypass -File ferramentas/gerar-falas.ps1 -Voz pt-BR-FranciscaNeural
#>
param(
  [string]$Jogo = 'Pouso_na_Reta',
  [string]$Voz = 'pt-BR-FranciscaNeural',
  [string]$Velocidade = '-5%',
  [switch]$Amostras,
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
    "<prosody rate='$Velocidade'>$([Security.SecurityElement]::Escape($texto))</prosody></voice></speak>"
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
  $sha = [Security.Cryptography.SHA1]::Create()
  $hash = $sha.ComputeHash($utf8.GetBytes("$Voz|$Velocidade|$texto"))
  return (-join ($hash[0..7] | ForEach-Object { $_.ToString('x2') })) + '.mp3'
}

# ── Modo amostras: uma frase em cada voz pt-BR disponível ───────────────────
if ($Amostras) {
  $pasta = Join-Path $PSScriptRoot 'amostras-voz'
  New-Item -ItemType Directory -Force -Path $pasta | Out-Null
  $vozes = Invoke-RestMethod -Uri "$base/cognitiveservices/voices/list" -Headers @{ 'Ocp-Apim-Subscription-Key' = $chave } -UseBasicParsing
  $vozes = $vozes | Where-Object { $_.Locale -eq 'pt-BR' } | Sort-Object ShortName
  $frase = 'Pouse em três quartos. Passou do ponto! O quatro de baixo diz em quantas partes iguais dividir a pista. Use a régua e conte três partes.'
  $linhas = @()
  foreach ($v in $vozes) {
    $arquivo = "$($v.ShortName).mp3"
    Write-Host "Amostra: $($v.ShortName)"
    Sintetizar $frase $v.ShortName (Join-Path $pasta $arquivo)
    $genero = if ($v.Gender -eq 'Female') { 'feminina' } else { 'masculina' }
    $linhas += "<li><strong>$($v.ShortName)</strong> ($genero)<br><audio controls preload='none' src='$arquivo'></audio></li>"
  }
  $html = "<!doctype html><meta charset='utf-8'><title>Amostras de voz</title>" +
    "<style>body{font-family:system-ui;max-width:640px;margin:32px auto;padding:0 16px}li{margin:14px 0}</style>" +
    "<h1>Amostras de voz pt-BR</h1><p>$frase</p><ul>$($linhas -join '')</ul>"
  [IO.File]::WriteAllText((Join-Path $pasta 'index.html'), $html, $utf8)
  Write-Host "Pronto: $($vozes.Count) vozes em $pasta (abra index.html pelo servidor local)."
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
Write-Host ("Pronto: {0} falas ({1} novas), {2:N1} MB, voz {3}." -f $total, $novos, $tamanho, $Voz)
