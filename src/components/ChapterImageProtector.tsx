"use client";

import React, { useEffect } from 'react';
import { useSecuritySettings } from '@/contexts/SecurityContext';

interface ChapterImageProtectorProps {
  children: React.ReactNode;
}

const ChapterImageProtector: React.FC<ChapterImageProtectorProps> = ({ children }) => {
  const { securitySettings } = useSecuritySettings();
  
  useEffect(() => {
    if (securitySettings.chapterProtection) {
      console.log('Chapter protection activated with LIMITED scope');
      
      // Prevent screenshots - but ONLY for F12 key
      const preventScreenshots = () => {
        document.addEventListener('keyup', (e) => {
          // Prevent Print Screen
          if (e.key === 'PrintScreen' || e.key === 'F12') {
            e.preventDefault();
            return false;
          }
        });
      };

      // Disable image dragging ONLY for manga reader images
      const disableImageDragging = () => {
        document.querySelectorAll('.manga-reader-image img, .image-container img').forEach((img) => {
          if (img instanceof HTMLElement) {
            img.setAttribute('draggable', 'false');
            img.style.userSelect = 'none';
            img.style.webkitUserSelect = 'none';
            // @ts-ignore: Vendor-specific properties
            img.style.msUserSelect = 'none';
            // DON'T disable pointer events globally
            // img.style.pointerEvents = 'none'; 
          }
        });
      };

      // Prevent saving images ONLY for manga reader images
      const preventSavingImages = () => {
        document.addEventListener('contextmenu', (e) => {
          // Check if target is a protected image or within a protected container
          const isProtectedImage = e.target instanceof HTMLImageElement && 
            (e.target.closest('.manga-reader-image') || 
             e.target.closest('.image-container'));
             
          if (isProtectedImage) {
            e.preventDefault();
            return false;
          }
        });
      };

      // Add CSS to prevent image selection and copying for MANGA READER IMAGES ONLY
      const addProtectionCSS = () => {
        const style = document.createElement('style');
        style.innerHTML = `
          /* ONLY protect specific reader images */
          .manga-reader-image img,
          .image-container img {
            -webkit-user-drag: none;
            -webkit-touch-callout: none;
            user-select: none;
            /* DO NOT disable pointer events globally as it breaks clickability */
            /* pointer-events: none; */
          }
          
          /* Fix for normal navigation elements */
          a:not(.manga-reader-image a):not(.image-container a),
          button, 
          [role="button"],
          .clickable,
          .latest-poster, 
          .manga-card-main-link,
          .manga-card-clickable {
            pointer-events: auto !important;
            cursor: pointer !important;
            z-index: 1;
          }
          
          @media print {
            body {
              display: none;
            }
          }
        `;
        document.head.appendChild(style);
      };

      // Apply canvas protection to images
      const applyCanvasProtection = () => {
        // Check periodically for new images
        const interval = setInterval(() => {
          const pageImages = document.querySelectorAll('.image-container img');
          
          pageImages.forEach((img) => {
            if (img instanceof HTMLImageElement && !img.hasAttribute('protected')) {
              // Create a wrapper with position relative
              const wrapper = document.createElement('div');
              wrapper.style.position = 'relative';
              wrapper.style.width = '100%';
              wrapper.style.height = 'auto';
              
              // Create an overlay div for additional protection
              const overlay = document.createElement('div');
              overlay.style.position = 'absolute';
              overlay.style.top = '0';
              overlay.style.left = '0';
              overlay.style.width = '100%';
              overlay.style.height = '100%';
              overlay.style.zIndex = '2';
              overlay.style.userSelect = 'none';
              // DO NOT disable pointer events on overlays as it breaks clickability
              // overlay.style.pointerEvents = 'none';
              
              // Flag image as protected
              img.setAttribute('protected', 'true');
              
              // Try to replace with canvas if possible (for advanced protection)
              if (img.complete && img.naturalWidth > 0) {
                try {
                  // Create a canvas element
                  const canvas = document.createElement('canvas');
                  canvas.width = img.naturalWidth;
                  canvas.height = img.naturalHeight;
                  canvas.style.width = '100%';
                  canvas.style.height = 'auto';
                  
                  // Draw the image on canvas
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
                    
                    // Replace image with canvas
                    const parent = img.parentNode;
                    if (parent) {
                      wrapper.appendChild(canvas);
                      wrapper.appendChild(overlay);
                      parent.replaceChild(wrapper, img);
                    }
                  }
                } catch (error) {
                  console.error("Error applying canvas protection:", error);
                }
              }
            }
          });
        }, 1000);

        return () => clearInterval(interval);
      };

      // Execute all protection methods
      preventScreenshots();
      preventSavingImages();
      disableImageDragging();
      addProtectionCSS();
      // Only apply canvas protection on specific reader pages to avoid breaking general site navigation
      const isReaderPage = window.location.pathname.startsWith('/read/');
      const cleanup = isReaderPage ? applyCanvasProtection() : () => {};

      return () => {
        cleanup();
        // Additional cleanup if needed
      };
    }
  }, [securitySettings.chapterProtection]);

  return <>{children}</>;
};

export default ChapterImageProtector;
