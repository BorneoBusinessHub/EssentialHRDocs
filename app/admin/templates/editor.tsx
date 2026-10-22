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
  const note = (s: Result | null) => s && (s.ok ? <span className="text-green-700">{l.saved}</span> : <span role="alert" className="text-red-700">{s.error}</span>);
  const set = (i: number, patch: Partial<Field>) => setFields((fs) => fs.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  // ponytail: Publish checks the saved labels server-side; unsaved label edits only affect this client-side hint
  return (
    <div className="flex flex-col gap-4">
      <form action={save} className="flex flex-col gap-3">
        <label className="flex flex-col">{l.tplTitle}<input name="title" required defaultValue={init.title} className="rounded border p-2" /></label>
        <label className="flex flex-col">{l.category}<input name="category" required defaultValue={init.category} className="rounded border p-2" /></label>
        <label className="flex flex-col">{l.description}<textarea name="description" defaultValue={init.description} className="rounded border p-2" /></label>
        <label className="flex flex-col">{l.tags}<input name="tags" defaultValue={init.tags.join(', ')} className="rounded border p-2" /></label>
        <h2 className="font-semibold">{l.fields}</h2>
        {fields.map((f, i) => (
          <div key={f.key} className="flex flex-wrap items-center gap-2">
            <code className="w-48">{`{{${f.key}}}`}</code>
            <input value={f.label} onChange={(e) => set(i, { label: e.target.value })} placeholder={l.fieldLabel} aria-label={`${f.key} ${l.fieldLabel}`} className="rounded border p-1" />
            <input value={f.hint ?? ''} onChange={(e) => set(i, { hint: e.target.value })} placeholder={l.fieldHint} aria-label={`${f.key} ${l.fieldHint}`} className="rounded border p-1" />
          </div>
        ))}
        <div className="flex items-center gap-2">
          <button disabled={saving} className="rounded border px-3 py-1">{l.saveChanges}</button>
          {note(s1)}
        </div>
      </form>
      <form action={toggle} className="flex items-center gap-2">
        <button disabled={!published && missing.length > 0} className="rounded border px-3 py-1 disabled:opacity-50">{published ? l.unpublish : l.publish}</button>
        {!published && missing.length > 0 && <span className="text-yellow-700">{l.missingLabels.replace('{keys}', missing.join(', '))}</span>}
        {note(s2)}
      </form>
    </div>
  );
}
