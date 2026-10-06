-- Fictional demo data for Riverside FC. Safe to re-run: it rebuilds the demo workspace.
-- The invite email below is only used once login is added; it can stay as it is for now.
-- Dates are relative to today, so "this week" always has something due.

do $$
declare
  my_email   text := 'YOUR_EMAIL@example.com';
  my_name    text := 'Sam Okafor';

  org        uuid;
  harbour    uuid; northline uuid; brightwater uuid; kestrel uuid; oakmill uuid;
  next_sat   date := current_date + ((6 - extract(dow from current_date)::int + 7) % 7);
  next_fix   uuid;
  past_fix   uuid[];
  i          int;
  ob         uuid;
begin
  if next_sat = current_date then next_sat := next_sat + 7; end if;

  delete from public.organisations where slug = 'riverside-fc';

  insert into public.organisations (name, slug) values ('Riverside FC', 'riverside-fc') returning id into org;

  insert into public.invites (email, organisation_id, role, display_name)
  values (lower(my_email), org, 'owner', my_name)
  on conflict (email, organisation_id) do update set role = excluded.role, display_name = excluded.display_name;

  -- If that user already exists (logged in before), give access now as well.
  insert into public.memberships (organisation_id, user_id, role, display_name)
  select org, u.id, 'owner', my_name from auth.users u where lower(u.email) = lower(my_email)
  on conflict do nothing;

  insert into public.partners (organisation_id, name, tier, contact_email) values
    (org, 'Harbour Bank', 'Principal partner', 'partnerships@harbourbank.example') returning id into harbour;
  insert into public.partners (organisation_id, name, tier, contact_email) values
    (org, 'Northline Energy', 'Kit partner', 'brand@northline.example') returning id into northline;
  insert into public.partners (organisation_id, name, tier, contact_email) values
    (org, 'Brightwater Mineral Water', 'Official partner', 'marketing@brightwater.example') returning id into brightwater;
  insert into public.partners (organisation_id, name, tier, contact_email) values
    (org, 'Kestrel Motors', 'Official partner', 'events@kestrelmotors.example') returning id into kestrel;
  insert into public.partners (organisation_id, name, tier, contact_email) values
    (org, 'Oakmill Bakery', 'Community partner', 'hello@oakmill.example') returning id into oakmill;

  -- Fixtures: six past home games, the next one on Saturday, two after it
  for i in 1..6 loop
    insert into public.fixtures (organisation_id, opponent, competition, kickoff, is_home)
    values (org,
            (array['Millbrook Town','Castlegate United','Westford City','Ashby Rovers','Dunmore Athletic','Kingsmere FC'])[i],
            'League', (next_sat - 7 * (7 - i))::timestamptz + interval '15 hours', true)
    returning id into ob;
    past_fix := past_fix || ob;
  end loop;

  insert into public.fixtures (organisation_id, opponent, competition, kickoff, is_home)
  values (org, 'Eastport Albion', 'League', next_sat::timestamptz + interval '15 hours', true) returning id into next_fix;
  insert into public.fixtures (organisation_id, opponent, competition, kickoff, is_home) values
    (org, 'Fenwick Borough', 'League', (next_sat + 14)::timestamptz + interval '15 hours', true),
    (org, 'Holloway Town', 'Cup', (next_sat + 21)::timestamptz + interval '19 hours 45 minutes', true);

  -- Delivered obligations (46), each with proof: 18 + 12 + 7 + 6 + 3
  for i in 1..46 loop
    insert into public.obligations (organisation_id, partner_id, fixture_id, source, title, placement, requires_asset, due_date, status)
    values (
      org,
      case when i <= 18 then harbour when i <= 30 then northline when i <= 37 then brightwater when i <= 43 then kestrel else oakmill end,
      past_fix[1 + (i % 6)],
      case when i % 5 = 0 then 'league' else 'contract' end,
      (array['LED rotation, 2 × 30 seconds','In-bowl screen advert','Concourse screen loop','Matchday social post','Hospitality box branding','Programme full-page advert'])[1 + (i % 6)],
      (array['led','in_bowl','concourse','social','hospitality','print'])[1 + (i % 6)],
      (i % 6) <> 4,
      next_sat - 7 * (6 - (i % 6)) - 1,
      'delivered')
    returning id into ob;

    insert into public.proof (organisation_id, obligation_id, note)
    values (org, ob, 'Playout log / photo received');
  end loop;

  -- Open obligations this week (12), across 4 partners. 7 have no asset yet, mostly LED for Eastport Albion.
  insert into public.obligations (organisation_id, partner_id, fixture_id, source, title, placement, requires_asset, due_date, status) values
    (org, harbour,     next_fix, 'contract', 'LED rotation, 2 × 30 seconds',        'led',         true,  next_sat - 2, 'open'),
    (org, harbour,     next_fix, 'contract', 'In-bowl screen advert',               'in_bowl',     true,  next_sat - 1, 'open'),
    (org, harbour,     next_fix, 'contract', 'Hospitality box branding',            'hospitality', true,  next_sat - 1, 'in_progress'),
    (org, harbour,     next_fix, 'league',   'League partner LED slot (EFL pack)',  'led',         true,  next_sat - 2, 'open'),
    (org, harbour,     next_fix, 'contract', 'Matchday social post',                'social',      true , next_sat,     'open'),
    (org, northline,   next_fix, 'contract', 'LED rotation, 1 × 30 seconds',        'led',         true,  next_sat - 2, 'open'),
    (org, northline,   next_fix, 'contract', 'Concourse screen loop',               'concourse',   true,  next_sat - 3, 'open'),
    (org, northline,   next_fix, 'contract', 'Player of the match presentation',    'other',       false, next_sat,     'open'),
    (org, brightwater, next_fix, 'contract', 'LED rotation, 1 × 30 seconds',        'led',         true,  next_sat - 2, 'open'),
    (org, brightwater, next_fix, 'contract', 'Concourse screen loop',               'concourse',   true,  next_sat - 3, 'in_progress'),
    (org, kestrel,     next_fix, 'contract', 'LED rotation, 1 × 30 seconds',        'led',         true,  next_sat - 2, 'open'),
    (org, kestrel,     next_fix, 'contract', 'Car display on the concourse',        'other',       false, next_sat,     'open');

  -- Give 3 of the asset-needing open obligations an asset already, leaving 7 missing
  insert into public.assets (organisation_id, partner_id, file_name, version, valid_from, spec_status)
  values (org, harbour, 'harbour-bank-inbowl-v2.mp4', 2, current_date - 30, 'passed') returning id into ob;
  update public.obligations set asset_id = ob where organisation_id = org and partner_id = harbour and placement = 'in_bowl' and status <> 'delivered';

  insert into public.assets (organisation_id, partner_id, file_name, version, valid_from, spec_status)
  values (org, harbour, 'harbour-bank-hospitality-banner.pdf', 1, current_date - 60, 'passed') returning id into ob;
  update public.obligations set asset_id = ob where organisation_id = org and partner_id = harbour and placement = 'hospitality' and status <> 'delivered';

  insert into public.assets (organisation_id, partner_id, file_name, version, valid_from, spec_status)
  values (org, brightwater, 'brightwater-concourse-loop.mp4', 1, current_date - 14, 'pending') returning id into ob;
  update public.obligations set asset_id = ob where organisation_id = org and partner_id = brightwater and placement = 'concourse' and status <> 'delivered';

  -- Upload links waiting on three partners
  insert into public.upload_links (organisation_id, partner_id, created_at) values
    (org, brightwater, now() - interval '3 days'),
    (org, kestrel,     now() - interval '2 days'),
    (org, oakmill,     now() - interval '1 day');
end $$;
