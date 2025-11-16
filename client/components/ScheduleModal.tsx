import React, { useState } from "react";
import { auth } from "@/auth";
import { getStorage, ref as storageRef, getDownloadURL } from 'firebase/storage';
import { isHttpDataOrRelative, normalizeStorageRefPath, isTrustedExternalImage } from '@/lib/imageUtils';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEvents } from "@/contexts/EventsContext";
import {
  X,
  Calendar,
  MapPin,
  Clock,
  Users,
  MessageCircle,
  Check,
  Trash2,
} from "lucide-react";
import SafeImg from '@/components/SafeImg';
import { cn } from "@/lib/utils";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: (eventId: string | number, hostName: string) => void;
  onEventClick?: (eventId: number) => void;
  // optional filter: 'joined' (default) shows events the user joined; 'host' shows events the user hosts
  scheduleFilter?: 'joined' | 'host';
}

export default function ScheduleModal({
  isOpen,
  onClose,
  onOpenChat,
  onEventClick,
  scheduleFilter,
}: ScheduleModalProps) {
  const { events, joinedEvents, leaveEvent } = useEvents();
  const [cancellingEvent, setCancellingEvent] = useState<string | number | null>(null);
  // Map of resolved images for joined events to avoid re-resolving repeatedly
  const [resolvedImages, setResolvedImages] = useState<Record<string, string>>({});

  // Resolve storage-based paths to download URLs for each joined event image
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const joinedSetLocal = new Set((joinedEvents || []).map((id) => String(id)));
        const joinedEventsListLocal = events.filter((event) => joinedSetLocal.has(String(event.id)));
        // Build resolve candidates using canonical fields first (image / eventImages / photos).
        // Only include _resolvedImage if it looks like a trusted external image (avoids trusting unsplash/third-party fallbacks).
        const toResolve = joinedEventsListLocal.map((e) => {
          const canonical = e.image || (e as any).eventImages?.[0] || (e as any).photos?.[0];
          const resolved = (e as any)._resolvedImage;
          const src = canonical || (resolved && isTrustedExternalImage(resolved) ? resolved : undefined);
          return { id: String(e.id), src };
        });
        const storage = getStorage();

        // Resolve all candidates in parallel (best-effort). Use Promise.allSettled so one failure doesn't block others.
        const promises = toResolve.map(async (item) => {
          if (!item.src) return { id: item.id, url: undefined };
          try {
            if (isHttpDataOrRelative(item.src as any)) {
              return { id: item.id, url: item.src };
            }

            const path = normalizeStorageRefPath(String(item.src));
            try {
              const url = await getDownloadURL(storageRef(storage, path));
              return { id: item.id, url };
            } catch (err) {
              console.warn('ScheduleModal: failed to resolve image for', item.id, err);
              return { id: item.id, url: undefined };
            }
          } catch (err) {
            console.warn('ScheduleModal: internal error resolving candidate for', item.id, err);
            return { id: item.id, url: undefined };
          }
        });

        const results = await Promise.allSettled(promises);
        if (!mounted) return;
        const next: Record<string, string> = {};
        for (const r of results) {
          if (r.status === 'fulfilled') {
            const value = (r.value as any);
            if (value && value.id && value.url) next[value.id] = value.url;
          }
        }
        // Merge into state once to reduce re-renders
        if (Object.keys(next).length > 0) {
          setResolvedImages(prev => ({ ...prev, ...next }));
        }
      } catch (err) {
        console.warn('ScheduleModal: unexpected error resolving images', err);
      }
    })();
    return () => { mounted = false; };
  }, [events, joinedEvents]);

  // Helper to resolve a single storage candidate and cache it
  const resolveAndCache = async (id: string, candidate?: string) => {
    if (!candidate) return;
    try {
      // quick-check: if it's already an http(s) url or data URL (including encoded), store directly
      if (typeof candidate === 'string' && isHttpDataOrRelative(candidate)) {
            console.log('ScheduleModal.resolveAndCache: candidate is http/data/relative, evaluating trust for caching', id, candidate);
            // Only cache if the candidate is trusted (data:, known CDN/storage, or whitelisted hosts).
            if (isTrustedExternalImage(candidate)) {
              setResolvedImages(prev => (prev[id] ? prev : { ...prev, [id]: candidate }));
            } else {
              console.log('ScheduleModal.resolveAndCache: skipping cache for untrusted external image', id, candidate);
            }
            return;
          }

      const storage = getStorage();
      const refPath = normalizeStorageRefPath(String(candidate));
      const url = await getDownloadURL(storageRef(storage, refPath));
      setResolvedImages(prev => ({ ...prev, [id]: url }));
    } catch (err) {
      console.log('ScheduleModal: resolveAndCache failed for', id, candidate, err);
    }
  };

  const getDisplaySrc = (event: any) => {
    const id = String(event.id);
  // priority: resolvedImages map -> canonical image fields (image/eventImages/photos) -> trusted _resolvedImage
  if (resolvedImages[id]) return resolvedImages[id];
  if (event && event.image && typeof event.image === 'string' && (event.image.startsWith('http') || event.image.startsWith('data:') || event.image.startsWith('/'))) return event.image;
  if (event && event.eventImages && Array.isArray(event.eventImages) && event.eventImages[0]) return event.eventImages[0];
  if (event && (event as any).photos && Array.isArray((event as any).photos) && (event as any).photos[0]) return (event as any).photos[0];
  // Only trust _resolvedImage if it's from a trusted origin (avoids Unsplash fallbacks being authoritative)
  if (event && (event as any)._resolvedImage && typeof (event as any)._resolvedImage === 'string' && isTrustedExternalImage((event as any)._resolvedImage)) return (event as any)._resolvedImage;

  // If image looks like a storage path in the canonical fields, try resolving it in background
  const candidate = event && event.image ? event.image : (event && event.eventImages && event.eventImages[0] ? event.eventImages[0] : (event && (event as any).photos && (event as any).photos[0] ? (event as any).photos[0] : undefined));
    if (candidate && typeof candidate === 'string' && !candidate.startsWith('http') && !candidate.startsWith('data:') && !candidate.startsWith('/')) {
      // kick off resolution but don't await here
      void resolveAndCache(id, candidate);
      return undefined;
    }

    return candidate || undefined;
  };

  if (!isOpen) return null;

  // Normalize comparison to strings so IDs match whether stored as numbers or Firestore string ids
  const joinedSet = new Set((joinedEvents || []).map((id) => String(id)));
  const joinedEventsList = events.filter((event) => joinedSet.has(String(event.id)));

  // If the caller asked for host events, compute those (events where the current user is host/creator)
  const currentUid = auth.currentUser?.uid;
  const hostEventsList = events.filter((event) => {
    try {
      return String(event.host) === String(currentUid) || String((event as any).createdBy) === String(currentUid);
    } catch (err) {
      return false;
    }
  });

  const eventsToShow = scheduleFilter === 'host' ? hostEventsList : joinedEventsList;
 

  const handleCancelEvent = async (eventId: string | number) => {
    // Immediately mark cancelling for UI feedback and perform leave
  console.log('ScheduleModal: handleCancelEvent firing for', String(eventId));
    setCancellingEvent(eventId);
    try {
      // Call leaveEvent immediately (no artificial delay) so server-side persist runs right away
      leaveEvent(eventId as any);
    } catch (err) {
      console.debug('ScheduleModal: leaveEvent threw', err);
    }
    // Clear the cancelling indicator shortly after to restore UI
    setTimeout(() => setCancellingEvent(null), 600);
  };

  const formatEventDate = (event: any) => {
    // Prefer ISO time if available (set by provider.normalizeEvent as ISO string)
    const tryParse = (value: any) => {
      if (!value) return null;
      try {
        // If this is a Firestore Timestamp, handle toDate
        if (typeof value === 'object' && typeof value.toDate === 'function') return value.toDate();
        const d = new Date(value);
        if (!isNaN(d.getTime())) return d;
      } catch (err) {}
      return null;
    };

    const candidates = [event.time, event.date, event];
    for (const c of candidates) {
      const d = tryParse(c);
      if (d) {
        return d.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
      }
    }

    // Fallback: return any string-ish value
    if (event && typeof event === 'string') return event;
    if (event && event.date) return String(event.date);
    return '';
  };

  return (
    <div className="fixed inset-x-0 top-0 bottom-20 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl w-full max-w-lg max-h-[calc(100vh-7rem)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold">{scheduleFilter === 'host' ? 'My Events' : 'My Schedule'}</h2>
            <p className="text-muted-foreground text-sm">
              {eventsToShow.length} event{eventsToShow.length !== 1 ? "s" : ""} {scheduleFilter === 'host' ? 'hosting' : 'joined'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Events List */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {eventsToShow.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No events yet</h3>
              <p className="text-muted-foreground">
                {scheduleFilter === 'host' ? 'You are not hosting any events right now.' : 'Join some events to see them in your schedule!'}
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {eventsToShow.map((event) => (
                <div
                  key={event.id}
                  onClick={() => onEventClick?.(event.id as any)}
                  className={cn(
                    "bg-muted/30 rounded-2xl p-4 border border-border transition-all duration-300 hover:bg-muted/50 cursor-pointer",
                    cancellingEvent === event.id &&
                      "opacity-50 scale-95 bg-destructive/10",
                  )}
                >
                  <div className="flex items-start space-x-4">
                    {/* Event Image */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                      {/* Render using getDisplaySrc which may trigger background resolution for storage paths */}
                      {
                        (() => {
                          const src = getDisplaySrc(event) || '';
                          return (
                            <SafeImg
                              key={`sched-img-${String(event.id)}`}
                              src={src}
                              alt={event.name}
                              className="w-16 h-16 rounded-xl object-cover"
                              loading="lazy"
                              decoding="async"
                              debugContext={`ScheduleModal:event:${String(event.id)}`}
                            />
                          );
                        })()
                      }
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg line-clamp-1">
                          {event.eventName || event.name}
                        </h3>
                        <Badge className={cn(
                          scheduleFilter === 'host' ? 'bg-primary text-primary-foreground ml-2' : 'bg-green-500 text-white ml-2'
                        )}>
                          {scheduleFilter === 'host' ? 'Hosting' : 'Joined'}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatEventDate(event.date)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>
                            {event.attendees}/{event.maxCapacity} attending
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 mt-4">
                        <span className="text-xs text-muted-foreground">
                          Host: {event.hostName || event.host}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {event.fee}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end mt-4 pt-4 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('ScheduleModal: Cancel clicked for', String(event.id));
                        handleCancelEvent(event.id as any);
                      }}
                      disabled={cancellingEvent === event.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {cancellingEvent === event.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-1" />
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-1" />
                          Cancel
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {eventsToShow.length > 0 && (
          <div className="p-6 border-t border-border">
            <Button
              onClick={onClose}
              className="w-full rounded-xl"
              variant="outline"
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
