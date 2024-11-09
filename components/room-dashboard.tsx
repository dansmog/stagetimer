"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Timer, Users, Plus, Clock, CheckCircle, Play } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Room {
  id: string;
  activityName: string;
  participantName: string;
  duration: number;
  status: "pending" | "active" | "completed";
  timeRemaining: number;
}

export default function RoomDashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newActivity, setNewActivity] = useState("");
  const [newParticipant, setNewParticipant] = useState("");
  const [newDuration, setNewDuration] = useState("");
  const { toast } = useToast();

  const addRoom = () => {
    if (!newActivity || !newParticipant || !newDuration) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const duration = parseInt(newDuration);
    if (isNaN(duration) || duration <= 0) {
      toast({
        title: "Error",
        description: "Duration must be a positive number",
        variant: "destructive",
      });
      return;
    }

    const newRoom: Room = {
      id: Date.now().toString(),
      activityName: newActivity,
      participantName: newParticipant,
      duration: duration * 60,
      status: "pending",
      timeRemaining: duration * 60,
    };

    setRooms([...rooms, newRoom]);
    setNewActivity("");
    setNewParticipant("");
    setNewDuration("");

    toast({
      title: "Room Added",
      description: "New room has been created successfully",
    });
  };

  const startActivity = (roomId: string) => {
    setRooms((currentRooms) => {
      if (currentRooms.some((room) => room.status === "active")) {
        toast({
          title: "Error",
          description: "Another activity is already in progress",
          variant: "destructive",
        });
        return currentRooms;
      }

      return currentRooms.map((room) =>
        room.id === roomId ? { ...room, status: "active" } : room
      );
    });
  };

  const markAsComplete = (roomId: string) => {
    setRooms((currentRooms) =>
      currentRooms.map((room) =>
        room.id === roomId
          ? { ...room, status: "completed", timeRemaining: 0 }
          : room
      )
    );
    toast({
      title: "Activity Completed",
      description: "The activity has been marked as complete",
    });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setRooms((currentRooms) => {
        const updatedRooms = currentRooms.map((room) => {
          if (room.status === "active") {
            const newTimeRemaining = room.timeRemaining - 1;

            if (newTimeRemaining <= 60 && newTimeRemaining > 59) {
              const nextRoom = currentRooms.find((r) => r.status === "pending");
              if (nextRoom) {
                toast({
                  title: "1 Minute Warning",
                  description: `${nextRoom.participantName} will be up next for ${nextRoom.activityName}`,
                });
              }
            }

            if (newTimeRemaining <= 0) {
              const nextRoom = currentRooms.find((r) => r.status === "pending");
              if (nextRoom) {
                toast({
                  title: "Room Complete",
                  description: `${room.participantName}'s session has ended.`,
                });
              }
              // Explicitly define the status to match Room's status type
              return {
                ...room,
                status: "completed" as "completed",
                timeRemaining: 0,
              };
            }

            return { ...room, timeRemaining: newTimeRemaining };
          }
          return room;
        });

        return updatedRooms;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [toast]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const activeRoom = rooms.find((room) => room.status === "active");
  const pendingRooms = rooms.filter((room) => room.status === "pending");
  const completedRooms = rooms.filter((room) => room.status === "completed");

  const RoomItem = ({
    room,
    showStart = false,
    showComplete = false,
  }: {
    room: Room;
    showStart?: boolean;
    showComplete?: boolean;
  }) => (
    <div
      className={cn(
        "py-4 flex items-center justify-between",
        room.status === "active" && "bg-green-50 rounded-lg p-4",
        room.status === "completed" && "opacity-75"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <Timer className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium truncate">{room.activityName}</p>
            <Badge
              variant={room.status === "active" ? "default" : "secondary"}
              className={cn(
                "ml-2",
                room.status === "active" && "bg-green-600 hover:bg-green-600"
              )}
            >
              {room.status === "active" ? "Active" : "Waiting"}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{room.participantName}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {room.status === "completed"
                  ? "Completed"
                  : formatTime(room.timeRemaining)}
              </span>
            </div>
          </div>
        </div>
      </div>
      {showStart && (
        <Button
          size="sm"
          onClick={() => startActivity(room.id)}
          className="ml-4"
        >
          <Play className="h-4 w-4 mr-1" />
          Start
        </Button>
      )}
      {showComplete && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => markAsComplete(room.id)}
          className="ml-4"
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Mark as Done
        </Button>
      )}
    </div>
  );

  return (
    <main className="container mx-auto p-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Room
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="grid gap-2">
              <Label htmlFor="activity">Activity</Label>
              <Input
                id="activity"
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                placeholder="Enter activity name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="participant">Participant</Label>
              <Input
                id="participant"
                value={newParticipant}
                onChange={(e) => setNewParticipant(e.target.value)}
                placeholder="Enter participant name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                placeholder="Enter duration"
                min="1"
              />
            </div>
            <div className="grid gap-2">
              <Label className="invisible">Add</Label>
              <Button onClick={addRoom}>Add Room</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {activeRoom && (
            <>
              <h2 className="text-lg font-semibold mb-4">Ongoing Activity</h2>
              <RoomItem room={activeRoom} showComplete={true} />
              <Separator className="my-6" />
            </>
          )}

          {pendingRooms.length > 0 && (
            <>
              <h2 className="text-lg font-semibold mb-2">
                Upcoming Activities
              </h2>
              <CardDescription className="mb-4">
                Please ensure all participants are ready for their sessions
              </CardDescription>
              <div className="divide-y">
                {pendingRooms.map((room, index) => (
                  <RoomItem
                    key={room.id}
                    room={room}
                    showStart={index === 0 && !activeRoom}
                  />
                ))}
              </div>
            </>
          )}

          {completedRooms.length > 0 && (
            <>
              <Separator className="my-6" />
              <h2 className="text-lg font-semibold mb-4">
                Completed Activities
              </h2>
              <div className="divide-y">
                {completedRooms.map((room) => (
                  <RoomItem key={room.id} room={room} />
                ))}
              </div>
            </>
          )}

          {rooms.length === 0 && (
            <p className="py-4 text-center text-muted-foreground">
              No activities added yet
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
