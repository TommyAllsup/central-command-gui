import { render, screen } from '@testing-library/react';
import type { TFunction } from 'i18next';
import { expect, test, vi } from 'vitest';

import SidebarHeader from '@/modules/sidebar/SidebarHeader';

vi.mock('@/modules/sidebar/GitHubStarBadge', () => ({ default: () => null }));

test('the inherited session workspace exposes a named link back to Central Command', () => {
  const noop = () => {};
  render(<SidebarHeader
    isPWA={false} isMobile={false} isLoading={false} projectsCount={0}
    runningSessionsCount={0} archivedSessionsCount={0} isArchivedSessionsLoading={false}
    searchFilter="" onSearchFilterChange={noop} onClearSearchFilter={noop}
    searchMode="projects" onSearchModeChange={noop} onRefresh={noop} isRefreshing={false}
    onCreateProject={noop} onCollapseSidebar={noop} t={((key: string) => key) as TFunction}
  />);
  expect(screen.getByRole('link', { name: 'Command deck' }).getAttribute('href')).toBe('/command');
});
