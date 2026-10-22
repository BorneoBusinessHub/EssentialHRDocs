import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { detectKeys } from '@/lib/placeholders';
import { sanitizeDocHtml } from '@/lib/export/sanitize';
import type { Template } from '@/lib/types';
import { Editor, type EditorL } from '../editor';
import { UploadForm } from '../upload-form';

export default async function TemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations('admin');
  const { data: tpl } = await createAdminClient().from('templates').select('*').eq('id', id).maybeSingle<Template>();
  if (!tpl) notFound();
  const { warnings } = detectKeys(tpl.html);
  const l: EditorL = {
    tplTitle: t('tplTitle'), category: t('category'), description: t('description'), tags: t('tags'), fields: t('fields'),
    fieldLabel: t('fieldLabel'), fieldHint: t('fieldHint'), saveChanges: t('saveChanges'), publish: t('publish'),
    unpublish: t('unpublish'), saved: t('saved'), missingLabels: t('missingLabels', { keys: '{keys}' }),
  };
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{tpl.title}</h1>
      <UploadForm id={id} label={t('replaceFile')} submit={t('replaceFile')} />
      {warnings.length > 0 && (
        <div role="alert" className="rounded border border-yellow-400 p-2">
          <strong>{t('warnings')}</strong>
          <ul className="list-disc pl-5">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </div>
      )}
      <Editor id={id} init={{ title: tpl.title, category: tpl.category, description: tpl.description, tags: tpl.tags, fields: tpl.fields }} published={tpl.published} l={l} />
      <h2 className="font-semibold">{t('preview')}</h2>
      <div className="rounded border p-4" dangerouslySetInnerHTML={{ __html: sanitizeDocHtml(tpl.html) }} />
    </div>
  );
}
