'use client';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Globe } from '@phosphor-icons/react';

export function LanguageSwitch() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('common');
  return (
    <label className="nav-link relative cursor-pointer pr-2 focus-within:outline-2 focus-within:outline-accent">
      <Globe size={16} weight="light" aria-hidden />
      <select
        aria-label={t('language')}
        value={locale}
        onChange={(e) => {
          document.cookie = `NEXT_LOCALE=${e.target.value}; path=/; max-age=31536000; samesite=lax`;
          router.refresh();
        }}
        className="max-w-[4.5rem] cursor-pointer appearance-none truncate bg-transparent pr-1 text-sm text-inherit outline-none sm:max-w-none"
      >
        {(['en', 'ms', 'zh'] as const).map((l) => (
          <option key={l} value={l}>{t(`lang_${l}`)}</option>
        ))}
      </select>
    </label>
  );
}
