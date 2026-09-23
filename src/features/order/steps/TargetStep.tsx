import { Scissors } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { MediaView } from '../../../components/MediaView';
import { FrameMock } from '../../../components/FrameMock';
import { Notice, Spinner } from '../../../components/ui';
import { buttonClass } from '../../../components/buttonClass';
import { arAdapter } from '../../../ar';
import type { TargetValidationResult } from '../../../ar/ARAdapter';
import { BUSINESS, UPLOAD_LIMITS } from '../../../config/business';
import { countMedia } from '../../../domain/media';
import type { Draft } from '../../../domain/types';
import { Uploader } from '../Uploader';
import { StepHeading, type StepProps } from './shared';

type Check = { status: 'idle' } | { status: 'loading' } | { status: 'done'; result: TargetValidationResult } | { status: 'error'; message: string };

function useTargetCheck(draft: Draft) {
  const [check, setCheck] = useState<Check>({ status: 'idle' });
  const t = draft.printTarget;
  const key = t.type === 'media' ? t.mediaId : t.type === 'extract_frame' ? `frame:${t.videoId}` : '';
  const item = t.type === 'media' ? draft.media.find((m) => m.id === t.mediaId) : undefined;
  const width = item?.width;
  const height = item?.height;
  const source = item?.source;

  const run = useCallback(() => {
    if (!key) return () => undefined;
    let cancelled = false;
    setCheck({ status: 'loading' });
    arAdapter
      .validateTarget({
        mediaId: key.startsWith('frame:') ? null : key,
        width,
        height,
        kind: key.startsWith('frame:') ? 'frame_request' : source === 'demo' ? 'demo_image' : 'uploaded_image',
      })
      .then((result) => !cancelled && setCheck({ status: 'done', result }))
      .catch((err: unknown) => !cancelled && setCheck({ status: 'error', message: err instanceof Error ? err.message : 'Không kiểm tra được ảnh.' }));
    return () => {
      cancelled = true;
    };
  }, [key, width, height, source]);

  useEffect(() => {
    if (!key) {
      setCheck({ status: 'idle' });
      return;
    }
    return run();
  }, [key, run]);

  return { check, retry: run };
}

export function TargetStep({ api, goTo }: StepProps) {
  const { draft, update, addFiles } = api;
  const images = draft.media.filter((m) => m.kind === 'image');
  const videos = draft.media.filter((m) => m.kind === 'video');
  const t = draft.printTarget;
  const { check, retry } = useTargetCheck(draft);
  const imagesFull = countMedia(draft.media).images >= BUSINESS.maxImages;
  const selected = t.type === 'media' ? draft.media.find((m) => m.id === t.mediaId) : t.type === 'extract_frame' ? draft.media.find((m) => m.id === t.videoId) : undefined;

  return (
    <>
      <StepHeading
        title="Chọn ảnh dùng để in"
        lead={`Ảnh này được in trong khung ${BUSINESS.frame.label} và là ảnh camera sẽ nhận diện. Ảnh được cắt theo tỷ lệ dọc ${BUSINESS.outputRatio.label}.`}
      />
      <div className="grid gap-8 lg:grid-cols-[1fr_220px]">
        <div className="space-y-8">
          {images.length > 0 ? (
            <fieldset>
              <legend className="field-label">Ảnh bạn đã tải lên</legend>
              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {images.map((m) => (
                  <label key={m.id} className="option-card overflow-hidden !p-0">
                    <input type="radio" name="target" className="sr-only" checked={t.type === 'media' && t.mediaId === m.id} onChange={() => update((d) => ({ ...d, printTarget: { type: 'media', mediaId: m.id } }))} />
                    <MediaView item={m} className="aspect-[3/4]" />
                    <span className="block truncate px-2 py-1.5 text-xs text-muted">{m.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <p className="rounded-xl bg-white p-4 text-muted">Bạn chưa tải lên ảnh nào. Chọn một trong hai cách bên dưới.</p>
          )}

          <section aria-labelledby="no-photo">
            <h2 id="no-photo" className="text-lg font-semibold">Không có ảnh phù hợp?</h2>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-line bg-white p-4">
                <p className="font-semibold text-navy">Tải ảnh khác để in</p>
                <p className="help mt-1">Ảnh mới sẽ được chọn làm ảnh in.</p>
                <div className="mt-3">
                  <Uploader
                    id="target-upload"
                    compact
                    accept={[...UPLOAD_LIMITS.image.mimeTypes, ...UPLOAD_LIMITS.image.extensions.map((e) => `.${e}`)].join(',')}
                    onFiles={(files) => addFiles(files, { selectAsTarget: true })}
                    title="Thêm một ảnh"
                    hint={`${UPLOAD_LIMITS.image.label}, nên từ ${BUSINESS.printResolution.width} × ${BUSINESS.printResolution.height} px.`}
                    disabled={imagesFull}
                    disabledReason={imagesFull ? `Đã đủ ${BUSINESS.maxImages} ảnh. Xóa bớt ảnh ở bước trước.` : undefined}
                  />
                </div>
              </div>
              <div className={`rounded-2xl border bg-white p-4 ${t.type === 'extract_frame' ? 'border-navy border-2' : 'border-line'}`}>
                <p className="flex items-center gap-2 font-semibold text-navy"><Scissors aria-hidden className="h-4 w-4" /> Yêu cầu Chạm trích frame từ video</p>
                {videos.length === 0 ? (
                  <>
                    <p className="help mt-1">Cần ít nhất 1 video để trích frame.</p>
                    <button type="button" className={buttonClass('secondary', 'mt-3')} onClick={() => goTo('media')}>Tải video ở bước trước</button>
                  </>
                ) : (
                  <>
                    <p className="help mt-1">Chạm sẽ chọn 3 frame đủ chất lượng. Sau khi đặt đơn, bạn chọn 1 trong 3 frame làm ảnh in.</p>
                    <fieldset className="mt-3 space-y-2">
                      <legend className="sr-only">Video dùng để trích frame</legend>
                      {videos.map((v) => (
                        <label key={v.id} className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-line px-3">
                          <input type="radio" name="target" className="h-5 w-5 accent-navy" checked={t.type === 'extract_frame' && t.videoId === v.id} onChange={() => update((d) => ({ ...d, printTarget: { type: 'extract_frame', videoId: v.id } }))} />
                          <span className="truncate text-[15px]">Trích từ {v.name}</span>
                        </label>
                      ))}
                    </fieldset>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>

        <aside aria-label="Xem trước ảnh in" className="order-first lg:order-none">
          <div className="mx-auto max-w-[200px]">
            <FrameMock caption>
              {t.type === 'extract_frame' ? (
                <div className="relative h-full w-full">
                  <MediaView item={selected} className="h-full w-full opacity-60" />
                  <span className="absolute inset-0 flex items-center justify-center p-3 text-center text-sm font-semibold text-navy">Chạm sẽ chọn 3 frame đủ chất lượng</span>
                </div>
              ) : (
                <MediaView item={selected} className="h-full w-full" />
              )}
            </FrameMock>
          </div>
          <div className="mt-4 space-y-2" aria-live="polite">
            {check.status === 'loading' && <Spinner label="Đang kiểm tra ảnh in..." />}
            {check.status === 'error' && (
              <Notice tone="error" title="Chưa kiểm tra được ảnh">
                {check.message}
                <button type="button" className="mt-2 block font-semibold underline" onClick={retry}>Thử lại</button>
              </Notice>
            )}
            {check.status === 'done' && check.result.warnings.map((w) => (
              <Notice key={w} tone="warning">{w}</Notice>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
