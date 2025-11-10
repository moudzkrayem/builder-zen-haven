import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/ThemeProvider";
import NotificationsModal from "@/components/NotificationsModal";
import DiscoverySettingsModal from "@/components/DiscoverySettingsModal";
import {
  ArrowLeft,
  Bell,
  Shield,
  Eye,
  Globe,
  Heart,
  CreditCard,
  HelpCircle,
  LogOut,
  Moon,
  Sun,
  Smartphone,
  Volume2,
  MessageSquare,
  MapPin,
  Users,
  Star,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PREMIUM_ENABLED } from '@/lib/featureFlags';
import { useNavigate } from "react-router-dom";
import { auth, logout } from "@/auth";
import { db } from "@/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';

const settingsGroups = [
  {
    title: "Preferences",
    items: [
      {
        icon: Moon,
        label: "Dark Mode",
        description: "Switch between light and dark themes",
        type: "toggle",
        value: false,
      },
      {
        icon: Bell,
        label: "Notifications",
        description: "Manage your notification settings",
        type: "navigation",
        badge: "3 active",
      },
      {
        icon: MapPin,
        label: "Location",
        description: "Update your location preferences",
        type: "navigation",
      },
      {
        icon: Globe,
        label: "Language",
        description: "English (US)",
        type: "navigation",
      },
    ],
  },
  {
    title: "Discovery",
    items: [
      {
        icon: Users,
        label: "Distance",
        description: "Show people within 25 miles",
        type: "navigation",
      },
      {
        icon: Heart,
        label: "Age Range",
        description: "18 - 35 years old",
        type: "navigation",
      },
      {
        icon: Eye,
        label: "Show Me",
        description: "Everyone",
        type: "navigation",
      },
      {
        icon: Star,
        label: "Interests",
        description: "Manage your interests",
        type: "navigation",
      },
    ],
  },
  {
    title: "Privacy & Safety",
    items: [
      {
        icon: Shield,
        label: "Privacy Settings",
        description: "Control who can see your profile",
        type: "navigation",
      },
      {
        icon: MessageSquare,
        label: "Chat Settings",
        description: "Message controls and filters",
        type: "navigation",
      },
      {
        icon: Eye,
        label: "Profile Visibility",
        description: "Manage profile visibility",
        type: "toggle",
        value: true,
      },
      {
        icon: Volume2,
        label: "Sound Effects",
        description: "App sound feedback",
        type: "toggle",
        value: true,
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        icon: CreditCard,
        label: "Subscription",
        description: "Manage your Trybe Plus subscription",
        type: "navigation",
        badge: "Premium",
      },
      {
        icon: Smartphone,
        label: "Linked Accounts",
        description: "Connect social media accounts",
        type: "navigation",
      },
      {
        icon: HelpCircle,
        label: "Help & Support",
        description: "Get help or contact support",
        type: "navigation",
      },
      {
        icon: LogOut,
        label: "Sign Out",
        description: "Sign out of your account",
        type: "action",
        isDestructive: true,
      },
    ],
  },
];

export default function Settings() {
  const { theme, setTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({
    newTrybes: true,
    messages: true,
    eventReminders: true,
    profileViews: false,
  });
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const u = auth.currentUser;
        if (!u) return;
        // Try Firestore users/{uid}
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          if (snap.exists()) {
            const data = snap.data();
            if (mounted) setUserProfile(data);
            return;
          }
        } catch (err) {
          // ignore firestore read errors
        }
        // Fallback to auth user
        if (mounted) setUserProfile({ displayName: u.displayName, photoURL: (u as any).photoURL, email: u.email });
      } catch (err) {
        console.debug('Settings: failed to load user profile', err);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // Upload handler for changing avatar/profile photo
  const handleAvatarFile = async (file?: File | null) => {
    if (!file) return;
    const u = auth.currentUser;
    if (!u) return;
    try {
      setUploading(true);
      setUploadProgress(0);
      const storage = getStorage();
      const path = `userPhotos/${u.uid}/${Date.now()}-${file.name}`;
      const ref = storageRef(storage, path);
      const task = uploadBytesResumable(ref, file);
      await new Promise<void>((resolve, reject) => {
        task.on('state_changed', (snapshot) => {
          if (snapshot.totalBytes) {
            setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
          }
        }, (err) => reject(err), async () => {
          try {
            const url = await getDownloadURL(ref);
            // Persist into Firestore users/{uid} (merge)
            try {
              const userRef = doc(db, 'users', u.uid);
              await setDoc(userRef, { photoURL: url }, { merge: true } as any);
            } catch (err) {
              console.debug('Settings: failed to persist user photoURL to Firestore', err);
            }
            // Keep auth user in sync (best-effort)
            try {
              await updateProfile(u, { photoURL: url } as any);
            } catch (err) {
              // ignore
            }
            // Optimistic UI update
            setUserProfile(prev => ({ ...(prev || {}), photoURL: url }));
            resolve();
          } catch (err) { reject(err); }
        });
      });
    } catch (err) {
      console.debug('Settings: avatar upload failed', err);
      alert('Failed to upload avatar image');
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const onAvatarInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (f) handleAvatarFile(f);
  };
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);

  const handleToggle = (settingKey: string, value: boolean) => {
    if (settingKey === "darkMode") {
      setTheme(value ? "dark" : "light");
    }
  };

  return (
    <div className="h-full bg-background overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="px-4 pb-6">
        {/* User info card (populated from Firestore users/{uid}) */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/20 rounded-2xl p-6 mb-6 mt-4">
          <div className="flex items-center space-x-4">
              <div className="flex flex-col items-start space-y-2">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                  {(() => {
                    const avatarSrc = userProfile?.photoURL || (Array.isArray(userProfile?.photos) && userProfile.photos.length ? userProfile.photos[0] : null);
                    if (avatarSrc) {
                      return (<img src={avatarSrc} alt={userProfile.displayName || userProfile.firstName} className="w-full h-full object-cover" />);
                    }
                    return (
                      <span className="text-2xl font-bold text-primary-foreground">
                        {((userProfile?.firstName || userProfile?.displayName || 'U') || 'U').toString().charAt(0).toUpperCase()}
                      </span>
                    );
                  })()}
                </div>
                <div className="flex items-center space-x-2">
                  <input id="avatar-input" type="file" accept="image/*" onChange={onAvatarInput} className="hidden" />
                  <label htmlFor="avatar-input" className="text-xs cursor-pointer text-primary hover:underline">Change</label>
                  {uploading && <span className="text-xs text-muted-foreground">Uploading {uploadProgress ?? 0}%</span>}
                </div>
              </div>
              <div className="flex-1">
              <h2 className="text-xl font-bold">{userProfile ? (userProfile.firstName || userProfile.displayName || userProfile.name || 'You') + (userProfile?.lastName ? ` ${userProfile.lastName}` : '') : 'You'}</h2>
              <p className="text-muted-foreground">
                {userProfile?.location ? `${userProfile.location} • ` : ''}{(userProfile?.joinedEvents?.length) ?? '0'} events
              </p>
              <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="outline">Verified</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Settings groups */}
        <div className="space-y-6">
          {settingsGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              <h3 className="text-lg font-semibold mb-4 text-foreground">
                {group.title}
              </h3>
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                {group.items.map((item, itemIndex) => {
                  const Icon = item.icon;
                  const isLast = itemIndex === group.items.length - 1;

                  return (
                    <div
                      key={itemIndex}
                      className={cn(
                        "flex items-center justify-between p-4 hover:bg-accent/50 transition-colors cursor-pointer",
                        !isLast && "border-b border-border",
                        item.type === "action" &&
                          "active:bg-accent",
                      )}
                      onClick={async () => {
                          try {
                            if (item.label === "Notifications") {
                              setShowNotificationsModal(true);
                              return;
                            }

                            if (item.label === "Distance" || item.label === "Age Range" || item.label === "Show Me" || item.label === "Interests") {
                              setShowDiscoveryModal(true);
                              return;
                            }

                            if (item.label === "Sign Out") {
                              // Perform logout via auth helper, clear session-local data and navigate to login
                              try {
                                await logout();
                              } catch (err) {
                                console.warn('Settings: logout failed', err);
                              }
                              try {
                                // Clear some local caches and session state
                                localStorage.removeItem('trybes_cache_v1');
                                localStorage.removeItem('userProfile');
                                sessionStorage.removeItem('openScheduleOnLoad');
                              } catch (e) {}
                              // Replace the current history entry with login to reduce chance
                              // the user can navigate back to an authenticated page from
                              // the immediate history stack. We also force a full reload
                              // to ensure in-memory state is cleared.
                              window.location.replace('/login');
                              return;
                            }
                          } catch (err) {
                            console.debug('Settings: item click handler error', err);
                          }
                        }}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            item.isDestructive
                              ? "bg-destructive/10 text-destructive"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4
                            className={cn(
                              "font-medium",
                              item.isDestructive
                                ? "text-destructive"
                                : "text-foreground",
                            )}
                          >
                            {item.label}
                          </h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {item.badge && (
                          <Badge
                            variant={
                              item.badge === "Premium" ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {item.badge === "Premium" ? (PREMIUM_ENABLED ? 'Premium' : 'Premium (disabled)') : item.badge}
                          </Badge>
                        )}

                        {item.type === "toggle" && (
                          <Switch
                            checked={
                              item.label === "Dark Mode"
                                ? isDark
                                : item.value || false
                            }
                            onCheckedChange={(checked) =>
                              handleToggle(
                                item.label === "Dark Mode"
                                  ? "darkMode"
                                  : item.label.toLowerCase(),
                                checked,
                              )
                            }
                          />
                        )}

                        {(item.type === "navigation" ||
                          item.type === "action") && (
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* App info */}
        <div className="mt-8 text-center text-muted-foreground">
          <p className="text-sm mb-2">Trybe v1.0.0</p>
          <div className="flex items-center justify-center space-x-4 text-xs">
            <button className="hover:text-primary transition-colors">
              Privacy Policy
            </button>
            <span>•</span>
            <button className="hover:text-primary transition-colors">
              Terms of Service
            </button>
            <span>•</span>
            <button className="hover:text-primary transition-colors">
              Support
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <NotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
      />
      <DiscoverySettingsModal
        isOpen={showDiscoveryModal}
        onClose={() => setShowDiscoveryModal(false)}
      />
      {/* Subscription modal removed since subscription UI is hidden */}
    </div>
  );
}
