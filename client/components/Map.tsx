import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEvents } from "@/contexts/EventsContext";
import PremiumUpgradeModal from "./PremiumUpgradeModal";
import { X, MapPin, Users, DollarSign, Clock, Navigation, RefreshCw, Check } from "lucide-react";
import { cn } from "@/lib/utils";


interface MapProps {
  onClose: () => void;
}

export default function Map({ onClose }: MapProps) {
  const { events, joinEvent, joinedEvents } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showPremiumUpgradeModal, setShowPremiumUpgradeModal] = useState(false);
  const [premiumEventName, setPremiumEventName] = useState<string>("");

  // Transform events for map display
  const mapEvents = events.map((event, index) => ({
    ...event,
    coordinates: {
      lat: 37.7749 + (index * 0.01),
      lng: -122.4194 + (index * 0.01)
    },
    distance: `${(0.5 + index * 0.3).toFixed(1)} mi`,
  }));

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLoadingLocation(false);
      },
      (error) => {
        let errorMessage = "Unable to retrieve location";
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        setLocationError(errorMessage);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const handleJoinEvent = (event: any) => {
    if (event.isPremium) {
      setPremiumEventName(event.eventName || event.name);
      setShowPremiumUpgradeModal(true);
    } else {
      joinEvent(event.id);
      setSelectedEvent(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold">Nearby Trybes</h1>
          {userLocation && (
            <Badge variant="secondary" className="text-xs">
              <Navigation className="w-3 h-3 mr-1" />
              Live Location
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={getCurrentLocation}
            disabled={isLoadingLocation}
            title="Refresh location"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingLocation ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Map area */}
      <div className="relative flex-1 h-[calc(100vh-80px)]">
        {/* Simulated map background */}
        <div className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 relative overflow-hidden">
          {/* Grid pattern to simulate map */}
          <div className="absolute inset-0 opacity-20">
            <div className="grid grid-cols-8 grid-rows-12 h-full w-full">
              {Array.from({ length: 96 }).map((_, i) => (
                <div
                  key={i}
                  className="border border-gray-300 dark:border-gray-600"
                />
              ))}
            </div>
          </div>

          {/* Streets simulation */}
          <div className="absolute top-1/4 left-0 right-0 h-1 bg-gray-400 dark:bg-gray-600" />
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-400 dark:bg-gray-600" />
          <div className="absolute top-3/4 left-0 right-0 h-1 bg-gray-400 dark:bg-gray-600" />
          <div className="absolute top-0 bottom-0 left-1/4 w-1 bg-gray-400 dark:bg-gray-600" />
          <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-gray-400 dark:bg-gray-600" />
          <div className="absolute top-0 bottom-0 left-3/4 w-1 bg-gray-400 dark:bg-gray-600" />

          {/* Current location */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${userLocation ? 'bg-blue-500' : 'bg-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full absolute -top-2 -left-2 ${userLocation ? 'bg-blue-500/30 animate-pulse' : 'bg-gray-400/30'}`} />
            </div>
            {userLocation && (
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-center">
                <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                  You are here
                </div>
              </div>
            )}
          </div>

          {/* Event markers */}
          {mapEvents.map((event, index) => (
            <button
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
              style={{
                top: `${40 + index * 15}%`,
                left: `${30 + index * 20}%`,
              }}
            >
              <div className="relative">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  <MapPin className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {event.attendees}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Event details popup */}
        {selectedEvent && (
          <div className="absolute bottom-4 left-4 right-4 bg-card rounded-2xl p-4 shadow-lg border border-border">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground mb-1">
                  {selectedEvent.eventName || selectedEvent.name}
                </h3>
                <div className="flex items-center space-x-3 text-sm text-muted-foreground mb-2">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{selectedEvent.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{selectedEvent.date}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>
                      {selectedEvent.attendees}/{selectedEvent.maxCapacity}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-3 h-3" />
                    <span>{selectedEvent.fee}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {selectedEvent.category}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedEvent(null)}
                className="w-8 h-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                size="sm"
                onClick={() => handleJoinEvent(selectedEvent.id)}
                disabled={joinedEvents.includes(selectedEvent.id)}
                className={cn(
                  "flex-1",
                  joinedEvents.includes(selectedEvent.id)
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                )}
              >
                {joinedEvents.includes(selectedEvent.id) ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Joined
                  </>
                ) : (
                  "Join Trybe"
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}

        {/* Location error message */}
        {locationError && (
          <div className="absolute bottom-24 left-4 right-4 bg-destructive/10 border border-destructive/20 rounded-xl p-3">
            <div className="text-sm text-destructive font-medium">{locationError}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              className="mt-2 text-xs h-7"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Distance filter */}
        <div className="absolute top-4 left-4 bg-card rounded-xl p-3 shadow-lg border border-border">
          <div className="text-sm font-medium text-foreground mb-2">
            Distance
          </div>
          <div className="flex space-x-2">
            {["1 mi", "5 mi", "10 mi"].map((distance) => (
              <Button
                key={distance}
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
              >
                {distance}
              </Button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="absolute top-4 right-4 bg-card rounded-xl p-3 shadow-lg border border-border">
          <div className="text-sm font-medium text-foreground mb-2">Legend</div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${userLocation ? 'bg-blue-500' : 'bg-gray-400'}`} />
              <span className="text-muted-foreground">
                {userLocation ? 'Your location (live)' : 'Location unavailable'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full" />
              <span className="text-muted-foreground">Trybes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
