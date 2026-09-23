/** Đọc kích thước ảnh / thời lượng video ngay trên thiết bị (không gửi đi đâu). */
export interface ProbeResult {
  width?: number;
  height?: number;
  durationSec?: number;
}

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>((r) => setTimeout(() => r(fallback), ms))]);
}

export function probeFile(file: File, kind: 'image' | 'video'): Promise<ProbeResult> {
  if (typeof URL.createObjectURL !== 'function') return Promise.resolve({});
  const url = URL.createObjectURL(file);
  const done = (r: ProbeResult) => {
    URL.revokeObjectURL(url);
    return r;
  };
  const p = new Promise<ProbeResult>((resolve) => {
    if (kind === 'image') {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({});
      img.src = url;
    } else {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.muted = true;
      v.onloadedmetadata = () =>
        resolve({
          width: v.videoWidth || undefined,
          height: v.videoHeight || undefined,
          durationSec: Number.isFinite(v.duration) ? v.duration : undefined,
        });
      v.onerror = () => resolve({});
      v.src = url;
    }
  });
  return withTimeout(p, 5000, {}).then(done);
}
