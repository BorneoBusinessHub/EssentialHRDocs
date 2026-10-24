'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, FileDoc, FilePdf, Warning } from '@phosphor-icons/react';
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

export function FillEdit({ userId, templateId, title, html: tpl, fields }: { userId: string; templateId: string; title: string; html: string; fields: Field[] }) {
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
    const d = s && loadDraft(userId, templateId, s);
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
  }, [userId, templateId]);

  // Debounced autosave; skipped until restore has run so we never clobber a draft.
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (!ready) return;
    timer.current = setTimeout(() => {
      const s = store();
      if (s) saveDraft(userId, templateId, { values, html, step }, s);
    }, 500);
    return () => clearTimeout(timer.current);
  }, [ready, userId, templateId, values, html, step]);

  async function download(kind: 'docx' | 'pdf') {
    setError(false);
    setBusy(true);
    try {
      const res = await fetch(`/api/export/${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, title }),
      });
      if (res.status === 401) {
        // full reload on purpose: drop all client state once the session is gone
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = '/login?reason=expired';
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const cd = res.headers.get('Content-Disposition') ?? '';
      const name = /filename\*=UTF-8''([^;]+)/i.exec(cd)?.[1] ?? /filename="?([^";]+)"?/i.exec(cd)?.[1];
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = name ? decodeURIComponent(name) : `document.${kind}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return null;

  if (step === 'edit' && html !== null) {
    return (
      <div className="flex flex-col gap-8">
        <div className="reveal flex flex-col gap-3">
          <h1 className="max-w-[28ch] text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{title}</h1>
          <p className="text-[0.9375rem] text-muted">{t('editHint')}</p>
        </div>
        <div className="reveal" style={{ '--i': 1 } as React.CSSProperties}>
          <Editor initialHtml={html} onChange={setHtml} />
        </div>
        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
            <Warning size={18} weight="regular" className="mt-px shrink-0" aria-hidden />
            {t('exportFailed')}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" disabled={busy} onClick={() => download('docx')} className="btn btn-primary">
            <FileDoc size={18} weight="light" aria-hidden />
            {t('downloadDocx')}
          </button>
          <button type="button" disabled={busy} onClick={() => download('pdf')} className="btn btn-primary">
            <FilePdf size={18} weight="light" aria-hidden />
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
            className="btn btn-quiet sm:ml-auto"
          >
            <ArrowLeft size={16} weight="light" aria-hidden />
            {t('back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="mx-auto flex max-w-2xl flex-col gap-8"
      onSubmit={(e) => {
        e.preventDefault();
        setHtml(fillTemplate(tpl, fields, values));
        setStep('edit');
      }}
    >
      <div className="reveal flex flex-col gap-3">
        <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{title}</h1>
        <p className="text-[0.9375rem] text-muted">{t('fillTitle')}</p>
      </div>
      {fields.length > 0 && (
        <div className="reveal shell" style={{ '--i': 1 } as React.CSSProperties}>
          <div className="core flex flex-col gap-5 p-6 sm:p-8">
            {fields.map((f) => (
              <div key={f.key} className="flex flex-col gap-2">
                <label htmlFor={`f-${f.key}`} className="label">
                  {f.label}
                </label>
                <input
                  id={`f-${f.key}`}
                  value={Object.hasOwn(values, f.key) ? values[f.key] : ''}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                  aria-describedby={f.hint ? `h-${f.key}` : undefined}
                  className="field"
                />
                {f.hint && (
                  <span id={`h-${f.key}`} className="text-sm text-muted">
                    {f.hint}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <button type="submit" className="reveal btn btn-primary self-start" style={{ '--i': 2 } as React.CSSProperties}>
        {t('continue')}
        <span className="btn-orb"><ArrowRight size={15} weight="bold" aria-hidden /></span>
      </button>
    </form>
  );
}
