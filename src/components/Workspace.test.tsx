import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Workspace from './Workspace';
import { ToastProvider } from './Toast';

// Mock the hooks
vi.mock('../firebase', () => ({
  db: {},
  auth: { currentUser: { uid: '123' } }
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn().mockResolvedValue({ id: 'new-session-id' }),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn((q, cb) => {
    cb({ docs: [] });
    return vi.fn();
  }),
  orderBy: vi.fn(),
  limit: vi.fn(),
  writeBatch: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  setDoc: vi.fn()
}));

const mockProject = {
  id: '1',
  name: 'Test Project',
  description: 'Test Description',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ownerId: 'user1',
  status: 'Active' as const,
  members: [],
  repositories: [],
  isFavorite: false
};

describe('Workspace', () => {
  it('renders correctly', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <ToastProvider>
            <Workspace project={mockProject} onApproveSuggestion={vi.fn()} />
          </ToastProvider>
        </MemoryRouter>
      );
    });
    expect(screen.getByText('Feature Ideation')).toBeInTheDocument();
  });
});
