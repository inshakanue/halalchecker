import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, barcode, brand, labels } = await req.json();
    console.log('Checking certifications for:', { productName, barcode, brand });

    const certificationData: any = {
      is_certified: false,
      cert_body: null,
      cert_country: null,
      cert_link: null,
      confidence_score: 0
    };

    // Check 1: Open Food Facts labels for halal certification markers
    if (labels && Array.isArray(labels)) {
      const halalLabels = labels.filter((label: string) => 
        label.toLowerCase().includes('halal') || 
        label.toLowerCase().includes('halaal')
      );

      if (halalLabels.length > 0) {
        console.log('Found halal labels in Open Food Facts:', halalLabels);
        certificationData.is_certified = true;
        certificationData.cert_body = halalLabels[0];
        certificationData.confidence_score = 85;
        certificationData.external_source = 'open_food_facts_labels';
      }
    }

    // Check 2: Query VerifyHalal database via web scraping
    if (!certificationData.is_certified && productName) {
      try {
        const searchUrl = `https://verifyhalal.com/product-result.html?keyword=${encodeURIComponent(productName)}`;
        console.log('Searching VerifyHalal:', searchUrl);
        
        const response = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (response.ok) {
          const html = await response.text();
          
          // Look for halal certification indicators in the HTML
          const hasHalalCert = html.includes('halal-certified') || 
                              html.includes('certified halal') ||
                              html.includes('certification-badge');

          // Extract certification body if found
          const certBodyMatch = html.match(/certification(?:-|\s+)body["\s:]+([^"<>\n]+)/i);
          const countryMatch = html.match(/certified(?:-|\s+)in["\s:]+([^"<>\n]+)/i);

          if (hasHalalCert || certBodyMatch) {
            console.log('Found certification on VerifyHalal');
            certificationData.is_certified = true;
            certificationData.cert_body = certBodyMatch?.[1]?.trim() || 'VerifyHalal Listed';
            certificationData.cert_country = countryMatch?.[1]?.trim() || null;
            certificationData.cert_link = searchUrl;
            certificationData.confidence_score = 90;
            certificationData.external_source = 'verifyhalal';
          }
        }
      } catch (error) {
        console.error('Error checking VerifyHalal:', error);
      }
    }

    // Check 3: Common halal certification databases patterns
    if (!certificationData.is_certified && barcode) {
      const certDatabases = [
        {
          name: 'JAKIM',
          country: 'Malaysia',
          url: `https://www.halal.gov.my/v4/index.php?data=bW9kdWxlcy9uZXdzOzs7Ow==&utama=panduan&ids=${barcode}`
        },
        {
          name: 'MUI',
          country: 'Indonesia',
          url: `https://www.halalmui.org/mui14/main/page/produk-halal-mui/${barcode}`
        },
        {
          name: 'HFA',
          country: 'United States',
          url: `https://halalfoodauthority.com/verify?barcode=${barcode}`
        },
        {
          name: 'IFANCA',
          country: 'International',
          url: `https://www.ifanca.org/halal-certification/verify/${barcode}`
        },
        {
          name: 'EIAC',
          country: 'United Arab Emirates',
          url: `https://www.eiac.gov.ae/en/halal-products/search?code=${barcode}`
        },
        {
          name: 'HMC',
          country: 'United Kingdom',
          url: `https://www.halalhmc.org/verify-product/${barcode}`
        },
        {
          name: 'SANHA',
          country: 'South Africa',
          url: `https://www.sanha.co.za/halaal-search/?product_code=${barcode}`
        },
        {
          name: 'HFCE',
          country: 'Canada',
          url: `https://halalfoodcouncil.ca/verify/${barcode}`
        }
      ];

      for (const db of certDatabases) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          const response = await fetch(db.url, {
            method: 'HEAD',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'text/html,application/json'
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok && response.status === 200) {
            console.log(`Found potential certification in ${db.name} (${db.country})`);
            certificationData.is_certified = true;
            certificationData.cert_body = db.name;
            certificationData.cert_country = db.country;
            certificationData.cert_link = db.url;
            certificationData.confidence_score = 95;
            certificationData.external_source = db.name.toLowerCase();
            break;
          }
        } catch (error) {
          console.log(`Could not check ${db.name}:`, error instanceof Error ? error.message : 'Unknown error');
        }
      }
    }

    console.log('Certification check result:', certificationData);

    return new Response(
      JSON.stringify(certificationData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in check-halal-certifications:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        is_certified: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});