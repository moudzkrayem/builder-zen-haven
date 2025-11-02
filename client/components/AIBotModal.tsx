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
  recommendations?: Array<string | number>;
  type: 'text' | 'recommendations' | 'notification';
  actions?: { label: string; value: string; style?: 'primary' | 'secondary' }[];
  control?: 'datetime' | 'age' | 'upload';
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
  duration: string;
  description: string;
  maxCapacity: number;
  fee: string;
  photos: string[];
  ageRange: [number, number];
  repeatOption: string;
  isPremium: boolean;
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
  | 'repeatOption'
  | 'photos'
  | 'isPremium'
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
  const [isPersisting, setIsPersisting] = useState(false);

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

    // Score events based on user interests (exclude events the user already joined)
    const recommendations = events
      .filter(event => !joinedEvents.includes(event.id))
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
      duration: "2",
      description: "",
      maxCapacity: 10,
      fee: "Free",
      photos: [],
      ageRange: [18, 65],
      repeatOption: "none",
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
        setCreateStep('repeatOption');
        sendActionMessage("Repeat this Trybe?", [
          { label: 'One-time', value: 'repeat:none', style: 'primary' },
          { label: 'Daily', value: 'repeat:daily' },
          { label: 'Weekly', value: 'repeat:weekly' },
          { label: 'Monthly', value: 'repeat:monthly' },
        ]);
        return;
      }
      if (createStep === 'photos') {
        setCreateStep('isPremium');
        sendActionMessage("Make it Premium?", [
          { label: 'Yes', value: 'yes', style: 'primary' },
          { label: 'No', value: 'no', style: 'secondary' },
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
        setCreateStep('repeatOption');
        sendActionMessage("Repeat this Trybe?", [
          { label: 'One-time', value: 'repeat:none', style: 'primary' },
          { label: 'Daily', value: 'repeat:daily' },
          { label: 'Weekly', value: 'repeat:weekly' },
          { label: 'Monthly', value: 'repeat:monthly' },
        ]);
        break;
      }
      case 'repeatOption': {
        const m = raw.match(/^repeat:(none|daily|weekly|monthly)$/);
        if (!m) {
          sendActionMessage("Choose a repeat option:", [
            { label: 'One-time', value: 'repeat:none', style: 'primary' },
            { label: 'Daily', value: 'repeat:daily' },
            { label: 'Weekly', value: 'repeat:weekly' },
            { label: 'Monthly', value: 'repeat:monthly' },
          ]);
          break;
        }
        setDraft({ ...draft, repeatOption: m[1] });
        setCreateStep('photos');
        const upId = `ai-${Date.now()}`;
        const photoMsg: AIMessage = { id: upId, content: "Add event photos (optional).", isBot: true, timestamp: new Date(), type: 'text', control: 'upload' };
        setMessages(prev => [...prev, photoMsg]);
        break;
      }
      case 'photos': {
        // After adding photos via UI, user clicks Continue or Skip
        setCreateStep('isPremium');
        sendActionMessage("Make it Premium?", [
          { label: 'Yes', value: 'yes', style: 'primary' },
          { label: 'No', value: 'no', style: 'secondary' },
        ]);
        break;
      }
      case 'isPremium': {
        const t = raw.trim().toLowerCase();
        const premium = /^(y|yes|premium|true)$/i.test(t) ? true : /^(n|no|false)$/i.test(t) ? false : false;
        const updated = { ...draft, isPremium: premium };
        setDraft(updated);
        setCreateStep('confirm');
        const summary = `Here's your Trybe:\n• Name: ${updated.eventName}\n• Location: ${updated.location}\n• When: ${new Date(updated.time).toLocaleString()}\n• Duration: ${updated.duration} hr(s)\n• Capacity: ${updated.maxCapacity}\n• Fee: ${updated.fee}\n• Premium: ${updated.isPremium ? 'Yes' : 'No'}\n• Repeat: ${updated.repeatOption || 'none'}${updated.description ? `\n• About: ${updated.description}` : ''}${updated.ageRange ? `\n• Age: ${updated.ageRange[0]}-${updated.ageRange[1]}` : ''}${updated.photos?.length ? `\n• Photos: ${updated.photos.length}` : ''}`;
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
                  if (p instanceof File) {
                    const path = `trybePhotos/${uid || 'anon'}/${Date.now()}-${i}-${p.name}`;
                    const ref = storageRef(storage, path);
                    const task = uploadBytesResumable(ref, p);
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
              createdByName: undefined,
              createdByImage: undefined,
            };

            // Try to read current user's profile for name/image
            try {
              if (uid) {
                const { getDoc, doc: firestoreDoc } = await import('firebase/firestore');
                const { db } = await import('../firebase');
                const ud = await getDoc(firestoreDoc(db, 'users', uid));
                if (ud.exists()) {
                  const udata: any = ud.data();
                  trybeDataToSave.createdByName = udata.displayName || udata.firstName || udata.name || undefined;
                  trybeDataToSave.createdByImage = udata.photoURL || udata.avatar || undefined;
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

            // Sanitize similar to CreateTrybeModal
            const sanitizeForFirestore = (obj: any): any => {
              if (obj === null) return null;
              if (['string','number','boolean'].includes(typeof obj)) return obj;
              if (Array.isArray(obj)) return obj.map(sanitizeForFirestore).filter(v => typeof v !== 'undefined');
              if (typeof obj === 'object') {
                try { if (obj && typeof obj.toMillis === 'function') return obj; } catch(e){}
                const out: any = {};
                for (const k of Object.keys(obj)) {
                  const v = obj[k];
                  if (typeof v === 'function') continue;
                  if (v instanceof File || (typeof Blob !== 'undefined' && v instanceof Blob)) continue;
                  const sv = sanitizeForFirestore(v);
                  if (typeof sv !== 'undefined') out[k] = sv;
                }
                return out;
              }
              return undefined;
            };

            const sanitized = sanitizeForFirestore(trybeDataToSave);

            // Log approximate payload size to help diagnose 400 Bad Request
            try {
              const payloadStr = JSON.stringify(sanitized);
              console.debug('AIBotModal: sanitized payload byte length ~', payloadStr.length);
              if (payloadStr.length > 900000) {
                console.warn('AIBotModal: sanitized payload is large (>900KB) and may trigger Firestore 400 Bad Request');
              }
            } catch (e) {
              console.debug('AIBotModal: could not stringify sanitized payload for size check', e);
            }

            // Persist to Firestore using two-step write to avoid sending large fields (photos) in the first request
            try {
              console.debug('AIBotModal: writing trybe to Firestore (sanitized, photos omitted):', sanitized);
              const { addDoc, collection, serverTimestamp, updateDoc, doc: firestoreDoc, getDoc, setDoc } = await import('firebase/firestore');
              const { db } = await import('../firebase');
              // Prepare initial payload without photos to minimize size
              const initialPayload: any = { ...sanitized };
              const photosForLater = Array.isArray(initialPayload.photos) ? initialPayload.photos : [];
              delete initialPayload.photos;

              // Compute deterministic id for idempotency based on payload (so repeated confirms don't create duplicates)
              const stableHash = async (obj: any) => {
                try {
                  const s = JSON.stringify(obj || {});
                  const enc = new TextEncoder();
                  const data = enc.encode(s);
                  const hashBuf = await (crypto.subtle ? crypto.subtle.digest('SHA-256', data) : Promise.reject('no-subtle-crypto'));
                  const hashArray = Array.from(new Uint8Array(hashBuf as ArrayBuffer));
                  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                  return hex.slice(0, 20); // shortened
                } catch (e) {
                  // fallback to timestamp-based id (less ideal for idempotency)
                  return String(Date.now());
                }
              };

              const idKey = `ai-${await stableHash(initialPayload)}`;
              const docRefPath = firestoreDoc(db, 'trybes', idKey);
              // If doc already exists with this deterministic id, treat it as the same trybe
              let docExisted = false;
              try {
                const { getDoc } = await import('firebase/firestore');
                const existing = await getDoc(docRefPath as any);
                if (existing && existing.exists()) {
                  docExisted = true;
                  console.debug('AIBotModal: trybe already exists, id=', idKey);
                }
              } catch (e) {
                console.debug('AIBotModal: getDoc check failed', e);
              }

              if (!docExisted) {
                // Create the doc with deterministic id
                await setDoc(docRefPath as any, { ...initialPayload, createdAt: serverTimestamp() } as any);
                console.debug('AIBotModal: trybe initial doc written, id=', idKey);
                try { await updateDoc(firestoreDoc(db, 'trybes', idKey), { id: idKey }); } catch (e) { console.debug('AIBotModal: failed to set id field', e); }
              } else {
                console.debug('AIBotModal: skipping create because doc already exists:', idKey);
              }
              const docRef = { id: idKey } as any;

              // Attach photos even if doc already existed
              if (photosForLater && photosForLater.length) {
                try {
                  console.debug('AIBotModal: attaching photos to trybe (existing or new)', docRef.id, photosForLater.length);
                  await updateDoc(firestoreDoc(db, 'trybes', docRef.id), { photos: photosForLater } as any);
                } catch (photoAttachErr) {
                  console.debug('AIBotModal: failed to attach photos to trybe doc', photoAttachErr);
                }
              }

              // Now upload/attach photos (if any) by updating the doc; this keeps the first write small
              if (photosForLater && photosForLater.length) {
                try {
                  console.debug('AIBotModal: attaching photos to trybe', docRef.id, photosForLater.length);
                  await updateDoc(firestoreDoc(db, 'trybes', docRef.id), { photos: photosForLater } as any);
                } catch (photoAttachErr) {
                  console.debug('AIBotModal: failed to attach photos to trybe doc', photoAttachErr);
                }
              }

              // Ensure chat doc exists
              try {
                const { setDoc, doc: firestoreDoc } = await import('firebase/firestore');
                const chatRef = firestoreDoc(db, 'chats', `trybe-${docRef.id}`) as any;
                await setDoc(chatRef, {
                  eventId: docRef.id,
                  eventName: trybeDataToSave.eventName || '',
                  eventImage: (photosToSave && photosToSave.length) ? photosToSave[0] : undefined,
                  createdAt: serverTimestamp(),
                  createdBy: uid || null,
                }, { merge: true });
              } catch (err) {
                console.debug('AIBotModal: failed to create chat doc', err);
              }

              // Update user's joinedEvents
              try {
                if (uid) {
                  const { updateDoc, arrayUnion, doc: firestoreDoc } = await import('firebase/firestore');
                  const { db } = await import('../firebase');
                  await updateDoc(firestoreDoc(db, 'users', uid), { joinedEvents: arrayUnion(docRef.id) } as any);
                }
              } catch (err) {
                // Best-effort; ignore
              }

              // Add to provider so UI updates immediately
              try { addEvent({ ...trybeDataToSave, id: docRef.id }); } catch (e) {}

              setCreateStep('idle');
              setDraft(null);
              console.debug('AIBotModal: finished persist flow for trybe', docRef.id);
              const createdMsg: AIMessage = {
                id: `ai-${Date.now()}`,
                content: "Your Trybe is live! 🎉 Tap to view details.",
                isBot: true,
                timestamp: new Date(),
                recommendations: [docRef.id],
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
                        <Card key={String(event.id)} className="border border-border/50 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => onEventClick(Number(event.id))}>
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
                      <Button size="sm" variant="outline" className="rounded-full" onClick={() => document.getElementById(`upload-${message.id}`)?.click()}>Upload Photos</Button>
                      <Button size="sm" variant="outline" className="rounded-full" onClick={() => { setIsTyping(true); handleCreateFlowInput('skip'); }}>Skip</Button>
                      <Button size="sm" className="rounded-full" onClick={() => { setIsTyping(true); handleCreateFlowInput('continue'); }}>Continue</Button>
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

        {/* Suggestions */}
        {messages.length <= 2 && (
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
    </div>
  );
}
