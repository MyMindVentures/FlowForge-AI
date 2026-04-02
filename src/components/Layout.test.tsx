import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Layout from './Layout';
import * as AuthContext from '../context/AuthContext';
import * as ProjectContext from '../context/ProjectContext';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

describe('Layout', () => {
  it('renders sidebar and children', () => {
    const mockLogout = vi.fn();
    
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { uid: 'user1', email: 'test@test.com', role: 'Architect' } as any,
      profile: { role: 'Architect', onboarded: true } as any,
      loading: false,
      login: vi.fn(),
      logout: mockLogout,
      updateProfile: vi.fn(),
      setRole: vi.fn()
    });

    vi.spyOn(ProjectContext, 'useProject').mockReturnValue({
      projects: [{ id: 'p1', name: 'Project 1', description: 'Desc 1', status: 'Active', ownerId: 'user1', members: [], repositories: [], isFavorite: false, createdAt: '', updatedAt: '' }],
      selectedProject: { id: 'p1', name: 'Project 1', description: 'Desc 1', status: 'Active', ownerId: 'user1', members: [], repositories: [], isFavorite: false, createdAt: '', updatedAt: '' },
      updateProject: vi.fn(),
      features: [],
      versions: [],
      syncStatus: 'synced',
      addVersion: vi.fn(),
      updateVersion: vi.fn(),
      removeVersion: vi.fn(),
      loading: false,
      projectsLoading: false,
      setSelectedProject: vi.fn(),
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

    render(
      <MemoryRouter>
        <Layout projectName="Test Project" onLogout={mockLogout} isAdmin={false} syncStatus="synced">
          <div data-testid="child-content">Child Content</div>
        </Layout>
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getAllByText('Projects')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Workspace')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Alerts')[0]).toBeInTheDocument();
  });

  it('calls onLogout when logout button is clicked', () => {
    const mockLogout = vi.fn();
    
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { uid: 'user1', email: 'test@test.com', role: 'Architect' } as any,
      profile: { role: 'Architect', onboarded: true } as any,
      loading: false,
      login: vi.fn(),
      logout: mockLogout,
      updateProfile: vi.fn(),
      setRole: vi.fn()
    });

    vi.spyOn(ProjectContext, 'useProject').mockReturnValue({
      projects: [],
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
      setSelectedProject: vi.fn(),
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

    render(
      <MemoryRouter>
        <Layout projectName="Test Project" onLogout={mockLogout} isAdmin={false} syncStatus="synced">
          <div>Child</div>
        </Layout>
      </MemoryRouter>
    );
    
    // There are two logout buttons (desktop and mobile header)
    const logoutButtons = screen.getAllByTitle('Logout');
    fireEvent.click(logoutButtons[0]);
    expect(mockLogout).toHaveBeenCalled();
  });
});
