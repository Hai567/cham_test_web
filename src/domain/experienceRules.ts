/**
 * Rule đủ điều kiện cho 3 loại trải nghiệm A/B/C.
 * Rule-based, minh bạch, không có AI hay recommendation.
 * Input chỉ LỌC mode khả dụng; khách luôn là người chọn cuối cùng.
 */
import { ELIGIBILITY_RULES } from '../config/business';
import { countMedia } from './media';
import type { Mode, MediaItem, PrintTarget } from './types';

export interface EligibilityInput {
  imageCount: number;
  videoCount: number;
  /** Đã chọn một ảnh upload làm ảnh in/AR target. */
  hasPrintImage: boolean;
  /** Khách yêu cầu Chạm trích frame từ video làm ảnh in. */
  frameExtractionRequested: boolean;
}

export interface ModeEligibility {
  mode: Mode;
  eligible: boolean;
  /** Vì sao chưa đủ điều kiện (rỗng nếu eligible). */
  reasons: string[];
  /** Gợi ý hành động cụ thể cho khách. */
  hints: string[];
}

export const MODES: readonly Mode[] = ['A', 'B', 'C'];

export function toEligibilityInput(media: readonly MediaItem[], printTarget: PrintTarget): EligibilityInput {
  const { images, videos } = countMedia(media);
  const hasPrintImage =
    printTarget.type === 'media' && media.some((m) => m.id === printTarget.mediaId && m.kind === 'image');
  const frameExtractionRequested =
    printTarget.type === 'extract_frame' && media.some((m) => m.id === printTarget.videoId && m.kind === 'video');
  return { imageCount: images, videoCount: videos, hasPrintImage, frameExtractionRequested };
}

const total = (i: EligibilityInput) => i.imageCount + i.videoCount;
const hasTarget = (i: EligibilityInput) => i.hasPrintImage || i.frameExtractionRequested;

export function checkModeA(input: EligibilityInput): ModeEligibility {
  const reasons: string[] = [];
  const hints: string[] = [];
  if (input.videoCount < ELIGIBILITY_RULES.livingMinVideos) {
    reasons.push('Cần thêm ít nhất 1 video của khoảnh khắc được in.');
  }
  if (!hasTarget(input)) {
    reasons.push('Hãy chọn ảnh dùng để in.');
    if (input.videoCount > 0) hints.push('Bạn có thể yêu cầu Chạm trích frame từ video.');
  }
  return { mode: 'A', eligible: reasons.length === 0, reasons, hints };
}

export function checkModeB(input: EligibilityInput): ModeEligibility {
  const reasons: string[] = [];
  const hints: string[] = [];
  if (!hasTarget(input)) {
    reasons.push('Hãy chọn ảnh dùng để in (ảnh đại diện cho kỷ niệm).');
  }
  if (total(input) < ELIGIBILITY_RULES.montageMinMedia) {
    reasons.push(`Cần ít nhất ${ELIGIBILITY_RULES.montageMinMedia} ảnh/video để dựng montage (hiện có ${total(input)}).`);
    hints.push('Tải thêm ảnh hoặc video của cùng kỷ niệm.');
  }
  return { mode: 'B', eligible: reasons.length === 0, reasons, hints };
}

export function checkModeC(input: EligibilityInput): ModeEligibility {
  const a = checkModeA(input);
  const reasons = [...a.reasons];
  const hints = [...a.hints];
  if (input.videoCount < ELIGIBILITY_RULES.extendedMinVideos && !reasons.some((r) => r.includes('video'))) {
    reasons.push('Cần thêm ít nhất 1 video.');
  }
  if (total(input) < ELIGIBILITY_RULES.extendedMinMedia) {
    reasons.push(
      `Cần tổng cộng ít nhất ${ELIGIBILITY_RULES.extendedMinMedia} ảnh/video để mở rộng câu chuyện (hiện có ${total(input)}).`,
    );
    hints.push('Tải thêm ảnh hoặc video để dựng phần montage phía sau.');
  }
  return { mode: 'C', eligible: reasons.length === 0, reasons, hints };
}

export function evaluateModes(input: EligibilityInput): Record<Mode, ModeEligibility> {
  return { A: checkModeA(input), B: checkModeB(input), C: checkModeC(input) };
}

export function isModeEligible(mode: Mode, input: EligibilityInput): boolean {
  return evaluateModes(input)[mode].eligible;
}
