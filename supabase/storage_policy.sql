-- Run after creating the "Photos" bucket (Storage -> New bucket -> name
-- "Photos" -> Public on). The bucket's "Public" toggle only covers reading
-- files back — uploading still needs an explicit policy on storage.objects,
-- which is what this adds (open to everyone, same trade-off as schema.sql).
-- Bucket names are case-sensitive in Supabase's API — this must match
-- exactly what you created (capital P).
create policy "public upload to photos"
on storage.objects for insert
to anon
with check (bucket_id = 'Photos');

create policy "public read photos"
on storage.objects for select
to anon
using (bucket_id = 'Photos');

create policy "public update photos"
on storage.objects for update
to anon
using (bucket_id = 'Photos');

create policy "public delete photos"
on storage.objects for delete
to anon
using (bucket_id = 'Photos');
