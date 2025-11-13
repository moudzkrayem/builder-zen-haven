import React from 'react';

interface SafeImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  placeholder?: string;
  debugContext?: string; // optional context for dev-only traces
}

export default function SafeImg({ src, placeholder = '/placeholder.svg', debugContext, alt, className, loading = 'lazy', decoding = 'async', ...rest }: SafeImgProps) {
  const [current, setCurrent] = React.useState<string | undefined>(() => (src || undefined));

  React.useEffect(() => {
    setCurrent(src || undefined);
  }, [src]);

  React.useEffect(() => {
    // Dev-only trace when fallback host appears
    if (process.env.NODE_ENV !== 'production' && current && current.includes('unsplash.com')) {
      try {
        console.trace('FALLBACK_IMAGE_APPLIED', { where: debugContext || 'unknown', src: current });
      } catch (e) {}
    }
  }, [current, debugContext]);

  return (
    <img
      src={current || placeholder}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      referrerPolicy="no-referrer"
      onError={(e) => { 
        console.error(`🔴 SafeImg: Image failed to load for ${debugContext}:`, current);
        if (current !== placeholder) setCurrent(placeholder); 
      }}
      {...rest}
    />
  );
}
