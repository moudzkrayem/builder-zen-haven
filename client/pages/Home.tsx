import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Map from "@/components/Map";
import CreateTrybeModal from "@/components/CreateTrybeModal";
import ScheduleModal from "@/components/ScheduleModal";
import ChatModal from "@/components/ChatModal";
import EventDetailModal from "@/components/EventDetailModal";
import { useEvents } from "@/contexts/EventsContext";
import {
  Search,
  Filter,
  MapPin,
  Clock,
  Users,
  Heart,
  Calendar,
  Plus,
  TrendingUp,
  DollarSign,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
  { name: "All", color: "bg-primary" },
  { name: "Food & Drink", color: "bg-orange-500" },
  { name: "Fitness", color: "bg-green-500" },
  { name: "Professional", color: "bg-blue-500" },
  { name: "Arts & Culture", color: "bg-purple-500" },
  { name: "Outdoors", color: "bg-emerald-500" },
];

const trendingSearches = [
  "Coffee meetups",
  "Hiking groups",
  "Art galleries",
  "Tech events",
  "Food festivals",
  "Yoga classes",
];

export default function Home() {
  const { events, addEvent, joinEvent, joinedEvents, chats, toggleFavorite, isFavorite } = useEvents();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showSimilar, setShowSimilar] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [showEventDetailModal, setShowEventDetailModal] = useState(false);
  const [activeEventId, setActiveEventId] = useState<number | null>(null);

  const handleCreateTrybe = (trybeData: any) => {
    addEvent(trybeData);
    console.log("New Trybe created:", trybeData);
  };

  const handleJoinEvent = (eventId: number) => {
    joinEvent(eventId);
    console.log("Joined event:", eventId);
  };

  const handleOpenChat = (eventId: number, hostName: string) => {
    const chat = chats.find((c) => c.eventId === eventId);
    if (chat) {
      setActiveChatId(chat.id);
      setShowChatModal(true);
      setShowScheduleModal(false);
    }
  };

  const handleEventClick = (eventId: number) => {
    setActiveEventId(eventId);
    setShowEventDetailModal(true);
  };

  // Use events from context instead of local data
  const featuredTrybes = events;

  return (
    <>
      {showMap && <Map onClose={() => setShowMap(false)} />}
      <div className="h-full bg-background overflow-y-auto">
        {/* Header with T logo */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F5c6becf7cef04a3db5d3620ce9b103bd%2F9cd19bf4949f47f88045cba2367e1380?format=webp&width=800"
                alt="Trybe Logo"
                className="w-10 h-8 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold leading-tight">Find your</h1>
                <h1 className="text-xl font-bold text-primary leading-tight">
                  Trybe
                </h1>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <Filter className="w-5 h-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search trybes, events, experiences..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>

          {/* Categories */}
          <div className="flex space-x-2 overflow-x-auto hide-scrollbar">
            {categories.map((category) => {
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
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="px-4 pb-6">
          {/* Create Trybe Action */}
          <div className="mb-6 mt-4">
            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-col">
              <Button
                onClick={() => setShowCreateModal(true)}
                className="h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground flex flex-col items-center justify-center space-y-1 sm:flex-row sm:justify-center sm:ml-auto"
              >
                <Plus className="w-6 h-6" />
                <span className="text-sm font-semibold">Create Trybe</span>
              </Button>
            </div>
          </div>

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

          {/* Featured trybes */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Featured Trybes</h2>
              <Button variant="ghost" size="sm">
                See All
              </Button>
            </div>

            <div className="space-y-4">
              {featuredTrybes.map((trybe) => (
                <div
                  key={trybe.id}
                  onClick={() => handleEventClick(trybe.id)}
                  className="relative bg-card rounded-2xl overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex">
                    <div className="relative w-24 h-24">
                      <img
                        src={trybe.image}
                        alt={trybe.name}
                        className="w-full h-full object-cover"
                      />
                      {trybe.isPopular && (
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
                          {trybe.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(trybe.id);
                            }}
                            className={cn(
                              "w-8 h-8 transition-colors",
                              isFavorite(trybe.id)
                                ? "text-red-500"
                                : "text-gray-700"
                            )}
                          >
                            <Heart className={cn(
                              "w-4 h-4 transition-all",
                              isFavorite(trybe.id) && "fill-current"
                            )} />
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinEvent(trybe.id);
                            }}
                            className={cn(
                              "px-3 py-1 h-8 text-xs rounded-full",
                              joinedEvents.includes(trybe.id)
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : "bg-primary hover:bg-primary/90 text-primary-foreground",
                            )}
                          >
                            {joinedEvents.includes(trybe.id)
                              ? "Joined"
                              : "Join"}
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{trybe.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{trybe.date}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>
                              {trybe.attendees}/{trybe.maxCapacity}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-3 h-3" />
                            <span>{trybe.fee}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 fill-current text-yellow-500" />
                            <span>{trybe.rating}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {trybe.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Show Me More Button */}
            <div className="mt-4">
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl"
                onClick={() => setShowSimilar(!showSimilar)}
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Show Me More Similar Events
              </Button>
            </div>

            {/* Similar events section */}
            {showSimilar && (
              <div className="mt-4 space-y-3 animate-bounce-in">
                <h3 className="text-md font-semibold text-muted-foreground">
                  Based on your interests
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {featuredTrybes.slice(0, 4).map((trybe) => (
                    <button
                      key={`similar-${trybe.id}`}
                      onClick={() => handleEventClick(trybe.id)}
                      className="bg-card rounded-xl overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow text-left w-full"
                    >
                      <div className="relative aspect-[4/3]">
                        <img
                          src={trybe.image}
                          alt={trybe.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(trybe.id);
                            }}
                            className={cn(
                              "w-8 h-8 bg-white/80 hover:bg-white transition-colors",
                              isFavorite(trybe.id)
                                ? "text-red-500"
                                : "text-gray-700"
                            )}
                          >
                            <Heart className={cn(
                              "w-4 h-4 transition-all",
                              isFavorite(trybe.id) && "fill-current"
                            )} />
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinEvent(trybe.id);
                            }}
                            className={cn(
                              "px-2 py-1 h-6 text-xs rounded-full",
                              joinedEvents.includes(trybe.id)
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : "bg-primary hover:bg-primary/90 text-primary-foreground",
                            )}
                          >
                            {joinedEvents.includes(trybe.id)
                              ? "Joined"
                              : "Join"}
                          </Button>
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-sm mb-1 line-clamp-1">
                          {trybe.name}
                        </h3>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground mb-2">
                          <MapPin className="w-3 h-3" />
                          <span>{trybe.location}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {trybe.date}
                          </span>
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <DollarSign className="w-3 h-3" />
                            <span>{trybe.fee}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Nearby trybes */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Nearby Trybes</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMap(true)}
              >
                <MapPin className="w-4 h-4 mr-2" />
                View Map
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {featuredTrybes.slice(0, 4).map((trybe) => (
                <div
                  key={`nearby-${trybe.id}`}
                  onClick={() => handleEventClick(trybe.id)}
                  className="bg-card rounded-xl overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="relative aspect-[4/3]">
                    <img
                      src={trybe.image}
                      alt={trybe.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 flex flex-col items-end space-y-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(trybe.id);
                        }}
                        className={cn(
                          "w-8 h-8 bg-white/80 hover:bg-white transition-colors",
                          isFavorite(trybe.id)
                            ? "text-red-500"
                            : "text-gray-700"
                        )}
                      >
                        <Heart className={cn(
                          "w-4 h-4 transition-all",
                          isFavorite(trybe.id) && "fill-current"
                        )} />
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinEvent(trybe.id);
                        }}
                        className={cn(
                          "px-2 py-1 h-6 text-xs rounded-full",
                          joinedEvents.includes(trybe.id)
                            ? "bg-green-500 hover:bg-green-600 text-white"
                            : "bg-primary hover:bg-primary/90 text-primary-foreground",
                        )}
                      >
                        {joinedEvents.includes(trybe.id) ? "Joined" : "Join"}
                      </Button>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-1">
                      {trybe.name}
                    </h3>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground mb-2">
                      <MapPin className="w-3 h-3" />
                      <span>{trybe.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {trybe.date}
                      </span>
                      <div className="flex items-center space-x-1 text-xs text-primary">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{trybe.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Schedule */}
          {joinedEvents.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">My Schedule</h2>
              <div className="space-y-3">
                {featuredTrybes
                  .filter((trybe) => joinedEvents.includes(trybe.id))
                  .map((trybe) => (
                    <button
                      key={`schedule-${trybe.id}`}
                      onClick={() => handleEventClick(trybe.id)}
                      className="bg-card rounded-xl p-4 border border-border flex items-center space-x-4 hover:shadow-md transition-shadow text-left w-full"
                    >
                      <img
                        src={trybe.image}
                        alt={trybe.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{trybe.name}</h3>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>{trybe.date}</span>
                          <span>•</span>
                          <span>{trybe.location}</span>
                        </div>
                      </div>
                      <Badge className="bg-green-500 text-white">Joined</Badge>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-12 rounded-xl"
                onClick={() => setShowMap(true)}
              >
                <MapPin className="w-5 h-5 mr-2" />
                Browse Map
              </Button>
              <Button
                variant="outline"
                className="h-12 rounded-xl"
                onClick={() => setShowScheduleModal(true)}
              >
                <Calendar className="w-5 h-5 mr-2" />
                View All Schedule
              </Button>
            </div>
          </div>

          {/* Empty state */}
          {searchQuery && featuredTrybes.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No trybes found</h3>
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

      {/* Create Trybe Modal */}
      <CreateTrybeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateTrybe={handleCreateTrybe}
      />

      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onOpenChat={handleOpenChat}
        onEventClick={handleEventClick}
      />

      {/* Chat Modal */}
      <ChatModal
        isOpen={showChatModal}
        onClose={() => {
          setShowChatModal(false);
          setActiveChatId(null);
        }}
        chatId={activeChatId}
      />

      {/* Event Detail Modal */}
      <EventDetailModal
        isOpen={showEventDetailModal}
        onClose={() => {
          setShowEventDetailModal(false);
          setActiveEventId(null);
        }}
        eventId={activeEventId}
      />
    </>
  );
}
