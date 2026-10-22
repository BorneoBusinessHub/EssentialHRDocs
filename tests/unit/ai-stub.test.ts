import { describe, it, expect } from 'vitest';
import { stubAnalysis } from '@/lib/ai/stub';

const tpl = [{ id: 't1', title: 'A', category: 'c', description: 'd', tags: [] }];

describe('stubAnalysis', () => {
  it('returns first template when AI_STUB=1', () => {
    expect(stubAnalysis(tpl, { AI_STUB: '1', NODE_ENV: 'development' })?.templates[0].id).toBe('t1');
  });
  it('is off in production, without flag, or with no templates', () => {
    expect(stubAnalysis(tpl, { AI_STUB: '1', NODE_ENV: 'production' })).toBeNull();
    expect(stubAnalysis(tpl, {})).toBeNull();
    expect(stubAnalysis([], { AI_STUB: '1' })).toBeNull();
  });
});
