import { useEffect, useRef } from 'react'

type ViewType = 'details' | 'chapter'

interface TrackViewDetailsProps {
  mangaId: string
  mangaTitle: string
  coverImage: string
}

interface TrackViewChapterProps extends TrackViewDetailsProps {
  chapterId: string
  chapterTitle: string
}

// Create a global tracker to prevent multiple view counts in development
const viewsTracked = new Set<string>();

/**
 * Hook to track manga detail page views
 */
export function useTrackMangaView({
  mangaId,
  mangaTitle,
  coverImage,
}: TrackViewDetailsProps) {
  // Use a ref to track if this view has already been counted
  const hasTrackedRef = useRef(false);
  
  useEffect(() => {
    const trackView = async () => {
      // Create a unique key for this view
      const viewKey = `details_${mangaId}_${new Date().toDateString()}`;
      
      // Only track the view if it hasn't been tracked yet
      if (hasTrackedRef.current || viewsTracked.has(viewKey)) {
        console.log('View already tracked, skipping:', viewKey);
        return;
      }
      
      try {
        console.log('🔍 TRACKING MANGA VIEW FOR FIRST TIME:', { mangaId, mangaTitle, viewKey });
        
        // Mark as tracked immediately to prevent double tracking
        hasTrackedRef.current = true;
        viewsTracked.add(viewKey);
        
        await fetch('/api/track-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            viewType: 'details',
            mangaId,
            mangaTitle,
            coverImage,
          }),
        })
      } catch (error) {
        console.error('Failed to track manga view:', error)
      }
    }

    if (mangaId && mangaTitle && coverImage) {
      console.log('Attempting to track manga view:', mangaId);
      trackView()
    }
    
    // Clean up function - keep the ref state
    return () => {
      console.log('Cleanup for manga view:', mangaId);
    };
  }, [mangaId, mangaTitle, coverImage])
}

/**
 * Hook to track manga chapter views
 */
export function useTrackChapterView({
  mangaId,
  mangaTitle,
  coverImage,
  chapterId,
  chapterTitle,
}: TrackViewChapterProps) {
  // Use a ref to track if this view has already been counted
  const hasTrackedRef = useRef(false);
  
  useEffect(() => {
    const trackView = async () => {
      // Create a unique key for this view
      const viewKey = `chapter_${mangaId}_${chapterId}_${new Date().toDateString()}`;
      
      // Only track the view if it hasn't been tracked yet
      if (hasTrackedRef.current || viewsTracked.has(viewKey)) {
        console.log('View already tracked, skipping:', viewKey);
        return;
      }
      
      try {
        console.log('🔍 TRACKING CHAPTER VIEW FOR FIRST TIME:', { mangaId, chapterId, chapterTitle, viewKey });
        
        // Mark as tracked immediately to prevent double tracking
        hasTrackedRef.current = true;
        viewsTracked.add(viewKey);
        
        await fetch('/api/track-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            viewType: 'chapter',
            mangaId,
            mangaTitle,
            coverImage,
            chapterId,
            chapterTitle,
          }),
        })
      } catch (error) {
        console.error('Failed to track chapter view:', error)
      }
    }

    if (mangaId && mangaTitle && coverImage && chapterId && chapterTitle) {
      console.log('Attempting to track chapter view:', chapterId);
      trackView()
    }
    
    // Clean up function - keep the ref state
    return () => {
      console.log('Cleanup for chapter view:', chapterId);
    };
  }, [mangaId, mangaTitle, coverImage, chapterId, chapterTitle])
} 