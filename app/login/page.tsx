import { getTranslations } from 'next-intl/server';
import { ArrowRight, FileText, Warning } from '@phosphor-icons/react/ssr';
import { LanguageSwitch } from '@/components/language-switch';
import { login } from './actions';

async function Notice({ searchParams }: { searchParams: Promise<{ reason?: string; error?: string }> }) {
  const sp = await searchParams;
  const t = await getTranslations('login');
  const msg = sp.reason === 'expired' ? t('expired') : sp.error ? t('error') : null;
  if (!msg) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
      <Warning size={18} weight="regular" className="mt-px shrink-0" aria-hidden />
      {msg}
    </p>
  );
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reason?: string; error?: string }> }) {
  const t = await getTranslations('login');
  const tc = await getTranslations('common');
  return (
    <main className="grid min-h-[100dvh] flex-1 lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-[#0a3d2e] p-12 text-[#eaf5ef] lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-90 [background:radial-gradient(40rem_28rem_at_15%_110%,#11845f_0%,transparent_60%),radial-gradient(30rem_20rem_at_95%_-10%,#0f5c45_0%,transparent_65%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_30%_70%,#000,transparent_75%)]"
        />
        <div className="reveal relative flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-[#eaf5ef] text-[#0a3d2e]">
            <FileText size={20} weight="regular" />
          </span>
          <span className="text-lg font-semibold tracking-tight">{tc('appName')}</span>
        </div>
        <p className="reveal relative max-w-lg text-3xl font-semibold leading-[1.2] tracking-tight xl:text-4xl" style={{ '--i': 2 } as React.CSSProperties}>
          {t('tagline')}
        </p>
      </section>

      <section className="flex flex-col px-4 py-6 sm:px-10">
        <div className="flex justify-end">
          <LanguageSwitch />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 py-12">
          <div className="reveal flex flex-col gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-ink lg:hidden">
              <FileText size={20} weight="regular" />
            </span>
            <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
            <p className="text-[0.9375rem] leading-relaxed text-muted lg:hidden">{t('tagline')}</p>
          </div>
          <Notice searchParams={searchParams} />
          <div className="reveal shell" style={{ '--i': 1 } as React.CSSProperties}>
            <form action={login} className="core flex flex-col gap-5 p-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="label">{t('email')}</label>
                <input id="email" name="email" type="email" required autoComplete="email" className="field" />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="label">{t('password')}</label>
                <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
              </div>
              <button type="submit" className="btn btn-primary mt-1 w-full">
                {t('submit')}
                <span className="btn-orb"><ArrowRight size={15} weight="bold" aria-hidden /></span>
              </button>
            </form>
          </div>
          <p className="text-sm text-muted">{t('forgot')}</p>
        </div>
      </section>
    </main>
  );
}
