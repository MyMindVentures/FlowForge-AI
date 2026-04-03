import { describe, expect, it } from 'vitest';
import { buildProductionTasks, productionTaskTemplates, PRODUCTION_TASK_SOURCE_DOCUMENT } from './productionTasks';

describe('productionTasks', () => {
  it('builds the full production task backlog for a project', () => {
    const tasks = buildProductionTasks('project-1', '2026-04-03T00:00:00.000Z');

    expect(tasks).toHaveLength(productionTaskTemplates.length);
    expect(tasks).toHaveLength(28);
    expect(tasks[0]).toMatchObject({
      projectId: 'project-1',
      title: 'CI/CD Pipeline',
      sourceDocument: PRODUCTION_TASK_SOURCE_DOCUMENT,
      sourceKey: 'infrastructure-cicd-pipeline',
      status: 'planned',
      priority: 'Critical',
      sortOrder: 100,
    });
    expect(tasks.at(-1)).toMatchObject({
      title: 'Load Testing',
      sourceKey: 'testing-load-testing',
      sortOrder: 730,
    });
  });
});