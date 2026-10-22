'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

export function LanguageSwitch() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('common');
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  return (
    <select
      aria-label={t('language')}
      value={locale}
      onChange={(e) => {
        document.cookie = `NEXT_LOCALE=${e.target.value}; path=/; max-age=31536000; samesite=lax`;
        router.refresh();
      }}
      className="rounded border p-1 text-sm"
    >
      {(['en', 'ms', 'zh'] as const).map((l) => (
        <option key={l} value={l}>{t(`lang_${l}`)}</option>
      ))}
    </select>
  );
}
