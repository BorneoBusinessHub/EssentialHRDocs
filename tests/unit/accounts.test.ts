import { describe, it, expect } from 'vitest';
import { accountStatus } from '@/lib/accounts';
import type { Profile } from '@/lib/types';

const now = new Date('2026-10-22T04:00:00Z');
const p = (expires_at: string | null, disabled = false): Profile => ({ id: 'x', company_name: 'c', role: 'customer', expires_at, disabled });

describe('accountStatus', () => {
  it('active beyond 30 days', () => expect(accountStatus(p('2026-12-01'), now)).toBe('active'));
  it('expiring within 30 days (inclusive)', () => expect(accountStatus(p('2026-11-21'), now)).toBe('expiring'));
  it('expiry date itself is not expired', () => expect(accountStatus(p('2026-10-22'), now)).toBe('expiring'));
  it('expired yesterday', () => expect(accountStatus(p('2026-10-21'), now)).toBe('expired'));
  it('null expiry is expired', () => expect(accountStatus(p(null), now)).toBe('expired'));
  it('disabled wins', () => expect(accountStatus(p('2026-12-01', true), now)).toBe('disabled'));
});
