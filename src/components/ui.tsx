import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';


type Tone = 'info' | 'success' | 'warning' | 'error';
const TONES: Record<Tone, { cls: string; Icon: typeof Info; label: string }> = {
  info: { cls: 'bg-sky text-ink border-[#E4D5C4]', Icon: Info, label: 'Thông tin' },
  success: { cls: 'bg-mint text-ink border-[#CFD8C4]', Icon: CheckCircle2, label: 'Thành công' },
  warning: { cls: 'bg-[#F6ECD9] text-ink border-[#E4CFA6]', Icon: AlertTriangle, label: 'Lưu ý' },
  error: { cls: 'bg-danger-soft text-ink border-[#E7C3B6]', Icon: XCircle, label: 'Lỗi' },
};

/** Thông báo có icon + nhãn ẩn cho screen reader (không dùng màu làm tín hiệu duy nhất). */
export function Notice({ tone = 'info', title, children, className = '', live }: { tone?: Tone; title?: string; children?: ReactNode; className?: string; live?: boolean }) {
  const { cls, Icon, label } = TONES[tone];
  return (
    <div
      className={`flex gap-3 rounded-xl border px-4 py-3 text-[15px] ${cls} ${className}`}
      role={live ? (tone === 'error' ? 'alert' : 'status') : undefined}
    >
      <Icon aria-hidden className={`mt-0.5 h-5 w-5 shrink-0 ${tone === 'error' ? 'text-danger' : tone === 'success' ? 'text-mint-ink' : tone === 'warning' ? 'text-coral-ink' : 'text-navy'}`} />
      <div className="min-w-0">
        <span className="sr-only">{label}: </span>
        {title && <p className="font-semibold text-navy">{title}</p>}
        {children && <div className={title ? 'mt-0.5' : ''}>{children}</div>}
      </div>
    </div>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'lavender' | 'coral' | 'mint' | 'sky' | 'danger' }) {
  const t = {
    neutral: 'bg-navy/5 text-navy',
    lavender: 'bg-lavender-soft text-lavender-ink',
    coral: 'bg-blush text-coral-ink',
    mint: 'bg-mint text-mint-ink',
    sky: 'bg-sky text-navy',
    danger: 'bg-danger-soft text-danger',
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[13px] font-semibold ${t}`}>{children}</span>;
}

export function Checkbox({ checked, onChange, children, id }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode; id: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-line bg-white p-4">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer accent-navy"
      />
      <label htmlFor={id} className="cursor-pointer text-[15px] leading-relaxed">
        {children}
      </label>
    </div>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-muted">
      <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-navy/20 border-t-navy" />
      {label}
    </span>
  );
}
