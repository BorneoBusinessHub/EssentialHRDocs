import { getTranslations } from 'next-intl/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { accountStatus } from '@/lib/accounts';
import { todayMYT } from '@/lib/time';
import type { Profile } from '@/lib/types';
import { CreateForm } from './create-form';
import { RowActions } from './row-actions';

const STATUSES = ['active', 'expiring', 'expired', 'disabled'] as const;
const badge = { active: 'bg-green-100', expiring: 'bg-yellow-100', expired: 'bg-red-100', disabled: 'bg-zinc-200' };

export default async function AccountsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q = '', status = '' } = await searchParams;
  const t = await getTranslations('admin');
  const db = createAdminClient();
  const now = new Date();

  const { data } = await db.from('profiles').select('*').eq('role', 'customer').order('expires_at', { ascending: true }).returns<Profile[]>();
  // ponytail: listUsers is capped at 1000 users; page through it (page param) if customers exceed that
  const { data: users } = await db.auth.admin.listUsers({ perPage: 1000 });
  const emails = new Map(users?.users.map((u) => [u.id, u.email ?? '']));

  const needle = q.trim().toLowerCase();
  const rows = (data ?? [])
    .map((p) => ({ p, email: emails.get(p.id) ?? '', s: accountStatus(p, now) }))
    .filter((r) => (!status || r.s === status) && (!needle || r.p.company_name.toLowerCase().includes(needle) || r.email.toLowerCase().includes(needle)));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t('navAccounts')}</h1>
      <CreateForm
        today={todayMYT(now)}
        l={{ company: t('company'), email: t('email'), password: t('password'), expires: t('expires'), create: t('create'), created: t('created') }}
      />
      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder={t('search')} className="rounded border p-2" />
        <select name="status" defaultValue={status} className="rounded border p-2">
          <option value="">{t('allStatuses')}</option>
          {STATUSES.map((s) => <option key={s} value={s}>{t(`status_${s}`)}</option>)}
        </select>
        <button className="rounded border p-2">{t('filter')}</button>
      </form>
      <table className="w-full text-left text-sm">
        <thead>
          <tr><th>{t('company')}</th><th>{t('email')}</th><th>{t('expires')}</th><th>{t('status')}</th><th>{t('actions')}</th></tr>
        </thead>
        <tbody>
          {rows.map(({ p, email, s }) => (
            <tr key={p.id} className="border-t align-top">
              <td className="py-2">{p.company_name}</td>
              <td>{email}</td>
              <td>{p.expires_at}</td>
              <td><span className={`rounded px-2 py-0.5 ${badge[s]}`}>{t(`status_${s}`)}</span></td>
              <td className="flex flex-col gap-1 py-2">
                <RowActions
                  id={p.id}
                  disabled={p.disabled}
                  expiresAt={p.expires_at ?? ''}
                  today={todayMYT(now)}
                  l={{ expires: t('expires'), extend: t('extend'), newPassword: t('newPassword'), resetPassword: t('resetPassword'), enable: t('enable'), disable: t('disable'), saved: t('saved') }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
