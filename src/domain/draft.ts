import { MODE_LABELS } from './labels';
import { evaluateModes, toEligibilityInput } from './experienceRules';
import type { Draft, ServiceType } from './types';

export function createEmptyDraft(): Draft {
  return {
    version: 1,
    serviceType: null,
    brief: {
      recipient: null,
      recipientOther: '',
      occasion: null,
      occasionOther: '',
      feeling: null,
      message: '',
      senderName: '',
      recipientName: '',
      notes: '',
    },
    media: [],
    printTarget: { type: 'none' },
    mode: null,
    mood: null,
    audio: null,
    audioRightsConfirmed: false,
    rightsConfirmed: false,
    frameConfirmed: false,
    contact: { name: '', reach: '' },
    stepIndex: 0,
  };
}

export interface ReconcileResult {
  draft: Draft;
  notices: string[];
}

/**
 * Đưa draft về trạng thái nhất quán sau mỗi thay đổi:
 * - ảnh in bị xóa -> bỏ chọn
 * - video dùng trích frame bị xóa -> chuyển sang video khác hoặc bỏ chọn
 * - mode không còn đủ điều kiện -> bỏ chọn và báo lý do
 * - nhánh video hoàn chỉnh -> bỏ cảm xúc/template/âm thanh
 */
export function reconcileDraft(input: Draft): ReconcileResult {
  const notices: string[] = [];
  let draft: Draft = { ...input };

  const target = draft.printTarget;
  if (target.type === 'media') {
    const exists = draft.media.some((m) => m.id === target.mediaId && m.kind === 'image');
    if (!exists) {
      draft = { ...draft, printTarget: { type: 'none' } };
      notices.push('Ảnh dùng để in đã bị xóa. Hãy chọn lại ảnh in.');
    }
  } else if (target.type === 'extract_frame') {
    const exists = draft.media.some((m) => m.id === target.videoId && m.kind === 'video');
    if (!exists) {
      const fallback = draft.media.find((m) => m.kind === 'video');
      if (fallback) {
        draft = { ...draft, printTarget: { type: 'extract_frame', videoId: fallback.id } };
        notices.push(`Video để trích frame đã bị xóa. Chạm sẽ trích frame từ "${fallback.name}".`);
      } else {
        draft = { ...draft, printTarget: { type: 'none' } };
        notices.push('Không còn video để trích frame. Hãy chọn ảnh in khác.');
      }
    }
  }

  if (draft.mode) {
    const result = evaluateModes(toEligibilityInput(draft.media, draft.printTarget))[draft.mode];
    if (!result.eligible) {
      notices.push(`"${MODE_LABELS[draft.mode]}" không còn đủ điều kiện: ${result.reasons.join(' ')}`);
      draft = { ...draft, mode: null };
    }
  }

  if (draft.serviceType === 'ready_video' && (draft.mood || draft.audio || draft.audioRightsConfirmed)) {
    draft = { ...draft, mood: null, audio: null, audioRightsConfirmed: false };
  }
  if (draft.audio !== 'own_audio' && draft.audioRightsConfirmed) {
    draft = { ...draft, audioRightsConfirmed: false };
  }

  return { draft, notices };
}

export function switchService(draft: Draft, serviceType: ServiceType): ReconcileResult {
  if (draft.serviceType === serviceType) return { draft, notices: [] };
  const hadStudioChoices = Boolean(draft.mood || draft.audio);
  const next: Draft = {
    ...draft,
    serviceType,
    rightsConfirmed: serviceType === 'ready_video' ? draft.rightsConfirmed : false,
    brief: serviceType === 'ready_video' ? { ...draft.brief, feeling: null } : draft.brief,
  };
  const result = reconcileDraft(next);
  if (serviceType === 'ready_video' && hadStudioChoices) {
    result.notices.push('Đã bỏ lựa chọn cảm xúc, template và âm thanh vì bạn gửi video hoàn chỉnh.');
  }
  return result;
}
