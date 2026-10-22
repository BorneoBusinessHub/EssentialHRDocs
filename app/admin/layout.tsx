import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { requireAdmin } from '@/lib/access';
import { logout } from '@/app/login/actions';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const t = await getTranslations('admin');
  const tc = await getTranslations('common');
  return (
    <div>
      <header className="flex items-center gap-4 border-b p-4">
        <Link href="/admin/accounts">{t('navAccounts')}</Link>
        <Link href="/admin/templates">{t('navTemplates')}</Link>
        <Link href="/admin/questions">{t('navQuestions')}</Link>
        <form action={logout} className="ml-auto">
          <button type="submit" className="underline">{tc('logout')}</button>
        </form>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
