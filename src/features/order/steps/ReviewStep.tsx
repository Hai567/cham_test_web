import { MediaView } from '../../../components/MediaView';
import { BUSINESS } from '../../../config/business';
import { AUDIO_LABELS, MODE_LABELS, MOOD_LABELS, OCCASION_LABELS, RECIPIENT_LABELS, SERVICE_LABELS } from '../../../domain/labels';
import { countMedia } from '../../../domain/media';
import { templateFor } from '../../../domain/templates';
import type { StepId } from '../../../domain/wizard';
import { printTargetLabel } from '../printTarget';
import { StepHeading, type StepProps } from './shared';

export function ReviewStep({ api, goTo }: StepProps) {
  const { draft, update } = api;
  const b = draft.brief;
  const { images, videos } = countMedia(draft.media);
  const tpl = templateFor(draft.mode, draft.mood);
  const studio = draft.serviceType === 'studio';

  const sections: { step: StepId; title: string; rows: [string, string][] }[] = [
    { step: 'service', title: 'Cách thực hiện', rows: [['Dịch vụ', draft.serviceType ? SERVICE_LABELS[draft.serviceType] : '']] },
    {
      step: 'brief',
      title: 'Lời nhắn',
      rows: [
        ['Tặng', b.recipient ? (b.recipient === 'other' ? b.recipientOther : RECIPIENT_LABELS[b.recipient]) : ''],
        ['Dịp', b.occasion ? (b.occasion === 'other' ? b.occasionOther : OCCASION_LABELS[b.occasion]) : ''],
        ...(studio ? [['Cảm giác', b.feeling ? (b.feeling === 'unknown' ? 'Chưa biết' : MOOD_LABELS[b.feeling]) : ''] as [string, string]] : []),
        ['Người tặng', b.senderName || 'Không ghi'],
        ['Người nhận', b.recipientName || 'Không ghi'],
        ['Lời nhắn', b.message || 'Không có'],
        ['Ghi chú', b.notes || 'Không có'],
      ],
    },
    { step: 'media', title: 'Ảnh & video', rows: [['Đã gửi', `${images} ảnh, ${videos} video`]] },
    { step: 'target', title: 'Ảnh in', rows: [['Ảnh in', printTargetLabel(draft)]] },
    { step: 'mode', title: 'Trải nghiệm', rows: [['Loại', draft.mode ? `${draft.mode}. ${MODE_LABELS[draft.mode]}` : '']] },
    ...(studio
      ? [
          { step: 'style' as StepId, title: 'Phong cách', rows: [['Template', tpl ? `${tpl.name} (${MOOD_LABELS[tpl.mood]}, ${tpl.durationLabel})` : '']] as [string, string][] },
          { step: 'audio' as StepId, title: 'Âm thanh', rows: [['Âm thanh', draft.audio ? AUDIO_LABELS[draft.audio] : '']] as [string, string][] },
        ]
      : [{ step: 'check' as StepId, title: 'Video hoàn chỉnh', rows: [['Quyền nội dung', draft.rightsConfirmed ? 'Đã xác nhận' : 'Chưa xác nhận']] as [string, string][] }]),
    { step: 'frame', title: 'Khung', rows: [['Khung', `Dọc ${BUSINESS.frame.label}, không kính`]] },
  ];

  return (
    <>
      <StepHeading title="Xem lại yêu cầu" lead="Kiểm tra lần cuối trước khi gửi. Chạm sẽ liên hệ để gửi bản nháp cho bạn duyệt." />
      <div className="grid gap-6 lg:grid-cols-[1fr_200px]">
        <div className="divide-y divide-line rounded-2xl border border-line bg-white">
          {sections.map((s) => (
            <section key={s.step} className="px-5 py-4" aria-label={s.title}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold">{s.title}</h2>
                <button type="button" onClick={() => goTo(s.step)} className="min-h-[44px] px-2 text-[15px] font-semibold text-lavender-ink underline-offset-4 hover:underline" aria-label={`Sửa phần ${s.title}`}>
                  Sửa
                </button>
              </div>
              <dl className="mt-1 space-y-1 text-[15px]">
                {s.rows.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[110px_1fr] gap-3">
                    <dt className="text-muted">{k}</dt>
                    <dd className="break-words">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
        <div className="order-first mx-auto w-full max-w-[200px] lg:order-none">
          <div className="overflow-hidden rounded-[3px] ring-8 ring-[#C8A77A]">
            <MediaView item={draft.printTarget.type === 'media' ? draft.media.find((m) => draft.printTarget.type === 'media' && m.id === draft.printTarget.mediaId) : draft.media.find((m) => m.kind === 'video')} className="aspect-[3/4]" mood={draft.mood} />
          </div>
        </div>
      </div>

      <section className="mt-8" aria-labelledby="contact-heading">
        <h2 id="contact-heading" className="text-lg font-semibold">Thông tin liên hệ</h2>
        <p className="help">Chạm dùng để gửi bản nháp và cập nhật đơn. Bản thử nghiệm không gửi email/SMS thật.</p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-name" className="field-label">Tên của bạn</label>
            <input id="contact-name" className="field-input mt-2" autoComplete="name" value={draft.contact.name} maxLength={60} onChange={(e) => update((d) => ({ ...d, contact: { ...d.contact, name: e.target.value } }))} />
          </div>
          <div>
            <label htmlFor="contact-reach" className="field-label">Số điện thoại hoặc email</label>
            <input id="contact-reach" className="field-input mt-2" autoComplete="email" inputMode="email" value={draft.contact.reach} maxLength={80} onChange={(e) => update((d) => ({ ...d, contact: { ...d.contact, reach: e.target.value } }))} />
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl bg-sky px-5 py-4" aria-labelledby="next-heading">
        <h2 id="next-heading" className="text-base font-semibold">Sau khi gửi</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-[15px]">
          <li>Chạm kiểm tra file{draft.printTarget.type === 'extract_frame' ? ' và gửi 3 frame để bạn chọn ảnh in' : ''}.</li>
          <li>{studio ? 'Chạm dựng video và gửi bản nháp.' : 'Chạm liên kết AR và gửi bản xem trước.'}</li>
          <li>Bạn duyệt hoặc yêu cầu chỉnh (tối đa {BUSINESS.maxRevisions} vòng).</li>
          <li>Chạm in, liên kết AR, kiểm tra và đóng gói trong {BUSINESS.serviceTimeAfterApproval.label}.</li>
        </ol>
      </section>
    </>
  );
}
