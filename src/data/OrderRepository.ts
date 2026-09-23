import type { Order } from '../domain/types';

/**
 * Hợp đồng lưu trữ đơn hàng. MVP dùng LocalOrderRepository (localStorage).
 * Khi có backend, tạo HttpOrderRepository implement interface này và đổi trong src/services.ts.
 */
export interface OrderRepository {
  list(): Promise<Order[]>;
  get(id: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
  saveMany(orders: Order[]): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
  /** Lắng nghe thay đổi (kể cả từ tab khác). Trả về hàm hủy. */
  subscribe(listener: () => void): () => void;
}
