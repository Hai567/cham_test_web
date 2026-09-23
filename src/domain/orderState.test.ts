import { describe, expect, it } from 'vitest';
import { allowedNextStatuses, approvePreview, block, chooseFrame, createOrderFromDraft, markQc, requestRevision, sendFrameCandidates, sendPreview, transition, type Result } from './orderState';
import type { Order } from './types';
import { goldenDraft, media } from '../test/factories';

const NOW = '2026-09-22T10:00:00.000Z';
function unwrap(r: Result): Order {
  if (!r.ok) throw new Error(r.error);
  return r.order;
}
const newOrder = () => unwrap(createOrderFromDraft(goldenDraft(), 'CHAM-TEST', NOW));
const withAr = (o: Order): Order => ({ ...o, ar: { experienceId: 'x', launchUrl: 'u', qrDataUrl: 'q', linkedAt: NOW } });

describe('tạo đơn', () => {
  it('từ chối draft chưa hợp lệ', () => {
    expect(createOrderFromDraft({ ...goldenDraft(), mode: null }, 'X', NOW).ok).toBe(false);
  });
  it('đơn mới ở trạng thái Reviewing assets với 0/2 vòng sửa', () => {
    const o = newOrder();
    expect(o.status).toBe('reviewing_assets');
    expect(o.revisionsUsed).toBe(0);
  });
});

describe('vòng chỉnh sửa', () => {
  it('không cho vượt quá 2 vòng sửa', () => {
    let o = unwrap(transition(newOrder(), 'editing', NOW));
    for (let round = 1; round <= 2; round++) {
      o = unwrap(sendPreview(o, NOW));
      o = unwrap(requestRevision(o, `Sửa lần ${round}`, NOW));
      expect(o.revisionsUsed).toBe(round);
      o = unwrap(transition(o, 'editing', NOW));
    }
    o = unwrap(sendPreview(o, NOW));
    const third = requestRevision(o, 'Sửa lần 3', NOW);
    expect(third.ok).toBe(false);
    if (!third.ok) expect(third.error).toMatch(/hết 2 vòng/);
    expect(approvePreview(o, NOW).ok).toBe(true);
  });
  it('không cho yêu cầu sửa khi chưa có preview', () => {
    expect(requestRevision(newOrder(), 'abc', NOW).ok).toBe(false);
  });
  it('yêu cầu sửa cần nội dung', () => {
    const o = unwrap(sendPreview(unwrap(transition(newOrder(), 'editing', NOW)), NOW));
    expect(requestRevision(o, '   ', NOW).ok).toBe(false);
  });
});

describe('chuyển trạng thái', () => {
  it('golden path: editing -> preview -> duyệt -> in -> AR -> QC -> đóng gói', () => {
    let o = unwrap(transition(newOrder(), 'editing', NOW));
    o = unwrap(sendPreview(o, NOW));
    expect(o.previewVersion).toBe(1);
    o = unwrap(approvePreview(o, NOW));
    o = unwrap(transition(o, 'printing', NOW));
    o = unwrap(transition(o, 'ar_linking', NOW));
    expect(transition(o, 'quality_control', NOW).ok).toBe(false);
    o = unwrap(transition(withAr(o), 'quality_control', NOW));
    expect(transition(o, 'packing', NOW).ok).toBe(false);
    o = unwrap(markQc(o, true, '', NOW));
    o = unwrap(transition(o, 'packing', NOW));
    o = unwrap(transition(o, 'shipping', NOW));
    o = unwrap(transition(o, 'completed', NOW));
    expect(allowedNextStatuses(o)).toEqual([]);
  });
  it('không cho nhảy trạng thái sai thứ tự', () => {
    expect(transition(newOrder(), 'printing', NOW).ok).toBe(false);
  });
  it('đơn Chạm dựng không gửi preview khi chưa qua Editing', () => {
    expect(sendPreview(newOrder(), NOW).ok).toBe(false);
  });
  it('đơn video hoàn chỉnh bỏ qua Editing', () => {
    const o = { ...newOrder(), serviceType: 'ready_video' as const };
    expect(allowedNextStatuses(o)).not.toContain('editing');
    expect(sendPreview(o, NOW).ok).toBe(true);
  });
  it('QC không đạt cần lý do và cho phép in lại', () => {
    let o: Order = { ...withAr(newOrder()), status: 'quality_control' };
    expect(markQc(o, false, '', NOW).ok).toBe(false);
    o = unwrap(markQc(o, false, 'Bản in lệch màu', NOW));
    expect(allowedNextStatuses(o)).toContain('printing');
    expect(allowedNextStatuses(o)).not.toContain('packing');
  });
  it('tạm dừng và tiếp tục đúng trạng thái trước đó', () => {
    const o = unwrap(block(newOrder(), 'Thiếu file', NOW));
    expect(o.status).toBe('blocked');
    expect(allowedNextStatuses(o)).toEqual(['reviewing_assets']);
    expect(transition(o, 'editing', NOW).ok).toBe(false);
    expect(unwrap(transition(o, 'reviewing_assets', NOW)).status).toBe('reviewing_assets');
  });
  it('sau khi duyệt không thể yêu cầu sửa video', () => {
    const o = unwrap(approvePreview(unwrap(sendPreview(unwrap(transition(newOrder(), 'editing', NOW)), NOW)), NOW));
    expect(requestRevision(o, 'đổi nhạc', NOW).ok).toBe(false);
  });
});

describe('trích frame', () => {
  it('phải chọn frame trước khi gửi preview', () => {
    const vid = media('video');
    const d = { ...goldenDraft(), media: [vid], printTarget: { type: 'extract_frame' as const, videoId: vid.id } };
    let o = unwrap(transition(unwrap(createOrderFromDraft(d, 'F', NOW)), 'editing', NOW));
    expect(sendPreview(o, NOW).ok).toBe(false);
    expect(chooseFrame(o, 2, NOW).ok).toBe(false);
    o = unwrap(sendFrameCandidates(o, NOW));
    o = unwrap(chooseFrame(o, 2, NOW));
    expect(o.chosenFrame).toBe(2);
    expect(sendPreview(o, NOW).ok).toBe(true);
  });
});
