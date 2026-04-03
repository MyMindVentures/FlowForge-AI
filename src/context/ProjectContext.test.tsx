import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProjectProvider } from './ProjectContext';

const { useSupabaseCollectionMock } = vi.hoisted(() => ({
  useSupabaseCollectionMock: vi.fn(() => ({
    data: [],
    loading: false,
    error: null,
    add: vi.fn(),
    update: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    syncStatus: 'synced',
  })),
}));

vi.mock('./AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'member-123', email: 'member@example.com' },
    profile: { uid: 'member-123', email: 'member@example.com', role: 'Builder' },
  }),
}));

vi.mock('../hooks/useSupabaseCollection', () => ({
  useSupabaseCollection: useSupabaseCollectionMock,
}));

vi.mock('../services/SyncService', () => ({
  SyncService: {
    getSystemProjectMetadata: vi.fn(() => ({ name: 'FlowForge AI' })),
  },
}));

vi.mock('../lib/tasklist/productionTasks', () => ({
  seedProductionTasksForProject: vi.fn(),
}));

describe('ProjectProvider', () => {
  it('loads projects without narrowing to ownerId on the client', () => {
    render(
      <ProjectProvider>
        <div>child</div>
      </ProjectProvider>
    );

    expect(useSupabaseCollectionMock).toHaveBeenCalledWith('projects', []);
  });

  it('replaces a stale selected project id with the first accessible project', async () => {
    localStorage.setItem('selected_project_id', 'stale-project');

    useSupabaseCollectionMock.mockImplementationOnce(() => ({
      data: [
        {
          id: 'project-1',
          name: 'Client Workspace',
          description: 'Accessible project',
          ownerId: 'member-123',
          status: 'Active',
          members: [],
          repositories: [],
          isFavorite: false,
          createdAt: '2026-04-04T00:00:00.000Z',
          updatedAt: '2026-04-04T00:00:00.000Z',
        },
      ],
      loading: false,
      error: null,
      add: vi.fn(),
      update: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      syncStatus: 'synced',
    }));

    render(
      <ProjectProvider>
        <div>child</div>
      </ProjectProvider>
    );

    await waitFor(() => {
      expect(localStorage.getItem('selected_project_id')).toBe('project-1');
    });
  });
});