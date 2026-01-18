import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Copy, Send, Loader2, Check, ArrowLeft, Search, FileText, ChevronRight, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Link } from "react-router-dom";

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  category: string;
  state?: string | null;
  variables: string[];
}

interface Category {
  id: string;
  name: string;
  count: number;
}

interface GeneratedEmail {
  subject: string;
  body: string;
  templateUsed?: string;
}

const categoryDescriptions: Record<string, string> = {
  'state': 'Templates specific to VA, MD, and PA regulations',
  'insurance': 'Insurance claim communications and follow-ups',
  'customer': 'General customer communication templates',
  'scheduling': 'Appointment confirmations and scheduling',
  'technical': 'Technical specifications and recommendations',
  'follow-up': 'Follow-up and referral request templates',
  'custom': 'AI-generated custom emails',
};

export function EmailGeneratorPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [context, setContext] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});

  // Generated email state
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/field/email/templates', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data.templates);
        setCategories(data.data.categories);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter templates based on search and category
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setGeneratedEmail(null);
    setIsCopied(false);
    // Reset variables
    const newVariables: Record<string, string> = {};
    template.variables.forEach(v => {
      if (v !== 'customerName') {
        newVariables[v] = '';
      }
    });
    setVariables(newVariables);
  };

  const handleGenerate = async () => {
    if (!customerName) {
      toast({
        title: "Missing Information",
        description: "Please provide the customer name.",
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
          templateId: selectedTemplate?.id,
          customerName,
          customerEmail,
          context,
          variables: { ...variables, customerName },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedEmail(data.data);
        toast({
          title: "Email Generated",
          description: data.data.templateUsed
            ? `Generated using "${data.data.templateUsed}" template`
            : "Your professional email is ready!",
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

  const handleReset = () => {
    setSelectedTemplate(null);
    setGeneratedEmail(null);
    setCustomerName('');
    setCustomerEmail('');
    setContext('');
    setVariables({});
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
            <h1 className="text-3xl font-bold tracking-tight">Email Generator</h1>
          </div>
          <p className="text-muted-foreground">Create professional emails with 17+ industry templates</p>
        </div>
        <Mail className="h-8 w-8 text-sky-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Template Browser */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Email Templates</CardTitle>
              <CardDescription>Browse and select a template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Category Tabs */}
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="w-full flex-wrap h-auto gap-1 bg-transparent p-0">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-sky-100 data-[state=active]:text-sky-700 dark:data-[state=active]:bg-sky-900 dark:data-[state=active]:text-sky-300"
                  >
                    All ({templates.length})
                  </TabsTrigger>
                  {categories.map(cat => (
                    <TabsTrigger
                      key={cat.id}
                      value={cat.id}
                      className="data-[state=active]:bg-sky-100 data-[state=active]:text-sky-700 dark:data-[state=active]:bg-sky-900 dark:data-[state=active]:text-sky-300"
                    >
                      {cat.name} ({cat.count})
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {/* Category Description */}
              {selectedCategory !== 'all' && categoryDescriptions[selectedCategory] && (
                <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  {categoryDescriptions[selectedCategory]}
                </p>
              )}

              {/* Template List */}
              <ScrollArea className="h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No templates found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                          selectedTemplate?.id === template.id
                            ? 'border-sky-500 bg-sky-50 dark:bg-sky-950'
                            : 'border-border hover:border-sky-300 hover:bg-muted/50'
                        }`}
                      >
                        <Mail className="h-4 w-4 text-sky-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{template.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              {template.category}
                            </Badge>
                            {template.state && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                {template.state}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* AI Custom Option */}
          <Card className="border-dashed">
            <CardContent className="pt-4">
              <button
                onClick={() => {
                  setSelectedTemplate(null);
                  setGeneratedEmail(null);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                  selectedTemplate === null
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                    : 'border-border hover:border-purple-300 hover:bg-muted/50'
                }`}
              >
                <Sparkles className="h-5 w-5 text-purple-500" />
                <div className="flex-1">
                  <p className="font-medium text-sm">AI Custom Email</p>
                  <p className="text-xs text-muted-foreground">Generate from scratch with AI</p>
                </div>
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column: Form */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {selectedTemplate ? selectedTemplate.name : 'AI Custom Email'}
              </CardTitle>
              <CardDescription>
                {selectedTemplate
                  ? `Fill in the details for this template`
                  : 'Provide context for AI generation'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Name - Always Required */}
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  placeholder="John Smith"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              {/* Customer Email - Optional */}
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

              {/* Template Variables */}
              {selectedTemplate && selectedTemplate.variables.filter(v => v !== 'customerName').length > 0 && (
                <div className="space-y-3 pt-2 border-t">
                  <Label className="text-xs uppercase text-muted-foreground">Template Variables</Label>
                  {selectedTemplate.variables
                    .filter(v => v !== 'customerName')
                    .map(variable => (
                      <div key={variable} className="space-y-1">
                        <Label htmlFor={variable} className="text-xs capitalize">
                          {variable.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                        <Input
                          id={variable}
                          placeholder={`Enter ${variable.replace(/([A-Z])/g, ' $1').trim().toLowerCase()}`}
                          value={variables[variable] || ''}
                          onChange={(e) => setVariables(prev => ({ ...prev, [variable]: e.target.value }))}
                        />
                      </div>
                    ))}
                </div>
              )}

              {/* Additional Context */}
              <div className="space-y-2 pt-2 border-t">
                <Label htmlFor="context">
                  {selectedTemplate ? 'Additional Context (Optional)' : 'Email Purpose *'}
                </Label>
                <textarea
                  id="context"
                  className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-none"
                  placeholder={selectedTemplate
                    ? "Any additional details to customize the email..."
                    : "Describe what you want the email to accomplish..."}
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                />
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !customerName || (!selectedTemplate && !context)}
                className="w-full bg-sky-500 hover:bg-sky-600"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    {selectedTemplate ? <Mail className="mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {selectedTemplate ? 'Generate Email' : 'Generate with AI'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Email Preview</CardTitle>
                {generatedEmail?.templateUsed && (
                  <Badge variant="outline" className="text-xs">
                    {generatedEmail.templateUsed}
                  </Badge>
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
                    <ScrollArea className="h-[350px]">
                      <div className="p-4 bg-muted rounded-md whitespace-pre-wrap">
                        <p className="text-sm">{generatedEmail.body}</p>
                      </div>
                    </ScrollArea>
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
                      Add customer email to enable send
                    </p>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="w-full"
                  >
                    Start Over
                  </Button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Mail className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    No email generated yet
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    {selectedTemplate
                      ? `Fill in the details and click "Generate Email" to create your ${selectedTemplate.name} email`
                      : 'Select a template or use AI Custom to generate a professional email'}
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
