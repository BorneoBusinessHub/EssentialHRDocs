import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
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
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t('navQuestions')}</h1>
      {rows.length === 0 && <p>{t('qEmpty')}</p>}
      <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr><th>{t('qTime')}</th><th>{t('company')}</th><th>{t('qLocale')}</th><th>{t('qQuestion')}</th><th>{t('qAnswer')}</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t align-top">
              <td className="py-2 pr-2 whitespace-nowrap">{fmt.format(new Date(r.created_at))}</td>
              <td className="pr-2">{r.profiles?.company_name}</td>
              <td className="pr-2">{r.locale}</td>
              <td className="pr-2">{r.question}</td>
              <td>
                {r.analysis ? (
                  <>
                    <div>{r.analysis.suggestion.slice(0, 2).join(' / ')}{r.analysis.suggestion.length > 2 ? ' …' : ''}</div>
                    <div className="text-zinc-600">{r.analysis.templates.map((x) => titles.get(x.id) ?? x.id).join(', ')}</div>
                  </>
                ) : (
                  <span className="text-red-700">{t('qFailed')}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <div className="flex gap-4">
        {page > 1 && <Link href={`/admin/questions?page=${page - 1}`} className="underline">{t('qPrev')}</Link>}
        {rows.length === PER_PAGE && <Link href={`/admin/questions?page=${page + 1}`} className="underline">{t('qNext')}</Link>}
      </div>
    </div>
  );
}
