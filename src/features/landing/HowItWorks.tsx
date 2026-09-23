import step1 from '../../assets/landing/step1.webp';
import step2 from '../../assets/landing/step2.webp';
import step3 from '../../assets/landing/step3.webp';
import { Display, ThinArrow } from './parts';

const STEPS = [
  { n: '01', title: ['Gửi cho Chạm', 'những kỷ niệm của bạn'], body: 'Ảnh, video và một chút câu chuyện về người bạn muốn tặng.', img: step1, w: 600, h: 368, size: '19vw', alt: 'Điện thoại với thư viện ảnh và vài tấm ảnh in' },
  { n: '02', title: ['Chạm biến chúng', 'thành một món quà'], body: 'Chạm dựng trải nghiệm, gửi preview và để bạn chỉnh trước khi in.', img: step2, w: 712, h: 368, size: '23vw', alt: 'Máy tính đang dựng video kỷ niệm' },
  { n: '03', title: ['Trao món quà.', 'Để họ tự khám phá phần còn lại.'], body: 'Người nhận quét QR, hướng điện thoại vào ảnh và ký ức bắt đầu chuyển động.', img: step3, w: 792, h: 420, size: '25vw', alt: 'Khung ảnh và bàn tay cầm điện thoại phát lại khoảnh khắc' },
];

export function HowItWorks() {
  return (
    <section id="cach-hoat-dong" className="sec-y scroll-mt-20 bg-[#F5ECE2]">
      <div className="lwrap">
        <Display className="t-h3">Từ kỷ niệm trong điện thoại đến món quà trên tay</Display>
        <ol className="mt-[clamp(32px,3.6vw,64px)] grid gap-y-14 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.n} className={`relative flex flex-col ${i > 0 ? 'lg:border-l lg:border-taupe/40 lg:pl-[2.6vw]' : ''} ${i < 2 ? 'lg:pr-[2.6vw]' : ''}`}>
              {i > 0 && <ThinArrow className="absolute -left-[2vw] bottom-[5.5vw] hidden w-[4vw] bg-[#F5ECE2] text-cocoa/70 lg:block" />}
              <div className="flex gap-[clamp(14px,1.4vw,28px)]">
                <span className="font-serif text-[clamp(2.6rem,3.4vw,4.4rem)] font-normal leading-[0.9] text-cocoa">{s.n}</span>
                <div>
                  <h3 className="t-body font-medium leading-snug text-cocoa">
                    {s.title[0]}
                    <br />
                    {s.title[1]}
                  </h3>
                  <p className="t-small mt-3 max-w-[340px] text-cocoa/75">{s.body}</p>
                </div>
              </div>
              <div className="mt-8 flex flex-1 items-end justify-center">
                <img src={s.img} width={s.w} height={s.h} alt={s.alt} loading="lazy" className="fade-edges h-auto max-w-full" style={{ width: `clamp(220px, ${s.size}, ${s.w / 2 + 60}px)` }} />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
