import type { ElementType } from 'react';
import { useInView } from '../landing-v2/hooks';

/**
 * Tiêu đề hiện từng từ, từ mờ sang nét (bản dịu cho Chạm: mờ ít, nhích nhẹ, chậm).
 * Tách theo từ, không theo ký tự, để dấu tiếng Việt không bị tách và trình đọc màn hình đọc cả câu.
 */
export function BlurText({ text, as: Tag = 'h1', className = '', delay = 0, stagger = 110 }: { text: string; as?: ElementType; className?: string; delay?: number; stagger?: number }) {
  const { ref, shown } = useInView<HTMLElement>(0.1);
  const lines = text.split('\n');
  let i = 0;
  return (
    <Tag ref={ref} className={className} aria-label={text.replace(/\n/g, ' ')}>
      {lines.map((line, li) => (
        <span key={li} aria-hidden className="block">
          {line.split(' ').map((w) => {
            const d = delay + i++ * stagger;
            return (
              <span
                key={`${li}-${d}`}
                className="inline-block transition-[opacity,filter,transform] duration-[1100ms] ease-out motion-reduce:!opacity-100 motion-reduce:!blur-none motion-reduce:!transform-none"
                style={{
                  marginRight: '0.26em',
                  transitionDelay: `${d}ms`,
                  opacity: shown ? 1 : 0,
                  filter: shown ? 'blur(0px)' : 'blur(6px)',
                  transform: shown ? 'none' : 'translateY(10px)',
                }}
              >
                {w}
              </span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}
