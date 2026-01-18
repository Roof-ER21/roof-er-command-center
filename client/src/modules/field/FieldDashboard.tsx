import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Mail, FileText, Image, ArrowRight, Bot } from "lucide-react";

export function FieldDashboard() {
  const cards = [
    { title: "Chat with Susan", description: "AI assistant", icon: MessageCircle, href: "/field/chat" },
    { title: "Email Generator", description: "Professional emails", icon: Mail, href: "/field/email" },
    { title: "Document Analysis", description: "AI-powered doc insights", icon: FileText, href: "/field/document-analysis" },
    { title: "Image Analysis", description: "Roof damage assessment", icon: Image, href: "/field/images" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Field Assistant</h1>
          <p className="text-muted-foreground">AI-powered tools for field operations</p>
        </div>
        <Button asChild className="bg-sky-500 hover:bg-sky-600">
          <Link to="/field/chat">
            <Bot className="mr-2 h-4 w-4" />
            Chat with Susan
          </Link>
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Chats Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">150 total this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Emails Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground mt-1">Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Docs Analyzed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground mt-1">This week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Images Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground mt-1">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.title} to={card.href}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer group h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription>{card.description}</CardDescription>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-2" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Susan preview */}
      <Card className="bg-gradient-to-br from-sky-500/10 to-sky-600/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-sky-500" />
            Susan AI Assistant
          </CardTitle>
          <CardDescription>
            Your intelligent field assistant for roofing operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-background rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white text-sm font-bold">
                S
              </div>
              <div className="flex-1 bg-muted rounded-lg p-3">
                <p className="text-sm">
                  Hi! I'm Susan, your AI field assistant. I can help you with insurance claims,
                  damage assessments, email drafts, and answering roofing questions. How can I help you today?
                </p>
              </div>
            </div>
          </div>
          <Button asChild className="mt-4 w-full">
            <Link to="/field/chat">
              <MessageCircle className="mr-2 h-4 w-4" />
              Start Conversation
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
