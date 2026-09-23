import { Check, Pencil, Play } from 'lucide-react';
import memory from '../../assets/v4/memory.webp';
import { BUSINESS } from '../../config/business';
import { Reveal } from '../landing-v2/motion';

const STEPS = [
  { n: '01', t: 'Gửi ảnh, video', b: 'Chỉ có ảnh cũ cũng làm được.' },
  { n: '02', t: 'Duyệt bản xem trước', b: `Sửa tối đa ${BUSINESS.maxRevisions} lần.` },
  { n: '03', t: 'Nhận quà, ship tận tay', b: 'Hoàn thiện 3–5 ngày làm việc sau khi duyệt.' },
];

/** Bản xem trước thu nhỏ, mô phỏng đúng màn duyệt trong trang đơn hàng. */
function PreviewCard() {
  return (
    <div className="mx-auto w-full max-w-[340px] rounded-[28px] border border-taupe/30 bg-cream p-4 shadow-[0_30px_70px_-35px_rgba(74,58,53,0.55)]">
      <div className="flex items-center justify-between px-1 pb-3">
        <span className="text-[13px] font-medium text-cocoa">Bản xem trước</span>
        <span className="rounded-full bg-[#EFE5D9] px-2.5 py-0.5 text-[11px] font-medium text-cocoa">v1</span>
      </div>
      <div className="relative overflow-hidden rounded-2xl">
        <img src={memory} alt="Bản xem trước: ảnh mẹ cõng con đang chuyển động" loading="lazy" className="v2-live aspect-[4/5] w-full object-cover" />
        <span aria-hidden className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cream/85 text-cocoa">
            <Play className="ml-0.5 h-5 w-5 fill-current" />
          </span>
        </span>
        <span aria-hidden className="absolute inset-x-4 bottom-4 h-[3px] overflow-hidden rounded-full bg-cream/40">
          <span className="v2-progress block h-full rounded-full bg-cream" />
        </span>
      </div>
      <div className="mt-4 grid gap-2" aria-hidden>
        <span className="flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-cocoa text-[14px] font-medium text-cream">
          <Check className="h-4 w-4" /> Duyệt bản này
        </span>
        <span className="flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-cocoa/25 text-[14px] font-medium text-cocoa">
          <Pencil className="h-4 w-4" /> Yêu cầu sửa · còn {BUSINESS.maxRevisions} lần
        </span>
      </div>
    </div>
  );
}

export function FlowV7() {
  return (
    <section id="mon-qua" className="scroll-mt-20 bg-[#F7F1E7] py-16 lg:py-[7vw]">
      <div className="lwrap grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-[6vw]">
        <div>
          <Reveal as="h2" className="font-serif text-[clamp(2.1rem,3.6vw,3.6rem)] font-normal leading-[1.08] text-cocoa">
            Bạn được xem món quà
            <br />
            trước khi trao.
          </Reveal>
          <ol className="mt-10">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.n} delay={i * 90} className="flex items-baseline gap-5 border-t border-taupe/40 py-5">
                <span className="font-serif text-[clamp(2rem,2.8vw,2.8rem)] leading-none text-cocoa">{s.n}</span>
                <span>
                  <span className="block text-[18px] font-medium text-cocoa">{s.t}</span>
                  <span className="mt-1 block text-[15px] text-cocoa/70">{s.b}</span>
                </span>
              </Reveal>
            ))}
          </ol>
        </div>
        <Reveal delay={120}>
          <PreviewCard />
          <p className="mt-4 text-center text-[12.5px] text-cocoa-soft">Màn hình minh họa</p>
        </Reveal>
      </div>
    </section>
  );
}
