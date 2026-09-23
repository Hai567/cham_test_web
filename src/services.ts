/**
 * Composition root: nơi duy nhất chọn implementation cụ thể cho data layer.
 * Đổi sang backend thật bằng cách thay các instance ở đây.
 */
import { LocalOrderRepository } from './data/LocalOrderRepository';
import { createMediaStorage } from './data/IndexedDbMediaStorage';
import type { MediaStorage } from './data/MediaStorage';
import type { OrderRepository } from './data/OrderRepository';
import { AppsScriptSubmitter } from './data/AppsScriptSubmitter';
import { LocalOnlySubmitter, type OrderSubmitter } from './data/OrderSubmitter';

export const orderRepository: OrderRepository = new LocalOrderRepository();

let mediaStoragePromise: Promise<MediaStorage> | null = null;
export function getMediaStorage(): Promise<MediaStorage> {
  mediaStoragePromise ??= createMediaStorage();
  return mediaStoragePromise;
}

/**
 * Nơi nhận đơn: đặt VITE_ORDER_ENDPOINT (URL Web App của Google Apps Script) lúc build.
 * Không đặt thì đơn chỉ lưu trên máy khách (chế độ demo).
 */
const endpoint = (import.meta.env.VITE_ORDER_ENDPOINT as string | undefined)?.trim();
const key = (import.meta.env.VITE_ORDER_KEY as string | undefined)?.trim() || undefined;
export const orderSubmitter: OrderSubmitter = endpoint ? new AppsScriptSubmitter(endpoint, { key }) : new LocalOnlySubmitter();
