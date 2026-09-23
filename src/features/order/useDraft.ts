import { useCallback, useEffect, useRef, useState } from 'react';
import { clearDraft, loadDraft, saveDraft } from '../../data/draftStore';
import { StorageFullError } from '../../data/errors';
import type { MediaStorage } from '../../data/MediaStorage';
import { reconcileDraft, switchService } from '../../domain/draft';
import { moveWithinKind, validateIncomingFiles, type RejectedFile } from '../../domain/media';
import type { Draft, MediaItem, ServiceType } from '../../domain/types';
import { clampStepIndex } from '../../domain/wizard';
import { randomId } from '../../lib/ids';
import { probeFile } from '../../lib/probe';
import { getMediaStorage } from '../../services';

function initialDraft(): Draft {
  const { draft } = reconcileDraft(loadDraft());
  return { ...draft, stepIndex: clampStepIndex(draft, draft.stepIndex) };
}

export function useDraft() {
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const ref = useRef(draft);
  const [notices, setNotices] = useState<string[]>([]);
  const [saveFailed, setSaveFailed] = useState(false);
  const [storage, setStorage] = useState<MediaStorage | null>(null);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    let alive = true;
    getMediaStorage()
      .then((s) => alive && setStorage(s))
      .catch(() => alive && setStorageError(true));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setSaveFailed(!saveDraft(draft));
  }, [draft]);

  const commit = useCallback((next: Draft, newNotices: string[]) => {
    ref.current = next;
    setDraft(next);
    if (newNotices.length) setNotices(newNotices);
  }, []);

  const update = useCallback(
    (fn: (d: Draft) => Draft) => {
      const r = reconcileDraft(fn(ref.current));
      commit(r.draft, r.notices);
    },
    [commit],
  );

  const setService = useCallback(
    (type: ServiceType) => {
      const r = switchService(ref.current, type);
      commit(r.draft, r.notices);
    },
    [commit],
  );

  /** Validate, đọc metadata, lưu blob vào IndexedDB rồi thêm vào draft. */
  const addFiles = useCallback(
    async (files: File[], opts: { selectAsTarget?: boolean } = {}): Promise<RejectedFile[]> => {
      const s = storage ?? (await getMediaStorage());
      const { accepted, rejected } = validateIncomingFiles(ref.current.media, files);
      const added: MediaItem[] = [];
      for (const { file, kind } of accepted) {
        const id = randomId();
        try {
          const meta = await probeFile(file, kind);
          await s.put(id, file);
          added.push({ id, kind, name: file.name, size: file.size, mimeType: file.type || kind, addedAt: new Date().toISOString(), source: 'upload', ...meta });
        } catch (err) {
          rejected.push({
            name: file.name,
            reason: err instanceof StorageFullError ? err.message : 'Không lưu được file trên thiết bị. Hãy thử lại.',
          });
        }
      }
      if (added.length) {
        const firstImage = added.find((m) => m.kind === 'image');
        update((d) => ({
          ...d,
          media: [...d.media, ...added],
          printTarget: opts.selectAsTarget && firstImage ? { type: 'media', mediaId: firstImage.id } : d.printTarget,
        }));
      }
      return rejected;
    },
    [storage, update],
  );

  const removeMedia = useCallback(
    (id: string) => {
      const item = ref.current.media.find((m) => m.id === id);
      update((d) => ({ ...d, media: d.media.filter((m) => m.id !== id) }));
      if (item?.source === 'upload') void getMediaStorage().then((s) => s.remove(id)).catch(() => undefined);
    },
    [update],
  );

  const moveMedia = useCallback((id: string, dir: -1 | 1) => update((d) => ({ ...d, media: moveWithinKind(d.media, id, dir) })), [update]);

  const reset = useCallback(() => {
    clearDraft();
    const r = reconcileDraft(loadDraft());
    commit(r.draft, []);
  }, [commit]);

  return {
    draft,
    update,
    setService,
    addFiles,
    removeMedia,
    moveMedia,
    reset,
    notices,
    clearNotices: () => setNotices([]),
    saveFailed,
    storageKind: storage?.kind ?? null,
    storageError,
  };
}

export type DraftApi = ReturnType<typeof useDraft>;
