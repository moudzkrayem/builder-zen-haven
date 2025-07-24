import { useState } from "react";
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
}

const availableInterests = [
  "Food & Drink",
  "Fitness",
  "Professional",
  "Arts & Culture",
  "Outdoors",
  "Tech",
  "Music",
  "Sports",
  "Travel",
  "Education",
  "Gaming",
  "Photography",
  "Books",
  "Fashion",
  "Wellness",
];

const activityTypes = [
  { name: "Free Events", icon: Heart },
  { name: "Paid Events", icon: Users },
  { name: "Small Groups", icon: Users },
  { name: "Large Groups", icon: Users },
  { name: "Outdoor Activities", icon: MapPin },
  { name: "Indoor Activities", icon: MapPin },
];

export default function SwipeFiltersModal({ isOpen, onClose }: SwipeFiltersModalProps) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [distance, setDistance] = useState([25]);
  const [maxPrice, setMaxPrice] = useState([100]);
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>([]);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);

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
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="absolute inset-x-4 top-8 bottom-8 bg-card rounded-3xl shadow-2xl overflow-hidden">
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
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
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
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/20">
          <div className="flex space-x-3">
            <Button variant="outline" onClick={clearAllFilters} className="flex-1">
              Clear All
            </Button>
            <Button onClick={onClose} className="flex-1">
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
