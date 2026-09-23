import { ChevronRight, Database, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog } from '../components/Dialog';
import { SiteHeader } from '../components/Layout';
import { Badge, Notice, Spinner } from '../components/ui';
import { buttonClass } from '../components/buttonClass';
import { BUSINESS } from '../config/business';
import { SERVICE_LABELS, STATUS_LABELS, STATUS_LABELS_VI } from '../domain/labels';
import { countMedia } from '../domain/media';
import { templateFor } from '../domain/templates';
import type { Order, OrderStatus } from '../domain/types';
import { resetDemo, seedDemoOrders } from '../features/demo/demoActions';
import { StatusBadge } from '../features/orders/OrderParts';
import { formatDateTime } from '../features/orders/orderView';
import { useOrders } from '../features/orders/useOrders';

const ALL_STATUSES = Object.keys(STATUS_LABELS) as OrderStatus[];

function rowOf(o: Order) {
  const { images, videos } = countMedia(o.media);
  const tpl = templateFor(o.mode, o.mood);
  return {
    service: SERVICE_LABELS[o.serviceType],
    template: o.serviceType === 'ready_video' ? 'Không áp dụng' : (tpl?.name ?? 'Chưa chọn'),
    media: `${images} ảnh / ${videos} video`,
    revisions: `${o.revisionsUsed}/${BUSINESS.maxRevisions}`,
    note: o.notes[o.notes.length - 1]?.text ?? '',
  };
}

export function AdminPage() {
  const { orders, error } = useOrders();
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<'seed' | 'reset' | null>(null);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const counts = useMemo(() => {
    const c = new Map<OrderStatus, number>();
    for (const o of orders ?? []) c.set(o.status, (c.get(o.status) ?? 0) + 1);
    return c;
  }, [orders]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (orders ?? []).filter(
      (o) => (filter === 'all' || o.status === filter) && (!q || o.id.toLowerCase().includes(q) || o.contact.name.toLowerCase().includes(q)),
    );
  }, [orders, filter, query]);

  const run = async (kind: 'seed' | 'reset') => {
    setBusy(kind);
    setMessage(null);
    try {
      if (kind === 'seed') await seedDemoOrders();
      else await resetDemo();
      setMessage({ tone: 'success', text: kind === 'seed' ? 'Đã tạo 7 đơn demo.' : 'Đã đặt lại dữ liệu demo.' });
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof Error ? e.message : 'Không thực hiện được.' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader
        right={
          <nav aria-label="Điều hướng vận hành" className="flex gap-1">
            <Link to="/demo" className={buttonClass('ghost', 'px-3')}>Trình bày</Link>
            <Link to="/" className={buttonClass('ghost', 'px-3')}>Trang chủ</Link>
          </nav>
        }
      />
      <main className="container-page py-8 md:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Vận hành đơn hàng</h1>
            <p className="mt-1 max-w-2xl text-muted">Màn hình nội bộ. MVP chưa có đăng nhập; dữ liệu nằm trên trình duyệt này.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={buttonClass('primary')} disabled={busy !== null} onClick={() => run('seed')}>
              <Database aria-hidden className="h-4 w-4" /> {busy === 'seed' ? 'Đang tạo...' : 'Tạo đơn demo'}
            </button>
            <button type="button" className={buttonClass('secondary')} disabled={busy !== null} onClick={() => setConfirmReset(true)}>
              <RotateCcw aria-hidden className="h-4 w-4" /> Đặt lại demo
            </button>
          </div>
        </div>

        {message && <Notice tone={message.tone} className="mt-5" live>{message.text}</Notice>}
        {error && <Notice tone="error" className="mt-5" live>{error}</Notice>}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
          <div>
            <label htmlFor="status-filter" className="field-label">Lọc theo trạng thái</label>
            <select id="status-filter" className="field-input mt-1.5" value={filter} onChange={(e) => setFilter(e.target.value as OrderStatus | 'all')}>
              <option value="all">Tất cả ({orders?.length ?? 0})</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS_VI[s]}, {STATUS_LABELS[s]} ({counts.get(s) ?? 0})</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="order-search" className="field-label">Tìm mã đơn hoặc tên khách</label>
            <input id="order-search" type="search" className="field-input mt-1.5" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>

        <div className="mt-6" aria-live="polite">
          {orders === null && !error && <Spinner label="Đang tải đơn..." />}
          {orders && orders.length === 0 && (
            <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center">
              <p className="font-semibold text-navy">Chưa có đơn nào.</p>
              <p className="mt-1 text-muted">Tạo đơn demo để xem đủ các trạng thái, hoặc đặt một đơn thật từ trang khách.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <button type="button" className={buttonClass('primary')} onClick={() => run('seed')} disabled={busy !== null}>Tạo đơn demo</button>
                <Link to="/order" className={buttonClass('secondary')}>Đặt đơn mới</Link>
              </div>
            </div>
          )}
          {orders && orders.length > 0 && visible.length === 0 && <p className="text-muted">Không có đơn phù hợp bộ lọc.</p>}
          {visible.length > 0 && (
            <>
              <p className="mb-3 text-sm text-muted">{visible.length} đơn</p>
              <OrderCards orders={visible} />
              <OrderTable orders={visible} />
            </>
          )}
        </div>
      </main>

      <Dialog open={confirmReset} onClose={() => setConfirmReset(false)} title="Đặt lại dữ liệu demo?">
        <p className="text-[15px]">Thao tác này xóa mọi đơn, bản nháp và file đã lưu trên trình duyệt này, rồi nạp lại 7 đơn mẫu.</p>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button type="button" className={buttonClass('ghost')} onClick={() => setConfirmReset(false)}>Hủy</button>
          <button type="button" className={buttonClass('danger')} onClick={() => { setConfirmReset(false); void run('reset'); }}>Xóa và nạp lại</button>
        </div>
      </Dialog>
    </div>
  );
}

/** Mobile/tablet: thẻ. */
function OrderCards({ orders }: { orders: Order[] }) {
  return (
    <ul className="grid gap-3 md:grid-cols-2 xl:hidden">
      {orders.map((o) => {
        const r = rowOf(o);
        return (
          <li key={o.id}>
            <Link to={`/admin/${o.id}`} className="block rounded-2xl border border-line bg-white p-4 hover:border-navy/40">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-navy">{o.id}</p>
                  <p className="truncate text-[15px] text-ink">{o.contact.name || 'Chưa có tên'}</p>
                </div>
                <StatusBadge status={o.status} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <dt className="text-muted">Dịch vụ</dt><dd className="text-ink">{r.service}</dd>
                <dt className="text-muted">Mode</dt><dd className="text-ink">{o.mode}</dd>
                <dt className="text-muted">Template</dt><dd className="text-ink">{r.template}</dd>
                <dt className="text-muted">Khung</dt><dd className="text-ink">{BUSINESS.frame.label}</dd>
                <dt className="text-muted">Media</dt><dd className="text-ink">{r.media}</dd>
                <dt className="text-muted">Vòng sửa</dt><dd className="text-ink">{r.revisions}</dd>
                <dt className="text-muted">Cập nhật</dt><dd className="text-ink">{formatDateTime(o.updatedAt)}</dd>
              </dl>
              {r.note && <p className="mt-2 line-clamp-2 text-sm text-muted">Ghi chú: {r.note}</p>}
              {o.isDemo && <p className="mt-2"><Badge>Dữ liệu mẫu</Badge></p>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Desktop rộng: bảng đầy đủ cột. */
function OrderTable({ orders }: { orders: Order[] }) {
  return (
    <div className="hidden overflow-hidden rounded-2xl border border-line bg-white xl:block">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Danh sách đơn hàng</caption>
        <thead className="bg-paper text-muted">
          <tr>
            {['Mã đơn', 'Khách', 'Dịch vụ', 'Mode', 'Template', 'Khung', 'Ảnh/Video', 'Vòng sửa', 'Trạng thái', 'Cập nhật', 'Ghi chú'].map((h) => (
              <th key={h} scope="col" className="px-3 py-3 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {orders.map((o) => {
            const r = rowOf(o);
            return (
              <tr key={o.id} className="align-top hover:bg-paper/60">
                <td className="px-3 py-3">
                  <Link to={`/admin/${o.id}`} className="inline-flex min-h-[44px] items-center gap-1 font-bold text-navy underline-offset-4 hover:underline">
                    {o.id} <ChevronRight aria-hidden className="h-4 w-4" />
                  </Link>
                </td>
                <td className="px-3 py-3 text-ink">{o.contact.name}</td>
                <td className="px-3 py-3">{r.service}</td>
                <td className="px-3 py-3 font-semibold">{o.mode}</td>
                <td className="px-3 py-3">{r.template}</td>
                <td className="px-3 py-3 whitespace-nowrap">{BUSINESS.frame.label}</td>
                <td className="px-3 py-3 whitespace-nowrap">{r.media}</td>
                <td className="px-3 py-3">{r.revisions}</td>
                <td className="px-3 py-3">
                  <StatusBadge status={o.status} />
                  <span className="mt-1 block text-xs text-muted">{STATUS_LABELS[o.status]}</span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">{formatDateTime(o.updatedAt)}</td>
                <td className="max-w-[200px] px-3 py-3 text-muted"><span className="line-clamp-2">{r.note || '-'}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
