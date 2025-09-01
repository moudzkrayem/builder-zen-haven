import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { X, MapPin, Calendar, Users, DollarSign, Crown, Upload, Camera } from "lucide-react";
import { Slider } from "@/components/ui/slider";

export interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: number;
    eventName?: string;
    name: string;
    location: string;
    time?: string;
    date: string;
    duration?: string;
    maxCapacity: number;
    fee: string;
    description?: string;
    isPremium?: boolean;
    eventImages?: string[];
    ageRange?: [number, number];
    repeatOption?: string;
  } | null;
  onSave: (updates: Partial<EditEventModalProps["event"]>) => void;
}

export default function EditEventModal({ isOpen, onClose, event, onSave }: EditEventModalProps) {
  const [form, setForm] = useState(() => ({
    eventName: event?.eventName || event?.name || "",
    location: event?.location || "",
    time: event?.time || "",
    duration: event?.duration || "2",
    maxCapacity: event?.maxCapacity || 10,
    fee: event?.fee || "Free",
    description: event?.description || "",
    isPremium: Boolean(event?.isPremium),
    photos: event?.eventImages || [],
    ageRange: event?.ageRange || [18, 65],
    repeatOption: event?.repeatOption || "none",
  }));

  if (!isOpen || !event) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: any = {};
    if (form.eventName && form.eventName !== (event.eventName || event.name)) updates.eventName = form.eventName;
    if (form.location && form.location !== event.location) updates.location = form.location;
    if (form.time && form.time !== (event.time || "")) updates.time = form.time;
    if (form.duration && form.duration !== (event.duration || "")) updates.duration = form.duration;
    if (form.maxCapacity !== event.maxCapacity) updates.maxCapacity = form.maxCapacity;
    if (form.fee && form.fee !== event.fee) updates.fee = form.fee;
    if ((form.description || "") !== (event.description || "")) updates.description = form.description;
    if (Boolean(form.isPremium) !== Boolean(event.isPremium)) updates.isPremium = form.isPremium;
    if (form.repeatOption !== (event.repeatOption || "none")) updates.repeatOption = form.repeatOption;
    if (form.ageRange && JSON.stringify(form.ageRange) !== JSON.stringify(event.ageRange || [18,65])) updates.ageRange = form.ageRange;
    if (form.photos && JSON.stringify(form.photos) !== JSON.stringify(event.eventImages || [])) updates.eventImages = form.photos;

    onSave(updates);
    onClose();
  };

  const setPhotoFiles = (files: File[]) => {
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        setForm((f: any) => ({ ...f, photos: [...(f.photos || []), url] }));
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold">Edit Trybe</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.eventName}
              onChange={(e) => setForm((f) => ({ ...f, eventName: e.target.value }))}
              required
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                required
                className="pl-10 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Date & Time</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="time"
                type="datetime-local"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className="pl-10 rounded-xl"
              />
            </div>
            {!event.time && (
              <p className="text-xs text-muted-foreground">Current: {event.date}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  max={100}
                  value={form.maxCapacity}
                  onChange={(e) => setForm((f) => ({ ...f, maxCapacity: parseInt(e.target.value || '1', 10) }))}
                  className="pl-10 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee">Fee</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="fee"
                  value={form.fee}
                  onChange={(e) => setForm((f) => ({ ...f, fee: e.target.value }))}
                  className="pl-10 rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="rounded-xl min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">{form.description.length}/500</div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl border border-primary/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Trybe Premium</h3>
                <p className="text-xs text-muted-foreground">Exclusive event for verified members</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPremium}
                onChange={(e) => setForm((f) => ({ ...f, isPremium: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancel</Button>
            <Button type="submit" className={cn("flex-1 rounded-xl", form.isPremium && "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90")}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
