# Business rules

Hằng số nằm tại `src/config/business.ts`: tối đa 10 ảnh, 2 video, 2 vòng sửa; khung dọc 15 × 20 cm không kính; tỷ lệ 3:4; video 1080 × 1440; file in 1772 × 2362 px (300 DPI); montage 30–45 giây; ảnh sống lại 8–15 giây; hoàn thành 3–5 ngày làm việc sau khi khách duyệt. Upload: ảnh JPG/JPEG/PNG/WEBP tối đa 15 MB, video MP4/MOV/WEBM tối đa 300 MB.

## Eligibility A/B/C (`src/domain/experienceRules.ts`)

Rule-based, không AI. Ngưỡng ở `ELIGIBILITY_RULES`. Mode không đủ điều kiện vẫn hiển thị (disabled) kèm lý do; app không tự chọn thay khách. Khi media bị xóa làm mode đã chọn mất điều kiện, bản nháp tự bỏ chọn mode và báo cho khách.

| Mode | Khả dụng khi |
| --- | --- |
| A. Ảnh sống lại | Có ≥ 1 video **và** (có ảnh in **hoặc** yêu cầu Chạm trích frame) |
| B. Kể lại một kỷ niệm | Có ảnh in (ảnh đại diện) **và** tổng ≥ 2 media |
| C. Sống lại rồi mở rộng | Đủ điều kiện A **và** ≥ 1 video **và** tổng ≥ 3 media |

## Hai nhánh dịch vụ (`src/domain/wizard.ts`, `draft.ts`)

- **Chạm dựng giúp tôi:** Cách thực hiện, Lời nhắn, Ảnh & video, Ảnh in, Trải nghiệm, Phong cách, Âm thanh, Khung, Xem lại.
- **Tôi đã có video hoàn chỉnh:** bỏ Phong cách và Âm thanh, thêm Kiểm tra video (thông số + bắt buộc xác nhận quyền nội dung/âm thanh). Không phải editor kéo-thả.
- Đổi nhánh giữa chừng: giữ media và brief, xóa cảm xúc/template/âm thanh không còn áp dụng.

## Trạng thái đơn (`src/domain/orderState.ts`)

`reviewing_assets` → (`awaiting_assets`) → `editing` (chỉ nhánh Chạm dựng) → `awaiting_customer_approval` ⇄ `revision_requested` → `approved` → `printing` → `ar_linking` → `quality_control` → `packing` → `shipping` → `completed`. Mọi trạng thái (trừ hoàn thành) có thể chuyển sang `blocked` kèm lý do và tiếp tục lại từ trạng thái trước.

Chặn bởi rule: vòng sửa thứ 3; gửi preview khi khách chưa chọn frame (đơn trích frame); QC khi chưa có liên kết AR; đóng gói khi QC chưa đạt; sửa video sau khi đã duyệt.
