import React from 'react';
import { getStorage, ref as storageRef, getDownloadURL } from 'firebase/storage';
import { isHttpDataOrRelative, normalizeStorageRefPath } from '@/lib/imageUtils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  srcCandidates: Array<string | undefined | null>;
  cacheTtlMs?: number; // milliseconds
}

// localStorage cache key prefix
const CACHE_KEY_PREFIX = 'imgcache:';

async function resolveStoragePath(path: string): Promise<string | undefined> {
    try {
      const storage = getStorage();
      // If the path looks like a full URL or data URL (including encoded), return as-is
      if (isHttpDataOrRelative(path)) return path;

      // Normalize common storage formats and resolve
      const p = normalizeStorageRefPath(path);
      const url = await getDownloadURL(storageRef(storage, p));
      return url;
  } catch (err) {
    // Fail silently
    return undefined;
  }
}

export default function OptimizedImage({ srcCandidates, cacheTtlMs = 1000 * 60 * 60 * 24, alt, className, ...rest }: OptimizedImageProps) {
  const [src, setSrc] = React.useState<string | undefined>(undefined);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    async function tryResolve() {
      console.debug('OptimizedImage: resolving candidates', srcCandidates);
      for (const candidate of srcCandidates) {
        if (!candidate) continue;
        // If it's already a full URL, use it immediately
        if (candidate.startsWith('http')) {
          if (!mounted) return;
          setSrc(candidate);
          return;
        }

        const key = CACHE_KEY_PREFIX + candidate;
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as { url: string; ts: number };
              if (parsed?.url && parsed.ts && (Date.now() - parsed.ts) < cacheTtlMs) {
                if (!mounted) return;
                setSrc(parsed.url);
                return;
              }
            } catch (err) {
              // ignore parse errors
            }
          }
        } catch (err) {
          // localStorage may throw in some environments
        }

        try {
          const resolved = await resolveStoragePath(candidate);
          if (resolved) {
            try {
              localStorage.setItem(key, JSON.stringify({ url: resolved, ts: Date.now() }));
            } catch (err) {}
            if (!mounted) return;
            console.debug('OptimizedImage: resolved', candidate, resolved);
            setSrc(resolved);
            return;
          }
        } catch (err) {
          console.debug('OptimizedImage: resolve error for', candidate, err);
        }
      }
    }

    tryResolve();
    return () => { mounted = false; };
  }, [srcCandidates.join('|')]);

  // placeholder style: subtle gray/gradient
  return (
    <div className={className} style={{ position: 'relative', overflow: 'hidden' }}>
      {!loaded && (
        <div aria-hidden className="w-full h-full bg-gradient-to-br from-muted/60 to-muted/40 animate-pulse absolute inset-0" />
      )}
      {src ? (
        <img
          src={src}
          alt={alt}
          loading={rest.loading || 'lazy'}
          decoding={rest.decoding || 'async'}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          style={{ display: loaded ? 'block' : 'none', width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        // fallback image element: we still render an img with a placeholder src to keep layout stable
        <img
          src="/placeholder.svg"
          alt={alt}
          loading={rest.loading || 'lazy'}
          decoding={rest.decoding || 'async'}
          onLoad={() => setLoaded(true)}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}
