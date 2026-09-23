import { ArrowLeft, ArrowRight, Check, ListChecks, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dialog } from '../components/Dialog';
import { SiteHeader } from '../components/Layout';
import { Notice } from '../components/ui';
import { buttonClass } from '../components/buttonClass';
import { StorageFullError } from '../data/errors';
import { SubmitError, type SubmitProgress } from '../data/OrderSubmitter';
import { createOrderFromDraft } from '../domain/orderState';
import { STEP_LABELS, firstInvalidStep, getSteps, validateStep, type StepId } from '../domain/wizard';
import { OrderSummary } from '../features/order/OrderSummary';
import { AudioStep } from '../features/order/steps/AudioStep';
import { BriefStep } from '../features/order/steps/BriefStep';
import { CheckStep } from '../features/order/steps/CheckStep';
import { FrameStep } from '../features/order/steps/FrameStep';
import { MediaStep } from '../features/order/steps/MediaStep';
import { ModeStep } from '../features/order/steps/ModeStep';
import { ReviewStep } from '../features/order/steps/ReviewStep';
import { ServiceStep } from '../features/order/steps/ServiceStep';
import { StyleStep } from '../features/order/steps/StyleStep';
import { TargetStep } from '../features/order/steps/TargetStep';
import type { StepProps } from '../features/order/steps/shared';
import { useDraft } from '../features/order/useDraft';
import { clearDraft } from '../data/draftStore';
import { nowIso, orderCode } from '../lib/ids';
import { getMediaStorage, orderRepository, orderSubmitter } from '../services';
import type { Order } from '../domain/types';

const STEP_COMPONENTS: Record<StepId, (p: StepProps) => JSX.Element> = {
  service: ServiceStep,
  brief: BriefStep,
  media: MediaStep,
  target: TargetStep,
  mode: ModeStep,
  style: StyleStep,
  audio: AudioStep,
  check: CheckStep,
  frame: FrameStep,
  review: ReviewStep,
};

export function OrderWizardPage() {
  const api = useDraft();
  const { draft, update, notices, clearNotices, saveFailed } = api;
  const navigate = useNavigate();
  const steps = getSteps(draft.serviceType);
  const index = Math.min(draft.stepIndex, steps.length - 1);
  const step = steps[index] as StepId;
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<SubmitProgress | null>(null);
  /** Lỗi lúc gửi (mạng, máy chủ) khác lỗi điền thiếu: tiêu đề hộp lỗi đổi theo. */
  const [sendFailed, setSendFailed] = useState(false);
  /** Đơn đã tạo nhưng gửi chưa xong: bấm "Gửi lại" dùng lại đúng đơn này, không tạo đơn trùng. */
  const pendingOrder = useRef<Order | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  // Đổi bước: xóa lỗi cũ, đưa focus về tiêu đề bước cho bàn phím/screen reader.
  useEffect(() => {
    setErrors([]);
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    document.getElementById('step-heading')?.focus();
  }, [step]);

  useEffect(() => {
    if (errors.length) errorRef.current?.focus();
  }, [errors]);

  const goToIndex = (i: number) => {
    clearNotices();
    update((d) => ({ ...d, stepIndex: i }));
  };

  const goTo = (target: StepId) => {
    const i = steps.indexOf(target);
    if (i < 0) return;
    if (i <= index || steps.slice(0, i).every((s) => validateStep(s, draft).length === 0)) goToIndex(i);
  };

  const next = async () => {
    const errs = validateStep(step, draft);
    if (errs.length) {
      setErrors(errs);
      return;
    }
    if (step !== 'review') {
      goToIndex(index + 1);
      return;
    }
    const invalid = firstInvalidStep(draft);
    if (invalid) {
      goTo(invalid);
      return;
    }
    setSubmitting(true);
    setErrors([]);
    setSendFailed(false);
    let order = pendingOrder.current;
    if (!order) {
      const result = createOrderFromDraft(draft, orderCode(), nowIso());
      if (!result.ok) {
        setErrors([result.error]);
        setSubmitting(false);
        return;
      }
      order = result.order;
      try {
        await orderRepository.save(order);
      } catch (err) {
        setErrors([err instanceof StorageFullError ? err.message : 'Chưa lưu được yêu cầu. Dữ liệu vẫn được giữ, hãy thử lại.']);
        setSubmitting(false);
        return;
      }
      pendingOrder.current = order;
    }
    try {
      const storage = await getMediaStorage();
      const res = await orderSubmitter.submit(order, (id) => storage.get(id), setProgress);
      const sent: Order = { ...order, submission: { mode: res.mode, at: nowIso(), skipped: res.skipped } };
      await orderRepository.save(sent).catch(() => undefined);
      pendingOrder.current = null;
      clearDraft();
      navigate(`/order/${sent.id}`, { state: { justCreated: true } });
    } catch (err) {
      if (err instanceof SubmitError && err.code === 'DUPLICATE') {
        // Hiếm gặp: mã đã thuộc về đơn khác. Lần gửi lại sẽ tạo mã mới.
        pendingOrder.current = null;
        setErrors(['Có trục trặc với mã đơn. Bấm “Gửi yêu cầu” để gửi lại với mã mới.']);
        setSubmitting(false);
        setProgress(null);
        return;
      }
      setSendFailed(true);
      setErrors([
        `${err instanceof Error ? err.message : 'Chưa gửi được.'} Đơn ${order.id} vẫn được giữ trên máy này. Kiểm tra mạng rồi bấm “Gửi lại”.`,
      ]);
      setSubmitting(false);
      setProgress(null);
    }
  };

  const progressLabel = !progress
    ? 'Đang gửi...'
    : progress.phase === 'order'
      ? 'Đang tạo đơn...'
      : progress.phase === 'file'
        ? `Đang gửi file ${progress.index}/${progress.total}...`
        : 'Sắp xong...';

  const StepView = STEP_COMPONENTS[step];
  const isLast = step === 'review';

  return (
    <div className="min-h-screen">
      <SiteHeader
        right={
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted sm:inline" aria-live="polite">{saveFailed ? 'Không tự lưu được' : 'Đã tự lưu trên thiết bị'}</span>
            <Link to="/" className={buttonClass('ghost', 'px-3')}>Thoát</Link>
          </div>
        }
      />
      <div className="container-page pb-40 pt-6 md:pb-16">
        <nav aria-label="Tiến độ đặt hàng">
          <p className="text-sm font-semibold text-muted">
            Bước {index + 1}/{steps.length}: <span className="text-navy">{STEP_LABELS[step]}</span>
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
            <div className="h-full rounded-full bg-navy transition-all" style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
          </div>
          <ol className="mt-4 hidden flex-wrap gap-x-1 gap-y-1 lg:flex">
            {steps.map((s, i) => {
              const done = i < index;
              const reachable = i <= index;
              return (
                <li key={s}>
                  <button
                    type="button"
                    disabled={!reachable}
                    onClick={() => goToIndex(i)}
                    aria-current={i === index ? 'step' : undefined}
                    className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-sm ${i === index ? 'bg-navy text-white' : done ? 'text-navy hover:bg-navy/5' : 'text-muted'}`}
                  >
                    {done && <Check aria-hidden className="h-3.5 w-3.5" />}
                    {STEP_LABELS[s]}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {saveFailed && (
          <Notice tone="warning" className="mt-4" title="Không tự lưu được bản nháp">
            Bộ nhớ trình duyệt đầy hoặc bị chặn. Bạn vẫn có thể hoàn tất đơn, nhưng đừng tải lại trang.
          </Notice>
        )}

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_300px]">
          <main>
            {notices.length > 0 && (
              <Notice tone="warning" live className="mb-5" title="Lựa chọn của bạn đã được cập nhật">
                <ul className="list-disc pl-5">{notices.map((n) => <li key={n}>{n}</li>)}</ul>
              </Notice>
            )}
            {errors.length > 0 && (
              <div ref={errorRef} tabIndex={-1} className="mb-5 outline-none">
                <Notice tone="error" live title={sendFailed ? 'Chưa gửi được tới Chạm' : 'Cần hoàn tất trước khi tiếp tục'}>
                  <ul className="list-disc pl-5">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
                </Notice>
              </div>
            )}
            <StepView api={api} goTo={goTo} />

            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 px-5 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-3 backdrop-blur-sm md:static md:mt-10 md:border-0 md:bg-transparent md:p-0">
              <div className="mx-auto flex max-w-6xl items-center gap-3">
                {index > 0 ? (
                  <button type="button" className={buttonClass('secondary', 'px-4')} onClick={() => goToIndex(index - 1)}>
                    <ArrowLeft aria-hidden className="h-4 w-4" /> <span>Quay lại</span>
                  </button>
                ) : (
                  <span />
                )}
                <button type="button" className={buttonClass('ghost', 'px-3 lg:hidden')} onClick={() => setSummaryOpen(true)} aria-haspopup="dialog">
                  <ListChecks aria-hidden className="h-4 w-4" /> <span className="hidden min-[400px]:inline">Tóm tắt</span>
                </button>
                <button type="button" className={buttonClass(isLast ? 'coral' : 'primary', 'ml-auto px-6')} onClick={() => void next()} disabled={submitting}>
                  {isLast ? (submitting ? progressLabel : pendingOrder.current ? 'Gửi lại' : 'Gửi yêu cầu') : 'Tiếp tục'}
                  {isLast ? <Send aria-hidden className="h-4 w-4" /> : <ArrowRight aria-hidden className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </main>

          <aside className="hidden lg:block" aria-label="Tóm tắt đơn">
            <div className="sticky top-24 rounded-2xl border border-line bg-white p-5">
              <h2 className="mb-3 text-base font-semibold">Tóm tắt đơn</h2>
              <OrderSummary draft={draft} />
            </div>
          </aside>
        </div>
      </div>
      <Dialog open={summaryOpen} onClose={() => setSummaryOpen(false)} title="Tóm tắt đơn">
        <OrderSummary draft={draft} />
      </Dialog>
    </div>
  );
}
