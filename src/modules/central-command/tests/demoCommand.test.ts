import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";

import { useDemoCommand } from "@/modules/central-command/hooks/useDemoCommand";

beforeEach(() => {
  localStorage.clear();
});

test("a decision resumes its owner, records one signal, and survives remount without touching auth storage", () => {
  localStorage.setItem("auth-token", "unrelated-existing-login");
  const first = renderHook(() => useDemoCommand());
  const eventCount = first.result.current.events.length;
  act(() => first.result.current.resolve("shieldwall", true));
  expect(
    first.result.current.decisions.find(
      (decision) => decision.id === "shieldwall",
    )?.status,
  ).toBe("accepted");
  expect(
    first.result.current.sessions.find((session) => session.id === "board")
      ?.status,
  ).toBe("running");
  expect(first.result.current.events).toHaveLength(eventCount + 1);
  act(() => first.result.current.resolve("shieldwall", true));
  expect(first.result.current.events).toHaveLength(eventCount + 1);
  first.unmount();

  const restored = renderHook(() => useDemoCommand());
  expect(
    restored.result.current.decisions.filter(
      (decision) => decision.status === "pending",
    ),
  ).toHaveLength(1);
  expect(
    restored.result.current.sessions
      .find((session) => session.id === "board")
      ?.messages.at(-1),
  ).toContain("Your response: Keep current rule");
  expect(localStorage.getItem("auth-token")).toBe("unrelated-existing-login");
});

test("requesting an alternative records the choice without presenting the work as running", () => {
  const { result } = renderHook(() => useDemoCommand());
  act(() => result.current.resolve("save-format", false));
  expect(
    result.current.decisions.find((decision) => decision.id === "save-format")
      ?.status,
  ).toBe("declined");
  expect(
    result.current.sessions.find((session) => session.id === "review")?.status,
  ).toBe("idle");
  expect(result.current.events[0].title).toBe("Alternative requested");
});

test("pause and resume persist for sample sessions and reset restores the initial mission", () => {
  const first = renderHook(() => useDemoCommand());
  act(() => first.result.current.togglePause("network"));
  first.unmount();
  const restored = renderHook(() => useDemoCommand());
  expect(
    restored.result.current.sessions.find((session) => session.id === "network")
      ?.status,
  ).toBe("paused");
  act(() => restored.result.current.togglePause("network"));
  expect(
    restored.result.current.sessions.find((session) => session.id === "network")
      ?.status,
  ).toBe("running");
  act(() => restored.result.current.markRead());
  expect(restored.result.current.events.every((event) => event.read)).toBe(
    true,
  );
  act(() => restored.result.current.reset());
  expect(restored.result.current.sessions).toHaveLength(6);
  expect(
    restored.result.current.decisions.filter(
      (decision) => decision.status === "pending",
    ),
  ).toHaveLength(2);
  expect(restored.result.current.events.some((event) => !event.read)).toBe(
    true,
  );
});

test("a new sample session is a persisted draft with no active agent", () => {
  const first = renderHook(() => useDemoCommand());
  act(() =>
    first.result.current.addSession(
      "Morning verification",
      "Review the POC",
      "codex",
    ),
  );
  first.unmount();
  const restored = renderHook(() => useDemoCommand());
  const draft = restored.result.current.sessions.find(
    (session) => session.title === "Morning verification",
  );
  expect(draft).toMatchObject({
    provider: "codex",
    status: "idle",
    task: "Review the POC",
  });
  expect(draft?.messages).toContain(
    "Sample session created. No agent process was started.",
  );
});

test("corrupt storage falls back to a usable sample workspace", () => {
  localStorage.setItem("central-command-demo-v1", "{invalid");
  const { result } = renderHook(() => useDemoCommand());
  expect(result.current.sessions).toHaveLength(6);
  act(() => result.current.resolve("shieldwall", true));
  expect(
    result.current.decisions.find((decision) => decision.id === "shieldwall")
      ?.status,
  ).toBe("accepted");
});

test("an incomplete persisted record cannot break the deck before Reset is available", () => {
  localStorage.setItem(
    "central-command-demo-v1",
    JSON.stringify({ version: 1, sessions: [null], decisions: [], events: [] }),
  );
  const { result } = renderHook(() => useDemoCommand());
  expect(result.current.sessions).toHaveLength(6);
  expect(
    result.current.sessions.every(
      (session) => typeof session.title === "string",
    ),
  ).toBe(true);
  act(() => result.current.reset());
  expect(
    result.current.decisions.filter(
      (decision) => decision.status === "pending",
    ),
  ).toHaveLength(2);
});
