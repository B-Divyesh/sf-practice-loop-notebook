import type { Passage } from './types';

const DB_NAME = 'practice-loop-notebook';
const STORE = 'passages';
const VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
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
