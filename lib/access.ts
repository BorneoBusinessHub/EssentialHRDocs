import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { todayMYT } from '@/lib/time';
import type { Profile } from '@/lib/types';

export type Access = 'ok' | 'no-session' | 'expired';

export function checkAccess(profile: Profile | null, now: Date): Access {
  if (!profile) return 'no-session';
  if (profile.disabled) return 'expired';
  if (profile.role === 'admin') return 'ok';
  if (!profile.expires_at || todayMYT(now) > profile.expires_at) return 'expired';
  return 'ok';
}

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single<Profile>();
  const access = checkAccess(profile, new Date());
  if (access === 'no-session') redirect('/login');
  if (access === 'expired') {
    await supabase.auth.signOut();
    redirect('/login?reason=expired');
  }
  return { supabase, user, profile: profile! };
}

export async function requireAdmin() {
  const ctx = await requireUser();
  if (ctx.profile.role !== 'admin') notFound();
  return ctx;
}
