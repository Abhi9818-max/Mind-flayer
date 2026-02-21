-- Create the 'avatars' bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- Policy to allow public read access to avatars
CREATE POLICY "Avatar Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Policy to allow authenticated users to upload avatars
CREATE POLICY "Authenticated Avatar Upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
  );

-- Policy to allow users to update their own avatars
CREATE POLICY "Authenticated Avatar Update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
  );
