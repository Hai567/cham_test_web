# Nối đơn hàng về cho team (Google Sheet + Drive + email)

Khi khách bấm "Gửi yêu cầu", web gửi đơn tới một Google Apps Script. Script:

1. Ghi đơn thành một dòng trong **Google Sheet**.
2. Lưu ảnh, video của đơn vào một **thư mục riêng trong Google Drive** (mỗi đơn một thư mục, tên là mã đơn).
3. Gửi **email báo đơn mới** cho team, kèm link thư mục.

Không cần máy chủ, không tốn phí. Làm một lần, khoảng 15 phút.

## Các bước

1. **Tạo Google Sheet trống** (ví dụ tên "Chạm: Đơn hàng"). Mở ra, copy ID nằm giữa `/d/` và `/edit` trên thanh địa chỉ.
2. **Tạo thư mục trong Google Drive** (ví dụ "Chạm: File khách gửi"). Để **riêng tư**, chỉ chia sẻ cho người trong team. Mở thư mục, copy ID ở cuối thanh địa chỉ.
3. Vào <https://script.google.com> bằng **tài khoản Google sở hữu Sheet và thư mục trên**, bấm **Dự án mới**.
4. Xóa code mẫu, dán toàn bộ nội dung `Code.gs` vào.
5. Vào **Cài đặt dự án** (biểu tượng bánh răng), bật "Hiển thị tệp kê khai appsscript.json". Quay lại trình chỉnh sửa, mở `appsscript.json`, dán nội dung file `appsscript.json` ở thư mục này.
6. Trong `Code.gs`, điền phần `CONFIG`:
   - `SHEET_ID`: ID ở bước 1.
   - `ROOT_FOLDER_ID`: ID ở bước 2.
   - `NOTIFY_EMAILS`: email nhận báo đơn, cách nhau bằng dấu phẩy.
   - `SHARED_KEY`: tùy chọn, một chuỗi bất kỳ (xem phần Bảo mật).
7. Bấm **Triển khai → Tùy chọn triển khai mới → Ứng dụng web**:
   - Thực thi dưới dạng: **Tôi**.
   - Người có quyền truy cập: **Bất kỳ ai**.
   - Bấm Triển khai, đồng ý cấp quyền (Google sẽ cảnh báo "ứng dụng chưa được xác minh": chọn Nâng cao, rồi Đi tới dự án).
   - Copy **URL ứng dụng web** (kết thúc bằng `/exec`).
8. **Phía web:** tạo file `.env.production` ở thư mục gốc dự án:
   ```
   VITE_ORDER_ENDPOINT=URL_ở_bước_7
   VITE_ORDER_KEY=chuỗi_giống_SHARED_KEY_nếu_có
   ```
   Build lại (`npm run build`) và đưa bản build lên host.
9. **Thử:** đặt một đơn thật trên web với 1 ảnh. Kiểm tra: có dòng mới trong Sheet, có thư mục mang mã đơn trong Drive, và email báo đơn mới.

Mở URL ở bước 7 trên trình duyệt: thấy `{"ok":true,"service":"cham-orders"}` là script đang chạy.

**Sửa code sau khi đã triển khai:** phải vào Triển khai → Quản lý triển khai → sửa → chọn Phiên bản mới. Nếu tạo bản triển khai mới hoàn toàn, URL sẽ đổi và phải build lại web.

## Giới hạn cần biết

- **Mỗi file tối đa 30MB** (giới hạn của Apps Script). File lớn hơn, thường là video dài, sẽ không gửi qua web: đơn vẫn được tạo, khách thấy thông báo "Chạm sẽ nhắn bạn để nhận file", email báo đơn ghi rõ file nào còn thiếu, và cột "File chưa nhận" trong Sheet cũng ghi lại.
- **Email báo đơn** bị giới hạn theo hạn mức gửi mail hằng ngày của Google (tài khoản Gmail thường thấp hơn tài khoản Google Workspace). Đủ cho giai đoạn đầu.
- **Gửi lại an toàn:** nếu mạng rớt giữa chừng, khách bấm "Gửi lại". Script bỏ qua đơn và file đã nhận, không tạo trùng.
- **Chưa có báo qua Zalo:** gửi tin Zalo tự động cần Zalo Official Account (phải đăng ký, xác minh doanh nghiệp). Trước mắt dùng email; có thể bật thông báo trên điện thoại cho hộp thư nhận đơn.

## Bảo mật

- URL ứng dụng web là công khai (ai có link đều gửi được). Script chỉ nhận đúng định dạng mã đơn, chỉ nhận ảnh và video, giới hạn dung lượng, và chỉ ghi vào thư mục con của thư mục Chạm.
- `SHARED_KEY` chặn bớt spam tự động nhưng **không phải bí mật thật**, vì nó nằm trong code web ai cũng xem được.
- File của khách nằm trong Drive của tài khoản triển khai. Chỉ chia sẻ thư mục cho người cần xem, và ghi rõ trong chính sách bảo mật: ai xem được file, lưu bao lâu, xóa khi nào.
- Đây là giải pháp cho giai đoạn đầu. Khi đơn nhiều lên, nên chuyển sang backend thật: phía web chỉ cần một lớp gửi đơn mới cho `OrderSubmitter` (`src/data/OrderSubmitter.ts`), giao diện đặt hàng giữ nguyên.
