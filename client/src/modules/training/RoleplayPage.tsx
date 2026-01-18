import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Mic, MessageCircle } from "lucide-react";

export function RoleplayPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Roleplay</h1>
        <p className="text-muted-foreground">Practice your pitch with AI-powered scenarios</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Text Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">Practice with text-based responses</p>
            <Button className="w-full">
              <Play className="mr-2 h-4 w-4" />
              Start
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Voice Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">Speak your responses naturally</p>
            <Button className="w-full">
              <Play className="mr-2 h-4 w-4" />
              Start
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Advanced
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">Complex scenarios with scoring</p>
            <Button className="w-full">
              <Play className="mr-2 h-4 w-4" />
              Start
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Your roleplay history will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
