import { Project, ProjectMember, GitHubRepo } from '../../types';

type ProjectRecord = Omit<Partial<Project>, 'id' | 'name' | 'description' | 'ownerId' | 'createdAt' | 'updatedAt' | 'status' | 'isFavorite' | 'members' | 'repositories'> & {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  ownerId?: unknown;
  ownerAuthId?: unknown;
  organizationId?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  status?: unknown;
  isFavorite?: unknown;
  members?: unknown;
  repositories?: unknown;
};

function normalizeProjectStatus(status: unknown): Project['status'] {
  switch (status) {
    case 'active':
    case 'Active':
      return 'Active';
    case 'archived':
    case 'Archived':
      return 'Archived';
    default:
      return 'Draft';
  }
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function asMembers(value: unknown): ProjectMember[] {
  return Array.isArray(value) ? (value as ProjectMember[]) : [];
}

function asRepositories(value: unknown): GitHubRepo[] {
  return Array.isArray(value) ? (value as GitHubRepo[]) : [];
}

/**
 * Normalizes mixed legacy and product-model project rows into the UI Project shape.
 */
export function normalizeProject(project: ProjectRecord): Project {
  const createdAt = asString(project.createdAt, asString(project.updatedAt, new Date().toISOString()));
  const updatedAt = asString(project.updatedAt, createdAt);

  return {
    ...(project as Partial<Project>),
    id: asString(project.id, ''),
    name: asString(project.name, 'Untitled Project'),
    description: asString(project.description, ''),
    ownerId: asString(project.ownerId, asString(project.ownerAuthId, '')),
    organizationId: asString(project.organizationId, '' ) || undefined,
    createdAt,
    updatedAt,
    status: normalizeProjectStatus(project.status),
    isFavorite: project.isFavorite === true,
    members: asMembers(project.members),
    repositories: asRepositories(project.repositories),
  };
}

/**
 * Normalizes a collection of project rows for legacy UI consumers.
 */
export function normalizeProjects(projects: ProjectRecord[]): Project[] {
  return projects.map(normalizeProject);
}