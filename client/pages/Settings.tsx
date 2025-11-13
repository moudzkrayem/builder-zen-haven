import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/ThemeProvider";
import HelpSupportModal from "@/components/HelpSupportModal";
import SocialLinksModal from "@/components/SocialLinksModal";
import PrivacyPolicyModal from "@/components/PrivacyPolicyModal";
import TermsOfServiceModal from "@/components/TermsOfServiceModal";
import {
  ArrowLeft,
  Bell,
  Shield,
  Eye,
  Globe,
  Heart,
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
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useToast } from '@/hooks/use-toast';

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
        icon: Globe,
        label: "Language",
        description: "English (US)",
        type: "navigation",
      },
    ],
  },
  {
    title: "Account",
    items: [
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
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [showHelpSupportModal, setShowHelpSupportModal] = useState(false);
  const [showSocialLinksModal, setShowSocialLinksModal] = useState(false);
  const [showPrivacyPolicyModal, setShowPrivacyPolicyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
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
            if (mounted) {
              setUserProfile(data);
            }
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
  const { toast } = useToast();

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
            <div className="flex-1">
              <h2 className="text-xl font-bold">{userProfile ? (userProfile.firstName || userProfile.displayName || userProfile.name || 'You') + (userProfile?.lastName ? ` ${userProfile.lastName}` : '') : 'You'}</h2>
              <p className="text-muted-foreground">
                {userProfile?.location ? `${userProfile.location} • ` : ''}{(userProfile?.joinedEvents?.length) ?? '0'} events
              </p>
            </div>
          </div>
        </div>

        {/* Settings groups */}
        <div className="space-y-6">
          {settingsGroups.map((group, groupIndex) => (
            <div key={groupIndex} data-section={group.title}>
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
                            // Help & Support
                            if (item.label === "Help & Support") {
                              setShowHelpSupportModal(true);
                              return;
                            }

                            // Social Accounts / Linked Accounts
                            if (item.label === "Linked Accounts") {
                              setShowSocialLinksModal(true);
                              return;
                            }

                            // Sign Out
                            if (item.label === "Sign Out") {
                              try {
                                await logout();
                              } catch (err) {
                                console.warn('Settings: logout failed', err);
                              }
                              try {
                                localStorage.removeItem('trybes_cache_v1');
                                localStorage.removeItem('userProfile');
                                sessionStorage.removeItem('openScheduleOnLoad');
                              } catch (e) {}
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
            <button 
              className="hover:text-primary transition-colors"
              onClick={() => setShowPrivacyPolicyModal(true)}
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button 
              className="hover:text-primary transition-colors"
              onClick={() => setShowTermsModal(true)}
            >
              Terms of Service
            </button>
            <span>•</span>
            <button 
              className="hover:text-primary transition-colors"
              onClick={() => setShowHelpSupportModal(true)}
            >
              Support
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <HelpSupportModal
        isOpen={showHelpSupportModal}
        onClose={() => setShowHelpSupportModal(false)}
      />
      <SocialLinksModal
        isOpen={showSocialLinksModal}
        onClose={() => setShowSocialLinksModal(false)}
      />
      <PrivacyPolicyModal
        isOpen={showPrivacyPolicyModal}
        onClose={() => setShowPrivacyPolicyModal(false)}
      />
      <TermsOfServiceModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
    </div>
  );
}
