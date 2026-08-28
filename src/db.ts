import type { Passage } from './types';

export const REAL_DB_NAME = 'practice-loop-notebook';
export const DEMO_DB_NAME = 'demo:practice-loop-notebook';
const STORE = 'passages';
const VERSION = 1;
let demoMode = false;

export function setDemoStorage(enabled: boolean): void {
  demoMode = enabled;
}

export function activeDatabaseName(): string {
  return demoMode ? DEMO_DB_NAME : REAL_DB_NAME;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(activeDatabaseName(), VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open local storage.'));
  });
}

export async function getPassages(): Promise<Passage[]> {
  const db = await openDb();
  return new Promise<Passage[]>((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).getAll();
    request.onsuccess = () => resolve((request.result as Passage[]).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    request.onerror = () => reject(request.error);
  }).finally(() => db.close());
}

export async function putPassage(passage: Passage): Promise<void> {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE, 'readwrite').objectStore(STORE).put(passage);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  }).finally(() => db.close());
}

export async function deletePassage(id: string): Promise<void> {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  }).finally(() => db.close());
}

export async function mergePassages(imported: Omit<Passage, 'media'>[]): Promise<number> {
  const existing = await getPassages();
  const byId = new Map(existing.map((passage) => [passage.id, passage]));
  let count = 0;
  for (const passage of imported) {
    const current = byId.get(passage.id);
    if (!current || passage.updatedAt > current.updatedAt) {
      await putPassage({ ...passage, media: current?.media });
      count += 1;
    }
  }
  return count;
}

export async function clearPassages(): Promise<void> {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE, 'readwrite').objectStore(STORE).clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  }).finally(() => db.close());
}

/** Remove the active notebook namespace entirely when a visitor leaves demo mode. */
export function discardActiveDatabase(): Promise<void> {
  const name = activeDatabaseName();
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onblocked = () => reject(new Error('Close other demo tabs, then try starting for real again.'));
    request.onerror = () => reject(request.error ?? new Error('Could not discard the demo notebook.'));
  });
}
