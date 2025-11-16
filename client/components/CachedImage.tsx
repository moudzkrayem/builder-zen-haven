import React, { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { imageCache } from '@/lib/imageCache';

interface CachedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized image component with built-in caching
 * Uses browser cache + our custom cache to prevent re-downloading
 * Memoized to prevent unnecessary re-renders
 */
const CachedImage = React.memo(function CachedImage({ 
  src, 
  fallback = '/placeholder.svg',
  onLoad,
  onError,
  className,
  alt = '',
  ...props 
}: CachedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(src || fallback);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const previousSrc = useRef<string>(src);

  useEffect(() => {
    // Only update if src actually changed
    if (!src || src === previousSrc.current) {
      return;
    }

    previousSrc.current = src;
    setHasError(false);

    // Get from cache (returns cached or original)
    const cachedSrc = imageCache.get(src);
    setImageSrc(cachedSrc);

  }, [src]);

  const handleLoad = () => {
    if (src) {
      imageCache.cache(src);
    }
    onLoad?.();
  };

  const handleError = () => {
    if (!hasError) {
      console.error('[CachedImage] Image load error:', src);
      setImageSrc(fallback);
      setHasError(true);
      onError?.();
    }
  };

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={className}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
});

export default CachedImage;
