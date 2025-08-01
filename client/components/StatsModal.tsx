import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEvents } from "@/contexts/EventsContext";
import { 
  X, 
  Calendar, 
  Users, 
  Eye, 
  MapPin, 
  Clock, 
  Star,
  Crown,
  Lock,
  UserPlus,
  Check 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "events" | "connections" | "views" | null;
}

const mockProfileViewers = [
  {
    id: 1,
    name: "Sarah Johnson",
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop",
    viewedAt: "2 hours ago",
    location: "San Francisco, CA"
  },
  {
    id: 2,
    name: "Mike Chen",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    viewedAt: "1 day ago",
    location: "Oakland, CA"
  },
  {
    id: 3,
    name: "Emma Wilson",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    viewedAt: "3 days ago",
    location: "Berkeley, CA"
  }
];

export default function StatsModal({ isOpen, onClose, type }: StatsModalProps) {
  const { events, joinedEvents, connections, getUserRating, rateEvent, addConnection, isConnected } = useEvents();

  if (!isOpen || !type) return null;

  const attendedEvents = events.filter(event => joinedEvents.includes(event.id));

  const renderContent = () => {
    switch (type) {
      case "events":
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Calendar className="w-12 h-12 text-primary mx-auto mb-2" />
              <h3 className="text-lg font-semibold">My Events</h3>
              <p className="text-sm text-muted-foreground">
                {attendedEvents.length} events attended
              </p>
            </div>
            
            {attendedEvents.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No events attended yet</h3>
                <p className="text-muted-foreground">
                  Join events to see them here!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {attendedEvents.map((event) => (
                  <div key={event.id} className="p-4 rounded-xl border border-border bg-card">
                    <div className="flex space-x-3">
                      <img
                        src={event.image}
                        alt={event.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{event.eventName || event.name}</h4>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>{event.location}</span>
                          <Clock className="w-3 h-3" />
                          <span>{event.date}</span>
                        </div>
                        {/* Rating */}
                        <div className="flex items-center space-x-1 mt-2">
                          {[1, 2, 3, 4, 5].map((starValue) => {
                            const currentRating = getUserRating(event.id) || 0;
                            return (
                              <button
                                key={starValue}
                                onClick={() => rateEvent(event.id, starValue)}
                                className="transition-colors hover:scale-110"
                              >
                                <Star
                                  className={cn(
                                    "w-3 h-3",
                                    starValue <= currentRating
                                      ? "text-yellow-500 fill-current"
                                      : "text-gray-300 hover:text-yellow-400"
                                  )}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <Button
                        onClick={() => addConnection(event.id)}
                        disabled={isConnected(event.id)}
                        size="sm"
                        variant={isConnected(event.id) ? "outline" : "default"}
                        className="text-xs h-7"
                      >
                        {isConnected(event.id) ? (
                          <><Check className="w-3 h-3 mr-1" />Connected</>
                        ) : (
                          <><UserPlus className="w-3 h-3 mr-1" />Connect</>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "connections":
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Users className="w-12 h-12 text-primary mx-auto mb-2" />
              <h3 className="text-lg font-semibold">My Connections</h3>
              <p className="text-sm text-muted-foreground">
                {connections.length} connections made
              </p>
            </div>
            
            {connections.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No connections yet</h3>
                <p className="text-muted-foreground">
                  Connect with event hosts to see them here!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {connections.map((connection) => (
                  <div key={connection.id} className="p-4 rounded-xl border border-border bg-card">
                    <div className="flex space-x-3">
                      <img
                        src={connection.image}
                        alt={connection.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold">{connection.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Connected from: {connection.eventName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(connection.connectedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="text-xs">
                          Message
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs">
                          Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "views":
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <Crown className="w-6 h-6 text-yellow-500 absolute -top-1 -right-1" />
              </div>
              <h3 className="text-lg font-semibold">Profile Views</h3>
              <p className="text-sm text-muted-foreground">
                Premium Feature
              </p>
            </div>
            
            <div className="text-center py-8 border-2 border-dashed border-yellow-300 rounded-xl bg-yellow-50 dark:bg-yellow-900/10">
              <Lock className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-yellow-700 dark:text-yellow-300">
                Premium Feature
              </h3>
              <p className="text-yellow-600 dark:text-yellow-400 mb-4">
                Upgrade to see who viewed your profile
              </p>
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-white">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Premium
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground text-center">
              Preview: See who's checking out your profile with Premium
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (type) {
      case "events": return "My Events";
      case "connections": return "My Connections";
      case "views": return "Profile Views";
      default: return "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="absolute inset-x-4 top-8 bottom-8 bg-card rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold">{getTitle()}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/20">
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
