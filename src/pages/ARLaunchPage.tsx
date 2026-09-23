import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { arAdapter } from '../ar';
import type { ARExperienceStatus } from '../ar/ARAdapter';
import { Logo } from '../components/Logo';
import { Notice, Spinner } from '../components/ui';
import { buttonClass } from '../components/buttonClass';
import { COPY } from '../config/business';
import type { Order } from '../domain/types';
import { ARPreview } from '../features/ar/ARPreview';
import { orderRepository } from '../services';

type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'status'; status: ARExperienceStatus; order: Order | null };

/** Trang mà QR ở mặt sau khung trỏ tới. Với adapter thật, đây là nơi khởi chạy AR engine. */
export function ARLaunchPage() {
  const { experienceId = '' } = useParams();
  const [state, setState] = useState<State>({ kind: 'loading' });

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const [status, orders] = await Promise.all([arAdapter.getStatus(experienceId), orderRepository.list()]);
      const order = orders.find((o) => o.ar?.experienceId === experienceId) ?? null;
      setState({ kind: 'status', status: order ? status : 'not_found', order });
    } catch {
      setState({ kind: 'error' });
    }
  }, [experienceId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="min-h-screen bg-paper">
      <header className="container-page flex h-16 items-center justify-between">
        <Logo />
      </header>
      <main className="container-page max-w-lg pb-12 pt-2">
        {state.kind === 'loading' && <Spinner label="Đang mở trải nghiệm..." />}
        {state.kind === 'error' && (
          <Notice tone="error" title="Không mở được trải nghiệm" live>
            Kiểm tra kết nối mạng rồi thử lại.
            <button type="button" className={buttonClass('secondary', 'mt-2')} onClick={() => void load()}>Thử lại</button>
          </Notice>
        )}
        {state.kind === 'status' && state.status === 'ready' && state.order && (
          <>
            <h1 className="text-2xl font-bold">
              {state.order.brief.recipientName ? `Gửi ${state.order.brief.recipientName}` : 'Một món quà dành cho bạn'}
            </h1>
            {state.order.brief.message && <p className="mt-2 text-[17px] text-ink">"{state.order.brief.message}"</p>}
            <p className="mt-3 text-[15px] text-muted">Hướng camera vào ảnh ở mặt trước khung. Âm thanh tắt mặc định, chạm nút trên video để bật.</p>
            <div className="mt-6">
              <ARPreview source={state.order} />
            </div>
            <p className="mt-8 text-sm text-muted">{COPY.persistence}</p>
          </>
        )}
        {state.kind === 'status' && state.status === 'processing' && (
          <Notice tone="info" title="Trải nghiệm đang được chuẩn bị">Hãy quay lại sau ít phút.</Notice>
        )}
        {state.kind === 'status' && (state.status === 'failed' || state.status === 'not_found' || (state.status === 'ready' && !state.order)) && (
          <div>
            <h1 className="text-2xl font-bold">Không tìm thấy trải nghiệm</h1>
            <p className="mt-2 text-muted">
              Mã QR này chưa được liên kết hoặc đã hết hiệu lực. Trong bản MVP, dữ liệu chỉ có trên trình duyệt đã tạo đơn.
            </p>
            <Link to="/" className={buttonClass('primary', 'mt-6')}>Về trang chủ Chạm</Link>
          </div>
        )}
      </main>
    </div>
  );
}
