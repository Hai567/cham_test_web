# Xem kỷ niệm bằng camera (`/memory`)

Người nhận nhập mã in ở mặt sau khung, mở camera, hướng vào ảnh; video kỷ niệm phát đè đúng lên ảnh và bám theo khi di máy. Đây là AR thật (nhận diện ảnh bằng MindAR, vẽ bằng three.js), khác với bản mô phỏng ở `/ar/:experienceId`.

## Luồng

1. `/memory`: nhập mã. Mã được chuẩn hóa (`demo-01` thành `DEMO01`). QR có thể trỏ thẳng tới `/memory/DEMO01`.
2. `/memory/:code`: màn hình sẵn sàng. Ngay khi tìm thấy mã, trang tải trước dữ liệu nhận diện và engine AR.
3. Bấm **Mở camera**: camera sau mở toàn màn hình, khung ngắm hướng dẫn, tìm thấy ảnh thì video hiện dần và phát. Mất dấu ảnh thì video mờ đi và tạm dừng, thấy lại thì phát tiếp. Âm thanh tắt mặc định, có nút bật.

## Thêm một mã

```
src/assets/memories/<MÃ>/
  photo.jpg | photo.png | photo.webp   ảnh in trên khung (bắt buộc)
  video.mp4                            video phủ lên ảnh (bắt buộc)
  target.mind                          dữ liệu nhận diện (nên có, xem bên dưới)
  meta.json                            { "title": "...", "message": "..." } (tùy chọn)
```

Tên thư mục là mã. Sau khi thêm, chạy:

```bash
npm run memories:compile        # tạo target.mind cho thư mục chưa có
```

Không có `target.mind` trang vẫn chạy: điện thoại tự biên dịch ở lần mở đầu (vài giây, giao diện có thể khựng lúc đó) rồi lưu vào bộ nhớ trình duyệt. Có sẵn file thì camera nhận ảnh ngay.

### Yêu cầu nội dung để bám chính xác

- **Ảnh**: dùng đúng file đã in (cùng khung cắt). Ảnh nhiều chi tiết, tương phản rõ thì bám tốt; ảnh trơn (trời, tường trắng) khó nhận. Không cần độ phân giải cao, script tự thu về cạnh dài 1024 px.
- **Video**: cùng khung hình với ảnh in (video được cắt kiểu cover vào đúng tỉ lệ ảnh). MP4 H.264, đặt moov ở đầu file để phát ngay:
  ```bash
  ffmpeg -i vao.mov -c:v libx264 -crf 22 -preset slow -vf "scale='min(1080,iw)':-2" -g 30 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart video.mp4
  ```
- **Khung vật lý**: không kính (chói làm mất dấu), đủ sáng.

## Chạy thử trên điện thoại

Camera chỉ mở qua HTTPS (hoặc localhost). Trong mạng LAN:

```bash
npm run dev:phone   # https://<ip-máy>:5173, chấp nhận cảnh báo chứng chỉ tự ký
```

Mẫu `DEMO01`: mở `src/assets/memories/DEMO01/photo.webp` trên màn hình máy tính rồi hướng điện thoại vào.

## Kỹ thuật

| File | Vai trò |
| --- | --- |
| `src/features/memory/catalog.ts` | Đọc thư mục `src/assets/memories` bằng `import.meta.glob` |
| `src/features/memory/targets.ts` | Tải `target.mind` hoặc biên dịch trên máy + cache (Cache Storage) |
| `src/features/memory/MemoryAREngine.ts` | Camera, MindAR Controller, three.js, làm mượt, vòng vẽ |
| `src/features/memory/MemoryCamera.tsx` | Giao diện camera: khung ngắm, âm thanh, lỗi |
| `src/features/memory/arMath.ts` | Phép tính thuần (FOV khớp object-fit cover, cắt UV, làm mượt), có test |
| `src/pages/MemoryPage.tsx` | Trang nhập mã và màn hình sẵn sàng |
| `scripts/compile-memory-targets.mjs` | Biên dịch `target.mind` trong Node (CPU, không cần trình duyệt) |

Vì sao mượt: hình camera là thẻ `<video>` gốc; bộ nhận diện chạy trên khung thu nhỏ (cạnh ngắn 480, đúng kích thước MindAR tối ưu) trong khi hiển thị 720p; pose từ MindAR về không đều nhịp nên vòng vẽ theo tần số màn hình nội suy tới pose mới nhất (bám nhanh hơn khi di máy mạnh); chỉ vẽ WebGL khi video đang hiện; mép video mờ 1,5% để hòa vào ảnh in.

Mọi thông số tinh chỉnh nằm trong `AR_TUNING` (`MemoryAREngine.ts`): bộ lọc rung, số khung trước khi hiện/ẩn, độ mượt, độ mờ mép.

Code chỉ lấy lớp `Controller` và `Compiler` của MindAR, không dùng `MindARThree` (lớp này import `sRGBEncoding` đã bị xóa khỏi three.js từ r162 nên hỏng với three.js hiện tại).

### Gói `canvas` bị thay bằng stub

`mind-ar` khai báo phụ thuộc `canvas` (gói native của Node, chỉ dùng cho trình biên dịch offline của MindAR). Gói này hay làm `npm install` lỗi (thiếu cairo, không có bản dựng sẵn cho Node mới, lỗi trên Vercel). `package.json` dùng `overrides` để thay bằng `stubs/canvas`, một gói rỗng. Trình duyệt không dùng tới nó; script biên dịch của repo cũng không cần.

### Đã kiểm tra

- Chromium headless với camera giả quay ảnh in nghiêng trong không gian 3D (phép chiếu pinhole thật, FOV 45° và 65°): video phủ lệch 1 đến 2 px trên ảnh cao 340 đến 530 px.
- Chưa đo trên điện thoại thật. Việc cần đo đầu tiên: thời gian từ lúc bấm Mở camera tới lúc thấy video (bước biên dịch shader GPU lần đầu của MindAR, dự kiến 1 đến 2 giây trên máy thật).

### Giới hạn

- `npm run build:single` nhúng mọi video và `.mind` vào một file HTML, không hợp với trang này khi có nhiều mã.
- Kỷ niệm nằm trong mã nguồn (demo). Khi có backend: thay `catalog.ts` bằng API trả về URL ảnh/video/target, phần còn lại giữ nguyên.
- Mỗi lần chỉ bám một ảnh (`maxTrack: 1`).
