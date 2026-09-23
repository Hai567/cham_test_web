/**
 * Biên dịch ảnh của từng kỷ niệm thành file nhận diện MindAR (target.mind).
 *
 *   npm run memories:compile            chỉ biên dịch thư mục chưa có target.mind hoặc ảnh mới hơn
 *   npm run memories:compile -- --force biên dịch lại tất cả
 *   npm run memories:compile -- DEMO01  chỉ một mã
 *
 * Không có target.mind thì trang /memory vẫn chạy: điện thoại tự biên dịch lần đầu
 * (mất vài giây) rồi lưu lại. Chạy script này trước khi demo để camera nhận ảnh ngay.
 *
 * Chạy bằng CPU trong Node, không cần trình duyệt hay node-canvas.
 */
import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import * as tf from '@tensorflow/tfjs';
import 'mind-ar/src/image-target/detector/kernels/cpu/index.js';
import { CompilerBase } from 'mind-ar/src/image-target/compiler-base.js';
import { buildTrackingImageList } from 'mind-ar/src/image-target/image-list.js';
import { extractTrackingFeatures } from 'mind-ar/src/image-target/tracker/extract-utils.js';

// Phải khớp với TARGET_MAX_SIDE trong src/features/memory/targetCompiler.ts.
const TARGET_MAX_SIDE = 1024;
const PHOTO_EXT = ['jpg', 'jpeg', 'png', 'webp'];
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../src/assets/memories');

class NodeCompiler extends CompilerBase {
  // CompilerBase chỉ cần drawImage + getImageData, nên dùng canvas giả chứa sẵn pixel RGBA.
  createProcessCanvas(img) {
    return { getContext: () => ({ drawImage() {}, getImageData: () => ({ data: img.rgba }) }) };
  }

  compileTrack({ progressCallback, targetImages, basePercent }) {
    const list = [];
    const per = (100 - basePercent) / targetImages.length;
    let percent = 0;
    for (const targetImage of targetImages) {
      const imageList = buildTrackingImageList(targetImage);
      list.push(
        extractTrackingFeatures(imageList, () => {
          percent += per / imageList.length;
          progressCallback(basePercent + percent);
        }),
      );
    }
    return Promise.resolve(list);
  }
}

async function loadPhoto(path) {
  const { data, info } = await sharp(path)
    .rotate() // theo EXIF, giống cách trình duyệt hiển thị
    .resize({ width: TARGET_MAX_SIDE, height: TARGET_MAX_SIDE, fit: 'inside', withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, rgba: new Uint8ClampedArray(data) };
}

function findPhoto(dir) {
  const name = readdirSync(dir).find((f) => {
    const [base, ext] = f.toLowerCase().split('.');
    return base === 'photo' && PHOTO_EXT.includes(ext ?? '');
  });
  return name ? join(dir, name) : null;
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const only = args.filter((a) => !a.startsWith('--')).map((a) => a.toUpperCase());
  await tf.setBackend('cpu');

  if (!existsSync(ROOT)) {
    console.error(`Không thấy thư mục ${ROOT}`);
    process.exit(1);
  }
  const codes = readdirSync(ROOT).filter((d) => statSync(join(ROOT, d)).isDirectory());
  let built = 0;
  for (const code of codes) {
    if (only.length && !only.includes(code.toUpperCase())) continue;
    const dir = join(ROOT, code);
    const photo = findPhoto(dir);
    if (!photo) {
      console.warn(`- ${code}: thiếu photo.jpg/png/webp, bỏ qua`);
      continue;
    }
    const out = join(dir, 'target.mind');
    if (!force && existsSync(out) && statSync(out).mtimeMs >= statSync(photo).mtimeMs) {
      console.log(`- ${code}: target.mind đã mới, bỏ qua`);
      continue;
    }
    const started = Date.now();
    const img = await loadPhoto(photo);
    const compiler = new NodeCompiler();
    let last = -10;
    await compiler.compileImageTargets([img], (p) => {
      if (p - last >= 10) {
        last = p;
        process.stdout.write(`\r- ${code}: ${Math.round(p)}%   `);
      }
    });
    writeFileSync(out, Buffer.from(compiler.exportData()));
    built++;
    console.log(`\r- ${code}: xong (${img.width}×${img.height}, ${((Date.now() - started) / 1000).toFixed(1)} s)`);
  }
  console.log(built ? `Đã tạo ${built} file target.mind.` : 'Không có gì cần biên dịch.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
