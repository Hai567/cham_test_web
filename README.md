# Chạm, MVP web app

> Không chỉ là ảnh, mà là những gì bạn muốn kể.

Khung ảnh in 15 × 20 cm có QR ở mặt sau. Người nhận quét QR, mở camera trên trình duyệt, hướng vào ảnh và ảnh "sống lại" bằng video. Bản này là MVP để trình bày: **không AI, không backend, không payment, không shipping, không đăng nhập**. Phần AR là **bản mô phỏng** đặt sau một adapter để cắm code AR thật sau.

## Chạy nhanh

Yêu cầu Node 20+ (đã kiểm tra với Node 22, npm 10).

```bash
npm install
npm run dev          # http://localhost:5173
```

| Lệnh | Mục đích |
| --- | --- |
| `npm run dev` | Chạy development |
| `npm run typecheck` | TypeScript strict |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (unit + smoke) |
| `npm run build` | Build production vào `dist/` |
| `npm run preview` | Chạy thử bản build |
| `npm run build:single` | Build 1 file HTML duy nhất `dist-single/index.html` (HashRouter), mở trực tiếp bằng trình duyệt, không cần server |
| `npm run dev:phone` | Dev qua HTTPS trong mạng LAN để thử camera trên điện thoại |
| `npm run memories:compile` | Tạo `target.mind` cho các kỷ niệm trong `src/assets/memories` |
| `npm run check` | typecheck + lint + test + build |

Deploy `dist/` lên hosting tĩnh bất kỳ, cần cấu hình SPA fallback về `index.html` (Netlify/Vercel/Cloudflare Pages đều hỗ trợ). Nếu không cấu hình được, dùng `build:single`.

## Presentation mode (buổi thứ Năm)

Mở **`/demo`**. Trang tự nạp 7 đơn mẫu hư cấu và có:

1. **Bắt đầu luồng khách (Mode A)**: nạp sẵn bản nháp golden path (ảnh biển + video cùng khoảnh khắc, dịp kỷ niệm), không cần tải file thật.
2. **Mở trang vận hành** (`/admin`): Editing, Gửi preview, (khách duyệt ở `/order/:id`), Printing, AR linking, Tạo liên kết AR và QR, QC đạt, Packing, Shipping, Completed.
3. **Mô phỏng người nhận**: quét, cấp quyền camera (có thể bấm Từ chối để xem hướng dẫn), video phủ lên ảnh, nút "Chạm để bật âm thanh".
4. **Đặt lại demo**: xóa toàn bộ dữ liệu trên trình duyệt và nạp lại đơn mẫu.

Mọi thứ chạy offline sau khi trang đã tải (font Be Vietnam Pro tải từ Google Fonts, nếu offline sẽ dùng font hệ thống).

## Routes

| Route | Nội dung |
| --- | --- |
| `/` | Landing |
| `/order` | Wizard đặt quà (9 bước nhánh Chạm dựng, 8 bước nhánh video hoàn chỉnh) |
| `/order/:id` | Mã đơn, timeline, duyệt/yêu cầu sửa, chọn frame, xem thử AR |
| `/admin`, `/admin/:id` | Vận hành: danh sách, lọc, chuyển trạng thái, ghi chú, preview, QC, AR |
| `/demo` | Presentation mode |
| `/ar/:experienceId` | Trang mà QR trỏ tới (người nhận), bản mô phỏng |
| `/memory`, `/memory/:code` | Xem kỷ niệm bằng camera: nhập mã, AR thật phát video đè lên ảnh in. Xem `docs/MEMORY_AR.md` |

## Cấu trúc

```
src/
  config/business.ts        Mọi hằng số business và giới hạn upload (một chỗ duy nhất)
  domain/                   Pure functions, không phụ thuộc React
    experienceRules.ts      Eligibility A/B/C
    media.ts                Validate upload, đếm, đổi thứ tự, frameSecond
    draft.ts                Bản nháp, reconcile khi media/nhánh thay đổi
    wizard.ts               Danh sách bước theo nhánh, validate từng bước
    orderState.ts           State machine 14 trạng thái, revision, QC, frame
    templates.ts            9 template (3 mode × 3 cảm xúc)
  data/                     OrderRepository, MediaStorage (IndexedDB, fallback bộ nhớ), seed
  ar/                       ARAdapter interface, MockARAdapter, điểm cắm (index.ts)
  services.ts               Composition root cho data layer
  features/                 order (wizard), orders (hiển thị đơn), ar (mô phỏng), demo
  pages/                    Các route
  test/                     Smoke test golden path + các route
docs/
  BUSINESS_RULES.md         Business rules, eligibility, trạng thái đơn
  AR_INTEGRATION.md         Cách cắm code AR thật, những gì đang mock
```

## Trang giới thiệu (landing)

Trang `/` là trang công khai theo bộ nhận diện Chạm (bảng màu Deep Cocoa / Ivory / Cream / Blush / Taupe / Sand, font serif cho tiêu đề). Gồm 8 phần: Hero, Product Magic, How It Works, Product + Why Chạm, Experience Types, Story + Team, Final CTA, Footer. Điều hướng bằng anchor. Link nội bộ (Bản trình bày, Vận hành) được ẩn khỏi landing nhưng route vẫn chạy tại `/demo` và `/admin`.

Các phần landing nằm trong `src/features/landing/`, mỗi phần một component, dựng theo mockup chính thức. Toàn bộ ảnh ở `src/assets/landing/` được cắt từ mockup, xóa chữ in sẵn, rồi phóng lớn x4 bằng mô hình siêu phân giải EDSR và làm nét để hiển thị ở kích thước thật. Kích thước các phần co giãn theo bề ngang màn hình (thiết kế chuẩn 1440px, hero cao 40% bề ngang). Đây là ảnh tham chiếu, cần thay bằng ảnh sản phẩm thật (giữ nguyên tên file). Email hello@cham.vn và ảnh đội ngũ lấy theo mockup, cần xác nhận trước khi công bố.

## Nhận đơn hàng (Google Sheet + Drive + email)

Mặc định (không cấu hình gì), đơn chỉ lưu trên trình duyệt của khách: dùng để chạy thử. Để đơn thật về tới team, cài Google Apps Script theo `backend/apps-script/README.md` rồi build với biến `VITE_ORDER_ENDPOINT` (xem `.env.example`). Lớp gửi đơn nằm ở `src/data/OrderSubmitter.ts`, `src/data/AppsScriptSubmitter.ts`, chọn tại `src/services.ts`.

## Giả định đã đưa ra

- **Người dùng:** khách và vận hành dùng chung một trình duyệt trong MVP (không có backend). `/admin` không có đăng nhập, chỉ dùng nội bộ.
- **Lưu trữ:** metadata đơn và bản nháp ở `localStorage`; file ảnh/video ở IndexedDB trên thiết bị. Nếu IndexedDB không khả dụng (ví dụ chế độ ẩn danh một số trình duyệt), file chỉ giữ trong bộ nhớ và UI báo rõ file sẽ mất khi tải lại trang. Không file nào được gửi ra ngoài.
- **Liên hệ:** bước cuối yêu cầu tên và số điện thoại/email để Chạm gửi preview (thủ công). Không gửi email/SMS.
- **Trích frame:** 3 frame đề xuất trong mô phỏng lấy ở 20% / 50% / 80% thời lượng video. Thực tế Chạm chọn thủ công.
- **Kiểm tra video hoàn chỉnh:** đọc thời lượng, kích thước ngay trên trình duyệt, chỉ cảnh báo (không chặn) khi lệch tỷ lệ 3:4 hoặc thời lượng đề xuất; chặn khi chưa xác nhận quyền nội dung/âm thanh.
- **Revision:** mỗi lần khách (hoặc vận hành ghi nhận thay khách) yêu cầu sửa tính 1 vòng; tối đa 2. Sau khi duyệt, video bị khóa.
- **QC:** không đạt thì quay về Printing hoặc AR linking; phải ghi lý do.
- **Mã đơn:** `CHAM-YYMM-XXXX`, bỏ các ký tự dễ nhầm (0/O, 1/I/L).
- **Đơn mẫu:** tên dạng "Khách mẫu ...", gắn nhãn "Dữ liệu mẫu", không phải dữ liệu khách thật.

## Kết quả kiểm tra

- `npm run typecheck`, `npm run lint` (0 lỗi, 0 cảnh báo), `npm run test` (59 test), `npm run build`, `npm run build:single`: pass.
- Chạy thật trên Chromium headless (bản build): golden path Mode A từ `/demo` đến lúc AR mô phỏng phát video, gồm 1 vòng sửa, lỗi AR adapter rồi thử lại, QC, hoàn thành; nhánh video hoàn chỉnh (8 bước, chặn video thứ 3, chặn khi chưa xác nhận quyền). Không lỗi JS trong console.
- Không có horizontal scroll ở 375 / 768 / 1024 / 1440 px trên mọi route chính.

## Giới hạn còn lại của MVP

- Không có backend: đơn và file chỉ nằm trên trình duyệt đã tạo. Mở `/order/:id` hoặc QR trên máy khác sẽ không thấy đơn. Đây là lý do đầu tiên cần backend sau buổi trình bày.
- AR là mô phỏng: không dùng camera, không nhận diện ảnh. Kiểm tra độ "dễ nhận diện" của ảnh in cần code AR thật.
- Không upload file lên server, không email/SMS, không payment, không shipping.
- Chưa có đăng nhập cho vận hành.
- Preview video là minh họa; video thật do Chạm dựng bằng CapCut Pro bên ngoài app.
- Nhạc "được cấp phép" hiện chỉ là lựa chọn trong form; kho nhạc và giấy phép cần quy trình riêng.
- Chưa có kiểm thử trên thiết bị iOS/Android thật (autoplay, IndexedDB dung lượng lớn).
