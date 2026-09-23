import type { Order } from '../domain/types';

/**
 * Gửi đơn từ trình duyệt của khách về cho team Chạm.
 * Giao diện chung để sau này đổi backend (Supabase, server riêng...) mà không sửa giao diện đặt hàng.
 */
export type SubmitProgress =
  | { phase: 'order' }
  | { phase: 'file'; index: number; total: number; name: string }
  | { phase: 'finish' };

export interface SkippedFile {
  name: string;
  reason: string;
}

export interface SubmitResult {
  /** 'remote': đơn đã về tới team. 'local-only': chưa cấu hình nơi nhận, đơn chỉ nằm trên máy khách. */
  mode: 'remote' | 'local-only';
  skipped: SkippedFile[];
}

export type BlobGetter = (mediaId: string) => Promise<Blob | null>;

export interface OrderSubmitter {
  readonly mode: 'remote' | 'local-only';
  submit(order: Order, getBlob: BlobGetter, onProgress?: (p: SubmitProgress) => void): Promise<SubmitResult>;
}

export class SubmitError extends Error {
  /** 'DUPLICATE': máy chủ đã có một đơn khác cùng mã; cần tạo mã mới rồi gửi lại. */
  constructor(
    message: string,
    readonly code?: 'DUPLICATE',
  ) {
    super(message);
    this.name = 'SubmitError';
  }
}

/** Dùng khi chưa có địa chỉ nhận đơn (chạy demo, chạy thử trên máy). */
export class LocalOnlySubmitter implements OrderSubmitter {
  readonly mode = 'local-only' as const;
  async submit(): Promise<SubmitResult> {
    return { mode: 'local-only', skipped: [] };
  }
}
