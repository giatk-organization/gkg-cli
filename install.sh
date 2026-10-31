#!/bin/bash
# gkg CLI bootstrap installer (macOS / Linux)
#
# Installs the gkg CLI globally via npm, then prints the first-run steps.
# Requires Node.js >= 18 (npm ships with Node).
set -euo pipefail

if ! command -v node >/dev/null 2>&1; then
	echo "Node.js is not installed. Install Node.js >= 18 first:"
	echo "  - https://nodejs.org (installer)"
	echo "  - or: nvm install 18 && nvm use 18"
	echo "  - or: brew install node"
	exit 1
fi

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 18 ]; then
	echo "Node.js $(node -v) is too old. gkg CLI requires Node.js >= 18."
	echo "Upgrade via https://nodejs.org or your Node version manager."
	exit 1
fi

echo "Installing gkg CLI (npm install -g gkg-cli)..."
npm install -g gkg-cli

echo ""
echo "gkg CLI installed: $(gkg --version 2>/dev/null || echo 'ok')"
echo ""
echo "Next steps:"
echo "  1. Authenticate (the engineer kit is distributed from a private repo):"
echo "       gkg new --kit engineer"
echo "     The CLI prompts for your GitHub token on first download. The token"
echo "     must be able to read giatk-organization/gtkkit-engineer (you are"
echo "     invited to the org)."
echo "  2. Create a project:"
echo "       gkg new --kit engineer --dir ./my-project"
echo "  3. Or add the kit to an existing project:"
echo "       cd ./my-project && gkg init --kit engineer"
