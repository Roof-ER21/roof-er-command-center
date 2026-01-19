import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { CheckCircle, XCircle, MapPin, Loader2 } from "lucide-react";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
}

export function AttendanceCheckInPage({ embedded = false }: { embedded?: boolean }) {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session");
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [locationError, setLocationError] = useState<string>("");

  // Get GPS location
  const getLocation = async (): Promise<LocationData | null> => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setLocationStatus("error");
      return null;
    }

    setLocationStatus("loading");

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

          setLocation(locData);
          setLocationStatus("success");
          resolve(locData);
        },
        (error) => {
          let errorMessage = "Unable to get your location";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
          }
          setLocationError(errorMessage);
          setLocationStatus("error");
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
    mutationFn: async (locData: LocationData | null) => {
      const response = await fetch("/api/hr/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sessionId,
          latitude: locData?.latitude,
          longitude: locData?.longitude,
          locationAddress: locData?.address,
          locationAccuracy: locData?.accuracy,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to check in");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Checked in",
        description: location
          ? "Your attendance and location have been recorded."
          : "Your attendance has been recorded.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to check in",
        variant: "destructive",
      });
    },
  });

  // Auto check-in when session ID is present
  useEffect(() => {
    const performCheckIn = async () => {
      if (sessionId && !checkInMutation.isPending && !checkInMutation.isSuccess) {
        const locData = await getLocation();
        checkInMutation.mutate(locData);
      }
    };
    performCheckIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  if (!sessionId) {
    return (
      <div className={embedded ? "" : "p-8"}>
        <Card>
          <CardHeader>
            <CardTitle>Missing session</CardTitle>
            <CardDescription>Scan a valid QR code to check in.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const content = (
    <Card className="max-w-md w-full">
      <CardHeader>
        <CardTitle>Attendance Check-In</CardTitle>
        <CardDescription>Session #{sessionId}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        {(checkInMutation.isPending || locationStatus === "loading") && (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-sm text-muted-foreground">
              {locationStatus === "loading" ? "Getting your location..." : "Recording your check-in..."}
            </div>
          </div>
        )}
        {checkInMutation.isSuccess && (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle className="h-10 w-10 text-green-600" />
            <div className="text-sm text-muted-foreground">Check-in confirmed.</div>
            {location && (
              <div className="text-xs text-muted-foreground flex items-center gap-1 bg-muted/50 px-3 py-2 rounded-md">
                <MapPin className="h-3 w-3" />
                <span>
                  {location.address
                    ? location.address.substring(0, 50) + (location.address.length > 50 ? "..." : "")
                    : `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                </span>
              </div>
            )}
            {locationStatus === "error" && (
              <div className="text-xs text-amber-600">
                Location not recorded: {locationError}
              </div>
            )}
          </div>
        )}
        {checkInMutation.isError && (
          <div className="flex flex-col items-center gap-2">
            <XCircle className="h-10 w-10 text-red-600" />
            <div className="text-sm text-muted-foreground">
              Unable to check in. Please try again.
            </div>
            <Button
              variant="outline"
              onClick={async () => {
                const locData = await getLocation();
                checkInMutation.mutate(locData);
              }}
            >
              Retry
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6 flex items-center justify-center">
      {content}
    </div>
  );
}
