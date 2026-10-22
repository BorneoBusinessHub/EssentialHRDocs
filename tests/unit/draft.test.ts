import { describe, it, expect } from 'vitest';
import { draftKey, loadDraft, saveDraft, clearDraft, clearAllDrafts, type Draft } from '@/lib/draft';

const mem = (): Storage => {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  } as Storage;
};
const d: Draft = { values: { a: 'x' }, html: '<p>x</p>', step: 'edit' };

describe('draft', () => {
  it('round-trips and clears', () => {
    const s = mem();
    saveDraft('u1', 't1', d, s);
    expect(loadDraft('u1', 't1', s)).toEqual(d);
    clearDraft('u1', 't1', s);
    expect(loadDraft('u1', 't1', s)).toBeNull();
  });
  it('is scoped per user', () => {
    const s = mem();
    saveDraft('u1', 't1', d, s);
    expect(draftKey('u1', 't1')).toBe('draft:u1:t1');
    expect(loadDraft('u2', 't1', s)).toBeNull();
  });
  it('clearAllDrafts removes only draft: keys', () => {
    const s = mem();
    saveDraft('u1', 't1', d, s);
    saveDraft('u2', 't2', d, s);
    s.setItem('other', '1');
    clearAllDrafts(s);
    expect(s.length).toBe(1);
    expect(s.getItem('other')).toBe('1');
  });
  it('corrupt json gives null', () => {
    const s = mem();
    s.setItem(draftKey('u1', 't1'), '{nope');
    expect(loadDraft('u1', 't1', s)).toBeNull();
  });
  it('throwing storage does not throw', () => {
    const s = { ...mem(), setItem: () => { throw new Error('full'); }, removeItem: () => { throw new Error('x'); } } as Storage;
    expect(() => saveDraft('u1', 't1', d, s)).not.toThrow();
    expect(() => clearDraft('u1', 't1', s)).not.toThrow();
    expect(() => clearAllDrafts({ get length(): number { throw new Error('x'); } } as Storage)).not.toThrow();
  });
});
