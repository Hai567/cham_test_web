import { Check, Circle, ExternalLink, PauseCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MediaView } from '../../components/MediaView';
import { Badge, Notice } from '../../components/ui';
import { BUSINESS } from '../../config/business';
import { STATUS_LABELS_VI } from '../../domain/labels';
import { frameSecond } from '../../domain/media';
import type { ARLink, Order, OrderStatus } from '../../domain/types';
import { milestoneOf, milestonesFor, targetItemOf } from './orderView';



export function OrderTimeline({ order }: { order: Order }) {
  const steps = milestonesFor(order);
  const current = steps.indexOf(milestoneOf(order));
  const done = order.status === 'completed';
  return (
    <div>
      {order.status === 'blocked' && (
        <Notice tone="warning" title="Đơn đang tạm dừng" className="mb-4">
          Chạm sẽ liên hệ bạn để xử lý. Đơn tiếp tục từ bước: {STATUS_LABELS_VI[order.blockedFrom ?? 'reviewing_assets']}.
        </Notice>
      )}
      <ol className="space-y-0">
        {steps.map((s, i) => {
          const state = done || i < current ? 'done' : i === current ? 'current' : 'todo';
          return (
            <li key={s} className="relative flex gap-3 pb-4 last:pb-0">
              {i < steps.length - 1 && <span aria-hidden className={`absolute left-[11px] top-6 h-full w-0.5 ${state === 'done' ? 'bg-navy' : 'bg-line'}`} />}
              <span
                aria-hidden
                className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  state === 'done' ? 'bg-navy text-white' : state === 'current' ? 'border-2 border-coral bg-white text-coral' : 'border-2 border-line bg-white text-line'
                }`}
              >
                {state === 'done' ? <Check className="h-3.5 w-3.5" /> : order.status === 'blocked' && state === 'current' ? <PauseCircle className="h-3.5 w-3.5" /> : <Circle className="h-2 w-2 fill-current" />}
              </span>
              <span className={`text-[15px] ${state === 'current' ? 'font-semibold text-navy' : state === 'done' ? 'text-ink' : 'text-muted'}`}>
                {STATUS_LABELS_VI[s]}
                <span className="sr-only">{state === 'done' ? ' (đã xong)' : state === 'current' ? ' (hiện tại)' : ' (chưa tới)'}</span>
                {state === 'current' && order.status === 'revision_requested' && (
                  <span className="block text-sm font-normal text-muted">Đang chỉnh theo yêu cầu vòng {order.revisionsUsed}/{BUSINESS.maxRevisions}</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const tone = status === 'completed' ? 'mint' : status === 'blocked' ? 'danger' : status === 'awaiting_customer_approval' || status === 'revision_requested' ? 'coral' : 'sky';
  return <Badge tone={tone}>{STATUS_LABELS_VI[status]}</Badge>;
}




export function FactList({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y divide-line text-[15px]">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 py-2">
          <dt className="shrink-0 text-muted">{k}</dt>
          <dd className="min-w-0 break-words text-right font-medium text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** 3 frame đề xuất: lấy ở 20% / 50% / 80% video. Trong MVP Chạm chọn thủ công, app chỉ mô phỏng. */
export function FrameChoices({ order, value, onChoose, disabled }: { order: Order; value: number | null; onChoose?: (n: number) => void; disabled?: boolean }) {
  const video = targetItemOf(order);
  return (
    <fieldset>
      <legend className="sr-only">Chọn frame dùng làm ảnh in</legend>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((n) => (
          <label key={n} className={`block ${onChoose && !disabled ? 'cursor-pointer' : ''}`}>
            <input
              type="radio"
              name={`frame-${order.id}`}
              className="peer sr-only"
              checked={value === n}
              disabled={!onChoose || disabled}
              onChange={() => onChoose?.(n)}
            />
            <span className="block overflow-hidden rounded-lg border-2 border-line peer-checked:border-navy peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lavender">
              <MediaView item={video} atSecond={frameSecond(video, n)} mood={order.mood} className="aspect-[3/4]" />
            </span>
            <span className="mt-1 flex min-h-[28px] items-center justify-center gap-1 text-sm font-semibold text-navy">
              {value === n && <Check aria-hidden className="h-4 w-4" />} Frame {n}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ArLinkCard({ ar }: { ar: ARLink }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 sm:flex-row sm:items-center">
      <img src={ar.qrDataUrl} alt="Mã QR mở trải nghiệm AR (bản mô phỏng)" className="h-32 w-32 shrink-0 rounded-lg border border-line" />
      <div className="min-w-0 space-y-2">
        <Badge tone="lavender">Bản mô phỏng AR</Badge>
        <p className="text-[15px] text-ink">QR này được in ở mặt sau khung. Người nhận quét bằng camera điện thoại, không cần cài app.</p>
        <p className="break-all text-sm text-muted">{ar.launchUrl}</p>
        <Link to={`/ar/${encodeURIComponent(ar.experienceId)}`} className="inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-navy underline-offset-4 hover:underline">
          <ExternalLink aria-hidden className="h-4 w-4" /> Mở trang người nhận
        </Link>
      </div>
    </div>
  );
}

