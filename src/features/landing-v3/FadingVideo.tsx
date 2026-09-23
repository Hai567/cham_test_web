import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../landing-v2/hooks';

const FADE_MS = 500;
const FADE_OUT_LEAD = 0.55; // giây trước khi hết clip thì bắt đầu mờ đi

/**
 * Video nền lặp lại không bị giật ở chỗ nối: cuối clip mờ dần, quay về đầu rồi hiện lại.
 * Độ mờ chạy bằng requestAnimationFrame, mỗi lần mờ tiếp tục từ độ mờ hiện tại.
 * Ảnh `poster` luôn nằm bên dưới, nên lúc chưa tải xong hoặc khi tắt chuyển động vẫn thấy ảnh.
 */
export function FadingVideo({ mp4, webm, poster, className = '', videoClassName = '' }: { mp4: string; webm?: string; poster: string; className?: string; videoClassName?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const raf = useRef(0);
  const fadingOut = useRef(false);

  useEffect(() => {
    const v = ref.current;
    if (!v || prefersReducedMotion()) return;

    const fadeTo = (target: number, ms = FADE_MS) => {
      cancelAnimationFrame(raf.current);
      const from = parseFloat(v.style.opacity || '0');
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / ms);
        v.style.opacity = String(from + (target - from) * t);
        if (t < 1) raf.current = requestAnimationFrame(step);
      };
      raf.current = requestAnimationFrame(step);
    };
    const onLoaded = () => {
      v.style.opacity = '0';
      void v.play().catch(() => undefined);
      fadeTo(1);
    };
    const onTime = () => {
      const left = v.duration - v.currentTime;
      if (!fadingOut.current && left > 0 && left <= FADE_OUT_LEAD) {
        fadingOut.current = true;
        fadeTo(0);
      }
    };
    let timer = 0;
    const onEnded = () => {
      v.style.opacity = '0';
      timer = window.setTimeout(() => {
        v.currentTime = 0;
        if (visible) void v.play().catch(() => undefined);
        fadingOut.current = false;
        fadeTo(1);
      }, 100);
    };
    // Chỉ phát khi video đang nằm trong màn hình, cuộn đi thì dừng để đỡ tốn pin.
    let visible = true;
    const io =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(([e]) => {
            visible = Boolean(e?.isIntersecting);
            if (visible) void v.play().catch(() => undefined);
            else v.pause();
          });
    io?.observe(v);
    v.addEventListener('loadeddata', onLoaded);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('ended', onEnded);
    if (v.readyState >= 2) onLoaded();
    return () => {
      io?.disconnect();
      cancelAnimationFrame(raf.current);
      window.clearTimeout(timer);
      v.removeEventListener('loadeddata', onLoaded);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('ended', onEnded);
    };
  }, []);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img src={poster} alt="" aria-hidden className={`absolute inset-0 h-full w-full object-cover ${videoClassName}`} />
      <video ref={ref} muted playsInline preload="auto" aria-hidden className={`absolute inset-0 h-full w-full object-cover ${videoClassName}`} style={{ opacity: 0 }}>
        <source src={mp4} type="video/mp4" />
        {webm && <source src={webm} type="video/webm" />}
      </video>
    </div>
  );
}
