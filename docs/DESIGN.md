# Central Command design direction

## Decision

Use the taste skill's app-screen **data-terminal** direction, draw seed **850472389**. The complete dealt sheet is in [`.taste-skill/direction.json`](../.taste-skill/direction.json). This is a tool for long monitoring sessions, so information hierarchy, quiet surfaces, and stable alignment should carry the futuristic character.

**Primary question:** Which agent needs my attention, and what is the next useful action?

**Product-specific element:** the user's Central-Command orchestrator sits above its session fleet. The selected agent, its recent activity, and the action needed form one continuous inspection workflow.

## Data and jobs

- Objects are real sessions, projects, providers, incoming attention items, and activity events.
- A session has a stable identity, title, provider, project, state, and last activity.
- Running-state evidence is separate from an indexed transcript's modification time.
- The daily reader is one operator moving between multiple projects and machines.
- The frequent job is finding the session that needs a response and opening its full workspace.
- Questions and failures should interrupt the reading order before routine output does.
- Counts come from the visible data and retain their actual magnitude, including zero.
- Sample agents and sample activity belong to an explicitly labeled demo; they are not evidence of connected hosts or executed work.

## Visual system

| Element | Direction |
| --- | --- |
| Ground and surfaces | Dark near-neutrals, flat opaque panels, separation through a tone step or quiet 1px rule |
| Accent | Restrained teal `#77bdb4`, taken from the command-line world, replacing the sheet's blue |
| Selection | One consistent 1px accent line on the nearest existing edge; no filled colored pill tabs |
| Navigation | Narrow icon rail with a product mark, accessible names, tooltips, and utilities below primary destinations |
| Main type | **Public Sans**, locally loaded, normal weights 400–700 |
| Figures and technical values | **IBM Plex Mono**, locally loaded, normal 400; stable-width digits for counts, times, IDs, and code |
| Density | Compact rows and deliberate gaps, with readable labels; space belongs to real content rather than ornamental cards |
| Status | Text names the state; limited warning/error marks carry meaning without coloring every row |
| Effects | No gradients, glows, glass, decorative scan lines, or persistent card shadows |

The two deliberate interpretations of the dealt sheet are its own offered identity choices: the command-line teal replaces generic blue, and IBM Plex Mono gives figures a technical face. Monospace is intentional here and should be recorded as such in inspector review. It is not a blanket body-font choice.

Public Sans and IBM Plex Mono are bundled in [`public/fonts`](../public/fonts) with their full SIL Open Font License 1.1 notices and source/hash record. The command deck uses these local font files; the inherited workspace still has its original Google Fonts stylesheet in the document. The POC includes Latin subsets; unsupported characters fall back to system fonts.

## Composition and interaction

The shell names the product and current scope immediately. A fleet list and attention summary establish what needs inspection. Selecting a session reveals useful detail and an action to its existing workspace. The incoming stream has filters so its volume does not determine its prominence.

The dealt deployment overview is adapted to the actual subject: the orchestrator and fleet take the place of a current deployment, and incoming agent events take the place of deploy history. No invented health chart, monetary budget, token total, or progress percentage should fill an empty slot.

Navigation, search, filters, selected state, and acknowledgment must produce visible outcomes. Live and demo modes should be easy to distinguish. Demo acknowledgment is local presentation state and never a substitute for a real provider permission response.

On narrow screens, prioritize one working region at a time, keep the next action visible, and prevent page-level horizontal scrolling. Give touch controls suitable targets and preserve focus visibility and reduced-motion behavior.

## Visual verification

Inspect the actual browser at desktop, laptop, and narrow widths. Verify both local typefaces load; inspect hierarchy, density, control targets, alignment, selected-state consistency, overflow, and error/empty states. Run the taste inspector with `--app` against the rendered app.

Screenshot critique, measured findings, fixes, and remaining deviations are to be recorded after the working implementation is rendered. This direction document does not claim that visual QA has already passed.

## Production review, October 29, 2026

Three look-and-fix rounds used the real browser at 1440×900, 768×1024, and 390×844. The final production inspector reported **0 failures and 1 warning**. [Desktop screenshot](screenshots/command-deck.jpg), [phone screenshot](screenshots/command-deck-mobile.jpg), and [measurement report](screenshots/taste-report.json) are retained.

Corrections made after looking at the captures: replaced the provider glyph with vector marks, removed the inherited light body backdrop, increased primary row text, showed decision context beside its action, aligned the main column bottoms, and stacked tablet stream panels to avoid uneven edges. The phone folds the rail into bottom navigation and keeps the attention shortcut in the summary.

The remaining `tiny-text` warning is intentional for this dense monitoring direction: 11–12px metadata (provider, branch, elapsed time, secondary labels) outweighs primary text by count. Session names and main section labels are 13px, the page title is 24–26px, and no text is below 11px. A roomier density setting is a useful next iteration for prolonged use or accessibility preferences. The static lint's monospace warning is the selected direction's explicit figure treatment. Zero-padded values are counts and transcript line positions, not invented decorative section numbers. Missing values use an em dash by the data-state rules.

Critique: the initial screen identifies the orchestrator, local/demo scope, pending decisions and next action; the hierarchy belongs to this product. Main edges align, restrained status colors remain legible, and sample counts update from records. No token budget, cost, health percentage, or imaginary remote connection is presented as telemetry. The phone's hierarchy becomes a roster; the attention summary remains one click from its inbox. Default captures contain sample data only.

Browser interaction verification covered resolving a sample decision and reloading, creating/searching/inspecting a draft session, filtering signals, clearing the unread queue, resetting the demo, and reaching the real account setup gate. Automated component tests additionally cover keyboard palettes, modal focus wrapping, and live-data/error boundaries.

## Developer-preview onboarding review

The demo now carries a persistent sample-data banner and a five-step first-visit walkthrough. The tour changes the underlying work area as it explains sessions, decisions, signals, and local connections. It can be skipped or replayed, and its completion preference is separate from demo records. Live mode never starts the tour.

Reviewed actual production-browser captures at 1440×900, 768×1024, and 390×844: [desktop](screenshots/demo-tour.jpg), [phone](screenshots/demo-tour-mobile.jpg), [raw inspector report](screenshots/demo-tour-report.json). The panel preserves the console's neutral surfaces and restrained accent, with readable 14px instructions and reachable controls at narrow widths. The phone panel fits within the viewport; longer steps can scroll inside it.

The inspector reports one `covered-text` failure because its synthetic page scroll puts the underlying Command deck heading behind the intentional modal backdrop. This is a reviewed modal exception, not a clean inspector pass: background content is aria-hidden and keyboard focus is trapped until dismissal. The existing dense-metadata `tiny-text` warning remains. The tour itself has no clipped text or overlapping controls in the reviewed captures. Browser interaction checks confirmed all five steps, completion, persistence after reload, and replay; automated tests cover Back, Escape, focus wrapping, storage failure, and live-mode exclusion.
