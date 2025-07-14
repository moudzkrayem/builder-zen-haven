import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Heart,
  RotateCcw,
  MapPin,
  Clock,
  Users,
  Camera,
  Settings,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for events with updated structure focused on events
const mockEvents = [
  {
    id: 1,
    eventName: "Coffee & Code Meetup",
    hostName: "Sarah Chen",
    hostAge: 24,
    description:
      "Looking for fellow developers to grab coffee and work on side projects together. Let's build something amazing! ☕️💻",
    location: "Downtown SF",
    date: "Today, 3:00 PM",
    attendees: 12,
    maxCapacity: 15,
    fee: "Free",
    hostImage:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop",
    eventImages: [
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=600&fit=crop",
      "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&h=600&fit=crop",
    ],
    interests: ["Tech", "Coffee", "Networking"],
  },
  {
    id: 2,
    eventName: "Sunset Hiking Adventure",
    hostName: "Alex Rivera",
    hostAge: 28,
    description:
      "Join me for a breathtaking sunset hike at Twin Peaks! Perfect for meeting new people and getting some exercise. All fitness levels welcome! 🌅⛰️",
    location: "Twin Peaks",
    date: "Tomorrow, 6:00 PM",
    attendees: 8,
    maxCapacity: 12,
    fee: "$10",
    hostImage:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    eventImages: [
      "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=600&fit=crop",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop",
    ],
    interests: ["Hiking", "Photography", "Fitness"],
  },
  {
    id: 3,
    eventName: "Art Gallery Opening",
    hostName: "Maya Patel",
    hostAge: 26,
    description:
      "Exclusive preview of the new contemporary art exhibition. Wine, cheese, and great conversations about creativity and inspiration! 🎨🍷",
    location: "SOMA Gallery",
    date: "Friday, 7:00 PM",
    attendees: 25,
    maxCapacity: 30,
    fee: "$25",
    hostImage:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    eventImages: [
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=600&fit=crop",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop",
    ],
    interests: ["Art", "Culture", "Wine"],
  },
];

export default function Swipe() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [animatingButton, setAnimatingButton] = useState<
    "like" | "nope" | null
  >(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const currentEvent = mockEvents[currentIndex];

  const handleSwipe = (direction: "left" | "right", fromButton = false) => {
    if (fromButton) {
      setAnimatingButton(direction === "left" ? "nope" : "like");
      setTimeout(() => setAnimatingButton(null), 300);
    }

    if (currentIndex < mockEvents.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsExpanded(false);
      setCurrentPhotoIndex(0);
    }
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsExpanded(false);
      setCurrentPhotoIndex(0);
    }
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    setDragStart({ x: clientX, y: clientY });
    setIsDragging(true);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;

    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleDragEnd = () => {
    if (!isDragging) return;

    const threshold = 100;

    if (Math.abs(dragOffset.x) > threshold) {
      handleSwipe(dragOffset.x > 0 ? "right" : "left");
    }

    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleDragMove(e);
    const handleMouseUp = () => handleDragEnd();
    const handleTouchMove = (e: TouchEvent) => handleDragMove(e);
    const handleTouchEnd = () => handleDragEnd();

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, dragStart, dragOffset]);

  if (!currentEvent) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/10">
        <div className="text-center">
          <Heart className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            No more events!
          </h2>
          <p className="text-muted-foreground">
            Check back later for new experiences.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-gradient-to-br from-background via-accent/5 to-primary/5">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4">
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-full bg-black/20 text-white backdrop-blur-sm"
        >
          <Settings className="w-5 h-5" />
        </Button>
        <div className="text-white font-bold text-lg">Trybe</div>
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-full bg-black/20 text-white backdrop-blur-sm"
        >
          <Camera className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Card */}
      <div className="relative h-full pt-16 pb-24 px-4">
        <div
          ref={cardRef}
          className={cn(
            "relative w-full h-full bg-card rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 cursor-grab active:cursor-grabbing",
            isDragging && "scale-105",
          )}
          style={{
            transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.1}deg)`,
          }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          {/* Photo carousel */}
          <div className="relative h-full">
            <div className="absolute inset-0">
              <img
                src={currentEvent.eventImages[currentPhotoIndex]}
                alt={currentEvent.eventName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            </div>

            {/* Photo indicators */}
            {currentEvent.eventImages.length > 1 && (
              <div className="absolute top-4 left-4 right-4 flex space-x-1">
                {currentEvent.eventImages.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex-1 h-1 rounded-full transition-all duration-300",
                      index === currentPhotoIndex ? "bg-white" : "bg-white/30",
                    )}
                  />
                ))}
              </div>
            )}

            {/* Touch areas for photo navigation */}
            {currentEvent.eventImages.length > 1 && (
              <>
                <button
                  className="absolute left-0 top-20 bottom-32 w-1/2 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPhotoIndex(Math.max(0, currentPhotoIndex - 1));
                  }}
                />
                <button
                  className="absolute right-0 top-20 bottom-32 w-1/2 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPhotoIndex(
                      Math.min(
                        currentEvent.eventImages.length - 1,
                        currentPhotoIndex + 1,
                      ),
                    );
                  }}
                />
              </>
            )}

            {/* Host circle */}
            <div className="absolute top-6 left-6 flex items-center space-x-3 z-10">
              <img
                src={currentEvent.hostImage}
                alt={currentEvent.hostName}
                className="w-12 h-12 rounded-full border-2 border-white object-cover"
              />
              <div className="text-white">
                <div className="text-sm font-semibold">
                  {currentEvent.hostName}, {currentEvent.hostAge}
                </div>
                <div className="text-xs text-white/80">Host</div>
              </div>
            </div>

            {/* Event info overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-3xl font-bold mb-1">
                    {currentEvent.eventName}
                  </h2>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm"
                >
                  <span className="text-sm font-bold">
                    {isExpanded ? "−" : "+"}
                  </span>
                </button>
              </div>

              <div className="flex items-center space-x-4 mb-3 text-sm flex-wrap">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{currentEvent.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{currentEvent.date}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>
                    {currentEvent.attendees}/{currentEvent.maxCapacity}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-4 h-4" />
                  <span>{currentEvent.fee}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {currentEvent.interests.map((interest, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-white/20 text-white border-white/30"
                  >
                    {interest}
                  </Badge>
                ))}
              </div>

              {isExpanded && (
                <p className="text-white/90 text-sm leading-relaxed animate-bounce-in">
                  {currentEvent.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons - Updated without super like */}
      <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center space-x-8 px-8">
        <Button
          onClick={handleUndo}
          disabled={currentIndex === 0}
          size="icon"
          variant="outline"
          className="w-12 h-12 rounded-full bg-card shadow-lg border-2 hover:scale-110 transition-all duration-200 disabled:opacity-50"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>

        <Button
          onClick={() => handleSwipe("left")}
          size="icon"
          variant="outline"
          className="w-16 h-16 rounded-full bg-transparent border-2 border-primary text-primary shadow-lg hover:scale-110 transition-all duration-200 hover:bg-primary/10"
        >
          <X className="w-7 h-7" />
        </Button>

        <Button
          onClick={() => handleSwipe("right")}
          size="icon"
          className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:scale-110 transition-all duration-200"
        >
          <Heart className="w-7 h-7 fill-current" />
        </Button>
      </div>

      {/* Swipe indicators */}
      {isDragging && Math.abs(dragOffset.x) > 50 && (
        <div
          className={cn(
            "absolute top-1/2 transform -translate-y-1/2 text-4xl font-bold animate-pulse",
            dragOffset.x > 0 ? "right-8 text-primary" : "left-8 text-primary",
          )}
        >
          {dragOffset.x > 0 ? "JOIN TRYBE" : "NOPE"}
        </div>
      )}
    </div>
  );
}
