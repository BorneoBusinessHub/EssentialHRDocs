'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  });
  if (error || !data.user) redirect('/login?error=1');
  const { data: p } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
  redirect(p?.role === 'admin' ? '/admin/accounts' : '/');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
