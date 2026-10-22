import { z } from 'zod';

const schema = z.object({
  is_hr: z.boolean(),
  suggestion: z.array(z.string()).min(1).max(5),
  templates: z.array(z.object({ id: z.string(), reason: z.string() })),
});

export type Analysis = z.infer<typeof schema>;

export function parseAnalysis(raw: string, publishedIds: Set<string>): Analysis | null {
  try {
    const text = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const r = schema.safeParse(JSON.parse(text));
    if (!r.success) return null;
    const seen = new Set<string>();
    const templates = r.data.is_hr
      ? r.data.templates.filter(t => publishedIds.has(t.id) && !seen.has(t.id) && seen.add(t.id)).slice(0, 3)
      : [];
    return { ...r.data, templates };
  } catch {
    return null;
  }
}
