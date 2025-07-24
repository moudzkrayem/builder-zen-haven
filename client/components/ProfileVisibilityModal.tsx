import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { X, Eye, EyeOff, Shield, Users, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileVisibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileVisibilityModal({ isOpen, onClose }: ProfileVisibilityModalProps) {
  const [profileVisible, setProfileVisible] = useState(true);
  const [showAge, setShowAge] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [showProfession, setShowProfession] = useState(true);
  const [showLastActive, setShowLastActive] = useState(false);
  const [preventScreenshots, setPreventScreenshots] = useState(false);
  const [hideFromSearch, setHideFromSearch] = useState(false);
  const [limitMatches, setLimitMatches] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="absolute inset-x-4 top-8 bottom-8 bg-card rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Profile Visibility</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Visibility Toggle */}
          <div className="p-6 rounded-2xl border-2 border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {profileVisible ? (
                  <Eye className="w-6 h-6 text-primary" />
                ) : (
                  <EyeOff className="w-6 h-6 text-muted-foreground" />
                )}
                <div>
                  <h3 className="text-lg font-semibold">Profile Discovery</h3>
                  <p className="text-sm text-muted-foreground">
                    Control if other users can discover your profile
                  </p>
                </div>
              </div>
              <Switch
                checked={profileVisible}
                onCheckedChange={setProfileVisible}
              />
            </div>
            <div className="text-sm text-muted-foreground bg-background/50 p-3 rounded-lg">
              {profileVisible
                ? "Your profile is visible to other users and can appear in their discovery feed."
                : "Your profile is hidden from discovery. Only people you've already matched with can see it."}
            </div>
          </div>

          {/* Information Display */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Information Display</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Show Age</div>
                    <div className="text-sm text-muted-foreground">
                      Display your age on your profile
                    </div>
                  </div>
                </div>
                <Switch
                  checked={showAge}
                  onCheckedChange={setShowAge}
                  disabled={!profileVisible}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Show Location</div>
                    <div className="text-sm text-muted-foreground">
                      Display your city/location on your profile
                    </div>
                  </div>
                </div>
                <Switch
                  checked={showLocation}
                  onCheckedChange={setShowLocation}
                  disabled={!profileVisible}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Show Profession</div>
                    <div className="text-sm text-muted-foreground">
                      Display your job title and workplace
                    </div>
                  </div>
                </div>
                <Switch
                  checked={showProfession}
                  onCheckedChange={setShowProfession}
                  disabled={!profileVisible}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                <div className="flex items-center space-x-3">
                  <Eye className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Show Last Active</div>
                    <div className="text-sm text-muted-foreground">
                      Let others see when you were last online
                    </div>
                  </div>
                </div>
                <Switch
                  checked={showLastActive}
                  onCheckedChange={setShowLastActive}
                  disabled={!profileVisible}
                />
              </div>
            </div>
          </div>

          {/* Privacy Controls */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Privacy Controls</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Prevent Screenshots</div>
                    <div className="text-sm text-muted-foreground">
                      Block screenshot attempts (when possible)
                    </div>
                  </div>
                </div>
                <Switch
                  checked={preventScreenshots}
                  onCheckedChange={setPreventScreenshots}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                <div className="flex items-center space-x-3">
                  <EyeOff className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Hide from Search</div>
                    <div className="text-sm text-muted-foreground">
                      Don't appear in user search results
                    </div>
                  </div>
                </div>
                <Switch
                  checked={hideFromSearch}
                  onCheckedChange={setHideFromSearch}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Limit Daily Matches</div>
                    <div className="text-sm text-muted-foreground">
                      Restrict the number of people who can see you per day
                    </div>
                  </div>
                </div>
                <Switch
                  checked={limitMatches}
                  onCheckedChange={setLimitMatches}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/20">
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={onClose} className="flex-1">
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
