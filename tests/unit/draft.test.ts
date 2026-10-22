import { describe, it, expect } from 'vitest';
import { draftKey, loadDraft, saveDraft, clearDraft, type Draft } from '@/lib/draft';

const mem = (): Storage => {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  } as Storage;
};
const d: Draft = { values: { a: 'x' }, html: '<p>x</p>', step: 'edit' };

describe('draft', () => {
  it('round-trips and clears', () => {
    const s = mem();
    saveDraft('t1', d, s);
    expect(loadDraft('t1', s)).toEqual(d);
    clearDraft('t1', s);
    expect(loadDraft('t1', s)).toBeNull();
  });
  it('corrupt json gives null', () => {
    const s = mem();
    s.setItem(draftKey('t1'), '{nope');
    expect(loadDraft('t1', s)).toBeNull();
  });
  it('throwing storage does not throw', () => {
    const s = { ...mem(), setItem: () => { throw new Error('full'); }, removeItem: () => { throw new Error('x'); } } as Storage;
    expect(() => saveDraft('t1', d, s)).not.toThrow();
    expect(() => clearDraft('t1', s)).not.toThrow();
  });
});
