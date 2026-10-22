import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { escapeIlike } from '@/lib/ilike';

type SP = { q?: string; category?: string };

export default async function LibraryPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { q = '', category = '' } = await searchParams;
  const t = await getTranslations('library');
  const supabase = await createClient();

  let query = supabase.from('templates').select('id, title, category, description').eq('published', true).order('title');
  const safe = escapeIlike(q);
  if (safe) query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%,tags.cs.{${safe}}`);
  if (category) query = query.eq('category', category);
  const [{ data }, { data: cats }] = await Promise.all([
    query,
    supabase.from('templates').select('category').eq('published', true),
  ]);
  const categories = [...new Set((cats ?? []).map((c) => c.category as string))].sort();
  const href = (c: string) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (c) p.set('category', c);
    return `/library?${p}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder={t('search')} aria-label={t('search')} className="flex-1 rounded border p-2" />
        {category && <input type="hidden" name="category" value={category} />}
        <button type="submit" className="rounded bg-black px-4 text-white">{t('searchBtn')}</button>
      </form>
      <div className="flex flex-wrap gap-2">
        {['', ...categories].map((c) => (
          <Link key={c} href={href(c)} className={`rounded-full border px-3 py-1 text-sm ${c === category ? 'bg-black text-white' : ''}`}>
            {c || t('all')}
          </Link>
        ))}
      </div>
      {(data ?? []).length === 0 ? (
        <p className="text-zinc-500">{t('empty')}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(data ?? []).map((tpl) => (
            <Link key={tpl.id} href={`/templates/${tpl.id}`} className="flex flex-col gap-1 rounded border p-4 hover:bg-zinc-50">
              <h2 className="font-semibold">{tpl.title}</h2>
              <p className="text-xs text-zinc-500">{tpl.category}</p>
              <p className="text-sm">{tpl.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
