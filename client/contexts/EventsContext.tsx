import { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
import { collection, getDocs, doc as firestoreDoc, updateDoc, arrayUnion, arrayRemove, increment, getDoc, setDoc, onSnapshot, addDoc, serverTimestamp, query, orderBy, runTransaction, where } from "firebase/firestore";
import { useToast } from '@/hooks/use-toast';
import { db, app } from "../firebase";
import { getStorage, ref as storageRef, getDownloadURL } from 'firebase/storage';
import { looksLikeDataUrl, isHttpDataOrRelative, normalizeStorageRefPath, isTrustedExternalImage } from '@/lib/imageUtils';
import { onUserChanged, auth } from "@/auth";

interface Event {
  id: string | number;
  name?: string;
  eventName?: string;
  hostName?: string;
  hostAge?: number;
  location?: string;
  date?: string;
  attendees?: number;
  maxCapacity?: number;
  fee?: string;
  image?: string;
  photos?: string[];
  _resolvedImage?: string;
  eventImages?: string[]; // For swipe format
  hostImage?: string; // For swipe format
  category?: string;
  isPopular?: boolean;
  host?: string;
  rating?: number;
  interests?: string[];
  description?: string;
  isPremium?: boolean;
  ageRange?: [number, number];
  time?: string;
  duration?: string | number;
  createdBy?: string;
  attendeeIds?: string[];
}

interface Chat {
  id: string | number;
  eventId: string | number;
  eventName: string;
  eventImage: string;
  participants: number;
  lastMessage: string;
  time: string;
  unreadCount: number;
  messages: Message[];
  participantNames?: string[];
  participantProfiles?: Array<{ id: string; name: string; image?: string; imageResolved?: string }>
}

interface Message {
  id: string | number;
  senderId: string;
  senderName: string;
  senderImage?: string;
  content: string;
  attachmentUrl?: string | null;
  timestamp: string;
  isCurrentUser: boolean;
  clientId?: string;
}

interface UserRating {
  eventId: number;
  rating: number; // 1-5 stars
  isPrivate: boolean; // Always true for user ratings
}

interface HostRating {
  eventId: number;
  hostName?: string;
  rating: number; // 1-5
  isPrivate: boolean;
}

interface Connection {
  id: number;
  name: string;
  image: string;
  eventId: string | number;
  eventName: string;
  connectedAt: string;
}

interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserImage: string;
  toUserId: string;
  toUserName: string;
  eventId: string | number;
  eventName: string;
  status: 'pending' | 'accepted' | 'declined';
  sentAt: string;
  respondedAt?: string;
}

interface EventsContextType {
  events: Event[];
  trybesLoaded?: boolean;
  addEvent: (eventData: any) => void;
  updateEvent: (eventId: string | number, updates: Partial<Event>, notify: boolean) => void;
  joinEvent: (eventId: string | number) => void;
  leaveEvent: (eventId: string | number) => void;
  joinedEvents: Array<string | number>;
  chats: Chat[];
  addMessage: (chatId: string | number, content: string, attachmentUrl?: string | null) => void;
  createChatForEvent: (eventId: string | number) => void;
  userRatings: UserRating[];
  hostRatings: HostRating[];
  rateEvent: (eventId: string | number, rating: number) => void;
  rateHost: (eventId: string | number, rating: number) => void;
  getUserRating: (eventId: string | number) => number | null;
  getHostRating: (eventId: string | number) => number | null;
  canRateEvent: (eventId: string | number) => boolean;
  isEventFinished: (eventId: string | number) => boolean;
  connections: Connection[];
  addConnection: (eventId: string | number) => void;
  isConnected: (eventId: string | number) => boolean;
  favoriteEvents: Array<string | number>;
  toggleFavorite: (eventId: string | number) => void;
  isFavorite: (eventId: string | number) => boolean;
  friendRequests: FriendRequest[];
  sendFriendRequest: (toUserId: string, toUserName: string, eventId: string | number) => void;
  acceptFriendRequest: (requestId: string) => void;
  declineFriendRequest: (requestId: string) => void;
  getFriendRequestStatus: (toUserId: string, eventId: number) => 'none' | 'pending' | 'accepted' | 'declined';
  canSendMessage: (toUserId: string, eventId: string | number) => boolean;
  markRead: (trybeId: string | number, uid?: string) => void;
  markChatAsRead: (chatId: string | number) => void;
  markAllChatsAsRead: () => void;
  // Friends
  friends: any[];
  addFriendRelation: (a: { id: string; name?: string; image?: string }, b: { id: string; name?: string; image?: string }) => void;
  getFriendsOf: (userId: string) => any[];
  setSharePreferenceForUser: (userId: string, allowed: boolean) => void;
}
const EventsContext = createContext<EventsContextType>({} as any);
const _SAMPLE_EVENTS: Event[] = [
  {
    id: 11,
    name: "Gourmet Cooking Class",
    eventName: "Gourmet Cooking Class",
    hostName: "Chef's Table",
    hostAge: 45,
    location: "Culinary Studio",
    date: "Wed 6:30 PM",
    attendees: 10,
    maxCapacity: 12,
    fee: "$60",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=600&fit=crop",
    category: "Food & Drink",
    isPopular: false,
    host: "Chef's Table",
    rating: 4.9,
    interests: ["Cooking", "Food", "Classes"],
    description: "Learn gourmet techniques from a professional chef in an intimate class.",
  },
  {
    id: 12,
    name: "Language Exchange Meetup",
    eventName: "Language Exchange Meetup",
    hostName: "Polyglot Circle",
    hostAge: 29,
    location: "Civic Center",
    date: "Tue 7:00 PM",
    attendees: 22,
    maxCapacity: 40,
    fee: "Free",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80&auto=format&fit=crop",
    eventImages: ["https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80&auto=format&fit=crop"],
    hostImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    category: "Education",
    isPopular: false,
    host: "Polyglot Circle",
    rating: 4.3,
    interests: ["Language", "Social", "Learning"],
    description: "Practice languages with native speakers in a casual, welcoming environment.",
  },
  {
    id: 13,
    name: "Sunrise Meditation",
    eventName: "Sunrise Meditation",
    hostName: "Calm Collective",
    hostAge: 33,
    location: "Lands End",
    date: "Mon 6:00 AM",
    attendees: 14,
    maxCapacity: 20,
    fee: "$5",
    image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400&h=600&fit=crop",
    category: "Wellness",
    isPopular: false,
    host: "Calm Collective",
    rating: 4.8,
    interests: ["Meditation", "Wellness", "Mindfulness"],
    description: "Start your week with a guided group meditation as the sun rises.",
  },
  {
    id: 14,
    name: "Outdoor Photography Walk",
    eventName: "Outdoor Photography Walk",
    hostName: "Shutterbugs",
    hostAge: 36,
    location: "Presidio",
    date: "Sat 10:00 AM",
    attendees: 12,
    maxCapacity: 20,
    fee: "$20",
    image: "https://cdn.builder.io/api/v1/image/assets%2F5c6becf7cef04a3db5d3620ce9b103bd%2F55c1b0c99abb442eaf238a298dbf7cf4?format=webp&width=1200",
    eventImages: [
      "https://cdn.builder.io/api/v1/image/assets%2F5c6becf7cef04a3db5d3620ce9b103bd%2F55c1b0c99abb442eaf238a298dbf7cf4?format=webp&width=1200",
      "https://images.unsplash.com/photo-1499084732479-de2c02d45fc4?w=1200&q=80&auto=format&fit=crop"
    ],
    hostImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    category: "Photography",
    isPopular: false,
    host: "Shutterbugs",
    rating: 4.6,
    interests: ["Photography", "Outdoors", "Art"],
    description: "Capture scenic views on a guided walk with tips from local photographers.",
  },
  {
    id: 15,
    name: "Startup Pitch Night",
    eventName: "Startup Pitch Night",
    hostName: "Founders Forum",
    hostAge: 34,
    location: "Incubator Space",
    date: "Thu 7:30 PM",
    attendees: 40,
    maxCapacity: 80,
    fee: "$15",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=600&fit=crop",
    category: "Professional",
    isPopular: true,
    host: "Founders Forum",
    rating: 4.7,
    interests: ["Startups", "Pitch", "Investors"],
    description: "Watch founders pitch their ideas and network with investors and mentors.",
  },
  {
    id: 16,
    name: "Late Night Comedy Open Mic",
    eventName: "Late Night Comedy Open Mic",
    hostName: "Laugh Loft",
    hostAge: 30,
    location: "Downtown Club",
    date: "Fri 10:30 PM",
    attendees: 50,
    maxCapacity: 70,
    fee: "$8",
    image: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=400&h=600&fit=crop",
    category: "Nightlife",
    isPopular: true,
    host: "Laugh Loft",
    rating: 4.5,
    interests: ["Comedy", "Open Mic", "Nightlife"],
    description: "Local comedians try out new material at this weekly open mic.",
  },
  {
    id: 17,
    name: "Community Book Club",
    eventName: "Community Book Club",
    hostName: "Readers Circle",
    hostAge: 42,
    location: "Public Library",
    date: "Wed 6:00 PM",
    attendees: 18,
    maxCapacity: 25,
    fee: "Free",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop",
    category: "Books",
    isPopular: false,
    host: "Readers Circle",
    rating: 4.4,
    interests: ["Books", "Discussion", "Community"],
    description: "Join a monthly discussion of contemporary fiction and nonfiction picks.",
  },
  {
    id: 18,
    name: "Climbing Gym Meetup",
    eventName: "Climbing Gym Meetup",
    hostName: "Vertical Club",
    hostAge: 29,
    location: "ClimbMax",
    date: "Sat 2:00 PM",
    attendees: 22,
    maxCapacity: 30,
    fee: "$12",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=600&fit=crop",
    category: "Sports",
    isPopular: false,
    host: "Vertical Club",
    rating: 4.6,
    interests: ["Climbing", "Fitness", "Sports"],
    description: "Beginner-friendly climbing session with experienced spotters and tips.",
  },
  {
    id: 22,
    name: "Photography Editing Workshop",
    eventName: "Photography Editing Workshop",
    hostName: "Pixel Lab",
    hostAge: 35,
    location: "Studio 12",
    date: "Sun 3:00 PM",
    attendees: 8,
    maxCapacity: 12,
    fee: "$30",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80&auto=format&fit=crop",
    eventImages: ["https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80&auto=format&fit=crop"],
    hostImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    category: "Workshops",
    isPopular: false,
    host: "Pixel Lab",
    rating: 4.8,
    interests: ["Photography", "Editing", "Workshops"],
    description: "Bring your photos and learn editing workflows in Lightroom and Photoshop.",
  },
  {
    id: 23,
    name: "Pop-Up Language Cafe",
    eventName: "Pop-Up Language Cafe",
    hostName: "Cafe Lingua",
    hostAge: 33,
    location: "Local Cafe",
    date: "Sat 10:00 AM",
    attendees: 24,
    maxCapacity: 35,
    fee: "Free",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=600&fit=crop",
    category: "Social",
    isPopular: false,
    host: "Cafe Lingua",
    rating: 4.2,
    interests: ["Language", "Coffee", "Conversation"],
    description: "Casual meetup to practice conversational skills over coffee.",
  },
  {
    id: 24,
    name: "City Bike Tour",
    eventName: "City Bike Tour",
    hostName: "Pedal Tours",
    hostAge: 36,
    location: "Embarcadero",
    date: "Sun 9:00 AM",
    attendees: 18,
    maxCapacity: 25,
    fee: "$20",
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80&auto=format&fit=crop",
    eventImages: ["https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80&auto=format&fit=crop"],
    hostImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    category: "Outdoors",
    isPopular: true,
    host: "Pedal Tours",
    rating: 4.6,
    interests: ["Cycling", "Tour", "Outdoors"],
    description: "Guided bike tour showcasing the city's landmarks and hidden gems.",
  },
];

export function EventsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const DEFAULT_IMAGES: Record<string, string> = {
    "Food & Drink": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80&auto=format&fit=crop",
    "Fitness": "https://images.unsplash.com/photo-1544161515-4ab0b4b4f1b6?w=800&q=80&auto=format&fit=crop",
    "Professional": "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80&auto=format&fit=crop",
    "Arts & Culture": "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80&auto=format&fit=crop",
    "Outdoors": "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80&auto=format&fit=crop",
    "Music": "https://images.unsplash.com/photo-1485579149621-3123dd979885?w=800&q=80&auto=format&fit=crop",
    "Workshops": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80&auto=format&fit=crop",
    "Volunteering": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80&auto=format&fit=crop",
    "Family": "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80&auto=format&fit=crop",
    "Photography": "https://images.unsplash.com/photo-1504198458649-3128b932f49b?w=800&q=80&auto=format&fit=crop",
    "Nightlife": "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=800&q=80&auto=format&fit=crop",
    "Books": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80&auto=format&fit=crop",
    "Sports": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80&auto=format&fit=crop",
    "Film": "https://images.unsplash.com/photo-1505686797002-d7a4850e0c5f?w=800&q=80&auto=format&fit=crop",
    "Fashion": "https://images.unsplash.com/photo-1495121605193-b116b5b09a6c?w=800&q=80&auto=format&fit=crop",
    "Gaming": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&q=80&auto=format&fit=crop",
    "Social": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80&auto=format&fit=crop",
    "Dance": "https://images.unsplash.com/photo-1515098380896-18db7ae9ed7c?w=800&q=80&auto=format&fit=crop",
    "Wellness": "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80&auto=format&fit=crop",
    "default": "https://images.unsplash.com/photo-1523206489230-fed1a3dfc9e0?w=800&q=80&auto=format&fit=crop",
  };

  function normalizeEvent(ev: any): Event {
    // Parse time which may be a Firestore Timestamp, ISO string or number
    let dateObj: Date | null = null;
    try {
      const t = ev.time;
      if (t) {
        if (typeof t === 'object' && typeof t.toDate === 'function') {
          dateObj = t.toDate();
        } else if (typeof t === 'string' || typeof t === 'number') {
          const parsed = new Date(t as any);
          if (!isNaN(parsed.getTime())) dateObj = parsed;
        }
      }
    } catch (err) {
      dateObj = null;
    }

    const dateStr = dateObj
      ? dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
      : (ev.date || '');

    const timeStr = dateObj ? dateObj.toISOString() : ev.time;

    // Prefer canonical explicit image fields first (image, eventImages, photos) then a trusted _resolvedImage.
    const imgCandidate = (ev.image && String(ev.image).trim())
      ? String(ev.image)
      : (ev.eventImages && ev.eventImages.length ? String(ev.eventImages[0]) : (ev.photos && Array.isArray(ev.photos) && ev.photos.length ? String(ev.photos[0]) : undefined));

    const resolvedCandidate = (ev._resolvedImage && typeof ev._resolvedImage === 'string') ? String(ev._resolvedImage).trim() : undefined;
    const img = imgCandidate || (resolvedCandidate && isTrustedExternalImage(resolvedCandidate) ? resolvedCandidate : undefined) || (DEFAULT_IMAGES[ev.category] || DEFAULT_IMAGES.default);
    const eventImages = ev.eventImages && ev.eventImages.length ? ev.eventImages : [img];
    // Prefer explicit creator fields if present. Show 'You' only when the current user is the host/creator.
  const currentUid = typeof auth !== 'undefined' ? auth.currentUser?.uid : undefined;
  const hostIsCurrent = currentUid && (String(ev.createdBy) === String(currentUid) || String(ev.host) === String(currentUid));
  const hostName = hostIsCurrent ? 'You' : (ev.createdByName || ev.hostName || ev.host || 'Event Host');
  const hostImage = (ev.createdByImage && String(ev.createdByImage).trim())
    ? String(ev.createdByImage)
    : (ev.hostImage && String(ev.hostImage).trim() ? String(ev.hostImage) : "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop");
    // Ensure numeric fields are numbers and have sensible defaults
    const attendees = typeof ev.attendees === 'number' ? ev.attendees : Number(ev.attendees) || 1;
    const maxCapacity = typeof ev.maxCapacity === 'number' ? ev.maxCapacity : Number(ev.maxCapacity) || 10;

    return { ...ev, image: img, eventImages, hostImage, hostName, attendees, maxCapacity, date: dateStr, time: timeStr } as Event;
  }

  // Resolve Storage references (gs://, storage paths) into public download URLs and patch events state
  async function resolveStorageImages(trybeDocs: any[]) {
    try {
      const storage = getStorage(app);
      for (const doc of trybeDocs) {
        const candidate = (doc._resolvedImage) || (Array.isArray(doc.photos) && doc.photos.length ? doc.photos[0] : doc.image);
        if (!candidate) continue;
        // If candidate is already a usable URL or a data: URL (including encoded forms), skip
        if (typeof candidate === 'string' && isHttpDataOrRelative(candidate)) {
          continue;
        }

        // Normalize candidate into a storage path for getDownloadURL
        let refPath = normalizeStorageRefPath(String(candidate));

        try {
          const ref = storageRef(storage, refPath);
          console.log('EventsContext.resolveStorageImages: attempting getDownloadURL for', String(doc.id), refPath);
          const url = await getDownloadURL(ref);
          // Patch the event in the provider state so UIs render immediately
          setEvents((prev) => (prev || []).map((p: any) => (String(p.id) === String(doc.id) ? { ...p, _resolvedImage: url, image: url } : p)));
          console.log('EventsContext: resolved storage image for', doc.id, url);
          // Best-effort: persist resolved URL back to Firestore only when the resolved URL is from a trusted origin.
          // This avoids writing third-party fallbacks (e.g., Unsplash) into the canonical trybe data.
          try {
            const trybeRef = firestoreDoc(db, 'trybes', String(doc.id));
            const updatePayload: any = {};
            const existingImage = doc && doc.image ? String(doc.image) : '';
            const trusted = isTrustedExternalImage(url);
            // Only write _resolvedImage to Firestore if the URL is trusted.
            if (trusted) updatePayload._resolvedImage = url;
            // Only update the canonical `image` if the existing stored image is not an inline data: URL
            // and the resolved URL is trusted.
            if (trusted && !(existingImage.startsWith('data:'))) {
              updatePayload.image = url;
            } else if (!trusted) {
              console.log('EventsContext: resolved URL not trusted; skipping persistence for', doc.id, url);
            }
            if (Object.keys(updatePayload).length > 0) {
              await updateDoc(trybeRef, updatePayload as any);
            }
          } catch (e) {
            // ignore persistence errors (permission rules etc.) but log for debugging
            console.log('EventsContext: failed to persist resolved image to trybe doc', doc.id, e);
          }
          // Additionally, try to resolve host info from users/{createdBy} when the trybe does not have createdByName/createdByImage
          try {
            const uid = doc.createdBy || doc.createdById || doc.createdByUser || null;
            if (uid && (!doc.createdByName || !doc.createdByImage)) {
              const ud = await getDoc(firestoreDoc(db, 'users', String(uid)));
              if (ud.exists()) {
                const udv: any = ud.data();
                const hostName = (udv.firstName || udv.displayName || udv.name) + (udv.lastName ? ` ${udv.lastName}` : '');
                let hostImage: any = udv.avatar || udv.photoURL || (Array.isArray(udv.photos) && udv.photos[0]) || udv.profilePicture || undefined;
                if (hostImage && typeof hostImage === 'string' && !isHttpDataOrRelative(hostImage)) {
                  try {
                    const refP = normalizeStorageRefPath(String(hostImage));
                    const resolved = await getDownloadURL(storageRef(storage, refP));
                    hostImage = resolved;
                  } catch (e) {
                    // ignore resolution error
                  }
                }
                setEvents((prev) => (prev || []).map((p: any) => (String(p.id) === String(doc.id) ? { ...p, hostName: hostName || p.hostName, hostImage: hostImage || p.hostImage } : p)));
              }
            }
          } catch (e) {
            // ignore host resolution errors
          }
        } catch (err) {
          console.log('EventsContext: failed to resolve storage image for', doc.id, candidate, err);
        }
      }
    } catch (err) {
      console.log('EventsContext: resolveStorageImages unexpected error', err);
    }
  }

  // Start with an empty list so the UI doesn't flash seeded placeholder events.
  // Real trybes will be loaded from cache or Firestore in the startup effect below.
  const [events, setEvents] = useState<Event[]>([]);
  const [trybesLoaded, setTrybesLoaded] = useState<boolean>(false);
  const [joinedEvents, setJoinedEvents] = useState<Array<string | number>>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [userRatings, setUserRatings] = useState<UserRating[]>([]);
  const [hostRatings, setHostRatings] = useState<HostRating[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [favoriteEvents, setFavoriteEvents] = useState<number[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  interface FriendEntry {
    userId: string; // owner
    friendId: string;
    friendName: string;
    friendImage?: string;
    joinedEventIds: number[];
    shareEvents?: boolean; // whether this friend allows sharing their joined events
    connectedAt: string;
  }

  const [friends, setFriends] = useState<FriendEntry[]>([]);

  // Ensure any events that still reference storage paths are resolved to download URLs
  // This central effect patches provider state so all consumers (Home, Schedule, Swipe, etc.)
  // receive resolved HTTP URLs in `image` / `_resolvedImage` and don't need to resolve themselves.
  useEffect(() => {
    try {
      const toResolve = (events || []).filter((ev: any) => {
        const candidate = (ev && (ev._resolvedImage || (Array.isArray(ev.eventImages) && ev.eventImages.length ? ev.eventImages[0] : ev.image)));
        if (!candidate || typeof candidate !== 'string') return false;
        const s = candidate as string;
        return !(s.startsWith('http') || s.startsWith('data:') || s.startsWith('/'));
      });
      if (toResolve.length > 0) {
        // resolveStorageImages will patch provider state with resolved URLs
        void resolveStorageImages(toResolve as any[]);
      }
    } catch (err) {
      console.debug('EventsContext: auto-resolve effect error', err);
    }
  }, [events]);

  // Keep track of realtime listeners for chats so we can unsubscribe when leaving
  const chatListenersRef = useRef<Record<string, () => void>>({});

  function sampleJoinedEvents(): number[] {
    // pick up to 3 random upcoming events
    const ids: Array<string | number> = events.map(e => e.id);
    const sample: Array<string | number> = [];
    const count = Math.min(3, Math.max(1, Math.floor(Math.random() * 3) + 1));
    for (let i = 0; i < count; i++) {
      const id = ids[Math.floor(Math.random() * ids.length)];
      if (!sample.includes(id)) sample.push(id);
    }
    // Return numbers where possible to keep original contract
    return sample.map(s => (typeof s === 'number' ? s : (isNaN(Number(s)) ? s : Number(s)))) as any;
  }

  function addFriendRelation(userA: { id: string; name?: string; image?: string }, userB: { id: string; name?: string; image?: string }) {
    const now = new Date().toISOString();
    setFriends(prev => {
      const next = [...prev];
      // add A->B
      if (!next.find(f => f.userId === userA.id && f.friendId === userB.id)) {
        next.push({ userId: userA.id, friendId: userB.id, friendName: userB.name || '', friendImage: userB.image, joinedEventIds: sampleJoinedEvents(), shareEvents: true, connectedAt: now });
      }
      // add B->A
      if (!next.find(f => f.userId === userB.id && f.friendId === userA.id)) {
        next.push({ userId: userB.id, friendId: userA.id, friendName: userA.name || '', friendImage: userA.image, joinedEventIds: sampleJoinedEvents(), shareEvents: true, connectedAt: now });
      }
      return next;
    });
  }

  function getFriendsOf(userId: string) {
    return friends.filter(f => f.userId === userId);
  }

  function setSharePreferenceForUser(userId: string, allowed: boolean) {
    setFriends(prev => prev.map(f => f.friendId === userId ? { ...f, shareEvents: allowed } : f));
  }

  const addEvent = (eventData: any) => {
    // Determine host info: prefer eventData.createdBy (uid) -> fetch user profile, else use auth.currentUser
    const determineHostInfo = async () => {
      try {
        // 1) Prefer explicit createdByName / createdByImage passed by the creator (fast path)
        if (eventData && (eventData.createdByName || eventData.createdByImage)) {
          return {
            name: eventData.createdByName || eventData.createdBy || 'You',
            image: eventData.createdByImage || undefined,
          };
        }

        // 2) Next prefer the app's local cached profile (localStorage.userProfile)
        try {
          const raw = localStorage.getItem('userProfile');
          if (raw) {
            const p = JSON.parse(raw);
            if (p) {
              const name = (p.firstName || p.displayName || p.name) + (p.lastName ? ` ${p.lastName}` : '');
              const image = p.photoURL || (Array.isArray(p.photos) && p.photos.length ? p.photos[0] : undefined) || p.avatar;
              if (name || image) return { name: name || 'You', image };
            }
          }
        } catch (e) {
          // ignore localStorage parsing issues
        }

        // 3) Try to fetch authoritative user profile from Firestore users/{uid}
        const uid = eventData.createdBy || auth.currentUser?.uid;
        if (uid) {
          try {
            const ud = await getDoc(firestoreDoc(db, 'users', String(uid)));
            if (ud.exists()) {
              const udv: any = ud.data();
              // If the stored avatar/profile picture is a Storage path (gs:// or path), try to resolve it to a download URL
              let imageUrl = udv.avatar || udv.photoURL || udv.profilePicture || undefined;
              try {
                if (imageUrl && typeof imageUrl === 'string' && !isHttpDataOrRelative(imageUrl)) {
                  const storage = getStorage(app);
                  const refPath = normalizeStorageRefPath(String(imageUrl));
                  try {
                    imageUrl = await getDownloadURL(storageRef(storage, refPath));
                  } catch (err) {
                    // leave imageUrl as-is (may be invalid) and continue
                    console.debug('determineHostInfo: failed to resolve user avatar from storage', refPath, err);
                  }
                }
              } catch (err) {
                console.debug('determineHostInfo: unexpected error resolving avatar', err);
              }

              return { name: (udv.firstName || udv.displayName || udv.name || 'You') + (udv.lastName ? ` ${udv.lastName}` : ''), image: imageUrl };
            }
          } catch (e) {
            // ignore
          }
        }
      } catch (err) {}

      // 4) Fallback to auth.currentUser
      const au = auth.currentUser as any | null;
      if (au) return { name: au.displayName || au.email || 'You', image: au.photoURL || undefined };
      return { name: 'You', image: undefined };
    };

    // Build event after resolving host info
    (async () => {
      const hostInfo = await determineHostInfo();

      const newEvent: Event = {
      id: eventData.id ?? Date.now(), // Allow caller to provide id, fallback to timestamp
      name: eventData.eventName,
      eventName: eventData.eventName,
      hostName: hostInfo?.name || 'You',
      hostAge: 25, // Default age
      hostImage: hostInfo?.image || "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      host: eventData.createdBy || auth.currentUser?.uid || 'you',
      location: eventData.location,
      date: new Date(eventData.time).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
      time: eventData.time,
      duration: eventData.duration,
      attendees: 1, // Creator is first attendee
      maxCapacity: eventData.maxCapacity,
      fee: eventData.fee,
      image:
        (eventData.photos && eventData.photos[0]) ||
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=600&fit=crop",
      eventImages:
        eventData.photos && eventData.photos.length > 0
          ? eventData.photos
          : [
              "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=600&fit=crop",
              "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&h=600&fit=crop",
            ],
      category: eventData.category || "Social", // Default category
      isPopular: false,
      rating: 5.0,
      interests: eventData.interests || ["New Event"],
      description: eventData.description && eventData.description.trim().length > 0
        ? eventData.description
        : `Join us for ${eventData.eventName}! This is a newly created event.`,
      isPremium: Boolean(eventData.isPremium),
  ageRange: eventData.ageRange,
      // Include precise location fields if provided by creator
      // These come from CreateTrybeModal which sets locationCoords, placeId and formattedAddress
      // so downstream consumers (maps) can render accurate markers.
      // @ts-ignore allow extra properties on Event
      locationCoords: eventData.locationCoords ?? null,
      // @ts-ignore
      placeId: eventData.placeId ?? null,
      // @ts-ignore
      formattedAddress: eventData.formattedAddress ?? eventData.location ?? null,
    };
      // Apply host info
      newEvent.hostName = hostInfo.name;
      newEvent.hostImage = hostInfo.image || newEvent.hostImage;

      const normalized = normalizeEvent(newEvent);

      setEvents((prevEvents) => {
        const next = [normalized, ...prevEvents];

        try {
          // Persist to local cache with TTL (1 hour)
          const payload = { ts: Date.now(), items: next };
          localStorage.setItem('trybes_cache_v1', JSON.stringify(payload));
        } catch (e) {
          // ignore localStorage errors
        }

        return next;
      });
      // Mark creator as joined locally so UI reflects correct participant counts
      try {
        const uid = auth.currentUser?.uid;
        if (uid) setJoinedEvents((prev) => {
          if (prev.map(String).includes(String(normalized.id))) return prev;
          return [...prev, normalized.id as any];
        });
      } catch (e) {}
      // Ensure a chat exists for newly created trybe so creator sees it in Chats
      try {
        setTimeout(() => {
          try {
            // createChatForEvent is defined later; schedule to avoid temporal ordering issues
            // create persistent chat doc and subscribe creator
            // @ts-ignore
            if (typeof createChatForEvent === 'function') createChatForEvent(newEvent.id);
            // Also create persistent Firestore chat doc for this trybe so it exists for participants
                // No persistent `chats` document is created in the new model.
                // Messages will live under trybes/{trybeId}/messages and
                // membership is canonical on trybes/{trybeId}.attendeeIds.
            // Also subscribe the current user to the chat so it appears in their Chats view
            // @ts-ignore
            if (typeof subscribeToChat === 'function') subscribeToChat(newEvent.id);
          } catch (e) {
            // ignore
          }
        }, 0);
      } catch (err) {}
    })();
  };

  // On mount, attempt to read cached trybes and prefetch first images
  useEffect(() => {
    try {
      const raw = localStorage.getItem('trybes_cache_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
  // TTL 5 minutes
  if (parsed && parsed.ts && Date.now() - parsed.ts < 1000 * 60 * 5 && Array.isArray(parsed.items)) {
          setEvents(parsed.items.map((e: Event) => normalizeEvent(e)));
          // Prefetch first few images to speed up initial paint
          const toPrefetch = (parsed.items as Event[]).slice(0, 6).map((e) => e.image).filter(Boolean) as string[];
          toPrefetch.forEach((src) => {
            try {
              const img = new Image();
              img.src = src;
            } catch (err) {}
          });
          setTrybesLoaded(true);
          return;
        }
      }
    } catch (e) {
      // ignore JSON parse/localStorage errors
    }

    // If no cache or expired, attempt to fetch trybes from Firestore so the app
    // has real user-created trybes available at startup (avoid splash hiding too early).
    (async () => {
      try {
        const q = collection(db, 'trybes');
        const snap = await getDocs(q);
        const rawDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log('🔍 Fetched trybes from Firestore:', rawDocs.length);
        console.log('🔍 Sample trybe data:', rawDocs[0]);
        if (Array.isArray(rawDocs) && rawDocs.length > 0) {
          // Add raw docs into provider (normalized) so UI can render quickly
          const normalized = rawDocs.map((d: any) => normalizeEvent(d));
          console.log('🔍 Normalized events:', normalized.length);
          console.log('🔍 Sample normalized event:', normalized[0]);
          setEvents(normalized);

          // Attempt to resolve any storage references to download URLs and patch provider state
          void resolveStorageImages(rawDocs as any[]);

          // Prefetch a few images for faster paint
          const toPrefetch = normalized.slice(0, 6).map((e) => e.image).filter(Boolean) as string[];
          toPrefetch.forEach((src) => {
            try {
              const img = new Image();
              img.src = src;
            } catch (err) {}
          });
        } else {
          // No trybes in Firestore: remove any local cache and ensure provider has no events
          try { localStorage.removeItem('trybes_cache_v1'); } catch (e) {}
          setEvents([]);
        }
      } catch (err) {
        // If fetch fails, we keep initialEvents (no-op)
        console.debug('EventsProvider: failed to fetch trybes from Firestore at startup', err);
      } finally {
        setTrybesLoaded(true);
      }
    })();
  }, []);

  const updateEvent = (eventId: string | number, updates: Partial<Event>, notify: boolean) => {
    setEvents(prev => {
      const prevEvent = prev.find(e => e.id === eventId);
      if (!prevEvent) return prev;

      const applied: Partial<Event> = { ...updates };
      if (applied.eventName) {
        applied.name = applied.eventName;
      }
      if (applied.time) {
        applied.date = new Date(applied.time).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
      }
      if (applied.eventImages && applied.eventImages.length > 0) {
        applied.image = applied.eventImages[0];
      }

      const nextEvents = prev.map(e => e.id === eventId ? { ...e, ...applied } : e);

      if (notify) {
        const oldE = prevEvent;
        const newE = nextEvents.find(e => e.id === eventId)!;
        const changes: string[] = [];
        if (applied.eventName && applied.eventName !== (oldE.eventName || oldE.name)) {
          changes.push(`• Name: ${oldE.eventName || oldE.name} → ${newE.eventName || newE.name}`);
        }
        if (applied.location && applied.location !== oldE.location) {
          changes.push(`• Location: ${oldE.location} → ${newE.location}`);
        }
        if (applied.time) {
          changes.push(`• Time: ${oldE.time ? new Date(oldE.time).toLocaleString() : oldE.date} → ${newE.time ? new Date(newE.time).toLocaleString() : newE.date}`);
        }
        if (applied.duration && applied.duration !== oldE.duration) {
          changes.push(`• Duration: ${oldE.duration || '-'} → ${newE.duration}`);
        }
        if (typeof applied.maxCapacity === 'number' && applied.maxCapacity !== oldE.maxCapacity) {
          changes.push(`• Capacity: ${oldE.maxCapacity} → ${newE.maxCapacity}`);
        }
        if (applied.fee && applied.fee !== oldE.fee) {
          changes.push(`• Fee: ${oldE.fee} → ${newE.fee}`);
        }
        if (applied.ageRange && JSON.stringify(applied.ageRange) !== JSON.stringify(oldE.ageRange)) {
          changes.push(`• Age Range: ${oldE.ageRange ? `${oldE.ageRange[0]}-${oldE.ageRange[1]}` : '-'} → ${newE.ageRange ? `${newE.ageRange[0]}-${newE.ageRange[1]}` : '-'}`);
        }
        // recurrence removed — no repeatOption to report
        if (applied.eventImages && oldE.eventImages) {
          if (applied.eventImages.length !== oldE.eventImages.length) {
            changes.push(`• Photos: ${oldE.eventImages.length} → ${newE.eventImages?.length || 0}`);
          }
        }
        if (typeof applied.isPremium === 'boolean' && applied.isPremium !== !!oldE.isPremium) {
          changes.push(`• Premium: ${oldE.isPremium ? 'Yes' : 'No'} → ${newE.isPremium ? 'Yes' : 'No'}`);
        }
        if (applied.description && applied.description !== oldE.description) {
          changes.push(`• Description updated`);
        }

        if (changes.length > 0) {
          const content = `Event updated by host:\n${changes.join("\n")}`;
          // Post a system message to the event chat if it exists and sync metadata
          setChats(prevChats => prevChats.map(chat => {
            if (chat.eventId !== eventId) return chat;
            const msg: Message = {
              id: Date.now(),
              senderId: 'system',
              senderName: 'System',
              content,
              timestamp: new Date().toISOString(),
              isCurrentUser: false,
            };
            return {
              ...chat,
              eventName: newE.eventName || newE.name,
              eventImage: newE.image,
              participants: newE.attendees,
              messages: [...chat.messages, msg],
              lastMessage: content,
              time: 'now',
              unreadCount: chat.unreadCount + 1,
            };
          }));
        }
      }

      return nextEvents;
    });
  };

  const joinEvent = (eventId: string | number) => {
    const idKey = String(eventId);
    console.debug('joinEvent: invoked', { eventId: idKey, joinedEventsBefore: joinedEvents.map(String) });
    if (!joinedEvents.map(String).includes(idKey)) {
      setJoinedEvents((prev) => [...prev, eventId as any]);

      // Update attendee count
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          String(event.id) === String(eventId)
            ? { ...event, attendees: event.attendees + 1 }
            : event,
        ),
      );

      // If the joined event isn't present in provider.events (e.g., user joined from a link), fetch it
  const exists = events.some((e) => String(e.id) === idKey);
      if (!exists) {
        (async () => {
          try {
            const td = await getDoc(firestoreDoc(db, 'trybes', String(eventId)));
            if (td.exists()) {
              const d = { id: td.id, ...(td.data() || {}) } as any;
              // Try to resolve the primary photo synchronously so schedule shows image immediately
              try {
                const candidate = (d._resolvedImage) || (Array.isArray(d.photos) && d.photos.length ? d.photos[0] : d.image);
                if (candidate && typeof candidate === 'string' && !isHttpDataOrRelative(candidate)) {
                  const refPath = normalizeStorageRefPath(String(candidate));
                  try {
                    const storage = getStorage(app);
                    const url = await getDownloadURL(storageRef(storage, refPath));
                    d._resolvedImage = url;
                    d.image = url;
                    console.debug('joinEvent: resolved image synchronously for', d.id, url);
                  } catch (err) {
                    console.debug('joinEvent: failed to resolve image synchronously', d.id, err);
                  }
                }
              } catch (err) {
                console.debug('joinEvent: unexpected error resolving image', err);
              }

              const normalized = normalizeEvent(d);
              // Add to provider events (dedupe)
              setEvents((prev) => {
                const existingIds = new Set(prev.map((p) => String(p.id)));
                if (existingIds.has(String(normalized.id))) return prev;
                return [ { ...normalized, attendees: (normalized.attendees || 0) + 1 }, ...prev ];
              });

              // Also run background resolver for any remaining refs
              void resolveStorageImages([d]);
            }
          } catch (err) {
            console.debug('joinEvent: failed to fetch trybe after join', eventId, err);
          }
        })();
      }

      // Create or update group chat for the event
      // Ensure persistent chat exists. Create the local chat immediately so UI shows it,
      // but defer attaching the real-time listener until we've persisted the join to Firestore
      // to avoid permission races (join -> ensure chat participant -> subscribe).
      createChatForEvent(eventId as any);
      // Use the consolidated join flow: ensure trybe then ensure chat participant, then subscribe.
      void (async () => {
        try {
            // joinTrybeAndSubscribe will perform the transactional trybe update and ensure chat participant
            if (typeof joinTrybeAndSubscribe === 'function') {
              console.debug('joinEvent: calling joinTrybeAndSubscribe', { eventId: String(eventId) });
              await joinTrybeAndSubscribe(String(eventId));
              console.debug('joinEvent: joinTrybeAndSubscribe completed', { eventId: String(eventId) });
            } else {
              // Fallback to existing flow
              console.debug('joinEvent: calling persistJoin fallback', { eventId: String(eventId) });
              const ok = await persistJoin(eventId);
              console.debug('joinEvent: persistJoin fallback result', { eventId: String(eventId), ok });
              if (typeof subscribeToChat === 'function') {
                console.debug('joinEvent: subscribing to chat after fallback persistJoin', { eventId: String(eventId) });
                subscribeToChat(eventId as any);
              }
            }
          } catch (e: any) {
            console.error('joinEvent: joinTrybeAndSubscribe failed', { code: e?.code, message: e?.message, error: e });
            // If the consolidated flow failed (for example due to an auth timing race),
            // attempt a best-effort persistJoin fallback so the join is saved to Firestore.
            try {
              console.debug('joinEvent: attempting fallback persistJoin after failure', { eventId: String(eventId), error: e?.message || e });
              const ok = await persistJoin(eventId).catch((pe: any) => {
                console.error('joinEvent: persistJoin threw', { code: pe?.code, message: pe?.message, error: pe });
                return false;
              });
              console.debug('joinEvent: fallback persistJoin result', { eventId: String(eventId), ok });
              if (ok && typeof subscribeToChat === 'function') {
                console.debug('joinEvent: subscribing to chat after fallback persistJoin (post-error)', { eventId: String(eventId) });
                subscribeToChat(eventId as any);
              }
            } catch (err) {
              console.debug('joinEvent: fallback persistJoin also failed', err);
            }
          }
      })();
    }
  };

  // Persist join to Firestore and user's profile when possible
  const persistJoin = async (eventId: string | number): Promise<boolean> => {
    try {
      const user = auth.currentUser;
      console.debug('persistJoin: invoked', { eventId: String(eventId), userUid: user?.uid });
      // Quick auth checks and diagnostics for permission errors
      if (!user) {
        console.debug('persistJoin: no authenticated user (aborting) for', String(eventId));
        try { toast?.({ title: 'Join failed', description: 'You must be signed in to join events.', variant: 'destructive' }); } catch (e) {}
        return;
      }
      try {
        // Try to log token presence (don't log token value itself)
        const token = await user.getIdToken(false).catch((e) => { console.debug('persistJoin: getIdToken failed', e); return null; });
        console.debug('persistJoin: auth.currentUser.uid=', user.uid, 'hasIdToken=', !!token);
      } catch (e) {
        console.debug('persistJoin: unexpected error while checking id token', e);
      }
      // Attempt to resolve the Firestore doc id from the in-memory events list.
  const ev = events.find((e) => String(e.id) === String(eventId) || String(e.id) === String(eventId));
  let userUpdated = false;
  let trybeUpdated = false;
      if (ev) {
  const trybeRef = firestoreDoc(db, 'trybes', String(ev.id));
        console.debug('persistJoin: updated user joinedEvents with', String(eventId));
        userUpdated = true;
        const pre = await getDoc(trybeRef);
        console.debug('persistJoin: trybe pre-state', { id: String(ev.id), exists: pre.exists(), data: pre.exists() ? pre.data() : null });

          console.debug('persistJoin: attempting transaction update on trybe', String(ev.id));
          try {
            await runTransaction(db, async (tx) => {
              const doc = await tx.get(trybeRef);
              const data: any = doc.exists() ? doc.data() : {};
              const existingIds: string[] = Array.isArray(data?.attendeeIds) ? data.attendeeIds : [];
              if (!existingIds.map(String).includes(String(user.uid))) {
                if (doc.exists()) {
                  tx.update(trybeRef, {
                    attendees: increment(1),
                    attendeeIds: arrayUnion(user.uid),
                  } as any);
                } else {
                  tx.set(trybeRef, { attendees: 1, attendeeIds: [user.uid] }, { merge: true } as any);
                }
              } else {
                // Ensure attendees numeric field is at least 1
                if (!data || typeof data.attendees !== 'number' || Number(data.attendees) < 1) {
                  if (doc.exists()) tx.update(trybeRef, { attendees: 1 } as any);
                  else tx.set(trybeRef, { attendees: 1 }, { merge: true } as any);
                }
              }
            });
            trybeUpdated = true;
            try {
              const post = await getDoc(trybeRef);
              console.debug('persistJoin: trybe post-state', { id: String(ev.id), exists: post.exists(), data: post.exists() ? post.data() : null });
            } catch (e) { console.debug('persistJoin: failed to read trybe post-state', e); }
          } catch (err) {
            console.debug('persistJoin: failed to update trybe doc with transaction, falling back', err);
            try {
              await updateDoc(trybeRef, {
                attendees: increment(1),
                attendeeIds: arrayUnion(user.uid),
              });
              trybeUpdated = true;
              try {
                const post2 = await getDoc(trybeRef);
                console.debug('persistJoin: trybe post-state (fallback)', { id: String(ev.id), exists: post2.exists(), data: post2.exists() ? post2.data() : null });
              } catch (e) { console.debug('persistJoin: failed to read trybe post-state after fallback', e); }
            } catch (err2) {
              console.error('persistJoin: fallback update failed', { code: (err2 as any)?.code, message: (err2 as any)?.message, error: err2 });
              try { toast?.({ title: 'Join failed', description: (err2 as any)?.message || 'Permission denied while updating server.', variant: 'destructive' }); } catch (e) {}
              // Propagate so caller can detect permission-denied at a higher level
              throw err2;
            }
          }
        // Note: In the new model messages live under trybes/{trybeId}/messages.
        // We no longer create or maintain a separate `chats` document here to avoid
        // duplication and permission races. The canonical membership is kept on
        // trybes/{trybeId}.attendeeIds which rules will consult for message access.
      } else {
        // Fallback: try updating by the passed id (may be string id)
        try {
          const trybeRef = firestoreDoc(db, 'trybes', String(eventId));
          try {
            await runTransaction(db, async (tx) => {
              const doc = await tx.get(trybeRef);
              const data: any = doc.exists() ? doc.data() : {};
              const existingIds: string[] = Array.isArray(data?.attendeeIds) ? data.attendeeIds : [];
              if (!existingIds.map(String).includes(String(user.uid))) {
                if (doc.exists()) {
                  tx.update(trybeRef, {
                    attendees: increment(1),
                    attendeeIds: arrayUnion(user.uid),
                  } as any);
                } else {
                  tx.set(trybeRef, { attendees: 1, attendeeIds: [user.uid] }, { merge: true } as any);
                }
              }
            });
          } catch (readErr) {
              // fallback best-effort update
              try {
                await updateDoc(trybeRef, {
                  attendees: increment(1),
                  attendeeIds: arrayUnion(user.uid),
                });
                trybeUpdated = true;
          } catch (e) {
            console.error('persistJoin: fallback update failed', { code: (e as any)?.code, message: (e as any)?.message, error: e });
            try { toast?.({ title: 'Join failed', description: (e as any)?.message || 'Permission denied while updating server.', variant: 'destructive' }); } catch (err) {}
            throw e;
          }
            }
        } catch (err) {
          console.debug('persistJoin: fallback failed to update trybe doc', err);
        }
        // In the parent-anchored model we do not create or update a separate `chats` document here.
        // Membership and message access are managed via trybes/{trybeId}.attendeeIds and
        // messages in trybes/{trybeId}/messages.
      }

      // Refresh the local event data for this trybe from Firestore so UI shows updated attendee count
      try {
        const refreshId = String(eventId);
        const refreshRef = firestoreDoc(db, 'trybes', refreshId);
        const refreshedSnap = await getDoc(refreshRef);
        if (refreshedSnap.exists()) {
          const refreshed: any = { id: refreshedSnap.id, ...(refreshedSnap.data() || {}) };
          // Normalize and patch local events list with authoritative counts and attendeeIds
          setEvents((prev) => prev.map((e) => String(e.id) === String(refreshed.id) ? { ...e, attendees: typeof refreshed.attendees === 'number' ? refreshed.attendees : e.attendees, attendeeIds: Array.isArray(refreshed.attendeeIds) ? refreshed.attendeeIds : (e as any).attendeeIds } : e));
        }
      } catch (err) {
        console.debug('persistJoin: failed to refresh local trybe after join', err);
  try { toast?.({ title: 'Join warning', description: 'Joined locally but could not refresh server data. Changes may not be persisted.', variant: 'default' }); } catch (e) {}
      }

      // NOTE: Do not remove chat participants here — this function persists a join.
      // Participant removal is handled by `persistLeave` when the user explicitly leaves an event.

      const userRef = firestoreDoc(db, 'users', user.uid);
      try {
        // Try to update existing user doc
        await updateDoc(userRef, { joinedEvents: arrayUnion(String(eventId)) });
        console.debug('persistJoin: updated user joinedEvents with', String(eventId));
      } catch (err) {
        // If update fails (doc may not exist), create or merge the doc with joinedEvents
        try {
          await setDoc(userRef, { joinedEvents: [String(eventId)] }, { merge: true });
          console.debug('persistJoin: set user joinedEvents (merge) with', String(eventId));
        } catch (e) {
          console.debug('persistJoin: failed to update or create user joinedEvents', err, e);
        }
      }
    } catch (err) {
      console.debug('persistJoin: unexpected error', err);
    }
  };

  const leaveEvent = (eventId: string | number) => {
    const idKey = String(eventId);
    console.debug('leaveEvent: requested for', idKey, 'joinedEvents(before)=', joinedEvents.map(String));
    setJoinedEvents((prev) => {
      const next = prev.filter((id) => String(id) !== idKey);
      console.debug('leaveEvent: updated joinedEvents (after)=', next.map(String));
      return next;
    });

    // Update attendee count
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        String(event.id) === idKey
          ? { ...event, attendees: Math.max(1, event.attendees - 1) }
          : event,
      ),
    );

    // Unsubscribe realtime listener for this chat (if any)
    try {
  const key = `trybe-${idKey}`;
  const unsub = chatListenersRef.current[key];
      if (unsub) {
        try { unsub(); } catch (e) {}
        try { delete chatListenersRef.current[key]; } catch (e) {}
      }
    try {
      const metaKey = `trybe-meta-${idKey}`;
      const metaUnsub = chatListenersRef.current[metaKey];
      if (metaUnsub) {
        try { metaUnsub(); } catch (e) {}
        try { delete chatListenersRef.current[metaKey]; } catch (e) {}
      }
    } catch (e) {}
    } catch (err) {}

    // Remove associated chat from local state
  // Normalize comparison to strings so chat entries are removed regardless of stored id type
  setChats((prevChats) => prevChats.filter((chat) => String(chat.eventId) !== String(eventId)));
    // Persist in background
    console.debug('leaveEvent: calling persistLeave for', idKey);
    void persistLeave(eventId);
  };

  // Persist leave to Firestore when possible
  const persistLeave = async (eventId: string | number) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.debug('persistLeave: no authenticated user, aborting leave for', String(eventId));
        try { toast?.({ title: 'Leave failed', description: 'You must be signed in to leave events.', variant: 'destructive' }); } catch (e) {}
        return;
      }
      try {
        const token = await (user as any).getIdToken?.();
        console.debug('persistLeave: auth.currentUser', { uid: user.uid, email: user.email, tokenLength: token ? token.length : 0, eventId: String(eventId) });
      } catch (e) {
        console.debug('persistLeave: getIdToken failed', e);
      }
  const ev = events.find((e) => String(e.id) === String(eventId) || String(e.id) === String(eventId));
      if (ev) {
        try {
          const trybeRef = firestoreDoc(db, 'trybes', String(ev.id));
          await runTransaction(db, async (tx) => {
            const doc = await tx.get(trybeRef);
            const data: any = doc.exists() ? doc.data() : {};
            const existingIds: string[] = Array.isArray(data?.attendeeIds) ? data.attendeeIds : [];
            if (existingIds.map(String).includes(String(user.uid))) {
              const current = typeof data.attendees === 'number' ? data.attendees : existingIds.length || 1;
              const newCount = Math.max(0, current - 1);
              tx.update(trybeRef, {
                attendees: newCount,
                attendeeIds: arrayRemove(user.uid),
              } as any);
            } else {
              // user not present in attendeeIds: ensure attendees not negative
              if (doc.exists() && (typeof data.attendees !== 'number' || data.attendees < 0)) {
                tx.update(trybeRef, { attendees: 0 } as any);
              }
            }
          });
        } catch (err) {
          console.error('persistLeave: failed to update trybe doc', { code: (err as any)?.code, message: (err as any)?.message, error: err });
          try { toast?.({ title: 'Leave failed', description: 'Could not update attendee count on server.', variant: 'destructive' }); } catch (e) {}
        }
      } else {
        try {
          const trybeRef = firestoreDoc(db, 'trybes', String(eventId));
          await runTransaction(db, async (tx) => {
            const doc = await tx.get(trybeRef);
            const data: any = doc.exists() ? doc.data() : {};
            const existingIds: string[] = Array.isArray(data?.attendeeIds) ? data.attendeeIds : [];
            if (existingIds.map(String).includes(String(user.uid))) {
              const current = typeof data.attendees === 'number' ? data.attendees : existingIds.length || 1;
              const newCount = Math.max(0, current - 1);
              tx.update(trybeRef, {
                attendees: newCount,
                attendeeIds: arrayRemove(user.uid),
              } as any);
            }
          });
        } catch (err) {
          console.error('persistLeave: fallback failed to update trybe doc', { code: (err as any)?.code, message: (err as any)?.message, error: err });
          try { toast?.({ title: 'Leave failed', description: 'Could not update attendee count on server.', variant: 'destructive' }); } catch (e) {}
        }
      }

      const userRef = firestoreDoc(db, 'users', user.uid);
      try {
        await updateDoc(userRef, { joinedEvents: arrayRemove(String(eventId)) });
      } catch (err) {
        // Fallback: try to read the doc and write the filtered joinedEvents array
        try {
          const snap = await getDoc(userRef);
          const data: any = snap.exists() ? snap.data() : {};
          const existing: string[] = Array.isArray(data?.joinedEvents) ? data.joinedEvents.map(String) : [];
          const filtered = existing.filter((x) => x !== String(eventId));
          await setDoc(userRef, { joinedEvents: filtered }, { merge: true });
        } catch (e) {
          console.debug('persistLeave: failed to update or fallback-write user joinedEvents', err, e);
        }
      }
    } catch (err) {
      console.debug('persistLeave: unexpected error', err);
      try { toast?.({ title: 'Leave failed', description: err?.message || 'Unexpected error while leaving event.', variant: 'destructive' }); } catch (e) {}
    }
  };

  // Load user's joinedEvents from Firestore when auth changes
  useEffect(() => {
    const unsub = onUserChanged(async (u) => {
      if (!u) {
        setJoinedEvents([]);
        return;
      }

      try {
        const userRef = firestoreDoc(db, 'users', u.uid);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
          const data: any = snapshot.data();
          if (Array.isArray(data.joinedEvents)) {
            const joined = data.joinedEvents as Array<string | number>;
            setJoinedEvents(joined as number[]);

            // Fetch the trybe docs for these joined ids so provider has full data (images, etc.)
            const fetchedTrybes: any[] = [];
            const validJoinedIds: (string | number)[] = [];
            for (const id of joined) {
              try {
                const td = await getDoc(firestoreDoc(db, 'trybes', String(id)));
                if (td.exists()) {
                  const d = { id: td.id, ...(td.data() || {}) };
                  fetchedTrybes.push(d as any);
                  validJoinedIds.push(id);
                } else {
                  console.log('🔍 Cleaning up deleted event from joinedEvents:', id);
                }
              } catch (err) {
                console.debug('Failed to fetch joined trybe doc', id, err);
              }
            }
            
            // Update joinedEvents to only include valid IDs
            if (validJoinedIds.length !== joined.length) {
              console.log('🔍 Updating joinedEvents in Firestore to remove deleted events');
              setJoinedEvents(validJoinedIds as number[]);
              try {
                await updateDoc(userRef, { joinedEvents: validJoinedIds.map(String) });
              } catch (err) {
                console.error('Failed to update joinedEvents in Firestore:', err);
              }
            }

            if (fetchedTrybes.length > 0) {
              // Normalize and merge at the front so user's joined trybes appear in events
              const normalized = fetchedTrybes.map((t) => normalizeEvent(t as any));
              setEvents((prev) => {
                // Deduplicate by id
                const existingIds = new Set(prev.map((p) => String(p.id)));
                const toAdd = normalized.filter((n) => !existingIds.has(String(n.id)));
                return [...toAdd, ...prev];
              });
              // Resolve storage images for the fetched joined trybes so schedule thumbnails show
              void resolveStorageImages(fetchedTrybes as any[]);
              // Subscribe to chats for joined trybes so they appear in Chats (realtime)
              try {
                fetchedTrybes.forEach((t: any) => {
                  try {
                    // @ts-ignore - subscribeToChat may be defined below
                    if (typeof subscribeToChat === 'function') subscribeToChat(String(t.id));
                    else if (typeof createChatForEvent === 'function') createChatForEvent(String(t.id) as any);
                  } catch (e) {}
                });
              } catch (err) {
                console.debug('onUserChanged: subscribe loop failed', err);
              }
            }
            // If the user doc exists but has no joinedEvents array, fall back to querying trybes
          } else {
            try {
              const q = query(collection(db, 'trybes'), where('attendeeIds', 'array-contains', u.uid));
              const snaps = await getDocs(q);
              const joinedFromTrybes: string[] = [];
              const fetchedTrybes: any[] = [];
              snaps.forEach(s => {
                joinedFromTrybes.push(s.id);
                fetchedTrybes.push({ id: s.id, ...(s.data() || {}) } as any);
              });
              if (joinedFromTrybes.length > 0) {
                setJoinedEvents(joinedFromTrybes as any[]);
                const normalized = fetchedTrybes.map((t) => normalizeEvent(t as any));
                setEvents((prev) => {
                  const existingIds = new Set(prev.map((p) => String(p.id)));
                  const toAdd = normalized.filter((n) => !existingIds.has(String(n.id)));
                  return [...toAdd, ...prev];
                });
                void resolveStorageImages(fetchedTrybes as any[]);
                try {
                  fetchedTrybes.forEach((t: any) => {
                    try { if (typeof subscribeToChat === 'function') subscribeToChat(String(t.id)); } catch (e) {}
                  });
                } catch (e) {}
              }
            } catch (err) {
              console.debug('onUserChanged: fallback query for joined trybes failed', err);
            }
          }
        }
      } catch (err) {
        console.debug('Failed to load user joinedEvents', err);
      }
    });

    return () => unsub();
  }, []);

  const createChatForEvent = (eventId: string | number) => {
    const event = events.find((e) => String(e.id) === String(eventId));
    if (!event) return;

    // Check if chat already exists
    const existingChat = chats.find((chat) => chat.eventId === eventId);
    if (existingChat) {
      // Update participant count if chat exists
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.eventId === eventId
            ? { ...chat, participants: event.attendees }
            : chat,
        ),
      );
      return;
    }

    const chatDocId = `trybe-${String(eventId)}`;

    const newChat: Chat = {
      id: chatDocId as any,
      eventId: eventId,
      eventName: event.eventName || event.name,
      eventImage: event.image,
      participants: event.attendees,
      lastMessage: `Welcome to the ${event.eventName || event.name} group chat! Say hello to everyone.`,
      time: "now",
      unreadCount: 0,
      // Messages will be populated by the server-side messages subcollection via subscribeToChat.
      // Avoid seeding a local initial system message here to prevent duplication with server-published messages.
      messages: [],
    };

    setChats((prev) => [newChat, ...prev]);
    // Ensure we subscribe to the chat on creation so realtime messages flow in
    try {
      if (typeof subscribeToChat === 'function') subscribeToChat(eventId as any);
    } catch (e) {}
  };

  // Subscribe to a Firestore-backed chat for the given event so messages sync in real-time
  // Consolidated join helper: ensure trybe attendee state and chat participant, then subscribe.
  const joinTrybeAndSubscribe = async (trybeId: string) => {
    try {
      // wait for auth if needed
      if (!auth.currentUser) {
        await new Promise<void>((resolve) => {
          const unsub = onUserChanged((u) => { try { unsub(); } catch (e) {} ; resolve(); });
          setTimeout(() => resolve(), 2000);
        });
      }
      const user = auth.currentUser;
      if (!user) throw new Error('Not signed in');
      const uid = user.uid;


  const trybeRef = firestoreDoc(db, 'trybes', trybeId);

      // 1) Transactionally ensure trybe has attendeeIds + attendees
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(trybeRef);
        if (!snap.exists()) {
          tx.set(trybeRef, { createdBy: uid, attendees: 1, attendeeIds: [uid] });
        } else {
          const data = snap.data() || {};
          if (!Array.isArray(data.attendeeIds) || !data.attendeeIds.includes(uid)) {
            tx.update(trybeRef, {
              attendeeIds: arrayUnion(uid),
              attendees: increment(1),
            } as any);
          }
        }
      });

      // 2) (no separate chat document in new model) Attach the local onSnapshot listener so UI updates
      if (typeof subscribeToChat === 'function') {
        subscribeToChat(trybeId);
      }
    } catch (err) {
      console.debug('joinTrybeAndSubscribe: failed', err);
      throw err;
    }
  };

  const subscribeToChat = async (eventId: string | number) => {
    try {
      const idKey = String(eventId);
      console.debug('subscribeToChat: start for', idKey, 'auth.uid=', auth.currentUser?.uid);
      if (!idKey || idKey === 'NaN' || idKey === 'undefined') {
        console.debug('subscribeToChat: invalid eventId', eventId);
        return;
      }
  const trybeRef = firestoreDoc(db, 'trybes', idKey);
  // Wait for auth to resolve if necessary. This avoids races where auth.currentUser is undefined
      // and causes permission-denied when attempting to create/update chat documents.
      let currentUid = auth.currentUser?.uid;
      if (!currentUid) {
        try {
          currentUid = await new Promise<string | null>((resolve) => {
            const unsub = onUserChanged((u) => {
              try { unsub(); } catch (e) {}
              resolve(u ? (u as any).uid : null);
            });
            // safety timeout: resolve null after 2s so we don't hang forever
            setTimeout(() => resolve(null), 2000);
          });
        } catch (e) {
          currentUid = auth.currentUser?.uid ?? null;
        }
      }

      if (!currentUid) {
        console.debug('subscribeToChat: no authenticated user available yet, will retry after auth change', eventId);
        return;
      }

      // Prefer authoritative check on trybe.attendeeIds instead of chat.participants.
      // If the trybe doesn't list the current user, attempt to persist the join (persistJoin handles the trybe transaction).
      try {
        const trybeRef = firestoreDoc(db, 'trybes', idKey);
        let trybeSnap = await getDoc(trybeRef);
        console.debug('subscribeToChat: trybe snapshot for attendee check', { idKey, data: trybeSnap.exists() ? trybeSnap.data() : null });
        const hasAttendee = trybeSnap.exists() && Array.isArray((trybeSnap.data() || {}).attendeeIds) && (trybeSnap.data() || {}).attendeeIds.map(String).includes(String(currentUid));
        console.debug('subscribeToChat: hasAttendee?', { currentUid, hasAttendee });
        if (!hasAttendee) {
          try {
            await persistJoin(idKey);
          } catch (err) {
            console.debug('subscribeToChat: persistJoin failed while ensuring trybe attendee', err);
          }
          trybeSnap = await getDoc(trybeRef);
          const hasAttendee2 = trybeSnap.exists() && Array.isArray((trybeSnap.data() || {}).attendeeIds) && (trybeSnap.data() || {}).attendeeIds.map(String).includes(String(currentUid));
          console.debug('subscribeToChat: post-persistJoin attendeeIds', { idKey, attendeeIds: trybeSnap.exists() ? (trybeSnap.data() || {}).attendeeIds : null, hasAttendee2 });
          if (!hasAttendee2) {
            try { toast?.({ title: 'Chat permission denied', description: 'You are not listed as an attendee of this trybe.', variant: 'destructive' }); } catch (e) {}
            return;
          }
        }

        // No separate chat document to update in parent-anchored model. Metadata is kept on the trybe doc.
      } catch (err) {
        console.debug('subscribeToChat: failed while verifying trybe attendee status', err);
        return;
      }

      // Diagnostic: log auth state and token fingerprint immediately before attempting read
      try {
        const diagUser = auth.currentUser;
        console.log('[DIAG] before chat read - currentUser:', diagUser ? diagUser.uid : null);
        if (diagUser) {
          diagUser.getIdToken(/* forceRefresh= */ true).then((token: string) => {
            console.log('[DIAG] idToken length:', token ? token.length : 0);
            try { console.log('[DIAG] idToken head:', token.substring(0, 40)); } catch (e) {}
          }).catch((e: any) => console.error('[DIAG] getIdToken failed', e));
        } else {
          console.warn('[DIAG] user is null; read will 403');
        }
      } catch (e) {
        console.debug('subscribeToChat: diag getIdToken unexpected error', e);
      }

      // read parent trybe doc for metadata; no separate chat doc exists in the new model
      let chatMeta: any = {};
      try {
        const trybeSnap = await getDoc(trybeRef);
        chatMeta = trybeSnap.exists() ? trybeSnap.data() : {};
      } catch (err: any) {
        console.debug('subscribeToChat: failed to read trybe doc for metadata', err);
        try { toast?.({ title: 'Chat access failed', description: 'Could not read trybe metadata.', variant: 'destructive' }); } catch (e) {}
        return;
      }

        // chatMeta was read from trybe doc above; resolve any storage refs for images if needed
        try {
          const td: any = chatMeta || {};
          const candidate = td._resolvedImage || (Array.isArray(td.photos) && td.photos.length ? td.photos[0] : td.image);
          let resolvedImage = candidate;
          if (resolvedImage && typeof resolvedImage === 'string' && !isHttpDataOrRelative(resolvedImage)) {
            try {
              const storage = getStorage(app);
              const refPath = normalizeStorageRefPath(String(resolvedImage));
              resolvedImage = await getDownloadURL(storageRef(storage, refPath));
            } catch (err) {
              console.debug('subscribeToChat: failed to resolve trybe image', err);
            }
          }
          if (resolvedImage) chatMeta.eventImage = resolvedImage;
          if (!chatMeta.eventName && (td.eventName || td.name)) chatMeta.eventName = td.eventName || td.name;
        } catch (err) {
          console.debug('subscribeToChat: unexpected error while preparing chat metadata', err);
        }

  // If a listener is already registered, skip
  if (chatListenersRef.current[`trybe-${idKey}`]) return;

  // Listen for messages subcollection in order (parent-anchored under trybes)
  const msgsQuery = query(collection(db, 'trybes', idKey, 'messages'), orderBy('createdAt'));

  // Also attach a listener to the parent trybe doc so we stay in sync with attendees
  // and other metadata (attendeeIds, attendees, lastMessage). This ensures the
  // chat UI shows accurate participant counts and names when membership changes.
  const metaUnsub = onSnapshot(trybeRef, async (metaSnap) => {
    try {
      const td: any = metaSnap.exists() ? metaSnap.data() : {};
  // Update provider events list with authoritative counts and attendeeIds
  setEvents((prev) => prev.map((e) => String(e.id) === String(idKey) ? { ...e, attendees: typeof td.attendees === 'number' ? td.attendees : e.attendees, attendeeIds: Array.isArray(td.attendeeIds) ? td.attendeeIds : (e as any).attendeeIds } : e));

      // Update local chat participant count and lastMessage where applicable
      setChats((prev) => prev.map((c) => {
        if (String(c.eventId) !== String(eventId)) return c;
        return {
          ...c,
          participants: typeof td.attendees === 'number' ? td.attendees : c.participants,
          lastMessage: td.lastMessage || c.lastMessage,
        };
      }));

      // Fetch attendee profiles (best-effort, limit to first 20 to avoid heavy reads)
      try {
        if (Array.isArray(td.attendeeIds) && td.attendeeIds.length > 0) {
          const ids = td.attendeeIds.slice(0, 20).map(String);
          const profilePromises = ids.map(async (uid: string) => {
            try {
              const ud = await getDoc(firestoreDoc(db, 'users', uid));
                if (ud.exists()) {
                const u = ud.data() as any;
                // Prefer common image fields: photoURL, avatar, photos[0], profilePicture
                const img = u.photoURL || u.avatar || (Array.isArray(u.photos) && u.photos.length ? u.photos[0] : undefined) || u.profilePicture || undefined;
                // If the stored image is already a public HTTP(S) download URL, mark it as resolved
                const imageResolved = typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:')) ? img : undefined;
                return { id: uid, name: u.displayName || u.firstName || u.name || uid, image: img, imageResolved };
              }
            } catch (e) {}
            // Fallback minimal profile
            return { id: uid, name: uid, image: undefined, imageResolved: undefined };
          });
          const profiles = await Promise.all(profilePromises);

          // Keep profile image references as-stored (data:, http, or storage path). UI components
          // will resolve storage paths into download URLs like we do for trybe images.
          setChats((prev) => prev.map((c) => String(c.eventId) === String(eventId) ? { ...c, participantProfiles: profiles } : c));
        }
      } catch (e) {
        // ignore participant profile resolution failures
      }
    } catch (e) {
      console.debug('subscribeToChat: trybe meta listener unexpected error', e);
    }
  }, (err) => {
    console.debug('subscribeToChat: trybe meta listener error', err);
  });

  // store meta listener so we can cleanup later
  chatListenersRef.current[`trybe-meta-${idKey}`] = metaUnsub;

  const unsub = onSnapshot(msgsQuery, (snap) => {
        const serverMsgs: Message[] = snap.docs.map(d => {
          const data: any = d.data();
          return {
            id: d.id,
            clientId: data.clientId,
            senderId: data.senderId,
            senderName: data.senderName,
            senderImage: data.senderImage || undefined,
            content: data.text,
            attachmentUrl: data.attachmentUrl || null,
            timestamp: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : new Date(data.createdAt).toISOString()) : new Date().toISOString(),
            isCurrentUser: data.senderId === auth.currentUser?.uid,
          } as Message;
        });
        // For any server messages missing senderImage, attempt to resolve from users/{uid} or cached participantProfiles
        (async () => {
          try {
            const missing = new Set<string>();
            for (const m of serverMsgs) {
              if (!m.senderImage && m.senderId) missing.add(String(m.senderId));
            }
            if (missing.size === 0) return;
            const storage = getStorage(app);
            for (const uid of Array.from(missing)) {
              try {
                // Try to find in participantProfiles from chats state
                let resolved: string | undefined = undefined;
                const chat = chats.find(c => String(c.eventId) === String(eventId));
                const prof = chat?.participantProfiles?.find((p: any) => String(p.id) === String(uid));
                if (prof && prof.imageResolved) resolved = prof.imageResolved;
                else if (prof && prof.image) {
                  const img = prof.image;
                  if (typeof img === 'string' && !isHttpDataOrRelative(img)) {
                    try {
                      const refP = normalizeStorageRefPath(String(img));
                      resolved = await getDownloadURL(storageRef(storage, refP));
                    } catch (e) {
                      resolved = String(img);
                    }
                  } else {
                    resolved = String(img);
                  }
                }

                if (!resolved) {
                  // Fetch authoritative user doc
                  try {
                    const ud = await getDoc(firestoreDoc(db, 'users', uid));
                    if (ud.exists()) {
                      const u = ud.data() as any;
                      const imgCandidate = u.photoURL || u.avatar || (Array.isArray(u.photos) && u.photos.length ? u.photos[0] : undefined);
                      if (imgCandidate) {
                        if (typeof imgCandidate === 'string' && !isHttpDataOrRelative(imgCandidate)) {
                          try {
                            const refP = normalizeStorageRefPath(String(imgCandidate));
                            resolved = await getDownloadURL(storageRef(storage, refP));
                          } catch (e) {
                            resolved = String(imgCandidate);
                          }
                        } else {
                          resolved = String(imgCandidate);
                        }
                      }
                    }
                  } catch (e) {
                    // ignore
                  }
                }

                if (resolved) {
                  // Patch serverMsgs in memory
                  for (const m of serverMsgs) {
                    if (String(m.senderId) === String(uid) && !m.senderImage) {
                      m.senderImage = resolved;
                    }
                  }
                }
              } catch (e) {
                // ignore per-user resolution errors
              }
            }
            // After attempting resolution, update chat state to include senderImage on messages
            setChats(prev => prev.map(c => {
              if (String(c.eventId) !== String(eventId)) return c;
              // merge serverMsgs replacing by id
              const nextMsgs = serverMsgs;
              return { ...c, messages: nextMsgs };
            }));
          } catch (e) {
            console.debug('subscribeToChat: failed to resolve sender images for messages', e);
          }
        })();

        // Upsert chat into local state, merging optimistic local messages that haven't been replaced by server messages
        (async () => {
          // Fetch lastReadAt timestamp to properly calculate unread count
          let lastReadAt: Date | null = null;
          try {
            const currentUserId = auth.currentUser?.uid;
            if (currentUserId) {
              const readRef = firestoreDoc(db, 'trybes', idKey, 'reads', currentUserId);
              const readSnap = await getDoc(readRef);
              if (readSnap.exists()) {
                const readData = readSnap.data();
                if (readData?.lastReadAt) {
                  lastReadAt = readData.lastReadAt.toDate ? readData.lastReadAt.toDate() : new Date(readData.lastReadAt);
                }
              }
            }
          } catch (err) {
            console.debug('Failed to fetch lastReadAt:', err);
          }

          setChats(prev => {
            const existing = prev.find(c => c.eventId === eventId);
            const metaFromChat = chatMeta || {};
            const eventFromEvents = events.find(e => String(e.id) === String(eventId));
            const participants = eventFromEvents?.attendees || (existing ? existing.participants : 1);

          // Build set of clientIds present in server messages
          const serverClientIds = new Set(serverMsgs.map(m => m.clientId).filter(Boolean) as string[]);

          // Keep any existing local-only optimistic messages that were not acknowledged by server (no clientId clash)
          const leftoverLocal = (existing ? existing.messages : []).filter(m => {
            // if message has a clientId and server has it, drop the optimistic one (server is authoritative)
            if ((m as any).clientId) {
              return !serverClientIds.has((m as any).clientId as string);
            }
            // If message came from server (has numeric id or not local), keep it only if server didn't already include it
            return !(typeof m.id === 'string' && String(m.id).startsWith('local-'));
          });

          // Merge server messages and leftover local optimistic messages, with defensive dedupe.
          // Prefer server messages (they are authoritative). Keep optimistic local messages only
          // when they don't match any server message by clientId or by normalized content+sender+time.
          const mergedMessages = (() => {
            // Index server clientIds and a normalized key for quick lookup
            const serverClientIds = new Set(serverMsgs.map(m => String(m.clientId || '')));
            const serverIdSet = new Set(serverMsgs.map(m => String(m.id)));

            const normalizeKey = (m: Message) => {
              // Round timestamp to 2s buckets to tolerate small clock discrepancies
              const t = Math.round(new Date(m.timestamp).getTime() / 2000);
              return `${String(m.senderId || '')}::${String((m as any).content || m.content || '')}::${t}`;
            };

            const serverKeys = new Set(serverMsgs.map(normalizeKey));

            // Start with server messages (authoritative)
            const merged: Message[] = [...serverMsgs];

            // Append leftover local optimistic messages only if they are not represented by server messages
            for (const lm of leftoverLocal) {
              const clientId = String((lm as any).clientId || '');
              const lmKey = normalizeKey(lm);

              // If server has the clientId, it's been acknowledged — skip optimistic message
              if (clientId && serverClientIds.has(clientId)) continue;

              // If server contains an equivalent message by normalized key, skip duplicate optimistic
              if (serverKeys.has(lmKey)) continue;

              // Otherwise preserve the optimistic local message
              merged.push(lm);
            }

            // Final sort by timestamp (oldest -> newest)
            merged.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            // As an extra safety, remove any accidental exact-duplicates by server id or clientId
            const seen = new Set<string>();
            const deduped: Message[] = [];
            for (const m of merged) {
              const key = m.id ? `id:${String(m.id)}` : (m.clientId ? `cid:${String(m.clientId)}` : `k:${normalizeKey(m)}`);
              if (seen.has(key)) continue;
              seen.add(key);
              deduped.push(m);
            }

            return deduped;
          })();

            // Calculate unread count: count messages from other users that came after lastReadAt
            const currentUser = auth.currentUser;
            const currentUserId = currentUser?.uid;
            
            // Count messages that are:
            // 1. Not from the current user
            // 2. Sent after lastReadAt timestamp (if it exists)
            let totalUnreadCount = 0;
            if (lastReadAt) {
              // Count messages newer than lastReadAt
              totalUnreadCount = mergedMessages.filter(m => {
                if (m.senderId === currentUserId || m.isCurrentUser) return false;
                const messageDate = new Date(m.timestamp);
                return messageDate > lastReadAt;
              }).length;
            } else {
              // If no lastReadAt, count all messages from other users as unread
              totalUnreadCount = mergedMessages.filter(m => 
                m.senderId !== currentUserId && !m.isCurrentUser
              ).length;
            }

            const chatObj: Chat = {
              id: `trybe-${idKey}` as any,
              eventId,
              eventName: metaFromChat.eventName || eventFromEvents?.eventName || eventFromEvents?.name || (existing ? existing.eventName : '') || '',
              eventImage: metaFromChat.eventImage || eventFromEvents?.image || (existing ? existing.eventImage : '') || '',
              participants,
              lastMessage: mergedMessages.length ? mergedMessages[mergedMessages.length - 1].content : existing?.lastMessage || '',
              time: 'now',
              unreadCount: totalUnreadCount,
              messages: mergedMessages,
            };

            if (existing) {
              return prev.map(p => p.eventId === eventId ? { ...p, ...chatObj } : p);
            }
            return [chatObj, ...prev];
          });
        })();
      }, (err) => {
        // Handle permission or other snapshot errors gracefully so they don't bubble to the global handler
        console.error('subscribeToChat:onSnapshot error for', `trybe-${idKey}`, { uid: auth.currentUser?.uid, err });
        // If permission denied, try one best-effort attempt to persist join and re-subscribe after a short backoff.
        try {
          const msg = (err && err.message) || '';
          if (msg.toLowerCase().includes('permission') || (err && err.code === 'permission-denied')) {
            console.debug('subscribeToChat:onSnapshot detected permission-denied; attempting persistJoin then retry subscribe', { idKey, uid: auth.currentUser?.uid });
            // attempt to persist join, then re-run subscribe after 600ms
            try {
              persistJoin(idKey).catch((joinErr) => {
                console.debug('subscribeToChat:onSnapshot persistJoin retry failed', joinErr);
              }).finally(() => {
                setTimeout(() => {
                  try {
                    // cleanup any existing listener ref and retry
                    try { delete chatListenersRef.current[`trybe-${idKey}`]; } catch (e) {}
                    subscribeToChat(idKey as any);
                  } catch (e) {}
                }, 600);
              });
            } catch (e) {}
          }
        } catch (e) {}
        try {
          const msg = err?.message || '';
          if (msg.toLowerCase().includes('permission') || (err && err.code === 'permission-denied')) {
            try { toast?.({ title: 'Chat permission denied', description: 'Real-time access to this chat was denied by server rules.', variant: 'destructive' }); } catch (e) {}
          }
        } catch (e) {}
        // Ensure we remove any dangling listener ref
        try { delete chatListenersRef.current[`trybe-${idKey}`]; } catch (e) {}
      });

          chatListenersRef.current[`trybe-${idKey}`] = unsub;
    } catch (err) {
      console.debug('subscribeToChat: failed', err);
    }
  };

  const addMessage = (chatId: string | number, content: string, attachmentUrl?: string | null) => {
    // Optimistic local update with clientId to avoid duplication under concurrent writes
    (async () => {
      // Determine a safe idKey for the chat doc. Allow non-numeric ids too.
      let idKey = '';
      const localChat = chats.find(c => String(c.id) === String(chatId));
      if (localChat) {
        idKey = String(localChat.eventId);
      } else {
        idKey = String(chatId).startsWith('trybe-') ? String(chatId).replace('trybe-', '') : String(chatId);
      }

      if (!idKey) {
        console.debug('addMessage: unable to determine eventId for chat', chatId);
        return;
      }

  const messagesColRef = collection(db, 'trybes', idKey, 'messages');
      const user = auth.currentUser;

      // Resolve senderName from users/{uid} for accuracy
      let senderName = user?.displayName || user?.email || 'You';
      // Resolve senderImage from users/{uid} (preferred), local cache, or auth.profile
      let senderImage: string | null = (user as any)?.photoURL || null;
      try {
        if (user?.uid) {
          const udoc = await getDoc(firestoreDoc(db, 'users', user.uid));
          if (udoc.exists()) {
            const ud = udoc.data() as any;
            senderName = ud.displayName || ud.firstName || ud.name || senderName;
            // prefer fields kept by EditProfileModal: photoURL, avatar, photos[0]
            const imgCandidate = ud.photoURL || ud.avatar || (Array.isArray(ud.photos) && ud.photos.length ? ud.photos[0] : undefined) || null;
            if (imgCandidate) {
              try {
                if (typeof imgCandidate === 'string' && !isHttpDataOrRelative(imgCandidate)) {
                  const storage = getStorage(app);
                  const refPath = normalizeStorageRefPath(String(imgCandidate));
                  try {
                    senderImage = await getDownloadURL(storageRef(storage, refPath));
                  } catch (err) {
                    console.debug('addMessage: failed to resolve user image from storage', refPath, err);
                    senderImage = String(imgCandidate);
                  }
                } else {
                  senderImage = String(imgCandidate);
                }
              } catch (e) {
                // fallback to auth.photoURL
              }
            }
          }
        }
      } catch (err) {
        // ignore
      }

      // Generate a clientId for optimistic deduping
      const clientId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      const optimisticMessage: Message = {
        id: clientId,
        clientId,
        senderId: user?.uid || 'anon',
        senderName,
        senderImage: senderImage || null,
        content,
        attachmentUrl: attachmentUrl || null,
        timestamp: new Date().toISOString(),
        isCurrentUser: true,
      };

      // Add optimistic message locally
      setChats((prevChats) =>
        prevChats.map((chat) =>
          String(chat.id) === String(chatId)
            ? {
                ...chat,
                messages: [...chat.messages, optimisticMessage],
                lastMessage: content,
                time: 'now',
              }
            : chat,
        ),
      );

      try {
        const payload: any = {
          clientId,
          senderId: user?.uid || 'anon',
          senderName,
          senderImage: senderImage || null,
          text: content,
          attachmentUrl: attachmentUrl || null,
          createdAt: serverTimestamp(),
        };

        await addDoc(messagesColRef, payload);
        // server onSnapshot will reconcile optimistic messages via clientId
      } catch (err) {
        console.debug('addMessage: firestore write failed, optimistic message kept locally', err);
        // leave optimistic message in place; UI will show it. Optionally we could mark it failed.
      }
    })();
  };

  // Mark messages as read for the current user under trybes/{trybeId}/reads/{uid}
  const markRead = async (trybeId: string | number, uid?: string) => {
    try {
      const user = auth.currentUser;
      const userId = uid || user?.uid;
      if (!userId) return;
      const readRef = firestoreDoc(db, 'trybes', String(trybeId), 'reads', userId);
      await setDoc(readRef, { lastReadAt: serverTimestamp() }, { merge: true } as any);
    } catch (err) {
      console.debug('markRead: failed', err);
    }
  };

  // Mark a specific chat as read (reset unread count to 0)
  const markChatAsRead = (chatId: string | number) => {
    // Find the chat to get its eventId
    const chat = chats.find(c => String(c.id) === String(chatId));
    if (!chat) return;
    
    setChats(prev => 
      prev.map(chat => 
        String(chat.id) === String(chatId) 
          ? { ...chat, unreadCount: 0 }
          : chat
      )
    );
    // Also mark in Firestore using the eventId
    markRead(chat.eventId);
  };

  // Mark all chats as read
  const markAllChatsAsRead = () => {
    setChats(prev => 
      prev.map(chat => ({ ...chat, unreadCount: 0 }))
    );
    // Mark all in Firestore using eventId
    chats.forEach(chat => markRead(chat.eventId));
  };

  const isEventFinished = (eventId: string | number): boolean => {
    const event = events.find(e => String(e.id) === String(eventId));
    if (!event) return false;

    try {
      // Try to parse the date string to check if event has passed
      const eventDate = new Date(event.date);
      const now = new Date();

      // If parsing fails, check for specific patterns in the date string
      if (isNaN(eventDate.getTime())) {
        // Handle formats like "Sat 9:00 AM", "Sun 7:00 AM", "Thu 6:00 PM"
        const today = new Date();
        const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const dayMap: { [key: string]: number } = {
          'sun': 0, 'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6
        };

        const eventDayStr = event.date.toLowerCase().substring(0, 3);
        const eventDay = dayMap[eventDayStr];

        if (eventDay !== undefined) {
          // Simple check: if event day has passed this week, consider it finished
          return currentDay > eventDay;
        }

        // If we can't parse, default to allowing rating for now
        return false;
      }

      return eventDate < now;
    } catch (error) {
      // If date parsing fails, default to false to allow rating
      return false;
    }
  };

  const canRateEvent = (eventId: string | number): boolean => {
    // User must have joined the event AND the event must be finished
    // Normalize comparisons to strings to avoid type mismatches between stored ids
    const hasAttended = joinedEvents.map(String).includes(String(eventId));
    const eventFinished = isEventFinished(eventId);
    return hasAttended && eventFinished;
  };

  const rateEvent = (eventId: number, rating: number) => {
    // Only allow rating if user attended and event is finished
    if (!canRateEvent(eventId)) {
      return;
    }

    setUserRatings((prev) => {
      const existingRating = prev.find(r => r.eventId === eventId);
      if (existingRating) {
        return prev.map(r =>
          r.eventId === eventId
            ? { ...r, rating }
            : r
        );
      } else {
        return [...prev, { eventId, rating, isPrivate: true }];
      }
    });
  };

  const getUserRating = (eventId: string | number): number | null => {
    const rating = userRatings.find(r => String(r.eventId) === String(eventId));
    return rating ? rating.rating : null;
  };

  // Host rating functions
  const rateHost = (eventId: string | number, rating: number) => {
    if (!canRateEvent(eventId as any)) return;
    const event = events.find(e => String(e.id) === String(eventId));
    const hostName = event ? (event.hostName || event.host) : undefined;
    setHostRatings(prev => {
      const existing = prev.find(h => String(h.eventId) === String(eventId));
      if (existing) {
        return prev.map(h => String(h.eventId) === String(eventId) ? { ...h, rating } : h as any);
      }
      return [...prev, { eventId, hostName, rating, isPrivate: true } as any];
    });
  };

  const getHostRating = (eventId: string | number): number | null => {
    const h = hostRatings.find(h => String(h.eventId) === String(eventId));
    return h ? h.rating : null;
  };

  const addConnection = (eventId: string | number) => {
    const event = events.find(e => String(e.id) === String(eventId));
    if (!event || isConnected(eventId as any)) return;

    const newConnection: Connection = {
      id: Date.now(),
      name: event.hostName || event.host || "Event Host",
      image: event.hostImage || "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
  eventId: eventId as any,
      eventName: event.eventName || event.name,
      connectedAt: new Date().toISOString(),
    };

    setConnections(prev => [...prev, newConnection]);
  };

  const isConnected = (eventId: string | number): boolean => {
    return connections.some(c => String(c.eventId) === String(eventId));
  };

  const toggleFavorite = (eventId: string | number) => {
    setFavoriteEvents(prev =>
      prev.map(String).includes(String(eventId))
        ? prev.filter(id => String(id) !== String(eventId))
        : [...prev, eventId as any]
    );
  };

  const isFavorite = (eventId: string | number): boolean => {
    return favoriteEvents.map(String).includes(String(eventId));
  };

  const sendFriendRequest = (toUserId: string, toUserName: string, eventId: number) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const currentUser = "user-current"; // This would come from auth context in real app
    const currentUserName = "You"; // This would come from user profile

    const newRequest: FriendRequest = {
      id: `req-${Date.now()}`,
      fromUserId: currentUser,
      fromUserName: currentUserName,
      fromUserImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
      toUserId,
      toUserName,
      eventId,
      eventName: event.eventName || event.name,
      status: 'pending',
      sentAt: new Date().toISOString(),
    };

    setFriendRequests(prev => [...prev, newRequest]);
  };

  const acceptFriendRequest = (requestId: string) => {
    const req = friendRequests.find(r => r.id === requestId);

    setFriendRequests(prev =>
      prev.map(r =>
        r.id === requestId
          ? { ...r, status: 'accepted' as const, respondedAt: new Date().toISOString() }
          : r
      )
    );

    if (req) {
      // create friend relations both ways
      addFriendRelation(
        { id: req.fromUserId, name: req.fromUserName, image: req.fromUserImage },
        { id: req.toUserId, name: req.toUserName, image: undefined }
      );
    }
  };

  const declineFriendRequest = (requestId: string) => {
    setFriendRequests(prev =>
      prev.map(req =>
        req.id === requestId
          ? { ...req, status: 'declined' as const, respondedAt: new Date().toISOString() }
          : req
      )
    );
  };

  const getFriendRequestStatus = (toUserId: string, eventId: number): 'none' | 'pending' | 'accepted' | 'declined' => {
    const request = friendRequests.find(req =>
      req.toUserId === toUserId &&
      req.eventId === eventId &&
      req.fromUserId === "user-current"
    );
    return request ? request.status : 'none';
  };

  const canSendMessage = (toUserId: string, eventId: number): boolean => {
    const status = getFriendRequestStatus(toUserId, eventId);
    return status === 'accepted';
  };

  return (
    <EventsContext.Provider value={{
      events,
      trybesLoaded,
      addEvent,
      updateEvent,
      joinEvent,
      leaveEvent,
      joinedEvents,
      chats,
      addMessage,
      createChatForEvent,
      userRatings,
      hostRatings,
      rateEvent,
      rateHost,
      getUserRating,
      getHostRating,
      canRateEvent,
      isEventFinished,
      connections,
      addConnection,
      isConnected,
      favoriteEvents,
      toggleFavorite,
      isFavorite,
      friendRequests,
      sendFriendRequest,
      acceptFriendRequest,
      declineFriendRequest,
      getFriendRequestStatus,
      canSendMessage,
      friends,
      addFriendRelation,
      getFriendsOf,
      setSharePreferenceForUser,
      markRead,
      markChatAsRead,
      markAllChatsAsRead,
    }}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error("useEvents must be used within an EventsProvider");
  }
  return context;
}
