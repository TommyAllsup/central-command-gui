import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import {
  loadLiveCommandSessions,
  loadLiveCommandTranscript,
} from "@/modules/central-command/api/liveCommand";
import { useLiveCommand } from "@/modules/central-command/hooks/useLiveCommand";
import { api } from "@/shared/api";

const jsonResponse = (body: unknown, status = 200) =>
  Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );

beforeEach(() => {
  vi.spyOn(api, "projects").mockImplementation(() =>
    jsonResponse([
      {
        projectId: "windows",
        displayName: "Central Command",
        fullPath: "C:\\src\\central-command",
      },
      {
        projectId: "mac",
        displayName: "Mac workspace",
        fullPath: "/Users/tommy/src/game",
      },
    ]),
  );
  vi.spyOn(api, "recentConversations").mockImplementation(() =>
    jsonResponse({
      data: {
        conversations: [
          {
            sessionId: "historical",
            provider: "codex",
            projectId: "windows",
            projectDisplayName: "fallback",
            sessionTitle: "Finished changes",
            lastActivity: "2026-10-30T01:00:00.000Z",
          },
          {
            sessionId: "active",
            provider: "claude",
            projectId: "mac",
            projectDisplayName: "fallback",
            sessionTitle: "Working session",
            lastActivity: "2026-10-29T23:00:00.000Z",
          },
        ],
        total: 12,
        hasMore: true,
      },
    }),
  );
  vi.spyOn(api, "runningSessions").mockImplementation(() =>
    jsonResponse({
      data: {
        sessions: [
          {
            sessionId: "active",
            provider: "claude",
            startedAt: 1_700_000_000_000,
            statusText: "Running in the Claude CLI",
          },
        ],
      },
    }),
  );
});

test("uses reported activity instead of recency and preserves Windows/Mac paths", async () => {
  const snapshot = await loadLiveCommandSessions();
  expect(
    snapshot.sessions.map((session) => [session.id, session.status]),
  ).toEqual([
    ["active", "running"],
    ["historical", "idle"],
  ]);
  expect(snapshot.sessions[0].projectPath).toBe("/Users/tommy/src/game");
  expect(snapshot.sessions[1].projectPath).toBe("C:\\src\\central-command");
  expect(snapshot.sessions[0].snippet).toBe("Running in the Claude CLI");
  expect(
    snapshot.sessions.every((session) => session.pendingApprovals === null),
  ).toBe(true);
  expect(snapshot.total).toBe(12);
  expect(snapshot.hasMore).toBe(true);
});

test("includes active work outside the recent history window", async () => {
  vi.mocked(api.runningSessions).mockImplementation(() =>
    jsonResponse({
      data: {
        sessions: [
          {
            sessionId: "older",
            provider: "codex",
            startedAt: 1_700_000_000_000,
            background: true,
          },
        ],
      },
    }),
  );
  vi.spyOn(api, "sessionDetails").mockImplementation(() =>
    jsonResponse({
      data: {
        sessionId: "older",
        provider: "codex",
        summary: "Long build",
        lastActivity: null,
        project: { fullPath: "C:\\build", displayName: "Build farm" },
      },
    }),
  );
  const snapshot = await loadLiveCommandSessions();
  expect(snapshot.sessions[0]).toMatchObject({
    id: "older",
    title: "Long build",
    status: "running",
    projectPath: "C:\\build",
    snippet: "Background tasks are running.",
    pendingApprovals: null,
  });
});

test("does not hide an active session when its details cannot load", async () => {
  vi.mocked(api.runningSessions).mockImplementation(() =>
    jsonResponse({
      data: {
        sessions: [
          {
            sessionId: "older",
            provider: "codex",
            startedAt: 1_700_000_000_000,
          },
        ],
      },
    }),
  );
  vi.spyOn(api, "sessionDetails").mockImplementation(() =>
    jsonResponse({ error: "No metadata" }, 404),
  );
  const snapshot = await loadLiveCommandSessions();
  expect(snapshot.sessions[0]).toMatchObject({
    id: "older",
    status: "running",
    projectPath: "",
    projectName: "Unknown project",
  });
});

test("rejects malformed responses instead of showing an empty connected fleet", async () => {
  vi.mocked(api.runningSessions).mockImplementation(() =>
    jsonResponse({ data: {} }),
  );
  await expect(loadLiveCommandSessions()).rejects.toThrow(
    "unexpected response",
  );
});

test("reads only a bounded transcript tail on demand", async () => {
  const history = vi
    .spyOn(api.providers, "sessionMessages")
    .mockImplementation(() =>
      jsonResponse({
        data: {
          messages: [
            {
              id: "m1",
              kind: "text",
              role: "assistant",
              content: "Build complete",
            },
          ],
          total: 90,
          hasMore: true,
        },
      }),
    );
  const transcript = await loadLiveCommandTranscript("active");
  expect(history).toHaveBeenCalledWith("active", { limit: 30, offset: 0 });
  expect(transcript.messages[0].content).toBe("Build complete");
});

test("sample mode does not contact real session APIs", () => {
  renderHook(() => useLiveCommand(false));
  expect(api.recentConversations).not.toHaveBeenCalled();
  expect(api.runningSessions).not.toHaveBeenCalled();
  expect(api.projects).not.toHaveBeenCalled();
});

test("a refresh failure retains real sessions with an explicit error and prior freshness time", async () => {
  const { result } = renderHook(() => useLiveCommand(true));
  await waitFor(() => expect(result.current.sessions).toHaveLength(2));
  const refreshedAt = result.current.refreshedAt;
  vi.mocked(api.runningSessions).mockRejectedValue(
    new Error("Local server disconnected"),
  );
  await act(async () => {
    await result.current.refresh();
  });
  expect(result.current.sessions).toHaveLength(2);
  expect(result.current.error).toBe("Local server disconnected");
  expect(result.current.refreshedAt).toBe(refreshedAt);
  expect(result.current.loading).toBe(false);
});

test("ignores a stale response after live mode is disabled", async () => {
  let completeRunning: (response: Response) => void = () => {};
  vi.mocked(api.runningSessions).mockImplementation(
    () =>
      new Promise((resolve) => {
        completeRunning = resolve;
      }),
  );
  const { result, rerender } = renderHook(
    ({ enabled }) => useLiveCommand(enabled),
    { initialProps: { enabled: true } },
  );
  await waitFor(() => expect(api.runningSessions).toHaveBeenCalledOnce());
  rerender({ enabled: false });
  await act(async () => {
    completeRunning(
      new Response(JSON.stringify({ data: { sessions: [] } }), { status: 200 }),
    );
    await Promise.resolve();
  });
  expect(result.current.sessions).toHaveLength(0);
  expect(result.current.refreshedAt).toBeNull();
  expect(result.current.loading).toBe(false);
});
