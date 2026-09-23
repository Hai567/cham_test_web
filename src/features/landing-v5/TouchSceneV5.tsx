import { useEffect, useRef } from 'react';
import plate from '../../assets/v5/plate.webp';
import momCut from '../../assets/v5/mom-cut.webp';
import memoryUrl from '../../assets/v4/memory.webp';
import { prefersReducedMotion } from '../landing-v2/hooks';
import { DOTS, SCENE } from './touchData';

/*
 * Cảnh "Chạm" V5 (đặt ngay sau hero), theo tinh thần video tham chiếu:
 * CẢ HAI bàn tay cùng tiến vào giữa theo tiến độ cuộn: bàn tay chấm (tượng trưng AR) từ trái, tay thật của mẹ từ phải.
 * Hai đầu ngón chạm nhau; cú chạm biến các chấm thành tấm ảnh in nằm trong lòng bàn tay mẹ, rồi "Con thương mẹ." hiện ra.
 * Mọi toạ độ tính trong hệ toạ độ của ảnh tay mẹ (1122 x 1402), rồi quy đổi ra màn hình theo kiểu "cover".
 */

const [IW, IH] = SCENE.img;
const FOCUS = [553, 868] as const; // giữa điểm chạm và lòng bàn tay mẹ
const START_DOTS = { dx: -430, dy: -95 }; // bàn tay chấm bắt đầu lệch sang trái
const START_MOM = { dx: 600, dy: 70 }; // tay mẹ bắt đầu lệch sang phải
const PAD = 120; // lề cho bóng đổ của tay mẹ
const ANG = (SCENE.ang * Math.PI) / 180;
const CELL = Math.sqrt((SCENE.pw * SCENE.ph) / SCENE.n) * 1.05;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

type Fit = { s: number; ox: number; oy: number };
function fit(W: number, H: number): Fit {
  // Desktop: phủ kín khung. Điện thoại: thu nhỏ để thấy trọn cả hai bàn tay, phần thiếu là màu nền gỗ.
  const cover = Math.max(W / IW, H / IH);
  const s = W < 700 ? Math.min(cover, W / 750) : cover;
  const fx = W >= 1024 ? 0.6 : 0.5;
  const fy = W >= 1024 ? 0.56 : 0.5;
  const ox = Math.min(0, Math.max(W - IW * s, W * fx - FOCUS[0] * s));
  const want = H * fy - FOCUS[1] * s;
  const oy = IH * s >= H ? Math.min(0, Math.max(H - IH * s, want)) : Math.min(0, want);
  return { s, ox, oy };
}

function draw(ctx: CanvasRenderingContext2D, W: number, H: number, dpr: number, f: Fit, p: number, t: number, photo: HTMLImageElement | null, mom: HTMLCanvasElement | null) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.setTransform(dpr * f.s, 0, 0, dpr * f.s, dpr * f.ox, dpr * f.oy);

  const move = ease(clamp01((p - 0.05) / 0.47));
  const hx = START_DOTS.dx * (1 - move);
  const hy = START_DOTS.dy * (1 - move);
  const mx = START_MOM.dx * (1 - move);
  const my = START_MOM.dy * (1 - move);

  // Tay mẹ (đã tách nền, bóng đổ vẽ sẵn) trượt vào từ bên phải.
  if (mom) ctx.drawImage(mom, mx - PAD, my - PAD, IW + PAD * 2, IH + PAD * 2);
  const fly = clamp01((p - 0.6) / 0.24);
  const photoA = clamp01((p - 0.83) / 0.06);
  const glow = clamp01((p - 0.5) / 0.05) * (1 - clamp01((p - 0.66) / 0.1));
  const [tx, ty] = SCENE.touch;
  const [pcx, pcy] = SCENE.pc;
  const cos = Math.cos(ANG);
  const sin = Math.sin(ANG);

  if (glow > 0) {
    const g = ctx.createRadialGradient(tx, ty, 0, tx, ty, 110);
    g.addColorStop(0, `rgba(255,238,210,${0.55 * glow})`);
    g.addColorStop(1, 'rgba(255,238,210,0)');
    ctx.fillStyle = g;
    ctx.fillRect(tx - 110, ty - 110, 220, 220);
  }

  if (photoA < 1) {
    const stepDots = W < 700 ? 2 : 1; // điện thoại: vẽ một nửa số chấm cho mượt
    const S = SCENE.stride;
    ctx.globalAlpha = 1 - photoA;
    for (let i = 0; i < SCENE.n; i += stepDots) {
      const o = i * S;
      const x = DOTS[o]!, y = DOTS[o + 1]!, r = DOTS[o + 2]!, u = DOTS[o + 3]!, v = DOTS[o + 4]!;
      const delay = DOTS[o + 11]!;
      const e = ease(clamp01((fly - delay * 0.55) / 0.45));
      const wob = (1 - e) * 0.9 * Math.sin(t * 0.0018 + i * 1.7);
      const sx = x + hx + wob;
      const sy = y + hy + wob * 0.7;
      const lx = (u - 0.5) * SCENE.pw;
      const ly = (v - 0.5) * SCENE.ph;
      const gx = pcx + lx * cos - ly * sin;
      const gy = pcy + lx * sin + ly * cos;
      const X = sx + (gx - sx) * e;
      const Y = sy + (gy - sy) * e - Math.sin(e * Math.PI) * 60;
      const size = r * 1.8 * (1 - e) + CELL * e;
      const R = Math.round(DOTS[o + 8]! + (DOTS[o + 5]! - DOTS[o + 8]!) * e);
      const G = Math.round(DOTS[o + 9]! + (DOTS[o + 6]! - DOTS[o + 9]!) * e);
      const B = Math.round(DOTS[o + 10]! + (DOTS[o + 7]! - DOTS[o + 10]!) * e);
      ctx.fillStyle = `rgb(${R},${G},${B})`;
      ctx.fillRect(X - size / 2, Y - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
  }

  if (photoA > 0 && photo) {
    ctx.save();
    ctx.translate(pcx, pcy);
    ctx.rotate(ANG);
    ctx.globalAlpha = photoA;
    ctx.shadowColor = 'rgba(25,14,8,0.45)';
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#FAF6EE';
    ctx.fillRect(-SCENE.pw / 2 - 7, -SCENE.ph / 2 - 7, SCENE.pw + 14, SCENE.ph + 14);
    ctx.shadowColor = 'transparent';
    ctx.drawImage(photo, -SCENE.pw / 2, -SCENE.ph / 2, SCENE.pw, SCENE.ph);
    ctx.restore();
  }
}

export function TouchSceneV5({ skipTo = '#cach-dung', captionText = 'Nhìn bằng mắt là ảnh. Nhìn qua điện thoại, ảnh sống lại.' }: { skipTo?: string; captionText?: string }) {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const bg = useRef<HTMLImageElement>(null);
  const hint = useRef<HTMLDivElement>(null);
  const script = useRef<HTMLParagraphElement>(null);
  const caption = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sec = section.current;
    const cv = canvas.current;
    const ctx = cv?.getContext('2d');
    if (!sec || !cv || !ctx) return;
    const still = prefersReducedMotion();
    let W = 0, H = 0, dpr = 1;
    let f: Fit = { s: 1, ox: 0, oy: 0 };
    let raf = 0;
    let visible = true;
    let photo: HTMLImageElement | null = null;
    let mom: HTMLCanvasElement | null = null;

    const progress = () => {
      if (still) return 1;
      const r = sec.getBoundingClientRect();
      const total = Math.max(1, r.height - window.innerHeight);
      return clamp01(-r.top / total);
    };
    const layout = () => {
      W = cv.clientWidth;
      H = cv.clientHeight;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      f = fit(W, H);
      const img = bg.current;
      if (img) {
        // Nền đã làm mờ nên luôn phủ kín khung, không cần khớp tuyệt đối với hai bàn tay.
        const cs = Math.max(W / IW, H / IH);
        const cx = Math.min(0, Math.max(W - IW * cs, W / 2 - FOCUS[0] * cs));
        const cy = Math.min(0, Math.max(H - IH * cs, H / 2 - FOCUS[1] * cs));
        img.style.width = `${IW * cs}px`;
        img.style.height = `${IH * cs}px`;
        img.style.transform = `translate(${cx}px, ${cy}px)`;
      }
    };
    const paint = (t: number) => {
      const p = progress();
      draw(ctx, W, H, dpr, f, p, t, photo, mom);
      if (hint.current) hint.current.style.opacity = String(1 - clamp01((p - 0.03) / 0.05));
      if (script.current) script.current.style.clipPath = `inset(-20% ${(1 - clamp01((p - 0.86) / 0.09)) * 100}% -20% 0)`;
      if (caption.current) {
        const c = clamp01((p - 0.92) / 0.06);
        caption.current.style.opacity = String(c);
        caption.current.style.transform = `translateY(${(1 - c) * 16}px)`;
      }
    };
    const loop = (t: number) => {
      paint(t);
      if (visible && !still) raf = requestAnimationFrame(loop);
    };

    const img = new Image();
    img.onload = () => {
      photo = img;
      paint(performance.now());
    };
    img.src = memoryUrl;

    // Vẽ sẵn tay mẹ kèm bóng đổ mềm một lần, mỗi khung hình chỉ việc dán lại.
    const momImg = new Image();
    momImg.onload = () => {
      const scale = 0.7;
      const off = document.createElement('canvas');
      off.width = Math.round((IW + PAD * 2) * scale);
      off.height = Math.round((IH + PAD * 2) * scale);
      const o = off.getContext('2d');
      if (!o) return;
      o.scale(scale, scale);
      o.shadowColor = 'rgba(20,10,5,0.5)';
      o.shadowBlur = 45;
      o.shadowOffsetX = 22;
      o.shadowOffsetY = 30;
      o.drawImage(momImg, PAD, PAD, IW, IH);
      mom = off;
      paint(performance.now());
    };
    momImg.src = momCut;

    layout();
    paint(0);
    const io = typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver(([e]) => {
          visible = Boolean(e?.isIntersecting);
          cancelAnimationFrame(raf);
          if (visible && !still) raf = requestAnimationFrame(loop);
        });
    io?.observe(sec);
    if (!io && !still) raf = requestAnimationFrame(loop);
    const onResize = () => {
      layout();
      paint(performance.now());
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <section ref={section} className="relative h-[260vh] bg-[#3B2A20]" aria-label="Cảnh Chạm">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <img ref={bg} src={plate} alt="" aria-hidden className="absolute left-0 top-0 max-w-none origin-top-left" />
        <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-hidden />
        <p className="sr-only">
          Một bàn tay làm bằng những chấm sáng, tượng trưng cho ký ức trong điện thoại, và bàn tay của mẹ cùng đưa vào giữa. Khi hai đầu ngón chạm nhau, các chấm kết lại thành tấm ảnh mẹ cõng con nằm trong lòng bàn tay mẹ, và dòng chữ “Con thương mẹ.” hiện ra.
        </p>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#1E140E]/85 via-[#1E140E]/40 to-transparent" />

        <div ref={hint} className="pointer-events-none absolute inset-x-0 top-[18%] flex flex-col items-center gap-3 text-[13px] tracking-[0.24em] text-cream/90">
          <span>CUỘN ĐỂ CHẠM</span>
          <span aria-hidden className="h-10 w-px bg-cream/60" />
        </div>
        <a href={skipTo} className="absolute right-5 top-[92px] inline-flex min-h-[44px] items-center rounded-full bg-[#1E140E]/40 px-4 text-[13px] text-cream/90 backdrop-blur-sm hover:bg-[#1E140E]/60 lg:right-[7.5vw]">
          Bỏ qua
        </a>

        <p
          ref={script}
          aria-hidden
          className="pointer-events-none absolute left-[7.5vw] top-[26%] text-[clamp(2.8rem,6vw,5.6rem)] leading-none text-[#FCF3E4] lg:top-[30%]"
          style={{ fontFamily: "'Dancing Script', 'Brush Script MT', cursive", textShadow: '0 2px 24px rgba(30,18,10,0.55)', clipPath: 'inset(-20% 100% -20% 0)' }}
        >
          Con thương mẹ.
        </p>

        <div ref={caption} className="absolute bottom-[7%] left-[7.5vw] right-[7.5vw] text-cream" style={{ opacity: 0 }}>
          <h2 className="font-serif text-[clamp(2rem,3.6vw,3.6rem)] font-normal leading-[1.08] text-cream" style={{ textShadow: '0 2px 18px rgba(20,12,8,0.6)' }}>Một bức ảnh.<br />Hai cách để nhớ.</h2>
          <p className="mt-3 max-w-md text-[clamp(1rem,1.2vw,1.15rem)] text-cream/85">{captionText}</p>
        </div>
      </div>
    </section>
  );
}
