import { describe, it, expect } from 'vitest';
import { todayMYT, startOfDayMYT, addDays } from '@/lib/time';

describe('time', () => {
  it('todayMYT', () => {
    expect(todayMYT(new Date('2026-10-22T15:59:59Z'))).toBe('2026-10-22');
    expect(todayMYT(new Date('2026-10-22T16:00:00Z'))).toBe('2026-10-23');
  });
  it('startOfDayMYT', () => {
    expect(startOfDayMYT(new Date('2026-10-22T03:00:00Z')).toISOString()).toBe('2026-10-21T16:00:00.000Z');
  });
  it('addDays', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});
