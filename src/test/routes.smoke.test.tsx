/** Smoke test giao diện: mọi route chính render được, không trắng màn hình. */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '../App';
import { seedDemoOrders } from '../features/demo/demoActions';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('smoke: các route chính', () => {
  it('trang chủ là landing V7', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Có những điều chưa từng nói thành lời');
    expect(screen.getByRole('heading', { name: 'Bạn muốn gửi lời thương đến ai?' })).toBeTruthy();
  });

  it('landing đầu tiên vẫn ở /v1, có headline và CTA', () => {
    renderAt('/v1');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('không nên chỉ nằm trong điện thoại');
    expect(screen.getAllByRole('link', { name: /Tạo món quà/ }).length).toBeGreaterThan(0);
  });

  it('wizard mở ở bước chọn cách thực hiện', async () => {
    renderAt('/order');
    expect(await screen.findByText(/Bước 1\//)).toBeTruthy();
  });

  it('admin liệt kê đơn demo sau khi seed', async () => {
    await seedDemoOrders();
    renderAt('/admin');
    await waitFor(() => expect(screen.getAllByText('CHAM-DEMO-A1').length).toBeGreaterThan(0));
  });

  it('chi tiết đơn đang chờ duyệt có nút ghi nhận khách duyệt', async () => {
    await seedDemoOrders();
    renderAt('/admin/CHAM-DEMO-A2');
    expect(await screen.findByRole('button', { name: /Ghi nhận khách duyệt/ })).toBeTruthy();
  });

  it('trang khách hiện nút duyệt và giới hạn vòng sửa', async () => {
    await seedDemoOrders();
    renderAt('/order/CHAM-DEMO-A2');
    expect(await screen.findByRole('button', { name: /Duyệt bản này/ })).toBeTruthy();
    expect(screen.getByText(/0\/2 vòng chỉnh sửa|2\/2/)).toBeTruthy();
  });

  it('presentation mode ghi rõ AR là mô phỏng', async () => {
    renderAt('/demo');
    expect(screen.getByText('Phần AR là bản mô phỏng')).toBeTruthy();
    // Lần đầu phải seed dữ liệu qua AR mock (có độ trễ mô phỏng).
    expect(await screen.findByRole('button', { name: /Bắt đầu mô phỏng/ }, { timeout: 5000 })).toBeTruthy();
  }, 10000);

  it('trang người nhận của đơn mẫu mở được', async () => {
    await seedDemoOrders();
    renderAt('/ar/mock-cham-demo-a1');
    expect(await screen.findByRole('button', { name: /Bắt đầu mô phỏng/ }, { timeout: 3000 })).toBeTruthy();
  });

  it('QR không hợp lệ hiện thông báo thay vì trắng màn hình', async () => {
    renderAt('/ar/khong-ton-tai');
    expect(await screen.findByText('Không tìm thấy trải nghiệm')).toBeTruthy();
  });

  it('đơn không tồn tại có hướng dẫn', async () => {
    renderAt('/order/CHAM-XXXX');
    expect(await screen.findByText(/Không tìm thấy đơn/)).toBeTruthy();
  });
});

describe('smoke: landing V2', () => {
  it('render đủ các phần chính', async () => {
    renderAt('/v2');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Có những điều chưa từng nói thành lời');
    expect(screen.getAllByText('Người nhận chỉ cần 3 bước').length).toBeGreaterThan(0);
    expect(screen.getByText('[ĐANG CHỐT]')).toBeTruthy();
    expect(screen.getAllByRole('link', { name: /Tạo món quà/ }).length).toBeGreaterThan(0);
  });
});

describe('smoke: landing V3', () => {
  it('tiêu đề có nhãn đầy đủ cho trình đọc màn hình và có đủ các phần', () => {
    renderAt('/v3');
    expect(screen.getByRole('heading', { level: 1, name: 'Có những điều chưa từng nói thành lời.' })).toBeTruthy();
    expect(screen.getAllByText('Người nhận chỉ cần 3 bước').length).toBeGreaterThan(0);
  });
});

describe('smoke: landing V4', () => {
  it('có hero mới, cảnh Chạm và các phần chính', () => {
    renderAt('/v4');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Có những điều chưa từng nói thành lời');
    expect(screen.getByRole('region', { name: 'Cảnh Chạm' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Bỏ qua' }).getAttribute('href')).toBe('#cach-dung');
    expect(screen.getAllByText('Người nhận chỉ cần 3 bước').length).toBeGreaterThan(0);
  });
});

describe('smoke: landing V5', () => {
  it('có cảnh Chạm hai bàn tay và các phần chính', () => {
    renderAt('/v5');
    expect(screen.getByRole('region', { name: 'Cảnh Chạm' })).toBeTruthy();
    expect(screen.getByText(/cùng đưa vào giữa/)).toBeTruthy();
    expect(screen.getAllByText('Người nhận chỉ cần 3 bước').length).toBeGreaterThan(0);
  });
});

describe('smoke: landing V6', () => {
  it('có phần Vì sao có Chạm với nội dung mới và dải ảnh', () => {
    renderAt('/v6');
    expect(screen.getByRole('heading', { name: 'Vì sao có Chạm?' })).toBeTruthy();
    expect(screen.getByText(/thành món quà cầm được trên tay cho người bạn thương/)).toBeTruthy();
    expect(screen.getByRole('img', { name: /Những tấm ảnh đời thường/ })).toBeTruthy();
  });
});

describe('smoke: landing V7', () => {
  it('có logo mới, câu chữ mới, hỏi đáp, không còn phần hộp quà', () => {
    renderAt('/v7');
    expect(screen.getAllByAltText('Chạm').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Để ký ức ở lại.').length).toBeGreaterThan(0);
    expect(screen.getByText(/Biến kỷ niệm giữa bạn và người ấy/)).toBeTruthy();
    expect(screen.getAllByText('Người nhận chỉ cần ba bước').length).toBeGreaterThan(0);
    expect(screen.getByText('Bố mẹ lớn tuổi có dùng được không?')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Bạn muốn gửi lời thương đến ai?' })).toBeTruthy();
    expect(screen.queryByText('Trong hộp quà')).toBeNull();
    expect(screen.queryByText(/ĐANG CHỐT/)).toBeNull();
  });
});

describe('smoke: xem kỷ niệm bằng camera', () => {
  it('trang nhập mã báo lỗi rõ khi mã không tồn tại', async () => {
    renderAt('/memory');
    expect(await screen.findByRole('heading', { name: 'Mở lại một kỷ niệm' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Mã kỷ niệm'), { target: { value: 'xyz-9' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tìm kỷ niệm' }));
    expect(screen.getByRole('alert').textContent).toContain('XYZ9');
  });

  it('mã hợp lệ (gõ thường, có gạch) mở màn hình sẵn sàng', async () => {
    renderAt('/memory');
    fireEvent.change(await screen.findByLabelText('Mã kỷ niệm'), { target: { value: 'demo-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tìm kỷ niệm' }));
    expect(await screen.findByRole('heading', { name: 'Buổi chiều ở công viên' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Mở camera/ })).toBeTruthy();
  });

  it('link trực tiếp tới mã không tồn tại quay về ô nhập mã', async () => {
    renderAt('/memory/khong-co');
    expect(await screen.findByRole('heading', { name: 'Mở lại một kỷ niệm' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('KHONGCO');
  });
});
