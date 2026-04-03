import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FeatureOverview from './FeatureOverview';

const baseProject = {
  id: 'project-1',
  name: 'FlowForge AI',
  description: 'desc',
  ownerId: 'user-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: 'Active' as const,
  isFavorite: false,
  members: [],
  repositories: [],
};

const baseFeature = {
  id: 'feature-1',
  projectId: 'project-1',
  featureCode: 'FEAT-1',
  title: 'Feature One',
  status: 'Pending' as const,
  priority: 'High' as const,
  problem: 'Problem',
  solution: 'Solution',
  why: 'Why',
  nonTechnicalDescription: 'NTD',
  technicalDescription: 'TD',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  archived: false,
  deliveryChecklist: {
    frontendImplemented: false,
    backendImplemented: false,
    databaseImplemented: false,
    aiImplemented: false,
    testsImplemented: false,
    docsUpdated: false,
    qaApproved: false,
    readyForRelease: false,
  },
};

describe('FeatureOverview', () => {
  it('renders implementation checklist', () => {
    render(
      <FeatureOverview
        project={baseProject as any}
        feature={baseFeature as any}
        isEditing={false}
        editedFeature={baseFeature as any}
        setEditedFeature={vi.fn()}
        isUpdatingStatus={false}
        onUpdateStatus={vi.fn()}
        onArchive={vi.fn()}
      />
    );

    expect(screen.getByText('Implementation Checklist')).toBeInTheDocument();
    expect(screen.getByText('Frontend Implemented')).toBeInTheDocument();
    expect(screen.getByText('Backend Implemented')).toBeInTheDocument();
  });

  it('toggles checklist item while editing', () => {
    const setEditedFeature = vi.fn();

    render(
      <FeatureOverview
        project={baseProject as any}
        feature={baseFeature as any}
        isEditing={true}
        editedFeature={baseFeature as any}
        setEditedFeature={setEditedFeature}
        isUpdatingStatus={false}
        onUpdateStatus={vi.fn()}
        onArchive={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /frontend implemented/i }));
    expect(setEditedFeature).toHaveBeenCalled();
  });
});