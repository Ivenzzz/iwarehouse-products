#!/usr/bin/env bash

set -Eeuo pipefail

readonly APP_DIR="/var/www/iwarehouse-products"
readonly APP_SERVICE="iwarehouse-products.service"
readonly APP_HEALTH_URL="http://127.0.0.1:3002/"
readonly ERP_HEALTH_URL="https://erp.iwarehouse.ph/"
readonly DEPLOY_BRANCH="main"
readonly DEPLOY_REMOTE="origin"
readonly LOCK_FILE="/run/lock/iwarehouse-products-deploy.lock"

log() {
  printf '[deploy] %s\n' "$*"
}

fail() {
  printf '[deploy] ERROR: %s\n' "$*" >&2
  exit 1
}

on_error() {
  local exit_code=$?
  printf '[deploy] ERROR: deployment stopped at line %s (exit %s).\n' "$1" "$exit_code" >&2
  exit "$exit_code"
}

trap 'on_error "$LINENO"' ERR

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Required command is unavailable: $1"
}

http_status() {
  curl \
    --silent \
    --show-error \
    --output /dev/null \
    --max-time 15 \
    --write-out '%{http_code}' \
    "$1"
}

is_success_or_redirect() {
  [[ "$1" =~ ^[23][0-9][0-9]$ ]]
}

wait_for_app() {
  local attempt
  local status

  for attempt in {1..15}; do
    status="$(http_status "$APP_HEALTH_URL" || true)"
    if [[ "$status" == "200" ]]; then
      return 0
    fi
    sleep 2
  done

  return 1
}

assert_expected_worktree() {
  local line
  local unexpected=()

  while IFS= read -r line; do
    [[ -z "$line" ]] && continue

    # `next build` rewrites these generated imports for production.
    if [[ "$line" == " M next-env.d.ts" ]]; then
      continue
    fi

    unexpected+=("$line")
  done < <(git status --porcelain --untracked-files=all)

  if (( ${#unexpected[@]} > 0 )); then
    printf '[deploy] Refusing to overwrite unexpected server changes:\n' >&2
    printf '  %s\n' "${unexpected[@]}" >&2
    fail "Commit, move, or otherwise resolve these files before deploying."
  fi
}

main() {
  local force_deploy=false

  case "${1:-}" in
    "")
      ;;
    --force)
      force_deploy=true
      ;;
    *)
      fail "Usage: bash deploy.sh [--force]"
      ;;
  esac

  require_command curl
  require_command flock
  require_command git
  require_command npm
  require_command systemctl

  exec 9>"$LOCK_FILE"
  flock --nonblock 9 || fail "Another iWarehouse Products deployment is already running."

  [[ -d "$APP_DIR/.git" ]] || fail "Expected Git checkout not found at $APP_DIR."
  [[ -f "$APP_DIR/.env" ]] || fail "Production environment file is missing: $APP_DIR/.env"

  cd "$APP_DIR"
  [[ "$(pwd -P)" == "$APP_DIR" ]] || fail "Resolved deployment path is not $APP_DIR."
  [[ "$(git branch --show-current)" == "$DEPLOY_BRANCH" ]] ||
    fail "Deployment checkout must be on branch $DEPLOY_BRANCH."

  local service_directory
  service_directory="$(systemctl show "$APP_SERVICE" --property=WorkingDirectory --value)"
  [[ "$service_directory" == "$APP_DIR" ]] ||
    fail "$APP_SERVICE points to '$service_directory', not '$APP_DIR'."
  systemctl is-active --quiet "$APP_SERVICE" ||
    fail "$APP_SERVICE is not active before deployment."
  sudo -n true ||
    fail "Passwordless sudo is required to restart only $APP_SERVICE."

  assert_expected_worktree

  local erp_before
  erp_before="$(http_status "$ERP_HEALTH_URL" || true)"
  is_success_or_redirect "$erp_before" ||
    fail "ERP baseline health check failed with HTTP ${erp_before:-unknown}; deployment was not started."

  local app_before
  app_before="$(http_status "$APP_HEALTH_URL" || true)"
  [[ "$app_before" == "200" ]] ||
    fail "App baseline health check failed with HTTP ${app_before:-unknown}; deployment was not started."

  log "Fetching $DEPLOY_REMOTE/$DEPLOY_BRANCH..."
  git fetch "$DEPLOY_REMOTE" "$DEPLOY_BRANCH"

  local current_commit
  local target_commit
  current_commit="$(git rev-parse HEAD)"
  target_commit="$(git rev-parse "$DEPLOY_REMOTE/$DEPLOY_BRANCH")"

  if [[ "$current_commit" == "$target_commit" && "$force_deploy" == false ]]; then
    log "Already up to date at ${current_commit:0:12}; no restart needed."
    return 0
  fi

  if [[ "$current_commit" != "$target_commit" ]]; then
    git merge-base --is-ancestor "$current_commit" "$target_commit" ||
      fail "Server history has diverged from $DEPLOY_REMOTE/$DEPLOY_BRANCH; refusing a non-fast-forward deployment."

    log "Fast-forwarding ${current_commit:0:12} to ${target_commit:0:12}..."
    git merge --ff-only "$target_commit"
  else
    log "Force-deploying current commit ${current_commit:0:12}..."
  fi

  log "Installing locked dependencies..."
  npm ci

  log "Running tests..."
  npm test

  log "Building the production application..."
  npm run build

  log "Restarting only $APP_SERVICE..."
  sudo systemctl restart "$APP_SERVICE"

  if ! wait_for_app; then
    sudo systemctl status "$APP_SERVICE" --no-pager --lines=30 || true
    fail "The new app did not return HTTP 200 after restart."
  fi

  local erp_after
  erp_after="$(http_status "$ERP_HEALTH_URL" || true)"
  is_success_or_redirect "$erp_after" ||
    fail "New app is healthy, but the ERP post-deployment check returned HTTP ${erp_after:-unknown}."

  log "Deployment complete: $(git rev-parse --short=12 HEAD)"
  log "App health: HTTP 200; ERP health: HTTP $erp_after"
}

main "$@"
