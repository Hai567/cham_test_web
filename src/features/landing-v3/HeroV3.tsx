import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroPoster from '../../assets/v2/hero.webp';
import heroMPoster from '../../assets/v2/hero-m.webp';
import heroMMp4 from '../../assets/v3/hero-m.mp4';
import heroMWebm from '../../assets/v3/hero-m.webm';
import heroMp4 from '../../assets/v3/hero.mp4';
import heroWebm from '../../assets/v3/hero.webm';
import { BlurText } from './BlurText';
import { FadingVideo } from './FadingVideo';

const HEADLINE = 'Có những điều\nchưa từng nói\nthành lời.';
const btnDark = 'inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full bg-cocoa px-7 text-[15px] font-medium text-cream transition-colors hover:bg-cocoa-deep';
const btnLine = 'inline-flex min-h-[50px] items-center justify-center rounded-full border border-cocoa/30 bg-cream/75 px-7 text-[15px] font-medium text-cocoa backdrop-blur-sm transition-colors hover:border-cocoa/60';

/**
 * Hero V3.
 * Desktop: video neo mép phải, mép trái mờ vào nền kem, tiêu đề hiện từng từ.
 * Mobile: video phủ kín màn hình, chữ và nút dồn xuống đáy trên một lớp kem mờ dần.
 */
export function HeroV3() {
  const sub = 'Biến kỷ niệm của hai người thành một khung ảnh biết kể chuyện.';
  return (
    <section className="relative h-[100svh] min-h-[640px] overflow-hidden bg-[#F5EEE5] lg:h-[min(100svh,56vw)] lg:min-h-[620px]">
      <div
        className="absolute inset-y-0 right-0 hidden w-[70%] lg:block"
        style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, #000 30%)', maskImage: 'linear-gradient(to right, transparent, #000 30%)' }}
      >
        <FadingVideo mp4={heroMp4} webm={heroWebm} poster={heroPoster} className="h-full w-full" videoClassName="object-[49%_50%]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#F5EEE5]/60 to-transparent" />
      </div>
      <div className="absolute inset-0 lg:hidden">
        <FadingVideo mp4={heroMMp4} webm={heroMWebm} poster={heroMPoster} className="h-full w-full" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#F5EEE5]/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-[#F5EEE5] via-[#F5EEE5]/90 to-transparent" />
      </div>

      <span className="sr-only">Người con trao khung ảnh kỷ niệm cho bà bên bàn gỗ, cạnh hộp quà thắt nơ.</span>
      <div className="lwrap relative flex h-full flex-col justify-end pb-8 lg:justify-center lg:pb-0 lg:pt-10">
        <BlurText
          text={HEADLINE}
          className="max-w-[520px] font-serif text-[clamp(2.7rem,4.6vw,4.6rem)] font-normal leading-[1.04] text-cocoa"
          delay={250}
        />
        <p className="v2-in mt-5 max-w-[400px] text-[clamp(1rem,1.25vw,1.2rem)] leading-relaxed text-cocoa/80" style={{ animationDelay: '1300ms' }}>
          {sub}
        </p>
        <div className="v2-in mt-7 flex flex-wrap gap-3 lg:mt-9" style={{ animationDelay: '1600ms' }}>
          <Link to="/order" className={btnDark}>Tạo món quà <ArrowRight aria-hidden className="h-4 w-4" /></Link>
          <a href="#cach-dung" className={btnLine}>Xem cách dùng</a>
        </div>
      </div>
    </section>
  );
}
