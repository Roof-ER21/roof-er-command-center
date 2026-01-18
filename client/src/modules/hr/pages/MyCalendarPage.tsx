import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/useToast";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Plus,
  Video,
} from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfMonth,
  subMonths,
} from "date-fns";

type CalendarEventType = "meeting" | "interview" | "pto" | "training" | "other";

interface CalendarEvent {
  id: string;
  title: string;
  eventType: CalendarEventType;
  startTime: string;
  endTime: string;
  location?: string | null;
  meetingLink?: string | null;
  source: "hr" | "meeting" | "pto";
}

interface Meeting {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  meetingLink?: string | null;
}

interface PtoRequest {
  id: number;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
}

const eventColors: Record<CalendarEventType, string> = {
  meeting: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  interview: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  pto: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  training: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
};

export function MyCalendarPage({ embedded = false }: { embedded?: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    eventType: "other" as CalendarEventType,
    startTime: "",
    endTime: "",
    location: "",
    meetingLink: "",
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const { data: hrEvents = [] } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/hr/calendar/events", monthStart.toISOString(), monthEnd.toISOString()],
    queryFn: async () => {
      const response = await fetch(
        `/api/hr/calendar/events?timeMin=${monthStart.toISOString()}&timeMax=${monthEnd.toISOString()}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch calendar events");
      const data = await response.json();
      return data.map((event: any) => ({
        id: `hr-${event.id}`,
        title: event.title,
        eventType: event.eventType as CalendarEventType,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        meetingLink: event.meetingLink,
        source: "hr",
      }));
    },
  });

  const { data: meetings = [] } = useQuery<Meeting[]>({
    queryKey: ["/api/hr/meetings"],
    queryFn: async () => {
      const response = await fetch("/api/hr/meetings", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch meetings");
      return response.json();
    },
  });

  const { data: ptoRequests = [] } = useQuery<PtoRequest[]>({
    queryKey: ["/api/hr/pto"],
    queryFn: async () => {
      const response = await fetch("/api/hr/pto", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch PTO");
      return response.json();
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/hr/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: formData.title,
          eventType: formData.eventType,
          startTime: formData.startTime,
          endTime: formData.endTime,
          location: formData.location,
          meetingLink: formData.meetingLink,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to create event");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/calendar/events"] });
      setIsDialogOpen(false);
      setFormData({
        title: "",
        eventType: "other",
        startTime: "",
        endTime: "",
        location: "",
        meetingLink: "",
      });
      toast({
        title: "Event created",
        description: "Calendar event added.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create event",
        variant: "destructive",
      });
    },
  });

  const combinedEvents = useMemo<CalendarEvent[]>(() => {
    const meetingEvents = meetings.map((meeting) => ({
      id: `meeting-${meeting.id}`,
      title: meeting.title,
      eventType: "meeting" as CalendarEventType,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      meetingLink: meeting.meetingLink,
      source: "meeting" as const,
    }));

    const ptoEvents = ptoRequests
      .filter((pto) => pto.status === "approved")
      .map((pto) => ({
        id: `pto-${pto.id}`,
        title: `PTO (${pto.type})`,
        eventType: "pto" as CalendarEventType,
        startTime: pto.startDate,
        endTime: pto.endDate,
        source: "pto" as const,
      }));

    return [...hrEvents, ...meetingEvents, ...ptoEvents];
  }, [hrEvents, meetings, ptoRequests]);

  const eventsForDay = (day: Date) => {
    return combinedEvents.filter((event) => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      return isWithinInterval(day, { start, end }) || isSameDay(day, start);
    });
  };

  const selectedEvents = selectedDay ? eventsForDay(selectedDay) : [];

  const goPrev = () => setCurrentMonth((current) => subMonths(current, 1));
  const goNext = () => setCurrentMonth((current) => addMonths(current, 1));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        {!embedded && (
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              My Calendar
            </h1>
            <p className="text-muted-foreground">Meetings, PTO, and HR events</p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Calendar Event</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!formData.title || !formData.startTime || !formData.endTime) {
                    toast({
                      title: "Missing fields",
                      description: "Title, start, and end times are required.",
                      variant: "destructive",
                    });
                    return;
                  }
                  createEventMutation.mutate();
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="calendar-title">Title</Label>
                  <Input
                    id="calendar-title"
                    value={formData.title}
                    onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="calendar-type">Type</Label>
                  <Select
                    value={formData.eventType}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, eventType: value as CalendarEventType }))
                    }
                  >
                    <SelectTrigger id="calendar-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="pto">PTO</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="calendar-start">Start</Label>
                    <Input
                      id="calendar-start"
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(event) => setFormData((prev) => ({ ...prev, startTime: event.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="calendar-end">End</Label>
                    <Input
                      id="calendar-end"
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(event) => setFormData((prev) => ({ ...prev, endTime: event.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="calendar-location">Location</Label>
                  <Input
                    id="calendar-location"
                    value={formData.location}
                    onChange={(event) => setFormData((prev) => ({ ...prev, location: event.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="calendar-link">Meeting Link</Label>
                  <Input
                    id="calendar-link"
                    value={formData.meetingLink}
                    onChange={(event) => setFormData((prev) => ({ ...prev, meetingLink: event.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createEventMutation.isPending}>
                    {createEventMutation.isPending ? "Saving..." : "Save Event"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
            <CardDescription>Select a date to see events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 text-xs text-muted-foreground mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center font-medium">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {days.map((day) => {
                const dayEvents = eventsForDay(day);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDay(day)}
                    className={`rounded-lg border px-2 py-2 text-left text-sm transition ${
                      isSameDay(day, selectedDay || new Date(0))
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted/50"
                    } ${isSameMonth(day, currentMonth) ? "" : "opacity-50"}`}
                  >
                    <div className="font-medium">{format(day, "d")}</div>
                    <div className="mt-1 flex flex-col gap-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <span key={event.id} className="text-[10px] text-muted-foreground truncate">
                          {event.title}
                        </span>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 2} more</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Day Details</CardTitle>
            <CardDescription>
              {selectedDay ? format(selectedDay, "MMM d, yyyy") : "Select a date"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedEvents.length === 0 && (
              <div className="text-sm text-muted-foreground">No events for this day.</div>
            )}
            {selectedEvents.map((event) => (
              <div key={event.id} className="rounded border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{event.title}</div>
                  <Badge className={eventColors[event.eventType]}>{event.eventType}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(event.startTime), "p")} - {format(new Date(event.endTime), "p")}
                </div>
                {event.location && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {event.location}
                  </div>
                )}
                {event.meetingLink && (
                  <a
                    href={event.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-primary"
                  >
                    <Video className="h-3 w-3" />
                    Join meeting
                  </a>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
