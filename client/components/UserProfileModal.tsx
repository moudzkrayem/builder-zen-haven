import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEvents } from "@/contexts/EventsContext";
import {
  X,
  MapPin,
  Briefcase,
  GraduationCap,
  Star,
  Heart,
  Users,
  MessageSquare,
  UserPlus,
  Check,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onStartPrivateChat: (user: any) => void;
}

export default function UserProfileModal({ 
  isOpen, 
  onClose, 
  user, 
  onStartPrivateChat 
}: UserProfileModalProps) {
  const { addConnection, isConnected } = useEvents();

  if (!isOpen || !user) return null;

  // Mock user profile data
  const userProfile = {
    ...user,
    age: 28,
    profession: "Product Designer",
    education: "UC Berkeley",
    location: "San Francisco, CA",
    bio: "Love exploring new places and meeting creative minds. Always up for a good conversation about design, travel, or life! ✨",
    interests: ["Design", "Coffee", "Travel", "Photography", "Hiking", "Art"],
    photos: [
      user.image,
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop",
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop",
    ],
    stats: {
      eventsAttended: 23,
      connections: 89,
      rating: 4.8,
    },
  };

  const handleConnect = () => {
    addConnection(user.id);
  };

  const handleStartChat = () => {
    onStartPrivateChat(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-r from-primary/20 to-accent/20">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="absolute top-4 right-4 text-white bg-black/20 hover:bg-black/30"
          >
            <X className="w-5 h-5" />
          </Button>
          <div className="absolute -bottom-12 left-6">
            <div className="relative">
              <img
                src={userProfile.image}
                alt={userProfile.name}
                className="w-24 h-24 rounded-full border-4 border-card object-cover"
              />
              <div className={cn(
                "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-card",
                userProfile.status === "online" ? "bg-green-500" : "bg-gray-400"
              )} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-16 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Basic Info */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="text-2xl font-bold">
                  {userProfile.name}, {userProfile.age}
                </h2>
                <div className="flex items-center space-x-4 mt-1 text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Briefcase className="w-4 h-4" />
                    <span className="text-sm">{userProfile.profession}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{userProfile.location}</span>
                  </div>
                </div>
              </div>
              {userProfile.isHost && (
                <Badge className="bg-primary text-primary-foreground">
                  Host
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-1 mb-3">
              <GraduationCap className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {userProfile.education}
              </span>
            </div>

            <p className="text-foreground leading-relaxed text-sm">
              {userProfile.bio}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-accent/20 rounded-xl">
              <div className="text-lg font-bold text-primary">
                {userProfile.stats.eventsAttended}
              </div>
              <div className="text-xs text-muted-foreground">Events</div>
            </div>
            <div className="text-center p-3 bg-accent/20 rounded-xl">
              <div className="text-lg font-bold text-primary">
                {userProfile.stats.connections}
              </div>
              <div className="text-xs text-muted-foreground">Connections</div>
            </div>
            <div className="text-center p-3 bg-accent/20 rounded-xl">
              <div className="flex items-center justify-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-lg font-bold text-primary">
                  {userProfile.stats.rating}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">Rating</div>
            </div>
          </div>

          {/* Photos */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Photos</h3>
            <div className="grid grid-cols-3 gap-2">
              {userProfile.photos.map((photo, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-xl overflow-hidden"
                >
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {userProfile.interests.map((interest, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="px-3 py-1 rounded-full text-sm"
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border bg-muted/20">
          <div className="flex space-x-3">
            <Button
              onClick={handleConnect}
              disabled={isConnected(user.id)}
              variant={isConnected(user.id) ? "outline" : "default"}
              className="flex-1 rounded-xl"
            >
              {isConnected(user.id) ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Connected
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Connect+
                </>
              )}
            </Button>
            <Button
              onClick={handleStartChat}
              variant="outline"
              className="flex-1 rounded-xl"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Message
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
