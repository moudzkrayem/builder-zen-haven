import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, MapPin, Users, DollarSign, Clock, Navigation, RefreshCw } from "lucide-react";

// Mock map data
const mapEvents = [
  {
    id: 1,
    name: "Coffee & Code Meetup",
    location: "Downtown SF",
    date: "Today, 3:00 PM",
    attendees: 12,
    maxCapacity: 15,
    fee: "Free",
    category: "Tech",
    coordinates: { lat: 37.7749, lng: -122.4194 },
    distance: "0.5 mi",
  },
  {
    id: 2,
    name: "Sunset Hiking",
    location: "Twin Peaks",
    date: "Tomorrow, 6:00 PM",
    attendees: 8,
    maxCapacity: 12,
    fee: "$10",
    category: "Fitness",
    coordinates: { lat: 37.7544, lng: -122.4477 },
    distance: "2.1 mi",
  },
  {
    id: 3,
    name: "Art Gallery Opening",
    location: "SOMA Gallery",
    date: "Friday, 7:00 PM",
    attendees: 25,
    maxCapacity: 30,
    fee: "$25",
    category: "Arts",
    coordinates: { lat: 37.7749, lng: -122.4094 },
    distance: "1.3 mi",
  },
];

interface MapProps {
  onClose: () => void;
}

export default function Map({ onClose }: MapProps) {
  const [selectedEvent, setSelectedEvent] = useState<
    (typeof mapEvents)[0] | null
  >(null);

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h1 className="text-xl font-bold">Nearby Trybes</h1>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
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
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg">
              <div className="w-8 h-8 bg-blue-500/30 rounded-full absolute -top-2 -left-2 animate-pulse" />
            </div>
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
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
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
                  {selectedEvent.name}
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
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Join Trybe
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                View Details
              </Button>
            </div>
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
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-muted-foreground">Your location</span>
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
