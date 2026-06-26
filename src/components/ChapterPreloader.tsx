"use client";

import { useEffect, useRef } from "react";

interface ChapterPreloaderProps {
  imageUrls: string[];
  priority?: number; // How many images to load with high priority
}

// Define requestIdleCallback interface
interface RequestIdleCallbackOptions {
  timeout: number;
}

type RequestIdleCallbackHandle = number;
type RequestIdleCallbackDeadline = {
  didTimeout: boolean;
  timeRemaining: () => number;
};

interface Window {
  requestIdleCallback: (
    callback: (deadline: RequestIdleCallbackDeadline) => void,
    opts?: RequestIdleCallbackOptions
  ) => RequestIdleCallbackHandle;
  cancelIdleCallback: (handle: RequestIdleCallbackHandle) => void;
}

/**
 * Component that preloads chapter images in the background
 * Uses different strategies based on priority:
 * - High priority: Load immediately with <link rel="preload">
 * - Medium priority: Load with Image constructor
 * - Low priority: Load later when browser is idle
 */
const ChapterPreloader: React.FC<ChapterPreloaderProps> = ({ 
  imageUrls, 
  priority = 5 
}) => {
  const preloadedRef = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    // Create a hidden container for images
    if (!containerRef.current && typeof document !== 'undefined') {
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.width = '1px';
      container.style.height = '1px';
      container.style.overflow = 'hidden';
      container.style.opacity = '0.01';
      container.style.pointerEvents = 'none';
      container.style.position = 'fixed';
      container.style.bottom = '0';
      container.style.right = '0';
      document.body.appendChild(container);
      containerRef.current = container;
    }

    if (!imageUrls?.length) return;
    
    // Keep track of preloaded images to avoid duplicates
    const preloaded = preloadedRef.current;
    
    // Function to preload a single image using the Image constructor
    const preloadImage = (url: string, hiPriority = false) => {
      if (preloaded.has(url)) return;
      
      if (containerRef.current) {
        // Create an actual img element - this loads faster than Image constructor
        const img = document.createElement('img');
        img.src = url;
        if (hiPriority) {
          img.setAttribute('fetchpriority', 'high');
          img.loading = 'eager';
        } else {
          img.loading = 'lazy';
        }
        img.style.position = 'absolute';
        img.style.width = '1px';
        img.style.height = '1px';
        containerRef.current.appendChild(img);
      } else {
        // Fallback to constructor method
        const img = new Image();
        img.src = url;
      }
      
      preloaded.add(url);
    };
    
    // Create preload link elements for highest priority images (first few)
    const highPriorityImages = imageUrls.slice(0, priority);
    highPriorityImages.forEach((url, index) => {
      if (preloaded.has(url)) return;
      
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = 'image';
      // Set fetchpriority attribute for the very first images
      if (index < 3) {
        link.setAttribute('fetchpriority', 'high');
      }
      document.head.appendChild(link);
      
      // Also use img method for fastest loading
      preloadImage(url, index < 3);
      
      preloaded.add(url);
    });
    
    // Medium priority: next set of images
    const mediumPriorityImages = imageUrls.slice(priority, priority + 10);
    mediumPriorityImages.forEach(url => {
      preloadImage(url);
    });
    
    // Low priority: use requestIdleCallback for the rest
    if (typeof window !== 'undefined') {
      const remainingImages = imageUrls.slice(priority + 10);
      
      // Use requestIdleCallback to load remaining images when browser is idle
      const idleCallback = (window as any).requestIdleCallback || 
        ((cb: Function) => setTimeout(cb, 1000));
      
      idleCallback(() => {
        let index = 0;
        
        const loadNext = () => {
          if (index >= remainingImages.length) return;
          
          const url = remainingImages[index];
          preloadImage(url);
          index++;
          
          // Schedule next image load after a short delay
          setTimeout(loadNext, 100);
        };
        
        loadNext();
      });
    }
    
    return () => {
      // Clean up hidden container when component unmounts
      if (containerRef.current) {
        containerRef.current.remove();
      }
    };
  }, [imageUrls, priority]);
  
  return null; // This component doesn't render anything
};

export default ChapterPreloader; 