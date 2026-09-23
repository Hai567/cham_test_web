import { describe, expect, it } from 'vitest';
import { checkModeA, checkModeB, checkModeC, evaluateModes, toEligibilityInput } from './experienceRules';
import { media } from '../test/factories';

const input = (o: Partial<Parameters<typeof checkModeA>[0]> = {}) => ({
  imageCount: 0, videoCount: 0, hasPrintImage: false, frameExtractionRequested: false, ...o,
});

describe('Mode A: Ảnh sống lại', () => {
  it('đủ điều kiện khi có 1 video và ảnh in', () => {
    expect(checkModeA(input({ imageCount: 1, videoCount: 1, hasPrintImage: true })).eligible).toBe(true);
  });
  it('đủ điều kiện khi chỉ có video nhưng yêu cầu trích frame', () => {
    expect(checkModeA(input({ videoCount: 1, frameExtractionRequested: true })).eligible).toBe(true);
  });
  it('không đủ khi không có video, nêu rõ lý do', () => {
    const r = checkModeA(input({ imageCount: 3, hasPrintImage: true }));
    expect(r.eligible).toBe(false);
    expect(r.reasons).toContain('Cần thêm ít nhất 1 video của khoảnh khắc được in.');
  });
  it('không đủ khi có video nhưng chưa chọn ảnh in, gợi ý trích frame', () => {
    const r = checkModeA(input({ videoCount: 1 }));
    expect(r.eligible).toBe(false);
    expect(r.reasons).toContain('Hãy chọn ảnh dùng để in.');
    expect(r.hints).toContain('Bạn có thể yêu cầu Chạm trích frame từ video.');
  });
});

describe('Mode B: Kể lại một kỷ niệm', () => {
  it('đủ điều kiện với ảnh in và 2 media', () => {
    expect(checkModeB(input({ imageCount: 2, hasPrintImage: true })).eligible).toBe(true);
  });
  it('không đủ khi chỉ có một ảnh', () => {
    const r = checkModeB(input({ imageCount: 1, hasPrintImage: true }));
    expect(r.eligible).toBe(false);
    expect(r.reasons[0]).toMatch(/ít nhất 2/);
  });
  it('không đủ khi chưa có ảnh in', () => {
    expect(checkModeB(input({ imageCount: 4 })).eligible).toBe(false);
  });
});

describe('Mode C: Sống lại rồi mở rộng', () => {
  it('đủ điều kiện với 1 video, ảnh in và tổng 3 media', () => {
    expect(checkModeC(input({ imageCount: 2, videoCount: 1, hasPrintImage: true })).eligible).toBe(true);
  });
  it('không đủ với chỉ 2 media dù Mode A đủ', () => {
    const i = input({ imageCount: 1, videoCount: 1, hasPrintImage: true });
    expect(checkModeA(i).eligible).toBe(true);
    const r = checkModeC(i);
    expect(r.eligible).toBe(false);
    expect(r.reasons.join(' ')).toMatch(/ít nhất 3/);
  });
  it('không đủ khi không có video dù nhiều ảnh', () => {
    expect(checkModeC(input({ imageCount: 5, hasPrintImage: true })).eligible).toBe(false);
  });
});

describe('toEligibilityInput', () => {
  it('ảnh in bị xóa khỏi media thì không còn được tính', () => {
    const vid = media('video');
    const i = toEligibilityInput([vid], { type: 'media', mediaId: 'gone' });
    expect(i.hasPrintImage).toBe(false);
    expect(evaluateModes(i).A.eligible).toBe(false);
  });
  it('video không được dùng làm ảnh in', () => {
    const vid = media('video');
    expect(toEligibilityInput([vid], { type: 'media', mediaId: vid.id }).hasPrintImage).toBe(false);
  });
});
