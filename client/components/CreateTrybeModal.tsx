import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { collection, addDoc, serverTimestamp, updateDoc, doc as firestoreDoc, setDoc, arrayUnion, getDoc, runTransaction } from "firebase/firestore";
import { db, app } from "../firebase"; // ✅ make sure you export db and app in firebase.ts
import { auth } from "../firebase"; // to get current user
import { createTrybeWithMessage } from '@/lib/createTrybeWithMessage';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {
  X,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Camera,
  Upload,
  Crown,
  Star,
  Zap,
  Clock,
} from "lucide-react";
import { CATEGORIES } from '@/config/categories';
import { PREMIUM_ENABLED } from '@/lib/featureFlags';
import MapPicker from './MapPicker';

interface CreateTrybeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTrybe: (trybeData: TrybeData) => void;
}

interface TrybeData {
  eventName: string;
  location: string;
  locationCoords?: { lat: number; lng: number } | null;
  placeId?: string | null;
  formattedAddress?: string | null;
  time: string;
  duration: string;
  description: string;
  maxCapacity: number | string;
  fee: string;
  photos: Array<string | File>;
  ageRange: [number, number];
  isPremium: boolean;
  category: string;
}

export default function CreateTrybeModal({
  isOpen,
  onClose,
  onCreateTrybe,
}: CreateTrybeModalProps) {
  const [formData, setFormData] = useState<TrybeData>({
    eventName: "",
    location: "",
    locationCoords: null,
    placeId: null,
    formattedAddress: null,
  time: "",
  // start with empty duration so placeholder shows; user picks a value to set
  duration: "",
    description: "",
    maxCapacity: 10,
    fee: "Free",
  photos: [],
    ageRange: [18, 65],
    isPremium: false,
    category: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  // Accessibility refs for the MapPicker modal
  const modalRef = useRef<HTMLDivElement | null>(null);
  const firstFocusableRef = useRef<HTMLDivElement | null>(null);
  const lastFocusableRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Keydown handler to support ESC and Tab-trap when modal open
  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      setShowMapPicker(false);
      return;
    }

    if (e.key === 'Tab') {
      // Simple focus trap: if focus is on last and Tab, move to first. If Shift+Tab on first, move to last.
      const focusable = modalRef.current?.querySelectorAll<HTMLElement>("a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex='-1'])");
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    }
  };

  // Listen for fallback selection events from MapPicker (robustness):
  useEffect(() => {
    const handler = (e: any) => {
      const { lat, lng, formattedAddress, placeId } = e?.detail || {};
      if (typeof lat === 'number' && typeof lng === 'number') {
        console.debug('[CreateTrybeModal] mappicker:select', e.detail);
        setFormData((prev) => ({
          ...prev,
          location: formattedAddress ?? `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          locationCoords: { lat, lng },
          placeId: placeId ?? prev.placeId,
          formattedAddress: formattedAddress ?? prev.formattedAddress,
        }));
      }
    };
    window.addEventListener('mappicker:select', handler as EventListener);
    return () => window.removeEventListener('mappicker:select', handler as EventListener);
  }, []);

  // Manage focus when MapPicker modal opens/closes
  useEffect(() => {
    if (showMapPicker) {
      previousActiveElement.current = document.activeElement as HTMLElement | null;
      // wait a tick for modal to render
      setTimeout(() => {
        // focus the first focusable inside the modal
        const focusable = modalRef.current?.querySelectorAll<HTMLElement>("a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex='-1'])");
        if (focusable && focusable.length) {
          (focusable[0] as HTMLElement).focus();
        } else {
          firstFocusableRef.current?.focus();
        }
      }, 0);
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
    } else {
      // restore focus
      document.body.style.overflow = '';
      setTimeout(() => previousActiveElement.current?.focus(), 0);
    }
  }, [showMapPicker]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    setIsSubmitting(true);
    // Ensure user is logged in
    const user = auth.currentUser;
    if (!user) {
      setIsSubmitting(false);
      alert("You must be logged in to create a Trybe.");
      return;
    }

    // Validate that at least one photo is uploaded
    if (!formData.photos || formData.photos.length === 0) {
      setIsSubmitting(false);
      alert("Please upload at least one photo for your Trybe.");
      return;
    }

    // Upload photos to Firebase Storage first and get download URLs
    const storage = getStorage(app);
    const photosToSave: string[] = [];

    for (let i = 0; i < (formData.photos || []).length; i++) {
      const p = formData.photos[i];
      try {
        if (p instanceof File) {
          // Upload file to Firebase Storage
          const filename = `${Date.now()}-${i}-${p.name.replace(/\s+/g, "_")}`;
          const path = `trybePhotos/${user.uid}/${filename}`;
          const sRef = storageRef(storage, path);

          // Upload the file
          await new Promise<void>((resolve, reject) => {
            const uploadTask = uploadBytesResumable(sRef, p);
            uploadTask.on(
              "state_changed",
              () => {}, // progress callback (optional)
              (err) => reject(err),
              () => resolve(),
            );
          });

          // Get the download URL
          try {
            const url = await getDownloadURL(sRef);
            photosToSave.push(url);
          } catch (err) {
            console.error("Failed to get download URL for photo:", err);
            // Fallback to storage path if URL fetch fails
            photosToSave.push(path);
          }
        } else if (typeof p === 'string') {
          // If already a URL or data URL, keep as-is
          photosToSave.push(p);
        } else {
          photosToSave.push('');
        }
      } catch (err) {
        console.error('Photo upload failed:', err);
        alert(`Failed to upload photo ${i + 1}: ${(err as any)?.message || 'Unknown error'}`);
        setIsSubmitting(false);
        return;
      }
    }

    // Prepare Trybe data (use resolved photo URLs). Coerce maxCapacity to a number.
    // Prefer authoritative profile from localStorage.usersProfile (keeps createdBy fields in sync
    // with the app's profile editing flow which writes to Firestore users/{uid} and localStorage).
    let createdByName: string | undefined = user.displayName || undefined;
    let createdByImage: string | undefined = user.photoURL || undefined;
    try {
      const raw = localStorage.getItem('userProfile');
      if (raw) {
        const p = JSON.parse(raw);
        if (p) {
          if (!createdByName) {
            if (p.displayName) createdByName = p.displayName;
            else if (p.firstName) createdByName = `${p.firstName}${p.lastName ? ' ' + p.lastName : ''}`;
          }
          if (!createdByImage) {
            if (Array.isArray(p.photos) && p.photos.length) createdByImage = p.photos[0];
            else if (p.photoURL) createdByImage = p.photoURL;
          }
        }
      }
    } catch (e) {
      // ignore JSON parse/localStorage failures and fall back to auth values
    }

    const trybeDataToSave = {
      ...formData,
      photos: photosToSave,
      attendees: 1,
      attendeeIds: [user.uid],
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      createdByName,
      createdByImage,
    };

    // Ensure numeric fields are properly typed for Firestore
    trybeDataToSave.maxCapacity = (typeof formData.maxCapacity === 'string' && formData.maxCapacity.trim() === '')
      ? 10
      : Number(formData.maxCapacity) || 10;

    // Sanitize payload to ensure Firestore receives only serializable values (no File/Blob/function)
    const sanitizeForFirestore = (obj: any): any => {
      if (obj === null) return null;
      if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') return obj;
      if (Array.isArray(obj)) return obj.map((v) => sanitizeForFirestore(v)).filter((v) => typeof v !== 'undefined');
      if (typeof obj === 'object') {
        // Preserve sentinel values like serverTimestamp() by checking for object with _MethodName? We'll allow functions named 'serverTimestamp' through by identity check
        // However since serverTimestamp() returns a special FieldValue object, we keep it as-is by checking for toString containing 'serverTimestamp' (best-effort)
        try {
          if (obj && typeof obj.toMillis === 'function') return obj; // Firestore Timestamp
        } catch (e) {}
        const out: any = {};
        for (const k of Object.keys(obj)) {
          const v = obj[k];
          if (typeof v === 'function') continue;
          if (v instanceof File || (typeof Blob !== 'undefined' && v instanceof Blob)) continue;
          if (typeof v === 'object' && v !== null && v._delegate) {
            // Some firestore sentinel objects may have internal delegates; keep them
            out[k] = v;
            continue;
          }
          // Allow serverTimestamp() sentinel (object with '.toProto' or similar) by keeping if it's not plain object
          // Best-effort: if v has a _methodName property or similar, keep it
          if (v && typeof v === 'object' && (v?.hasOwnProperty && (v as any)._methodName)) {
            out[k] = v;
            continue;
          }
          const sv = sanitizeForFirestore(v);
          if (typeof sv !== 'undefined') out[k] = sv;
        }
        return out;
      }
      return undefined;
    };

    const sanitizedTrybe = sanitizeForFirestore(trybeDataToSave);
    console.log('🔍 Photos to save:', photosToSave);
    console.log('🔍 Creating Trybe with sanitized data:', sanitizedTrybe);
    console.log('🔍 Sanitized photos:', sanitizedTrybe.photos);

    // Save in Firestore using an atomic batch (create trybe + initial message)
    let docRef: any = { id: null };
    try {
      const welcome = `Welcome to ${sanitizedTrybe.eventName || (sanitizedTrybe as any).name || 'this trybe'} group chat!`;
      const newId = await createTrybeWithMessage({ trybeId: null, trybeData: sanitizedTrybe, initialMessageText: welcome });
      docRef.id = newId;
      console.log("✅ Trybe created with ID:", docRef.id);
      console.log("✅ Trybe photos array:", sanitizedTrybe.photos);
    } catch (writeErr) {
      console.error('CreateTrybeModal: failed to create trybe with initial message. Sanitized payload:', sanitizedTrybe, writeErr);
      throw writeErr;
    }

    // Build a created trybe object to pass to the parent/provider so UI can update immediately
    const createdTrybe = {
      id: docRef.id,
      ...trybeDataToSave,
      photos: photosToSave,
      createdAt: new Date().toISOString(),
      createdByName: trybeDataToSave.createdByName,
      createdByImage: trybeDataToSave.createdByImage,
    } as any;

    // Call parent's handler if provided so provider can add the trybe locally (helps images show immediately)
    try {
      if (typeof onCreateTrybe === 'function') {
        onCreateTrybe(createdTrybe);
      }
    } catch (err) {
      console.debug('onCreateTrybe handler threw', err);
    }

    // Create an initial system message under trybes/{trybeId}/messages instead of a separate chat doc.
    try {
      const messagesCol = collection(db, 'trybes', String(docRef.id), 'messages');
  const welcome = `Welcome to ${trybeDataToSave.eventName || (trybeDataToSave as any).name || 'this trybe'} group chat!`;
      try {
        await addDoc(messagesCol, {
          senderId: 'system',
          senderName: 'System',
          text: welcome,
          system: true,
          createdAt: serverTimestamp(),
        } as any);
      } catch (err) {
        console.debug('CreateTrybeModal: failed to write initial system message', err);
      }

      // Optionally update parent trybe summary fields (best-effort)
      try {
        const trybeRef = firestoreDoc(db, 'trybes', String(docRef.id));
        await updateDoc(trybeRef, {
          lastMessage: welcome,
          lastMessageAt: serverTimestamp(),
        } as any);
      } catch (err) {
        // ignore summary update errors
      }
    } catch (err) {
      console.debug('CreateTrybeModal: unexpected error while creating initial message', err);
    }

    // Persist creator's joinedEvents so the chat shows after refresh
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        const userRef = firestoreDoc(db, 'users', uid);
        await updateDoc(userRef, { joinedEvents: arrayUnion(docRef.id) });
      }
    } catch (err) {
      console.debug('CreateTrybeModal: failed to add trybe to user.joinedEvents', err);
    }

    // Optionally: Show success alert or toast
    alert("🎉 Trybe created successfully!");

    // Close modal and reset form
    onClose();
    setFormData({
      eventName: "",
      location: "",
      time: "",
      duration: "",
      description: "",
      maxCapacity: 10,
      fee: "Free",
      photos: [],
      ageRange: [18, 65],
      // repeatOption removed
      isPremium: false,
      category: "", // don’t forget to reset this too
    });
    setIsSubmitting(false);
  } catch (err: any) {
    console.error("❌ Error creating Trybe:", err);
    // Surface the server/error message to the user to aid debugging
    const msg = err?.message || String(err) || 'Unknown error';
    alert(`Failed to create Trybe: ${msg}`);
    setIsSubmitting(false);
  }
};

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
      {/* Keep the rounded container and hide native overflow so the scrollbar is drawn inside the rounded box */}
      <div className="bg-card rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        <div className="modal-scroll overflow-y-auto max-h-[90vh] pb-24">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold">Create Trybe</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {PREMIUM_ENABLED ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl border border-primary/20">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Crown className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold flex items-center">
                      Trybe Premium
                      <Zap className="w-4 h-4 ml-1 text-yellow-500" />
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Create exclusive private events for verified members only
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPremium}
                    onChange={(e) =>
                      setFormData({ ...formData, isPremium: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {formData.isPremium && (
                <div className="bg-gradient-to-br from-primary/5 to-accent/10 rounded-xl p-4 border border-primary/20">
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Star className="w-4 h-4 mr-2 text-yellow-500" />
                    Premium Features
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span>Private events for verified members only</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span>Exclusive member screening and approval</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <option value="">Select a category</option>
                      {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      One-time fee for this event
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Event Name */}
          <div className="space-y-2">
            <Label htmlFor="eventName">Name *</Label>
            <Input
              id="eventName"
              value={formData.eventName}
              onChange={(e) =>
                setFormData({ ...formData, eventName: e.target.value })
              }
              placeholder="What's your trybe about?"
              required
              className="rounded-xl h-10 text-sm"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
                    <div className="flex flex-col space-y-2">
                      {/* Precise location button placed above the location input */}
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">Set map location</div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowMapPicker(true)}
                          className="text-sm"
                        >
                          Set map location
                        </Button>
                      </div>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) =>
                            setFormData({ ...formData, location: e.target.value })
                          }
                          placeholder="Where will this happen?"
                          required
                          className="pl-10 rounded-xl h-10 text-sm"
                        />
                      </div>
                    </div>
          </div>
                  {/* MapPicker modal — opened when user clicks "Set precise location" */}
                  {showMapPicker && (
                    <div
                      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
                      aria-hidden={!showMapPicker}
                    >
                      {/* Backdrop */}
                      <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setShowMapPicker(false)}
                      />

                      <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="mappicker-title"
                        ref={(el) => modalRef.current = el}
                        className="relative bg-card rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-auto p-4 shadow-lg"
                        onKeyDown={handleModalKeyDown}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 id="mappicker-title" className="font-semibold text-lg">Choose map location</h3>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline" onClick={() => setShowMapPicker(false)} className="text-sm font-semibold">Close</Button>
                          </div>
                        </div>

                        <div tabIndex={-1} className="outline-none" ref={firstFocusableRef} />

                        <MapPicker
                          apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined}
                          initial={formData.locationCoords ?? null}
                          onSelect={({ lat, lng, formattedAddress, placeId }) => {
                            console.debug('[CreateTrybeModal] MapPicker onSelect', { lat, lng, formattedAddress, placeId });
                            setFormData((prev) => ({
                              ...prev,
                              location: formattedAddress ?? `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                              locationCoords: { lat, lng },
                              placeId: placeId ?? prev.placeId,
                              formattedAddress: formattedAddress ?? prev.formattedAddress,
                            }));
                            // close the modal after selection
                            setShowMapPicker(false);
                          }}
                        />

                        <div tabIndex={-1} className="outline-none" ref={lastFocusableRef} />
                      </div>
                    </div>
                  )}

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="time">Time *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="time"
                type="datetime-local"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
                required
                className="pl-10 rounded-xl h-10 bg-transparent placeholder:text-muted-foreground appearance-none text-sm create-trybe-datetime"
                style={{ WebkitAppearance: 'none', MozAppearance: 'textfield', WebkitTextFillColor: 'inherit', backgroundColor: 'transparent' }}
              />
            </div>
          </div>

          {/* Event Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Event Duration</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="relative">
                  <select
                id="duration"
                value={formData.duration}
                onChange={(e) => {
                  const v = e.target.value;
                  console.debug('[CreateTrybeModal] duration selected', v);
                  setFormData({ ...formData, duration: v });
                }}
                  className="w-full pl-10 pr-12 py-2 h-10 leading-none rounded-xl border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent create-trybe-select"
              >
                <option value="" disabled>Select duration</option>
                <option value="0.5">30 minutes</option>
                <option value="1">1 hour</option>
                <option value="1.5">1.5 hours</option>
                <option value="2">2 hours</option>
                <option value="3">3 hours</option>
                <option value="4">4 hours</option>
                <option value="6">6 hours</option>
                <option value="8">8 hours</option>
                <option value="12">12 hours</option>
                <option value="24">All day</option>
              </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
              <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Tell people what to expect at your event..."
              className="rounded-xl min-h-[100px] resize-none text-sm"
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">
              {formData.description.length}/500 characters
            </div>
          </div>
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <div className="relative">
              <select
                id="category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                required
                className="w-full pl-3 pr-12 py-2 h-10 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent create-trybe-select"
              >
              <option value="">Select a category</option>
              <option value="fitness">🏋️ Fitness</option>
              <option value="music">🎶 Music</option>
              <option value="social">👥 Social</option>
              <option value="tech">💻 Tech</option>
              <option value="outdoors">🌳 Outdoors</option>
              <option value="food">🍴 Food</option>
              <option value="art">🎨 Art</option>
              <option value="travel">✈️ Travel</option>
              <option value="education">📚 Education</option>
              <option value="gaming">🎮 Gaming</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <Label htmlFor="maxCapacity">Capacity *</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                id="maxCapacity"
                type="number"
                min="1"
                max="100"
                value={formData.maxCapacity}
                onChange={(e) => {
                  const raw = e.target.value;
                  setFormData({ ...formData, maxCapacity: raw === '' ? '' : parseInt(raw, 10) });
                }}
                required
                  className="pl-10 rounded-xl h-10 text-sm"
              />
            </div>
          </div>

          {/* Fee */}
          <div className="space-y-2">
            <Label htmlFor="fee">Fee *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                id="fee"
                value={formData.fee}
                onChange={(e) =>
                  setFormData({ ...formData, fee: e.target.value })
                }
                placeholder="Free, $10, $25, etc."
                required
                  className="pl-10 rounded-xl h-10 text-sm"
              />
            </div>
          </div>

          {/* Age Range (two single-thumb sliders for stability) */}
          <div className="space-y-2">
            <Label>Age Range</Label>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Who can join this event</span>
                <span className="font-semibold text-sm">{formData.ageRange[0]} - {formData.ageRange[1]} years</span>
                </div>
              </div>

              {/* Min age slider (single-thumb, same pattern as max distance slider) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Minimum age</span>
                  <span className="font-medium text-sm">{formData.ageRange[0]} years</span>
                </div>
                <Slider
                  value={[formData.ageRange[0]]}
                  onValueChange={(value) => {
                    const newMin = Number(value[0] ?? formData.ageRange[0]);
                    const clampedMin = Math.min(newMin, formData.ageRange[1]);
                    setFormData({ ...formData, ageRange: [clampedMin, formData.ageRange[1]] });
                  }}
                  max={80}
                  min={16}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Max age slider (single-thumb) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Maximum age</span>
                  <span className="font-medium text-sm">{formData.ageRange[1]} years</span>
                </div>
                <Slider
                  value={[formData.ageRange[1]]}
                  onValueChange={(value) => {
                    const newMax = Number(value[0] ?? formData.ageRange[1]);
                    const clampedMax = Math.max(newMax, formData.ageRange[0]);
                    setFormData({ ...formData, ageRange: [formData.ageRange[0], clampedMax] });
                  }}
                  max={80}
                  min={16}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Repeat/recurrence removed — events are one-time only */}

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Event Photos</Label>

            {/* Show uploaded photos */}
            {formData.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {formData.photos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden"
                  >
                    <img
                      src={photo instanceof File ? URL.createObjectURL(photo) : photo}
                      alt={`Event photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newPhotos = formData.photos.filter(
                          (_, i) => i !== index,
                        );
                        setFormData({ ...formData, photos: newPhotos });
                      }}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload area */}
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-6 text-center">
              <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground text-sm mb-3">
                Add photos to showcase your event <span className="text-destructive">*</span>
              </p>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length === 0) return;
                  
                  // Filter out unsupported formats (HEIC, HEIF, etc.)
                  const validFiles: File[] = [];
                  const invalidFiles: string[] = [];
                  
                  files.forEach(file => {
                    const fileName = file.name.toLowerCase();
                    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
                    const isValid = validExtensions.some(ext => fileName.endsWith(ext)) && 
                                   !fileName.endsWith('.heic') && 
                                   !fileName.endsWith('.heif');
                    
                    if (isValid) {
                      validFiles.push(file);
                    } else {
                      invalidFiles.push(file.name);
                    }
                  });
                  
                  if (invalidFiles.length > 0) {
                    alert(`⚠️ Some files were not added because they're in an unsupported format:\n\n${invalidFiles.join('\n')}\n\nPlease convert HEIC/HEIF images to JPG or PNG. On iPhone, you can:\n1. Go to Settings > Camera > Formats\n2. Select "Most Compatible" to save as JPEG instead of HEIC`);
                  }
                  
                  if (validFiles.length > 0) {
                    setFormData((prev) => ({
                      ...prev,
                      photos: [...prev.photos, ...validFiles],
                    }));
                    console.debug('Valid files added:', validFiles.map(f => ({ name: f.name, size: f.size })));
                  }
                  
                  // Reset input
                  e.target.value = "";
                }}
                className="hidden"
                id="photo-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("photo-upload")?.click()}
                className="rounded-xl"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Photos
              </Button>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "flex-1 rounded-xl",
                PREMIUM_ENABLED && formData.isPremium && "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90",
                isSubmitting && "opacity-60 pointer-events-none"
              )}
            >
              {PREMIUM_ENABLED && formData.isPremium ? (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Creating...' : 'Create Premium Trybe'}
                </>
              ) : (
                isSubmitting ? 'Creating...' : 'Create Trybe'
              )}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
