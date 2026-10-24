import { getTranslations } from 'next-intl/server';
import { AppHeader } from '@/components/app-header';

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('common');
  return (
    <div className="flex flex-1 flex-col">
      <AppHeader home="/" brand={t('appName')} logout={t('logout')} items={[{ href: '/library', label: t('library'), icon: 'library' }]} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-10 sm:px-6 sm:pt-16">{children}</main>
    </div>
  );
}
