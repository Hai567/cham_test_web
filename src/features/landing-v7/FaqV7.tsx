import { Plus } from 'lucide-react';
import { BUSINESS, COPY } from '../../config/business';
import { Reveal } from '../landing-v2/motion';

/** Chỉ trả lời những điều đã chốt; chưa chốt (giá, phí ship) thì nói rõ Chạm sẽ báo khi xác nhận đơn. */
const QA = [
  {
    q: 'Bố mẹ lớn tuổi có dùng được không?',
    a: 'Được. Chỉ cần mở camera điện thoại, quét mã ở mặt sau khung rồi hướng vào tấm ảnh. Không cần cài ứng dụng hay tạo tài khoản. Không quét thì khung vẫn là một tấm ảnh đẹp để đặt trên bàn.',
  },
  {
    q: 'Không có video thì làm sao?',
    a: 'Vẫn làm được. Với ảnh, Chạm dựng thành kiểu “Một ảnh, nhiều kỷ niệm”: từ một tấm ảnh chính mở ra những khoảnh khắc bạn gửi. Chỉ có ảnh cũ trong album cũng được, miễn là từ 2 ảnh trở lên.',
  },
  {
    q: 'Bao lâu thì nhận được quà?',
    a: `${BUSINESS.serviceTimeAfterApproval.label}, chưa tính thời gian giao hàng. Muốn tặng đúng dịp thì nên đặt sớm.`,
  },
  {
    q: 'Được sửa mấy lần?',
    a: `Tối đa ${BUSINESS.maxRevisions} lần trước khi in. Chỉ khi bạn duyệt, Chạm mới in, nên bạn luôn thấy món quà trước người nhận.`,
  },
  {
    q: 'Mã QR xem được bao lâu?',
    a: COPY.persistence,
  },
  {
    q: 'Giao hàng và thanh toán thế nào?',
    a: 'Sau khi bạn gửi yêu cầu, Chạm liên hệ qua số điện thoại hoặc Zalo bạn để lại để xác nhận đơn, báo phí giao hàng và cách thanh toán.',
  },
];

export function FaqV7() {
  return (
    <section id="hoi-dap" className="scroll-mt-20 bg-[#F2E9DF] py-16 lg:py-[6vw]">
      <div className="lwrap grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-[6vw]">
        <Reveal as="h2" className="font-serif text-[clamp(2.1rem,3.4vw,3.4rem)] font-normal leading-[1.08] text-cocoa">
          Hỏi nhanh,
          <br />
          đáp gọn.
        </Reveal>
        <div>
          {QA.map((x, i) => (
            <Reveal key={x.q} delay={i * 50}>
              <details className="group border-t border-taupe/40 last:border-b">
                <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-4 py-4 text-[17px] font-medium text-cocoa [&::-webkit-details-marker]:hidden">
                  {x.q}
                  <Plus aria-hidden className="h-5 w-5 shrink-0 text-cocoa/60 transition-transform duration-300 group-open:rotate-45" />
                </summary>
                <p className="max-w-[60ch] pb-5 text-[15.5px] leading-relaxed text-cocoa/75">{x.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
