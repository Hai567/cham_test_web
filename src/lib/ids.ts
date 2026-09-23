export function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Mã đơn dễ đọc, tránh ký tự dễ nhầm (0/O, 1/I).
 * 6 ký tự ngẫu nhiên (khoảng 1 tỷ mã mỗi tháng) từ bộ sinh số an toàn, để hai khách gần như không thể trùng mã.
 * Máy chủ vẫn kiểm tra trùng lần nữa (xem backend/apps-script/Code.gs).
 */
export function orderCode(now = new Date()): string {
  const y = String(now.getFullYear()).slice(2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const bytes = new Uint8Array(6);
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  let suffix = '';
  for (const b of bytes) suffix += ALPHABET[b % ALPHABET.length];
  return `CHAM-${y}${m}-${suffix}`;
}

export const nowIso = () => new Date().toISOString();
