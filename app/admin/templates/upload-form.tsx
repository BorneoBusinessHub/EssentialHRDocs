'use client';
import { useActionState } from 'react';
import { uploadTemplate, type Result } from './actions';

export function UploadForm({ id, label, submit }: { id?: string; label: string; submit: string }) {
  const [s, act, pending] = useActionState(async (_: Result | null, fd: FormData) => uploadTemplate(fd), null);
  return (
    <form action={act} className="flex flex-wrap items-center gap-2">
      {id && <input type="hidden" name="id" value={id} />}
      <input name="file" type="file" required accept=".docx" aria-label={label} className="rounded border p-1" />
      <button disabled={pending} className="rounded border px-2 py-1">{submit}</button>
      {s && !s.ok && <span role="alert" className="text-red-700">{s.error}</span>}
      {s?.ok && s.warnings?.map((w) => <span key={w} className="text-yellow-700">{w}</span>)}
    </form>
  );
}
