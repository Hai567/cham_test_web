import { createEmptyDraft } from '../domain/draft';
import type { Draft, MediaItem } from '../domain/types';

let n = 0;
export function media(kind: MediaItem['kind'], extra: Partial<MediaItem> = {}): MediaItem {
  n += 1;
  return {
    id: `${kind}-${n}`,
    kind,
    name: kind === 'image' ? `a${n}.jpg` : `v${n}.mp4`,
    size: 1000,
    mimeType: kind === 'image' ? 'image/jpeg' : 'video/mp4',
    addedAt: '2026-09-20T00:00:00.000Z',
    source: 'upload',
    ...extra,
  };
}

/** Draft golden path Mode A hợp lệ đến bước review. */
export function goldenDraft(): Draft {
  const img = media('image');
  const vid = media('video');
  const d = createEmptyDraft();
  return {
    ...d,
    serviceType: 'studio',
    brief: { ...d.brief, recipient: 'partner', occasion: 'anniversary', feeling: 'warm' },
    media: [img, vid],
    printTarget: { type: 'media', mediaId: img.id },
    mode: 'A',
    mood: 'warm',
    audio: 'licensed_music',
    frameConfirmed: true,
    contact: { name: 'Khách', reach: '0912345678' },
  };
}
