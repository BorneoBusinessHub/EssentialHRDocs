import 'server-only';
import type { Locale, TemplateSummary } from '@/lib/types';
import type { Analysis } from './parse';
import { callClaude } from './claude';
import { stubAnalysis } from './stub';

export const DAILY_LIMIT = 30;

export async function runAnalysis(question: string, locale: Locale, templates: TemplateSummary[]): Promise<Analysis | null> {
  return stubAnalysis(templates, process.env) ?? callClaude(question, locale, templates);
}
