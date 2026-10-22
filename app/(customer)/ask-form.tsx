'use client';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import { analyse, type AnalyseResult } from '@/lib/ai/analyse';

type State = AnalyseResult | null;

export function AskForm() {
  const t = useTranslations('ask');
  const tr = useTranslations('result');
  const [text, setText] = useState('');
  const [state, action, pending] = useActionState<State, FormData>(
    async (_prev, fd) => analyse(String(fd.get('question') ?? '')),
    null,
  );
  const examples = [t('example1'), t('example2'), t('example3')];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <form action={action} className="flex flex-col gap-3">
        <textarea
          aria-label={t('placeholder')}
          name="question"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          rows={5}
          required
          placeholder={t('placeholder')}
          className="rounded border p-3"
        />
        <div className="text-right text-xs text-zinc-500">{text.length} / 2000</div>
        {state?.status === 'invalid' && <p role="alert" className="text-red-700">{t('invalid')}</p>}
        <div className="flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button key={ex} type="button" onClick={() => setText(ex)} className="rounded-full border px-3 py-1 text-left text-sm">
              {ex}
            </button>
          ))}
        </div>
        <button type="submit" disabled={pending} className="rounded bg-black p-3 text-white disabled:opacity-50">
          {pending ? t('pending') : t('submit')}
        </button>
      </form>

      {state?.status === 'limit' && <p role="alert">{t('limit')}</p>}
      {state?.status === 'error' && (
        <p role="alert">
          {t('aiFailure')}{' '}
          <Link href="/library" className="underline">{t('browseLibrary')}</Link>
        </p>
      )}
      {state?.status === 'ok' && (
        <section className="flex flex-col gap-4">
          <ol className="list-decimal space-y-2 pl-5">
            {state.analysis.suggestion.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
          {state.analysis.is_hr && (
            <div className="grid gap-3 sm:grid-cols-2">
              {state.templates.slice(0, 3).map((tpl) => (
                <div key={tpl.id} className="flex flex-col gap-2 rounded border p-4">
                  <h2 className="font-semibold">{tpl.title}</h2>
                  <p className="text-xs text-zinc-500">{tpl.category}</p>
                  <p className="text-sm">{state.analysis.templates.find((x) => x.id === tpl.id)?.reason}</p>
                  <Link href={`/templates/${tpl.id}`} className="mt-auto rounded bg-black p-2 text-center text-white">
                    {tr('useTemplate')}
                  </Link>
                </div>
              ))}
            </div>
          )}
          <p className="text-sm text-zinc-500">{tr('disclaimer')}</p>
        </section>
      )}
    </div>
  );
}
