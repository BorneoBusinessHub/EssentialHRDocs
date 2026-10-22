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
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

alter table public.profiles enable row level security;
alter table public.templates enable row level security;
alter table public.ai_queries enable row level security;

-- profiles: writes only via service role (no policy)
create policy profiles_select on public.profiles for select using (id = auth.uid() or public.is_admin());

create policy templates_select on public.templates for select using (published or public.is_admin());
create policy templates_insert on public.templates for insert with check (public.is_admin());
create policy templates_update on public.templates for update using (public.is_admin()) with check (public.is_admin());
create policy templates_delete on public.templates for delete using (public.is_admin());

create policy ai_queries_select on public.ai_queries for select using (user_id = auth.uid() or public.is_admin());
create policy ai_queries_insert on public.ai_queries for insert with check (user_id = auth.uid());

-- private bucket, no storage policies: service role only
insert into storage.buckets (id, name, public) values ('templates','templates', false) on conflict do nothing;
