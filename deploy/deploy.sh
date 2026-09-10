#!/usr/bin/env bash
# Update and deploy Frankie as the dedicated yuanqiu user.
set -Eeuo pipefail

DEPLOY_USER="yuanqiu"
APP_DIR="$HOME/frankie/Frankie-main"
BASE_DIR="$HOME/frankie"
COURSE_DIR="$BASE_DIR/course"
COURSE_WIKI="$COURSE_DIR/llm_wiki"
COURSE_REMOTE="git@github.com:JunnanZ/dynamic_optimization_2026.git"
COURSE_BRANCH="master"
DATA_DIR="$BASE_DIR/data"
ENV_FILE="$BASE_DIR/deployment.env"
UNIT_SOURCE="$APP_DIR/deploy/frankie.service"
UNIT_TARGET="$HOME/.config/systemd/user/frankie.service"
PUBLIC_HEALTH_URL="https://dynopt.junnanzhang.com/api/health"
GIT_SSH_COMMAND="ssh -o BatchMode=yes -o StrictHostKeyChecking=yes"
export GIT_SSH_COMMAND

TEMP_COURSE=""

fail() {
    printf 'ERROR: %s\n' "$*" >&2
    exit 1
}

cleanup() {
    if [[ -n "$TEMP_COURSE" && -d "$TEMP_COURSE" ]]; then
        rm -rf -- "$TEMP_COURSE"
    fi
}
trap cleanup EXIT

require_command() {
    command -v "$1" >/dev/null 2>&1 || fail "required command not found: $1"
}

version_at_least() {
    local actual="$1" required="$2"
    [[ "$(printf '%s\n%s\n' "$required" "$actual" | sort -V | head -n1)" == "$required" ]]
}

require_clean_repo() {
    local repo="$1" label="$2"
    [[ -z "$(git -C "$repo" status --porcelain --untracked-files=all)" ]] ||
        fail "$label has local changes or untracked files; commit, move, or remove them before deploying"
}

printf '==> Checking deployment prerequisites\n'
[[ "$(id -un)" == "$DEPLOY_USER" ]] || fail "run this script as $DEPLOY_USER (no sudo)"

for command_name in git ssh node pnpm curl flock systemctl loginctl ss stat sort grep find mktemp install; do
    require_command "$command_name"
done

[[ -x "$APP_DIR/.venv/bin/python" ]] || fail "Python environment missing; install dependencies as described in deploy/README.md"
"$APP_DIR/.venv/bin/python" -c 'import sys; raise SystemExit(sys.version_info < (3, 11))' ||
    fail "Python 3.11 or newer is required"
node_version="$(node --version)"
node_version="${node_version#v}"
version_at_least "$node_version" "22.12.0" || fail "Node.js 22.12 or newer is required"

[[ -n "${XDG_RUNTIME_DIR:-}" && -d "$XDG_RUNTIME_DIR" ]] ||
    fail "XDG_RUNTIME_DIR is unavailable; log in normally as $DEPLOY_USER"
exec 9>"$XDG_RUNTIME_DIR/frankie-deploy.lock"
flock -n 9 || fail "another Frankie deployment is already running"

actual_app="$(pwd -P)"
expected_app="$(cd "$APP_DIR" 2>/dev/null && pwd -P)" ||
    fail "expected app repository does not exist at $APP_DIR"
[[ "$actual_app" == "$expected_app" ]] ||
    fail "run from the expected repository root: $APP_DIR"
[[ "$(git rev-parse --show-toplevel 2>/dev/null)" == "$actual_app" ]] ||
    fail "$APP_DIR is not the root of a Git worktree"
require_clean_repo "$APP_DIR" "app repository"

[[ -f "$ENV_FILE" && ! -L "$ENV_FILE" && -O "$ENV_FILE" ]] ||
    fail "$ENV_FILE must be a regular file owned by $DEPLOY_USER"
env_mode="$(stat -c '%a' "$ENV_FILE")"
(( (8#$env_mode & 8#077) == 0 )) || fail "$ENV_FILE must not be accessible by group or other users (use chmod 600)"
[[ "$(loginctl show-user "$DEPLOY_USER" -p Linger --value 2>/dev/null)" == "yes" ]] ||
    fail "lingering is disabled; an administrator must run: sudo loginctl enable-linger $DEPLOY_USER"
systemctl --user show-environment >/dev/null 2>&1 ||
    fail "the $DEPLOY_USER systemd user manager is unavailable; log in again after enabling linger"

[[ -x "$APP_DIR/frontend/node_modules/.bin/tsc" && -x "$APP_DIR/frontend/node_modules/.bin/vite" ]] ||
    fail "Frontend dependencies missing; install them as described in deploy/README.md"
[[ -f "$UNIT_SOURCE" ]] || fail "$UNIT_SOURCE is missing"

if ! systemctl --user is-active --quiet frankie.service &&
   ss -ltnH '( sport = :7860 )' | grep -q .; then
    fail "port 7860 is occupied by a process outside frankie.service"
fi

if [[ -e "$COURSE_DIR" || -L "$COURSE_DIR" ]]; then
    [[ -d "$COURSE_DIR/.git" && ! -L "$COURSE_DIR" ]] ||
        fail "expected a Git checkout at $COURSE_DIR"
    git -C "$COURSE_DIR" rev-parse --verify HEAD >/dev/null 2>&1 ||
        fail "$COURSE_DIR is not a valid Git checkout"
    [[ "$(git -C "$COURSE_DIR" remote get-url origin)" == "$COURSE_REMOTE" ]] ||
        fail "$COURSE_DIR origin is not $COURSE_REMOTE"
    [[ "$(git -C "$COURSE_DIR" symbolic-ref --quiet --short HEAD 2>/dev/null)" == "$COURSE_BRANCH" ]] ||
        fail "$COURSE_DIR must be on branch $COURSE_BRANCH"
    require_clean_repo "$COURSE_DIR" "course repository"
fi

printf '==> Updating the sparse course checkout\n'
if [[ ! -e "$COURSE_DIR" ]]; then
    TEMP_COURSE="$(mktemp -d "$BASE_DIR/.course-clone.XXXXXX")"
    git clone --filter=blob:none --sparse --single-branch --branch "$COURSE_BRANCH" \
        "$COURSE_REMOTE" "$TEMP_COURSE"
    git -C "$TEMP_COURSE" sparse-checkout set --no-cone '/llm_wiki/' '!**/slides/'
    mv -- "$TEMP_COURSE" "$COURSE_DIR"
    TEMP_COURSE=""
else
    git -C "$COURSE_DIR" sparse-checkout set --no-cone '/llm_wiki/' '!**/slides/'
    git -C "$COURSE_DIR" fetch origin "$COURSE_BRANCH"
    git -C "$COURSE_DIR" merge-base --is-ancestor HEAD FETCH_HEAD ||
        fail "course branch cannot be fast-forwarded (it is ahead of or diverged from origin/$COURSE_BRANCH)"
    git -C "$COURSE_DIR" merge --ff-only FETCH_HEAD
fi
require_clean_repo "$COURSE_DIR" "course repository after update"

[[ -f "$COURSE_WIKI/index.md" && ! -L "$COURSE_WIKI/index.md" ]] || fail "expected a regular file at llm_wiki/index.md"
[[ -f "$COURSE_WIKI/faq.md" && ! -L "$COURSE_WIKI/faq.md" ]] || fail "expected a regular file at llm_wiki/faq.md"
[[ -d "$COURSE_WIKI/raw" && ! -L "$COURSE_WIKI/raw" ]] || fail "expected a directory at llm_wiki/raw/"
if find "$COURSE_WIKI" -type d -name slides -print -quit | grep -q .; then
    fail "course sparse checkout unexpectedly contains a slides directory"
fi

printf '==> Preparing persistent data\n'
mkdir -p -- "$DATA_DIR"
[[ -d "$DATA_DIR" && -w "$DATA_DIR" ]] || fail "$DATA_DIR must be a writable directory"

printf '==> Building the frontend\n'
(
    cd "$APP_DIR/frontend"
    pnpm run build
)
[[ -f "$APP_DIR/frontend/dist/index.html" ]] || fail "frontend build did not produce index.html"

printf '==> Running import and path preflight checks\n'
(
    cd "$APP_DIR"
    FRANKIE_DATA_DIR="$DATA_DIR" \
    FRANKIE_COURSE_WIKI_PATH="$COURSE_WIKI" \
    "$APP_DIR/.venv/bin/python" - <<'PY'
from pathlib import Path

from frankie.config import settings
import frankie.web  # noqa: F401

assert settings.frankie_data_dir == Path.home() / "frankie/data"
assert settings.course_wiki_path == Path.home() / "frankie/course/llm_wiki"
PY
)
require_clean_repo "$APP_DIR" "app repository after build"

printf '==> Installing and restarting the systemd user service\n'
mkdir -p -- "$(dirname "$UNIT_TARGET")"
install -m 0644 "$UNIT_SOURCE" "$UNIT_TARGET"
systemctl --user daemon-reload
systemctl --user enable frankie.service >/dev/null
systemctl --user restart frankie.service

printf '==> Waiting for backend readiness\n'
ready=0
for _ in {1..30}; do
    if curl --fail --silent --show-error --max-time 3 \
        http://127.0.0.1:7860/api/health >/dev/null; then
        ready=1
        break
    fi
    sleep 1
done
if (( ready == 0 )); then
    systemctl --user --no-pager --full status frankie.service >&2 || true
    fail "backend did not become ready; inspect: journalctl --user -u frankie.service"
fi

printf '==> Checking public HTTPS\n'
curl --fail --silent --show-error --max-time 15 "$PUBLIC_HEALTH_URL" >/dev/null ||
    fail "backend is ready locally, but the public HTTPS health check failed: $PUBLIC_HEALTH_URL (Caddy was not changed)"

printf 'Deployment complete: %s\n' "$PUBLIC_HEALTH_URL"
