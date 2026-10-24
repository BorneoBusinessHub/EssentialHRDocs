import { getTranslations } from 'next-intl/server';
import { MagnifyingGlass } from '@phosphor-icons/react/ssr';
import { requireAdmin } from '@/lib/access';
import { createAdminClient } from '@/lib/supabase/admin';
import { accountStatus } from '@/lib/accounts';
import { todayMYT } from '@/lib/time';
import type { Profile } from '@/lib/types';
import { CreateForm } from './create-form';
import { RowActions } from './row-actions';

const STATUSES = ['active', 'expiring', 'expired', 'disabled'] as const;
const badge = { active: 'bg-accent-soft text-accent-soft-ink', expiring: 'bg-warn-soft text-warn', expired: 'bg-danger-soft text-danger', disabled: 'bg-surface-2 text-muted' };

export default async function AccountsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await requireAdmin();
  const { q = '', status = '' } = await searchParams;
  const t = await getTranslations('admin');
  const db = createAdminClient();
  const now = new Date();

  const { data } = await db.from('profiles').select('*').eq('role', 'customer').order('expires_at', { ascending: true }).returns<Profile[]>();
  // ponytail: listUsers is capped at 1000 users; page through it (page param) if customers exceed that
  const { data: users, error: usersError } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (usersError) console.error('listUsers failed', usersError);
  const emails = new Map(users?.users.map((u) => [u.id, u.email ?? '']));

  const needle = q.trim().toLowerCase();
  const rows = (data ?? [])
    .map((p) => ({ p, email: emails.get(p.id) ?? '', s: accountStatus(p, now) }))
    .filter((r) => (!status || r.s === status) && (!needle || r.p.company_name.toLowerCase().includes(needle) || r.email.toLowerCase().includes(needle)));

  return (
    <div className="flex flex-col gap-8">
      <h1 className="reveal text-4xl font-semibold tracking-tight">{t('navAccounts')}</h1>
      <div className="reveal shell" style={{ '--i': 1 } as React.CSSProperties}>
        <div className="core p-6">
          <CreateForm
            today={todayMYT(now)}
            l={{ company: t('company'), email: t('email'), password: t('password'), expires: t('expires'), create: t('create'), created: t('created') }}
          />
        </div>
      </div>
      <form className="reveal flex flex-col gap-2 sm:flex-row" style={{ '--i': 2 } as React.CSSProperties}>
        <div className="relative flex-1 sm:max-w-sm">
          <MagnifyingGlass size={18} weight="light" aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={q} placeholder={t('search')} aria-label={t('search')} className="field rounded-full pl-11" />
        </div>
        <select name="status" defaultValue={status} aria-label={t('allStatuses')} className="field w-auto cursor-pointer rounded-full pr-8">
          <option value="">{t('allStatuses')}</option>
          {STATUSES.map((s) => <option key={s} value={s}>{t(`status_${s}`)}</option>)}
        </select>
        <button className="btn btn-quiet">{t('filter')}</button>
      </form>
      <div className="reveal shell" style={{ '--i': 3 } as React.CSSProperties}>
        <div className="core overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>{t('company')}</th><th>{t('email')}</th><th>{t('expires')}</th><th>{t('status')}</th><th>{t('actions')}</th></tr>
            </thead>
            <tbody>
              {rows.map(({ p, email, s }) => (
                <tr key={p.id}>
                  <td className="font-medium">{p.company_name}</td>
                  <td className="text-muted">{email}</td>
                  <td className="whitespace-nowrap font-mono text-xs tabular-nums">{p.expires_at}</td>
                  <td><span className={`badge ${badge[s]}`}>{t(`status_${s}`)}</span></td>
                  <td>
                    <div className="flex flex-col gap-2">
                      <RowActions
                        id={p.id}
                        disabled={p.disabled}
                        expiresAt={p.expires_at ?? ''}
                        today={todayMYT(now)}
                        l={{ expires: t('expires'), extend: t('extend'), newPassword: t('newPassword'), resetPassword: t('resetPassword'), enable: t('enable'), disable: t('disable'), saved: t('saved') }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
