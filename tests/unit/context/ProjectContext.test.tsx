import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ProjectProvider, useProject } from '../../../src/context/ProjectContext';
import { useAuth } from '../../../src/context/AuthContext';
import { useSupabaseCollection } from '../../../src/hooks/useSupabaseCollection';
import React from 'react';

vi.mock('../../../src/context/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('../../../src/hooks/useSupabaseCollection', () => ({
  useSupabaseCollection: vi.fn()
}));

describe('ProjectContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ProjectProvider>{children}</ProjectProvider>
  );

  it('should initialize with no selected project', () => {
    (useAuth as any).mockReturnValue({ user: null });
    (useSupabaseCollection as any).mockReturnValue({
      data: [],
      loading: false,
      syncStatus: 'synced',
      update: vi.fn(),
      set: vi.fn(),
      add: vi.fn(),
      remove: vi.fn()
    });

    const { result } = renderHook(() => useProject(), { wrapper });

    expect(result.current.projects).toEqual([]);
    expect(result.current.selectedProject).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should load selected project from localStorage', () => {
    localStorage.setItem('selected_project_id', 'proj-1');
    (useAuth as any).mockReturnValue({ user: { uid: 'user-1' } });
    
    const mockProjects = [{ id: 'proj-1', name: 'Project 1' }];
    (useSupabaseCollection as any).mockImplementation((path: string) => {
      if (path === 'projects') {
        return { data: mockProjects, loading: false, update: vi.fn(), set: vi.fn(), add: vi.fn(), remove: vi.fn() };
      }
      return { data: [], loading: false, add: vi.fn(), update: vi.fn(), set: vi.fn(), remove: vi.fn() };
    });

    const { result } = renderHook(() => useProject(), { wrapper });

    expect(result.current.selectedProject).toEqual(mockProjects[0]);
  });

  it('setSelectedProject should update state and localStorage', () => {
    (useAuth as any).mockReturnValue({ user: { uid: 'user-1' } });
    const mockProjects = [{ id: 'proj-1', name: 'Project 1' }];
    (useSupabaseCollection as any).mockReturnValue({
      data: mockProjects,
      loading: false,
      update: vi.fn(),
      set: vi.fn(),
      add: vi.fn(),
      remove: vi.fn()
    });

    const { result } = renderHook(() => useProject(), { wrapper });

    act(() => {
      result.current.setSelectedProject(mockProjects[0] as any);
    });

    expect(localStorage.getItem('selected_project_id')).toBe('proj-1');
    expect(result.current.selectedProject).toEqual(mockProjects[0]);

    act(() => {
      result.current.setSelectedProject(null);
    });

    expect(localStorage.getItem('selected_project_id')).toBeNull();
  });

  it('updateProject should upsert the selected project', async () => {
    localStorage.setItem('selected_project_id', 'proj-1');
    (useAuth as any).mockReturnValue({ user: { uid: 'user-1' } });
    
    const mockUpdate = vi.fn();
    const mockSet = vi.fn();
    (useSupabaseCollection as any).mockImplementation((path: string) => {
      if (path === 'projects') {
        return { data: [{ id: 'proj-1' }], loading: false, update: mockUpdate, set: mockSet, add: vi.fn(), remove: vi.fn() };
      }
      return { data: [], loading: false, add: vi.fn(), update: vi.fn(), set: vi.fn(), remove: vi.fn() };
    });

    const { result } = renderHook(() => useProject(), { wrapper });

    await act(async () => {
      await result.current.updateProject({ name: 'Updated' });
    });

    expect(mockSet).toHaveBeenCalledWith('proj-1', { id: 'proj-1', name: 'Updated' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('updateProject should do nothing if no selected project', async () => {
    (useAuth as any).mockReturnValue({ user: { uid: 'user-1' } });
    const mockUpdate = vi.fn();
    (useSupabaseCollection as any).mockReturnValue({ data: [], loading: false, update: mockUpdate, set: vi.fn(), add: vi.fn(), remove: vi.fn() });

    const { result } = renderHook(() => useProject(), { wrapper });

    await act(async () => {
      await result.current.updateProject({ name: 'Updated' });
    });

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('version operations should call firestore methods', async () => {
    localStorage.setItem('selected_project_id', 'proj-1');
    (useAuth as any).mockReturnValue({ user: { uid: 'user-1' } });
    
    const mockAdd = vi.fn().mockResolvedValue('new-ver');
    const mockUpdate = vi.fn();
    const mockRemove = vi.fn();
    
    (useSupabaseCollection as any).mockImplementation((path: string) => {
      if (path === 'projects') {
        return { data: [{ id: 'proj-1' }], loading: false, add: vi.fn(), update: vi.fn(), set: vi.fn(), remove: vi.fn() };
      }
      if (path?.includes('versions')) {
        return { data: [], loading: false, add: mockAdd, update: mockUpdate, remove: mockRemove };
      }
      return { data: [], loading: false, add: vi.fn(), update: vi.fn(), set: vi.fn(), remove: vi.fn() };
    });

    const { result } = renderHook(() => useProject(), { wrapper });

    await act(async () => {
      await result.current.addVersion({ name: 'v1' } as any);
      await result.current.updateVersion('ver-1', { name: 'v2' });
      await result.current.removeVersion('ver-1');
    });

    expect(mockAdd).toHaveBeenCalledWith({ name: 'v1' });
    expect(mockUpdate).toHaveBeenCalledWith('ver-1', { name: 'v2' });
    expect(mockRemove).toHaveBeenCalledWith('ver-1');
  });

  it('addReadinessCheck should upsert if ID is provided', async () => {
    localStorage.setItem('selected_project_id', 'proj-1');
    (useAuth as any).mockReturnValue({ user: { uid: 'user-1' } });
    
    const mockSet = vi.fn();
    (useSupabaseCollection as any).mockImplementation((path: string) => {
      if (path === 'projects') {
        return { data: [{ id: 'proj-1' }], loading: false, add: vi.fn(), update: vi.fn(), set: vi.fn(), remove: vi.fn() };
      }
      if (path?.includes('readiness_checks')) {
        return { data: [], loading: false, add: vi.fn(), set: mockSet };
      }
      return { data: [], loading: false, add: vi.fn(), update: vi.fn(), set: vi.fn(), remove: vi.fn() };
    });

    const { result } = renderHook(() => useProject(), { wrapper });

    await act(async () => {
      await result.current.addReadinessCheck({ id: 'rbac', label: 'RBAC' } as any);
    });

    expect(mockSet).toHaveBeenCalledWith('rbac', { id: 'rbac', label: 'RBAC' });
  });

  it('version operations should throw if no selected project', async () => {
    (useAuth as any).mockReturnValue({ user: { uid: 'user-1' } });
    (useSupabaseCollection as any).mockReturnValue({ data: [], loading: false, add: vi.fn(), update: vi.fn(), set: vi.fn(), remove: vi.fn() });

    const { result } = renderHook(() => useProject(), { wrapper });

    await expect(result.current.addVersion({} as any)).rejects.toThrow('No project selected');
    await expect(result.current.updateVersion('1', {})).rejects.toThrow('No project selected');
    await expect(result.current.removeVersion('1')).rejects.toThrow('No project selected');
  });

  it('useProject should throw error if used outside ProjectProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useProject())).toThrow('useProject must be used within a ProjectProvider');
    consoleSpy.mockRestore();
  });
});


