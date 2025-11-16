/**
 * Image Cache Utility
 * Caches image URLs in memory and localStorage to prevent re-downloading on every page change
 */

interface CachedImage {
  url: string;
  timestamp: number;
  objectUrl?: string;
}

class ImageCache {
  private memoryCache: Map<string, CachedImage> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly STORAGE_KEY = 'trybe_image_cache';
  private readonly MAX_MEMORY_CACHE = 100; // Max images to keep in memory

  constructor() {
    this.loadFromLocalStorage();
    this.cleanupExpired();
  }

  /**
   * Get a cached image URL or return the original if not cached
   */
  get(url: string): string {
    if (!url) return url;

    // Check memory cache first
    const cached = this.memoryCache.get(url);
    if (cached && this.isValid(cached)) {
      return cached.objectUrl || url;
    }

    // Not cached or expired - cache it now
    this.cache(url);
    return url;
  }

  /**
   * Cache an image URL
   */
  cache(url: string): void {
    if (!url || url.startsWith('data:') || url.startsWith('blob:')) {
      return; // Don't cache data URLs or blob URLs
    }

    const cached: CachedImage = {
      url,
      timestamp: Date.now(),
    };

    this.memoryCache.set(url, cached);
    this.saveToLocalStorage();

    // Limit memory cache size
    if (this.memoryCache.size > this.MAX_MEMORY_CACHE) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
      }
    }
  }

  /**
   * Preload an image and cache it
   */
  async preload(url: string): Promise<void> {
    if (!url || this.memoryCache.has(url)) {
      // Already cached, skip
      return;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.cache(url);
        resolve();
      };
      img.onerror = () => {
        console.warn('[ImageCache] Preload failed:', url.substring(0, 50) + '...');
        reject(new Error('Failed to preload image'));
      };
      img.src = url;
    });
  }

  /**
   * Preload multiple images
   */
  async preloadBatch(urls: string[]): Promise<void> {
    const validUrls = urls.filter(url => url && !url.startsWith('data:') && !url.startsWith('blob:'));
    await Promise.allSettled(validUrls.map(url => this.preload(url)));
  }

  /**
   * Check if a cached image is still valid
   */
  private isValid(cached: CachedImage): boolean {
    return Date.now() - cached.timestamp < this.CACHE_DURATION;
  }

  /**
   * Load cache from localStorage
   */
  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as Record<string, CachedImage>;
        Object.entries(data).forEach(([url, cached]) => {
          if (this.isValid(cached)) {
            this.memoryCache.set(url, cached);
          }
        });
      }
    } catch (err) {
      console.warn('[ImageCache] Failed to load from localStorage:', err);
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToLocalStorage(): void {
    try {
      const data: Record<string, CachedImage> = {};
      this.memoryCache.forEach((cached, url) => {
        if (this.isValid(cached)) {
          data[url] = { url: cached.url, timestamp: cached.timestamp };
        }
      });
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('[ImageCache] Failed to save to localStorage:', err);
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpired(): void {
    let removed = 0;
    this.memoryCache.forEach((cached, url) => {
      if (!this.isValid(cached)) {
        this.memoryCache.delete(url);
        removed++;
      }
    });
    if (removed > 0) {
      console.log(`[ImageCache] Cleaned up ${removed} expired images`);
      this.saveToLocalStorage();
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memoryCache.clear();
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('[ImageCache] Cache cleared');
  }

  /**
   * Invalidate specific URLs (useful when images are updated)
   */
  invalidate(urls: string | string[]): void {
    const urlArray = Array.isArray(urls) ? urls : [urls];
    let removed = 0;
    
    urlArray.forEach(url => {
      if (this.memoryCache.has(url)) {
        this.memoryCache.delete(url);
        removed++;
      }
    });
    
    if (removed > 0) {
      console.log(`[ImageCache] Invalidated ${removed} image(s)`);
      this.saveToLocalStorage();
    }
  }

  /**
   * Invalidate all cached images for a specific user (profile photos)
   */
  invalidateUserPhotos(userId: string): void {
    const toRemove: string[] = [];
    
    this.memoryCache.forEach((cached, url) => {
      if (url.includes(`users/${userId}/photos/`)) {
        toRemove.push(url);
      }
    });
    
    if (toRemove.length > 0) {
      toRemove.forEach(url => this.memoryCache.delete(url));
      console.log(`[ImageCache] Invalidated ${toRemove.length} user photos`);
      this.saveToLocalStorage();
    }
  }

  /**
   * Invalidate all cached images for a specific Trybe
   */
  invalidateTrybePhotos(userId: string): void {
    const toRemove: string[] = [];
    
    this.memoryCache.forEach((cached, url) => {
      if (url.includes(`trybePhotos/${userId}/`)) {
        toRemove.push(url);
      }
    });
    
    if (toRemove.length > 0) {
      toRemove.forEach(url => this.memoryCache.delete(url));
      console.log(`[ImageCache] Invalidated ${toRemove.length} Trybe photos`);
      this.saveToLocalStorage();
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; urls: string[] } {
    return {
      size: this.memoryCache.size,
      urls: Array.from(this.memoryCache.keys()),
    };
  }
}

// Export singleton instance
export const imageCache = new ImageCache();
