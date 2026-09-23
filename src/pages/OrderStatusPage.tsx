import { CheckCircle2, Lock, MessageSquareText, PartyPopper } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Dialog } from '../components/Dialog';
import { FrameMock } from '../components/FrameMock';
import { SiteHeader } from '../components/Layout';
import { MediaView } from '../components/MediaView';
import { Notice, Spinner } from '../components/ui';
import { buttonClass } from '../components/buttonClass';
import { BUSINESS, COPY } from '../config/business';
import { approvePreview, chooseFrame, isVideoLocked, remainingRevisions, requestRevision } from '../domain/orderState';
import type { Order } from '../domain/types';
import { ARPreview } from '../features/ar/ARPreview';
import { ArLinkCard, FactList, FrameChoices, OrderTimeline, StatusBadge } from '../features/orders/OrderParts';
import { orderFacts, targetItemOf } from '../features/orders/orderView';
import { useOrder } from '../features/orders/useOrders';
import { nowIso } from '../lib/ids';

export function OrderStatusPage() {
  const { id } = useParams();
  const { order, apply } = useOrder(id);
  const location = useLocation();
  const justCreated = Boolean((location.state as { justCreated?: boolean } | null)?.justCreated);

  return (
    <div className="min-h-screen">
      <SiteHeader right={<Link to="/" className={buttonClass('ghost', 'px-3')}>Trang chủ</Link>} />
      <main className="container-page py-8 md:py-12">
        {order === undefined && <Spinner label="Đang mở đơn..." />}
        {order === null && <OrderNotFound id={id} />}
        {order && <OrderView order={order} apply={apply} justCreated={justCreated} />}
      </main>
    </div>
  );
}

function OrderNotFound({ id }: { id?: string }) {
  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-bold">Không tìm thấy đơn {id}</h1>
      <p className="mt-3 text-muted">
        Trong MVP, đơn được lưu ngay trên thiết bị và trình duyệt đã tạo đơn. Nếu bạn mở trên máy khác hoặc đã xóa dữ liệu trình duyệt, đơn sẽ không hiện ở đây.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/order" className={buttonClass('primary')}>Tạo đơn mới</Link>
        <Link to="/demo" className={buttonClass('secondary')}>Xem bản trình bày</Link>
      </div>
    </div>
  );
}

type Apply = ReturnType<typeof useOrder>['apply'];

function OrderView({ order, apply, justCreated }: { order: Order; apply: Apply; justCreated: boolean }) {
  const hasUploads = order.media.some((m) => m.source === 'upload');
  const sentRemote = order.submission?.mode === 'remote';
  const skipped = order.submission?.skipped ?? [];
  return (
    <>
      {justCreated && (
        <Notice tone="success" title={sentRemote ? 'Chạm đã nhận yêu cầu của bạn' : 'Đã lưu yêu cầu của bạn'} className="mb-6" live>
          Hãy lưu mã đơn <strong>{order.id}</strong>. Chạm sẽ kiểm tra file và gửi bản preview để bạn duyệt trước khi in.
          {sentRemote && ` Chạm sẽ liên hệ bạn qua ${order.contact.reach}.`}
          {!sentRemote && hasUploads && ' Đây là bản chạy thử: yêu cầu và file chỉ nằm trên thiết bị này, chưa được gửi tới Chạm.'}
        </Notice>
      )}
      {justCreated && skipped.length > 0 && (
        <Notice tone="warning" title="Có file chưa gửi được qua web" className="mb-6">
          {skipped.map((f) => `${f.name} (${f.reason})`).join(', ')}. Chạm sẽ nhắn bạn qua {order.contact.reach} để nhận các file này.
        </Notice>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold md:text-4xl">Đơn {order.id}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="mt-2 text-muted">Thời gian hoàn thành: {BUSINESS.serviceTimeAfterApproval.label}.</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-10">
          <CustomerActions order={order} apply={apply} />
          <section aria-labelledby="timeline-h">
            <h2 id="timeline-h" className="text-xl font-semibold">Tiến độ</h2>
            <div className="mt-4">
              <OrderTimeline order={order} />
            </div>
          </section>
          {order.ar && (
            <section aria-labelledby="ar-h" className="space-y-4">
              <h2 id="ar-h" className="text-xl font-semibold">Trải nghiệm của người nhận</h2>
              <ArLinkCard ar={order.ar} />
              <ARPreview source={order} />
            </section>
          )}
        </div>
        <aside className="space-y-6" aria-label="Tóm tắt đơn">
          <FrameMock caption>
            <MediaView item={targetItemOf(order)} mood={order.mood} atSecond={1} className="h-full w-full" />
          </FrameMock>
          <FactList rows={orderFacts(order)} />
          <p className="text-sm text-muted">{COPY.persistence}</p>
        </aside>
      </div>
    </>
  );
}

/** Hành động khách cần làm ở trạng thái hiện tại. */
function CustomerActions({ order, apply }: { order: Order; apply: Apply }) {
  const t = order.printTarget;
  const blocks: JSX.Element[] = [];

  if (t.type === 'extract_frame') {
    if (!order.frameCandidatesSent) {
      blocks.push(
        <Notice key="frame-wait" tone="info" title="Chạm sẽ chọn 3 frame đủ chất lượng">
          Chạm đang xem video để chọn 3 frame nét nhất. Khi xong, bạn sẽ chọn 1 frame làm ảnh in ngay tại trang này.
        </Notice>,
      );
    } else {
      blocks.push(<FramePickSection key="frame" order={order} apply={apply} />);
    }
  }

  if (order.status === 'awaiting_customer_approval') blocks.push(<ApprovalSection key="approve" order={order} apply={apply} />);

  if (order.status === 'revision_requested') {
    const last = order.revisions[order.revisions.length - 1];
    blocks.push(
      <Notice key="rev" tone="info" title={`Chạm đang chỉnh theo yêu cầu vòng ${order.revisionsUsed}/${BUSINESS.maxRevisions}`}>
        {last ? `Yêu cầu của bạn: "${last.text}"` : 'Chạm sẽ gửi lại bản preview mới.'}
      </Notice>,
    );
  }

  if (isVideoLocked(order) && order.status !== 'completed') {
    blocks.push(
      <Notice key="lock" tone="info" title="Video đã được khóa">
        <span className="inline-flex items-center gap-1.5"><Lock aria-hidden className="h-4 w-4" /> Bạn đã duyệt bản cuối. Khung đang được sản xuất nên video không thể thay đổi.</span>
      </Notice>,
    );
  }

  if (order.status === 'completed') {
    blocks.push(
      <Notice key="done" tone="success" title="Món quà đã hoàn thành">
        <span className="inline-flex items-center gap-1.5"><PartyPopper aria-hidden className="h-4 w-4" /> Bạn có thể xem thử trải nghiệm của người nhận bên dưới.</span>
      </Notice>,
    );
  }

  if (blocks.length === 0) return null;
  return (
    <section aria-labelledby="todo-h" className="space-y-4">
      <h2 id="todo-h" className="text-xl font-semibold">Việc của bạn</h2>
      {blocks}
    </section>
  );
}

function FramePickSection({ order, apply }: { order: Order; apply: Apply }) {
  const [error, setError] = useState<string | null>(null);
  const locked = isVideoLocked(order);
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <h3 className="text-lg font-semibold">{order.chosenFrame ? `Bạn đã chọn frame ${order.chosenFrame}` : 'Chọn 1 trong 3 frame làm ảnh in'}</h3>
      <p className="mt-1 text-[15px] text-muted">
        {locked ? 'Đơn đã vào sản xuất, ảnh in không thể thay đổi.' : 'Bạn có thể đổi lựa chọn cho tới khi duyệt bản cuối.'}
      </p>
      <div className="mt-4 max-w-md">
        <FrameChoices
          order={order}
          value={order.chosenFrame}
          disabled={locked}
          onChoose={async (n) => setError(await apply(chooseFrame(order, n, nowIso())))}
        />
      </div>
      {error && <Notice tone="error" className="mt-3" live>{error}</Notice>}
    </div>
  );
}

function ApprovalSection({ order, apply }: { order: Order; apply: Apply }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [revising, setRevising] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const left = remainingRevisions(order);

  const approve = async () => {
    setConfirmOpen(false);
    setError(await apply(approvePreview(order, nowIso())));
  };
  const submitRevision = async () => {
    const err = await apply(requestRevision(order, text, nowIso()));
    setError(err);
    if (!err) {
      setRevising(false);
      setText('');
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="grid gap-5 sm:grid-cols-[180px_minmax(0,1fr)]">
        <div>
          <div className="relative overflow-hidden rounded-lg">
            <MediaView item={order.media.find((m) => m.kind === 'video') ?? targetItemOf(order)} play mood={order.mood} className="aspect-[3/4]" />
            <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-xs font-bold text-navy">Preview v{order.previewVersion}</span>
          </div>
          <p className="mt-1 text-xs text-muted">Minh họa bản preview. Bản thật do Chạm dựng thủ công.</p>
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold">Bản preview đang chờ bạn duyệt</h3>
          <p className="mt-1 text-[15px] text-muted">
            Sau khi duyệt, Chạm bắt đầu in và video không thể thay đổi. Bạn còn <strong className="text-navy">{left}/{BUSINESS.maxRevisions}</strong> vòng chỉnh sửa.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className={buttonClass('primary')} onClick={() => setConfirmOpen(true)}>
              <CheckCircle2 aria-hidden className="h-4 w-4" /> Duyệt bản này
            </button>
            <button type="button" className={buttonClass('secondary')} disabled={left === 0} onClick={() => setRevising(true)} aria-expanded={revising}>
              <MessageSquareText aria-hidden className="h-4 w-4" /> Yêu cầu chỉnh sửa
            </button>
          </div>
          {left === 0 && (
            <p className="mt-3 text-sm text-muted">
              Bạn đã dùng hết {BUSINESS.maxRevisions} vòng chỉnh sửa. Bạn có thể duyệt bản hiện tại hoặc liên hệ Chạm để trao đổi thêm.
            </p>
          )}
          {revising && left > 0 && (
            <div className="mt-4">
              <label htmlFor="revision-text" className="field-label">Bạn muốn chỉnh gì? (vòng {order.revisionsUsed + 1}/{BUSINESS.maxRevisions})</label>
              <textarea id="revision-text" className="field-input mt-1.5 min-h-[96px]" value={text} onChange={(e) => setText(e.target.value)} />
              <div className="mt-3 flex flex-wrap gap-3">
                <button type="button" className={buttonClass('primary')} onClick={submitRevision}>Gửi yêu cầu</button>
                <button type="button" className={buttonClass('ghost')} onClick={() => { setRevising(false); setError(null); }}>Hủy</button>
              </div>
            </div>
          )}
          {error && <Notice tone="error" className="mt-3" live>{error}</Notice>}
        </div>
      </div>
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Duyệt bản cuối?">
        <p className="text-[15px]">
          Sau khi duyệt, Chạm sẽ in ảnh và liên kết AR. Video sẽ bị khóa và không thể thay đổi. Thời gian hoàn thành: {BUSINESS.serviceTimeAfterApproval.label}.
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button type="button" className={buttonClass('ghost')} onClick={() => setConfirmOpen(false)}>Xem lại</button>
          <button type="button" className={buttonClass('primary')} onClick={approve}>Duyệt và bắt đầu in</button>
        </div>
      </Dialog>
    </div>
  );
}
