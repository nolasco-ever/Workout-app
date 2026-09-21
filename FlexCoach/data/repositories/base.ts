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

export const patchDoc = async <T extends object>(path: string, data: Partial<T>): Promise<void> => {
  await updateDoc(doc(db, path), data as any);
};

export const removeDoc = async (path: string): Promise<void> => {
  await deleteDoc(doc(db, path));
};

export const listDocs = async <T>(collectionPath: string, ...constraints: QueryConstraint[]): Promise<T[]> => {
  const snap = await getDocs(query(collection(db, collectionPath), ...constraints));
  return snap.docs.map(d => d.data() as T);
};

export const watchDoc = <T>(path: string, onChange: (value: T | null) => void): Unsubscribe =>
  onSnapshot(doc(db, path), snap => onChange(snap.exists() ? (snap.data() as T) : null));

export const watchDocs = <T>(
  collectionPath: string,
  onChange: (values: T[]) => void,
  ...constraints: QueryConstraint[]
): Unsubscribe =>
  onSnapshot(query(collection(db, collectionPath), ...constraints), snap => onChange(snap.docs.map(d => d.data() as T)));

/** Fill in the timestamps every persisted document carries. */
export const stamp = <T extends Omit<BaseDocument, 'createdAt' | 'updatedAt'>>(
  data: T,
  now: number = Date.now(),
): T & Pick<BaseDocument, 'createdAt' | 'updatedAt'> => ({ ...data, createdAt: now, updatedAt: now });

export const touch = <T extends BaseDocument>(data: T, now: number = Date.now()): T => ({ ...data, updatedAt: now });

export { where, orderBy };
