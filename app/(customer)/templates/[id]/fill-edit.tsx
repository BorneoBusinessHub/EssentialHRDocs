'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Editor } from '@/components/editor';
import { fillTemplate } from '@/lib/placeholders';
import { loadDraft, saveDraft } from '@/lib/draft';
import type { Field } from '@/lib/types';

const store = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export function FillEdit({ templateId, title, html: tpl, fields }: { templateId: string; title: string; html: string; fields: Field[] }) {
  const t = useTranslations('fill');
  const [values, setValues] = useState<Record<string, string>>({});
  const [html, setHtml] = useState<string | null>(null);
  const [step, setStep] = useState<'fill' | 'edit'>('fill');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  // Restore draft once on mount (storage is only available client-side).
  useEffect(() => {
    const s = store();
    const d = s && loadDraft(templateId, s);
    /* eslint-disable react-hooks/set-state-in-effect */
    if (d) {
      setValues(d.values);
      if (d.step === 'edit' && d.html !== null) {
        setHtml(d.html);
        setStep('edit');
      }
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [templateId]);

  // Debounced autosave; skipped until restore has run so we never clobber a draft.
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (!ready) return;
    timer.current = setTimeout(() => {
      const s = store();
      if (s) saveDraft(templateId, { values, html, step }, s);
    }, 500);
    return () => clearTimeout(timer.current);
  }, [ready, templateId, values, html, step]);

  async function download(kind: 'docx' | 'pdf') {
    setError(false);
    setBusy(true);
    try {
      const res = await fetch(`/api/export/${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, title }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const cd = res.headers.get('Content-Disposition') ?? '';
      const name = /filename\*=UTF-8''([^;]+)/i.exec(cd)?.[1] ?? /filename="?([^";]+)"?/i.exec(cd)?.[1];
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = name ? decodeURIComponent(name) : `document.${kind}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return null;

  if (step === 'edit' && html !== null) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-gray-600">{t('editHint')}</p>
        <Editor initialHtml={html} onChange={setHtml} />
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {t('exportFailed')}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => download('docx')} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
            {t('downloadDocx')}
          </button>
          <button type="button" disabled={busy} onClick={() => download('pdf')} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
            {t('downloadPdf')}
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(t('confirmBack'))) {
                setHtml(null);
                setStep('fill');
              }
            }}
            className="rounded border border-gray-300 px-4 py-2"
          >
            {t('back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setHtml(fillTemplate(tpl, fields, values));
        setStep('edit');
      }}
    >
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-sm text-gray-600">{t('fillTitle')}</p>
      {fields.map((f) => (
        <div key={f.key} className="flex flex-col gap-1">
          <label htmlFor={`f-${f.key}`} className="font-medium">
            {f.label}
          </label>
          <input
            id={`f-${f.key}`}
            value={values[f.key] ?? ''}
            onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
            aria-describedby={f.hint ? `h-${f.key}` : undefined}
            className="rounded border border-gray-300 px-3 py-2"
          />
          {f.hint && (
            <span id={`h-${f.key}`} className="text-sm text-gray-500">
              {f.hint}
            </span>
          )}
        </div>
      ))}
      <button type="submit" className="self-start rounded bg-blue-600 px-4 py-2 text-white">
        {t('continue')}
      </button>
    </form>
  );
}
