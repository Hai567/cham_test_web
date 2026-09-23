/**
 * Video kỷ niệm được tạo ngay trong thao tác chạm "Mở camera" (không chờ tải three.js),
 * để iOS cho phép phát và bắt đầu nạp dữ liệu trước khi camera tìm thấy ảnh.
 */
const wanted = new WeakSet<HTMLVideoElement>();

export function createMemoryVideo(src: string): HTMLVideoElement {
  const v = document.createElement('video');
  v.crossOrigin = 'anonymous'; // cần nếu sau này video nằm trên CDN khác domain
  v.src = src;
  v.loop = true;
  v.muted = true;
  v.playsInline = true;
  v.setAttribute('playsinline', '');
  v.setAttribute('webkit-playsinline', '');
  v.preload = 'auto';
  v.disablePictureInPicture = true;
  return v;
}

/** Gọi trong trình xử lý chạm: phát rồi dừng ngay để trình duyệt nạp khung hình đầu. */
export function primeMemoryVideo(v: HTMLVideoElement): void {
  v.play()
    .then(() => {
      if (!wanted.has(v)) v.pause();
    })
    .catch(() => {
      /* sẽ thử lại khi tìm thấy ảnh */
    });
}

export function markMemoryVideoWanted(v: HTMLVideoElement, on: boolean): void {
  if (on) wanted.add(v);
  else wanted.delete(v);
}
