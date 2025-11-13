import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Link, Check, Instagram, Facebook, Edit2, Save } from "lucide-react";
import { auth, db } from "@/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

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
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [tempUsername, setTempUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load social accounts from Firestore when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSocialAccounts();
    }
  }, [isOpen]);

  const loadSocialAccounts = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const socialData = data.socialAccounts || {};
        const showInProfileData = data.showSocialInProfile ?? true;

        setShowInProfile(showInProfileData);
        setAccounts(socialAccounts.map(account => ({
          ...account,
          connected: !!socialData[account.id],
          username: socialData[account.id] || "",
        })));
      }
    } catch (error) {
      console.error("Error loading social accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSocialAccounts = async () => {
    setIsSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to save changes.",
          variant: "destructive",
        });
        return;
      }

      const socialData: Record<string, string> = {};
      accounts.forEach(account => {
        if (account.connected && account.username) {
          socialData[account.id] = account.username;
        }
      });

      await updateDoc(doc(db, 'users', user.uid), {
        socialAccounts: socialData,
        showSocialInProfile: showInProfile,
        updatedAt: new Date().toISOString(),
      });

      // Update localStorage
      const stored = localStorage.getItem('userProfile');
      if (stored) {
        const profile = JSON.parse(stored);
        profile.socialAccounts = socialData;
        profile.showSocialInProfile = showInProfile;
        localStorage.setItem('userProfile', JSON.stringify(profile));
      }

      toast({
        title: "Success",
        description: "Social accounts updated successfully!",
      });

      onClose();
    } catch (error: any) {
      console.error("Error saving social accounts:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save social accounts.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const startEditing = (accountId: string, currentUsername: string) => {
    setEditingAccount(accountId);
    setTempUsername(currentUsername);
  };

  const saveUsername = (accountId: string) => {
    if (!tempUsername.trim()) {
      toast({
        title: "Error",
        description: "Username cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setAccounts(prev =>
      prev.map(account =>
        account.id === accountId
          ? { ...account, connected: true, username: tempUsername.trim() }
          : account
      )
    );
    setEditingAccount(null);
    setTempUsername("");
  };

  const disconnectAccount = (accountId: string) => {
    setAccounts(prev =>
      prev.map(account =>
        account.id === accountId
          ? { ...account, connected: false, username: "" }
          : account
      )
    );
  };

  return (
    <div className="fixed inset-x-0 top-0 bottom-20 z-50 bg-background/80 backdrop-blur-sm">
      <div className="absolute inset-x-2 sm:inset-x-4 top-4 sm:top-8 bottom-4 sm:bottom-8 bg-card rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center space-x-3">
            <Link className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold">Social Accounts</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 sm:space-y-6">
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
              const isEditing = editingAccount === account.id;
              
              return (
                <div
                  key={account.id}
                  className="p-4 rounded-xl border border-border space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full ${account.color} flex items-center justify-center text-white flex-shrink-0`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-medium flex items-center space-x-2">
                          <span>{account.name}</span>
                          {account.connected && (
                            <Check className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        {!isEditing && (
                          <div className="text-sm text-muted-foreground">
                            {account.connected ? account.username : "Not connected"}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {!isEditing && (
                      <div className="flex space-x-2">
                        {account.connected && (
                          <Button
                            onClick={() => startEditing(account.id, account.username)}
                            variant="ghost"
                            size="sm"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          onClick={() => account.connected ? disconnectAccount(account.id) : startEditing(account.id, "")}
                          variant={account.connected ? "outline" : "default"}
                          size="sm"
                        >
                          {account.connected ? "Disconnect" : "Connect"}
                        </Button>
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <div className="flex space-x-2">
                      <Input
                        value={tempUsername}
                        onChange={(e) => setTempUsername(e.target.value)}
                        placeholder={`@${account.id}_username`}
                        className="flex-1"
                        autoFocus
                        onKeyPress={(e) => e.key === "Enter" && saveUsername(account.id)}
                      />
                      <Button
                        onClick={() => saveUsername(account.id)}
                        size="sm"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingAccount(null);
                          setTempUsername("");
                        }}
                        variant="ghost"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
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
        <div className="p-4 sm:p-6 border-t border-border bg-muted/20 flex-shrink-0">
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={saveSocialAccounts} className="flex-1" disabled={isSaving || isLoading}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
