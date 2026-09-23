import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroBg from '../../assets/landing/hero-bg.webp';

const REASSURANCE = ['Không cần cài ứng dụng', 'Duyệt trước khi in', 'Hoàn thiện trong 3–5 ngày'];

/**
 * Hero lớn: cao khoảng 43% bề ngang màn hình (tối đa 94% chiều cao), ảnh phủ nền
 * neo góc phải dưới để khung ảnh và điện thoại luôn nằm bên phải, chữ bên trái.
 */
export function Hero() {
  return (
    <section className="relative -mt-20 overflow-hidden bg-[#EFE5D9]">
      <img
        src={heroBg}
        width={2560}
        height={960}
        alt="Khung ảnh gỗ in ảnh một cặp đôi bên biển, bình hoa nhỏ, và bàn tay cầm điện thoại đang phát lại chính khoảnh khắc đó."
        fetchPriority="high"
        className="absolute inset-0 hidden h-full w-full object-cover object-[100%_100%] lg:block"
      />
      <div className="lwrap relative z-10 pb-10 pt-28 lg:flex lg:h-[min(40vw,94vh)] lg:min-h-[480px] lg:flex-col lg:justify-center lg:pb-0 lg:pt-20">
        <h1 className="t-h1 font-serif font-normal text-cocoa">
          Có những khoảnh khắc <br className="hidden lg:inline" />
          không nên chỉ nằm <br className="hidden lg:inline" />
          trong điện thoại.
        </h1>
        <p className="t-body mt-[1.6vw] max-w-[480px] text-cocoa/80 lg:max-w-[31vw]">
          Chạm biến ảnh và video của bạn thành một khung ảnh kỷ niệm, để người nhận có thể nhìn, giữ và sống lại khoảnh khắc ấy.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3 lg:mt-[2.4vw] lg:gap-[1.1vw]">
          <Link to="/order" className="t-small inline-flex min-h-[48px] items-center gap-2 rounded-full bg-cocoa px-8 font-medium text-cream transition-colors hover:bg-cocoa-deep lg:min-h-[max(48px,3.4vw)]">
            Tạo món quà <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
          <a href="#san-pham" className="t-small inline-flex min-h-[48px] items-center gap-2 rounded-full border border-cocoa/30 bg-cream/40 px-8 font-medium text-cocoa transition-colors hover:border-cocoa/60 lg:min-h-[max(48px,3.4vw)]">
            Xem ký ức sống lại <ArrowRight aria-hidden className="h-4 w-4" />
          </a>
        </div>
        <ul className="t-label mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-cocoa-soft lg:mt-[2.6vw]">
          {REASSURANCE.map((r, i) => (
            <li key={r} className="flex items-center gap-3">
              {i > 0 && <span aria-hidden>·</span>}
              {r}
            </li>
          ))}
        </ul>
      </div>
      <img src={heroBg} width={2560} height={960} alt="" aria-hidden className="block h-[320px] w-full object-cover object-[82%_100%] sm:h-[420px] lg:hidden" />
    </section>
  );
}
