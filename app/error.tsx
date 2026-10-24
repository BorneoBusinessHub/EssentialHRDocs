'use client';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowClockwise, Warning } from '@phosphor-icons/react';
import { LanguageSwitch } from '@/components/language-switch';

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  const t = useTranslations('common');
  useEffect(() => console.error(error), [error]);
  return (
    <main className="flex min-h-[100dvh] flex-1 flex-col px-4 py-6 sm:px-10">
      <div className="flex justify-end"><LanguageSwitch /></div>
      <div className="reveal mx-auto flex w-full max-w-md flex-1 flex-col items-start justify-center gap-6">
        <span className="flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
          <Warning size={22} weight="light" aria-hidden />
        </span>
        <h1 className="text-3xl font-semibold tracking-tight">{t('errorTitle')}</h1>
        <button type="button" onClick={() => retry()} className="btn btn-primary">
          <ArrowClockwise size={16} weight="regular" aria-hidden />
          {t('retry')}
        </button>
      </div>
    </main>
  );
}
