import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AssetManager from './AssetManager';
import { ToastProvider } from './Toast';

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

describe('AssetManager', () => {
  it('renders correctly', () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <AssetManager project={mockProject} features={[]} onBack={() => {}} />
        </ToastProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('Asset Library')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn();
    render(
      <MemoryRouter>
        <ToastProvider>
          <AssetManager project={mockProject} features={[]} onBack={onBack} />
        </ToastProvider>
      </MemoryRouter>
    );
    
    const backButton = screen.getAllByRole('button')[0];
    fireEvent.click(backButton);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
