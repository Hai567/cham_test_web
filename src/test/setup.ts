import { afterEach } from 'vitest';

// jsdom chưa có IntersectionObserver; landing dùng nó để chạy hiệu ứng "sống lại".
// Stub tối thiểu để test render được (không cần theo dõi thật).
if (!('IntersectionObserver' in globalThis)) {
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  // @ts-expect-error gán stub cho môi trường test
  globalThis.IntersectionObserver = IO;
}

afterEach(() => {
  localStorage.clear();
});
