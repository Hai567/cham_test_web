import { BUSINESS } from '../config/business';
import type { Mode, Mood } from './types';

export interface TemplateDef {
  id: string;
  mode: Mode;
  mood: Mood;
  name: string;
  description: string;
  pacing: string;
  durationLabel: string;
  /** 3 khung storyboard minh họa nhịp dựng. */
  storyboard: [string, string, string];
}

const living = `${BUSINESS.livingPhotoDuration.min}–${BUSINESS.livingPhotoDuration.max} giây`;
const montage = `${BUSINESS.montageDuration.min}–${BUSINESS.montageDuration.max} giây`;

export const TEMPLATES: readonly TemplateDef[] = [
  {
    id: 'A-nostalgic', mode: 'A', mood: 'nostalgic', name: 'Thước phim cũ',
    description: 'Chuyển động nhẹ, lớp grain như phim nhựa, chữ tối giản.',
    pacing: 'Chậm, một cảnh liền mạch', durationLabel: living,
    storyboard: ['Ảnh tĩnh phủ grain', 'Khoảnh khắc khẽ chuyển động', 'Ngày tháng hiện lên'],
  },
  {
    id: 'A-warm', mode: 'A', mood: 'warm', name: 'Nắng chiều',
    description: 'Tông ấm, ánh sáng mềm, lời nhắn xuất hiện ở cuối.',
    pacing: 'Chậm, dừng lâu ở gương mặt', durationLabel: living,
    storyboard: ['Ánh sáng ấm lan dần', 'Khoảnh khắc sống lại', 'Lời nhắn của bạn'],
  },
  {
    id: 'A-playful', mode: 'A', mood: 'playful', name: 'Bật dậy',
    description: 'Chuyển động nảy nhẹ, chữ vui, kết bằng một khoảnh khắc bất ngờ.',
    pacing: 'Nhanh, cắt theo nhịp', durationLabel: living,
    storyboard: ['Ảnh bật sáng', 'Khoảnh khắc sống lại', 'Chữ vui chốt lại'],
  },
  {
    id: 'B-nostalgic', mode: 'B', mood: 'nostalgic', name: 'Cuộn phim kỷ niệm',
    description: 'Montage chậm theo thứ tự thời gian, màu phim, viền khung phim.',
    pacing: 'Chậm, mỗi cảnh 3–4 giây', durationLabel: montage,
    storyboard: ['Ảnh đại diện mở đầu', 'Các khoảnh khắc nối tiếp', 'Dòng chữ khép lại'],
  },
  {
    id: 'B-warm', mode: 'B', mood: 'warm', name: 'Góc nhà ấm',
    description: 'Montage chậm, màu ấm, chuyển cảnh mềm.',
    pacing: 'Chậm, chuyển cảnh hòa tan', durationLabel: montage,
    storyboard: ['Ảnh đại diện', 'Montage màu ấm', 'Lời nhắn cuối'],
  },
  {
    id: 'B-playful', mode: 'B', mood: 'playful', name: 'Ngày vui',
    description: 'Montage nhanh theo nhịp nhạc, chữ vui, màu tươi.',
    pacing: 'Nhanh, cắt theo beat', durationLabel: montage,
    storyboard: ['Ảnh đại diện bật lên', 'Montage nhịp nhanh', 'Chữ vui chốt lại'],
  },
  {
    id: 'C-nostalgic', mode: 'C', mood: 'nostalgic', name: 'Ngược dòng',
    description: 'Ảnh sống lại, rồi mở ra những ký ức cũ hơn với grain và màu phim.',
    pacing: 'Chậm, chuyển từ một cảnh sang montage', durationLabel: montage,
    storyboard: ['Ảnh sống lại', 'Ký ức cũ mở ra', 'Dòng chữ khép lại'],
  },
  {
    id: 'C-warm', mode: 'C', mood: 'warm', name: 'Vòng tay',
    description: 'Ảnh sống lại, tiếp nối bằng montage chậm và ấm.',
    pacing: 'Chậm, chuyển cảnh mềm', durationLabel: montage,
    storyboard: ['Ảnh sống lại', 'Montage màu ấm', 'Lời nhắn cuối'],
  },
  {
    id: 'C-playful', mode: 'C', mood: 'playful', name: 'Tiệc bất ngờ',
    description: 'Mở đầu bằng khoảnh khắc sống lại, sau đó montage nhanh với chữ vui.',
    pacing: 'Mở chậm, sau đó nhanh theo beat', durationLabel: montage,
    storyboard: ['Ảnh sống lại', 'Montage nhanh', 'Chữ vui chốt lại'],
  },
];

export function templateFor(mode: Mode | null, mood: Mood | null): TemplateDef | null {
  if (!mode || !mood) return null;
  return TEMPLATES.find((t) => t.mode === mode && t.mood === mood) ?? null;
}

export function templatesForMode(mode: Mode): TemplateDef[] {
  return TEMPLATES.filter((t) => t.mode === mode);
}
