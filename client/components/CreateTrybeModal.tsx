import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Camera,
  Plus,
  Tag,
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
  maxCapacity: number;
  fee: string;
}

const categories = [
  "Tech",
  "Food & Drink",
  "Fitness",
  "Arts & Culture",
  "Outdoors",
  "Professional",
  "Social",
  "Learning",
];

const suggestedInterests = [
  "Coffee",
  "Networking",
  "Hiking",
  "Art",
  "Music",
  "Photography",
  "Yoga",
  "Coding",
  "Cooking",
  "Gaming",
];

export default function CreateTrybeModal({
  isOpen,
  onClose,
  onCreateTrybe,
}: CreateTrybeModalProps) {
  const [formData, setFormData] = useState<TrybeData>({
    eventName: "",
    location: "",
    time: "",
    maxCapacity: 10,
    fee: "Free",
  });

  const [customInterest, setCustomInterest] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateTrybe(formData);
    onClose();
    // Reset form
    setFormData({
      eventName: "",
      location: "",
      time: "",
      maxCapacity: 10,
      fee: "Free",
    });
  };

  const addInterest = (interest: string) => {
    if (!formData.interests.includes(interest)) {
      setFormData({
        ...formData,
        interests: [...formData.interests, interest],
      });
    }
  };

  const removeInterest = (interest: string) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter((i) => i !== interest),
    });
  };

  const addCustomInterest = () => {
    if (customInterest.trim() && !formData.interests.includes(customInterest)) {
      addInterest(customInterest.trim());
      setCustomInterest("");
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
            <Button type="submit" className="flex-1 rounded-xl">
              Create Trybe
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
