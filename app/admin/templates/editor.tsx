'use client';
import { useActionState, useState } from 'react';
import { saveTemplateMeta, setPublished, type Result } from './actions';
import type { Field } from '@/lib/types';

export type EditorL = Record<'tplTitle' | 'category' | 'description' | 'tags' | 'fields' | 'fieldLabel' | 'fieldHint' | 'saveChanges' | 'publish' | 'unpublish' | 'missingLabels' | 'saved', string>;
type Meta = { title: string; category: string; description: string; tags: string[]; fields: Field[] };

export function Editor({ id, init, published, l }: { id: string; init: Meta; published: boolean; l: EditorL }) {
  const [fields, setFields] = useState(init.fields);
  const [s1, save, saving] = useActionState(async (_: Result | null, fd: FormData) => {
    const tags = String(fd.get('tags') ?? '').split(',').map((t) => t.trim()).filter(Boolean);
    return saveTemplateMeta(id, { title: String(fd.get('title')), category: String(fd.get('category')), description: String(fd.get('description')), tags, fields });
  }, null);
  const [s2, toggle] = useActionState<Result | null>(async () => setPublished(id, !published), null);
  const missing = fields.filter((f) => !f.label.trim()).map((f) => f.key);
  const note = (s: Result | null) => s && (s.ok ? <span className="text-sm text-ok">{l.saved}</span> : <span role="alert" className="text-sm text-danger">{s.error}</span>);
  const set = (i: number, patch: Partial<Field>) => setFields((fs) => fs.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  // ponytail: Publish checks the saved labels server-side; unsaved label edits only affect this client-side hint
  return (
    <div className="flex flex-col gap-5">
      <form action={save} className="flex flex-col gap-4">
        <label className="label flex flex-col gap-2">{l.tplTitle}<input name="title" required defaultValue={init.title} className="field font-normal" /></label>
        <label className="label flex flex-col gap-2">{l.category}<input name="category" required defaultValue={init.category} className="field font-normal" /></label>
        <label className="label flex flex-col gap-2">{l.description}<textarea name="description" rows={3} defaultValue={init.description} className="field font-normal" /></label>
        <label className="label flex flex-col gap-2">{l.tags}<input name="tags" defaultValue={init.tags.join(', ')} className="field font-normal" /></label>
        {fields.length > 0 && <h2 className="label mt-2">{l.fields}</h2>}
        {fields.map((f, i) => (
          <div key={f.key} className="flex flex-col gap-2 rounded-2xl bg-surface-2 p-3">
            <code className="font-mono text-xs text-accent-soft-ink">{`{{${f.key}}}`}</code>
            <input value={f.label} onChange={(e) => set(i, { label: e.target.value })} placeholder={l.fieldLabel} aria-label={`${f.key} ${l.fieldLabel}`} className="field field-sm" />
            <input value={f.hint ?? ''} onChange={(e) => set(i, { hint: e.target.value })} placeholder={l.fieldHint} aria-label={`${f.key} ${l.fieldHint}`} className="field field-sm" />
          </div>
        ))}
        <div className="flex items-center gap-3">
          <button disabled={saving} className="btn btn-quiet">{l.saveChanges}</button>
          {note(s1)}
        </div>
      </form>
      <form action={toggle} className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <button disabled={!published && missing.length > 0} className={`btn ${published ? 'btn-quiet' : 'btn-primary'}`}>{published ? l.unpublish : l.publish}</button>
        {!published && missing.length > 0 && <span className="text-sm text-warn">{l.missingLabels.replace('{keys}', missing.join(', '))}</span>}
        {note(s2)}
      </form>
    </div>
  );
}
