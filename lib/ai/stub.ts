import type { TemplateSummary } from '@/lib/types';
import type { Analysis } from './parse';

// E2E only: fixed answer pointing at the first published template. Never active in production.
export function stubAnalysis(templates: TemplateSummary[], env: Record<string, string | undefined>): Analysis | null {
  if (env.AI_STUB !== '1' || env.NODE_ENV === 'production' || !templates[0]) return null;
  return { is_hr: true, suggestion: ['Step one', 'Step two', 'Step three'], templates: [{ id: templates[0].id, reason: 'Stub match' }] };
}
