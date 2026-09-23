import { describe, expect, it } from 'vitest';
import { reconcileDraft, switchService } from './draft';
import { getSteps, validateStep, clampStepIndex } from './wizard';
import { goldenDraft, media } from '../test/factories';

describe('chuyển nhánh dịch vụ', () => {
  it('nhánh video hoàn chỉnh bỏ qua bước cảm xúc/template/âm thanh', () => {
    const steps = getSteps('ready_video');
    expect(steps).not.toContain('style');
    expect(steps).not.toContain('audio');
    expect(steps).toContain('check');
    expect(getSteps('studio')).toContain('style');
  });
  it('đổi sang video hoàn chỉnh xóa cảm xúc/âm thanh và báo cho khách', () => {
    const { draft, notices } = switchService(goldenDraft(), 'ready_video');
    expect(draft.serviceType).toBe('ready_video');
    expect(draft.mood).toBeNull();
    expect(draft.audio).toBeNull();
    expect(draft.brief.feeling).toBeNull();
    expect(notices.join(' ')).toMatch(/cảm xúc/);
  });
  it('đổi lại sang Chạm dựng giữ media và mode', () => {
    const ready = switchService(goldenDraft(), 'ready_video').draft;
    const back = switchService({ ...ready, rightsConfirmed: true }, 'studio').draft;
    expect(back.media).toHaveLength(2);
    expect(back.mode).toBe('A');
    expect(back.rightsConfirmed).toBe(false);
  });
  it('nhánh video hoàn chỉnh yêu cầu xác nhận quyền nội dung/âm thanh', () => {
    const d = switchService(goldenDraft(), 'ready_video').draft;
    expect(validateStep('check', d)).toHaveLength(1);
    expect(validateStep('check', { ...d, rightsConfirmed: true })).toHaveLength(0);
  });
  it('nhánh video hoàn chỉnh cần ít nhất 1 video', () => {
    const d = { ...switchService(goldenDraft(), 'ready_video').draft, media: [media('image')] };
    expect(validateStep('media', d).join(' ')).toMatch(/video hoàn chỉnh/);
  });
});

describe('xóa media làm thay đổi điều kiện', () => {
  it('xóa ảnh in thì bỏ chọn ảnh in và vô hiệu hóa Mode A', () => {
    const d = goldenDraft();
    const onlyVideo = { ...d, media: d.media.filter((m) => m.kind === 'video') };
    const { draft, notices } = reconcileDraft(onlyVideo);
    expect(draft.printTarget.type).toBe('none');
    expect(draft.mode).toBeNull();
    expect(notices.length).toBeGreaterThanOrEqual(2);
  });
  it('xóa video thì Mode A không còn hợp lệ', () => {
    const d = goldenDraft();
    const { draft } = reconcileDraft({ ...d, media: d.media.filter((m) => m.kind === 'image') });
    expect(draft.mode).toBeNull();
    expect(draft.printTarget.type).toBe('media');
  });
  it('xóa video đang dùng để trích frame thì chuyển sang video còn lại', () => {
    const v1 = media('video'); const v2 = media('video');
    const d = { ...goldenDraft(), media: [v1, v2], printTarget: { type: 'extract_frame' as const, videoId: v1.id } };
    const { draft } = reconcileDraft({ ...d, media: [v2] });
    expect(draft.printTarget).toEqual({ type: 'extract_frame', videoId: v2.id });
  });
});

describe('wizard', () => {
  it('golden path hợp lệ ở mọi bước', () => {
    const d = goldenDraft();
    for (const s of getSteps('studio')) expect(validateStep(s, d)).toEqual([]);
  });
  it('không cho nhảy qua bước chưa hợp lệ khi khôi phục', () => {
    const d = { ...goldenDraft(), mode: null };
    expect(clampStepIndex(d, 8)).toBe(getSteps('studio').indexOf('mode'));
  });
  it('audio của khách cần xác nhận quyền', () => {
    const d = { ...goldenDraft(), audio: 'own_audio' as const };
    expect(validateStep('audio', d)).toHaveLength(1);
  });
  it('liên hệ không hợp lệ bị chặn', () => {
    expect(validateStep('review', { ...goldenDraft(), contact: { name: 'A', reach: 'abc' } })).toHaveLength(1);
  });
});
