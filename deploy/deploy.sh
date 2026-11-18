#!/usr/bin/env bash
# Deploy to the server over SSH: sync sources, build the image there and restart.
#   DEPLOY_HOST=root@62.113.118.63 DEPLOY_KEY=~/.ssh/wildex-deploy ./deploy/deploy.sh
set -euo pipefail

HOST="${DEPLOY_HOST:-root@62.113.118.63}"
KEY="${DEPLOY_KEY:-$HOME/.ssh/wildex-deploy}"
DIR="${DEPLOY_DIR:-/opt/it-hub}"
SSH="ssh -i $KEY -o StrictHostKeyChecking=accept-new"

cd "$(dirname "$0")/.."

$SSH "$HOST" "mkdir -p $DIR"
rsync -az --delete -e "$SSH" \
  --exclude node_modules --exclude dist --exclude .git --exclude .env \
  ./ "$HOST:$DIR/"

$SSH "$HOST" "cd $DIR && test -f .env || { echo '.env missing in $DIR (see .env.example)'; exit 1; }; \
  docker compose up -d --build && docker image prune -f >/dev/null && docker compose ps"
