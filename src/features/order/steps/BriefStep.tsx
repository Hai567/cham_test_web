import { MOOD_LABELS, OCCASION_LABELS, RECIPIENT_LABELS } from '../../../domain/labels';
import type { Brief, Feeling, Occasion, Recipient } from '../../../domain/types';
import { ChoiceGroup, StepHeading, type StepProps } from './shared';

const entries = <K extends string>(r: Record<K, string>) => (Object.keys(r) as K[]).map((value) => ({ value, label: r[value] }));
const FEELINGS: { value: Feeling; label: string }[] = [...entries(MOOD_LABELS), { value: 'unknown', label: 'Chưa biết' }];

export function BriefStep({ api }: StepProps) {
  const { draft, update } = api;
  const b = draft.brief;
  const set = (patch: Partial<Brief>) => update((d) => ({ ...d, brief: { ...d.brief, ...patch } }));
  return (
    <>
      <StepHeading title="Món quà này dành cho ai?" lead="Vài lựa chọn nhanh để Chạm hiểu câu chuyện. Các ô chữ bên dưới đều không bắt buộc." />
      <div className="space-y-8">
        <ChoiceGroup<Recipient> legend="Tặng ai?" name="recipient" options={entries(RECIPIENT_LABELS)} value={b.recipient} onChange={(v) => set({ recipient: v })} />
        {b.recipient === 'other' && <TextField id="recipientOther" label="Người nhận là ai?" value={b.recipientOther} onChange={(v) => set({ recipientOther: v })} max={60} />}
        <ChoiceGroup<Occasion> legend="Dịp gì?" name="occasion" options={entries(OCCASION_LABELS)} value={b.occasion} onChange={(v) => set({ occasion: v })} />
        {b.occasion === 'other' && <TextField id="occasionOther" label="Dịp tặng là gì?" value={b.occasionOther} onChange={(v) => set({ occasionOther: v })} max={60} />}
        {draft.serviceType === 'studio' && (
          <ChoiceGroup<Feeling> legend="Bạn muốn người nhận cảm thấy thế nào?" name="feeling" options={FEELINGS} value={b.feeling} onChange={(v) => set({ feeling: v })} />
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField id="sender" label="Tên người tặng" value={b.senderName} onChange={(v) => set({ senderName: v })} max={60} autoComplete="name" />
          <TextField id="recipientName" label="Tên người nhận" value={b.recipientName} onChange={(v) => set({ recipientName: v })} max={60} />
        </div>
        <TextField id="message" label="Lời nhắn đặc biệt" help="Chạm có thể đưa lời nhắn vào video nếu phù hợp." value={b.message} onChange={(v) => set({ message: v })} max={300} multiline />
        <TextField id="notes" label="Ghi chú cho Chạm" help="Ví dụ: tên bài hát gợi nhớ, khoảnh khắc nhất định phải có." value={b.notes} onChange={(v) => set({ notes: v })} max={500} multiline />
      </div>
    </>
  );
}

function TextField({ id, label, value, onChange, max, help, multiline = false, autoComplete }: { id: string; label: string; value: string; onChange: (v: string) => void; max: number; help?: string; multiline?: boolean; autoComplete?: string }) {
  const helpId = help ? `${id}-help` : undefined;
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      {help && <p id={helpId} className="help mt-0.5">{help}</p>}
      {multiline ? (
        <textarea id={id} className="field-input mt-2 min-h-[96px]" value={value} maxLength={max} aria-describedby={helpId} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} className="field-input mt-2" value={value} maxLength={max} aria-describedby={helpId} autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} />
      )}
      {multiline && <p className="help mt-1 text-right">{value.length}/{max}</p>}
    </div>
  );
}
