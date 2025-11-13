import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimit, getClientIp } from '../_shared/rateLimit.ts';
import { validate, barcodeSchema } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(clientIp, 'fetch-product-data', {
      maxRequests: 30,
      windowMs: 60000 // 1 minute
    });

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          resetAt: rateLimit.resetAt ? new Date(rateLimit.resetAt).toISOString() : undefined
        }),
        { 
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            ...(rateLimit.resetAt ? { 'X-RateLimit-Reset': String(rateLimit.resetAt) } : {})
          }
        }
      );
    }

    // Input validation
    const requestData = await req.json();
    const validated = validate(requestData, barcodeSchema) as any;
    const barcode = validated.barcode as string;

    console.log(`Fetching product data for barcode: ${barcode}`);

    // Query Open Food Facts API
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
    );

    if (!response.ok) {
      console.error(`Open Food Facts API error: ${response.status}`);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch product data', found: false }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    if (data.status === 0) {
      console.log(`Product not found for barcode: ${barcode}`);
      return new Response(
        JSON.stringify({ found: false, message: 'Product not found in Open Food Facts database' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const product = data.product;

    // Extract standardized product data
    const productData = {
      found: true,
      barcode: barcode,
      name: product.product_name || product.product_name_en || 'Unknown Product',
      brand: product.brands || 'Unknown Brand',
      ingredients: product.ingredients_text || product.ingredients_text_en || '',
      ingredientsList: product.ingredients?.map((ing: any) => ing.text || ing.id) || [],
      imageUrl: product.image_url || product.image_front_url || null,
      region: product.countries_tags?.[0]?.replace('en:', '') || 'global',
      categories: product.categories_tags || [],
      labels: product.labels_tags || [],
      allergens: product.allergens_tags || [],
      rawData: product
    };

    console.log(`Successfully fetched product: ${productData.name}`);

    // Store in cache using service role
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { persistSession: false }
        });

        const { error: cacheError } = await supabase
          .from('product_cache')
          .upsert({
            barcode,
            external_data: product,
            source: 'open_food_facts',
            last_fetched_at: new Date().toISOString()
          }, {
            onConflict: 'barcode'
          });

        if (cacheError) {
          console.error('Failed to cache product data:', cacheError);
          // Continue anyway - caching failure shouldn't block user
        } else {
          console.log('Product data cached successfully');
        }
      }
    } catch (cacheError) {
      console.error('Cache operation failed:', cacheError);
      // Continue anyway
    }

    return new Response(
      JSON.stringify(productData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Check if it's a validation error
    if (error instanceof Error && error.message.includes('Validation error')) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.error('Error in fetch-product-data function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error', found: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});