# Frankie deployment

Frankie runs as `yuanqiu` through a systemd user service. Caddy serves `https://dynopt.junnanzhang.com` and proxies to `127.0.0.1:7860`.

## Layout

| Purpose | Path |
|---|---|
| Application checkout | `$HOME/frankie/Frankie-main` |
| Sparse, read-only course checkout | `$HOME/frankie/course` |
| Course wiki read by the app | `$HOME/frankie/course/llm_wiki` |
| Persistent app/auth data | `$HOME/frankie/data` |
| Frontend build | `$HOME/frankie/Frankie-main/frontend/dist` |
| Private service secrets | `$HOME/frankie/deployment.env` |

Frankie reads `course/llm_wiki` directly. Accounts, history, and personal files live in `data`.

## One-time prerequisites

An administrator must provide:

- Python 3.11 or newer, Node.js 22.12 or newer, pnpm, Git, OpenSSH, curl, `flock`, `ss`, and a working systemd user manager;
- the application checkout at the exact path above;
- the private account store at `$HOME/frankie/data/auth/users.json`, containing account roles and salted password hashes;
- the existing Caddy HTTPS proxy forwarding to `127.0.0.1:7860`; and
- lingering for the deployment account, enabled once with:

```bash
sudo loginctl enable-linger yuanqiu
```

Run deployment as `yuanqiu`.

### Dependencies

From the application checkout, create the Python environment once:

```bash
cd "$HOME/frankie/Frankie-main"
python3 -m venv .venv
```

On Ubuntu/Debian, the system Python needs the `python3-venv` package.

Install Python dependencies initially and when `pyproject.toml` changes:

```bash
.venv/bin/python -m pip install --disable-pip-version-check -e ".[web]"
```

Install frontend dependencies initially and when `frontend/package.json` or `frontend/pnpm-lock.yaml` changes:

```bash
pnpm --dir frontend --config.update-notifier=false install --frozen-lockfile
```

### GitHub SSH trust and credentials

Verify GitHub's SSH host-key fingerprint against its published fingerprints and add the key to `~/.ssh/known_hosts`.

Install a read-only deploy key that can clone:

```text
git@github.com:JunnanZ/dynamic_optimization_2026.git
```

The script uses branch `master` with a sparse checkout of `llm_wiki`, including `raw` and excluding `slides`.

### Secrets

Create `$HOME/frankie/deployment.env` as a systemd `EnvironmentFile` (plain `NAME=value` lines, not shell commands):

```text
DEEPSEEK_API_KEY=replace-me
FRANKIE_AUTH_SECRET=replace-with-a-long-random-secret
```

Then protect it:

```bash
chmod 600 "$HOME/frankie/deployment.env"
```

Keep this file owned by `yuanqiu` with permissions `600`.

## Deploy and update

The application repository and course repository must both be clean. Update application code explicitly, then run the single deployment script:

```bash
cd "$HOME/frankie/Frankie-main"
git pull --ff-only
bash deploy/deploy.sh
```

The script updates the course checkout, builds the frontend using installed dependencies, and restarts the user service. It checks local and public `/api/health` before reporting success.

## Service operation

```bash
systemctl --user status frankie.service
systemctl --user restart frankie.service
journalctl --user -u frankie.service -f
```

The service uses one Uvicorn worker and restarts on failure. Lingering keeps it running after logout and starts it at boot.

Before serving requests, the app initializes and validates every registered account's chat-history schema using the same startup path as local development. Existing conversations are preserved. Schema initialization failures prevent readiness and identify the affected account in the service logs. Restart the service after updating the account roster.
