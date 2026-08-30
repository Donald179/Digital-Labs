create extension if not exists pgcrypto;

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text unique,
    role text not null default 'user' check (role in ('user', 'admin')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.categories (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null unique,
    type text not null default 'general' check (type in ('general', 'service', 'blog', 'download')),
    description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint categories_name_length check (char_length(name) between 2 and 80),
    constraint categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists public.services (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    slug text not null unique,
    description text not null,
    price numeric(10,2),
    currency text not null default 'FCFA',
    category text not null,
    category_id uuid references public.categories(id) on delete set null,
    platform text,
    image_url text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint services_title_length check (char_length(title) between 3 and 180),
    constraint services_description_length check (char_length(description) between 10 and 1000),
    constraint services_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    constraint services_price_positive check (price is null or price >= 0),
    constraint services_currency_length check (char_length(currency) between 2 and 12)
);

create table if not exists public.blog_posts (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    slug text not null unique,
    excerpt text not null,
    content text not null,
    featured_image text,
    category text not null,
    category_id uuid references public.categories(id) on delete set null,
    author text not null,
    status text not null default 'draft' check (status in ('draft', 'published')),
    published_at timestamptz,
    meta_keywords text,
    seo_description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint blog_posts_title_length check (char_length(title) between 3 and 180),
    constraint blog_posts_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    constraint blog_posts_excerpt_length check (char_length(excerpt) between 20 and 320),
    constraint blog_posts_author_length check (char_length(author) between 2 and 120),
    constraint blog_posts_published_date check ((status = 'draft') or (status = 'published' and published_at is not null))
);

create table if not exists public.downloads (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null unique,
    description text not null,
    version text,
    platform text,
    file_url text,
    website_url text,
    category text not null,
    category_id uuid references public.categories(id) on delete set null,
    icon_url text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint downloads_name_length check (char_length(name) between 2 and 120),
    constraint downloads_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    constraint downloads_description_length check (char_length(description) between 10 and 800),
    constraint downloads_has_url check (file_url is not null or website_url is not null)
);

create table if not exists public.contact_messages (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null,
    phone text not null,
    subject text not null,
    message text not null,
    status text not null default 'new' check (status in ('new', 'read', 'archived')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint contact_name_length check (char_length(name) between 2 and 80),
    constraint contact_email_length check (char_length(email) between 5 and 160),
    constraint contact_email_format check (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
    constraint contact_phone_length check (char_length(phone) between 6 and 30),
    constraint contact_subject_length check (char_length(subject) between 3 and 120),
    constraint contact_message_length check (char_length(message) between 10 and 1500),
    constraint contact_no_script check (message !~* '<\s*script' and subject !~* '<\s*script' and name !~* '<\s*script')
);

create index if not exists idx_services_active_created on public.services (is_active, created_at desc);
create index if not exists idx_services_category on public.services (category);
create index if not exists idx_blog_posts_public on public.blog_posts (status, published_at desc);
create index if not exists idx_blog_posts_category on public.blog_posts (category);
create index if not exists idx_downloads_active_created on public.downloads (is_active, created_at desc);
create index if not exists idx_downloads_category on public.downloads (category);
create index if not exists idx_contact_messages_status_created on public.contact_messages (status, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at before update on public.categories for each row execute function public.set_updated_at();

drop trigger if exists set_services_updated_at on public.services;
create trigger set_services_updated_at before update on public.services for each row execute function public.set_updated_at();

drop trigger if exists set_blog_posts_updated_at on public.blog_posts;
create trigger set_blog_posts_updated_at before update on public.blog_posts for each row execute function public.set_updated_at();

drop trigger if exists set_downloads_updated_at on public.downloads;
create trigger set_downloads_updated_at before update on public.downloads for each row execute function public.set_updated_at();

drop trigger if exists set_contact_messages_updated_at on public.contact_messages;
create trigger set_contact_messages_updated_at before update on public.contact_messages for each row execute function public.set_updated_at();