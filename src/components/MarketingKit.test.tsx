import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MarketingKit from './MarketingKit';
import { ToastProvider } from './Toast';

// Mock the AgentOrchestrator
vi.mock('../services/ai/orchestrator', () => ({
  AgentOrchestrator: {
    runTask: vi.fn().mockResolvedValue({
      taglines: ['Tagline 1'],
      valuePropositions: [{ title: 'Prop 1', description: 'Desc 1' }],
      pitchNarrative: 'Pitch narrative',
      marketingCopy: [{ headline: 'Headline 1', body: 'Body 1' }]
    })
  },
  AgentTaskType: {
    GENERATE_MARKETING_KIT: 'GENERATE_MARKETING_KIT'
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

describe('MarketingKit', () => {
  it('renders correctly', () => {
    render(
      <ToastProvider>
        <MarketingKit project={mockProject} features={[]} onBack={() => {}} />
      </ToastProvider>
    );
    expect(screen.getByText('Marketing Kit')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn();
    render(
      <ToastProvider>
        <MarketingKit project={mockProject} features={[]} onBack={onBack} />
      </ToastProvider>
    );
    
    // The back button is the first button in the header
    const backButton = screen.getAllByRole('button')[0];
    fireEvent.click(backButton);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});


