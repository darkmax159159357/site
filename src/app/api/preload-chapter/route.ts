import { NextRequest, NextResponse } from 'next/server';
import { fetchRead } from '@/action/fetchKomik';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminFirestore } from '@/lib/firebase-admin';

// Helper function to check if chapter is locked
async function isChapterLocked(chapterId: string, userId?: string): Promise<boolean> {
  try {
    // Check Firebase for lock status using Admin SDK
    const chapterRef = adminFirestore.collection('locked_chapters').doc(chapterId);
    const chapterDoc = await chapterRef.get();
    
    // If chapter lock info exists in Firebase
    if (chapterDoc.exists) {
      const lockData = chapterDoc.data();
      
      if (!lockData) {
        return false; // No data, not locked
      }
      
      // Check if user has purchased this chapter
      if (userId) {
        // Get user data to check purchased chapters
        const userRef = adminFirestore.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
          const userData = userDoc.data();
          
          // If user has purchased this chapter, allow access
          if (userData?.purchasedChapters?.includes(chapterId)) {
            return false; // Not locked for this user
          }
        }
      }
      
      // If time-based unlocking is used
      if (lockData.unlocksAt) {
        const unlockTime = lockData.unlocksAt instanceof Date
          ? lockData.unlocksAt
          : lockData.unlocksAt.toDate?.()
            ? lockData.unlocksAt.toDate()
            : new Date(lockData.unlocksAt);
        
        const now = new Date();
        // Chapter should be unlocked if time has passed
        return now < unlockTime;
      }
      
      // Otherwise use the isLocked flag from database
      return !!lockData.isLocked;
    }
    
    // No lock data found, chapter is not locked
    return false;
  } catch (error) {
    console.error("[API] Error checking lock status:", error);
    // Default to locked in case of errors for security
    return true;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const chapterId = searchParams.get('id');
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!chapterId) {
    return NextResponse.json({ error: 'Missing chapter ID' }, { status: 400 });
  }

  try {
    // Check if chapter is locked before fetching it
    const isLocked = await isChapterLocked(chapterId, userId);
    
    if (isLocked) {
      console.log(`[API] Blocked preload attempt for locked chapter: ${chapterId}`);
      return NextResponse.json({ 
        error: 'Chapter is locked', 
        isLocked: true 
      }, { status: 403 });
    }

    // Chapter is not locked, proceed with fetching data
    const chapterData = await fetchRead(chapterId);
    
    if (!chapterData || !chapterData.pages || chapterData.pages.length === 0) {
      return NextResponse.json({ error: 'Chapter not found or has no pages' }, { status: 404 });
    }

    // Return just the first page URL for preloading
    return NextResponse.json({ 
      success: true, 
      firstPage: chapterData.pages[0],
      chapterId
    });
  } catch (error) {
    console.error('Error preloading chapter:', error);
    return NextResponse.json({ error: 'Failed to preload chapter' }, { status: 500 });
  }
} 