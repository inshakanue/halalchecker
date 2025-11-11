-- Drop the reports table and related policies (no longer needed after removing Report page)
DROP TABLE IF EXISTS public.reports CASCADE;

-- Drop the report-photos storage bucket
DELETE FROM storage.buckets WHERE id = 'report-photos';