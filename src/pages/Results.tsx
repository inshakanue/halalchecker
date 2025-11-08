import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, AlertTriangle, CheckCircle2, HelpCircle, Flag } from "lucide-react";

interface Product {
  id: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  ingredients: string[];
  image_url: string | null;
  certifications: string[] | null;
  region: string;
}

interface Verdict {
  verdict: "halal" | "not_halal" | "unclear";
  confidence: number;
  reason: string;
  flagged_ingredients: string[] | null;
}

export default function Results() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductAndVerdict();
  }, [productId]);

  const fetchProductAndVerdict = async () => {
    if (!productId) return;

    try {
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (productError || !productData) {
        toast.error("Product not found");
        navigate("/");
        return;
      }

      setProduct(productData);

      // Check if verdict exists
      const { data: existingVerdict } = await supabase
        .from("verdicts")
        .select("*")
        .eq("product_id", productId)
        .maybeSingle();

      if (existingVerdict) {
        setVerdict(existingVerdict);
      } else {
        // Generate verdict using rules engine
        const newVerdict = analyzeProduct(productData);
        setVerdict(newVerdict);

        // Save verdict to database
        const { error: verdictError } = await supabase
          .from("verdicts")
          .insert({
            product_id: productId,
            ...newVerdict,
          });

        if (verdictError) {
          console.error("Failed to save verdict:", verdictError);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  const analyzeProduct = (product: Product): Verdict => {
    const haram_ingredients = [
      "gelatin",
      "pork",
      "lard",
      "bacon",
      "ham",
      "alcohol",
      "ethyl alcohol",
      "wine",
      "beer",
      "rum",
      "vodka",
      "whiskey",
      "glycerin",
      "rennet",
    ];

    const questionable_ingredients = [
      "enzymes",
      "emulsifiers",
      "mono-diglycerides",
      "natural flavors",
      "artificial flavors",
    ];

    const ingredients_lower = product.ingredients.map((i) => i.toLowerCase());
    const flagged: string[] = [];
    let verdict: "halal" | "not_halal" | "unclear" = "halal";
    let confidence = 90;
    let reason = "";

    // Check for haram ingredients
    for (const haram of haram_ingredients) {
      if (ingredients_lower.some((ing) => ing.includes(haram))) {
        flagged.push(haram);
        verdict = "not_halal";
        confidence = 95;
        reason = `Contains haram ingredient(s): ${flagged.join(", ")}. These ingredients are not permissible in Islamic dietary laws.`;
        return { verdict, confidence, reason, flagged_ingredients: flagged };
      }
    }

    // Check for questionable ingredients
    for (const questionable of questionable_ingredients) {
      if (ingredients_lower.some((ing) => ing.includes(questionable))) {
        flagged.push(questionable);
        verdict = "unclear";
        confidence = 50;
      }
    }

    if (verdict === "unclear") {
      reason = `Contains questionable ingredient(s): ${flagged.join(", ")}. These ingredients may be derived from non-halal sources. Verification recommended.`;
    } else {
      // Check for halal certification
      if (product.certifications?.some((cert) => cert.toLowerCase().includes("halal"))) {
        confidence = 98;
        reason = "Product has halal certification and contains no known haram ingredients.";
      } else {
        confidence = 85;
        reason = "No haram ingredients detected, but product lacks official halal certification.";
      }
    }

    return { verdict, confidence, reason, flagged_ingredients: flagged.length > 0 ? flagged : null };
  };

  const getVerdictStyles = (verdict: string) => {
    switch (verdict) {
      case "halal":
        return {
          bg: "bg-halal-bg",
          border: "border-halal",
          text: "text-halal",
          icon: CheckCircle2,
          label: "Halal",
        };
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

  const styles = getVerdictStyles(verdict.verdict);
  const VerdictIcon = styles.icon;

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
                <div className="flex items-center gap-3 justify-center md:justify-start">
                  <span className="text-2xl font-semibold text-foreground">{verdict.confidence}%</span>
                  <span className="text-sm text-muted-foreground">Confidence</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Product Details */}
          <Card className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                {product.image_url ? (
                  <img
                    src={product.image_url}
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

                {product.barcode && (
                  <div>
                    <p className="text-sm font-medium text-foreground">Barcode</p>
                    <p className="text-muted-foreground">{product.barcode}</p>
                  </div>
                )}

                {product.certifications && product.certifications.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Certifications</p>
                    <div className="flex flex-wrap gap-2">
                      {product.certifications.map((cert, index) => (
                        <Badge key={index} variant="outline" className="bg-primary/5">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Reason */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-3 text-foreground">Why this verdict?</h3>
            <p className="text-muted-foreground leading-relaxed">{verdict.reason}</p>
          </Card>

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
              <Link to={`/report/${product.id}`} className="flex-1">
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
        </div>
      </div>
    </Layout>
  );
}
