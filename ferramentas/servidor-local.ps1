# Servidor local para testar o site sem instalar nada (só PowerShell).
#
# Uso: powershell -NoProfile -ExecutionPolicy Bypass -File ferramentas/servidor-local.ps1
#      e abra http://localhost:8080/
#
# Escuta apenas em localhost. Além de servir arquivos, aceita PUT em
# jogos/<Jogo>/audio/roteiro.json para a ferramenta de roteiro de falas
# salvar a lista de frases direto no projeto.
param([int]$Porta = 8080, [string]$Raiz = (Split-Path -Parent $PSScriptRoot))

$Raiz = [IO.Path]::GetFullPath($Raiz)
$utf8 = New-Object System.Text.UTF8Encoding $false
$tipos = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'application/javascript; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'; '.json' = 'application/json; charset=utf-8'
  '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.gif' = 'image/gif'
  '.svg' = 'image/svg+xml'; '.webp' = 'image/webp'; '.ico' = 'image/x-icon'
  '.mp3' = 'audio/mpeg'; '.ogg' = 'audio/ogg'; '.wav' = 'audio/wav'
  '.woff' = 'font/woff'; '.woff2' = 'font/woff2'; '.ttf' = 'font/ttf'; '.txt' = 'text/plain; charset=utf-8'
}

function Responder($ctx, [int]$status, [byte[]]$corpo, [string]$tipo) {
  $ctx.Response.StatusCode = $status
  if ($tipo) { $ctx.Response.ContentType = $tipo }
  $ctx.Response.Headers.Add('Cache-Control', 'no-store')
  $ctx.Response.ContentLength64 = $corpo.Length
  $ctx.Response.OutputStream.Write($corpo, 0, $corpo.Length)
}

$ouvinte = New-Object System.Net.HttpListener
$ouvinte.Prefixes.Add("http://localhost:$Porta/")
$ouvinte.Start()
Write-Host "Servindo $Raiz em http://localhost:$Porta/"

while ($ouvinte.IsListening) {
  $ctx = $ouvinte.GetContext()
  try {
    $caminho = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)

    if ($ctx.Request.HttpMethod -eq 'PUT') {
      if ($caminho -notmatch '^/jogos/[A-Za-z0-9_]+/audio/roteiro\.json$' -or $ctx.Request.ContentLength64 -gt 1MB) {
        Responder $ctx 403 $utf8.GetBytes('proibido') 'text/plain'
      } else {
        $leitor = New-Object IO.StreamReader($ctx.Request.InputStream, $utf8)
        $texto = $leitor.ReadToEnd()
        $lista = $texto | ConvertFrom-Json  # valida que é JSON antes de gravar
        $destino = Join-Path $Raiz $caminho.TrimStart('/')
        New-Item -ItemType Directory -Force -Path (Split-Path -Parent $destino) | Out-Null
        [IO.File]::WriteAllText($destino, $texto, $utf8)
        Responder $ctx 200 $utf8.GetBytes("salvo: $(@($lista).Count) frases") 'text/plain; charset=utf-8'
      }
      Write-Host "$($ctx.Response.StatusCode) PUT $caminho"
      continue
    }

    if ($caminho.EndsWith('/')) { $caminho += 'index.html' }
    $arquivo = [IO.Path]::GetFullPath((Join-Path $Raiz $caminho.TrimStart('/')))
    if (-not $arquivo.StartsWith($Raiz) -or -not (Test-Path -LiteralPath $arquivo -PathType Leaf)) {
      Responder $ctx 404 $utf8.GetBytes('404') 'text/plain'
    } else {
      $ext = [IO.Path]::GetExtension($arquivo).ToLower()
      $tipo = if ($tipos.ContainsKey($ext)) { $tipos[$ext] } else { 'application/octet-stream' }
      Responder $ctx 200 ([IO.File]::ReadAllBytes($arquivo)) $tipo
    }
    Write-Host "$($ctx.Response.StatusCode) $caminho"
  } catch {
    Write-Host "erro: $_"
    try { Responder $ctx 500 $utf8.GetBytes('erro') 'text/plain' } catch { }
  } finally {
    $ctx.Response.Close()
  }
}
