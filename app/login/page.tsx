import { Suspense } from 'react';
import { login } from './actions';

async function Notice({ searchParams }: { searchParams: Promise<{ reason?: string; error?: string }> }) {
  const sp = await searchParams;
  if (sp.reason === 'expired')
    return <p role="alert" className="text-red-700">Your subscription has expired. Please contact us to renew.</p>;
  if (sp.error) return <p role="alert" className="text-red-700">Incorrect email or password</p>;
  return null;
}

export default function LoginPage({ searchParams }: { searchParams: Promise<{ reason?: string; error?: string }> }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <Suspense>
        <Notice searchParams={searchParams} />
      </Suspense>
      <form action={login} className="flex flex-col gap-3">
        <input name="email" type="email" required autoComplete="email" placeholder="Email" className="rounded border p-2" />
        <input name="password" type="password" required autoComplete="current-password" placeholder="Password" className="rounded border p-2" />
        <button type="submit" className="rounded bg-black p-2 text-white">Sign in</button>
      </form>
      <p className="text-sm text-zinc-600">Forgot password? Contact us.</p>
    </main>
  );
}
