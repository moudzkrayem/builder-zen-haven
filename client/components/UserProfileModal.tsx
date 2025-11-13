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

  // Build a profile object from real user data fetched from Firestore
  console.log('UserProfileModal received user prop:', user);
  
  // Combine interests from thingsYouDoGreat and thingsYouWantToTry (same as Profile page)
  const combinedInterests: string[] = [
    ...(user?.thingsYouDoGreat || []),
    ...(user?.thingsYouWantToTry || []),
  ];
  
  const userProfile = {
    ...user,
    name: user?.displayName || user?.name || user?.firstName || 'User',
    age: user?.age || user?.birthDate ? new Date().getFullYear() - new Date(user.birthDate).getFullYear() : undefined,
    profession: user?.profession || user?.jobTitle || user?.work,
    education: user?.education || user?.school || user?.university,
    location: user?.location || user?.city || (user?.address ? `${user.address.city}, ${user.address.state}` : undefined),
    bio: user?.bio || user?.about || user?.description,
    interests: combinedInterests.length > 0
      ? combinedInterests
      : Array.isArray(user?.interests) && user.interests.length > 0
      ? user.interests
      : Array.isArray(user?.hobbies) && user.hobbies.length > 0
      ? user.hobbies
      : [],
    photos: Array.isArray(user?.photos) && user.photos.length > 0
      ? user.photos
      : [user?.image, user?.photoURL, user?.profileImage].filter(Boolean),
    stats: {
      eventsAttended: user?.stats?.eventsAttended ?? user?.eventsAttended ?? 0,
      connections: user?.stats?.connections ?? user?.connections ?? 0,
      rating: user?.stats?.rating ?? user?.rating ?? 0,
    },
    isHost: user?.isHost,
  };
  
  console.log('UserProfileModal computed userProfile:', userProfile);
  console.log('UserProfileModal interests:', userProfile.interests);

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

  // Body scroll lock while profile modal is open (ref-counted)
  useEffect(() => {
    const w = window as any;
    w.__modalOpenCount = w.__modalOpenCount || 0;
    if (isOpen) {
      w.__modalOpenCount += 1;
      if (w.__modalOpenCount === 1) document.body.style.overflow = 'hidden';
    }
    return () => {
      if (isOpen) {
        w.__modalOpenCount = Math.max(0, (w.__modalOpenCount || 1) - 1);
        if (w.__modalOpenCount === 0) document.body.style.overflow = '';
      }
    };
  }, [isOpen]);

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
                  {userProfile.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{userProfile.location}</span>
                    </div>
                  )}
                </div>
              </div>
              {userProfile.isHost && (
                <Badge className="bg-primary text-primary-foreground">
                  Host
                </Badge>
              )}
            </div>

            {userProfile.education && (
              <div className="flex items-center space-x-1 mb-3">
                <GraduationCap className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {userProfile.education}
                </span>
              </div>
            )}

            {userProfile.bio && (
              <p className="text-foreground leading-relaxed text-sm">
                {userProfile.bio}
              </p>
            )}
          </div>

          {/* Stats removed per design: events, connections, rating are hidden for chat participant profiles */}

          {/* Photos */}
          {userProfile.photos && userProfile.photos.length > 0 && (
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
          )}

          {/* Interests */}
          {userProfile.interests && userProfile.interests.length > 0 && (
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
          )}
        </div>

        {/* Footer spacer removed: actions (Connect / Message) intentionally omitted for chat participant profiles.
            We keep a safe bottom padding on the scrollable content so the modal never overlaps the app's fixed nav on small screens. */}
      </div>
    </div>
  );
}
