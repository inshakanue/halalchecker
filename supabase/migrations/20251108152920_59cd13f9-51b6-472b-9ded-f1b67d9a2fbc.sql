-- Add certification fields to verdicts table
ALTER TABLE public.verdicts
ADD COLUMN is_certified BOOLEAN DEFAULT false,
ADD COLUMN cert_body TEXT,
ADD COLUMN cert_country TEXT,
ADD COLUMN cert_link TEXT;