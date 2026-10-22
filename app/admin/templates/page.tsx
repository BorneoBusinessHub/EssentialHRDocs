import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
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
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t('navTemplates')}</h1>
      <UploadForm label={t('uploadTemplate')} submit={t('upload')} />
      {!data?.length && <p>{t('noTemplates')}</p>}
      <table className="w-full text-left text-sm">
        <thead><tr><th>{t('tplTitle')}</th><th>{t('category')}</th><th>{t('status')}</th><th>{t('updatedAt')}</th><th /></tr></thead>
        <tbody>
          {data?.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="py-2">{r.title}</td>
              <td>{r.category}</td>
              <td>{r.published ? t('tplPublished') : t('tplDraft')}</td>
              <td>{new Date(r.updated_at).toLocaleString('en-GB', { timeZone: 'Asia/Kuala_Lumpur' })}</td>
              <td><Link href={`/admin/templates/${r.id}`} className="underline">{t('edit')}</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
