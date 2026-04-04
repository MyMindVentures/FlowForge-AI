import { describe, expect, it } from 'vitest';
import { normalizeProject } from './normalizeProject';

describe('normalizeProject', () => {
  it('maps product-model project fields into the legacy UI project shape', () => {
    expect(
      normalizeProject({
        id: 'project-1',
        name: 'FlowForge AI',
        description: 'Internal product workspace',
        ownerAuthId: 'owner-auth-1',
        status: 'active',
        createdAt: '2026-04-04T00:00:00.000Z',
        updatedAt: '2026-04-04T01:00:00.000Z',
      })
    ).toMatchObject({
      id: 'project-1',
      name: 'FlowForge AI',
      description: 'Internal product workspace',
      ownerId: 'owner-auth-1',
      status: 'Active',
      isFavorite: false,
      members: [],
      repositories: [],
    });
  });
});