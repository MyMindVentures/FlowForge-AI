import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../../src/context/AuthContext';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import React from 'react';

// Mock Firebase
vi.mock('../../../src/firebase', () => ({
  auth: {},
  db: {}
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  GoogleAuthProvider: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  onSnapshot: vi.fn()
}));

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('should initialize with null user and profile', async () => {
    (onAuthStateChanged as any).mockImplementation((auth, callback) => {
      callback(null);
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should update user and profile on auth change (existing profile)', async () => {
    const mockUser = { uid: 'test-uid', email: 'test@example.com' };
    
    (onSnapshot as any).mockImplementation((ref, callback) => {
      callback({
        exists: () => true,
        data: () => ({ uid: 'test-uid', email: 'test@example.com', role: 'Builder' })
      });
      return vi.fn();
    });

    (onAuthStateChanged as any).mockImplementation((auth, callback) => {
      callback(mockUser);
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.profile).toEqual(expect.objectContaining({ uid: 'test-uid', role: 'Builder' }));
  });

  it('should create new profile if it does not exist', async () => {
    const mockUser = { uid: 'new-uid', email: 'new@example.com', displayName: 'New User' };
    
    (onSnapshot as any).mockImplementation((ref, callback) => {
      callback({
        exists: () => false
      });
      return vi.fn();
    });

    (onAuthStateChanged as any).mockImplementation((auth, callback) => {
      callback(mockUser);
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(setDoc).toHaveBeenCalled();
      expect(result.current.profile).toEqual(expect.objectContaining({ uid: 'new-uid', role: 'Builder' }));
    });
  });

  it('login should call signInWithPopup', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login();
    });

    expect(signInWithPopup).toHaveBeenCalled();
  });

  it('logout should call signOut', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(signOut).toHaveBeenCalled();
  });

  it('updateProfile should call updateDoc', async () => {
    const mockUser = { uid: 'test-uid', email: 'test@example.com' };
    
    (onSnapshot as any).mockImplementation((ref, callback) => {
      callback({ exists: () => true, data: () => ({ uid: 'test-uid' }) });
      return vi.fn();
    });

    (onAuthStateChanged as any).mockImplementation((auth, callback) => {
      callback(mockUser);
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.updateProfile({ displayName: 'Updated Name' });
    });

    expect(updateDoc).toHaveBeenCalled();
  });

  it('updateProfile should return early if no user', async () => {
    (onAuthStateChanged as any).mockImplementation((auth, callback) => {
      callback(null);
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.updateProfile({ displayName: 'Updated Name' });
    });

    expect(updateDoc).not.toHaveBeenCalled();
  });

  it('setRole should call updateProfile', async () => {
    const mockUser = { uid: 'test-uid', email: 'test@example.com' };
    
    (onSnapshot as any).mockImplementation((ref, callback) => {
      callback({ exists: () => true, data: () => ({ uid: 'test-uid' }) });
      return vi.fn();
    });

    (onAuthStateChanged as any).mockImplementation((auth, callback) => {
      callback(mockUser);
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.setRole('Architect');
    });

    expect(updateDoc).toHaveBeenCalledWith(undefined, expect.objectContaining({ role: 'Architect' }));
  });

  it('useAuth should throw error if used outside AuthProvider', () => {
    // Suppress console.error for the expected error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider');
    consoleSpy.mockRestore();
  });
});
