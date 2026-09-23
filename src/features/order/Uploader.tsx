import { Upload } from 'lucide-react';
import { useRef, useState, type DragEvent } from 'react';
import { Notice, Spinner } from '../../components/ui';
import { buttonClass } from '../../components/buttonClass';
import type { RejectedFile } from '../../domain/media';

interface Props {
  id: string;
  accept: string;
  onFiles: (files: File[]) => Promise<RejectedFile[]>;
  title: string;
  hint: string;
  compact?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

/** Vùng tải file: kéo-thả + nút chọn file; lỗi hiển thị ngay dưới vùng tải. */
export function Uploader({ id, accept, onFiles, title, hint, compact = false, disabled = false, disabledReason }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rejected, setRejected] = useState<RejectedFile[]>([]);

  async function handle(list: FileList | null) {
    if (!list || list.length === 0 || disabled) return;
    setBusy(true);
    try {
      setRejected(await onFiles(Array.from(list)));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    void handle(e.dataTransfer.files);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition-colors ${compact ? 'px-4 py-6' : 'px-6 py-10'} ${over ? 'border-lavender bg-lavender-soft' : 'border-line bg-white'} ${disabled ? 'opacity-60' : ''}`}
      >
        <Upload aria-hidden className="h-7 w-7 text-navy" />
        <p className="mt-2 font-semibold text-navy">{title}</p>
        <p className="help mt-1 max-w-md" id={`${id}-hint`}>{hint}</p>
        <input
          ref={input}
          id={id}
          type="file"
          multiple
          accept={accept}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => void handle(e.target.files)}
        />
        <button type="button" className={buttonClass('secondary', 'mt-4')} disabled={disabled || busy} onClick={() => input.current?.click()} aria-describedby={`${id}-hint`}>
          Chọn file từ thiết bị
        </button>
        {busy && <div className="mt-3"><Spinner label="Đang lưu file trên thiết bị..." /></div>}
        {disabled && disabledReason && <p className="mt-3 text-sm font-medium text-navy">{disabledReason}</p>}
      </div>
      {rejected.length > 0 && (
        <Notice tone="error" live className="mt-3" title={`${rejected.length} file chưa được thêm`}>
          <ul className="mt-1 space-y-1">
            {rejected.map((r, i) => (
              <li key={`${r.name}-${i}`}><span className="font-medium break-all">{r.name}</span>: {r.reason}</li>
            ))}
          </ul>
        </Notice>
      )}
    </div>
  );
}
