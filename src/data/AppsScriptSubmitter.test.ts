import { describe, expect, it, vi } from 'vitest';
import { createGoldenPathDraft } from './seed';
import { createOrderFromDraft } from '../domain/orderState';
import type { Order, MediaItem } from '../domain/types';
import { AppsScriptSubmitter, MAX_UPLOAD_BYTES } from './AppsScriptSubmitter';

function makeOrder(extra: MediaItem[] = []): Order {
  const d = createGoldenPathDraft();
  const img = d.media.find((m) => m.kind === 'image')!;
  const draft = { ...d, printTarget: { type: 'media' as const, mediaId: img.id }, mode: 'A' as const, mood: 'warm' as const, audio: 'licensed_music' as const, frameConfirmed: true, contact: { name: 'Linh', reach: '0912345678' } };
  const r = createOrderFromDraft(draft, 'CHAM-2609-AB12', '2026-09-23T10:00:00.000Z');
  if (!r.ok) throw new Error(r.error);
  return { ...r.order, media: [...r.order.media.map((m) => ({ ...m, size: 2048, source: 'upload' as const })), ...extra] };
}

function okFetch(log: { action: string; name?: string; key?: string }[]) {
  return vi.fn(async (_url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body));
    log.push({ action: body.action, name: body.name, key: body.key });
    const payload = body.action === 'order' ? { ok: true, folderId: 'F1' } : { ok: true };
    return new Response(JSON.stringify(payload), { status: 200 });
  });
}

describe('AppsScriptSubmitter', () => {
  it('gửi đơn, từng file theo thứ tự, rồi báo xong', async () => {
    const log: { action: string; name?: string; key?: string }[] = [];
    const sub = new AppsScriptSubmitter('https://example.test/exec', { fetchImpl: okFetch(log) as unknown as typeof fetch, key: 'k1' });
    const order = makeOrder();
    const progress: string[] = [];
    const res = await sub.submit(order, async () => new Blob(['abc'], { type: 'image/jpeg' }), (p) => progress.push(p.phase));
    expect(res).toEqual({ mode: 'remote', skipped: [] });
    expect(log.map((l) => l.action)).toEqual(['order', ...order.media.map(() => 'file'), 'finish']);
    expect(log[1]?.name).toMatch(/^01-/);
    expect(log.every((l) => l.key === 'k1')).toBe(true);
    expect(progress[0]).toBe('order');
    expect(progress[progress.length - 1]).toBe('finish');
  });

  it('bỏ qua file quá lớn và file không còn trên máy, vẫn hoàn tất đơn', async () => {
    const big: MediaItem = { id: 'big', kind: 'video', name: 'dai.mov', size: MAX_UPLOAD_BYTES + 1, mimeType: 'video/quicktime', addedAt: '', source: 'upload' };
    const log: { action: string; name?: string }[] = [];
    const sub = new AppsScriptSubmitter('https://example.test/exec', { fetchImpl: okFetch(log) as unknown as typeof fetch });
    const order = makeOrder([big]);
    const firstId = order.media[0]!.id;
    const res = await sub.submit(order, async (id) => (id === firstId ? null : new Blob(['x'])));
    expect(res.skipped.map((s) => s.name)).toEqual([order.media[0]!.name, 'dai.mov']);
    expect(log.filter((l) => l.action === 'file').length).toBe(order.media.length - 2);
    expect(log[log.length - 1]?.action).toBe('finish');
  });

  it('thử lại khi mạng lỗi, rồi báo lỗi rõ ràng nếu vẫn không được', async () => {
    let calls = 0;
    const flaky = vi.fn(async () => {
      calls++;
      if (calls === 1) throw new TypeError('network');
      return new Response(JSON.stringify({ ok: true, folderId: 'F1' }), { status: 200 });
    });
    const sub = new AppsScriptSubmitter('https://example.test/exec', { fetchImpl: flaky as unknown as typeof fetch, retryDelayMs: 0 });
    await expect(sub.submit(makeOrder(), async () => new Blob(['x']))).resolves.toMatchObject({ mode: 'remote' });

    const down = vi.fn(async () => new Response(JSON.stringify({ ok: false, error: 'Mã đơn không hợp lệ.' }), { status: 200 }));
    const sub2 = new AppsScriptSubmitter('https://example.test/exec', { fetchImpl: down as unknown as typeof fetch, retryDelayMs: 0 });
    await expect(sub2.submit(makeOrder(), async () => null)).rejects.toThrow('Mã đơn không hợp lệ.');
    expect(down).toHaveBeenCalledTimes(3);
  });
});

describe('mã đơn', () => {
  it('đúng định dạng, 6 ký tự ngẫu nhiên, không trùng trong 5.000 lần tạo', async () => {
    const { orderCode } = await import('../lib/ids');
    const seen = new Set<string>();
    for (let i = 0; i < 5000; i++) {
      const c = orderCode(new Date(2026, 8, 23));
      expect(c).toMatch(/^CHAM-2609-[A-HJ-NP-Z2-9]{6}$/);
      seen.add(c);
    }
    expect(seen.size).toBe(5000);
  });

  it('máy chủ báo trùng mã thì dừng ngay, không thử lại, không gửi file', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ ok: false, code: 'DUPLICATE', error: 'Mã đơn bị trùng.' }), { status: 200 }));
    const sub = new AppsScriptSubmitter('https://example.test/exec', { fetchImpl: f as unknown as typeof fetch, retryDelayMs: 0 });
    await expect(sub.submit(makeOrder(), async () => new Blob(['x']))).rejects.toMatchObject({ code: 'DUPLICATE' });
    expect(f).toHaveBeenCalledTimes(1);
  });
});
