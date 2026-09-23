import { describe, expect, it } from 'vitest';
import { coverFovDeg, coverUv, smoothingAlpha, trackingSize } from './arMath';
import { buildCatalog, findMemory, normalizeCode } from './catalog';

describe('mã kỷ niệm', () => {
  it('chuẩn hóa mã người dùng gõ', () => {
    expect(normalizeCode(' demo-01 ')).toBe('DEMO01');
    expect(normalizeCode('ab.c 12')).toBe('ABC12');
  });

  it('dựng danh sách từ thư mục, ưu tiên MP4 và bỏ thư mục thiếu file', () => {
    const catalog = buildCatalog(
      {
        '/src/assets/memories/Me-01/photo.jpg': '/a/photo.jpg',
        '/src/assets/memories/Me-01/video.webm': '/a/video.webm',
        '/src/assets/memories/Me-01/video.mp4': '/a/video.mp4',
        '/src/assets/memories/Me-01/target.mind': '/a/target.mind',
        '/src/assets/memories/ONLYPHOTO/photo.png': '/b/photo.png',
      },
      { '/src/assets/memories/Me-01/meta.json': { title: ' Mẹ ', message: '' } },
    );
    expect([...catalog.keys()]).toEqual(['ME01']);
    expect(catalog.get('ME01')).toEqual({
      code: 'ME01',
      photoUrl: '/a/photo.jpg',
      videoUrl: '/a/video.mp4',
      targetUrl: '/a/target.mind',
      title: 'Mẹ',
      message: null,
    });
  });

  it('có sẵn mã mẫu DEMO01', () => {
    const demo = findMemory('demo01');
    expect(demo?.photoUrl).toBeTruthy();
    expect(demo?.videoUrl).toBeTruthy();
    expect(demo?.targetUrl).toBeTruthy();
  });
});

describe('toán AR', () => {
  it('giữ cạnh ngắn 480 cho bộ nhận diện, không phóng to', () => {
    expect(trackingSize(720, 1280)).toEqual({ w: 480, h: 853 });
    expect(trackingSize(1280, 960)).toEqual({ w: 640, h: 480 });
    expect(trackingSize(320, 240)).toEqual({ w: 320, h: 240 });
  });

  it('góc nhìn bằng 45 độ khi màn hình khớp đúng khung video', () => {
    expect(coverFovDeg(720, 1280, 720, 1280)).toBeCloseTo(45, 6);
  });

  it('màn hình dài hơn video: video bị cắt hai bên, góc nhìn dọc giữ nguyên', () => {
    expect(coverFovDeg(390, 844, 720, 1280)).toBeCloseTo(45, 6);
  });

  it('màn hình ngắn hơn video: phần trên dưới bị cắt nên góc nhìn hẹp lại', () => {
    expect(coverFovDeg(720, 1000, 720, 1280)).toBeLessThan(45);
  });

  it('cắt video vừa khung ảnh', () => {
    expect(coverUv(16 / 9, 3 / 4)).toMatchObject({ repeatY: 1, offsetY: 0 });
    const tall = coverUv(9 / 16, 3 / 4);
    expect(tall.repeatX).toBe(1);
    expect(tall.repeatY).toBeCloseTo(0.75, 6);
    expect(tall.offsetY).toBeCloseTo(0.125, 6);
  });

  it('làm mượt không phụ thuộc tần số khung hình', () => {
    const two30 = 1 - (1 - smoothingAlpha(1000 / 30, 30)) ** 2;
    const four60 = 1 - (1 - smoothingAlpha(1000 / 60, 30)) ** 4;
    expect(two30).toBeCloseTo(1 - (1 - smoothingAlpha(1000 / 15, 30)), 6);
    expect(four60).toBeCloseTo(two30, 6);
  });
});
