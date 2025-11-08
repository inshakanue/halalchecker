-- Add new columns to verdicts table for AI analysis tracking
ALTER TABLE public.verdicts 
ADD COLUMN IF NOT EXISTS analysis_method text DEFAULT 'rules_engine',
ADD COLUMN IF NOT EXISTS external_source text,
ADD COLUMN IF NOT EXISTS last_verified_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS ai_explanation text;

-- Add check constraint for analysis_method
ALTER TABLE public.verdicts 
ADD CONSTRAINT verdicts_analysis_method_check 
CHECK (analysis_method IN ('rules_engine', 'ai_analysis', 'manual'));

-- Create product_cache table for storing external API responses
CREATE TABLE IF NOT EXISTS public.product_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barcode text NOT NULL UNIQUE,
  external_data jsonb NOT NULL,
  source text NOT NULL DEFAULT 'open_food_facts',
  last_fetched_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on product_cache
ALTER TABLE public.product_cache ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read cached product data
CREATE POLICY "Anyone can view product cache"
ON public.product_cache
FOR SELECT
USING (true);

-- Only admins can insert/update cache
CREATE POLICY "Admins can manage product cache"
ON public.product_cache
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index on barcode for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_cache_barcode ON public.product_cache(barcode);

-- Create index on last_fetched_at for cache invalidation
CREATE INDEX IF NOT EXISTS idx_product_cache_last_fetched ON public.product_cache(last_fetched_at);