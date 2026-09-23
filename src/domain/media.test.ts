import { describe, expect, it } from 'vitest';
import { BUSINESS } from '../config/business';
import { checkVideoSpec, classifyFile, moveWithinKind, validateIncomingFiles } from './media';
import { media } from '../test/factories';

const file = (name: string, type: string, size = 1000) => ({ name, type, size });

describe('upload validation', () => {
  it('nhận tối đa 10 ảnh, từ chối ảnh thứ 11', () => {
    const existing = Array.from({ length: 9 }, () => media('image'));
    const r = validateIncomingFiles(existing, [file('a.jpg', 'image/jpeg'), file('b.png', 'image/png')]);
    expect(r.accepted).toHaveLength(1);
    expect(r.rejected[0]?.reason).toMatch(`Đã đủ ${BUSINESS.maxImages} ảnh`);
  });
  it('nhận tối đa 2 video', () => {
    const r = validateIncomingFiles([], [file('1.mp4', 'video/mp4'), file('2.mov', 'video/quicktime'), file('3.webm', 'video/webm')]);
    expect(r.accepted).toHaveLength(2);
    expect(r.rejected).toHaveLength(1);
    expect(r.rejected[0]?.reason).toMatch('Đã đủ 2 video');
  });
  it('từ chối định dạng sai', () => {
    const r = validateIncomingFiles([], [file('a.gif', 'image/gif'), file('doc.pdf', 'application/pdf')]);
    expect(r.accepted).toHaveLength(0);
    expect(r.rejected).toHaveLength(2);
  });
  it('từ chối file quá lớn', () => {
    const r = validateIncomingFiles([], [file('big.jpg', 'image/jpeg', 16 * 1024 * 1024), file('big.mp4', 'video/mp4', 301 * 1024 * 1024)]);
    expect(r.rejected.map((x) => x.name)).toEqual(['big.jpg', 'big.mp4']);
  });
  it('nhận .mov khi trình duyệt để trống MIME', () => {
    expect(classifyFile({ name: 'clip.MOV', type: '' })).toBe('video');
  });
});

describe('đổi thứ tự', () => {
  it('đổi thứ tự trong cùng loại, giữ vị trí video', () => {
    const a = media('image'); const v = media('video'); const b = media('image');
    const next = moveWithinKind([a, v, b], b.id, -1);
    expect(next.map((m) => m.id)).toEqual([b.id, v.id, a.id]);
  });
  it('không đổi khi ở đầu danh sách', () => {
    const a = media('image'); const b = media('image');
    expect(moveWithinKind([a, b], a.id, -1).map((m) => m.id)).toEqual([a.id, b.id]);
  });
});

describe('kiểm tra video hoàn chỉnh', () => {
  it('cảnh báo video quá dài cho montage', () => {
    const checks = checkVideoSpec({ durationSec: 90, width: 1080, height: 1440, mimeType: 'video/mp4', name: 'x' }, false);
    expect(checks.find((c) => c.label === 'Thời lượng')?.ok).toBe(false);
    expect(checks.find((c) => c.label === 'Tỷ lệ khung hình')?.ok).toBe(true);
  });
});
