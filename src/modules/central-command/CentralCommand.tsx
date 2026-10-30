import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Command,
  ExternalLink,
  GitBranch,
  Inbox,
  LayoutGrid,
  List,
  Monitor,
  Network,
  Pause,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Search,
  Settings2,
  Terminal,
  X,
} from "lucide-react";

import { useDemoCommand } from "@/modules/central-command/hooks/useDemoCommand";
import { useLiveCommand } from "@/modules/central-command/hooks/useLiveCommand";
import { DemoTour } from "@/modules/central-command/modals/DemoTour";
import "@/modules/central-command/central-command.css";

type Screen = "overview" | "inbox" | "activity" | "connections";
type Session = {
  id: string;
  title: string;
  role: string;
  provider: string;
  project: string;
  host: string;
  status: string;
  task: string;
  branch: string;
  updatedAt: number;
  messages: string[];
};

function age(value: number) {
  if (!value || !Number.isFinite(value)) return "—";
  const minutes = Math.max(0, Math.floor((Date.now() - value) / 60000));
  return minutes < 1
    ? "Just now"
    : minutes < 60
      ? `${minutes}m ago`
      : minutes < 1440
        ? `${Math.floor(minutes / 60)}h ago`
        : `${Math.floor(minutes / 1440)}d ago`;
}
function statusLabel(status: string) {
  return (
    (
      {
        attention: "Needs you",
        running: "Working",
        complete: "Complete",
        paused: "Paused",
        idle: "Idle",
        history: "History",
      } as Record<string, string>
    )[status] || status
  );
}
function Provider({ provider }: { provider: string }) {
  return (
    <span className="cc-provider">
      <svg
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        {provider === "claude" ? (
          <path d="M8 1v14M1 8h14M3 3l10 10M3 13L13 3M5 1.5l6 13M1.5 5l13 6" />
        ) : (
          <>
            <path d="M8 1l7 7-7 7-7-7z" />
            <path d="M8 5l3 3-3 3-3-3z" />
          </>
        )}
      </svg>
      {provider === "claude"
        ? "Claude Code"
        : provider === "codex"
          ? "Codex"
          : provider}
    </span>
  );
}
function State({ status }: { status: string }) {
  return (
    <span className={`cc-status cc-status-${status}`}>
      <span aria-hidden="true" />
      {statusLabel(status)}
    </span>
  );
}
function BrandMark() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M23 5H12L5 12v9l7 6h11M23 11h-8l-4 5 4 5h8M23 5v6M23 21v6"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M22 14h7v4h-7z" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Mounted by App as the Central Command landing/demo and authenticated live dashboard. */
export function CentralCommand({ live = false }: { live?: boolean }) {
  const demo = useDemoCommand();
  const local = useLiveCommand(live);
  // The selected work area determines which focused screen is visible.
  const [screen, setScreen] = useState<Screen>("overview");
  // Search is shared between the overview roster and command palette.
  const [query, setQuery] = useState("");
  // Status and project scope let a large fleet reduce to a useful working set.
  const [filter, setFilter] = useState("all");
  // Signal scope reduces routine output to decisions, completions, or unread events.
  const [signalFilter, setSignalFilter] = useState("all");
  // Retain a selected session while its detail sheet is open.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Switch between the hierarchy and the compact session list without losing scope.
  const [showMap, setShowMap] = useState(true);
  // A draft dialog lets demo users try creating a session without starting an AI process.
  const [draftOpen, setDraftOpen] = useState(false);
  // The palette provides keyboard-first navigation and session lookup.
  const [paletteOpen, setPaletteOpen] = useState(false);
  // Brief feedback confirms local actions that would otherwise be easy to miss.
  const [notice, setNotice] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  // First-time demo visitors get a tour; completion is independent of sample-data resets.
  const [tourStep, setTourStep] = useState<number | null>(() => {
    if (live) return null;
    try {
      return localStorage.getItem("central-command-tour-v1") === "seen"
        ? null
        : 0;
    } catch {
      return 0;
    }
  });
  const closeTour = useCallback(() => {
    setTourStep(null);
    try {
      localStorage.setItem("central-command-tour-v1", "seen");
    } catch {
      /* Tour still closes if browser storage is unavailable. */
    }
    window.setTimeout(
      () => document.getElementById("cc-start-tour")?.focus(),
      0,
    );
  }, []);
  const changeTourStep = (step: number) => {
    setTourStep(step);
    const screens: Screen[] = [
      "overview",
      "overview",
      "inbox",
      "activity",
      "connections",
    ];
    setScreen(screens[step]);
  };

  useEffect(() => {
    document.body.classList.add("cc-body");
    return () => document.body.classList.remove("cc-body");
  }, []);

  useEffect(() => {
    if (!selectedId && !draftOpen && !paletteOpen && tourStep === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const dialog = Array.from(
        document.querySelectorAll('.cc-app [role="dialog"]'),
      ).at(-1);
      const controls = Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input, select, textarea, [tabindex="0"]',
        ) || [],
      );
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first) return;
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !dialog?.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !dialog?.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trapFocus);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", trapFocus);
    };
  }, [selectedId, draftOpen, paletteOpen, tourStep]);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (tourStep !== null) {
        if (event.key === "Escape") {
          event.preventDefault();
          closeTour();
        }
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")
          event.preventDefault();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSelectedId(null);
        setDraftOpen(false);
        setPaletteOpen((open) => !open);
      }
      if (event.key === "Escape") {
        setPaletteOpen(false);
        setDraftOpen(false);
        setSelectedId(null);
      }
      if (
        event.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          (event.target as HTMLElement)?.tagName,
        )
      ) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [tourStep, closeTour]);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timeout);
  }, [notice]);

  const sessions: Session[] = live
    ? local.sessions.map((session) => ({
        id: session.id,
        title: session.title,
        role: "Local session",
        provider: session.provider,
        project: session.projectName || "Local project",
        host: "This machine",
        status: session.status === "idle" ? "history" : session.status,
        task:
          session.snippet ||
          session.projectPath ||
          "Open this session to continue the conversation.",
        branch: "",
        updatedAt: session.updatedAt
          ? new Date(session.updatedAt).getTime()
          : 0,
        messages: [],
      }))
    : demo.sessions;
  const decisions = live
    ? []
    : demo.decisions.filter((decision) => decision.status === "pending");
  const working = sessions.filter(
    (session) => session.status === "running",
  ).length;
  const visible = sessions.filter(
    (session) =>
      (filter === "all" || session.status === filter) &&
      `${session.title} ${session.project} ${session.task} ${session.provider}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const selected = sessions.find((session) => session.id === selectedId);
  const events = live
    ? sessions
        .slice()
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map((session) => ({
          id: session.id,
          sessionId: session.id,
          title: session.title,
          detail: session.task,
          kind: "progress",
          at: session.updatedAt,
          read: true,
        }))
    : demo.events;
  const navigation = [
    { id: "overview" as const, label: "Command deck", icon: LayoutGrid },
    { id: "inbox" as const, label: "Decision inbox", icon: Inbox },
    { id: "activity" as const, label: "Signal stream", icon: Activity },
    { id: "connections" as const, label: "Connections", icon: Network },
  ];
  const visibleEvents =
    screen === "activity"
      ? events.filter(
          (event) =>
            signalFilter === "all" ||
            (signalFilter === "unread"
              ? !event.read
              : event.kind === signalFilter),
        )
      : events;
  const pendingText = live
    ? `${working} working · ${sessions.length}${local.hasMore ? ` of ${local.total}` : ""} recent sessions on this machine`
    : decisions.length
      ? `${decisions.length} ${decisions.length === 1 ? "decision needs" : "decisions need"} you. The rest of the swarm can keep moving.`
      : "Your decisions are cleared. The swarm can keep moving.";
  const newSession = () =>
    live ? window.location.assign("/workspace") : setDraftOpen(true);
  const resolve = (id: string, accept: boolean) => {
    demo.resolve(id, accept);
    setNotice(
      accept
        ? "Decision recorded in the sample workspace"
        : "Alternative requested in the sample workspace",
    );
  };

  function decisionCards(compact = false) {
    return decisions.length ? (
      decisions.slice(0, compact ? 2 : undefined).map((decision) => {
        const owner = sessions.find(
          (session) => session.id === decision.sessionId,
        );
        return (
          <article className="cc-decision" key={decision.id}>
            <div className="cc-decision-meta">
              <span>{decision.kind}</span>
              <time>{age(decision.createdAt)}</time>
            </div>
            <button
              className="cc-title-link"
              onClick={() => setSelectedId(decision.sessionId)}
            >
              {decision.title}
              <ArrowUpRight size={14} />
            </button>
            <p className={compact ? "cc-decision-summary" : undefined}>
              {decision.detail}
            </p>
            <div className="cc-decision-owner">
              <span className="cc-small-diamond" />
              {owner?.title}
              <span> / {owner?.project}</span>
            </div>
            <div className="cc-decision-actions">
              <button onClick={() => resolve(decision.id, true)}>
                <Check size={13} />
                {decision.accept}
              </button>
              <button
                className="cc-quiet"
                onClick={() => resolve(decision.id, false)}
              >
                Request alternative
              </button>
            </div>
          </article>
        );
      })
    ) : (
      <div className="cc-empty">
        <Check size={22} />
        <h3>{live ? "Review approvals in the session" : "A clear runway"}</h3>
        <p>
          {live
            ? "Live approvals stay in the original session workspace. This POC does not aggregate them yet."
            : "Nothing needs a decision. Progress stays in the signal stream."}
        </p>
        {live && (
          <a className="cc-button" href="/workspace">
            Open workspace <ArrowUpRight size={14} />
          </a>
        )}
      </div>
    );
  }

  function eventRows(limit?: number) {
    return visibleEvents.slice(0, limit).map((event) => (
      <button
        className={`cc-event ${event.read ? "cc-event-read" : ""}`}
        key={event.id}
        onClick={() => setSelectedId(event.sessionId)}
      >
        <span className={`cc-event-symbol cc-event-${event.kind}`}>
          {event.kind === "complete" ? (
            <Check size={14} />
          ) : event.kind === "decision" ? (
            <ArrowDownLeft size={14} />
          ) : (
            <Radio size={14} />
          )}
        </span>
        <span className="cc-event-copy">
          <strong>{event.title}</strong>
          <span>
            {
              sessions.find((session) => session.id === event.sessionId)
                ?.project
            }{" "}
            · {age(event.at)}
          </span>
          {screen === "activity" && <p>{event.detail}</p>}
        </span>
        <ChevronRight size={14} />
      </button>
    ));
  }

  return (
    <div className="cc-app" data-theme="dark">
      <aside
        className="cc-rail"
        aria-label="Primary navigation"
        aria-hidden={tourStep !== null || undefined}
      >
        <button
          className="cc-brand-symbol"
          onClick={() => setScreen("overview")}
          aria-label="Central Command home"
          title="Central Command"
        >
          <BrandMark />
        </button>
        <nav>
          {navigation.map((item) => (
            <button
              key={item.id}
              className={screen === item.id ? "active" : ""}
              aria-label={item.label}
              title={item.label}
              aria-current={screen === item.id ? "page" : undefined}
              onClick={() => {
                setScreen(item.id);
                setSelectedId(null);
              }}
            >
              <item.icon size={19} />
              <span className="cc-mobile-label">
                {item.label.split(" ")[0]}
              </span>
              {item.id === "inbox" && decisions.length > 0 && (
                <i className="cc-nav-dot" />
              )}
            </button>
          ))}
        </nav>
        <div className="cc-rail-bottom">
          <button
            title="Command palette (Ctrl+K)"
            aria-label="Open command palette"
            onClick={() => setPaletteOpen(true)}
          >
            <Command size={18} />
          </button>
          <button
            title="Connection settings"
            aria-label="Connection settings"
            onClick={() => setScreen("connections")}
          >
            <Settings2 size={18} />
          </button>
          <span className="cc-avatar" title="Personal workspace">
            CC
          </span>
        </div>
      </aside>
      <div className="cc-shell" aria-hidden={tourStep !== null || undefined}>
        <header className="cc-topbar">
          <div className="cc-wordmark">
            Central Command
            <span className="cc-header-divider" />
            <span className="cc-workspace">
              Personal workspace <ChevronDown size={12} />
            </span>
          </div>
          <div className="cc-topbar-right">
            <button
              aria-label="Search commands and sessions"
              className="cc-search-trigger"
              onClick={() => setPaletteOpen(true)}
            >
              <Search size={14} />
              <span>Find a session or action</span>
              <kbd>Ctrl K</kbd>
            </button>
            <span className="cc-mode">
              <span />
              {live ? "Live · this machine" : "Demo mode"}
            </span>
          </div>
        </header>
        <main className="cc-main">
          <div className="cc-page-heading">
            <div>
              <div className="cc-breadcrumb">
                Workspace <ChevronRight size={12} />{" "}
                {navigation.find((item) => item.id === screen)?.label}
              </div>
              <h1>
                {screen === "overview"
                  ? "Command deck"
                  : navigation.find((item) => item.id === screen)?.label}
              </h1>
              <p>
                {screen === "overview"
                  ? pendingText
                  : screen === "inbox"
                    ? "A little human judgment. Then back to work."
                    : screen === "activity"
                      ? live
                        ? "Recent session activity · refreshed every 15 seconds"
                        : "The important moments, without every line of output."
                      : "Your tools, with a place in the same workflow."}
              </p>
            </div>
            <div className="cc-heading-actions">
              <a
                className="cc-button cc-mode-switch"
                href={live ? "/demo" : "/command"}
              >
                {live ? "Explore demo" : "Connect local sessions"}
                <ArrowUpRight size={14} />
              </a>
              <button className="cc-button cc-primary" onClick={newSession}>
                <Plus size={15} />
                {live ? "New session" : "New sample session"}
              </button>
            </div>
          </div>
          {live && local.error && (
            <div className="cc-error" role="alert">
              Could not refresh local sessions. {local.error}
              <button onClick={() => void local.refresh()}>Retry</button>
            </div>
          )}
          {!live && (
            <div className="cc-demo-notice">
              <span>
                <Circle size={9} />
                <strong>Demo mode</strong>{" "}
                <span className="cc-demo-explanation">
                  Sample data only. No real agents are running here.
                </span>
              </span>
              <div className="cc-demo-actions">
                <button
                  id="cc-start-tour"
                  onClick={() => {
                    setSelectedId(null);
                    setDraftOpen(false);
                    setPaletteOpen(false);
                    changeTourStep(0);
                  }}
                >
                  Take the tour <ArrowRight size={12} />
                </button>
                <button
                  onClick={() => {
                    demo.reset();
                    setNotice("Sample workspace reset");
                  }}
                >
                  Reset demo <RotateCcw size={12} />
                </button>
              </div>
            </div>
          )}

          {screen === "overview" && (
            <>
              <section className="cc-mission" aria-label="Workspace summary">
                <div className="cc-mission-lead">
                  <span className="cc-mission-glyph">
                    <Network size={24} />
                  </span>
                  <div>
                    <span className="cc-label">
                      {live
                        ? "Local session fleet"
                        : "Orchestrated by Central-Command"}
                    </span>
                    <strong>
                      {live
                        ? "Your work, in one field of view."
                        : "Keep the work moving. Keep the noise down."}
                    </strong>
                    <span>
                      {live
                        ? `Last refreshed ${local.refreshedAt ? age(new Date(local.refreshedAt).getTime()) : "—"} · This machine only`
                        : "Windows workstation + Mac Studio · Sample mission"}
                    </span>
                  </div>
                </div>
                <div className="cc-stat">
                  <span>Sessions</span>
                  <strong>
                    {local.loading && live
                      ? "—"
                      : sessions.length.toString().padStart(2, "0")}
                  </strong>
                </div>
                <div className="cc-stat">
                  <span>Working</span>
                  <strong>{working.toString().padStart(2, "0")}</strong>
                </div>
                <button
                  className="cc-stat cc-stat-action"
                  onClick={() => setScreen("inbox")}
                >
                  <span>Need you</span>
                  <strong>
                    {live ? "—" : decisions.length.toString().padStart(2, "0")}
                    <ArrowUpRight size={15} />
                  </strong>
                </button>
              </section>
              <div className="cc-deck-grid">
                <div className="cc-fleet-column">
                  {!live && showMap && (
                    <section className="cc-panel cc-map-panel">
                      <div className="cc-section-heading">
                        <h2>Swarm topology</h2>
                        <span className="cc-muted">
                          One mission. Parallel work.
                        </span>
                        <button
                          aria-label="Hide swarm topology"
                          title="Hide topology"
                          onClick={() => setShowMap(false)}
                        >
                          <List size={16} />
                        </button>
                      </div>
                      <SwarmMap sessions={sessions} onSelect={setSelectedId} />
                    </section>
                  )}
                  <section className="cc-panel cc-sessions">
                    <div className="cc-section-heading">
                      <h2>
                        Sessions <span>{visible.length}</span>
                      </h2>
                      <div className="cc-panel-tools">
                        {live && (
                          <button
                            title="Refresh sessions"
                            aria-label="Refresh sessions"
                            onClick={() => void local.refresh()}
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                        {!live && !showMap && (
                          <button
                            title="Show swarm topology"
                            aria-label="Show swarm topology"
                            onClick={() => setShowMap(true)}
                          >
                            <Network size={15} />
                          </button>
                        )}
                        <span className="cc-muted">
                          {live ? "This machine" : "Across your fleet"}
                        </span>
                      </div>
                    </div>
                    <div className="cc-roster-tools">
                      <label className="cc-search">
                        <Search size={14} />
                        <input
                          ref={searchRef}
                          placeholder="Find a session…"
                          aria-label="Search sessions"
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                        />
                        <kbd>/</kbd>
                      </label>
                      <select
                        aria-label="Filter sessions by status"
                        value={filter}
                        onChange={(event) => setFilter(event.target.value)}
                      >
                        <option value="all">All states</option>
                        <option value="running">Working</option>
                        {!live && <option value="attention">Needs you</option>}
                        <option value={live ? "history" : "idle"}>
                          {live ? "History" : "Idle"}
                        </option>
                        {!live && (
                          <>
                            <option value="paused">Paused</option>
                            <option value="complete">Complete</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div
                      className="cc-table"
                      role="table"
                      aria-label="Agent sessions"
                    >
                      <div className="cc-table-head" role="row">
                        <span role="columnheader">Session / project</span>
                        <span role="columnheader">Provider</span>
                        <span role="columnheader">State</span>
                        <span role="columnheader">Updated</span>
                        <span />
                      </div>
                      {visible.map((session) => (
                        <button
                          className="cc-session-row"
                          key={session.id}
                          onClick={() => setSelectedId(session.id)}
                          aria-label={`Open ${session.title}`}
                        >
                          <span className="cc-session-identity">
                            <strong>{session.title}</strong>
                            <span>
                              {session.project}
                              {session.branch ? ` / ${session.branch}` : ""}
                            </span>
                          </span>
                          <Provider provider={session.provider} />
                          <State status={session.status} />
                          <time>{age(session.updatedAt)}</time>
                          <ChevronRight size={14} />
                        </button>
                      ))}
                    </div>
                    {!visible.length && (
                      <div className="cc-empty">
                        <Search size={22} />
                        <h3>
                          {live && local.loading
                            ? "Discovering local sessions…"
                            : query || filter !== "all"
                              ? "No matching sessions"
                              : "Start your first session"}
                        </h3>
                        <p>
                          {query || filter !== "all"
                            ? "Try another name or clear the state filter."
                            : "Open the workspace to connect a provider and choose a project."}
                        </p>
                        <button
                          className="cc-button"
                          onClick={
                            query || filter !== "all"
                              ? () => {
                                  setQuery("");
                                  setFilter("all");
                                }
                              : newSession
                          }
                        >
                          {query || filter !== "all"
                            ? "Clear filters"
                            : "Open workspace"}
                        </button>
                      </div>
                    )}
                    <div className="cc-panel-footer">
                      <span>
                        <Monitor size={12} />
                        {live
                          ? `Local discovery${local.hasMore ? ` · ${sessions.length} of ${local.total} recent` : ""} · no remote hosts connected`
                          : `${sessions.length} sample sessions · ${new Set(sessions.map((session) => session.host)).size} sample hosts`}
                      </span>
                      <button onClick={() => setScreen("connections")}>
                        Connections <ArrowRight size={12} />
                      </button>
                    </div>
                  </section>
                </div>
                <div className="cc-signal-column">
                  <section className="cc-panel cc-inbox">
                    <div className="cc-section-heading">
                      <h2>
                        Needs your attention{" "}
                        {decisions.length > 0 && (
                          <span className="cc-attention-count">
                            {decisions.length}
                          </span>
                        )}
                      </h2>
                      <button
                        aria-label="Open decision inbox"
                        onClick={() => setScreen("inbox")}
                      >
                        <ArrowUpRight size={16} />
                      </button>
                    </div>
                    {decisionCards(true)}
                  </section>
                  <section className="cc-panel cc-stream">
                    <div className="cc-section-heading">
                      <h2>Signal stream</h2>
                      <span className="cc-live-caption">
                        <span />
                        {live ? "Recent" : "Sample"}
                      </span>
                    </div>
                    {eventRows(3)}
                    {!events.length && (
                      <p className="cc-empty-line">
                        Session updates will appear here.
                      </p>
                    )}
                    <button
                      className="cc-view-all"
                      onClick={() => setScreen("activity")}
                    >
                      View all activity <ArrowRight size={14} />
                    </button>
                  </section>
                </div>
              </div>
            </>
          )}

          {screen === "inbox" && (
            <div className="cc-focused-grid">
              <section className="cc-panel">
                <div className="cc-section-heading">
                  <h2>{live ? "Live approvals" : "Pending decisions"}</h2>
                  <span className="cc-muted">
                    {live
                      ? "In the session workspace"
                      : `${decisions.length} waiting`}
                  </span>
                </div>
                {decisionCards()}
              </section>
              <aside className="cc-context-note">
                <Inbox size={24} />
                <h2>Attention is the scarce resource.</h2>
                <p>
                  Keep the question, its context, and the session that asked it
                  together. Handle a decision once, then let independent work
                  continue.
                </p>
                {!live && (
                  <>
                    <h3>Resolved in this demo</h3>
                    {demo.decisions
                      .filter((item) => item.status !== "pending")
                      .map((item) => (
                        <div className="cc-resolved" key={item.id}>
                          <Check size={14} />
                          <span>
                            {item.title}
                            <small>
                              {item.status === "accepted"
                                ? item.accept
                                : "Alternative requested"}
                            </small>
                          </span>
                        </div>
                      ))}
                    {demo.decisions.every(
                      (item) => item.status === "pending",
                    ) && <p>No decisions resolved yet.</p>}
                  </>
                )}
              </aside>
            </div>
          )}
          {screen === "activity" && (
            <section className="cc-panel cc-activity-panel">
              <div className="cc-section-heading">
                <h2>
                  {live ? "Recent sessions" : "All signals"}{" "}
                  <span>{visibleEvents.length}</span>
                </h2>
                {!live && (
                  <select
                    className="cc-signal-filter"
                    aria-label="Filter signal stream"
                    value={signalFilter}
                    onChange={(event) => setSignalFilter(event.target.value)}
                  >
                    <option value="all">All signals</option>
                    <option value="decision">Decisions</option>
                    <option value="complete">Completed</option>
                    <option value="unread">Unread</option>
                  </select>
                )}
                {!live && (
                  <button
                    className="cc-text-button"
                    onClick={() => {
                      demo.markRead();
                      setNotice("All sample signals marked as read");
                    }}
                  >
                    <Check size={14} />
                    Mark all read
                  </button>
                )}
              </div>
              {eventRows()}
              {!visibleEvents.length && (
                <div className="cc-empty">
                  <Activity size={24} />
                  <h3>
                    {signalFilter === "unread"
                      ? "No unread signals"
                      : signalFilter !== "all"
                        ? "No matching signals"
                        : "No activity yet"}
                  </h3>
                  <p>
                    {signalFilter === "unread"
                      ? "All caught up. Read signals remain in All signals."
                      : signalFilter !== "all"
                        ? "Choose All signals to see the complete history."
                        : "Start a session in the workspace to begin."}
                  </p>
                </div>
              )}
            </section>
          )}
          {screen === "connections" && (
            <div className="cc-connections">
              <section className="cc-panel">
                <div className="cc-section-heading">
                  <h2>Provider connections</h2>
                  <span className="cc-muted">
                    Powered by the CloudCLI runtime
                  </span>
                </div>
                {["codex", "claude"].map((provider) => (
                  <div className="cc-connection-row" key={provider}>
                    <div>
                      <Provider provider={provider} />
                      <p>
                        {provider === "codex"
                          ? "Codex CLI and SDK · Windows, macOS, Linux"
                          : "Claude Code and Agent SDK · macOS, Windows, Linux"}
                      </p>
                    </div>
                    <div>
                      <span className="cc-muted">
                        {live
                          ? `${sessions.filter((session) => session.provider === provider).length} discovered sessions`
                          : "Demo data"}
                      </span>
                      <a className="cc-button" href="/workspace">
                        Open workspace <ArrowUpRight size={13} />
                      </a>
                    </div>
                  </div>
                ))}
                <div className="cc-connection-note">
                  <Terminal size={18} />
                  <p>
                    Use your existing CLI sign-in. The workspace handles project
                    selection, conversations, terminals, and permission
                    requests.
                  </p>
                </div>
              </section>
              <section className="cc-panel">
                <div className="cc-section-heading">
                  <h2>Machines & cmux</h2>
                  <span className="cc-muted">Preview scope</span>
                </div>
                <div className="cc-machine">
                  <Monitor size={25} />
                  <div>
                    <strong>{live ? "This machine" : "Sample fleet"}</strong>
                    <p>
                      {live
                        ? "The server discovers sessions on the machine where it runs."
                        : "Mac Studio and Windows workstation are sample hosts, not connected devices."}
                    </p>
                  </div>
                  <State status={live ? "running" : "idle"} />
                </div>
                <p className="cc-connection-copy">
                  Run this fork locally on either Windows or Mac. A shared fleet
                  needs an authenticated host bridge; this POC does not attach
                  to existing cmux panes or control another computer.
                </p>
                <a
                  className="cc-doc-link"
                  href="https://github.com/TommyAllsup/central-command-gui/blob/main/docs/ROADMAP.md"
                  target="_blank"
                  rel="noreferrer"
                >
                  Read the integration roadmap <ExternalLink size={13} />
                </a>
              </section>
            </div>
          )}
          <footer className="cc-footer">
            <span>
              Central Command <span>·</span> Modified fork · Developer preview
            </span>
            <div>
              <a
                href="https://github.com/siteboon/claudecodeui"
                target="_blank"
                rel="noreferrer"
              >
                CloudCLI UI (https://github.com/siteboon/claudecodeui)
              </a>
              <a
                href="https://github.com/TommyAllsup/central-command-gui"
                target="_blank"
                rel="noreferrer"
              >
                Source <ArrowUpRight size={11} />
              </a>
            </div>
          </footer>
        </main>
      </div>

      {selected && (
        <div
          className="cc-sheet-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedId(null);
          }}
        >
          <section
            className="cc-detail"
            role="dialog"
            aria-modal="true"
            aria-label={`${selected.title} session details`}
          >
            <div className="cc-detail-top">
              <span>Session details</span>
              <button
                autoFocus
                aria-label="Close session details"
                onClick={() => setSelectedId(null)}
              >
                <X size={19} />
              </button>
            </div>
            <div className="cc-detail-title">
              <Provider provider={selected.provider} />
              <h2>{selected.title}</h2>
              <State status={selected.status} />
              <p>{selected.task}</p>
            </div>
            <dl className="cc-detail-facts">
              <div>
                <dt>Project</dt>
                <dd>{selected.project}</dd>
              </div>
              <div>
                <dt>Machine</dt>
                <dd>{selected.host}</dd>
              </div>
              {selected.branch && (
                <div>
                  <dt>Branch</dt>
                  <dd>
                    <GitBranch size={12} />
                    {selected.branch}
                  </dd>
                </div>
              )}
              <div>
                <dt>Updated</dt>
                <dd>{age(selected.updatedAt)}</dd>
              </div>
            </dl>
            <div className="cc-detail-transcript">
              <h3>{live ? "Continue the conversation" : "Session brief"}</h3>
              {live ? (
                <>
                  <p>
                    Open the full session for its transcript, tool output,
                    terminal, and permission requests.
                  </p>
                  <a
                    className="cc-button cc-primary"
                    href={`/session/${encodeURIComponent(selected.id)}`}
                  >
                    Open live session <ArrowUpRight size={14} />
                  </a>
                </>
              ) : (
                selected.messages.map((message, index) => (
                  <div className="cc-message" key={`${index}-${message}`}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <p>{message}</p>
                  </div>
                ))
              )}
            </div>
            {!live && (
              <div className="cc-detail-bottom">
                <span>Sample session · no agent process</span>
                <button
                  className="cc-button"
                  disabled={
                    selected.status === "attention" ||
                    selected.status === "complete" ||
                    selected.status === "idle"
                  }
                  title={
                    selected.status === "attention"
                      ? "Resolve this session’s decision in the inbox first"
                      : undefined
                  }
                  onClick={() => demo.togglePause(selected.id)}
                >
                  {selected.status === "paused" ? (
                    <Play size={13} />
                  ) : (
                    <Pause size={13} />
                  )}
                  {selected.status === "paused"
                    ? "Resume sample"
                    : "Pause sample"}
                </button>
              </div>
            )}
          </section>
        </div>
      )}
      {draftOpen && (
        <DraftDialog
          onClose={() => setDraftOpen(false)}
          onCreate={(title, task, provider) => {
            demo.addSession(title, task, provider);
            setDraftOpen(false);
            setNotice("Sample session created. No agent was launched.");
          }}
        />
      )}
      {paletteOpen && (
        <div
          className="cc-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPaletteOpen(false);
          }}
        >
          <section
            className="cc-palette"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            <div className="cc-palette-search">
              <Search size={18} />
              <input
                autoFocus
                placeholder="Find a session…"
                aria-label="Command search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button
                aria-label="Close command palette"
                onClick={() => setPaletteOpen(false)}
              >
                <X size={17} />
              </button>
            </div>
            <div className="cc-palette-results">
              {!query &&
                navigation.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setScreen(item.id);
                      setPaletteOpen(false);
                    }}
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                    <ArrowRight size={14} />
                  </button>
                ))}
              {visible.map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    setSelectedId(session.id);
                    setPaletteOpen(false);
                  }}
                >
                  <Terminal size={16} />
                  <span>
                    {session.title}
                    <small>{session.project}</small>
                  </span>
                  <State status={session.status} />
                </button>
              ))}
              {query && !visible.length && (
                <p className="cc-empty-line">No sessions match “{query}”.</p>
              )}
            </div>
            <div className="cc-palette-footer">
              Tab to navigate · Enter to open · Esc to close
            </div>
          </section>
        </div>
      )}
      {notice && (
        <div className="cc-toast" role="status">
          <Check size={15} />
          {notice}
        </div>
      )}
      {tourStep !== null && !live && (
        <DemoTour step={tourStep} onStep={changeTourStep} onClose={closeTour} />
      )}
    </div>
  );
}

function SwarmMap({
  sessions,
  onSelect,
}: {
  sessions: Session[];
  onSelect: (id: string) => void;
}) {
  const root = sessions.find((session) => session.id === "orchestrator");
  const children = sessions
    .filter((session) => session.id !== "orchestrator")
    .slice(0, 5);
  return (
    <div className="cc-swarm-map">
      <div className="cc-map-root">
        {root && (
          <button onClick={() => onSelect(root.id)}>
            <Network size={17} />
            <strong>Central-Command</strong>
            <span>Orchestrator</span>
            <State status={root.status} />
          </button>
        )}
      </div>
      <div className="cc-map-connectors" aria-hidden="true">
        <span />
      </div>
      <div className="cc-map-nodes">
        {children.map((session) => (
          <button
            key={session.id}
            className={`cc-node cc-node-${session.status}`}
            onClick={() => onSelect(session.id)}
          >
            <span className="cc-node-port" />
            <span className="cc-node-role">{session.role}</span>
            <strong>{session.title}</strong>
            <span className="cc-node-provider">
              {session.provider === "claude" ? "Claude Code" : "Codex"}
            </span>
            <State status={session.status} />
          </button>
        ))}
      </div>
      <div className="cc-map-caption">
        <span>
          <span className="cc-map-key" />
          Delegated work
        </span>
        <span>Sample topology · select a session to inspect</span>
      </div>
    </div>
  );
}

function DraftDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (title: string, task: string, provider: string) => void;
}) {
  // Draft form values stay local until the user creates a sample session.
  const [title, setTitle] = useState("");
  // Mission text gives the new session a concrete, inspectable purpose.
  const [task, setTask] = useState("");
  // Provider selection is part of the demo record, never a CLI invocation.
  const [provider, setProvider] = useState("codex");
  return (
    <div
      className="cc-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        className="cc-draft"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cc-draft-title"
        onSubmit={(event) => {
          event.preventDefault();
          if (title.trim() && task.trim())
            onCreate(title.trim(), task.trim(), provider);
        }}
      >
        <div className="cc-detail-top">
          <span>Sample workspace</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close new session"
          >
            <X size={18} />
          </button>
        </div>
        <h2 id="cc-draft-title">Give the next agent a mission.</h2>
        <p>
          Create a sample session to explore your swarm. No real agent will run.
        </p>
        <label>
          Session name
          <input
            autoFocus
            required
            maxLength={70}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Release review"
          />
        </label>
        <label>
          Provider
          <select
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
          >
            <option value="codex">Codex</option>
            <option value="claude">Claude Code</option>
          </select>
        </label>
        <label>
          Mission
          <textarea
            required
            maxLength={1000}
            rows={3}
            value={task}
            onChange={(event) => setTask(event.target.value)}
            placeholder="What should this session work on?"
          />
        </label>
        <button className="cc-button cc-primary" type="submit">
          <Plus size={15} />
          Create sample session
        </button>
      </form>
    </div>
  );
}
