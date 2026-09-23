/**
 * ĐIỂM CẮM AR THẬT: thay MockARAdapter bằng adapter thật tại đây.
 * Ví dụ: export const arAdapter: ARAdapter = new RealARAdapter(config);
 */
import type { ARAdapter } from './ARAdapter';
import { MockARAdapter } from './MockARAdapter';

export const arAdapter: ARAdapter = new MockARAdapter();
export type { ARAdapter } from './ARAdapter';
