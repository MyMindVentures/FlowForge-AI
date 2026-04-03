import { describe, expect, it } from 'vitest';
import {
  mapLegacyFeatureComponentLinks,
  mapLegacyFeaturePageLinks,
  mapLegacyFeatureToFeatureCard,
  mapLegacyPageComponentsToPlacedComponents,
  mapLegacyPageToProductPage,
  mapLegacyProjectToProductProject,
} from './legacyMappers';
import type { Feature, Project, UIPage } from '../../types';

describe('legacy product mappers', () => {
  it('maps a legacy project into the new product project shape', () => {
    const project: Project = {
      id: 'project-1',
      name: 'FlowForge AI',
      description: 'Internal product workspace',
      ownerId: 'owner-1',
      createdAt: '2026-04-03T00:00:00.000Z',
      updatedAt: '2026-04-03T00:00:00.000Z',
      status: 'Active',
      isFavorite: false,
      members: [],
      repositories: [],
    };

    expect(mapLegacyProjectToProductProject(project)).toMatchObject({
      name: 'FlowForge AI',
      slug: 'flowforge-ai',
      description: 'Internal product workspace',
      tagline: 'Internal product workspace',
      category: 'legacy-project',
      visibility: 'private',
      platform: 'responsive',
      status: 'active',
      version: '1.0.0',
      owner_auth_id: 'owner-1',
      tags: [],
    });
  });

  it('maps a legacy feature into a feature card and keeps core product fields', () => {
    const feature: Feature = {
      id: 'feature-1',
      projectId: 'project-1',
      featureCode: 'AUTH_LOGIN',
      title: 'Login flow',
      status: 'In Progress',
      priority: 'Critical',
      problem: 'Users cannot sign in quickly.',
      solution: 'Add Google sign-in.',
      why: 'Improve activation.',
      nonTechnicalDescription: 'Fast authentication for users.',
      technicalDescription: 'OAuth with Firebase today, Supabase later.',
      createdAt: '2026-04-03T00:00:00.000Z',
      updatedAt: '2026-04-03T00:00:00.000Z',
      archived: false,
      relatedPages: ['page-1'],
      relatedComponents: ['component-1'],
    };

    expect(mapLegacyFeatureToFeatureCard(feature)).toMatchObject({
      project_id: 'project-1',
      title: 'Login flow',
      slug: 'auth-login',
      priority: 'critical',
      status: 'in_progress',
      problem_statement: 'Users cannot sign in quickly.',
      goal: 'Improve activation.',
    });

    expect(mapLegacyFeaturePageLinks('feature-card-1', feature)).toEqual([
      { feature_card_id: 'feature-card-1', page_id: 'page-1' },
    ]);

    expect(mapLegacyFeatureComponentLinks('feature-card-1', feature)).toEqual([
      { feature_card_id: 'feature-card-1', component_id: 'component-1' },
    ]);
  });

  it('maps a legacy page into a page and ordered placed components', () => {
    const page: UIPage = {
      id: 'page-1',
      projectId: 'project-1',
      name: 'Dashboard',
      path: '/app/dashboard',
      purpose: 'Show account overview',
      layoutId: 'layout-1',
      linkedFeatureIds: ['feature-1'],
      componentIds: ['component-1', 'component-2'],
      mobilePattern: 'stacked cards',
      createdAt: '2026-04-03T00:00:00.000Z',
      updatedAt: '2026-04-03T00:00:00.000Z',
    };

    expect(mapLegacyPageToProductPage(page)).toMatchObject({
      project_id: 'project-1',
      slug: 'app-dashboard',
      route: '/app/dashboard',
      auth_required: true,
      status: 'active',
    });

    expect(mapLegacyPageComponentsToPlacedComponents('layout-new-1', page)).toEqual([
      {
        layout_id: 'layout-new-1',
        component_id: 'component-1',
        parent_layout_component_id: null,
        zone: 'body',
        position_order: 1,
        x: null,
        y: null,
        width: null,
        height: null,
        configuration_json: {},
        visibility_rules: {},
        notes: null,
      },
      {
        layout_id: 'layout-new-1',
        component_id: 'component-2',
        parent_layout_component_id: null,
        zone: 'body',
        position_order: 2,
        x: null,
        y: null,
        width: null,
        height: null,
        configuration_json: {},
        visibility_rules: {},
        notes: null,
      },
    ]);
  });
});

