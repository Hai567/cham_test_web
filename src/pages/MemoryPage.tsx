import { Camera } from 'lucide-react';
import { useCallback, useEffect, useReducer, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { buttonClass } from '../components/buttonClass';
import { Notice } from '../components/ui';
import { findMemory, listMemoryCodes, normalizeCode, type Memory } from '../features/memory/catalog';
import { MemoryCamera } from '../features/memory/MemoryCamera';
import { createMemoryVideo, primeMemoryVideo } from '../features/memory/memoryVideo';
import { targetJob } from '../features/memory/targets';

/**
 * /memory         nhập mã in ở mặt sau khung
 * /memory/:code   xem kỷ niệm: mở camera, hướng vào ảnh, video phát đè lên ảnh
 */
export function MemoryPage() {
  const { code: param } = useParams();
  const navigate = useNavigate();
  const memory = param ? findMemory(param) : null;

  useEffect(() => {
    if (memory && param !== memory.code) navigate(`/memory/${memory.code}`, { replace: true });
  }, [memory, param, navigate]);

  return (
    <div className="min-h-screen bg-paper">
      <header className="container-page flex h-16 items-center">
        <Logo />
      </header>
      <main className="container-page pb-20 pt-4 sm:pt-10">
        {memory ? <MemoryReady key={memory.code} memory={memory} /> : <CodeEntry key={param ?? ''} initial={param ?? ''} />}
      </main>
    </div>
  );
}

function CodeEntry({ initial }: { initial: string }) {
  const navigate = useNavigate();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(initial ? notFoundText(initial) : null);
  const devCodes = import.meta.env.DEV ? listMemoryCodes() : [];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const code = normalizeCode(value);
    if (!code) return setError('Nhập mã in ở mặt sau khung ảnh.');
    if (!findMemory(code)) return setError(notFoundText(code));
    navigate(`/memory/${code}`);
  };

  return (
    <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[1fr_minmax(0,360px)] md:gap-20">
      <div>
        <h1 className="font-display text-[2.2rem] font-normal leading-[1.08] sm:text-[3rem]">Mở lại một kỷ niệm</h1>
        <p className="mt-4 max-w-[36ch] text-[17px] text-cocoa-soft">
          Nhập mã in ở mặt sau khung ảnh. Sau đó hướng camera vào ảnh để thấy khoảnh khắc ấy chuyển động trở lại.
        </p>
      </div>

      {/* Mặt sau khung ảnh: tấm lưng ngà, móc treo và bốn lẫy giữ. Khách "ghi" mã lên đó. */}
      <div className="relative mx-auto w-full max-w-[360px] rounded-[10px] bg-sand p-3 shadow-frame">
        <div className="relative flex aspect-[3/4] flex-col justify-center rounded-[3px] border border-taupe/50 bg-ivory px-7">
          <span aria-hidden className="absolute left-1/2 top-7 h-2 w-14 -translate-x-1/2 rounded-full bg-taupe/35" />
          <span aria-hidden className="absolute left-1/2 top-0 h-2 w-5 -translate-x-1/2 -translate-y-1/2 rounded-[2px] bg-taupe" />
          <span aria-hidden className="absolute bottom-0 left-1/2 h-2 w-5 -translate-x-1/2 translate-y-1/2 rounded-[2px] bg-taupe" />
          <span aria-hidden className="absolute left-0 top-1/2 h-5 w-2 -translate-x-1/2 -translate-y-1/2 rounded-[2px] bg-taupe" />
          <span aria-hidden className="absolute right-0 top-1/2 h-5 w-2 -translate-y-1/2 translate-x-1/2 rounded-[2px] bg-taupe" />

          <form onSubmit={submit} noValidate>
            <label htmlFor="memory-code" className="block text-center text-[15px] font-medium text-cocoa">
              Mã kỷ niệm
            </label>
            <input
              id="memory-code"
              value={value}
              onChange={(e) => {
                setValue(e.target.value.toUpperCase());
                setError(null);
              }}
              autoComplete="off"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              maxLength={24}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'memory-code-error' : undefined}
              className="mt-3 block w-full rounded-none border-0 border-b-2 border-cocoa/25 bg-transparent px-1 py-2 text-center text-[26px] font-semibold tracking-[0.24em] text-cocoa transition-colors focus:border-cocoa focus:bg-blush-soft/40 focus:outline-none"
            />
            <p id="memory-code-error" role="alert" className="mt-3 min-h-[2.8em] text-center text-[14px] leading-snug text-danger">
              {error}
            </p>
            <button type="submit" className={buttonClass('primary', 'mt-2 w-full')}>
              Tìm kỷ niệm
            </button>
          </form>

          {devCodes.length > 0 && (
            <p className="absolute inset-x-0 bottom-6 text-center text-[13px] text-cocoa-soft">Mã thử: {devCodes.join(', ')}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function notFoundText(code: string) {
  return `Không có kỷ niệm nào mang mã “${normalizeCode(code)}”. Kiểm tra lại mã ở mặt sau khung.`;
}

function MemoryReady({ memory }: { memory: Memory }) {
  const [job, setJob] = useState(() => targetJob(memory));
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const [photoAspect, setPhotoAspect] = useState(3 / 4);
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Chuẩn bị dữ liệu nhận diện và tải sẵn engine ngay khi tìm thấy mã, để bấm "Mở camera" là chạy.
  useEffect(() => {
    let alive = true;
    const unsubscribe = job.subscribe(rerender);
    job.promise.then(
      () => alive && setPhase('ready'),
      () => alive && setPhase('error'),
    );
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [job]);

  useEffect(() => {
    void import('../features/memory/MemoryAREngine').catch(() => undefined);
  }, []);

  useEffect(
    () => () => {
      const v = videoRef.current;
      if (v) {
        v.pause();
        v.removeAttribute('src');
        v.load(); // giải phóng bộ giải mã khi rời trang
      }
    },
    [],
  );

  const retryTarget = () => {
    setPhase('loading');
    setJob(targetJob(memory));
  };

  const openCamera = () => {
    // Tạo và "mồi" video trong chính thao tác chạm, trước mọi await.
    const video = videoRef.current ?? createMemoryVideo(memory.videoUrl);
    videoRef.current = video;
    primeMemoryVideo(video);
    setCameraOpen(true);
  };

  const getTarget = useCallback(() => targetJob(memory).promise, [memory]);
  const closeCamera = useCallback(() => setCameraOpen(false), []);
  const progress = phase === 'loading' ? job.progress : null;

  return (
    <>
      <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[minmax(0,360px)_1fr] md:gap-20">
        <figure className="mx-auto w-full max-w-[300px] rounded-[10px] bg-sand p-3 shadow-frame md:max-w-[360px]">
          <img
            src={memory.photoUrl}
            alt={memory.title ? `Ảnh kỷ niệm: ${memory.title}` : 'Ảnh kỷ niệm'}
            className="block w-full rounded-[3px]"
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth && img.naturalHeight) setPhotoAspect(img.naturalWidth / img.naturalHeight);
            }}
          />
        </figure>

        <div>
          <p className="text-[15px] text-cocoa-soft">Mã {memory.code}</p>
          <h1 className="mt-2 font-display text-[2.1rem] font-normal leading-[1.1] sm:text-[2.75rem]">
            {memory.title ?? 'Kỷ niệm của bạn đã sẵn sàng'}
          </h1>
          {memory.message && <p className="mt-4 max-w-[38ch] font-display text-[19px] italic leading-relaxed text-cocoa">{memory.message}</p>}
          <p className="mt-6 max-w-[40ch] text-cocoa-soft">
            Đặt khung ảnh ở nơi đủ sáng. Khi camera mở, hướng máy vào trọn tấm ảnh và giữ yên một chút.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button type="button" className={buttonClass('primary', 'px-6')} onClick={openCamera} disabled={phase === 'error'}>
              <Camera aria-hidden className="h-5 w-5" />
              Mở camera
            </button>
            <Link to="/memory" className={buttonClass('ghost')}>
              Nhập mã khác
            </Link>
          </div>

          <p aria-live="polite" className="mt-4 min-h-[1.6em] text-sm text-cocoa-soft">
            {progress != null && `Đang chuẩn bị nhận diện ảnh, ${Math.round(progress)}%. Chỉ lần đầu mới cần bước này.`}
          </p>

          {phase === 'error' && (
            <Notice tone="error" title="Chưa chuẩn bị được nhận diện ảnh" className="mt-2">
              Kiểm tra kết nối mạng rồi thử lại.
              <button type="button" className={buttonClass('secondary', 'mt-3')} onClick={retryTarget}>
                Thử lại
              </button>
            </Notice>
          )}
        </div>
      </div>

      {cameraOpen && videoRef.current && (
        <MemoryCamera
          memory={memory}
          video={videoRef.current}
          getTarget={getTarget}
          targetProgress={progress}
          photoAspect={photoAspect}
          onClose={closeCamera}
        />
      )}
    </>
  );
}
