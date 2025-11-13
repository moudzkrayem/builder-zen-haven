import { useState, useEffect, ImgHTMLAttributes } from 'react';
import { imageCache } from '@/lib/imageCache';

interface CachedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized image component with built-in caching
 * Images are cached in memory and localStorage to prevent re-downloading
 */
export default function CachedImage({ 
  src, 
  fallback = '/placeholder.svg',
  onLoad,
  onError,
  className,
  alt = '',
  ...props 
}: CachedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!src) {
      setImageSrc(fallback);
      setIsLoading(false);
      return;
    }

    // Get cached or original URL
    const cachedUrl = imageCache.get(src);
    setImageSrc(cachedUrl);
    setHasError(false);
    setIsLoading(true);

    // Preload the image
    const img = new Image();
    img.onload = () => {
      imageCache.cache(src);
      setIsLoading(false);
      onLoad?.();
    };
    img.onerror = () => {
      console.error('[CachedImage] Failed to load:', src);
      setImageSrc(fallback);
      setHasError(true);
      setIsLoading(false);
      onError?.();
    };
    img.src = cachedUrl;
  }, [src, fallback, onLoad, onError]);

  const handleError = () => {
    if (!hasError) {
      console.error('[CachedImage] Image load error:', imageSrc);
      setImageSrc(fallback);
      setHasError(true);
      onError?.();
    }
  };

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
      {...props}
    />
  );
}
