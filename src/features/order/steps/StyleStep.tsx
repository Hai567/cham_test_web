import { Heart, Hourglass, Smile } from 'lucide-react';
import { useEffect } from 'react';
import { MemoryArt } from '../../../components/MemoryArt';
import { MODE_LABELS, MOOD_LABELS } from '../../../domain/labels';
import { templatesForMode } from '../../../domain/templates';
import type { DemoArt, Mode, Mood } from '../../../domain/types';
import { StepHeading, type StepProps } from './shared';

const MOOD_ICON: Record<Mood, typeof Heart> = { nostalgic: Hourglass, warm: Heart, playful: Smile };
const MOODS: Mood[] = ['nostalgic', 'warm', 'playful'];
const BEATS: Record<Mode, [DemoArt, DemoArt, DemoArt]> = {
  A: ['seaside', 'seaside', 'seaside'],
  B: ['seaside', 'birthday', 'mountain'],
  C: ['seaside', 'mountain', 'kitchen'],
};

export function StyleStep({ api }: StepProps) {
  const { draft, update } = api;
  const feeling = draft.brief.feeling;
  const mode = draft.mode;

  // Điền sẵn theo câu trả lời của chính khách ở bước lời nhắn (không phải gợi ý tự động).
  useEffect(() => {
    if (!draft.mood && feeling && feeling !== 'unknown') update((d) => ({ ...d, mood: feeling }));
  }, [draft.mood, feeling, update]);

  if (!mode) return <p>Hãy chọn loại trải nghiệm trước.</p>;
  const templates = templatesForMode(mode);

  return (
    <>
      <StepHeading title="Chọn phong cách" lead={`Chọn cảm xúc, hoặc chọn trực tiếp một template cho "${MODE_LABELS[mode]}". Chạm dựng thủ công theo nhịp của template.`} />
      <fieldset>
        <legend className="field-label">Cảm xúc</legend>
        {feeling && feeling !== 'unknown' && <p className="help mt-0.5">Đã chọn sẵn theo câu trả lời của bạn ở bước trước. Bạn có thể đổi.</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {MOODS.map((m) => {
            const Icon = MOOD_ICON[m];
            return (
              <label key={m} className="choice">
                <input type="radio" name="mood" className="sr-only" checked={draft.mood === m} onChange={() => update((d) => ({ ...d, mood: m }))} />
                <Icon aria-hidden className="h-4 w-4" /> {MOOD_LABELS[m]}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-8">
        <legend className="field-label">Template</legend>
        <p className="help mt-0.5">Storyboard minh họa nhịp dựng, không phải video thật.</p>
        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          {templates.map((t) => (
            <label key={t.id} className="option-card">
              <input type="radio" name="template" className="sr-only" checked={draft.mood === t.mood} onChange={() => update((d) => ({ ...d, mood: t.mood }))} />
              <div className="grid grid-cols-3 gap-1.5">
                {t.storyboard.map((beat, i) => (
                  <div key={beat}>
                    <div className="relative aspect-[3/4] overflow-hidden rounded-sm">
                      <MemoryArt art={BEATS[mode][i] as DemoArt} mood={t.mood} />
                      {i === 2 && <span className="absolute inset-x-1 bottom-1 truncate rounded bg-white/90 px-1 text-center text-[10px] font-semibold text-navy">Aa</span>}
                    </div>
                    <p className="mt-1 text-[12px] leading-tight text-muted">{beat}</p>
                  </div>
                ))}
              </div>
              <span className="mt-4 flex items-center justify-between gap-2">
                <span className="text-lg font-semibold text-navy">{t.name}</span>
                <span className="text-sm text-coral-ink">{MOOD_LABELS[t.mood]}</span>
              </span>
              <span className="mt-1 block text-[15px] text-ink/80">{t.description}</span>
              <dl className="mt-3 space-y-0.5 text-sm text-muted">
                <div><dt className="inline">Nhịp dựng: </dt><dd className="inline text-ink">{t.pacing}</dd></div>
                <div><dt className="inline">Thời lượng: </dt><dd className="inline text-ink">{t.durationLabel}</dd></div>
              </dl>
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}
