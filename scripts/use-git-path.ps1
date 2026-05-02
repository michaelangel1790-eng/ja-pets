# Dot-source so `git` works in this PowerShell session:
#   . .\scripts\use-git-path.ps1

function Get-GitExePath {
  $existing = Get-Command git -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($existing -and $existing.Source) {
    return $existing.Source
  }

  $apps = @(Get-ChildItem "$env:LOCALAPPDATA\GitHubDesktop" -Directory -Filter 'app-*' -ErrorAction SilentlyContinue)
  foreach ($dir in ($apps | Sort-Object { try { [version]($_.Name -replace '^app-', '') } catch { [version]'0.0.0' } } -Descending)) {
    $candidate = Join-Path $dir.FullName 'resources\app\git\cmd\git.exe'
    if (Test-Path -LiteralPath $candidate) {
      return $candidate
    }
  }

  foreach ($p in @(
      "${env:ProgramFiles}\Git\cmd\git.exe",
      "${env:ProgramFiles(x86)}\Git\cmd\git.exe"
    )) {
    if (Test-Path -LiteralPath $p) {
      return $p
    }
  }

  return $null
}

$gitExe = Get-GitExePath
if (-not $gitExe) {
  Write-Error 'Git not found. Install Git for Windows or GitHub Desktop.'
  return
}

$gitBin = Split-Path -Parent $gitExe
$env:PATH = "$gitBin;$env:PATH"
Write-Host "Git on PATH: $gitExe ($(& git --version))"
