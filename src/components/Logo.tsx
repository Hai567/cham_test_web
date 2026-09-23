import { Link } from 'react-router-dom';

/**
 * Chữ ký thương hiệu Chạm: wordmark serif kèm dấu chấm (dấu nặng của "Chạm")
 * như một điểm "chạm". Dùng chung ở mọi trang.
 */
export function Logo({ to = '/', tagline = false }: { to?: string; tagline?: boolean }) {
  return (
    <Link to={to} className="group inline-flex items-center gap-3 text-cocoa" aria-label="Chạm, về trang chủ">
      <span className="font-serif text-[26px] font-semibold uppercase tracking-brand leading-none">
        Ch<span className="relative">ạ<span aria-hidden className="absolute -right-[3px] top-[2px] h-[3px] w-[3px] rounded-full bg-coral" /></span>m
      </span>
      {tagline && <span className="hidden text-[13px] text-cocoa-soft sm:inline">Để ký ức ở lại.</span>}
    </Link>
  );
}
