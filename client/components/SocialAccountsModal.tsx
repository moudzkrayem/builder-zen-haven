import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Link, Check, Instagram, Facebook } from "lucide-react";

interface SocialAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Custom TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const socialAccounts = [
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
    connected: false,
    username: "",
  },
  {
    id: "tiktok", 
    name: "TikTok",
    icon: TikTokIcon,
    color: "bg-black",
    connected: false,
    username: "",
  },
  {
    id: "facebook",
    name: "Facebook", 
    icon: Facebook,
    color: "bg-blue-600",
    connected: false,
    username: "",
  },
];

export default function SocialAccountsModal({ isOpen, onClose }: SocialAccountsModalProps) {
  const [accounts, setAccounts] = useState(socialAccounts);
  const [showInProfile, setShowInProfile] = useState(true);

  if (!isOpen) return null;

  const toggleConnection = (accountId: string) => {
    setAccounts(prev => 
      prev.map(account => 
        account.id === accountId 
          ? { ...account, connected: !account.connected, username: account.connected ? "" : `@user_${account.id}` }
          : account
      )
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="absolute inset-x-4 top-8 bottom-8 bg-card rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <Link className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Social Accounts</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description */}
          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
            <h3 className="font-semibold text-primary mb-2">Connect Your Social Media</h3>
            <p className="text-sm text-muted-foreground">
              Link your social accounts to show them on your profile and help others connect with you outside of Trybe.
            </p>
          </div>

          {/* Show in Profile Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-border">
            <div>
              <div className="font-medium">Show on Profile</div>
              <div className="text-sm text-muted-foreground">
                Display connected accounts on your public profile
              </div>
            </div>
            <Switch
              checked={showInProfile}
              onCheckedChange={setShowInProfile}
            />
          </div>

          {/* Social Accounts */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Available Platforms</h3>
            {accounts.map((account) => {
              const Icon = account.icon;
              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-border"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full ${account.color} flex items-center justify-center text-white`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-medium flex items-center space-x-2">
                        <span>{account.name}</span>
                        {account.connected && (
                          <Check className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {account.connected ? account.username : "Not connected"}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => toggleConnection(account.id)}
                    variant={account.connected ? "outline" : "default"}
                    size="sm"
                  >
                    {account.connected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Connected Summary */}
          {accounts.some(account => account.connected) && (
            <div className="p-4 rounded-xl bg-muted/50">
              <h4 className="font-semibold mb-2">Connected Accounts</h4>
              <div className="flex flex-wrap gap-2">
                {accounts
                  .filter(account => account.connected)
                  .map(account => (
                    <Badge key={account.id} variant="secondary" className="text-xs">
                      {account.name}: {account.username}
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="p-4 rounded-xl border border-border bg-muted/20">
            <h4 className="font-medium mb-2">Privacy & Security</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• We only display your username, not private content</li>
              <li>• You can disconnect any account at any time</li>
              <li>• Your social media passwords are never stored</li>
              <li>• Connected accounts help verify your identity</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/20">
          <Button onClick={onClose} className="w-full">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
