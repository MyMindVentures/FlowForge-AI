import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { resolveDocumentPath } from '../src/lib/db/pathMap';

type ExportedDocument = {
  path: string;
  data: Record<string, unknown>;
};

type ExportPayload = {
  documents: ExportedDocument[];
};

function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

async function main() {
  const exportFile = process.env.FIREBASE_EXPORT_FILE || path.resolve(process.cwd(), 'supabase', 'firebase-export.json');
  const payload = JSON.parse(await readFile(exportFile, 'utf8')) as ExportPayload;
  const supabase = createClient(required('VITE_SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'));

  const expectedCounts = payload.documents.reduce<Record<string, number>>((accumulator, document) => {
    const table = resolveDocumentPath(document.path).table;
    accumulator[table] = (accumulator[table] || 0) + 1;
    return accumulator;
  }, {});

  let failed = false;

  for (const [table, expected] of Object.entries(expectedCounts)) {
    const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true });
    if (error) {
      throw new Error(`Failed counting ${table}: ${error.message}`);
    }

    const actual = count || 0;
    const status = actual === expected ? 'OK' : 'MISMATCH';
    console.log(`${status} ${table}: expected=${expected} actual=${actual}`);
    if (actual !== expected) {
      failed = true;
    }
  }

  if (failed) {
    process.exitCode = 1;
  }
}

void main();