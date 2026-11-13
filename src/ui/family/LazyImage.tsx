import { useState } from 'react';
import styles from './LazyImage.module.css';

interface LazyImageProps {
  readonly src: string;
  readonly alt: string;
  readonly className?: string;
}

/**
 * An image that loads only when it nears the view and fades in from a blur; until then its frame
 * shows whatever soft background the parent gives it.
 */
export function LazyImage({ src, alt, className = '' }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      className={`${styles.image} ${loaded ? styles.loaded : ''} ${className}`}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      draggable={false}
      onLoad={() => {
        setLoaded(true);
      }}
    />
  );
}
