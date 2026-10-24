import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowUpRight, MagnifyingGlass } from '@phosphor-icons/react/ssr';
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
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <h1 className="reveal text-4xl font-semibold tracking-tight sm:text-5xl">{t('title')}</h1>
        <form className="reveal flex w-full gap-2 md:max-w-md" style={{ '--i': 1 } as React.CSSProperties}>
          <div className="relative flex-1">
            <MagnifyingGlass size={18} weight="light" aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input name="q" defaultValue={q} placeholder={t('search')} aria-label={t('search')} className="field rounded-full pl-11" />
          </div>
          {category && <input type="hidden" name="category" value={category} />}
          <button type="submit" className="btn btn-primary">{t('searchBtn')}</button>
        </form>
      </div>

      <div className="reveal -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" style={{ '--i': 2 } as React.CSSProperties}>
        {['', ...categories].map((c) => (
          <Link key={c} href={href(c)} aria-current={c === category ? 'true' : undefined} className="chip shrink-0 snap-start">
            {c || t('all')}
          </Link>
        ))}
      </div>

      {(data ?? []).length === 0 ? (
        <div className="shell">
          <div className="core flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-surface-2 text-muted">
              <MagnifyingGlass size={22} weight="light" aria-hidden />
            </span>
            <p className="text-muted">{t('empty')}</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((tpl, i) => (
            <Link
              key={tpl.id}
              href={`/templates/${tpl.id}`}
              className="reveal shell group block transition-transform duration-500 ease-[var(--ease-out-soft)] hover:-translate-y-0.5"
              style={{ '--i': Math.min(i, 8) + 3 } as React.CSSProperties}
            >
              <div className="core flex h-full flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="badge bg-accent-soft text-accent-soft-ink">{tpl.category}</span>
                  <span className="btn-orb mr-0 bg-surface-2 text-muted transition-colors group-hover:bg-accent group-hover:text-accent-ink">
                    <ArrowUpRight size={14} weight="bold" aria-hidden />
                  </span>
                </div>
                <h2 className="text-[1.0625rem] font-semibold leading-snug tracking-tight">{tpl.title}</h2>
                {tpl.description && <p className="line-clamp-3 text-sm leading-relaxed text-muted">{tpl.description}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
