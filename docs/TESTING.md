# Central Command POC validation

Validated on Windows on October 29, 2026 (America/Chicago), with Node.js 24.22.1. macOS runtime and installer testing remain outstanding.

## Start locally

From the repository directory:

```sh
node scripts/central-command-setup.mjs
node scripts/central-command-start.mjs
```

Open <http://127.0.0.1:4311>. Setup runs the locked npm install with normal lifecycle scripts, then the client and server builds. The launcher requires those builds. Windows users can also run `scripts/central-command-start.cmd` after setup.

For development:

```sh
node scripts/central-command-start.mjs --dev
```

Open <http://127.0.0.1:4310>. Both processes bind to `127.0.0.1`, and Ctrl+C stops them. The development launcher must run in an interactive terminal: Vite deliberately shuts down when its input stream closes. Automated retained launches should allocate a PTY.

The launcher uses `~/.central-command/auth.db`, separate from an existing CloudCLI account database. First live use requires the upstream local account setup. That account protects the local GUI; Claude and Codex retain their own provider authentication. No provider request is made by the tests documented below.

Optional process environment overrides:

| Variable | Default | Purpose |
| --- | --- | --- |
| `CENTRAL_COMMAND_PORT` | `4311` | Backend and production GUI port |
| `CENTRAL_COMMAND_DEV_PORT` | `4310` | Vite development port |
| `CENTRAL_COMMAND_DATABASE_PATH` | `~/.central-command/auth.db` | Separate test or application database |

Do not expose this POC on a public interface. Remote Mac aggregation is a future integration, not something that a local Windows session proves.

## Results

| Check | Result | Evidence |
| --- | --- | --- |
| Locked dependency install | Passed | `npm ci`, 1,981 packages; normal native install scripts |
| Frontend suite | Passed | Final run: 123 files / 904 tests, including Central Command adapter, demo persistence, workspace navigation and return-link tests |
| Backend auth unit tests | Passed | 3 / 3: registration hashing, invalid-password rejection, token refresh |
| Backend TypeScript | Passed | `tsc --noEmit -p server/tsconfig.json` |
| Frontend TypeScript | Passed after repair | `npm run typecheck`; nullable date handling and inherited sidebar fixture repaired |
| Native SQLite | Passed | In-memory `SELECT 1` returned 1 |
| Native PTY package | Passed | `node-pty` imported on Windows; interactive agent terminal not exercised |
| Development page | Passed | `GET /` on port 4310 returned HTTP 200 |
| Backend health | Passed | `GET /health` returned `status: ok` |
| First-use auth | Passed | `/api/auth/status`: `needsSetup: true`, `isAuthenticated: false` |
| Auth guard | Passed | Unauthenticated recent-sessions endpoint returned HTTP 401 |
| Loopback binding | Passed | Both listening sockets report `127.0.0.1` |
| Local session discovery | Passed | Startup synchronized 1 Claude and 30 Codex sessions with no reported failures; no transcript contents inspected for this check |
| Production build | Passed | `npm run build`: client Vite build, server TypeScript build, atomic output promotion; repeated successfully while dev was running after watcher ignore fix |
| Authenticated production smoke | Passed | Disposable account/database: 16 projects, 31 recent sessions, 0 running sessions; expected envelopes; no inference or transcript requests |
| Repository lint | Passed with warnings | `npm run lint` exited 0; inherited warnings remain |
| Visual/browser interaction QA | Passed | Real Edge interactions and production taste inspection at 1440, 768, and 390px: 0 failures, 1 documented density warning |
| macOS + Claude live execution | Not tested | No Mac connected to this validation run |
| Codex live execution | Not tested | No inference request sent during QA |

Expected negative-path tests emit warnings and mocked network errors while passing. These are not live provider errors.

## Environment issue resolved

The inherited Windows `PATH` was about 20,255 characters because it contained many expired temporary build directories. `cmd.exe` could not resolve `node` during npm lifecycle scripts. The install passed with a compact process-local PATH. The Central Command setup and launcher now remove nonexistent entries and duplicates from child environments and put the running Node directory first. They do not modify the system or user PATH.

Vite now ignores the generated `dist-server`, `dist-server.next`, and `dist-server.old` directories. Its Windows filesystem watcher previously prevented the backend build's atomic directory rename. The build passes with the development server running after this fix.

The upstream mobile CSS in `src/index.css` still emits minifier syntax warnings around its touch-device hover reset rules. The new Central Command stylesheet builds successfully; these inherited warnings should be cleaned up when working on the upstream workspace styling.

## Dependency audit

The inherited lockfile produced 71 npm audit findings across all dependencies. Targeted updates changed `dompurify` from 3.4.7 to 3.4.17 and `proxy-addr` from 2.0.7 to 2.0.8. The updated production subset contains 49 findings (5 low, 16 moderate, 28 high, **0 critical**). The all-dependency audit still reports 69 findings, including 8 critical findings in development dependencies. These are scanner results, not verified exploits in this POC. Do not treat a passing build as dependency security clearance. Resolve or assess the remaining findings before remote access or distribution.

The repeatable authenticated smoke check is `node scripts/central-command-smoke.mjs` after a build. It creates a temporary account database, discovers session metadata, checks authenticated API envelopes, and deletes its own database on exit. It neither registers an account in the main database nor sends agent work.

## Morning acceptance pass

1. Open the GUI and confirm the sample scenario is explicitly identified as a demo.
2. Change the selected agent and confirm its details change with it.
3. Filter the session roster and signal feed; verify counts follow visible records.
4. Resolve a demo decision and confirm the next action is clear.
5. Refresh and verify which demo choices persist; reset the demo and repeat.
6. Switch to live sessions, complete local account setup, and confirm actual local sessions appear.
7. Open a session in the inherited workspace; verify provider and project context before sending work.
8. Resize to tablet and phone widths; confirm the active pane, navigation, and actions remain reachable.
9. On a Mac, repeat installation and a small Claude Code task before claiming cross-platform runtime validation.

Live permission handling, interruption, reconnection, a second machine, and packaged desktop installers need separate end-to-end runs.

Final incremental checks after the full suite: 12/12 Central Command component tests passed, including signal filters, unread persistence, modal focus wrapping, and Ctrl+K replacing an open draft. Frontend TypeScript and the production client build passed again after those two interaction corrections. Default-view screenshots remain representative because those corrections affect only dialog/empty states.
The final full frontend rerun after formatting and the dialog/empty-state fixes passed all 904 tests in 123 files. TypeScript and scoped Central Command lint also passed.

## Developer-preview onboarding checks

- Full frontend suite: **910 tests passed in 123 files**.
- Final focused suite: **32 tests passed**, including six new walkthrough scenarios covering first visit, persistence/replay, all five steps, keyboard/focus behavior, live exclusion, reset independence, and unavailable storage.
- Client and server TypeScript: passed. The first pass found an unsupported test-query option; it was removed and both typechecks passed on rerun.
- Production client build: passed; inherited CSS/chunk-size warnings remain.
- Repository lint: exit 0 with existing warnings outside Central Command; no Central Command diagnostics.
- Real Edge browser: first-visit tour, five-step navigation, finish, reload without automatic tour, and replay verified. Production captures reviewed at desktop, tablet, and phone widths; see [design review](DESIGN.md#developer-preview-onboarding-review) for the inspector's intentional-modal exception.

No Mac runtime or real provider turn was exercised by this onboarding change. Those checks and dependency review remain on the [release acceptance checklist](RELEASE.md).
