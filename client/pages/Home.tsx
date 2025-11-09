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
import { auth } from "@/auth";
import { collection, getDocs } from "firebase/firestore";
import { db, app } from "../firebase";
import { getStorage, ref as storageRef, getDownloadURL } from "firebase/storage";
import { isHttpDataOrRelative, normalizeStorageRefPath } from '@/lib/imageUtils';
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
import EventsDebugOverlay from '@/components/EventsDebugOverlay';
import SafeImg from '@/components/SafeImg';
import { CATEGORIES, CATEGORY_BY_ID } from '@/config/categories';
import { PREMIUM_ENABLED } from '@/lib/featureFlags';
// Local state to hold Trybes fetched from Firestore will be created inside the Home component

const defaultTrendingSearches = [
  "Coffee meetups",
  "Hiking groups",
  "Art galleries",
  "Tech events",
  "Food festivals",
  "Yoga classes",
];

export default function Home() {
  const { events, addEvent, joinEvent, joinedEvents, chats, toggleFavorite, isFavorite, addConnection, isConnected, createChatForEvent } = useEvents();
  const [searchQuery, setSearchQuery] = useState("");
  const [firestoreTrybes, setFirestoreTrybes] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
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
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [showAllNearby, setShowAllNearby] = useState(false);

  // Preload first 2 event images to improve perceived first-paint speed
  useEffect(() => {
    try {
      const imgs = (events || []).slice(0, 2).map((e: any) => (e._resolvedImage || e.image)).filter(Boolean) as string[];
      // Use Image() preloads (low-risk) instead of link rel=preload to avoid "preloaded but not used" warnings
      imgs.forEach((src) => {
        try {
          const img = new Image();
          img.src = src;
        } catch (err) {}
      });
    } catch (err) {}
  }, [events]);

  const handleCreateTrybe = (trybeData: any) => {
    addEvent(trybeData);
    console.log("New Trybe created:", trybeData);
  };

  const handleJoinEvent = (eventId: number) => {
    joinEvent(eventId);
    console.log("Joined event:", eventId);
  };

  const handleOpenChat = (eventId: number, hostName: string) => {
    console.debug('Home: handleOpenChat called for', String(eventId));
    // Accept numeric or string eventId types — compare as strings for robustness
    let chat = chats.find((c) => String(c.eventId) === String(eventId));
    if (!chat) {
      try {
        createChatForEvent?.(eventId as any);
        const chatDocId = `trybe-${String(eventId)}`;
        setActiveChatId(chatDocId as any);
        setShowChatModal(true);
        setShowScheduleModal(false);
        return;
      } catch (e) {
        // ignore and fallthrough
      }
    }

    if (chat) {
      setActiveChatId(chat.id as any);
      setShowChatModal(true);
      setShowScheduleModal(false);
    }
  };

  const handleEventClick = (eventId: number) => {
    const event = events.find(e => e.id === eventId);
    if (event?.isPremium && PREMIUM_ENABLED) {
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
    // Build a robust set of user interest tokens and phrases
    const rawUserInterests = [
      ...(userProfile.thingsYouDoGreat || []),
      ...(userProfile.thingsYouWantToTry || [])
    ].map((s: any) => (s || '').toString().trim()).filter(Boolean);

    const userInterests: string[] = [];
    rawUserInterests.forEach(u => {
      const lower = u.toLowerCase();
      userInterests.push(lower);
      // also add simple tokens to increase match chance (split on non-word)
      lower.split(/[^a-z0-9]+/).filter(Boolean).forEach(tok => userInterests.push(tok));
    });

    // Score events based on richer matching across interests, category label, name and description
    const scoredEvents = events.map(event => {
      let score = 0;

      // Gather candidate strings from the event
      const eventInterests = ((event.interests || []) as string[]).map(i => (i || '').toString().toLowerCase());
      const categoryLabel = (CATEGORY_BY_ID[(event.category || '')]?.label || '').toString().toLowerCase();
      const title = (event.eventName || event.name || '').toString().toLowerCase();
      const desc = (event.description || '').toString().toLowerCase();

      // Direct phrase matches (strong)
      userInterests.forEach(ui => {
        if (eventInterests.some(ei => ei === ui) || title.includes(ui) || desc.includes(ui) || categoryLabel === ui) {
          score += 3;
        }
      });

      // Partial/token matches (weaker)
      userInterests.forEach(ui => {
        if (eventInterests.some(ei => ei.includes(ui) || ui.includes(ei))) score += 2;
        if (title.includes(ui) || desc.includes(ui)) score += 1;
        if (categoryLabel.includes(ui) || ui.includes(categoryLabel)) score += 1;
      });

      // Bonus if category id matches exactly one of user's interests tokens
      const catId = (event.category || '').toString().toLowerCase();
      if (userInterests.includes(catId)) score += 2;

      return { ...event, personalityScore: score };
    });

    // Sort by score (highest first) and return
    return scoredEvents.sort((a, b) => b.personalityScore - a.personalityScore);
  };

  // Helper to check category match (selectedCategory 'all' means match all)
  const categoryMatches = (eventCategoryId?: string) => {
    if (!selectedCategory || selectedCategory === 'all') return true;
    return (eventCategoryId || '').toString() === selectedCategory;
  };

  // Use personalized events instead of all events, but exclude joined events so scheduled items move to My Schedule
  // Show personalized events, but keep trybes created by the current user visible
  // even if they are already in joinedEvents (creator should see their own Trybe immediately).
  const featuredTrybes = getPersonalizedEvents().filter(e => {
    const isCreator = (() => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return false;
        // `host` is set by EventsContext when creating events to the creator's uid
        return String(e.host) === String(uid) || String((e as any).createdBy) === String(uid) || String(e.hostName || '').toLowerCase() === 'you';
      } catch (err) {
        return false;
      }
    })();

    // Keep event if not joined OR if the current user is the creator
    return (!joinedEvents.includes(e.id) || isCreator) && categoryMatches(e.category);
  });

  // Personalized matches with positive score only (used for the "Similar events" section)
  const personalizedMatches = getPersonalizedEvents()
    .filter(e => (e.personalityScore || 0) > 0)
    .filter(e => !joinedEvents.includes(e.id) && categoryMatches(e.category));

  

  // If we have firestoreTrybes available, map them to the Event shape
  const mappedFirestoreTrybes = firestoreTrybes.map((doc) => {
    // Firestore Trybe shape comes from CreateTrybeModal.tsx
    // TrybeData fields: eventName, location, time, duration, description, maxCapacity, fee, photos, ageRange, repeatOption, isPremium, category
    const data = doc;
    const id = doc.id || Date.now();
    const image = (data._resolvedImage as string) || (data.photos && data.photos.length > 0 ? data.photos[0] : undefined) || data.image;

    // Ensure date string is safe
    let dateStr = '';
    try {
      if (data.time) {
        const d = typeof data.time === 'object' && typeof data.time.toDate === 'function' ? data.time.toDate() : new Date(data.time);
        if (!isNaN(d.getTime())) dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
      }
      if (!dateStr) dateStr = data.date || '';
    } catch (err) {
      dateStr = data.date || '';
    }

    // Normalize category to canonical id
    let normalizedCategory = 'social';
    try {
      const rawCat = (data.category || '').toString();
      if (!rawCat) {
        normalizedCategory = 'social';
      } else {
        // Try direct id match first
        if (CATEGORY_BY_ID[rawCat]) normalizedCategory = rawCat;
        else {
          // Try to match by label (case-insensitive)
          const match = Object.values(CATEGORY_BY_ID).find(c => c.label.toLowerCase() === rawCat.toLowerCase());
          if (match) normalizedCategory = match.id;
          else {
            // Last resort: map common legacy labels
            const legacy = rawCat.toLowerCase();
            if (legacy.includes('food')) normalizedCategory = 'culinary';
            else if (legacy.includes('fitness') || legacy.includes('sport')) normalizedCategory = 'sports';
            else if (legacy.includes('tech')) normalizedCategory = 'tech';
            else if (legacy.includes('art') || legacy.includes('creative')) normalizedCategory = 'creative';
            else if (legacy.includes('outdoor')) normalizedCategory = 'outdoor';
            else normalizedCategory = 'social';
          }
        }
      }
    } catch (err) {
      normalizedCategory = 'social';
    }

    return {
      id,
      name: data.eventName || data.name || "Untitled Trybe",
      eventName: data.eventName || data.name || "Untitled Trybe",
  hostName: data.createdByName || data.hostName || data.createdBy || "Unknown",
      location: data.location || "",
      date: dateStr,
      time: data.time,
      duration: data.duration,
  attendees: typeof data.attendees === 'number' ? data.attendees : Number(data.attendees) || 1,
  maxCapacity: typeof data.maxCapacity === 'number' ? data.maxCapacity : Number(data.maxCapacity) || 10,
  fee: data.fee ?? "Free",
  image: (data._resolvedImage as string) || image || data.image || undefined,
      eventImages: data.photos || data.eventImages || [],
  hostImage: data.createdByImage || data.hostImage || undefined,
  category: normalizedCategory,
      isPopular: Boolean(data.isPopular),
      host: data.host || data.createdBy || "",
      rating: data.rating ?? 5,
      interests: data.interests || [],
      description: data.description || "",
      isPremium: Boolean(data.isPremium),
      ageRange: data.ageRange || [18, 65],
  // recurrence removed — ignore repeatOption if present in legacy docs
    };
  });

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

  // Derive displayed trybes by merging Firestore results with provider events (featuredTrybes)
  // This ensures newly-created trybes added via the provider (addEvent) appear immediately
  const mergedTrybes = [
    ...(mappedFirestoreTrybes || []),
    // add provider events that aren't present in Firestore results yet
    ...(featuredTrybes || []).filter((f: any) => !(mappedFirestoreTrybes || []).some((m: any) => String(m.id) === String(f.id)))
  ];

  const displayedTrybes = (mergedTrybes || [])
    .filter((t: any) => {
      // Category filter
      if (!categoryMatches(t.category)) return false;
      // Search filter (simple name search)
      if (searchQuery && searchQuery.trim().length > 0) {
        const q = searchQuery.trim().toLowerCase();
        const name = (t.eventName || t.name || '').toString().toLowerCase();
        const loc = (t.location || '').toString().toLowerCase();
        return name.includes(q) || loc.includes(q);
      }
      return true;
    });

  const finalDisplayedTrybes = displayedTrybes;

  // Nearby filtering helpers (kept local for now). Use only when user grants location.
  const nearbyRadiusKm = 50; // default radius
  const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const aa = sinDLat * sinDLat + sinDLon * sinDLon * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
    return R * c;
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      setLocationPermissionDenied(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationPermissionDenied(false);
        setShowAllNearby(false);
      },
      (err) => {
        console.warn('Geolocation denied or failed', err);
        setLocationPermissionDenied(true);
        setUserLocation(null);
      },
      { enableHighAccuracy: true, maximumAge: 60 * 1000 }
    );
  };

  // Compute nearby trybes when we have a userLocation and showAllNearby is false
  const nearbyTrybes = (finalDisplayedTrybes || []).filter((t: any) => {
    // trybe may have precise coords as locationCoords or fallback to null
    const coords = (t as any).locationCoords || (t as any).coords || null;
    if (!userLocation) return false;
    if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') return false;
    const d = haversineKm(userLocation, coords);
    return d <= nearbyRadiusKm;
  });

  // Fetch trybes from Firestore on mount
  useEffect(() => {
    let mounted = true;

    async function loadTrybes() {
      try {
        const q = collection(db, "trybes");
        const snap = await getDocs(q);
        const rawDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Optimistic: show results immediately (use placeholder or stored image),
        // then asynchronously resolve storage download URLs in background per item
        if (mounted) {
          // store initial docs so UI can render quickly
          setFirestoreTrybes(rawDocs as any[]);
          console.debug('Loaded trybes (optimistic):', rawDocs.map(d => ({ id: (d as any).id, photos: (d as any).photos, image: (d as any).image })));
        }

        // Background resolution of storage paths (non-blocking)
        (async () => {
          const storage = getStorage(app);

          for (const doc of rawDocs) {
            const data: any = doc;
            const candidate = Array.isArray(data.photos) && data.photos.length > 0 ? data.photos[0] : data.image;

            if (!candidate || isHttpDataOrRelative(candidate)) {
              // nothing to resolve
              continue;
            }

            const refPath = normalizeStorageRefPath(String(candidate));

            try {
              const ref = storageRef(storage, refPath);
              const url = await getDownloadURL(ref);

              // Patch the specific trybe in state with the resolved URL
              setFirestoreTrybes(prev => (prev || []).map((p: any) => p.id === doc.id ? { ...p, _resolvedImage: url } : p));
              console.debug('Resolved storage image for', doc.id, url);
            } catch (err) {
              console.warn('Failed to resolve storage image url for', candidate, err);
            }
          }
        })();
      } catch (err) {
        console.error("Failed to load trybes from Firestore:", err);
      }
    }

    loadTrybes();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      {localStorage.getItem('showDebugEvents') === '1' && <EventsDebugOverlay />}
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
                <span
                  className="pointer-events-none absolute inset-0 rounded-full p-[2px] animate-spin"
                  style={{ background: "conic-gradient(#F59E0B, #EC4899, #8B5CF6, #10B981, #F59E0B)" }}
                >
                  <span className="block w-full h-full rounded-full bg-background" />
                </span>
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F5c6becf7cef04a3db5d3620ce9b103bd%2F0880b93857be41f7bd6c705364449846?format=webp&width=800"
                  alt="AI Assistant"
                  className="relative z-10 w-5 h-5 object-contain"
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
            {CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category.id;

              return (
                <Button
                  key={category.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  title={category.label}
                  className={cn(
                    // responsive max widths: compact on phones, expand on larger screens
                    "flex-shrink-0 rounded-full h-9 px-4 max-w-[8rem] md:max-w-[10rem] lg:max-w-[12rem] truncate",
                    isSelected && "bg-primary text-primary-foreground",
                  )}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.label}
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
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={() => setShowSimilar(true)}>
                  See All
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {finalDisplayedTrybes.map((trybe) => (
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
                      <SafeImg
                        src={(trybe as any)._resolvedImage || (trybe as any).image || ''}
                        alt={trybe.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        debugContext={`Home:recommended:${String(trybe.id)}`}
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
                              if (trybe.isPremium && PREMIUM_ENABLED) {
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
                              if (trybe.isPremium && PREMIUM_ENABLED) {
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
                  {displayedTrybes.slice(0, 4).map((trybe) => (
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
                        <SafeImg
                          src={(trybe as any)._resolvedImage || (trybe as any).image || ''}
                          alt={trybe.name}
                          className="w-full h-full object-cover"
                          debugContext={`Home:similar:${String(trybe.id)}`}
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
                                if (trybe.isPremium && PREMIUM_ENABLED) {
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
                              if (trybe.isPremium && PREMIUM_ENABLED) {
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
              <div className="flex items-center space-x-2">
                {!userLocation && (
                  <Button variant="outline" size="sm" onClick={locateMe}>
                    Use my location
                  </Button>
                )}
                {locationPermissionDenied && (
                  <div className="text-xs text-muted-foreground">Location denied</div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMap(true)}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  View Map
                </Button>
              </div>
            </div>

            {userLocation && !showAllNearby && nearbyTrybes.length === 0 ? (
              <div className="bg-card/50 p-4 rounded-lg border border-border text-center">
                <div className="font-medium mb-2">No nearby Trybes found</div>
                <div className="text-sm text-muted-foreground mb-3">There are no Trybes within {nearbyRadiusKm} km of your location.</div>
                <div className="flex justify-center">
                  <Button size="sm" onClick={() => setShowAllNearby(true)}>Show all Trybes</Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {((userLocation && !showAllNearby) ? nearbyTrybes : finalDisplayedTrybes).slice(0, 4).map((trybe) => (
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
                    <SafeImg
                      src={(trybe as any)._resolvedImage || (trybe as any).image || ''}
                      alt={trybe.name}
                      className="w-full h-full object-cover"
                      debugContext={`Home:nearby:${String(trybe.id)}`}
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
                            if (trybe.isPremium && PREMIUM_ENABLED) {
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
                          if (trybe.isPremium && PREMIUM_ENABLED) {
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
              )}
            </div>

          {/* My Schedule removed from Home — a dedicated My Schedule tab exists instead */}


          {/* Empty state */}
          {searchQuery && displayedTrybes.length === 0 && (
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
