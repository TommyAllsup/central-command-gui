# Central Command: research and fork decision

Research date: October 29, 2026 (America/Chicago). Repository and license facts were checked against the projects' current upstream files, not just directories or search summaries. Upstream projects can change; the local Git history records the exact imported revision.

## Decision

**Fork CloudCLI UI (`siteboon/claudecodeui`) and add a fleet-oriented Central Command workspace.** Keep its working session discovery, provider adapters, authentication, streaming, chat, terminals, and project tooling. Build the distinctive attention-management experience on those foundations.

The user asked for a license that permits modification, not specifically a permissive license. CloudCLI's AGPL-3.0-or-later permits a modified open-source fork. It is **not MIT**, and its extra attribution terms matter. Source, upstream notices, and a prominent indication that Central Command is a modified version must travel with the fork. See the licensing section below.

The fork is a better overnight starting point than building another process runner. Its current `1.37.6` package already includes React, Vite, Express, TypeScript, Claude Agent SDK, Codex SDK, WebSocket streaming, SQLite, and native terminals. It also has Windows and macOS Electron packaging. These are existing upstream capabilities, not claims that every one has been retested in this POC. [Package manifest](https://github.com/siteboon/claudecodeui/blob/main/package.json), [upstream overview](https://github.com/siteboon/claudecodeui).

Upstream revision checked during research: `c17c2f6d5f7e1e1d47fe37144ce0b2030002e331` (October 27, 2026). The source snapshot, rather than a mutable `main` URL, should anchor future update decisions.

## Comparison

| Candidate | License checked | Platforms and agents | What is useful | Fit for this POC |
| --- | --- | --- | --- | --- |
| **[CloudCLI UI](https://github.com/siteboon/claudecodeui)** | [AGPL-3.0-or-later, with Section 7 terms](https://github.com/siteboon/claudecodeui/blob/main/LICENSE) | Web UI and Windows/macOS desktop packaging; Claude Code, Codex, Cursor, OpenCode | Existing-session discovery, chat, terminal, files, Git, provider adapters | **Selected.** Familiar Node/React stack; retain mature plumbing and add fleet/attention views. |
| **[Maestro](https://github.com/RunMaestro/Maestro)** | [AGPL-3.0](https://github.com/RunMaestro/Maestro/blob/main/LICENSE) | Windows, macOS, Linux; Claude Code and Codex among supported agents | Parallel sessions, message queues, playbooks, group chat, mobile remote access | Closest product inspiration. Larger Electron surface to reshape; a serious alternative to test before investing beyond POC. |
| **[Orchestrator.inc](https://github.com/OrchestratorInc/agent-orchestrator)** | [Apache-2.0](https://github.com/OrchestratorInc/agent-orchestrator/blob/main/LICENSE) | Windows, macOS, Linux desktop; Claude Code, Codex and many others | Main orchestrator, isolated worker worktrees, status lanes, PR/CI feedback loops | Best permissive alternative for repository-to-PR orchestration. Go backend plus desktop frontend adds integration/build weight for tonight. |
| **[Happy Desktop](https://github.com/slopus/happy-desktop)** | [MIT](https://github.com/slopus/happy-desktop/blob/main/LICENSE) | Windows, macOS, Linux; multiple model harnesses including Claude/Codex | Multi-model work, remote/mobile continuity, encrypted sync, shared sessions | Strong permissive alternative if remote continuity becomes the primary requirement. New multi-package desktop/runtime architecture is more than the immediate UI needs. |
| **[AI Maestro](https://github.com/23blocks-OS/ai-maestro)** | [MIT](https://github.com/23blocks-OS/ai-maestro/blob/main/LICENSE) | Native macOS/Linux; **Windows through WSL2**; terminal-based agents | Standing teams, multi-machine messaging, hierarchical organization, memory | Valuable architecture reference. tmux/WSL2 foundation misses the preference for a straightforward native Windows Codex path. |
| **[Vibe Kanban](https://github.com/BloopAI/vibe-kanban)** | [Apache-2.0](https://github.com/BloopAI/vibe-kanban/blob/main/LICENSE) | Local workspace/task manager supporting Claude Code and Codex | Plan → workspace → diff review; branch isolation; inline feedback | Good task-flow reference, but upstream README explicitly announces sunsetting. Poor default for a new maintained fork. |
| **[Opcode, formerly Claudia](https://github.com/winfunc/opcode)** | [AGPL-3.0](https://github.com/winfunc/opcode/blob/main/LICENSE) | Cross-platform Tauri application centered on Claude Code | Project history, custom agents, checkpoints, usage views | Polished precedent, but adding Codex means more provider work than CloudCLI. |
| **[cmux](https://github.com/manaflow-ai/cmux)** | [GPL-3.0-or-later desktop; BSL 1.1 for listed server directories](https://github.com/manaflow-ai/cmux/blob/main/LICENSE) | Native macOS, Ghostty-based | Vertical workspaces, notifications, programmability; already familiar to the user | Preserve as a Mac workflow and future bridge target. A Windows port and the separately licensed server pieces make it unsuitable as this fork base. |

This ranking concerns fit and implementation risk, not a general quality ranking. Windows support for another project's release does not establish that this fork has passed Windows or macOS runtime QA.

## What people are converging on

Several different patterns solve different parts of session overload:

1. **Terminals with durable identity.** cmux keeps a workspace's terminal and notification state easy to find. Central Command should preserve session names, project identity, provider, and the machine running it.
2. **An exception queue.** Orchestrator.inc derives lanes from agent and review state. The useful question is what needs a person next, rather than how much text every process produced.
3. **Queued intent and unattended checklists.** Maestro allows users to queue messages and execute playbooks. Capturing the next instruction should not require interrupting current work. [Maestro features](https://github.com/RunMaestro/Maestro#features).
4. **Continuity across devices.** Happy separates the computer doing work from the screen controlling it. Its mobile/relay repository is separate from the current desktop app. [Happy architecture overview](https://github.com/slopus/happy#how-happy-fits-together).
5. **Explicit work isolation.** Worktrees suit parallel changes within a repository. AI Maestro's standing-team approach instead uses separate clones across machines. These are different ownership models; a fleet view should state which one an agent uses.

The resulting design priority is **triage → inspect → act → return to the fleet**. A wall of animated terminals may look futuristic, but does little to reduce the user's reading burden. The primary view should surface decisions and failures; detailed transcripts remain one click away.

## Useful CloudCLI integration points

These paths were checked in the upstream source. Existing authentication and provider permission handling should remain in force.

| Purpose | Existing interface |
| --- | --- |
| Discover projects and sessions | `GET /api/projects` with optional `sessionsLimit`, `sessionsOffset`, and `skipSynchronization` |
| Read recent indexed sessions | `GET /api/providers/sessions/recent?limit=40&offset=0` |
| Read currently running sessions | `GET /api/providers/sessions/running` |
| Read a session/transcript | `GET /api/providers/sessions/:sessionId`, then `/messages` |
| Allocate a new app session | `POST /api/providers/sessions` with `{ provider, projectPath, initialMessage }` |
| Stream or control a run | Authenticated `/ws`: `chat.send`, `chat.subscribe`, `chat.abort`, `chat.stop-task`, `chat.permission-response` |
| Check provider setup | `GET /api/providers/:provider/auth/status`; `/:provider/models` for the actual available model catalog |
| Continue through existing UI | Retain upstream session navigation/chat rather than rebuilding its editor and permission dialog |

Sources: [provider routes](https://github.com/siteboon/claudecodeui/blob/main/server/modules/providers/provider.routes.ts), [project routes](https://github.com/siteboon/claudecodeui/blob/main/server/modules/projects/projects.routes.ts), [WebSocket guide](https://github.com/siteboon/claudecodeui/blob/main/server/modules/websocket/README.md).

The provider module already separates execution, authentication, model lists, MCP, skills, history, and transcript synchronization. Claude indexes `~/.claude/projects/**/*.jsonl`; Codex indexes `~/.codex/sessions/**/*.jsonl`. An indexed transcript is evidence of a session, **not proof that its original CLI process is still running or can be controlled**. Running-state data and ownership must be kept distinct. [Provider guide](https://github.com/siteboon/claudecodeui/blob/main/server/modules/providers/README.md).

The external Agent API can start or continue runs and stream SSE, but uses a separate external API key. The authenticated browser's existing WebSocket path is the natural integration for user-operated chat. A new fleet frontend does not need to introduce another execution backend. [Agent route](https://github.com/siteboon/claudecodeui/blob/main/server/modules/agent/agent.routes.ts).

## Licensing implementation notes

This is an engineering summary of the checked upstream notices; the actual license governs.

- Preserve upstream `LICENSE` and `NOTICE`, including existing copyrights.
- Keep the attribution **CloudCLI UI (https://github.com/siteboon/claudecodeui)** reasonably prominent in documentation or appropriate legal notices.
- Prominently identify Central Command as a modified version. Do not imply Siteboon endorsement or use its names as the new product's brand.
- Provide the corresponding modified source when the AGPL requires it, including an accessible source offer for users interacting with a modified network service. A visible source link is a useful delivery mechanism; keep that source current with the served build.
- The upstream notice identifies older third-party GPL-3.0 contributions incorporated under GPL section 13. Keep that notice intact instead of simplifying the entire history to a new license header.

Sources: [CloudCLI license and additional terms](https://github.com/siteboon/claudecodeui/blob/main/LICENSE), [upstream NOTICE](https://github.com/siteboon/claudecodeui/blob/main/NOTICE).

## Boundaries for an honest morning test

The POC should make the following distinctions visible and document which are tested:

- **Live local sessions vs. demo data.** Sample activity can demonstrate a busy swarm, but must be labeled and must not silently replace failed live reads.
- **Browser portability vs. tested execution.** A Mac browser loading the same frontend is not equivalent to a tested Claude runtime on the Mac. Run a local bridge there and verify real session continuation separately.
- **Local coordination vs. multi-machine control.** An authenticated Windows installation does not automatically gain control of the Mac's cmux sessions. Pairing, host identity, authenticated transport, and a Mac bridge are a subsequent milestone.
- **Provider capabilities vs. UI affordances.** Enable actions only when the provider/backend can actually perform them; preserve real permission prompts and cancellation semantics.
- **Human-owned orchestrator vs. automatic routing.** The current Central-Command session can be represented and opened. Automatically assigning other agents work requires an explicit orchestration policy, ownership, and delivery acknowledgments.

For the next phase, evaluate whether a custom attention layer remains the main advantage over Maestro/Orchestrator.inc, then integrate the Mac bridge and durable command acknowledgments before introducing automatic orchestration.
