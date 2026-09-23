import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { Checkbox, Notice } from '../../../components/ui';
import { COPY, formatBytes } from '../../../config/business';
import { checkVideoSpec } from '../../../domain/media';
import { StepHeading, type StepProps } from './shared';

export function CheckStep({ api }: StepProps) {
  const { draft, update } = api;
  const videos = draft.media.filter((m) => m.kind === 'video');
  return (
    <>
      <StepHeading title="Kiểm tra video hoàn chỉnh" lead="Kiểm tra sơ bộ ngay trên thiết bị. Chạm sẽ kiểm tra kỹ thuật lại trước khi liên kết AR." />
      <div className="space-y-4">
        {videos.map((v) => (
          <section key={v.id} className="rounded-2xl border border-line bg-white p-5" aria-label={`Kiểm tra ${v.name}`}>
            <p className="font-semibold text-navy break-all">{v.name}</p>
            <p className="help">{formatBytes(v.size)}</p>
            <ul className="mt-3 space-y-2">
              {checkVideoSpec(v, draft.mode === 'A').map((c) => (
                <li key={c.label} className="flex gap-2 text-[15px]">
                  {c.ok ? <CheckCircle2 aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-mint-ink" /> : <AlertTriangle aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-coral-ink" />}
                  <span><strong className="font-semibold">{c.label} ({c.ok ? 'đạt' : 'cần lưu ý'}):</strong> {c.detail}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <Notice tone="warning" className="mt-5" title="Quyền sử dụng âm thanh">
        {COPY.capcutMusicWarning} Xác nhận bên dưới là một phần quy trình, không tự động hợp pháp hóa bản nhạc trong video.
      </Notice>
      <div className="mt-4">
        <Checkbox id="rights" checked={draft.rightsConfirmed} onChange={(v) => update((d) => ({ ...d, rightsConfirmed: v }))}>
          Tôi xác nhận có quyền sử dụng toàn bộ hình ảnh, video và âm thanh trong video này để in kèm khung và phát trên web.
        </Checkbox>
      </div>
    </>
  );
}
