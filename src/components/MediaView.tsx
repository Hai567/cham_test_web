import { ImageOff, Play } from 'lucide-react';
import type { MediaItem, Mood } from '../domain/types';
import { useMediaUrl } from '../lib/useMediaUrl';
import { MemoryArt } from './MemoryArt';

interface Props {
  item: MediaItem | null | undefined;
  className?: string;
  /** Với video: phát (muted, loop) thay vì chỉ hiện frame đầu. */
  play?: boolean;
  mood?: Mood | null;
  /** Hiện biểu tượng video ở góc. */
  showKind?: boolean;
  /** Frame cố định (giây) cho video thumbnail. */
  atSecond?: number;
}

/** Hiển thị một media: minh họa mẫu, ảnh, hoặc video từ thiết bị. Luôn object-cover. */
export function MediaView({ item, className = '', play = false, mood = null, showKind = false, atSecond = 0.1 }: Props) {
  const state = useMediaUrl(item);
  const alt = item ? (item.source === 'demo' ? `Minh họa mẫu: ${item.name}` : item.name) : '';

  let content: JSX.Element;
  if (!item || state.status === 'missing') {
    content = (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-paper p-2 text-center text-[13px] text-muted">
        <ImageOff aria-hidden className="h-5 w-5" />
        <span>{item ? 'File không còn trên thiết bị' : 'Chưa có ảnh'}</span>
      </div>
    );
  } else if (state.status === 'loading') {
    content = <div className="h-full w-full animate-pulse bg-navy/5" aria-label="Đang tải" />;
  } else if (state.status === 'demo') {
    content = <MemoryArt art={item.demoArt ?? 'seaside'} alive={play && item.kind === 'video'} mood={mood} title={alt} />;
  } else if (item.kind === 'image') {
    content = <img src={state.url} alt={alt} className="h-full w-full object-cover" />;
  } else {
    content = play ? (
      <video src={state.url} className="h-full w-full object-cover" muted playsInline autoPlay loop aria-label={alt} />
    ) : (
      <video src={`${state.url}#t=${atSecond}`} className="h-full w-full object-cover" muted playsInline preload="metadata" aria-label={alt} />
    );
  }

  return (
    <div className={`relative overflow-hidden bg-navy/5 ${className}`}>
      {content}
      {showKind && item?.kind === 'video' && (
        <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-ink/80 px-2 py-0.5 text-xs font-semibold text-white">
          <Play aria-hidden className="h-3 w-3" /> Video
        </span>
      )}
    </div>
  );
}
