import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Search, ScanBarcode } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Home() {
  const navigate = useNavigate();
  const [barcode, setBarcode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [region, setRegion] = useState("global");
  const [isScanning, setIsScanning] = useState(false);

  const handleBarcodeSearch = async () => {
    if (!barcode.trim()) {
      toast.error("Please enter a barcode");
      return;
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("barcode", barcode.trim())
      .maybeSingle();

    if (error) {
      toast.error("Failed to search product");
      return;
    }

    if (data) {
      navigate(`/results/${data.id}`);
    } else {
      toast.error("Product not found. Try searching by name or add it to our database.");
    }
  };

  const handleProductSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a product name");
      return;
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .ilike("name", `%${searchQuery.trim()}%`)
      .eq("region", region)
      .limit(1)
      .maybeSingle();

    if (error) {
      toast.error("Failed to search product");
      return;
    }

    if (data) {
      navigate(`/results/${data.id}`);
    } else {
      toast.error("Product not found. Try a different search term.");
    }
  };

  const handleScanBarcode = () => {
    setIsScanning(true);
    toast.info("Camera scanning feature coming soon! For now, please enter barcode manually.");
    setTimeout(() => setIsScanning(false), 2000);
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
                Scan barcodes or search products to check ingredients against halal standards
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
                  </SelectContent>
                </Select>
              </div>

              {/* Barcode Scan */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Scan Barcode</label>
                <Button 
                  onClick={handleScanBarcode}
                  disabled={isScanning}
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
                  />
                  <Button onClick={handleBarcodeSearch} size="lg">
                    <ScanBarcode className="h-5 w-5" />
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
                  />
                  <Button onClick={handleProductSearch} size="lg">
                    <Search className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Feature Cards */}
          <div className="max-w-5xl mx-auto mt-16 grid md:grid-cols-3 gap-6">
            <Card className="p-6 text-center space-y-3 border-primary/20 hover:border-primary/40 transition-colors">
              <div className="w-12 h-12 bg-halal-bg rounded-full flex items-center justify-center mx-auto">
                <ScanBarcode className="h-6 w-6 text-halal" />
              </div>
              <h3 className="font-semibold text-lg">Fast Scanning</h3>
              <p className="text-sm text-muted-foreground">Instant barcode recognition and product lookup</p>
            </Card>
            
            <Card className="p-6 text-center space-y-3 border-primary/20 hover:border-primary/40 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Smart Analysis</h3>
              <p className="text-sm text-muted-foreground">AI-powered ingredient checking against halal standards</p>
            </Card>
            
            <Card className="p-6 text-center space-y-3 border-primary/20 hover:border-primary/40 transition-colors">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
                <Camera className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="font-semibold text-lg">User Reports</h3>
              <p className="text-sm text-muted-foreground">Community-driven verification and updates</p>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
