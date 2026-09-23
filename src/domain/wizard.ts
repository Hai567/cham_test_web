import { evaluateModes, toEligibilityInput } from './experienceRules';
import { countMedia } from './media';
import type { Draft, ServiceType } from './types';

export type StepId = 'service' | 'brief' | 'media' | 'target' | 'mode' | 'style' | 'audio' | 'check' | 'frame' | 'review';

export const STEP_LABELS: Record<StepId, string> = {
  service: 'Cách thực hiện',
  brief: 'Lời nhắn',
  media: 'Ảnh & video',
  target: 'Ảnh in',
  mode: 'Trải nghiệm',
  style: 'Phong cách',
  audio: 'Âm thanh',
  check: 'Kiểm tra video',
  frame: 'Khung ảnh',
  review: 'Xem lại',
};

const STUDIO_STEPS: StepId[] = ['service', 'brief', 'media', 'target', 'mode', 'style', 'audio', 'frame', 'review'];
const READY_STEPS: StepId[] = ['service', 'brief', 'media', 'target', 'mode', 'check', 'frame', 'review'];

/** Nhánh "video hoàn chỉnh" không có bước cảm xúc/template/âm thanh. */
export function getSteps(serviceType: ServiceType | null): StepId[] {
  return serviceType === 'ready_video' ? READY_STEPS : STUDIO_STEPS;
}

const REACH_PATTERN = /^(\+?\d[\d\s.-]{7,14}\d|[^\s@]+@[^\s@]+\.[^\s@]+)$/;

export function validateStep(step: StepId, d: Draft): string[] {
  const errors: string[] = [];
  switch (step) {
    case 'service':
      if (!d.serviceType) errors.push('Hãy chọn cách thực hiện.');
      break;
    case 'brief':
      if (!d.brief.recipient) errors.push('Hãy chọn người nhận món quà.');
      if (d.brief.recipient === 'other' && !d.brief.recipientOther.trim()) errors.push('Hãy ghi rõ người nhận.');
      if (!d.brief.occasion) errors.push('Hãy chọn dịp tặng.');
      if (d.brief.occasion === 'other' && !d.brief.occasionOther.trim()) errors.push('Hãy ghi rõ dịp tặng.');
      if (d.serviceType === 'studio' && !d.brief.feeling) errors.push('Hãy chọn cảm giác bạn muốn người nhận có.');
      break;
    case 'media': {
      const { total, videos } = countMedia(d.media);
      if (total === 0) errors.push('Hãy tải lên ít nhất 1 ảnh hoặc video.');
      if (d.serviceType === 'ready_video' && videos === 0) errors.push('Hãy tải lên video hoàn chỉnh của bạn.');
      break;
    }
    case 'target': {
      const input = toEligibilityInput(d.media, d.printTarget);
      if (!input.hasPrintImage && !input.frameExtractionRequested) {
        errors.push('Hãy chọn ảnh dùng để in, tải ảnh khác hoặc yêu cầu Chạm trích frame từ video.');
      }
      break;
    }
    case 'mode': {
      if (!d.mode) {
        errors.push('Hãy chọn một loại trải nghiệm.');
        break;
      }
      const result = evaluateModes(toEligibilityInput(d.media, d.printTarget))[d.mode];
      if (!result.eligible) errors.push(...result.reasons);
      break;
    }
    case 'style':
      if (!d.mood) errors.push('Hãy chọn phong cách hoặc một template.');
      break;
    case 'audio':
      if (!d.audio) errors.push('Hãy chọn cách dùng âm thanh.');
      if (d.audio === 'own_audio' && !d.audioRightsConfirmed) {
        errors.push('Hãy xác nhận bạn có quyền sử dụng voice/audio này.');
      }
      break;
    case 'check':
      if (!d.rightsConfirmed) errors.push('Hãy xác nhận bạn có quyền sử dụng nội dung và âm thanh trong video.');
      break;
    case 'frame':
      if (!d.frameConfirmed) errors.push('Hãy xác nhận thông tin khung ảnh.');
      break;
    case 'review':
      if (!d.contact.name.trim()) errors.push('Hãy nhập tên của bạn.');
      if (!REACH_PATTERN.test(d.contact.reach.trim())) errors.push('Hãy nhập số điện thoại hoặc email hợp lệ để Chạm gửi bản nháp.');
      break;
  }
  return errors;
}

/** Bước đầu tiên chưa hợp lệ (dùng khi submit hoặc khôi phục sau refresh). */
export function firstInvalidStep(d: Draft): StepId | null {
  for (const step of getSteps(d.serviceType)) {
    if (validateStep(step, d).length > 0) return step;
  }
  return null;
}

/** Không cho nhảy tới bước sau khi các bước trước chưa hợp lệ. */
export function clampStepIndex(d: Draft, index: number): number {
  const steps = getSteps(d.serviceType);
  const max = steps.length - 1;
  let i = Math.min(Math.max(0, index), max);
  for (let s = 0; s < i; s++) {
    if (validateStep(steps[s] as StepId, d).length > 0) {
      i = s;
      break;
    }
  }
  return i;
}
