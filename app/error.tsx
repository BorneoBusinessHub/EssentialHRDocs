'use client';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  const t = useTranslations('common');
  useEffect(() => console.error(error), [error]);
  return (
    <main className="mx-auto flex max-w-xl flex-col items-start gap-4 p-6">
      <h1 className="text-2xl font-semibold">{t('errorTitle')}</h1>
      <button type="button" onClick={() => retry()} className="rounded bg-black px-4 py-2 text-white">{t('retry')}</button>
    </main>
  );
}
