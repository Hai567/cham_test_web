import data from './touchData.json';

/** Dữ liệu dựng sẵn cho cảnh Chạm, sinh từ ảnh bàn tay T2 và tấm ảnh kỷ niệm. Không sửa tay. */
export const SCENE = data.scene as {
  n: number;
  stride: number;
  touch: [number, number];
  pc: [number, number];
  pw: number;
  ph: number;
  ang: number;
  img: [number, number];
};
/** Mỗi chấm 12 số: x, y, bán kính (trên bàn tay, hệ toạ độ ảnh tay mẹ), u, v (đích trong tấm ảnh), màu đích RGB, màu gốc RGB, độ trễ. */
export const DOTS: readonly number[] = data.dots;
