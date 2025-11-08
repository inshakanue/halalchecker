import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { productName, region = 'world' } = await req.json();

    if (!productName) {
      return new Response(
        JSON.stringify({ error: 'Product name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
    console.error('Error in search-products-by-name:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
