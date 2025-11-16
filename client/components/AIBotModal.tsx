import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useEvents } from "@/contexts/EventsContext";
import MapPicker from './MapPicker';
import { createTrybeWithMessage } from '@/lib/createTrybeWithMessage';
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
  recommendations?: Array<string | number>;
  type: 'text' | 'recommendations' | 'notification';
  actions?: { label: string; value: string; style?: 'primary' | 'secondary' }[];
  control?: 'datetime' | 'age' | 'upload' | 'map';
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
  locationCoords?: { lat: number; lng: number };
  placeId?: string;
  formattedAddress?: string;
  time: string;
  duration: string;
  description: string;
  maxCapacity: number;
  fee: string;
  photos: string[];
  ageRange: [number, number];
};

type CreateStep =
  | 'idle'
  | 'eventName'
  | 'location'
  | 'time'
  | 'duration'
  | 'maxCapacity'
  | 'fee'
  | 'description'
  | 'ageRange'
  | 'photos'
  | 'confirm';

export default function AIBotModal({ isOpen, onClose, onEventClick }: AIBotModalProps) {
  const { events, addEvent, joinedEvents } = useEvents();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [createStep, setCreateStep] = useState<CreateStep>('idle');
  const [draft, setDraft] = useState<TrybeDraft | null>(null);
  const [dateInputs, setDateInputs] = useState<Record<string, string>>({});
  const [ageInputs, setAgeInputs] = useState<Record<string, { min: number; max: number }>>({});
  
  // Helper function to safely check if event matches creative category
  const isCreativeEvent = (event: any) => {
    const category = (event.category || '').toLowerCase();
    const interests = (event.interests || []).filter((i: any) => i && typeof i === 'string');
    
    return category.includes('creative') ||
           category.includes('art') ||
           interests.some((i: string) => {
             const interest = i.toLowerCase();
             return interest.includes('art') || interest.includes('creative') || interest.includes('design');
           });
  };
  const [isPersisting, setIsPersisting] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

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

  const handleLocationSelect = (payload: { lat: number; lng: number; formattedAddress?: string; placeId?: string }) => {
    const locationText = payload.formattedAddress || `${payload.lat.toFixed(4)}, ${payload.lng.toFixed(4)}`;
    setDraft(d => d ? { 
      ...d, 
      location: locationText,
      locationCoords: { lat: payload.lat, lng: payload.lng },
      placeId: payload.placeId,
      formattedAddress: payload.formattedAddress
    } : d);
    setShowMapPicker(false);
    setMessages(prev => [...prev, {
      id: `ai-${Date.now()}`,
      content: `Great! Location set to: ${locationText}. Now click "Continue" when ready.`,
      isBot: true,
      timestamp: new Date(),
      type: 'text'
    }]);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Body scroll lock while AI modal is open. Use a global counter so other modals
  // won't accidentally re-enable body scrolling while this is open.
  useEffect(() => {
    const w = window as any;
    w.__modalOpenCount = w.__modalOpenCount || 0;
    if (isOpen) {
      w.__modalOpenCount += 1;
      if (w.__modalOpenCount === 1) document.body.style.overflow = 'hidden';
    }
    return () => {
      if (isOpen) {
        w.__modalOpenCount = Math.max(0, (w.__modalOpenCount || 1) - 1);
        if (w.__modalOpenCount === 0) document.body.style.overflow = '';
      }
    };
  }, [isOpen]);

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
    ].filter(interest => interest && typeof interest === 'string').map(interest => interest.toLowerCase());

    // Score events based on user interests (exclude events the user already joined)
    const recommendations = events
      .filter(event => !joinedEvents.includes(event.id))
      .map(event => {
        let score = 0;
        const eventInterests = (event.interests || []).filter(i => i && typeof i === 'string').map(i => i.toLowerCase());
        const eventCategory = (event.category || '').toLowerCase();
        
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
      duration: "2",
      description: "",
      maxCapacity: 10,
      fee: "Free",
      photos: [],
      ageRange: [18, 65],
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

  const sendActionMessage = (content: string, actions: { label: string; value: string; style?: 'primary' | 'secondary' }[]) => {
    const msg: AIMessage = {
      id: `ai-${Date.now()}`,
      content,
      isBot: true,
      timestamp: new Date(),
      type: 'text',
      actions
    };
    setMessages(prev => [...prev, msg]);
  };

  const sendDateTimePrompt = (content: string) => {
    const id = `ai-${Date.now()}`;
    const msg: AIMessage = {
      id,
      content,
      isBot: true,
      timestamp: new Date(),
      type: 'text',
      control: 'datetime'
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

    // Normalize generic continue/skip tokens for UI controls
    if ((createStep === 'ageRange' || createStep === 'photos') && (raw === 'continue' || raw === 'skip')) {
      // proceed; values already set in UI handlers or defaults
      if (createStep === 'ageRange') {
          setCreateStep('photos');
          const upId = `ai-${Date.now()}`;
          const photoMsg: AIMessage = { id: upId, content: "Add event photos (optional).", isBot: true, timestamp: new Date(), type: 'text', control: 'upload' };
          setMessages(prev => [...prev, photoMsg]);
        return;
      }
      if (createStep === 'photos') {
        // Skip premium, go directly to confirm
        setCreateStep('confirm');
        const updated = draft;
        const summary = `Here's your Trybe:\n• Name: ${updated.eventName}\n• Location: ${updated.location}\n• When: ${new Date(updated.time).toLocaleString()}\n• Duration: ${updated.duration} hr(s)\n• Capacity: ${updated.maxCapacity}\n• Fee: ${updated.fee}${updated.description ? `\n• About: ${updated.description}` : ''}${updated.ageRange ? `\n• Age: ${updated.ageRange[0]}-${updated.ageRange[1]}` : ''}${updated.photos?.length ? `\n• Photos: ${updated.photos.length}` : ''}`;
        sendActionMessage(summary + "\n\nReady to go?", [
          { label: 'Confirm', value: 'confirm', style: 'primary' },
          { label: 'Cancel', value: 'cancel', style: 'secondary' },
        ]);
        return;
      }
    }

    switch (createStep) {
      case 'eventName': {
        const val = raw.trim();
        if (!val) {
          ask("Please provide a name for your Trybe.");
          break;
        }
        setDraft({ ...draft, eventName: val });
        setCreateStep('location');
        const mapId = `ai-${Date.now()}`;
        const mapMsg: AIMessage = { 
          id: mapId, 
          content: "Great! Where will it take place? Use the map to search for a location or use your current location.", 
          isBot: true, 
          timestamp: new Date(), 
          type: 'text', 
          control: 'map' 
        };
        setMessages(prev => [...prev, mapMsg]);
        break;
      }
      case 'location': {
        // Location is set via MapPicker callback, not text input
        // User input here means they clicked Continue after selecting location
        if (!draft.location) {
          ask("Please select a location on the map first.");
          break;
        }
        setCreateStep('time');
        sendDateTimePrompt("When is it happening? Pick a date & time:");
        break;
      }
      case 'time': {
        const normalized = normalizeDateTime(raw);
        if (!normalized) {
          sendDateTimePrompt("I couldn't read that time. Please select a date & time:");
          break;
        }
        setDraft({ ...draft, time: normalized });
        setCreateStep('duration');
        sendActionMessage("How long will it last?", [
          { label: '30 min', value: 'duration:0.5' },
          { label: '1 hr', value: 'duration:1' },
          { label: '1.5 hr', value: 'duration:1.5' },
          { label: '2 hr', value: 'duration:2', style: 'primary' },
          { label: '3 hr', value: 'duration:3' },
          { label: '4 hr', value: 'duration:4' },
          { label: '6 hr', value: 'duration:6' },
          { label: '8 hr', value: 'duration:8' },
          { label: '12 hr', value: 'duration:12' },
          { label: 'All day', value: 'duration:24' },
        ]);
        break;
      }
      case 'duration': {
        const m = raw.match(/^duration:(.*)$/);
        if (!m) {
          sendActionMessage("Please choose a duration.", [
            { label: '30 min', value: 'duration:0.5' },
            { label: '1 hr', value: 'duration:1' },
            { label: '2 hr', value: 'duration:2' },
          ]);
          break;
        }
        const dur = m[1];
        setDraft({ ...draft, duration: dur });
        setCreateStep('description');
        sendActionMessage("Add a short description (optional).", [
          { label: 'Skip', value: 'skip', style: 'secondary' }
        ]);
        break;
      }
      case 'description': {
        const isSkip = raw.trim().toLowerCase() === 'skip';
        const val = isSkip ? '' : raw.trim();
        setDraft({ ...draft, description: val });
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
        setCreateStep('ageRange');
        const id = `ai-${Date.now()}`;
        const msg: AIMessage = { id, content: "Select an age range:", isBot: true, timestamp: new Date(), type: 'text', control: 'age' };
        setAgeInputs(prev => ({ ...prev, [id]: { min: draft.ageRange?.[0] ?? 18, max: draft.ageRange?.[1] ?? 65 } }));
        setMessages(prev => [...prev, msg]);
        break;
      }
      case 'ageRange': {
        // Any input here continues; if skipped, defaults are kept
        setCreateStep('photos');
        const upId = `ai-${Date.now()}`;
        const photoMsg: AIMessage = { id: upId, content: "Add event photos (at least one is required).", isBot: true, timestamp: new Date(), type: 'text', control: 'upload' };
        setMessages(prev => [...prev, photoMsg]);
        break;
      }
  // repeatOption removed — recurrence is no longer supported
      case 'photos': {
        // After adding photos via UI, user clicks Continue
        // Validate that at least one photo is uploaded
        if (!draft.photos || draft.photos.length === 0) {
          ask("Please upload at least one photo for your Trybe.");
          break;
        }
        // Go directly to confirm
        setCreateStep('confirm');
        const updated = draft;
        const summary = `Here's your Trybe:\n• Name: ${updated.eventName}\n• Location: ${updated.location}\n• When: ${new Date(updated.time).toLocaleString()}\n• Duration: ${updated.duration} hr(s)\n• Capacity: ${updated.maxCapacity}\n• Fee: ${updated.fee}${updated.description ? `\n• About: ${updated.description}` : ''}${updated.ageRange ? `\n• Age: ${updated.ageRange[0]}-${updated.ageRange[1]}` : ''}${updated.photos?.length ? `\n• Photos: ${updated.photos.length}` : ''}`;
        sendActionMessage(summary + "\n\nReady to go?", [
          { label: 'Confirm', value: 'confirm', style: 'primary' },
          { label: 'Cancel', value: 'cancel', style: 'secondary' },
        ]);
        break;
      }
      case 'confirm': {
        const v = raw.trim().toLowerCase();
        if (v !== 'confirm') {
          if (v === 'cancel') {
            setCreateStep('idle');
            setDraft(null);
            ask("Canceled. Say 'create a trybe' anytime to start again.");
          } else {
            sendActionMessage("Please choose:", [
              { label: 'Confirm', value: 'confirm', style: 'primary' },
              { label: 'Cancel', value: 'cancel', style: 'secondary' },
            ]);
          }
          break;
        }
        // Prevent duplicate persists when user clicks confirm multiple times
        if (isPersisting) {
          setMessages(prev => [...prev, { id: `ai-${Date.now()}`, content: 'Still saving your Trybe — please wait...', isBot: true, timestamp: new Date(), type: 'notification' }]);
          setIsTyping(false);
          break;
        }

        setIsPersisting(true);

        // Persist the draft to Firestore (upload photos like CreateTrybeModal does) and then add to provider
        (async () => {
          try {
            console.debug('AIBotModal: starting persist flow for draft', draft);
            const user = (window as any).firebaseAuth?.currentUser || null;
            // fallback to auth import if available
            let uid: string | null = null;
            try {
              // eslint-disable-next-line @typescript-eslint/no-var-requires
              const { auth } = await import('../firebase');
              uid = auth.currentUser?.uid || null;
            } catch (e) { uid = user?.uid || null; }

            // Upload photos to Storage if they're data URLs or File objects
            const photosToSave: string[] = [];
            try {
              const { getStorage, ref: storageRef, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');
              const { app } = await import('../firebase');
              const storage = getStorage(app);
              for (let i = 0; i < (draft.photos || []).length; i++) {
                const p = draft.photos[i];
                try {
                  if (typeof p !== 'string') {
                    // treat non-string entries as File/Blob-like
                    const fname = (p as any)?.name || `upload-${i}`;
                    const path = `trybePhotos/${uid || 'anon'}/${Date.now()}-${i}-${fname}`;
                    const ref = storageRef(storage, path);
                    const task = uploadBytesResumable(ref, p as any);
                    await new Promise<void>((resolve, reject) => {
                      task.on('state_changed', () => {}, (err) => reject(err), () => resolve());
                    });
                    const url = await getDownloadURL(ref);
                    photosToSave.push(url);
                  } else if (typeof p === 'string') {
                    if (p.startsWith('data:')) {
                      const resp = await fetch(p);
                      const blob = await resp.blob();
                      const path = `trybePhotos/${uid || 'anon'}/${Date.now()}-${i}-inline.jpg`;
                      const ref = storageRef(storage, path);
                      const task = uploadBytesResumable(ref, blob);
                      await new Promise<void>((resolve, reject) => {
                        task.on('state_changed', () => {}, (err) => reject(err), () => resolve());
                      });
                      const url = await getDownloadURL(ref);
                      photosToSave.push(url);
                    } else {
                      photosToSave.push(p);
                    }
                  }
                } catch (err) {
                  console.debug('AIBotModal: photo upload failed, keeping original', err);
                  if (typeof p === 'string') photosToSave.push(p);
                }
              }
            } catch (err) {
              console.debug('AIBotModal: storage upload helper failed', err);
              // fallback: keep original photo values
              (draft.photos || []).forEach((p) => { if (typeof p === 'string') photosToSave.push(p); });
            }

            console.debug('AIBotModal: photos prepared', photosToSave);

            // Build trybe payload
            const trybeDataToSave: any = {
              ...draft,
              photos: photosToSave,
              attendees: 1,
              attendeeIds: uid ? [uid] : [],
              createdBy: uid || null,
              createdAt: new Date().toISOString(),
            };

            // Try to read current user's profile for name/image
            try {
              if (uid) {
                const { getDoc, doc: firestoreDoc } = await import('firebase/firestore');
                const { db } = await import('../firebase');
                const ud = await getDoc(firestoreDoc(db, 'users', uid));
                if (ud.exists()) {
                  const udata: any = ud.data();
                  const createdByName = udata.displayName || udata.firstName || udata.name;
                  const createdByImage = udata.photoURL || udata.avatar || (Array.isArray(udata.photos) && udata.photos.length > 0 ? udata.photos[0] : null);
                  
                  // Only set these fields if they have actual values (not undefined)
                  if (createdByName) trybeDataToSave.createdByName = createdByName;
                  if (createdByImage) trybeDataToSave.createdByImage = createdByImage;
                }
              }
            } catch (err) { /* ignore */ }

            // Filter out any remaining data: URIs or extremely large strings so we don't send huge base64 payloads
            trybeDataToSave.photos = (photosToSave || []).filter(p => {
              try {
                if (!p) return false;
                if (typeof p !== 'string') return false;
                if (p.startsWith('data:')) return false; // strip inline base64
                if (p.length > 200000) return false; // strip very large strings (200k chars)
                return true;
              } catch (e) { return false; }
            });

            // Use the same createTrybeWithMessage function as CreateTrybeModal for consistency
            try {
              console.debug('AIBotModal: creating trybe with standardized createTrybeWithMessage', trybeDataToSave);
              
              const welcomeMessage = `Welcome to ${trybeDataToSave.eventName || (trybeDataToSave as any).name || 'this trybe'}!`;
              const newId = await createTrybeWithMessage({
                trybeId: null,
                trybeData: trybeDataToSave,
                initialMessageText: welcomeMessage
              });

              console.debug('AIBotModal: trybe created successfully with ID:', newId);

              // Add to provider so UI updates immediately
              try { addEvent({ ...trybeDataToSave, id: newId }); } catch (e) {
                console.debug('AIBotModal: failed to add to provider', e);
              }

              setCreateStep('idle');
              setDraft(null);
              setIsPersisting(false);
              
              const createdMsg: AIMessage = {
                id: `ai-${Date.now()}`,
                content: "Your Trybe is live! 🎉 Tap to view details.",
                isBot: true,
                timestamp: new Date(),
                recommendations: [newId],
                type: 'recommendations'
              };
              setMessages(prev => [...prev, createdMsg]);
            } catch (err) {
              console.error('AIBotModal: failed to persist trybe', err);
              setCreateStep('idle');
              setDraft(null);
              setIsPersisting(false);
              setMessages(prev => [...prev, { id: `ai-${Date.now()}`, content: 'Failed to save Trybe to server. It was kept locally.', isBot: true, timestamp: new Date(), type: 'notification' }]);
            }
          } catch (err) {
            console.error('AIBotModal: unexpected error in confirm flow', err);
            setCreateStep('idle');
            setDraft(null);
            setIsPersisting(false);
            setMessages(prev => [...prev, { id: `ai-${Date.now()}`, content: 'Failed to save Trybe to server. It was kept locally.', isBot: true, timestamp: new Date(), type: 'notification' }]);
          }
        })();

        // Duplicate created message removed: the async persist flow will post the success message when complete.
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
    const userText = input;
    setInput("");
    setIsTyping(true);

    if (createStep !== 'idle') {
      await handleCreateFlowInput(userText);
      return;
    }

    if (detectCreateIntent(userText)) {
      startCreateFlow();
      setIsTyping(false);
      return;
    }

    setTimeout(() => {
      const response = generateAIResponse(userText);
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const generateAIResponse = (userInput: string): AIMessage => {
    const input = userInput.toLowerCase();
    const userInterests = [
      ...(userProfile.thingsYouDoGreat || []),
      ...(userProfile.thingsYouWantToTry || [])
    ].filter(interest => interest && typeof interest === 'string').map(interest => interest.toLowerCase());

    // Weekend recommendations
    if (input.includes('weekend') || input.includes('saturday') || input.includes('sunday')) {
      const weekendEvents = events
        .filter(event => !joinedEvents.includes(event.id))
        .filter(event => {
          // Check both date and time fields for weekend indicators
          const dateStr = (event.date || event.time || '').toLowerCase();
          
          // Check for full date format (e.g., "Sun, Nov 30, 4:54 PM")
          if (dateStr.includes('sat') || dateStr.includes('sun')) {
            return true;
          }
          
          // Try to parse as a full date
          const eventDate = event.time || event.date;
          if (!eventDate) return false;
          
          try {
            const date = new Date(eventDate);
            if (!isNaN(date.getTime())) {
              const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
              return dayOfWeek === 0 || dayOfWeek === 6;
            }
          } catch (e) {
            // Ignore parse errors
          }
          
          return false;
        })
        .slice(0, 5);
      
      if (weekendEvents.length === 0) {
        return {
          id: `ai-${Date.now()}`,
          content: "I couldn't find any events scheduled for this weekend yet. Check back later or create your own weekend Trybe! 🎉",
          isBot: true,
          timestamp: new Date(),
          type: 'text'
        };
      }

      return {
        id: `ai-${Date.now()}`,
        content: `Perfect! I found ${weekendEvents.length} amazing weekend activit${weekendEvents.length !== 1 ? 'ies' : 'y'} for you! 🌟`,
        isBot: true,
        timestamp: new Date(),
        recommendations: weekendEvents.map(e => e.id),
        type: 'recommendations'
      };
    }

    // Creative activities - with location filtering if "near me" is mentioned
    if (input.includes('creative') || input.includes('art') || input.includes('design')) {
      const isNearMeQuery = input.includes('near me') || input.includes('nearby') || input.includes('around me');
      
      // Helper function to calculate distance in km
      const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const toRad = (v: number) => (v * Math.PI) / 180;
        const R = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + 
                  Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };
      
      // If "near me" is mentioned, request location and filter
      if (isNearMeQuery) {
        if (!navigator.geolocation) {
          // Browser doesn't support geolocation
          const creativeEvents = events.filter(isCreativeEvent).slice(0, 3);
          
          return {
            id: `ai-${Date.now()}`,
            content: "Your browser doesn't support location services. Here are some creative events you might like! 🎨",
            isBot: true,
            timestamp: new Date(),
            recommendations: creativeEvents.map(e => e.id),
            type: 'recommendations'
          };
        }

        // Request location asynchronously
        console.log('Requesting geolocation for creative activities...');
        console.log('Total events available:', events.length);
        
        // Log all creative events with their coordinates
        const allCreativeEvents = events.filter(isCreativeEvent);
        console.log('Total creative events:', allCreativeEvents.length);
        allCreativeEvents.forEach(event => {
          const eventData = event as any;
          console.log(`Event: ${event.eventName || event.name}`, {
            hasCoords: !!eventData.locationCoords,
            coords: eventData.locationCoords
          });
        });
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            console.log(`User location: ${userLat}, ${userLng}`);
            
            // First try to filter creative events within 10km
            let creativeEvents = events.filter(event => {
              if (!isCreativeEvent(event)) return false;
              
              // Check distance if event has coordinates
              const eventData = event as any;
              if (eventData.locationCoords && eventData.locationCoords.lat && eventData.locationCoords.lng) {
                const distance = haversineKm(userLat, userLng, eventData.locationCoords.lat, eventData.locationCoords.lng);
                console.log(`Event ${event.eventName || event.name}: ${distance.toFixed(2)}km away`);
                return distance <= 10;
              } else {
                console.log(`Event ${event.eventName || event.name}: NO COORDINATES`);
              }
              
              return false;
            }).slice(0, 3);
            
            console.log(`Found ${creativeEvents.length} creative events within 10km`);
            
            // If no events with coordinates found, show all creative events
            if (creativeEvents.length === 0) {
              creativeEvents = events.filter(isCreativeEvent).slice(0, 3);
              console.log(`Fallback: showing ${creativeEvents.length} creative events without distance filter`);
            }
            
            // Add the response message after getting location
            const locationResponse: AIMessage = creativeEvents.length === 0
              ? {
                  id: `ai-${Date.now()}`,
                  content: "I couldn't find any creative activities. Try browsing all events or check out other categories! 🎨",
                  isBot: true,
                  timestamp: new Date(),
                  type: 'text'
                }
              : {
                  id: `ai-${Date.now()}`,
                  content: `I found ${creativeEvents.length} creative ${creativeEvents.length === 1 ? 'activity' : 'activities'} for you! 🎨`,
                  isBot: true,
                  timestamp: new Date(),
                  recommendations: creativeEvents.map(e => e.id),
                  type: 'recommendations'
                };
            
            console.log('Setting location response message:', locationResponse);
            setMessages(prev => {
              console.log('Previous messages:', prev.length);
              const newMessages = [...prev, locationResponse];
              console.log('New messages:', newMessages.length);
              return newMessages;
            });
            
            // Force scroll to bottom after a short delay
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
          },
          (error) => {
            console.error('Geolocation error:', error.code, error.message);
            // Fallback to all creative events if location fails
            const creativeEvents = events.filter(isCreativeEvent).slice(0, 3);
            
            const fallbackResponse: AIMessage = {
              id: `ai-${Date.now()}`,
              content: error.code === 1 
                ? "Location access was denied. Here are some creative events you might like! 🎨 (Allow location in your browser settings for nearby results)"
                : "I couldn't access your location. Here are some creative events you might like! 🎨",
              isBot: true,
              timestamp: new Date(),
              recommendations: creativeEvents.map(e => e.id),
              type: 'recommendations'
            };
            
            setMessages(prev => [...prev, fallbackResponse]);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
        
        // Return immediate "requesting location" message
        return {
          id: `ai-${Date.now()}`,
          content: "Let me find creative activities near you... 📍",
          isBot: true,
          timestamp: new Date(),
          type: 'text'
        };
      }
      
      // Regular creative events (no location filter)
      const creativeEvents = events.filter(isCreativeEvent).slice(0, 3);
      
      return {
        id: `ai-${Date.now()}`,
        content: "I love your creative energy! Here are some artistic events that will inspire you! 🎨",
        isBot: true,
        timestamp: new Date(),
        recommendations: creativeEvents.map(e => e.id),
        type: 'recommendations'
      };
    }

    // Trending/popular - events that are ~70% full (almost at capacity)
    if (input.includes('trending') || input.includes('popular') || input.includes('hot')) {
      // First try to find events that are 60-90% full (ideal trending range)
      let trendingEvents = events
        .filter(event => {
          const attendees = event.attendees || 0;
          const maxCapacity = event.maxCapacity || 100;
          const capacityPercentage = (attendees / maxCapacity) * 100;
          return capacityPercentage >= 60 && capacityPercentage < 90;
        })
        .sort((a, b) => {
          const aCapacity = ((a.attendees || 0) / (a.maxCapacity || 100)) * 100;
          const bCapacity = ((b.attendees || 0) / (b.maxCapacity || 100)) * 100;
          return bCapacity - aCapacity;
        })
        .slice(0, 3);
      
      // If no events in the ideal range, fallback to showing events with at least 40% capacity
      if (trendingEvents.length === 0) {
        console.log('No events in 60-90% range, showing events with 40%+ capacity');
        trendingEvents = events
          .filter(event => {
            const attendees = event.attendees || 0;
            const maxCapacity = event.maxCapacity || 100;
            const capacityPercentage = (attendees / maxCapacity) * 100;
            return capacityPercentage >= 40;
          })
          .sort((a, b) => {
            const aCapacity = ((a.attendees || 0) / (a.maxCapacity || 100)) * 100;
            const bCapacity = ((b.attendees || 0) / (b.maxCapacity || 100)) * 100;
            return bCapacity - aCapacity;
          })
          .slice(0, 3);
      }
      
      if (trendingEvents.length === 0) {
        return {
          id: `ai-${Date.now()}`,
          content: "No events are at full capacity yet, but they're all trending! Be the first to join! Check out all available events or try asking about specific categories! 🎯",
          isBot: true,
          timestamp: new Date(),
          type: 'text'
        };
      }
      
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
      // Check if user has interests in profile
      if (userInterests.length === 0) {
        return {
          id: `ai-${Date.now()}`,
          content: "I'd love to recommend events based on your interests! But it looks like you haven't set up your interests in your profile yet. Go to Settings → Edit Profile to add your interests, and I'll find perfect matches for you! 💫",
          isBot: true,
          timestamp: new Date(),
          type: 'text'
        };
      }

      // Filter events that match user interests
      const recommendations = events
        .filter(event => !joinedEvents.includes(event.id)) // Exclude already joined events
        .filter(event => {
          const eventInterests = (event.interests || []).filter(i => i && typeof i === 'string').map(i => i.toLowerCase());
          const eventCategory = (event.category || '').toLowerCase();
          
          return userInterests.some(userInterest => 
            eventInterests.some(ei => ei.includes(userInterest) || userInterest.includes(ei)) ||
            eventCategory.includes(userInterest) || userInterest.includes(eventCategory)
          );
        })
        .slice(0, 5);

      // If no matching events found, show general popular events instead
      if (recommendations.length === 0) {
        const fallbackEvents = events
          .filter(event => !joinedEvents.includes(event.id))
          .slice(0, 5);

        if (fallbackEvents.length === 0) {
          return {
            id: `ai-${Date.now()}`,
            content: "I couldn't find any events matching your interests right now. Check back later for new events, or try creating your own Trybe! 🎯",
            isBot: true,
            timestamp: new Date(),
            type: 'text'
          };
        }

        return {
          id: `ai-${Date.now()}`,
          content: `I couldn't find events exactly matching your interests (${userInterests.slice(0, 2).join(', ')}), but here are some popular events you might enjoy! 🌟`,
          isBot: true,
          timestamp: new Date(),
          recommendations: fallbackEvents.map(e => e.id),
          type: 'recommendations'
        };
      }

      return {
        id: `ai-${Date.now()}`,
        content: `Perfect! I've found ${recommendations.length} event${recommendations.length !== 1 ? 's' : ''} matching your interests in ${userInterests.slice(0, 3).join(', ')}! ✨`,
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

  const getRecommendedEvents = (eventIds: Array<string | number> = []) => {
    const idSet = new Set(eventIds.map(String));
    return events.filter(event => idSet.has(String(event.id)));
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
  <div className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' as any }}>
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
                        <Card key={String(event.id)} className="border border-border/50 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => onEventClick(Number(event.id))}>
                          <CardContent className="p-3">
                            <div className="flex items-start space-x-3">
                              <img
                                src={event.image}
                                alt={event.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm truncate">{event.eventName || event.name}</h4>
                                <div className="flex flex-col space-y-1 text-xs text-muted-foreground mt-1">
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3 flex-shrink-0" />
                                    <span>{event.date}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate line-clamp-1">{event.location}</span>
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

                {message.control === 'map' && (
                  <div className="mt-3 space-y-2">
                    <Button 
                      size="sm" 
                      className="rounded-full w-full" 
                      onClick={() => setShowMapPicker(true)}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      {draft?.location ? 'Change Location' : 'Choose Location'}
                    </Button>
                    {draft?.location && (
                      <div className="text-sm text-muted-foreground p-2 bg-muted rounded-lg">
                        📍 {draft.location}
                      </div>
                    )}
                    {draft?.location && (
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" className="rounded-full" onClick={() => {
                          setIsTyping(true);
                          handleCreateFlowInput('continue');
                        }}>Continue</Button>
                      </div>
                    )}
                  </div>
                )}

                {message.control === 'datetime' && (
                  <div className="mt-3 flex items-center space-x-2">
                    <Input
                      type="datetime-local"
                      value={dateInputs[message.id] || ''}
                      onChange={(e) => setDateInputs(prev => ({ ...prev, [message.id]: e.target.value }))}
                      className="rounded-full flex-1"
                    />
                    <Button size="sm" className="rounded-full" onClick={() => {
                      const v = dateInputs[message.id];
                      if (v) {
                        setIsTyping(true);
                        handleCreateFlowInput(v);
                      }
                    }}>Set</Button>
                  </div>
                )}

                {message.control === 'age' && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Min: {ageInputs[message.id]?.min ?? 18}</span>
                      <span>Max: {ageInputs[message.id]?.max ?? 65}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="range"
                        min={16}
                        max={80}
                        value={ageInputs[message.id]?.min ?? 18}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          setAgeInputs(prev => ({ ...prev, [message.id]: { min: v, max: prev[message.id]?.max ?? 65 } }));
                          setDraft(d => d ? { ...d, ageRange: [v, d.ageRange?.[1] ?? 65] as [number, number] } : d);
                        }}
                        className="flex-1"
                      />
                      <Input
                        type="range"
                        min={16}
                        max={80}
                        value={ageInputs[message.id]?.max ?? 65}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          setAgeInputs(prev => ({ ...prev, [message.id]: { min: prev[message.id]?.min ?? 18, max: v } }));
                          setDraft(d => d ? { ...d, ageRange: [d.ageRange?.[0] ?? 18, v] as [number, number] } : d);
                        }}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" className="rounded-full" onClick={() => {
                        setIsTyping(true);
                        handleCreateFlowInput('skip');
                      }}>Skip</Button>
                      <Button size="sm" className="rounded-full" onClick={() => {
                        setIsTyping(true);
                        handleCreateFlowInput('continue');
                      }}>Continue</Button>
                    </div>
                  </div>
                )}

                {message.control === 'upload' && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      id={`upload-${message.id}`}
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        files.forEach((file) => {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const url = ev.target?.result as string;
                            setDraft(d => d ? { ...d, photos: [...(d.photos || []), url] } : d);
                          };
                          reader.readAsDataURL(file);
                        });
                        (e.target as HTMLInputElement).value = '';
                      }}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" className="rounded-full" onClick={() => document.getElementById(`upload-${message.id}`)?.click()}>
                        Upload Photos <span className="text-destructive ml-1">*</span>
                      </Button>
                      {draft?.photos && draft.photos.length > 0 && (
                        <Button size="sm" className="rounded-full" onClick={() => { setIsTyping(true); handleCreateFlowInput('continue'); }}>
                          Continue ({draft.photos.length} photo{draft.photos.length !== 1 ? 's' : ''})
                        </Button>
                      )}
                    </div>
                    {draft?.photos && draft.photos.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {draft.photos.map((p, i) => (
                          <img key={i} src={p} alt={`p-${i}`} className="w-20 h-20 object-cover rounded-md" />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {message.actions && message.actions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.actions.map((a, idx) => (
                      <Button
                        key={idx}
                        size="sm"
                        variant={a.style === 'primary' ? 'default' : 'outline'}
                        className="rounded-full"
                        onClick={() => {
                          setIsTyping(true);
                          handleCreateFlowInput(a.value);
                        }}
                      >
                        {a.label}
                      </Button>
                    ))}
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

        {/* Suggestions - Show after each bot response */}
        {!isTyping && messages.length > 0 && messages[messages.length - 1]?.isBot && (
          <div className="px-4 pb-2">
            <div className="text-xs text-muted-foreground mb-2">Quick suggestions:</div>
            <div className="flex flex-wrap gap-2">
              {AI_PERSONALITY.suggestions.map((suggestion, index) => {
                const isCreate = /create\s+a?\s*trybe/i.test(suggestion);
                return (
                  <Button
                    key={index}
                    variant={isCreate ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={cn("text-xs rounded-full", isCreate && "bg-primary text-primary-foreground")}
                  >
                    {suggestion}
                  </Button>
                );
              })}
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

      {/* MapPicker Modal */}
      {showMapPicker && (
        <div
          className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm"
          onClick={() => setShowMapPicker(false)}
        >
          <div
            className="fixed inset-4 z-[61] bg-background border border-border rounded-lg shadow-lg flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-lg">Choose Location</h3>
              <Button size="sm" variant="outline" onClick={() => setShowMapPicker(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <MapPicker 
                onSelect={handleLocationSelect}
                initial={draft?.locationCoords}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
