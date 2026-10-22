import { addDays, todayMYT } from '@/lib/time';
import type { Profile } from '@/lib/types';

export type AccountStatus = 'active' | 'expiring' | 'expired' | 'disabled';

export function accountStatus(p: Profile, now: Date): AccountStatus {
  if (p.disabled) return 'disabled';
  const today = todayMYT(now);
  if (!p.expires_at || p.expires_at < today) return 'expired';
  return p.expires_at <= addDays(today, 30) ? 'expiring' : 'active';
}
