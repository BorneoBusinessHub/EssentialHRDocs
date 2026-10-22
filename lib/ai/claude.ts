import Anthropic from '@anthropic-ai/sdk';
import type { Locale, TemplateSummary } from '@/lib/types';
import { buildCatalogue, buildSystemPrompt } from './prompt';
import { parseAnalysis, type Analysis } from './parse';

// No 'server-only' here so scripts/eval-ai.ts can import it; Next only reaches it through run.ts.
export async function callClaude(question: string, locale: Locale, templates: TemplateSummary[]): Promise<Analysis | null> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) return null;
    const msg = await new Anthropic().messages.create(
      {
        model: 'claude-sonnet-5-5',
        max_tokens: 1024,
        system: buildSystemPrompt(locale),
        messages: [{ role: 'user', content: `Catalogue:\n${buildCatalogue(templates)}\n\nQuestion:\n${question}` }],
      },
      { signal: AbortSignal.timeout(30_000) },
    );
    const text = msg.content.map(b => (b.type === 'text' ? b.text : '')).join('');
    return parseAnalysis(text, new Set(templates.map(t => t.id)));
  } catch {
    return null;
  }
}
