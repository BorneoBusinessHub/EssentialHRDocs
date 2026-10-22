import { describe, it, expect } from 'vitest';
import { checkAccess } from '@/lib/access';
import type { Profile } from '@/lib/types';

const c = (o: Partial<Profile>) => ({ id: 'u', company_name: 'X', role: 'customer', expires_at: '2026-10-22', disabled: false, ...o }) as Profile;
const now = new Date('2026-10-22T03:00:00Z');

describe('checkAccess', () => {
  it('no profile', () => expect(checkAccess(null, now)).toBe('no-session'));
  it('expiry day itself ok', () => expect(checkAccess(c({}), new Date('2026-10-22T15:00:00Z'))).toBe('ok'));
  it('after expiry', () => expect(checkAccess(c({}), new Date('2026-10-22T16:00:00Z'))).toBe('expired'));
  it('disabled', () => expect(checkAccess(c({ disabled: true, expires_at: '2099-01-01' }), now)).toBe('expired'));
  it('admin never expires', () => expect(checkAccess(c({ role: 'admin', expires_at: null }), now)).toBe('ok'));
});
