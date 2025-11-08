import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";

interface Report {
  id: string;
  product_id: string;
  comment: string | null;
  photo_url: string | null;
  status: string;
  created_at: string;
  products: {
    name: string;
    brand: string | null;
  };
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Please login to access admin dashboard");
      navigate("/login");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      toast.error("Access denied. Admin privileges required.");
      navigate("/");
      return;
    }

    setIsAdmin(true);
    fetchReports();
  };

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select(`
          *,
          products (
            name,
            brand
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("reports")
        .update({ status: newStatus })
        .eq("id", reportId);

      if (error) throw error;

      toast.success("Report status updated");
      fetchReports();
    } catch (error) {
      console.error("Error updating report:", error);
      toast.error("Failed to update report status");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <p className="text-center text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const pendingReports = reports.filter((r) => r.status === "pending");
  const reviewedReports = reports.filter((r) => r.status === "reviewed");
  const resolvedReports = reports.filter((r) => r.status === "resolved");

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage product reports and verifications</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold text-foreground">{pendingReports.length}</p>
                </div>
                <HelpCircle className="h-8 w-8 text-unclear" />
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reviewed</p>
                  <p className="text-3xl font-bold text-foreground">{reviewedReports.length}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                  <p className="text-3xl font-bold text-foreground">{resolvedReports.length}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-halal" />
              </div>
            </Card>
          </div>

          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">Pending ({pendingReports.length})</TabsTrigger>
              <TabsTrigger value="reviewed">Reviewed ({reviewedReports.length})</TabsTrigger>
              <TabsTrigger value="resolved">Resolved ({resolvedReports.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingReports.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No pending reports</p>
                </Card>
              ) : (
                pendingReports.map((report) => (
                  <Card key={report.id} className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">
                            {report.products.name}
                          </h3>
                          {report.products.brand && (
                            <p className="text-sm text-muted-foreground">{report.products.brand}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(report.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-unclear-bg text-unclear">
                          {report.status}
                        </Badge>
                      </div>

                      {report.comment && (
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-sm text-foreground">{report.comment}</p>
                        </div>
                      )}

                      {report.photo_url && (
                        <div>
                          <img
                            src={report.photo_url}
                            alt="Report photo"
                            className="max-w-xs rounded-lg border border-border"
                          />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/results/${report.product_id}`)}
                        >
                          View Product
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateReportStatus(report.id, "reviewed")}
                        >
                          Mark as Reviewed
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-halal-bg text-halal hover:bg-halal-bg/80"
                          onClick={() => updateReportStatus(report.id, "resolved")}
                        >
                          Mark as Resolved
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="reviewed" className="space-y-4">
              {reviewedReports.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No reviewed reports</p>
                </Card>
              ) : (
                reviewedReports.map((report) => (
                  <Card key={report.id} className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">
                            {report.products.name}
                          </h3>
                          {report.products.brand && (
                            <p className="text-sm text-muted-foreground">{report.products.brand}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(report.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-primary/10 text-primary">
                          {report.status}
                        </Badge>
                      </div>

                      {report.comment && (
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-sm text-foreground">{report.comment}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/results/${report.product_id}`)}
                        >
                          View Product
                        </Button>
                        <Button
                          size="sm"
                          className="bg-halal hover:bg-halal/90"
                          onClick={() => updateReportStatus(report.id, "resolved")}
                        >
                          Mark as Resolved
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="resolved" className="space-y-4">
              {resolvedReports.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No resolved reports</p>
                </Card>
              ) : (
                resolvedReports.map((report) => (
                  <Card key={report.id} className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">
                            {report.products.name}
                          </h3>
                          {report.products.brand && (
                            <p className="text-sm text-muted-foreground">{report.products.brand}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(report.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-halal-bg text-halal">
                          {report.status}
                        </Badge>
                      </div>

                      {report.comment && (
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-sm text-foreground">{report.comment}</p>
                        </div>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/results/${report.product_id}`)}
                      >
                        View Product
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
