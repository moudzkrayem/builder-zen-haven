import { useState, useEffect } from "react";
import { auth, db } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { X, Edit3, Plus, MapPin, Briefcase, GraduationCap, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void; // Callback to refresh profile data after save
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

export default function EditProfileModal({ isOpen, onClose, onSave, userData }: EditProfileModalProps) {
  const nameParts = userData.name.split(' ');
  const [formData, setFormData] = useState({
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    age: userData.age.toString(),
    profession: userData.profession,
    education: userData.education,
    location: userData.location,
    bio: userData.bio,
  });
  const [selectedInterests, setSelectedInterests] = useState<string[]>(userData.interests);
  const [newInterest, setNewInterest] = useState("");

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store original overflow value
      const originalOverflow = document.body.style.overflow;
      // Lock scroll
      document.body.style.overflow = 'hidden';
      
      // Cleanup: restore scroll on unmount
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

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
    // Persist edits to Firestore users/{uid} and update localStorage.userProfile
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('You must be logged in to save your profile');
        return;
      }

      // Build payload
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      const payload: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        displayName: fullName,
        age: Number(formData.age) || 0,
        occupation: formData.profession || '',
        education: formData.education || '',
        location: formData.location || '',
        bio: formData.bio || '',
        thingsYouDoGreat: selectedInterests || [],
        updatedAt: new Date().toISOString(),
      };

      // Merge into Firestore user doc
      const userRef = doc(db, 'users', user.uid);
      // setDoc with merge true to avoid clobbering other fields
      void setDoc(userRef, payload, { merge: true }).then(async () => {
        // Also update Firebase Auth displayName
        try {
          await updateProfile(user, { displayName: fullName });
        } catch (err) {
          console.error('Error updating auth profile:', err);
        }
        try {
          // Update local cache in localStorage so UI reflects changes immediately
          const stored = localStorage.getItem('userProfile');
          const existing = stored ? JSON.parse(stored) : {};
          const merged = { ...existing, ...payload };
          // Keep legacy name field too
          merged.name = `${merged.firstName || ''}${merged.lastName ? ' ' + merged.lastName : ''}`.trim();
          localStorage.setItem('userProfile', JSON.stringify(merged));
          console.log('✅ Profile saved successfully:', merged);
        } catch (err) {
          console.error('Error updating localStorage:', err);
        }
        
        // Call onSave callback to refresh parent component
        if (onSave) {
          onSave();
        }
        
        onClose();
      }).catch((err) => {
        console.error('Failed to save profile to Firestore', err);
        alert('Failed to save profile. Please try again.');
      });
    } catch (err) {
      console.error('EditProfileModal: unexpected save error', err);
      alert('Failed to save profile.');
    }
  };

  return (
    <div 
      className="fixed inset-x-0 top-0 bottom-20 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl max-h-[calc(100vh-6rem)] sm:max-h-[calc(100vh-7rem)] bg-card rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center space-x-3">
            <Edit3 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold">Edit Profile</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-primary" />
              Basic Information
            </h3>
            <div className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    First Name
                  </label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="Enter your first name"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    Last Name
                  </label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="Enter your last name"
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

        {/* Footer - Fixed */}
        <div className="p-4 sm:p-6 border-t border-border bg-muted/20 flex-shrink-0">
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
