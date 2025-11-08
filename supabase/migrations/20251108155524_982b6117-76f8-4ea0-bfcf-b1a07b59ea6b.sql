-- Drop the foreign key constraint if it exists and change verdicts to use barcode instead of product_id
ALTER TABLE public.verdicts DROP COLUMN IF EXISTS product_id;
ALTER TABLE public.verdicts ADD COLUMN IF NOT EXISTS barcode text NOT NULL;

-- Create unique constraint on barcode to ensure one verdict per barcode
CREATE UNIQUE INDEX IF NOT EXISTS idx_verdicts_barcode_unique ON public.verdicts(barcode);

-- Create index on barcode for faster lookups
CREATE INDEX IF NOT EXISTS idx_verdicts_barcode ON public.verdicts(barcode);