-- Assumes the 'Profile_pic' bucket is already created.
-- If not, you can run:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('Profile_pic', 'Profile_pic', true);

-- Policy to allow public read access to Profile_pic
CREATE POLICY "Profile Pic Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'Profile_pic');

-- Policy to allow authenticated users to upload their profile pics
CREATE POLICY "Authenticated Profile Pic Upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'Profile_pic' AND auth.role() = 'authenticated'
  );

-- Policy to allow users to update their own profile pics
CREATE POLICY "Authenticated Profile Pic Update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'Profile_pic' AND auth.role() = 'authenticated'
  );
