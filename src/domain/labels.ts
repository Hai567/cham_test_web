import type { AudioChoice, Mode, Mood, Occasion, OrderStatus, Recipient, ServiceType } from './types';

export const SERVICE_LABELS: Record<ServiceType, string> = {
  studio: 'Chạm dựng giúp tôi',
  ready_video: 'Tôi đã có video hoàn chỉnh',
};

export const MODE_LABELS: Record<Mode, string> = {
  A: 'Ảnh sống lại',
  B: 'Kể lại một kỷ niệm',
  C: 'Ảnh sống lại rồi mở rộng câu chuyện',
};

export const MOOD_LABELS: Record<Mood, string> = {
  nostalgic: 'Hoài niệm',
  warm: 'Ấm áp',
  playful: 'Vui nhộn',
};

export const AUDIO_LABELS: Record<AudioChoice, string> = {
  original: 'Giữ âm thanh gốc',
  licensed_music: 'Dùng nhạc do Chạm cung cấp',
  own_audio: 'Dùng voice/audio tôi có quyền sử dụng',
  none: 'Không dùng âm thanh',
};

export const RECIPIENT_LABELS: Record<Recipient, string> = {
  partner: 'Người yêu',
  parents: 'Bố mẹ',
  friends: 'Bạn bè',
  self: 'Bản thân',
  other: 'Khác',
};

export const OCCASION_LABELS: Record<Occasion, string> = {
  birthday: 'Sinh nhật',
  anniversary: 'Kỷ niệm',
  graduation: 'Tốt nghiệp',
  trip: 'Chuyến đi',
  none: 'Không có dịp cụ thể',
  other: 'Khác',
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  draft: 'Draft',
  awaiting_assets: 'Awaiting assets',
  reviewing_assets: 'Reviewing assets',
  editing: 'Editing',
  awaiting_customer_approval: 'Awaiting customer approval',
  revision_requested: 'Revision requested',
  approved: 'Approved',
  printing: 'Printing',
  ar_linking: 'AR linking',
  quality_control: 'Quality control',
  packing: 'Packing',
  shipping: 'Shipping',
  completed: 'Completed',
  blocked: 'Blocked',
};

/** Nhãn tiếng Việt cho khách hàng. */
export const STATUS_LABELS_VI: Record<OrderStatus, string> = {
  draft: 'Bản nháp',
  awaiting_assets: 'Chờ bổ sung file',
  reviewing_assets: 'Chạm đang kiểm tra file',
  editing: 'Chạm đang dựng video',
  awaiting_customer_approval: 'Chờ bạn duyệt',
  revision_requested: 'Đang chỉnh sửa theo yêu cầu',
  approved: 'Đã duyệt',
  printing: 'Đang in ảnh',
  ar_linking: 'Đang liên kết AR',
  quality_control: 'Đang kiểm tra chất lượng',
  packing: 'Đang đóng gói',
  shipping: 'Đang giao hàng',
  completed: 'Hoàn thành',
  blocked: 'Tạm dừng',
};
