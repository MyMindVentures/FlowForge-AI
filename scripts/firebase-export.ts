import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

type ExportedDocument = {
  path: string;
  data: Record<string, unknown>;
};

function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

function normalizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (value && typeof value === 'object') {
    if ('toDate' in (value as Record<string, unknown>) && typeof (value as { toDate: () => Date }).toDate === 'function') {
      return (value as { toDate: () => Date }).toDate().toISOString();
    }

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, child]) => [key, normalizeValue(child)])
    );
  }

  return value;
}

async function walkCollection(collectionRef: FirebaseFirestore.CollectionReference, accumulator: ExportedDocument[]) {
  const snapshot = await collectionRef.get();

  for (const document of snapshot.docs) {
    accumulator.push({
      path: document.ref.path,
      data: normalizeValue(document.data()) as Record<string, unknown>,
    });

    const subcollections = await document.ref.listCollections();
    for (const subcollection of subcollections) {
      await walkCollection(subcollection, accumulator);
    }
  }
}

async function exportAuthUsers() {
  const auth = getAuth();
  const users: Array<Record<string, unknown>> = [];
  let nextPageToken: string | undefined;

  do {
    const page = await auth.listUsers(1000, nextPageToken);
    users.push(
      ...page.users.map((user) => ({
        uid: user.uid,
        email: user.email || null,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
        disabled: user.disabled,
        customClaims: user.customClaims || null,
        providerData: user.providerData,
        metadata: user.metadata,
      }))
    );
    nextPageToken = page.pageToken;
  } while (nextPageToken);

  return users;
}

async function main() {
  initializeApp({
    credential: cert({
      projectId: required('FIREBASE_PROJECT_ID'),
      clientEmail: required('FIREBASE_CLIENT_EMAIL'),
      privateKey: required('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
    }),
  });

  const firestore = getFirestore();
  const rootCollections = await firestore.listCollections();
  const documents: ExportedDocument[] = [];

  for (const collectionRef of rootCollections) {
    await walkCollection(collectionRef, documents);
  }

  const authUsers = await exportAuthUsers();
  const outputDir = path.resolve(process.cwd(), 'supabase');
  await mkdir(outputDir, { recursive: true });

  const payload = {
    metadata: {
      exportedAt: new Date().toISOString(),
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      documentCount: documents.length,
      authUserCount: authUsers.length,
    },
    authUsers,
    documents,
  };

  await writeFile(path.join(outputDir, 'firebase-export.json'), JSON.stringify(payload, null, 2), 'utf8');
  console.log(`Exported ${documents.length} Firestore documents and ${authUsers.length} auth users to supabase/firebase-export.json`);
}

void main();