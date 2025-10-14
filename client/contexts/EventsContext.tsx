import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { collection, getDocs, doc as firestoreDoc, updateDoc, arrayUnion, arrayRemove, increment, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { onUserChanged, auth } from "@/auth";

interface Event {
  id: number;
  name: string;
  eventName?: string; // For new events
  hostName?: string; // For swipe format
  hostAge?: number; // For swipe format
  location: string;
  date: string;
  time?: string;
  duration?: string;
  attendees: number;
  maxCapacity: number;
  fee: string;
  image: string;
  eventImages?: string[]; // For swipe format
  hostImage?: string; // For swipe format
  category: string;
  isPopular?: boolean;
  host?: string;
  rating?: number;
  interests?: string[];
  description?: string;
  isPremium?: boolean;
  ageRange?: [number, number];
  repeatOption?: string;
}

interface Chat {
  id: number;
  eventId: number;
  eventName: string;
  eventImage: string;
  participants: number;
  lastMessage: string;
  time: string;
  unreadCount: number;
  messages: Message[];
}

interface Message {
  id: number;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isCurrentUser: boolean;
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
  eventId: number;
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
  eventId: number;
  eventName: string;
  status: 'pending' | 'accepted' | 'declined';
  sentAt: string;
  respondedAt?: string;
}

interface EventsContextType {
  events: Event[];
  trybesLoaded?: boolean;
  addEvent: (eventData: any) => void;
  updateEvent: (eventId: number, updates: Partial<Event>, notify: boolean) => void;
  joinEvent: (eventId: number) => void;
  leaveEvent: (eventId: number) => void;
  joinedEvents: number[];
  chats: Chat[];
  addMessage: (chatId: number, content: string) => void;
  createChatForEvent: (eventId: number) => void;
  userRatings: UserRating[];
  hostRatings: HostRating[];
  rateEvent: (eventId: number, rating: number) => void;
  rateHost: (eventId: number, rating: number) => void;
  getUserRating: (eventId: number) => number | null;
  getHostRating: (eventId: number) => number | null;
  canRateEvent: (eventId: number) => boolean;
  isEventFinished: (eventId: number) => boolean;
  connections: Connection[];
  addConnection: (eventId: number) => void;
  isConnected: (eventId: number) => boolean;
  favoriteEvents: number[];
  toggleFavorite: (eventId: number) => void;
  isFavorite: (eventId: number) => boolean;
  friendRequests: FriendRequest[];
  sendFriendRequest: (toUserId: string, toUserName: string, eventId: number) => void;
  acceptFriendRequest: (requestId: string) => void;
  declineFriendRequest: (requestId: string) => void;
  getFriendRequestStatus: (toUserId: string, eventId: number) => 'none' | 'pending' | 'accepted' | 'declined';
  canSendMessage: (toUserId: string, eventId: number) => boolean;
  // Friends
  friends: any[];
  addFriendRelation: (a: { id: string; name?: string; image?: string }, b: { id: string; name?: string; image?: string }) => void;
  getFriendsOf: (userId: string) => any[];
  setSharePreferenceForUser: (userId: string, allowed: boolean) => void;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

// Initial events data (combining from both Home and Swipe pages)
const initialEvents: Event[] = [
  {
    id: 1,
    name: "Weekend Farmers Market",
    eventName: "Weekend Farmers Market",
    hostName: "Market Collective",
    hostAge: 30,
    location: "Union Square",
    date: "Sat 9:00 AM",
    attendees: 45,
    maxCapacity: 60,
    fee: "Free",
    image:
      "https://cdn.builder.io/api/v1/image/assets%2F5c6becf7cef04a3db5d3620ce9b103bd%2F55c1b0c99abb442eaf238a298dbf7cf4",
    eventImages: [
      "https://cdn.builder.io/api/v1/image/assets%2F5c6becf7cef04a3db5d3620ce9b103bd%2F55c1b0c99abb442eaf238a298dbf7cf4",
      "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&h=600&fit=crop",
    ],
    hostImage:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    category: "Food & Drink",
    isPopular: true,
    host: "Market Collective",
    rating: 4.8,
    interests: ["Food", "Community", "Local"],
    description:
      "Join us for fresh produce, artisanal goods, and community vibes at the weekend farmers market!",
  },
  {
    id: 2,
    name: "Rooftop Yoga Session",
    eventName: "Rooftop Yoga Session",
    hostName: "ZenFlow Studio",
    hostAge: 28,
    location: "SoMa District",
    date: "Sun 7:00 AM",
    attendees: 20,
    maxCapacity: 25,
    fee: "$15",
    image:
      "https://cdn.builder.io/api/v1/image/assets%2F5c6becf7cef04a3db5d3620ce9b103bd%2F5e158f125714409bbacba8ef1838840f",
    eventImages: [
      "https://cdn.builder.io/api/v1/image/assets%2F5c6becf7cef04a3db5d3620ce9b103bd%2F5e158f125714409bbacba8ef1838840f",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop",
    ],
    hostImage:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    category: "Fitness",
    isPopular: false,
    host: "ZenFlow Studio",
    rating: 4.9,
    interests: ["Yoga", "Wellness", "Mindfulness"],
    description:
      "Start your Sunday with energizing yoga on our beautiful rooftop overlooking the city.",
  },
  {
    id: 3,
    name: "Tech Networking Mixer",
    eventName: "Tech Networking Mixer",
    hostName: "TechConnect SF",
    hostAge: 32,
    location: "SOMA",
    date: "Thu 6:00 PM",
    attendees: 87,
    maxCapacity: 100,
    fee: "$25",
    image:
      "https://cdn.builder.io/api/v1/image/assets%2F5c6becf7cef04a3db5d3620ce9b103bd%2F3d29be6add9348eab169879d1e722aae",
    eventImages: [
      "https://cdn.builder.io/api/v1/image/assets%2F5c6becf7cef04a3db5d3620ce9b103bd%2F3d29be6add9348eab169879d1e722aae",
      "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&h=600&fit=crop",
    ],
    hostImage:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    category: "Professional",
    isPopular: true,
    host: "TechConnect SF",
    rating: 4.7,
    interests: ["Tech", "Networking", "Startups"],
    description:
      "Connect with fellow tech professionals, entrepreneurs, and innovators in the heart of SF.",
  },
  {
    id: 4,
    name: "Exclusive Wine Tasting",
    eventName: "Exclusive Wine Tasting",
    hostName: "Sommelier Society",
    hostAge: 35,
    location: "Napa Valley",
    date: "Fri 7:00 PM",
    attendees: 12,
    maxCapacity: 15,
    fee: "$85",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=600&fit=crop",
    eventImages: [
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=600&fit=crop",
      "https://images.unsplash.com/photo-1558346648-9757f2fa4c1e?w=400&h=600&fit=crop",
    ],
    hostImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    category: "Food & Drink",
    isPopular: true,
    host: "Sommelier Society",
    rating: 4.9,
    interests: ["Wine", "Luxury", "Exclusive"],
    description: "An intimate wine tasting experience with rare vintages and expert sommelier guidance.",
    isPremium: true,
  },
  {
    id: 5,
    name: "VIP Art Gallery Opening",
    eventName: "VIP Art Gallery Opening",
    hostName: "Modern Art Collective",
    hostAge: 29,
    location: "Chelsea District",
    date: "Sat 8:00 PM",
    attendees: 25,
    maxCapacity: 30,
    fee: "$120",
    image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=600&fit=crop",
    eventImages: [
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=600&fit=crop",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop",
    ],
    hostImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    category: "Arts & Culture",
    isPopular: true,
    host: "Modern Art Collective",
    rating: 4.8,
    interests: ["Art", "Culture", "VIP"],
    description: "Exclusive first look at contemporary art pieces with artists and collectors.",
    isPremium: true,
  },
  {
    id: 6,
    name: "Sunset Beach Volleyball",
    eventName: "Sunset Beach Volleyball",
    hostName: "Sand & Spike Club",
    hostAge: 27,
    location: "Ocean Beach",
    date: "Sat 5:30 PM",
    attendees: 16,
    maxCapacity: 20,
    fee: "Free",
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80&auto=format&fit=crop",
    eventImages: ["https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80&auto=format&fit=crop"],
    hostImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    category: "Outdoors",
    isPopular: false,
    host: "Sand & Spike Club",
    rating: 4.5,
    interests: ["Sports", "Beach", "Community"],
    description: "Join a friendly beach volleyball game as the sun sets.",
  },
  {
    id: 7,
    name: "Indie Acoustic Night",
    eventName: "Indie Acoustic Night",
    hostName: "The Vinyl Lounge",
    hostAge: 31,
    location: "Mission District",
    date: "Fri 9:00 PM",
    attendees: 60,
    maxCapacity: 80,
    fee: "$10",
    image: "https://images.unsplash.com/photo-1485579149621-3123dd979885?w=800&q=80&auto=format&fit=crop",
    eventImages: ["https://images.unsplash.com/photo-1485579149621-3123dd979885?w=800&q=80&auto=format&fit=crop"],
    hostImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    category: "Music",
    isPopular: true,
    host: "The Vinyl Lounge",
    rating: 4.6,
    interests: ["Music", "Live", "Indie"],
    description: "An intimate evening showcasing local acoustic singer-songwriters.",
  },
  {
    id: 8,
    name: "Weekend Coding Workshop",
    eventName: "Weekend Coding Workshop",
    hostName: "CodeCraft",
    hostAge: 34,
    location: "Downtown Tech Hub",
    date: "Sat 10:00 AM",
    attendees: 18,
    maxCapacity: 25,
    fee: "$40",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=600&fit=crop",
    category: "Workshops",
    isPopular: false,
    host: "CodeCraft",
    rating: 4.9,
    interests: ["Coding", "Workshops", "Education"],
    description: "Hands-on bootcamp covering web development fundamentals.",
  },
  {
    id: 9,
    name: "Community Beach Cleanup",
    eventName: "Community Beach Cleanup",
    hostName: "GreenAction",
    hostAge: 40,
    location: "Baker Beach",
    date: "Sun 8:00 AM",
    attendees: 30,
    maxCapacity: 100,
    fee: "Free",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&h=600&fit=crop",
    category: "Volunteering",
    isPopular: false,
    host: "GreenAction",
    rating: 4.7,
    interests: ["Environment", "Community", "Volunteering"],
    description: "Help keep our beaches clean and meet neighbors who care about the environment.",
  },
  {
    id: 10,
    name: "Family Picnic & Games",
    eventName: "Family Picnic & Games",
    hostName: "Parks Dept",
    hostAge: 38,
    location: "Golden Gate Park",
    date: "Sun 12:00 PM",
    attendees: 90,
    maxCapacity: 200,
    fee: "Free",
    image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400&h=600&fit=crop",
    category: "Family",
    isPopular: true,
    host: "Parks Dept",
    rating: 4.4,
    interests: ["Family", "Outdoors", "Games"],
    description: "Bring the family for a relaxed picnic, kid-friendly games, and community fun.",
  },
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

  function normalizeEvent(ev: Event): Event {
    // Prefer explicit image, then first eventImages entry, then default by category
    const imgCandidate = ev.image && String(ev.image).trim()
      ? String(ev.image)
      : (ev.eventImages && ev.eventImages.length ? String(ev.eventImages[0]) : undefined);
    const img = imgCandidate || (DEFAULT_IMAGES[ev.category] || DEFAULT_IMAGES.default);
    const eventImages = ev.eventImages && ev.eventImages.length ? ev.eventImages : [img];
    const hostImage = ev.hostImage && ev.hostImage.trim() ? ev.hostImage : "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop";
    // Ensure numeric fields are numbers and have sensible defaults
    const attendees = typeof (ev as any).attendees === 'number' ? (ev as any).attendees : Number((ev as any).attendees) || 1;
    const maxCapacity = typeof (ev as any).maxCapacity === 'number' ? (ev as any).maxCapacity : Number((ev as any).maxCapacity) || 10;

    return { ...ev, image: img, eventImages, hostImage, attendees, maxCapacity };
  }

  const [events, setEvents] = useState<Event[]>(() => initialEvents.map(normalizeEvent));
  const [trybesLoaded, setTrybesLoaded] = useState<boolean>(false);
  const [joinedEvents, setJoinedEvents] = useState<number[]>([]);
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

  function sampleJoinedEvents(): number[] {
    // pick up to 3 random upcoming events
    const ids = events.map(e => e.id);
    const sample: number[] = [];
    const count = Math.min(3, Math.max(1, Math.floor(Math.random() * 3) + 1));
    for (let i = 0; i < count; i++) {
      const id = ids[Math.floor(Math.random() * ids.length)];
      if (!sample.includes(id)) sample.push(id);
    }
    return sample;
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
    const newEvent: Event = {
      id: eventData.id ?? Date.now(), // Allow caller to provide id, fallback to timestamp
      name: eventData.eventName,
      eventName: eventData.eventName,
      hostName: "You", // Current user as host
      hostAge: 25, // Default age
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
      hostImage:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      category: eventData.category || "Social", // Default category
      isPopular: false,
      host: "You",
      rating: 5.0,
      interests: eventData.interests || ["New Event"],
      description: eventData.description && eventData.description.trim().length > 0
        ? eventData.description
        : `Join us for ${eventData.eventName}! This is a newly created event.`,
      isPremium: Boolean(eventData.isPremium),
      ageRange: eventData.ageRange,
      repeatOption: eventData.repeatOption,
    };

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
  };

  // On mount, attempt to read cached trybes and prefetch first images
  useEffect(() => {
    try {
      const raw = localStorage.getItem('trybes_cache_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        // TTL 1 hour
        if (parsed && parsed.ts && Date.now() - parsed.ts < 1000 * 60 * 60 && Array.isArray(parsed.items)) {
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

        if (Array.isArray(rawDocs) && rawDocs.length > 0) {
          const normalized = rawDocs.map((d: any) => normalizeEvent(d));
          setEvents(normalized);

          // Prefetch a few images for faster paint
          const toPrefetch = normalized.slice(0, 6).map((e) => e.image).filter(Boolean) as string[];
          toPrefetch.forEach((src) => {
            try {
              const img = new Image();
              img.src = src;
            } catch (err) {}
          });
        }
      } catch (err) {
        // If fetch fails, we keep initialEvents (no-op)
        console.debug('EventsProvider: failed to fetch trybes from Firestore at startup', err);
      } finally {
        setTrybesLoaded(true);
      }
    })();
  }, []);

  const updateEvent = (eventId: number, updates: Partial<Event>, notify: boolean) => {
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
        if (applied.repeatOption && applied.repeatOption !== oldE.repeatOption) {
          changes.push(`• Repeat: ${oldE.repeatOption || 'none'} → ${newE.repeatOption || 'none'}`);
        }
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

  const joinEvent = (eventId: number) => {
    if (!joinedEvents.includes(eventId)) {
      setJoinedEvents((prev) => [...prev, eventId]);

      // Update attendee count
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === eventId
            ? { ...event, attendees: event.attendees + 1 }
            : event,
        ),
      );

      // Create or update group chat for the event
      createChatForEvent(eventId);
      // Persist in background
      void persistJoin(eventId);
    }
  };

  // Persist join to Firestore and user's profile when possible
  const persistJoin = async (eventId: number) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      // Attempt to resolve the Firestore doc id from the in-memory events list.
      const ev = events.find((e) => String(e.id) === String(eventId) || e.id === eventId);
      if (ev) {
        const trybeRef = firestoreDoc(db, 'trybes', String(ev.id));
        try {
          await updateDoc(trybeRef, {
            attendees: increment(1),
            attendeeIds: arrayUnion(user.uid),
          });
        } catch (err) {
          console.debug('persistJoin: failed to update trybe doc', err);
        }
      } else {
        // Fallback: try updating by the passed id (may be string id)
        try {
          const trybeRef = firestoreDoc(db, 'trybes', String(eventId));
          await updateDoc(trybeRef, {
            attendees: increment(1),
            attendeeIds: arrayUnion(user.uid),
          });
        } catch (err) {
          console.debug('persistJoin: fallback failed to update trybe doc', err);
        }
      }

      const userRef = firestoreDoc(db, 'users', user.uid);
      try {
        await updateDoc(userRef, { joinedEvents: arrayUnion(eventId) });
      } catch (err) {
        console.debug('persistJoin: failed to update user joinedEvents', err);
      }
    } catch (err) {
      console.debug('persistJoin: unexpected error', err);
    }
  };

  const leaveEvent = (eventId: number) => {
    setJoinedEvents((prev) => prev.filter((id) => id !== eventId));

    // Update attendee count
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === eventId
          ? { ...event, attendees: Math.max(1, event.attendees - 1) }
          : event,
      ),
    );

    // Remove associated chat
    setChats((prevChats) =>
      prevChats.filter((chat) => chat.eventId !== eventId),
    );
    // Persist in background
    void persistLeave(eventId);
  };

  // Persist leave to Firestore when possible
  const persistLeave = async (eventId: number) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const ev = events.find((e) => String(e.id) === String(eventId) || e.id === eventId);
      if (ev) {
        try {
          const trybeRef = firestoreDoc(db, 'trybes', String(ev.id));
          await updateDoc(trybeRef, {
            attendees: increment(-1),
            attendeeIds: arrayRemove(user.uid),
          });
        } catch (err) {
          console.debug('persistLeave: failed to update trybe doc', err);
        }
      } else {
        try {
          const trybeRef = firestoreDoc(db, 'trybes', String(eventId));
          await updateDoc(trybeRef, {
            attendees: increment(-1),
            attendeeIds: arrayRemove(user.uid),
          });
        } catch (err) {
          console.debug('persistLeave: fallback failed to update trybe doc', err);
        }
      }

      const userRef = firestoreDoc(db, 'users', user.uid);
      try {
        await updateDoc(userRef, { joinedEvents: arrayRemove(eventId) });
      } catch (err) {
        console.debug('persistLeave: failed to update user joinedEvents', err);
      }
    } catch (err) {
      console.debug('persistLeave: unexpected error', err);
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
            for (const id of joined) {
              try {
                const td = await getDoc(firestoreDoc(db, 'trybes', String(id)));
                if (td.exists()) {
                  const d = { id: td.id, ...(td.data() || {}) };
                  fetchedTrybes.push(d as any);
                }
              } catch (err) {
                console.debug('Failed to fetch joined trybe doc', id, err);
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
            }
          }
        }
      } catch (err) {
        console.debug('Failed to load user joinedEvents', err);
      }
    });

    return () => unsub();
  }, []);

  const createChatForEvent = (eventId: number) => {
    const event = events.find((e) => e.id === eventId);
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

    const newChat: Chat = {
      id: Date.now(),
      eventId: eventId,
      eventName: event.eventName || event.name,
      eventImage: event.image,
      participants: event.attendees,
      lastMessage: `Welcome to the ${event.eventName || event.name} group chat! Say hello to everyone.`,
      time: "now",
      unreadCount: 0,
      messages: [
        {
          id: 1,
          senderId: "system",
          senderName: "System",
          content: `Welcome to ${event.eventName || event.name} group chat! All event participants can chat here. Current participants: ${event.attendees}`,
          timestamp: new Date().toISOString(),
          isCurrentUser: false,
        },
      ],
    };

    setChats((prev) => [newChat, ...prev]);
  };

  const addMessage = (chatId: number, content: string) => {
    const newMessage: Message = {
      id: Date.now(),
      senderId: "current-user",
      senderName: "You",
      content: content,
      timestamp: new Date().toISOString(),
      isCurrentUser: true,
    };

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              lastMessage: content,
              time: "now",
            }
          : chat,
      ),
    );

    // Simulate group chat responses after a short delay
    setTimeout(() => {
      const groupResponses = [
        {
          sender: "event_host",
          name: "Event Host",
          message: "Thanks for joining everyone! Looking forward to meeting all of you."
        },
        {
          sender: "participant_1",
          name: "Alex M.",
          message: "Excited to be part of this! Can't wait to meet everyone."
        },
        {
          sender: "participant_2",
          name: "Sarah K.",
          message: "This is going to be amazing! Anyone else coming from downtown?"
        },
        {
          sender: "event_host",
          name: "Event Host",
          message: "Great to see the enthusiasm! Feel free to ask any questions about the event."
        },
      ];

      const randomResponse = groupResponses[Math.floor(Math.random() * groupResponses.length)];

      const groupMessage: Message = {
        id: Date.now() + 1,
        senderId: randomResponse.sender,
        senderName: randomResponse.name,
        content: randomResponse.message,
        timestamp: new Date().toISOString(),
        isCurrentUser: false,
      };

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [...chat.messages, groupMessage],
                lastMessage: randomResponse.message,
                time: "now",
                unreadCount: chat.unreadCount + 1,
              }
            : chat,
        ),
      );
    }, 2000);
  };

  const isEventFinished = (eventId: number): boolean => {
    const event = events.find(e => e.id === eventId);
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

  const canRateEvent = (eventId: number): boolean => {
    // User must have joined the event AND the event must be finished
    const hasAttended = joinedEvents.includes(eventId);
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

  const getUserRating = (eventId: number): number | null => {
    const rating = userRatings.find(r => r.eventId === eventId);
    return rating ? rating.rating : null;
  };

  // Host rating functions
  const rateHost = (eventId: number, rating: number) => {
    if (!canRateEvent(eventId)) return;
    const event = events.find(e => e.id === eventId);
    const hostName = event ? (event.hostName || event.host) : undefined;
    setHostRatings(prev => {
      const existing = prev.find(h => h.eventId === eventId);
      if (existing) {
        return prev.map(h => h.eventId === eventId ? { ...h, rating } : h);
      }
      return [...prev, { eventId, hostName, rating, isPrivate: true }];
    });
  };

  const getHostRating = (eventId: number): number | null => {
    const h = hostRatings.find(h => h.eventId === eventId);
    return h ? h.rating : null;
  };

  const addConnection = (eventId: number) => {
    const event = events.find(e => e.id === eventId);
    if (!event || isConnected(eventId)) return;

    const newConnection: Connection = {
      id: Date.now(),
      name: event.hostName || event.host || "Event Host",
      image: event.hostImage || "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      eventId: eventId,
      eventName: event.eventName || event.name,
      connectedAt: new Date().toISOString(),
    };

    setConnections(prev => [...prev, newConnection]);
  };

  const isConnected = (eventId: number): boolean => {
    return connections.some(c => c.eventId === eventId);
  };

  const toggleFavorite = (eventId: number) => {
    setFavoriteEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const isFavorite = (eventId: number): boolean => {
    return favoriteEvents.includes(eventId);
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
    <EventsContext.Provider
      value={{
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
      }}
    >
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
