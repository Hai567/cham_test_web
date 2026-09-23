import { FrameMock } from '../../../components/FrameMock';
import { MediaView } from '../../../components/MediaView';
import { Checkbox, Notice } from '../../../components/ui';
import { BUSINESS, COPY } from '../../../config/business';
import { StepHeading, type StepProps } from './shared';

export function FrameStep({ api }: StepProps) {
  const { draft, update } = api;
  const t = draft.printTarget;
  const item = t.type === 'media' ? draft.media.find((m) => m.id === t.mediaId) : t.type === 'extract_frame' ? draft.media.find((m) => m.id === t.videoId) : undefined;
  const facts: [string, string][] = [
    ['Hướng khung', 'Dọc (portrait)'],
    ['Vùng ảnh in', `${BUSINESS.frame.label}, tỷ lệ ${BUSINESS.outputRatio.label}`],
    ['Kính', 'Không kính, để camera nhận ảnh không bị lóa'],
    ['Mã QR', 'Dán ở mặt sau khung'],
    ['Thời gian', BUSINESS.serviceTimeAfterApproval.label],
    ['Chỉnh sửa', `Tối đa ${BUSINESS.maxRevisions} vòng, bạn duyệt trước khi in`],
  ];
  return (
    <>
      <StepHeading title="Xác nhận khung ảnh" lead="MVP có một loại khung duy nhất." />
      <div className="grid items-start gap-8 md:grid-cols-[200px_1fr]">
        <div className="mx-auto w-full max-w-[200px]">
          <FrameMock caption><MediaView item={item} className="h-full w-full" /></FrameMock>
        </div>
        <div>
          <dl className="divide-y divide-line rounded-2xl border border-line bg-white px-5">
            {facts.map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5 py-3 sm:flex-row sm:justify-between sm:gap-6">
                <dt className="text-muted">{k}</dt>
                <dd className="font-medium sm:text-right">{v}</dd>
              </div>
            ))}
          </dl>
          <Notice className="mt-4">Sau khi khung đã được sản xuất, video không thể thay đổi. {COPY.persistence}</Notice>
          <div className="mt-4">
            <Checkbox id="frame-ok" checked={draft.frameConfirmed} onChange={(v) => update((d) => ({ ...d, frameConfirmed: v }))}>
              Tôi đã hiểu: khung dọc {BUSINESS.frame.label}, không kính, video không đổi được sau khi khung được sản xuất.
            </Checkbox>
          </div>
        </div>
      </div>
    </>
  );
}
