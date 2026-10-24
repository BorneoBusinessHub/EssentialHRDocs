// Usage: npx tsx scripts/import-templates.ts <manifest.json> [--apply]
// Manifest: [{ "file": "<path to .docx>", "title": "...", "category": "..." }]
// Mirrors uploadTemplate in app/admin/templates/actions.ts: imports as drafts, skips titles that already exist.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import mammoth from 'mammoth';
import { detectKeys, mergeFields, normalizePlaceholders } from '../lib/placeholders';

const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const MAX_BYTES = 4 * 1024 * 1024;
type Item = { file: string; title: string; category: string };

async function main() {
  process.loadEnvFile('.env.local');
  const [manifestPath, flag] = process.argv.slice(2);
  if (!manifestPath) throw new Error('usage: import-templates.ts <manifest.json> [--apply]');
  const apply = flag === '--apply';
  const items: Item[] = JSON.parse(readFileSync(manifestPath, 'utf8'));

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: existing, error: e0 } = await db.from('templates').select('title');
  if (e0) throw e0;
  const taken = new Set((existing ?? []).map((r) => r.title.toLowerCase()));

  let added = 0;
  for (const it of items) {
    const buf = readFileSync(it.file);
    const tag = `${it.title} [${it.category}]`;
    if (buf.length > MAX_BYTES) { console.log(`SKIP too large (${buf.length} B): ${tag}`); continue; }
    if (taken.has(it.title.toLowerCase())) { console.log(`SKIP exists: ${tag}`); continue; }
    const html = normalizePlaceholders((await mammoth.convertToHtml({ buffer: buf })).value);
    const { keys, warnings } = detectKeys(html);
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log(`${apply ? 'ADD' : 'WOULD ADD'}: ${tag} | ${Math.round(buf.length / 1024)} KB | ${text.length} chars | keys: ${keys.join(', ') || '-'}${warnings.length ? ` | ${warnings.length} warnings` : ''}`);
    console.log(`    "${text.slice(0, 90)}"`);
    if (!apply) continue;

    const id = crypto.randomUUID();
    const docx_path = `${id}.docx`;
    const up = await db.storage.from('templates').upload(docx_path, buf, { upsert: true, contentType: DOCX_TYPE });
    if (up.error) throw new Error(`${it.title}: ${up.error.message}`);
    const { error } = await db.from('templates').insert({
      id, title: it.title, category: it.category, docx_path, html,
      fields: mergeFields([], keys), published: false, updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(`${it.title}: ${error.message}`);
    taken.add(it.title.toLowerCase());
    added++;
  }
  console.log(apply ? `done: ${added} added` : 'dry run: nothing written (pass --apply)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
