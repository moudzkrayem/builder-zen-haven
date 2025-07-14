import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  MapPin,
  Clock,
  Users,
  Heart,
  Calendar,
  Compass,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for featured events and categories
const featuredEvents = [
  {
    id: 1,
    title: "Weekend Farmers Market",
    location: "Union Square",
    time: "Sat 9:00 AM",
    attendees: 45,
    image:
      "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=300&h=200&fit=crop",
    category: "Food & Drink",
    isPopular: true,
  },
  {
    id: 2,
    title: "Rooftop Yoga Session",
    location: "SoMa District",
    time: "Sun 7:00 AM",
    attendees: 20,
    image:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300&h=200&fit=crop",
    category: "Fitness",
    isPopular: false,
  },
  {
    id: 3,
    title: "Tech Networking Mixer",
    location: "SOMA",
    time: "Thu 6:00 PM",
    attendees: 87,
    image:
      "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=300&h=200&fit=crop",
    category: "Professional",
    isPopular: true,
  },
];

const categories = [
  { name: "All", icon: Compass, color: "bg-primary" },
  { name: "Food & Drink", icon: Heart, color: "bg-orange-500" },
  { name: "Fitness", icon: TrendingUp, color: "bg-green-500" },
  { name: "Professional", icon: Users, color: "bg-blue-500" },
  { name: "Arts & Culture", icon: Calendar, color: "bg-purple-500" },
  { name: "Outdoors", icon: MapPin, color: "bg-emerald-500" },
];

const trendingSearches = [
  "Coffee meetups",
  "Hiking groups",
  "Art galleries",
  "Tech events",
  "Food festivals",
  "Yoga classes",
];

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="h-full bg-background overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Explore</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-5 h-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events, people, places..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>

        {/* Categories */}
        <div className="flex space-x-2 overflow-x-auto hide-scrollbar">
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.name;

            return (
              <Button
                key={category.name}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className={cn(
                  "flex-shrink-0 rounded-full h-9 px-4",
                  isSelected && "bg-primary text-primary-foreground",
                )}
                onClick={() => setSelectedCategory(category.name)}
              >
                <Icon className="w-4 h-4 mr-2" />
                {category.name}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pb-6">
        {/* Trending searches */}
        {searchQuery === "" && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Trending</h2>
            <div className="flex flex-wrap gap-2">
              {trendingSearches.map((search, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="px-3 py-1 rounded-full cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => setSearchQuery(search)}
                >
                  {search}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Featured events */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Featured Events</h2>
            <Button variant="ghost" size="sm">
              See All
            </Button>
          </div>

          <div className="space-y-4">
            {featuredEvents.map((event) => (
              <div
                key={event.id}
                className="relative bg-card rounded-2xl overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex">
                  <div className="relative w-24 h-24">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    {event.isPopular && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-primary text-primary-foreground text-xs h-5">
                          Popular
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-foreground line-clamp-1">
                        {event.title}
                      </h3>
                      <Button variant="ghost" size="icon" className="w-8 h-8">
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center space-x-3 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{event.time}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Users className="w-3 h-3" />
                        <span>{event.attendees} attending</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {event.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nearby events */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Nearby</h2>
            <Button variant="ghost" size="sm">
              <MapPin className="w-4 h-4 mr-2" />
              View Map
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {featuredEvents.slice(0, 4).map((event) => (
              <div
                key={`nearby-${event.id}`}
                className="bg-card rounded-xl overflow-hidden shadow-sm border border-border"
              >
                <div className="relative aspect-[4/3]">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 bg-white/80 text-gray-700 hover:bg-white"
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-1">
                    {event.title}
                  </h3>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground mb-2">
                    <MapPin className="w-3 h-3" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {event.time}
                    </span>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{event.attendees}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <Button className="w-full h-12 rounded-xl">
            <Calendar className="w-5 h-5 mr-2" />
            Create Event
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-12 rounded-xl">
              <MapPin className="w-5 h-5 mr-2" />
              Browse Map
            </Button>
            <Button variant="outline" className="h-12 rounded-xl">
              <Users className="w-5 h-5 mr-2" />
              Find People
            </Button>
          </div>
        </div>

        {/* Empty state */}
        {searchQuery && featuredEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground mb-4">
              Try a different search term or browse categories
            </p>
            <Button
              variant="outline"
              onClick={() => setSearchQuery("")}
              className="rounded-full"
            >
              Clear Search
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
