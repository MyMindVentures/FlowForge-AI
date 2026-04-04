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

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    profile: {
      uid: mockUser.uid,
      email: mockUser.email,
      role: mockUser.email === 'other@gmail.com' ? 'Builder' : 'Admin'
    }
  })
}));

vi.mock('../services/audit', () => ({
  AuditService: {
    log: vi.fn()
  },
  AuditAction: {
    PROJECT_UPDATED: 'PROJECT_UPDATED',
    MEMBER_INVITED: 'MEMBER_INVITED',
    MEMBER_ROLE_UPDATED: 'MEMBER_ROLE_UPDATED',
    MEMBER_REMOVED: 'MEMBER_REMOVED',
    REPO_ADDED: 'REPO_ADDED'
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

  it('adds a validated member invite with the selected role and persists it on save', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);

    render(
      <ToastProvider>
        <ProjectSettings project={mockProject} onUpdate={onUpdate} onBack={() => {}} />
      </ToastProvider>
    );

    fireEvent.change(screen.getByPlaceholderText('Invite by email...'), {
      target: { value: 'NewUser@Example.com' }
    });
    fireEvent.change(screen.getByLabelText('New member role'), {
      target: { value: 'Admin' }
    });

    fireEvent.click(screen.getByRole('button', { name: /invite member/i }));

    expect(screen.getByText('newuser@example.com')).toBeInTheDocument();
    expect(screen.getAllByText('Admin')[0]).toBeInTheDocument();
    expect(screen.getByText('invited')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
        members: [expect.objectContaining({
          email: 'newuser@example.com',
          role: 'Admin',
          status: 'invited'
        })]
      }));
    });
  });

  it('updates an existing member role before save', () => {
    const projectWithMember = {
      ...mockProject,
      members: [{
        uid: 'member-1',
        email: 'builder@example.com',
        role: 'Builder' as const,
        joinedAt: new Date().toISOString(),
        status: 'active' as const,
      }]
    };

    render(
      <ToastProvider>
        <ProjectSettings project={projectWithMember} onUpdate={vi.fn()} onBack={() => {}} />
      </ToastProvider>
    );

    fireEvent.change(screen.getByLabelText('Role for builder@example.com'), {
      target: { value: 'Architect' }
    });

    expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Architect')).toBeInTheDocument();
  });
});


