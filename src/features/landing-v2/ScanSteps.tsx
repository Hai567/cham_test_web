import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from './hooks';
import { Reveal } from './motion';
import { Phone, ScreenAim, ScreenPlay, ScreenScan, type ClipSrc } from './Phone';

export type StepImages = { aim?: string; photo?: string; logo?: string };

const STEPS = [
  { n: '01', title: 'Quét mã sau khung', body: 'Không cần cài ứng dụng.' },
  { n: '02', title: 'Hướng vào tấm ảnh', body: 'Giữ yên vài giây.' },
  { n: '03', title: 'Khoảnh khắc sống lại', body: 'Chạm để bật âm thanh.' },
];

export type ScanCopy = { heading: string; steps: { n: string; title: string; body: string }[] };
const CopyCtx = createContext<ScanCopy>({ heading: 'Người nhận chỉ cần 3 bước', steps: STEPS });

function Screen({ i, active, video, images }: { i: number; active: boolean; video?: ClipSrc; images?: StepImages }) {
  if (i === 0) return <ScreenScan logoImg={images?.logo} />;
  if (i === 1) return <ScreenAim img={images?.aim} />;
  return <ScreenPlay active={active} video={video} img={images?.photo} />;
}

/** Danh sách 3 bước, bước đang xem được làm nổi. Luôn hiện đủ chữ, không giấu trong slide. */
function StepList({ active, onPick, large = false }: { active: number; onPick?: (i: number) => void; large?: boolean }) {
  const { steps } = useContext(CopyCtx);
  return (
    <ol className="space-y-1">
      {steps.map((s, i) => (
        <li key={s.n}>
          <button
            type="button"
            onClick={() => onPick?.(i)}
            aria-current={i === active ? 'step' : undefined}
            className={`flex w-full items-baseline gap-4 border-t border-taupe/40 py-4 text-left transition-opacity duration-500 ${i === active ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
          >
            <span className={`font-serif leading-none text-[#C9A08E] ${large ? 'text-[42px]' : 'text-[28px]'}`}>{s.n}</span>
            <span>
              <span className={`block font-medium text-cocoa ${large ? 'text-[20px]' : 'text-[16px]'}`}>{s.title}</span>
              <span className={`block text-cocoa/70 ${large ? 'text-[16px]' : 'text-[14px]'}`}>{s.body}</span>
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

/** Desktop: phần cao 300vh, điện thoại dính giữa màn hình, cuộn tới đâu đổi bước tới đó. */
function DesktopSticky({ video, images }: { video?: ClipSrc; images?: StepImages }) {
  const { heading } = useContext(CopyCtx);
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const total = Math.max(1, r.height - window.innerHeight);
        const p = Math.min(0.999, Math.max(0, -r.top / total));
        setActive(Math.floor(p * STEPS.length));
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  /** Bấm một bước: cuộn tới đúng đoạn của bước đó. */
  const pick = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const total = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: el.offsetTop + (total * (i + 0.5)) / STEPS.length, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  return (
    <div ref={ref} className="relative hidden h-[300vh] lg:block">
      <div className="sticky top-0 flex h-screen items-center">
        <div className="lwrap grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-[8vw]">
          <div className="max-w-[460px]">
            <h2 className="t-h2 font-serif font-normal text-cocoa">{heading}</h2>
            <div className="mt-10">
              <StepList active={active} onPick={pick} large />
            </div>
            <div className="mt-6 h-px w-full bg-taupe/30">
              <div className="h-px bg-cocoa transition-[width] duration-500" style={{ width: `${((active + 1) / STEPS.length) * 100}%` }} />
            </div>
            <p className="mt-4 text-[12.5px] text-cocoa-soft">Màn hình minh họa</p>
          </div>
          <Phone className="w-[clamp(260px,21vw,320px)]">
            {STEPS.map((s, i) => (
              <div key={s.n} className="absolute inset-0 transition-opacity duration-700" style={{ opacity: i === active ? 1 : 0 }} aria-hidden={i !== active}>
                <Screen i={i} active={i === active} video={video} images={images} />
              </div>
            ))}
          </Phone>
        </div>
      </div>
    </div>
  );
}

/** Mobile: vuốt ngang, tự chuyển sau 4,5 giây, dừng tự chuyển khi người dùng chạm vào. */
function MobileCarousel({ video, images }: { video?: ClipSrc; images?: StepImages }) {
  const { heading } = useContext(CopyCtx);
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const pausedUntil = useRef(0);
  const W = 250 + 20; // bề ngang điện thoại + khoảng cách

  const go = useCallback((i: number) => {
    track.current?.scrollTo({ left: i * W, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [W]);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const t = window.setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      go((activeRef.current + 1) % STEPS.length);
    }, 4500);
    return () => window.clearInterval(t);
  }, [go]);

  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    const i = Math.min(STEPS.length - 1, Math.round(el.scrollLeft / W));
    activeRef.current = i;
    setActive(i);
  };
  const pause = () => {
    pausedUntil.current = Date.now() + 9000;
  };

  return (
    <div className="lg:hidden">
      <div className="lwrap">
        <h2 className="t-h2 font-serif font-normal text-cocoa">{heading}</h2>
      </div>
      <div
        ref={track}
        onScroll={onScroll}
        onTouchStart={pause}
        onPointerDown={pause}
        className="v2-noscrollbar mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto px-[calc(50%-125px)] pb-4"
        aria-label="Các bước người nhận dùng Chạm"
      >
        {STEPS.map((s, i) => (
          <div key={s.n} className="w-[250px] shrink-0 snap-center">
            <Phone className="w-[250px]">
              <Screen i={i} active={i === active} video={video} images={images} />
            </Phone>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s.n}
            type="button"
            aria-label={`Bước ${i + 1}`}
            aria-current={i === active ? 'step' : undefined}
            onClick={() => {
              pause();
              go(i);
            }}
            className="flex h-11 w-8 items-center justify-center"
          >
            <span className={`block h-1.5 rounded-full transition-all duration-300 ${i === active ? 'w-6 bg-cocoa' : 'w-1.5 bg-taupe'}`} />
          </button>
        ))}
      </div>
      <div className="lwrap mt-2">
        <StepList
          active={active}
          onPick={(i) => {
            pause();
            go(i);
          }}
        />
        <p className="mt-3 text-[12px] text-cocoa-soft">Màn hình minh họa</p>
      </div>
    </div>
  );
}

export function ScanSteps({ video, images, copy }: { video?: ClipSrc; images?: StepImages; copy?: ScanCopy } = {}) {
  const content = (
    <section id="cach-dung" className="scroll-mt-0 bg-[#EFE5D9] py-16 lg:py-0">
      <Reveal className="lg:hidden">
        <MobileCarousel video={video} images={images} />
      </Reveal>
      <DesktopSticky video={video} images={images} />
    </section>
  );
  return copy ? <CopyCtx.Provider value={copy}>{content}</CopyCtx.Provider> : content;
}
