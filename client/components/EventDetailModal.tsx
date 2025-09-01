import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEvents } from "@/contexts/EventsContext";
import {
  X,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Heart,
  Star,
  UserPlus,
  Check,
  Calendar,
  Share,
  Info,
  Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";
import EditEventModal from "@/components/EditEventModal";

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: number | null;
}

export default function EventDetailModal({ isOpen, onClose, eventId }: EventDetailModalProps) {
  const {
    events,
    joinEvent,
    leaveEvent,
    joinedEvents,
    addConnection,
    isConnected,
    getUserRating,
    rateEvent,
    canRateEvent,
    isEventFinished,
    updateEvent
  } = useEvents();

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showEdit, setShowEdit] = useState(false);

  if (!isOpen || !eventId) return null;

  const event = events.find(e => e.id === eventId);
  if (!event) return null;

  const isJoined = joinedEvents.includes(eventId);
  const eventImages = event.eventImages || [event.image];

  const handleJoinToggle = () => {
    if (isJoined) {
      leaveEvent(eventId);
    } else {
      joinEvent(eventId);
    }
  };

  const handleConnect = () => {
    addConnection(eventId);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.eventName || event.name,
        text: `Check out this event: ${event.eventName || event.name} at ${event.location}`,
        url: window.location.href,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(
        `Check out this event: ${event.eventName || event.name} at ${event.location} - ${window.location.href}`
      );
      // You could add a toast notification here
      alert('Event link copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="absolute inset-x-4 top-4 bottom-4 bg-card rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <h2 className="text-lg font-bold">Event Details</h2>
          <div className="flex items-center space-x-2">
            {(event.hostName === 'You' || event.host === 'You') && (
              <Button variant="ghost" size="icon" onClick={() => setShowEdit(true)} className="rounded-full">
                <Pencil className="w-5 h-5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-full">
              <Share className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Event Images */}
          <div className="relative h-64">
            <img
              src={eventImages[currentPhotoIndex]}
              alt={event.eventName || event.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            
            {/* Photo navigation dots */}
            {eventImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {eventImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      index === currentPhotoIndex ? "bg-white" : "bg-white/50"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Host info overlay */}
            <div className="absolute top-4 left-4 flex items-center space-x-3">
              <img
                src={event.hostImage || "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"}
                alt={event.hostName || event.host}
                className="w-12 h-12 rounded-full border-2 border-white object-cover"
              />
              <div className="text-white">
                <div className="text-sm font-semibold">
                  {event.hostName || event.host}
                </div>
                <div className="text-xs text-white/80">Host</div>
              </div>
            </div>
          </div>

          {/* Event Information */}
          <div className="p-6 space-y-6">
            {/* Title and basic info */}
            <div>
              <h1 className="text-2xl font-bold mb-2">{event.eventName || event.name}</h1>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{event.date}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{event.attendees}/{event.maxCapacity} attendees</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span>{event.fee}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {event.category}
                </Badge>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <Info className="w-4 h-4 mr-2" />
                  About this event
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {event.description}
                </p>
              </div>
            )}

            {/* Interests/Tags */}
            {event.interests && event.interests.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">What to expect</h3>
                <div className="flex flex-wrap gap-2">
                  {event.interests.map((interest, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Rating Section (if user attended and event finished) */}
            {isJoined && (
              <div>
                <h3 className="font-semibold mb-2">Your Rating</h3>
                {canRateEvent(eventId) ? (
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((starValue) => {
                      const currentRating = getUserRating(eventId) || 0;
                      return (
                        <button
                          key={starValue}
                          onClick={() => rateEvent(eventId, starValue)}
                          className="transition-colors hover:scale-110"
                        >
                          <Star
                            className={cn(
                              "w-5 h-5",
                              starValue <= currentRating
                                ? "text-yellow-500 fill-current"
                                : "text-gray-300 hover:text-yellow-400"
                            )}
                          />
                        </button>
                      );
                    })}
                    <span className="text-sm text-muted-foreground ml-2">
                      {getUserRating(eventId) ? `${getUserRating(eventId)}/5` : "Rate this event"}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((starValue) => (
                      <Star
                        key={starValue}
                        className="w-5 h-5 text-gray-300"
                      />
                    ))}
                    <span className="text-sm text-muted-foreground ml-2">
                      {!isEventFinished(eventId)
                        ? "Available after event ends"
                        : "You must attend to rate"}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border bg-muted/20">
          <div className="space-y-3">
            {/* Main action button */}
            <Button 
              onClick={handleJoinToggle}
              className={cn(
                "w-full h-12 rounded-xl font-semibold",
                isJoined 
                  ? "bg-red-500 hover:bg-red-600 text-white" 
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              )}
            >
              {isJoined ? (
                <>
                  <Calendar className="w-5 h-5 mr-2" />
                  Leave Event
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5 mr-2" />
                  Join Trybe
                </>
              )}
            </Button>

            {/* Secondary actions */}
            <div className="flex space-x-3">
              <Button
                onClick={handleConnect}
                disabled={isConnected(eventId)}
                variant={isConnected(eventId) ? "outline" : "default"}
                className="flex-1 h-10 rounded-xl"
              >
                {isConnected(eventId) ? (
                  <><Check className="w-4 h-4 mr-2" />Connected</>
                ) : (
                  <><UserPlus className="w-4 h-4 mr-2" />Connect+</>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleShare}
                className="flex-1 h-10 rounded-xl"
              >
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>
      <EditEventModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        event={event}
        onSave={(updates) => updateEvent(eventId!, updates as any, true)}
      />
    </div>
  );
}
