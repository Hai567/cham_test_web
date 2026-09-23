import { describe, expect, it } from 'vitest';
import { MockARAdapter } from './MockARAdapter';

describe('MockARAdapter', () => {
  it('tạo experience ổn định, link nội bộ và QR', async () => {
    const ar = new MockARAdapter({ delayMs: 0, shouldFail: () => false });
    const exp = await ar.createExperience({ orderId: 'CHAM-1', mode: 'A', targetMediaId: 'i', videoMediaIds: ['v'] });
    expect(exp.experienceId).toBe('mock-cham-1');
    expect(await ar.getStatus(exp.experienceId)).toBe('ready');
    const link = await ar.generateLaunchLink(exp.experienceId);
    expect(link).toContain('/ar/mock-cham-1');
    expect(await ar.generateQrCode(link)).toMatch(/^data:image\/png;base64,/);
  });
  it('báo lỗi rõ ràng khi adapter lỗi', async () => {
    const ar = new MockARAdapter({ delayMs: 0, shouldFail: () => true });
    await expect(ar.validateTarget({ mediaId: 'x', kind: 'uploaded_image' })).rejects.toThrow(/AR adapter/);
  });
  it('cảnh báo ảnh ngang và độ phân giải thấp', async () => {
    const ar = new MockARAdapter({ delayMs: 0, shouldFail: () => false });
    const r = await ar.validateTarget({ mediaId: 'x', kind: 'uploaded_image', width: 1200, height: 800 });
    expect(r.ok).toBe(true);
    expect(r.warnings.join(' ')).toMatch(/nằm ngang/);
    expect(r.warnings.join(' ')).toMatch(/chuẩn in/);
  });
});
