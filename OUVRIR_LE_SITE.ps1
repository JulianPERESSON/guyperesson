param(
    [switch]$NoBrowser,
    [string]$TargetPath = "/"
)

$ErrorActionPreference = "Stop"
$projectDirectory = $PSScriptRoot
$siteUrl = "http://localhost:3000/"
$normalizedTargetPath = if ($TargetPath.StartsWith("/")) { $TargetPath } else { "/$TargetPath" }
$targetUrl = "http://localhost:3000$normalizedTargetPath"

function Test-InventorySite {
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $siteUrl -TimeoutSec 2
        return $response.StatusCode -eq 200 -and $response.Content.Contains("L'Inventaire")
    } catch {
        return $false
    }
}

Set-Location -LiteralPath $projectDirectory

if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) {
    throw "Node.js n'est pas installé sur cet ordinateur."
}

if (-not (Test-Path -LiteralPath (Join-Path $projectDirectory "node_modules"))) {
    Write-Host "Première ouverture : installation du site..." -ForegroundColor Cyan
    & npm.cmd install
    if ($LASTEXITCODE -ne 0) {
        throw "L'installation des dépendances a échoué."
    }
}

$alreadyRunning = Test-InventorySite

if (-not $alreadyRunning) {
    $serverCommand = 'cd /d "{0}" && npm run dev' -f $projectDirectory
    Start-Process `
        -FilePath "cmd.exe" `
        -ArgumentList @("/k", $serverCommand) `
        -WindowStyle Minimized
}

$ready = $false
for ($attempt = 0; $attempt -lt 60; $attempt++) {
    if (Test-InventorySite) {
        $ready = $true
        break
    }
    Start-Sleep -Milliseconds 500
}

if (-not $ready) {
    throw "Le serveur local n'a pas répondu dans le délai prévu."
}

$chromeCandidates = @()
if ($env:ProgramFiles) {
    $chromeCandidates += Join-Path $env:ProgramFiles "Google\Chrome\Application\chrome.exe"
}
if (${env:ProgramFiles(x86)}) {
    $chromeCandidates += Join-Path ${env:ProgramFiles(x86)} "Google\Chrome\Application\chrome.exe"
}
if ($env:LOCALAPPDATA) {
    $chromeCandidates += Join-Path $env:LOCALAPPDATA "Google\Chrome\Application\chrome.exe"
}

$chrome = $chromeCandidates |
    Where-Object { Test-Path -LiteralPath $_ } |
    Select-Object -First 1

if (-not $NoBrowser) {
    if ($chrome) {
        Start-Process -FilePath $chrome -ArgumentList $targetUrl
    } else {
        Start-Process $targetUrl
    }
}

Write-Host "L'Inventaire est prêt : $targetUrl" -ForegroundColor Green
