# Minimal static file server for local development (no Node or Python needed).
# Usage: powershell -ExecutionPolicy Bypass -File serve.ps1   then open http://localhost:8765/
param([int]$Port = 8765)

$root = $PSScriptRoot
$types = @{ '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8';
  '.json' = 'application/json'; '.md' = 'text/plain; charset=utf-8'; '.svg' = 'image/svg+xml'; '.png' = 'image/png';
  '.ogg' = 'audio/ogg'; '.oga' = 'audio/ogg'; '.mp3' = 'audio/mpeg'; '.wav' = 'audio/wav' }

# If the port is taken (for example by another copy of this server), try the next few.
$listener = $null
foreach ($p in $Port..($Port + 10)) {
  $candidate = New-Object System.Net.HttpListener
  $candidate.Prefixes.Add("http://localhost:$p/")
  try { $candidate.Start(); $listener = $candidate; $Port = $p; break }
  catch { $candidate.Close(); Write-Host "Port $p is in use, trying the next one..." }
}
if (-not $listener) { Write-Host "No free port between $Port and $($Port + 10). Close the other server and try again."; exit 1 }
Write-Host "Serving $root at http://localhost:$Port/  (press Ctrl+C to stop)"

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    try {
      $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
      if ($rel -eq '') { $rel = 'index.html' }
      $path = [IO.Path]::GetFullPath((Join-Path $root $rel))
      if ($path.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path $path -PathType Leaf)) {
        $bytes = [IO.File]::ReadAllBytes($path)
        $ext = [IO.Path]::GetExtension($path).ToLower()
        $ctx.Response.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
        $ctx.Response.ContentLength64 = $bytes.Length
        if ($ctx.Request.HttpMethod -ne 'HEAD') { $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length) }
      } else {
        $ctx.Response.StatusCode = 404
      }
      $ctx.Response.Close()
    } catch {
      # A dropped connection must not stop the server.
      try { $ctx.Response.Abort() } catch {}
    }
  }
} finally {
  $listener.Stop()
}
