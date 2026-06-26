"use client";

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useSecuritySettings } from '@/contexts/SecurityContext';

interface MangaReaderImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  onLoad?: () => void;
}

const MangaReaderImage: React.FC<MangaReaderImageProps> = ({ 
  src, 
  alt, 
  width = 800, 
  height = 1200,
  className = '',
  onLoad
}) => {
  const { securitySettings } = useSecuritySettings();
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [useCanvas, setUseCanvas] = useState(false);
  const [protectedSrc, setProtectedSrc] = useState<string>(src);

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();

    // If chapter protection is enabled, convert to canvas immediately
    if (securitySettings.chapterProtection && imgRef.current) {
      try {
        convertToCanvas();
      } catch (error) {
        console.error('Failed to convert to canvas:', error);
      }
    }
  };

  // Process image URL to make it harder to scrape
  useEffect(() => {
    if (securitySettings.chapterProtection) {
      // Obfuscate actual image URL to prevent direct access
      // If server supports, you could use a token-based approach here
      // For now, we'll use a data-only reference approach 
      setProtectedSrc(src);
      
      // Apply random query param to prevent caching and make URLs unique
      const timestamp = Date.now();
      const randomParam = Math.floor(Math.random() * 1000000);
      
      // Modify URL with timestamp to make it harder to predict
      if (src.includes('?')) {
        setProtectedSrc(`${src}&_t=${timestamp}&_r=${randomParam}`);
      } else {
        setProtectedSrc(`${src}?_t=${timestamp}&_r=${randomParam}`);
      }
      
      // Setting a data attribute rather than src would be even more secure
      // but requires server-side support
    }
  }, [src, securitySettings.chapterProtection]);

  // Apply layer protection
  useEffect(() => {
    if (securitySettings.chapterProtection && imgRef.current) {
      // Create invisible overlay divs that make it harder to inspect/select
      const parent = imgRef.current.parentElement;
      if (parent) {
        // Create random noise divs that overlap the image
        for (let i = 0; i < 5; i++) {
          const overlayDiv = document.createElement('div');
          overlayDiv.style.position = 'absolute';
          overlayDiv.style.top = '0';
          overlayDiv.style.left = '0';
          overlayDiv.style.width = '100%';
          overlayDiv.style.height = '100%';
          overlayDiv.style.pointerEvents = 'none';
          overlayDiv.style.opacity = '0.01';
          overlayDiv.style.zIndex = `${i + 1}`;
          overlayDiv.dataset.overlay = 'true'; // Flag for identification
          
          // Add some randomized noise data to confuse scrapers
          overlayDiv.dataset.noise = `noise_${Math.random().toString(36).substring(2, 15)}`;
          
          parent.appendChild(overlayDiv);
        }
        
        // Return cleanup function
        return () => {
          document.querySelectorAll('[data-overlay="true"]').forEach(el => {
            el.remove();
          });
        };
      }
    }
  }, [securitySettings.chapterProtection]);

  // Convert image to canvas for better protection
  const convertToCanvas = () => {
    if (!imgRef.current || !canvasRef.current || useCanvas) return;
    
    const img = imgRef.current;
    const canvas = canvasRef.current;
    
    // Make sure image is loaded before drawing to canvas
    if (img.complete && img.naturalWidth > 0) {
      try {
        // Set canvas dimensions to match image
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        // Draw image to canvas
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          // First draw the image
          ctx.drawImage(img, 0, 0);
          
          // Then apply advanced protection techniques
          applyCanvasProtection(ctx, canvas);
          
          // Hide the original image and show the canvas
          setUseCanvas(true);
          
          // Remove the source from the image to prevent inspection
          if (imgRef.current) {
            // Replace with a tiny transparent image instead of removing completely
            // This prevents error states but still removes the original source
            const tinyTransparentGif = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
            imgRef.current.src = tinyTransparentGif;
          }
        }
      } catch (error) {
        console.error('Canvas conversion error:', error);
      }
    }
  };
  
  // Apply advanced canvas protection techniques
  const applyCanvasProtection = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // 1. Add watermarks 
    addWatermarks(ctx, canvas);
    
    // 2. Add subtle noise that's not visible to humans but affects automatic scraping
    addNoise(ctx, canvas);
    
    // 3. Apply subtle image modifications
    applySubtleModifications(ctx, canvas);
    
    // 4. Add hidden traps for scrapers
    addScraperTraps(ctx, canvas);
  };
  
  // Add subtle watermarks across the image
  const addWatermarks = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const width = canvas.width;
    const height = canvas.height;
    
    // Add text watermarks with very low opacity
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)'; // Almost invisible
    ctx.font = '12px Arial';
    
    // Add watermarks in a grid pattern
    for (let x = 0; x < width; x += 120) {
      for (let y = 0; y < height; y += 100) {
        // Randomize position slightly
        const xPos = x + Math.random() * 20;
        const yPos = y + Math.random() * 20;
        
        // Add timestamp to make each watermark unique
        const timestamp = Date.now().toString().slice(-6);
        ctx.fillText(`Protected ${timestamp}`, xPos, yPos);
      }
    }
    ctx.restore();
  };
  
  // Add imperceptible noise that affects digital copies
  const addNoise = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Get image data
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Add very subtle pixel noise (+-1 value change)
      // Only affect every 10th pixel to minimize visual impact
      for (let i = 0; i < data.length; i += 40) {
        // Only change if we're not in a fully transparent area
        if (i % 4 === 3 && data[i] > 0) {
          // Add random noise to RGB channels (-1, 0, or 1)
          data[i - 3] += (Math.random() > 0.5 ? 1 : -1);
          data[i - 2] += (Math.random() > 0.5 ? 1 : -1);
          data[i - 1] += (Math.random() > 0.5 ? 1 : -1);
        }
      }
      
      // Put the modified data back
      ctx.putImageData(imageData, 0, 0);
    } catch (e) {
      // CORS or other canvas related errors
      console.error('Could not add noise to image:', e);
    }
  };
  
  // Apply subtle modifications that don't affect viewing but do affect copying
  const applySubtleModifications = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Add a subtle gradient overlay
    ctx.save();
    
    // Create a subtle gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.01)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.01)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.restore();
  };
  
  // Add hidden traps for scrapers
  const addScraperTraps = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Add data that's not visible but can be detected if someone steals the image
    ctx.save();
    
    // Set an almost transparent color
    ctx.fillStyle = 'rgba(255, 255, 255, 0.003)';
    
    // Create a pattern of dots in corners
    const cornerSize = 20;
    
    // Top left
    for (let i = 0; i < cornerSize; i++) {
      for (let j = 0; j < cornerSize; j++) {
        if ((i + j) % 3 === 0) {
          ctx.fillRect(i, j, 1, 1);
        }
      }
    }
    
    // Top right
    for (let i = 0; i < cornerSize; i++) {
      for (let j = 0; j < cornerSize; j++) {
        if ((i + j) % 3 === 1) {
          ctx.fillRect(canvas.width - i - 1, j, 1, 1);
        }
      }
    }
    
    ctx.restore();
  };

  // CSS classes for protection
  const getProtectionClasses = () => {
    if (!securitySettings.chapterProtection) return className;
    
    return `${className} manga-reader-image select-none pointer-events-none`;
  };
  
  // Dummy function to run confusing code for scrapers
  useEffect(() => {
    if (securitySettings.chapterProtection) {
      // Anti-scraper confusion code
      const interval = setInterval(() => {
        // Create random elements and append/remove them to confuse DOM scrapers
        const dummyDiv = document.createElement('div');
        dummyDiv.style.display = 'none';
        dummyDiv.dataset.image = `image_${Math.random()}`;
        document.body.appendChild(dummyDiv);
        
        // Remove after short delay
        setTimeout(() => {
          dummyDiv.remove();
        }, 100);
        
        // Randomly update data attributes on the container
        const container = imgRef.current?.parentElement;
        if (container) {
          container.dataset.timestamp = Date.now().toString();
        }
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [securitySettings.chapterProtection]);
  
  return (
    <div className="manga-reader-image-container relative">
      {/* Add confusing elements for scrapers */}
      {securitySettings.chapterProtection && (
        <>
          <div className="absolute pointer-events-none opacity-0 select-none" 
               aria-hidden="true"
               data-fake-img={`fake_${Math.random()}`}>
          </div>
          <div className="absolute pointer-events-none opacity-0 select-none" 
               aria-hidden="true"
               data-decoy-src={src.split('/').pop()}>
          </div>
        </>
      )}
      
      {(!useCanvas || !securitySettings.chapterProtection) && (
        <Image 
          ref={imgRef}
          src={protectedSrc}
          alt={alt}
          width={width}
          height={height}
          quality={95}
          priority
          className={getProtectionClasses()}
          style={{
            maxWidth: '100%',
            height: 'auto',
            // Using string literal for vendor-specific CSS properties
            ...(securitySettings.chapterProtection ? {
              ['WebkitUserDrag' as any]: 'none',
              ['WebkitTouchCallout' as any]: 'none'
            } : {})
          }}
          draggable={!securitySettings.chapterProtection}
          unoptimized={true}
          onLoad={handleLoad}
          onContextMenu={securitySettings.chapterProtection ? (e) => e.preventDefault() : undefined}
          {...(securitySettings.chapterProtection ? {
            'data-protected': 'true',
            'data-src': 'protected',
            'loading': 'eager',
          } : {})}
        />
      )}
      
      {securitySettings.chapterProtection && (
        <canvas 
          ref={canvasRef}
          className={`${useCanvas ? 'block' : 'hidden'} w-full h-auto select-none pointer-events-none`}
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
          onContextMenu={(e) => e.preventDefault()}
        />
      )}
    </div>
  );
};

export default MangaReaderImage;
