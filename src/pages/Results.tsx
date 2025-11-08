import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, AlertTriangle, CheckCircle2, HelpCircle, Flag, ExternalLink, Sparkles, Activity } from "lucide-react";

interface Product {
  barcode: string;
  name: string;
  brand: string;
  ingredients: string[];
  imageUrl: string | null;
  region: string;
}

interface Verdict {
  verdict: "halal" | "not_halal" | "unclear";
  confidence_score: number;
  analysis_notes: string;
  flagged_ingredients: string[] | null;
  is_certified: boolean | null;
  cert_body: string | null;
  cert_country: string | null;
  cert_link: string | null;
  analysis_method?: string;
  external_source?: string;
  ai_explanation?: string;
}

export default function Results() {
  const { barcode } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductAndVerdict();
  }, [barcode]);

  const fetchProductAndVerdict = async () => {
    if (!barcode) return;

    try {
      // Step 1: Fetch product from Open Food Facts
      const { data: productData, error: fetchError } = await supabase.functions.invoke(
        'fetch-product-data',
        { body: { barcode } }
      );

      if (fetchError || !productData.found) {
        toast.error("Product not found");
        navigate("/");
        return;
      }

      setProduct({
        barcode: productData.barcode,
        name: productData.name,
        brand: productData.brand,
        ingredients: productData.ingredientsList.length > 0 
          ? productData.ingredientsList 
          : [productData.ingredients],
        imageUrl: productData.imageUrl,
        region: productData.region
      });

      // Step 2: Check if verdict exists
      const { data: existingVerdict } = await supabase
        .from("verdicts")
        .select("*")
        .eq("barcode", barcode)
        .maybeSingle();

      if (existingVerdict) {
        setVerdict(existingVerdict as Verdict);
      } else {
        // Check if ingredients are available
        const hasIngredients = (productData.ingredientsList && productData.ingredientsList.length > 0) || 
                               (productData.ingredients && productData.ingredients.trim().length > 0);

        if (!hasIngredients) {
          // No ingredients available - create unclear verdict
          const newVerdict = {
            verdict: 'unclear',
            confidence_score: 0,
            analysis_notes: 'Ingredients data not available in the Open Food Facts database. Please check the product packaging or contact the manufacturer for ingredient information.',
            flagged_ingredients: null,
            is_certified: false,
            cert_body: null,
            cert_country: null,
            cert_link: null,
            analysis_method: 'insufficient_data',
            external_source: 'open_food_facts',
            ai_explanation: null
          };

          setVerdict(newVerdict as Verdict);

          // Save verdict to database
          await supabase.from("verdicts").insert({
            barcode,
            ...newVerdict
          });

          toast.warning("Ingredients not available for this product");
        } else {
          // Ingredients available - proceed with analysis
          toast.info("Analyzing ingredients...");
          
          const { data: aiAnalysis, error: aiError } = await supabase.functions.invoke(
            'analyze-ingredients-ai',
            { 
              body: { 
                productName: productData.name,
                ingredients: productData.ingredientsList.length > 0 
                  ? productData.ingredientsList 
                  : productData.ingredients,
                brand: productData.brand,
                region: productData.region,
                labels: productData.labels
              } 
            }
          );

          if (aiError) {
            console.error('AI analysis error:', aiError);
          }

          const newVerdict = {
            verdict: aiAnalysis?.verdict || 'unclear',
            confidence_score: aiAnalysis?.confidence_score || 50,
            analysis_notes: aiAnalysis?.analysis_notes || 'Automated analysis',
            flagged_ingredients: aiAnalysis?.flagged_ingredients || null,
            is_certified: false,
            cert_body: null,
            cert_country: null,
            cert_link: null,
            analysis_method: aiAnalysis ? 'ai_analysis' : 'rules_engine',
            external_source: 'open_food_facts',
            ai_explanation: aiAnalysis?.ai_explanation || null
          };

          setVerdict(newVerdict as Verdict);

          // Save verdict to database
          await supabase.from("verdicts").insert({
            barcode,
            ...newVerdict
          });
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load product details");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const getVerdictStyles = (verdict: string, isCertified: boolean) => {
    if (verdict === "halal") {
      if (isCertified) {
        return {
          bg: "bg-halal-bg",
          border: "border-halal",
          text: "text-halal",
          icon: CheckCircle2,
          label: "Halal (Certified)",
        };
      } else {
        return {
          bg: "bg-halal-bg",
          border: "border-halal",
          text: "text-halal",
          icon: CheckCircle2,
          label: "Halal (Automated)",
        };
      }
    }
    
    switch (verdict) {
      case "not_halal":
        return {
          bg: "bg-not-halal-bg",
          border: "border-not-halal",
          text: "text-not-halal",
          icon: AlertTriangle,
          label: "Not Halal",
        };
      case "unclear":
        return {
          bg: "bg-unclear-bg",
          border: "border-unclear",
          text: "text-unclear",
          icon: HelpCircle,
          label: "Unclear",
        };
      default:
        return {
          bg: "bg-muted",
          border: "border-border",
          text: "text-muted-foreground",
          icon: HelpCircle,
          label: "Unknown",
        };
    }
  };

  const getAnalysisMethodBadge = (method?: string) => {
    switch (method) {
      case 'certification_verified':
        return (
          <Badge className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Certified
          </Badge>
        );
      case 'ai_analysis':
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Analysis
          </Badge>
        );
      case 'manual':
        return (
          <Badge className="bg-secondary/10 text-secondary border-secondary/20">
            Manual Review
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Activity className="h-3 w-3 mr-1" />
            Rules Engine
          </Badge>
        );
    }
  };

  // Pretty render for JSON-like AI explanations
  const formatKey = (key: string) =>
    key
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const renderJSON = (data: any, depth = 0): JSX.Element => {
    if (data === null || data === undefined) {
      return <span className="text-muted-foreground">N/A</span>;
    }

    // Primitive values
    if (typeof data !== "object") {
      return <span className="text-foreground">{String(data)}</span>;
    }

    // Arrays
    if (Array.isArray(data)) {
      if (data.length === 0) return <span className="text-muted-foreground">None</span>;
      return (
        <ul className="list-disc ml-5 space-y-1">
          {data.map((item, idx) => (
            <li key={idx} className="text-sm">
              <div className="mt-1">{renderJSON(item, depth + 1)}</div>
            </li>
          ))}
        </ul>
      );
    }

    // Objects
    const entries = Object.entries(data);
    if (entries.length === 0) return <span className="text-muted-foreground">Empty</span>;

    return (
      <div className={depth > 0 ? "bg-background/50 p-3 rounded-lg border border-border/50" : "space-y-3"}>
        {entries.map(([key, value]) => (
          <div key={key} className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{formatKey(key)}</p>
            <div>{renderJSON(value, depth + 1)}</div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-lg text-muted-foreground">Loading product details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product || !verdict) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-lg text-muted-foreground">Product not found</p>
          </div>
        </div>
      </Layout>
    );
  }

  const styles = getVerdictStyles(verdict.verdict, verdict.is_certified || false);
  const VerdictIcon = styles.icon;

  // Format verdict message based on type
  const getVerdictMessage = () => {
    if (verdict.verdict === "halal" && verdict.is_certified) {
      return `Product is certified halal by ${verdict.cert_body || "a recognized certification body"} for ${verdict.cert_country || "the region"}.`;
    }
    return verdict.analysis_notes;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>

          {/* Verdict Badge */}
          <Card className={`p-8 ${styles.bg} border-2 ${styles.border}`}>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <div className={`w-24 h-24 rounded-full ${styles.bg} border-4 ${styles.border} flex items-center justify-center`}>
                  <VerdictIcon className={`h-12 w-12 ${styles.text}`} />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left space-y-2">
                <h2 className={`text-3xl font-bold ${styles.text}`}>{styles.label}</h2>
                {verdict.is_certified && (
                  <div className="flex items-center gap-2 text-sm bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-full w-fit mx-auto md:mx-0">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">Officially Certified Halal</span>
                  </div>
                )}
                <div className="flex items-center gap-3 justify-center md:justify-start flex-wrap">
                  <span className="text-2xl font-semibold text-foreground">{verdict.confidence_score}%</span>
                  <span className="text-sm text-muted-foreground">Confidence</span>
                  {getAnalysisMethodBadge(verdict.analysis_method)}
                  <Badge variant="outline" className="bg-background">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open Food Facts
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Product Details */}
          <Card className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full rounded-lg border border-border"
                  />
                ) : (
                  <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-muted-foreground">No image</span>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
                  {product.brand && (
                    <p className="text-lg text-muted-foreground">{product.brand}</p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground">Barcode</p>
                  <p className="text-muted-foreground">{product.barcode}</p>
                  <a 
                    href={`https://world.openfoodfacts.org/product/${product.barcode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1"
                  >
                    View on Open Food Facts
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                {verdict.is_certified && verdict.cert_link && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Certification</p>
                    <a 
                      href={verdict.cert_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      View Certificate
                    </a>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Reason */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-3 text-foreground">Why this verdict?</h3>
            <p className="text-muted-foreground leading-relaxed">{getVerdictMessage()}</p>
          </Card>

          {/* AI Explanation */}
          {verdict.ai_explanation && verdict.analysis_method === 'ai_analysis' && (
            <Card className="p-6 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div className="space-y-4 flex-1">
                  <h3 className="font-semibold text-lg text-foreground">AI Detailed Analysis</h3>
                  {(() => {
                    try {
                      const parsed = typeof verdict.ai_explanation === 'string'
                        ? JSON.parse(verdict.ai_explanation)
                        : verdict.ai_explanation;
                      return renderJSON(parsed);
                    } catch {
                      // If JSON parsing fails, display as formatted text
                      return (
                        <div className="text-sm text-muted-foreground leading-relaxed">
                          {String(verdict.ai_explanation)
                            .split('\n')
                            .map((line, idx) => {
                              if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
                                return (
                                  <div key={idx} className="flex gap-2 ml-4 my-1">
                                    <span className="text-primary">•</span>
                                    <span>{line.replace(/^[-•]\s*/, '')}</span>
                                  </div>
                                );
                              }
                              return line.trim() ? (
                                <p key={idx} className="mb-2">{line}</p>
                              ) : (
                                <div key={idx} className="h-2" />
                              );
                            })}
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            </Card>
          )}

          {/* Ingredients */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-3 text-foreground">Ingredients</h3>
            <div className="space-y-2">
              {product.ingredients.map((ingredient, index) => {
                const isFlagged = verdict.flagged_ingredients?.some((flagged) =>
                  ingredient.toLowerCase().includes(flagged.toLowerCase())
                );
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      isFlagged
                        ? "bg-destructive/10 border-destructive/30"
                        : "bg-card border-border"
                    }`}
                  >
                    <span className={isFlagged ? "text-destructive font-medium" : "text-foreground"}>
                      {ingredient}
                      {isFlagged && " ⚠️"}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Actions */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to={`/report/${product.barcode}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  <Flag className="mr-2 h-4 w-4" />
                  Report Issue
                </Button>
              </Link>
              <Button className="flex-1 bg-primary hover:bg-primary-dark">
                Request Human Review
              </Button>
            </div>
          </Card>

          {/* External Verification Section */}
          <Card className="p-6 bg-primary/5 border-primary/20">
            <h3 className="font-semibold text-lg mb-3 text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              External Verification Resources
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Cross-check this product's halal status through official certification databases:
            </p>
            <div className="space-y-3">
              <a
                href={`https://verifyhalal.com/product-result.html?keyword=${encodeURIComponent(product.name || product.barcode)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-lg bg-background hover:bg-muted transition-colors border border-border"
              >
                <ExternalLink className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">VerifyHalal Database</p>
                  <p className="text-sm text-muted-foreground">Search 1.7M+ products across 85 certification bodies</p>
                </div>
              </a>
              <a
                href={`https://world.openfoodfacts.org/product/${product.barcode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-lg bg-background hover:bg-muted transition-colors border border-border"
              >
                <ExternalLink className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Open Food Facts</p>
                  <p className="text-sm text-muted-foreground">View complete product details and certifications</p>
                </div>
              </a>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
