import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';

import { useProjectsState } from '@/modules/project-workspace/hooks/useProjectsState';
import type { Project } from '@/shared/types';

const projectsResponse = vi.hoisted(() => vi.fn());
vi.mock('@/shared/api', () => ({ api: {
  projects: () => projectsResponse(),
  projectTaskmaster: () => Promise.resolve({ ok: false }),
  sessionDetails: () => Promise.resolve({ ok: false }),
  projectSessions: () => Promise.resolve({ ok: false }),
} }));

const project: Project = {
  projectId: 'engine', displayName: 'Engine', fullPath: 'C:\\src\\engine',
  sessions: [{ id: 'live-session', summary: 'Build engine', __provider: 'codex' }],
};

beforeEach(() => {
  localStorage.clear();
  projectsResponse.mockResolvedValue({ ok: true, json: async () => [project] });
});

test('project selection and new-session drafts stay in the workspace rather than opening the command deck', async () => {
  const navigate = vi.fn();
  const { result } = renderHook(() => useProjectsState({
    navigate, subscribe: () => () => {}, isMobile: false, isSessionProcessing: () => false,
  }));
  await waitFor(() => expect(result.current.projects).toHaveLength(1));

  act(() => result.current.handleProjectSelect(project));
  expect(navigate).toHaveBeenLastCalledWith('/workspace');
  expect(result.current.selectedProject?.projectId).toBe('engine');
  act(() => result.current.handleNewSession(project));
  expect(navigate).toHaveBeenLastCalledWith('/workspace');
  expect(result.current.selectedProject?.projectId).toBe('engine');
  expect(result.current.selectedSession).toBeNull();
  expect(result.current.newSessionTrigger).toBe(1);
});

test('removing the selected session or project returns to the workspace', async () => {
  const navigate = vi.fn();
  const { result } = renderHook(() => useProjectsState({
    navigate, subscribe: () => () => {}, isMobile: false, isSessionProcessing: () => false,
  }));
  await waitFor(() => expect(result.current.projects).toHaveLength(1));
  act(() => result.current.handleProjectSelect(project));
  act(() => result.current.handleSessionSelect({ id: 'live-session', __provider: 'codex', __projectId: 'engine' }));
  expect(navigate).toHaveBeenLastCalledWith('/session/live-session');
  act(() => result.current.handleSessionDelete('live-session'));
  expect(navigate).toHaveBeenLastCalledWith('/workspace');
  expect(result.current.selectedSession).toBeNull();
  act(() => result.current.handleProjectDelete('engine'));
  expect(navigate).toHaveBeenLastCalledWith('/workspace');
  expect(result.current.selectedProject).toBeNull();
});
