import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { X, Filter, MapPin, Heart, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: (filters: any) => void;
}

import { CATEGORIES } from '@/config/categories';

const availableInterests = CATEGORIES.map(c => c.label).filter(l => l !== 'All');

const activityTypes = [
  { name: "Free Events", icon: Heart },
  { name: "Paid Events", icon: Users },
  { name: "Small Groups", icon: Users },
  { name: "Large Groups", icon: Users },
  { name: "Outdoor Activities", icon: MapPin },
  { name: "Indoor Activities", icon: MapPin },
];

export default function SwipeFiltersModal({ isOpen, onClose, onApply }: SwipeFiltersModalProps) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [distance, setDistance] = useState([25]);
  const [maxPrice, setMaxPrice] = useState([100]);
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>([]);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [dateRange, setDateRange] = useState<'any' | 'today' | 'week' | 'month'>('any');
  const [detectedNavHeight, setDetectedNavHeight] = useState<number | null>(null);
  const [contentPaddingBottom, setContentPaddingBottom] = useState<string>('env(safe-area-inset-bottom, 0px)');
  const [bottomOffsetPx, setBottomOffsetPx] = useState<number>(96);

  // Prevent background scrolling when modal is open and ensure modal content scrolls
  useEffect(() => {
    if (!isOpen) return;
    // reference previous overflow so we can restore when all modals close
    const prev = document.body.style.overflow;
    // increment global lock counter so multiple modals don't stomp each other
    (window as any).__modalLockCount = ((window as any).__modalLockCount || 0) + 1;
    document.body.style.overflow = 'hidden';
    return () => {
      try {
        (window as any).__modalLockCount = Math.max(0, ((window as any).__modalLockCount || 1) - 1);
        if (!((window as any).__modalLockCount)) {
          document.body.style.overflow = prev || '';
          try { delete (window as any).__modalLockCount; } catch (e) {}
        }
      } catch (e) {
        document.body.style.overflow = prev || '';
      }
    };
  }, [isOpen]);

  // Measure bottom nav and compute padding so footer and modal sit above the nav
  useEffect(() => {
    const gap = 12;
    const update = () => {
      try {
        let navEl: Element | null = document.querySelector('div.fixed.bottom-0.left-0.right-0');
        if (!navEl) navEl = document.querySelector('.grid.grid-cols-5.h-20');
        let h = 0;
        if (navEl instanceof HTMLElement) {
          const rect = navEl.getBoundingClientRect();
          if (rect.height > 0) h = Math.ceil(rect.height);
        }
        const minFooterSpace = 96;
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

  if (!isOpen) return null;

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const toggleActivityType = (type: string) => {
    setSelectedActivityTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const clearAllFilters = () => {
    setSelectedInterests([]);
    setDistance([25]);
    setMaxPrice([100]);
    setSelectedActivityTypes([]);
    setShowOnlyAvailable(true);
    setDateRange('any');
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-background/80 backdrop-blur-sm">
      <div className="absolute inset-x-4 top-8 bg-card rounded-3xl shadow-2xl overflow-hidden flex flex-col" style={{ bottom: `${bottomOffsetPx}px` }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <Filter className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Discovery Filters</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-6 h-6" />
          </Button>
        </div>

    {/* Content */}
  <div className="flex-1 overflow-y-auto p-6 space-y-8 overscroll-contain" style={{ paddingBottom: contentPaddingBottom, ['--modal-bottom-space' as any]: contentPaddingBottom, WebkitOverflowScrolling: 'touch' as any }}>
          {/* Distance */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Distance</h3>
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

          {/* Price Range */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Price Range</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Maximum price
                </span>
                <span className="font-semibold">
                  {maxPrice[0] >= 200 ? "No limit" : `$${maxPrice[0]}`}
                </span>
              </div>
              <Slider
                value={maxPrice}
                onValueChange={setMaxPrice}
                max={200}
                min={0}
                step={5}
                className="w-full"
              />
            </div>
          </div>

          {/* Interests */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {availableInterests.map((interest) => (
                <Badge
                  key={interest}
                  variant={selectedInterests.includes(interest) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:scale-105",
                    selectedInterests.includes(interest)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  )}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>

          {/* Activity Types */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Activity Types</h3>
            <div className="grid grid-cols-2 gap-3">
              {activityTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.name}
                    onClick={() => toggleActivityType(type.name)}
                    className={cn(
                      "flex items-center space-x-3 p-4 rounded-xl border-2 transition-all duration-200",
                      selectedActivityTypes.includes(type.name)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-accent"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{type.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Date</h3>
            <div className="flex gap-2">
              {[
                { key: 'any', label: 'Any' },
                { key: 'today', label: 'Today' },
                { key: 'week', label: 'This Week' },
                { key: 'month', label: 'This Month' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setDateRange(opt.key as any)}
                  className={cn(
                    "px-3 py-2 rounded-lg border",
                    dateRange === (opt.key as any) ? 'bg-primary text-primary-foreground border-primary' : 'border-border'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Options */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Options</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                <div>
                  <div className="font-medium">Show only available events</div>
                  <div className="text-sm text-muted-foreground">
                    Hide events that are full
                  </div>
                </div>
                <Switch
                  checked={showOnlyAvailable}
                  onCheckedChange={setShowOnlyAvailable}
                />
              </div>
            </div>
          </div>
          {/* Inline action buttons so they are part of the scrollable content */}
          <div className="pt-2" />
          <div className="p-6 border-t border-border bg-muted/20">
            <div className="flex space-x-3">
              <Button variant="outline" onClick={clearAllFilters} className="flex-1">
                Clear All
              </Button>
              <Button
                onClick={() => {
                  const payload = {
                    selectedInterests,
                    distance: distance[0],
                    maxPrice: maxPrice[0],
                    selectedActivityTypes,
                    showOnlyAvailable,
                    dateRange,
                  };
                  try {
                    if (typeof onApply === 'function') onApply(payload);
                  } catch (e) {
                    console.debug('SwipeFiltersModal: onApply callback threw', e);
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
