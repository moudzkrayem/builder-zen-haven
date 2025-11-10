import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEvents } from "@/contexts/EventsContext";
import { X, MapPin, Briefcase, GraduationCap } from "lucide-react";
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

  // Build a profile object that prefers real user fields (from Firestore) and falls back
  // to lightweight defaults only when a field is missing. This avoids overwriting
  // authoritative user data with static mock values.
  const userProfile = {
    ...user,
    age: user?.age ?? 28,
  // Only set profession when user provided it; do not use a static placeholder.
  profession: user?.profession ?? user?.jobTitle ?? undefined,
    education: user?.education ?? user?.school ?? "UC Berkeley",
    location: user?.location ?? user?.city ?? "San Francisco, CA",
    bio:
      user?.bio ??
      "Love exploring new places and meeting creative minds. Always up for a good conversation about design, travel, or life! ✨",
    interests: Array.isArray(user?.interests) && user.interests.length > 0
      ? user.interests
      : ["Design", "Coffee", "Travel", "Photography", "Hiking", "Art"],
    photos:
      Array.isArray(user?.photos) && user.photos.length > 0
        ? user.photos
        : [user?.image].filter(Boolean).concat([
            "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop",
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop",
          ]),
    stats: {
      eventsAttended: user?.stats?.eventsAttended ?? user?.eventsAttended ?? 23,
      connections: user?.stats?.connections ?? user?.connections ?? 89,
      rating: user?.stats?.rating ?? user?.rating ?? 4.8,
    },
  };

  // Adaptive bottom padding: measure the app's fixed bottom nav (if present)
  // and add a small gap so the modal content always clears it on small screens.
  const [contentPaddingBottom, setContentPaddingBottom] = useState<string>('calc(env(safe-area-inset-bottom, 0px) + 8rem)');
  const [detectedNavHeight, setDetectedNavHeight] = useState<number | null>(null);

  useEffect(() => {
    const gap = 12; // px gap so content isn't flush to the nav

    const update = () => {
      try {
        // Prefer the explicit BottomNavigation root by matching the fixed bottom container
        let navEl: Element | null = document.querySelector('div.fixed.bottom-0.left-0.right-0');

        // Fallback to detecting the grid container inside the nav (class-based)
        if (!navEl) navEl = document.querySelector('.grid.grid-cols-5.h-20');

        let h = 0;
        if (navEl instanceof HTMLElement) {
          const rect = navEl.getBoundingClientRect();
          // only use the measurement if element is visible and attached
          if (rect.height > 0) h = Math.ceil(rect.height);
        }

        setDetectedNavHeight(h || null);
        setContentPaddingBottom(`calc(env(safe-area-inset-bottom, 0px) + ${h + gap}px)`);
      } catch (e) {
        // noop: keep the fallback padding
      }
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    // Also update when the page becomes visible (e.g., switching tabs/devtools)
    document.addEventListener('visibilitychange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  return (
    // Anchor to bottom on small screens, but center on large (desktop/laptop).
    // Also allow the overlay to scroll on small devices and leave extra bottom padding on large screens
    // to avoid overlapping fixed bottom nav.
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end lg:items-center justify-center p-0 lg:p-4 lg:pb-16 overflow-y-auto overscroll-contain"
      style={{ WebkitOverflowScrolling: 'touch' as any, touchAction: 'pan-y', height: '100dvh' }}
    >
      <div
        className="bg-card rounded-t-3xl lg:rounded-3xl w-full max-w-lg lg:max-h-[calc(100vh-120px)] lg:h-[calc(100vh-120px)] overflow-hidden mx-4 lg:mx-0 flex flex-col relative"
        style={{ maxHeight: 'min(85vh, 100dvh)' }}
      >
        {/* Header: place the profile image in normal flow so the modal can scroll correctly */}
        <div className="relative bg-gradient-to-r from-primary/20 to-accent/20">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="absolute top-4 right-4 text-white bg-black/20 hover:bg-black/30"
          >
            <X className="w-5 h-5" />
          </Button>
          <div className="pt-6 pb-4 pl-6">
            <div className="relative inline-block -translate-y-3">
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
            {/* Spacer to guarantee scrollable content can clear fixed bottom nav on small screens */}
            <div className="h-32 lg:hidden" aria-hidden />
          </div>
        </div>

        {/* Content */}
  <div className="p-6 pt-6 lg:pt-6 overflow-y-auto flex-1 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch', paddingBottom: contentPaddingBottom }}>
          {/* Basic Info */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="text-2xl font-bold">
                  {userProfile.name}, {userProfile.age}
                </h2>
                <div className="flex items-center space-x-4 mt-1 text-muted-foreground">
                  {userProfile.profession && (
                    <div className="flex items-center space-x-1">
                      <Briefcase className="w-4 h-4" />
                      <span className="text-sm">{userProfile.profession}</span>
                    </div>
                  )}
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

          {/* Stats removed per design: events, connections, rating are hidden for chat participant profiles */}

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

        {/* Footer spacer removed: actions (Connect / Message) intentionally omitted for chat participant profiles.
            We keep a safe bottom padding on the scrollable content so the modal never overlaps the app's fixed nav on small screens. */}
      </div>
    </div>
  );
}
