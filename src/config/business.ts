/**
 * Hằng số business của MVP Chạm. Mọi giới hạn/thông số phải lấy từ file này,
 * không hard-code rải rác trong UI.
 */
const MB = 1024 * 1024;

export const BUSINESS = {
  maxImages: 10,
  maxVideos: 2,
  maxRevisions: 2,
  frame: {
    widthCm: 15,
    heightCm: 20,
    orientation: 'portrait',
    hasGlass: false,
    label: '15 × 20 cm',
  },
  serviceTimeAfterApproval: { minDays: 3, maxDays: 5, label: '3–5 ngày làm việc sau khi bạn duyệt bản cuối' },
  outputRatio: { w: 3, h: 4, label: '3:4' },
  outputResolution: { width: 1080, height: 1440 },
  printResolution: { width: 1772, height: 2362, dpi: 300 },
  montageDuration: { min: 30, max: 45 },
  livingPhotoDuration: { min: 8, max: 15 },
} as const;

export const UPLOAD_LIMITS = {
  image: {
    extensions: ['jpg', 'jpeg', 'png', 'webp'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxBytes: 15 * MB,
    label: 'JPG, PNG, WEBP',
  },
  video: {
    extensions: ['mp4', 'mov', 'webm'],
    mimeTypes: ['video/mp4', 'video/quicktime', 'video/webm'],
    maxBytes: 300 * MB,
    label: 'MP4, MOV, WEBM',
  },
} as const;

/** Ngưỡng rule A/B/C. Chỉnh ở đây, không chỉnh trong component. */
export const ELIGIBILITY_RULES = {
  livingMinVideos: 1,
  montageMinMedia: 2,
  extendedMinVideos: 1,
  extendedMinMedia: 3,
} as const;

export const COPY = {
  persistence:
    'Nội dung được duy trì trong thời gian nền tảng/dịch vụ còn khả dụng. Khách hàng có thể tải video thành phẩm để lưu trữ.',
  licensedMusic: 'Nhạc được cấp phép phù hợp cho mục đích thương mại và phân phối trên web.',
  capcutMusicWarning:
    'Nhạc thông thường trong CapCut không mặc nhiên được phép dùng cho video thương mại phát ngoài CapCut/TikTok.',
} as const;

export function formatBytes(bytes: number): string {
  if (bytes >= MB) return `${(bytes / MB).toFixed(bytes >= 100 * MB ? 0 : 1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Thông tin liên hệ hiển thị công khai. Đây là placeholder cho bản MVP,
 * chưa phải kênh thật. Thay bằng thông tin chính thức trước khi công bố.
 */
export const CONTACT = {
  email: 'hello@cham.vn', // theo mockup, cần xác nhận hộp thư thật
  /** Số Zalo của Chạm (chỉ số, ví dụ 0912345678). Để trống thì không hiện nút Zalo. */
  zalo: '',
  phone: '',
  social: [
    { label: 'Instagram', handle: '@cham', url: '#' },
    { label: 'Facebook', handle: 'Chạm', url: '#' },
    { label: 'TikTok', handle: '@cham', url: '#' },
  ],
  isPlaceholder: true,
} as const;
