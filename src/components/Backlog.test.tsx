import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Backlog from './Backlog';
import { ToastProvider } from './Toast';

vi.mock('../hooks/useSupabaseCollection', () => ({
  useSupabaseCollection: () => ({
    data: [],
    loading: false,
    error: null,
    add: vi.fn(),
  }),
}));

const mockProject = {
  id: '1',
  name: 'Test Project',
  description: 'Test Description',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ownerId: 'user1',
  status: 'Active' as const,
  members: [{ userId: 'user1', role: 'Architect' as const, joinedAt: new Date().toISOString(), uid: 'user1', email: 'test@test.com' }],
  repositories: [],
  isFavorite: false
};

describe('Backlog', () => {
  it('renders correctly', () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <Backlog project={mockProject} onSelectFeature={vi.fn()} />
        </ToastProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('Feature Backlog')).toBeInTheDocument();
  });
});


