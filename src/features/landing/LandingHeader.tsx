import { ArrowRight, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/landing/logo.png';

const NAV = [
  { href: '#cach-hoat-dong', label: 'Cách hoạt động' },
  { href: '#san-pham', label: 'Sản phẩm' },
  { href: '#cau-chuyen', label: 'Câu chuyện' },
  { href: '#lien-he', label: 'Liên hệ' },
];

export function Wordmark({ className = '' }: { className?: string }) {
  return <img src={logo} width={300} height={92} alt="Chạm" className={`h-auto w-[clamp(92px,7.4vw,138px)] ${className}`} />;
}

export function LandingHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-40 transition-colors duration-300 ${scrolled || open ? 'bg-[#F7F1E7]/95 shadow-[0_1px_0_rgba(74,58,53,.08)] backdrop-blur-md' : 'bg-transparent'}`}>
      <div className="lwrap flex h-20 items-center justify-between gap-4">
        <Link to="/" className="flex min-h-[44px] items-center gap-4" aria-label="Chạm, về trang chủ">
          <Wordmark />
          <span className="t-label hidden tracking-[0.18em] text-cocoa-soft sm:inline">Để ký ức ở lại.</span>
        </Link>
        <nav aria-label="Điều hướng chính" className="hidden items-center gap-[2.6vw] lg:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="t-small text-cocoa/85 underline-offset-8 hover:text-cocoa hover:underline">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <Link
            to="/order"
            className="hidden min-h-[46px] items-center gap-2 rounded-full bg-cocoa px-7 t-small font-medium text-cream transition-colors hover:bg-cocoa-deep sm:inline-flex"
          >
            Tạo món quà <ArrowRight aria-hidden className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-cocoa hover:bg-cocoa/5 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Đóng menu' : 'Mở menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Điều hướng chính" className="border-t border-taupe-line/70 lg:hidden">
          <ul className="lwrap flex flex-col py-2">
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="block py-3 text-[16px] text-cocoa" onClick={() => setOpen(false)}>{n.label}</a>
              </li>
            ))}
            <li className="py-3">
              <Link to="/order" className="flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-cocoa text-[15px] font-medium text-cream" onClick={() => setOpen(false)}>
                Tạo món quà <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
