import { Link } from 'react-router-dom';
import { CONTACT } from '../../config/business';
import { Wordmark } from './LandingHeader';

export function LandingFooter() {
  const links = [
    { label: 'Instagram', url: CONTACT.social.find((s) => s.label === 'Instagram')?.url ?? '#' },
    { label: 'TikTok', url: CONTACT.social.find((s) => s.label === 'TikTok')?.url ?? '#' },
    { label: 'Email', url: `mailto:${CONTACT.email}` },
    { label: 'Contact', url: '#lien-he' },
  ];
  return (
    <footer className="bg-[#F7F1E7]">
      <div className="lwrap flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between lg:py-[1.8vw]">
        <Link to="/" className="flex min-h-[44px] items-center gap-6" aria-label="Chạm, về trang chủ">
          <Wordmark className="opacity-90" />
          <span className="t-label tracking-[0.18em] text-cocoa-soft">Để ký ức ở lại.</span>
        </Link>
        <nav aria-label="Liên kết chân trang" className="flex flex-wrap items-center gap-x-6 t-small">
          {links.map((l) => (
            <a key={l.label} href={l.url} className="inline-flex min-h-[44px] items-center text-cocoa/80 hover:text-cocoa hover:underline">{l.label}</a>
          ))}
          <span className="text-cocoa-soft">© Chạm</span>
        </nav>
      </div>
    </footer>
  );
}
