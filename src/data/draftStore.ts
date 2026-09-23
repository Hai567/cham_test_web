import { createEmptyDraft } from '../domain/draft';
import type { Draft } from '../domain/types';

const KEY = 'cham.draft.v1';

export function loadDraft(): Draft {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return createEmptyDraft();
    const parsed = JSON.parse(raw) as Partial<Draft>;
    if (parsed.version !== 1) return createEmptyDraft();
    const empty = createEmptyDraft();
    return { ...empty, ...parsed, brief: { ...empty.brief, ...parsed.brief }, contact: { ...empty.contact, ...parsed.contact } };
  } catch {
    return createEmptyDraft();
  }
}

/** Trả về false nếu không lưu được (localStorage đầy/bị chặn) để UI cảnh báo. */
export function saveDraft(draft: Draft): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function clearDraft() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* bỏ qua */
  }
}
