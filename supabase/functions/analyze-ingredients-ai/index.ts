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
    const { productName, ingredients, brand, region, labels } = await req.json();
    
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

    // Check for halal certification in labels first
    if (labels) {
      const labelString = typeof labels === 'string' ? labels.toLowerCase() : '';
      const halalKeywords = ['halal', 'حلال', 'halal-certified', 'en:halal'];
      
      const isCertified = halalKeywords.some(keyword => labelString.includes(keyword));
      
      if (isCertified) {
        console.log('Halal certification found in product labels');
        return new Response(
          JSON.stringify({
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
          }),
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
   - E120 (Carmine/Cochineal) - insect-derived red dye (haram per majority scholars)
   - E441 (Gelatin) - typically from pork/non-zabihah animals unless certified halal
   - E542 (Bone phosphate) - from animal bones
   - E631, E627 (Disodium inosinate/guanylate) - often from non-halal meat
   - E904 (Shellac) - insect secretion (debated, stricter view: haram)
   - E1105 (Lysozyme) - often from eggs (halal) but can be from pork

   **QUESTIONABLE E-Numbers (Could be Animal OR Plant):**
   - E470-E472 (Fatty acid esters) - can be from animal fat or plant oils
   - E471 (Mono/diglycerides) - MOST COMMON QUESTIONABLE - can be from pork fat, beef fat, or plant oils
   - E481-E482 (Stearoyl lactylates) - can be from animal or plant
   - E473-E477 (Emulsifiers) - source unclear without certification
   - E432-E436 (Polysorbates) - fatty acid source unclear
   - E479b (Thermally oxidized soy oil) - usually plant but verify
   - E491-E495 (Sorbitan esters) - can be animal-derived
   - E570 (Stearic acid) - can be from animal fat or plant
   - E1518 (Glyceryl triacetate) - glycerin can be animal or plant

   **ALCOHOL-CONTAINING (Requires Nuance):**
   - E1510 (Ethanol) - if used as solvent in tiny amounts, lenient scholars allow; if for intoxication, haram
   - Vanilla extract - typically contains alcohol; artificial vanilla (vanillin) is halal

   **HALAL E-Numbers (Plant/Mineral/Synthetic):**
   - E100-E163 (Most natural colors from plants/minerals)
   - E200-E290 (Preservatives like sorbates, benzoates - synthetic/mineral)
   - E300-E321 (Antioxidants like Vitamin C, E - synthetic/plant)
   - E400-E418 (Vegetable gums - seaweed, plant extracts)

4. **Enzymes & Processing Aids (Critical Gray Area):**
   - **Rennet**: Traditionally from calf stomach (haram if not zabihah); microbial/vegetable rennet is halal
   - **Pepsin**: From pig/cow stomach - usually haram unless certified halal
   - **Lipase**: Can be from animal pancreas or microbial (verify source)
   - **Protease, Amylase**: Usually microbial/plant (halal) but can be animal-derived
   - **Lactase**: Usually microbial (halal)
   - **Processing aids**: Often not listed but can include non-halal enzymes (e.g., in cheese, bread)

5. **Dairy & Animal Products:**
   - **Cheese**: Questionable if contains animal rennet; check for "microbial enzymes" or halal certification
   - **Whey**: If from cheese made with animal rennet, questionable
   - **Whey protein**: Same concern as whey
   - **Milk powder, butter**: Generally halal unless cross-contaminated
   - **Lactose**: Halal (milk sugar)

6. **Fats & Oils:**
   - **Lard, tallow, suet**: Clearly haram (pork/non-zabihah animal fat)
   - **Shortening**: Can be plant (halal) or animal (haram) - verify
   - **Glycerin/Glycerol**: Can be from animal fat (haram) or plant oils (halal) - VERY COMMON, usually questionable
   - **Mono/diglycerides**: See E471 above - MAJOR concern
   - **Lecithin**: Usually from soy/sunflower (halal); can be from eggs (halal); rarely from animal fat

7. **Flavorings & Extracts:**
   - **Natural flavors**: Broad term; can include animal derivatives (e.g., castoreum from beavers - debated)
   - **Artificial flavors**: Usually synthetic (halal) but verify no alcohol carrier
   - **Vanilla extract**: Contains alcohol (questionable to haram); vanilla powder/vanillin is halal
   - **Smoke flavor**: Usually plant-based (halal)

8. **Regional & Madhab Considerations:**
   - **Alcohol as solvent**: Hanafi scholars more lenient if not intoxicating amount; Shafi'i/Maliki stricter
   - **Seafood**: All schools agree fish is halal; shellfish (shrimp, crab) is debated (Hanafi: only fish with scales; others: all seafood)
   - **Stunning before slaughter**: Debated; some scholars allow if animal still alive before zabihah
   - **Cross-contamination**: Stricter scholars avoid; lenient view allows if ingredient itself is halal

**ANALYSIS FRAMEWORK:**

For each ingredient:
1. Identify if explicitly haram, questionable, or halal
2. For questionable: explain why (animal/plant ambiguity, alcohol content, etc.)
3. Assign confidence score based on certainty:
   - 90-100: Certified halal OR clearly plant/mineral with no ambiguity
   - 70-89: Likely halal but minor ambiguity (e.g., "natural flavors" in predominantly plant product)
   - 40-69: Questionable ingredients present (e.g., E471, enzymes, glycerin without source)
   - 20-39: Multiple questionable ingredients OR likely haram source
   - 0-19: Clearly haram ingredients (pork, alcohol for intoxication, blood)

**OUTPUT FORMAT (JSON only):**
{
  "verdict": "halal" | "not_halal" | "questionable",
  "confidence_score": 0-100,
  "flagged_ingredients": ["ingredient1", "ingredient2"],
  "analysis_notes": "Detailed 2-4 sentence explanation of verdict with Islamic basis",
  "recommendations": "Specific certification to look for, alternative products, or verification steps"
}

**Regional context for this analysis**: ${region || 'global'}

Be thorough, reference Islamic sources where relevant, and prioritize consumer safety in faith practice.`;

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
        analysis_method: 'ai_analysis',
        is_certified: false,
        verification_links: [
          `https://verifyhalal.com/product-result.html?keyword=${productName || brand}`,
          'https://world.openfoodfacts.org/product/' + (brand || '').toLowerCase().replace(/\s+/g, '-')
        ]
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
