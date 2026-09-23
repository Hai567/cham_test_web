/**
 * Lấy dữ liệu nhận diện (.mind) cho một kỷ niệm.
 * 1. Có target.mind biên dịch sẵn: tải về, nhanh nhất.
 * 2. Chưa có: biên dịch ngay trên điện thoại từ photo, rồi lưu vào Cache Storage để lần sau mở tức thì.
 */
import type { Memory } from './catalog';
import { loadMindAR } from './mindar';

/** Phải khớp với TARGET_MAX_SIDE trong scripts/compile-memory-targets.mjs. */
export const TARGET_MAX_SIDE = 1024;
const CACHE_NAME = 'cham-memory-targets-v1';

export type TargetProgress = (percent: number) => void;

export async function loadTarget(memory: Memory, onProgress?: TargetProgress): Promise<ArrayBuffer> {
  if (memory.targetUrl) {
    const res = await fetch(memory.targetUrl);
    if (!res.ok) throw new Error(`Không tải được ${memory.targetUrl} (${res.status})`);
    return res.arrayBuffer();
  }

  const key = cacheKey(memory.photoUrl);
  const cached = await readCache(key);
  if (cached) return cached;

  onProgress?.(0);
  const [{ Compiler }, image] = await Promise.all([loadMindAR(), loadImage(memory.photoUrl)]);
  const compiler = new Compiler();
  await compiler.compileImageTargets([downscale(image, TARGET_MAX_SIDE)], (p) => onProgress?.(Math.min(99, p)));
  const data = compiler.exportData();
  const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  await writeCache(key, buffer);
  onProgress?.(100);
  return buffer;
}

function cacheKey(photoUrl: string): string {
  const url = new URL(photoUrl, window.location.href);
  url.searchParams.set('mindar-target', String(TARGET_MAX_SIDE));
  return url.toString();
}

async function readCache(key: string): Promise<ArrayBuffer | null> {
  try {
    if (!('caches' in window)) return null;
    const hit = await (await caches.open(CACHE_NAME)).match(key);
    return hit ? await hit.arrayBuffer() : null;
  } catch {
    return null;
  }
}

async function writeCache(key: string, buffer: ArrayBuffer): Promise<void> {
  try {
    if (!('caches' in window)) return;
    await (await caches.open(CACHE_NAME)).put(key, new Response(buffer, { headers: { 'Content-Type': 'application/octet-stream' } }));
  } catch {
    /* hết dung lượng hoặc chế độ riêng tư: lần sau biên dịch lại, không sao */
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Không tải được ảnh ${src}`));
    img.src = src;
  });
}

function downscale(img: HTMLImageElement, maxSide: number): HTMLCanvasElement {
  const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * k);
  canvas.height = Math.round(img.naturalHeight * k);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D không khả dụng');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Một lần chuẩn bị dữ liệu nhận diện cho mỗi mã, dùng chung giữa màn hình "sẵn sàng" và camera
 * (và không biên dịch hai lần khi React StrictMode chạy effect hai lần).
 */
export class TargetJob {
  readonly promise: Promise<ArrayBuffer>;
  progress: number | null = null;
  private readonly listeners = new Set<() => void>();

  constructor(memory: Memory) {
    this.promise = loadTarget(memory, (p) => {
      this.progress = p;
      this.listeners.forEach((l) => l());
    });
    this.promise.catch(() => {
      if (jobs.get(memory.code) === this) jobs.delete(memory.code); // lần sau thử lại từ đầu
    });
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

const jobs = new Map<string, TargetJob>();

export function targetJob(memory: Memory): TargetJob {
  let job = jobs.get(memory.code);
  if (!job) {
    job = new TargetJob(memory);
    jobs.set(memory.code, job);
  }
  return job;
}
