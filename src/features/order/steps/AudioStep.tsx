import { Checkbox, Notice } from '../../../components/ui';
import { COPY } from '../../../config/business';
import { AUDIO_LABELS } from '../../../domain/labels';
import type { AudioChoice } from '../../../domain/types';
import { StepHeading, type StepProps } from './shared';

const DESC: Record<AudioChoice, string> = {
  original: 'Giữ tiếng từ video bạn gửi, ví dụ tiếng cười, tiếng sóng.',
  licensed_music: COPY.licensedMusic,
  own_audio: 'Lời nhắn thu âm hoặc bản nhạc bạn có quyền sử dụng. Gửi kèm file ở phần ghi chú hoặc qua Chạm khi được liên hệ.',
  none: 'Video phát không có tiếng.',
};

export function AudioStep({ api }: StepProps) {
  const { draft, update } = api;
  return (
    <>
      <StepHeading title="Âm thanh cho video" lead="Trên điện thoại, video thường bắt đầu ở chế độ tắt tiếng. Người nhận chạm nút để bật âm thanh." />
      <fieldset>
        <legend className="sr-only">Âm thanh</legend>
        <div className="grid gap-3 md:grid-cols-2">
          {(Object.keys(AUDIO_LABELS) as AudioChoice[]).map((a) => (
            <label key={a} className="option-card">
              <input type="radio" name="audio" className="sr-only" checked={draft.audio === a} onChange={() => update((d) => ({ ...d, audio: a }))} />
              <span className="block font-semibold text-navy">{AUDIO_LABELS[a]}</span>
              <span className="mt-1 block text-[15px] text-ink/80">{DESC[a]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {draft.audio === 'own_audio' && (
        <div className="mt-5">
          <Checkbox id="audio-rights" checked={draft.audioRightsConfirmed} onChange={(v) => update((d) => ({ ...d, audioRightsConfirmed: v }))}>
            Tôi xác nhận có quyền sử dụng voice/audio này cho video in kèm khung và phát trên web.
          </Checkbox>
        </div>
      )}
      <Notice tone="warning" className="mt-5" title="Về nhạc từ ứng dụng dựng video">
        {COPY.capcutMusicWarning} Nếu cần nhạc nền, hãy chọn nhạc do Chạm cung cấp.
      </Notice>
    </>
  );
}
