import React from 'react';
import { useEvents } from '@/contexts/EventsContext';

export default function EventsDebugOverlay() {
  const ctx = useEvents() as any;
  if (!ctx) return null;
  const { events, joinedEvents } = ctx;

  return (
    <div style={{ position: 'fixed', right: 12, bottom: 12, zIndex: 9999, maxWidth: 420, maxHeight: '60vh', overflow: 'auto', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: 12, borderRadius: 10, fontSize: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong>Events Debug</strong>
        <button onClick={() => { localStorage.removeItem('showDebugEvents'); window.location.reload(); }} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', padding: '2px 6px', borderRadius: 6 }}>Close</button>
      </div>
      <div style={{ marginBottom: 8 }}><small>Joined IDs: {JSON.stringify(joinedEvents || [])}</small></div>
      <div>
        {(events || []).map((e: any) => (
          <div key={String(e.id)} style={{ padding: 8, marginBottom: 8, borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 48, height: 48, background: '#222', borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                { (e._resolvedImage || e.image) ? (
                  // eslint-disable-next-line jsx-a11y/img-redundant-alt
                  <img src={e._resolvedImage || e.image} alt={`img-${e.id}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>no img</div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.eventName || e.name || `#${e.id}`}</div>
                  <div style={{ fontSize: 11, opacity: 0.9 }}>{String(e.id)}</div>
                </div>
                <div style={{ fontSize: 11, opacity: 0.9 }}>{e.location || ''} • {e.date || e.time || ''}</div>
                <div style={{ marginTop: 6, fontSize: 11 }}>
                  <div>photos: {JSON.stringify(e.photos || [])}</div>
                  <div>image: {String(e.image || '')}</div>
                  <div>resolved: {String(e._resolvedImage || '')}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
