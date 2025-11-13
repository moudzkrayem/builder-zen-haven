import React, { useState, useRef, useEffect } from "react";
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
import { db } from "@/firebase";
import { doc as firestoreDoc, getDoc } from "firebase/firestore";
import { auth } from "@/auth";

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
  const [isTyping, setIsTyping] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPrivateChatModal, setShowPrivateChatModal] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chat = chats.find((c) => c.id === chatId);
  const event = chat ? events.find(e => e.id === chat.eventId) : null;

  // State for fetched member profiles from Firestore
  const [groupMembers, setGroupMembers] = useState<Array<{
    id: string;
    name: string;
    image: string;
    status: string;
    isHost: boolean;
    isCurrentUser: boolean;
  }>>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Fetch real member data from Firestore based on event's attendeeIds
  useEffect(() => {
    if (!event || !isOpen) {
      setGroupMembers([]);
      return;
    }

    const fetchMembers = async () => {
      setLoadingMembers(true);
      
      try {
        const attendeeIds = (event as any).attendeeIds || [];
        const currentUser = auth.currentUser;
        const hostId = (event as any).createdBy || (event as any).host;
        
        const fetchedMembers: Array<{
          id: string;
          name: string;
          image: string;
          status: string;
          isHost: boolean;
          isCurrentUser: boolean;
        }> = [];
        
        // Fetch each attendee's profile
        for (const userId of attendeeIds) {
          try {
            const isCurrentUser = currentUser && currentUser.uid === userId;
            const isHost = userId === hostId;
            
            if (isCurrentUser) {
              // Fetch current user's profile from Firestore to get actual photo
              let photoURL = '';
              let userName = 'You';
              
              try {
                const userDoc = await getDoc(firestoreDoc(db, 'users', userId));
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  photoURL = userData.photoURL 
                    || userData.profileImage 
                    || (userData.photos && userData.photos.length > 0 ? userData.photos[0] : '')
                    || '';
                }
              } catch (e) {
                console.log('ChatModal: Failed to fetch current user from Firestore', e);
              }
              
              // Fallback to localStorage if Firestore didn't have it
              if (!photoURL) {
                try {
                  const userProfile = localStorage.getItem('userProfile');
                  if (userProfile) {
                    const profile = JSON.parse(userProfile);
                    photoURL = profile.photoURL || (profile.photos && profile.photos[0]) || '';
                  }
                } catch (e) {
                  console.log('ChatModal: Failed to parse userProfile from localStorage');
                }
              }
              
              // Final fallback to Firebase Auth
              if (!photoURL && currentUser.photoURL) {
                photoURL = currentUser.photoURL;
              }
              
              fetchedMembers.push({
                id: userId,
                name: userName,
                image: photoURL || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
                status: 'online',
                isHost,
                isCurrentUser: true,
              });
            } else {
              // Fetch from Firestore
              const userDoc = await getDoc(firestoreDoc(db, 'users', userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                const name = userData.displayName 
                  || userData.name 
                  || (userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : '')
                  || userData.firstName
                  || userData.lastName
                  || 'Unknown User';
                
                const photoURL = userData.photoURL 
                  || userData.profileImage 
                  || (userData.photos && userData.photos.length > 0 ? userData.photos[0] : '')
                  || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop';
                
                fetchedMembers.push({
                  id: userId,
                  name,
                  image: photoURL,
                  status: 'offline',
                  isHost,
                  isCurrentUser: false,
                });
              } else {
                // User document not found - add placeholder
                fetchedMembers.push({
                  id: userId,
                  name: 'Unknown User',
                  image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
                  status: 'offline',
                  isHost,
                  isCurrentUser: false,
                });
              }
            }
          } catch (err) {
            console.error('ChatModal: Error fetching user', userId, err);
          }
        }
        
        // Sort: host first, then current user, then others
        fetchedMembers.sort((a, b) => {
          if (a.isHost && !b.isHost) return -1;
          if (!a.isHost && b.isHost) return 1;
          if (a.isCurrentUser && !b.isCurrentUser) return -1;
          if (!a.isCurrentUser && b.isCurrentUser) return 1;
          return 0;
        });
        
        setGroupMembers(fetchedMembers);
      } catch (err) {
        console.error('ChatModal: Error fetching members:', err);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [event?.id, isOpen]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat?.messages]);

  if (!isOpen || !chat) return null;

  const handleStartPrivateChat = (member: any) => {
    if (canSendMessage(member.id, event?.id || 0)) {
      setSelectedMember(member);
      setShowPrivateChatModal(true);
    }
  };

  const handleSendFriendRequest = (member: any) => {
    if (event && !member.isCurrentUser && !member.isHost) {
      sendFriendRequest(member.id, member.name, event.id);
    }
  };

  const handleViewProfile = async (member: any) => {
    try {
      // Fetch full user profile from Firestore
      const userDoc = await getDoc(firestoreDoc(db, 'users', member.id));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('Fetched user profile data:', userData);
        console.log('Interests from Firestore:', userData.interests);
        // Merge basic member info with full Firestore profile data
        const mergedProfile = {
          ...member,
          ...userData,
          id: member.id, // Ensure ID is preserved
          name: member.name, // Preserve the display name we already have
        };
        console.log('Merged profile for modal:', mergedProfile);
        setSelectedMember(mergedProfile);
      } else {
        console.log('User document does not exist for:', member.id);
        // Fallback to basic member info if user document doesn't exist
        setSelectedMember(member);
      }
      setShowProfileModal(true);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Fallback to basic member info on error
      setSelectedMember(member);
      setShowProfileModal(true);
    }
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
              {isTyping ? "someone is typing..." : `${event?.attendees || chat.participants} members`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMembers(!showMembers)}
            className={cn(showMembers && "bg-accent")}
          >
            <Users className="w-5 h-5" />
          </Button>

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setShowOptions(!showOptions);
              }}
            >
              <MoreVertical className="w-5 h-5" />
            </Button>

            {showOptions && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-2 z-50 w-44 bg-card rounded-lg shadow-lg border border-border p-2"
              >
                <button
                  onClick={() => {
                    if (event) {
                      leaveEvent(event.id);
                    }
                    setShowOptions(false);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-destructive/10 text-sm text-red-600 flex items-center"
                >
                  <XIcon className="w-4 h-4 mr-2" />
                  Leave group (cancel spot)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Group Members Panel */}
      {showMembers && (
        <div className="border-b border-border bg-muted/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Group Members ({loadingMembers ? '...' : groupMembers.length})
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
            {loadingMembers ? (
              <div className="text-center py-4 text-muted-foreground">
                Loading members...
              </div>
            ) : groupMembers.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No members found
              </div>
            ) : (
              groupMembers.map((member) => (
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
                      const eventIdNum = typeof event?.id === 'number' ? event.id : Number(event?.id) || 0;
                      const requestStatus = getFriendRequestStatus(member.id, eventIdNum);
                      const canChat = canSendMessage(member.id, event?.id || 0);

                      if (member.isHost) {
                        // Host - no chat icon needed
                        return null;
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
              ))
            )}
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
