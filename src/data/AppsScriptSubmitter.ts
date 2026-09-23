import { AUDIO_LABELS, MODE_LABELS, MOOD_LABELS, OCCASION_LABELS, RECIPIENT_LABELS, SERVICE_LABELS } from '../domain/labels';
import type { Order } from '../domain/types';
import { SubmitError, type BlobGetter, type OrderSubmitter, type SkippedFile, type SubmitProgress, type SubmitResult } from './OrderSubmitter';

/**
 * Gửi đơn về Google Apps Script (xem backend/apps-script/Code.gs):
 * 1. "order": ghi một dòng vào Google Sheet, tạo thư mục Drive riêng cho đơn.
 * 2. "file": gửi từng ảnh, video vào thư mục đó (mỗi file một lần gửi).
 * 3. "finish": báo xong, script gửi email cho team.
 * Mỗi bước gửi lại được an toàn: script bỏ qua đơn hoặc file đã có.
 */

/** Apps Script nhận tối đa khoảng 50MB mỗi lần gửi; base64 làm file to thêm 1/3, nên giới hạn file gốc ở 30MB. */
export const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;
const TIMEOUT_MS = 180_000;
const RETRIES = 2;

type Fetch = typeof fetch;

export class AppsScriptSubmitter implements OrderSubmitter {
  readonly mode = 'remote' as const;
  constructor(
    private readonly endpoint: string,
    private readonly opts: { fetchImpl?: Fetch; retryDelayMs?: number; key?: string } = {},
  ) {}

  async submit(order: Order, getBlob: BlobGetter, onProgress?: (p: SubmitProgress) => void): Promise<SubmitResult> {
    onProgress?.({ phase: 'order' });
    const created = await this.call<{ folderId: string }>({ action: 'order', order: summarize(order) });

    const uploads = order.media.filter((m) => m.source === 'upload');
    const skipped: SkippedFile[] = [];
    for (let i = 0; i < uploads.length; i++) {
      const m = uploads[i]!;
      const name = `${String(i + 1).padStart(2, '0')}-${safeName(m.name)}`;
      onProgress?.({ phase: 'file', index: i + 1, total: uploads.length, name: m.name });
      if (m.size > MAX_UPLOAD_BYTES) {
        skipped.push({ name: m.name, reason: 'quá lớn để gửi qua web' });
        continue;
      }
      const blob = await getBlob(m.id);
      if (!blob) {
        skipped.push({ name: m.name, reason: 'không còn trên máy' });
        continue;
      }
      await this.call({ action: 'file', orderId: order.id, folderId: created.folderId, name, mimeType: m.mimeType || blob.type, data: await toBase64(blob) });
    }

    onProgress?.({ phase: 'finish' });
    await this.call({ action: 'finish', orderId: order.id, folderId: created.folderId, contactName: order.contact.name, skipped });
    return { mode: 'remote', skipped };
  }

  /** Gửi một yêu cầu, thử lại khi lỗi mạng. text/plain để trình duyệt không phải hỏi CORS trước. */
  private async call<T = unknown>(body: unknown): Promise<T> {
    const doFetch = this.opts.fetchImpl ?? fetch.bind(globalThis);
    let lastError = 'Không kết nối được tới Chạm.';
    for (let attempt = 0; attempt <= RETRIES; attempt++) {
      if (attempt > 0) await wait(this.opts.retryDelayMs ?? 1500 * attempt);
      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = ctrl ? setTimeout(() => ctrl.abort(), TIMEOUT_MS) : null;
      try {
        const res = await doFetch(this.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(this.opts.key ? { ...(body as object), key: this.opts.key } : body),
          signal: ctrl?.signal,
        });
        if (!res.ok) {
          lastError = `Máy chủ trả lỗi ${res.status}.`;
          continue;
        }
        const data = (await res.json()) as { ok?: boolean; error?: string; code?: string } & T;
        if (data.code === 'DUPLICATE') throw new SubmitError(data.error || 'Mã đơn bị trùng.', 'DUPLICATE');
        if (!data.ok) {
          lastError = data.error || 'Máy chủ từ chối yêu cầu.';
          continue;
        }
        return data;
      } catch (err) {
        if (err instanceof SubmitError) throw err;
        lastError = 'Mạng chập chờn hoặc gửi quá lâu.';
      } finally {
        if (timer) clearTimeout(timer);
      }
    }
    throw new SubmitError(lastError);
  }
}

/** Bản tóm tắt dễ đọc cho Google Sheet (tiếng Việt, không chứa dữ liệu file). */
export function summarize(o: Order) {
  const b = o.brief;
  const target =
    o.printTarget.type === 'media'
      ? (o.media.find((m) => o.printTarget.type === 'media' && m.id === o.printTarget.mediaId)?.name ?? '')
      : o.printTarget.type === 'extract_frame'
        ? 'Chạm trích frame từ video'
        : '';
  return {
    id: o.id,
    createdAt: o.createdAt,
    contactName: o.contact.name,
    contactReach: o.contact.reach,
    service: SERVICE_LABELS[o.serviceType],
    mode: `${o.mode}. ${MODE_LABELS[o.mode]}`,
    mood: o.mood ? MOOD_LABELS[o.mood] : '',
    audio: o.audio ? AUDIO_LABELS[o.audio] : '',
    recipient: b.recipient ? (b.recipient === 'other' ? b.recipientOther : RECIPIENT_LABELS[b.recipient]) : '',
    occasion: b.occasion ? (b.occasion === 'other' ? b.occasionOther : OCCASION_LABELS[b.occasion]) : '',
    senderName: b.senderName,
    recipientName: b.recipientName,
    message: b.message,
    notes: b.notes,
    printTarget: target,
    media: o.media.map((m) => `${m.kind === 'video' ? 'Video' : 'Ảnh'}: ${m.name} (${Math.round(m.size / 1024 / 1024 * 10) / 10}MB${m.durationSec ? `, ${Math.round(m.durationSec)}s` : ''})`).join('\n'),
    rightsConfirmed: o.rightsConfirmed ? 'Có' : '',
  };
}

function safeName(name: string): string {
  return name.normalize('NFC').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 120) || 'file';
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = () => reject(new SubmitError('Không đọc được file trên máy.'));
    r.readAsDataURL(blob);
  });
}
