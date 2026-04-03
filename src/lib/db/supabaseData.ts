import { supabase } from '../supabase/appClient';
import { appToDbKey, mapAppRecordToDb, mapDbRecordToApp, resolveCollectionPath, resolveDocumentPath } from './pathMap';

export type DocumentData = Record<string, unknown>;
export type DatabaseError = Error;

type CollectionRef = {
  kind: 'collection';
  path: string;
};

type DocRef = {
  kind: 'doc';
  path: string;
  id: string;
};

type QueryRef = {
  kind: 'query';
  path: string;
  constraints: QueryConstraint[];
};

type QueryFilterConstraint = {
  kind: 'where';
  field: string;
  op: '==' | '!=' | '<' | '<=' | '>' | '>=';
  value: unknown;
  toString: () => string;
};

type QueryOrderConstraint = {
  kind: 'orderBy';
  field: string;
  direction: 'asc' | 'desc';
  toString: () => string;
};

type QueryLimitConstraint = {
  kind: 'limit';
  count: number;
  toString: () => string;
};

export type QueryConstraint = QueryFilterConstraint | QueryOrderConstraint | QueryLimitConstraint;

type SnapshotDoc<T> = {
  id: string;
  data: () => Omit<T, 'id'>;
};

async function executeCollectionQuery<T>(path: string, constraints: QueryConstraint[]) {
  const resolution = resolveCollectionPath(path);
  let query = supabase!.from(resolution.table).select('*');

  for (const filter of resolution.implicitFilters) {
    switch (filter.operator) {
      case 'eq':
        query = filter.value === null ? query.is(filter.column, null) : query.eq(filter.column, filter.value);
        break;
      case 'neq':
        query = query.neq(filter.column, filter.value as string | number | boolean);
        break;
      case 'lt':
        query = query.lt(filter.column, filter.value as string | number);
        break;
      case 'lte':
        query = query.lte(filter.column, filter.value as string | number);
        break;
      case 'gt':
        query = query.gt(filter.column, filter.value as string | number);
        break;
      case 'gte':
        query = query.gte(filter.column, filter.value as string | number);
        break;
    }
  }

  for (const constraint of constraints) {
    if (constraint.kind !== 'where') {
      continue;
    }

    const column = appToDbKey(constraint.field);
    switch (constraint.op) {
      case '==':
        query = constraint.value === null ? query.is(column, null) : query.eq(column, constraint.value);
        break;
      case '!=':
        query = query.neq(column, constraint.value as string | number | boolean);
        break;
      case '<':
        query = query.lt(column, constraint.value as string | number);
        break;
      case '<=':
        query = query.lte(column, constraint.value as string | number);
        break;
      case '>':
        query = query.gt(column, constraint.value as string | number);
        break;
      case '>=':
        query = query.gte(column, constraint.value as string | number);
        break;
    }
  }

  const orderConstraint = constraints.find((constraint): constraint is QueryOrderConstraint => constraint.kind === 'orderBy');
  const limitConstraint = constraints.find((constraint): constraint is QueryLimitConstraint => constraint.kind === 'limit');

  if (orderConstraint) {
    query = query.order(appToDbKey(orderConstraint.field), { ascending: orderConstraint.direction !== 'desc' });
  } else if (resolution.defaultOrder) {
    query = query.order(resolution.defaultOrder.column, { ascending: resolution.defaultOrder.ascending });
  }

  if (limitConstraint) {
    query = query.limit(limitConstraint.count);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return (data || []).map((row) => mapDbRecordToApp<T>(row as Record<string, unknown>));
}

async function executeDocumentQuery<T>(path: string) {
  const resolution = resolveDocumentPath(path);
  let query = supabase!.from(resolution.table).select('*').eq('id', resolution.documentId);

  for (const filter of resolution.implicitFilters) {
    query = filter.value === null ? query.is(filter.column, null) : query.eq(filter.column, filter.value);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    throw error;
  }

  return data ? mapDbRecordToApp<T>(data as Record<string, unknown>) : null;
}

function toSnapshotDoc<T extends DocumentData>(row: T): SnapshotDoc<T> {
  const { id, ...rest } = row as T & { id: string };
  return {
    id,
    data: () => rest as Omit<T, 'id'>,
  };
}

function subscribeToTable(path: string, onRefresh: () => void) {
  const resolution = resolveCollectionPath(path);
  const channel = supabase!
    .channel(`ff-sync:${resolution.table}:${Math.random().toString(36).slice(2)}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: resolution.table,
      },
      () => {
        void onRefresh();
      }
    )
    .subscribe();

  return () => {
    void supabase!.removeChannel(channel);
  };
}

export function collection(_db: unknown, ...segments: string[]) {
  return {
    kind: 'collection',
    path: segments.join('/'),
  } as CollectionRef;
}

export function doc(reference: unknown, ...segments: string[]) {
  if (typeof reference === 'object' && reference !== null && 'kind' in reference && (reference as CollectionRef).kind === 'collection') {
    const collectionRef = reference as CollectionRef;
    const id = segments[0] || crypto.randomUUID();
    return {
      kind: 'doc',
      path: `${collectionRef.path}/${id}`,
      id,
    } as DocRef;
  }

  const path = segments.join('/');
  return {
    kind: 'doc',
    path,
    id: segments[segments.length - 1],
  } as DocRef;
}

export function query(collectionRef: CollectionRef, ...constraints: QueryConstraint[]) {
  return {
    kind: 'query',
    path: collectionRef.path,
    constraints,
  } as QueryRef;
}

export function where(field: string, op: QueryFilterConstraint['op'], value: unknown) {
  return {
    kind: 'where',
    field,
    op,
    value,
    toString: () => `where:${field}:${op}:${String(value)}`,
  } as QueryFilterConstraint;
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
  return {
    kind: 'orderBy',
    field,
    direction,
    toString: () => `orderBy:${field}:${direction}`,
  } as QueryOrderConstraint;
}

export function limit(count: number) {
  return {
    kind: 'limit',
    count,
    toString: () => `limit:${count}`,
  } as QueryLimitConstraint;
}

export function onSnapshot<T extends DocumentData>(
  input: CollectionRef | QueryRef | DocRef,
  onNext: (snapshot: any) => void,
  onError?: (error: DatabaseError) => void,
) {
  let active = true;

  const refresh = async () => {
    try {
      if (input.kind === 'doc') {
        const row = await executeDocumentQuery<T>(input.path);
        if (!active) {
          return;
        }

        onNext({
          exists: () => Boolean(row),
          id: row && 'id' in row ? String((row as unknown as { id: string }).id) : input.id,
          data: () => {
            if (!row) {
              return undefined;
            }
            const { id, ...rest } = row as T & { id: string };
            return rest;
          },
        });
        return;
      }

      const rows = await executeCollectionQuery<T>(input.path, input.kind === 'query' ? input.constraints : []);
      if (!active) {
        return;
      }

      onNext({
        docs: rows.map((row) => toSnapshotDoc(row)),
      });
    } catch (error) {
      if (onError) {
        onError(error as DatabaseError);
      }
    }
  };

  void refresh();
  const realtimePath = input.kind === 'doc' ? resolveDocumentPath(input.path).collectionPath : input.path;
  const unsubscribeRealtime = subscribeToTable(realtimePath, refresh);

  return () => {
    active = false;
    unsubscribeRealtime();
  };
}

export async function addDoc(collectionRef: CollectionRef, payload: DocumentData) {
  const id = crypto.randomUUID();
  const docRef = doc(collectionRef, id);
  await setDoc(docRef, payload);
  return { id };
}

export async function getDoc<T extends DocumentData>(docRef: DocRef) {
  const row = await executeDocumentQuery<T>(docRef.path);
  return {
    exists: () => Boolean(row),
    id: row && 'id' in row ? String((row as unknown as { id: string }).id) : docRef.id,
    data: () => {
      if (!row) {
        return undefined;
      }
      const { id, ...rest } = row as T & { id: string };
      return rest;
    },
  };
}

export async function getDocFromServer<T extends DocumentData>(docRef: DocRef) {
  return getDoc<T>(docRef);
}

function withImplicitFields(docRef: DocRef, payload: DocumentData) {
  const resolution = resolveDocumentPath(docRef.path);
  const dbPayload = mapAppRecordToDb(payload);
  const implicit = resolution.implicitFilters.reduce<Record<string, unknown>>((accumulator, filter) => {
    accumulator[filter.column] = filter.value;
    return accumulator;
  }, {});

  return {
    id: resolution.documentId,
    ...implicit,
    ...dbPayload,
  };
}

export async function setDoc(docRef: DocRef, payload: DocumentData, options?: { merge?: boolean }) {
  const resolution = resolveDocumentPath(docRef.path);
  const { error } = await supabase!
    .from(resolution.table)
    .upsert(withImplicitFields(docRef, payload), { onConflict: 'id' })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  void options;
}

export async function updateDoc(docRef: DocRef, payload: DocumentData) {
  const resolution = resolveDocumentPath(docRef.path);
  let query = supabase!.from(resolution.table).update(mapAppRecordToDb(payload)).eq('id', resolution.documentId);

  for (const filter of resolution.implicitFilters) {
    query = filter.value === null ? query.is(filter.column, null) : query.eq(filter.column, filter.value);
  }

  const { error } = await query;
  if (error) {
    throw error;
  }
}

export async function deleteDoc(docRef: DocRef) {
  const resolution = resolveDocumentPath(docRef.path);
  let query = supabase!.from(resolution.table).delete().eq('id', resolution.documentId);

  for (const filter of resolution.implicitFilters) {
    query = filter.value === null ? query.is(filter.column, null) : query.eq(filter.column, filter.value);
  }

  const { error } = await query;
  if (error) {
    throw error;
  }
}

export function serverTimestamp() {
  return new Date().toISOString();
}

export function writeBatch(_db: unknown) {
  const operations: Array<() => Promise<void>> = [];

  return {
    set(docRef: DocRef, payload: DocumentData, options?: { merge?: boolean }) {
      operations.push(() => setDoc(docRef, payload, options));
    },
    update(docRef: DocRef, payload: DocumentData) {
      operations.push(() => updateDoc(docRef, payload));
    },
    delete(docRef: DocRef) {
      operations.push(() => deleteDoc(docRef));
    },
    async commit() {
      for (const operation of operations) {
        await operation();
      }
    },
  };
}

