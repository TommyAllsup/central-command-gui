# Agent setup guide

Target: a working **local developer preview**, a verified URL, and a handoff for sign-in. The demo needs no provider credentials.

## 1. Check prerequisites and destination

Run `node --version`, `npm --version`, and `git --version`. Node must be 22 or newer. If something is missing, explain what is needed and use the user's approved installation method. Do not assume Homebrew, administrator rights, or a particular Node version manager.

Choose an appropriate development folder. If the checkout already exists, inspect `git remote -v` and `git status --short`. Preserve local changes. Do not clone over a nonempty folder or force-reset a branch. A clean matching checkout can be updated with `git pull --ff-only`.

## 2. Install and build

```sh
git clone https://github.com/TommyAllsup/central-command-gui.git
cd central-command-gui
node scripts/central-command-setup.mjs
```

For an existing checkout, skip clone. Setup performs `npm ci` and client/server production builds with the lockfile and normal native-module installation scripts. Wait for success before starting.

If npm cannot be located beside Node, use the printed `npm ci` and `npm run build` fallback. Prefer the setup script on Windows; it handles long PATH values in child processes without changing system settings.

## 3. Start and verify

```sh
node scripts/central-command-start.mjs
```

Keep the terminal or execution session running. If backgrounding on Windows, use a hidden window and record the process ID/log location. Do not add an autostart service unless asked.

Verify `GET http://127.0.0.1:4311/` returns HTTP 200 and serves Central Command, and `GET http://127.0.0.1:4311/health` returns HTTP 200 with `status: "ok"`. Check the rendered page in a browser when available. First visit shows a demo tour; that does not prove provider sign-in or AI execution.

## 4. Hand off

Report the checkout path, URL, start/stop commands, and unperformed checks. The user chooses **Connect local sessions**, creates the local GUI account if needed, then selects a provider/project. This account is separate from Anthropic/OpenAI. Reuse the normal provider sign-in flow.

Do not request passwords/tokens in chat, copy credentials, register accounts for the user, disable authentication, expose the server, or send an AI prompt during setup. A real provider turn is a separate user action. Indexed history is not necessarily running; demo hosts are not connected machines.

## Restart and update

Restart with `node scripts/central-command-start.mjs`; stop with Ctrl+C. Update a clean checkout by stopping, running `git pull --ff-only`, rerunning setup, and restarting. Preserve changes before updating. Do not delete `~/.central-command/auth.db` to solve a login issue.

## Troubleshooting

| Symptom | Next step |
| --- | --- |
| Missing Node/npm/Git | Install the prerequisite using the user's normal method; reopen the terminal. |
| npm CLI not found | Use the printed fallback and check the active Node installation. |
| Native compilation fails on Mac | Check for missing compiler tools; `xcode-select --install` starts the Command Line Tools installer if needed. The user may need to finish it. |
| Native compilation fails on Windows | Check for missing Python/C++ build tools; install what the error identifies. |
| Port occupied | Reuse the desired instance or choose an unused port; do not terminate unrelated processes. |
| Mac alternate port | `CENTRAL_COMMAND_PORT=4312 node scripts/central-command-start.mjs` |
| PowerShell alternate port | `$env:CENTRAL_COMMAND_PORT=4312; node scripts/central-command-start.mjs` |
| No sessions | Check provider sign-in and project selection, then refresh. Custom provider data directories may need additional support. |
| Setup fails | Report the failing command and first relevant error with credentials/private paths redacted. Do not bypass checks or claim success. |

Windows evidence is in [TESTING.md](TESTING.md). Mac execution and real provider turns remain release acceptance work. Install separate instances for teammates; this is not a shared multi-user server.
