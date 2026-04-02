import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Admin from './Admin';
import { ToastProvider } from './Toast';

// Mock the hooks
vi.mock('../hooks/useFirestore', () => ({
  useFirestore: () => ({
    data: [],
    loading: false,
    error: null,
    add: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    syncStatus: { status: 'synced' }
  })
}));

describe('Admin', () => {
  it('renders correctly', () => {
    render(
      <ToastProvider>
        <Admin />
      </ToastProvider>
    );
    expect(screen.getByText('AI Control Center')).toBeInTheDocument();
  });
});
