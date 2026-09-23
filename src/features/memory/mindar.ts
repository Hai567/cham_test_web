/** Tải MindAR (kèm TensorFlow.js, khoảng 2 MB) chỉ khi cần, một lần cho cả phiên. */
type MindARModule = typeof import('mind-ar/dist/mindar-image.prod.js');

let pending: Promise<MindARModule> | null = null;

export function loadMindAR(): Promise<MindARModule> {
  pending ??= import('mind-ar/dist/mindar-image.prod.js').catch((err: unknown) => {
    pending = null; // cho phép thử lại nếu mạng lỗi
    throw err;
  });
  return pending;
}
