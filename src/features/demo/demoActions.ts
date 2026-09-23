import { arAdapter } from '../../ar';
import { clearDraft, saveDraft } from '../../data/draftStore';
import { buildSeedOrders, createGoldenPathDraft } from '../../data/seed';
import { getMediaStorage, orderRepository } from '../../services';

export async function seedDemoOrders(): Promise<void> {
  const orders = await buildSeedOrders(arAdapter);
  await orderRepository.saveMany(orders);
}

export async function ensureDemoOrders(): Promise<void> {
  const existing = await orderRepository.list();
  if (!existing.some((o) => o.isDemo)) await seedDemoOrders();
}

/** Xóa toàn bộ đơn, bản nháp, file trên thiết bị và nạp lại dữ liệu mẫu. */
export async function resetDemo(): Promise<void> {
  await orderRepository.clear();
  clearDraft();
  try {
    localStorage.removeItem('cham.ar-mock.v1');
  } catch {
    /* bỏ qua */
  }
  await getMediaStorage()
    .then((s) => s.clear())
    .catch(() => undefined);
  await seedDemoOrders();
}

export function startGoldenPath(): boolean {
  return saveDraft(createGoldenPathDraft());
}
