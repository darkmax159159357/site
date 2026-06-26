"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { InView } from 'react-intersection-observer';

interface MangaImageProps {
  src: string;
  alt: string;
  index: number;
  priority?: boolean;
  onLoad?: () => void;
}

// Create a cache for preloaded images to avoid duplicate network requests
const imageCache: Record<string, boolean> = {};

const MangaImage: React.FC<MangaImageProps> = ({
  src,
  alt,
  index,
  priority = false,
  onLoad,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(index < 10);
  const [retryCount, setRetryCount] = useState(0);
  const [errorLoadingImage, setErrorLoadingImage] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const preloadAttempted = useRef<boolean>(false);
  
  // Reset state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setErrorLoadingImage(false);
    setRetryCount(0);
    preloadAttempted.current = false;
  }, [src]);

  // Preload images only once per src
  useEffect(() => {
    // Skip if already in cache or already attempted
    if (imageCache[src] || preloadAttempted.current) {
      return;
    }
    
    // Mark that we've attempted preloading
    preloadAttempted.current = true;
    
    // Only preload first 15 images
    if (index < 15 && typeof window !== 'undefined') {
      const preloadImage = new window.Image();
      
      preloadImage.onload = () => {
        imageCache[src] = true;
      };
      
      preloadImage.src = src;
    }
  }, [src, index]);

  // Handle image load error with retry mechanism
  const handleError = () => {
    if (retryCount < 3) {
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      setErrorLoadingImage(true);
      
      const timer = setTimeout(() => {
        setErrorLoadingImage(false);
      }, 800 * newRetryCount);
      
      return () => clearTimeout(timer);
    } else {
      setErrorLoadingImage(true);
    }
  };

  const handleLoadSuccess = () => {
    imageCache[src] = true;
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  // Use a larger root margin to start loading earlier
  const rootMargin = index < 10 ? "400px" : "200px";
  
  // Determine if we should show the image immediately
  const shouldShowImmediately = priority || index < 8;

  return (
    <InView 
      onChange={(inView) => setIsInView(inView)}
      threshold={0.01} 
      initialInView={shouldShowImmediately} 
      rootMargin={rootMargin}
      triggerOnce={true}
    >
      {({ ref }) => (
        <div 
          ref={ref} 
          className="relative w-full bg-gray-900 overflow-hidden min-h-[30vh]"
        >
          {/* Skeleton loader during image load */}
          {!isLoaded && (
            <div className="absolute inset-0 w-full animate-pulse bg-gray-800" />
          )}
          
          {/* Error state */}
          {errorLoadingImage && retryCount >= 3 && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white p-4">
              <div className="text-center">
                <p className="mb-2">Failed to load image</p>
                <button 
                  onClick={() => {
                    setRetryCount(0);
                    setErrorLoadingImage(false);
                    preloadAttempted.current = false;
                  }}
                  className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
          
          {/* Only render image when in view or if it has priority */}
          {(isInView || shouldShowImmediately) && !errorLoadingImage && (
            <Image
              ref={imgRef}
              src={src}
              alt={alt}
              width={800}
              height={1200}
              className={`w-full transition-opacity duration-150 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading={shouldShowImmediately ? "eager" : "lazy"}
              priority={shouldShowImmediately}
              quality={shouldShowImmediately ? 90 : 75}
              onLoad={handleLoadSuccess}
              onError={handleError}
              sizes="(max-width: 768px) 100vw, 70vw"
              unoptimized={true}
            />
          )}
        </div>
      )}
    </InView>
  );
};

export default MangaImage; 