create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_name text not null,
  role text not null check (role in ('admin','customer')),
  expires_at date,
  disabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  description text not null default '',
  tags text[] not null default '{}',
  docx_path text not null,
  html text not null default '',
  fields jsonb not null default '[]'::jsonb,
  published boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.ai_queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question text not null,
  locale text not null check (locale in ('en','ms','zh')),
  response jsonb,
  created_at timestamptz not null default now()
);
create index ai_queries_user_created_idx on public.ai_queries (user_id, created_at);

-- security definer runs as owner (bypasses profiles RLS), so no policy recursion.
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- admin, or a customer who is enabled and not past expiry (Malaysia date)
create function public.is_active() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (role = 'admin'
           or (not disabled and expires_at >= (now() at time zone 'Asia/Kuala_Lumpur')::date))
  );
$$;

alter table public.profiles enable row level security;
alter table public.templates enable row level security;
alter table public.ai_queries enable row level security;

-- profiles: writes only via service role (no policy)
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy templates_select on public.templates for select to authenticated
  using ((published and public.is_active()) or public.is_admin());
create policy templates_insert on public.templates for insert to authenticated with check (public.is_admin());
create policy templates_update on public.templates for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy templates_delete on public.templates for delete to authenticated using (public.is_admin());

create policy ai_queries_select on public.ai_queries for select to authenticated
  using ((user_id = auth.uid() and public.is_active()) or public.is_admin());
-- ai_queries: inserts only via service role (lib/ai/analyse.ts), so users cannot craft rows

grant select on public.profiles, public.templates to authenticated;
grant select on public.ai_queries to authenticated;
grant all on public.profiles, public.templates, public.ai_queries to service_role;

-- private bucket, no storage policies: service role only
insert into storage.buckets (id, name, public) values ('templates','templates', false) on conflict do nothing;
