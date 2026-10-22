'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/access';
import { createAdminClient } from '@/lib/supabase/admin';
import { docxToHtml } from '@/lib/convert';
import { canPublish, detectKeys, mergeFields } from '@/lib/placeholders';
import type { Field } from '@/lib/types';

export type Result = { ok: true; id?: string; warnings?: string[] } | { ok: false; error: string };

const MAX_BYTES = 5 * 1024 * 1024;
const id = z.uuid();
const fieldSchema = z.object({ key: z.string().regex(/^[a-z0-9_]+$/), label: z.string().trim(), hint: z.string().trim().optional() });
const metaSchema = z.object({
  title: z.string().trim().min(1),
  category: z.string().trim().min(1),
  description: z.string().trim(),
  tags: z.array(z.string()).transform((a) => a.map((s) => s.trim()).filter(Boolean)),
  fields: z.array(fieldSchema),
});

const fail = (e: unknown): Result => ({ ok: false, error: e instanceof z.ZodError ? 'Invalid input' : e instanceof Error ? e.message : 'Failed' });
const refresh = (tid: string) => {
  revalidatePath('/admin/templates');
  revalidatePath(`/admin/templates/${tid}`);
};

export async function uploadTemplate(formData: FormData): Promise<Result> {
  await requireAdmin();
  try {
    const file = formData.get('file');
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith('.docx')) return fail(new Error('Please choose a .docx file'));
    if (file.size > MAX_BYTES) return fail(new Error('File is larger than 5 MB'));
    const rawId = formData.get('id');
    const existing = typeof rawId === 'string' && rawId ? id.parse(rawId) : null;

    const buf = Buffer.from(await file.arrayBuffer());
    let html: string;
    try {
      html = await docxToHtml(buf);
    } catch {
      return fail(new Error('Could not read this file. Is it a valid .docx?'));
    }
    const { keys, warnings } = detectKeys(html);
    const db = createAdminClient();
    const tid = existing ?? crypto.randomUUID();
    const docx_path = `${tid}.docx`;
    const up = await db.storage.from('templates').upload(docx_path, buf, { upsert: true, contentType: file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    if (up.error) return fail(new Error(up.error.message));

    if (existing) {
      const { data: old } = await db.from('templates').select('fields, published').eq('id', tid).single<{ fields: Field[]; published: boolean }>();
      if (!old) return fail(new Error('Template not found'));
      const fields = mergeFields(old.fields, keys);
      const { error } = await db
        .from('templates')
        .update({ html, fields, docx_path, published: old.published && canPublish(fields).ok, updated_at: new Date().toISOString() })
        .eq('id', tid);
      if (error) return fail(new Error(error.message));
    } else {
      const title = String(formData.get('title') ?? '').trim() || file.name.replace(/\.docx$/i, '');
      const category = String(formData.get('category') ?? '').trim() || 'General';
      const { error } = await db
        .from('templates')
        .insert({ id: tid, title, category, docx_path, html, fields: mergeFields([], keys), published: false, updated_at: new Date().toISOString() });
      if (error) return fail(new Error(error.message));
    }
    refresh(tid);
    return { ok: true, id: tid, warnings };
  } catch (e) {
    return fail(e);
  }
}

export async function saveTemplateMeta(
  templateId: string,
  input: { title: string; category: string; description: string; tags: string[]; fields: Field[] },
): Promise<Result> {
  await requireAdmin();
  try {
    const tid = id.parse(templateId);
    const v = metaSchema.parse(input);
    const fields: Field[] = v.fields.map((f) => (f.hint ? { key: f.key, label: f.label, hint: f.hint } : { key: f.key, label: f.label }));
    const { data, error } = await createAdminClient()
      .from('templates')
      .update({ title: v.title, category: v.category, description: v.description, tags: v.tags, fields, ...(canPublish(fields).ok ? {} : { published: false }), updated_at: new Date().toISOString() })
      .eq('id', tid)
      .select('id');
    if (error) return fail(new Error(error.message));
    if (!data.length) return fail(new Error('Template not found'));
    refresh(tid);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setPublished(templateId: string, published: boolean): Promise<Result> {
  await requireAdmin();
  try {
    const tid = id.parse(templateId);
    const db = createAdminClient();
    if (published) {
      const { data } = await db.from('templates').select('fields').eq('id', tid).single<{ fields: Field[] }>();
      if (!data) return fail(new Error('Template not found'));
      const c = canPublish(data.fields);
      if (!c.ok) return fail(new Error(`Missing labels for: ${c.missing.join(', ')}`));
    }
    const { data, error } = await db.from('templates').update({ published, updated_at: new Date().toISOString() }).eq('id', tid).select('id');
    if (error) return fail(new Error(error.message));
    if (!data.length) return fail(new Error('Template not found'));
    refresh(tid);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
