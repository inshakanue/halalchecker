-- Update reports table to use barcode instead of product_id
ALTER TABLE public.reports DROP COLUMN IF EXISTS product_id;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS barcode text;

-- Create index on barcode for faster lookups
CREATE INDEX IF NOT EXISTS idx_reports_barcode ON public.reports(barcode);