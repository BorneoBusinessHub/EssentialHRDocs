import { getTranslations } from 'next-intl/server';
import { requireAdmin } from '@/lib/access';
import { AppHeader } from '@/components/app-header';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const t = await getTranslations('admin');
  const tc = await getTranslations('common');
  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        home="/admin/templates"
        brand={tc('appName')}
        logout={tc('logout')}
        items={[
          { href: '/admin/accounts', label: t('navAccounts'), icon: 'accounts' },
          { href: '/admin/templates', label: t('navTemplates'), icon: 'templates' },
          { href: '/admin/questions', label: t('navQuestions'), icon: 'questions' },
        ]}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-10 sm:px-6 sm:pt-14">{children}</main>
    </div>
  );
}
