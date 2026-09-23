export class StorageFullError extends Error {
  constructor() {
    super('Bộ nhớ trình duyệt đã đầy. Hãy xóa bớt đơn mẫu trong trang Vận hành hoặc dùng trình duyệt khác.');
    this.name = 'StorageFullError';
  }
}

export function isQuotaError(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED' || err.code === 22)
  );
}
