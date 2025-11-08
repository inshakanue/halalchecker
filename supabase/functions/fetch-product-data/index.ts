import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { barcode } = await req.json();
    
    if (!barcode) {
      return new Response(
        JSON.stringify({ error: 'Barcode is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    return new Response(
      JSON.stringify(productData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-product-data function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error', found: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
