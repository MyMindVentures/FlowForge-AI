import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleDataOperationError, DataOperationType } from '../../../src/lib/databaseErrorHandler';
import { auth } from '../../../src/lib/supabase/appClient';

vi.mock('../../../src/lib/supabase/appClient', () => ({
  auth: {
    currentUser: null
  }
}));

describe('databaseErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).currentUser = null;
  });

  it('should format error and throw with auth info', () => {
    (auth as any).currentUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      emailVerified: true,
      isAnonymous: false,
      tenantId: null,
      providerData: [
        {
          providerId: 'google.com',
          displayName: 'Test User',
          email: 'test@example.com',
          photoURL: 'https://example.com/photo.jpg'
        }
      ]
    };

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const error = new Error('Test error');

    expect(() => {
      handleDataOperationError(error, DataOperationType.CREATE, 'test-path');
    }).toThrow();

    expect(consoleSpy).toHaveBeenCalled();

    const thrownError = consoleSpy.mock.calls[0][1];
    const parsedError = JSON.parse(thrownError);

    expect(parsedError.error).toBe('Test error');
    expect(parsedError.operationType).toBe('create');
    expect(parsedError.path).toBe('test-path');
    expect(parsedError.authInfo.userId).toBe('test-uid');
    expect(parsedError.authInfo.providerInfo[0].providerId).toBe('google.com');

    consoleSpy.mockRestore();
  });

  it('should handle non-Error objects', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      handleDataOperationError('String error', DataOperationType.UPDATE, 'test-path');
    }).toThrow();

    const thrownError = consoleSpy.mock.calls[0][1];
    const parsedError = JSON.parse(thrownError);

    expect(parsedError.error).toBe('String error');

    consoleSpy.mockRestore();
  });

  it('should handle missing currentUser', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      handleDataOperationError(new Error('Test'), DataOperationType.DELETE, 'test-path');
    }).toThrow();

    const thrownError = consoleSpy.mock.calls[0][1];
    const parsedError = JSON.parse(thrownError);

    expect(parsedError.authInfo.userId).toBeUndefined();

    consoleSpy.mockRestore();
  });
});
