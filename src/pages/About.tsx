import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { ShieldCheck, AlertTriangle, Users, BookOpen } from "lucide-react";

export default function About() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">About HalalCheck</h1>
            <p className="text-lg text-muted-foreground">
              Making halal verification accessible to everyone
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
                    HalalCheck provides an automated ingredient analysis tool to help Muslim consumers
                    make informed decisions about food products. Our rules engine checks ingredients
                    against known halal standards to provide quick, preliminary assessments.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-halal-bg rounded-full flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-6 w-6 text-halal" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2 text-foreground">How It Works</h2>
                  <p className="text-muted-foreground">
                    Our system analyzes product ingredients using a comprehensive database of halal and
                    haram substances. We cross-reference ingredients with Islamic dietary guidelines and
                    provide a confidence score based on available information. Products with official
                    halal certifications receive higher confidence scores.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-unclear-bg rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="h-6 w-6 text-unclear" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2 text-foreground">Community Driven</h2>
                  <p className="text-muted-foreground">
                    Help us improve! Users can report incorrect information, questionable ingredients,
                    or missing certifications. Our admin team reviews all reports to keep our database
                    accurate and up-to-date. Together, we build a more reliable halal verification
                    system.
                  </p>
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
                    <strong className="text-foreground">This is NOT an official certification service.</strong> HalalCheck
                    provides automated ingredient analysis for informational purposes only. Our verdicts
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
            <h2 className="text-xl font-semibold mb-4 text-foreground">Contact & Support</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>Have questions or suggestions? We'd love to hear from you:</p>
              <ul className="space-y-1">
                <li>• Report issues through the app's report feature</li>
                <li>• Request human review for uncertain products</li>
                <li>• Contribute to our community-driven database</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
