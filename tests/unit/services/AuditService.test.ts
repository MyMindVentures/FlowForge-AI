import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditService, AuditAction } from '../../../src/services/audit';
import { addDoc, collection, serverTimestamp } from '../../../src/lib/db/supabaseData';
import { auth } from '../../../src/lib/supabase/appClient';

// Mock Firebase
vi.mock('../../../src/lib/supabase/appClient', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'test-user-id', email: 'test@test.com' }
  },
  supabase: {}
}));

const mockAddDoc = vi.fn().mockResolvedValue({ id: 'log-id' });

vi.mock('../../../src/lib/db/supabaseData', () => ({
  collection: vi.fn(),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  serverTimestamp: vi.fn().mockReturnValue('mock-timestamp')
}));

describe('AuditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log to global and project-specific audit logs', async () => {
    const action = AuditAction.PROJECT_CREATED;
    const details = { name: 'New Project' };
    const projectId = 'proj-123';

    await AuditService.log(action, details, projectId);

    expect(collection).toHaveBeenCalledWith(expect.anything(), 'admin/audit/logs');
    expect(collection).toHaveBeenCalledWith(expect.anything(), 'projects/proj-123/audit_logs');
    expect(mockAddDoc).toHaveBeenCalledTimes(2);
    expect(mockAddDoc).toHaveBeenCalledWith(undefined, expect.objectContaining({
      action,
      details,
      userId: 'test-user-id',
      userEmail: 'test@test.com',
      projectId,
      timestamp: 'mock-timestamp'
    }));
  });

  it('should only log to global audit logs if no projectId is provided', async () => {
    const action = AuditAction.AI_GENERATION;
    const details = { type: 'PRD' };

    await AuditService.log(action, details);

    expect(collection).toHaveBeenCalledWith(expect.anything(), 'admin/audit/logs');
    expect(collection).not.toHaveBeenCalledWith(expect.anything(), expect.stringContaining('projects/'));
    expect(mockAddDoc).toHaveBeenCalledTimes(1);
  });

  it('should not log if user is not authenticated', async () => {
    (auth as any).currentUser = null;

    await AuditService.log(AuditAction.PROJECT_CREATED, {});

    expect(mockAddDoc).not.toHaveBeenCalled();
    
    // Restore user for other tests
    (auth as any).currentUser = { uid: 'test-user-id', email: 'test@test.com' };
  });

  it('should handle firestore error gracefully', async () => {
    mockAddDoc.mockRejectedValueOnce(new Error('Firestore error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await AuditService.log(AuditAction.PROJECT_CREATED, {});

    expect(consoleSpy).toHaveBeenCalledWith('Failed to log audit:', expect.any(Error));
    consoleSpy.mockRestore();
  });
});


