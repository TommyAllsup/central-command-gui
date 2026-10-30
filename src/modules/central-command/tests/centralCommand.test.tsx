import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import { CentralCommand } from "@/modules/central-command";
import type { LiveCommandSession } from "@/shared/types";

const liveState = vi.hoisted(() => ({
  sessions: [] as LiveCommandSession[],
  loading: false,
  error: null as string | null,
  refreshedAt: "2026-10-30T02:00:00.000Z",
  total: 2,
  hasMore: false,
  refresh: vi.fn(),
}));

vi.mock("@/modules/central-command/hooks/useLiveCommand", () => ({
  useLiveCommand: () => liveState,
}));

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("central-command-tour-v1", "seen");
  document.body.style.overflow = "";
  liveState.error = null;
  liveState.loading = false;
  liveState.refresh.mockClear();
  liveState.sessions = [
    {
      id: "live/codex #1",
      title: "Live compiler",
      provider: "codex",
      projectName: "Engine",
      projectPath: "C:\\src\\engine",
      updatedAt: "2026-10-30T02:00:00.000Z",
      status: "running",
      snippet: "Active run reported by the local server.",
      pendingApprovals: null,
    },
    {
      id: "history",
      title: "Imported history",
      provider: "claude",
      projectName: "Interface",
      projectPath: "/Users/tommy/src/ui",
      updatedAt: null,
      status: "idle",
      snippet: "No active run reported by the local server.",
      pendingApprovals: null,
    },
  ];
});

test("first demo visit shows the tutorial; skipping persists and replay is available", () => {
  localStorage.removeItem("central-command-tour-v1");
  const first = render(<CentralCommand />);
  expect(
    screen.getByRole("dialog", { name: "Welcome to the demo" }),
  ).toBeTruthy();
  expect(screen.getByText(/Every agent, machine, and event/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Skip tutorial" }));
  expect(localStorage.getItem("central-command-tour-v1")).toBe("seen");
  expect(screen.queryByRole("dialog")).toBeNull();
  first.unmount();
  render(<CentralCommand />);
  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Take the tour" }));
  expect(
    screen.getByRole("dialog", { name: "Welcome to the demo" }),
  ).toBeTruthy();
});

test("walkthrough moves between feature views, supports back, and finishes without changing sample work", () => {
  localStorage.removeItem("central-command-tour-v1");
  render(<CentralCommand />);
  expect(
    screen.getByRole("button", { name: "Back" }).hasAttribute("disabled"),
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(
    screen.getByRole("dialog", { name: "Find the session that matters" }),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  expect(
    screen.getByRole("dialog", { name: "Welcome to the demo" }),
  ).toBeTruthy();
  for (const title of [
    "Find the session that matters",
    "Give decisions your attention",
    "Turn the stream down",
    "Connect your own work",
  ]) {
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("dialog", { name: title })).toBeTruthy();
  }
  expect(
    screen
      .getByRole("link", { name: "Connect local sessions" })
      .getAttribute("href"),
  ).toBe("/command");
  fireEvent.click(screen.getByRole("button", { name: "Finish tour" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(
    screen.getByRole("heading", { name: "Connections" }),
  ).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: "Decision inbox" }),
  );
  expect(screen.getByText("2 waiting")).toBeTruthy();
  expect(localStorage.getItem("central-command-demo-v1")).toBeNull();
});

test("tutorial traps focus, blocks command shortcuts, and Escape dismisses it", () => {
  localStorage.removeItem("central-command-tour-v1");
  render(<CentralCommand />);
  const next = screen.getByRole("button", { name: "Next" });
  const skip = screen.getByRole("button", { name: "Skip tutorial" });
  next.focus();
  fireEvent.keyDown(document, { key: "Tab" });
  expect(document.activeElement).toBe(skip);
  fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
  expect(document.activeElement).toBe(next);
  fireEvent.keyDown(window, { key: "k", ctrlKey: true });
  expect(screen.getAllByRole("dialog")).toHaveLength(1);
  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.body.style.overflow).toBe("");
});

test("live mode never opens the demo tour for a first-time visitor", () => {
  localStorage.removeItem("central-command-tour-v1");
  render(<CentralCommand live />);
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.queryByRole("button", { name: "Take the tour" })).toBeNull();
  expect(screen.getByText("Live · this machine")).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "New session" }),
  ).toBeTruthy();
});

test("resetting sample data does not reset the dismissed tutorial", () => {
  render(<CentralCommand />);
  fireEvent.click(screen.getByRole("button", { name: "Reset demo" }));
  expect(localStorage.getItem("central-command-tour-v1")).toBe("seen");
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("the tour remains dismissible when browser storage is unavailable", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("Unavailable");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Unavailable");
  });
  render(<CentralCommand />);
  expect(
    screen.getByRole("dialog", { name: "Welcome to the demo" }),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Skip tutorial" }));
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("resolving a sample decision updates the inbox and stays resolved after reload", () => {
  const first = render(<CentralCommand />);
  fireEvent.click(screen.getByRole("button", { name: "Keep current rule" }));
  expect(
    screen.queryByRole("button", { name: "Keep current rule" }),
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Decision inbox" }));
  expect(screen.getByText("1 waiting")).toBeTruthy();
  expect(screen.getByText("Keep current rule")).toBeTruthy();
  first.unmount();
  render(<CentralCommand />);
  expect(
    screen.queryByRole("button", { name: "Keep current rule" }),
  ).toBeNull();
  expect(
    screen.getByRole("button", { name: "Add compatibility" }),
  ).toBeTruthy();
});

test("new sample session form creates an inspectable draft without launching it", () => {
  render(<CentralCommand />);
  fireEvent.click(screen.getByRole("button", { name: "New sample session" }));
  const dialog = screen.getByRole("dialog", {
    name: "Give the next agent a mission.",
  });
  fireEvent.change(within(dialog).getByLabelText("Session name"), {
    target: { value: "Morning review" },
  });
  fireEvent.change(within(dialog).getByLabelText("Mission"), {
    target: { value: "Inspect the command deck and report findings" },
  });
  fireEvent.submit(dialog);
  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Open Morning review" }));
  const details = screen.getByRole("dialog", {
    name: "Morning review session details",
  });
  expect(
    within(details).getByText(
      "Sample session created. No agent process was started.",
    ),
  ).toBeTruthy();
  expect(within(details).getByText("Idle")).toBeTruthy();
});

test("a working sample session can be paused and resumed in its details", () => {
  render(<CentralCommand />);
  fireEvent.click(screen.getByRole("button", { name: "Open Multiplayer" }));
  const details = screen.getByRole("dialog", {
    name: "Multiplayer session details",
  });
  fireEvent.click(
    within(details).getByRole("button", { name: "Pause sample" }),
  );
  expect(within(details).getByText("Paused")).toBeTruthy();
  fireEvent.click(
    within(details).getByRole("button", { name: "Resume sample" }),
  );
  expect(within(details).getByText("Working")).toBeTruthy();
});

test("keyboard palette finds and opens a session and Escape dismisses its details", () => {
  render(<CentralCommand />);
  fireEvent.keyDown(window, { key: "k", ctrlKey: true });
  const palette = screen.getByRole("dialog", { name: "Command palette" });
  fireEvent.change(within(palette).getByLabelText("Command search"), {
    target: { value: "Board engine" },
  });
  fireEvent.click(
    within(palette).getByRole("button", { name: /Board engine/ }),
  );
  expect(
    screen.getByRole("dialog", { name: "Board engine session details" }),
  ).toBeTruthy();
  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("live mode shows no fictional topology or sample decisions and links to the real session", () => {
  render(<CentralCommand live />);
  expect(screen.queryByText("Swarm topology")).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Keep current rule" }),
  ).toBeNull();
  expect(screen.queryByRole("button", { name: /Reset demo/ })).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Open Board engine" }),
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Open Live compiler" }));
  const details = screen.getByRole("dialog", {
    name: "Live compiler session details",
  });
  expect(
    within(details)
      .getByRole("link", { name: "Open live session" })
      .getAttribute("href"),
  ).toBe("/session/live%2Fcodex%20%231");
  expect(
    within(details).queryByRole("button", { name: /Pause sample/ }),
  ).toBeNull();
  fireEvent.keyDown(window, { key: "Escape" });
  fireEvent.click(screen.getByRole("button", { name: "Decision inbox" }));
  expect(
    screen.getByText(
      "Live approvals stay in the original session workspace. This POC does not aggregate them yet.",
    ),
  ).toBeTruthy();
});

test("a live refresh error remains visible alongside the prior sessions and can be retried", () => {
  liveState.error = "Connection lost";
  render(<CentralCommand live />);
  expect(screen.getByRole("alert").textContent).toContain("Connection lost");
  expect(
    screen.getByRole("button", { name: "Open Live compiler" }),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(liveState.refresh).toHaveBeenCalledOnce();
});

test("live history filtering retains imported sessions and missing dates remain unknown", () => {
  render(<CentralCommand live />);
  fireEvent.change(screen.getByLabelText("Filter sessions by status"), {
    target: { value: "history" },
  });
  const history = screen.getByRole("button", { name: "Open Imported history" });
  expect(within(history).getByText("—")).toBeTruthy();
  expect(
    screen.queryByRole("button", { name: "Open Live compiler" }),
  ).toBeNull();
});

test("signal filters isolate decisions and completions, then restore the full stream", () => {
  render(<CentralCommand />);
  fireEvent.click(screen.getByRole("button", { name: "Signal stream" }));
  expect(screen.getByRole("heading", { name: "All signals 6" })).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Filter signal stream"), {
    target: { value: "decision" },
  });
  expect(screen.getByRole("heading", { name: "All signals 2" })).toBeTruthy();
  expect(
    screen.getByRole("button", {
      name: /Direction needed on shieldwall capture/,
    }),
  ).toBeTruthy();
  expect(
    screen.getByRole("button", { name: /Save compatibility needs a decision/ }),
  ).toBeTruthy();
  expect(
    screen.queryByRole("button", { name: /Scoring regression pass completed/ }),
  ).toBeNull();

  fireEvent.change(screen.getByLabelText("Filter signal stream"), {
    target: { value: "complete" },
  });
  expect(screen.getByRole("heading", { name: "All signals 1" })).toBeTruthy();
  expect(
    screen.getByRole("button", { name: /Scoring regression pass completed/ }),
  ).toBeTruthy();
  expect(
    screen.queryByRole("button", {
      name: /Direction needed on shieldwall capture/,
    }),
  ).toBeNull();
  fireEvent.change(screen.getByLabelText("Filter signal stream"), {
    target: { value: "all" },
  });
  expect(screen.getByRole("heading", { name: "All signals 6" })).toBeTruthy();
});

test("marking all signals read clears Unread without deleting history and persists across reload", () => {
  const first = render(<CentralCommand />);
  fireEvent.click(screen.getByRole("button", { name: "Signal stream" }));
  fireEvent.change(screen.getByLabelText("Filter signal stream"), {
    target: { value: "unread" },
  });
  expect(screen.getByRole("heading", { name: "All signals 5" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Mark all read" }));
  expect(screen.getByRole("heading", { name: "All signals 0" })).toBeTruthy();
  expect(
    screen.getByRole("heading", { name: "No unread signals" }),
  ).toBeTruthy();
  expect(
    screen.getByText("All caught up. Read signals remain in All signals."),
  ).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "No activity yet" })).toBeNull();
  expect(
    screen.queryByRole("button", { name: /Reconnect scenarios are running/ }),
  ).toBeNull();
  fireEvent.change(screen.getByLabelText("Filter signal stream"), {
    target: { value: "all" },
  });
  expect(screen.getByRole("heading", { name: "All signals 6" })).toBeTruthy();
  first.unmount();

  render(<CentralCommand />);
  fireEvent.click(screen.getByRole("button", { name: "Signal stream" }));
  fireEvent.change(screen.getByLabelText("Filter signal stream"), {
    target: { value: "unread" },
  });
  expect(screen.getByRole("heading", { name: "All signals 0" })).toBeTruthy();
  expect(
    screen.getByRole("heading", { name: "No unread signals" }),
  ).toBeTruthy();
});

test("a draft dialog wraps Tab and Shift+Tab and restores page scrolling when dismissed", () => {
  document.body.style.overflow = "auto";
  render(<CentralCommand />);
  fireEvent.click(screen.getByRole("button", { name: "New sample session" }));
  const dialog = screen.getByRole("dialog", {
    name: "Give the next agent a mission.",
  });
  const first = within(dialog).getByRole("button", {
    name: "Close new session",
  });
  const last = within(dialog).getByRole("button", {
    name: "Create sample session",
  });
  expect(document.body.style.overflow).toBe("hidden");
  first.focus();
  fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
  expect(document.activeElement).toBe(last);
  fireEvent.keyDown(last, { key: "Tab" });
  expect(document.activeElement).toBe(first);
  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.body.style.overflow).toBe("auto");
});

test("live session details trap focus between their close control and real-session link", () => {
  render(<CentralCommand live />);
  fireEvent.click(screen.getByRole("button", { name: "Open Live compiler" }));
  const dialog = screen.getByRole("dialog", {
    name: "Live compiler session details",
  });
  const first = within(dialog).getByRole("button", {
    name: "Close session details",
  });
  const last = within(dialog).getByRole("link", { name: "Open live session" });
  first.focus();
  fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
  expect(document.activeElement).toBe(last);
  fireEvent.keyDown(last, { key: "Tab" });
  expect(document.activeElement).toBe(first);
});

test("Ctrl+K from a draft replaces it with one focus-trapped command palette", () => {
  render(<CentralCommand />);
  fireEvent.click(screen.getByRole("button", { name: "New sample session" }));
  expect(
    screen.getByRole("dialog", { name: "Give the next agent a mission." }),
  ).toBeTruthy();
  fireEvent.keyDown(window, { key: "k", ctrlKey: true });
  expect(
    screen.queryByRole("dialog", { name: "Give the next agent a mission." }),
  ).toBeNull();
  expect(screen.getAllByRole("dialog")).toHaveLength(1);
  const palette = screen.getByRole("dialog", { name: "Command palette" });
  const first = within(palette).getByLabelText("Command search");
  const controls = within(palette).getAllByRole("button");
  const last = controls[controls.length - 1];
  first.focus();
  fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
  expect(document.activeElement).toBe(last);
  fireEvent.keyDown(last, { key: "Tab" });
  expect(document.activeElement).toBe(first);
  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
});
