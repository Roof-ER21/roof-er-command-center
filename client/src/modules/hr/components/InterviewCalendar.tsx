import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Interview {
  id: number;
  candidateId: number;
  interviewerId?: number | null;
  scheduledAt: string;
  duration?: number | null;
  type: "phone" | "video" | "in_person" | "panel";
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  location?: string | null;
  meetingLink?: string | null;
  rating?: number | null;
  notes?: string | null;
  feedback?: string | null;
  recommendation?: string | null;
  candidateName?: string;
  candidatePosition?: string;
  interviewerName?: string;
}

interface InterviewCalendarProps {
  interviews: Interview[];
  onInterviewClick: (interview: Interview) => void;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const INTERVIEW_TYPE_COLORS = {
  phone: "bg-blue-500",
  video: "bg-purple-500",
  in_person: "bg-green-500",
  panel: "bg-orange-500",
};

export function InterviewCalendar({ interviews, onInterviewClick }: InterviewCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Generate calendar grid
  const calendarDays: (number | null)[] = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Group interviews by date
  const interviewsByDate = interviews.reduce((acc, interview) => {
    const date = new Date(interview.scheduledAt);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(interview);
    return acc;
  }, {} as Record<string, Interview[]>);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthName = new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const getInterviewsForDay = (day: number): Interview[] => {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return interviewsByDate[dateKey] || [];
  };

  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{monthName}</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span>Phone</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-purple-500"></div>
            <span>Video</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span>In-Person</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-500"></div>
            <span>Panel</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dayInterviews = getInterviewsForDay(day);
            const today = isToday(day);

            return (
              <div
                key={`day-${day}`}
                className={`
                  aspect-square border rounded-lg p-1 overflow-hidden
                  ${today ? "border-primary bg-primary/5" : "border-border"}
                  ${dayInterviews.length > 0 ? "cursor-pointer hover:bg-muted/50" : ""}
                `}
              >
                <div className="text-sm font-medium mb-1">
                  {day}
                </div>
                <div className="space-y-0.5">
                  {dayInterviews.slice(0, 3).map((interview) => (
                    <div
                      key={interview.id}
                      onClick={() => onInterviewClick(interview)}
                      className={`
                        ${INTERVIEW_TYPE_COLORS[interview.type]}
                        text-white text-[10px] px-1 rounded truncate cursor-pointer
                        hover:opacity-80 transition-opacity
                      `}
                      title={`${interview.candidateName || 'Interview'} - ${interview.type}`}
                    >
                      {new Date(interview.scheduledAt).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  ))}
                  {dayInterviews.length > 3 && (
                    <div className="text-[10px] text-muted-foreground text-center">
                      +{dayInterviews.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
