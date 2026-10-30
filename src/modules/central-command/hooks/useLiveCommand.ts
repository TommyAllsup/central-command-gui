import { useCallback, useEffect, useRef, useState } from "react";

import { loadLiveCommandSessions } from "@/modules/central-command/api/liveCommand";
import type { LiveCommandSession, Project } from "@/shared/types";

const POLL_INTERVAL_MS = 15_000;

/** Used by Central Command to refresh real sessions only while the live workspace is selected. */
export function useLiveCommand(enabled: boolean) {
  // Keeps the last successful snapshot visible when a refresh fails.
  const [sessions, setSessions] = useState<LiveCommandSession[]>([]);
  // Tracks in-flight reads so first-load and refresh feedback can be rendered accurately.
  const [loading, setLoading] = useState(false);
  // Holds the current transport failure rather than replacing real data with sample sessions.
  const [error, setError] = useState<string | null>(null);
  // Records when this view last received a complete, successful server snapshot.
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);
  // Carries the server's full count because the command view loads only its recent window.
  const [total, setTotal] = useState(0);
  // Distinguishes a complete small fleet from the capped recent-history window.
  const [hasMore, setHasMore] = useState(false);
  const projectCache = useRef<Project[] | undefined>();
  const requestLifecycle = useRef({
    mounted: false,
    sequence: 0,
    inFlight: false,
  });

  const load = useCallback(
    async (refreshProjects: boolean) => {
      const lifecycle = requestLifecycle.current;
      if (!enabled || !lifecycle.mounted || lifecycle.inFlight) return;
      const sequence = ++lifecycle.sequence;
      lifecycle.inFlight = true;
      setLoading(true);
      try {
        const snapshot = await loadLiveCommandSessions(
          refreshProjects ? undefined : projectCache.current,
        );
        if (!lifecycle.mounted || sequence !== lifecycle.sequence) return;
        projectCache.current = snapshot.projects;
        setSessions(snapshot.sessions);
        setTotal(snapshot.total);
        setHasMore(snapshot.hasMore);
        setError(null);
        setRefreshedAt(new Date().toISOString());
      } catch (cause) {
        if (!lifecycle.mounted || sequence !== lifecycle.sequence) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to reach the local session server.",
        );
      } finally {
        if (lifecycle.mounted && sequence === lifecycle.sequence) {
          lifecycle.inFlight = false;
          setLoading(false);
        }
      }
    },
    [enabled],
  );

  const refresh = useCallback(() => load(true), [load]);

  useEffect(() => {
    const lifecycle = requestLifecycle.current;
    lifecycle.mounted = true;
    lifecycle.inFlight = false;
    if (enabled) void load(true);

    const timer = enabled
      ? window.setInterval(() => {
          if (document.visibilityState !== "hidden") void load(false);
        }, POLL_INTERVAL_MS)
      : undefined;

    return () => {
      lifecycle.mounted = false;
      ++lifecycle.sequence;
      lifecycle.inFlight = false;
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [enabled, load]);

  return {
    sessions,
    loading: enabled && loading,
    error,
    refreshedAt,
    total,
    hasMore,
    refresh,
  };
}
