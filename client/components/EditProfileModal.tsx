import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { X, Edit3, Plus, MapPin, Briefcase, GraduationCap, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: {
    name: string;
    age: number;
    profession: string;
    education: string;
    location: string;
    bio: string;
    interests: string[];
  };
}

const availableInterests = [
  "Design",
  "Coffee",
  "Travel",
  "Photography",
  "Hiking",
  "Art",
  "Music",
  "Yoga",
  "Tech",
  "Fitness",
  "Food",
  "Books",
  "Fashion",
  "Gaming",
  "Sports",
  "Dancing",
  "Cooking",
  "Movies",
  "Nature",
  "Wellness",
];

export default function EditProfileModal({ isOpen, onClose, userData }: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    name: userData.name,
    age: userData.age.toString(),
    profession: userData.profession,
    education: userData.education,
    location: userData.location,
    bio: userData.bio,
  });
  const [selectedInterests, setSelectedInterests] = useState<string[]>(userData.interests);
  const [newInterest, setNewInterest] = useState("");

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const addCustomInterest = () => {
    if (newInterest.trim() && !selectedInterests.includes(newInterest.trim())) {
      setSelectedInterests(prev => [...prev, newInterest.trim()]);
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setSelectedInterests(prev => prev.filter(i => i !== interest));
  };

  const handleSave = () => {
    // Here you would typically save the data to your backend/context
    console.log("Saving profile data:", { ...formData, interests: selectedInterests });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="absolute inset-x-4 top-4 bottom-4 bg-card rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <Edit3 className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Edit Profile</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-primary" />
              Basic Information
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    First Name
                  </label>
                  <Input
                    value={formData.name.split(" ")[0]}
                    onChange={(e) => handleInputChange("name", e.target.value + " " + (formData.name.split(" ")[1] || ""))}
                    placeholder="Enter your first name"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    Age
                  </label>
                  <Input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                    placeholder="Age"
                    className="rounded-xl"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  Location
                </label>
                <Input
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="City, State"
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2 flex items-center">
                  <Briefcase className="w-4 h-4 mr-1" />
                  Profession
                </label>
                <Input
                  value={formData.profession}
                  onChange={(e) => handleInputChange("profession", e.target.value)}
                  placeholder="Your job title"
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2 flex items-center">
                  <GraduationCap className="w-4 h-4 mr-1" />
                  Education
                </label>
                <Input
                  value={formData.education}
                  onChange={(e) => handleInputChange("education", e.target.value)}
                  placeholder="School or University"
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <h3 className="text-lg font-semibold mb-4">About Me</h3>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-2">
                Bio ({formData.bio.length}/500)
              </label>
              <Textarea
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                placeholder="Tell others about yourself..."
                className="rounded-xl min-h-[120px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Write something that represents your personality and interests.
              </p>
            </div>
          </div>

          {/* Interests */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Interests</h3>
            
            {/* Selected Interests */}
            <div className="mb-4">
              <label className="text-sm font-medium text-muted-foreground block mb-2">
                Your Interests ({selectedInterests.length}/10)
              </label>
              <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border border-border rounded-xl bg-muted/20">
                {selectedInterests.map((interest) => (
                  <Badge
                    key={interest}
                    variant="default"
                    className="px-3 py-1 rounded-full text-sm bg-primary text-primary-foreground"
                  >
                    {interest}
                    <button
                      onClick={() => removeInterest(interest)}
                      className="ml-2 hover:text-red-300"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Available Interests */}
            <div className="mb-4">
              <label className="text-sm font-medium text-muted-foreground block mb-2">
                Choose from popular interests
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 border border-border rounded-xl">
                {availableInterests
                  .filter(interest => !selectedInterests.includes(interest))
                  .map((interest) => (
                    <Badge
                      key={interest}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent transition-colors px-3 py-1 rounded-full text-sm"
                      onClick={() => selectedInterests.length < 10 && toggleInterest(interest)}
                    >
                      {interest}
                    </Badge>
                  ))}
              </div>
            </div>

            {/* Custom Interest Input */}
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-2">
                Add custom interest
              </label>
              <div className="flex space-x-2">
                <Input
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="Type a custom interest..."
                  className="rounded-xl"
                  onKeyPress={(e) => e.key === "Enter" && addCustomInterest()}
                />
                <Button
                  onClick={addCustomInterest}
                  disabled={!newInterest.trim() || selectedInterests.length >= 10}
                  className="rounded-xl"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/20">
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
