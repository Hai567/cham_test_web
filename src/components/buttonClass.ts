export type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'coral';

const BASE =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-navy text-white hover:bg-ink',
  secondary: 'border border-navy/25 bg-white text-navy hover:border-navy',
  ghost: 'text-navy hover:bg-navy/5',
  danger: 'border border-danger/30 bg-white text-danger hover:bg-danger-soft',
  coral: 'bg-coral-ink text-white hover:bg-[#8f3219]',
};

export function buttonClass(variant: Variant = 'primary', extra = ''): string {
  return `${BASE} ${VARIANTS[variant]} ${extra}`.trim();
}
