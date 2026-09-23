import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

/** Trả true (một lần) khi phần tử lọt vào khung nhìn. */
export function useInView<T extends Element>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, shown]);
  return { ref, shown };
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** QR dùng chung cho mockup và khối liên hệ. */
export function useQr(text: string, dark = '#3A2D29'): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(text, { margin: 1, width: 280, color: { dark, light: '#FFFFFF' } })
      .then((d) => alive && setUrl(d))
      .catch(() => alive && setUrl(null));
    return () => {
      alive = false;
    };
  }, [text, dark]);
  return url;
}

