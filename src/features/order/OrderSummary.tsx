import { MediaView } from '../../components/MediaView';
import { BUSINESS } from '../../config/business';
import { AUDIO_LABELS, MODE_LABELS, OCCASION_LABELS, RECIPIENT_LABELS, SERVICE_LABELS } from '../../domain/labels';
import { countMedia } from '../../domain/media';
import { templateFor } from '../../domain/templates';
import type { Draft } from '../../domain/types';
import { printTargetLabel } from './printTarget';


/** Tóm tắt đơn luôn xem được trong wizard. */
export function OrderSummary({ draft }: { draft: Draft }) {
  const { images, videos } = countMedia(draft.media);
  const tpl = templateFor(draft.mode, draft.mood);
  const target = draft.printTarget;
  const targetItem =
    target.type === 'media' ? draft.media.find((m) => m.id === target.mediaId) : target.type === 'extract_frame' ? draft.media.find((m) => m.id === target.videoId) : undefined;
  const rows: [string, string][] = [
    ['Cách thực hiện', draft.serviceType ? SERVICE_LABELS[draft.serviceType] : 'Chưa chọn'],
    ['Người nhận', draft.brief.recipient ? (draft.brief.recipient === 'other' ? draft.brief.recipientOther || 'Khác' : RECIPIENT_LABELS[draft.brief.recipient]) : 'Chưa chọn'],
    ['Dịp', draft.brief.occasion ? (draft.brief.occasion === 'other' ? draft.brief.occasionOther || 'Khác' : OCCASION_LABELS[draft.brief.occasion]) : 'Chưa chọn'],
    ['Media', `${images}/${BUSINESS.maxImages} ảnh, ${videos}/${BUSINESS.maxVideos} video`],
    ['Ảnh in', printTargetLabel(draft)],
    ['Trải nghiệm', draft.mode ? `${draft.mode}. ${MODE_LABELS[draft.mode]}` : 'Chưa chọn'],
  ];
  if (draft.serviceType !== 'ready_video') {
    rows.push(['Template', tpl ? `${tpl.name}` : 'Chưa chọn']);
    rows.push(['Âm thanh', draft.audio ? AUDIO_LABELS[draft.audio] : 'Chưa chọn']);
  }
  rows.push(['Khung', `Dọc ${BUSINESS.frame.label}, không kính`]);

  return (
    <div>
      <div className="flex gap-4">
        <div className="w-20 shrink-0 overflow-hidden rounded-sm ring-4 ring-[#C8A77A]">
          <MediaView item={targetItem} className="aspect-[3/4]" mood={draft.mood} />
        </div>
        <p className="text-sm text-muted">Ảnh in xuất hiện ở đây sau khi bạn chọn.</p>
      </div>
      <dl className="mt-4 divide-y divide-line text-[15px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 py-2">
            <dt className="shrink-0 text-muted">{k}</dt>
            <dd className="min-w-0 break-words text-right font-medium text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
