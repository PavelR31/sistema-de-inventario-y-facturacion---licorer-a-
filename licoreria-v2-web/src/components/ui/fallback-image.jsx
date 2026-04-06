import { useState } from 'react';

export function FallbackImage({ src, className, alt, fallbackIcon: Icon, fallbackClass }) {
  const [error, setError] = useState(false);
  
  if (error || !src) {
    return (
      <div className="flex items-center justify-center bg-slate-50 relative w-full h-full">
        {Icon ? <Icon className={fallbackClass} weight="duotone" /> : null}
      </div>
    );
  }
  
  return <img src={src} className={className} alt={alt} onError={() => setError(true)} />;
}
