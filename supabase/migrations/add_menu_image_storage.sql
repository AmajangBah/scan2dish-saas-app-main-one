-- Enable real menu image uploads via Supabase Storage
-- Creates a public-read bucket and basic authenticated write policies.

-- 1) Create bucket (public read so customers can load images)
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do update set public = true;

-- 2) RLS policies for storage.objects
-- NOTE: Supabase Storage uses `storage.objects` with RLS.
-- We keep this simple:
-- - Anyone can read objects from menu-images (public customer menu).
-- - Authenticated users can upload into menu-images.
-- - Users can update/delete only their own uploads (owner column).

drop policy if exists "menu_images_public_read" on storage.objects;
create policy "menu_images_public_read"
on storage.objects
for select
to public
using (bucket_id = 'menu-images');

drop policy if exists "menu_images_auth_insert" on storage.objects;
create policy "menu_images_auth_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'menu-images');

drop policy if exists "menu_images_owner_update" on storage.objects;
create policy "menu_images_owner_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'menu-images' and owner = auth.uid())
with check (bucket_id = 'menu-images' and owner = auth.uid());

drop policy if exists "menu_images_owner_delete" on storage.objects;
create policy "menu_images_owner_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'menu-images' and owner = auth.uid());

