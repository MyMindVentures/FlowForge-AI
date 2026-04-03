import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSupabaseCollection } from '../../../src/hooks/useSupabaseCollection';
import { onSnapshot, addDoc, updateDoc, deleteDoc } from '../../../src/lib/db/supabaseData';

vi.mock('../../../src/lib/supabase/appClient', () => ({
  db: {},
  supabase: {}
}));

vi.mock('../../../src/lib/databaseErrorHandler', () => ({
  handleDataOperationError: vi.fn(),
  DataOperationType: { LIST: 'list', CREATE: 'create', UPDATE: 'update', DELETE: 'delete', WRITE: 'write' }
}));

vi.mock('../../../src/lib/db/supabaseData', () => {
  const mockOnSnapshot = vi.fn((_q, onNext, _onError) => {
    onNext({
      docs: [
        { id: '1', data: () => ({ name: 'Item 1' }) }
      ]
    });
    return vi.fn();
  });

  return {
    collection: vi.fn(),
    query: vi.fn(),
    onSnapshot: mockOnSnapshot,
    addDoc: vi.fn().mockResolvedValue({ id: 'new-id' }),
    updateDoc: vi.fn().mockResolvedValue({}),
    setDoc: vi.fn().mockResolvedValue({}),
    deleteDoc: vi.fn().mockResolvedValue({}),
    doc: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    QueryConstraint: vi.fn()
  };
});

describe('useSupabaseCollection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch data on mount', async () => {
    const { result } = renderHook(() => useSupabaseCollection('test-collection'));

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual([{ id: '1', name: 'Item 1' }]);
    expect(onSnapshot).toHaveBeenCalled();
  });

  it('should handle onSnapshot error', async () => {
    (onSnapshot as any).mockImplementationOnce((_q, _onNext, onError) => {
      onError(new Error('Snapshot error'));
      return vi.fn();
    });

    const { result } = renderHook(() => useSupabaseCollection('test-collection'));

    expect(result.current.error).toBeDefined();
    expect(result.current.syncStatus).toBe('error');
  });

  it('should handle null collectionPath', async () => {
    const { result } = renderHook(() => useSupabaseCollection(null));

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual([]);
    expect(result.current.syncStatus).toBe('synced');
    expect(onSnapshot).not.toHaveBeenCalled();
  });

  it('add should call addDoc and update status', async () => {
    const { result } = renderHook(() => useSupabaseCollection('test-collection'));

    let id;
    await act(async () => {
      id = await result.current.add({ name: 'New Item' });
    });

    expect(id).toBe('new-id');
    expect(addDoc).toHaveBeenCalled();
    expect(result.current.syncStatus).toBe('synced');
  });

  it('add should handle error', async () => {
    (addDoc as any).mockRejectedValueOnce(new Error('Add error'));
    const { result } = renderHook(() => useSupabaseCollection('test-collection'));

    await act(async () => {
      await result.current.add({ name: 'New Item' });
    });

    expect(result.current.syncStatus).toBe('error');
  });

  it('update should call updateDoc', async () => {
    const { result } = renderHook(() => useSupabaseCollection('test-collection'));

    await act(async () => {
      await result.current.update('1', { name: 'Updated Item' });
    });

    expect(updateDoc).toHaveBeenCalled();
    expect(result.current.syncStatus).toBe('synced');
  });

  it('update should handle error', async () => {
    (updateDoc as any).mockRejectedValueOnce(new Error('Update error'));
    const { result } = renderHook(() => useSupabaseCollection('test-collection'));

    await act(async () => {
      await result.current.update('1', { name: 'Updated Item' });
    });

    expect(result.current.syncStatus).toBe('error');
  });

  it('set should call setDoc and update status', async () => {
    const { setDoc } = await import('../../../src/lib/db/supabaseData');
    const { result } = renderHook(() => useSupabaseCollection('test-collection'));

    await act(async () => {
      await result.current.set('1', { name: 'Set Item' });
    });

    expect(setDoc).toHaveBeenCalled();
    expect(result.current.syncStatus).toBe('synced');
  });

  it('set should handle error', async () => {
    const { setDoc } = await import('../../../src/lib/db/supabaseData');
    (setDoc as any).mockRejectedValueOnce(new Error('Set error'));
    const { result } = renderHook(() => useSupabaseCollection('test-collection'));

    await act(async () => {
      await result.current.set('1', { name: 'Set Item' });
    });

    expect(result.current.syncStatus).toBe('error');
  });

  it('remove should call deleteDoc', async () => {
    const { result } = renderHook(() => useSupabaseCollection('test-collection'));

    await act(async () => {
      await result.current.remove('1');
    });

    expect(deleteDoc).toHaveBeenCalled();
    expect(result.current.syncStatus).toBe('synced');
  });

  it('remove should handle error', async () => {
    (deleteDoc as any).mockRejectedValueOnce(new Error('Delete error'));
    const { result } = renderHook(() => useSupabaseCollection('test-collection'));

    await act(async () => {
      await result.current.remove('1');
    });

    expect(result.current.syncStatus).toBe('error');
  });
});
