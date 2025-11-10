import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ChatModal from "@/components/ChatModal";
import { useEvents } from "@/contexts/EventsContext";
import { Search, MoreHorizontal, Heart, Star } from "lucide-react";
import SafeImg from '@/components/SafeImg';
import { getStorage, ref as storageRef, getDownloadURL } from 'firebase/storage';
import { normalizeStorageRefPath } from '@/lib/imageUtils';
import { app } from '@/firebase';
import { useEffect, useState } from 'react';
import { cn } from "@/lib/utils";

// Mock chat data

export default function Chats() {
  const { chats } = useEvents();
  const [searchQuery, setSearchQuery] = useState("");
  const [showChatModal, setShowChatModal] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | number | null>(null);

  const filteredChats = chats.filter((chat) =>
    chat.eventName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const [resolvedProfileImages, setResolvedProfileImages] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const storage = getStorage(app);
        const next = { ...resolvedProfileImages };
        // Collect up to first 3 participant images from visible chats to resolve
        const candidates: Array<{ id: string; img?: string }> = [];
        for (const chat of chats.slice(0, 20)) {
          const p = chat.participantProfiles;
          if (p && p.length) {
            for (const prof of p.slice(0, 3)) {
              candidates.push({ id: prof.id, img: prof.image });
            }
          }
        }
        for (const c of candidates) {
          if (!c.img || next[String(c.id)]) continue;
          const img = c.img;
          if (typeof img === 'string' && (img.startsWith('data:') || img.startsWith('http://') || img.startsWith('https://'))) {
            next[String(c.id)] = img;
            continue;
          }
          try {
            const path = normalizeStorageRefPath(String(img));
            const url = await getDownloadURL(storageRef(storage, path));
            if (!mounted) break;
            next[String(c.id)] = url;
          } catch (e) {
            // leave unresolved; do not set empty string so UI can fallback to stored profile image or placeholder
          }
        }
        if (mounted) setResolvedProfileImages(next);
      } catch (e) {}
    })();
    return () => { mounted = false; };
  }, [chats]);

  const handleOpenChat = (chatId: string | number) => {
    setActiveChatId(chatId);
    setShowChatModal(true);
  };

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
          {chats.slice(0, 6).map((chat) => (
            <button
              key={`trybe-${chat.id}`}
              onClick={() => handleOpenChat(chat.id)}
              className="flex-shrink-0 hover:opacity-80 transition-opacity"
            >
              <div className="relative">
                <SafeImg src={chat.eventImage || (chat.participantProfiles && (chat.participantProfiles[0]?.imageResolved || chat.participantProfiles[0]?.image)) || ''} alt={chat.eventName} className="w-16 h-16 rounded-xl object-cover border-2 border-primary" debugContext={`Chats:carousel:${String(chat.id)}`} />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <Heart className="w-3 h-3 text-primary-foreground" />
                </div>
                {chat.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {chat.unreadCount}
                  </div>
                )}
              </div>
              <p className="text-xs text-center mt-2 max-w-[64px] truncate">
                {chat.eventName.split(" ")[0]}
              </p>
            </button>
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
              {chats.length === 0 ? "No chats yet" : "No conversations found"}
            </h3>
            <p className="text-muted-foreground">
              {chats.length === 0
                ? "Join some events to start chatting with hosts!"
                : "Try adjusting your search terms."}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => handleOpenChat(chat.id)}
                className="w-full flex items-center space-x-3 px-4 py-4 hover:bg-accent/50 transition-colors text-left"
              >
                {/* Avatar or stacked participant images */}
                <div className="relative flex items-center">
                      {chat.participantProfiles && chat.participantProfiles.length > 0 ? (
                    <div className="flex -space-x-2">
                      {chat.participantProfiles.slice(0, 3).map((p, i) => (
                        <SafeImg
                          key={p.id}
                          src={
                            (resolvedProfileImages[String(p.id)] || resolvedProfileImages[p.id] || (p as any).imageResolved || (p as any).image) as string | undefined
                            || ''
                          }
                          alt={p.name}
                          className={`w-10 h-10 rounded-full object-cover border-2 border-background`}
                          debugContext={`Chats:list:${String(chat.id)}:${p.id}`}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="relative">
                      <SafeImg src={chat.eventImage || ''} alt={chat.eventName} className="w-14 h-14 rounded-xl object-cover" debugContext={`Chats:list:${String(chat.id)}:event`} />
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
                    </div>
                  )}
                </div>

                {/* Chat info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground truncate">
                      {chat.eventName}
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
                    <div className="flex items-center justify-between">
                    <p
                      className={cn(
                        "text-sm truncate flex-1",
                        chat.unreadCount > 0
                          ? "text-foreground font-medium"
                          : "text-muted-foreground",
                      )}
                    >
                      {chat.lastMessage}
                    </p>
                      <span className="text-xs text-muted-foreground ml-2">
                        {chat.participantProfiles && chat.participantProfiles.length ? chat.participantProfiles.length : chat.participants} members
                      </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat Modal */}
      <ChatModal
        isOpen={showChatModal}
        onClose={() => {
          setShowChatModal(false);
          setActiveChatId(null);
        }}
        chatId={activeChatId}
      />
    </div>
  );
}
