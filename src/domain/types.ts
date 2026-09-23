export type ServiceType = 'studio' | 'ready_video';
export type Mode = 'A' | 'B' | 'C';
export type Mood = 'nostalgic' | 'warm' | 'playful';
export type AudioChoice = 'original' | 'licensed_music' | 'own_audio' | 'none';
export type MediaKind = 'image' | 'video';

/** Tên minh họa dùng cho dữ liệu mẫu (không phải file thật). */
export type DemoArt = 'seaside' | 'birthday' | 'graduation' | 'mountain' | 'kitchen';

export interface MediaItem {
  id: string;
  kind: MediaKind;
  name: string;
  size: number;
  mimeType: string;
  addedAt: string;
  source: 'upload' | 'demo';
  demoArt?: DemoArt;
  width?: number;
  height?: number;
  durationSec?: number;
}

export type PrintTarget =
  | { type: 'none' }
  | { type: 'media'; mediaId: string }
  | { type: 'extract_frame'; videoId: string };

export type Recipient = 'partner' | 'parents' | 'friends' | 'self' | 'other';
export type Occasion = 'birthday' | 'anniversary' | 'graduation' | 'trip' | 'none' | 'other';
export type Feeling = Mood | 'unknown';

export interface Brief {
  recipient: Recipient | null;
  recipientOther: string;
  occasion: Occasion | null;
  occasionOther: string;
  feeling: Feeling | null;
  message: string;
  senderName: string;
  recipientName: string;
  notes: string;
}

export interface Contact {
  name: string;
  reach: string;
}

export interface Draft {
  version: 1;
  serviceType: ServiceType | null;
  brief: Brief;
  media: MediaItem[];
  printTarget: PrintTarget;
  mode: Mode | null;
  mood: Mood | null;
  audio: AudioChoice | null;
  audioRightsConfirmed: boolean;
  rightsConfirmed: boolean;
  frameConfirmed: boolean;
  contact: Contact;
  stepIndex: number;
}

export type OrderStatus =
  | 'draft'
  | 'awaiting_assets'
  | 'reviewing_assets'
  | 'editing'
  | 'awaiting_customer_approval'
  | 'revision_requested'
  | 'approved'
  | 'printing'
  | 'ar_linking'
  | 'quality_control'
  | 'packing'
  | 'shipping'
  | 'completed'
  | 'blocked';

export interface OrderEvent {
  at: string;
  status: OrderStatus;
  label: string;
  actor: 'customer' | 'operator' | 'system';
}

export interface OperatorNote {
  id: string;
  at: string;
  text: string;
}

export interface RevisionRequest {
  at: string;
  round: number;
  text: string;
}

export interface ARLink {
  experienceId: string;
  launchUrl: string;
  qrDataUrl: string;
  linkedAt: string;
}

export interface Order {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  blockedFrom: OrderStatus | null;
  serviceType: ServiceType;
  brief: Brief;
  contact: Contact;
  media: MediaItem[];
  printTarget: PrintTarget;
  /** Frame khách chọn khi yêu cầu Chạm trích frame (1..3). */
  frameCandidatesSent: boolean;
  chosenFrame: number | null;
  mode: Mode;
  mood: Mood | null;
  audio: AudioChoice | null;
  rightsConfirmed: boolean;
  revisionsUsed: number;
  revisions: RevisionRequest[];
  previewVersion: number;
  qc: { result: 'pass' | 'fail'; at: string; note: string } | null;
  ar: ARLink | null;
  notes: OperatorNote[];
  history: OrderEvent[];
  isDemo: boolean;
  /** Kết quả gửi đơn về team. Không có nghĩa là đơn tạo trước khi có tính năng gửi (hoặc đơn mẫu). */
  submission?: {
    mode: 'remote' | 'local-only';
    at: string;
    /** File không gửi qua web được (quá lớn...), team sẽ liên hệ khách để nhận. */
    skipped: { name: string; reason: string }[];
  };
}
