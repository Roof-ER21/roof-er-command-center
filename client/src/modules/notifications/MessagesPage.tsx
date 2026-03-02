import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, MessageSquare, AtSign, Filter } from "lucide-react";

export function MessagesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-muted-foreground">@mention inbox tied to Job Message Boards</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Construction className="h-3 w-3" /> Coming Soon
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><AtSign className="h-4 w-4" /> @Mention Inbox</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Only shows messages where you are mentioned</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Inline Reply</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Reply directly, mark as read/unread</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Filter className="h-4 w-4" /> Filters</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Filter by job, sender, date</p></CardContent>
        </Card>
      </div>
    </div>
  );
}
