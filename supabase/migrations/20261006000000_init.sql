-- Strako V0.1 schema
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.

-- ─────────────────────────────────────────────────────────────
-- Organisations and who belongs to them
-- ─────────────────────────────────────────────────────────────
create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.memberships (
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  display_name text,
  created_at timestamptz not null default now(),
  primary key (organisation_id, user_id)
);

-- Only invited emails get access to a workspace. Users never read this table directly.
create table public.invites (
  email text not null,
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  display_name text,
  primary key (email, organisation_id)
);

-- ─────────────────────────────────────────────────────────────
-- Commercial data
-- ─────────────────────────────────────────────────────────────
create table public.partners (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  name text not null,
  tier text,
  contact_email text,
  created_at timestamptz not null default now()
);

create table public.fixtures (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  opponent text not null,
  competition text,
  kickoff timestamptz not null,
  is_home boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  partner_id uuid references public.partners(id) on delete set null,
  file_path text,                       -- path inside the private "assets" storage bucket
  file_name text not null,
  version int not null default 1,
  valid_from date,
  valid_to date,
  spec_status text not null default 'pending' check (spec_status in ('pending', 'passed', 'failed')),
  created_at timestamptz not null default now()
);

create table public.obligations (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  partner_id uuid references public.partners(id) on delete set null,
  fixture_id uuid references public.fixtures(id) on delete set null,
  source text not null check (source in ('league', 'contract')),
  title text not null,
  placement text check (placement in ('led', 'in_bowl', 'concourse', 'social', 'hospitality', 'print', 'other')),
  requires_asset boolean not null default true,
  asset_id uuid references public.assets(id) on delete set null,
  due_date date not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'delivered')),
  created_at timestamptz not null default now()
);

create table public.upload_links (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  token text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  status text not null default 'awaiting' check (status in ('awaiting', 'completed', 'revoked')),
  expires_at timestamptz not null default now() + interval '30 days',
  created_at timestamptz not null default now()
);

create table public.proof (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  obligation_id uuid not null references public.obligations(id) on delete cascade,
  file_path text,
  note text,
  created_at timestamptz not null default now()
);

create index on public.memberships (user_id);
create index on public.partners (organisation_id);
create index on public.fixtures (organisation_id, kickoff);
create index on public.assets (organisation_id, partner_id);
create index on public.obligations (organisation_id, due_date);
create index on public.obligations (partner_id);
create index on public.upload_links (organisation_id, status);
create index on public.proof (obligation_id);

-- ─────────────────────────────────────────────────────────────
-- Row-level security: a user only sees organisations they belong to
-- ─────────────────────────────────────────────────────────────
create or replace function public.is_member(org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.organisation_id = org and m.user_id = (select auth.uid())
  );
$$;

alter table public.organisations enable row level security;
alter table public.memberships   enable row level security;
alter table public.invites       enable row level security;  -- no policies: invisible to users
alter table public.partners      enable row level security;
alter table public.fixtures      enable row level security;
alter table public.assets        enable row level security;
alter table public.obligations   enable row level security;
alter table public.upload_links  enable row level security;
alter table public.proof         enable row level security;

create policy "members read their organisation" on public.organisations
  for select to authenticated using (public.is_member(id));

create policy "users read their own memberships" on public.memberships
  for select to authenticated using (user_id = (select auth.uid()));

do $$
declare t text;
begin
  foreach t in array array['partners', 'fixtures', 'assets', 'obligations', 'upload_links', 'proof'] loop
    execute format(
      'create policy "members manage %1$s" on public.%1$I for all to authenticated
         using (public.is_member(organisation_id))
         with check (public.is_member(organisation_id))', t);
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────
-- When an invited email signs in for the first time, give it access
-- ─────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.memberships (organisation_id, user_id, role, display_name)
  select i.organisation_id, new.id, i.role, i.display_name
  from public.invites i
  where lower(i.email) = lower(new.email)
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Private storage for partner artwork and proof.
-- Files live under <organisation_id>/..., so the first folder decides access.
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('assets', 'assets', false)
on conflict (id) do nothing;

create policy "members read org files" on storage.objects
  for select to authenticated
  using (bucket_id = 'assets' and public.is_member(((storage.foldername(name))[1])::uuid));

create policy "members upload org files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'assets' and public.is_member(((storage.foldername(name))[1])::uuid));

create policy "members update org files" on storage.objects
  for update to authenticated
  using (bucket_id = 'assets' and public.is_member(((storage.foldername(name))[1])::uuid));

create policy "members delete org files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'assets' and public.is_member(((storage.foldername(name))[1])::uuid));
