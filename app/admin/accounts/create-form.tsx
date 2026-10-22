'use client';
import { useActionState } from 'react';
import { createAccount, type Result } from './actions';

type L = { company: string; email: string; password: string; expires: string; create: string; created: string };

export function CreateForm({ l, today }: { l: L; today: string }) {
  const [state, submit, pending] = useActionState(
    async (_: Result | null, fd: FormData): Promise<Result> =>
      createAccount({
        company_name: String(fd.get('company_name')),
        email: String(fd.get('email')),
        password: String(fd.get('password')),
        expires_at: String(fd.get('expires_at')),
      }),
    null,
  );
  return (
    <form action={submit} className="flex flex-wrap items-end gap-2">
      <input name="company_name" required placeholder={l.company} className="rounded border p-2" />
      <input name="email" type="email" required placeholder={l.email} className="rounded border p-2" />
      <input name="password" type="text" required minLength={8} placeholder={l.password} className="rounded border p-2" />
      <input name="expires_at" type="date" required min={today} aria-label={l.expires} className="rounded border p-2" />
      <button disabled={pending} className="rounded bg-black p-2 text-white">{l.create}</button>
      {state && !state.ok && <p role="alert" className="w-full text-red-700">{state.error}</p>}
      {state?.ok && <p className="w-full text-green-700">{l.created}</p>}
    </form>
  );
}
