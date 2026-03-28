import type { StitcherProject, TimelineSegment } from './types';

const DB_NAME = 'eyesy-clip-stitch';
const DB_VERSION = 1;
const STORE = 'projects';

interface StoredProjectRow {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  segments: StoredSegmentRow[];
}

interface StoredSegmentRow {
  id: string;
  label: string;
  order: number;
  trimStart: number;
  trimEnd: number;
  blob: Blob;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
  });
}

export async function saveStitcherProject(project: StitcherProject): Promise<void> {
  const db = await openDb();
  const row: StoredProjectRow = {
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    segments: project.segments.map((s) => ({
      id: s.id,
      label: s.label,
      order: s.order,
      trimStart: s.trimStart,
      trimEnd: s.trimEnd,
      blob: s.source,
    })),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(STORE).put(row);
  });
}

export async function listStitcherProjectSummaries(): Promise<
  Pick<StitcherProject, 'id' | 'name' | 'updatedAt'>[]
> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const rows = req.result as StoredProjectRow[];
      resolve(
        rows.map((r) => ({
          id: r.id,
          name: r.name,
          updatedAt: r.updatedAt,
        }))
      );
    };
    req.onerror = () => reject(req.error);
  });
}

export async function loadStitcherProject(id: string): Promise<StitcherProject | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => {
      const row = req.result as StoredProjectRow | undefined;
      if (!row) {
        resolve(null);
        return;
      }
      const segments: TimelineSegment[] = row.segments
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((s) => ({
          id: s.id,
          label: s.label,
          source: s.blob,
          trimStart: s.trimStart,
          trimEnd: s.trimEnd,
          order: s.order,
        }));
      resolve({
        id: row.id,
        name: row.name,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        segments,
      });
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteStitcherProject(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(STORE).delete(id);
  });
}
