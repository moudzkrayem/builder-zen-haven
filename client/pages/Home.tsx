import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Map from "@/components/Map";
import CreateTrybeModal from "@/components/CreateTrybeModal";
import ScheduleModal from "@/components/ScheduleModal";
import ChatModal from "@/components/ChatModal";
import EventDetailModal from "@/components/EventDetailModal";
import PremiumUpgradeModal from "@/components/PremiumUpgradeModal";
import AIBotModal from "@/components/AIBotModal";
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
  UserPlus,
  Check,
  Share,
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

const defaultTrendingSearches = [
  "Coffee meetups",
  "Hiking groups",
  "Art galleries",
  "Tech events",
  "Food festivals",
  "Yoga classes",
];

export default function Home() {
  const { events, addEvent, joinEvent, joinedEvents, chats, toggleFavorite, isFavorite, addConnection, isConnected } = useEvents();
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
  const [showPremiumUpgradeModal, setShowPremiumUpgradeModal] = useState(false);
  const [showAIBotModal, setShowAIBotModal] = useState(false);
  const [premiumEventName, setPremiumEventName] = useState<string>("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [hasShownAIWelcome, setHasShownAIWelcome] = useState(false);

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
    const event = events.find(e => e.id === eventId);
    if (event?.isPremium) {
      setPremiumEventName(event.eventName || event.name);
      setShowPremiumUpgradeModal(true);
    } else {
      setActiveEventId(eventId);
      setShowEventDetailModal(true);
    }
  };

  const handleShareEvent = (event: any) => {
    if (navigator.share) {
      navigator.share({
        title: event.eventName || event.name,
        text: `Check out this event: ${event.eventName || event.name} at ${event.location}`,
        url: window.location.href,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(
        `Check out this event: ${event.eventName || event.name} at ${event.location} - ${window.location.href}`
      );
      // You could add a toast notification here
      alert('Event link copied to clipboard!');
    }
  };

  // Load user profile on component mount
  useEffect(() => {
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
      setUserProfile(JSON.parse(storedProfile));
    }
  }, []);

  // Auto-open AI assistant once per session after login/profile is available
  useEffect(() => {
    if (!hasShownAIWelcome && userProfile) {
      const alreadyShown = sessionStorage.getItem('aiWelcomeShown');
      if (!alreadyShown) {
        setShowAIBotModal(true);
        sessionStorage.setItem('aiWelcomeShown', 'true');
        setHasShownAIWelcome(true);
      }
    }
  }, [userProfile, hasShownAIWelcome]);

  // Open schedule modal if requested from other pages
  useEffect(() => {
    const openSchedule = sessionStorage.getItem('openScheduleOnLoad');
    if (openSchedule) {
      setShowScheduleModal(true);
      sessionStorage.removeItem('openScheduleOnLoad');
    }
  }, []);

  // Filter and sort events based on user interests
  const getPersonalizedEvents = () => {
    if (!userProfile) return events;

    const userInterests = [
      ...(userProfile.thingsYouDoGreat || []),
      ...(userProfile.thingsYouWantToTry || [])
    ].map(interest => interest.toLowerCase());

    // Score events based on interest match
    const scoredEvents = events.map(event => {
      let score = 0;
      const eventInterests = (event.interests || []).map(i => i.toLowerCase());
      const eventCategory = event.category.toLowerCase();

      // Check for direct interest matches
      eventInterests.forEach(eventInterest => {
        userInterests.forEach(userInterest => {
          if (eventInterest.includes(userInterest) || userInterest.includes(eventInterest)) {
            score += 2;
          }
        });
      });

      // Check category matches
      userInterests.forEach(userInterest => {
        if (eventCategory.includes(userInterest) || userInterest.includes(eventCategory)) {
          score += 1;
        }
      });

      return { ...event, personalityScore: score };
    });

    // Sort by score (highest first) and return
    return scoredEvents.sort((a, b) => b.personalityScore - a.personalityScore);
  };

  // Use personalized events instead of all events
  const featuredTrybes = getPersonalizedEvents();

  // Generate personalized trending searches
  const getTrendingSearches = () => {
    if (!userProfile) return defaultTrendingSearches;

    const userInterests = [
      ...(userProfile.thingsYouDoGreat || []),
      ...(userProfile.thingsYouWantToTry || [])
    ];

    // Create searches based on user interests
    const personalizedSearches = userInterests.slice(0, 4).map(interest => {
      const variations = [
        `${interest} meetups`,
        `${interest} groups`,
        `${interest} events`,
        `Learn ${interest}`,
      ];
      return variations[Math.floor(Math.random() * variations.length)];
    });

    // Fill remaining with default searches
    const remainingCount = 6 - personalizedSearches.length;
    const remainingSearches = defaultTrendingSearches.slice(0, remainingCount);

    return [...personalizedSearches, ...remainingSearches];
  };

  const trendingSearches = getTrendingSearches();

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
                {userProfile?.firstName ? (
                  <>
                    <h1 className="text-lg font-bold leading-tight">Welcome back,</h1>
                    <h1 className="text-lg font-bold text-primary leading-tight">
                      {userProfile.firstName}!
                    </h1>
                  </>
                ) : (
                  <>
                    <h1 className="text-xl font-bold leading-tight">Find your</h1>
                    <h1 className="text-xl font-bold text-primary leading-tight">
                      Trybe
                    </h1>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAIBotModal(true)}
                className="relative"
              >
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F5c6becf7cef04a3db5d3620ce9b103bd%2F0880b93857be41f7bd6c705364449846?format=webp&width=800"
                  alt="AI Assistant"
                  className="w-5 h-5 object-contain"
                />
              </Button>
              <Button variant="ghost" size="icon">
                <Filter className="w-5 h-5" />
              </Button>
            </div>
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
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={() => setShowCreateModal(true)}
                className="h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground flex flex-col items-center justify-center space-y-1"
              >
                <Plus className="w-5 h-5" />
                <span className="text-xs font-semibold">Create Trybe</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowMap(true)}
                className="h-14 rounded-2xl flex flex-col items-center justify-center space-y-1"
              >
                <MapPin className="w-5 h-5" />
                <span className="text-xs font-semibold">Browse Map</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowScheduleModal(true)}
                className="h-14 rounded-2xl flex flex-col items-center justify-center space-y-1"
              >
                <Calendar className="w-5 h-5" />
                <span className="text-xs font-semibold">My Schedule</span>
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
              <div>
                <h2 className="text-lg font-semibold">
                  {userProfile?.firstName ? "Recommended for You" : "Featured Trybes"}
                </h2>
                {userProfile?.firstName && (
                  <p className="text-xs text-muted-foreground">
                    Based on your interests and goals
                  </p>
                )}
              </div>
              <Button variant="ghost" size="sm">
                See All
              </Button>
            </div>

            <div className="space-y-4">
              {featuredTrybes.map((trybe) => (
                <div
                  key={trybe.id}
                  onClick={() => handleEventClick(trybe.id)}
                  className={cn(
                    "relative bg-card rounded-2xl overflow-hidden shadow-sm border hover:shadow-md transition-all cursor-pointer",
                    trybe.isPremium
                      ? "border-primary/30 bg-gradient-to-br from-card to-primary/5"
                      : "border-border"
                  )}
                >
                  <div className="flex">
                    <div className="relative w-24 h-24">
                      <img
                        src={trybe.image}
                        alt={trybe.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 flex flex-col space-y-1">
                        {trybe.isPopular && (
                          <Badge className="bg-primary text-primary-foreground text-xs h-5">
                            Popular
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-foreground line-clamp-1">
                          {trybe.name}
                        </h3>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(trybe.id);
                            }}
                            className={cn(
                              "w-7 h-7 transition-colors",
                              isFavorite(trybe.id)
                                ? "text-red-500"
                                : "text-gray-700"
                            )}
                          >
                            <Heart className={cn(
                              "w-3 h-3 transition-all",
                              isFavorite(trybe.id) && "fill-current"
                            )} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShareEvent(trybe);
                            }}
                            className="w-7 h-7 text-gray-700 hover:text-primary transition-colors"
                          >
                            <Share className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (trybe.isPremium) {
                                setPremiumEventName(trybe.eventName || trybe.name);
                                setShowPremiumUpgradeModal(true);
                              } else {
                                addConnection(trybe.id);
                              }
                            }}
                            disabled={!trybe.isPremium && isConnected(trybe.id)}
                            className={cn(
                              "w-7 h-7 transition-colors",
                              isConnected(trybe.id) && !trybe.isPremium ? "text-green-600" : "text-gray-700 hover:text-primary"
                            )}
                          >
                            {isConnected(trybe.id) && !trybe.isPremium ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <UserPlus className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (trybe.isPremium) {
                                setPremiumEventName(trybe.eventName || trybe.name);
                                setShowPremiumUpgradeModal(true);
                              } else {
                                handleJoinEvent(trybe.id);
                              }
                            }}
                            className={cn(
                              "px-2 py-1 h-7 text-xs rounded-full",
                              trybe.isPremium
                                ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                                : joinedEvents.includes(trybe.id)
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : "bg-primary hover:bg-primary/90 text-primary-foreground",
                            )}
                          >
                            {trybe.isPremium
                              ? "Premium"
                              : joinedEvents.includes(trybe.id)
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
                      className={cn(
                        "bg-card rounded-xl overflow-hidden shadow-sm border hover:shadow-md transition-all text-left w-full",
                        trybe.isPremium
                          ? "border-primary/30 bg-gradient-to-br from-card to-primary/5"
                          : "border-border"
                      )}
                    >
                      <div className="relative aspect-[4/3]">
                        <img
                          src={trybe.image}
                          alt={trybe.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 flex flex-col items-end space-y-1">
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(trybe.id);
                              }}
                              className={cn(
                                "w-7 h-7 bg-white/80 hover:bg-white transition-colors",
                                isFavorite(trybe.id)
                                  ? "text-red-500"
                                  : "text-gray-700"
                              )}
                            >
                              <Heart className={cn(
                                "w-3 h-3 transition-all",
                                isFavorite(trybe.id) && "fill-current"
                              )} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareEvent(trybe);
                              }}
                              className="w-7 h-7 bg-white/80 hover:bg-white text-gray-700 hover:text-primary transition-colors"
                            >
                              <Share className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (trybe.isPremium) {
                                  setPremiumEventName(trybe.eventName || trybe.name);
                                  setShowPremiumUpgradeModal(true);
                                } else {
                                  addConnection(trybe.id);
                                }
                              }}
                              disabled={!trybe.isPremium && isConnected(trybe.id)}
                              className={cn(
                                "w-7 h-7 bg-white/80 hover:bg-white transition-colors",
                                isConnected(trybe.id) && !trybe.isPremium ? "text-green-600" : "text-gray-700 hover:text-primary"
                              )}
                            >
                              {isConnected(trybe.id) && !trybe.isPremium ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <UserPlus className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (trybe.isPremium) {
                                setPremiumEventName(trybe.eventName || trybe.name);
                                setShowPremiumUpgradeModal(true);
                              } else {
                                handleJoinEvent(trybe.id);
                              }
                            }}
                            className={cn(
                              "px-2 py-1 h-6 text-xs rounded-full",
                              trybe.isPremium
                                ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                                : joinedEvents.includes(trybe.id)
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : "bg-primary hover:bg-primary/90 text-primary-foreground",
                            )}
                          >
                            {trybe.isPremium
                              ? "Premium"
                              : joinedEvents.includes(trybe.id)
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
                  className={cn(
                    "bg-card rounded-xl overflow-hidden shadow-sm border hover:shadow-md transition-all cursor-pointer",
                    trybe.isPremium
                      ? "border-primary/30 bg-gradient-to-br from-card to-primary/5"
                      : "border-border"
                  )}
                >
                  <div className="relative aspect-[4/3]">
                    <img
                      src={trybe.image}
                      alt={trybe.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 flex flex-col items-end space-y-1">
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(trybe.id);
                          }}
                          className={cn(
                            "w-7 h-7 bg-white/80 hover:bg-white transition-colors",
                            isFavorite(trybe.id)
                              ? "text-red-500"
                              : "text-gray-700"
                          )}
                        >
                          <Heart className={cn(
                            "w-3 h-3 transition-all",
                            isFavorite(trybe.id) && "fill-current"
                          )} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareEvent(trybe);
                          }}
                          className="w-7 h-7 bg-white/80 hover:bg-white text-gray-700 hover:text-primary transition-colors"
                        >
                          <Share className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (trybe.isPremium) {
                              setPremiumEventName(trybe.eventName || trybe.name);
                              setShowPremiumUpgradeModal(true);
                            } else {
                              addConnection(trybe.id);
                            }
                          }}
                          disabled={!trybe.isPremium && isConnected(trybe.id)}
                          className={cn(
                            "w-7 h-7 bg-white/80 hover:bg-white transition-colors",
                            isConnected(trybe.id) && !trybe.isPremium ? "text-green-600" : "text-gray-700 hover:text-primary"
                          )}
                        >
                          {isConnected(trybe.id) && !trybe.isPremium ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <UserPlus className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (trybe.isPremium) {
                            setPremiumEventName(trybe.eventName || trybe.name);
                            setShowPremiumUpgradeModal(true);
                          } else {
                            handleJoinEvent(trybe.id);
                          }
                        }}
                        className={cn(
                          "px-2 py-1 h-6 text-xs rounded-full",
                          trybe.isPremium
                            ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                            : joinedEvents.includes(trybe.id)
                            ? "bg-green-500 hover:bg-green-600 text-white"
                            : "bg-primary hover:bg-primary/90 text-primary-foreground",
                        )}
                      >
                        {trybe.isPremium
                          ? "Premium"
                          : joinedEvents.includes(trybe.id)
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

      {/* Premium Upgrade Modal */}
      <PremiumUpgradeModal
        isOpen={showPremiumUpgradeModal}
        onClose={() => {
          setShowPremiumUpgradeModal(false);
          setPremiumEventName("");
        }}
        eventName={premiumEventName}
      />

      {/* AI Bot Modal */}
      <AIBotModal
        isOpen={showAIBotModal}
        onClose={() => setShowAIBotModal(false)}
        onEventClick={handleEventClick}
      />
    </>
  );
}
