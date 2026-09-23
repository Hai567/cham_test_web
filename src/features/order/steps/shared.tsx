import type { ReactNode } from 'react';
import type { StepId } from '../../../domain/wizard';
import type { DraftApi } from '../useDraft';

export interface StepProps {
  api: DraftApi;
  goTo: (step: StepId) => void;
}

export function StepHeading({ title, lead }: { title: string; lead?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 tabIndex={-1} id="step-heading" className="text-[28px] font-bold outline-none sm:text-[32px]">
        {title}
      </h1>
      {lead && <p className="mt-2 max-w-2xl text-ink/80">{lead}</p>}
    </div>
  );
}

/** Nhóm radio dạng chip, có legend thật cho screen reader. */
export function ChoiceGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  hint,
}: {
  legend: string;
  name: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
  hint?: string;
}) {
  return (
    <fieldset>
      <legend className="field-label">{legend}</legend>
      {hint && <p className="help mt-0.5">{hint}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className="choice">
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
