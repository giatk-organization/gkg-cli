# gkg CLI bootstrap installer (Windows PowerShell)
#
# Installs the gkg CLI globally via npm, then prints the first-run steps.
# Requires Node.js >= 18 (npm ships with Node).

$ErrorActionPreference = "Stop"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
	Write-Host "Node.js is not installed. Install Node.js >= 18 first:" -ForegroundColor Yellow
	Write-Host "  - https://nodejs.org (installer)"
	Write-Host "  - or: winget install OpenJS.NodeJS.LTS"
	exit 1
}

$nodeMajor = [int](node -p "process.versions.node.split('.')[0]")
if ($nodeMajor -lt 18) {
	Write-Host "Node.js $(node -v) is too old. gkg CLI requires Node.js >= 18." -ForegroundColor Yellow
	Write-Host "Upgrade via https://nodejs.org or: winget install OpenJS.NodeJS.LTS"
	exit 1
}

Write-Host "Installing gkg CLI (npm install -g gkg-cli)..."
npm install -g gkg-cli

Write-Host ""
Write-Host "gkg CLI installed." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Authenticate (the engineer kit is distributed from a private repo):"
Write-Host "       gkg new --kit engineer"
Write-Host "     The CLI prompts for your GitHub token on first download."
Write-Host "  2. Create a project:"
Write-Host "       gkg new --kit engineer --dir .\my-project"
Write-Host "  3. Or add the kit to an existing project:"
Write-Host "       cd .\my-project; gkg init --kit engineer"
