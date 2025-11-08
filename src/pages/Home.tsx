import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Search, ScanBarcode, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Html5Qrcode } from "html5-qrcode";

export default function Home() {
  const navigate = useNavigate();
  const [barcode, setBarcode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [region, setRegion] = useState("global");
  const [isScanning, setIsScanning] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [scannerDialog, setScannerDialog] = useState(false);

  const handleBarcodeSearch = async (barcodeValue?: string) => {
    const searchBarcode = barcodeValue || barcode.trim();
    
    if (!searchBarcode) {
      toast.error("Please enter a barcode");
      return;
    }

    setIsFetching(true);

    try {
      // Step 1: Fetch from Open Food Facts
      toast.info("Searching global product database...");
      const { data: externalProduct, error: fetchError } = await supabase.functions.invoke(
        'fetch-product-data',
        { body: { barcode: searchBarcode } }
      );

      if (fetchError) {
        throw fetchError;
      }

      if (!externalProduct.found) {
        toast.error("Product not found. Try a different barcode.");
        setIsFetching(false);
        return;
      }

      // Step 2: Check if we already have a verdict for this barcode
      const { data: existingVerdict } = await supabase
        .from("verdicts")
        .select("*")
        .eq("barcode", searchBarcode)
        .maybeSingle();

      if (!existingVerdict) {
        // Step 3: Analyze with Lovable AI
        toast.info("Analyzing ingredients with AI...");
        const { data: aiAnalysis, error: aiError } = await supabase.functions.invoke(
          'analyze-ingredients-ai',
          { 
            body: { 
              productName: externalProduct.name,
              ingredients: externalProduct.ingredientsList.length > 0 
                ? externalProduct.ingredientsList 
                : externalProduct.ingredients,
              brand: externalProduct.brand,
              region: externalProduct.region
            } 
          }
        );

        if (aiError) {
          console.error('AI analysis error:', aiError);
          toast.warning("Product found but AI analysis failed. Using basic analysis.");
        }

        // Step 4: Save verdict with AI analysis
        await supabase.from("verdicts").insert({
          barcode: searchBarcode,
          verdict: aiAnalysis?.verdict || 'questionable',
          confidence_score: aiAnalysis?.confidence_score || 50,
          analysis_notes: aiAnalysis?.analysis_notes || 'Automated analysis',
          flagged_ingredients: aiAnalysis?.flagged_ingredients || null,
          analysis_method: aiAnalysis ? 'ai_analysis' : 'rules_engine',
          external_source: 'open_food_facts',
          ai_explanation: aiAnalysis?.ai_explanation || null
        });

        // Step 5: Save to cache
        try {
          await supabase.from("product_cache").insert({
            barcode: externalProduct.barcode,
            external_data: externalProduct.rawData,
            source: 'open_food_facts'
          });
        } catch (cacheError) {
          // Ignore cache errors (non-critical)
          console.log('Cache insert failed (non-critical)', cacheError);
        }

        toast.success("Product analyzed!");
      }

      navigate(`/results/${searchBarcode}`);

    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search product. Please try again.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleProductSearch = async () => {
    toast.info("Product name search is not available. Please use barcode scanning instead.");
  };

  const startScanner = async () => {
    setIsScanning(true);
    setScannerDialog(true);

    try {
      const html5QrCode = new Html5Qrcode("reader");
      
      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          // Stop scanning
          await html5QrCode.stop();
          setScannerDialog(false);
          setIsScanning(false);
          
          // Search with scanned barcode
          toast.success("Barcode scanned!");
          setBarcode(decodedText);
          await handleBarcodeSearch(decodedText);
        },
        (errorMessage) => {
          // Ignore errors during scanning
        }
      );
    } catch (error) {
      console.error("Scanner error:", error);
      toast.error("Failed to start camera. Please check permissions.");
      setScannerDialog(false);
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode("reader");
      await html5QrCode.stop();
    } catch (error) {
      // Ignore stop errors
    }
    setScannerDialog(false);
    setIsScanning(false);
  };

  return (
    <Layout>
      <div className="relative overflow-hidden">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-primary via-primary-light to-primary-dark text-primary-foreground">
          <div 
            className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "var(--pattern-overlay)" }}
          />
          
          <div className="container mx-auto px-4 py-16 md:py-24 relative">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Verify Halal Products Instantly
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/90">
                Scan barcodes or search products to check ingredients with AI-powered analysis
              </p>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="container mx-auto px-4 -mt-8 relative z-10 pb-16">
          <Card className="max-w-2xl mx-auto p-6 md:p-8 shadow-2xl border-2">
            <div className="space-y-6">
              {/* Region Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Select Region</label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="EU">Europe</SelectItem>
                    <SelectItem value="UAE">UAE</SelectItem>
                    <SelectItem value="MY">Malaysia</SelectItem>
                    <SelectItem value="ID">Indonesia</SelectItem>
                    <SelectItem value="IN">India</SelectItem>
                    <SelectItem value="SEA">South East Asia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Barcode Scan */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Scan Barcode</label>
                <Button 
                  onClick={startScanner}
                  disabled={isScanning || isFetching}
                  className="w-full h-14 text-lg bg-primary hover:bg-primary-dark"
                  size="lg"
                >
                  <Camera className="mr-2 h-5 w-5" />
                  {isScanning ? "Opening Camera..." : "Scan with Camera"}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              {/* Manual Barcode Entry */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Enter Barcode Manually</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="e.g., 0123456789012"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleBarcodeSearch()}
                    className="flex-1"
                    disabled={isFetching}
                  />
                  <Button onClick={() => handleBarcodeSearch()} size="lg" disabled={isFetching}>
                    {isFetching ? <Loader2 className="h-5 w-5 animate-spin" /> : <ScanBarcode className="h-5 w-5" />}
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              {/* Product Search */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Search by Product Name</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="e.g., Chicken Nuggets"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleProductSearch()}
                    className="flex-1"
                    disabled={isFetching}
                  />
                  <Button onClick={handleProductSearch} size="lg" disabled={isFetching}>
                    <Search className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {isFetching && (
                <div className="text-center py-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground mt-2">Searching and analyzing product...</p>
                </div>
              )}
            </div>
          </Card>

          {/* Feature Cards */}
          <div className="max-w-5xl mx-auto mt-16 grid md:grid-cols-3 gap-6">
            <Card className="p-6 text-center space-y-3 border-primary/20 hover:border-primary/40 transition-colors">
              <div className="w-12 h-12 bg-halal-bg rounded-full flex items-center justify-center mx-auto">
                <ScanBarcode className="h-6 w-6 text-halal" />
              </div>
              <h3 className="font-semibold text-lg">Global Database</h3>
              <p className="text-sm text-muted-foreground">Access to 2M+ products from Open Food Facts</p>
            </Card>
            
            <Card className="p-6 text-center space-y-3 border-primary/20 hover:border-primary/40 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">AI-Powered Analysis</h3>
              <p className="text-sm text-muted-foreground">Advanced ingredient checking with Lovable AI</p>
            </Card>
            
            <Card className="p-6 text-center space-y-3 border-primary/20 hover:border-primary/40 transition-colors">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
                <Camera className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="font-semibold text-lg">Real Barcode Scanning</h3>
              <p className="text-sm text-muted-foreground">Instant camera-based barcode recognition</p>
            </Card>
          </div>
        </div>
      </div>

      {/* Scanner Dialog */}
      <Dialog open={scannerDialog} onOpenChange={(open) => !open && stopScanner()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Barcode</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div id="reader" className="w-full"></div>
            <p className="text-sm text-muted-foreground text-center">
              Point your camera at the product barcode
            </p>
            <Button variant="outline" onClick={stopScanner} className="w-full">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
