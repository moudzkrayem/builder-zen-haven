import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/ThemeProvider";
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
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    newMatches: true,
    messages: true,
    eventReminders: true,
    profileViews: false,
  });

  const handleToggle = (settingKey: string, value: boolean) => {
    if (settingKey === "darkMode") {
      setDarkMode(value);
      // Here you would implement actual dark mode toggle
      document.documentElement.classList.toggle("dark", value);
    }
  };

  return (
    <div className="h-full bg-background overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="px-4 pb-6">
        {/* User info card */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/20 rounded-2xl p-6 mb-6 mt-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">
                JT
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">Jamie Taylor</h2>
              <p className="text-muted-foreground">
                San Francisco, CA • 47 events
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className="bg-primary/20 text-primary">Trybe Plus</Badge>
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
                        "flex items-center justify-between p-4 hover:bg-accent/50 transition-colors",
                        !isLast && "border-b border-border",
                        item.type === "action" &&
                          "cursor-pointer active:bg-accent",
                      )}
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
                            {item.badge}
                          </Badge>
                        )}

                        {item.type === "toggle" && (
                          <Switch
                            checked={
                              item.label === "Dark Mode"
                                ? darkMode
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
    </div>
  );
}
