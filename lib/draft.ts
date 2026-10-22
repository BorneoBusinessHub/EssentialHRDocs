export type Draft = { values: Record<string, string>; html: string | null; step: 'fill' | 'edit' };

export const draftKey = (templateId: string) => `draft:${templateId}`;

export function loadDraft(id: string, storage: Storage): Draft | null {
  try {
    const d = JSON.parse(storage.getItem(draftKey(id)) ?? 'null');
    if (!d || typeof d.values !== 'object' || (d.step !== 'fill' && d.step !== 'edit')) return null;
    return { values: d.values ?? {}, html: typeof d.html === 'string' ? d.html : null, step: d.step };
  } catch {
    return null;
  }
}

export function saveDraft(id: string, d: Draft, storage: Storage): void {
  try { storage.setItem(draftKey(id), JSON.stringify(d)); } catch {}
}

export function clearDraft(id: string, storage: Storage): void {
  try { storage.removeItem(draftKey(id)); } catch {}
}
