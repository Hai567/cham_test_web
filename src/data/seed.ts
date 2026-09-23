/**
 * Dữ liệu mẫu cho Presentation mode và trang Vận hành.
 * Toàn bộ tên/đơn là hư cấu, được đánh dấu isDemo và không phải dữ liệu khách thật.
 */
import type { ARAdapter } from '../ar/ARAdapter';
import { createEmptyDraft } from '../domain/draft';
import type { DemoArt, Draft, MediaItem, Mode, Mood, Order, OrderEvent, OrderStatus, ServiceType } from '../domain/types';

export const DEMO_ORDER_ID = 'CHAM-DEMO-A1';

function demoMedia(id: string, kind: MediaItem['kind'], art: DemoArt, extra: Partial<MediaItem> = {}): MediaItem {
  return {
    id,
    kind,
    name: kind === 'image' ? `${art}.jpg` : `${art}.mp4`,
    size: kind === 'image' ? 4_200_000 : 38_000_000,
    mimeType: kind === 'image' ? 'image/jpeg' : 'video/mp4',
    addedAt: '2026-09-18T09:00:00.000Z',
    source: 'demo',
    demoArt: art,
    ...(kind === 'image' ? { width: 1772, height: 2362 } : { width: 1080, height: 1440, durationSec: 12 }),
    ...extra,
  };
}

/** Draft golden path: đã chọn dịch vụ, lời nhắn và có sẵn 1 ảnh + 1 video mẫu. */
export function createGoldenPathDraft(): Draft {
  const d = createEmptyDraft();
  return {
    ...d,
    serviceType: 'studio',
    brief: {
      ...d.brief,
      recipient: 'partner',
      occasion: 'anniversary',
      feeling: 'warm',
      message: 'Cảm ơn em vì buổi chiều ở biển năm ấy.',
      senderName: 'Khách mẫu',
      recipientName: 'Người nhận mẫu',
    },
    media: [demoMedia('demo-img-seaside', 'image', 'seaside'), demoMedia('demo-vid-seaside', 'video', 'seaside')],
    stepIndex: 2,
  };
}

const ago = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();

interface SeedSpec {
  id: string;
  name: string;
  service: ServiceType;
  mode: Mode;
  mood: Mood | null;
  art: DemoArt;
  status: OrderStatus;
  images: number;
  videos: number;
  revisions?: number;
  hoursAgo: number;
  extractFrame?: boolean;
  blockedFrom?: OrderStatus;
  note?: string;
}

const SPECS: SeedSpec[] = [
  { id: DEMO_ORDER_ID, name: 'Khách mẫu Lan', service: 'studio', mode: 'A', mood: 'warm', art: 'seaside', status: 'completed', images: 1, videos: 1, revisions: 1, hoursAgo: 30 },
  { id: 'CHAM-DEMO-A2', name: 'Khách mẫu Huy', service: 'studio', mode: 'A', mood: 'nostalgic', art: 'mountain', status: 'awaiting_customer_approval', images: 1, videos: 1, hoursAgo: 3 },
  { id: 'CHAM-DEMO-B1', name: 'Khách mẫu Vy', service: 'studio', mode: 'B', mood: 'playful', art: 'birthday', status: 'revision_requested', images: 6, videos: 1, revisions: 1, hoursAgo: 5 },
  { id: 'CHAM-DEMO-C1', name: 'Khách mẫu Nam', service: 'studio', mode: 'C', mood: 'warm', art: 'kitchen', status: 'quality_control', images: 4, videos: 2, revisions: 2, hoursAgo: 8 },
  { id: 'CHAM-DEMO-R1', name: 'Khách mẫu Thảo', service: 'ready_video', mode: 'A', mood: null, art: 'graduation', status: 'reviewing_assets', images: 1, videos: 1, hoursAgo: 1 },
  { id: 'CHAM-DEMO-F1', name: 'Khách mẫu Quân', service: 'studio', mode: 'A', mood: 'playful', art: 'seaside', status: 'reviewing_assets', images: 0, videos: 1, extractFrame: true, hoursAgo: 2 },
  { id: 'CHAM-DEMO-X1', name: 'Khách mẫu Mai', service: 'ready_video', mode: 'B', mood: null, art: 'mountain', status: 'blocked', blockedFrom: 'reviewing_assets', images: 2, videos: 1, hoursAgo: 20, note: 'Video khách gửi bị lỗi ở giây 14, đã nhắn khách gửi lại.' },
];

function buildOrder(s: SeedSpec): Order {
  const media: MediaItem[] = [];
  for (let i = 0; i < s.images; i++) media.push(demoMedia(`${s.id}-img-${i}`, 'image', i === 0 ? s.art : (['birthday', 'kitchen', 'mountain', 'graduation'] as DemoArt[])[i % 4] as DemoArt));
  for (let i = 0; i < s.videos; i++) media.push(demoMedia(`${s.id}-vid-${i}`, 'video', s.art, { durationSec: s.service === 'ready_video' ? 38 : 12 }));
  const firstImage = media.find((m) => m.kind === 'image');
  const firstVideo = media.find((m) => m.kind === 'video');
  const at = ago(s.hoursAgo);
  const history: OrderEvent[] = [
    { at: ago(s.hoursAgo + 24), status: 'draft', label: 'Khách tạo đơn', actor: 'customer' },
    { at, status: s.status, label: 'Dữ liệu mẫu', actor: 'system' },
  ];
  return {
    id: s.id,
    createdAt: ago(s.hoursAgo + 24),
    updatedAt: at,
    status: s.status,
    blockedFrom: s.blockedFrom ?? null,
    serviceType: s.service,
    brief: { ...createEmptyDraft().brief, recipient: 'partner', occasion: s.art === 'birthday' ? 'birthday' : 'anniversary', feeling: s.mood ?? null, message: 'Lời nhắn mẫu cho buổi trình bày.', senderName: s.name, recipientName: 'Người nhận mẫu' },
    contact: { name: s.name, reach: 'demo@cham.local' },
    media,
    printTarget: s.extractFrame && firstVideo ? { type: 'extract_frame', videoId: firstVideo.id } : firstImage ? { type: 'media', mediaId: firstImage.id } : { type: 'none' },
    frameCandidatesSent: false,
    chosenFrame: null,
    mode: s.mode,
    mood: s.mood,
    audio: s.service === 'studio' ? 'licensed_music' : null,
    rightsConfirmed: s.service === 'ready_video',
    revisionsUsed: s.revisions ?? 0,
    revisions: Array.from({ length: s.revisions ?? 0 }, (_, i) => ({ at, round: i + 1, text: i === 0 ? 'Cho lời nhắn xuất hiện chậm hơn.' : 'Tăng âm lượng nhạc ở đoạn cuối.' })),
    previewVersion: ['awaiting_customer_approval', 'revision_requested', 'quality_control', 'completed'].includes(s.status) ? (s.revisions ?? 0) + 1 : 0,
    qc: s.status === 'completed' ? { result: 'pass', at, note: '' } : null,
    ar: null,
    notes: s.note ? [{ id: `${s.id}-note`, at, text: s.note }] : [],
    history,
    isDemo: true,
  };
}

/** Tạo bộ đơn mẫu; đơn đã hoàn thành/đang QC được gắn liên kết AR qua adapter. */
export async function buildSeedOrders(ar: ARAdapter): Promise<Order[]> {
  const orders = SPECS.map(buildOrder);
  for (const o of orders) {
    if (o.status !== 'completed' && o.status !== 'quality_control') continue;
    try {
      const exp = await ar.createExperience({ orderId: o.id, mode: o.mode, targetMediaId: o.media[0]?.id ?? null, videoMediaIds: o.media.filter((m) => m.kind === 'video').map((m) => m.id) });
      const launchUrl = await ar.generateLaunchLink(exp.experienceId);
      o.ar = { experienceId: exp.experienceId, launchUrl, qrDataUrl: await ar.generateQrCode(launchUrl), linkedAt: o.updatedAt };
    } catch {
      /* nếu AR adapter lỗi, đơn mẫu vẫn được tạo, chỉ thiếu liên kết AR */
    }
  }
  return orders;
}
