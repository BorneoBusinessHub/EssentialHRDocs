import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('common');
  return (
    <main className="mx-auto flex max-w-xl flex-col items-start gap-4 p-6">
      <h1 className="text-2xl font-semibold">{t('notFound')}</h1>
      <Link href="/" className="underline">{t('backHome')}</Link>
    </main>
  );
}
