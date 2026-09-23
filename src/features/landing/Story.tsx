import team1 from '../../assets/landing/team1.webp';
import team2 from '../../assets/landing/team2.webp';
import team3 from '../../assets/landing/team3.webp';
import { Display } from './parts';

/** Ảnh và tên đội ngũ là placeholder theo mockup; thay bằng thông tin thật khi có. */
const TEAM = [
  { img: team1, name: 'Tên nhân sự', role: 'Vai trò' },
  { img: team2, name: 'Tên nhân sự', role: 'Vai trò' },
  { img: team3, name: 'Tên nhân sự', role: 'Vai trò' },
];

export function Story() {
  return (
    <section id="cau-chuyen" className="sec-y relative scroll-mt-20 overflow-hidden bg-[#F4E7DA]">
      <svg aria-hidden viewBox="0 0 110 36" className="pointer-events-none absolute right-[4vw] top-[2vw] hidden w-[11vw] text-[#C79A86] lg:block" fill="none">
        <path d="M2 34C30 30 48 22 62 10c6-5 8-9 3-8-6 1-10 12-4 17 6 5 24-4 47-15" stroke="currentColor" strokeWidth=".9" strokeLinecap="round" />
      </svg>
      <div className="lwrap grid gap-10 lg:grid-cols-[1.05fr_1px_1fr_1px_1fr] lg:gap-x-[3vw]">
        <div>
          <Display className="t-h3">Vì sao có Chạm?</Display>
          <div className="t-small mt-5 space-y-4 text-cocoa/80">
            <p>Điện thoại của chúng ta có hàng nghìn bức ảnh, nhưng những khoảnh khắc quan trọng nhất thường chỉ nằm lại trong thư viện ảnh.</p>
            <p>Chạm được tạo ra để rút ngắn khoảng cách đó: biến những kỷ niệm đã có thành một món quà có thể cầm trên tay và được trải nghiệm lại.</p>
          </div>
        </div>
        <span aria-hidden className="hidden bg-taupe/40 lg:block" />
        <div className="space-y-8 lg:pt-[1vw]">
          <div>
            <h3 className="t-body font-semibold text-cocoa">Chúng mình tin</h3>
            <p className="t-small mt-2 text-cocoa/80">
              Những kỷ niệm số không chỉ nên nằm trong camera roll. Chúng có thể trở thành những vật thể mà con người giữ lại, trao cho nhau và quay lại nhiều năm sau.
            </p>
          </div>
          <div>
            <h3 className="t-body font-semibold text-cocoa">Chạm đang làm điều đó bằng cách</h3>
            <p className="t-small mt-2 text-cocoa/80">
              Kết hợp món quà vật lý với ảnh, video và trải nghiệm số theo cách đủ đơn giản để bất kỳ ai cũng có thể tạo một món quà cá nhân.
            </p>
          </div>
        </div>
        <span aria-hidden className="hidden bg-taupe/40 lg:block" />
        <div className="lg:pt-[1vw]">
          <h3 className="t-body font-semibold text-cocoa">Những người đứng sau Chạm</h3>
          <ul className="mt-6 flex gap-[clamp(16px,2vw,36px)]">
            {TEAM.map((m, i) => (
              <li key={i} className="flex flex-col items-center whitespace-nowrap text-center">
                <img src={m.img} width={200} height={200} alt="" loading="lazy" className="aspect-square w-[clamp(64px,6.2vw,112px)] rounded-full object-cover" />
                <p className="t-small mt-3 text-cocoa">{m.name}</p>
                <p className="t-label text-cocoa-soft">{m.role}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
