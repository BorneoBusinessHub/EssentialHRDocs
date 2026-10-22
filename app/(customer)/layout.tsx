import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { logout } from '@/app/login/actions';

// LanguageSwitch is rendered by the root layout, so it is not repeated here.
export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('common');
  return (
    <div>
      <header className="flex flex-wrap items-center gap-4 border-b p-4">
        <Link href="/" className="font-semibold">{t('appName')}</Link>
        <Link href="/library">{t('library')}</Link>
        <form action={logout} className="ml-auto">
          <button type="submit" className="underline">{t('logout')}</button>
        </form>
      </header>
      <main className="mx-auto max-w-3xl p-4 sm:p-6">{children}</main>
    </div>
  );
}
