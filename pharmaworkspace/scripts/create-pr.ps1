# Creates a GitHub PR with a pre-written body file (no manual paste on github.com).
# Usage:
#   .\scripts\create-pr.ps1 -Title "feat(p5-06): ..." -BodyFile ".github/pr-bodies/p5-06-in-app-feedback.md"
#   .\scripts\create-pr.ps1 -Title "..." -BodyFile "..." -Base develop -Head feat/my-branch
#
# Auth: uses $env:GH_TOKEN / $env:GITHUB_TOKEN if set, else git credential for github.com.

param(
    [Parameter(Mandatory = $true)]
    [string] $Title,

    [Parameter(Mandatory = $true)]
    [string] $BodyFile,

    [string] $Base = 'develop',
    [string] $Head = ''
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Error 'GitHub CLI (gh) is required. Install: winget install GitHub.cli'
}

if (-not (Test-Path -LiteralPath $BodyFile)) {
    Write-Error "Body file not found: $BodyFile"
}

if (-not $Head) {
    $Head = (git branch --show-current).Trim()
    if (-not $Head) {
        Write-Error 'Could not detect current branch. Pass -Head explicitly.'
    }
}

if (-not $env:GH_TOKEN -and -not $env:GITHUB_TOKEN) {
    $credInput = "protocol=https`nhost=github.com`n`n"
    $cred = $credInput | git credential fill 2>$null
    if ($cred) {
        $match = $cred | Select-String '^password='
        if ($match) {
            $env:GH_TOKEN = $match.ToString().Replace('password=', '')
        }
    }
}

if (-not $env:GH_TOKEN -and -not $env:GITHUB_TOKEN) {
    Write-Error 'Not authenticated. Run: gh auth login   OR set GH_TOKEN'
}

$existing = gh pr list --head $Head --base $Base --json url --jq '.[0].url' 2>$null
if ($existing) {
    Write-Host "PR already exists: $existing"
    exit 0
}

$resolvedBody = (Resolve-Path -LiteralPath $BodyFile).Path
$url = gh pr create --base $Base --head $Head --title $Title --body-file $resolvedBody
Write-Host $url
