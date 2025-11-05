import React from 'react';

interface SafeImgProps {
  src?: string | null;
  alt?: string;
  className?: string;
  placeholder?: string;
}

export default function SafeImg({ src, alt, className, placeholder = '/placeholder.svg' }: SafeImgProps) {
  const [current, setCurrent] = React.useState<string>(src || '');

  React.useEffect(() => {
    setCurrent(src || '');
  }, [src]);

  const handleError = () => {
    // Do not mutate incoming src; switch local state to placeholder only
    if (current !== placeholder) setCurrent(placeholder);
  };

  const final = current || placeholder;

  // Dev-only trace when a fallback Unsplash URL is present so we can trace where it came from
  if (process.env.NODE_ENV !== 'production' && typeof final === 'string' && final.includes('unsplash.com')) {
    // This will create a stack trace pointing to the assigner
    // eslint-disable-next-line no-console
    console.trace('FALLBACK_IMAGE_APPLIED', { src: final });
  }

  return (
    // no-referrer avoids leaking referrer headers to some image hosts
    <img
      src={final}
      alt={alt}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={handleError}
    />
  );
}
