import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEvents } from "@/contexts/EventsContext";
import ProfileVisibilityModal from "@/components/ProfileVisibilityModal";
import EditProfileModal from "@/components/EditProfileModal";
import SocialAccountsModal from "@/components/SocialAccountsModal";
import StatsModal from "@/components/StatsModal";
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
  Clock,
  DollarSign,
  Crown,
  Lock,
  UserPlus,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { events, joinedEvents, getUserRating, rateEvent, connections, addConnection, isConnected, canRateEvent, isEventFinished, friends, getFriendsOf, setSharePreferenceForUser } = useEvents();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "events">("profile");
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState<"events" | "connections" | "views" | null>(null);
  const navigate = useNavigate();

  const [profile, setProfile] = useState<any | null>(null);
  useEffect(() => {
    try {
      const stored = localStorage.getItem('userProfile');
      if (stored) setProfile(JSON.parse(stored));
    } catch {}
  }, []);

  const profileName = profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : "";
  let profilePhotos: string[] = profile?.photos || [];
  if (!profilePhotos.length) {
    try {
      profilePhotos = JSON.parse(sessionStorage.getItem('userProfilePhotos') || '[]');
    } catch { profilePhotos = []; }
  }
  const profileInterests: string[] = [
    ...(profile?.thingsYouDoGreat || []),
    ...(profile?.thingsYouWantToTry || []),
  ];

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
              onClick={() => setShowEditModal(true)}
            >
              <Edit3 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/settings") }>
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-[73px] z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex px-4 py-2">
          <button
            onClick={() => setActiveTab("profile")}
            className={cn(
              "flex-1 text-center py-3 px-2 rounded-lg font-medium transition-all duration-200 text-sm",
              activeTab === "profile"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={cn(
              "flex-1 text-center py-3 px-2 rounded-lg font-medium transition-all duration-200 text-sm",
              activeTab === "events"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            Previous Events
          </button>
        </div>
      </div>

      <div className="px-4 pb-6">
        {activeTab === "profile" ? (
          <>
            {/* Profile photos */}
            <div className="mb-6 mt-6">
              <div className="grid grid-cols-3 gap-2 mb-4">
                {profilePhotos.map((photo, index) => (
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
                    {profileName || ""}{profile?.age ? `, ${profile.age}` : ""}
                  </h2>
                  <div className="flex items-center space-x-4 mt-2 text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Briefcase className="w-4 h-4" />
                      <span className="text-sm">{profile?.occupation || ""}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{profile?.location || ""}</span>
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
                  {profile?.education || ""}
                </span>
                {isEditing && (
                  <Button variant="ghost" size="sm" className="p-1 h-auto">
                    <Edit3 className="w-3 h-3" />
                  </Button>
                )}
              </div>

              {/* Bio */}
              <div className="relative">
                <p className="text-foreground leading-relaxed">{profile?.bio || ""}</p>
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
              <button
                onClick={() => setShowStatsModal("events")}
                className="text-center p-4 bg-accent/50 rounded-2xl hover:bg-accent/70 transition-colors"
              >
                <div className="text-2xl font-bold text-primary mb-1">
                  {joinedEvents.length}
                </div>
                <div className="text-xs text-muted-foreground">Events</div>
              </button>
              <button
                onClick={() => setShowStatsModal("connections")}
                className="text-center p-4 bg-accent/50 rounded-2xl hover:bg-accent/70 transition-colors"
              >
                <div className="text-2xl font-bold text-primary mb-1">
                  {connections.length}
                </div>
                <div className="text-xs text-muted-foreground">Connections</div>
              </button>
              <button
                onClick={() => setShowStatsModal("views")}
                className="relative text-center p-4 bg-accent/50 rounded-2xl hover:bg-accent/70 transition-colors"
              >
                <div className="text-2xl font-bold text-muted-foreground mb-1">
                  <Lock className="w-6 h-6 mx-auto" />
                </div>
                <div className="text-xs text-muted-foreground">Profile Views</div>
                <div className="absolute top-2 right-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                </div>
                <div className="text-xs text-yellow-600 mt-1 font-medium">
                  Premium
                </div>
              </button>
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
                {profileInterests.map((interest, index) => (
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
              <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90" onClick={() => setActiveTab("profile")}>
                <Heart className="w-5 h-5 mr-2" />
                Preview My Profile
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12 rounded-xl" onClick={() => { sessionStorage.setItem('openScheduleOnLoad','true'); navigate('/home'); }}>
                  <Users className="w-5 h-5 mr-2" />
                  My Events
                </Button>
                <Button variant="outline" className="h-12 rounded-xl" onClick={() => { sessionStorage.setItem('openScheduleOnLoad','true'); navigate('/home'); }}>
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
                <Button
                  variant="ghost"
                  onClick={() => setShowVisibilityModal(true)}
                  className="w-full justify-start h-12 rounded-xl text-foreground"
                >
                  Discovery Settings
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowSocialModal(true)}
                  className="w-full justify-start h-12 rounded-xl text-foreground"
                >
                  Social Accounts
                </Button>

              </div>
            </div>

          </>
        ) : (
          <>
            {/* Previous Events Content */}
            <div className="mt-6">
              <h2 className="text-2xl font-bold mb-6">Previous Events</h2>
              {joinedEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No events attended yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start joining events to see your history here!
                  </p>
                  <Button className="rounded-xl">
                    <Users className="w-4 h-4 mr-2" />
                    Discover Events
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {events
                    .filter((event) => joinedEvents.includes(event.id))
                    .map((event) => (
                      <div
                        key={event.id}
                        className="bg-card rounded-2xl p-4 border border-border"
                      >
                        <div className="flex space-x-4">
                          <img
                            src={event.image}
                            alt={event.name}
                            className="w-20 h-20 rounded-xl object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">
                              {event.eventName || event.name}
                            </h3>
                            <div className="flex items-center space-x-3 text-sm text-muted-foreground mb-2">
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{event.location}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{event.date}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                <Users className="w-4 h-4" />
                                <span>{event.attendees} attendees</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="secondary" className="text-xs">
                                  Attended
                                </Badge>
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
                            {/* Personal Rating System */}
                            <div className="mt-3 pt-3 border-t border-border">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Your rating:</span>
                                {canRateEvent(event.id) ? (
                                  <div className="flex items-center space-x-1">
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
                                              "w-4 h-4",
                                              starValue <= currentRating
                                                ? "text-yellow-500 fill-current"
                                                : "text-gray-300 hover:text-yellow-400"
                                            )}
                                          />
                                        </button>
                                      );
                                    })}
                                    <span className="text-xs text-muted-foreground ml-2">
                                      {getUserRating(event.id) ? `${getUserRating(event.id)}/5` : "Rate"}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-1">
                                    {[1, 2, 3, 4, 5].map((starValue) => (
                                      <Star
                                        key={starValue}
                                        className="w-4 h-4 text-gray-300"
                                      />
                                    ))}
                                    <span className="text-xs text-muted-foreground ml-2">
                                      {!isEventFinished(event.id)
                                        ? "After event ends"
                                        : "Attend to rate"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <ProfileVisibilityModal
        isOpen={showVisibilityModal}
        onClose={() => setShowVisibilityModal(false)}
      />
      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        userData={{
          name: profileName || "",
          age: profile?.age || 0,
          profession: profile?.occupation || "",
          education: profile?.education || "",
          location: profile?.location || "",
          bio: profile?.bio || "",
          interests: profileInterests,
        }}
      />
      <SocialAccountsModal
        isOpen={showSocialModal}
        onClose={() => setShowSocialModal(false)}
      />
      <StatsModal
        isOpen={showStatsModal !== null}
        onClose={() => setShowStatsModal(null)}
        type={showStatsModal}
      />
    </div>
  );
}
