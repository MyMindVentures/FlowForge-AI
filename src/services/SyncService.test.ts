import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncService } from './SyncService';

describe('SyncService', () => {
  const project = { id: 'p1', name: 'Test Project', description: 'Test Desc' } as any;
  const features = [{ id: 'f1', title: 'F1', status: 'Completed', nonTechnicalDescription: 'D1' }] as any;
  const pages = [{ id: 'pg1', name: 'Admin', path: '/admin' }] as any;
  const components = [{ id: 'c1', name: 'FullPRD', type: 'section' }] as any;
  const layouts = [{ id: 'l1', name: 'Dashboard Layout', type: 'dashboard' }] as any;
  const functions = [{ id: 'fn1', name: 'resolveAppContext', modelId: 'gemini-3-flash-preview' }] as any;

  describe('analyzeSyncState', () => {
    it('detects missing files and generates tasks', async () => {
      // Mock checkFileExists to return false for all files
      vi.spyOn(SyncService as any, 'checkFileExists').mockReturnValue(false);
      
      const result = await SyncService.analyzeSyncState(project, features, pages, components, layouts, functions);
      
      expect(result.tasks).toHaveLength(4); // Page, Component, Layout, Function
      expect(result.updatedPages[0].integrityStatus).toBe('incomplete');
      expect(result.updatedComponents[0].integrityStatus).toBe('incomplete');
    });

    it('verifies existing files', async () => {
      // Mock checkFileExists to return true for all files
      vi.spyOn(SyncService as any, 'checkFileExists').mockReturnValue(true);
      
      const result = await SyncService.analyzeSyncState(project, features, pages, components, layouts, functions);
      
      expect(result.tasks).toHaveLength(0);
      expect(result.updatedPages[0].integrityStatus).toBe('verified');
      expect(result.updatedComponents[0].integrityStatus).toBe('verified');
    });
  });

  describe('generateProjectFromCodebase', () => {
    it('returns a full project structure', () => {
      const result = SyncService.generateProjectFromCodebase('p1');
      
      expect(result.pages).toBeDefined();
      expect(result.components).toBeDefined();
      expect(result.features).toBeDefined();
      expect(result.functions).toBeDefined();
      expect(result.pages.length).toBeGreaterThan(0);
      expect(result.components.length).toBeGreaterThan(0);
    });
  });

  describe('performProductionReadinessTest', () => {
    it('returns a score and results', async () => {
      const result = await SyncService.performProductionReadinessTest('p1');
      
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.results).toBeDefined();
      expect(result.results.length).toBeGreaterThan(0);
    });
  });

  describe('getSystemProjectMetadata', () => {
    it('returns the correct system project metadata', () => {
      const metadata = SyncService.getSystemProjectMetadata();
      expect(metadata.name).toBe('FlowForge AI');
      expect(metadata.status).toBe('Active');
    });
  });
});


