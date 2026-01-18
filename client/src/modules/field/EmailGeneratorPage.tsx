import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Copy, Send, Loader2, Check, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Link } from "react-router-dom";

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface GeneratedEmail {
  subject: string;
  body: string;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  { id: 'follow-up', name: 'Follow-Up', description: 'After inspection or initial contact', category: 'outreach' },
  { id: 'estimate', name: 'Estimate Delivery', description: 'Send repair/replacement estimate', category: 'sales' },
  { id: 'claim-status', name: 'Claim Status Update', description: 'Insurance claim progress update', category: 'claims' },
  { id: 'appointment', name: 'Appointment Confirmation', description: 'Confirm inspection or work schedule', category: 'scheduling' },
  { id: 'thank-you', name: 'Thank You', description: 'Post-completion gratitude', category: 'follow-up' },
  { id: 'custom', name: 'Custom Email', description: 'AI-generated custom email', category: 'custom' },
];

export function EmailGeneratorPage() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [context, setContext] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setGeneratedEmail(null);
    setIsCopied(false);
  };

  const handleGenerate = async () => {
    if (!selectedTemplate || !customerName) {
      toast({
        title: "Missing Information",
        description: "Please select a template and provide customer name.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/field/email/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          templateId: selectedTemplate,
          customerName,
          customerEmail,
          context,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedEmail(data.data);
        toast({
          title: "Email Generated",
          description: "Your professional email is ready!",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate email",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedEmail) return;

    const fullEmail = `Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`;
    await navigator.clipboard.writeText(fullEmail);
    setIsCopied(true);
    toast({
      title: "Copied!",
      description: "Email copied to clipboard",
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSend = () => {
    if (!generatedEmail || !customerEmail) {
      toast({
        title: "Cannot Send",
        description: "Please provide customer email address",
        variant: "destructive",
      });
      return;
    }

    // Create mailto link
    const mailtoLink = `mailto:${customerEmail}?subject=${encodeURIComponent(generatedEmail.subject)}&body=${encodeURIComponent(generatedEmail.body)}`;
    window.location.href = mailtoLink;
  };

  const selectedTemplateData = EMAIL_TEMPLATES.find(t => t.id === selectedTemplate);

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
            <h1 className="text-3xl font-bold tracking-tight">Email Generator</h1>
          </div>
          <p className="text-muted-foreground">Create professional emails with AI assistance</p>
        </div>
        <Mail className="h-8 w-8 text-sky-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Template Selection & Input */}
        <div className="space-y-6">
          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Template</CardTitle>
              <CardDescription>Choose an email template to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {EMAIL_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                      selectedTemplate === template.id
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950'
                        : 'border-border hover:border-sky-300 hover:bg-muted/50'
                    }`}
                  >
                    <Mail className="h-4 w-4 mt-0.5 text-sky-500" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Input Form */}
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>Email Details</CardTitle>
                <CardDescription>Provide information for personalization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    placeholder="John Smith"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Customer Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder="john.smith@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="context">Additional Context</Label>
                  <textarea
                    id="context"
                    className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                    placeholder="Provide any specific details you want included in the email..."
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Example: "Roof inspection scheduled for Jan 20th, storm damage to north side"
                  </p>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !customerName}
                  className="w-full bg-sky-500 hover:bg-sky-600"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Generate Email
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Generated Email Preview */}
        <div className="space-y-6">
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Generated Email</CardTitle>
                {selectedTemplateData && (
                  <span className="text-xs bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 px-2 py-1 rounded-full">
                    {selectedTemplateData.name}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {generatedEmail ? (
                <>
                  {/* Subject */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Subject</Label>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">{generatedEmail.subject}</p>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Body</Label>
                    <div className="p-4 bg-muted rounded-md min-h-[300px] whitespace-pre-wrap">
                      <p className="text-sm">{generatedEmail.body}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleCopy}
                    >
                      {isCopied ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      className="flex-1 bg-sky-500 hover:bg-sky-600"
                      onClick={handleSend}
                      disabled={!customerEmail}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Send
                    </Button>
                  </div>

                  {!customerEmail && (
                    <p className="text-xs text-muted-foreground text-center">
                      Add customer email to enable send functionality
                    </p>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Mail className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplate
                      ? 'Fill in the details and click "Generate Email" to create your professional email'
                      : 'Select a template to get started'}
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
