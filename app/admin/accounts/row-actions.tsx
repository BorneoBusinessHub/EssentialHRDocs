'use client';
import { useActionState } from 'react';
import { extendExpiry, resetPassword, setDisabled, type Result } from './actions';

type L = { expires: string; extend: string; newPassword: string; resetPassword: string; enable: string; disable: string; saved: string };

export function RowActions({ id, disabled, expiresAt, today, l }: { id: string; disabled: boolean; expiresAt: string; today: string; l: L }) {
  const [s1, extend] = useActionState(async (_: Result | null, fd: FormData) => extendExpiry(id, String(fd.get('expires_at'))), null);
  const [s2, reset] = useActionState(async (_: Result | null, fd: FormData) => resetPassword(id, String(fd.get('password'))), null);
  const [s3, toggle] = useActionState<Result | null>(async () => setDisabled(id, !disabled), null);
  const note = (s: Result | null) =>
    s && (s.ok ? <span className="text-xs text-ok">{l.saved}</span> : <span role="alert" className="text-xs text-danger">{s.error}</span>);
  return (
    <>
      <form action={extend} className="flex items-center gap-1.5">
        <input name="expires_at" type="date" required min={today} defaultValue={expiresAt} aria-label={l.expires} className="field field-sm w-40" />
        <button className="btn btn-quiet btn-sm">{l.extend}</button>
        {note(s1)}
      </form>
      <form action={reset} className="flex items-center gap-1.5">
        <input name="password" type="text" required minLength={8} placeholder={l.newPassword} aria-label={l.newPassword} className="field field-sm w-40" />
        <button className="btn btn-quiet btn-sm">{l.resetPassword}</button>
        {note(s2)}
      </form>
      <form action={toggle} className="flex items-center gap-1.5">
        <button className="btn btn-quiet btn-sm">{disabled ? l.enable : l.disable}</button>
        {note(s3)}
      </form>
    </>
  );
}
