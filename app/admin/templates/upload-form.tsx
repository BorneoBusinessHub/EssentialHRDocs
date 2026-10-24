'use client';
import { useActionState } from 'react';
import { UploadSimple, Warning } from '@phosphor-icons/react';
import { uploadTemplate, type Result } from './actions';

export function UploadForm({ id, label, submit }: { id?: string; label: string; submit: string }) {
  const [s, act, pending] = useActionState(async (_: Result | null, fd: FormData) => uploadTemplate(fd), null);
  return (
    <form action={act} className="@container flex flex-col gap-3">
      <div className="flex flex-col gap-2 @md:flex-row @md:items-center">
        {id && <input type="hidden" name="id" value={id} />}
        <input name="file" type="file" required accept=".docx" aria-label={label} className="field min-w-0 flex-1" />
        <button disabled={pending} className="btn btn-quiet">
          <UploadSimple size={16} weight="light" aria-hidden className={pending ? 'animate-pulse' : ''} />
          {submit}
        </button>
      </div>
      {s && !s.ok && <span role="alert" className="text-sm text-danger">{s.error}</span>}
      {s?.ok &&
        s.warnings?.map((w) => (
          <span key={w} className="flex items-center gap-1.5 text-sm text-warn">
            <Warning size={14} aria-hidden />
            {w}
          </span>
        ))}
    </form>
  );
}
