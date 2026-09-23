import { Play } from 'lucide-react';
import type { DemoArt, Mode } from '../domain/types';
import { MemoryArt } from './MemoryArt';

const STRIP: DemoArt[] = ['birthday', 'mountain', 'kitchen'];

/** Sơ đồ cấu trúc trải nghiệm A/B/C (không phải template hình ảnh). */
export function ModeSchematic({ mode, muted = false }: { mode: Mode; muted?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${muted ? 'opacity-50 grayscale' : ''}`} aria-hidden>
      {mode !== 'B' ? (
        <div className="relative h-16 w-12 overflow-hidden rounded-[3px] ring-4 ring-[#C8A77A]">
          <MemoryArt art="seaside" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90">
              <Play className="h-3 w-3 text-navy" />
            </span>
          </span>
        </div>
      ) : (
        <div className="h-16 w-12 overflow-hidden rounded-[3px] ring-4 ring-[#C8A77A]">
          <MemoryArt art="seaside" />
        </div>
      )}
      {mode !== 'A' && (
        <>
          <svg viewBox="0 0 24 12" className="h-3 w-6 text-muted"><path d="M0 6h20m-5-5 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
          <div className="flex gap-1">
            {STRIP.map((a) => (
              <div key={a} className="h-10 w-8 overflow-hidden rounded-sm">
                <MemoryArt art={a} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
