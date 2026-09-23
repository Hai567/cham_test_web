import exp1 from '../../assets/landing/exp1.webp';
import exp2 from '../../assets/landing/exp2.webp';
import exp3 from '../../assets/landing/exp3.webp';
import { Display, ThinArrow } from './parts';

const TYPES = [
  { img: exp1, name: 'Khoảnh khắc sống lại', body: 'Video tiếp nối chính khoảnh khắc trong ảnh.', alt: 'Cặp đôi đứng bên bờ biển' },
  { img: exp2, name: 'Một ảnh, nhiều kỷ niệm', body: 'Từ một bức ảnh đại diện, mở ra cả hành trình của chuyến đi, ngày đặc biệt hay câu chuyện.', alt: 'Nhiều tấm ảnh in xếp chồng' },
  { img: exp3, name: 'Từ khoảnh khắc đến câu chuyện', body: 'Bắt đầu từ chính khoảnh khắc đang nhìn thấy, rồi mở rộng thành những ký ức khác.', alt: 'Chuỗi ảnh kỷ niệm mở rộng từ một khoảnh khắc' },
];

export function ExperienceTypes() {
  return (
    <section className="sec-y bg-[#F8F1E8]">
      <div className="lwrap">
        <Display className="t-h3">Ba cách để ảnh kể chuyện</Display>
        <div className="mt-[clamp(28px,2.6vw,48px)] grid gap-y-12 lg:grid-cols-[1fr_5vw_1fr_5vw_1fr]">
          {TYPES.map((t, i) => (
            <div key={t.name} className="contents">
              <article>
                <img src={t.img} width={1024} height={316} alt={t.alt} loading="lazy" className="aspect-[1024/316] h-auto w-full max-w-[560px] object-cover" />
                <h3 className="t-label mt-[1.4vw] font-medium uppercase tracking-[0.14em] text-cocoa max-lg:mt-4">{t.name}</h3>
                <p className="t-small mt-2 max-w-[400px] text-cocoa/75">{t.body}</p>
              </article>
              {i < TYPES.length - 1 && (
                <div aria-hidden className="hidden items-start justify-center pt-[5.3vw] lg:flex">
                  <ThinArrow className="w-[2.6vw] text-cocoa/70" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
