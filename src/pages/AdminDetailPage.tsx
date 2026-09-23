import { ArrowLeft, CheckCircle2, Link2, Lock, PauseCircle, Send, XCircle } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { arAdapter } from '../ar';
import { isSimulatingArFailure, setSimulateArFailure } from '../ar/MockARAdapter';
import { SiteHeader } from '../components/Layout';
import { MediaView } from '../components/MediaView';
import { Badge, Checkbox, Notice, Spinner } from '../components/ui';
import { buttonClass } from '../components/buttonClass';
import { BUSINESS, formatBytes } from '../config/business';
import { STATUS_LABELS, STATUS_LABELS_VI } from '../domain/labels';
import {
  addNote,
  approvePreview,
  block,
  isVideoLocked,
  markQc,
  nextStatusOptions,
  remainingRevisions,
  requestRevision,
  sendFrameCandidates,
  sendPreview,
  transition,
  type Result,
} from '../domain/orderState';
import type { Order, OrderStatus } from '../domain/types';
import { ArLinkCard, FactList, FrameChoices, StatusBadge } from '../features/orders/OrderParts';
import { formatDateTime, orderFacts } from '../features/orders/orderView';
import { useOrder } from '../features/orders/useOrders';
import { nowIso, randomId } from '../lib/ids';

type Apply = ReturnType<typeof useOrder>['apply'];
type Flash = { tone: 'success' | 'error'; text: string } | null;

export function AdminDetailPage() {
  const { id } = useParams();
  const { order, apply } = useOrder(id);
  return (
    <div className="min-h-screen">
      <SiteHeader right={<Link to="/admin" className={buttonClass('ghost', 'px-3')}><ArrowLeft aria-hidden className="h-4 w-4" /> Danh sách đơn</Link>} />
      <main className="container-page py-8 md:py-12">
        {order === undefined && <Spinner label="Đang mở đơn..." />}
        {order === null && (
          <div>
            <h1 className="text-3xl font-bold">Không tìm thấy đơn {id}</h1>
            <Link to="/admin" className={buttonClass('primary', 'mt-6')}>Về danh sách đơn</Link>
          </div>
        )}
        {order && <Detail order={order} apply={apply} />}
      </main>
    </div>
  );
}

function Detail({ order, apply }: { order: Order; apply: Apply }) {
  const [flash, setFlash] = useState<Flash>(null);
  /** Chạy một hành động domain, lưu và báo kết quả. Trả true nếu thành công. */
  const act = async (result: Result, success: string): Promise<boolean> => {
    const err = await apply(result);
    setFlash(err ? { tone: 'error', text: err } : { tone: 'success', text: success });
    return !err;
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">{order.id}</h1>
        <StatusBadge status={order.status} />
        <span className="text-sm text-muted">{STATUS_LABELS[order.status]}</span>
        {order.isDemo && <Badge>Dữ liệu mẫu</Badge>}
        {isVideoLocked(order) && <Badge tone="neutral"><Lock aria-hidden className="h-3.5 w-3.5" /> Video đã khóa</Badge>}
      </div>
      <p className="mt-1 text-muted">
        Khách: {order.contact.name} · {order.contact.reach} · Cập nhật {formatDateTime(order.updatedAt)}
      </p>
      <p className="mt-1">
        <Link to={`/order/${order.id}`} className="inline-flex min-h-[44px] items-center font-semibold text-navy underline-offset-4 hover:underline">
          Xem trang của khách
        </Link>
      </p>

      <div aria-live="polite" className="mt-4 min-h-[1px]">
        {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <StatusPanel order={order} act={act} />
          {order.printTarget.type === 'extract_frame' && <FramePanel order={order} act={act} />}
          {(order.status === 'awaiting_customer_approval' || order.revisionsUsed > 0) && <ReviewPanel order={order} act={act} />}
          <ArPanel order={order} apply={apply} setFlash={setFlash} />
          {order.status === 'quality_control' && <QcPanel order={order} act={act} />}
          <NotesPanel order={order} act={act} />
        </div>
        <aside className="space-y-6" aria-label="Thông tin đơn">
          <Panel title="Thông tin đơn">
            <FactList rows={orderFacts(order)} />
          </Panel>
          <Panel title="Brief">
            <dl className="space-y-2 text-[15px]">
              <div><dt className="text-muted">Người tặng / nhận</dt><dd>{order.brief.senderName || '-'} / {order.brief.recipientName || '-'}</dd></div>
              <div><dt className="text-muted">Lời nhắn</dt><dd className="break-words">{order.brief.message || '-'}</dd></div>
              <div><dt className="text-muted">Ghi chú của khách</dt><dd className="break-words">{order.brief.notes || '-'}</dd></div>
            </dl>
          </Panel>
          <Panel title={`Media (${order.media.length})`}>
            {order.media.length === 0 ? (
              <p className="text-muted">Chưa có media.</p>
            ) : (
              <ul className="grid grid-cols-3 gap-2">
                {order.media.map((m) => (
                  <li key={m.id}>
                    <MediaView item={m} showKind mood={order.mood} className="aspect-[3/4] rounded-md" />
                    <p className="mt-0.5 truncate text-xs text-muted" title={m.name}>{m.name}</p>
                    <p className="text-xs text-muted">{formatBytes(m.size)}{m.durationSec ? `, ${Math.round(m.durationSec)} giây` : ''}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Lịch sử">
            <ol className="space-y-2 text-sm">
              {[...order.history].reverse().map((e, i) => (
                <li key={`${e.at}-${i}`} className="flex gap-2">
                  <span className="shrink-0 text-muted">{formatDateTime(e.at)}</span>
                  <span className="min-w-0 break-words">{e.label}<span className="text-muted"> ({e.actor === 'customer' ? 'khách' : e.actor === 'operator' ? 'vận hành' : 'hệ thống'})</span></span>
                </li>
              ))}
            </ol>
          </Panel>
        </aside>
      </div>
    </>
  );
}

type Act = (result: Result, success: string) => Promise<boolean>;

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Nút chuyển trạng thái. Một số bước có hành động riêng (preview, duyệt, chỉnh sửa, tạm dừng). */
function StatusPanel({ order, act }: { order: Order; act: Act }) {
  const [blockReason, setBlockReason] = useState('');
  const [blocking, setBlocking] = useState(false);
  // Duyệt/yêu cầu sửa được ghi nhận ở khung "Duyệt và chỉnh sửa" để kèm nội dung và giới hạn vòng.
  const options = nextStatusOptions(order).filter((o) => o.to !== 'revision_requested' && o.to !== 'approved');

  const go = (to: OrderStatus) => {
    const now = nowIso();
    if (to === 'awaiting_customer_approval') return act(sendPreview(order, now), `Đã gửi preview v${order.previewVersion + 1} cho khách (mô phỏng, không gửi email/SMS).`);
    if (to === 'approved') return act(approvePreview(order, now, 'operator'), 'Đã ghi nhận khách duyệt.');
    return act(transition(order, to, now), `Đã chuyển sang "${STATUS_LABELS_VI[to]}".`);
  };

  return (
    <Panel title="Chuyển trạng thái">
      {options.length === 0 && order.status === 'completed' && <p className="text-muted">Đơn đã hoàn thành.</p>}
      <div className="flex flex-wrap gap-2">
        {options.map(({ to, reason }) => (
          <div key={to} className="max-w-full">
            <button type="button" className={buttonClass(to === 'awaiting_customer_approval' ? 'coral' : 'secondary')} disabled={reason !== null} onClick={() => go(to)} aria-describedby={reason ? `why-${to}` : undefined}>
              {to === 'awaiting_customer_approval' ? <Send aria-hidden className="h-4 w-4" /> : null}
              {to === 'awaiting_customer_approval' ? 'Gửi preview cho khách' : order.status === 'blocked' ? `Tiếp tục: ${STATUS_LABELS_VI[to]}` : STATUS_LABELS_VI[to]}
            </button>
            {reason && <p id={`why-${to}`} className="mt-1 max-w-xs text-xs text-muted">{reason}</p>}
          </div>
        ))}
      </div>
      {order.status !== 'blocked' && order.status !== 'completed' && (
        <div className="mt-5 border-t border-line pt-4">
          {!blocking ? (
            <button type="button" className={buttonClass('ghost')} onClick={() => setBlocking(true)}>
              <PauseCircle aria-hidden className="h-4 w-4" /> Tạm dừng đơn (Blocked)
            </button>
          ) : (
            <div>
              <label htmlFor="block-reason" className="field-label">Lý do tạm dừng</label>
              <input id="block-reason" className="field-input mt-1.5" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={buttonClass('danger')}
                  onClick={async () => {
                    if (!blockReason.trim()) return act({ ok: false, error: 'Hãy ghi lý do tạm dừng.' }, '');
                    if (await act(block(order, blockReason.trim(), nowIso()), 'Đã tạm dừng đơn.')) {
                      setBlocking(false);
                      setBlockReason('');
                    }
                  }}
                >
                  Tạm dừng
                </button>
                <button type="button" className={buttonClass('ghost')} onClick={() => setBlocking(false)}>Hủy</button>
              </div>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

function ReviewPanel({ order, act }: { order: Order; act: Act }) {
  const [text, setText] = useState('');
  const left = remainingRevisions(order);
  const waiting = order.status === 'awaiting_customer_approval';
  return (
    <Panel title={`Duyệt và chỉnh sửa (đã dùng ${order.revisionsUsed}/${BUSINESS.maxRevisions} vòng)`}>
      {order.revisions.length > 0 && (
        <ol className="mb-4 space-y-2 text-[15px]">
          {order.revisions.map((r) => (
            <li key={r.round} className="rounded-lg bg-paper px-3 py-2"><strong>Vòng {r.round}:</strong> {r.text}</li>
          ))}
        </ol>
      )}
      {waiting && (
        <>
          <p className="text-[15px] text-muted">Preview v{order.previewVersion} đang chờ khách. Ghi nhận phản hồi khách gửi qua kênh khác tại đây.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={buttonClass('primary')} onClick={() => act(approvePreview(order, nowIso(), 'operator'), 'Đã ghi nhận khách duyệt. Video đã khóa.')}>
              <CheckCircle2 aria-hidden className="h-4 w-4" /> Ghi nhận khách duyệt
            </button>
          </div>
          <div className="mt-4">
            <label htmlFor="rev-note" className="field-label">Ghi nhận yêu cầu chỉnh sửa {left > 0 ? `(vòng ${order.revisionsUsed + 1}/${BUSINESS.maxRevisions})` : ''}</label>
            <textarea id="rev-note" className="field-input mt-1.5 min-h-[80px]" value={text} onChange={(e) => setText(e.target.value)} disabled={left === 0} />
            <button
              type="button"
              className={buttonClass('secondary', 'mt-3')}
              disabled={left === 0}
              onClick={async () => {
                if (await act(requestRevision(order, text, nowIso(), 'operator'), 'Đã ghi nhận yêu cầu chỉnh sửa.')) setText('');
              }}
            >
              Ghi nhận yêu cầu chỉnh sửa
            </button>
            {left === 0 && <p className="mt-2 text-sm text-muted">Đã dùng hết {BUSINESS.maxRevisions} vòng. Không thể ghi nhận vòng thứ {BUSINESS.maxRevisions + 1}; hãy trao đổi với khách để duyệt bản hiện tại.</p>}
          </div>
        </>
      )}
    </Panel>
  );
}

function FramePanel({ order, act }: { order: Order; act: Act }) {
  return (
    <Panel title="Trích frame làm ảnh in">
      {!order.frameCandidatesSent ? (
        <>
          <p className="text-[15px] text-muted">Khách yêu cầu Chạm trích frame. Chọn thủ công 3 frame đủ chất lượng rồi gửi khách chọn.</p>
          <button type="button" className={buttonClass('primary', 'mt-3')} onClick={() => act(sendFrameCandidates(order, nowIso()), 'Đã gửi 3 frame cho khách (mô phỏng).')}>
            <Send aria-hidden className="h-4 w-4" /> Gửi 3 frame cho khách
          </button>
        </>
      ) : (
        <>
          <p className="mb-3 text-[15px] text-muted">{order.chosenFrame ? `Khách đã chọn frame ${order.chosenFrame}.` : 'Đang chờ khách chọn frame trên trang của khách.'}</p>
          <div className="max-w-sm"><FrameChoices order={order} value={order.chosenFrame} /></div>
        </>
      )}
    </Panel>
  );
}

function ArPanel({ order, apply, setFlash }: { order: Order; apply: Apply; setFlash: (f: Flash) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simFail, setSimFail] = useState(isSimulatingArFailure());
  const canLink = order.status === 'ar_linking';

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const exp = await arAdapter.createExperience({
        orderId: order.id,
        mode: order.mode,
        targetMediaId: order.printTarget.type === 'media' ? order.printTarget.mediaId : null,
        videoMediaIds: order.media.filter((m) => m.kind === 'video').map((m) => m.id),
      });
      const launchUrl = await arAdapter.generateLaunchLink(exp.experienceId);
      const qrDataUrl = await arAdapter.generateQrCode(launchUrl);
      const now = nowIso();
      const err = await apply({
        ok: true,
        order: {
          ...order,
          ar: { experienceId: exp.experienceId, launchUrl, qrDataUrl, linkedAt: now },
          updatedAt: now,
          history: [...order.history, { at: now, status: order.status, label: 'Đã tạo liên kết AR và mã QR', actor: 'operator' }],
        },
      });
      if (err) setError(err);
      else setFlash({ tone: 'success', text: 'Đã tạo liên kết AR và QR. Có thể chuyển sang QC.' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AR adapter gặp lỗi không xác định.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel title="Liên kết AR">
      <p className="mb-3 text-sm text-muted">Adapter hiện tại: <strong className="text-navy">{arAdapter.name}</strong>. Không có AR thật trong bản MVP.</p>
      {order.ar ? (
        <ArLinkCard ar={order.ar} />
      ) : canLink ? (
        <button type="button" className={buttonClass('primary')} disabled={busy} onClick={create}>
          <Link2 aria-hidden className="h-4 w-4" /> {busy ? 'Đang tạo...' : 'Tạo liên kết AR và QR'}
        </button>
      ) : (
        <p className="text-[15px] text-muted">Tạo liên kết ở bước "AR linking", sau khi đã in ảnh.</p>
      )}
      {error && (
        <Notice tone="error" className="mt-3" title="AR adapter lỗi" live>
          {error}
          <button type="button" className={buttonClass('secondary', 'mt-2')} onClick={create} disabled={busy}>Thử lại</button>
        </Notice>
      )}
      {arAdapter.isMock && (
        <div className="mt-4">
          <Checkbox
            id="sim-ar-fail"
            checked={simFail}
            onChange={(v) => {
              setSimulateArFailure(v);
              setSimFail(v);
            }}
          >
            Mô phỏng lỗi AR adapter (để demo xử lý lỗi)
          </Checkbox>
        </div>
      )}
    </Panel>
  );
}

function QcPanel({ order, act }: { order: Order; act: Act }) {
  const [note, setNote] = useState('');
  return (
    <Panel title="Kiểm tra chất lượng (QC)">
      {order.qc && (
        <p className="mb-3 inline-flex items-center gap-1.5 text-[15px]">
          {order.qc.result === 'pass' ? <CheckCircle2 aria-hidden className="h-4 w-4 text-mint-ink" /> : <XCircle aria-hidden className="h-4 w-4 text-danger" />}
          Kết quả gần nhất: <strong>{order.qc.result === 'pass' ? 'Đạt' : 'Không đạt'}</strong>{order.qc.note ? `, ${order.qc.note}` : ''}
        </p>
      )}
      <p className="text-sm text-muted">Kiểm tra: ảnh in đúng khung {BUSINESS.frame.label}, QR quét được, video phát đúng trên ảnh.</p>
      <label htmlFor="qc-note" className="field-label mt-3">Ghi chú QC (bắt buộc khi không đạt)</label>
      <input id="qc-note" className="field-input mt-1.5" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={buttonClass('primary')} onClick={() => act(markQc(order, true, note, nowIso()), 'QC đạt. Có thể chuyển sang đóng gói.')}>
          <CheckCircle2 aria-hidden className="h-4 w-4" /> QC đạt
        </button>
        <button type="button" className={buttonClass('danger')} onClick={() => act(markQc(order, false, note, nowIso()), 'Đã ghi QC không đạt. Chuyển lại bước in hoặc liên kết AR.')}>
          <XCircle aria-hidden className="h-4 w-4" /> QC không đạt
        </button>
      </div>
    </Panel>
  );
}

function NotesPanel({ order, act }: { order: Order; act: Act }) {
  const [text, setText] = useState('');
  return (
    <Panel title="Ghi chú vận hành">
      {order.notes.length === 0 ? (
        <p className="text-muted">Chưa có ghi chú.</p>
      ) : (
        <ul className="space-y-2 text-[15px]">
          {order.notes.map((n) => (
            <li key={n.id} className="rounded-lg bg-paper px-3 py-2">
              <span className="text-sm text-muted">{formatDateTime(n.at)}: </span>
              <span className="break-words">{n.text}</span>
            </li>
          ))}
        </ul>
      )}
      <label htmlFor="new-note" className="field-label mt-4">Thêm ghi chú</label>
      <textarea id="new-note" className="field-input mt-1.5 min-h-[72px]" value={text} onChange={(e) => setText(e.target.value)} />
      <button
        type="button"
        className={buttonClass('secondary', 'mt-3')}
        onClick={async () => {
          if (await act(addNote(order, text, randomId(), nowIso()), 'Đã thêm ghi chú.')) setText('');
        }}
      >
        Thêm ghi chú
      </button>
    </Panel>
  );
}
