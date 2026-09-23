/**
 * Smoke test golden path (Mode A) qua đúng các lớp thật: domain, repository, AR adapter mock.
 * Mô phỏng thứ tự thao tác trong buổi trình bày: khách đặt, vận hành xử lý, khách duyệt, AR, QC.
 */
import { describe, expect, it } from 'vitest';
import { MockARAdapter } from '../ar/MockARAdapter';
import { LocalOrderRepository } from '../data/LocalOrderRepository';
import { createGoldenPathDraft } from '../data/seed';
import { evaluateModes, toEligibilityInput } from '../domain/experienceRules';
import { frameSecond } from '../domain/media';
import { approvePreview, createOrderFromDraft, isVideoLocked, markQc, requestRevision, sendPreview, transition, type Result } from '../domain/orderState';
import { firstInvalidStep } from '../domain/wizard';
import type { Order } from '../domain/types';

function ok(r: Result): Order {
  if (!r.ok) throw new Error(r.error);
  return r.order;
}

describe('golden path Mode A', () => {
  it('đi hết từ đặt đơn tới hoàn thành, có AR mock và QR', async () => {
    const repo = new LocalOrderRepository();
    const ar = new MockARAdapter({ delayMs: 0, shouldFail: () => false });

    // Khách: bản nháp mẫu đã có 1 ảnh + 1 video cùng khoảnh khắc.
    let draft = createGoldenPathDraft();
    const img = draft.media.find((m) => m.kind === 'image')!;
    draft = { ...draft, printTarget: { type: 'media', mediaId: img.id } };
    const modes = evaluateModes(toEligibilityInput(draft.media, draft.printTarget));
    expect(modes.A.eligible).toBe(true);

    draft = { ...draft, mode: 'A', mood: 'warm', audio: 'licensed_music', frameConfirmed: true, contact: { name: 'Khách mẫu', reach: '0900000000' } };
    expect(firstInvalidStep(draft)).toBeNull();

    let t = 0;
    const now = () => new Date(Date.UTC(2026, 8, 24, 9, t++)).toISOString();
    let order = ok(createOrderFromDraft(draft, 'CHAM-TEST-0001', now()));
    await repo.save(order);
    expect((await repo.get(order.id))?.status).toBe('reviewing_assets');

    // Vận hành: dựng, gửi preview; khách xin sửa 1 vòng rồi duyệt.
    order = ok(transition(order, 'editing', now()));
    order = ok(sendPreview(order, now()));
    order = ok(requestRevision(order, 'Cho lời nhắn hiện chậm hơn', now()));
    order = ok(transition(order, 'editing', now()));
    order = ok(sendPreview(order, now()));
    expect(order.previewVersion).toBe(2);
    order = ok(approvePreview(order, now()));
    expect(isVideoLocked(order)).toBe(true);

    // Sản xuất: in, liên kết AR qua adapter, QC, đóng gói, giao.
    order = ok(transition(order, 'printing', now()));
    order = ok(transition(order, 'ar_linking', now()));
    expect(transition(order, 'quality_control', now()).ok).toBe(false);
    const exp = await ar.createExperience({ orderId: order.id, mode: order.mode, targetMediaId: img.id, videoMediaIds: [draft.media[1]!.id] });
    const launchUrl = await ar.generateLaunchLink(exp.experienceId);
    const qr = await ar.generateQrCode(launchUrl);
    expect(qr.startsWith('data:image/png')).toBe(true);
    order = { ...order, ar: { experienceId: exp.experienceId, launchUrl, qrDataUrl: qr, linkedAt: now() } };
    order = ok(transition(order, 'quality_control', now()));
    expect(transition(order, 'packing', now()).ok).toBe(false);
    order = ok(markQc(order, true, '', now()));
    order = ok(transition(order, 'packing', now()));
    order = ok(transition(order, 'shipping', now()));
    order = ok(transition(order, 'completed', now()));
    await repo.save(order);

    const saved = await repo.get(order.id);
    expect(saved?.status).toBe('completed');
    expect(saved?.revisionsUsed).toBe(1);
    expect(await ar.getStatus(exp.experienceId)).toBe('ready');
  });

  it('frame 1/2/3 lấy ở 20/50/80% thời lượng video', () => {
    expect(frameSecond({ durationSec: 10 }, 1)).toBe(2);
    expect(frameSecond({ durationSec: 10 }, 2)).toBe(5);
    expect(frameSecond({ durationSec: 10 }, 3)).toBe(8);
    expect(frameSecond(null, 1)).toBeCloseTo(0.6);
  });
});
