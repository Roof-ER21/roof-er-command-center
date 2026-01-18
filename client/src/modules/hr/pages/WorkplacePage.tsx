import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams, useLocation } from "react-router-dom";
import { MeetingRoomsPage } from "./MeetingRoomsPage";
import { MyCalendarPage } from "./MyCalendarPage";
import { QrCodesPage } from "./QrCodesPage";

export function WorkplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const tabFromQuery = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromQuery || "calendar");

  useEffect(() => {
    if (tabFromQuery) {
      setActiveTab(tabFromQuery);
    }
  }, [tabFromQuery]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workplace</h1>
        <p className="text-muted-foreground">
          Manage calendar, meetings, and facilities
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="calendar">My Calendar</TabsTrigger>
          <TabsTrigger value="rooms">Meeting Rooms</TabsTrigger>
          <TabsTrigger value="qr">QR Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <MyCalendarPage embedded />
        </TabsContent>
        <TabsContent value="rooms">
          <MeetingRoomsPage embedded />
        </TabsContent>
        <TabsContent value="qr">
          <QrCodesPage embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}
