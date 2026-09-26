import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  writeBatch,
  QueryConstraint,
} from '@react-native-firebase/firestore';
import { db } from '../firebase/firebase';
import { BaseDocument } from '../models';

export type Unsubscribe = () => void;

/**
 * Thin typed wrappers over Firestore. Documents are stored exactly as the
 * model types describe them; there is no separate wire format.
 */
export const readDoc = async <T>(path: string): Promise<T | null> => {
  const snap = await getDoc(doc(db, path));
  return snap.exists() ? (snap.data() as T) : null;
};

export const writeDoc = async <T extends object>(path: string, data: T): Promise<void> => {
  await setDoc(doc(db, path), data);
};

/**
 * Write many documents as one commit so listeners fire once, not once per
 * document. Firestore caps a batch at 500 writes, so larger sets are split.
 */
export const writeDocs = async <T extends object>(items: { path: string; data: T }[]): Promise<void> => {
  const LIMIT = 500;
  for (let i = 0; i < items.length; i += LIMIT) {
    const batch = writeBatch(db);
    for (const { path, data } of items.slice(i, i + LIMIT)) batch.set(doc(db, path), data);
    await batch.commit();
  }
};

export const patchDoc = async <T extends object>(path: string, data: Partial<T>): Promise<void> => {
  await updateDoc(doc(db, path), data as any);
};

/** Like patchDoc, but creates the document if it doesn't exist yet. */
export const mergeDoc = async <T extends object>(path: string, data: Partial<T>): Promise<void> => {
  await setDoc(doc(db, path), data as any, { merge: true });
};

export const removeDoc = async (path: string): Promise<void> => {
  await deleteDoc(doc(db, path));
};

export const listDocs = async <T>(collectionPath: string, ...constraints: QueryConstraint[]): Promise<T[]> => {
  const snap = await getDocs(query(collection(db, collectionPath), ...constraints));
  return snap.docs.map(d => d.data() as T);
};

/**
 * Listener errors (for example permission-denied right after the account is
 * deleted or signed out) are logged, never thrown: a single callback would be
 * treated as the legacy `(snapshot, error)` signature and receive `null`.
 */
const onListenError = (path: string) => (err: unknown) => console.warn(`[firestore] listener on ${path} stopped:`, err);

export const watchDoc = <T>(path: string, onChange: (value: T | null) => void): Unsubscribe =>
  onSnapshot(doc(db, path), snap => onChange(snap && snap.exists() ? (snap.data() as T) : null), onListenError(path));

export const watchDocs = <T>(
  collectionPath: string,
  onChange: (values: T[]) => void,
  ...constraints: QueryConstraint[]
): Unsubscribe =>
  onSnapshot(
    query(collection(db, collectionPath), ...constraints),
    snap => onChange(snap ? snap.docs.map(d => d.data() as T) : []),
    onListenError(collectionPath),
  );

/** Fill in the timestamps every persisted document carries. */
export const stamp = <T extends Omit<BaseDocument, 'createdAt' | 'updatedAt'>>(
  data: T,
  now: number = Date.now(),
): T & Pick<BaseDocument, 'createdAt' | 'updatedAt'> => ({ ...data, createdAt: now, updatedAt: now });

export const touch = <T extends BaseDocument>(data: T, now: number = Date.now()): T => ({ ...data, updatedAt: now });

export { where, orderBy };
