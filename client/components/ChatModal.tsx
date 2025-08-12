import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEvents } from "@/contexts/EventsContext";
import {
  X,
  Send,
  ArrowLeft,
  MoreVertical,
  Phone,
  Video,
  Info,
  Users,
  MessageSquare,
  UserPlus,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: number | null;
}

export default function ChatModal({ isOpen, onClose, chatId }: ChatModalProps) {
  const { chats, addMessage, addConnection, isConnected } = useEvents();
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chat = chats.find((c) => c.id === chatId);

  // Mock group members data
  const groupMembers = [
    {
      id: 1,
      name: "Sarah Chen",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop",
      status: "online",
      isHost: false,
    },
    {
      id: 2,
      name: "Mike Johnson",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      status: "offline",
      isHost: false,
    },
    {
      id: 3,
      name: "Event Host",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
      status: "online",
      isHost: true,
    },
    {
      id: 4,
      name: "Alex Rivera",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      status: "online",
      isHost: false,
    },
  ];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat?.messages]);

  if (!isOpen || !chat) return null;

  const handleStartPrivateChat = (member: any) => {
    // This would create a new private chat
    alert(`Starting private chat with ${member.name}`);
  };

  const handleViewProfile = (member: any) => {
    // This would navigate to the member's profile
    setSelectedMember(member);
    alert(`Viewing ${member.name}'s profile`);
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !chatId) return;

    addMessage(chatId, messageText.trim());
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
            src={chat.eventImage}
            alt={chat.eventName}
            className="w-10 h-10 rounded-xl object-cover"
          />
          <div>
            <h3 className="font-semibold">{chat.eventName}</h3>
            <p className="text-xs text-muted-foreground">
              {isTyping ? "someone is typing..." : `${chat.participants} members`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

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
              {message.senderId !== "system" && !message.isCurrentUser && (
                <p className="text-xs opacity-70 mb-1">{message.senderName}</p>
              )}
              <p>{message.content}</p>
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
            <Input
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
    </div>
  );
}
