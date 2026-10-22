import type { Locale, TemplateSummary } from '@/lib/types';

const LANG: Record<Locale, string> = { en: 'English', ms: 'Bahasa Malaysia', zh: 'Simplified Chinese' };

export function buildSystemPrompt(locale: Locale): string {
  return `You are an HR adviser for Malaysian SMEs. Give 3-5 short, practical steps based on Malaysian employment practice. Reply in ${LANG[locale]}. If the issue is not HR related, say so and return no templates. Never invent templates; only use IDs from the list.
Return only JSON matching: {"is_hr": boolean, "suggestion": string[] (3-5 short strings), "templates": [{"id": string, "reason": string}] (max 3, ids from the catalogue only, reason one sentence)}`;
}

export const buildCatalogue = (t: TemplateSummary[]): string =>
  t.map(x => `${x.id} | ${x.title} | ${x.category} | ${x.description} | ${x.tags.join(', ')}`).join('\n');
