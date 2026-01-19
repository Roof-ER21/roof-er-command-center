import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { usePermissions } from "@/hooks/usePermissions";
import { CalendarCheck, MapPin, Plus, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useSearchParams } from "react-router-dom";
import { AttendanceCheckInPage } from "@/modules/hr/pages/AttendanceCheckInPage";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
}

interface AttendanceSession {
  id: number;
  name: string;
  sessionDate: string;
  location?: string;
  status: "open" | "closed";
  checkInCount?: number;
}

export function AttendancePage() {
  const { toast } = useToast();
  const { isManager } = usePermissions();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    name: "",
    sessionDate: "",
    location: "",
  });

  const tabFromQuery = searchParams.get("tab");
  const tabFromPath = location.pathname.includes("attendance/check-in") ? "checkin" : "sessions";
  const resolvedTab = tabFromQuery || tabFromPath;
  const [activeTab, setActiveTab] = useState(resolvedTab);

  useEffect(() => {
    setActiveTab(resolvedTab);
  }, [resolvedTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const onBasePath = location.pathname === "/hr/attendance";
    if (value === "sessions" && onBasePath) {
      setSearchParams({}, { replace: true });
      return;
    }
    setSearchParams({ tab: value }, { replace: true });
  };

  const { data: sessions = [], isLoading } = useQuery<AttendanceSession[]>({
    queryKey: ["/api/hr/attendance/sessions"],
    queryFn: async () => {
      const response = await fetch("/api/hr/attendance/sessions", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch attendance sessions");
      return response.json();
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/hr/attendance/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to create session");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/attendance/sessions"] });
      setIsDialogOpen(false);
      setFormData({ name: "", sessionDate: "", location: "" });
      toast({
        title: "Session created",
        description: "Attendance session is now open.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create session",
        variant: "destructive",
      });
    },
  });

  const [checkingInSession, setCheckingInSession] = useState<number | null>(null);

  // Get GPS location
  const getLocation = async (): Promise<LocationData | null> => {
    if (!navigator.geolocation) {
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const locData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };

          // Try to get address from coordinates (reverse geocoding)
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${locData.latitude}&lon=${locData.longitude}`
            );
            if (response.ok) {
              const data = await response.json();
              locData.address = data.display_name;
            }
          } catch {
            // Address lookup failed, continue without it
          }

          resolve(locData);
        },
        () => {
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  };

  const checkInMutation = useMutation({
    mutationFn: async ({ sessionId, location }: { sessionId: number; location: LocationData | null }) => {
      const response = await fetch("/api/hr/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sessionId,
          latitude: location?.latitude,
          longitude: location?.longitude,
          locationAddress: location?.address,
          locationAccuracy: location?.accuracy,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to check in");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/attendance/sessions"] });
      setCheckingInSession(null);
      toast({
        title: "Checked in",
        description: "Your attendance and location have been recorded.",
      });
    },
    onError: (error: any) => {
      setCheckingInSession(null);
      toast({
        title: "Error",
        description: error?.message || "Failed to check in",
        variant: "destructive",
      });
    },
  });

  const handleCheckIn = async (sessionId: number) => {
    setCheckingInSession(sessionId);
    const location = await getLocation();
    checkInMutation.mutate({ sessionId, location });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sessionDate) {
      toast({
        title: "Missing fields",
        description: "Session name and date are required.",
        variant: "destructive",
      });
      return;
    }
    createSessionMutation.mutate();
  };

  if (isLoading) {
    return <div className="p-8">Loading attendance sessions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">Check in and track daily attendance</p>
        </div>
        {activeTab === "sessions" && isManager() && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Attendance Session</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="session-name">Session Name</Label>
                  <Input
                    id="session-name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="session-date">Date</Label>
                  <Input
                    id="session-date"
                    type="date"
                    value={formData.sessionDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sessionDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="session-location">Location</Label>
                  <Input
                    id="session-location"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createSessionMutation.isPending}>
                    {createSessionMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="checkin">Check In</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>{sessions.length} sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <CalendarCheck className="h-4 w-4 text-primary" />
                      <span className="font-medium">{session.name}</span>
                      <Badge variant="secondary">{session.status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {session.sessionDate}
                    </div>
                    {session.location && (
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {session.location}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{session.checkInCount || 0} check-ins</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={session.status !== "open" || checkingInSession === session.id}
                      onClick={() => handleCheckIn(session.id)}
                    >
                      {checkingInSession === session.id ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Locating...
                        </>
                      ) : (
                        "Check In"
                      )}
                    </Button>
                  </div>
                </div>
              ))}
              {sessions.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No attendance sessions yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checkin" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Check In</h2>
            <p className="text-sm text-muted-foreground">
              Scan a QR code or open a session link to record attendance.
            </p>
          </div>
          <AttendanceCheckInPage embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}
