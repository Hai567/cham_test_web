/**
 * State machine của đơn hàng. Pure functions: nhận order, trả order mới hoặc lỗi.
 * UI khách và admin đều gọi chung các hàm này để không duplicate business rule.
 */
import { BUSINESS } from '../config/business';
import { STATUS_LABELS_VI } from './labels';
import { firstInvalidStep } from './wizard';
import type { Draft, Order, OrderEvent, OrderStatus } from './types';

export type Result = { ok: true; order: Order } | { ok: false; error: string };
type Actor = OrderEvent['actor'];

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ['awaiting_assets', 'reviewing_assets'],
  awaiting_assets: ['reviewing_assets'],
  reviewing_assets: ['editing', 'awaiting_assets', 'awaiting_customer_approval'],
  editing: ['awaiting_customer_approval'],
  awaiting_customer_approval: ['approved', 'revision_requested'],
  revision_requested: ['editing', 'awaiting_assets'],
  approved: ['printing'],
  printing: ['ar_linking'],
  ar_linking: ['quality_control'],
  quality_control: ['packing', 'printing', 'ar_linking'],
  packing: ['shipping'],
  shipping: ['completed'],
  completed: [],
  blocked: [],
};

/** Các trạng thái mà video đã bị khóa (sau khi khách duyệt, khung đi vào sản xuất). */
export const LOCKED_STATUSES: readonly OrderStatus[] = [
  'approved', 'printing', 'ar_linking', 'quality_control', 'packing', 'shipping', 'completed',
];

export function isVideoLocked(order: Pick<Order, 'status' | 'blockedFrom'>): boolean {
  const s = order.status === 'blocked' ? order.blockedFrom : order.status;
  return s != null && LOCKED_STATUSES.includes(s);
}

export function frameSelectionPending(order: Order): boolean {
  return order.printTarget.type === 'extract_frame' && order.chosenFrame == null;
}

/** Trạng thái hợp lệ tiếp theo, có xét nhánh dịch vụ và điều kiện nghiệp vụ. */
export function allowedNextStatuses(order: Order): OrderStatus[] {
  if (order.status === 'blocked') return order.blockedFrom ? [order.blockedFrom] : [];
  const base = TRANSITIONS[order.status].filter((to) => guard(order, to) === null);
  return order.status === 'completed' ? base : [...base, 'blocked'];
}

/**
 * Mọi bước kế tiếp theo sơ đồ, kèm lý do nếu đang bị chặn.
 * Dùng cho màn vận hành để giải thích vì sao một nút bị vô hiệu.
 */
export function nextStatusOptions(order: Order): { to: OrderStatus; reason: string | null }[] {
  if (order.status === 'blocked') return order.blockedFrom ? [{ to: order.blockedFrom, reason: null }] : [];
  return TRANSITIONS[order.status].map((to) => ({ to, reason: guard(order, to) }));
}

function guard(order: Order, to: OrderStatus): string | null {
  if (to === 'editing' && order.serviceType === 'ready_video') {
    return 'Đơn video hoàn chỉnh không qua bước dựng. Hãy gửi preview sau khi kiểm tra kỹ thuật.';
  }
  if (to === 'awaiting_customer_approval' && order.status === 'reviewing_assets' && order.serviceType === 'studio') {
    return 'Đơn Chạm dựng cần qua bước Editing trước khi gửi preview.';
  }
  if (to === 'awaiting_customer_approval' && frameSelectionPending(order)) {
    return 'Khách chưa chọn frame dùng để in.';
  }
  if (to === 'editing' && order.status === 'revision_requested' && order.serviceType === 'ready_video') {
    return 'Đơn video hoàn chỉnh cần khách gửi lại file.';
  }
  if (to === 'awaiting_assets' && order.status === 'revision_requested' && order.serviceType === 'studio') {
    return 'Đơn Chạm dựng chỉnh sửa trực tiếp ở bước Editing.';
  }
  if (to === 'quality_control' && !order.ar) {
    return 'Cần tạo liên kết AR trước khi chuyển sang QC.';
  }
  if (order.status === 'quality_control' && to === 'packing' && order.qc?.result !== 'pass') {
    return 'Cần đánh dấu QC đạt trước khi đóng gói.';
  }
  if (order.status === 'quality_control' && (to === 'printing' || to === 'ar_linking') && order.qc?.result !== 'fail') {
    return 'Chỉ quay lại in/liên kết AR khi QC không đạt.';
  }
  return null;
}

function withEvent(order: Order, status: OrderStatus, label: string, actor: Actor, now: string): Order {
  return {
    ...order,
    status,
    updatedAt: now,
    history: [...order.history, { at: now, status, label, actor }],
  };
}

export function transition(order: Order, to: OrderStatus, now: string, actor: Actor = 'operator'): Result {
  if (to === 'blocked') return block(order, 'Tạm dừng đơn', now);
  if (order.status === 'blocked') {
    if (to !== order.blockedFrom) return { ok: false, error: 'Đơn đang tạm dừng, chỉ có thể tiếp tục ở trạng thái trước đó.' };
    return { ok: true, order: { ...withEvent(order, to, `Tiếp tục: ${STATUS_LABELS_VI[to]}`, actor, now), blockedFrom: null } };
  }
  if (!TRANSITIONS[order.status].includes(to)) {
    return { ok: false, error: `Không thể chuyển từ "${STATUS_LABELS_VI[order.status]}" sang "${STATUS_LABELS_VI[to]}".` };
  }
  const reason = guard(order, to);
  if (reason) return { ok: false, error: reason };
  return { ok: true, order: withEvent(order, to, STATUS_LABELS_VI[to], actor, now) };
}

export function block(order: Order, reason: string, now: string): Result {
  if (order.status === 'blocked') return { ok: false, error: 'Đơn đã ở trạng thái tạm dừng.' };
  if (order.status === 'completed') return { ok: false, error: 'Đơn đã hoàn thành.' };
  return { ok: true, order: { ...withEvent(order, 'blocked', `Tạm dừng: ${reason}`, 'operator', now), blockedFrom: order.status } };
}

export function sendFrameCandidates(order: Order, now: string): Result {
  if (order.printTarget.type !== 'extract_frame') return { ok: false, error: 'Đơn này không yêu cầu trích frame.' };
  if (order.frameCandidatesSent) return { ok: false, error: 'Đã gửi 3 frame cho khách.' };
  return {
    ok: true,
    order: {
      ...order,
      frameCandidatesSent: true,
      updatedAt: now,
      history: [...order.history, { at: now, status: order.status, label: 'Đã gửi 3 frame để khách chọn', actor: 'operator' }],
    },
  };
}

export function chooseFrame(order: Order, frame: number, now: string): Result {
  if (order.printTarget.type !== 'extract_frame') return { ok: false, error: 'Đơn này không yêu cầu trích frame.' };
  if (!order.frameCandidatesSent) return { ok: false, error: 'Chạm chưa gửi frame đề xuất.' };
  if (![1, 2, 3].includes(frame)) return { ok: false, error: 'Frame không hợp lệ.' };
  if (isVideoLocked(order)) return { ok: false, error: 'Đơn đã vào sản xuất, không thể đổi ảnh in.' };
  return {
    ok: true,
    order: {
      ...order,
      chosenFrame: frame,
      updatedAt: now,
      history: [...order.history, { at: now, status: order.status, label: `Khách chọn frame ${frame} làm ảnh in`, actor: 'customer' }],
    },
  };
}

/** Mock gửi preview cho khách (không gửi email/SMS thật). */
export function sendPreview(order: Order, now: string): Result {
  const r = transition(order, 'awaiting_customer_approval', now);
  if (!r.ok) return r;
  const version = order.previewVersion + 1;
  const last = r.order.history[r.order.history.length - 1] as OrderEvent;
  return {
    ok: true,
    order: {
      ...r.order,
      previewVersion: version,
      history: [...r.order.history.slice(0, -1), { ...last, label: `Đã gửi bản preview v${version}` }],
    },
  };
}

export function remainingRevisions(order: Pick<Order, 'revisionsUsed'>): number {
  return Math.max(0, BUSINESS.maxRevisions - order.revisionsUsed);
}

export function requestRevision(order: Order, text: string, now: string, actor: Actor = 'customer'): Result {
  if (order.status !== 'awaiting_customer_approval') {
    return { ok: false, error: 'Chỉ có thể yêu cầu chỉnh sửa khi có bản preview đang chờ duyệt.' };
  }
  if (order.revisionsUsed >= BUSINESS.maxRevisions) {
    return { ok: false, error: `Đã dùng hết ${BUSINESS.maxRevisions} vòng chỉnh sửa. Bạn có thể duyệt bản hiện tại hoặc liên hệ Chạm.` };
  }
  if (!text.trim()) return { ok: false, error: 'Hãy mô tả điều bạn muốn chỉnh.' };
  const round = order.revisionsUsed + 1;
  const r = transition(order, 'revision_requested', now, actor);
  if (!r.ok) return r;
  return {
    ok: true,
    order: {
      ...r.order,
      revisionsUsed: round,
      revisions: [...order.revisions, { at: now, round, text: text.trim() }],
    },
  };
}

export function approvePreview(order: Order, now: string, actor: Actor = 'customer'): Result {
  if (order.status !== 'awaiting_customer_approval') return { ok: false, error: 'Không có bản preview nào đang chờ duyệt.' };
  return transition(order, 'approved', now, actor);
}

export function markQc(order: Order, pass: boolean, note: string, now: string): Result {
  if (order.status !== 'quality_control') return { ok: false, error: 'Đơn chưa ở bước kiểm tra chất lượng.' };
  if (!pass && !note.trim()) return { ok: false, error: 'Hãy ghi lý do QC không đạt.' };
  return {
    ok: true,
    order: {
      ...order,
      qc: { result: pass ? 'pass' : 'fail', at: now, note: note.trim() },
      updatedAt: now,
      history: [
        ...order.history,
        { at: now, status: order.status, label: pass ? 'QC đạt' : `QC không đạt: ${note.trim()}`, actor: 'operator' },
      ],
    },
  };
}

export function addNote(order: Order, text: string, id: string, now: string): Result {
  if (!text.trim()) return { ok: false, error: 'Ghi chú đang trống.' };
  return { ok: true, order: { ...order, updatedAt: now, notes: [...order.notes, { id, at: now, text: text.trim() }] } };
}

export function createOrderFromDraft(draft: Draft, id: string, now: string): Result {
  const invalid = firstInvalidStep(draft);
  if (invalid || !draft.serviceType || !draft.mode) {
    return { ok: false, error: 'Đơn chưa đủ thông tin. Hãy hoàn tất các bước còn thiếu.' };
  }
  const isReady = draft.serviceType === 'ready_video';
  const order: Order = {
    id,
    createdAt: now,
    updatedAt: now,
    status: 'reviewing_assets',
    blockedFrom: null,
    serviceType: draft.serviceType,
    brief: { ...draft.brief },
    contact: { name: draft.contact.name.trim(), reach: draft.contact.reach.trim() },
    media: draft.media.map((m) => ({ ...m })),
    printTarget: draft.printTarget,
    frameCandidatesSent: false,
    chosenFrame: null,
    mode: draft.mode,
    mood: isReady ? null : draft.mood,
    audio: isReady ? null : draft.audio,
    rightsConfirmed: isReady ? draft.rightsConfirmed : draft.audioRightsConfirmed,
    revisionsUsed: 0,
    revisions: [],
    previewVersion: 0,
    qc: null,
    ar: null,
    notes: [],
    history: [
      { at: now, status: 'draft', label: 'Khách tạo đơn', actor: 'customer' },
      { at: now, status: 'reviewing_assets', label: 'Đã nhận yêu cầu, Chạm kiểm tra file', actor: 'system' },
    ],
    isDemo: false,
  };
  return { ok: true, order };
}
