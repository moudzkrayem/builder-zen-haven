import { createContext, useContext, useState, ReactNode } from "react";

interface Event {
  id: number;
  name: string;
  eventName?: string; // For new events
  hostName?: string; // For swipe format
  hostAge?: number; // For swipe format
  location: string;
  date: string;
  time?: string;
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

interface Connection {
  id: number;
  name: string;
  image: string;
  eventId: number;
  eventName: string;
  connectedAt: string;
}

interface EventsContextType {
  events: Event[];
  addEvent: (eventData: any) => void;
  joinEvent: (eventId: number) => void;
  leaveEvent: (eventId: number) => void;
  joinedEvents: number[];
  chats: Chat[];
  addMessage: (chatId: number, content: string) => void;
  createChatForEvent: (eventId: number) => void;
  userRatings: UserRating[];
  rateEvent: (eventId: number, rating: number) => void;
  getUserRating: (eventId: number) => number | null;
  connections: Connection[];
  addConnection: (eventId: number) => void;
  isConnected: (eventId: number) => boolean;
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
];

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [joinedEvents, setJoinedEvents] = useState<number[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [userRatings, setUserRatings] = useState<UserRating[]>([]);

  const addEvent = (eventData: any) => {
    const newEvent: Event = {
      id: Date.now(), // Simple ID generation
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
      attendees: 1, // Creator is first attendee
      maxCapacity: eventData.maxCapacity,
      fee: eventData.fee,
      image:
        eventData.photos[0] ||
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=600&fit=crop",
      eventImages:
        eventData.photos.length > 0
          ? eventData.photos
          : [
              "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=600&fit=crop",
              "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&h=600&fit=crop",
            ],
      hostImage:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      category: "Social", // Default category
      isPopular: false,
      host: "You",
      rating: 5.0,
      interests: ["New Event"],
      description: `Join us for ${eventData.eventName}! This is a newly created event.`,
    };

    setEvents((prevEvents) => [newEvent, ...prevEvents]);
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
  };

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

  const rateEvent = (eventId: number, rating: number) => {
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

  return (
    <EventsContext.Provider
      value={{
        events,
        addEvent,
        joinEvent,
        leaveEvent,
        joinedEvents,
        chats,
        addMessage,
        createChatForEvent,
        userRatings,
        rateEvent,
        getUserRating,
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
