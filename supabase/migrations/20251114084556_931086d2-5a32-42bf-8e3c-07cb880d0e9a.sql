-- Create certification_cache table to store halal certification check results
CREATE TABLE public.certification_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barcode TEXT NOT NULL,
  product_name TEXT NOT NULL,
  brand TEXT,
  is_certified BOOLEAN NOT NULL DEFAULT false,
  cert_body TEXT,
  cert_country TEXT,
  cert_link TEXT,
  external_source TEXT,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on barcode for fast lookups
CREATE INDEX idx_certification_cache_barcode ON public.certification_cache(barcode);

-- Create index on expires_at for cache cleanup queries
CREATE INDEX idx_certification_cache_expires_at ON public.certification_cache(expires_at);

-- Enable Row Level Security
ALTER TABLE public.certification_cache ENABLE ROW LEVEL SECURITY;

-- Anyone can view certification cache (public data)
CREATE POLICY "Anyone can view certification cache"
ON public.certification_cache
FOR SELECT
USING (true);

-- Only admins can insert certification cache (backend uses service role)
CREATE POLICY "Admins can insert certification cache"
ON public.certification_cache
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update certification cache
CREATE POLICY "Admins can update certification cache"
ON public.certification_cache
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete certification cache
CREATE POLICY "Admins can delete certification cache"
ON public.certification_cache
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));