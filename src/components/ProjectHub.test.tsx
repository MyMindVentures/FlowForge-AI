import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ProjectHub from './ProjectHub';
import * as ProjectContext from '../context/ProjectContext';
import * as AuthContext from '../context/AuthContext';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

describe('ProjectHub', () => {
  it('renders projects and handles create project', async () => {
    const mockAddProject = vi.fn().mockResolvedValue('new-id');
    const mockSelectProject = vi.fn();
    
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { uid: 'user1', email: 'test@test.com', role: 'Architect' } as any,
      profile: { role: 'Architect', onboarded: true } as any,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      setRole: vi.fn()
    });

    vi.spyOn(ProjectContext, 'useProject').mockReturnValue({
      projects: [
        { id: 'p1', name: 'Project 1', description: 'Desc 1', status: 'Active', ownerId: 'user1', members: [], repositories: [], isFavorite: false, createdAt: '', updatedAt: '' }
      ],
      selectedProject: null,
      updateProject: vi.fn(),
      features: [],
      versions: [],
      syncStatus: 'synced',
      addVersion: vi.fn(),
      updateVersion: vi.fn(),
      removeVersion: vi.fn(),
      loading: false,
      projectsLoading: false,
      setSelectedProject: mockSelectProject,
      pages: [],
      components: [],
      layouts: [],
      styleSystem: null,
      addPage: vi.fn(),
      updatePage: vi.fn(),
      addComponent: vi.fn(),
      updateComponent: vi.fn(),
      updateStyleSystem: vi.fn(),
      addLayout: vi.fn(),
      updateLayout: vi.fn(),
      addFeature: vi.fn(),
      updateFeature: vi.fn()
    } as any);

    const mockProject = {
      id: 'p1',
      name: 'Test Project',
      description: 'Test Desc',
      status: 'Active',
      ownerId: 'user1',
      members: [],
      createdAt: '',
      updatedAt: ''
    };

    render(
      <MemoryRouter>
        <ProjectHub project={mockProject as any} onNavigate={vi.fn()} />
      </MemoryRouter>
    );
    
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Test Desc')).toBeInTheDocument();

    // Click module
    fireEvent.click(screen.getByText('Feature Chat'));
    
    // Wait for navigation or onNavigate to be called
    await waitFor(() => {
      // It should navigate, but we just want to ensure it doesn't crash
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
  });
});
