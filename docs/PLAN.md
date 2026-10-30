# Central Command: implementation plan

Prepared October 29, 2026 (America/Chicago), before the overnight POC implementation. This document records scope and acceptance criteria; the README and verification report record what actually passed.

## Product intent

Central Command is a graphical control room for the user's existing habit of keeping one orchestrator session above a fleet of Claude Code and Codex sessions. It should answer three questions quickly: **what is running, what needs me, and where do I go to act?**

The first release should reduce context switching and incoming noise. Session count, a futuristic appearance, and a live feed are useful only when they support that purpose.

## Build decision

Fork `siteboon/claudecodeui`, preserve its AGPL-3.0-or-later license and notices, and build a focused workspace on top of its session APIs and existing chat UI. See [RESEARCH.md](RESEARCH.md) for the comparison and license findings.

Reuse provider adapters, local session discovery, authentication, streaming, transcript history, chat controls, terminals, files, and Git tooling. Avoid taking ownership of a second implementation of these systems during the POC.

This is a local application. Keep session data on the user's machine and do not publish the running app or private transcripts to a public website. A public source fork does not contain the local runtime database or provider credentials.

## Overnight POC

### 1. Establish the fork and a reliable launch

- Retain upstream history and an `upstream` remote so updates remain possible.
- Clearly mark the modified product as Central Command and retain upstream attribution.
- Install/build on Windows, resolve platform-specific startup problems, and supply a simple morning launch path.
- Keep upstream working session/chat routes available as a dependable path to real actions.

Acceptance: the local app starts, authentication still works, and a user can reach both Central Command and the underlying session workspace.

### 2. Build the command overview

- A compact navigation rail identifies command, sessions, incoming attention, and activity views.
- A fleet list shows meaningful session identity, provider, project, state, and last activity.
- A selected session opens an inspector with enough context to decide whether to continue into its full workspace.
- Running and recent sessions come from existing authenticated local APIs. Empty, disconnected, and unavailable states must be understandable.
- Treat a running-state response as stronger evidence than transcript timestamps. A discovered session can be recent without still running.

Acceptance: real local sessions populate the overview; selecting one opens the correct existing session UI; source errors are visible rather than masked by demo fixtures.

### 3. Demonstrate attention management

- Provide an explicitly labeled demonstration workspace so a fresh install can show a realistic mixed-provider swarm.
- Make search, provider/state filters, selection, and navigation work at realistic density.
- Show attention items separately from routine activity. Let the user acknowledge or defer sample items and persist those demonstration preferences locally.
- Keep acknowledgments distinct from provider tool approvals. Sample controls must not pretend to execute commands on a Mac or approve a live agent tool call.
- Include a central orchestrator session in the example so the intended hierarchy is visible without asserting a real orchestration engine exists.

Acceptance: a user can triage the demo, inspect sessions, filter the stream, and return after reload without losing local demonstration choices; no demo interaction is reported as a real provider action.

### 4. Establish the visual language

Use the taste skill's app-screen workflow and the selected **data-terminal** direction (draw seed `850472389`). Public Sans handles interface reading; IBM Plex Mono handles compact technical values. Use deliberate spacing, a dark neutral ground, restrained signal color, and precise status typography.

The futuristic character comes from a coherent information system and responsive interaction. Keep controls accessible, type legible, status meanings consistent, and reduced-motion preferences respected. Screens should remain useful at laptop widths and in a narrow browser, rather than relying on a giant desktop canvas.

Acceptance: inspect real rendered screens at desktop, laptop, and narrow widths; fix overflow, contrast, tiny targets, and confusing hierarchy. The final visual notes should name any deliberate deviations from the dealt direction.

### 5. Verify and hand off

- Run build/type checks and relevant existing tests for changed behavior.
- Add focused tests only where state transforms or integration behavior warrant them.
- Exercise real browser flows: login, enter command view, switch live/demo, search/filter, inspect a session, follow its workspace link, dismiss/defer a sample item, refresh, and recover from an unavailable API.
- Do not claim Mac runtime verification from a Windows-only test. Document the Mac smoke test separately.
- Leave source, research, plan, launch steps, and known limitations together in the repository.

Acceptance: the user has a concrete morning test path, evidence of the checks performed, and an accurate separation between implemented behavior and planned integrations.

## Architecture for the POC

```text
Central Command React workspace
  ├── live mode → authenticated CloudCLI session/project APIs
  │               └── existing provider adapters and transcript index
  ├── session actions → existing full session/chat workspace
  │                      └── authenticated WebSocket + provider permissions
  └── demo mode → labeled fixtures + local presentation state
```

Keep the command module cohesive. Derive fleet rows through one adapter layer rather than spreading provider assumptions into visual components. Navigation and filtering should operate on those normalized rows. Retain stable app session IDs; provider-native IDs have a different purpose.

The POC's “Central Command” name identifies the interface and the chosen orchestrator session. It does not imply that the frontend autonomously dispatches instructions, moves work between computers, or replaces the provider's permission system.

## After the morning test

| Stage | Work | Completion evidence |
| --- | --- | --- |
| **A. Daily local use** | Persist pinned sessions, fleet groups, saved filters, and read state in the backend; improve large-history pagination; derive attention from real normalized events. | Real local Claude/Codex sessions survive refresh/restart; no lost incoming decisions; resource use remains bounded. |
| **B. Secure Mac bridge** | Register named hosts; pair a lightweight authenticated bridge on macOS; map cmux workspaces/surfaces to agent sessions; preserve local execution on each host. Use an authenticated encrypted private transport. | Windows can list and inspect a real Mac session; host disconnects are visible; commands have explicit delivery/acknowledgment records. |
| **C. Durable attention queue** | Store questions, permission requests, failures, and completed artifacts as typed events with ownership, source links, deduplication, and resolved/read state. Add reconnect replay. | A real permission request reaches the right session once; decisions cannot silently disappear or be replayed after completion. |
| **D. Deliberate orchestration** | Connect a designated Central-Command agent to typed fleet tools; define delegation, shared context, worktree/clone ownership, and human approval boundaries. Use provider-supported app-server/SDK protocols where available. | A parent agent delegates a bounded task, receives a result, and shows the full provenance; cancellation and retry behavior are tested. |
| **E. Desktop delivery** | Rebrand Electron packaging and protocol identifiers, add signed Windows/macOS builds, update strategy, migration handling, and source-distribution notices. | Reproducible installers launch on both operating systems without changing upstream installations or losing settings. |

## Decisions to make with actual usage

The morning evaluation should determine whether the attention queue or the fleet list is the better default, how much transcript preview is useful, and whether sessions should group primarily by project, mission, or machine. These decisions are inexpensive to change now.

Before building automatic orchestration, confirm whether the existing Central-Command session should remain the directing agent or whether the user wants a new dedicated one. Before introducing cross-machine control, establish whether the Mac and Windows hosts need simultaneous operation or simply the same application on each. Neither assumption needs to block the local POC.
