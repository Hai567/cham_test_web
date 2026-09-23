import { Lock } from 'lucide-react';
import { ModeSchematic } from '../../../components/ModeSchematic';
import { Notice } from '../../../components/ui';
import { buttonClass } from '../../../components/buttonClass';
import { BUSINESS } from '../../../config/business';
import { MODES, evaluateModes, toEligibilityInput } from '../../../domain/experienceRules';
import { MODE_LABELS } from '../../../domain/labels';
import type { Mode } from '../../../domain/types';
import { StepHeading, type StepProps } from './shared';

const DESC: Record<Mode, { body: string; duration: string }> = {
  A: { body: 'Khi soi camera vào ảnh, video của chính khoảnh khắc đó chạy trên bề mặt ảnh.', duration: `${BUSINESS.livingPhotoDuration.min}–${BUSINESS.livingPhotoDuration.max} giây` },
  B: { body: 'Ảnh in là ảnh đại diện cho kỷ niệm. Khi quét sẽ phát montage từ nhiều ảnh và video.', duration: `${BUSINESS.montageDuration.min}–${BUSINESS.montageDuration.max} giây` },
  C: { body: 'Ảnh sống lại bằng video của cùng khoảnh khắc, sau đó mở rộng thành montage.', duration: `${BUSINESS.montageDuration.min}–${BUSINESS.montageDuration.max} giây` },
};

export function ModeStep({ api, goTo }: StepProps) {
  const { draft, update } = api;
  const results = evaluateModes(toEligibilityInput(draft.media, draft.printTarget));
  const anyEligible = MODES.some((m) => results[m].eligible);

  return (
    <>
      <StepHeading
        title="Chọn loại trải nghiệm"
        lead={draft.serviceType === 'ready_video' ? 'Chọn cấu trúc khớp với video bạn đã dựng để Chạm liên kết AR đúng cách.' : 'Chạm chỉ mở những lựa chọn phù hợp với ảnh và video bạn gửi. Lựa chọn cuối cùng là của bạn.'}
      />
      {!anyEligible && (
        <Notice tone="warning" className="mb-5" title="Chưa có lựa chọn nào khả dụng">
          Xem lý do dưới từng lựa chọn và bổ sung ảnh hoặc video.
        </Notice>
      )}
      <fieldset>
        <legend className="sr-only">Loại trải nghiệm</legend>
        <div className="grid gap-4 lg:grid-cols-3">
          {MODES.map((mode) => {
            const r = results[mode];
            const needsMedia = r.reasons.some((x) => x.includes('video') || x.includes('ảnh/video'));
            const needsTarget = r.reasons.some((x) => x.startsWith('Hãy chọn ảnh'));
            return (
              <div key={mode} className="flex flex-col">
                <label className="option-card flex-1" aria-describedby={r.eligible ? undefined : `mode-${mode}-why`}>
                  <input type="radio" name="mode" className="sr-only" disabled={!r.eligible} checked={draft.mode === mode} onChange={() => update((d) => ({ ...d, mode }))} />
                  <div className="flex items-start justify-between gap-2">
                    <ModeSchematic mode={mode} muted={!r.eligible} />
                    {!r.eligible && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-navy/5 px-2 py-0.5 text-xs font-semibold text-muted">
                        <Lock aria-hidden className="h-3 w-3" /> Chưa đủ điều kiện
                      </span>
                    )}
                  </div>
                  <span className="mt-4 block text-sm font-semibold text-coral-ink">Trải nghiệm {mode}</span>
                  <span className="block text-lg font-semibold text-navy">{MODE_LABELS[mode]}</span>
                  <span className="mt-2 block text-[15px] text-ink/80">{DESC[mode].body}</span>
                  <span className="mt-2 block text-sm text-muted">Thời lượng đề xuất: {DESC[mode].duration}</span>
                  {mode === 'B' && <span className="mt-2 block text-sm text-muted">Ảnh in là ảnh đại diện, không cần trùng với mọi đoạn video.</span>}
                </label>
                {!r.eligible && (
                  <div id={`mode-${mode}-why`} className="mt-2 rounded-xl bg-white px-4 py-3 text-[15px]">
                    <ul className="space-y-1">
                      {r.reasons.map((x) => <li key={x}>{x}</li>)}
                      {r.hints.map((x) => <li key={x} className="text-muted">{x}</li>)}
                    </ul>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {needsMedia && <button type="button" className={buttonClass('ghost', '-ml-3 text-[14px]')} onClick={() => goTo('media')}>Thêm ảnh/video</button>}
                      {needsTarget && <button type="button" className={buttonClass('ghost', '-ml-3 text-[14px]')} onClick={() => goTo('target')}>Chọn ảnh in</button>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </fieldset>
    </>
  );
}
