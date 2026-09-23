import type { CSSProperties } from 'react';
import sprite from '../../assets/v6/roll-sprite.webp';
import meta from './roll-sprite.json';
import { Reveal } from '../landing-v2/motion';

/*
 * "Vì sao có Chạm?": ba hàng ảnh tí hon trôi chậm, ngược chiều nhau, như lúc lướt thư viện ảnh trong điện thoại.
 * Ảnh là ảnh thật của đội ngũ Chạm (đã xóa thông tin ẩn như vị trí GPS), gộp trong một tấm ảnh ghép để tải nhanh.
 * Mỗi ảnh có 2 kiểu cắt (toàn cảnh, cận) để khi lặp lại trông khác đi.
 */

const { cols: COLS, rows: ROWS, photoOf: PHOTO_OF } = meta as { tile: number; cols: number; rows: number; photoOf: number[] };
const TILE_COUNT = PHOTO_OF.length;

/** Bộ sinh số ngẫu nhiên có hạt giống: thứ tự ảnh cố định giữa các lần tải, không nhảy lung tung. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Một hàng ảnh: không để cùng một người/ảnh đứng gần nhau (cách nhau ít nhất 3 ô). */
function rowSequence(seed: number, length = 20): number[] {
  const r = rng(seed);
  const out: number[] = [];
  let guard = 0;
  while (out.length < length && guard++ < 5000) {
    const k = Math.floor(r() * TILE_COUNT);
    const photo = PHOTO_OF[k];
    const recent = out.slice(-3).map((x) => PHOTO_OF[x]);
    if (!recent.includes(photo) && (out.length < length - 3 || !out.slice(0, 3).map((x) => PHOTO_OF[x]).includes(photo))) out.push(k);
  }
  return out;
}

const ROWS_CFG = [
  { seq: rowSequence(11), dur: '72s', reverse: false },
  { seq: rowSequence(29), dur: '88s', reverse: true },
  { seq: rowSequence(47), dur: '80s', reverse: false },
];

function Tile({ k }: { k: number }) {
  const col = k % COLS;
  const row = Math.floor(k / COLS);
  const style: CSSProperties = {
    width: 'var(--t)',
    height: 'var(--t)',
    backgroundImage: `url(${sprite})`,
    backgroundSize: `calc(var(--t) * ${COLS}) calc(var(--t) * ${ROWS})`,
    backgroundPosition: `calc(var(--t) * -${col}) calc(var(--t) * -${row})`,
  };
  return <span aria-hidden className="block shrink-0 rounded-lg shadow-[0_6px_16px_-10px_rgba(74,58,53,0.5)]" style={style} />;
}

export function StoryV6({
  text = 'Hàng nghìn tấm ảnh trong điện thoại, chưa một lần được trao đi. Chạm đưa chúng ra khỏi màn hình, thành món quà cầm được trên tay cho người bạn thương.',
}: { text?: string } = {}) {
  return (
    <section id="cau-chuyen" className="relative scroll-mt-20 overflow-hidden bg-[#F7F1E7] py-16 lg:py-[6vw]" style={{ ['--t' as string]: 'clamp(68px, 6.6vw, 112px)' }}>
      <div className="v6-fade-x flex flex-col gap-3" role="img" aria-label="Những tấm ảnh đời thường trong điện thoại của đội ngũ Chạm: bữa cơm gia đình, bạn bè, người yêu, những chuyến đi.">
        {ROWS_CFG.map((r, i) => (
          <div key={i} className={`v6-roll flex w-max gap-3 ${r.reverse ? 'v6-roll-rev' : ''}`} style={{ ['--dur' as string]: r.dur }}>
            {[...r.seq, ...r.seq].map((k, j) => (
              <Tile key={j} k={k} />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-8 flex justify-center px-5 lg:pointer-events-none lg:absolute lg:inset-0 lg:mt-0 lg:items-center">
        <Reveal className="max-w-[560px] text-center lg:pointer-events-auto lg:rounded-2xl lg:border lg:border-taupe/30 lg:bg-[#F7F1E7]/95 lg:px-10 lg:py-9 lg:shadow-[0_24px_60px_-30px_rgba(74,58,53,0.45)] lg:backdrop-blur-sm">
          <h2 className="font-serif text-[clamp(2rem,3.4vw,3.2rem)] font-normal leading-[1.1] text-cocoa">Vì sao có Chạm?</h2>
          <p className="mt-4 text-[clamp(1rem,1.2vw,1.15rem)] leading-relaxed text-cocoa/80">
            {text}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
