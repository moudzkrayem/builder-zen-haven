import React, { useState, useRef, useEffect } from "react";
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getDoc, doc as firestoreDoc } from 'firebase/firestore';
import { isHttpDataOrRelative, normalizeStorageRefPath } from '@/lib/imageUtils';
import { app, db } from "../firebase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useEvents } from "@/contexts/EventsContext";
import UserProfileModal from "./UserProfileModal";
import PrivateChatModal from "./PrivateChatModal";
import {
  Send,
  ArrowLeft,
  MoreVertical,
  Info,
  Users,
  MessageSquare,
  UserPlus,
  Check,
  Clock,
  X as XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from '@/auth';
import { Textarea } from "@/components/ui/textarea";
import SafeImg from '@/components/SafeImg';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string | number | null;
}

export default function ChatModal({ isOpen, onClose, chatId }: ChatModalProps) {
  const {
    chats,
    addMessage,
    addConnection,
    isConnected,
    events,
    joinedEvents,
    sendFriendRequest,
    getFriendRequestStatus,
    canSendMessage,
    leaveEvent,
    markRead,
  } = useEvents();
  const [messageText, setMessageText] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPrivateChatModal, setShowPrivateChatModal] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chat = chats.find((c) => String(c.id) === String(chatId));
  const event = chat ? events.find(e => String(e.id) === String(chat.eventId)) : null;
  const [resolvedEventImage, setResolvedEventImage] = useState<string | undefined>(chat?.eventImage || event?.image || undefined);
  const [resolvedProfileImages, setResolvedProfileImages] = useState<Record<string, string>>({});

  // Generate group members from resolved participantProfiles when available.
  const groupMembers = React.useMemo(() => {
    if (!event) return [];

    const currentUid = auth.currentUser?.uid;

    // Prefer resolved participantProfiles set by EventsContext meta listener
  if (chat?.participantProfiles && Array.isArray(chat.participantProfiles) && chat.participantProfiles.length > 0) {
      // We prefer to use the raw stored image reference (data:, http(s), or storage path)
      // and resolve storage paths on-demand below. Map to a normalized profile shape.
      const profiles = chat.participantProfiles.map((p) => ({
        id: p.id,
        name: p.id === currentUid ? 'You' : (p.name || p.id),
        // Prefer an already-resolved public URL if EventsContext provided one
        image: (p as any).imageResolved || p.image || undefined,
        status: p.id === currentUid ? 'online' : 'online',
        isHost: String(p.id) === String(event.host) || String(p.id) === String((event as any).createdBy),
        isCurrentUser: p.id === currentUid,
      }));

      // Ensure host appears first
      profiles.sort((a, b) => (a.isHost === b.isHost ? 0 : a.isHost ? -1 : 1));
      return profiles;
    }

    // Fallback to previous host + local current-user + mock attendees if profiles not yet resolved
    const members = [
      // Event host
      {
        id: `host-${event.id}`,
        name: event.hostName || event.host || "Event Host",
        image: event.hostImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
        status: "online",
        isHost: true,
      },
      ...(joinedEvents.map(String).includes(String(event.id)) ? [{
        id: currentUid ? currentUid : 'current-user',
        name: currentUid ? 'You' : 'You',
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
        status: "online",
        isHost: false,
        isCurrentUser: Boolean(currentUid),
      }] : []),
    ];

    // small set of mock attendees for UI density (no more than capacity)
    const mockCount = Math.max(0, Math.min(6, (event.attendees || 1) - members.length));
    for (let i = 0; i < mockCount; i++) {
      const mockUsers = [
        { name: "Sarah Chen", image: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop" },
        { name: "Mike Johnson", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
        { name: "Alex Rivera", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" },
        { name: "Emma Davis", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop" },
        { name: "James Wilson", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" },
        { name: "Lisa Garcia", image: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop" },
      ];
      const u = mockUsers[i % mockUsers.length];
      members.push({ id: `attendee-${i}`, name: u.name, image: u.image, status: 'online', isHost: false });
    }

    return members;
  }, [event, joinedEvents, chat?.participantProfiles]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat?.messages]);

  // Helpers to resolve message ownership and sender display name at render time
  const isFromCurrentUser = (m: any) => String(m.senderId) === String(auth.currentUser?.uid);
  const resolveSenderName = (m: any) => {
    if (!m) return '';
    if (m.senderId === 'system') return 'System';
    if (m.senderName) return m.senderName;
    const gm = groupMembers.find((g) => String(g.id) === String(m.senderId));
    if (gm) return gm.name;
    return isFromCurrentUser(m) ? 'You' : String(m.senderId || '');
  };

  // mark messages read when opening the chat
  useEffect(() => {
    if (isOpen && chat) {
      try { markRead(chat.eventId); } catch (e) {}
    }
  }, [isOpen, chat]);

  // Try to resolve storage-based or encoded event image URLs into a usable https URL
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const src = chat?.eventImage || event?.image;
        if (!src) return;
        // If already an http URL or a data URL (including encoded), use it. Otherwise, attempt to resolve a storage path.
        if (typeof src === 'string' && isHttpDataOrRelative(src)) {
          setResolvedEventImage(src);
          return;
        }

        try {
          const path = normalizeStorageRefPath(String(src));
          const storage = getStorage(app);
          const url = await getDownloadURL(storageRef(storage, path));
          if (mounted) setResolvedEventImage(url);
        } catch (err) {
          // Could not resolve; leave resolvedEventImage as-is
          console.debug('ChatModal: failed to resolve event image from storage path', src, err);
        }
      } catch (err) {
        console.debug('ChatModal: unexpected error resolving event image', err);
      }
    })();
    return () => { mounted = false; };
  }, [chat?.eventImage, event?.image]);

  // Resolve participant profile images (storage paths) to download URLs on-demand and cache locally
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const profiles = chat?.participantProfiles || [];
        if (!profiles.length) return;
        const storage = getStorage(app);
        const next: Record<string, string> = { ...resolvedProfileImages };
        // Also seed from recent messages: message.senderImage may already contain a resolved URL.
        try {
          if (Array.isArray(chat?.messages) && chat.messages.length) {
            for (const m of chat.messages.slice(-10)) {
              if (m && m.senderId && m.senderImage) {
                // Only set if we don't already have a resolved image for that id
                if (!next[String(m.senderId)]) next[String(m.senderId)] = m.senderImage;
              }
            }
          }
        } catch (e) {}
        for (const p of profiles) {
          try {
            // Prefer an already-resolved URL if present on the profile
            const img = (p as any).imageResolved || p.image;
            if (!img) continue;
            if (next[p.id]) continue; // already resolved
            if (typeof img === 'string' && (img.startsWith('data:') || img.startsWith('http://') || img.startsWith('https://'))) {
              next[p.id] = img;
              continue;
            }
            try {
              const path = normalizeStorageRefPath(String(img));
              const url = await getDownloadURL(storageRef(storage, path));
              if (!mounted) break;
              next[p.id] = url;
            } catch (e) {
              // leave unresolved (don't set an empty string which masks fallback logic)
              // simply don't assign next[p.id] so UI will fall back to stored member.image
            }
          } catch (e) {
            // ignore
          }
        }
        if (mounted) setResolvedProfileImages(next);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [chat?.participantProfiles, chat?.messages]);

  // Log group members and resolved images when members panel opens to help debug rendering
  useEffect(() => {
    if (showMembers) {
      try {
        console.debug('ChatModal: opening members panel', { groupMembers, resolvedProfileImages });
      } catch (e) {}
    }
  }, [showMembers]);

  if (!isOpen || !chat) return null;

  const handleStartPrivateChat = (member: any) => {
    if (canSendMessage(member.id, event?.id as any)) {
      setSelectedMember(member);
      setShowPrivateChatModal(true);
    }
  };

  const handleSendFriendRequest = (member: any) => {
    if (event && !member.isCurrentUser && !member.isHost) {
      sendFriendRequest(member.id, member.name, event.id as any);
    }
  };

  const handleViewProfile = (member: any) => {
    // If member appears to be a mock id (host- or attendee-), just show the local member info
    try {
      const uid = String(member.id || '');
      if (!uid || uid.startsWith('attendee-') || uid.startsWith('host-') || uid.startsWith('attendee') || uid.startsWith('host')) {
        setSelectedMember(member);
        setShowProfileModal(true);
        return;
      }

      // Fetch the authoritative user profile from Firestore
      (async () => {
        try {
          const snap = await getDoc(firestoreDoc(db, 'users', uid));
          if (snap.exists()) {
            const data: any = snap.data() || {};
            const name = data.displayName || data.firstName || data.name || data.email || member.name || uid;
            const image = resolvedProfileImages[uid] || data.imageResolved || data.photoURL || data.avatar || (Array.isArray(data.photos) && data.photos[0]) || member.image;
            const profile = {
              id: uid,
              name,
              image,
              status: data.status || member.status || 'online',
              isHost: member.isHost,
              isCurrentUser: member.isCurrentUser,
              // include raw data for richer modal fields (bio, photos, interests, etc.) if present
              ...data,
            };
            setSelectedMember(profile);
            setShowProfileModal(true);
            return;
          }
        } catch (err) {
          console.debug('ChatModal: failed to fetch user profile for', uid, err);
        }

        // Fallback to provided member object
        setSelectedMember(member);
        setShowProfileModal(true);
      })();
    } catch (err) {
      console.debug('ChatModal.handleViewProfile unexpected error', err);
      setSelectedMember(member);
      setShowProfileModal(true);
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !chatId) return;

    // If there is an attachment selected, upload it first and include attachmentUrl
    const send = async () => {
      if (attachmentFile) {
        try {
          const storage = getStorage(app);
          const uid = (window as any).firebaseAuth?.currentUser?.uid || 'anon';
          const path = `chatAttachments/${chatId}/${Date.now()}-${attachmentFile.name}`;
          const ref = storageRef(storage, path);
          const task = uploadBytesResumable(ref, attachmentFile);
          await new Promise<void>((resolve, reject) => {
            task.on('state_changed', () => {}, (err) => reject(err), () => resolve());
          });
          const url = await getDownloadURL(storageRef(storage, path));
          await addMessage(chatId, messageText.trim() || '', url);
        } catch (err) {
          console.error('Attachment upload failed', err);
          // fallback to sending text only
          addMessage(chatId, messageText.trim());
        } finally {
          setAttachmentFile(null);
        }
      } else {
        addMessage(chatId, messageText.trim());
      }
    };

    void send();
    setMessageText("");

    // Show typing indicator
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 3000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "now";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <SafeImg
            src={resolvedEventImage || ''}
            alt={chat.eventName || 'Trybe'}
            className="w-10 h-10 rounded-xl object-cover"
            debugContext={`ChatModal:event:${String(chat.eventId)}`}
          />
          <div>
            <h3 className="font-semibold">{chat.eventName}</h3>
            <p className="text-xs text-muted-foreground">
              {isTyping ? "someone is typing..." : `${event?.attendees || chat.participants} members`}
            </p>
          </div>
        </div>

        <div className="relative flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMembers(!showMembers)}
            className={cn(showMembers && "bg-accent")}
          >
            <Users className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setShowOptions(!showOptions);
            }}
            className="relative"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>

          {showOptions && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-12 z-50 w-44 bg-card rounded-lg shadow-lg border border-border p-2"
            >
              <button
                onClick={() => {
                  try {
                    const idToLeave = event?.id ?? chat.eventId;
                    if (idToLeave) leaveEvent(idToLeave as any);
                  } catch (e) {
                    console.debug('ChatModal: leave button handler failed', e);
                  }
                  setShowOptions(false);
                  onClose();
                }}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-destructive/10 text-sm text-red-600"
              >
                Leave group (cancel spot)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Group Members Panel */}
      {showMembers && (
        <div className="border-b border-border bg-muted/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Group Members ({groupMembers.length})
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMembers(false)}
              className="text-xs"
            >
              Hide
            </Button>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {groupMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-card rounded-lg border border-border hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    <SafeImg
                      src={
                        (resolvedProfileImages[String(member.id)] || resolvedProfileImages[member.id] || member.image) as string | undefined
                        || ''
                      }
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover"
                      debugContext={`ChatModal:member:${String(member.id)}`}
                    />
                    <div className={cn(
                      "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-card",
                      member.status === "online" ? "bg-green-500" : "bg-gray-400"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{member.name}</p>
                    {/* Only show Host label; remove online/status text per design */}
                    {member.isHost && (
                      <p className="text-xs text-muted-foreground">Host</p>
                    )}
                  </div>
                </div>

                {!member.isCurrentUser ? (
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewProfile(member)}
                      className="h-8 w-8 p-0"
                      title="View Profile"
                    >
                      <Users className="w-4 h-4" />
                    </Button>
                    {/* Allow direct private message if permitted or if member is host */}
                    {((member.isHost) || canSendMessage(member.id, Number(event?.id || 0))) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartPrivateChat(member)}
                        className="h-8 w-8 p-0"
                        title="Message"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    You
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chat.messages.map((message, index) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              isFromCurrentUser(message) ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2 break-words",
                isFromCurrentUser(message)
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted text-muted-foreground rounded-bl-sm",
                message.senderId === "system" &&
                  "bg-accent/50 text-accent-foreground text-center text-sm italic max-w-[90%] mx-auto",
              )}
            >
              {message.senderId !== "system" && (
                <p className="text-xs opacity-70 mb-1">{resolveSenderName(message)}</p>
              )}
              <p>{message.content}</p>
              {message.attachmentUrl && (
                <div className="mt-2">
                  <img src={message.attachmentUrl} alt="attachment" className="w-48 h-auto rounded-md object-cover" />
                </div>
              )}
              <p
                className={cn(
                  "text-xs mt-1 opacity-70",
                  isFromCurrentUser(message) ? "text-right" : "text-left",
                  message.senderId === "system" && "text-center",
                )}
              >
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="rounded-2xl border-2 focus-visible:ring-1 resize-none"
              rows={1}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim()}
            size="icon"
            className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>

        {/* Event Info Banner */}
        <div className="mt-3 bg-accent/30 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Chat about your joined event
            </span>
          </div>
          <Button variant="ghost" size="sm" className="text-xs">
            Event Details
          </Button>
        </div>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setSelectedMember(null);
        }}
        user={selectedMember}
        onStartPrivateChat={handleStartPrivateChat}
      />

      {/* Private Chat Modal */}
      <PrivateChatModal
        isOpen={showPrivateChatModal}
        onClose={() => {
          setShowPrivateChatModal(false);
          setSelectedMember(null);
        }}
        user={selectedMember}
      />
    </div>
  );
}
