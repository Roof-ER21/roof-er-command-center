import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Image, Upload, Loader2, Camera, ArrowLeft, AlertTriangle, Download } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Link } from "react-router-dom";

interface DamageAnalysis {
  damageType: string;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  confidence: number;
  affectedArea: string;
  description: string;
  recommendations: string[];
  estimatedRepairCost?: {
    min: number;
    max: number;
  };
  urgency: 'low' | 'medium' | 'high' | 'critical';
  insuranceArguments?: string[];
}

const severityColors = {
  minor: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300',
  moderate: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300',
  severe: 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-300',
  critical: 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300',
};

const urgencyColors = {
  low: 'text-blue-600',
  medium: 'text-yellow-600',
  high: 'text-orange-600',
  critical: 'text-red-600',
};

export function ImageAnalysisPage() {
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DamageAnalysis | null>(null);

  // Download report modal state
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [reportData, setReportData] = useState({
    customerName: '',
    propertyAddress: '',
    inspectionDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file (PNG, JPG, WEBP)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedImage(file);
    setAnalysis(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      const response = await fetch('/api/field/images/analyze', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setAnalysis(data.data);
        toast({
          title: "Analysis Complete",
          description: "Roof damage has been analyzed successfully",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze image",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysis(null);
    setReportData({
      customerName: '',
      propertyAddress: '',
      inspectionDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const handleDownloadReport = async () => {
    if (!analysis) return;

    // Validate required fields
    if (!reportData.customerName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter the customer name",
        variant: "destructive",
      });
      return;
    }

    if (!reportData.propertyAddress.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter the property address",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    try {
      const response = await fetch('/api/field/reports/damage-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          customerName: reportData.customerName,
          propertyAddress: reportData.propertyAddress,
          inspectionDate: reportData.inspectionDate,
          analysisResult: analysis,
          notes: reportData.notes
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.statusText}`);
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `damage-report-${reportData.customerName.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Report Downloaded",
        description: "Damage assessment report has been downloaded successfully",
      });

      setShowDownloadModal(false);
    } catch (error) {
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download report",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/field">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Image Analysis</h1>
          </div>
          <p className="text-muted-foreground">AI-powered roof damage assessment from photos</p>
        </div>
        <Image className="h-8 w-8 text-sky-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Upload & Preview */}
        <div className="space-y-6">
          {/* Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Photo</CardTitle>
              <CardDescription>Take or upload a photo of roof damage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Area */}
              {!imagePreview ? (
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-sky-500 transition-colors">
                  <input
                    type="file"
                    id="image-upload"
                    className="hidden"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleImageSelect}
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm font-medium mb-1">
                      Click to upload or take a photo
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, or WEBP (max 10MB)
                    </p>
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Image Preview */}
                  <div className="relative rounded-lg overflow-hidden bg-muted">
                    <img
                      src={imagePreview}
                      alt="Roof damage preview"
                      className="w-full h-auto max-h-[400px] object-contain"
                    />
                  </div>

                  {/* Image Info */}
                  {selectedImage && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{selectedImage.name}</span>
                      <span>{(selectedImage.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  )}

                  {/* Change Image Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="w-full"
                  >
                    Change Image
                  </Button>
                </div>
              )}

              {/* Analyze Button */}
              <Button
                onClick={handleAnalyze}
                disabled={!selectedImage || isAnalyzing}
                className="w-full bg-sky-500 hover:bg-sky-600"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Damage...
                  </>
                ) : (
                  <>
                    <Image className="mr-2 h-4 w-4" />
                    Analyze Damage
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Photo Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2" />
                  <p>Take photos in good lighting conditions</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2" />
                  <p>Capture both close-up and wide-angle views</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2" />
                  <p>Include reference objects for scale</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2" />
                  <p>Focus on damaged areas clearly</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2" />
                  <p>Take multiple angles of the same damage</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Analysis Results */}
        <div className="space-y-6">
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle>Damage Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              {analysis ? (
                <div className="space-y-6">
                  {/* Damage Type & Severity */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">
                        Damage Type
                      </Label>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${severityColors[analysis.severity]}`}>
                        {analysis.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-lg font-semibold mb-1">{analysis.damageType}</p>
                    <p className="text-sm text-muted-foreground">{analysis.affectedArea}</p>
                  </div>

                  {/* Confidence & Urgency */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                        Confidence
                      </p>
                      <p className="text-2xl font-bold text-sky-600">
                        {Math.round(analysis.confidence * 100)}%
                      </p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                        Urgency
                      </p>
                      <p className={`text-2xl font-bold ${urgencyColors[analysis.urgency]}`}>
                        {analysis.urgency.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
                      Description
                    </Label>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {analysis.description}
                    </p>
                  </div>

                  {/* Estimated Repair Cost */}
                  {analysis.estimatedRepairCost && (
                    <div className="p-4 bg-sky-50 dark:bg-sky-950 rounded-lg border border-sky-200 dark:border-sky-800">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
                        Estimated Repair Cost
                      </Label>
                      <p className="text-2xl font-bold text-sky-600">
                        ${analysis.estimatedRepairCost.min.toLocaleString()} - ${analysis.estimatedRepairCost.max.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Actual costs may vary based on materials and labor
                      </p>
                    </div>
                  )}

                  {/* Recommendations */}
                  {analysis.recommendations.length > 0 && (
                    <div>
                      <Label className="text-xs font-semibold uppercase text-muted-foreground mb-3 block">
                        Recommended Actions
                      </Label>
                      <div className="space-y-2">
                        {analysis.recommendations.map((recommendation, index) => (
                          <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                            <AlertTriangle className="h-4 w-4 text-sky-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm">{recommendation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Insurance Arguments */}
                  {analysis.insuranceArguments && analysis.insuranceArguments.length > 0 && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground mb-3 block">
                        Insurance Claim Arguments
                      </Label>
                      <div className="space-y-2">
                        {analysis.insuranceArguments.map((argument, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{index + 1}.</span>
                            <p className="text-sm text-emerald-800 dark:text-emerald-200">{argument}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-4 border-t space-y-2">
                    <Button
                      onClick={() => setShowDownloadModal(true)}
                      className="w-full bg-sky-500 hover:bg-sky-600"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Report
                    </Button>
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      className="w-full"
                    >
                      Analyze Another Image
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Camera className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    No image analyzed yet
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Upload a photo of roof damage and click "Analyze Damage" to get AI-powered
                    assessment and recommendations
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Download Report Modal */}
      <Dialog open={showDownloadModal} onOpenChange={setShowDownloadModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Download Damage Assessment Report</DialogTitle>
            <DialogDescription>
              Enter customer and property details to generate a professional PDF report
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Customer Name */}
            <div className="space-y-2">
              <Label htmlFor="customerName">
                Customer Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customerName"
                placeholder="John Doe"
                value={reportData.customerName}
                onChange={(e) => setReportData({ ...reportData, customerName: e.target.value })}
                disabled={isDownloading}
              />
            </div>

            {/* Property Address */}
            <div className="space-y-2">
              <Label htmlFor="propertyAddress">
                Property Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="propertyAddress"
                placeholder="123 Main St, City, State ZIP"
                value={reportData.propertyAddress}
                onChange={(e) => setReportData({ ...reportData, propertyAddress: e.target.value })}
                disabled={isDownloading}
              />
            </div>

            {/* Inspection Date */}
            <div className="space-y-2">
              <Label htmlFor="inspectionDate">Inspection Date</Label>
              <Input
                id="inspectionDate"
                type="date"
                value={reportData.inspectionDate}
                onChange={(e) => setReportData({ ...reportData, inspectionDate: e.target.value })}
                disabled={isDownloading}
              />
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional observations or context..."
                value={reportData.notes}
                onChange={(e) => setReportData({ ...reportData, notes: e.target.value })}
                disabled={isDownloading}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDownloadModal(false)}
              disabled={isDownloading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDownloadReport}
              disabled={isDownloading}
              className="bg-sky-500 hover:bg-sky-600"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
