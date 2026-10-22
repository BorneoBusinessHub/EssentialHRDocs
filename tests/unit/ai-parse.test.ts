import { describe, it, expect } from 'vitest';
import { parseAnalysis } from '@/lib/ai/parse';

const ids = new Set(['t1', 't2', 't3', 't4']);
const ok = { is_hr: true, suggestion: ['a', 'b', 'c'], templates: [{ id: 't1', reason: 'r' }] };

describe('parseAnalysis', () => {
  it('parses plain and fenced JSON', () => {
    expect(parseAnalysis(JSON.stringify(ok), ids)).toEqual(ok);
    expect(parseAnalysis('```json\n' + JSON.stringify(ok) + '\n```', ids)).toEqual(ok);
    expect(parseAnalysis('```\n' + JSON.stringify(ok) + '\n```', ids)).toEqual(ok);
  });
  it('returns null on junk', () => {
    expect(parseAnalysis('Sure! here you go', ids)).toBeNull();
    expect(parseAnalysis('', ids)).toBeNull();
    expect(parseAnalysis('{"is_hr":true}', ids)).toBeNull();
  });
  it('dedupes, filters unknown ids, caps at 3', () => {
    const messy = { ...ok, templates: ['t1', 't1', 'zzz', 't2', 't3', 't4'].map(id => ({ id, reason: 'r' })) };
    expect(parseAnalysis(JSON.stringify(messy), ids)!.templates.map(t => t.id)).toEqual(['t1', 't2', 't3']);
  });
  it('drops templates when not HR', () => {
    expect(parseAnalysis(JSON.stringify({ ...ok, is_hr: false }), ids)!.templates).toEqual([]);
  });
});
