import { StorageFullError } from './errors';
import { MemoryMediaStorage, type MediaStorage } from './MediaStorage';

const DB_NAME = 'cham-media';
const STORE = 'blobs';

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export class IndexedDbMediaStorage implements MediaStorage {
  readonly kind = 'indexeddb' as const;
  private constructor(private readonly db: IDBDatabase) {}

  static async open(timeoutMs = 3000): Promise<IndexedDbMediaStorage> {
    if (typeof indexedDB === 'undefined') throw new Error('IndexedDB không khả dụng');
    const open = indexedDB.open(DB_NAME, 1);
    open.onupgradeneeded = () => {
      if (!open.result.objectStoreNames.contains(STORE)) open.result.createObjectStore(STORE);
    };
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('IndexedDB timeout')), timeoutMs));
    const db = await Promise.race([req(open), timeout]);
    return new IndexedDbMediaStorage(db);
  }

  private async run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const tx = this.db.transaction(STORE, mode);
    try {
      return await req(fn(tx.objectStore(STORE)));
    } catch (err) {
      if (err instanceof DOMException && err.name === 'QuotaExceededError') throw new StorageFullError();
      throw err;
    }
  }

  async put(id: string, blob: Blob) {
    await this.run('readwrite', (s) => s.put(blob, id));
  }
  async get(id: string) {
    const v = await this.run<unknown>('readonly', (s) => s.get(id));
    return v instanceof Blob ? v : null;
  }
  async remove(id: string) {
    await this.run('readwrite', (s) => s.delete(id));
  }
  async clear() {
    await this.run('readwrite', (s) => s.clear());
  }
}

/** Thử IndexedDB, nếu bị chặn (private mode, trình duyệt cũ) thì dùng bộ nhớ tạm. */
export async function createMediaStorage(): Promise<MediaStorage> {
  try {
    return await IndexedDbMediaStorage.open();
  } catch {
    return new MemoryMediaStorage();
  }
}
