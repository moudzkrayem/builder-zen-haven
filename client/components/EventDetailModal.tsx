import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEvents } from "@/contexts/EventsContext";
import {
  X,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Heart,
  Star,
  UserPlus,
  Check,
  Calendar,
  Share,
  Info,
  Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";
import EditEventModal from "@/components/EditEventModal";
import { getFirestore, doc as firestoreDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string | number | null;
}

export default function EventDetailModal({ isOpen, onClose, eventId }: EventDetailModalProps) {
  const {
    events,
    joinEvent,
    leaveEvent,
    joinedEvents,
    addConnection,
    isConnected,
    getUserRating,
    rateEvent,
    rateHost,
    getHostRating,
    canRateEvent,
    isEventFinished,
    updateEvent
  } = useEvents();

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showEdit, setShowEdit] = useState(false);
  const [creatorData, setCreatorData] = useState<{ name: string; photoURL: string } | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  // Body scroll lock while event detail modal is open (ref-counted to support nested modals)
  useEffect(() => {
    const w = window as any;
    w.__modalOpenCount = w.__modalOpenCount || 0;
    if (isOpen) {
      w.__modalOpenCount += 1;
      if (w.__modalOpenCount === 1) document.body.style.overflow = 'hidden';
    }
    return () => {
      if (isOpen) {
        w.__modalOpenCount = Math.max(0, (w.__modalOpenCount || 1) - 1);
        if (w.__modalOpenCount === 0) document.body.style.overflow = '';
      }
    };
  }, [isOpen]);

  // Fetch creator's profile data from Firestore
  useEffect(() => {
    if (!isOpen || !eventId) {
      setCreatorData(null);
      return;
    }

    const event = events.find(e => String(e.id) === String(eventId));
    if (!event) {
      console.log('EventDetailModal: Event not found', eventId);
      return;
    }

    console.log('EventDetailModal: Event data:', event);

    const createdBy = (event as any).createdBy;
    if (!createdBy) {
      console.log('EventDetailModal: No createdBy field for event', eventId, 'trying createdByImage/createdByName from event');
      // Fallback to event's embedded creator data if available
      const fallbackName = (event as any).createdByName || (event as any).hostName || event.host || 'Unknown Host';
      const fallbackImage = (event as any).createdByImage || (event as any).hostImage || '';
      setCreatorData({
        name: fallbackName,
        photoURL: fallbackImage
      });
      return;
    }

    // Fetch creator profile from Firestore
    (async () => {
      try {
        console.log('EventDetailModal: Fetching user data for createdBy:', createdBy);
        
        // Check if creator is the current user - use their cached data first
        const currentUser = (await import('@/auth')).auth.currentUser;
        if (currentUser && currentUser.uid === createdBy) {
          console.log('EventDetailModal: Creator is current user, using cached profile');
          // Keep name as "You" but get the photo
          const name = 'You';
          let photoURL = '';
          
          try {
            const userProfile = localStorage.getItem('userProfile');
            if (userProfile) {
              const profile = JSON.parse(userProfile);
              photoURL = profile.photoURL || (profile.photos && profile.photos[0]) || '';
            }
          } catch (e) {
            console.log('EventDetailModal: Failed to parse userProfile from localStorage');
          }
          
          // Fallback to Firebase Auth photo
          if (!photoURL && currentUser.photoURL) {
            photoURL = currentUser.photoURL;
          }
          
          setCreatorData({ name, photoURL });
          console.log('EventDetailModal: Using current user data:', { name, photoURL });
          return;
        }
        
        const userDoc = await getDoc(firestoreDoc(db, 'users', createdBy));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Try multiple field names for name
          const name = userData.displayName 
            || userData.name 
            || (userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : '')
            || userData.firstName
            || userData.lastName
            || 'Unknown User';
          
          // Try multiple field names for photo
          const photoURL = userData.photoURL 
            || userData.profileImage 
            || (userData.photos && userData.photos.length > 0 ? userData.photos[0] : '')
            || '';
          
          setCreatorData({
            name,
            photoURL
          });
          console.log('EventDetailModal: Fetched creator data:', { name, photoURL, userData });
        } else {
          console.log('EventDetailModal: Creator user document not found for', createdBy);
          // Try fallback to event's embedded creator data
          const fallbackName = (event as any).createdByName || (event as any).hostName || event.host || 'Unknown Host';
          const fallbackImage = (event as any).createdByImage || (event as any).hostImage || '';
          setCreatorData({
            name: fallbackName,
            photoURL: fallbackImage
          });
        }
      } catch (err) {
        console.error('EventDetailModal: Failed to fetch creator data:', err);
        // Try fallback to event's embedded creator data
        const fallbackName = (event as any).createdByName || (event as any).hostName || event.host || 'Unknown Host';
        const fallbackImage = (event as any).createdByImage || (event as any).hostImage || '';
        setCreatorData({
          name: fallbackName,
          photoURL: fallbackImage
        });
      }
    })();
  }, [isOpen, eventId, events]);

  // Early returns AFTER all hooks
  if (!isOpen || eventId == null) return null;

  const event = events.find(e => String(e.id) === String(eventId));
  if (!event) return null;
  
  const isJoined = joinedEvents.map(String).includes(String(event.id));
  const eventImages = event.eventImages || [event.image];

  // Build Google Maps URL candidates (try multiple formats for best accuracy)
  const placeId = (event as any).placeId || (event as any).formattedPlaceId || (event as any).place_id;
  const coords = (event as any).locationCoords || (event as any).coords;
  const address = event.location || (event as any).formattedAddress || '';

  const candidates: string[] = [];

  // Prefer precise coordinates first (most reliable). Add a sanity check for lat/lng
  if (coords) {
    const rawLat = Number((coords as any).lat);
    const rawLng = Number((coords as any).lng);
    if (!isNaN(rawLat) && !isNaN(rawLng)) {
      let lat = rawLat;
      let lng = rawLng;
      // Sanity: if lat is out of bounds, maybe coords were stored as {lng, lat} or swapped strings
      const latOutOfRange = lat < -90 || lat > 90;
      const lngOutOfRange = lng < -180 || lng > 180;
      if (latOutOfRange && !lngOutOfRange) {
        // swap
        [lat, lng] = [lng, lat];
      }

      candidates.push(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
      candidates.push(`https://www.google.com/maps/@${lat},${lng},15z`);
    }
  }

  // Then try place_id formats (some place IDs work better with different URL shapes)
  if (placeId) {
    candidates.push(`https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`);
    candidates.push(`https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(placeId)}`);
  }

  // Finally fall back to the human-readable address
  if (address) {
    candidates.push(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`);
  }

  // Fallback: empty maps search
  if (candidates.length === 0) candidates.push('https://www.google.com/maps');
  // Use the 3rd candidate when available (index 2), otherwise fall back to the first candidate.
  const mapUrl = candidates[2] ?? candidates[0];

  const handleJoinToggle = () => {
    if (isJoined) {
      leaveEvent(event.id as any);
    } else {
      joinEvent(event.id as any);
    }
  };

  const handleConnect = () => {
    addConnection(event.id as any);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.eventName || event.name,
        text: `Check out this event: ${event.eventName || event.name} at ${event.location}`,
        url: window.location.href,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(
        `Check out this event: ${event.eventName || event.name} at ${event.location} - ${window.location.href}`
      );
      // You could add a toast notification here
      alert('Event link copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-x-0 top-0 bottom-20 z-50 bg-background/80 backdrop-blur-sm">
      <div className="absolute inset-x-4 top-4 bottom-4 bg-card rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <h2 className="text-lg font-bold">Event Details</h2>
          <div className="flex items-center space-x-2">
            {(event.hostName === 'You' || event.host === 'You') && (
              <Button variant="ghost" size="icon" onClick={() => setShowEdit(true)} className="rounded-full">
                <Pencil className="w-5 h-5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-full">
              <Share className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

  {/* Content */}
  <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' as any }}>
          {/* Event Images */}
          <div 
            className="relative h-64 cursor-pointer"
            onClick={() => {
              setImageViewerIndex(currentPhotoIndex);
              setShowImageViewer(true);
            }}
          >
            <img
              src={eventImages[currentPhotoIndex]}
              alt={event.eventName || event.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            
            {/* Photo navigation dots */}
            {eventImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {eventImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      index === currentPhotoIndex ? "bg-white" : "bg-white/50"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Host info overlay */}
            {creatorData && (
              <div className="absolute top-4 left-4 flex items-center space-x-3">
                {creatorData.photoURL ? (
                  <img
                    src={creatorData.photoURL}
                    alt={creatorData.name}
                    className="w-12 h-12 rounded-full border-2 border-white object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full border-2 border-white bg-primary/20 flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {creatorData.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="text-white">
                  <div className="text-sm font-semibold">
                    {creatorData.name}
                  </div>
                  <div className="text-xs text-white/80">Host</div>
                </div>
              </div>
            )}
          </div>

          {/* Event Information */}
          <div className="p-6 space-y-6">
            {/* Title and basic info */}
            <div>
              <h1 className="text-2xl font-bold mb-2">{event.eventName || event.name}</h1>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center space-x-1">
                    {/* Wrap the pin + address in a single anchor so the whole area is clickable */}
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 underline text-sm text-muted-foreground max-w-full cursor-pointer"
                      aria-label={`Open ${event.location} in Google Maps`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          if (mapUrl) window.open(mapUrl, '_blank');
                        } catch (err) {}
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          try { if (mapUrl) window.open(mapUrl, '_blank'); } catch (err) {}
                        }
                      }}
                      role="link"
                      tabIndex={0}
                    >
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="break-words max-w-full">{event.location}</span>
                    </a>
                    
                  </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{event.date}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{event.attendees}/{event.maxCapacity} attendees</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span>{event.fee}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {event.category}
                </Badge>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <Info className="w-4 h-4 mr-2" />
                  About this event
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {event.description}
                </p>
              </div>
            )}

            {/* Interests/Tags */}
            {event.interests && event.interests.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">What to expect</h3>
                <div className="flex flex-wrap gap-2">
                  {event.interests.map((interest, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Ratings are intentionally shown only in Profile → Previous Events. Removed from event detail modal. */}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border bg-muted/20">
          <div className="space-y-3">
            {/* Main action button */}
            <Button 
              onClick={handleJoinToggle}
              className={cn(
                "w-full h-12 rounded-xl font-semibold",
                isJoined 
                  ? "bg-red-500 hover:bg-red-600 text-white" 
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              )}
            >
              {isJoined ? (
                <>
                  <Calendar className="w-5 h-5 mr-2" />
                  Leave Event
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5 mr-2" />
                  Join Trybe
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Image Carousel Popup */}
      {showImageViewer && (
        <div 
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 py-20 md:py-4"
          onClick={() => setShowImageViewer(false)}
        >
          {/* Carousel Card */}
          <div 
            className="relative bg-card rounded-3xl shadow-2xl overflow-hidden w-full max-w-4xl h-full md:h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border bg-card/95 backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <h3 className="font-semibold text-foreground truncate">
                  {event.eventName || event.name}
                </h3>
                {eventImages.length > 1 && (
                  <span className="flex-shrink-0 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {imageViewerIndex + 1} / {eventImages.length}
                  </span>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowImageViewer(false)}
                className="rounded-full flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Image Display Area */}
            <div className="relative flex-1 bg-muted overflow-hidden flex items-center justify-center p-4">
              <img
                src={eventImages[imageViewerIndex]}
                alt={`${event.eventName || event.name} - Photo ${imageViewerIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg"
              />

              {/* Navigation Arrows for multiple images */}
              {eventImages.length > 1 && (
                <>
                  {/* Previous button */}
                  {imageViewerIndex > 0 && (
                    <button
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-all shadow-lg"
                      onClick={() => setImageViewerIndex(prev => prev - 1)}
                    >
                      <svg className="w-5 h-5 md:w-6 md:h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}

                  {/* Next button */}
                  {imageViewerIndex < eventImages.length - 1 && (
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-all shadow-lg"
                      onClick={() => setImageViewerIndex(prev => prev + 1)}
                    >
                      <svg className="w-5 h-5 md:w-6 md:h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Thumbnail Strip at bottom for multiple images */}
            {eventImages.length > 1 && (
              <div className="flex-shrink-0 p-4 bg-card/95 backdrop-blur-sm border-t border-border">
                <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                  {eventImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setImageViewerIndex(idx)}
                      className={cn(
                        "flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all",
                        idx === imageViewerIndex 
                          ? "border-primary ring-2 ring-primary/20 scale-105" 
                          : "border-border opacity-60 hover:opacity-100 hover:border-primary/50"
                      )}
                    >
                      <img 
                        src={img} 
                        alt={`Thumbnail ${idx + 1}`} 
                        className="w-full h-full object-cover" 
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <EditEventModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        event={event as any}
        onSave={(updates) => updateEvent(event.id as any, updates as any, true)}
      />
    </div>
  );
}
