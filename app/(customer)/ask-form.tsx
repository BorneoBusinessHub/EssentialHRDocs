'use client';
import Link from 'next/link';
import { useActionState, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, ArrowUpRight, Warning } from '@phosphor-icons/react';
import { analyse, type AnalyseResult } from '@/lib/ai/analyse';
import type { TemplateSummary } from '@/lib/types';

type State = AnalyseResult | null;
const stagger = (i: number) => ({ '--i': i }) as React.CSSProperties;
const EXAMPLE_KEYS = ['example1', 'example2', 'example3', 'example4', 'example5', 'example6', 'example7', 'example8', 'example9', 'example10', 'example11'] as const;

export function AskForm() {
  const t = useTranslations('ask');
  const tr = useTranslations('result');
  const [text, setText] = useState('');
  const [state, action, pending] = useActionState<State, FormData>(
    async (_prev, fd) => analyse(String(fd.get('question') ?? '')),
    null,
  );
  const examples = EXAMPLE_KEYS.map((k) => t(k));
  // results render below the example list, so bring them into view after each answer
  const results = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!state || state.status === 'invalid') return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    results.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, [state]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      <h1 className="reveal max-w-[18ch] text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">{t('title')}</h1>

      <form action={action} className="reveal flex flex-col gap-5" style={stagger(1)}>
        <div className="shell">
          <div className="core flex flex-col">
            <textarea
              aria-label={t('placeholder')}
              name="question"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={2000}
              rows={5}
              required
              placeholder={t('placeholder')}
              className="min-h-40 resize-y rounded-t-[1.375rem] bg-transparent px-6 pt-5 text-[1.0625rem] leading-relaxed text-ink outline-none placeholder:text-muted"
            />
            <div className="flex items-center justify-between gap-3 px-3 pb-3 pl-6">
              <span className="font-mono text-xs tabular-nums text-muted">{text.length} / 2000</span>
              <button type="submit" disabled={pending} className="btn btn-primary">
                {pending ? t('pending') : t('submit')}
                <span className={`btn-orb ${pending ? 'animate-pulse' : ''}`}><ArrowRight size={15} weight="bold" aria-hidden /></span>
              </button>
            </div>
          </div>
        </div>
        {state?.status === 'invalid' && <Alert>{t('invalid')}</Alert>}
        <div className="flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button key={ex} type="button" onClick={() => setText(ex)} className="chip cursor-pointer text-left">
              {ex}
            </button>
          ))}
        </div>
      </form>

      <div ref={results} className="scroll-mt-28 flex flex-col gap-10 empty:hidden">
      {state?.status === 'error' && (
        <Alert>
          {t('aiFailure')}{' '}
          <Link href="/library" className="font-medium underline underline-offset-4">{t('browseLibrary')}</Link>
        </Alert>
      )}
      {state?.status === 'fallback' && (
        <section className="flex flex-col gap-6">
          <Alert>{state.reason === 'limit' ? t('limit') : t('fallbackNote')}</Alert>
          {state.templates.length > 0 ? (
            <>
              <p className="text-[0.9375rem] text-muted">{t('fallbackMatches')}</p>
              <TemplateCards items={state.templates} note={(tpl) => tpl.description} cta={tr('useTemplate')} />
            </>
          ) : (
            <p className="text-[0.9375rem] text-muted">
              {t('fallbackNone')}{' '}
              <Link href="/library" className="font-medium text-ink underline underline-offset-4">{t('browseLibrary')}</Link>
            </p>
          )}
        </section>
      )}
      {state?.status === 'ok' && (
        <section className="flex flex-col gap-8">
          <ol className="flex flex-col gap-3">
            {state.analysis.suggestion.map((s, i) => (
              <li key={i} className="reveal flex gap-4" style={stagger(i)}>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-xs font-medium text-accent-soft-ink">
                  {i + 1}
                </span>
                <span className="pt-0.5 leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
          {state.analysis.is_hr && (
            <TemplateCards
              items={state.templates}
              note={(tpl) => state.analysis.templates.find((x) => x.id === tpl.id)?.reason}
              cta={tr('useTemplate')}
            />
          )}
          <p className="text-sm text-muted">{tr('disclaimer')}</p>
        </section>
      )}
      </div>
    </div>
  );
}

function TemplateCards({ items, note, cta }: { items: TemplateSummary[]; note: (tpl: TemplateSummary) => string | undefined; cta: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.slice(0, 3).map((tpl, i, shown) => (
        // odd count: the top match spans the full row so the grid never leaves an empty cell
        <div key={tpl.id} className={`reveal shell ${i === 0 && shown.length % 2 ? 'md:col-span-2' : ''}`} style={stagger(i + 2)}>
          <div className="core flex h-full flex-col gap-3 p-6">
            <span className="badge self-start bg-accent-soft text-accent-soft-ink">{tpl.category}</span>
            <h2 className="text-lg font-semibold tracking-tight">{tpl.title}</h2>
            <p className="max-w-[65ch] text-[0.9375rem] leading-relaxed text-muted">{note(tpl)}</p>
            <Link href={`/templates/${tpl.id}`} className="btn btn-primary mt-auto self-start">
              {cta}
              <span className="btn-orb"><ArrowUpRight size={15} weight="bold" aria-hidden /></span>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="flex items-start gap-2 rounded-2xl bg-warn-soft px-4 py-3 text-sm text-warn">
      <Warning size={18} weight="regular" className="mt-px shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
