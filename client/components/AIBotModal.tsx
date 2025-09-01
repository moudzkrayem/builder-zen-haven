import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useEvents } from "@/contexts/EventsContext";
import {
  X,
  Send,
  Calendar,
  MapPin,
  Users,
  TrendingUp,
  Heart,
  Star,
  Clock,
  Zap,
  Target,
  Coffee,
  Dumbbell,
  Music,
  Palette,
  Code,
  Utensils,
  Mountain,
  Briefcase,
  Book
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AIBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventClick: (eventId: number) => void;
}

interface AIMessage {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
  recommendations?: number[];
  type: 'text' | 'recommendations' | 'notification';
}

const AI_PERSONALITY = {
  name: "Trybe AI",
  greeting: "Hey there! 👋 I'm your personal activity concierge. I analyze your interests and find amazing events you'll love!",
  suggestions: [
    "Show me events for this weekend",
    "Find creative activities near me",
    "What's trending right now?",
    "Recommend based on my interests",
    "Create a Trybe for me"
  ]
};

const INTEREST_ICONS: { [key: string]: any } = {
  sports: Dumbbell,
  fitness: Dumbbell,
  creative: Palette,
  arts: Palette,
  tech: Code,
  technology: Code,
  food: Utensils,
  cooking: Utensils,
  outdoor: Mountain,
  nature: Mountain,
  business: Briefcase,
  networking: Briefcase,
  learning: Book,
  education: Book,
  music: Music,
  entertainment: Music,
  coffee: Coffee,
  social: Users
};

type TrybeDraft = {
  eventName: string;
  location: string;
  time: string;
  description: string;
  maxCapacity: number;
  fee: string;
  photos: string[];
  isPremium: boolean;
};

type CreateStep =
  | 'idle'
  | 'eventName'
  | 'location'
  | 'time'
  | 'maxCapacity'
  | 'fee'
  | 'description'
  | 'isPremium'
  | 'confirm';

export default function AIBotModal({ isOpen, onClose, onEventClick }: AIBotModalProps) {
  const { events, addEvent } = useEvents();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [createStep, setCreateStep] = useState<CreateStep>('idle');
  const [draft, setDraft] = useState<TrybeDraft | null>(null);
  const [pendingEventId, setPendingEventId] = useState<number | null>(null);

  // Get user profile for personalization
  const userProfile = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('userProfile') || '{}');
    } catch {
      return {};
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initial greeting
      setTimeout(() => {
        setMessages([{
          id: 'greeting',
          content: AI_PERSONALITY.greeting,
          isBot: true,
          timestamp: new Date(),
          type: 'text'
        }]);
      }, 500);

      // Follow up with recommendations
      setTimeout(() => {
        generateInitialRecommendations();
      }, 2000);
    }
  }, [isOpen]);

  const generateInitialRecommendations = () => {
    const userInterests = [
      ...(userProfile.thingsYouDoGreat || []),
      ...(userProfile.thingsYouWantToTry || [])
    ].map(interest => interest.toLowerCase());

    // Score events based on user interests
    const recommendations = events
      .map(event => {
        let score = 0;
        const eventInterests = (event.interests || []).map(i => i.toLowerCase());
        const eventCategory = event.category.toLowerCase();
        
        // Check interest matches
        userInterests.forEach(userInterest => {
          if (eventInterests.some(ei => ei.includes(userInterest) || userInterest.includes(ei))) {
            score += 3;
          }
          if (eventCategory.includes(userInterest) || userInterest.includes(eventCategory)) {
            score += 2;
          }
        });

        // Boost popular events
        if (event.isPopular) score += 1;
        
        // Boost events with good ratings
        if (event.rating && event.rating > 4.5) score += 1;

        return { ...event, aiScore: score };
      })
      .filter(event => event.aiScore > 0)
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, 3);

    if (recommendations.length > 0) {
      const message: AIMessage = {
        id: `rec-${Date.now()}`,
        content: `Based on your interests in ${userInterests.slice(0, 3).join(', ')}, I found some perfect matches for you! 🎯`,
        isBot: true,
        timestamp: new Date(),
        recommendations: recommendations.map(r => r.id),
        type: 'recommendations'
      };

      setMessages(prev => [...prev, message]);
    }
  };

  const detectCreateIntent = (text: string) => {
    const t = text.toLowerCase();
    const hasCreate = /(create|make|start|host|set up|setup|organize)/.test(t);
    const mentionsEvent = /(trybe|tribe|event|gathering|group|meetup)/.test(t);
    return hasCreate && mentionsEvent;
  };

  const startCreateFlow = () => {
    setDraft({
      eventName: "",
      location: "",
      time: "",
      description: "",
      maxCapacity: 10,
      fee: "Free",
      photos: [],
      isPremium: false,
    });
    setCreateStep('eventName');
    const msg: AIMessage = {
      id: `ai-${Date.now()}`,
      content: "Awesome! Let's create your Trybe. What should we call it?",
      isBot: true,
      timestamp: new Date(),
      type: 'text'
    };
    setMessages(prev => [...prev, msg]);
  };

  const normalizeFee = (raw: string): string => {
    const t = raw.trim();
    if (!t) return "Free";
    if (/free/i.test(t)) return "Free";
    const num = t.replace(/[^0-9.]/g, "");
    if (num) return `$${parseFloat(num).toString()}`;
    return t;
  };

  const normalizeDateTime = (raw: string): string | null => {
    let t = raw.trim();
    if (!t) return null;
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/.test(t)) {
      t = t.replace(" ", "T");
    }
    const d = new Date(t);
    if (isNaN(d.getTime())) return null;
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleCreateFlowInput = async (raw: string) => {
    if (raw.toLowerCase() === 'cancel') {
      setCreateStep('idle');
      setDraft(null);
      const msg: AIMessage = {
        id: `ai-${Date.now()}`,
        content: "Got it, I canceled the creation. If you change your mind, just say 'create a trybe'.",
        isBot: true,
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, msg]);
      setIsTyping(false);
      return;
    }

    if (!draft) return;

    const ask = (content: string) => {
      const m: AIMessage = {
        id: `ai-${Date.now()}`,
        content,
        isBot: true,
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, m]);
    };

    switch (createStep) {
      case 'eventName': {
        const val = raw.trim();
        if (!val) {
          ask("Please provide a name for your Trybe.");
          break;
        }
        setDraft({ ...draft, eventName: val });
        setCreateStep('location');
        ask("Great! Where will it take place? (City or venue)");
        break;
      }
      case 'location': {
        const val = raw.trim();
        if (!val) {
          ask("What's the location?");
          break;
        }
        setDraft({ ...draft, location: val });
        setCreateStep('time');
        ask("When is it happening? Please enter date and time like 2025-09-12 18:30 or 2025-09-12T18:30");
        break;
      }
      case 'time': {
        const normalized = normalizeDateTime(raw);
        if (!normalized) {
          ask("I couldn't read that time. Use format 2025-09-12 18:30");
          break;
        }
        setDraft({ ...draft, time: normalized });
        setCreateStep('maxCapacity');
        ask("How many people can join? (1-100)");
        break;
      }
      case 'maxCapacity': {
        const n = parseInt(raw.replace(/[^0-9]/g, ''), 10);
        if (!n || n < 1 || n > 100) {
          ask("Please provide a number between 1 and 100.");
          break;
        }
        setDraft({ ...draft, maxCapacity: n });
        setCreateStep('fee');
        ask("Is it Free or paid? You can type 'Free' or an amount like $10");
        break;
      }
      case 'fee': {
        const f = normalizeFee(raw);
        setDraft({ ...draft, fee: f });
        setCreateStep('description');
        ask("Add a short description (optional). Type 'skip' to continue.");
        break;
      }
      case 'description': {
        const val = raw.trim().toLowerCase() === 'skip' ? '' : raw.trim();
        setDraft({ ...draft, description: val });
        setCreateStep('isPremium');
        ask("Make it Premium? Type 'yes' or 'no'. Premium events are exclusive to verified members.");
        break;
      }
      case 'isPremium': {
        const t = raw.trim().toLowerCase();
        const premium = /^(y|yes|premium|true)$/i.test(t);
        const updated = { ...draft, isPremium: premium };
        setDraft(updated);
        setCreateStep('confirm');
        const summary = `Here's your Trybe:\n• Name: ${updated.eventName}\n• Location: ${updated.location}\n• When: ${new Date(updated.time).toLocaleString()}\n• Capacity: ${updated.maxCapacity}\n• Fee: ${updated.fee}\n• Premium: ${updated.isPremium ? 'Yes' : 'No'}${updated.description ? `\n• About: ${updated.description}` : ''}\n\nType 'confirm' to create or 'cancel' to abort.`;
        ask(summary);
        break;
      }
      case 'confirm': {
        if (raw.trim().toLowerCase() !== 'confirm') {
          ask("Please type 'confirm' to create or 'cancel' to abort.");
          break;
        }
        const id = Date.now();
        setPendingEventId(id);
        const payload = { ...draft, id };
        addEvent(payload);
        setCreateStep('idle');
        setDraft(null);
        const createdMsg: AIMessage = {
          id: `ai-${Date.now()}`,
          content: "Your Trybe is live! 🎉 Tap to view details.",
          isBot: true,
          timestamp: new Date(),
          recommendations: [id],
          type: 'recommendations'
        };
        setMessages(prev => [...prev, createdMsg]);
        setIsTyping(false);
        return;
      }
    }
    setIsTyping(false);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      content: input,
      isBot: false,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI thinking
    setTimeout(() => {
      const response = generateAIResponse(input);
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const generateAIResponse = (userInput: string): AIMessage => {
    const input = userInput.toLowerCase();
    const userInterests = [
      ...(userProfile.thingsYouDoGreat || []),
      ...(userProfile.thingsYouWantToTry || [])
    ].map(interest => interest.toLowerCase());

    // Weekend recommendations
    if (input.includes('weekend') || input.includes('saturday') || input.includes('sunday')) {
      const weekendEvents = events.filter(event => 
        event.date.includes('Sat') || event.date.includes('Sun')
      ).slice(0, 3);
      
      return {
        id: `ai-${Date.now()}`,
        content: "Perfect! Here are some amazing weekend activities I think you'll love! 🌟",
        isBot: true,
        timestamp: new Date(),
        recommendations: weekendEvents.map(e => e.id),
        type: 'recommendations'
      };
    }

    // Creative activities
    if (input.includes('creative') || input.includes('art') || input.includes('design')) {
      const creativeEvents = events.filter(event => 
        event.category.toLowerCase().includes('creative') ||
        event.category.toLowerCase().includes('art') ||
        (event.interests || []).some(i => 
          i.toLowerCase().includes('art') || 
          i.toLowerCase().includes('creative') ||
          i.toLowerCase().includes('design')
        )
      ).slice(0, 3);
      
      return {
        id: `ai-${Date.now()}`,
        content: "I love your creative energy! Here are some artistic events that will inspire you! 🎨",
        isBot: true,
        timestamp: new Date(),
        recommendations: creativeEvents.map(e => e.id),
        type: 'recommendations'
      };
    }

    // Trending/popular
    if (input.includes('trending') || input.includes('popular') || input.includes('hot')) {
      const trendingEvents = events.filter(event => event.isPopular).slice(0, 3);
      
      return {
        id: `ai-${Date.now()}`,
        content: "Here's what's buzzing right now! These events are super popular and filling up fast! 🔥",
        isBot: true,
        timestamp: new Date(),
        recommendations: trendingEvents.map(e => e.id),
        type: 'recommendations'
      };
    }

    // Interest-based recommendations
    if (input.includes('interest') || input.includes('recommend') || input.includes('suggest')) {
      const recommendations = events
        .filter(event => {
          const eventInterests = (event.interests || []).map(i => i.toLowerCase());
          const eventCategory = event.category.toLowerCase();
          
          return userInterests.some(userInterest => 
            eventInterests.some(ei => ei.includes(userInterest) || userInterest.includes(ei)) ||
            eventCategory.includes(userInterest) || userInterest.includes(eventCategory)
          );
        })
        .slice(0, 3);

      return {
        id: `ai-${Date.now()}`,
        content: `I've analyzed your profile and found events perfect for someone with your interests! These align with your passion for ${userInterests.slice(0, 2).join(' and ')}! ✨`,
        isBot: true,
        timestamp: new Date(),
        recommendations: recommendations.map(e => e.id),
        type: 'recommendations'
      };
    }

    // Default helpful response
    const helpfulResponses = [
      "I'm here to help you discover amazing events! Try asking me about weekend activities, creative events, or let me recommend based on your interests! 🌟",
      "I can help you find the perfect activities! Ask me about trending events, weekend plans, or specific interests like sports, arts, or tech! 🎯",
      "Let me be your activity guide! I can suggest events for the weekend, find creative workshops, or match you with experiences based on your profile! ✨"
    ];

    return {
      id: `ai-${Date.now()}`,
      content: helpfulResponses[Math.floor(Math.random() * helpfulResponses.length)],
      isBot: true,
      timestamp: new Date(),
      type: 'text'
    };
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => handleSendMessage(), 100);
  };

  const getRecommendedEvents = (eventIds: number[]) => {
    return events.filter(event => eventIds.includes(event.id));
  };

  const getInterestIcon = (interests: string[]) => {
    const interest = interests[0]?.toLowerCase() || '';
    for (const [key, Icon] of Object.entries(INTEREST_ICONS)) {
      if (interest.includes(key)) {
        return Icon;
      }
    }
    return Target;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-3xl w-full max-w-md h-[600px] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F5c6becf7cef04a3db5d3620ce9b103bd%2F0880b93857be41f7bd6c705364449846?format=webp&width=800"
                alt="Trybe AI"
                className="w-6 h-6 object-contain"
              />
            </div>
            <div>
              <h2 className="text-lg font-bold">{AI_PERSONALITY.name}</h2>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Online & Ready to Help</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={cn(
              "flex",
              message.isBot ? "justify-start" : "justify-end"
            )}>
              <div className={cn(
                "max-w-[80%] rounded-2xl p-3",
                message.isBot 
                  ? "bg-muted text-muted-foreground" 
                  : "bg-primary text-primary-foreground"
              )}>
                {message.isBot && (
                  <div className="flex items-center space-x-2 mb-2">
                    <img
                      src="https://cdn.builder.io/api/v1/image/assets%2F5c6becf7cef04a3db5d3620ce9b103bd%2F0880b93857be41f7bd6c705364449846?format=webp&width=800"
                      alt="Trybe AI"
                      className="w-4 h-4 object-contain"
                    />
                    <span className="text-xs font-medium">Trybe AI</span>
                  </div>
                )}
                
                <p className="text-sm">{message.content}</p>
                
                {message.recommendations && message.recommendations.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {getRecommendedEvents(message.recommendations).map((event) => {
                      const IconComponent = getInterestIcon(event.interests || []);
                      return (
                        <Card key={event.id} className="border border-border/50 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => onEventClick(event.id)}>
                          <CardContent className="p-3">
                            <div className="flex items-start space-x-3">
                              <img 
                                src={event.image} 
                                alt={event.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm truncate">{event.name}</h4>
                                <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{event.date}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate">{event.location}</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center space-x-1">
                                    <IconComponent className="w-3 h-3 text-primary" />
                                    <span className="text-xs text-primary font-medium">{event.category}</span>
                                  </div>
                                  {event.rating && (
                                    <div className="flex items-center space-x-1">
                                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                      <span className="text-xs">{event.rating}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
                
                <div className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted text-muted-foreground rounded-2xl p-3 max-w-[80%]">
                <div className="flex items-center space-x-2 mb-2">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2F5c6becf7cef04a3db5d3620ce9b103bd%2F0880b93857be41f7bd6c705364449846?format=webp&width=800"
                    alt="Trybe AI"
                    className="w-4 h-4 object-contain"
                  />
                  <span className="text-xs font-medium">Trybe AI</span>
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 2 && (
          <div className="px-4 pb-2">
            <div className="text-xs text-muted-foreground mb-2">Quick suggestions:</div>
            <div className="flex flex-wrap gap-2">
              {AI_PERSONALITY.suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs rounded-full"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me about events you'd love..."
              className="flex-1 rounded-full"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!input.trim() || isTyping}
              size="icon"
              className="rounded-full"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
