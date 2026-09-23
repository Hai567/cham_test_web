import { Link2, Volume2 } from 'lucide-react';
import type { ReactNode } from 'react';
import aim from '../../assets/v2/aim.webp';
import logo from '../../assets/v2/logo.png';
import photo from '../../assets/v2/photo.webp';
import { useQr } from './hooks';
import { FadingVideo } from '../landing-v3/FadingVideo';

/** Khung điện thoại chung, không mô phỏng một hãng cụ thể. */
export function Phone({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative aspect-[1/2.08] rounded-[42px] bg-[#2A211E] p-[9px] shadow-[0_40px_80px_-40px_rgba(58,45,41,0.6)] ${className}`}>
      <div className="relative h-full w-full overflow-hidden rounded-[34px] bg-[#1C1715]">
        {children}
        <div aria-hidden className="absolute left-1/2 top-2.5 h-6 w-[28%] -translate-x-1/2 rounded-full bg-[#0E0B0A]" />
      </div>
    </div>
  );
}

function Brackets({ inset, tone = 'rgba(252,249,244,0.95)' }: { inset: string; tone?: string }) {
  const c = (pos: string, b: string) => <span className={`absolute h-7 w-7 ${pos}`} style={{ borderColor: tone, borderStyle: 'solid', borderWidth: b, borderRadius: 6 }} />;
  return (
    <div aria-hidden className="absolute" style={{ inset }}>
      {c('left-0 top-0', '3px 0 0 3px')}
      {c('right-0 top-0', '3px 3px 0 0')}
      {c('bottom-0 left-0', '0 0 3px 3px')}
      {c('bottom-0 right-0', '0 3px 3px 0')}
    </div>
  );
}

const pill = 'absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3.5 py-2 text-[11.5px] font-medium';

export function ScreenScan({ logoImg = logo }: { logoImg?: string } = {}) {
  const qr = useQr('https://cham.vn/demo');
  return (
    <div className="absolute inset-0" role="img" aria-label="Camera điện thoại quét mã ở mặt sau khung ảnh">
      <div className="absolute inset-0 bg-gradient-to-br from-[#5A4A42] to-[#2B221F]" />
      <div className="absolute left-[14%] top-[22%] flex h-[52%] w-[72%] -rotate-3 flex-col items-center justify-center gap-2 rounded-sm border-[10px] border-[#D9C4A5] bg-[#F3EBDF]">
        <img src={logoImg} alt="" className="w-[34%]" />
        {qr ? <img src={qr} alt="" className="w-[46%]" /> : <div className="aspect-square w-[46%] bg-white" />}
        <span className="text-[8.5px] tracking-[0.12em] text-cocoa-soft">QUÉT ĐỂ XEM KỶ NIỆM</span>
      </div>
      <Brackets inset="17% 26% 30% 26%" />
      <div className={`${pill} bottom-[13%] flex items-center gap-1.5 bg-cream/95 text-cocoa`}>
        <Link2 aria-hidden className="h-3.5 w-3.5" /> Mở kỷ niệm từ Chạm
      </div>
    </div>
  );
}

export function ScreenAim({ img = aim }: { img?: string } = {}) {
  return (
    <div className="absolute inset-0" role="img" aria-label="Camera hướng vào khung ảnh đặt trên bàn">
      <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_45%]" />
      <div className="absolute inset-0 bg-[#1C1715]/20" />
      <Brackets inset="21% 20% 30% 20%" tone="#F3E1DA" />
      <div className={`${pill} top-[16%] bg-[#1C1715]/55 text-cream`}>Giữ yên điện thoại</div>
      <div className={`${pill} bottom-[12%] bg-cream/95 text-cocoa`}>Hướng camera vào tấm ảnh</div>
    </div>
  );
}

/** Màn phát: ảnh chuyển động chậm và thanh tiến trình chạy, như video đang phát. */
export type ClipSrc = { mp4: string; webm?: string };

export function ScreenPlay({ active = true, video, img = photo }: { active?: boolean; video?: ClipSrc; img?: string }) {
  return (
    <div className="absolute inset-0" role="img" aria-label="Tấm ảnh bà và cháu đang chuyển động trên màn hình">
      {video ? (
        <div className="absolute inset-0">
          <FadingVideo mp4={video.mp4} webm={video.webm} poster={img} className="h-full w-full" />
        </div>
      ) : (
        <img src={img} alt="" className={`absolute inset-0 h-full w-full object-cover ${active ? 'v2-live' : ''}`} />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1C1715]/35 via-transparent to-[#1C1715]/55" />
      <div className="absolute left-3.5 top-11 flex items-center gap-1.5 rounded-full bg-cream/90 px-2.5 py-1 text-[10.5px] font-semibold text-cocoa">
        <span className="h-1.5 w-1.5 rounded-full bg-coral" /> Đang phát
      </div>
      <div className={`${pill} bottom-14 flex items-center gap-1.5 bg-cream/95 text-cocoa`}>
        <Volume2 aria-hidden className="h-3.5 w-3.5" /> Chạm để bật âm thanh
      </div>
      <div className="absolute inset-x-[18px] bottom-[30px] h-[3px] overflow-hidden rounded-full bg-cream/35">
        <div className={`h-full rounded-full bg-cream ${active ? 'v2-progress' : 'w-[38%]'}`} />
      </div>
    </div>
  );
}
