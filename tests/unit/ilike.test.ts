import { expect, test } from 'vitest';
import { escapeIlike } from '@/lib/ilike';

test('escapes wildcards and strips or() separators', () => {
  expect(escapeIlike('50%_off')).toBe('50\\%\\_off');
  expect(escapeIlike('a,b)(c')).toBe('a b  c');
});
