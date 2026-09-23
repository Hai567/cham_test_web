import { useCallback, useEffect, useState } from 'react';
import type { Result } from '../../domain/orderState';
import type { Order } from '../../domain/types';
import { orderRepository } from '../../services';

export function useOrders() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    orderRepository
      .list()
      .then((o) => {
        setOrders(o);
        setError(null);
      })
      .catch(() => setError('Không đọc được danh sách đơn.'));
  }, []);
  useEffect(() => {
    load();
    return orderRepository.subscribe(load);
  }, [load]);
  return { orders, error, reload: load };
}

export function useOrder(id: string | undefined) {
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const load = useCallback(() => {
    if (!id) return setOrder(null);
    orderRepository
      .get(id)
      .then(setOrder)
      .catch(() => setOrder(null));
  }, [id]);
  useEffect(() => {
    load();
    return orderRepository.subscribe(load);
  }, [load]);

  /** Áp dụng một hành động domain rồi lưu. Trả về lỗi (nếu có) để UI hiển thị. */
  const apply = useCallback(async (result: Result): Promise<string | null> => {
    if (!result.ok) return result.error;
    try {
      await orderRepository.save(result.order);
      setOrder(result.order);
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : 'Không lưu được đơn.';
    }
  }, []);

  return { order, apply, reload: load };
}
