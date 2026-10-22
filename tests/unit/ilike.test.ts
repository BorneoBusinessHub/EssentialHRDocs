import { expect, test } from 'vitest';
import { escapeIlike } from '@/lib/ilike';

test('escapes wildcards and strips or() separators', () => {
  expect(escapeIlike('50%_off')).toBe('50\\%\\_off');
  expect(escapeIlike('a\\b')).toBe('a\\\\b');
  expect(escapeIlike('a,b)(c')).toBe('a b  c');
});

test('strips array-literal braces and quotes', () => {
  expect(escapeIlike('{a"b}')).toBe('a b');
});
