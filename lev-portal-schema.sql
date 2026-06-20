-- ================================================================
-- LEV PORTAL — Supabase Schema
-- Paste into: Supabase Dashboard → SQL Editor → New Query → Run
-- ================================================================


-- ── 0. Helper: read role from JWT ────────────────────────────────────────────
-- NOTE: Must live in public schema — Supabase blocks writes to auth schema.
-- auth.jwt() and auth.uid() are still called freely from here.
create or replace function public.user_role()
returns text
language sql stable
as $$
  select coalesce(
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    'renter'
  )
$$;


-- ════════════════════════════════════════════════════════════════
-- 1. PROFILES
-- ════════════════════════════════════════════════════════════════
create table if not exists public.profiles (
  id            uuid        primary key references auth.users on delete cascade,
  full_name     text        not null,
  role          text        not null default 'renter'
                              check (role in ('owner', 'renter')),
  lot           text,
  phone         text,
  avatar_url    text,
  rental_start  date,
  rental_end    date,
  created_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Authenticated users can read all profiles"
  on public.profiles for select
  to authenticated using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using      (id = auth.uid())
  with check (id = auth.uid());

-- Auto-create profile row whenever a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id, full_name, role, lot, phone, avatar_url, rental_start, rental_end
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Resident'),
    coalesce(new.raw_user_meta_data ->> 'role', 'renter'),
    nullif(new.raw_user_meta_data ->> 'lot', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    nullif(new.raw_user_meta_data ->> 'rental_start', '')::date,
    nullif(new.raw_user_meta_data ->> 'rental_end',   '')::date
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ════════════════════════════════════════════════════════════════
-- 2. DIRECTORY SERVICES
-- ════════════════════════════════════════════════════════════════
create table if not exists public.directory_services (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  service     text        not null,
  location    text        not null,
  phone       text        not null,
  email       text,
  whatsapp    text,
  created_by  uuid        references auth.users on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.directory_services enable row level security;

create policy "Authenticated users can read directory"
  on public.directory_services for select
  to authenticated using (true);

create policy "Authenticated users can add services"
  on public.directory_services for insert
  to authenticated with check (created_by = auth.uid());

create policy "Owner of entry or community owner can delete"
  on public.directory_services for delete
  to authenticated
  using (created_by = auth.uid() or public.user_role() = 'owner');


-- ════════════════════════════════════════════════════════════════
-- 3. NEWS / NEWSFEED
-- ════════════════════════════════════════════════════════════════
create table if not exists public.news_posts (
  id         uuid        primary key default gen_random_uuid(),
  author_id  uuid        not null references auth.users on delete cascade,
  title      text,
  content    text        not null,
  image_url  text,
  created_at timestamptz not null default now()
);

alter table public.news_posts enable row level security;

create policy "Authenticated users can read news"
  on public.news_posts for select
  to authenticated using (true);

create policy "Authenticated users can create posts"
  on public.news_posts for insert
  to authenticated with check (author_id = auth.uid());

create policy "Author or owner can delete post"
  on public.news_posts for delete
  to authenticated
  using (author_id = auth.uid() or public.user_role() = 'owner');

-- ── News comments ─────────────────────────────────────────────
create table if not exists public.news_comments (
  id         uuid        primary key default gen_random_uuid(),
  post_id    uuid        not null references public.news_posts on delete cascade,
  author_id  uuid        not null references auth.users on delete cascade,
  text       text        not null,
  created_at timestamptz not null default now()
);

alter table public.news_comments enable row level security;

create policy "Authenticated users can read news comments"
  on public.news_comments for select
  to authenticated using (true);

create policy "Authenticated users can add comments"
  on public.news_comments for insert
  to authenticated with check (author_id = auth.uid());

create policy "Author or owner can delete comment"
  on public.news_comments for delete
  to authenticated
  using (author_id = auth.uid() or public.user_role() = 'owner');


-- ════════════════════════════════════════════════════════════════
-- 4. VOTING / POLLS
-- ════════════════════════════════════════════════════════════════
create table if not exists public.polls (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  description text        not null,
  created_by  uuid        not null references auth.users on delete cascade,
  ends_at     date        not null,
  audience    text        not null default 'all'
                            check (audience in ('all', 'owners_only')),
  created_at  timestamptz not null default now()
);

alter table public.polls enable row level security;

create policy "Users can read polls they have access to"
  on public.polls for select
  to authenticated
  using (audience = 'all' or public.user_role() = 'owner');

create policy "Owners can create polls"
  on public.polls for insert
  to authenticated
  with check (public.user_role() = 'owner' and created_by = auth.uid());

create policy "Poll creator can update poll"
  on public.polls for update
  to authenticated
  using (created_by = auth.uid());

-- ── Poll options ──────────────────────────────────────────────
create table if not exists public.poll_options (
  id         uuid primary key default gen_random_uuid(),
  poll_id    uuid not null references public.polls on delete cascade,
  text       text not null,
  sort_order int  not null default 0
);

alter table public.poll_options enable row level security;

create policy "Users can read options for accessible polls"
  on public.poll_options for select
  to authenticated
  using (
    exists (
      select 1 from public.polls p
      where p.id = poll_id
        and (p.audience = 'all' or public.user_role() = 'owner')
    )
  );

create policy "Poll creator can manage options"
  on public.poll_options for all
  to authenticated
  using (
    exists (
      select 1 from public.polls p
      where p.id = poll_id and p.created_by = auth.uid()
    )
  );

-- ── Poll votes ────────────────────────────────────────────────
create table if not exists public.poll_votes (
  id        uuid        primary key default gen_random_uuid(),
  poll_id   uuid        not null references public.polls on delete cascade,
  option_id uuid        not null references public.poll_options on delete cascade,
  user_id   uuid        not null references auth.users on delete cascade,
  voted_at  timestamptz not null default now(),
  unique (poll_id, user_id)
);

alter table public.poll_votes enable row level security;

create policy "Users can read vote counts"
  on public.poll_votes for select
  to authenticated using (true);

create policy "Users can cast one vote on accessible polls"
  on public.poll_votes for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.polls p
      where p.id = poll_id
        and (p.audience = 'all' or public.user_role() = 'owner')
    )
  );

-- ── Poll comments ─────────────────────────────────────────────
create table if not exists public.poll_comments (
  id         uuid        primary key default gen_random_uuid(),
  poll_id    uuid        not null references public.polls on delete cascade,
  author_id  uuid        not null references auth.users on delete cascade,
  text       text        not null,
  created_at timestamptz not null default now()
);

alter table public.poll_comments enable row level security;

create policy "Users can read comments on accessible polls"
  on public.poll_comments for select
  to authenticated
  using (
    exists (
      select 1 from public.polls p
      where p.id = poll_id
        and (p.audience = 'all' or public.user_role() = 'owner')
    )
  );

create policy "Users can comment on accessible polls"
  on public.poll_comments for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.polls p
      where p.id = poll_id
        and (p.audience = 'all' or public.user_role() = 'owner')
    )
  );

create policy "Author or owner can delete poll comment"
  on public.poll_comments for delete
  to authenticated
  using (author_id = auth.uid() or public.user_role() = 'owner');


-- ════════════════════════════════════════════════════════════════
-- 5. DOCUMENTS
-- ════════════════════════════════════════════════════════════════
create table if not exists public.documents (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  folder      text        not null,
  access      text        not null default 'all'
                            check (access in ('all', 'owners_only')),
  status      text        not null default 'pending'
                            check (status in ('pending', 'approved')),
  uploaded_by uuid        references auth.users on delete set null,
  uploaded_at timestamptz not null default now(),
  file_url    text        not null,
  file_path   text        not null
);

alter table public.documents enable row level security;

create policy "Users can read accessible documents"
  on public.documents for select
  to authenticated
  using (
    (access = 'all' or public.user_role() = 'owner')
    and (status = 'approved' or uploaded_by = auth.uid() or public.user_role() = 'owner')
  );

create policy "Authenticated users can upload documents"
  on public.documents for insert
  to authenticated with check (uploaded_by = auth.uid());

create policy "Owners can approve / update documents"
  on public.documents for update
  to authenticated using (public.user_role() = 'owner');

create policy "Uploader who is an owner can delete"
  on public.documents for delete
  to authenticated
  using (uploaded_by = auth.uid() and public.user_role() = 'owner');


-- ════════════════════════════════════════════════════════════════
-- 6. NEIGHBOUR SUPPORT TICKETS
-- ════════════════════════════════════════════════════════════════
create sequence if not exists public.ticket_seq start 1;

create table if not exists public.tickets (
  id             uuid        primary key default gen_random_uuid(),
  ticket_number  text        not null unique
                               default ('TKT-' || lpad(nextval('public.ticket_seq')::text, 4, '0')),
  category       text        not null check (category in ('fault', 'request', 'complaint', 'idea')),
  subject        text        not null,
  description    text        not null,
  priority       text        not null check (priority in ('low', 'medium', 'high', 'urgent')),
  status         text        not null default 'open'
                               check (status in ('open', 'in_progress', 'resolved', 'closed')),
  submitted_by   uuid        not null references auth.users on delete cascade,
  unit           text        not null,
  attachment_url text,
  created_at     timestamptz not null default now()
);

alter table public.tickets enable row level security;

create policy "Users see own tickets; owners see all"
  on public.tickets for select
  to authenticated
  using (submitted_by = auth.uid() or public.user_role() = 'owner');

create policy "Authenticated users can submit tickets"
  on public.tickets for insert
  to authenticated with check (submitted_by = auth.uid());

create policy "Owners can update ticket status"
  on public.tickets for update
  to authenticated using (public.user_role() = 'owner');

-- ── Ticket history ────────────────────────────────────────────
create table if not exists public.ticket_history (
  id          uuid        primary key default gen_random_uuid(),
  ticket_id   uuid        not null references public.tickets on delete cascade,
  type        text        not null check (type in ('status_change', 'comment')),
  actor_id    uuid        not null references auth.users on delete cascade,
  is_admin    boolean     not null default false,
  text        text,
  from_status text,
  to_status   text,
  created_at  timestamptz not null default now()
);

alter table public.ticket_history enable row level security;

create policy "History visible to submitter and owners"
  on public.ticket_history for select
  to authenticated
  using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and (t.submitted_by = auth.uid() or public.user_role() = 'owner')
    )
  );

create policy "Submitter can comment; owners can do both"
  on public.ticket_history for insert
  to authenticated
  with check (
    actor_id = auth.uid()
    and (
      (is_admin = false and exists (
        select 1 from public.tickets t
        where t.id = ticket_id and t.submitted_by = auth.uid()
      ))
      or public.user_role() = 'owner'
    )
  );


-- ════════════════════════════════════════════════════════════════
-- 7. GATE PASSES
-- ════════════════════════════════════════════════════════════════
create table if not exists public.gate_passes (
  id              uuid        primary key default gen_random_uuid(),
  pass_code       text        not null unique,
  type            text        not null check (type in ('visitor', 'worker', 'event', 'other')),
  reason          text        not null,
  visitor_name    text        not null,
  email           text,
  phone           text        not null,
  visiting_lot    text        not null,
  extended        boolean     not null default false,
  arrival_date    date        not null,
  departure_date  date        not null,
  created_by      uuid        not null references auth.users on delete cascade,
  created_at      timestamptz not null default now(),
  id_photo_url    text,
  approval_status text
                    check (approval_status in ('pending', 'approved', 'declined'))
);

alter table public.gate_passes enable row level security;

create policy "Users see own passes; owners see all"
  on public.gate_passes for select
  to authenticated
  using (created_by = auth.uid() or public.user_role() = 'owner');

create policy "Authenticated users can create passes"
  on public.gate_passes for insert
  to authenticated with check (created_by = auth.uid());

create policy "Owners can approve or decline extended passes"
  on public.gate_passes for update
  to authenticated
  using      (public.user_role() = 'owner')
  with check (public.user_role() = 'owner');

create policy "Pass creator can delete own pass"
  on public.gate_passes for delete
  to authenticated using (created_by = auth.uid());


-- ════════════════════════════════════════════════════════════════
-- 8. MESSAGES
-- ════════════════════════════════════════════════════════════════
create table if not exists public.message_threads (
  id          uuid        primary key default gen_random_uuid(),
  subject     text        not null,
  created_by  uuid        not null references auth.users on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.message_participants (
  thread_id  uuid not null references public.message_threads on delete cascade,
  user_id    uuid not null references auth.users on delete cascade,
  primary key (thread_id, user_id)
);

create table if not exists public.message_items (
  id        uuid        primary key default gen_random_uuid(),
  thread_id uuid        not null references public.message_threads on delete cascade,
  from_id   uuid        not null references auth.users on delete cascade,
  text      text        not null,
  sent_at   timestamptz not null default now()
);

alter table public.message_threads      enable row level security;
alter table public.message_participants enable row level security;
alter table public.message_items        enable row level security;

create policy "Participants can read their threads"
  on public.message_threads for select
  to authenticated
  using (
    exists (
      select 1 from public.message_participants mp
      where mp.thread_id = id and mp.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create threads"
  on public.message_threads for insert
  to authenticated with check (created_by = auth.uid());

create policy "Participants can update thread"
  on public.message_threads for update
  to authenticated
  using (
    exists (
      select 1 from public.message_participants mp
      where mp.thread_id = id and mp.user_id = auth.uid()
    )
  );

create policy "Users can read their own participations"
  on public.message_participants for select
  to authenticated using (user_id = auth.uid());

create policy "Thread creator can add participants"
  on public.message_participants for insert
  to authenticated
  with check (
    exists (
      select 1 from public.message_threads t
      where t.id = thread_id and t.created_by = auth.uid()
    )
  );

create policy "Participants can read messages"
  on public.message_items for select
  to authenticated
  using (
    exists (
      select 1 from public.message_participants mp
      where mp.thread_id = thread_id and mp.user_id = auth.uid()
    )
  );

create policy "Participants can send messages"
  on public.message_items for insert
  to authenticated
  with check (
    from_id = auth.uid()
    and exists (
      select 1 from public.message_participants mp
      where mp.thread_id = thread_id and mp.user_id = auth.uid()
    )
  );

-- Auto-bump updated_at on new message
create or replace function public.bump_thread_updated_at()
returns trigger language plpgsql as $$
begin
  update public.message_threads
  set updated_at = now()
  where id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists on_new_message on public.message_items;
create trigger on_new_message
  after insert on public.message_items
  for each row execute procedure public.bump_thread_updated_at();


-- ════════════════════════════════════════════════════════════════
-- 9. INDEXES
-- ════════════════════════════════════════════════════════════════
create index if not exists idx_news_posts_created      on public.news_posts        (created_at desc);
create index if not exists idx_news_comments_post      on public.news_comments     (post_id);
create index if not exists idx_polls_ends_at           on public.polls             (ends_at desc);
create index if not exists idx_poll_votes_poll         on public.poll_votes        (poll_id);
create index if not exists idx_poll_options_poll       on public.poll_options      (poll_id, sort_order);
create index if not exists idx_documents_status        on public.documents         (status, uploaded_at desc);
create index if not exists idx_tickets_status          on public.tickets           (status, created_at desc);
create index if not exists idx_ticket_history_ticket   on public.ticket_history    (ticket_id, created_at);
create index if not exists idx_gate_passes_created_by on public.gate_passes       (created_by, arrival_date);
create index if not exists idx_gate_passes_approval   on public.gate_passes       (approval_status) where approval_status = 'pending';
create index if not exists idx_msg_items_thread       on public.message_items     (thread_id, sent_at);
create index if not exists idx_msg_participants_user  on public.message_participants (user_id);


-- ════════════════════════════════════════════════════════════════
-- 10. STORAGE BUCKETS
--     If this INSERT fails, create buckets manually in Dashboard →
--     Storage → New Bucket (use the names and settings below).
-- ════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',        'avatars',        true,  5242880,  array['image/jpeg','image/png','image/webp']),
  ('news-images',    'news-images',    true,  10485760, array['image/jpeg','image/png','image/webp','image/gif']),
  ('documents',      'documents',      false, 52428800, array['application/pdf','image/jpeg','image/png']),
  ('gate-id-photos', 'gate-id-photos', false, 5242880,  array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- ── Storage RLS ───────────────────────────────────────────────

-- avatars — public read, own folder write
create policy "Avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload to own avatar folder"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own avatar"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own avatar"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- news-images — public read, authenticated write
create policy "News images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'news-images');

create policy "Authenticated users can upload news images"
  on storage.objects for insert
  to authenticated with check (bucket_id = 'news-images');

create policy "Authors and owners can delete news images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'news-images'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or (auth.jwt() -> 'user_metadata' ->> 'role') = 'owner'
    )
  );

-- documents — authenticated read (private bucket, RLS on table handles access)
create policy "Authenticated users can read documents"
  on storage.objects for select
  to authenticated using (bucket_id = 'documents');

create policy "Authenticated users can upload documents"
  on storage.objects for insert
  to authenticated with check (bucket_id = 'documents');

create policy "Owners can delete documents from storage"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'documents'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'owner'
  );

-- gate-id-photos — owners only (sensitive)
create policy "Owners can view gate ID photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'gate-id-photos'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'owner'
  );

create policy "Authenticated users can upload gate ID photos"
  on storage.objects for insert
  to authenticated with check (bucket_id = 'gate-id-photos');


-- ════════════════════════════════════════════════════════════════
-- ⚠ PRODUCTION NOTE: Hardening owner role
-- ════════════════════════════════════════════════════════════════
-- Currently role is self-reported at signup (user_metadata), so a
-- user could sign up as 'owner'. To harden for production:
--
-- 1. Default everyone to 'renter' at signup.
-- 2. Admin sets owner via Dashboard → Auth → Users → app_metadata:
--    { "role": "owner" }
-- 3. Update public.user_role() to prefer app_metadata:
--
--    create or replace function public.user_role()
--    returns text language sql stable as $$
--      select coalesce(
--        (auth.jwt() -> 'app_metadata' ->> 'role'),
--        (auth.jwt() -> 'user_metadata' ->> 'role'),
--        'renter'
--      )
--    $$;
--
-- app_metadata can only be written via service role key, so users
-- cannot self-promote.
-- ════════════════════════════════════════════════════════════════
