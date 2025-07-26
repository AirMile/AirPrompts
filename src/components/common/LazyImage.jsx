import React, { useState, useEffect, useRef } from 'react';

/**
 * Lazy loading image component with Intersection Observer
 */
const LazyImage = ({ 
  src, 
  alt, 
  placeholder = '/placeholder.svg',
  className = '',
  style = {},
  onLoad,
  onError,
  threshold = 0.1,
  rootMargin = '50px',
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const imageRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (!imageRef.current || !src) return;

    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Start loading the actual image
            const img = new Image();
            
            img.onload = () => {
              setImageSrc(src);
              setImageLoading(false);
              if (onLoad) onLoad();
              
              // Disconnect observer after loading
              if (observerRef.current) {
                observerRef.current.disconnect();
              }
            };
            
            img.onerror = () => {
              setImageError(true);
              setImageLoading(false);
              if (onError) onError();
              
              // Disconnect observer after error
              if (observerRef.current) {
                observerRef.current.disconnect();
              }
            };
            
            img.src = src;
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    // Start observing
    observerRef.current.observe(imageRef.current);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, placeholder, threshold, rootMargin, onLoad, onError]);

  // Fallback for browsers without Intersection Observer
  useEffect(() => {
    if (!('IntersectionObserver' in window) && src) {
      setImageSrc(src);
      setImageLoading(false);
    }
  }, [src]);

  return (
    <div 
      ref={imageRef}
      className={`relative ${className}`}
      style={style}
    >
      <img
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageLoading ? 'opacity-0' : 'opacity-100'
        }`}
        loading="lazy"
        {...props}
      />
      
      {imageLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <span className="text-gray-400 text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  );
};

export default React.memo(LazyImage);