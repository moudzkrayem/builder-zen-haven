import { useState, useEffect, useRef } from "react";
import { auth, db, app } from "@/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { X, Edit3, Plus, MapPin, Briefcase, GraduationCap, User, Camera, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalPhotosInputRef = useRef<HTMLInputElement>(null);
  
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
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [additionalPhotos, setAdditionalPhotos] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<{ [index: number]: File }>({});
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Load existing photos from Firestore
  useEffect(() => {
    if (!isOpen) return;
    
    const loadPhotos = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfilePhoto(data.photoURL || data.photos?.[0] || "");
          setAdditionalPhotos(data.photos || []);
        }
      } catch (err) {
        console.warn("Failed to load photos:", err);
      }
    };
    
    loadPhotos();
  }, [isOpen]);

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

  // Convert file to data URL for preview
  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Handle profile photo change
  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create preview data URL
      const dataUrl = await fileToDataURL(file);
      
      // Update photos array: remove old profile photo if exists, add new one at start
      setAdditionalPhotos(prev => {
        const filtered = prev.filter(p => p !== profilePhoto);
        return [dataUrl, ...filtered];
      });
      
      setProfilePhoto(dataUrl);
      
      // Store the file object for later upload
      setPhotoFiles(prev => ({ ...prev, 0: file }));
      
      toast({
        title: "Photo selected",
        description: "Your profile photo will be uploaded when you save"
      });
    } catch (err) {
      console.error("Failed to process photo:", err);
      toast({
        title: "Upload failed",
        description: "Failed to process photo. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle additional photos
  const handleAdditionalPhotosChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check total photos limit (max 6 including profile photo)
    if (additionalPhotos.length + files.length > 6) {
      toast({
        title: "Too many photos",
        description: "You can upload a maximum of 6 photos",
        variant: "destructive"
      });
      return;
    }

    try {
      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error('Invalid file type');
        }
        // Validate file size
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('File too large');
        }
      }

      const dataUrlPromises = files.map(file => fileToDataURL(file));
      const dataUrls = await Promise.all(dataUrlPromises);
      
      const startIndex = additionalPhotos.length;
      setAdditionalPhotos(prev => [...prev, ...dataUrls]);
      
      // Store file objects for later upload
      const newFiles = { ...photoFiles };
      dataUrls.forEach((_, idx) => {
        newFiles[startIndex + idx] = files[idx];
      });
      setPhotoFiles(newFiles);
      
      toast({
        title: "Photos selected",
        description: `${files.length} photo(s) will be uploaded when you save`
      });
    } catch (err: any) {
      console.error("Failed to process photos:", err);
      toast({
        title: "Upload failed",
        description: err.message || "Failed to process photos. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Remove a photo
  const handleRemovePhoto = (photoUrl: string, index: number) => {
    setAdditionalPhotos(prev => prev.filter(p => p !== photoUrl));
    
    // Remove from file objects if it exists
    setPhotoFiles(prev => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
    
    // If removing the profile photo, set the next photo as profile
    if (photoUrl === profilePhoto) {
      const remaining = additionalPhotos.filter(p => p !== photoUrl);
      setProfilePhoto(remaining[0] || "");
    }
    
    toast({
      title: "Photo removed",
      description: "Photo has been removed from your profile"
    });
  };

  const removeInterest = (interest: string) => {
    setSelectedInterests(prev => prev.filter(i => i !== interest));
  };

  const handleSave = async () => {
    // Persist edits to Firestore users/{uid} and update localStorage.userProfile
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('You must be logged in to save your profile');
        return;
      }

      setIsUploadingPhoto(true);

      // Upload new photos to Firebase Storage
      const storage = getStorage(app);
      const uploadedPhotos: string[] = [...additionalPhotos];

      // Upload files from photoFiles map
      const entries = Object.entries(photoFiles);
      for (const [indexStr, file] of entries) {
        try {
          const index = Number(indexStr);
          const filename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
          const path = `users/${user.uid}/photos/${filename}`;
          const sRef = storageRef(storage, path);

          // Upload file
          await new Promise<void>((resolve, reject) => {
            const uploadTask = uploadBytesResumable(sRef, file);
            uploadTask.on(
              "state_changed",
              () => {}, // progress
              (err) => reject(err),
              () => resolve(),
            );
          });

          // Get download URL
          try {
            const url = await getDownloadURL(sRef);
            uploadedPhotos[index] = url;
          } catch (err) {
            // Fallback to storage path if URL fetch fails
            uploadedPhotos[index] = path;
          }
        } catch (err) {
          console.error("Failed to upload photo:", err);
          toast({
            title: "Photo upload failed",
            description: "Some photos failed to upload. Profile will be saved without them.",
            variant: "destructive"
          });
        }
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
        photoURL: uploadedPhotos[0] || '',
        photos: uploadedPhotos.slice(0, 6),
        updatedAt: new Date().toISOString(),
      };

      // Merge into Firestore user doc
      const userRef = doc(db, 'users', user.uid);
      // setDoc with merge true to avoid clobbering other fields
      await setDoc(userRef, payload, { merge: true }).then(async () => {
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
        
        // Clear photo files after successful save
        setPhotoFiles({});
        setIsUploadingPhoto(false);
        
        toast({
          title: "Profile updated",
          description: "Your profile has been saved successfully"
        });
        
        onClose();
      }).catch((err) => {
        console.error('Failed to save profile to Firestore', err);
        setIsUploadingPhoto(false);
        toast({
          title: "Save failed",
          description: "Failed to save profile. Please try again.",
          variant: "destructive"
        });
      });
    } catch (err) {
      console.error('EditProfileModal: unexpected save error', err);
      setIsUploadingPhoto(false);
      toast({
        title: "Error",
        description: "Failed to save profile.",
        variant: "destructive"
      });
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
          {/* Photo Management */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Camera className="w-5 h-5 mr-2 text-primary" />
              Profile Photos
            </h3>
            
            {/* Profile Photo */}
            <div className="mb-6">
              <label className="text-sm font-medium text-muted-foreground block mb-3">
                Main Profile Photo
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                  {profilePhoto ? (
                    <img 
                      src={profilePhoto} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground" />
                  )}
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePhotoChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="w-full sm:w-auto"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {profilePhoto ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Recommended: Square image, max 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Photos */}
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-3">
                Additional Photos (Max 6 total)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-3">
                {additionalPhotos.map((photo, index) => (
                  <div 
                    key={index} 
                    className="relative aspect-square rounded-xl overflow-hidden bg-muted group"
                  >
                    <img 
                      src={photo} 
                      alt={`Photo ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo, index)}
                      className="absolute top-1 right-1 p-1.5 bg-destructive/90 hover:bg-destructive text-destructive-foreground rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-1 left-1 right-1">
                        <Badge variant="secondary" className="w-full text-[10px] justify-center py-0.5">
                          Main
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Add Photo Button */}
                {additionalPhotos.length < 6 && (
                  <div>
                    <input
                      ref={additionalPhotosInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleAdditionalPhotosChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => additionalPhotosInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="aspect-square w-full rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-accent/50 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary"
                    >
                      <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span className="text-[10px] sm:text-xs font-medium">Add</span>
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {additionalPhotos.length}/6 photos • Click to remove • First photo is your main profile photo
              </p>
            </div>
          </div>

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
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={isUploadingPhoto}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1" disabled={isUploadingPhoto}>
              {isUploadingPhoto ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
