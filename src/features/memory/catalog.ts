/**
 * Danh sách kỷ niệm demo, đọc thẳng từ thư mục src/assets/memories.
 *
 *   src/assets/memories/<MÃ>/photo.jpg|png|webp   ảnh in trên khung (bắt buộc)
 *   src/assets/memories/<MÃ>/video.mp4             video phủ lên ảnh (bắt buộc, nên là MP4 H.264)
 *   src/assets/memories/<MÃ>/target.mind           dữ liệu nhận diện (tùy chọn, tạo bằng npm run memories:compile)
 *   src/assets/memories/<MÃ>/meta.json             { "title": "...", "message": "..." } (tùy chọn)
 *
 * Tên thư mục chính là mã khách nhập. Thêm thư mục mới là có mã mới, không cần sửa code.
 */

export interface MemoryMeta {
  title?: string;
  message?: string;
}

export interface Memory {
  code: string;
  photoUrl: string;
  videoUrl: string;
  /** null: chưa biên dịch sẵn, điện thoại sẽ tự biên dịch ở lần mở đầu tiên. */
  targetUrl: string | null;
  title: string | null;
  message: string | null;
}

const PHOTO_EXT = ['webp', 'jpg', 'jpeg', 'png'];
/** Thứ tự ưu tiên: MP4 (H.264) chạy trên mọi trình duyệt di động, kể cả Safari. */
const VIDEO_EXT = ['mp4', 'm4v', 'mov', 'webm'];

/** Chuẩn hóa mã: bỏ khoảng trắng, gạch, dấu chấm; viết hoa. "demo-01 " thành "DEMO01". */
export function normalizeCode(input: string): string {
  return input.normalize('NFKC').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function parsePath(path: string): { dir: string; base: string; ext: string } | null {
  const parts = path.split('/');
  const file = parts.pop();
  const dir = parts.pop();
  if (!file || !dir) return null;
  const dot = file.lastIndexOf('.');
  if (dot <= 0) return null;
  return { dir, base: file.slice(0, dot).toLowerCase(), ext: file.slice(dot + 1).toLowerCase() };
}

function pick(files: Array<{ base: string; ext: string; url: string }>, name: string, exts: string[]): string | null {
  for (const ext of exts) {
    const exact = files.find((f) => f.base === name && f.ext === ext);
    if (exact) return exact.url;
  }
  for (const ext of exts) {
    const any = files.find((f) => f.ext === ext);
    if (any) return any.url;
  }
  return null;
}

/** Hàm thuần để test: nhận map đường dẫn file sang URL và map meta.json. */
export function buildCatalog(fileUrls: Record<string, string>, metas: Record<string, MemoryMeta>): Map<string, Memory> {
  const byDir = new Map<string, Array<{ base: string; ext: string; url: string }>>();
  for (const [path, url] of Object.entries(fileUrls)) {
    const p = parsePath(path);
    if (!p) continue;
    const list = byDir.get(p.dir) ?? [];
    list.push({ base: p.base, ext: p.ext, url });
    byDir.set(p.dir, list);
  }

  const metaByDir = new Map<string, MemoryMeta>();
  for (const [path, meta] of Object.entries(metas)) {
    const p = parsePath(path);
    if (p) metaByDir.set(p.dir, meta);
  }

  const catalog = new Map<string, Memory>();
  for (const [dir, files] of byDir) {
    const code = normalizeCode(dir);
    const photoUrl = pick(files, 'photo', PHOTO_EXT);
    const videoUrl = pick(files, 'video', VIDEO_EXT);
    if (!code || !photoUrl || !videoUrl) continue;
    const meta = metaByDir.get(dir) ?? {};
    catalog.set(code, {
      code,
      photoUrl,
      videoUrl,
      targetUrl: pick(files, 'target', ['mind']),
      title: meta.title?.trim() || null,
      message: meta.message?.trim() || null,
    });
  }
  return catalog;
}

const FILES = import.meta.glob('/src/assets/memories/*/*.{webp,jpg,jpeg,png,JPG,JPEG,PNG,mp4,m4v,mov,webm,MP4,MOV,mind}', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const METAS = import.meta.glob('/src/assets/memories/*/meta.json', { import: 'default', eager: true }) as Record<string, MemoryMeta>;

const CATALOG = buildCatalog(FILES, METAS);

export function findMemory(code: string): Memory | null {
  return CATALOG.get(normalizeCode(code)) ?? null;
}

export function listMemoryCodes(): string[] {
  return [...CATALOG.keys()].sort();
}
