/** Phép tính thuần cho lớp AR, tách riêng để test được mà không cần camera hay WebGL. */

/** MindAR dựng ma trận chiếu với góc nhìn dọc cố định 45 độ trên ảnh đầu vào. */
export const MINDAR_FOVY_DEG = 45;

/**
 * Kích thước khung hình đưa vào bộ nhận diện.
 * MindAR dò ảnh trên một ô vuông cạnh xấp xỉ (cạnh ngắn / 2) làm tròn lũy thừa 2.
 * Cạnh ngắn 480 cho ô 256 px, đúng kích thước MindAR được tinh chỉnh; lớn hơn thì chậm mà
 * không tăng độ chính xác lúc bám, nhỏ hơn thì ô dò chỉ còn 128 px và khó bắt ảnh.
 */
export function trackingSize(videoW: number, videoH: number, shortSide = 480): { w: number; h: number } {
  const k = Math.min(1, shortSide / Math.min(videoW, videoH));
  return { w: Math.round(videoW * k), h: Math.round(videoH * k) };
}

/**
 * Góc nhìn dọc (độ) cho camera 3D sao cho khớp đúng với video camera đang hiển thị kiểu
 * object-fit: cover trong khung containerW × containerH.
 * Không phụ thuộc độ phân giải bám ảnh vì phép chiếu của MindAR bất biến theo tỉ lệ.
 */
export function coverFovDeg(containerW: number, containerH: number, videoW: number, videoH: number): number {
  const displayScale = Math.max(containerW / videoW, containerH / videoH);
  const displayedVideoH = videoH * displayScale;
  const half = Math.atan((containerH / displayedVideoH) * Math.tan(((MINDAR_FOVY_DEG / 2) * Math.PI) / 180));
  return (2 * half * 180) / Math.PI;
}

/** Cắt video kiểu cover để lấp đúng khung ảnh (tỉ lệ rộng / cao), không méo, không hở viền. */
export function coverUv(videoAspect: number, targetAspect: number): { repeatX: number; repeatY: number; offsetX: number; offsetY: number } {
  if (!(videoAspect > 0) || !(targetAspect > 0)) return { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 };
  if (videoAspect > targetAspect) {
    const repeatX = targetAspect / videoAspect;
    return { repeatX, repeatY: 1, offsetX: (1 - repeatX) / 2, offsetY: 0 };
  }
  const repeatY = videoAspect / targetAspect;
  return { repeatX: 1, repeatY, offsetX: 0, offsetY: (1 - repeatY) / 2 };
}

/** Hệ số làm mượt theo thời gian thật: cùng một cảm giác ở 30, 60 hay 120 Hz. */
export function smoothingAlpha(dtMs: number, tauMs: number): number {
  if (tauMs <= 0) return 1;
  return 1 - Math.exp(-Math.max(0, dtMs) / tauMs);
}
