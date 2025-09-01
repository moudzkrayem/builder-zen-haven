import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import {
  Camera,
  Plus,
  X,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Briefcase,
  GraduationCap,
  Star,
  Heart,
  Upload,
  Check,
  Sparkles,
  Target,
  Settings,
  Users,
  Activity,
  Zap,
  Globe,
  Award,
  TrendingUp,
  Coffee,
  Music,
  Paintbrush,
  Dumbbell,
  Book,
  Camera as CameraIcon,
  Code,
  Mic,
  Palette,
  Mountain,
  Waves,
  TreePine,
  GameController2,
  Utensils,
  Car,
  Plane,
  Shirt,
  Home,
  Megaphone,
  LineChart,
  Handshake,
  GraduationCap as EducationIcon,
  Languages,
  Calendar,
  MessageCircle,
  Monitor,
  Video,
  Lightbulb,
  Coins
} from "lucide-react";
import { cn } from "@/lib/utils";

// Compress an image file to a small data URL (max dimension 320px)
const readAndCompressFile = (file: File, maxDim = 320, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(new Error("Failed to read file"));
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img as HTMLImageElement;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(fr.result as string);
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(fr.result as string);
      img.src = fr.result as string;
    };
    fr.readAsDataURL(file);
  });
};

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
  
  // Interests with categories
  thingsYouDoGreat: string[];
  thingsYouWantToTry: string[];
  
  // Preferences
  ageRangePreference: [number, number];
  maxDistance: number;
  eventTypes: string[];
  groupSizePreference: string;
  timePreferences: string[];
}

const STEP_TITLES = [
  "Let's get to know you",
  "Show your best self",
  "What are you amazing at?",
  "What's on your bucket list?",
  "Perfect your experience"
];

const STEP_DESCRIPTIONS = [
  "Tell us about yourself so we can find your perfect activity matches",
  "Add photos that capture your adventurous spirit",
  "Showcase your talents and skills to connect with like-minded people",
  "Share what you're excited to explore and learn",
  "Customize your preferences for the best experience"
];

const INTEREST_CATEGORIES = {
  sports: {
    icon: Dumbbell,
    label: "Sports & Fitness",
    color: "bg-gradient-to-br from-primary to-accent",
    interests: ["Running", "Fitness", "Yoga", "Swimming", "Cycling", "Tennis", "Basketball", "Football", "Soccer", "Volleyball", "Boxing", "Martial Arts", "Pilates", "CrossFit", "Rock Climbing", "Surfing", "Skiing", "Snowboarding", "Golf", "Baseball"]
  },
  creative: {
    icon: Paintbrush,
    label: "Arts & Creativity",
    color: "bg-gradient-to-br from-primary to-accent",
    interests: ["Photography", "Art", "Writing", "Music", "Dancing", "Painting", "Drawing", "Sculpture", "Pottery", "Crafting", "Design", "Fashion Design", "Interior Design", "Acting", "Singing", "Stand-up Comedy", "Podcasting", "Vlogging", "Blogging"]
  },
  tech: {
    icon: Code,
    label: "Tech & Innovation",
    color: "bg-gradient-to-br from-primary to-accent",
    interests: ["Programming", "Coding", "Gaming", "App Development", "Web Design", "Data Science", "AI/ML", "Robotics", "Virtual Reality", "Blockchain", "Cybersecurity", "Digital Marketing", "SEO"]
  },
  culinary: {
    icon: Utensils,
    label: "Food & Drink",
    color: "bg-gradient-to-br from-primary to-accent",
    interests: ["Cooking", "Baking", "Wine Tasting", "Coffee Culture", "Food Blogging", "Restaurant Reviews", "Mixology", "Brewing", "Grilling", "Vegetarian Cooking", "International Cuisine", "Food Photography"]
  },
  outdoor: {
    icon: Mountain,
    label: "Outdoor Adventures",
    color: "bg-gradient-to-br from-primary to-accent",
    interests: ["Hiking", "Camping", "Fishing", "Hunting", "Gardening", "Nature Photography", "Bird Watching", "Kayaking", "Rafting", "Backpacking", "Geocaching", "Stargazing", "Beach Activities"]
  },
  social: {
    icon: Users,
    label: "Social & Networking",
    color: "bg-gradient-to-br from-primary to-accent",
    interests: ["Networking", "Public Speaking", "Volunteering", "Community Service", "Event Planning", "Leadership", "Mentoring", "Team Building", "Social Media", "Influencing", "Consulting", "Teaching"]
  },
  business: {
    icon: Briefcase,
    label: "Business & Finance",
    color: "bg-gradient-to-br from-primary to-accent",
    interests: ["Entrepreneurship", "Investing", "Sales", "Marketing", "Real Estate", "Cryptocurrency", "Stock Trading", "Business Development", "Startups", "E-commerce", "Freelancing", "Project Management"]
  },
  learning: {
    icon: Book,
    label: "Learning & Growth",
    color: "bg-gradient-to-br from-primary to-accent",
    interests: ["Reading", "Languages", "History", "Science", "Philosophy", "Psychology", "Self-Development", "Meditation", "Mindfulness", "Life Coaching", "Skill Building", "Online Courses", "Workshops"]
  }
};

const EVENT_TYPES = [
  { id: "workshops", label: "Workshops & Classes", icon: Award },
  { id: "sports", label: "Sports & Fitness", icon: Dumbbell },
  { id: "social", label: "Social Meetups", icon: Users },
  { id: "creative", label: "Creative Sessions", icon: Paintbrush },
  { id: "outdoor", label: "Outdoor Adventures", icon: Mountain },
  { id: "networking", label: "Networking Events", icon: Handshake },
  { id: "food", label: "Food & Drink", icon: Utensils },
  { id: "tech", label: "Tech & Innovation", icon: Code }
];

const GROUP_SIZE_OPTIONS = [
  { id: "small", label: "Small Groups (2-8 people)", description: "Intimate, close-knit experiences" },
  { id: "medium", label: "Medium Groups (9-20 people)", description: "Balanced social interaction" },
  { id: "large", label: "Large Groups (21+ people)", description: "High-energy, diverse crowds" },
  { id: "any", label: "Any Size", description: "I'm flexible with group sizes" }
];

const TIME_PREFERENCES = [
  { id: "morning", label: "Morning (6AM-12PM)", icon: "🌅" },
  { id: "afternoon", label: "Afternoon (12PM-6PM)", icon: "☀️" },
  { id: "evening", label: "Evening (6PM-10PM)", icon: "🌆" },
  { id: "night", label: "Night (10PM+)", icon: "🌙" },
  { id: "weekend", label: "Weekends", icon: "🎉" },
  { id: "weekday", label: "Weekdays", icon: "📅" }
];

export default function ProfileCreation() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
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
    eventTypes: [],
    groupSizePreference: "any",
    timePreferences: []
  });

  const handleNext = async () => {
    if (currentStep < STEP_TITLES.length - 1) {
      setIsTransitioning(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      setCurrentStep(currentStep + 1);
      setIsTransitioning(false);
    } else {
      handleComplete();
    }
  };

  const handleBack = async () => {
    if (currentStep > 0) {
      setIsTransitioning(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      setCurrentStep(currentStep - 1);
      setIsTransitioning(false);
    }
  };

  const handleComplete = () => {
    // Safely store profile data (avoid quota by limiting photos size/count)
    const safeProfile = { ...profileData } as typeof profileData;
    safeProfile.photos = (safeProfile.photos || []).slice(0, 6);
    try {
      const json = JSON.stringify(safeProfile);
      if (json.length > 4_500_000) {
        safeProfile.photos = [];
      }
      localStorage.setItem('userProfile', JSON.stringify(safeProfile));
      try {
        sessionStorage.setItem('userProfilePhotos', JSON.stringify(safeProfile.photos));
      } catch {}
    } catch {
      try {
        const { photos, ...rest } = safeProfile as any;
        localStorage.setItem('userProfile', JSON.stringify(rest));
      } catch {}
    }

    // Create celebration animation
    const confetti = document.createElement('div');
    confetti.innerHTML = '🎉';
    confetti.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl animate-bounce z-50';
    document.body.appendChild(confetti);
    
    setTimeout(() => {
      document.body.removeChild(confetti);
      navigate('/home');
    }, 1500);
  };

  const addInterest = (interest: string, type: 'great' | 'try') => {
    if (type === 'great') {
      if (!profileData.thingsYouDoGreat.includes(interest) && profileData.thingsYouDoGreat.length < 10) {
        setProfileData({
          ...profileData,
          thingsYouDoGreat: [...profileData.thingsYouDoGreat, interest]
        });
      }
    } else {
      if (!profileData.thingsYouWantToTry.includes(interest) && profileData.thingsYouWantToTry.length < 10) {
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

  const toggleEventType = (eventTypeId: string) => {
    const newEventTypes = profileData.eventTypes.includes(eventTypeId)
      ? profileData.eventTypes.filter(id => id !== eventTypeId)
      : [...profileData.eventTypes, eventTypeId];
    
    setProfileData({ ...profileData, eventTypes: newEventTypes });
  };

  const toggleTimePreference = (timeId: string) => {
    const newTimePreferences = profileData.timePreferences.includes(timeId)
      ? profileData.timePreferences.filter(id => id !== timeId)
      : [...profileData.timePreferences, timeId];
    
    setProfileData({ ...profileData, timePreferences: newTimePreferences });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return profileData.firstName.trim() && profileData.lastName.trim();
      case 1:
        return profileData.photos.length > 0;
      case 2:
        return profileData.thingsYouDoGreat.length >= 3;
      case 3:
        return profileData.thingsYouWantToTry.length >= 3;
      case 4:
        return profileData.eventTypes.length > 0;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-8">

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">First Name *</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    placeholder="Your first name"
                    className="rounded-2xl border-2 focus:border-primary transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    placeholder="Your last name"
                    className="rounded-2xl border-2 focus:border-primary transition-colors"
                    required
                  />
                </div>
              </div>

              <Card className="border-2 border-muted">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Age</Label>
                      <Badge variant="secondary" className="rounded-full">
                        {profileData.age} years old
                      </Badge>
                    </div>
                    <Slider
                      value={[profileData.age]}
                      onValueChange={(value) => setProfileData({ ...profileData, age: value[0] })}
                      max={65}
                      min={18}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="location"
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    placeholder="City, State or Country (optional)"
                    className="pl-12 rounded-2xl border-2 focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation" className="text-sm font-medium">What do you do?</Label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="occupation"
                    value={profileData.occupation}
                    onChange={(e) => setProfileData({ ...profileData, occupation: e.target.value })}
                    placeholder="Your job title or profession (optional)"
                    className="pl-12 rounded-2xl border-2 focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="education" className="text-sm font-medium">Education</Label>
                <div className="relative">
                  <GraduationCap className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="education"
                    value={profileData.education}
                    onChange={(e) => setProfileData({ ...profileData, education: e.target.value })}
                    placeholder="School, University, or field of study"
                    className="pl-12 rounded-2xl border-2 focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-medium">Tell us about yourself</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  placeholder="What makes you unique? What are you passionate about? What's your idea of a perfect day? Share a bit about your personality and what you're looking for in activities..."
                  className="rounded-2xl border-2 focus:border-primary transition-colors min-h-[120px] resize-none"
                  maxLength={500}
                />
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Make it personal and authentic</span>
                  <span>{profileData.bio.length}/500 characters</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-8">
            {/* Hero section */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                <CameraIcon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Show your authentic self</h3>
              <p className="text-muted-foreground">
                Add photos that capture your personality and the activities you love. Great photos help you connect with the right people!
              </p>
            </div>

            {profileData.photos.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                {profileData.photos.map((photo, index) => (
                  <div key={index} className="relative aspect-[3/4] rounded-2xl overflow-hidden group">
                    <img src={photo} alt={`Profile ${index + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <button
                      onClick={() => {
                        const newPhotos = profileData.photos.filter((_, i) => i !== index);
                        setProfileData({ ...profileData, photos: newPhotos });
                      }}
                      className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-3 left-3 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                        Main Photo
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <Card className="border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Add Your Best Photos</h4>
                <p className="text-muted-foreground text-sm mb-6">
                  Show yourself doing activities you love, traveling, or just being you. Avoid group photos where you're hard to identify.
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    const compressed: string[] = [];
                    for (const f of files) {
                      try {
                        const data = await readAndCompressFile(f, 320, 0.7);
                        compressed.push(data);
                      } catch {}
                    }
                    setProfileData((prev) => ({
                      ...prev,
                      photos: [...prev.photos, ...compressed].slice(0, 6),
                    }));
                    e.currentTarget.value = "";
                  }}
                  className="hidden"
                  id="photo-upload"
                />
                <Button
                  type="button"
                  onClick={() => document.getElementById("photo-upload")?.click()}
                  className="rounded-2xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                  size="lg"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Choose Photos
                </Button>
              </CardContent>
            </Card>

            {profileData.photos.length > 0 && (
              <div className="text-center">
                <div className="inline-flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                  <Check className="w-4 h-4" />
                  <span>Looking great! You can add up to 6 photos</span>
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            {/* Hero section */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
                <Star className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Showcase your superpowers</h3>
              <p className="text-muted-foreground">
                What are you already amazing at? This helps us connect you with events where you can share your skills and meet people with similar talents.
              </p>
            </div>

            {/* Selected interests display */}
            {profileData.thingsYouDoGreat.length > 0 && (
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-primary">Your Superpowers</h4>
                    <Badge variant="secondary" className="rounded-full">
                      {profileData.thingsYouDoGreat.length}/10
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profileData.thingsYouDoGreat.map((interest) => (
                      <Badge
                        key={interest}
                        className="px-4 py-2 rounded-full bg-gradient-to-r from-primary to-accent text-white cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => removeInterest(interest, 'great')}
                      >
                        {interest}
                        <X className="w-3 h-3 ml-2" />
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Minimum 3 required • Click any badge to remove
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Category selection */}
            <div className="space-y-4">
              <h4 className="font-semibold text-center">Choose a category to explore:</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(INTEREST_CATEGORIES).map(([key, category]) => {
                  const IconComponent = category.icon;
                  return (
                    <Button
                      key={key}
                      variant={selectedCategory === key ? "default" : "outline"}
                      onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                      className="h-auto p-4 rounded-2xl flex flex-col items-center space-y-2 hover:scale-105 transition-transform"
                    >
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white", category.color)}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium text-center">{category.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Interests for selected category */}
            {selectedCategory && (
              <Card className="border-2 border-muted">
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-4 flex items-center">
                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-white mr-2", INTEREST_CATEGORIES[selectedCategory].color)}>
                      {React.createElement(INTEREST_CATEGORIES[selectedCategory].icon, { className: "w-3 h-3" })}
                    </div>
                    {INTEREST_CATEGORIES[selectedCategory].label}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {INTEREST_CATEGORIES[selectedCategory].interests
                      .filter(interest => !profileData.thingsYouDoGreat.includes(interest) && !profileData.thingsYouWantToTry.includes(interest))
                      .map((interest) => (
                        <Button
                          key={interest}
                          variant="outline"
                          size="sm"
                          onClick={() => addInterest(interest, 'great')}
                          disabled={profileData.thingsYouDoGreat.length >= 10}
                          className="justify-start text-left rounded-xl hover:scale-105 transition-transform"
                        >
                          <Plus className="w-3 h-3 mr-2 text-green-500" />
                          {interest}
                        </Button>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            {/* Hero section */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">What's on your bucket list?</h3>
              <p className="text-muted-foreground">
                Tell us what you're excited to try! We'll show you events where you can learn new skills and step outside your comfort zone.
              </p>
            </div>

            {/* Selected interests display */}
            {profileData.thingsYouWantToTry.length > 0 && (
              <Card className="border-2 border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-red-700">Your Adventure List</h4>
                    <Badge variant="secondary" className="rounded-full">
                      {profileData.thingsYouWantToTry.length}/10
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profileData.thingsYouWantToTry.map((interest) => (
                      <Badge
                        key={interest}
                        className="px-4 py-2 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => removeInterest(interest, 'try')}
                      >
                        {interest}
                        <X className="w-3 h-3 ml-2" />
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Minimum 3 required • Click any badge to remove
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Category selection */}
            <div className="space-y-4">
              <h4 className="font-semibold text-center">Explore categories:</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(INTEREST_CATEGORIES).map(([key, category]) => {
                  const IconComponent = category.icon;
                  return (
                    <Button
                      key={key}
                      variant={selectedCategory === key ? "default" : "outline"}
                      onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                      className="h-auto p-4 rounded-2xl flex flex-col items-center space-y-2 hover:scale-105 transition-transform"
                    >
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white", category.color)}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium text-center">{category.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Interests for selected category */}
            {selectedCategory && (
              <Card className="border-2 border-muted">
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-4 flex items-center">
                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-white mr-2", INTEREST_CATEGORIES[selectedCategory].color)}>
                      {React.createElement(INTEREST_CATEGORIES[selectedCategory].icon, { className: "w-3 h-3" })}
                    </div>
                    {INTEREST_CATEGORIES[selectedCategory].label}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {INTEREST_CATEGORIES[selectedCategory].interests
                      .filter(interest => !profileData.thingsYouDoGreat.includes(interest) && !profileData.thingsYouWantToTry.includes(interest))
                      .map((interest) => (
                        <Button
                          key={interest}
                          variant="outline"
                          size="sm"
                          onClick={() => addInterest(interest, 'try')}
                          disabled={profileData.thingsYouWantToTry.length >= 10}
                          className="justify-start text-left rounded-xl hover:scale-105 transition-transform"
                        >
                          <Plus className="w-3 h-3 mr-2 text-red-500" />
                          {interest}
                        </Button>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            {/* Hero section */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                <Settings className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Perfect your experience</h3>
              <p className="text-muted-foreground">
                Tell us your preferences so we can curate the perfect activities for you.
              </p>
            </div>

            <div className="space-y-8">
              {/* Event Types */}
              <Card className="border-2 border-muted">
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-4 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-primary" />
                    What types of events interest you? *
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {EVENT_TYPES.map((eventType) => (
                      <Button
                        key={eventType.id}
                        variant={profileData.eventTypes.includes(eventType.id) ? "default" : "outline"}
                        onClick={() => toggleEventType(eventType.id)}
                        className="h-auto p-4 rounded-2xl flex flex-col items-center space-y-2 hover:scale-105 transition-transform"
                      >
                        <eventType.icon className="w-6 h-6" />
                        <span className="text-xs font-medium text-center">{eventType.label}</span>
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Select all that apply • You can change these later
                  </p>
                </CardContent>
              </Card>

              {/* Age Range */}
              <Card className="border-2 border-muted">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold flex items-center">
                        <Users className="w-5 h-5 mr-2 text-primary" />
                        Age range for events
                      </h4>
                      <Badge variant="secondary" className="rounded-full">
                        {profileData.ageRangePreference[0]} - {profileData.ageRangePreference[1]} years
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
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
                </CardContent>
              </Card>

              {/* Distance */}
              <Card className="border-2 border-muted">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold flex items-center">
                        <MapPin className="w-5 h-5 mr-2 text-primary" />
                        Maximum distance
                      </h4>
                      <Badge variant="secondary" className="rounded-full">
                        {profileData.maxDistance} miles
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
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
                </CardContent>
              </Card>

              {/* Group Size */}
              <Card className="border-2 border-muted">
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-primary" />
                    Preferred group size
                  </h4>
                  <div className="space-y-3">
                    {GROUP_SIZE_OPTIONS.map((option) => (
                      <div
                        key={option.id}
                        onClick={() => setProfileData({ ...profileData, groupSizePreference: option.id })}
                        className={cn(
                          "p-4 border-2 rounded-xl cursor-pointer transition-all hover:scale-105",
                          profileData.groupSizePreference === option.id 
                            ? "border-primary bg-primary/5" 
                            : "border-muted hover:border-primary/50"
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            "w-4 h-4 rounded-full border-2 transition-colors",
                            profileData.groupSizePreference === option.id 
                              ? "border-primary bg-primary" 
                              : "border-muted-foreground"
                          )}>
                            {profileData.groupSizePreference === option.id && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-muted-foreground">{option.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Time Preferences */}
              <Card className="border-2 border-muted">
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-primary" />
                    When do you prefer activities?
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {TIME_PREFERENCES.map((time) => (
                      <Button
                        key={time.id}
                        variant={profileData.timePreferences.includes(time.id) ? "default" : "outline"}
                        onClick={() => toggleTimePreference(time.id)}
                        className="h-auto p-4 rounded-2xl flex flex-col items-center space-y-2 hover:scale-105 transition-transform"
                      >
                        <span className="text-2xl">{time.icon}</span>
                        <span className="text-xs font-medium text-center">{time.label}</span>
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Select all that work for you • This helps us recommend events at the right times
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F5c6becf7cef04a3db5d3620ce9b103bd%2F2ddd6c77a8df4501aa9e8730dda91175?format=webp&width=800"
                alt="Trybe Logo"
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold">Create Your Profile</h1>
                <p className="text-sm text-muted-foreground">
                  Step {currentStep + 1} of {STEP_TITLES.length} • {STEP_DESCRIPTIONS[currentStep]}
                </p>
              </div>
            </div>
            
            {currentStep > 0 && (
              <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Progress</span>
              <span className="text-sm font-medium text-primary">
                {Math.round(((currentStep + 1) / STEP_TITLES.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / STEP_TITLES.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8 pb-16 max-w-2xl mx-auto">
        <div className={cn(
          "transition-all duration-300",
          isTransitioning ? "opacity-0 transform translate-y-4" : "opacity-100 transform translate-y-0"
        )}>
          <div className="mb-10">
            <h2 className="text-3xl font-bold mb-3">{STEP_TITLES[currentStep]}</h2>
            <p className="text-muted-foreground text-lg">{STEP_DESCRIPTIONS[currentStep]}</p>
          </div>

          {renderStep()}

          {/* Navigation */}
          <div className="mt-12 flex justify-between items-center">
            <div className="w-24">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handleBack} className="rounded-2xl px-6" size="lg">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
            </div>
            
            <Button
              onClick={currentStep === STEP_TITLES.length - 1 ? handleComplete : handleNext}
              disabled={!canProceed()}
              size="lg"
              className={cn(
                "rounded-2xl px-8 font-semibold transition-all hover:scale-105",
                currentStep === STEP_TITLES.length - 1
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg"
                  : "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              )}
            >
              {currentStep === STEP_TITLES.length - 1 ? (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Complete Profile
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Step indicators */}
          <div className="flex justify-center mt-8 space-x-2">
            {STEP_TITLES.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300",
                  index <= currentStep ? "bg-primary" : "bg-muted",
                  index === currentStep && "scale-125"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
