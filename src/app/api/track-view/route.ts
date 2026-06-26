import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, increment, serverTimestamp } from 'firebase/firestore';

// View tracking writes directly to Firestore (manga_views / chapter_views).

export async function POST(request: Request) {
  try {
    // Track unique requests by generating a request ID
    const requestId = Math.random().toString(36).substring(2, 15);
    console.log(`[${requestId}] 📊 Track view request received`);
    
    const data = await request.json();
    const { viewType, mangaId, mangaTitle, coverImage, chapterId, chapterTitle } = data;
    
    console.log(`[${requestId}] Data received:`, { 
      viewType, 
      mangaId, 
      ...(viewType === 'chapter' ? { chapterId } : {}) 
    });
    
    if (!mangaId || !mangaTitle) {
      console.log(`[${requestId}] Missing required fields`);
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    if (viewType === 'chapter' && (!chapterId || !chapterTitle)) {
      console.log(`[${requestId}] Missing chapter fields`);
      return NextResponse.json(
        { error: 'Missing chapter fields' },
        { status: 400 }
      );
    }
    
    // Track views in Firebase - with error handling
    try {
      // For server-side tracking, we'll just log the event without blocking the response
      // This ensures user experience isn't affected by tracking issues
      let trackingPromise: Promise<void> = Promise.resolve(); // Default to resolved promise
      
      if (viewType === 'details') {
        trackingPromise = trackMangaView(mangaId, mangaTitle, coverImage, requestId);
      } else if (viewType === 'chapter') {
        trackingPromise = trackChapterView(mangaId, mangaTitle, coverImage, chapterId, chapterTitle, requestId);
      }
      
      // Fire and forget - don't wait for the tracking to complete
      // This prevents the API from failing if Firebase has permission issues
      trackingPromise
        .then(() => {
          console.log(`[${requestId}] ✅ Successfully tracked ${viewType} view for: ${mangaId}`);
        })
        .catch(error => {
          console.error(`[${requestId}] ❌ Error tracking ${viewType} view, but continuing: ${error.message}`, error);
          
          // Log additional Firebase-specific error details if available
          if (error.code) {
            console.error(`[${requestId}] Firebase error code: ${error.code}`);
          }
        });
      
      // Return success regardless of tracking outcome
      return NextResponse.json({ 
        success: true, 
        message: `${viewType} view tracking initiated` 
      });
    } catch (trackError: any) {
      // This catch block handles synchronous errors in initiating the tracking
      console.error(`[${requestId}] ❌ Error initiating tracking: ${trackError.message}`, trackError);
      
      // Still return success to client - don't fail the request due to tracking issues
      return NextResponse.json({ 
        success: true,
        tracking_error: true,
        message: `Request processed but tracking encountered an error` 
      });
    }
  } catch (error: any) {
    console.error('Error handling track-view request:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Track a manga details page view
 */
async function trackMangaView(
  mangaId: string, 
  mangaTitle: string, 
  coverImage: string, 
  requestId: string
): Promise<void> {
  console.log(`[${requestId}] Attempting to track manga view: ${mangaId}`);
  
  try {
    const viewsRef = doc(db, 'manga_views', mangaId);
    
    // First check if document exists
    const viewsDoc = await getDoc(viewsRef);
    console.log(`[${requestId}] Document exists check: ${viewsDoc.exists()}`);
    
    if (viewsDoc.exists()) {
      // Update existing document
      await setDoc(viewsRef, {
        viewCount: increment(1),
        lastViewed: serverTimestamp()
      }, { merge: true });
    } else {
      // Create a new document
      await setDoc(viewsRef, {
        mangaId,
        title: mangaTitle,
        cover: coverImage || '',
        viewCount: 1,
        lastViewed: serverTimestamp(),
        firstViewed: serverTimestamp()
      });
    }
    
    console.log(`[${requestId}] Successfully tracked manga view: ${mangaId}`);
  } catch (error: any) {
    console.error(`[${requestId}] Error in trackMangaView: ${error.message}`, error);
    
    // Don't throw the error - we want to handle it gracefully
    console.log(`[${requestId}] View tracking failed but continuing operation`);
  }
}

/**
 * Track a chapter view
 */
async function trackChapterView(
  mangaId: string, 
  mangaTitle: string, 
  coverImage: string,
  chapterId: string,
  chapterTitle: string,
  requestId: string
): Promise<void> {
  console.log(`[${requestId}] Attempting to track chapter view: ${mangaId}, chapter: ${chapterId}`);
  
  try {
    // Only track chapter views, not manga views when reading a chapter
    const chapterViewsRef = doc(db, 'chapter_views', `${mangaId}_${chapterId}`);
    
    // Check if document exists
    const chapterViewsDoc = await getDoc(chapterViewsRef);
    console.log(`[${requestId}] Chapter document exists check: ${chapterViewsDoc.exists()}`);
    
    if (chapterViewsDoc.exists()) {
      // Update existing document
      await setDoc(chapterViewsRef, {
        viewCount: increment(1),
        lastViewed: serverTimestamp()
      }, { merge: true });
    } else {
      // Create a new document
      await setDoc(chapterViewsRef, {
        mangaId,
        mangaTitle,
        chapterId,
        chapterTitle,
        viewCount: 1,
        lastViewed: serverTimestamp(),
        firstViewed: serverTimestamp()
      });
    }
    
    console.log(`[${requestId}] Successfully tracked chapter view: ${mangaId}, chapter: ${chapterId}`);
  } catch (error: any) {
    console.error(`[${requestId}] Error in trackChapterView: ${error.message}`, error);
    
    // Don't throw the error - we want to handle it gracefully
    console.log(`[${requestId}] Chapter view tracking failed but continuing operation`);
  }
} 