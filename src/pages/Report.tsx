import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Upload } from "lucide-react";

export default function Report() {
  const { barcode } = useParams();
  const navigate = useNavigate();
  const [comment, setComment] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (!user) {
        toast.error("Please login to submit a report");
        navigate("/login");
      }
    });
  }, [navigate]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to submit a report");
      navigate("/login");
      return;
    }

    setUploading(true);

    try {
      let photoUrl = null;

      // Upload photo if provided
      if (photo) {
        const fileExt = photo.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("report-photos")
          .upload(fileName, photo);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("report-photos")
          .getPublicUrl(fileName);

        photoUrl = publicUrl;
      }

      // Insert report
      const { error: insertError } = await supabase
        .from("reports")
        .insert({
          barcode: barcode,
          user_id: user.id,
          comment: comment || null,
          photo_url: photoUrl,
          status: "pending",
        });

      if (insertError) {
        throw insertError;
      }

      toast.success("Report submitted successfully! Thank you for your contribution.");
      navigate(`/results/${barcode}`);
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Button variant="ghost" onClick={() => navigate(`/results/${barcode}`)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Results
          </Button>

          <Card className="p-6 md:p-8">
            <h1 className="text-2xl font-bold mb-2 text-foreground">Report an Issue</h1>
            <p className="text-muted-foreground mb-6">
              Help us improve our database by reporting incorrect information or questionable ingredients.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="photo" className="text-sm font-medium text-foreground">
                  Upload Photo (Optional)
                </label>
                <div className="flex items-center gap-4">
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="flex-1"
                  />
                  {photo && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Upload className="h-4 w-4 mr-1" />
                      {photo.name}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload a photo of the product label or ingredients list to help verify the information.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="comment" className="text-sm font-medium text-foreground">
                  Comment (Optional)
                </label>
                <Textarea
                  id="comment"
                  placeholder="Describe the issue or provide additional information..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
              </div>

              <div className="bg-muted/50 p-4 rounded-lg border border-border">
                <h3 className="font-medium text-sm mb-2 text-foreground">What happens next?</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Your report will be reviewed by our team</li>
                  <li>• We may reach out if we need more information</li>
                  <li>• Product information will be updated if necessary</li>
                  <li>• You'll be notified once your report is processed</li>
                </ul>
              </div>

              <Button type="submit" disabled={uploading} className="w-full">
                {uploading ? "Submitting..." : "Submit Report"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
