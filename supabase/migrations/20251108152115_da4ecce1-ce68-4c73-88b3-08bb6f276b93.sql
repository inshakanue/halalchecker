-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  brand TEXT,
  ingredients TEXT[],
  region TEXT NOT NULL DEFAULT 'global',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create verdicts table
CREATE TABLE public.verdicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  verdict TEXT NOT NULL CHECK (verdict IN ('halal', 'not_halal', 'unclear')),
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  flagged_ingredients TEXT[],
  analysis_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create reports table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT,
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verdicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for products table (public read access)
CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for verdicts table (public read access)
CREATE POLICY "Anyone can view verdicts"
  ON public.verdicts FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert verdicts"
  ON public.verdicts FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update verdicts"
  ON public.verdicts FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete verdicts"
  ON public.verdicts FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for reports table
CREATE POLICY "Users can view their own reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can create reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update reports"
  ON public.reports FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles table
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_verdicts_updated_at
  BEFORE UPDATE ON public.verdicts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample products
INSERT INTO public.products (barcode, name, brand, ingredients, region) VALUES
('8901058912524', 'Chicken Nuggets', 'Brand A', ARRAY['chicken', 'wheat flour', 'salt', 'spices'], 'global'),
('0123456789012', 'Beef Jerky Original', 'JerkyPro', ARRAY['beef', 'soy sauce', 'sugar', 'garlic'], 'US'),
('5012345678900', 'Lamb Korma Sauce', 'TastyBites', ARRAY['lamb', 'tomatoes', 'cream', 'spices', 'ghee'], 'EU'),
('6001234567890', 'Shawarma Spice Mix', 'SpiceMaster', ARRAY['cumin', 'coriander', 'paprika', 'garlic powder'], 'UAE'),
('9556789012345', 'Chicken Satay', 'AsianDelight', ARRAY['chicken', 'coconut milk', 'peanut sauce', 'lemongrass'], 'MY'),
('8992345678901', 'Rendang Paste', 'IndonesiaFoods', ARRAY['chili', 'galangal', 'lemongrass', 'coconut'], 'ID'),
('8901234567890', 'Biryani Masala', 'SpiceKing', ARRAY['cardamom', 'cinnamon', 'cloves', 'bay leaves'], 'IN'),
('8858123456789', 'Tom Yum Paste', 'ThaiTaste', ARRAY['lemongrass', 'galangal', 'kaffir lime', 'chili'], 'SEA');

-- Insert sample verdicts for the products
INSERT INTO public.verdicts (product_id, verdict, confidence_score, flagged_ingredients, analysis_notes)
SELECT 
  id,
  CASE 
    WHEN name LIKE '%Beef Jerky%' THEN 'unclear'
    WHEN name LIKE '%Lamb Korma%' THEN 'unclear'
    ELSE 'halal'
  END,
  CASE 
    WHEN name LIKE '%Beef Jerky%' THEN 0.65
    WHEN name LIKE '%Lamb Korma%' THEN 0.70
    ELSE 0.95
  END,
  CASE 
    WHEN name LIKE '%Beef Jerky%' THEN ARRAY['soy sauce (may contain alcohol)']
    WHEN name LIKE '%Lamb Korma%' THEN ARRAY['cream (animal source unclear)']
    ELSE ARRAY[]::TEXT[]
  END,
  CASE 
    WHEN name LIKE '%Beef Jerky%' THEN 'Soy sauce manufacturing process may involve alcohol. Requires halal certification verification.'
    WHEN name LIKE '%Lamb Korma%' THEN 'Cream and ghee sources need verification for halal certification.'
    ELSE 'All ingredients appear to be halal-compliant.'
  END
FROM public.products;