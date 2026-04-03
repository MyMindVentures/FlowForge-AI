import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProjectSettings from './ProjectSettings';
import { ToastProvider } from './Toast';

let mockUser = {
  uid: 'user1',
  email: 'lacometta33@gmail.com',
  displayName: 'Test User'
};

// Mock Firebase and AuditService
vi.mock('../lib/supabase/appClient', () => ({
  auth: {
    get currentUser() {
      return mockUser;
    }
  },
  db: {}
}));

vi.mock('../services/audit', () => ({
  AuditService: {
    log: vi.fn()
  },
  AuditAction: {
    PROJECT_UPDATED: 'PROJECT_UPDATED'
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
  members: [],
  repositories: [],
  isFavorite: false,
  lastModifiedBy: {
    uid: 'user1',
    email: 'lacometta33@gmail.com',
    timestamp: new Date().toISOString(),
    action: 'Initial creation'
  }
};

describe('ProjectSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly and shows user attribution', () => {
    render(
      <ToastProvider>
        <ProjectSettings project={mockProject} onUpdate={vi.fn()} onBack={() => {}} />
      </ToastProvider>
    );
    expect(screen.getByText('Project Settings')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Project')).toBeInTheDocument();
    expect(screen.getByText(/Last modified by/)).toBeInTheDocument();
    expect(screen.getByText('lacometta33@gmail.com')).toBeInTheDocument();
  });

  it('enables save button when changes are made', async () => {
    render(
      <ToastProvider>
        <ProjectSettings project={mockProject} onUpdate={vi.fn()} onBack={() => {}} />
      </ToastProvider>
    );
    
    const saveButton = screen.getByText('Save Changes').closest('button');
    expect(saveButton).toBeDisabled();

    const nameInput = screen.getByDisplayValue('Test Project');
    fireEvent.change(nameInput, { target: { value: 'Updated Project' } });

    expect(saveButton).not.toBeDisabled();
    expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
  });

  it('calls onUpdate and shows success state on save', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(
      <ToastProvider>
        <ProjectSettings project={mockProject} onUpdate={onUpdate} onBack={() => {}} />
      </ToastProvider>
    );
    
    const nameInput = screen.getByDisplayValue('Test Project');
    fireEvent.change(nameInput, { target: { value: 'Updated Project' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalled();
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });
  });

  it('discards changes when discard button is clicked', () => {
    render(
      <ToastProvider>
        <ProjectSettings project={mockProject} onUpdate={vi.fn()} onBack={() => {}} />
      </ToastProvider>
    );
    
    const nameInput = screen.getByDisplayValue('Test Project');
    fireEvent.change(nameInput, { target: { value: 'Updated Project' } });

    const discardButton = screen.getByText('Discard');
    fireEvent.click(discardButton);

    expect(screen.getByDisplayValue('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Up to date')).toBeInTheDocument();
  });

  it('shows access denied for non-owner/non-admin', () => {
    const restrictedProject = { ...mockProject, ownerId: 'other-user' };
    
    // Change mock user for this test
    mockUser = { uid: 'other-user-2', email: 'other@gmail.com', displayName: 'Other User' };
    
    render(
      <ToastProvider>
        <ProjectSettings project={restrictedProject} onUpdate={vi.fn()} onBack={() => {}} />
      </ToastProvider>
    );
    
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    
    // Reset mock user
    mockUser = { uid: 'user1', email: 'lacometta33@gmail.com', displayName: 'Test User' };
  });
});


