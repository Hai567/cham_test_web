import s4Photo from '../../assets/landing/s4-photo.webp';
import v1 from '../../assets/landing/v1.webp';
import v2 from '../../assets/landing/v2.webp';
import v3 from '../../assets/landing/v3.webp';
import v4 from '../../assets/landing/v4.webp';
import { Display } from './parts';

const VALUES = [
  { img: v1, title: 'Cá nhân thật sự', body: 'Được tạo từ chính ảnh, video và câu chuyện của bạn, không phải một món quà generic chỉ thay tên.' },
  { img: v2, title: 'Ký ức không dừng ở một tấm ảnh', body: 'Một khoảnh khắc có thể tiếp tục chuyển động, hoặc mở ra thành nhiều kỷ niệm khác.' },
  { img: v3, title: 'Bạn không phải tự thiết kế', body: 'Chạm dựng trải nghiệm trước. Bạn chỉ cần duyệt và chỉnh những gì chưa đúng.' },
  { img: v4, title: 'Dễ dàng cho người nhận', body: 'Quét QR và xem trực tiếp trên điện thoại. Không cần tải thêm ứng dụng.' },
];

/** Ảnh sản phẩm chiếm 65% bề ngang (chữ đặt đè), 4 giá trị ở 35% còn lại. */
export function ProductWhy() {
  return (
    <section className="bg-[#F6F0E6]">
      <div className="grid lg:grid-cols-[65fr_35fr]">
        <div className="relative">
          <img
            src={s4Photo}
            width={2672}
            height={1200}
            alt="Hộp quà Chạm, khung ảnh gỗ in ảnh cặp đôi lúc hoàng hôn, mặt sau khung có mã QR, vài ảnh in và dải ruy băng."
            loading="lazy"
            className="hidden h-full w-full object-cover lg:block"
          />
          <div className="lwrap pt-14 lg:absolute lg:left-0 lg:top-0 lg:w-auto lg:max-w-none lg:px-0 lg:pl-[7.5vw] lg:pt-[5.2vw]">
            <Display className="font-serif text-[clamp(1.9rem,2.25vw,3rem)] leading-[1.14]">
              Một món quà để giữ.
              <br />
              Một trải nghiệm để nhớ.
            </Display>
            <p className="t-small mt-[1.5vw] max-w-md text-cocoa/80 lg:max-w-[21vw]">
              Khung ảnh in 15 × 20 cm, được tạo từ chính ảnh, video và câu chuyện của bạn. Chỉ cần quét QR, khoảnh khắc ấy sẽ sống lại.
            </p>
          </div>
          <img src={s4Photo} width={2672} height={1200} alt="" aria-hidden loading="lazy" className="mt-8 block h-[320px] w-full object-cover object-[45%_60%] sm:h-[420px] lg:hidden" />
        </div>
        <ul className="flex flex-col justify-center gap-[clamp(20px,2.2vw,40px)] px-5 py-12 sm:px-8 lg:py-[3vw] lg:pl-[2.2vw] lg:pr-[7.5vw]">
          {VALUES.map((v) => (
            <li key={v.title} className="flex items-center gap-[clamp(14px,1.4vw,26px)]">
              <img src={v.img} width={256} height={256} alt="" aria-hidden loading="lazy" className="aspect-square w-[clamp(60px,5.6vw,104px)] shrink-0 rounded-full object-cover shadow-soft" />
              <div>
                <h3 className="t-body font-medium text-cocoa">{v.title}</h3>
                <p className="t-small mt-1 text-cocoa/75">{v.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
