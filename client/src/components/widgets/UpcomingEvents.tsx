import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ChevronRight, Briefcase, Users, GraduationCap, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isTomorrow, isThisWeek } from "date-fns";

export interface Event {
  id: string;
  title: string;
  type: "pto" | "meeting" | "contest" | "training" | "deadline" | "other";
  startDate: Date | string;
  endDate?: Date | string;
  location?: string;
  attendees?: number;
  description?: string;
  priority?: "low" | "medium" | "high";
}

export interface UpcomingEventsProps {
  title?: string;
  events: Event[];
  maxEvents?: number;
  showPastDue?: boolean;
  onEventClick?: (event: Event) => void;
  onViewAll?: () => void;
  className?: string;
}

const eventTypeConfig = {
  pto: {
    label: "PTO",
    icon: Briefcase,
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  },
  meeting: {
    label: "Meeting",
    icon: Users,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  contest: {
    label: "Contest",
    icon: Trophy,
    color: "bg-green-500/10 text-green-600 border-green-500/20",
  },
  training: {
    label: "Training",
    icon: GraduationCap,
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  deadline: {
    label: "Deadline",
    icon: Clock,
    color: "bg-red-500/10 text-red-600 border-red-500/20",
  },
  other: {
    label: "Event",
    icon: Calendar,
    color: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  },
};

const priorityConfig = {
  low: "border-l-slate-500",
  medium: "border-l-amber-500",
  high: "border-l-red-500",
};

export function UpcomingEvents({
  title = "Upcoming Events",
  events,
  maxEvents = 5,
  showPastDue = true,
  onEventClick,
  onViewAll,
  className,
}: UpcomingEventsProps) {
  const now = new Date();

  // Sort events by start date
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = typeof a.startDate === "string" ? new Date(a.startDate) : a.startDate;
    const dateB = typeof b.startDate === "string" ? new Date(b.startDate) : b.startDate;
    return dateA.getTime() - dateB.getTime();
  });

  // Filter past due if needed
  const filteredEvents = showPastDue
    ? sortedEvents
    : sortedEvents.filter((event) => {
        const eventDate = typeof event.startDate === "string" ? new Date(event.startDate) : event.startDate;
        return eventDate >= now;
      });

  const displayEvents = filteredEvents.slice(0, maxEvents);

  const formatEventDate = (date: Date | string) => {
    const eventDate = typeof date === "string" ? new Date(date) : date;

    if (isToday(eventDate)) {
      return `Today at ${format(eventDate, "h:mm a")}`;
    }
    if (isTomorrow(eventDate)) {
      return `Tomorrow at ${format(eventDate, "h:mm a")}`;
    }
    if (isThisWeek(eventDate)) {
      return format(eventDate, "EEEE 'at' h:mm a");
    }
    return format(eventDate, "MMM d 'at' h:mm a");
  };

  const isPastDue = (event: Event) => {
    const eventDate = typeof event.startDate === "string" ? new Date(event.startDate) : event.startDate;
    return eventDate < now;
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {title}
        </CardTitle>
        {onViewAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewAll}
            className="h-auto p-0 text-xs"
          >
            View All
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No upcoming events
            </p>
          ) : (
            displayEvents.map((event) => {
              const config = eventTypeConfig[event.type];
              const Icon = config.icon;
              const pastDue = isPastDue(event);

              return (
                <div
                  key={event.id}
                  className={cn(
                    "flex gap-3 p-3 rounded-lg border-l-4 bg-card hover:bg-accent/50 transition-colors",
                    event.priority && priorityConfig[event.priority],
                    !event.priority && "border-l-transparent",
                    onEventClick && "cursor-pointer",
                    pastDue && "opacity-60"
                  )}
                  onClick={() => onEventClick?.(event)}
                >
                  <div className={cn("rounded-lg p-2 h-fit", config.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {formatEventDate(event.startDate)}
                          </p>
                        </div>
                        {event.location && (
                          <p className="text-xs text-muted-foreground mt-1">
                            📍 {event.location}
                          </p>
                        )}
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className={cn("text-xs shrink-0", config.color)}>
                        {config.label}
                      </Badge>
                    </div>
                    {event.attendees && (
                      <div className="flex items-center gap-1 mt-2">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {event.attendees} {event.attendees === 1 ? "attendee" : "attendees"}
                        </span>
                      </div>
                    )}
                    {pastDue && (
                      <Badge variant="destructive" className="text-xs mt-2">
                        Past Due
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
