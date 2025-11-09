import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface LatLng {
  lat: number;
  lng: number;
}

interface MapPickerProps {
  apiKey?: string | null;
  initial?: LatLng | null;
  onSelect: (payload: { lat: number; lng: number; formattedAddress?: string; placeId?: string }) => void;
}

// Lightweight Google Maps + Places picker with graceful fallback to Geolocation.
export default function MapPicker({ apiKey, initial = null, onSelect }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [coords, setCoords] = useState<LatLng | null>(initial);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<{ label: string; lat: number; lng: number; placeId?: string; formattedAddress?: string } | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  const acServiceRef = useRef<any | null>(null);
  const placesServiceRef = useRef<any | null>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const markerRef = useRef<any | null>(null);

  // Prefer prop, otherwise read Vite env at build time.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const effectiveKey: string | undefined = apiKey ?? (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const countryRestriction: string | undefined = (import.meta as any).env?.VITE_GOOGLE_MAPS_COUNTRY;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const defaultCenterEnv: string | undefined = (import.meta as any).env?.VITE_GOOGLE_MAPS_DEFAULT_CENTER;

  const defaultCenterFromEnv = defaultCenterEnv
    ? (() => {
        const parts = String(defaultCenterEnv).split(',').map((s) => Number(s.trim()));
        if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) return { lat: parts[0], lng: parts[1] };
        return null;
      })()
    : null;

  const lebanonCenter = { lat: 33.8938, lng: 35.5018 };

  useEffect(() => {
    if (!effectiveKey) {
      setStatus('no-api-key');
      return;
    }

    // Load the Google Maps script if missing
    if (typeof (window as any).google === 'undefined') {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${effectiveKey}&libraries=places`;
      script.async = true;
      script.onload = () => initMap();
      script.onerror = () => setStatus('failed-to-load');
      document.head.appendChild(script);
    } else {
      initMap();
    }

    function initMap() {
      try {
        const google = (window as any).google;
        const chosenCenter = initial ?? defaultCenterFromEnv ?? (countryRestriction === 'lb' ? lebanonCenter : { lat: 37.7749, lng: -122.4194 });
        const map = new google.maps.Map(mapRef.current, {
          center: chosenCenter,
          zoom: countryRestriction === 'lb' ? 8 : 13,
        });

        mapInstanceRef.current = map;

        const marker = new google.maps.Marker({
          map,
          position: initial ?? undefined,
          draggable: true,
        });
        markerRef.current = marker;

        // Create Places services
        try {
          acServiceRef.current = new google.maps.places.AutocompleteService();
          placesServiceRef.current = new google.maps.places.PlacesService(map);
        } catch (err) {
          console.debug('[MapPicker] places services not available', err);
        }

        // When marker dragged, notify parent
        marker.addListener('dragend', (e: any) => {
          const p = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          setCoords(p);
          try {
            // reverse geocode for address if possible
            if (google && google.maps && google.maps.Geocoder) {
              const geocoder = new google.maps.Geocoder();
              geocoder.geocode({ location: p }, (results: any) => {
                if (results && results[0]) {
                  const payload = { lat: p.lat, lng: p.lng, formattedAddress: results[0].formatted_address };
                  safeSelect(payload);
                } else {
                  safeSelect({ lat: p.lat, lng: p.lng });
                }
              });
            } else {
              safeSelect({ lat: p.lat, lng: p.lng });
            }
          } catch (err) {
            safeSelect({ lat: p.lat, lng: p.lng });
          }
        });

        // When map clicked, move marker and select
        map.addListener('click', (e: any) => {
          const p = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          marker.setPosition(p);
          map.panTo(p);
          setCoords(p);
          // attempt reverse geocode
          try {
            if (google && google.maps && google.maps.Geocoder) {
              const geocoder = new google.maps.Geocoder();
              geocoder.geocode({ location: p }, (results: any) => {
                if (results && results[0]) {
                  safeSelect({ lat: p.lat, lng: p.lng, formattedAddress: results[0].formatted_address });
                } else {
                  safeSelect({ lat: p.lat, lng: p.lng });
                }
              });
            } else {
              safeSelect({ lat: p.lat, lng: p.lng });
            }
          } catch (err) {
            safeSelect({ lat: p.lat, lng: p.lng });
          }
        });
      } catch (err) {
        console.error('[MapPicker] init failed', err);
        setStatus('init-failed');
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveKey]);

  // Helper: call parent and dispatch fallback event safely
  function safeSelect(payload: { lat: number; lng: number; formattedAddress?: string; placeId?: string }) {
    try {
      onSelect(payload);
    } catch (e) {
      console.debug('[MapPicker] onSelect threw', e);
    }
    try {
      window.dispatchEvent(new CustomEvent('mappicker:select', { detail: payload }));
    } catch (e) {
      /* ignore */
    }
  }

  // Geolocation on user gesture
  const useGeolocation = () => {
    setStatus('getting-location');
    if (!navigator.geolocation) {
      setStatus('no-geolocation');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(p);
        if (markerRef.current) {
          markerRef.current.setPosition(p);
          if (mapInstanceRef.current) mapInstanceRef.current.panTo(p);
        }
        // try reverse geocode via Google if available
        if (typeof (window as any).google !== 'undefined') {
          try {
            const geocoder = new (window as any).google.maps.Geocoder();
            geocoder.geocode({ location: p }, (results: any) => {
              if (results && results[0]) {
                safeSelect({ lat: p.lat, lng: p.lng, formattedAddress: results[0].formatted_address });
                setSelectedPlace({ label: results[0].formatted_address, lat: p.lat, lng: p.lng, formattedAddress: results[0].formatted_address });
              } else {
                safeSelect({ lat: p.lat, lng: p.lng });
              }
            });
          } catch (err) {
            safeSelect({ lat: p.lat, lng: p.lng });
          }
        } else {
          safeSelect({ lat: p.lat, lng: p.lng });
        }
      },
      () => setStatus('geolocation-failed'),
      { enableHighAccuracy: true }
    );
  };

  // Watch searchTerm and fetch suggestions using AutocompleteService
  useEffect(() => {
    if (!searchTerm || !acServiceRef.current) {
      setSuggestions([]);
      setIsSuggestionsOpen(false);
      return;
    }

    const ac = acServiceRef.current;
    const map = mapInstanceRef.current;
    const bounds = map ? map.getBounds() : undefined;

    const request: any = {
      input: searchTerm,
      ...(countryRestriction ? { componentRestrictions: { country: countryRestriction } } : {}),
    };

    if (bounds) request.bounds = bounds;

    ac.getPlacePredictions(request, (preds: any[], status: string) => {
      if (!preds || preds.length === 0) {
        setSuggestions([]);
        setIsSuggestionsOpen(false);
        return;
      }
      setSuggestions(preds);
      setIsSuggestionsOpen(true);
      setHighlightedIndex(0);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // When a suggestion is selected, get details and set marker
  function handleSuggestionSelect(pred: any) {
    const places = placesServiceRef.current;
    const map = mapInstanceRef.current;
    // Close suggestions immediately and set the input to the chosen description so
    // the UI doesn't show the dropdown while we resolve place details.
    setIsSuggestionsOpen(false);
    setSuggestions([]);
    try {
      if (inputRef.current) inputRef.current.value = pred.description;
    } catch (e) {}
    if (!places) {
      // fallback to textSearch via PlacesService if available on window
      if (typeof (window as any).google !== 'undefined') {
        const ps = new (window as any).google.maps.places.PlacesService(map || document.createElement('div'));
        ps.textSearch({ query: pred.description, ...(countryRestriction ? { region: countryRestriction } : {}) }, (results: any[]) => {
          if (results && results[0] && results[0].geometry && results[0].geometry.location) {
            const loc = results[0].geometry.location;
            const p = { lat: loc.lat(), lng: loc.lng() };
            if (markerRef.current) markerRef.current.setPosition(p);
            if (map) {
              if (results[0].geometry.viewport) map.fitBounds(results[0].geometry.viewport);
              else map.setCenter(p), map.setZoom(17);
            }
            safeSelect({ lat: p.lat, lng: p.lng, formattedAddress: results[0].formatted_address, placeId: results[0].place_id });
            setSelectedPlace({ label: results[0].formatted_address || pred.description, lat: p.lat, lng: p.lng, placeId: results[0].place_id, formattedAddress: results[0].formatted_address });
            // ensure input/searchTerm reflect the resolved place
            setSearchTerm(results[0].formatted_address || pred.description);
            if (inputRef.current) inputRef.current.value = results[0].formatted_address || pred.description;
          }
        });
      }
      return;
    }

    places.getDetails({ placeId: pred.place_id }, (place: any, status: string) => {
      if (!place || !place.geometry) {
        return;
      }
      const loc = place.geometry.location;
      const p = { lat: loc.lat(), lng: loc.lng() };
      if (markerRef.current) markerRef.current.setPosition(p);
      if (map) {
        if (place.geometry.viewport) map.fitBounds(place.geometry.viewport);
        else map.setCenter(p), map.setZoom(17);
      }
      safeSelect({ lat: p.lat, lng: p.lng, formattedAddress: place.formatted_address, placeId: place.place_id });
  setSelectedPlace({ label: place.formatted_address || pred.description, lat: p.lat, lng: p.lng, placeId: place.place_id, formattedAddress: place.formatted_address });
      // ensure input/searchTerm reflect the resolved place
      setSearchTerm(place.formatted_address || pred.description);
      if (inputRef.current) inputRef.current.value = place.formatted_address || pred.description;
      // reset highlighted index
      setHighlightedIndex(null);
    });
  }

  // When highlightedIndex changes, ensure the highlighted element is scrolled into view
  useEffect(() => {
    if (highlightedIndex === null) return;
    const el = document.getElementById(`suggestion-${highlightedIndex}`);
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  return (
    <div className="space-y-2">
      <div className="relative w-full">
          <input
            ref={inputRef}
            className="w-full rounded-xl border border-input p-2 text-sm placeholder:text-muted-foreground bg-input"
            placeholder="Where will this happen? (search place or address)"
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => { if (suggestions.length) setIsSuggestionsOpen(true); }}
            onKeyDown={(e) => {
              if (!isSuggestionsOpen || suggestions.length === 0) {
                if (e.key === 'ArrowDown' && suggestions.length > 0) {
                  setIsSuggestionsOpen(true);
                  setHighlightedIndex(0);
                  e.preventDefault();
                }
                return;
              }
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedIndex((prev) => {
                  if (prev === null) return 0;
                  return Math.min(prev + 1, suggestions.length - 1);
                });
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedIndex((prev) => {
                  if (prev === null) return Math.max(0, suggestions.length - 1);
                  return Math.max(prev - 1, 0);
                });
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (highlightedIndex !== null && suggestions[highlightedIndex]) {
                  handleSuggestionSelect(suggestions[highlightedIndex]);
                }
              } else if (e.key === 'Escape') {
                setIsSuggestionsOpen(false);
              }
            }}
          />
          {isSuggestionsOpen && suggestions.length > 0 && (
            <ul className="absolute left-0 right-0 mt-1 max-h-60 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md z-50">
              {suggestions.map((s, idx) => (
                <li
                  id={`suggestion-${idx}`}
                  key={s.place_id || s.description}
                  role="option"
                  aria-selected={highlightedIndex === idx}
                  className={`px-3 py-2 cursor-pointer text-sm ${highlightedIndex === idx ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
                  onMouseDown={(ev) => {
                    // prevent input blur before click
                    ev.preventDefault();
                    handleSuggestionSelect(s);
                  }}
                >
                  {s.description}
                </li>
              ))}
            </ul>
          )}
          </div>

        <div ref={mapRef} className="w-full h-48 rounded-xl border border-input mt-3" />

        <div className="mt-3 flex justify-center">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={useGeolocation}
            className="bg-primary text-white font-semibold px-4 rounded-xl"
          >
            Use my location
          </Button>
        </div>

      {selectedPlace && (
        <div className="text-sm text-muted-foreground">
          <div className="font-medium">Selected place</div>
          <div className="text-xs">{selectedPlace.label}</div>
          <div className="text-xs">{selectedPlace.lat.toFixed(6)}, {selectedPlace.lng.toFixed(6)}</div>
        </div>
      )}

      {status && (
        <div className={`text-sm ${status.includes('failed') || status.includes('no-') ? 'text-destructive' : 'text-muted-foreground'}`}>
          {status === 'no-api-key' && 'Google Maps API key not found. Map search will be unavailable (you can still use your device location).'}
          {status === 'failed-to-load' && 'Failed to load Google Maps script. Check your API key and network.'}
          {status === 'getting-location' && 'Requesting device location...'}
          {status === 'geolocation-failed' && 'Failed to get device location (permission denied or timeout).'}
          {status === 'init-failed' && 'Google Maps initialization failed.'}
        </div>
      )}
    </div>
  );
}
