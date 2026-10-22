'use server';

import { getLocale } from 'next-intl/server';
import { requireUser } from '@/lib/access';
import { startOfDayMYT } from '@/lib/time';
import type { Locale, TemplateSummary } from '@/lib/types';
import type { Analysis } from './parse';
import { DAILY_LIMIT, runAnalysis } from './run';

export type AnalyseResult =
  | { status: 'ok'; analysis: Analysis; templates: TemplateSummary[] }
  | { status: 'limit' }
  | { status: 'error' }
  | { status: 'invalid' };

export async function analyse(question: string): Promise<AnalyseResult> {
  const { supabase, user } = await requireUser();
  if (typeof question !== 'string') return { status: 'invalid' };
  const q = question.trim();
  if (!q || q.length > 2000) return { status: 'invalid' };

  // ponytail: count-then-insert; parallel requests can exceed the limit; reserve a row first if abused
  const { count, error: countError } = await supabase
    .from('ai_queries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', startOfDayMYT(new Date()).toISOString());
  if (countError) return { status: 'error' };
  if ((count ?? 0) >= DAILY_LIMIT) return { status: 'limit' };

  const locale = (await getLocale()) as Locale;
  const { data } = await supabase.from('templates').select('id, title, category, description, tags').eq('published', true);
  const published = (data ?? []) as TemplateSummary[];

  const analysis = await runAnalysis(q, locale, published);
  const { error: insertError } = await supabase.from('ai_queries').insert({ user_id: user.id, question: q, locale, response: analysis });
  if (insertError) console.error('ai_queries insert failed', insertError);
  if (!analysis) return { status: 'error' };

  const byId = new Map(published.map(t => [t.id, t]));
  const templates = analysis.templates.map(t => byId.get(t.id)!).filter(Boolean);
  return { status: 'ok', analysis, templates };
}
