/** Lỗi của trải nghiệm AR, tách khỏi engine để UI không phải tải three.js chỉ để hiện lỗi. */
export type AREngineErrorCode =
  | 'insecure'
  | 'unsupported'
  | 'permission'
  | 'no-camera'
  | 'camera-busy'
  | 'camera-stopped'
  | 'webgl'
  | 'target'
  | 'video'
  | 'unknown';

export class AREngineError extends Error {
  readonly code: AREngineErrorCode;
  constructor(code: AREngineErrorCode, cause?: unknown) {
    super(code);
    this.name = 'AREngineError';
    this.code = code;
    if (cause !== undefined) (this as { cause?: unknown }).cause = cause;
  }
}

export const AR_ERROR_COPY: Record<AREngineErrorCode, { title: string; body: string; canRetry: boolean }> = {
  insecure: { title: 'Camera cần kết nối an toàn', body: 'Mở trang bằng địa chỉ https:// rồi thử lại.', canRetry: false },
  unsupported: { title: 'Trình duyệt chưa hỗ trợ camera', body: 'Mở trang bằng Safari trên iPhone hoặc Chrome trên Android, bản mới nhất.', canRetry: false },
  permission: {
    title: 'Chạm chưa được phép dùng camera',
    body: 'Cho phép camera cho trang này trong cài đặt của trình duyệt, rồi bấm Thử lại.',
    canRetry: true,
  },
  'no-camera': { title: 'Không tìm thấy camera', body: 'Thiết bị này không có camera hoặc camera đang bị tắt.', canRetry: true },
  'camera-busy': { title: 'Camera đang bận', body: 'Đóng ứng dụng khác đang dùng camera rồi thử lại.', canRetry: true },
  'camera-stopped': { title: 'Camera đã dừng', body: 'Bấm Thử lại để mở lại camera.', canRetry: true },
  webgl: { title: 'Không hiển thị được video trên ảnh', body: 'Trình duyệt đang tắt WebGL. Thử Safari hoặc Chrome bản mới nhất.', canRetry: false },
  target: { title: 'Không đọc được dữ liệu nhận diện ảnh', body: 'Kiểm tra kết nối mạng rồi thử lại.', canRetry: true },
  video: { title: 'Không phát được video kỷ niệm', body: 'Video có thể sai định dạng. Hãy dùng file MP4 (H.264).', canRetry: true },
  unknown: { title: 'Chưa mở được trải nghiệm', body: 'Thử lại sau vài giây.', canRetry: true },
};

export function cameraErrorFrom(err: unknown): AREngineError {
  const name = err instanceof DOMException || err instanceof Error ? err.name : '';
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return new AREngineError('permission', err);
    case 'NotFoundError':
    case 'OverconstrainedError':
      return new AREngineError('no-camera', err);
    case 'NotReadableError':
    case 'AbortError':
      return new AREngineError('camera-busy', err);
    default:
      return new AREngineError('unknown', err);
  }
}
