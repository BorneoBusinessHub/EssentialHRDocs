import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowUpRight, FileText } from '@phosphor-icons/react/ssr';
import { requireAdmin } from '@/lib/access';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Template } from '@/lib/types';
import { UploadForm } from './upload-form';

export default async function TemplatesPage() {
  await requireAdmin();
  const t = await getTranslations('admin');
  const { data } = await createAdminClient()
    .from('templates')
    .select('id,title,category,published,updated_at')
    .order('updated_at', { ascending: false })
    .returns<Pick<Template, 'id' | 'title' | 'category' | 'published' | 'updated_at'>[]>();
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <h1 className="reveal text-4xl font-semibold tracking-tight">{t('navTemplates')}</h1>
        <div className="reveal w-full lg:max-w-lg" style={{ '--i': 1 } as React.CSSProperties}>
          <UploadForm label={t('uploadTemplate')} submit={t('upload')} />
        </div>
      </div>
      <div className="reveal shell" style={{ '--i': 2 } as React.CSSProperties}>
        <div className="core overflow-hidden">
          {!data?.length ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-surface-2 text-muted">
                <FileText size={22} weight="light" aria-hidden />
              </span>
              <p className="text-muted">{t('noTemplates')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>{t('tplTitle')}</th><th>{t('category')}</th><th>{t('status')}</th><th>{t('updatedAt')}</th><th /></tr></thead>
                <tbody>
                  {data.map((r) => (
                    <tr key={r.id}>
                      <td className="font-medium">{r.title}</td>
                      <td className="whitespace-nowrap text-muted">{r.category}</td>
                      <td>
                        <span className={`badge ${r.published ? 'bg-accent-soft text-accent-soft-ink' : 'bg-surface-2 text-muted'}`}>
                          {r.published ? t('tplPublished') : t('tplDraft')}
                        </span>
                      </td>
                      <td className="whitespace-nowrap font-mono text-xs tabular-nums text-muted">
                        {new Date(r.updated_at).toLocaleString('en-GB', { timeZone: 'Asia/Kuala_Lumpur' })}
                      </td>
                      <td className="text-right">
                        <Link href={`/admin/templates/${r.id}`} className="btn btn-quiet btn-sm">
                          {t('edit')}
                          <ArrowUpRight size={13} weight="bold" aria-hidden />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
