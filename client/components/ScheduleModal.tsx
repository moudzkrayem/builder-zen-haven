import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEvents } from "@/contexts/EventsContext";
import {
  X,
  Calendar,
  MapPin,
  Clock,
  Users,
  MessageCircle,
  Check,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: (eventId: number, hostName: string) => void;
  onEventClick?: (eventId: number) => void;
}

export default function ScheduleModal({
  isOpen,
  onClose,
  onOpenChat,
  onEventClick,
}: ScheduleModalProps) {
  const { events, joinedEvents, leaveEvent } = useEvents();
  const [cancellingEvent, setCancellingEvent] = useState<number | null>(null);

  if (!isOpen) return null;

  const joinedEventsList = events.filter((event) =>
    joinedEvents.includes(event.id),
  );

  const handleCancelEvent = async (eventId: number) => {
    setCancellingEvent(eventId);
    // Add a small delay for visual feedback
    setTimeout(() => {
      leaveEvent(eventId);
      setCancellingEvent(null);
    }, 500);
  };

  const formatEventDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold">My Schedule</h2>
            <p className="text-muted-foreground text-sm">
              {joinedEventsList.length} event
              {joinedEventsList.length !== 1 ? "s" : ""} joined
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Events List */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {joinedEventsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No events yet</h3>
              <p className="text-muted-foreground">
                Join some events to see them in your schedule!
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {joinedEventsList.map((event) => (
                <button
                  key={event.id}
                  onClick={() => onEventClick?.(event.id)}
                  className={cn(
                    "bg-muted/30 rounded-2xl p-4 border border-border transition-all duration-300 hover:bg-muted/50 text-left w-full",
                    cancellingEvent === event.id &&
                      "opacity-50 scale-95 bg-destructive/10",
                  )}
                >
                  <div className="flex items-start space-x-4">
                    {/* Event Image */}
                    <img
                      src={event.image}
                      alt={event.name}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                    />

                    {/* Event Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg line-clamp-1">
                          {event.eventName || event.name}
                        </h3>
                        <Badge className="bg-green-500 text-white ml-2">
                          Joined
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatEventDate(event.date)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>
                            {event.attendees}/{event.maxCapacity} attending
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 mt-4">
                        <span className="text-xs text-muted-foreground">
                          Host: {event.hostName || event.host}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {event.fee}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenChat(
                          event.id,
                          event.hostName || event.host || "Host",
                        );
                      }}
                      className="flex items-center space-x-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Chat with Host</span>
                    </Button>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Keep Spot
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelEvent(event.id)}
                        disabled={cancellingEvent === event.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {cancellingEvent === event.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-1" />
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-1" />
                            Cancel
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {joinedEventsList.length > 0 && (
          <div className="p-6 border-t border-border">
            <Button
              onClick={onClose}
              className="w-full rounded-xl"
              variant="outline"
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
