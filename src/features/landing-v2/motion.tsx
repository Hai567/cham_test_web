import type { CSSProperties, ElementType, ReactNode } from 'react';
import { useInView } from './hooks';

/** Kiểu chuyển động 2: chữ và khối hiện dần khi cuộn tới. `delay` tính bằng ms để xếp tầng. */
export function Reveal({ children, delay = 0, className = '', as: Tag = 'div', style }: { children: ReactNode; delay?: number; className?: string; as?: ElementType; style?: CSSProperties }) {
  const { ref, shown } = useInView<HTMLElement>(0.05);
  return (
    <Tag ref={ref} data-shown={shown} className={`v2-reveal ${className}`} style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </Tag>
  );
}
