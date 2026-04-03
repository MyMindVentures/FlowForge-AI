import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { mapAppRecordToDb, resolveDocumentPath } from '../src/lib/db/pathMap';

type ExportedDocument = {
  path: string;
  data: Record<string, unknown>;
};

type ExportPayload = {
  authUsers: Array<Record<string, unknown>>;
  documents: ExportedDocument[];
};

function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

function transformDocument(document: ExportedDocument) {
  const resolution = resolveDocumentPath(document.path);
  const row = {
    id: resolution.documentId,
    ...resolution.implicitFilters.reduce<Record<string, unknown>>((accumulator, filter) => {
      accumulator[filter.column] = filter.value;
      return accumulator;
    }, {}),
    ...mapAppRecordToDb(document.data),
  };

  return {
    table: resolution.table,
    row,
  };
}

async function main() {
  const exportFile = process.env.FIREBASE_EXPORT_FILE || path.resolve(process.cwd(), 'supabase', 'firebase-export.json');
  const payload = JSON.parse(await readFile(exportFile, 'utf8')) as ExportPayload;
  const supabase = createClient(required('VITE_SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'));

  const transformedRows = payload.documents.map(transformDocument);
  const grouped = transformedRows.reduce<Record<string, Record<string, unknown>[]>>((accumulator, entry) => {
    accumulator[entry.table] ||= [];
    accumulator[entry.table].push(entry.row);
    return accumulator;
  }, {});

  for (const authUser of payload.authUsers) {
    if (!authUser.uid || !authUser.email) {
      continue;
    }

    grouped.app_users ||= [];
    if (!grouped.app_users.find((row) => row.id === authUser.uid)) {
      grouped.app_users.push({
        id: authUser.uid,
        email: authUser.email,
        display_name: authUser.displayName || authUser.email,
        photo_url: authUser.photoURL || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        settings: { theme: 'dark', notifications: true },
      });
    }
  }

  const order = [
    'app_users',
    'roles',
    'projects',
    'sessions',
    'features',
    'project_versions',
    'ui_layouts',
    'ui_pages',
    'ui_components',
    'ui_style_systems',
    'prd_sections',
    'audit_findings',
    'readiness_checks',
    'blockers',
    'tasks',
    'llm_functions',
    'chat_messages',
    'suggestions',
    'feature_comments',
    'audit_logs',
    'ai_task_logs',
    'ai_models',
    'prompt_templates',
    'api_key_configs',
    'usage_logs',
    'error_logs',
    'notifications',
    'sync_states',
  ];

  for (const table of order) {
    const rows = grouped[table];
    if (!rows?.length) {
      continue;
    }

    for (let index = 0; index < rows.length; index += 250) {
      const batch = rows.slice(index, index + 250);
      const { error } = await supabase.from(table).upsert(batch, { onConflict: 'id' });
      if (error) {
        throw new Error(`Failed importing ${table}: ${error.message}`);
      }
    }

    console.log(`Imported ${rows.length} row(s) into ${table}`);
  }
}

void main();