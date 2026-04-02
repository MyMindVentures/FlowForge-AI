import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProjectSettings from './ProjectSettings';
import { ToastProvider } from './Toast';

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

describe('ProjectSettings', () => {
  it('renders correctly', () => {
    render(
      <ToastProvider>
        <ProjectSettings project={mockProject} onUpdate={vi.fn()} onBack={() => {}} />
      </ToastProvider>
    );
    expect(screen.getByText('Project Settings')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Project')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn();
    render(
      <ToastProvider>
        <ProjectSettings project={mockProject} onUpdate={vi.fn()} onBack={onBack} />
      </ToastProvider>
    );
    
    const backButton = screen.getByText('Back to Workspace');
    fireEvent.click(backButton);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
