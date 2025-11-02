import React, { useState, useRef, useEffect } from "react";
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { app } from "../firebase";
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
import { Textarea } from "@/components/ui/textarea";

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

  // Generate group members based on the event's actual attendees and joined users
  const groupMembers = React.useMemo(() => {
    if (!event) return [];

    const members = [
      // Event host
      {
        id: `host-${event.id}`,
        name: event.hostName || event.host || "Event Host",
        image: event.hostImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
        status: "online",
        isHost: true,
      },
      // Current user (if joined)
  ...(joinedEvents.map(String).includes(String(event.id)) ? [{
        id: "current-user",
        name: "You",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
        status: "online",
        isHost: false,
        isCurrentUser: true,
      }] : []),
      // Other mock attendees based on event capacity
  ...Array.from({ length: Math.min(event.attendees - (joinedEvents.map(String).includes(String(event.id)) ? 2 : 1), 6) }, (_, index) => {
        const mockUsers = [
          { name: "Sarah Chen", image: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop" },
          { name: "Mike Johnson", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
          { name: "Alex Rivera", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" },
          { name: "Emma Davis", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop" },
          { name: "James Wilson", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" },
          { name: "Lisa Garcia", image: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop" },
        ];
        const user = mockUsers[index % mockUsers.length];
        return {
          id: `attendee-${index}`,
          name: user.name,
          image: user.image,
          status: Math.random() > 0.3 ? "online" : "offline",
          isHost: false,
        };
      }),
    ];

    return members;
  }, [event, joinedEvents]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat?.messages]);

  // Try to resolve storage-based or encoded event image URLs into a usable https URL
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const src = chat?.eventImage || event?.image;
        if (!src) return;
        // If already an http URL and loads correctly, use it. Otherwise, attempt to resolve a storage path.
        if (typeof src === 'string' && src.startsWith('http')) {
          setResolvedEventImage(src);
          return;
        }

        let path = String(src);
        if (path.startsWith('gs://')) {
          path = path.replace('gs://', '');
          const parts = path.split('/');
          if (parts.length > 1) parts.shift();
          path = parts.join('/');
        }

        // If the string looks like a full storage download URL, extract the '/o/<path>' portion
        const match = String(path).match(/\/o\/(.*?)\?/);
        if (match && match[1]) {
          path = decodeURIComponent(match[1]);
        }

        try {
          const storage = getStorage(app);
          const url = await getDownloadURL(storageRef(storage, path));
          if (mounted) setResolvedEventImage(url);
        } catch (err) {
          // Could not resolve; leave resolvedEventImage as-is
          console.debug('ChatModal: failed to resolve event image from storage path', path, err);
        }
      } catch (err) {
        console.debug('ChatModal: unexpected error resolving event image', err);
      }
    })();
    return () => { mounted = false; };
  }, [chat?.eventImage, event?.image]);

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
    setSelectedMember(member);
    setShowProfileModal(true);
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
          <img
            src={resolvedEventImage || '/placeholder.svg'}
            alt={chat.eventName || 'Trybe'}
            className="w-10 h-10 rounded-xl object-cover"
            onError={async (e) => {
              try {
                const el = e.currentTarget as HTMLImageElement;
                const src = chat?.eventImage || event?.image;
                if (!src) { el.src = '/placeholder.svg'; return; }
                // Attempt to extract storage path and re-resolve
                let path = String(src);
                const match = path.match(/\/o\/(.*?)\?/);
                if (match && match[1]) path = decodeURIComponent(match[1]);
                if (path.startsWith('gs://')) {
                  path = path.replace('gs://', '');
                  const parts = path.split('/');
                  if (parts.length > 1) parts.shift();
                  path = parts.join('/');
                }
                const storage = getStorage(app);
                const url = await getDownloadURL(storageRef(storage, path));
                el.src = url;
              } catch (err) {
                (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
              }
            }}
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
                  if (event) {
                      leaveEvent(event.id as any);
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
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className={cn(
                      "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-card",
                      member.status === "online" ? "bg-green-500" : "bg-gray-400"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.isHost ? "Host" : member.status}
                    </p>
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
                    {(() => {
                      const requestStatus = getFriendRequestStatus(member.id, Number(event?.id || 0));
                      const canChat = canSendMessage(member.id, Number(event?.id || 0));

                      if (member.isHost) {
                        // Host can always be messaged
                        return (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartPrivateChat(member)}
                            className="h-8 w-8 p-0"
                            title="Message Host"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        );
                      }

                      if (canChat) {
                        // Friend request accepted - can message
                        return (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStartPrivateChat(member)}
                              className="h-8 w-8 p-0"
                              title="Send Message"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                            <Badge variant="default" className="text-xs bg-green-500 text-white">
                              Friends
                            </Badge>
                          </>
                        );
                      }

                      if (requestStatus === 'pending') {
                        // Request pending
                        return (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled
                              className="h-8 w-8 p-0"
                              title="Request Pending"
                            >
                              <Clock className="w-4 h-4 text-yellow-500" />
                            </Button>
                            <Badge variant="secondary" className="text-xs">
                              Pending
                            </Badge>
                          </>
                        );
                      }

                      if (requestStatus === 'declined') {
                        // Request declined
                        return (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled
                              className="h-8 w-8 p-0"
                              title="Request Declined"
                            >
                              <XIcon className="w-4 h-4 text-red-500" />
                            </Button>
                            <Badge variant="secondary" className="text-xs text-red-600">
                              Declined
                            </Badge>
                          </>
                        );
                      }

                      // No request sent yet - show send request button
                      return (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSendFriendRequest(member)}
                            className="h-8 w-8 p-0"
                            title="Send Friend Request"
                          >
                            <UserPlus className="w-4 h-4" />
                          </Button>
                          <Badge variant="outline" className="text-xs">
                            Send Request
                          </Badge>
                        </>
                      );
                    })()}
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
              message.isCurrentUser ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2 break-words",
                message.isCurrentUser
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted text-muted-foreground rounded-bl-sm",
                message.senderId === "system" &&
                  "bg-accent/50 text-accent-foreground text-center text-sm italic max-w-[90%] mx-auto",
              )}
            >
              {message.senderId !== "system" && (
                <p className="text-xs opacity-70 mb-1">{message.senderName}</p>
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
                  message.isCurrentUser ? "text-right" : "text-left",
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
