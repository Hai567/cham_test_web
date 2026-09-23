import type { Order } from '../domain/types';
import { StorageFullError, isQuotaError } from './errors';
import type { OrderRepository } from './OrderRepository';

const KEY = 'cham.orders.v1';
const EVENT = 'cham:orders-changed';

export class LocalOrderRepository implements OrderRepository {
  constructor(private readonly storage: Storage = window.localStorage) {}

  private read(): Order[] {
    try {
      const raw = this.storage.getItem(KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Order[]) : [];
    } catch {
      return [];
    }
  }

  private write(orders: Order[]) {
    try {
      this.storage.setItem(KEY, JSON.stringify(orders));
    } catch (err) {
      if (isQuotaError(err)) throw new StorageFullError();
      throw err;
    }
    window.dispatchEvent(new Event(EVENT));
  }

  async list() {
    return this.read().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(id: string) {
    return this.read().find((o) => o.id === id) ?? null;
  }

  async save(order: Order) {
    await this.saveMany([order]);
  }

  async saveMany(incoming: Order[]) {
    const byId = new Map(this.read().map((o) => [o.id, o]));
    for (const o of incoming) byId.set(o.id, o);
    this.write([...byId.values()]);
  }

  async remove(id: string) {
    this.write(this.read().filter((o) => o.id !== id));
  }

  async clear() {
    this.write([]);
  }

  subscribe(listener: () => void) {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) listener();
    };
    window.addEventListener(EVENT, listener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EVENT, listener);
      window.removeEventListener('storage', onStorage);
    };
  }
}
