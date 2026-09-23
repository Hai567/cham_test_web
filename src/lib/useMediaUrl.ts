import { useEffect, useState } from 'react';
import type { MediaItem } from '../domain/types';
import { getMediaStorage } from '../services';

export type MediaUrlState =
  | { status: 'demo' }
  | { status: 'loading' }
  | { status: 'ready'; url: string }
  | { status: 'missing' };

/** Lấy object URL của file trên thiết bị; tự revoke khi unmount. */
export function useMediaUrl(item: Pick<MediaItem, 'id' | 'source'> | null | undefined): MediaUrlState {
  const [state, setState] = useState<MediaUrlState>({ status: 'loading' });
  const id = item?.id;
  const source = item?.source;

  useEffect(() => {
    if (!id) {
      setState({ status: 'missing' });
      return;
    }
    if (source === 'demo') {
      setState({ status: 'demo' });
      return;
    }
    let url: string | null = null;
    let cancelled = false;
    setState({ status: 'loading' });
    getMediaStorage()
      .then((s) => s.get(id))
      .then((blob) => {
        if (cancelled) return;
        if (!blob) return setState({ status: 'missing' });
        url = URL.createObjectURL(blob);
        setState({ status: 'ready', url });
      })
      .catch(() => !cancelled && setState({ status: 'missing' }));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [id, source]);

  return state;
}
