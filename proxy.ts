import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { checkAccess } from '@/lib/access';
import type { Profile } from '@/lib/types';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith('/api/');
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // keep any refreshed/cleared auth cookies on every redirect/401
  const withCookies = (res: NextResponse) => {
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };
  const deny = (reason: 'unauthorized' | 'expired') =>
    withCookies(
      isApi
        ? NextResponse.json({ error: reason }, { status: 401 })
        : NextResponse.redirect(new URL(reason === 'expired' ? '/login?reason=expired' : '/login', request.url)),
    );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return deny('unauthorized');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single<Profile>();
  const access = checkAccess(profile, new Date());
  if (access === 'no-session') {
    await supabase.auth.signOut();
    return deny('unauthorized');
  }
  if (access === 'expired') {
    await supabase.auth.signOut();
    return deny('expired');
  }
  if ((pathname === '/admin' || pathname.startsWith('/admin/')) && profile!.role !== 'admin') {
    return withCookies(NextResponse.redirect(new URL('/', request.url)));
  }
  return response;
}

export const config = {
  matcher: ['/((?!login|_next|fonts|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|css|js)$).*)'],
};
