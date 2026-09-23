import { BUSINESS, UPLOAD_LIMITS, formatBytes } from '../config/business';
import type { MediaItem, MediaKind } from './types';

export interface IncomingFile {
  name: string;
  type: string;
  size: number;
}

export interface RejectedFile {
  name: string;
  reason: string;
}

export interface FileValidationResult<T extends IncomingFile> {
  accepted: { file: T; kind: MediaKind }[];
  rejected: RejectedFile[];
}

export function countMedia(media: readonly Pick<MediaItem, 'kind'>[]) {
  const images = media.filter((m) => m.kind === 'image').length;
  const videos = media.filter((m) => m.kind === 'video').length;
  return { images, videos, total: images + videos };
}

function extensionOf(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : '';
}

/** Xác định loại file theo MIME, fallback theo đuôi (một số trình duyệt để trống type với .mov). */
export function classifyFile(file: Pick<IncomingFile, 'name' | 'type'>): MediaKind | null {
  const ext = extensionOf(file.name);
  const type = file.type.toLowerCase();
  const isImage = (UPLOAD_LIMITS.image.mimeTypes as readonly string[]).includes(type);
  const isVideo = (UPLOAD_LIMITS.video.mimeTypes as readonly string[]).includes(type);
  if (isImage) return 'image';
  if (isVideo) return 'video';
  if (type && type !== 'application/octet-stream') return null;
  if ((UPLOAD_LIMITS.image.extensions as readonly string[]).includes(ext)) return 'image';
  if ((UPLOAD_LIMITS.video.extensions as readonly string[]).includes(ext)) return 'video';
  return null;
}

/**
 * Validate file mới so với media đang có. Trả về file hợp lệ và lý do từ chối cụ thể.
 * Không throw: UI hiển thị lỗi ngay cạnh vùng upload.
 */
export function validateIncomingFiles<T extends IncomingFile>(
  existing: readonly Pick<MediaItem, 'kind'>[],
  files: readonly T[],
): FileValidationResult<T> {
  let { images, videos } = countMedia(existing);
  const accepted: FileValidationResult<T>['accepted'] = [];
  const rejected: RejectedFile[] = [];

  for (const file of files) {
    const kind = classifyFile(file);
    if (!kind) {
      rejected.push({
        name: file.name,
        reason: `Định dạng không hỗ trợ. Ảnh: ${UPLOAD_LIMITS.image.label}. Video: ${UPLOAD_LIMITS.video.label}.`,
      });
      continue;
    }
    if (file.size <= 0) {
      rejected.push({ name: file.name, reason: 'File rỗng hoặc bị lỗi, hãy chọn lại.' });
      continue;
    }
    const limit = UPLOAD_LIMITS[kind];
    if (file.size > limit.maxBytes) {
      rejected.push({
        name: file.name,
        reason: `File quá lớn (${formatBytes(file.size)}). ${kind === 'image' ? 'Ảnh' : 'Video'} tối đa ${formatBytes(limit.maxBytes)}.`,
      });
      continue;
    }
    if (kind === 'image' && images >= BUSINESS.maxImages) {
      rejected.push({ name: file.name, reason: `Đã đủ ${BUSINESS.maxImages} ảnh. Xóa bớt ảnh để thêm ảnh mới.` });
      continue;
    }
    if (kind === 'video' && videos >= BUSINESS.maxVideos) {
      rejected.push({ name: file.name, reason: `Đã đủ ${BUSINESS.maxVideos} video. Xóa bớt video để thêm video mới.` });
      continue;
    }
    if (kind === 'image') images += 1;
    else videos += 1;
    accepted.push({ file, kind });
  }
  return { accepted, rejected };
}

export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (from < 0 || from >= list.length || to < 0 || to >= list.length || from === to) return [...list];
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}

/** Đổi thứ tự trong nhóm cùng loại (ảnh với ảnh), giữ nguyên vị trí tương đối của loại kia. */
export function moveWithinKind(media: readonly MediaItem[], id: string, direction: -1 | 1): MediaItem[] {
  const item = media.find((m) => m.id === id);
  if (!item) return [...media];
  const sameKind = media.filter((m) => m.kind === item.kind);
  const idx = sameKind.findIndex((m) => m.id === id);
  const reordered = moveItem(sameKind, idx, idx + direction);
  let cursor = 0;
  return media.map((m) => (m.kind === item.kind ? (reordered[cursor++] as MediaItem) : m));
}

export interface VideoSpecCheck {
  label: string;
  ok: boolean;
  detail: string;
}

/** Kiểm tra kỹ thuật sơ bộ cho video hoàn chỉnh (chỉ cảnh báo, không chặn). */
export function checkVideoSpec(
  video: Pick<MediaItem, 'durationSec' | 'width' | 'height' | 'mimeType' | 'name'>,
  livingOnly: boolean,
): VideoSpecCheck[] {
  const range = livingOnly ? BUSINESS.livingPhotoDuration : BUSINESS.montageDuration;
  const checks: VideoSpecCheck[] = [];
  if (video.durationSec == null) {
    checks.push({ label: 'Thời lượng', ok: false, detail: 'Chưa đọc được thời lượng trên thiết bị này. Chạm sẽ kiểm tra thủ công.' });
  } else {
    const d = Math.round(video.durationSec);
    const ok = d >= range.min && d <= range.max;
    checks.push({
      label: 'Thời lượng',
      ok,
      detail: ok ? `${d} giây, nằm trong khoảng đề xuất ${range.min}–${range.max} giây.` : `${d} giây. Đề xuất ${range.min}–${range.max} giây.`,
    });
  }
  if (video.width && video.height) {
    const ratio = video.width / video.height;
    const target = BUSINESS.outputRatio.w / BUSINESS.outputRatio.h;
    const ratioOk = Math.abs(ratio - target) < 0.03;
    checks.push({
      label: 'Tỷ lệ khung hình',
      ok: ratioOk,
      detail: ratioOk
        ? `${video.width} × ${video.height}, đúng tỷ lệ ${BUSINESS.outputRatio.label}.`
        : `${video.width} × ${video.height}. Cần tỷ lệ dọc ${BUSINESS.outputRatio.label}; phần thừa sẽ bị cắt khi phủ lên ảnh.`,
    });
    const resOk = video.width >= BUSINESS.outputResolution.width && video.height >= BUSINESS.outputResolution.height;
    checks.push({
      label: 'Độ phân giải',
      ok: resOk,
      detail: resOk
        ? 'Đạt độ phân giải đề xuất.'
        : `Thấp hơn đề xuất ${BUSINESS.outputResolution.width} × ${BUSINESS.outputResolution.height}, video có thể bị mờ.`,
    });
  } else {
    checks.push({ label: 'Khung hình', ok: false, detail: 'Chưa đọc được kích thước video. Chạm sẽ kiểm tra thủ công.' });
  }
  return checks;
}

/** Frame 1/2/3 lấy ở 20% / 50% / 80% thời lượng video (không dùng AI). */
export function frameSecond(v: Pick<MediaItem, 'durationSec'> | null, frame: number): number {
  const d = v?.durationSec ?? 3;
  return Math.max(0.1, d * ([0.2, 0.5, 0.8][frame - 1] ?? 0.2));
}
