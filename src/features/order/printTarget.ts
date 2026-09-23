import type { Draft } from '../../domain/types';

export function printTargetLabel(d: Pick<Draft, 'printTarget' | 'media'>): string {
  const t = d.printTarget;
  if (t.type === 'media') return d.media.find((m) => m.id === t.mediaId)?.name ?? 'Chưa chọn';
  if (t.type === 'extract_frame') return 'Chạm trích 3 frame từ video, bạn chọn 1';
  return 'Chưa chọn';
}
