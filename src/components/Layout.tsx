import { WifiOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { useOnline } from '../lib/useOnline';
import { Link } from 'react-router-dom';
import { COPY } from '../config/business';
import { Logo } from './Logo';


export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-navy px-4 py-2 text-center text-sm text-white">
      <WifiOff aria-hidden className="h-4 w-4 shrink-0" />
      Bạn đang offline. Ứng dụng vẫn chạy vì dữ liệu MVP được lưu ngay trên thiết bị.
    </div>
  );
}

export function SiteHeader({ right }: { right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/95 backdrop-blur-sm">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        {right}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="container-page grid gap-6 py-10 text-sm text-muted md:grid-cols-[1fr_auto]">
        <div className="max-w-xl space-y-2">
          <p className="font-semibold text-navy">Chạm. Để ký ức ở lại.</p>
          <p>{COPY.persistence}</p>
        </div>
        <nav aria-label="Liên kết phụ" className="flex flex-wrap gap-x-5 gap-y-1">
          <Link className="inline-flex min-h-[44px] items-center underline-offset-4 hover:underline" to="/demo">Bản trình bày</Link>
          <Link className="inline-flex min-h-[44px] items-center underline-offset-4 hover:underline" to="/admin">Vận hành</Link>
        </nav>
      </div>
    </footer>
  );
}
