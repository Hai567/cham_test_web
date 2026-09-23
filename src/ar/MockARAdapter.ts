import QRCode from 'qrcode';
import { BUSINESS } from '../config/business';
import { appUrl } from '../lib/appUrl';
import { ARAdapterError, type ARAdapter, type ARExperienceInput, type ARExperienceResult, type ARExperienceStatus, type TargetImageInput, type TargetValidationResult } from './ARAdapter';

const KEY = 'cham.ar-mock.v1';
export const AR_FAIL_FLAG = 'cham.demo.arFail';

interface MockRecord {
  orderId: string;
  status: ARExperienceStatus;
  createdAt: string;
}

export interface MockOptions {
  delayMs?: number;
  shouldFail?: () => boolean;
}

/**
 * Bản mô phỏng AR để demo. KHÔNG phải AR engine: không nhận diện ảnh,
 * chỉ trả dữ liệu ổn định và link tới trang mô phỏng /ar/:experienceId.
 */
export class MockARAdapter implements ARAdapter {
  readonly name = 'Bản mô phỏng AR';
  readonly isMock = true;
  private readonly delayMs: number;
  private readonly shouldFail: () => boolean;

  constructor(opts: MockOptions = {}) {
    this.delayMs = opts.delayMs ?? 500;
    this.shouldFail = opts.shouldFail ?? (() => readFlag());
  }

  private async wait() {
    if (this.delayMs > 0) await new Promise((r) => setTimeout(r, this.delayMs));
    if (this.shouldFail()) throw new ARAdapterError('AR adapter không phản hồi (lỗi mô phỏng). Thử lại sau hoặc tắt chế độ mô phỏng lỗi.');
  }

  private read(): Record<string, MockRecord> {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, MockRecord>;
    } catch {
      return {};
    }
  }

  private write(data: Record<string, MockRecord>) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* dữ liệu mock không quan trọng */
    }
  }

  async validateTarget(input: TargetImageInput): Promise<TargetValidationResult> {
    await this.wait();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.kind === 'frame_request') {
      warnings.push('Frame trích từ video thường kém nét hơn ảnh chụp. Chạm sẽ chọn 3 frame đủ chất lượng để bạn chọn.');
    } else if (!input.mediaId) {
      errors.push('Chưa có ảnh dùng để in.');
    } else if (input.width && input.height) {
      const { width: pw, height: ph } = BUSINESS.printResolution;
      const ratio = input.width / input.height;
      if (input.width > input.height) {
        warnings.push(`Ảnh đang nằm ngang. Khung là ảnh dọc ${BUSINESS.frame.label}, ảnh sẽ bị cắt nhiều hai bên.`);
      } else if (Math.abs(ratio - BUSINESS.outputRatio.w / BUSINESS.outputRatio.h) > 0.03) {
        warnings.push(`Ảnh sẽ được cắt theo tỷ lệ ${BUSINESS.outputRatio.label}.`);
      }
      if (input.width < pw || input.height < ph) {
        warnings.push(`Ảnh ${input.width} × ${input.height} px thấp hơn chuẩn in ${pw} × ${ph} px, bản in có thể kém nét.`);
      }
    }
    warnings.push('Bản mô phỏng chưa kiểm tra độ chi tiết để camera nhận diện. Kiểm tra này cần code AR thật.');
    return { ok: errors.length === 0, errors, warnings };
  }

  async createExperience(input: ARExperienceInput): Promise<ARExperienceResult> {
    await this.wait();
    if (input.videoMediaIds.length === 0) throw new ARAdapterError('Cần ít nhất 1 video để tạo trải nghiệm AR.');
    const experienceId = `mock-${input.orderId.toLowerCase()}`;
    const data = this.read();
    data[experienceId] = { orderId: input.orderId, status: 'ready', createdAt: new Date().toISOString() };
    this.write(data);
    return { experienceId, status: 'ready' };
  }

  async generateLaunchLink(experienceId: string): Promise<string> {
    return appUrl(`/ar/${encodeURIComponent(experienceId)}`);
  }

  async generateQrCode(launchUrl: string): Promise<string> {
    return QRCode.toDataURL(launchUrl, { margin: 1, width: 320, color: { dark: '#3A2D29', light: '#FCF9F4' } });
  }

  async getStatus(experienceId: string): Promise<ARExperienceStatus> {
    return this.read()[experienceId]?.status ?? 'not_found';
  }
}

function readFlag(): boolean {
  try {
    return localStorage.getItem(AR_FAIL_FLAG) === '1';
  } catch {
    return false;
  }
}

export function setSimulateArFailure(on: boolean) {
  try {
    if (on) localStorage.setItem(AR_FAIL_FLAG, '1');
    else localStorage.removeItem(AR_FAIL_FLAG);
  } catch {
    /* bỏ qua */
  }
}

export function isSimulatingArFailure() {
  return readFlag();
}
