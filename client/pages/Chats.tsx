import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MoreHorizontal, Heart, Star } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock chat data
const mockChats = [
  {
    id: 1,
    name: "Sarah Chen",
    lastMessage: "Looking forward to the coffee meetup! ☕️",
    time: "2m",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop",
    isOnline: true,
    unreadCount: 2,
    matchType: "like",
  },
  {
    id: 2,
    name: "Alex Rivera",
    lastMessage: "The sunset hike was amazing! Thanks for joining 🌅",
    time: "1h",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    isOnline: true,
    unreadCount: 0,
    matchType: "superlike",
  },
  {
    id: 3,
    name: "Maya Patel",
    lastMessage: "Great meeting you at the gallery opening!",
    time: "3h",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    isOnline: false,
    unreadCount: 0,
    matchType: "like",
  },
  {
    id: 4,
    name: "Jordan Kim",
    lastMessage: "You: That sounds perfect! See you there 👍",
    time: "1d",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    isOnline: false,
    unreadCount: 0,
    matchType: "like",
  },
];

export default function Chats() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = mockChats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Chats</h1>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Active trybes carousel */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-semibold mb-4 text-foreground">
          New Trybes
        </h2>
        <div className="flex space-x-4 overflow-x-auto hide-scrollbar pb-2">
          {mockChats.slice(0, 3).map((chat) => (
            <div key={`trybe-${chat.id}`} className="flex-shrink-0">
              <div className="relative">
                <img
                  src={chat.avatar}
                  alt={chat.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <Heart className="w-3 h-3 text-primary-foreground" />
                </div>
              </div>
              <p className="text-xs text-center mt-2 max-w-[64px] truncate">
                {chat.name.split(" ")[0]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4">
          <h2 className="text-lg font-semibold mb-4 text-foreground">
            Messages
          </h2>
        </div>

        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              No conversations found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                className="flex items-center space-x-3 px-4 py-4 hover:bg-accent/50 transition-colors cursor-pointer"
              >
                {/* Avatar */}
                <div className="relative">
                  <img
                    src={chat.avatar}
                    alt={chat.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  {chat.isOnline && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-like border-2 border-background rounded-full" />
                  )}
                </div>

                {/* Chat info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground truncate">
                      {chat.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {chat.time}
                      </span>
                      {chat.unreadCount > 0 && (
                        <Badge className="bg-primary text-primary-foreground text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
                          {chat.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p
                    className={cn(
                      "text-sm truncate",
                      chat.unreadCount > 0
                        ? "text-foreground font-medium"
                        : "text-muted-foreground",
                    )}
                  >
                    {chat.lastMessage}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Empty state for new users */}
      {mockChats.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Heart className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Start Matching!</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Like events and people to start conversations and build your Trybe.
          </p>
          <Button className="rounded-full px-8">Discover Events</Button>
        </div>
      )}
    </div>
  );
}
