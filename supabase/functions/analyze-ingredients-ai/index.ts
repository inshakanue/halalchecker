import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimit, getClientIp } from '../_shared/rateLimit.ts';
import { validate, ingredientsSchema, stringSchema, labelsSchema } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check (stricter for AI endpoint)
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(clientIp, 'analyze-ingredients-ai', {
      maxRequests: 10,
      windowMs: 60000 // 1 minute
    });

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. AI analysis is limited to 10 requests per minute.',
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
      ...ingredientsSchema,
      ...stringSchema('productName', 200),
      ...stringSchema('brand', 100),
      ...stringSchema('region', 50),
      ...stringSchema('barcode', 14),
      ...labelsSchema
    }) as any;
    
    const { productName, ingredients, brand, region, labels, barcode } = validated;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Analyzing ingredients for: ${productName}`);

    // Check for halal certification in labels first
    if (labels) {
      const labelString = typeof labels === 'string' ? labels.toLowerCase() : '';
      const halalKeywords = ['halal', 'حلال', 'halal-certified', 'en:halal'];
      
      const isCertified = halalKeywords.some(keyword => labelString.includes(keyword));
      
      if (isCertified) {
        console.log('Halal certification found in product labels');
        const certifiedResponse = {
          verdict: 'halal',
          confidence_score: 95,
          flagged_ingredients: [],
          analysis_notes: 'This product has official halal certification as indicated by its labels.',
          recommendations: 'Verify the certification body and validity date on the product packaging.',
          ai_explanation: 'Halal certification detected in product labels from Open Food Facts database.',
          analysis_method: 'certification_verified',
          is_certified: true,
          cert_body: 'Open Food Facts Database',
          external_source: 'Open Food Facts',
          verification_links: [
            `https://verifyhalal.com/product-result.html?keyword=${productName}`,
            'https://world.openfoodfacts.org/product/' + (brand || '').toLowerCase().replace(/\s+/g, '-')
          ]
        };

        // Store verdict with service role
        await storeVerdict(barcode || productName, brand, certifiedResponse);

        return new Response(
          JSON.stringify(certifiedResponse),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const ingredientsList = Array.isArray(ingredients)
      ? ingredients.join(', ') 
      : ingredients;

    const systemPrompt = `You are an expert in Islamic dietary laws (halal certification) with deep knowledge of Quranic verses, authentic Hadith, and scholarly consensus (ijma) across the four major madhabs (Hanafi, Maliki, Shafi'i, Hanbali).

**FOUNDATIONAL ISLAMIC PRINCIPLES:**

1. **Explicitly Haram (Forbidden) - Quran & Hadith:**
   - Pork and all pig derivatives (Quran 2:173, 5:3, 6:145, 16:115)
   - Blood (Quran 2:173, 5:3, 6:145) - includes blood plasma, blood meal
   - Alcohol/intoxicants (Quran 5:90-91) - ethanol for intoxication is haram; trace amounts (<0.5%) used as solvent may be acceptable per some scholars
   - Carrion (dead animals not slaughtered properly) (Quran 5:3)
   - Animals not slaughered per Islamic rites (zabihah) - requires bismillah, swift cut of throat, draining blood
   - Carnivorous animals with fangs (lions, dogs, cats) - Hadith (Sahih Muslim 1933)
   - Birds of prey with talons (eagles, hawks) - Hadith (Sahih Muslim 1934)
   - Donkeys and mules (domestic) - Hadith (Sahih Bukhari 4219)
   - Reptiles and amphibians (snakes, frogs, crocodiles) - scholarly consensus
   - Insects except locust/grasshopper (Quran 6:145, Hadith allow locusts)

2. **Mashbooh (Doubtful/Questionable) - Requires Investigation:**
   - Ingredients from ambiguous sources that could be halal or haram
   - Islamic principle: "Leave what makes you doubt for what does not make you doubt" (Hadith - Tirmidhi 2518)
   - When origin is unknown, stricter scholars advise avoidance; lenient views allow if halal is probable

3. **E-Numbers & Additives - Detailed Classification:**

   **HARAM E-Numbers (Animal/Insect Origin):**
   - E120 (Carmine/Cochineal) - from insects - HARAM
   - E441 (Gelatin) - often from pork - HARAM unless halal-certified beef/fish
   - E422 (Glycerol/Glycerin) - can be animal-based - MASHBOOH (need source verification)
   - E470-E495 (Fatty Acids, Mono/Diglycerides) - can be animal fat - MASHBOOH
   - E542 (Bone Phosphate) - from animal bones - HARAM unless certified halal
   - E631, E627 (Disodium Inosinate/Guanylate) - can be from pork - MASHBOOH
   - E904 (Shellac) - from lac beetle - MASHBOOH/HARAM per some scholars
   - E1105 (Lysozyme) - from egg whites (halal) or pork (haram) - MASHBOOH

   **ALCOHOL-BASED (Context-Dependent):**
   - E1510 (Ethanol) - if used as solvent/preservative (<0.5%) may be acceptable; for intoxication is HARAM
   - Vanilla extract (often contains alcohol) - scholars differ on permissibility

   **HALAL E-Numbers (Plant/Synthetic Origin):**
   - E100-E199 (Colors like turmeric, beetroot) - mostly HALAL if plant-based
   - E200-E299 (Preservatives like citric acid, ascorbic acid) - HALAL
   - E300-E399 (Antioxidants) - mostly HALAL
   - E400-E499 (Thickeners/Stabilizers like pectin, agar) - mostly HALAL if plant-based

**YOUR ANALYSIS FRAMEWORK:**

Analyze the provided ingredients and return a JSON object with these fields:

{
  "verdict": "halal" | "haram" | "questionable",
  "confidence_score": <number between 0-100>,
  "flagged_ingredients": [<array of problematic ingredient names>],
  "analysis_notes": "<detailed explanation citing Quranic verses, Hadith, or scholarly rulings>",
  "recommendations": "<actionable advice for the consumer>"
}

**DECISION RULES:**
- If ANY ingredient is definitively haram (pork, alcohol for intoxication, blood, improper slaughter), verdict = "haram" (even if 1 ingredient)
- If ingredients are all clearly halal with no doubts, verdict = "halal" with high confidence (90-100)
- If ingredients contain mashbooh items (unknown animal sources, ambiguous E-numbers), verdict = "questionable" with moderate confidence (40-70)
- For E-numbers, state the number, its common sources, and whether it's haram/halal/mashbooh
- Cite specific Quranic verses (e.g., Quran 5:3) or Hadith (e.g., Sahih Bukhari 4219) when applicable
- Consider both strictest (Hanafi) and most lenient (Maliki) madhab interpretations where relevant

**IMPORTANT:**
- Be precise: Don't assume ingredients are haram without evidence
- Distinguish between definitive rulings (nass) and scholarly opinions (ijtihad)
- For dairy/meat products, assume proper slaughter unless labels state otherwise (give benefit of doubt)
- If uncertain, err on "questionable" rather than "halal" or "haram"`;

    const userPrompt = `Product: ${productName || 'Unknown'}
Brand: ${brand || 'Unknown'}
Region: ${region || 'global'}

**Ingredients to analyze:**
${ingredientsList}

Provide a thorough halal analysis in JSON format. Be specific about E-numbers and cite Islamic sources.`;

    console.log('Calling Lovable AI for ingredient analysis...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI service rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service credits exhausted. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI API error: ${aiResponse.status} ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';
    
    console.log('AI Response received, parsing...');

    let analysis;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      analysis = {
        verdict: 'questionable',
        confidence_score: 50,
        flagged_ingredients: [],
        analysis_notes: aiContent || 'Analysis completed but formatting was unclear.',
        recommendations: 'Please verify ingredients with a halal certification authority.'
      };
    }

    const finalResponse = {
      ...analysis,
      ai_explanation: aiContent,
      analysis_method: 'ai_analysis',
      verification_links: [
        `https://verifyhalal.com/product-result.html?keyword=${productName}`,
        'https://world.openfoodfacts.org/product/' + (brand || '').toLowerCase().replace(/\s+/g, '-')
      ]
    };

    // Store verdict with service role
    await storeVerdict(barcode || productName, brand, finalResponse);

    console.log(`Analysis complete: ${finalResponse.verdict} (${finalResponse.confidence_score}% confidence)`);

    return new Response(
      JSON.stringify(finalResponse),
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

    console.error('Error in analyze-ingredients-ai:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to store verdict in database with service role
async function storeVerdict(barcodeOrId: string, brand: string | undefined, analysis: any) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials for storing verdict');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Use provided barcode or generate a unique identifier
    const barcode = barcodeOrId.match(/^\d{8,14}$/) 
      ? barcodeOrId 
      : `analyzed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const { error: dbError } = await supabase
      .from('verdicts')
      .insert({
        barcode: barcode,
        verdict: analysis.verdict,
        confidence_score: analysis.confidence_score || null,
        flagged_ingredients: analysis.flagged_ingredients || [],
        analysis_notes: analysis.analysis_notes || null,
        ai_explanation: analysis.ai_explanation || null,
        analysis_method: analysis.analysis_method || 'ai_analysis',
        is_certified: analysis.is_certified || false,
        cert_body: analysis.cert_body || null,
        cert_country: analysis.cert_country || null,
        cert_link: analysis.cert_link || null,
        external_source: analysis.external_source || null,
      });

    if (dbError) {
      console.error('Failed to store verdict in database:', dbError);
    } else {
      console.log('Verdict stored successfully in database');
    }
  } catch (error) {
    console.error('Error storing verdict:', error);
    // Don't throw - we still want to return the analysis to the user
  }
}