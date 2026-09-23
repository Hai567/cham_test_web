/** Hàm hiển thị đơn dùng chung cho trang khách và trang vận hành (pure, không có JSX). */
import { BUSINESS } from '../../config/business';
import { AUDIO_LABELS, MODE_LABELS, MOOD_LABELS, OCCASION_LABELS, RECIPIENT_LABELS, SERVICE_LABELS } from '../../domain/labels';
import { countMedia } from '../../domain/media';
import { templateFor } from '../../domain/templates';
import type { MediaItem, Order, OrderStatus } from '../../domain/types';

/** Mốc hiển thị cho khách. Studio có bước dựng, video hoàn chỉnh thì không. */
export function milestonesFor(order: Pick<Order, 'serviceType'>): OrderStatus[] {
  const base: OrderStatus[] = ['reviewing_assets', 'editing', 'awaiting_customer_approval', 'approved', 'printing', 'ar_linking', 'quality_control', 'packing', 'shipping', 'completed'];
  return order.serviceType === 'ready_video' ? base.filter((s) => s !== 'editing') : base;
}

/** Quy đổi trạng thái phụ về mốc gần nhất trên timeline. */
export function milestoneOf(order: Order): OrderStatus {
  const s = order.status === 'blocked' ? (order.blockedFrom ?? 'reviewing_assets') : order.status;
  if (s === 'draft' || s === 'awaiting_assets') return 'reviewing_assets';
  if (s === 'revision_requested') return order.serviceType === 'ready_video' ? 'reviewing_assets' : 'editing';
  return s;
}

export function targetItemOf(order: Pick<Order, 'printTarget' | 'media'>): MediaItem | null {
  const t = order.printTarget;
  if (t.type === 'media') return order.media.find((m) => m.id === t.mediaId) ?? null;
  if (t.type === 'extract_frame') return order.media.find((m) => m.id === t.videoId) ?? null;
  return null;
}

export function printTargetText(order: Order): string {
  const t = order.printTarget;
  if (t.type === 'media') return targetItemOf(order)?.name ?? 'Ảnh đã bị xóa';
  if (t.type === 'extract_frame') {
    if (order.chosenFrame) return `Frame ${order.chosenFrame} trích từ video`;
    return order.frameCandidatesSent ? 'Chờ khách chọn 1 trong 3 frame' : 'Chạm sẽ chọn 3 frame đủ chất lượng';
  }
  return 'Chưa chọn';
}

/** Các dòng thông tin đơn dùng chung cho khách và vận hành (không lặp logic). */
export function orderFacts(order: Order): [string, string][] {
  const { images, videos } = countMedia(order.media);
  const tpl = templateFor(order.mode, order.mood);
  const b = order.brief;
  const rows: [string, string][] = [
    ['Cách thực hiện', SERVICE_LABELS[order.serviceType]],
    ['Trải nghiệm', `${order.mode}. ${MODE_LABELS[order.mode]}`],
  ];
  if (order.serviceType === 'studio') {
    rows.push(['Cảm xúc', order.mood ? MOOD_LABELS[order.mood] : 'Chưa chọn']);
    rows.push(['Template', tpl ? `${tpl.name} (${tpl.durationLabel})` : 'Chạm chọn theo brief']);
    rows.push(['Âm thanh', order.audio ? AUDIO_LABELS[order.audio] : 'Chưa chọn']);
  } else {
    rows.push(['Quyền nội dung/âm thanh', order.rightsConfirmed ? 'Khách đã xác nhận' : 'Chưa xác nhận']);
  }
  rows.push(
    ['Ảnh in', printTargetText(order)],
    ['Media', `${images}/${BUSINESS.maxImages} ảnh, ${videos}/${BUSINESS.maxVideos} video`],
    ['Khung', `Dọc ${BUSINESS.frame.label}, không kính`],
    ['Vòng chỉnh sửa', `${order.revisionsUsed}/${BUSINESS.maxRevisions}`],
    ['Tặng', b.recipient ? (b.recipient === 'other' ? b.recipientOther || 'Khác' : RECIPIENT_LABELS[b.recipient]) : 'Chưa chọn'],
    ['Dịp', b.occasion ? (b.occasion === 'other' ? b.occasionOther || 'Khác' : OCCASION_LABELS[b.occasion]) : 'Chưa chọn'],
  );
  return rows;
}

export function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  } catch {
    return iso;
  }
}
