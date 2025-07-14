import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Camera,
  Edit3,
  MapPin,
  Briefcase,
  GraduationCap,
  Star,
  Plus,
  Heart,
  Users,
  Calendar,
} from "lucide-react";

// Mock user data
const mockUser = {
  name: "Jamie Taylor",
  age: 25,
  profession: "UX Designer",
  education: "Stanford University",
  location: "San Francisco, CA",
  bio: "Adventure seeker and coffee enthusiast ☕️ Love exploring new places and meeting creative minds. Always up for a good conversation about design, travel, or life! ✨",
  photos: [
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop",
  ],
  interests: [
    "Design",
    "Coffee",
    "Travel",
    "Photography",
    "Hiking",
    "Art",
    "Music",
    "Yoga",
  ],
  stats: {
    eventsAttended: 47,
    connectionseMade: 128,
    profileViews: 256,
  },
};

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="h-full bg-background overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Profile</h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit3 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 pb-6">
        {/* Profile photos */}
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-2 mb-4">
            {mockUser.photos.map((photo, index) => (
              <div
                key={index}
                className="relative aspect-[3/4] rounded-2xl overflow-hidden"
              >
                <img
                  src={photo}
                  alt={`Profile ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {isEditing && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {isEditing && (
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl border-dashed"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Photo
            </Button>
          )}
        </div>

        {/* Basic info */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold">
                {mockUser.name}, {mockUser.age}
              </h2>
              <div className="flex items-center space-x-4 mt-2 text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Briefcase className="w-4 h-4" />
                  <span className="text-sm">{mockUser.profession}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{mockUser.location}</span>
                </div>
              </div>
            </div>
            {isEditing && (
              <Button variant="ghost" size="icon">
                <Edit3 className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-1 mb-4">
            <GraduationCap className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {mockUser.education}
            </span>
            {isEditing && (
              <Button variant="ghost" size="sm" className="p-1 h-auto">
                <Edit3 className="w-3 h-3" />
              </Button>
            )}
          </div>

          {/* Bio */}
          <div className="relative">
            <p className="text-foreground leading-relaxed">{mockUser.bio}</p>
            {isEditing && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-0 right-0"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-accent/50 rounded-2xl">
            <div className="text-2xl font-bold text-primary mb-1">
              {mockUser.stats.eventsAttended}
            </div>
            <div className="text-xs text-muted-foreground">Events</div>
          </div>
          <div className="text-center p-4 bg-accent/50 rounded-2xl">
            <div className="text-2xl font-bold text-primary mb-1">
              {mockUser.stats.connectionseMade}
            </div>
            <div className="text-xs text-muted-foreground">Connections</div>
          </div>
          <div className="text-center p-4 bg-accent/50 rounded-2xl">
            <div className="text-2xl font-bold text-primary mb-1">
              {mockUser.stats.profileViews}
            </div>
            <div className="text-xs text-muted-foreground">Profile Views</div>
          </div>
        </div>

        {/* Interests */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Interests</h3>
            {isEditing && (
              <Button variant="ghost" size="sm">
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {mockUser.interests.map((interest, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="px-3 py-1 rounded-full text-sm"
              >
                {interest}
                {isEditing && (
                  <button className="ml-2 text-muted-foreground hover:text-destructive">
                    ×
                  </button>
                )}
              </Badge>
            ))}
            {isEditing && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full h-8 px-3"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90">
            <Heart className="w-5 h-5 mr-2" />
            Preview My Profile
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-12 rounded-xl">
              <Users className="w-5 h-5 mr-2" />
              My Events
            </Button>
            <Button variant="outline" className="h-12 rounded-xl">
              <Calendar className="w-5 h-5 mr-2" />
              Schedule
            </Button>
          </div>
        </div>

        {/* Settings sections */}
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-semibold">Account</h3>
          <div className="space-y-2">
            {[
              "Privacy Settings",
              "Notification Preferences",
              "Discovery Settings",
              "Subscription",
              "Help & Support",
            ].map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start h-12 rounded-xl text-foreground"
              >
                {item}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
