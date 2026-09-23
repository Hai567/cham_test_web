import { ArrowRight, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Link } from 'react-router-dom';
import blossom from '../../assets/landing/blossom.webp';
import { CONTACT } from '../../config/business';
import { Display } from './parts';

export function InstagramGlyph({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TikTokGlyph({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M16.6 3c.4 2.2 1.8 3.7 4 3.9v3.2a7.4 7.4 0 0 1-4-1.3v6.3a5.9 5.9 0 1 1-5.9-5.9c.3 0 .6 0 .9.1v3.3a2.7 2.7 0 1 0 1.8 2.5V3h3.2Z" />
    </svg>
  );
}

/** QR liên hệ (mở kênh nhắn tin của Chạm), khác mã AR ở mặt sau khung. */
function useContactQr(): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    const ig = CONTACT.social.find((s) => s.label === 'Instagram')?.url;
    const target = ig && ig !== '#' ? ig : `mailto:${CONTACT.email}`;
    QRCode.toDataURL(target, { margin: 1, width: 320, color: { dark: '#3A2D29', light: '#FFFFFF' } })
      .then((d) => alive && setUrl(d))
      .catch(() => alive && setUrl(null));
    return () => {
      alive = false;
    };
  }, []);
  return url;
}

export function FinalCta() {
  const qr = useContactQr();
  const ig = CONTACT.social.find((s) => s.label === 'Instagram')?.url ?? '#';
  const tt = CONTACT.social.find((s) => s.label === 'TikTok')?.url ?? '#';
  return (
    <section id="lien-he" className="relative scroll-mt-20 overflow-hidden bg-[#53392D] text-cream">
      <img
        src={blossom}
        width={560}
        height={368}
        alt=""
        aria-hidden
        loading="lazy"
        className="fade-tr pointer-events-none absolute bottom-0 left-0 hidden h-auto w-[clamp(180px,17vw,320px)] md:block"
      />
      <div className="lwrap grid gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_auto_1px_auto] lg:items-center lg:gap-x-[3.4vw] lg:py-[4.6vw] lg:!pl-[18vw]">
        <div>
          <Display className="t-h3 text-cream">Có một kỷ niệm bạn muốn giữ lại?</Display>
          <p className="t-small mt-3 max-w-[30vw] text-cream/80 max-lg:max-w-md">
            Gửi Chạm những gì bạn đang có. Phần còn lại, chúng mình sẽ cùng bạn biến thành một món quà.
          </p>
          <div className="mt-[2vw] flex flex-wrap gap-3 max-lg:mt-6">
            <Link to="/order" className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-cream px-8 t-small font-medium text-cocoa transition-colors hover:bg-white">
              Tạo món quà của bạn <ArrowRight aria-hidden className="h-3.5 w-3.5" />
            </Link>
            <a href={`mailto:${CONTACT.email}`} className="inline-flex min-h-[48px] items-center rounded-full border border-cream/50 px-8 t-small font-medium text-cream transition-colors hover:bg-cream/10">
              Liên hệ với Chạm
            </a>
          </div>
        </div>
        <ul className="t-small space-y-2">
          <li><a href={`mailto:${CONTACT.email}`} className="inline-flex min-h-[36px] items-center gap-3 text-cream/90 hover:text-cream"><Mail aria-hidden className="h-4 w-4" strokeWidth={1.6} />{CONTACT.email}</a></li>
          <li><a href={ig} className="inline-flex min-h-[36px] items-center gap-3 text-cream/90 hover:text-cream"><InstagramGlyph className="h-4 w-4" />Instagram</a></li>
          <li><a href={tt} className="inline-flex min-h-[36px] items-center gap-3 text-cream/90 hover:text-cream"><TikTokGlyph className="h-4 w-4" />TikTok</a></li>
        </ul>
        <span aria-hidden className="hidden h-[8vw] max-h-40 bg-cream/25 lg:block" />
        <div className="text-center">
          <div className="inline-block bg-white p-2">
            {qr ? <img src={qr} alt="Mã QR liên hệ Chạm" className="h-[clamp(88px,7.6vw,140px)] w-[clamp(88px,7.6vw,140px)]" /> : <div className="h-[clamp(88px,7.6vw,140px)] w-[clamp(88px,7.6vw,140px)]" aria-hidden />}
          </div>
          <p className="t-label mt-3 text-cream/85">Quét để liên hệ Chạm</p>
        </div>
      </div>
    </section>
  );
}
