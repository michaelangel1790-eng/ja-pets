param(
  [Parameter(Position = 0, ValueFromRemainingArguments = $true)]
  [string[]]$GitArgs
)

function Get-GitExe {
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

  $classic = "${env:ProgramFiles}\Git\cmd\git.exe"
  if (Test-Path -LiteralPath $classic) {
    return $classic
  }

  $classic86 = "${env:ProgramFiles(x86)}\Git\cmd\git.exe"
  if (Test-Path -LiteralPath $classic86) {
    return $classic86
  }

  Write-Error 'Git not found. Install Git for Windows (git-scm.com, enable PATH) or GitHub Desktop.'
  exit 127
}

$exe = Get-GitExe
& $exe @GitArgs
exit $LASTEXITCODE
