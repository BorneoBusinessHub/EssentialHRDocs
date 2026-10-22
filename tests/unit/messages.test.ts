import { describe, it, expect } from 'vitest';
import en from '@/messages/en.json';
import ms from '@/messages/ms.json';
import zh from '@/messages/zh.json';

function flat(o: Record<string, unknown>, p = ''): string[] {
  return Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flat(v as Record<string, unknown>, `${p}${k}.`) : [`${p}${k}`],
  );
}

describe('messages', () => {
  const keys = flat(en).sort();
  it('top-level namespaces match', () => {
    expect(Object.keys(ms).sort()).toEqual(Object.keys(en).sort());
    expect(Object.keys(zh).sort()).toEqual(Object.keys(en).sort());
  });
  it('ms has exactly the en keys', () => expect(flat(ms).sort()).toEqual(keys));
  it('zh has exactly the en keys', () => expect(flat(zh).sort()).toEqual(keys));
  it('fixed disclaimer copy', () =>
    expect(en.result.disclaimer).toBe('This is general guidance, not legal advice.'));
});
