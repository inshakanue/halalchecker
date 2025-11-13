import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, getClientIp } from '../_shared/rateLimit.ts';
import { validate, productNameSchema, regionSchema } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(clientIp, 'search-products-by-name', {
      maxRequests: 20,
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
    const validated = validate(requestData, {
      ...productNameSchema,
      ...regionSchema
    }) as any;
    const productName = validated.productName as string;
    const region = validated.region as string;

    console.log('Searching for product:', productName, 'in region:', region);

    // Search Open Food Facts API
    const searchUrl = `https://${region}.openfoodfacts.org/cgi/search.pl`;
    const params = new URLSearchParams({
      search_terms: productName,
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: '10',
      fields: 'code,product_name,brands,image_url,ingredients_text'
    });

    const response = await fetch(`${searchUrl}?${params}`);
    
    if (!response.ok) {
      console.error('Open Food Facts API error:', response.status);
      return new Response(
        JSON.stringify({ error: 'Failed to search products' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    console.log('Search results count:', data.products?.length || 0);

    const products = (data.products || []).map((product: any) => ({
      barcode: product.code,
      name: product.product_name || 'Unknown Product',
      brand: product.brands || 'Unknown Brand',
      imageUrl: product.image_url || null,
      hasIngredients: Boolean(product.ingredients_text)
    })).filter((p: any) => p.barcode); // Only include products with barcodes

    return new Response(
      JSON.stringify({ 
        products,
        count: products.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    // Check if it's a validation error
    if (error instanceof Error && error.message.includes('Validation error')) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.error('Error in search-products-by-name:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});