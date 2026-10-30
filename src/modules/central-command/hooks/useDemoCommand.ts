import { useState } from "react";

import { createDemoState } from "@/modules/central-command/demoData";

const STORAGE_KEY = "central-command-demo-v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function hasStrings(value: Record<string, unknown>, fields: string[]) {
  return fields.every((field) => typeof value[field] === "string");
}

function isDemoState(
  value: unknown,
): value is ReturnType<typeof createDemoState> {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !Array.isArray(value.sessions) ||
    !Array.isArray(value.decisions) ||
    !Array.isArray(value.events)
  )
    return false;
  // Browser storage is editable and can survive older POC builds. Validate the
  // fields the deck reads, so a partial record cannot make even Reset unusable.
  return (
    value.sessions.every(
      (session) =>
        isRecord(session) &&
        hasStrings(session, [
          "id",
          "title",
          "role",
          "provider",
          "project",
          "host",
          "status",
          "task",
          "branch",
        ]) &&
        typeof session.updatedAt === "number" &&
        Number.isFinite(session.updatedAt) &&
        Array.isArray(session.messages) &&
        session.messages.every((message) => typeof message === "string"),
    ) &&
    value.decisions.every(
      (decision) =>
        isRecord(decision) &&
        hasStrings(decision, [
          "id",
          "sessionId",
          "title",
          "detail",
          "kind",
          "accept",
          "status",
        ]) &&
        typeof decision.createdAt === "number" &&
        Number.isFinite(decision.createdAt),
    ) &&
    value.events.every(
      (event) =>
        isRecord(event) &&
        hasStrings(event, ["id", "sessionId", "title", "detail", "kind"]) &&
        typeof event.at === "number" &&
        Number.isFinite(event.at) &&
        typeof event.read === "boolean",
    )
  );
}

/** Owns the isolated sample workspace; never sends instructions to real agents. */
export function useDemoCommand() {
  // Keep demo decisions and session changes across refreshes, separately from real sessions.
  const [state, setState] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (isDemoState(saved)) return saved;
    } catch {
      /* A malformed or unavailable browser store starts a fresh demo. */
    }
    return createDemoState();
  });

  const update = (
    change: (
      current: ReturnType<typeof createDemoState>,
    ) => ReturnType<typeof createDemoState>,
  ) => {
    setState((current) => {
      const next = change(current);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* In-memory demo remains usable. */
      }
      return next;
    });
  };

  const resolve = (id: string, accepted: boolean) =>
    update((current) => {
      const decision = current.decisions.find(
        (item) => item.id === id && item.status === "pending",
      );
      if (!decision) return current;
      const at = Date.now();
      const summary = accepted ? decision.accept : "Alternative requested";
      return {
        ...current,
        decisions: current.decisions.map((item) =>
          item.id === id
            ? { ...item, status: accepted ? "accepted" : "declined" }
            : item,
        ),
        sessions: current.sessions.map((session) =>
          session.id === decision.sessionId
            ? {
                ...session,
                status: accepted ? "running" : "idle",
                updatedAt: at,
                messages: [...session.messages, `Your response: ${summary}.`],
              }
            : session,
        ),
        events: [
          {
            id: `event-${at}-${id}`,
            sessionId: decision.sessionId,
            title: summary,
            detail: "Your decision was recorded in the sample workspace.",
            kind: "decision",
            at,
            read: false,
          },
          ...current.events,
        ],
      };
    });
  const togglePause = (id: string) =>
    update((current) => ({
      ...current,
      sessions: current.sessions.map((session) =>
        session.id === id
          ? {
              ...session,
              status: session.status === "paused" ? "running" : "paused",
              updatedAt: Date.now(),
            }
          : session,
      ),
    }));
  const markRead = () =>
    update((current) => ({
      ...current,
      events: current.events.map((event) => ({ ...event, read: true })),
    }));
  const addSession = (title: string, task: string, provider: string) =>
    update((current) => {
      const at = Date.now();
      const id = `session-${at}`;
      return {
        ...current,
        sessions: [
          ...current.sessions,
          {
            id,
            title,
            role: "Specialist",
            task,
            provider,
            project: "Central Command",
            host: provider === "codex" ? "Windows workstation" : "Mac Studio",
            status: "idle",
            branch: "unassigned",
            updatedAt: at,
            messages: [
              `Mission drafted: ${task}`,
              "Sample session created. No agent process was started.",
            ],
          },
        ],
        events: [
          {
            id: `event-${at}`,
            sessionId: id,
            title: `Session drafted: ${title}`,
            detail: "Ready to explore in the sample workspace.",
            kind: "progress",
            at,
            read: false,
          },
          ...current.events,
        ],
      };
    });
  const reset = () => update(() => createDemoState());
  return { ...state, resolve, togglePause, markRead, addSession, reset };
}
