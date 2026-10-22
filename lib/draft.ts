export type Draft = { values: Record<string, string>; html: string | null; step: 'fill' | 'edit' };

// Scoped per user so a shared browser never shows one account's draft to another.
export const draftKey = (userId: string, templateId: string) => `draft:${userId}:${templateId}`;

export function loadDraft(userId: string, id: string, storage: Storage): Draft | null {
  try {
    const d = JSON.parse(storage.getItem(draftKey(userId, id)) ?? 'null');
    if (!d || typeof d.values !== 'object' || (d.step !== 'fill' && d.step !== 'edit')) return null;
    return { values: d.values ?? {}, html: typeof d.html === 'string' ? d.html : null, step: d.step };
  } catch {
    return null;
  }
}

export function saveDraft(userId: string, id: string, d: Draft, storage: Storage): void {
  try { storage.setItem(draftKey(userId, id), JSON.stringify(d)); } catch {}
}

export function clearDraft(userId: string, id: string, storage: Storage): void {
  try { storage.removeItem(draftKey(userId, id)); } catch {}
}

// Remove every draft (all users) from this browser; called on logout.
export function clearAllDrafts(storage: Storage): void {
  try {
    for (let i = storage.length - 1; i >= 0; i--) {
      const k = storage.key(i);
      if (k?.startsWith('draft:')) storage.removeItem(k);
    }
  } catch {}
}
