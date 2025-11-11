import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { ShieldCheck, AlertTriangle, Users, BookOpen, Sparkles, Database, Camera } from "lucide-react";

export default function About() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">About HalalChecker</h1>
            <p className="text-lg text-muted-foreground">
              Making halal verification accessible through AI-powered ingredient analysis and certification database verification
            </p>
          </div>

          <Card className="p-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2 text-foreground">Our Mission</h2>
                  <p className="text-muted-foreground">
                    HalalChecker empowers Muslim consumers to make informed dietary decisions with confidence.
                    We combine multiple verification methods—official certification databases and AI-powered ingredient 
                    analysis—to provide comprehensive halal status assessments for food products worldwide.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-halal-bg rounded-full flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-6 w-6 text-halal" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2 text-foreground">How It Works</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p className="font-medium text-foreground">Step 1: Find Your Product</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Scan barcode using your device camera</li>
                      <li>Enter barcode manually (13-digit EAN/UPC codes)</li>
                      <li>Search by product name with optional region/country filters</li>
                    </ul>

                    <p className="font-medium text-foreground mt-4">Step 2: Automatic Verification</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Product Data:</strong> Retrieved from Open Food Facts global database (1.7M+ products)</li>
                      <li><strong>Certification Check:</strong> Cross-referenced against official halal certification databases worldwide</li>
                      <li><strong>AI Analysis:</strong> Ingredients analyzed using advanced AI models trained on Islamic dietary guidelines</li>
                    </ul>

                    <p className="font-medium text-foreground mt-4">Step 3: Clear Results</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Verdict:</strong> Halal, Not Halal, or Unclear classification</li>
                      <li><strong>Confidence Score:</strong> Percentage indicating analysis reliability (0-100%)</li>
                      <li><strong>Flagged Ingredients:</strong> Specific ingredients that raise halal concerns</li>
                      <li><strong>AI Explanation:</strong> Detailed reasoning behind the verdict</li>
                      <li><strong>Certification Status:</strong> Official halal certification details when available</li>
                      <li><strong>Database Checks:</strong> Transparent view of which certification databases were checked and response times</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2 text-foreground">AI-Powered Analysis</h2>
                  <p className="text-muted-foreground">
                    Our AI system analyzes ingredient lists against Islamic dietary laws, identifying potentially 
                    problematic ingredients including animal-derived products, alcohol-based compounds, and cross-contamination 
                    risks. The AI provides detailed explanations for each verdict, helping you understand why a product 
                    received its classification. Analysis results include confidence scores and specific flagged ingredients.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-halal-bg rounded-full flex items-center justify-center flex-shrink-0">
                  <Database className="h-6 w-6 text-halal" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2 text-foreground">Certification Database Verification</h2>
                  <p className="text-muted-foreground">
                    Every product is automatically checked against multiple official halal certification databases worldwide. 
                    Products with recognized certifications are immediately marked as certified halal, bypassing the need for 
                    ingredient analysis. Our system provides full transparency by showing which databases were checked, 
                    whether certifications were found, and the response time for each database query.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-unclear-bg rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="h-6 w-6 text-unclear" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2 text-foreground">Data Sources</h2>
                  <p className="text-muted-foreground">
                    HalalChecker integrates with Open Food Facts, the world's largest open database of food products
                    with over 1.7 million products worldwide. Product information is verified against multiple official
                    halal certification databases to ensure accuracy. Our AI analysis is powered by advanced language models
                    trained to understand Islamic dietary guidelines and ingredient composition.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2 text-foreground">Key Features</h2>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                    <li><strong>Real-time Barcode Scanning:</strong> Use your device camera to scan product barcodes instantly</li>
                    <li><strong>Manual Entry:</strong> Enter 13-digit EAN/UPC barcodes directly when scanning isn't available</li>
                    <li><strong>Smart Search:</strong> Find products by name with optional region and country filtering</li>
                    <li><strong>AI Analysis:</strong> Advanced AI models trained on Islamic dietary guidelines analyze ingredients</li>
                    <li><strong>Certification Verification:</strong> Automatic cross-referencing with official halal certification databases</li>
                    <li><strong>Transparent Results:</strong> View which certification databases were checked and their response times</li>
                    <li><strong>Detailed Explanations:</strong> AI provides reasoning for each verdict with specific ingredient concerns</li>
                    <li><strong>Confidence Scores:</strong> 0-100% reliability ratings for every analysis</li>
                    <li><strong>Flagged Ingredients:</strong> Problematic ingredients highlighted for easy identification</li>
                    <li><strong>Open Food Facts Integration:</strong> Access to 1.7M+ products with direct source links</li>
                    <li><strong>Cached Results:</strong> Fast loading for previously analyzed products</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 border-destructive/30 bg-destructive/5">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Important Disclaimer</h2>
                
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">This is NOT an official certification service.</strong> HalalChecker
                    provides AI-powered ingredient analysis for informational purposes only. Our verdicts
                    should not be considered as formal halal certification.
                  </p>

                  <p>
                    <strong className="text-foreground">Limitations:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Ingredient sourcing methods may not be fully disclosed on labels</li>
                    <li>Manufacturing processes and cross-contamination cannot be verified</li>
                    <li>Ingredients may have multiple possible sources (halal or non-halal)</li>
                    <li>Database may not reflect recent product formulation changes</li>
                    <li>Regional variations in ingredients may not be captured</li>
                  </ul>

                  <p>
                    <strong className="text-foreground">Recommendations:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Consult with qualified Islamic scholars for definitive rulings</li>
                    <li>Look for official halal certification from recognized bodies</li>
                    <li>Contact manufacturers directly for detailed ingredient sourcing information</li>
                    <li>Use our tool as a preliminary screening aid, not as final authority</li>
                    <li>When in doubt, choose products with clear halal certification</li>
                  </ul>

                  <p>
                    <strong className="text-foreground">Recognized Certification Bodies:</strong>
                  </p>
                  <p>
                    We recommend products certified by reputable organizations such as:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Islamic Food and Nutrition Council of America (IFANCA)</li>
                    <li>Halal Food Council USA (HFC-USA)</li>
                    <li>Islamic Services of America (ISA)</li>
                    <li>Muslim Consumer Group (MCG)</li>
                    <li>Department of Islamic Development Malaysia (JAKIM)</li>
                    <li>UAE Standardization and Metrology Authority (ESMA)</li>
                  </ul>

                  <p className="pt-2">
                    By using HalalCheck, you acknowledge and accept these limitations. We continuously
                    work to improve our database and analysis, but cannot guarantee 100% accuracy.
                    Always verify with official sources when making important dietary decisions.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-primary/5 border-primary/20">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Technology Stack</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                HalalChecker is built with modern web technologies to provide a fast, reliable, and accessible experience:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Frontend:</strong> React with TypeScript for type-safe, component-based architecture</li>
                <li><strong>Backend:</strong> Lovable Cloud with Supabase for scalable database and serverless functions</li>
                <li><strong>AI Models:</strong> Integration with Google Gemini and OpenAI models via Lovable AI</li>
                <li><strong>Product Data:</strong> Open Food Facts API for global product information</li>
                <li><strong>Barcode Scanner:</strong> HTML5 QR Code library for device camera access</li>
                <li><strong>UI Components:</strong> Shadcn/UI with Tailwind CSS for beautiful, accessible interfaces</li>
              </ul>
              <p className="pt-2">
                Our serverless architecture ensures fast response times and can scale automatically to serve
                the global Muslim community without compromising on performance or reliability.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
