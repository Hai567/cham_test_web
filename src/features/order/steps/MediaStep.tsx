import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { MediaView } from '../../../components/MediaView';
import { Badge, Notice } from '../../../components/ui';
import { BUSINESS, UPLOAD_LIMITS, formatBytes } from '../../../config/business';
import { countMedia } from '../../../domain/media';
import type { MediaItem } from '../../../domain/types';
import { Uploader } from '../Uploader';
import { StepHeading, type StepProps } from './shared';

const ACCEPT = [...UPLOAD_LIMITS.image.mimeTypes, ...UPLOAD_LIMITS.video.mimeTypes, ...UPLOAD_LIMITS.image.extensions.map((e) => `.${e}`), ...UPLOAD_LIMITS.video.extensions.map((e) => `.${e}`)].join(',');

export function MediaStep({ api }: StepProps) {
  const { draft, addFiles, removeMedia, moveMedia, storageKind, storageError } = api;
  const { images, videos } = countMedia(draft.media);
  const full = images >= BUSINESS.maxImages && videos >= BUSINESS.maxVideos;
  const ready = draft.serviceType === 'ready_video';
  const imageItems = draft.media.filter((m) => m.kind === 'image');
  const videoItems = draft.media.filter((m) => m.kind === 'video');

  return (
    <>
      <StepHeading
        title={ready ? 'Gửi video hoàn chỉnh và ảnh để in' : 'Gửi ảnh và video kỷ niệm'}
        lead={ready ? 'Tải lên video bạn đã dựng xong và ảnh sẽ được in trong khung.' : 'Tải lên ảnh và video gốc. Video của chính khoảnh khắc trong ảnh sẽ mở thêm nhiều lựa chọn.'}
      />
      <div className="mb-4 flex flex-wrap gap-2" aria-live="polite">
        <Badge tone="sky">{images}/{BUSINESS.maxImages} ảnh</Badge>
        <Badge tone="lavender">{videos}/{BUSINESS.maxVideos} video</Badge>
      </div>
      <Uploader
        id="media-upload"
        accept={ACCEPT}
        onFiles={(files) => addFiles(files)}
        title="Kéo thả ảnh, video vào đây"
        hint={`Ảnh ${UPLOAD_LIMITS.image.label}, tối đa ${formatBytes(UPLOAD_LIMITS.image.maxBytes)}/file. Video ${UPLOAD_LIMITS.video.label}, tối đa ${formatBytes(UPLOAD_LIMITS.video.maxBytes)}/file. Video thành phẩm đề xuất ${BUSINESS.montageDuration.min}–${BUSINESS.montageDuration.max} giây.`}
        disabled={full}
        disabledReason={full ? 'Đã đủ số lượng. Xóa bớt file để thêm file khác.' : undefined}
      />
      {storageError || storageKind === 'memory' ? (
        <Notice tone="warning" className="mt-3" title="File chỉ được giữ trong phiên này">
          Trình duyệt không cho lưu file lâu dài. Nếu tải lại trang, bạn cần chọn lại file (các lựa chọn khác vẫn được giữ).
        </Notice>
      ) : (
        <p className="help mt-3">File chỉ được lưu trên thiết bị này. Bản thử nghiệm không gửi file tới máy chủ nào.</p>
      )}

      {draft.media.length === 0 ? (
        <p className="mt-8 rounded-xl bg-white p-5 text-center text-muted">Chưa có file nào. Bắt đầu với ảnh bạn muốn in và video của cùng khoảnh khắc.</p>
      ) : (
        <div className="mt-8 space-y-8">
          {imageItems.length > 0 && <MediaGroup title="Ảnh" items={imageItems} targetId={draft.printTarget.type === 'media' ? draft.printTarget.mediaId : null} onRemove={removeMedia} onMove={moveMedia} reorder />}
          {videoItems.length > 0 && <MediaGroup title="Video" items={videoItems} targetId={null} onRemove={removeMedia} onMove={moveMedia} />}
        </div>
      )}
    </>
  );
}

function MediaGroup({ title, items, targetId, onRemove, onMove, reorder = false }: { title: string; items: MediaItem[]; targetId: string | null; onRemove: (id: string) => void; onMove: (id: string, d: -1 | 1) => void; reorder?: boolean }) {
  return (
    <section aria-label={title}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {reorder && items.length > 1 && <p className="help">Thứ tự ảnh là thứ tự Chạm dùng khi dựng montage.</p>}
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((m, i) => (
          <li key={m.id} className="overflow-hidden rounded-xl border border-line bg-white">
            <MediaView item={m} className="aspect-square" showKind />
            <div className="p-2.5">
              <p className="truncate text-sm font-medium" title={m.name}>{m.name}</p>
              <p className="text-xs text-muted">
                {formatBytes(m.size)}
                {m.durationSec ? `, ${Math.round(m.durationSec)} giây` : ''}
              </p>
              {m.id === targetId && <span className="mt-1 inline-block"><Badge tone="coral">Ảnh in</Badge></span>}
              <div className="mt-2 flex items-center justify-end gap-1">
                {reorder && (
                  <>
                    <IconButton label={`Đưa ${m.name} lên trước`} disabled={i === 0} onClick={() => onMove(m.id, -1)}><ChevronUp className="h-5 w-5" /></IconButton>
                    <IconButton label={`Đưa ${m.name} ra sau`} disabled={i === items.length - 1} onClick={() => onMove(m.id, 1)}><ChevronDown className="h-5 w-5" /></IconButton>
                  </>
                )}
                <IconButton label={`Xóa ${m.name}`} onClick={() => onRemove(m.id)} danger><Trash2 className="h-5 w-5" /></IconButton>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function IconButton({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className={`inline-flex h-11 w-11 items-center justify-center rounded-full disabled:opacity-30 ${danger ? 'text-danger hover:bg-danger-soft' : 'text-navy hover:bg-navy/5'}`}>
      <span aria-hidden>{children}</span>
    </button>
  );
}
