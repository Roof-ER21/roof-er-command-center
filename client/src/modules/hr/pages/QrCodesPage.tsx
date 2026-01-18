import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QRCodeCanvas } from "qrcode.react";
import { CalendarCheck } from "lucide-react";

interface AttendanceSession {
  id: number;
  name: string;
  sessionDate: string;
  location?: string;
  status: "open" | "closed";
  checkInCount?: number;
}

export function QrCodesPage({ embedded = false }: { embedded?: boolean }) {
  const { data: sessions = [], isLoading } = useQuery<AttendanceSession[]>({
    queryKey: ["/api/hr/attendance/sessions"],
    queryFn: async () => {
      const response = await fetch("/api/hr/attendance/sessions", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch attendance sessions");
      return response.json();
    },
  });

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));
  }, [sessions]);

  if (isLoading) {
    return <div className="p-8">Loading QR codes...</div>;
  }

  return (
    <div className="space-y-6">
      {!embedded && (
        <div>
          <h1 className="text-3xl font-bold tracking-tight">QR Codes</h1>
          <p className="text-muted-foreground">Share QR codes for attendance check-ins</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sortedSessions.map((session) => {
          const checkInUrl = `${baseUrl}/hr/attendance/check-in?session=${session.id}`;
          return (
            <Card key={session.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarCheck className="h-5 w-5 text-primary" />
                  {session.name}
                </CardTitle>
                <CardDescription>{session.sessionDate}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {session.status}
                  </Badge>
                  <Badge variant="secondary">{session.checkInCount || 0} check-ins</Badge>
                </div>
                <div className="flex items-center justify-center rounded border p-4">
                  <QRCodeCanvas value={checkInUrl} size={180} includeMargin />
                </div>
                <div className="text-xs text-muted-foreground break-all">{checkInUrl}</div>
              </CardContent>
            </Card>
          );
        })}
        {sortedSessions.length === 0 && (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No attendance sessions available.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
