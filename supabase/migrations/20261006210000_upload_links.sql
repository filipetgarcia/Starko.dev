-- Strako: sponsor upload links
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.

-- What each uploaded asset is for, what was uploaded, and how the automatic check went
alter table public.assets
  add column if not exists obligation_id uuid references public.obligations(id) on delete set null,
  add column if not exists upload_link_id uuid references public.upload_links(id) on delete set null,
  add column if not exists mime_type text,
  add column if not exists size_bytes bigint,
  add column if not exists width int,
  add column if not exists height int,
  add column if not exists partner_note text,
  add column if not exists spec_notes text;

create index if not exists assets_obligation_id_idx on public.assets (obligation_id);

-- Allow partner uploads up to 50 MB (the Supabase free-tier limit) and only artwork file types
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/quicktime', 'application/pdf']
where id = 'assets';
