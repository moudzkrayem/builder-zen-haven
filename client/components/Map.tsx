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
  const [zoom, setZoom] = useState<number>(1);

  // Keep selected distance (in km) for UI active state
  const [selectedKm, setSelectedKm] = useState<number>(50);
  // viewBounds controls mapping of lat/lng to screen percent so the map stays full-size
  const [viewBounds, setViewBounds] = useState<{ minLat: number; maxLat: number; minLng: number; maxLng: number } | null>(null);

  const zoomIn = () => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)));
  const fitZoom = () => setZoom(0.65);

  
  

  // Transform events for map display
  // Use real locationCoords when available, otherwise fall back to simulated grid positions
  const eventsWithCoords = events.map((event, index) => {
    const hasCoords = event && (event as any).locationCoords && typeof (event as any).locationCoords.lat === 'number' && typeof (event as any).locationCoords.lng === 'number';
    if (hasCoords) {
      return { ...event, _coordsSource: 'real', coordinates: { lat: (event as any).locationCoords.lat, lng: (event as any).locationCoords.lng } };
    }
    // simulated coordinates (for seeded events without real coords)
    return { ...event, _coordsSource: 'simulated', coordinates: { lat: 37.7749 + index * 0.01, lng: -122.4194 + index * 0.01 } };
  });

  // Compute bounding box of real coords (if any) to map lat/lng to percent positions inside the visual map
  const realCoords = eventsWithCoords.filter((e) => (e as any)._coordsSource === 'real').map((e) => (e as any).coordinates);

  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  if (realCoords.length > 0) {
    for (const c of realCoords) {
      if (c.lat < minLat) minLat = c.lat;
      if (c.lat > maxLat) maxLat = c.lat;
      if (c.lng < minLng) minLng = c.lng;
      if (c.lng > maxLng) maxLng = c.lng;
    }
    // add small padding so markers aren't at extreme edges
    const latPad = Math.max(0.01, (maxLat - minLat) * 0.15);
    const lngPad = Math.max(0.01, (maxLng - minLng) * 0.15);
    minLat -= latPad; maxLat += latPad; minLng -= lngPad; maxLng += lngPad;
  }

    // Nearby filtering: show only events within this radius (km) when userLocation is available
    const [showAll, setShowAll] = useState<boolean>(false);
  // Make radius configurable by the UI (units are km)
  const [nearbyRadiusKm, setNearbyRadiusKm] = useState<number>(50); // default 50 km

    // Fit-to-bounds: compute bounding box that includes event markers and user location +/- radius
    const computeAndFitBounds = (radiusKm: number, userLoc?: {lat:number,lng:number}) => {
      // start from candidateRealCoords (events) and optionally include user bounds
      const pts = candidateRealCoords.slice();
      if (userLoc) {
        // Convert radius km to degree deltas
        const latDelta = (radiusKm / 6371) * (180 / Math.PI); // approx
        const lngDelta = (radiusKm / (6371 * Math.cos((userLoc.lat * Math.PI) / 180))) * (180 / Math.PI);
        pts.push({ lat: userLoc.lat - latDelta, lng: userLoc.lng - lngDelta });
        pts.push({ lat: userLoc.lat + latDelta, lng: userLoc.lng + lngDelta });
      }

      if (pts.length === 0) return;

      let bMinLat = 90, bMaxLat = -90, bMinLng = 180, bMaxLng = -180;
      for (const p of pts) {
        if (p.lat < bMinLat) bMinLat = p.lat;
        if (p.lat > bMaxLat) bMaxLat = p.lat;
        if (p.lng < bMinLng) bMinLng = p.lng;
        if (p.lng > bMaxLng) bMaxLng = p.lng;
      }
      // small padding
      const padLat = Math.max(0.01, (bMaxLat - bMinLat) * 0.15);
      const padLng = Math.max(0.01, (bMaxLng - bMinLng) * 0.15);
      bMinLat -= padLat; bMaxLat += padLat; bMinLng -= padLng; bMaxLng += padLng;

      const latSpan = bMaxLat - bMinLat || 0.01;
      const lngSpan = bMaxLng - bMinLng || 0.01;

      // Set the view bounds for mapping lat/lng into the full map area
      setViewBounds({ minLat: bMinLat, maxLat: bMaxLat, minLng: bMinLng, maxLng: bMaxLng });
    };

    function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
      const toRad = (v: number) => (v * Math.PI) / 180;
      const R = 6371; // Earth's radius km
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

  // Decide which events to display: if user provided a location and hasn't toggled "showAll",
  // filter to events within the nearbyRadiusKm (only events with real coords can be matched).
  const hasUserLocation = !!userLocation;
  let candidateEvents = eventsWithCoords;
  if (hasUserLocation && !showAll) {
    candidateEvents = eventsWithCoords.filter((ev) => {
      const c = (ev as any).coordinates;
      if (!c || typeof c.lat !== 'number' || typeof c.lng !== 'number') return false;
      const d = haversineKm(userLocation!.lat, userLocation!.lng, c.lat, c.lng);
      return d <= nearbyRadiusKm;
    });
  }

  // Recompute bounding box from only the candidate events that have real coordinates
  const candidateRealCoords = candidateEvents.filter((e) => (e as any)._coordsSource === 'real').map((e) => (e as any).coordinates);
  let cMinLat = 90, cMaxLat = -90, cMinLng = 180, cMaxLng = -180;
  if (candidateRealCoords.length > 0) {
    for (const c of candidateRealCoords) {
      if (c.lat < cMinLat) cMinLat = c.lat;
      if (c.lat > cMaxLat) cMaxLat = c.lat;
      if (c.lng < cMinLng) cMinLng = c.lng;
      if (c.lng > cMaxLng) cMaxLng = c.lng;
    }
    const latPad = Math.max(0.01, (cMaxLat - cMinLat) * 0.15);
    const lngPad = Math.max(0.01, (cMaxLng - cMinLng) * 0.15);
    cMinLat -= latPad; cMaxLat += latPad; cMinLng -= lngPad; cMaxLng += lngPad;
  }

  const mapEvents = candidateEvents.map((event, index) => {
    const c = (event as any).coordinates;
    if ((event as any)._coordsSource === 'real' && (candidateRealCoords.length > 0 || viewBounds)) {
      const bounds = viewBounds ?? { minLat: cMinLat, maxLat: cMaxLat, minLng: cMinLng, maxLng: cMaxLng };
      const latSpan = bounds.maxLat - bounds.minLat || 0.01;
      const lngSpan = bounds.maxLng - bounds.minLng || 0.01;
      const topPercent = ((bounds.maxLat - c.lat) / latSpan) * 100;
      const leftPercent = ((c.lng - bounds.minLng) / lngSpan) * 100;
      return { ...event, _screenPos: { top: `${Math.min(98, Math.max(2, topPercent))}%`, left: `${Math.min(98, Math.max(2, leftPercent))}%` } };
    }
    // simulated or no coords: place them using the earlier layout scheme (but only when not filtering by nearby)
    return { ...event, _screenPos: { top: `${40 + index * 15}%`, left: `${30 + index * 20}%` } };
  });

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
        // After acquiring location, fit map to show user + nearby radius
        computeAndFitBounds(nearbyRadiusKm, { lat: position.coords.latitude, lng: position.coords.longitude });
        setIsLoadingLocation(false);
      },
      (error) => {
        let errorMessage = "Unable to retrieve location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permission for this site in your browser settings and try again.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        // Provide guidance so users know they must click the button to trigger the browser prompt
        setLocationError(errorMessage + ' Click the compass/refresh button to request location access.');
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // When this Map mounts, notify layout to hide the bottom navigation so the map has more room.
  useEffect(() => {
    try {
      window.dispatchEvent(new CustomEvent('layout:hideBottomNav', { detail: true }));
    } catch (err) {}
    return () => {
      try {
        window.dispatchEvent(new CustomEvent('layout:hideBottomNav', { detail: false }));
      } catch (err) {}
    };
    // run once on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // NOTE: Do NOT request geolocation on mount. Browsers may suppress permission
  // prompts when not triggered by a user gesture. Instead, request location only
  // when the user clicks the "Refresh location" / compass button which calls
  // `getCurrentLocation()`.

  const handleJoinEvent = (event: any) => {
    if (event.isPremium) {
      setPremiumEventName(event.eventName || event.name);
      setShowPremiumUpgradeModal(true);
    } else {
      joinEvent(event.id);
      setSelectedEvent(null);
    }
  };

  // Compute user's screen position (percent) using viewBounds when available
  let userScreenPos: { top: string; left: string } | null = null;
  if (userLocation && (candidateRealCoords.length > 0 || viewBounds)) {
    const bounds = viewBounds ?? { minLat: cMinLat, maxLat: cMaxLat, minLng: cMinLng, maxLng: cMaxLng };
    const latSpan = bounds.maxLat - bounds.minLat || 0.01;
    const lngSpan = bounds.maxLng - bounds.minLng || 0.01;
    const topPercent = ((bounds.maxLat - userLocation.lat) / latSpan) * 100;
    const leftPercent = ((userLocation.lng - bounds.minLng) / lngSpan) * 100;
    userScreenPos = { top: `${Math.min(98, Math.max(2, topPercent))}%`, left: `${Math.min(98, Math.max(2, leftPercent))}%` };
  }

  
  return (
    // Ensure map overlay sits above the bottom navigation and other fixed chrome.
    // Use a higher z-index than the BottomNavigation (z-50) and keep full-bleed background.
    <div className="fixed inset-0 z-[60] bg-background">
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
          {userLocation && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll((v) => !v)}
              className="mr-2"
            >
              {showAll ? 'Show nearby' : 'Show all'}
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Map area */}
      <div className="relative flex-1 h-[calc(100vh-80px)]">
        {/* Simulated map background */}
        <div className="w-full h-full relative overflow-hidden">
          {/* Apply zoom by scaling the inner map; transform-origin center keeps it centered */}
          <div className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 relative">
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
          {userLocation ? (
            // If we computed a screen position, place the marker there; otherwise center it
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={userScreenPos ? { top: userScreenPos.top, left: userScreenPos.left } : { top: '50%', left: '50%' }}
            >
              <div className={`w-4 h-4 rounded-full border-2 border-white shadow-lg bg-blue-500`}>
                <div className={`w-8 h-8 rounded-full absolute -top-2 -left-2 bg-blue-500/30 animate-pulse`} />
              </div>
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-center">
                <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                  You are here
                </div>
              </div>
            </div>
          ) : (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className={`w-4 h-4 rounded-full border-2 border-white shadow-lg bg-gray-400`}>
                <div className={`w-8 h-8 rounded-full absolute -top-2 -left-2 bg-gray-400/30`} />
              </div>
            </div>
          )}

          {/* Radius ring (visualizes selected nearby radius around the user) */}
          {userLocation && viewBounds && nearbyRadiusKm && userScreenPos && (
            (() => {
              try {
                const latDelta = (nearbyRadiusKm / 6371) * (180 / Math.PI);
                const lngDelta = (nearbyRadiusKm / (6371 * Math.cos((userLocation.lat * Math.PI) / 180))) * (180 / Math.PI);
                const bounds = viewBounds;
                const latSpan = bounds.maxLat - bounds.minLat || 0.01;
                const lngSpan = bounds.maxLng - bounds.minLng || 0.01;
                const diameterPercentX = (Math.abs(lngDelta) * 2 / lngSpan) * 100;
                const diameterPercentY = (Math.abs(latDelta) * 2 / latSpan) * 100;
                const diameterPercent = Math.max( Math.min(200, diameterPercentX), Math.min(200, diameterPercentY) );
                return (
                  <div
                    aria-hidden
                    className="absolute rounded-full pointer-events-none z-10"
                    style={{
                      top: userScreenPos.top,
                      left: userScreenPos.left,
                      width: `${diameterPercent}%`,
                      height: `${diameterPercent}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {/* ring background + border (more prominent): thicker dashed border and subtle fill matching app theme */}
                    <div className="absolute inset-0 rounded-full bg-primary/10" style={{ border: '3px solid', borderColor: 'rgba(59,130,246,0.35)', borderStyle: 'dashed' }} />
                    {/* label showing selected distance */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-card/90 text-xs text-foreground px-2 py-1 rounded-full shadow z-20">
                      {selectedKm} km
                    </div>
                  </div>
                );
              } catch (err) {
                return null;
              }
            })()
          )}

          {/* Event markers */}
          {mapEvents.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-card/80 p-4 rounded-lg border border-border text-center">
                <div className="font-medium mb-2">No nearby Trybes found</div>
                <div className="text-sm text-muted-foreground mb-3">There are no Trybes within {Math.round(nearbyRadiusKm)} km of your location.</div>
                <div className="flex justify-center">
                  <Button size="sm" onClick={() => setShowAll(true)}>Show all Trybes</Button>
                </div>
              </div>
            </div>
          )}
          {mapEvents.length > 0 && mapEvents.map((event, index) => (
            <button
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
              style={{
                top: (event as any)._screenPos?.top || `${40 + index * 15}%`,
                left: (event as any)._screenPos?.left || `${30 + index * 20}%`,
              }}
            >
              <div className="relative">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white",
                  event.isPremium
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                    : "bg-primary"
                )}>
                  <MapPin className="w-4 h-4 text-white" />
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
        </div>

        {/* Event details popup */}
        {selectedEvent && (
          // Ensure popup is visually above the bottom navigation and always shows
          // its action buttons on laptop/desktop. Use a higher z-index and a
          // larger bottom offset to avoid overlap with the nav (h-20).
          <div className="absolute bottom-[6rem] left-1/2 transform -translate-x-1/2 w-[calc(100%-2rem)] md:w-[720px] max-w-[92%] bg-card rounded-2xl p-4 shadow-lg border border-border z-[70]">
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
                onClick={() => handleJoinEvent(selectedEvent)}
                disabled={!selectedEvent.isPremium && joinedEvents.includes(selectedEvent.id)}
                className={cn(
                  "flex-1",
                  selectedEvent.isPremium
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                    : joinedEvents.includes(selectedEvent.id)
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                )}
              >
                {selectedEvent.isPremium ? (
                  "Premium"
                ) : joinedEvents.includes(selectedEvent.id) ? (
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
            {[1, 50, 100].map((m) => (
              <Button
                key={m}
                variant="outline"
                size="sm"
                className={cn("h-8 px-3 text-xs", selectedKm === m ? "bg-primary text-primary-foreground" : "")}
                onClick={() => {
                  const km = m; // now m represents kilometers directly
                  setNearbyRadiusKm(km);
                  setSelectedKm(m);
                  setShowAll(false);
                  if (userLocation) computeAndFitBounds(km, userLocation);
                }}
              >
                {m} km
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

      {/* Premium Upgrade Modal */}
      <PremiumUpgradeModal
        isOpen={showPremiumUpgradeModal}
        onClose={() => {
          setShowPremiumUpgradeModal(false);
          setPremiumEventName("");
        }}
        eventName={premiumEventName}
      />
    </div>
  );
}
