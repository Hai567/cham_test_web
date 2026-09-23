# Tích hợp code AR thật

Toàn bộ app chỉ biết tới interface `ARAdapter` (`src/ar/ARAdapter.ts`). Không component nào import code của vendor AR.

## Điểm cắm duy nhất

`src/ar/index.ts`:

```ts
export const arAdapter: ARAdapter = new MockARAdapter();
```

Thay bằng adapter thật, ví dụ:

```ts
import { RealARAdapter } from './RealARAdapter';
export const arAdapter: ARAdapter = new RealARAdapter({ /* cấu hình đọc từ biến môi trường, không hard-code secret */ });
```

## Interface cần implement

| Hàm | App gọi ở đâu | Kỳ vọng |
| --- | --- | --- |
| `validateTarget(input)` | Wizard, bước "Ảnh in" (`TargetStep`) | Trả `{ ok, errors, warnings }`. Lỗi chặn bước, cảnh báo chỉ hiển thị. |
| `createExperience(input)` | Admin, bước AR linking (`AdminDetailPage` > Liên kết AR); seed | Tạo trải nghiệm từ ảnh in + video, trả `experienceId` và `status`. |
| `generateLaunchLink(id)` | Ngay sau `createExperience` | URL mà QR mở. Mock trả `/ar/:experienceId` của app. |
| `generateQrCode(url)` | Ngay sau link | Data URL ảnh QR để in mặt sau khung. |
| `getStatus(id)` | `ARLaunchPage` (`/ar/:experienceId`) | `processing` / `ready` / `failed` / `not_found`. |

Thuộc tính `name` và `isMock`: khi `isMock = false`, trang Admin tự ẩn công tắc "Mô phỏng lỗi AR adapter". Các nhãn "Bản mô phỏng AR" trong `ARPreview` và `ArLinkCard` cần được bỏ/đổi khi có AR thật.

Mọi lỗi nên ném `ARAdapterError` với thông điệp tiếng Việt dễ hiểu; UI đã có trạng thái lỗi và nút "Thử lại".

## Những gì đang mock

- `MockARAdapter` (`src/ar/MockARAdapter.ts`): độ trễ 500 ms, lưu trạng thái trải nghiệm vào `localStorage` (`cham.ar-mock.v1`), `experienceId = mock-<mã đơn>`, QR tạo bằng thư viện `qrcode`. Bật lỗi mô phỏng bằng công tắc trong Admin (key `cham.demo.arFail`).
- `ARPreview` (`src/features/ar/ARPreview.tsx`): khung điện thoại giả lập các pha xin quyền camera, quét, phát video. Không dùng camera, không nhận diện ảnh. Khi có AR thật, trang `/ar/:experienceId` nên khởi chạy engine thật thay cho `ARPreview`, giữ nguyên các trạng thái lỗi/không tìm thấy.
- Media: AR thật cần file ảnh in và video trên server. Hiện file chỉ nằm ở IndexedDB trên thiết bị, nên trước khi dùng AR thật cần backend lưu media (thay `MediaStorage` trong `src/services.ts`) và truyền URL/ID phía server vào `ARExperienceInput`.

## Việc cần làm khi tích hợp

1. Implement `ARAdapter` trong `src/ar/<Vendor>ARAdapter.ts`, chỉ file này được phụ thuộc SDK/API vendor.
2. Đổi một dòng trong `src/ar/index.ts`.
3. Thay nội dung `ARLaunchPage` bằng trình khởi chạy AR thật (giữ muted mặc định và nút "Chạm để bật âm thanh").
4. Viết test tương tự `src/ar/MockARAdapter.test.ts` cho adapter mới.
