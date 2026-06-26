"use client";

import { useEffect, useState } from 'react';
import { trackMangaView, trackChapterView } from '@/lib/firebaseViews';

interface ViewTrackerProps {
  mangaId: string;
  chapterId?: string;
  viewOnce?: boolean;
}

/**
 * A component that tracks page views for manga and chapters.
 * It can be used to automatically track views when a page is loaded.
 */
const ViewTracker: React.FC<ViewTrackerProps> = ({ 
  mangaId, 
  chapterId, 
  viewOnce = true 
}) => {
  const [hasTracked, setHasTracked] = useState(false);

  useEffect(() => {
    // Skip if already tracked and viewOnce is true
    if (viewOnce && hasTracked) return;

    const trackView = async () => {
      try {
        if (chapterId) {
          // Track chapter view (which also tracks manga view)
          await trackChapterView(mangaId, chapterId);
        } else {
          // Track only manga view
          await trackMangaView(mangaId);
        }
        setHasTracked(true);
      } catch (error) {
        console.error('Error tracking view:', error);
      }
    };

    trackView();
  }, [mangaId, chapterId, viewOnce, hasTracked]);

  // This component doesn't render anything
  return null;
};

export default ViewTracker; 