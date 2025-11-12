import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEvents } from "@/contexts/EventsContext";
import PremiumUpgradeModal from "./PremiumUpgradeModal";
import { X, MapPin, Users, DollarSign, Clock, Navigation, Check } from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google: any;
  }
}

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
  const [nearbyRadiusKm, setNearbyRadiusKm] = useState<number>(50);
  const [selectedKm, setSelectedKm] = useState<number>(50);
  const [showAll, setShowAll] = useState<boolean>(false);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const radiusCircleRef = useRef<any>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  const eventsWithCoords = events.filter((event: any) => 
    event.locationCoords && 
    typeof event.locationCoords.lat === 'number' && 
    typeof event.locationCoords.lng === 'number'
  );

  function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + 
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const filteredEvents = !userLocation || showAll 
    ? eventsWithCoords 
    : eventsWithCoords.filter((event: any) => {
        const d = haversineKm(userLocation.lat, userLocation.lng, event.locationCoords.lat, event.locationCoords.lng);
        return d <= nearbyRadiusKm;
      });

  // Load Google Maps script
  useEffect(() => {
    if (window.google?.maps?.Map) {
      setMapsLoaded(true);
      return;
    }
    
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key not configured');
      return;
    }

    const callbackName = 'initGoogleMaps_' + Date.now();
    (window as any)[callbackName] = () => {
      if (window.google?.maps?.Map) {
        setMapsLoaded(true);
        delete (window as any)[callbackName];
      }
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    
    script.onerror = () => {
      console.error('Failed to load Google Maps script');
      delete (window as any)[callbackName];
    };
    
    document.head.appendChild(script);

    return () => {
      delete (window as any)[callbackName];
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize Google Map
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || googleMapRef.current) return;
    
    try {
      const defaultCenter = eventsWithCoords.length > 0 
        ? { lat: eventsWithCoords[0].locationCoords.lat, lng: eventsWithCoords[0].locationCoords.lng }
        : { lat: 33.8938, lng: 35.5018 };

      // Dark theme styles for Google Maps
      const darkMapStyles = [
        { elementType: "geometry", stylers: [{ color: "#212121" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        {
          featureType: "administrative.locality",
          elementType: "labels.text.fill",
          stylers: [{ color: "#d59563" }],
        },
        {
          featureType: "poi",
          elementType: "labels.text.fill",
          stylers: [{ color: "#d59563" }],
        },
        {
          featureType: "poi.park",
          elementType: "geometry",
          stylers: [{ color: "#181818" }],
        },
        {
          featureType: "poi.park",
          elementType: "labels.text.fill",
          stylers: [{ color: "#616161" }],
        },
        {
          featureType: "poi.park",
          elementType: "labels.text.stroke",
          stylers: [{ color: "#1b1b1b" }],
        },
        {
          featureType: "road",
          elementType: "geometry.fill",
          stylers: [{ color: "#2c2c2c" }],
        },
        {
          featureType: "road",
          elementType: "labels.text.fill",
          stylers: [{ color: "#8a8a8a" }],
        },
        {
          featureType: "road.arterial",
          elementType: "geometry",
          stylers: [{ color: "#373737" }],
        },
        {
          featureType: "road.highway",
          elementType: "geometry",
          stylers: [{ color: "#3c3c3c" }],
        },
        {
          featureType: "road.highway.controlled_access",
          elementType: "geometry",
          stylers: [{ color: "#4e4e4e" }],
        },
        {
          featureType: "road.local",
          elementType: "labels.text.fill",
          stylers: [{ color: "#616161" }],
        },
        {
          featureType: "transit",
          elementType: "labels.text.fill",
          stylers: [{ color: "#757575" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#000000" }],
        },
        {
          featureType: "water",
          elementType: "labels.text.fill",
          stylers: [{ color: "#3d3d3d" }],
        },
      ];

      // Create styled map type for dark theme
      const styledMapType = new window.google.maps.StyledMapType(darkMapStyles, {
        name: 'Dark Theme'
      });

      googleMapRef.current = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 12,
        mapId: 'TRYBE_DARK_MAP', // Required for AdvancedMarkerElement
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
        gestureHandling: 'greedy',
        scrollwheel: true,
        keyboardShortcuts: true,
      });

      // Apply dark theme as custom map type
      googleMapRef.current.mapTypes.set('dark_theme', styledMapType);
      googleMapRef.current.setMapTypeId('dark_theme');
      
      console.log('Google Map initialized successfully with dark theme and mapId');
    } catch (error) {
      console.error('Error initializing Google Map:', error);
      setMapsLoaded(false);
    }
  }, [mapsLoaded, eventsWithCoords.length]);

  // Update markers when filtered events change
  useEffect(() => {
    if (!googleMapRef.current || !window.google?.maps || !mapsLoaded) return;
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    
    // Add markers for filtered events
    try {
      filteredEvents.forEach((event: any) => {
        // Create a blue pin marker element
        const pinElement = document.createElement('div');
        pinElement.style.cssText = `
          width: 20px;
          height: 20px;
          background: #3b82f6;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          cursor: pointer;
        `;
        
        let marker;
        if (window.google.maps.marker?.AdvancedMarkerElement) {
          // Use new AdvancedMarkerElement
          marker = new window.google.maps.marker.AdvancedMarkerElement({
            map: googleMapRef.current,
            position: { lat: event.locationCoords.lat, lng: event.locationCoords.lng },
            content: pinElement,
            title: event.eventName || event.name,
          });
          
          // Add click listener
          marker.addListener('click', () => { setSelectedEvent(event); });
        } else {
          // Fallback to old Marker
          marker = new window.google.maps.Marker({
            position: { lat: event.locationCoords.lat, lng: event.locationCoords.lng },
            map: googleMapRef.current,
            title: event.eventName || event.name,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#3b82f6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          });
          marker.addListener('click', () => { setSelectedEvent(event); });
        }
        
        markersRef.current.push(marker);
      });
    
      // Fit bounds to show all markers
      if (filteredEvents.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        filteredEvents.forEach((event: any) => {
          bounds.extend({ lat: event.locationCoords.lat, lng: event.locationCoords.lng });
        });
        if (userLocation) { bounds.extend(userLocation); }
        googleMapRef.current.fitBounds(bounds);
        const listener = window.google.maps.event.addListenerOnce(googleMapRef.current, 'bounds_changed', () => {
          const currentZoom = googleMapRef.current.getZoom();
          if (currentZoom > 15) { googleMapRef.current.setZoom(15); }
        });
      }
    } catch (error) {
      console.error('Error updating markers:', error);
    }
  }, [filteredEvents, userLocation, mapsLoaded]);

  // Update user location marker and radius circle
  useEffect(() => {
    if (!googleMapRef.current || !window.google || !mapsLoaded) return;
    
    // Remove existing user marker and circle
    if (userMarkerRef.current) { 
      userMarkerRef.current.setMap(null); 
    }
    if (radiusCircleRef.current) { 
      radiusCircleRef.current.setMap(null); 
    }
    
    if (userLocation) {
      // Create custom HTML marker with animation
      const markerDiv = document.createElement('div');
      markerDiv.style.width = '24px';
      markerDiv.style.height = '24px';
      markerDiv.style.position = 'relative';
      
      // Inner orange dot
      const innerDot = document.createElement('div');
      innerDot.style.cssText = `
        width: 16px;
        height: 16px;
        background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
        border: 3px solid white;
        border-radius: 50%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        box-shadow: 0 2px 8px rgba(249, 115, 22, 0.4);
        z-index: 2;
      `;
      
      // Pulsing ring animation
      const pulseRing = document.createElement('div');
      pulseRing.style.cssText = `
        width: 24px;
        height: 24px;
        background: rgba(249, 115, 22, 0.3);
        border-radius: 50%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        z-index: 1;
      `;
      
      // Add CSS animation keyframes if not already present
      if (!document.getElementById('map-marker-animation')) {
        const style = document.createElement('style');
        style.id = 'map-marker-animation';
        style.textContent = `
          @keyframes pulse-ring {
            0%, 100% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 0.8;
            }
            50% {
              transform: translate(-50%, -50%) scale(2);
              opacity: 0;
            }
          }
        `;
        document.head.appendChild(style);
      }
      
      markerDiv.appendChild(pulseRing);
      markerDiv.appendChild(innerDot);
      
      // Create advanced marker (works with newer Google Maps API)
      if (window.google.maps.marker?.AdvancedMarkerElement) {
        userMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
          map: googleMapRef.current,
          position: userLocation,
          content: markerDiv,
          zIndex: 1000,
        });
      } else {
        // Fallback to regular marker with custom icon
        userMarkerRef.current = new window.google.maps.Marker({
          position: userLocation,
          map: googleMapRef.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#f97316',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          },
          zIndex: 1000,
        });
      }
      
      if (!showAll) {
        radiusCircleRef.current = new window.google.maps.Circle({
          map: googleMapRef.current,
          center: userLocation,
          radius: nearbyRadiusKm * 1000,
          fillColor: '#f97316',
          fillOpacity: 0.08,
          strokeColor: '#f97316',
          strokeOpacity: 0.3,
          strokeWeight: 2,
        });
      }
      
      // Center on user location
      googleMapRef.current.panTo(userLocation);
    }
  }, [userLocation, nearbyRadiusKm, showAll, mapsLoaded]);

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      setIsLoadingLocation(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(loc);
        setIsLoadingLocation(false);
        setShowAll(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationError("Failed to get location");
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleJoinEvent = async (event: any) => {
    // Check if already joined
    if (isEventJoined(event.id)) {
      console.log("Already joined event:", event.id);
      return;
    }
    
    // Check if premium and not joined
    if (event.isPremium) {
      setPremiumEventName(event.eventName || event.name);
      setShowPremiumUpgradeModal(true);
      return;
    }
    
    try {
      joinEvent(event.id);
      console.log("Joined event from map:", event.id);
      // Update selected event to show joined state immediately
      setSelectedEvent((prev: any) => prev ? { ...prev, isJoined: true } : null);
    } catch (error) {
      console.error("Failed to join event:", error);
    }
  };

  const handleDistanceSelect = (km: number) => {
    setSelectedKm(km);
    setNearbyRadiusKm(km);
    setShowAll(false);
  };

  const handleShowAll = () => {
    setShowAll(true);
    setSelectedKm(0);
  };

  const isEventJoined = (eventId: string) => {
    return joinedEvents.some((e: any) => e.id === eventId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col" style={{ 
      overflow: 'hidden',
      msOverflowStyle: 'none',
      scrollbarWidth: 'none'
    }}>
      <style>{`
        .fixed.inset-0::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <h2 className="text-xl font-bold">Browse Trybes</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 flex relative flex-col md:flex-row" style={{ overflow: 'hidden' }}>
        {/* Map */}
        <div 
          ref={mapRef} 
          className="flex-1 bg-muted relative order-2 md:order-1"
          style={{ 
            overflow: 'hidden',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            minHeight: '50vh'
          }}
        />

        {/* Sidebar */}
        <div className="w-full md:w-80 border-t md:border-l md:border-t-0 bg-card overflow-y-auto order-1 md:order-2 max-h-[35vh] md:max-h-none">
          <div className="p-4 space-y-4 pb-24 md:pb-4">
            {/* Location Button */}
            <Button 
              onClick={getCurrentLocation} 
              disabled={isLoadingLocation}
              className="w-full"
              variant="default"
            >
              <Navigation className="h-4 w-4 mr-2" />
              {isLoadingLocation ? "Getting Location..." : userLocation ? "Update Location" : "Enable Location"}
            </Button>

            {/* Distance Filters */}
            {userLocation && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Distance</p>
                <div className="flex flex-wrap gap-2">
                  {[1, 5, 10, 50].map((km) => (
                    <Button
                      key={km}
                      variant={selectedKm === km ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleDistanceSelect(km)}
                    >
                      {km} km
                    </Button>
                  ))}
                  <Button
                    variant={showAll ? "default" : "outline"}
                    size="sm"
                    onClick={handleShowAll}
                  >
                    Show All
                  </Button>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-xs">
              <p className="font-medium">Legend</p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>Your location</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Trybes</span>
              </div>
            </div>

            {/* Event List */}
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {filteredEvents.length} {filteredEvents.length === 1 ? 'Trybe' : 'Trybes'} Found
              </p>
              {filteredEvents.map((event: any) => {
                const joined = isEventJoined(event.id);
                const distance = userLocation 
                  ? haversineKm(userLocation.lat, userLocation.lng, event.locationCoords.lat, event.locationCoords.lng)
                  : null;
                
                return (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors",
                      selectedEvent?.id === event.id && "bg-accent"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{event.eventName || event.name}</h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{event.location}</span>
                        </div>
                        {distance !== null && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {distance.toFixed(1)} km away
                          </p>
                        )}
                      </div>
                      {joined && (
                        <Badge variant="secondary" className="ml-2">
                          <Check className="h-3 w-3 mr-1" />
                          Joined
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="absolute bottom-24 left-4 right-4 md:left-4 md:right-80 md:bottom-20 bg-card border rounded-xl shadow-lg p-4 max-w-md z-10 max-h-[60vh] overflow-y-auto">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-bold text-lg">{selectedEvent.eventName || selectedEvent.name}</h3>
              <Badge variant="secondary" className="mt-1">{selectedEvent.category}</Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedEvent(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{selectedEvent.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{selectedEvent.date} at {selectedEvent.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{selectedEvent.attendees || 0} attending</span>
            </div>
            {selectedEvent.isPremium && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>Premium Event</span>
              </div>
            )}
          </div>

          {selectedEvent.description && (
            <p className="text-sm text-muted-foreground mt-3">{selectedEvent.description}</p>
          )}

          <Button 
            onClick={() => handleJoinEvent(selectedEvent)}
            disabled={isEventJoined(selectedEvent.id)}
            className="w-full mt-4 mb-2"
          >
            {isEventJoined(selectedEvent.id) ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Joined
              </>
            ) : (
              "Join Trybe"
            )}
          </Button>
        </div>
      )}

      {/* Loading State */}
      {!mapsLoaded && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}

      {/* Location Error */}
      {locationError && (
        <div className="absolute top-20 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto bg-destructive/10 border border-destructive/20 rounded-xl p-3 z-10">
          <div className="text-sm text-destructive font-medium">{locationError}</div>
          <Button variant="outline" size="sm" onClick={getCurrentLocation} className="mt-2 text-xs h-7">Try Again</Button>
        </div>
      )}

      <PremiumUpgradeModal 
        isOpen={showPremiumUpgradeModal}
        onClose={() => { setShowPremiumUpgradeModal(false); setPremiumEventName(""); }}
        eventName={premiumEventName} 
      />
    </div>
  );
}
