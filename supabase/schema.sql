-- Jalankan di Supabase: SQL Editor > New query > Run
create table if not exists invitation(id int primary key default 1 check(id=1), data jsonb not null default '{}', updated_at timestamptz default now());
create table if not exists wishes(id bigint generated always as identity primary key, name text not null check(char_length(name)<=80), message text not null check(char_length(message)<=500), created_at timestamptz default now());
create table if not exists rsvp(id bigint generated always as identity primary key, name text not null check(char_length(name)<=80), guests int not null default 1 check(guests between 1 and 20), attending boolean not null, created_at timestamptz default now());
alter table invitation enable row level security; alter table wishes enable row level security; alter table rsvp enable row level security;
create policy "invitation read" on invitation for select using (true);
create policy "invitation admin write" on invitation for all to authenticated using (true) with check (true);
create policy "wishes read" on wishes for select using (true);
create policy "wishes insert" on wishes for insert to anon, authenticated with check (true);
create policy "wishes admin delete" on wishes for delete to authenticated using (true);
create policy "rsvp insert" on rsvp for insert to anon, authenticated with check (true);
create policy "rsvp admin read" on rsvp for select to authenticated using (true);
create policy "rsvp admin delete" on rsvp for delete to authenticated using (true);
insert into storage.buckets(id,name,public) values('media','media',true) on conflict (id) do nothing;
create policy "media read" on storage.objects for select using (bucket_id='media');
create policy "media admin insert" on storage.objects for insert to authenticated with check (bucket_id='media');
create policy "media admin update" on storage.objects for update to authenticated using (bucket_id='media');
create policy "media admin delete" on storage.objects for delete to authenticated using (bucket_id='media');
