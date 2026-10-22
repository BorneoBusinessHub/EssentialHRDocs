import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

const LOCALES = ['en', 'ms', 'zh'];

export default getRequestConfig(async () => {
  const c = (await cookies()).get('NEXT_LOCALE')?.value;
  const locale = c && LOCALES.includes(c) ? c : 'en';
  return { locale, messages: (await import(`../messages/${locale}.json`)).default };
});
