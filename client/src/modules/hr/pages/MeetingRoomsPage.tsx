import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { usePermissions } from "@/hooks/usePermissions";
import { Calendar, DoorOpen, Plus } from "lucide-react";

interface MeetingRoom {
  id: number;
  name: string;
  location?: string;
  capacity: number;
  status: "available" | "maintenance";
}

interface Meeting {
  id: number;
  title: string;
  roomId?: number;
  startTime: string;
  endTime: string;
  status: string;
  meetingLink?: string;
}

export function MeetingRoomsPage({ embedded = false }: { embedded?: boolean }) {
  const { toast } = useToast();
  const { isManager } = usePermissions();
  const queryClient = useQueryClient();
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [roomData, setRoomData] = useState({
    name: "",
    location: "",
    capacity: "",
  });
  const [meetingData, setMeetingData] = useState({
    title: "",
    roomId: "",
    startTime: "",
    endTime: "",
    meetingLink: "",
  });

  const { data: rooms = [], isLoading: roomsLoading } = useQuery<MeetingRoom[]>({
    queryKey: ["/api/hr/meeting-rooms"],
    queryFn: async () => {
      const response = await fetch("/api/hr/meeting-rooms", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch meeting rooms");
      return response.json();
    },
  });

  const { data: meetings = [], isLoading: meetingsLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/hr/meetings"],
    queryFn: async () => {
      const response = await fetch("/api/hr/meetings", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch meetings");
      return response.json();
    },
  });

  const createRoomMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/hr/meeting-rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: roomData.name,
          location: roomData.location || null,
          capacity: roomData.capacity ? parseInt(roomData.capacity, 10) : 1,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to create room");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/meeting-rooms"] });
      setRoomDialogOpen(false);
      setRoomData({ name: "", location: "", capacity: "" });
      toast({
        title: "Room created",
        description: "Meeting room is now available.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create room",
        variant: "destructive",
      });
    },
  });

  const createMeetingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/hr/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: meetingData.title,
          roomId: meetingData.roomId || null,
          startTime: meetingData.startTime,
          endTime: meetingData.endTime,
          meetingLink: meetingData.meetingLink || null,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to create meeting");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/meetings"] });
      setMeetingDialogOpen(false);
      setMeetingData({ title: "", roomId: "", startTime: "", endTime: "", meetingLink: "" });
      toast({
        title: "Meeting scheduled",
        description: "Meeting has been added to the calendar.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to schedule meeting",
        variant: "destructive",
      });
    },
  });

  const handleRoomSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!roomData.name) {
      toast({
        title: "Missing name",
        description: "Room name is required.",
        variant: "destructive",
      });
      return;
    }
    createRoomMutation.mutate();
  };

  const handleMeetingSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!meetingData.title || !meetingData.startTime || !meetingData.endTime) {
      toast({
        title: "Missing fields",
        description: "Title and time are required.",
        variant: "destructive",
      });
      return;
    }
    createMeetingMutation.mutate();
  };

  if (roomsLoading || meetingsLoading) {
    return <div className="p-8">Loading meeting data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        {!embedded && (
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meeting Rooms</h1>
            <p className="text-muted-foreground">Reserve rooms and schedule meetings</p>
          </div>
        )}
        {isManager() && (
          <div className="flex flex-wrap gap-2">
            <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <DoorOpen className="mr-2 h-4 w-4" />
                  Add Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Room</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleRoomSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="room-name">Name</Label>
                    <Input
                      id="room-name"
                      value={roomData.name}
                      onChange={(e) => setRoomData((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="room-location">Location</Label>
                    <Input
                      id="room-location"
                      value={roomData.location}
                      onChange={(e) => setRoomData((prev) => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="room-capacity">Capacity</Label>
                    <Input
                      id="room-capacity"
                      type="number"
                      value={roomData.capacity}
                      onChange={(e) => setRoomData((prev) => ({ ...prev, capacity: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" type="button" onClick={() => setRoomDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createRoomMutation.isPending}>
                      {createRoomMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={meetingDialogOpen} onOpenChange={setMeetingDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Meeting
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule Meeting</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleMeetingSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="meeting-title">Title</Label>
                    <Input
                      id="meeting-title"
                      value={meetingData.title}
                      onChange={(e) => setMeetingData((prev) => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Room</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={meetingData.roomId}
                      onChange={(e) => setMeetingData((prev) => ({ ...prev, roomId: e.target.value }))}
                    >
                      <option value="">Select room</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="meeting-start">Start</Label>
                      <Input
                        id="meeting-start"
                        type="datetime-local"
                        value={meetingData.startTime}
                        onChange={(e) => setMeetingData((prev) => ({ ...prev, startTime: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="meeting-end">End</Label>
                      <Input
                        id="meeting-end"
                        type="datetime-local"
                        value={meetingData.endTime}
                        onChange={(e) => setMeetingData((prev) => ({ ...prev, endTime: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="meeting-link">Meeting Link</Label>
                    <Input
                      id="meeting-link"
                      value={meetingData.meetingLink}
                      onChange={(e) => setMeetingData((prev) => ({ ...prev, meetingLink: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" type="button" onClick={() => setMeetingDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMeetingMutation.isPending}>
                      {createMeetingMutation.isPending ? "Saving..." : "Schedule"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rooms</CardTitle>
            <CardDescription>{rooms.length} available rooms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {rooms.map((room) => (
              <div key={room.id} className="rounded border p-3">
                <div className="font-medium">{room.name}</div>
                <div className="text-sm text-muted-foreground">
                  {room.location || "No location"} • {room.capacity} seats
                </div>
                <Badge variant="outline" className="mt-2">
                  {room.status}
                </Badge>
              </div>
            ))}
            {rooms.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No rooms added yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Meetings</CardTitle>
            <CardDescription>{meetings.length} scheduled meetings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="rounded border p-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-medium">{meeting.title}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(meeting.startTime).toLocaleString()} -{" "}
                  {new Date(meeting.endTime).toLocaleString()}
                </div>
                {meeting.meetingLink && (
                  <div className="text-sm text-muted-foreground">{meeting.meetingLink}</div>
                )}
                <Badge variant="outline" className="mt-2">
                  {meeting.status}
                </Badge>
              </div>
            ))}
            {meetings.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No meetings scheduled.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
