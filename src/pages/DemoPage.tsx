import { ArrowRight, ClipboardList, Gift, RotateCcw, ScanLine } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dialog } from '../components/Dialog';
import { SiteHeader } from '../components/Layout';
import { Notice, Spinner } from '../components/ui';
import { buttonClass } from '../components/buttonClass';
import { DEMO_ORDER_ID } from '../data/seed';
import { ARPreview } from '../features/ar/ARPreview';
import { ensureDemoOrders, resetDemo, startGoldenPath } from '../features/demo/demoActions';
import { useOrder } from '../features/orders/useOrders';

const SCRIPT = [
  { title: 'Khách đặt quà', text: 'Chọn "Chạm dựng giúp", dịp kỷ niệm, ảnh biển và video cùng khoảnh khắc đã có sẵn. App xác định Mode A khả dụng.' },
  { title: 'Vận hành xử lý', text: 'Trong trang Vận hành: Editing, gửi preview. Khách duyệt ở trang đơn. Sau đó Printing, AR linking, tạo QR, QC.' },
  { title: 'Người nhận quét', text: 'Mở trang người nhận hoặc bấm mô phỏng bên cạnh để thấy video xuất hiện trên ảnh.' },
];

export function DemoPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState<'loading' | 'ok' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { order } = useOrder(ready === 'ok' ? DEMO_ORDER_ID : undefined);

  useEffect(() => {
    let alive = true;
    ensureDemoOrders()
      .then(() => alive && setReady('ok'))
      .catch(() => alive && setReady('error'));
    return () => {
      alive = false;
    };
  }, []);

  const start = () => {
    if (startGoldenPath()) navigate('/order');
    else setError('Không lưu được bản nháp mẫu (bộ nhớ trình duyệt đầy hoặc bị chặn). Hãy thử "Đặt lại demo".');
  };

  const reset = async () => {
    setConfirmReset(false);
    setResetting(true);
    setError(null);
    try {
      await resetDemo();
      setReady('ok');
    } catch {
      setError('Không đặt lại được dữ liệu demo.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader
        right={
          <nav aria-label="Điều hướng trình bày" className="flex gap-1">
            <Link to="/admin" className={buttonClass('ghost', 'px-3')}>Vận hành</Link>
            <Link to="/" className={buttonClass('ghost', 'px-3')}>Trang chủ</Link>
          </nav>
        }
      />
      <main className="container-page py-8 md:py-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-coral-ink">Chế độ trình bày</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-bold md:text-5xl">Một vòng đời món quà, từ lúc đặt tới lúc được quét.</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">Mọi dữ liệu ở đây là dữ liệu mẫu hư cấu, chạy hoàn toàn trên trình duyệt, không cần mạng và không cần tải file thật.</p>
        <Notice tone="info" title="Phần AR là bản mô phỏng" className="mt-6 max-w-2xl">
          Code AR thật chưa được tích hợp. Mô phỏng chỉ minh họa trải nghiệm người nhận, không dùng camera và không nhận diện ảnh.
        </Notice>
        {ready === 'error' && <Notice tone="error" className="mt-4 max-w-2xl" live>Không nạp được dữ liệu mẫu. Thử "Đặt lại demo".</Notice>}
        {error && <Notice tone="error" className="mt-4 max-w-2xl" live>{error}</Notice>}

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <ol className="space-y-6">
              {SCRIPT.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-base font-bold text-white">{i + 1}</span>
                  <div>
                    <h2 className="text-xl font-semibold">{s.title}</h2>
                    <p className="mt-1 text-[15px] text-muted">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button type="button" className={buttonClass('primary')} onClick={start}>
                <Gift aria-hidden className="h-4 w-4" /> Bắt đầu luồng khách (Mode A) <ArrowRight aria-hidden className="h-4 w-4" />
              </button>
              <Link to="/admin" className={buttonClass('secondary')}>
                <ClipboardList aria-hidden className="h-4 w-4" /> Mở trang vận hành
              </Link>
              <Link to={`/order/${DEMO_ORDER_ID}`} className={buttonClass('secondary')}>
                <ScanLine aria-hidden className="h-4 w-4" /> Xem đơn mẫu đã hoàn thành
              </Link>
            </div>
            <div className="mt-10 border-t border-line pt-6">
              <h2 className="text-lg font-semibold">Chuẩn bị lại cho lần trình bày sau</h2>
              <p className="mt-1 text-[15px] text-muted">Xóa mọi đơn, bản nháp và file trên trình duyệt này, rồi nạp lại 7 đơn mẫu.</p>
              <button type="button" className={buttonClass('secondary', 'mt-3')} onClick={() => setConfirmReset(true)} disabled={resetting}>
                <RotateCcw aria-hidden className="h-4 w-4" /> {resetting ? 'Đang đặt lại...' : 'Đặt lại demo'}
              </button>
            </div>
          </div>
          <section aria-label="Mô phỏng trải nghiệm người nhận">
            {ready === 'loading' || (ready === 'ok' && order === undefined) ? (
              <Spinner label="Đang chuẩn bị dữ liệu mẫu..." />
            ) : order ? (
              <ARPreview source={order} />
            ) : (
              <p className="text-muted">Chưa có đơn mẫu. Bấm "Đặt lại demo" để nạp lại.</p>
            )}
          </section>
        </div>
      </main>
      <Dialog open={confirmReset} onClose={() => setConfirmReset(false)} title="Đặt lại dữ liệu demo?">
        <p className="text-[15px]">Mọi đơn, bản nháp và file đã lưu trên trình duyệt này sẽ bị xóa, sau đó 7 đơn mẫu được nạp lại.</p>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button type="button" className={buttonClass('ghost')} onClick={() => setConfirmReset(false)}>Hủy</button>
          <button type="button" className={buttonClass('danger')} onClick={reset}>Xóa và nạp lại</button>
        </div>
      </Dialog>
    </div>
  );
}
