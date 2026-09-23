import { Clapperboard, Film } from 'lucide-react';
import { Notice } from '../../../components/ui';
import { BUSINESS } from '../../../config/business';
import { SERVICE_LABELS } from '../../../domain/labels';
import type { ServiceType } from '../../../domain/types';
import { StepHeading, type StepProps } from './shared';

const OPTIONS: { value: ServiceType; Icon: typeof Film; body: string; points: string[] }[] = [
  {
    value: 'studio',
    Icon: Clapperboard,
    body: 'Bạn gửi ảnh, video gốc và vài dòng về món quà. Chạm dựng video thủ công và gửi bản nháp cho bạn.',
    points: ['Chọn loại trải nghiệm và phong cách', `Chỉnh sửa tối đa ${BUSINESS.maxRevisions} vòng`, 'Bạn duyệt trước khi in'],
  },
  {
    value: 'ready_video',
    Icon: Film,
    body: 'Bạn đã tự dựng video bằng CapCut hoặc công cụ khác. Chạm kiểm tra kỹ thuật, liên kết AR và gửi bản xem trước.',
    points: ['Gửi video hoàn chỉnh và ảnh để in', 'Bỏ qua bước phong cách và template', 'Bạn duyệt trước khi in'],
  },
];

export function ServiceStep({ api }: StepProps) {
  const { draft, setService } = api;
  return (
    <>
      <StepHeading title="Bạn muốn thực hiện thế nào?" lead="Chọn một cách. Bạn vẫn có thể quay lại đổi, ảnh và video đã tải lên sẽ được giữ." />
      <fieldset>
        <legend className="sr-only">Cách thực hiện</legend>
        <div className="grid gap-4 md:grid-cols-2">
          {OPTIONS.map(({ value, Icon, body, points }) => (
            <label key={value} className="option-card">
              <input type="radio" name="service" value={value} className="sr-only" checked={draft.serviceType === value} onChange={() => setService(value)} />
              <Icon aria-hidden className="h-7 w-7 text-coral-ink" />
              <span className="mt-3 block text-xl font-semibold text-navy">{SERVICE_LABELS[value]}</span>
              <span className="mt-2 block text-ink/80">{body}</span>
              <ul className="mt-3 space-y-1 text-[15px] text-ink/80">
                {points.map((p) => (
                  <li key={p} className="flex gap-2"><span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-navy" />{p}</li>
                ))}
              </ul>
            </label>
          ))}
        </div>
      </fieldset>
      <Notice className="mt-6" title="Về lựa chọn video hoàn chỉnh">
        Đây không phải trình chỉnh sửa kéo-thả. Bạn gửi video đã chỉnh sửa xong, Chạm không thay đổi nội dung video, chỉ kiểm tra kỹ thuật và liên kết với ảnh in.
      </Notice>
    </>
  );
}
