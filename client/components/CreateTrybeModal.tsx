import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { collection, addDoc, serverTimestamp, updateDoc, doc as firestoreDoc } from "firebase/firestore";
import { db, app } from "../firebase"; // ✅ make sure you export db and app in firebase.ts
import { auth } from "../firebase"; // to get current user
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
  Repeat,
} from "lucide-react";

interface CreateTrybeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTrybe: (trybeData: TrybeData) => void;
}

interface TrybeData {
  eventName: string;
  location: string;
  time: string;
  duration: string;
  description: string;
  maxCapacity: number;
  fee: string;
  photos: Array<string | File>;
  ageRange: [number, number];
  repeatOption: string;
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
    time: "",
    duration: "2",
    description: "",
    maxCapacity: 10,
    fee: "Free",
  photos: [],
    ageRange: [18, 65],
    repeatOption: "none",
    isPremium: false,
    category:"",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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

    // If photos contain large data URLs, upload them to Firebase Storage first
    const storage = getStorage(app);
    const photosToSave: string[] = [];

    for (let i = 0; i < (formData.photos || []).length; i++) {
      const p = formData.photos[i];
      try {
        if (p instanceof File) {
          const path = `trybePhotos/${user.uid}/${Date.now()}-${i}-${p.name}`;
          const ref = storageRef(storage, path);
          const uploadTask = uploadBytesResumable(ref, p);

          // wait for completion
          await new Promise<void>((resolve, reject) => {
            uploadTask.on('state_changed',
              () => {},
              (error) => reject(error),
              async () => {
                try {
                  const url = await getDownloadURL(ref);
                  photosToSave.push(url);
                  resolve();
                } catch (err) {
                  reject(err);
                }
              }
            );
          });
        } else if (typeof p === 'string') {
          photosToSave.push(p);
        }
      } catch (err) {
        console.warn('Photo upload failed, keeping original value', err);
        photosToSave.push(typeof p === 'string' ? p : '');
      }
    }

    // Prepare Trybe data (use resolved photo URLs)
    const trybeDataToSave = {
      ...formData,
      photos: photosToSave,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    };

    // Debug: show what will be saved (helps diagnose Firestore errors)
    console.debug('Creating Trybe with data:', trybeDataToSave);

    // Save in Firestore
    const docRef = await addDoc(collection(db, "trybes"), trybeDataToSave);
    console.log("✅ Trybe created with ID:", docRef.id);

    // Ensure the trybe doc records its own id field for easier matching later
    try {
      await updateDoc(firestoreDoc(db, 'trybes', docRef.id), { id: docRef.id });
    } catch (err) {
      console.debug('Failed to set id field on created trybe doc', err);
    }

    // Build a created trybe object to pass to the parent/provider so UI can update immediately
    const createdTrybe = {
      id: docRef.id,
      ...trybeDataToSave,
      photos: photosToSave,
      createdAt: new Date().toISOString(),
    } as any;

    // Call parent's handler if provided so provider can add the trybe locally (helps images show immediately)
    try {
      if (typeof onCreateTrybe === 'function') {
        onCreateTrybe(createdTrybe);
      }
    } catch (err) {
      console.debug('onCreateTrybe handler threw', err);
    }

    // Optionally: Show success alert or toast
    alert("🎉 Trybe created successfully!");

    // Close modal and reset form
    onClose();
    setFormData({
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
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold">Create Trybe</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Premium Option */}
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
                    <span>Enhanced privacy controls and settings</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    <span>Curated high-quality member community</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-card rounded-lg border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Premium Cost:</span>
                    <span className="text-lg font-bold text-primary">$9.99</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    One-time fee for this event
                  </p>
                </div>
              </div>
            )}
          </div>

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
              className="rounded-xl"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
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
                className="pl-10 rounded-xl"
              />
            </div>
          </div>

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
                className="pl-10 rounded-xl"
              />
            </div>
          </div>

          {/* Event Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Event Duration</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                id="duration"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
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
              className="rounded-xl min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">
              {formData.description.length}/500 characters
            </div>
          </div>
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              required
              className="w-full rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent p-2"
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
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxCapacity: parseInt(e.target.value) || 1,
                  })
                }
                required
                className="pl-10 rounded-xl"
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
                className="pl-10 rounded-xl"
              />
            </div>
          </div>

          {/* Age Range */}
          <div className="space-y-2">
            <Label>Age Range</Label>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Who can join this event
                </span>
                <span className="font-semibold">
                  {formData.ageRange[0]} - {formData.ageRange[1]} years
                </span>
              </div>
              <Slider
                value={formData.ageRange}
                onValueChange={(value) =>
                  setFormData({ ...formData, ageRange: value as [number, number] })
                }
                max={80}
                min={16}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* Repeat Trybe Option */}
          <div className="space-y-2">
            <Label htmlFor="repeatOption">Repeat Trybe</Label>
            <div className="relative">
              <Repeat className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                id="repeatOption"
                value={formData.repeatOption}
                onChange={(e) =>
                  setFormData({ ...formData, repeatOption: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                <option value="none">One-time event</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              {formData.repeatOption === "none"
                ? "This event will only happen once"
                : formData.repeatOption === "daily"
                ? "This event will repeat every day at the same time"
                : formData.repeatOption === "weekly"
                ? "This event will repeat every week on the same day"
                : "This event will repeat every month on the same date"
              }
            </p>
          </div>

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
                Add photos to showcase your event
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length === 0) return;
                  setFormData((prev) => ({
                    ...prev,
                    photos: [...prev.photos, ...files],
                  }));
                  console.debug('Files added:', files.map(f => ({ name: f.name, size: f.size })));
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
                formData.isPremium && "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90",
                isSubmitting && "opacity-60 pointer-events-none"
              )}
            >
              {formData.isPremium ? (
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
  );
}
