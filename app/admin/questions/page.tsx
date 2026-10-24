import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft, ArrowRight, ChatCircleText } from '@phosphor-icons/react/ssr';
import { requireAdmin } from '@/lib/access';
import { safeAnalysis } from '@/lib/ai/parse';

const PER_PAGE = 100;
const fmt = new Intl.DateTimeFormat('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium', timeStyle: 'short' });

type Row = {
  id: string;
  created_at: string;
  locale: string;
  question: string;
  response: unknown; // jsonb; validated with safeAnalysis before rendering
  profiles: { company_name: string } | null;
};

export default async function QuestionsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { supabase } = await requireAdmin();
  const t = await getTranslations('admin');
  const n = parseInt((await searchParams).page ?? '', 10);
  const page = Number.isSafeInteger(n) && n > 0 ? n : 1;
  const from = (page - 1) * PER_PAGE;

  const { data, error } = await supabase
    .from('ai_queries')
    .select('id, created_at, locale, question, response, profiles(company_name)')
    .order('created_at', { ascending: false })
    .order('id')
    .range(from, from + PER_PAGE - 1)
    .returns<Row[]>();
  if (error) throw error;
  const rows = (data ?? []).map((r) => ({ ...r, analysis: safeAnalysis(r.response) }));

  const ids = [...new Set(rows.flatMap((r) => r.analysis?.templates.map((x) => x.id) ?? []))];
  const titles = new Map<string, string>();
  if (ids.length) {
    const { data: ts, error: tErr } = await supabase.from('templates').select('id, title').in('id', ids);
    if (tErr) console.error(tErr);
    ts?.forEach((x) => titles.set(x.id, x.title));
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="reveal text-4xl font-semibold tracking-tight">{t('navQuestions')}</h1>
      <div className="reveal shell" style={{ '--i': 1 } as React.CSSProperties}>
        <div className="core overflow-hidden">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-surface-2 text-muted">
                <ChatCircleText size={22} weight="light" aria-hidden />
              </span>
              <p className="text-muted">{t('qEmpty')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr><th>{t('qTime')}</th><th>{t('company')}</th><th>{t('qLocale')}</th><th>{t('qQuestion')}</th><th>{t('qAnswer')}</th></tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap font-mono text-xs tabular-nums text-muted">{fmt.format(new Date(r.created_at))}</td>
                      <td className="font-medium">{r.profiles?.company_name}</td>
                      <td><span className="badge bg-surface-2 uppercase text-muted">{r.locale}</span></td>
                      <td className="min-w-64 max-w-[40ch]">{r.question}</td>
                      <td className="min-w-64">
                        {r.analysis ? (
                          <div className="flex flex-col gap-1.5">
                            <div>{r.analysis.suggestion.slice(0, 2).join(' / ')}{r.analysis.suggestion.length > 2 ? ' …' : ''}</div>
                            <div className="text-muted">{r.analysis.templates.map((x) => titles.get(x.id) ?? x.id).join(', ')}</div>
                          </div>
                        ) : (
                          <span className="badge bg-danger-soft text-danger">{t('qFailed')}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {(page > 1 || rows.length === PER_PAGE) && (
        <div className="flex gap-3">
          {page > 1 && (
            <Link href={`/admin/questions?page=${page - 1}`} className="btn btn-quiet btn-sm">
              <ArrowLeft size={14} weight="light" aria-hidden />
              {t('qPrev')}
            </Link>
          )}
          {rows.length === PER_PAGE && (
            <Link href={`/admin/questions?page=${page + 1}`} className="btn btn-quiet btn-sm">
              {t('qNext')}
              <ArrowRight size={14} weight="light" aria-hidden />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
