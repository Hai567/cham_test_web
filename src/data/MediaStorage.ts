/**
 * Lưu file blob trên thiết bị. MVP không upload media ra bất kỳ dịch vụ nào.
 * Khi có backend: tạo RemoteMediaStorage implement interface này.
 */
export interface MediaStorage {
  /** 'memory' nghĩa là file sẽ mất khi tải lại trang. */
  readonly kind: 'indexeddb' | 'memory';
  put(id: string, blob: Blob): Promise<void>;
  get(id: string): Promise<Blob | null>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

export class MemoryMediaStorage implements MediaStorage {
  readonly kind = 'memory' as const;
  private readonly map = new Map<string, Blob>();
  async put(id: string, blob: Blob) {
    this.map.set(id, blob);
  }
  async get(id: string) {
    return this.map.get(id) ?? null;
  }
  async remove(id: string) {
    this.map.delete(id);
  }
  async clear() {
    this.map.clear();
  }
}
