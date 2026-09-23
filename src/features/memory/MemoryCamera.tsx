import { Volume2, VolumeX, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { buttonClass } from '../../components/buttonClass';
import { AR_ERROR_COPY, AREngineError } from './arErrors';
import type { Memory } from './catalog';
import type { AREngineStatus, MemoryAREngine } from './MemoryAREngine';

interface Props {
  memory: Memory;
  video: HTMLVideoElement;
  /** Trả về promise dữ liệu nhận diện; gọi lại khi người dùng bấm Thử lại. */
  getTarget: () => Promise<ArrayBuffer>;
  /** Tiến độ biên dịch trên máy (chỉ có khi mã chưa có target.mind). */
  targetProgress: number | null;
  photoAspect: number;
  onClose: () => void;
}

/** Màn hình camera toàn màn hình. Engine sống ngoài React; component chỉ giữ trạng thái để hiển thị. */
export function MemoryCamera({ memory, video, getTarget, targetProgress, photoAspect, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const getTargetRef = useRef(getTarget);
  getTargetRef.current = getTarget;

  const [status, setStatus] = useState<AREngineStatus>('camera');
  const [error, setError] = useState<AREngineError | null>(null);
  const [muted, setMuted] = useState(video.muted);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let engine: MemoryAREngine | null = null;
    let cancelled = false;
    setError(null);
    setStatus('camera');
    if (video.error) video.load(); // lần thử trước lỗi tải video (mạng chập chờn): nạp lại một lần

    import('./MemoryAREngine')
      .then(({ MemoryAREngine }) => {
        if (cancelled) return;
        engine = new MemoryAREngine({
          container,
          memoryVideo: video,
          target: getTargetRef.current(),
          onStatus: setStatus,
          onError: setError,
          onAutoMuted: () => setMuted(true),
        });
        void engine.start();
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(new AREngineError('unknown', err));
      });

    return () => {
      cancelled = true;
      engine?.destroy();
    };
  }, [video, attempt]);

  // Khóa cuộn trang nền, Esc để đóng, đưa focus vào nút đóng.
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      root.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  // Đổi âm thanh ngay trong thao tác chạm để iOS cho phép phát có tiếng.
  const toggleSound = useCallback(() => {
    const next = !video.muted;
    video.muted = next;
    setMuted(next);
    if (!next && video.paused && status === 'tracking') void video.play().catch(() => undefined);
  }, [video, status]);

  const copy = error ? AR_ERROR_COPY[error.code] : null;
  const pill = 'pointer-events-auto inline-flex min-h-[44px] items-center gap-2 rounded-full bg-black/45 text-[15px] font-medium text-cream backdrop-blur-md transition-colors hover:bg-black/60';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black" role="dialog" aria-modal="true" aria-label="Camera xem kỷ niệm">
      <div ref={containerRef} className="absolute inset-0" />

      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 px-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Đóng camera" className={`${pill} w-11 justify-center`}>
          <X aria-hidden className="h-5 w-5" />
        </button>
        {!error && (
          <button type="button" onClick={toggleSound} aria-pressed={!muted} className={`${pill} px-4`}>
            {muted ? <VolumeX aria-hidden className="h-5 w-5" /> : <Volume2 aria-hidden className="h-5 w-5" />}
            {muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          </button>
        )}
      </div>

      {!error && status === 'scanning' && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="memory-guide relative" style={{ width: 'min(70vw, 340px)', aspectRatio: String(photoAspect), maxHeight: '62vh' }} aria-hidden>
            <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-[6px] border-l-2 border-t-2 border-cream" />
            <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-[6px] border-r-2 border-t-2 border-cream" />
            <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-[6px] border-b-2 border-l-2 border-cream" />
            <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-[6px] border-b-2 border-r-2 border-cream" />
          </div>
        </div>
      )}

      {!error && status !== 'tracking' && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-4"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
        >
          <div role="status" className="flex max-w-sm items-center gap-3 rounded-2xl bg-black/50 py-2.5 pl-2.5 pr-4 text-cream backdrop-blur-md">
            {status === 'scanning' ? (
              <img src={memory.photoUrl} alt="" className="h-12 w-auto shrink-0 rounded-[3px] ring-1 ring-cream/30" style={{ aspectRatio: String(photoAspect) }} />
            ) : (
              <span aria-hidden className="ml-1.5 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-cream/25 border-t-cream" />
            )}
            <span className="text-[15px] leading-snug">
              {status === 'camera' && 'Đang mở camera'}
              {status === 'preparing' && (targetProgress != null ? `Đang chuẩn bị nhận diện ảnh, ${Math.round(targetProgress)}%` : 'Đang chuẩn bị nhận diện ảnh')}
              {status === 'scanning' && (
                <>
                  Hướng camera vào trọn tấm ảnh
                  <span className="block text-[13px] text-cream/70">Giữ máy cách ảnh khoảng 30 cm, nơi đủ sáng</span>
                </>
              )}
            </span>
          </div>
        </div>
      )}

      {copy && (
        <div
          className="absolute inset-x-0 bottom-0 px-4"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
        >
          <div role="alert" className="mx-auto max-w-md rounded-2xl bg-cream p-5 text-cocoa shadow-soft">
            <p className="font-display text-[22px] leading-tight">{copy.title}</p>
            <p className="mt-2 text-[15px] text-cocoa-soft">{copy.body}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {copy.canRetry && (
                <button type="button" className={buttonClass('primary')} onClick={() => setAttempt((n) => n + 1)}>
                  Thử lại
                </button>
              )}
              <button type="button" className={buttonClass('secondary')} onClick={onClose}>
                Đóng camera
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
