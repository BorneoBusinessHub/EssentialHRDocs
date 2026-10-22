'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/access';
import { createAdminClient } from '@/lib/supabase/admin';
import { todayMYT } from '@/lib/time';

export type Result = { ok: true } | { ok: false; error: string };

const email = z.email();
const password = z.string().min(8);
const id = z.uuid();
const company = z.string().trim().min(1);
const expiry = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((d) => d >= todayMYT(new Date()), 'past');

const fail = (e: unknown): Result => ({ ok: false, error: e instanceof z.ZodError ? 'Invalid input' : e instanceof Error ? e.message : 'Failed' });
const done = (): Result => {
  revalidatePath('/admin/accounts');
  return { ok: true };
};

export async function createAccount(input: { company_name: string; email: string; password: string; expires_at: string }): Promise<Result> {
  await requireAdmin();
  try {
    const v = z.object({ company_name: company, email, password, expires_at: expiry }).parse(input);
    const db = createAdminClient();
    const { data, error } = await db.auth.admin.createUser({ email: v.email, password: v.password, email_confirm: true });
    if (error || !data.user) return fail(error ?? new Error('Create failed'));
    const { error: insErr } = await db.from('profiles').insert({ id: data.user.id, company_name: v.company_name, role: 'customer', expires_at: v.expires_at, disabled: false });
    if (insErr) {
      await db.auth.admin.deleteUser(data.user.id);
      return fail(new Error(insErr.message));
    }
    return done();
  } catch (e) {
    return fail(e);
  }
}

export async function extendExpiry(userId: string, expires_at: string): Promise<Result> {
  await requireAdmin();
  try {
    const v = z.object({ id, expires_at: expiry }).parse({ id: userId, expires_at });
    const { error } = await createAdminClient().from('profiles').update({ expires_at: v.expires_at }).eq('id', v.id);
    return error ? fail(new Error(error.message)) : done();
  } catch (e) {
    return fail(e);
  }
}

export async function setDisabled(userId: string, disabled: boolean): Promise<Result> {
  await requireAdmin();
  try {
    const v = z.object({ id, disabled: z.boolean() }).parse({ id: userId, disabled });
    const { error } = await createAdminClient().from('profiles').update({ disabled: v.disabled }).eq('id', v.id);
    return error ? fail(new Error(error.message)) : done();
  } catch (e) {
    return fail(e);
  }
}

export async function resetPassword(userId: string, pw: string): Promise<Result> {
  await requireAdmin();
  try {
    const v = z.object({ id, password }).parse({ id: userId, password: pw });
    const { error } = await createAdminClient().auth.admin.updateUserById(v.id, { password: v.password });
    return error ? fail(new Error(error.message)) : done();
  } catch (e) {
    return fail(e);
  }
}
