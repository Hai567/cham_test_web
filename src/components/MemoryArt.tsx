import { useId } from 'react';
import type { DemoArt, Mood } from '../domain/types';

interface Props {
  art: DemoArt;
  /** Bật chuyển động: dùng để mô phỏng "ảnh sống lại". */
  alive?: boolean;
  mood?: Mood | null;
  className?: string;
  title?: string;
}

/**
 * Minh họa kỷ niệm mẫu (SVG thuần) cho dữ liệu demo, thay cho placeholder xám.
 * Tỷ lệ luôn 3:4 như ảnh in.
 */
export function MemoryArt({ art, alive = false, mood = null, className = '', title }: Props) {
  const uid = useId().replace(/:/g, '');
  const grain = `grain-${uid}`;
  const sky = `sky-${uid}`;
  const S = SCENES[art];
  return (
    <svg
      viewBox="0 0 300 400"
      preserveAspectRatio="xMidYMid slice"
      className={`art block h-full w-full ${alive ? 'alive' : ''} ${className}`}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      style={{ filter: mood === 'nostalgic' ? 'sepia(.45) contrast(.95)' : mood === 'playful' ? 'saturate(1.25)' : undefined }}
    >
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={S.sky[0]} />
          <stop offset="1" stopColor={S.sky[1]} />
        </linearGradient>
        <filter id={grain}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      <g className="scene">
        <rect width="300" height="400" fill={`url(#${sky})`} />
        {S.body}
      </g>
      {mood === 'warm' && <rect width="300" height="400" fill="#C57B52" opacity=".12" />}
      {mood === 'nostalgic' && <rect width="300" height="400" filter={`url(#${grain})`} opacity=".18" />}
    </svg>
  );
}

const SCENES: Record<DemoArt, { sky: [string, string]; body: JSX.Element }> = {
  seaside: {
    sky: ['#FFD9C7', '#F3E1DA'],
    body: (
      <>
        <circle className="anim rise" cx="205" cy="165" r="38" fill="#C57B52" opacity=".9" />
        <g className="anim drift" fill="#FFFFFF" opacity=".8">
          <ellipse cx="70" cy="80" rx="36" ry="10" />
          <ellipse cx="96" cy="72" rx="22" ry="9" />
        </g>
        <path d="M0 225 H300 V400 H0Z" fill="#4A3A35" />
        <g className="anim wave" opacity=".55" fill="none" stroke="#F3E1DA" strokeWidth="2.5" strokeLinecap="round">
          <path d="M-20 250 q25 -10 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0" />
          <path d="M-20 278 q25 -10 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0" opacity=".6" />
        </g>
        <path d="M0 312 Q150 285 300 312 V400 H0Z" fill="#F3E3C8" />
        <g fill="#3A2D29">
          <circle cx="126" cy="262" r="11" />
          <path d="M112 318 q2 -40 14 -44 q12 4 14 44z" />
          <circle cx="160" cy="258" r="12" />
          <path d="M145 318 q3 -44 15 -48 q13 4 15 48z" />
        </g>
      </>
    ),
  },
  birthday: {
    sky: ['#FFF0F4', '#FFE1E8'],
    body: (
      <>
        <g className="anim float" fill="#B9A69B"><rect x="40" y="70" width="10" height="10" rx="2" /></g>
        <g className="anim float" style={{ animationDelay: '.6s' }} fill="#C57B52"><circle cx="245" cy="95" r="6" /></g>
        <g className="anim float" style={{ animationDelay: '1.1s' }} fill="#4A3A35"><rect x="210" y="45" width="8" height="14" rx="2" /></g>
        <g className="anim float" style={{ animationDelay: '1.6s' }} fill="#B9A69B"><circle cx="75" cy="140" r="5" /></g>
        <rect x="70" y="250" width="160" height="80" rx="10" fill="#FFFFFF" />
        <rect x="70" y="250" width="160" height="22" rx="10" fill="#C57B52" opacity=".85" />
        <rect x="95" y="205" width="110" height="50" rx="8" fill="#FFFFFF" stroke="#DDE4EC" />
        {[118, 150, 182].map((x) => (
          <g key={x}>
            <rect x={x - 3} y="180" width="6" height="26" rx="2" fill="#4A3A35" />
            <path className="anim flicker" d={`M${x} 162 q7 9 0 17 q-7 -8 0 -17z`} fill="#C57B52" />
          </g>
        ))}
        <rect x="40" y="330" width="220" height="12" rx="6" fill="#4A3A35" opacity=".15" />
      </>
    ),
  },
  graduation: {
    sky: ['#F3E1DA', '#D6E8FB'],
    body: (
      <>
        <g className="anim float">
          <path d="M150 70 l48 18 -48 18 -48 -18z" fill="#4A3A35" />
          <rect x="132" y="92" width="36" height="14" rx="3" fill="#4A3A35" />
          <path className="anim sway" d="M194 88 v26" stroke="#C57B52" strokeWidth="3" />
        </g>
        <g className="anim drift" fill="#FFFFFF" opacity=".85"><ellipse cx="230" cy="160" rx="34" ry="9" /></g>
        <path d="M0 320 H300 V400 H0Z" fill="#EFE6DD" />
        <g fill="#3A2D29">
          <circle cx="150" cy="215" r="20" />
          <path d="M115 330 q4 -80 35 -86 q31 6 35 86z" />
        </g>
        <path d="M120 250 l-26 -36" stroke="#3A2D29" strokeWidth="10" strokeLinecap="round" className="anim sway" />
      </>
    ),
  },
  mountain: {
    sky: ['#EFE6DD', '#FBFAF6'],
    body: (
      <>
        <circle className="anim rise" cx="90" cy="120" r="26" fill="#C57B52" opacity=".75" />
        <g className="anim drift" fill="#FFFFFF"><ellipse cx="200" cy="90" rx="40" ry="10" /><ellipse cx="225" cy="82" rx="22" ry="8" /></g>
        <path d="M-10 290 L90 170 L160 250 L220 190 L310 290 V400 H-10Z" fill="#B9A69B" opacity=".55" />
        <path d="M-10 330 L70 250 L150 320 L230 240 L310 330 V400 H-10Z" fill="#4A3A35" />
        <g fill="#3A2D29"><circle cx="150" cy="300" r="7" /><path d="M143 330 q2 -22 7 -24 q5 2 7 24z" /></g>
      </>
    ),
  },
  kitchen: {
    sky: ['#FFF6E8', '#FDEBD8'],
    body: (
      <>
        <rect x="70" y="50" width="160" height="130" rx="6" fill="#F3E1DA" stroke="#FFFFFF" strokeWidth="8" />
        <path d="M150 50 v130 M70 115 h160" stroke="#FFFFFF" strokeWidth="6" />
        <circle className="anim rise" cx="190" cy="95" r="14" fill="#C57B52" opacity=".6" />
        <rect x="0" y="260" width="300" height="140" fill="#C8A77A" />
        <rect x="0" y="252" width="300" height="12" fill="#B8956A" />
        {[110, 180].map((x) => (
          <g key={x}>
            <rect x={x - 18} y="210" width="36" height="42" rx="6" fill="#FFFFFF" />
            <path d={`M${x + 18} 222 q14 2 0 18`} fill="none" stroke="#FFFFFF" strokeWidth="5" />
            <path className="anim steam" style={{ animationDelay: x === 180 ? '1s' : '0s' }} d={`M${x - 6} 200 q-6 -10 0 -20 q6 -10 0 -20`} fill="none" stroke="#5C6B7A" strokeOpacity=".5" strokeWidth="3" strokeLinecap="round" />
          </g>
        ))}
      </>
    ),
  },
};
