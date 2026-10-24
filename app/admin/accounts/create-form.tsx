'use client';
import { useActionState } from 'react';
import { CheckCircle, Plus } from '@phosphor-icons/react';
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
  const fields = [
    { name: 'company_name', label: l.company, type: 'text' },
    { name: 'email', label: l.email, type: 'email' },
    { name: 'password', label: l.password, type: 'text', minLength: 8 },
    { name: 'expires_at', label: l.expires, type: 'date', min: today },
  ];
  return (
    <form action={submit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.2fr_1fr_auto_auto] lg:items-end">
        {fields.map(({ name, label, ...rest }) => (
          <div key={name} className="flex flex-col gap-2">
            <label htmlFor={`new-${name}`} className="label">{label}</label>
            <input id={`new-${name}`} name={name} required {...rest} className="field" />
          </div>
        ))}
        <button disabled={pending} className="btn btn-primary sm:col-span-2 lg:col-span-1">
          <Plus size={16} weight="bold" aria-hidden />
          {l.create}
        </button>
      </div>
      {state && !state.ok && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      {state?.ok && (
        <p className="flex items-center gap-1.5 text-sm text-ok">
          <CheckCircle size={16} aria-hidden />
          {l.created}
        </p>
      )}
    </form>
  );
}
