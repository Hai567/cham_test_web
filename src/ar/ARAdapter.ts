/**
 * Ranh giới duy nhất giữa app và công nghệ AR.
 * UI và domain KHÔNG được import code của vendor AR; chỉ dùng interface này.
 * Xem docs/AR_INTEGRATION.md để biết cách cắm code AR thật.
 */
import type { Mode } from '../domain/types';

export interface TargetImageInput {
  /** Media id của ảnh in; null khi khách yêu cầu trích frame. */
  mediaId: string | null;
  width?: number;
  height?: number;
  kind: 'uploaded_image' | 'demo_image' | 'frame_request';
}

export interface TargetValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export interface ARExperienceInput {
  orderId: string;
  mode: Mode;
  targetMediaId: string | null;
  videoMediaIds: string[];
}

export type ARExperienceStatus = 'processing' | 'ready' | 'failed' | 'not_found';

export interface ARExperienceResult {
  experienceId: string;
  status: ARExperienceStatus;
}

export interface ARAdapter {
  /** Tên hiển thị để UI ghi rõ khi đang dùng bản mô phỏng. */
  readonly name: string;
  readonly isMock: boolean;
  validateTarget(input: TargetImageInput): Promise<TargetValidationResult>;
  createExperience(input: ARExperienceInput): Promise<ARExperienceResult>;
  generateLaunchLink(experienceId: string): Promise<string>;
  generateQrCode(launchUrl: string): Promise<string>;
  getStatus(experienceId: string): Promise<ARExperienceStatus>;
}

export class ARAdapterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ARAdapterError';
  }
}
