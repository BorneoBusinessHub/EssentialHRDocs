import { getTranslations } from 'next-intl/server';
import { login } from './actions';

async function Notice({ searchParams }: { searchParams: Promise<{ reason?: string; error?: string }> }) {
  const sp = await searchParams;
  const t = await getTranslations('login');
  if (sp.reason === 'expired')
    return <p role="alert" className="text-red-700">{t('expired')}</p>;
  if (sp.error) return <p role="alert" className="text-red-700">{t('error')}</p>;
  return null;
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reason?: string; error?: string }> }) {
  const t = await getTranslations('login');
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <Notice searchParams={searchParams} />
      <form action={login} className="flex flex-col gap-3">
        <label htmlFor="email" className="flex flex-col gap-1 text-sm">{t('email')}
          <input id="email" name="email" type="email" required autoComplete="email" className="rounded border p-2 text-base" />
        </label>
        <label htmlFor="password" className="flex flex-col gap-1 text-sm">{t('password')}
          <input id="password" name="password" type="password" required autoComplete="current-password" className="rounded border p-2 text-base" />
        </label>
        <button type="submit" className="rounded bg-black p-2 text-white">{t('submit')}</button>
      </form>
      <p className="text-sm text-zinc-600">{t('forgot')}</p>
    </main>
  );
}
