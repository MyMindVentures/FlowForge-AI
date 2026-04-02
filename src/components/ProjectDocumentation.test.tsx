import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProjectDocumentation from './ProjectDocumentation';
import { ToastProvider } from './Toast';

// Mock the AgentOrchestrator
vi.mock('../services/ai/orchestrator', () => ({
  AgentOrchestrator: {
    runTask: vi.fn().mockResolvedValue({
      prd: 'PRD Content',
      conceptSummary: 'Concept Summary',
      tagline: 'Tagline'
    })
  },
  AgentTaskType: {
    RESOLVE_CONTEXT: 'RESOLVE_CONTEXT',
    GENERATE_PRD: 'GENERATE_PRD'
  }
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

describe('ProjectDocumentation', () => {
  it('renders correctly', () => {
    render(
      <ToastProvider>
        <ProjectDocumentation project={mockProject} features={[]} onBack={() => {}} />
      </ToastProvider>
    );
    expect(screen.getByText('Generate Specs')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn();
    render(
      <ToastProvider>
        <ProjectDocumentation project={mockProject} features={[]} onBack={onBack} />
      </ToastProvider>
    );
    
    const backButton = screen.getAllByRole('button')[0];
    fireEvent.click(backButton);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
