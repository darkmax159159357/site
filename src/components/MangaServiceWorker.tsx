"use client";

import { useEffect } from 'react';

const MangaServiceWorker = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator && window.location.pathname.includes('/read/')) {
      // Only register the service worker if we're in the manga reader
      const registerMangaWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/manga-worker.js', {
            scope: '/read/'
          });
          
          console.log('Manga service worker registered successfully:', registration.scope);
          
          // Clean old caches periodically
          setInterval(() => {
            if (registration.active) {
              registration.active.postMessage({ type: 'CLEAN_OLD_CACHES' });
            }
          }, 60 * 60 * 1000); // Once per hour
          
        } catch (error) {
          console.error('Manga service worker registration failed:', error);
        }
      };
      
      // Register the service worker
      registerMangaWorker();
    }
  }, []);
  
  // This component doesn't render anything
  return null;
};

export default MangaServiceWorker; 