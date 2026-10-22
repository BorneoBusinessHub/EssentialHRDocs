// Usage: npx tsx scripts/eval-ai.ts   (needs .env.local with Supabase + ANTHROPIC_API_KEY)
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { callClaude } from '../lib/ai/claude';
import type { Locale, TemplateSummary } from '../lib/types';

type Case = { question: string; locale: Locale; expected_template_title: string };

async function main() {
  process.loadEnvFile('.env.local');
  const cases: Case[] = JSON.parse(readFileSync('scripts/eval-cases.json', 'utf8'));
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const { data, error } = await sb.from('templates').select('id, title, category, description, tags').eq('published', true);
  if (error) throw error;
  const templates = data as TemplateSummary[];
  const title = new Map(templates.map(t => [t.id, t.title]));

  let hits = 0;
  for (const c of cases) {
    const a = await callClaude(c.question, c.locale, templates);
    const got = a?.templates.map(t => title.get(t.id));
    const hit = !!got?.includes(c.expected_template_title);
    if (hit) hits++;
    console.log(`${hit ? 'HIT ' : 'MISS'} [${c.locale}] ${c.question}\n     expected: ${c.expected_template_title}\n     got: ${got ? got.join(', ') || '(none)' : '(call failed)'}`);
  }
  console.log(`\n${hits}/${cases.length} (target >= 18/20)`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
