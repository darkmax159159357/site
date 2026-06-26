'use client';

import { useEffect, useRef, useState } from 'react';

// Add type definition for ad network globals
declare global {
  interface Window {
    adsbygoogle: any[];
    adsbyjuicy: any[];
  }
}

interface AdSlotProps {
  adCode: string;
  className?: string;
  id?: string;
}

/**
 * AdSlot component for displaying ads using a sandboxed iframe approach
 * This isolates the ad code from the main application
 */
export default function AdSlot({ adCode, className = '', id }: AdSlotProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only attempt to render ad code if it exists and not dismissed
    if (!adCode || !iframeRef.current || dismissed) return;

    try {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (!iframeDoc) return;
      
      // Create a complete HTML document
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { margin: 0; padding: 0; overflow: hidden; }
              .ad-container { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
            </style>
          </head>
          <body>
            <div class="ad-container">${adCode}</div>
          </body>
        </html>
      `;
      
      // Write the content to the iframe
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();
      
      // Adjust iframe height to content (optional)
      const resizeObserver = new ResizeObserver(() => {
        if (iframe && iframeDoc && iframeDoc.body) {
          const height = iframeDoc.body.scrollHeight;
          iframe.style.height = `${height}px`;
        }
      });
      
      if (iframeDoc.body) {
        resizeObserver.observe(iframeDoc.body);
      }
      
      return () => {
        resizeObserver.disconnect();
      };
    } catch (error) {
      console.error('Error rendering ad in iframe:', error);
    }
  }, [adCode, dismissed]);

  // Handle ad dismissal
  const handleClose = () => {
    setDismissed(true);
  };

  // Don't render anything if there's no ad code or if dismissed
  if (!adCode || dismissed) return null;

  return (
    <div className="relative ad-wrapper">
      {/* Close button - improved styling */}
      <button 
        onClick={handleClose}
        className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center z-50 hover:bg-red-700 shadow-md border border-white cursor-pointer"
        style={{ fontSize: '18px', fontWeight: 'bold', lineHeight: '1' }}
        aria-label="Close advertisement"
      >
        ×
      </button>
      
      <iframe
        ref={iframeRef}
        className={`ad-iframe ${className}`}
        id={id}
        data-ad-slot="true"
        frameBorder="0"
        scrolling="no"
        width="100%"
        style={{ border: 'none', overflow: 'hidden', minHeight: '100px' }}
        title="Advertisement"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
    </div>
  );
} 