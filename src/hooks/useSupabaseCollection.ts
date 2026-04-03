import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  QueryConstraint,
  DocumentData,
  DatabaseError,
} from '../lib/db/supabaseData';
import { db } from '../lib/supabase/appClient';
import { handleDataOperationError, DataOperationType } from '../lib/databaseErrorHandler';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export function useSupabaseCollection<T extends DocumentData>(
  collectionPath: string | null | undefined,
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DatabaseError | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('syncing');

  const constraintsKey = JSON.stringify(constraints.map(c => c.toString?.() || 'constraint'));

  useEffect(() => {
    if (!collectionPath) {
      setData([]);
      setLoading(false);
      setSyncStatus('synced');
      return;
    }

    setSyncStatus('syncing');
    const q = query(collection(db, collectionPath), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((documentSnapshot) => ({
          id: documentSnapshot.id,
          ...documentSnapshot.data()
        })) as unknown as T[];
        setData(items);
        setLoading(false);
        setSyncStatus(navigator.onLine ? 'synced' : 'offline');
      },
      (err) => {
        setError(err);
        setLoading(false);
        setSyncStatus('error');
        handleDataOperationError(err, DataOperationType.LIST, collectionPath);
      }
    );

    return () => unsubscribe();
  }, [collectionPath, constraintsKey]);

  const add = useCallback(async (item: Omit<T, 'id'>) => {
    if (!collectionPath) return;
    setSyncStatus('syncing');
    try {
      const docRef = await addDoc(collection(db, collectionPath), {
        ...item,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setSyncStatus('synced');
      return docRef.id;
    } catch (err) {
      setSyncStatus('error');
      handleDataOperationError(err, DataOperationType.CREATE, collectionPath);
    }
  }, [collectionPath]);

  const update = useCallback(async (id: string, item: Partial<T>) => {
    if (!collectionPath) return;
    setSyncStatus('syncing');
    try {
      const docRef = doc(db, collectionPath, id);
      await updateDoc(docRef, {
        ...item,
        updatedAt: new Date().toISOString()
      });
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
      handleDataOperationError(err, DataOperationType.UPDATE, `${collectionPath}/${id}`);
    }
  }, [collectionPath]);

  const set = useCallback(async (id: string, item: T) => {
    if (!collectionPath) return;
    setSyncStatus('syncing');
    try {
      const { setDoc } = await import('../lib/db/supabaseData');
      const docRef = doc(db, collectionPath, id);
      await setDoc(docRef, {
        ...item,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
      handleDataOperationError(err, DataOperationType.WRITE, `${collectionPath}/${id}`);
    }
  }, [collectionPath]);

  const remove = useCallback(async (id: string) => {
    if (!collectionPath) return;
    setSyncStatus('syncing');
    try {
      const docRef = doc(db, collectionPath, id);
      await deleteDoc(docRef);
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
      handleDataOperationError(err, DataOperationType.DELETE, `${collectionPath}/${id}`);
    }
  }, [collectionPath]);

  return { data, loading, error, syncStatus, add, update, set, remove };
}

