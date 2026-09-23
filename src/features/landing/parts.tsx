import type { ReactNode } from 'react';

/** Tiêu đề serif mảnh, đúng chất mockup. */
export function Display({ children, className = '', as: Tag = 'h2' }: { children: ReactNode; className?: string; as?: 'h1' | 'h2' | 'h3' }) {
  return <Tag className={`font-serif font-normal tracking-[-0.005em] text-cocoa ${className}`}>{children}</Tag>;
}

/** Mũi tên mảnh vẽ tay dùng giữa các bước. */
export function ThinArrow({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 10" className={className} fill="none" aria-hidden>
      <path d="M1 5h45M41 1l5 4-5 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
