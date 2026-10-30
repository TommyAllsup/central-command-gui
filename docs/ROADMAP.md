# Roadmap and fork expectations

## Purpose and commitments

Help developers supervise Claude Code and Codex sessions: **what is working, what needs me, and where can I act?** Extend CloudCLI's session foundation with attention management and coordination.

- Distinguish telemetry, inferred state, and sample data. Never mask failed live reads with demo data.
- Retain provider permissions and human control. Delegation needs explicit scope, cancellation, and delivery evidence.
- Support the same workflow on Windows and Mac; claim support based on runtime validation.
- Keep the preview local and single-user. Remote access and shared tenancy need deliberate authorization.
- Preserve AGPL source availability, notices, attribution, and upstream history. Review upstream fixes and contribute generally useful changes upstream where practical.
- Reuse working adapters. Invest in attention, context, and coordination.
- Ship reproducible tests and honest limitations. This roadmap does not promise dates.

## Milestones

| Stage | Work | Acceptance |
| --- | --- | --- |
| Developer preview — current | Local deck, discovery, inherited workspace, labeled demo, first-visit tour, human/agent setup | A teammate can install, distinguish demo/live, open a session, and report a useful issue. See RELEASE.md for pending checks. |
| Cross-platform confidence — next | Clean Windows/Mac installs, provider turns, permissions, cancel/reconnect, dependency review, update/recovery | Both OS/provider combinations have repeatable end-to-end evidence and release blockers are resolved. |
| Live attention queue | Typed questions, failures, completions/artifacts; deduplication, persistence, source links, read/resolved state | A real question arrives once, survives restart, and cannot replay a completed approval. |
| Authenticated host bridge | Host identity, pairing, health/reconnect, Mac cmux integration where supported | Two real machines appear honestly; actions are authenticated/acknowledged; stale hosts are obvious. |
| Deliberate orchestration | Directing session, bounded tasks, worktree ownership, results/cancellation | A parent delegates, receives provenance, and stops/retries without duplicate work. |
| Desktop distribution | Fork-specific identifiers, signed installers, migrations/updates | Installers work independently of upstream installs and preserve settings. |

## Expectations for the preview

No shared team logins, hosted SaaS, RBAC, fleet-wide broadcast, automatic approvals, cost/token accounting, arbitrary CLI takeover, signed installers, or production security guarantee. The demo illustrates workflows, not completed integrations.

Each teammate installs locally and tests one low-risk project. Report OS/architecture, Node version, commit, demo/live mode, reproduction steps, expected/actual behavior, and sanitized logs. Never attach tokens, account databases, private transcripts, or project secrets.

Tell us where attention is lost: excessive events, missing context, unclear ownership, or a slow path back to a session. Feedback determines whether the attention queue or host bridge comes first.

## Maintenance

Use small, reviewable changes. Review upstream security/adapter changes before release candidates and keep dependency findings/runtime gaps visible in release notes. Preview updates use a clean Git pull and rebuild; automatic upgrades and untested future provider compatibility are not promised. Prioritize authentication, session safety, and regressions preventing work.

[Release checklist](RELEASE.md) · [Agent setup](AGENT-SETUP.md) · [Research](RESEARCH.md) · [Original plan](PLAN.md)
