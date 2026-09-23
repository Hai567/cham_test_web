import { Camera, CameraOff, RotateCcw, ScanLine, Smartphone, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FrameMock } from '../../components/FrameMock';
import { MediaView } from '../../components/MediaView';
import { MemoryArt } from '../../components/MemoryArt';
import { buttonClass } from '../../components/buttonClass';
import { MODE_LABELS } from '../../domain/labels';
import type { MediaItem, Mode, Mood, PrintTarget } from '../../domain/types';
import { useMediaUrl } from '../../lib/useMediaUrl';
import { frameSecond } from '../../domain/media';

export interface ARPreviewSource {
  mode: Mode;
  mood: Mood | null;
  media: MediaItem[];
  printTarget: PrintTarget;
  chosenFrame?: number | null;
}

type Phase = 'idle' | 'permission' | 'denied' | 'scanning' | 'playing';

/**
 * Mô phỏng trải nghiệm người nhận: quét QR, cấp quyền camera, hướng vào ảnh, video phủ lên ảnh.
 * Đây KHÔNG phải AR thật: không dùng camera, không nhận diện ảnh.
 */
export function ARPreview({ source, compact = false }: { source: ARPreviewSource; compact?: boolean }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const target = useMemo(() => findTarget(source), [source]);
  const video = source.media.find((m) => m.kind === 'video') ?? null;

  useEffect(() => {
    if (phase !== 'scanning') return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(() => setPhase('playing'), reduce ? 300 : 1600);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div className={`mx-auto w-full ${compact ? 'max-w-[300px]' : 'max-w-[340px]'}`}>
      <div className="rounded-[34px] bg-ink p-2.5 shadow-frame">
        <div className="relative overflow-hidden rounded-[26px] bg-[#2A2622]">
          <div className="absolute left-3 top-3 z-20 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-navy">Bản mô phỏng AR</div>
          <div className="relative flex aspect-[9/16] items-center justify-center bg-[radial-gradient(circle_at_50%_40%,#5a4f45,#2a2622_70%)] px-8">
            <div className="w-full max-w-[210px]">
              <FrameMock>
                {phase === 'playing' ? (
                  <PlayingLayer source={source} video={video} target={target} />
                ) : (
                  <TargetImage target={target} source={source} />
                )}
                {phase === 'scanning' && (
                  <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                    <div className="scan-line h-1/3 w-full bg-gradient-to-b from-transparent via-lavender/50 to-transparent" />
                    <div className="absolute inset-2 rounded border-2 border-dashed border-white/90" />
                  </div>
                )}
              </FrameMock>
            </div>
            {phase === 'permission' && <PermissionSheet onAllow={() => setPhase('scanning')} onDeny={() => setPhase('denied')} />}
            {phase === 'denied' && <DeniedSheet onRetry={() => setPhase('permission')} />}
          </div>
        </div>
      </div>

      <div className="mt-4 min-h-[88px] text-center" aria-live="polite">
        {phase === 'idle' && (
          <>
            <p className="text-[15px] text-muted">Người nhận quét QR ở mặt sau khung, rồi hướng camera vào ảnh.</p>
            <button type="button" className={buttonClass('primary', 'mt-3')} onClick={() => setPhase('permission')}>
              <Smartphone aria-hidden className="h-4 w-4" /> Bắt đầu mô phỏng
            </button>
          </>
        )}
        {phase === 'permission' && <p className="text-[15px] text-muted">Trình duyệt hỏi quyền dùng camera.</p>}
        {phase === 'denied' && <p className="text-[15px] text-muted">Người nhận đã từ chối quyền camera.</p>}
        {phase === 'scanning' && (
          <p className="inline-flex items-center gap-2 text-[15px] text-navy">
            <ScanLine aria-hidden className="h-4 w-4" /> Đang tìm ảnh trong khung...
          </p>
        )}
        {phase === 'playing' && (
          <>
            <p className="text-[15px] text-navy">
              Đã nhận diện ảnh. Đang phát: <strong>{MODE_LABELS[source.mode]}</strong>
            </p>
            <button type="button" className={buttonClass('ghost', 'mt-2')} onClick={() => setPhase('idle')}>
              <RotateCcw aria-hidden className="h-4 w-4" /> Xem lại từ đầu
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function findTarget(source: ARPreviewSource): { item: MediaItem | null; at: number } {
  const t = source.printTarget;
  if (t.type === 'media') return { item: source.media.find((m) => m.id === t.mediaId) ?? null, at: 0.1 };
  if (t.type === 'extract_frame') {
    const v = source.media.find((m) => m.id === t.videoId) ?? null;
    return { item: v, at: frameSecond(v, source.chosenFrame ?? 1) };
  }
  return { item: source.media[0] ?? null, at: 0.1 };
}


function TargetImage({ target, source }: { target: { item: MediaItem | null; at: number }; source: ARPreviewSource }) {
  return <MediaView item={target.item} mood={source.mood} atSecond={target.at} className="h-full w-full" />;
}

function PlayingLayer({ source, video, target }: { source: ARPreviewSource; video: MediaItem | null; target: { item: MediaItem | null; at: number } }) {
  const [stage, setStage] = useState<'living' | 'montage'>(source.mode === 'B' || !video ? 'montage' : 'living');

  useEffect(() => {
    if (source.mode !== 'C' || !video) return;
    const t = setTimeout(() => setStage('montage'), 6000);
    return () => clearTimeout(t);
  }, [source.mode, video]);

  return (
    <div className="reveal absolute inset-0">
      {stage === 'living' && video ? (
        <LivingVideo item={video} mood={source.mood} />
      ) : (
        <Montage items={source.media.length ? source.media : target.item ? [target.item] : []} mood={source.mood} />
      )}
      {source.mode === 'C' && (
        <span className="absolute bottom-1.5 left-1.5 rounded bg-ink/75 px-1.5 py-0.5 text-[11px] font-semibold text-white">
          {stage === 'living' ? 'Phần 1: ảnh sống lại' : 'Phần 2: montage'}
        </span>
      )}
    </div>
  );
}

function LivingVideo({ item, mood }: { item: MediaItem; mood: Mood | null }) {
  const state = useMediaUrl(item);
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  if (state.status === 'demo') {
    return (
      <>
        <MemoryArt art={item.demoArt ?? 'seaside'} alive mood={mood} title="Minh họa ảnh sống lại" />
        <SoundButton muted={muted} onToggle={() => setMuted((m) => !m)} demo />
      </>
    );
  }
  if (state.status !== 'ready') return <MediaView item={item} className="h-full w-full" />;
  return (
    <>
      {/* Mặc định muted để autoplay được trên mobile; khách chủ động bật tiếng. */}
      <video ref={ref} src={state.url} className="h-full w-full object-cover" autoPlay muted={muted} playsInline loop aria-label="Video kỷ niệm" />
      <SoundButton
        muted={muted}
        onToggle={() => {
          const next = !muted;
          setMuted(next);
          if (ref.current) {
            ref.current.muted = next;
            void ref.current.play().catch(() => undefined);
          }
        }}
      />
    </>
  );
}

function SoundButton({ muted, onToggle, demo = false }: { muted: boolean; onToggle: () => void; demo?: boolean }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute bottom-1.5 right-1.5 inline-flex min-h-[36px] items-center gap-1 rounded-full bg-white/95 px-2.5 text-[12px] font-semibold text-navy"
      aria-pressed={!muted}
    >
      {muted ? <VolumeX aria-hidden className="h-3.5 w-3.5" /> : <Volume2 aria-hidden className="h-3.5 w-3.5" />}
      {muted ? 'Chạm để bật âm thanh' : demo ? 'Minh họa không có tiếng' : 'Tắt âm thanh'}
    </button>
  );
}

function Montage({ items, mood }: { items: MediaItem[]; mood: Mood | null }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % items.length), 2200);
    return () => clearInterval(t);
  }, [items.length]);
  const current = items[i % Math.max(1, items.length)];
  return <MediaView key={current?.id ?? 'none'} item={current} play mood={mood} className="reveal h-full w-full" />;
}

function PermissionSheet({ onAllow, onDeny }: { onAllow: () => void; onDeny: () => void }) {
  return (
    <div className="absolute inset-x-3 bottom-3 z-10 rounded-2xl bg-white p-4 text-left shadow-frame" role="dialog" aria-label="Yêu cầu quyền camera (mô phỏng)">
      <p className="flex items-center gap-2 font-semibold text-navy">
        <Camera aria-hidden className="h-4 w-4" /> Cho phép dùng camera?
      </p>
      <p className="mt-1 text-sm text-muted">Chạm cần camera để tìm ảnh trong khung. Hình ảnh không được lưu lại.</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" className={buttonClass('secondary', 'w-full')} onClick={onDeny}>
          Từ chối
        </button>
        <button type="button" className={buttonClass('primary', 'w-full')} onClick={onAllow}>
          Cho phép
        </button>
      </div>
    </div>
  );
}

function DeniedSheet({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="absolute inset-x-3 bottom-3 z-10 rounded-2xl bg-white p-4 text-left shadow-frame" role="alert">
      <p className="flex items-center gap-2 font-semibold text-navy">
        <CameraOff aria-hidden className="h-4 w-4" /> Chưa có quyền camera
      </p>
      <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm text-muted">
        <li>Mở cài đặt trang trong trình duyệt (biểu tượng ổ khóa).</li>
        <li>Chọn Camera, đổi thành Cho phép.</li>
        <li>Tải lại trang và quét lại.</li>
      </ol>
      <button type="button" className={buttonClass('primary', 'mt-3 w-full')} onClick={onRetry}>
        Thử lại
      </button>
    </div>
  );
}
