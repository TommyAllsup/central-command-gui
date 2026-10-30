import { api, readApiJson } from "@/shared/api";
import type {
  LLMProvider,
  LiveCommandSession,
  NormalizedMessage,
  Project,
  RecentConversationListItem,
} from "@/shared/types";

type RunningSession = {
  sessionId: string;
  provider: LLMProvider;
  startedAt: number;
  statusText?: string;
  background?: boolean;
};

type SessionDetails = {
  sessionId: string;
  provider: LLMProvider;
  summary: string;
  lastActivity: string | null;
  project: { fullPath: string; displayName: string } | null;
};

/** Used by the Central Command hook to merge history with the backend's authoritative activity report. */
export async function loadLiveCommandSessions(cachedProjects?: Project[]) {
  // The projects endpoint synchronizes CLI history into the database. Await it
  // before reading recent rows on first load, otherwise a new install can
  // appear empty until the next poll even though discovery has just succeeded.
  const projects =
    cachedProjects ??
    (await api.projects().then((response) => readApiJson<Project[]>(response)));
  const [recentEnvelope, runningEnvelope] = await Promise.all([
    api.recentConversations({ limit: 40, offset: 0 }).then((response) =>
      readApiJson<{
        data: {
          conversations: RecentConversationListItem[];
          total: number;
          hasMore: boolean;
        };
      }>(response),
    ),
    api.runningSessions().then((response) =>
      readApiJson<{
        data: { sessions: RunningSession[] };
      }>(response),
    ),
  ]);

  // Do not turn malformed or incompatible API responses into a convincing empty fleet.
  if (
    !Array.isArray(recentEnvelope.data?.conversations) ||
    !Array.isArray(runningEnvelope.data?.sessions) ||
    !Array.isArray(projects)
  ) {
    throw new Error(
      "The session server returned an unexpected response. Refresh or check its version.",
    );
  }

  const activeById = new Map(
    runningEnvelope.data.sessions.map((session) => [
      session.sessionId,
      session,
    ]),
  );
  const projectsById = new Map(
    projects.map((project) => [project.projectId, project]),
  );
  const sessions: LiveCommandSession[] = recentEnvelope.data.conversations.map(
    (session) => {
      const active = activeById.get(session.sessionId);
      const project = session.projectId
        ? projectsById.get(session.projectId)
        : undefined;
      return {
        id: session.sessionId,
        title: session.sessionTitle || session.sessionId,
        provider: session.provider,
        projectName:
          project?.displayName ||
          session.projectDisplayName ||
          "Unknown project",
        projectPath: project?.fullPath || project?.path || "",
        updatedAt: session.lastActivity,
        status: active ? "running" : "idle",
        snippet:
          active?.statusText ||
          (active?.background
            ? "Background tasks are running."
            : active
              ? "Active run reported by the local server."
              : "No active run reported by the local server."),
        pendingApprovals: null,
      };
    },
  );

  // A long-running session can fall outside the recent 40. It still belongs in
  // mission control; resolve only those missing rows, not every transcript.
  const recentIds = new Set(sessions.map((session) => session.id));
  const olderActive = Array.from(activeById.values()).filter(
    (session) => !recentIds.has(session.sessionId),
  );
  const olderDetails = await Promise.allSettled(
    olderActive.map((session) =>
      api
        .sessionDetails(session.sessionId)
        .then((response) => readApiJson<{ data: SessionDetails }>(response)),
    ),
  );
  olderActive.forEach((active, index) => {
    const detailResult = olderDetails[index];
    const detail =
      detailResult.status === "fulfilled" ? detailResult.value.data : undefined;
    const startedAt = new Date(active.startedAt);
    sessions.push({
      id: active.sessionId,
      title: detail?.summary || active.sessionId,
      provider: active.provider,
      projectName: detail?.project?.displayName || "Unknown project",
      projectPath: detail?.project?.fullPath || "",
      updatedAt:
        detail?.lastActivity ||
        (Number.isNaN(startedAt.getTime()) ? null : startedAt.toISOString()),
      status: "running",
      snippet:
        active.statusText ||
        (active.background
          ? "Background tasks are running."
          : "Active run reported by the local server."),
      pendingApprovals: null,
    });
  });

  // Keep recent ordering within each state; active work remains visible first.
  sessions.sort(
    (left, right) =>
      Number(right.status === "running") - Number(left.status === "running"),
  );
  return {
    sessions,
    total: Math.max(sessions.length, recentEnvelope.data.total),
    hasMore: recentEnvelope.data.hasMore,
    projects,
  };
}

/** Used by Central Command's session detail to read a bounded tail without loading every agent's transcript. */
export async function loadLiveCommandTranscript(sessionId: string) {
  const response = await api.providers.sessionMessages(sessionId, {
    limit: 30,
    offset: 0,
  });
  const envelope = await readApiJson<{
    data: { messages: NormalizedMessage[]; total: number; hasMore: boolean };
  }>(response);
  if (!Array.isArray(envelope.data?.messages)) {
    throw new Error("The session server did not return a transcript.");
  }
  return envelope.data;
}
