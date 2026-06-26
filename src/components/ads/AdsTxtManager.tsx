'use client';

import { useEffect } from 'react';
import { useAds } from '@/contexts/AdContext';

/**
 * This component doesn't render anything but manages creating/updating
 * ads.txt file in public directory when admin updates the content in Firebase
 */
export default function AdsTxtManager() {
  const { adConfig } = useAds();

  useEffect(() => {
    // This is a client-side component, but the functionality to
    // write files to the public directory would require server-side code
    // So this is left as a placeholder for a future server action
    // or API endpoint that would handle writing to the ads.txt file
    
    // Alternatively, the ads.txt file is served through the API route
    // we created at src/app/ads.txt/route.ts
    
    console.log('AdsTxt content:', adConfig?.adsTxt);
  }, [adConfig?.adsTxt]);

  // This component doesn't render anything
  return null;
} 