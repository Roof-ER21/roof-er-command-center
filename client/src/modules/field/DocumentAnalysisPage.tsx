import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText, Upload, Loader2, File, ArrowLeft, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Link } from "react-router-dom";

interface AnalysisResult {
  documentType: string;
  summary: string;
  extractedData: {
    policyNumber?: string;
    coverage?: string;
    deductible?: string;
    effectiveDate?: string;
    expirationDate?: string;
    claimNumber?: string;
    estimatedAmount?: string;
    [key: string]: string | undefined;
  };
  keyFindings: string[];
  confidence: number;
}

export function DocumentAnalysisPage() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type - now supports PDF, Word, and Excel
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF, Word (.doc, .docx), or Excel (.xls, .xlsx) file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setAnalysis(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('document', selectedFile);

      const response = await fetch('/api/field/documents/analyze', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setAnalysis(data.data);
        toast({
          title: "Analysis Complete",
          description: "Document has been analyzed successfully",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze document",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setAnalysis(null);
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
            <h1 className="text-3xl font-bold tracking-tight">Document Analysis</h1>
          </div>
          <p className="text-muted-foreground">Upload and analyze insurance documents, contracts, and estimates</p>
        </div>
        <FileText className="h-8 w-8 text-sky-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Upload & Controls */}
        <div className="space-y-6">
          {/* Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Document</CardTitle>
              <CardDescription>PDF, Word (.doc, .docx), or Excel (.xls, .xlsx) files up to 10MB</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-sky-500 transition-colors">
                <input
                  type="file"
                  id="document-upload"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileSelect}
                />
                <label htmlFor="document-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm font-medium mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, Word, or Excel (max 10MB)
                  </p>
                </label>
              </div>

              {/* Selected File Info */}
              {selectedFile && (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900 rounded flex items-center justify-center">
                    <File className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    Remove
                  </Button>
                </div>
              )}

              {/* Analyze Button */}
              <Button
                onClick={handleAnalyze}
                disabled={!selectedFile || isAnalyzing}
                className="w-full bg-sky-500 hover:bg-sky-600"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Analyze Document
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Document Types Info */}
          <Card>
            <CardHeader>
              <CardTitle>Supported Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-sky-500" />
                  <span>Insurance policies and declarations pages</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-sky-500" />
                  <span>Claims documentation</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-sky-500" />
                  <span>Repair estimates and invoices</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-sky-500" />
                  <span>Contracts and agreements</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-sky-500" />
                  <span>Inspection reports</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Analysis Results */}
        <div className="space-y-6">
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
            </CardHeader>
            <CardContent>
              {analysis ? (
                <div className="space-y-6">
                  {/* Document Type & Confidence */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                        Document Type
                      </p>
                      <p className="text-lg font-semibold">{analysis.documentType}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                        Confidence
                      </p>
                      <p className="text-lg font-semibold text-sky-600">
                        {Math.round(analysis.confidence * 100)}%
                      </p>
                    </div>
                  </div>

                  {/* Summary */}
                  <div>
                    <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
                      Summary
                    </Label>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {analysis.summary}
                    </p>
                  </div>

                  {/* Extracted Data */}
                  {Object.keys(analysis.extractedData).length > 0 && (
                    <div>
                      <Label className="text-xs font-semibold uppercase text-muted-foreground mb-3 block">
                        Extracted Information
                      </Label>
                      <div className="space-y-2">
                        {Object.entries(analysis.extractedData).map(([key, value]) => {
                          if (!value) return null;
                          const displayKey = key
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase());

                          return (
                            <div key={key} className="flex justify-between items-start p-2 bg-muted rounded">
                              <span className="text-xs font-medium text-muted-foreground">
                                {displayKey}
                              </span>
                              <span className="text-xs font-semibold text-right ml-2">
                                {value}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Key Findings */}
                  {analysis.keyFindings.length > 0 && (
                    <div>
                      <Label className="text-xs font-semibold uppercase text-muted-foreground mb-3 block">
                        Key Findings
                      </Label>
                      <div className="space-y-2">
                        {analysis.keyFindings.map((finding, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-sky-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm">{finding}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-4 border-t">
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      className="w-full"
                    >
                      Analyze Another Document
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    No document analyzed yet
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Upload a document and click "Analyze Document" to extract key information
                    and get insights
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
