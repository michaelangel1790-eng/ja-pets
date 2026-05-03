#Requires -Version 5.1
# דחיפה ידנית — אם הרצת `npm install` (prepare), אחרי כל `git commit` ב-main יש push אוטומטי; לא חייבים את הסקריפט הזה.
# דחיפת כל השינויים ל-GitHub (origin/main). הרץ מהמחשב שלך כשה-Git מותקן.
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

function Find-Git {
  $cmd = Get-Command git -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  foreach ($p in @(
      "$env:ProgramFiles\Git\cmd\git.exe",
      "${env:ProgramFiles(x86)}\Git\cmd\git.exe",
      "$env:LocalAppData\Programs\Git\cmd\git.exe"
    )) {
    if (Test-Path -LiteralPath $p) { return $p }
  }
  throw "Git לא נמצא. התקן מ-https://git-scm.com/download/win או השתמש ב-GitHub Desktop."
}

$git = Find-Git
Write-Host "Repository: $repoRoot"
& $git rev-parse --show-toplevel
& $git status -sb

& $git add -A
$pending = & $git status --porcelain
if (-not $pending) {
  Write-Host "אין שינויים חדשים לקומיט."
  exit 0
}

$commitMessage = "עדכון אתר: גלריה, ביצועים ודחיסת תמונות"
& $git commit -m $commitMessage
& $git push origin main
Write-Host "בוצע push ל-origin/main בהצלחה."
