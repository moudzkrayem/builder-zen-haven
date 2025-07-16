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
    description: "",
    location: "",
    date: "",
    maxCapacity: 10,
    fee: "Free",
    category: "Social",
    interests: [],
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
      description: "",
      location: "",
      date: "",
      maxCapacity: 10,
      fee: "Free",
      category: "Social",
      interests: [],
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
            <Label htmlFor="eventName">Event Name *</Label>
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

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe your event and what people can expect..."
              required
              className="rounded-xl min-h-[100px]"
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

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date & Time *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="date"
                type="datetime-local"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
                className="pl-10 rounded-xl"
              />
            </div>
          </div>

          {/* Max Capacity */}
          <div className="space-y-2">
            <Label htmlFor="maxCapacity">Max Capacity</Label>
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
                    maxCapacity: parseInt(e.target.value),
                  })
                }
                className="pl-10 rounded-xl"
              />
            </div>
          </div>

          {/* Fee */}
          <div className="space-y-2">
            <Label htmlFor="fee">Fee</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="fee"
                value={formData.fee}
                onChange={(e) =>
                  setFormData({ ...formData, fee: e.target.value })
                }
                placeholder="Free, $10, $25, etc."
                className="pl-10 rounded-xl"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  type="button"
                  variant={
                    formData.category === category ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setFormData({ ...formData, category })}
                  className="rounded-full"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="space-y-2">
            <Label>Interests/Tags</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.interests.map((interest) => (
                <Badge
                  key={interest}
                  variant="secondary"
                  className="px-3 py-1 rounded-full cursor-pointer"
                  onClick={() => removeInterest(interest)}
                >
                  {interest}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {suggestedInterests
                .filter((interest) => !formData.interests.includes(interest))
                .map((interest) => (
                  <Button
                    key={interest}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addInterest(interest)}
                    className="rounded-full text-xs h-8"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {interest}
                  </Button>
                ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
                placeholder="Add custom interest..."
                className="rounded-xl"
                onKeyPress={(e) => e.key === "Enter" && addCustomInterest()}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addCustomInterest}
                className="rounded-xl"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Photo Upload Placeholder */}
          <div className="space-y-2">
            <Label>Event Photos</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center">
              <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                Tap to add photos (coming soon)
              </p>
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
