import 'server-only';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkAccess } from '@/lib/access';
import { sanitizeDocHtml } from '@/lib/export/sanitize';
import { contentDisposition } from '@/lib/export/filename';
import type { Profile } from '@/lib/types';

const MAX_BODY = 1_000_000;
const Body = z.object({ html: z.string().min(1), title: z.string().min(1).max(200) });
const MIME = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pdf: 'application/pdf',
} as const;

export async function handleExport(req: Request, ext: 'docx' | 'pdf', convert: (html: string) => Promise<Buffer>) {
  // proxy.ts already 401s /api/*; re-check here so the route is safe on its own (never redirect from an API)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single<Profile>();
  const access = checkAccess(profile, new Date());
  if (access !== 'ok') return Response.json({ error: access === 'expired' ? 'expired' : 'unauthorized' }, { status: 401 });

  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY) return Response.json({ error: 'too large' }, { status: 413 });
  const text = await req.text();
  if (text.length > MAX_BODY) return Response.json({ error: 'too large' }, { status: 413 });
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return Response.json({ error: 'invalid body' }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) return Response.json({ error: 'invalid body' }, { status: 400 });

  try {
    const file = await convert(sanitizeDocHtml(parsed.data.html));
    return new Response(new Uint8Array(file), {
      headers: {
        'Content-Type': MIME[ext],
        'Content-Disposition': contentDisposition(parsed.data.title, ext, new Date()),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error(`export ${ext} failed`, err);
    return Response.json({ error: 'export failed' }, { status: 500 });
  }
}
