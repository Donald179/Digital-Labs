alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.services enable row level security;
alter table public.blog_posts enable row level security;
alter table public.downloads enable row level security;
alter table public.contact_messages enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1 from public.profiles
        where id = auth.uid()
        and role = 'admin'
    );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "Profiles can read own profile" on public.profiles;
create policy "Profiles can read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "Admins manage profiles" on public.profiles;
create policy "Admins manage profiles"
on public.profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories"
on public.categories for select
to anon, authenticated
using (true);

drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories"
on public.categories for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active services" on public.services;
create policy "Public can read active services"
on public.services for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Admins manage services" on public.services;
create policy "Admins manage services"
on public.services for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read published posts" on public.blog_posts;
create policy "Public can read published posts"
on public.blog_posts for select
to anon, authenticated
using (status = 'published' and published_at is not null and published_at <= now());

drop policy if exists "Admins manage blog posts" on public.blog_posts;
create policy "Admins manage blog posts"
on public.blog_posts for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active downloads" on public.downloads;
create policy "Public can read active downloads"
on public.downloads for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Admins manage downloads" on public.downloads;
create policy "Admins manage downloads"
on public.downloads for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can insert contact messages" on public.contact_messages;
create policy "Public can insert contact messages"
on public.contact_messages for insert
to anon, authenticated
with check (
    char_length(name) between 2 and 80
    and char_length(email) between 5 and 160
    and email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'
    and char_length(phone) between 6 and 30
    and char_length(subject) between 3 and 120
    and char_length(message) between 10 and 1500
    and status = 'new'
);

drop policy if exists "Admins read contact messages" on public.contact_messages;
create policy "Admins read contact messages"
on public.contact_messages for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins update contact messages" on public.contact_messages;
create policy "Admins update contact messages"
on public.contact_messages for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins delete contact messages" on public.contact_messages;
create policy "Admins delete contact messages"
on public.contact_messages for delete
to authenticated
using (public.is_admin());