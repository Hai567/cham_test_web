import type { ReactNode } from 'react';
import { BUSINESS } from '../config/business';

/** Khung gỗ dọc, không kính, vùng ảnh 3:4 (15 × 20 cm). */
export function FrameMock({ children, className = '', caption }: { children: ReactNode; className?: string; caption?: boolean }) {
  return (
    <figure className={className}>
      <div className="frame-oak rounded-[4px] p-[5.5%] shadow-frame">
        <div className="relative aspect-[3/4] overflow-hidden bg-white ring-1 ring-black/10">{children}</div>
      </div>
      {caption && (
        <figcaption className="mt-3 text-center text-sm text-muted">
          Khung dọc {BUSINESS.frame.label}, không kính
        </figcaption>
      )}
    </figure>
  );
}
