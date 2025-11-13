import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Bell, MessageSquare, Calendar, Users, Heart, Volume2 } from "lucide-react";

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const [settings, setSettings] = useState({
    newTrybes: true,
    messages: true,
    eventReminders: true,
    profileViews: false,
    newConnections: true,
    eventUpdates: true,
    promotions: false,
    soundEffects: true,
    vibration: true,
    pushNotifications: true,
  });

  if (!isOpen) return null;

  const updateSetting = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const notificationCategories = [
    {
      title: "Social",
      items: [
        {
          key: "newTrybes",
          icon: Users,
          label: "New Trybes",
          description: "When new events match your interests",
        },
        {
          key: "messages",
          icon: MessageSquare,
          label: "Messages",
          description: "New messages from other users",
        },
        {
          key: "newConnections",
          icon: Heart,
          label: "New Connections",
          description: "When someone joins your event",
        },
        {
          key: "profileViews",
          icon: Users,
          label: "Profile Views",
          description: "When someone views your profile",
        },
      ],
    },
    {
      title: "Events",
      items: [
        {
          key: "eventReminders",
          icon: Calendar,
          label: "Event Reminders",
          description: "Reminders for upcoming events",
        },
        {
          key: "eventUpdates",
          icon: Bell,
          label: "Event Updates",
          description: "Changes to events you've joined",
        },
      ],
    },
    {
      title: "Marketing",
      items: [
        {
          key: "promotions",
          icon: Bell,
          label: "Promotions",
          description: "Special offers and new features",
        },
      ],
    },
    {
      title: "Device",
      items: [
        {
          key: "pushNotifications",
          icon: Bell,
          label: "Push Notifications",
          description: "Allow notifications on this device",
        },
        {
          key: "soundEffects",
          icon: Volume2,
          label: "Sound Effects",
          description: "Play sounds for notifications",
        },
        {
          key: "vibration",
          icon: Bell,
          label: "Vibration",
          description: "Vibrate for notifications",
        },
      ],
    },
  ];

  return (
    <div className="fixed inset-x-0 top-0 bottom-20 z-50 bg-background/80 backdrop-blur-sm">
      <div className="absolute inset-x-4 top-8 bottom-8 bg-card rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Notifications</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {notificationCategories.map((category) => (
            <div key={category.title}>
              <h3 className="text-lg font-semibold mb-4">{category.title}</h3>
              <div className="space-y-3">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 rounded-xl border border-border"
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{item.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={settings[item.key as keyof typeof settings]}
                        onCheckedChange={(checked) => updateSetting(item.key, checked)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/20">
          <Button onClick={onClose} className="w-full">
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
