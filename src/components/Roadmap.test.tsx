import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Roadmap from './Roadmap';
import { ToastProvider } from './Toast';

const mockProject = {
  id: '1',
  name: 'Test Project',
  description: 'Test Description',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ownerId: 'user1',
  status: 'Active' as const,
  members: ['user1']
};

describe('Roadmap', () => {
  it('renders correctly', () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <Roadmap 
            features={[]} 
            versions={[]} 
            onAddVersion={vi.fn()} 
            onUpdateVersion={vi.fn()} 
            onBack={vi.fn()} 
          />
        </ToastProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('No versions found')).toBeInTheDocument();
  });
});
