import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft, MagnifyingGlass } from '@phosphor-icons/react/ssr';
import { LanguageSwitch } from '@/components/language-switch';

export default async function NotFound() {
  const t = await getTranslations('common');
  return (
    <main className="flex min-h-[100dvh] flex-1 flex-col px-4 py-6 sm:px-10">
      <div className="flex justify-end"><LanguageSwitch /></div>
      <div className="reveal mx-auto flex w-full max-w-md flex-1 flex-col items-start justify-center gap-6">
        <span className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent-soft-ink">
          <MagnifyingGlass size={22} weight="light" aria-hidden />
        </span>
        <h1 className="text-3xl font-semibold tracking-tight">{t('notFound')}</h1>
        <Link href="/" className="btn btn-quiet">
          <ArrowLeft size={16} weight="light" aria-hidden />
          {t('backHome')}
        </Link>
      </div>
    </main>
  );
}
