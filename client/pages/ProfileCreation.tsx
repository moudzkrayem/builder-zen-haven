import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Camera,
  Plus,
  X,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Briefcase,
  GraduationCap,
  Calendar,
  Star,
  Heart,
  Upload,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileData {
  // Basic Info
  firstName: string;
  lastName: string;
  age: number;
  location: string;
  occupation: string;
  education: string;
  bio: string;
  photos: string[];
  
  // Interests
  thingsYouDoGreat: string[];
  thingsYouWantToTry: string[];
  
  // Preferences
  ageRangePreference: [number, number];
  maxDistance: number;
}

const STEP_TITLES = [
  "Tell us about yourself",
  "Add your photos",
  "What do you excel at?",
  "What would you like to try?",
  "Your preferences"
];

const COMMON_INTERESTS = [
  // Things you might do great
  "Cooking", "Photography", "Fitness", "Dancing", "Music", "Art", "Writing", 
  "Sports", "Gaming", "Programming", "Design", "Yoga", "Running", "Hiking",
  "Swimming", "Cycling", "Reading", "Languages", "Teaching", "Public Speaking",
  "Leadership", "Marketing", "Sales", "Crafting", "Gardening", "Travel Planning",
  
  // Things you might want to try
  "Rock Climbing", "Surfing", "Skydiving", "Pottery", "Wine Tasting", 
  "Stand-up Comedy", "Martial Arts", "Meditation", "Volunteering", "Networking",
  "Entrepreneurship", "Investing", "Coding", "Singing", "Acting", "Modeling",
  "Painting", "Sculpture", "Fashion Design", "Interior Design", "Event Planning",
  "Podcasting", "Vlogging", "Blogging", "Mentoring", "Consulting"
];

export default function ProfileCreation() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    age: 25,
    location: "",
    occupation: "",
    education: "",
    bio: "",
    photos: [],
    thingsYouDoGreat: [],
    thingsYouWantToTry: [],
    ageRangePreference: [22, 35],
    maxDistance: 25,
  });

  const handleNext = () => {
    if (currentStep < STEP_TITLES.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Store profile data in localStorage for now
    localStorage.setItem('userProfile', JSON.stringify(profileData));
    // Navigate to home page
    navigate('/home');
  };

  const addInterest = (interest: string, type: 'great' | 'try') => {
    if (type === 'great') {
      if (!profileData.thingsYouDoGreat.includes(interest)) {
        setProfileData({
          ...profileData,
          thingsYouDoGreat: [...profileData.thingsYouDoGreat, interest]
        });
      }
    } else {
      if (!profileData.thingsYouWantToTry.includes(interest)) {
        setProfileData({
          ...profileData,
          thingsYouWantToTry: [...profileData.thingsYouWantToTry, interest]
        });
      }
    }
  };

  const removeInterest = (interest: string, type: 'great' | 'try') => {
    if (type === 'great') {
      setProfileData({
        ...profileData,
        thingsYouDoGreat: profileData.thingsYouDoGreat.filter(i => i !== interest)
      });
    } else {
      setProfileData({
        ...profileData,
        thingsYouWantToTry: profileData.thingsYouWantToTry.filter(i => i !== interest)
      });
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return profileData.firstName && profileData.lastName && profileData.location && profileData.occupation;
      case 1:
        return profileData.photos.length > 0;
      case 2:
        return profileData.thingsYouDoGreat.length >= 3;
      case 3:
        return profileData.thingsYouWantToTry.length >= 3;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  placeholder="Your first name"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  placeholder="Your last name"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Age: {profileData.age}</Label>
              <Slider
                value={[profileData.age]}
                onValueChange={(value) => setProfileData({ ...profileData, age: value[0] })}
                max={65}
                min={18}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="location"
                  value={profileData.location}
                  onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                  placeholder="City, State"
                  className="pl-10 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation *</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="occupation"
                  value={profileData.occupation}
                  onChange={(e) => setProfileData({ ...profileData, occupation: e.target.value })}
                  placeholder="Your job title"
                  className="pl-10 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="education">Education</Label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="education"
                  value={profileData.education}
                  onChange={(e) => setProfileData({ ...profileData, education: e.target.value })}
                  placeholder="School or University"
                  className="pl-10 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">About You</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                placeholder="Tell people about yourself, your interests, and what makes you unique..."
                className="rounded-xl min-h-[100px] resize-none"
                maxLength={500}
              />
              <div className="text-xs text-muted-foreground text-right">
                {profileData.bio.length}/500 characters
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-muted-foreground">
                Add at least one photo to continue. Great photos help you connect with the right people!
              </p>
            </div>

            {profileData.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                {profileData.photos.map((photo, index) => (
                  <div key={index} className="relative aspect-[3/4] rounded-xl overflow-hidden">
                    <img src={photo} alt={`Profile ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => {
                        const newPhotos = profileData.photos.filter((_, i) => i !== index);
                        setProfileData({ ...profileData, photos: newPhotos });
                      }}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center">
              <Camera className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground text-sm mb-4">
                Add photos that show your personality
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  files.forEach((file) => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const imageUrl = event.target?.result as string;
                      setProfileData((prev) => ({
                        ...prev,
                        photos: [...prev.photos, imageUrl],
                      }));
                    };
                    reader.readAsDataURL(file);
                  });
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
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center justify-center">
                <Star className="w-5 h-5 mr-2 text-yellow-500" />
                Things You Do Great
              </h3>
              <p className="text-muted-foreground">
                Select at least 3 activities you're already skilled at. This helps us match you with relevant events!
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {profileData.thingsYouDoGreat.map((interest) => (
                  <Badge
                    key={interest}
                    className="px-3 py-1 rounded-full bg-primary text-primary-foreground cursor-pointer"
                    onClick={() => removeInterest(interest, 'great')}
                  >
                    {interest}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>

              <div className="text-sm text-muted-foreground">
                Selected: {profileData.thingsYouDoGreat.length} (minimum 3)
              </div>

              <div className="grid grid-cols-2 gap-2">
                {COMMON_INTERESTS.filter(interest => !profileData.thingsYouDoGreat.includes(interest) && !profileData.thingsYouWantToTry.includes(interest)).map((interest) => (
                  <Button
                    key={interest}
                    variant="outline"
                    size="sm"
                    onClick={() => addInterest(interest, 'great')}
                    className="justify-start text-left rounded-xl"
                  >
                    <Plus className="w-3 h-3 mr-2" />
                    {interest}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center justify-center">
                <Heart className="w-5 h-5 mr-2 text-red-500" />
                Things You Want to Try
              </h3>
              <p className="text-muted-foreground">
                Select at least 3 activities you'd love to experience. We'll show you events where you can learn and explore!
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {profileData.thingsYouWantToTry.map((interest) => (
                  <Badge
                    key={interest}
                    className="px-3 py-1 rounded-full bg-red-500 text-white cursor-pointer"
                    onClick={() => removeInterest(interest, 'try')}
                  >
                    {interest}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>

              <div className="text-sm text-muted-foreground">
                Selected: {profileData.thingsYouWantToTry.length} (minimum 3)
              </div>

              <div className="grid grid-cols-2 gap-2">
                {COMMON_INTERESTS.filter(interest => !profileData.thingsYouDoGreat.includes(interest) && !profileData.thingsYouWantToTry.includes(interest)).map((interest) => (
                  <Button
                    key={interest}
                    variant="outline"
                    size="sm"
                    onClick={() => addInterest(interest, 'try')}
                    className="justify-start text-left rounded-xl"
                  >
                    <Plus className="w-3 h-3 mr-2" />
                    {interest}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2">Your Preferences</h3>
              <p className="text-muted-foreground">
                Help us personalize your experience
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Age Range for Events: {profileData.ageRangePreference[0]} - {profileData.ageRangePreference[1]} years</Label>
                <p className="text-xs text-muted-foreground mb-4">
                  What age group would you prefer to meet at events?
                </p>
                <Slider
                  value={profileData.ageRangePreference}
                  onValueChange={(value) => setProfileData({ ...profileData, ageRangePreference: value as [number, number] })}
                  max={65}
                  min={18}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Maximum Distance: {profileData.maxDistance} miles</Label>
                <p className="text-xs text-muted-foreground mb-4">
                  How far are you willing to travel for events?
                </p>
                <Slider
                  value={[profileData.maxDistance]}
                  onValueChange={(value) => setProfileData({ ...profileData, maxDistance: value[0] })}
                  max={100}
                  min={5}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F5c6becf7cef04a3db5d3620ce9b103bd%2F2ddd6c77a8df4501aa9e8730dda91175?format=webp&width=800"
              alt="Trybe Logo"
              className="w-8 h-8 object-contain"
            />
            <div>
              <h1 className="text-lg font-bold">Create Your Profile</h1>
              <p className="text-xs text-muted-foreground">
                Step {currentStep + 1} of {STEP_TITLES.length}
              </p>
            </div>
          </div>
          
          {currentStep > 0 && (
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / STEP_TITLES.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">{STEP_TITLES[currentStep]}</h2>
        </div>

        {renderStep()}

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <div className="w-20">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handleBack} className="rounded-xl">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className={cn(
              "rounded-xl px-8",
              currentStep === STEP_TITLES.length - 1 && "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            )}
          >
            {currentStep === STEP_TITLES.length - 1 ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Complete Profile
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
