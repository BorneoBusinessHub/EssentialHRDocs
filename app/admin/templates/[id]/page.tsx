import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from '@phosphor-icons/react/ssr';
import { getTranslations } from 'next-intl/server';
import { requireAdmin } from '@/lib/access';
import { createAdminClient } from '@/lib/supabase/admin';
import { detectKeys } from '@/lib/placeholders';
import { sanitizeDocHtml } from '@/lib/export/sanitize';
import type { Template } from '@/lib/types';
import { Editor, type EditorL } from '../editor';
import { UploadForm } from '../upload-form';

export default async function TemplatePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
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
    <div className="flex flex-col gap-8">
      <Link href="/admin/templates" className="reveal btn btn-quiet btn-sm self-start">
        <ArrowLeft size={14} weight="light" aria-hidden />
        {t('navTemplates')}
      </Link>
      <div className="reveal flex flex-col gap-4" style={{ '--i': 1 } as React.CSSProperties}>
        <span className={`badge self-start ${tpl.published ? 'bg-accent-soft text-accent-soft-ink' : 'bg-surface-2 text-muted'}`}>
          {tpl.published ? t('tplPublished') : t('tplDraft')}
        </span>
        <h1 className="max-w-[30ch] text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{tpl.title}</h1>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className="reveal flex flex-col gap-6 lg:sticky lg:top-24" style={{ '--i': 2 } as React.CSSProperties}>
          <div className="shell">
            <div className="core flex flex-col gap-6 p-6">
              <UploadForm id={id} label={t('replaceFile')} submit={t('replaceFile')} />
              {warnings.length > 0 && (
                <div role="alert" className="rounded-2xl bg-warn-soft px-4 py-3 text-sm text-warn">
                  <strong className="font-semibold">{t('warnings')}</strong>
                  <ul className="mt-1 list-disc pl-5">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
                </div>
              )}
              <Editor key={tpl.updated_at} id={id} init={{ title: tpl.title, category: tpl.category, description: tpl.description, tags: tpl.tags, fields: tpl.fields }} published={tpl.published} l={l} />
            </div>
          </div>
        </div>
        <section className="reveal flex flex-col gap-3" style={{ '--i': 3 } as React.CSSProperties}>
          <h2 className="px-1 text-sm font-medium text-muted">{t('preview')}</h2>
          <div className="shell">
            <div className="core doc-paper overflow-x-auto px-6 py-8 sm:px-12 sm:py-12" dangerouslySetInnerHTML={{ __html: sanitizeDocHtml(tpl.html) }} />
          </div>
        </section>
      </div>
    </div>
  );
}
