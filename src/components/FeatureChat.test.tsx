import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FeatureChat from './FeatureChat';
import { ToastProvider } from './Toast';

// Mock the hooks
vi.mock('../context/ProjectContext', () => ({
  useProject: () => ({
    features: []
  })
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

const mockFeature = {
  id: 'f1',
  projectId: '1',
  title: 'Test Feature',
  nonTechnicalDescription: 'Desc',
  technicalDescription: 'Tech Desc',
  priority: 'High' as const,
  status: 'Pending' as const,
  featureCode: 'FEAT-1234',
  problem: 'Prob',
  solution: 'Sol',
  why: 'Why',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  archived: false
};

describe('FeatureChat', () => {
  it('renders correctly', () => {
    render(
      <ToastProvider>
        <FeatureChat project={mockProject} feature={mockFeature} onBack={() => {}} />
      </ToastProvider>
    );
    expect(screen.getByText('Test Feature')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn();
    render(
      <ToastProvider>
        <FeatureChat project={mockProject} feature={mockFeature} onBack={onBack} />
      </ToastProvider>
    );
    
    const backButton = screen.getAllByRole('button')[0];
    fireEvent.click(backButton);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});


