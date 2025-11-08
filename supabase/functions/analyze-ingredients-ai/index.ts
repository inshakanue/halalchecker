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
    const { productName, ingredients, brand, region } = await req.json();
    
    if (!ingredients || ingredients.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Ingredients are required for analysis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Analyzing ingredients for: ${productName}`);

    const ingredientsList = Array.isArray(ingredients) 
      ? ingredients.join(', ') 
      : ingredients;

    const systemPrompt = `You are a halal food certification expert. Analyze ingredients for halal compliance according to Islamic dietary laws.

Consider:
1. **Haram (Forbidden) Ingredients**: Pork, alcohol, blood, carnivorous animals, insects (except locust/grasshopper), animals not slaughtered according to Islamic law
2. **E-Numbers**: Many E-numbers can be from animal or plant sources. Flag suspicious ones (e.g., E120=carmine/insect, E441=gelatin, E542=bone phosphate, E471=mono/diglycerides which could be animal-derived)
3. **Derivatives**: Animal fats, lard, enzymes (rennet, pepsin), gelatin, whey (if from non-halal cheese), emulsifiers, glycerin
4. **Ambiguous Terms**: "Natural flavors", "enzymes", "processing aids" can hide non-halal ingredients
5. **Regional Context**: Standards vary by region (${region || 'global'})

Return your analysis as a JSON object with:
- verdict: "halal", "not_halal", or "questionable"
- confidence_score: 0-100 (higher = more certain)
- flagged_ingredients: array of ingredient names that are problematic
- analysis_notes: detailed explanation of your verdict (2-3 sentences)
- recommendations: what to verify or look for on certification`;

    const userPrompt = `Product: ${productName || 'Unknown'}
Brand: ${brand || 'Unknown'}
Region: ${region || 'global'}

Ingredients:
${ingredientsList}

Analyze these ingredients for halal compliance and return JSON only.`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';

    console.log('AI Response:', aiContent);

    // Parse AI response (try to extract JSON)
    let analysis;
    try {
      // Try to find JSON in the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback if no JSON found
        analysis = {
          verdict: 'questionable',
          confidence_score: 50,
          flagged_ingredients: [],
          analysis_notes: aiContent || 'Unable to parse AI response',
          recommendations: 'Manual verification recommended'
        };
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      analysis = {
        verdict: 'questionable',
        confidence_score: 50,
        flagged_ingredients: [],
        analysis_notes: 'AI analysis completed but response format was unexpected',
        recommendations: 'Manual verification recommended'
      };
    }

    return new Response(
      JSON.stringify({
        ...analysis,
        ai_explanation: aiContent,
        analysis_method: 'ai_analysis'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-ingredients-ai function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        verdict: 'questionable',
        analysis_notes: 'Analysis failed due to technical error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
