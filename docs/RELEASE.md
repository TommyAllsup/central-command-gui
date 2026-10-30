# Developer-preview release checklist

This prepares the first team preview; it does not claim a stable release or signed installer has been published. Each developer runs a separate local instance.

Included: simple README/agent setup, explicit demo/live labels, a replayable first-visit walkthrough, local session discovery, inherited provider workspace, roadmap and fork commitments.

## Acceptance before claiming support on both platforms

- [ ] Clean Mac install/restart on the architectures the team uses.
- [ ] Clean Windows install/restart on a teammate's machine.
- [ ] Real Claude turn, permission request, cancellation, and continuation on Mac.
- [ ] Real Codex turn, permission request, cancellation, and continuation on Windows.
- [ ] Review dependency findings; record fixes or accepted risks.
- [ ] Upgrade without losing local account/session state.
- [ ] Verify notices, public source links, and docs against the release commit.
- [ ] Choose a tag and publish notes tied to that commit after acceptance.

Build, discovery/authentication, and automated-test evidence is in [TESTING.md](TESTING.md). It does not substitute for real provider-turn or Mac runtime evidence.

## Team trial and release notes

Use the [README](../README.md) or [agent setup guide](AGENT-SETUP.md). Check the tour, then connect a local provider and test a low-risk project. Share sanitized reproduction details described in [ROADMAP.md](ROADMAP.md).

Release notes should include the commit/tag, install/update commands, verified OS/provider combinations, changes, regressions/dependency findings, and migration/recovery steps. Separate demo capabilities from live ones. Remote cmux access, aggregated approvals, and autonomous orchestration remain roadmap work.
