import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X, Users, Heart, MapPin, Star, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiscoverySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: (filters: any) => void;
}

import { CATEGORIES } from '@/config/categories';

const interests = CATEGORIES.map(c => c.label).filter(l => l !== 'All');
const DEFAULT_SELECTED_INTERESTS = ["Food & Drink", "Tech", "Travel"];

const showMeOptions = [
  { value: "everyone", label: "Everyone" },
  { value: "verified", label: "Verified users only" },
  { value: "premium", label: "Premium members only" },
];

export default function DiscoverySettingsModal({ isOpen, onClose, onApply }: DiscoverySettingsModalProps) {
  const [distance, setDistance] = useState([25]);
  const [ageRange, setAgeRange] = useState([18, 35]);
  const [showMe, setShowMe] = useState("everyone");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(DEFAULT_SELECTED_INTERESTS);
  const [hideProfile, setHideProfile] = useState(false);
  const [premiumOnly, setPremiumOnly] = useState(false);

  if (!isOpen) return null;

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const clearAll = () => {
    setDistance([25]);
    setAgeRange([18, 35]);
    setShowMe('everyone');
    setSelectedInterests(DEFAULT_SELECTED_INTERESTS);
    setHideProfile(false);
    setPremiumOnly(false);
  };

  // Lock body scroll when this modal is open. Use a global counter so nested modals
  // don't re-enable scrolling prematurely.
  useEffect(() => {
    const w = window as any;
    w.__modalOpenCount = w.__modalOpenCount || 0;
    if (isOpen) {
      w.__modalOpenCount += 1;
      if (w.__modalOpenCount === 1) {
        document.body.style.overflow = 'hidden';
      }
    }
    return () => {
      if (isOpen) {
        w.__modalOpenCount = Math.max(0, (w.__modalOpenCount || 1) - 1);
        if (w.__modalOpenCount === 0) document.body.style.overflow = '';
      }
    };
  }, [isOpen]);

  // Measure the app's fixed bottom nav so we can add extra bottom padding to the modal
  // and ensure the footer buttons can be scrolled into view on small screens.
  const [detectedNavHeight, setDetectedNavHeight] = useState<number | null>(null);
  const [contentPaddingBottom, setContentPaddingBottom] = useState<string>('env(safe-area-inset-bottom, 0px)');
  const [bottomOffsetPx, setBottomOffsetPx] = useState<number>(96);

  useEffect(() => {
    const gap = 12; // px gap so footer isn't flush to the nav

    const update = () => {
      try {
        let navEl: Element | null = document.querySelector('div.fixed.bottom-0.left-0.right-0');
        if (!navEl) navEl = document.querySelector('.grid.grid-cols-5.h-20');

        let h = 0;
        if (navEl instanceof HTMLElement) {
          const rect = navEl.getBoundingClientRect();
          if (rect.height > 0) h = Math.ceil(rect.height);
        }

  // Ensure a sensible minimum so the footer is always scrollable even if
  // we couldn't detect the nav element or it uses a different selector.
  const minFooterSpace = 96; // px
  const computed = Math.max(h + gap, minFooterSpace);

  setDetectedNavHeight(h || null);
  setBottomOffsetPx(computed);
  setContentPaddingBottom(`calc(env(safe-area-inset-bottom, 0px) + ${computed}px)`);
      } catch (e) {
        // noop
      }
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[99999] bg-background/80 backdrop-blur-sm">
  <div className="absolute inset-x-4 top-8 bg-card rounded-3xl shadow-2xl overflow-hidden flex flex-col" style={{ bottom: `${bottomOffsetPx}px` }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <Filter className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Discovery Settings</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-6 h-6" />
          </Button>
        </div>

  {/* Content */}
  <div className="flex-1 overflow-y-auto p-6 space-y-8 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' as any, paddingBottom: contentPaddingBottom, ['--modal-bottom-space' as any]: contentPaddingBottom }}>
          {/* Distance */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-primary" />
              Distance
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Show events within
                </span>
                <span className="font-semibold">
                  {distance[0]} {distance[0] >= 100 ? "miles+" : "miles"}
                </span>
              </div>
              <Slider
                value={distance}
                onValueChange={setDistance}
                max={100}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* Age Range */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-primary" />
              Age Range
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Show people aged
                </span>
                <span className="font-semibold">
                  {ageRange[0]} - {ageRange[1]} years
                </span>
              </div>
              <Slider
                value={ageRange}
                onValueChange={setAgeRange}
                max={65}
                min={18}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* Show Me */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-primary" />
              Show Me
            </h3>
            <div className="space-y-3">
              {showMeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setShowMe(option.value)}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all duration-200",
                    showMe === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-accent"
                  )}
                >
                  <div className="font-medium">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Star className="w-5 h-5 mr-2 text-primary" />
              Interests
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select interests to see relevant events ({selectedInterests.length}/6)
            </p>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <Badge
                  key={interest}
                  variant={selectedInterests.includes(interest) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:scale-105",
                    selectedInterests.includes(interest)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  )}
                  onClick={() => selectedInterests.length < 6 || selectedInterests.includes(interest) ? toggleInterest(interest) : null}
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>

          {/* Advanced Options */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Advanced Options</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                <div>
                  <div className="font-medium">Hide my profile</div>
                  <div className="text-sm text-muted-foreground">
                    Don't show my profile to others
                  </div>
                </div>
                <Switch
                  checked={hideProfile}
                  onCheckedChange={setHideProfile}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                <div>
                  <div className="font-medium">Premium events only</div>
                  <div className="text-sm text-muted-foreground">
                    Only show premium quality events
                  </div>
                </div>
                <Switch
                  checked={premiumOnly}
                  onCheckedChange={setPremiumOnly}
                />
              </div>
            </div>
          </div>
      {/* Buttons placed inline after options so they are part of the scrollable content */}
      <div className="pt-2" />
      <div className="p-6 border-t border-border bg-muted/20">
        <div className="flex space-x-3">
          <Button variant="outline" onClick={clearAll} className="flex-1">
            Clear All
          </Button>
          <Button
            onClick={() => {
              const payload = {
                selectedInterests,
                distance: distance[0],
                ageRange,
                showMe,
                hideProfile,
                premiumOnly,
              };
              try {
                if (typeof onApply === 'function') onApply(payload);
              } catch (e) {
                console.debug('DiscoverySettingsModal: onApply threw', e);
              }
              onClose();
            }}
            className="flex-1"
          >
            Apply Filters
          </Button>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}
