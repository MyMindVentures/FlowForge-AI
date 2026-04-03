export type DbQueryOperator = 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte';

export type CollectionResolution = {
  table: string;
  implicitFilters: Array<{ column: string; operator: DbQueryOperator; value: unknown }>;
  defaultOrder?: { column: string; ascending: boolean };
};

function normalize(path: string) {
  return path.split('/').filter(Boolean);
}

export function camelToSnakeKey(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/URL/g, 'Url')
    .toLowerCase();
}

function mapTopLevelCollection(name: string): string {
  switch (name) {
    case 'users':
      return 'app_users';
    case 'roles':
      return 'roles';
    case 'notifications':
      return 'notifications';
    case 'projects':
      return 'projects';
    case 'ai_logs':
      return 'ai_task_logs';
    default:
      return camelToSnakeKey(name);
  }
}

export function resolveCollectionPath(collectionPath: string): CollectionResolution {
  const parts = normalize(collectionPath);

  if (parts.length === 1) {
    return {
      table: mapTopLevelCollection(parts[0]),
      implicitFilters: [],
    };
  }

  if (parts[0] === 'sync' && parts[1] === 'states') {
    return {
      table: 'sync_states',
      implicitFilters: [],
    };
  }

  if (parts[0] === 'admin' && parts[1] === 'ai' && parts.length === 3) {
    switch (parts[2]) {
      case 'models':
        return { table: 'ai_models', implicitFilters: [] };
      case 'prompts':
        return { table: 'prompt_templates', implicitFilters: [] };
      case 'keys':
        return { table: 'api_key_configs', implicitFilters: [] };
      case 'functions':
        return {
          table: 'llm_functions',
          implicitFilters: [{ column: 'project_id', operator: 'eq', value: null }],
        };
      case 'usage':
        return { table: 'usage_logs', implicitFilters: [] };
      case 'errors':
        return { table: 'error_logs', implicitFilters: [] };
      default:
        break;
    }
  }

  if (parts[0] === 'admin' && parts[1] === 'audit' && parts[2] === 'logs') {
    return {
      table: 'audit_logs',
      implicitFilters: [{ column: 'project_id', operator: 'eq', value: null }],
    };
  }

  if (parts[0] === 'projects' && parts.length >= 3) {
    const projectId = parts[1];
    const collectionName = parts[2];
    const baseFilter = [{ column: 'project_id', operator: 'eq' as const, value: projectId }];

    switch (collectionName) {
      case 'features':
        if (parts.length === 5 && parts[4] === 'comments') {
          return {
            table: 'feature_comments',
            implicitFilters: [
              ...baseFilter,
              { column: 'feature_id', operator: 'eq', value: parts[3] },
            ],
            defaultOrder: { column: 'created_at', ascending: true },
          };
        }
        return { table: 'features', implicitFilters: baseFilter };
      case 'versions':
        return { table: 'project_versions', implicitFilters: baseFilter };
      case 'ui_pages':
        return { table: 'ui_pages', implicitFilters: baseFilter };
      case 'ui_components':
        return { table: 'ui_components', implicitFilters: baseFilter };
      case 'ui_layouts':
        return { table: 'ui_layouts', implicitFilters: baseFilter };
      case 'ui_style':
        return { table: 'ui_style_systems', implicitFilters: baseFilter };
      case 'prd_sections':
        return { table: 'prd_sections', implicitFilters: baseFilter };
      case 'audit_findings':
        return { table: 'audit_findings', implicitFilters: baseFilter };
      case 'readiness_checks':
        return { table: 'readiness_checks', implicitFilters: baseFilter };
      case 'blockers':
        return { table: 'blockers', implicitFilters: baseFilter };
      case 'tasks':
        return { table: 'tasks', implicitFilters: baseFilter };
      case 'ai_functions':
        return { table: 'llm_functions', implicitFilters: baseFilter };
      case 'ai_logs':
        return { table: 'ai_task_logs', implicitFilters: baseFilter };
      case 'audit_logs':
        return { table: 'audit_logs', implicitFilters: baseFilter };
      case 'sessions':
        return { table: 'sessions', implicitFilters: baseFilter };
      case 'chats':
        return { table: 'chat_messages', implicitFilters: baseFilter };
      case 'suggestions':
        return { table: 'suggestions', implicitFilters: baseFilter };
      default:
        break;
    }
  }

  throw new Error(`Unsupported collection path: ${collectionPath}`);
}

export function resolveDocumentPath(documentPath: string) {
  const parts = normalize(documentPath);
  if (parts.length < 2 || parts.length % 2 !== 0) {
    throw new Error(`Unsupported document path: ${documentPath}`);
  }

  const collectionPath = parts.slice(0, -1).join('/');
  return {
    ...resolveCollectionPath(collectionPath),
    collectionPath,
    documentId: parts[parts.length - 1],
  };
}

export function dbToAppKey(value: string) {
  if (value === 'photo_url') return 'photoURL';
  return value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

export function appToDbKey(value: string) {
  if (value === 'photoURL') return 'photo_url';
  return camelToSnakeKey(value);
}

export function mapDbRecordToApp<T>(record: Record<string, unknown>): T {
  return Object.entries(record).reduce<Record<string, unknown>>((accumulator, [key, value]) => {
    accumulator[dbToAppKey(key)] = value;
    return accumulator;
  }, {}) as T;
}

export function mapAppRecordToDb(record: Record<string, unknown>) {
  return Object.entries(record).reduce<Record<string, unknown>>((accumulator, [key, value]) => {
    accumulator[appToDbKey(key)] = value;
    return accumulator;
  }, {});
}